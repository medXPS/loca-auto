import { Router } from "express";
import { and, desc, eq, ilike, lt, or, sql } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { logAudit } from "../lib/audit";
import { createNotification } from "../lib/notify";
import { sendReceiptEmail } from "../lib/mailer";
import { buildReceiptHtml, buildReceiptPdf } from "../lib/receipt-pdf";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import {
  addReturnBuffer,
  combineDateAndHour,
  createTemporaryHold,
  expireStaleAvailabilityLocks,
  getPaymentDeadlineHours,
  getRequestAvailabilityEndAt,
  getRequestStartAt,
  hasActiveAvailabilityOverlap,
  markRequestCallConfirmed,
  markRequestPendingCallConfirmation,
  markRequestReserved,
  releaseRequestAvailabilityBlocks,
} from "../lib/availability";

const router = Router();

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  DOCUMENT_SUBMISSION_WINDOW: "Documents requis",
  PENDING_CALL_CONFIRMATION: "Documents recus",
  EXTENDED_PAYMENT_DEADLINE: "Delai prolonge",
  PAID: "Payee",
  ACTIVE_RENTAL: "En cours de location",
  UNDER_REVIEW: "En attente",
  CALL_ATTEMPTED: "En attente",
  CALL_CONFIRMED: "Appel confirmé",
  WAITING_AGENCY_PAYMENT: "Appel confirmé",
  RESERVED: "Réservé",
  REJECTED: "Refusé",
  WAITING_DOCUMENTS: "En attente",
  CAR_DELIVERED: "En cours de location",
  RENTED: "En cours de location",
  CAR_RETURNED: "Retourné",
  RETURNED: "Retourné",
  CANCELLED: "Annulé",
  ABANDONED: "Abandonné",
  COMPLETED: "Retourné",
};

async function fetchRequestWithCar(id: number) {
  const [req] = await db
    .select()
    .from(schema.rentalRequestsTable)
    .where(eq(schema.rentalRequestsTable.id, id))
    .limit(1);
  if (!req) return null;
  const [car] = await db
    .select()
    .from(schema.carsTable)
    .where(eq(schema.carsTable.id, req.carId))
    .limit(1);
  return {
    ...req,
    statusLabel: STATUS_LABELS[req.status] ?? req.status,
    estimatedTotalPrice: Number(req.estimatedTotalPrice),
    finalPrice: req.finalPrice ? Number(req.finalPrice) : null,
    car: car
      ? {
          ...car,
          dailyPrice: Number(car.dailyPrice),
          weeklyPrice: car.weeklyPrice ? Number(car.weeklyPrice) : null,
          monthlyPrice: car.monthlyPrice ? Number(car.monthlyPrice) : null,
        }
      : null,
  };
}

function normalizeAmount(amount: unknown) {
  if (amount === undefined || amount === null || amount === "") return null;
  const numeric = Number(amount);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveRentalTimes(body: any) {
  const startDate = String(body.startDate ?? "");
  const returnDate = String(body.returnDate ?? "");
  const startAt = body.startAt
    ? new Date(body.startAt)
    : combineDateAndHour(startDate, body.startHour ?? "09:00");
  const returnAt = body.returnAt
    ? new Date(body.returnAt)
    : combineDateAndHour(returnDate, body.returnHour ?? "18:00");
  return { startDate, returnDate, startAt, returnAt };
}

function formatMoney(amount: number) {
  return `${new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} MAD`;
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatPaymentMethod(method?: string | null) {
  switch (method) {
    case "CARD_AT_AGENCY":
      return "Carte à l'agence";
    case "BANK_TRANSFER":
      return "Virement bancaire";
    case "CASH_AT_AGENCY":
    default:
      return "Espèces à l'agence";
  }
}

function calculateBreakdown(totalPaid: number, insuranceIncluded: boolean) {
  const taxes = Math.round(totalPaid * 0.1 * 100) / 100;
  const assurance = insuranceIncluded
    ? 0
    : Math.round(totalPaid * 0.05 * 100) / 100;
  const repairs = 0;
  const subtotal =
    Math.round((totalPaid - taxes - assurance - repairs) * 100) / 100;

  return {
    subtotal,
    taxes,
    assurance,
    repairs,
    totalPaid: Math.round(totalPaid * 100) / 100,
  };
}

function formatDateOnly(value: string | Date) {
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTimeWithSeconds(value: string | Date) {
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function buildReceiptNumber(requestId: number) {
  return `RCPF-${String(requestId).padStart(6, "0")}`;
}

async function fetchImageBuffer(
  source: string | null | undefined,
  baseUrl: string,
) {
  if (!source) return null;

  const resolvedSource = source.startsWith("data:")
    ? source
    : /^https?:\/\//i.test(source)
      ? source
      : source.startsWith("/")
        ? new URL(source, baseUrl).toString()
        : null;

  if (!resolvedSource) return null;

  try {
    if (resolvedSource.startsWith("data:")) {
      const match = resolvedSource.match(/^data:.*?;base64,(.*)$/i);
      if (!match?.[1]) return null;
      return Buffer.from(match[1], "base64");
    }

    const response = await fetch(resolvedSource);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function buildReceiptPdfLegacy(args: {
  settings: any;
  request: Awaited<ReturnType<typeof fetchRequestWithCar>> & { car: any };
  receiptNumber: string;
  verificationUrl: string;
  baseUrl: string;
}) {
  const { settings, request, receiptNumber, verificationUrl, baseUrl } = args;
  const companyName = settings.brandName || "Location Auto Maroc";
  const companyCity = settings.city || "Casablanca";
  const companyAddress = settings.address || `${companyCity}, Maroc`;
  const companyPhone = settings.phone || "+212600000000";
  const requestCar = request.car ?? {};
  const paidAt = request.paidAtAgencyAt
    ? new Date(request.paidAtAgencyAt)
    : new Date();
  const paidAmount = Number(
    request.finalPrice || request.estimatedTotalPrice || 0,
  );
  const breakdown = calculateBreakdown(
    paidAmount,
    Boolean(requestCar.insuranceIncluded),
  );
  const days = Math.max(
    1,
    Math.floor(
      (new Date(`${request.returnDate}T00:00:00`).getTime() -
        new Date(`${request.startDate}T00:00:00`).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1,
  );

  const [qrBuffer, carBuffer, logoBuffer] = await Promise.all([
    QRCode.toBuffer(verificationUrl, { margin: 1, width: 180 }),
    fetchImageBuffer(requestCar.mainImageUrl, baseUrl),
    fetchImageBuffer(settings.logoUrl, baseUrl),
  ]);

  const doc = new PDFDocument({
    size: "A4",
    margin: 24,
    bufferPages: true,
    info: {
      Title: `Reçu ${receiptNumber}`,
      Author: companyName,
      Subject: "Reçu de paiement",
    },
  });

  const chunks: Buffer[] = [];
  const pdfDone = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    );
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const colors = {
    navy: "#163A72",
    navyDeep: "#0F2D63",
    blue: "#1F56B4",
    blueSoft: "#EAF1FF",
    border: "#D7DFEA",
    text: "#10213D",
    muted: "#65748B",
    success: "#0EA765",
    successSoft: "#E9F9F1",
    danger: "#E84A43",
    dangerSoft: "#FDEDEC",
    white: "#FFFFFF",
    soft: "#F8FBFF",
  } as const;

  const pageLeft = doc.page.margins.left;
  const pageTop = doc.page.margins.top;
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageRight = pageLeft + pageWidth;
  const receiptBoxX = pageRight - 220;
  const receiptBoxY = pageTop + 2;
  const receiptBoxW = 220;
  const receiptBoxH = 88;
  const brandUpper = companyName.toUpperCase();
  const brandPieces = brandUpper.split(/\s+/).filter(Boolean);
  const brandLine1 = brandPieces[0] || "LOCATION";
  const brandLine2 = brandPieces.slice(1).join(" ") || "AUTO MAROC";
  const contactLineY = pageTop + 146;
  const cardsTop = pageTop + 176;
  const locationTop = cardsTop + 120;
  const locationCardHeight = 136;
  const paymentCardHeight = 176;
  const verificationCardHeight = 118;
  const paymentTop = locationTop + locationCardHeight + 12;
  const verificationTop = paymentTop + paymentCardHeight + 12;
  const footerTop = verificationTop + verificationCardHeight + 12;

  const drawGlyph = (
    kind: string,
    x: number,
    y: number,
    size: number,
    color: string,
  ) => {
    const s = size;
    doc.save();
    doc.lineWidth(Math.max(1.1, s * 0.075));
    doc.strokeColor(color);
    doc.fillColor(color);

    switch (kind) {
      case "car":
        doc
          .roundedRect(x + s * 0.18, y + s * 0.44, s * 0.64, s * 0.22, s * 0.06)
          .stroke();
        doc
          .moveTo(x + s * 0.28, y + s * 0.44)
          .lineTo(x + s * 0.39, y + s * 0.27)
          .lineTo(x + s * 0.61, y + s * 0.27)
          .lineTo(x + s * 0.72, y + s * 0.44)
          .stroke();
        doc.circle(x + s * 0.32, y + s * 0.74, s * 0.08).stroke();
        doc.circle(x + s * 0.68, y + s * 0.74, s * 0.08).stroke();
        break;
      case "receipt":
        doc
          .roundedRect(x + s * 0.23, y + s * 0.15, s * 0.54, s * 0.7, s * 0.08)
          .stroke();
        doc
          .moveTo(x + s * 0.35, y + s * 0.15)
          .lineTo(x + s * 0.35, y + s * 0.23)
          .stroke();
        doc
          .moveTo(x + s * 0.5, y + s * 0.15)
          .lineTo(x + s * 0.5, y + s * 0.23)
          .stroke();
        doc
          .moveTo(x + s * 0.35, y + s * 0.39)
          .lineTo(x + s * 0.63, y + s * 0.39)
          .stroke();
        doc
          .moveTo(x + s * 0.35, y + s * 0.53)
          .lineTo(x + s * 0.58, y + s * 0.53)
          .stroke();
        break;
      case "building":
        doc
          .roundedRect(x + s * 0.24, y + s * 0.16, s * 0.52, s * 0.7, s * 0.06)
          .stroke();
        for (let row = 0; row < 2; row += 1) {
          for (let col = 0; col < 2; col += 1) {
            const wx = x + s * (0.33 + col * 0.14);
            const wy = y + s * (0.3 + row * 0.16);
            doc.roundedRect(wx, wy, s * 0.07, s * 0.07, s * 0.02).fill(color);
          }
        }
        doc
          .moveTo(x + s * 0.5, y + s * 0.16)
          .lineTo(x + s * 0.5, y + s * 0.86)
          .stroke();
        break;
      case "user":
        doc.circle(x + s * 0.5, y + s * 0.32, s * 0.14).stroke();
        doc
          .roundedRect(x + s * 0.28, y + s * 0.56, s * 0.44, s * 0.2, s * 0.1)
          .stroke();
        break;
      case "calendar":
        doc
          .roundedRect(x + s * 0.16, y + s * 0.24, s * 0.68, s * 0.56, s * 0.08)
          .stroke();
        doc
          .moveTo(x + s * 0.28, y + s * 0.16)
          .lineTo(x + s * 0.28, y + s * 0.34)
          .stroke();
        doc
          .moveTo(x + s * 0.72, y + s * 0.16)
          .lineTo(x + s * 0.72, y + s * 0.34)
          .stroke();
        doc
          .moveTo(x + s * 0.16, y + s * 0.4)
          .lineTo(x + s * 0.84, y + s * 0.4)
          .stroke();
        break;
      case "clock":
        doc.circle(x + s * 0.5, y + s * 0.5, s * 0.3).stroke();
        doc
          .moveTo(x + s * 0.5, y + s * 0.5)
          .lineTo(x + s * 0.5, y + s * 0.32)
          .stroke();
        doc
          .moveTo(x + s * 0.5, y + s * 0.5)
          .lineTo(x + s * 0.64, y + s * 0.58)
          .stroke();
        break;
      case "wallet":
        doc
          .roundedRect(x + s * 0.18, y + s * 0.3, s * 0.64, s * 0.42, s * 0.08)
          .stroke();
        doc
          .roundedRect(x + s * 0.57, y + s * 0.38, s * 0.17, s * 0.12, s * 0.03)
          .stroke();
        doc.circle(x + s * 0.66, y + s * 0.44, s * 0.02).fill(color);
        break;
      case "pin":
        doc.circle(x + s * 0.5, y + s * 0.39, s * 0.15).stroke();
        doc
          .moveTo(x + s * 0.5, y + s * 0.9)
          .lineTo(x + s * 0.34, y + s * 0.56)
          .lineTo(x + s * 0.66, y + s * 0.56)
          .closePath()
          .stroke();
        break;
      case "phone":
        doc.save();
        doc.translate(x + s * 0.34, y + s * 0.34);
        doc.rotate(-38);
        doc
          .roundedRect(-s * 0.05, -s * 0.18, s * 0.1, s * 0.36, s * 0.04)
          .stroke();
        doc.restore();
        doc.save();
        doc.translate(x + s * 0.66, y + s * 0.66);
        doc.rotate(-38);
        doc
          .roundedRect(-s * 0.05, -s * 0.18, s * 0.1, s * 0.36, s * 0.04)
          .stroke();
        doc.restore();
        doc
          .moveTo(x + s * 0.38, y + s * 0.62)
          .lineTo(x + s * 0.59, y + s * 0.41)
          .stroke();
        break;
      case "shield":
        doc
          .moveTo(x + s * 0.5, y + s * 0.16)
          .lineTo(x + s * 0.77, y + s * 0.25)
          .lineTo(x + s * 0.69, y + s * 0.68)
          .lineTo(x + s * 0.5, y + s * 0.86)
          .lineTo(x + s * 0.31, y + s * 0.68)
          .lineTo(x + s * 0.23, y + s * 0.25)
          .closePath()
          .stroke();
        doc
          .moveTo(x + s * 0.4, y + s * 0.48)
          .lineTo(x + s * 0.48, y + s * 0.58)
          .stroke();
        doc
          .moveTo(x + s * 0.48, y + s * 0.58)
          .lineTo(x + s * 0.62, y + s * 0.38)
          .stroke();
        break;
      case "check":
        doc.circle(x + s * 0.5, y + s * 0.5, s * 0.28).stroke();
        doc
          .moveTo(x + s * 0.38, y + s * 0.51)
          .lineTo(x + s * 0.46, y + s * 0.6)
          .lineTo(x + s * 0.63, y + s * 0.4)
          .stroke();
        break;
      default:
        doc.circle(x + s * 0.5, y + s * 0.5, s * 0.25).stroke();
        break;
    }

    doc.restore();
  };

  const drawCard = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill = colors.white,
  ) => {
    doc
      .roundedRect(x, y, w, h, 14)
      .lineWidth(1)
      .fillAndStroke(fill, colors.border);
  };

  const drawSectionHeader = (
    x: number,
    y: number,
    title: string,
    icon: string,
  ) => {
    doc.circle(x + 15, y + 15, 15).fill(colors.navyDeep);
    drawGlyph(icon, x + 5, y + 5, 20, colors.white);
    doc
      .fillColor(colors.navyDeep)
      .font("Helvetica-Bold")
      .fontSize(11.5)
      .text(title.toUpperCase(), x + 40, y + 10, {
        width: 250,
        characterSpacing: 0.6,
      });
  };

  const drawKeyValue = (
    x: number,
    y: number,
    label: string,
    value: string,
    icon: string,
    widthValue: number,
  ) => {
    drawGlyph(icon, x, y + 2, 14, colors.navyDeep);
    doc
      .fillColor(colors.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(label, x + 20, y, { width: 74 });
    doc
      .fillColor(colors.text)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(value || "—", x + 96, y, {
        width: widthValue - 96,
      });
  };

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.white);

  doc.save();
  doc.rect(0, 0, doc.page.width, 10).fill(colors.navyDeep);
  doc.rect(pageLeft, pageTop - 4, pageWidth, 2).fill(colors.blue);
  doc.restore();

  if (logoBuffer) {
    doc.image(logoBuffer, pageLeft, pageTop + 4, {
      fit: [44, 44],
      align: "center",
      valign: "center",
    });
  } else {
    drawGlyph("car", pageLeft - 1, pageTop + 3, 46, colors.navyDeep);
  }

  doc
    .fillColor(colors.navyDeep)
    .font("Helvetica-Bold")
    .fontSize(19)
    .text(brandLine1, pageLeft + 56, pageTop + 1, {
      width: 188,
      characterSpacing: 0.8,
    });
  doc.fontSize(15).text(brandLine2, pageLeft + 56, pageTop + 23, {
    width: 188,
    characterSpacing: 0.8,
  });

  doc
    .roundedRect(receiptBoxX, receiptBoxY, receiptBoxW, receiptBoxH, 16)
    .fillAndStroke(colors.white, colors.border);
  drawGlyph("receipt", receiptBoxX + 12, receiptBoxY + 14, 24, colors.navyDeep);
  doc
    .fillColor(colors.muted)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("N° REÇU", receiptBoxX + 48, receiptBoxY + 16, {
      width: 130,
      characterSpacing: 0.8,
    });
  doc
    .fillColor(colors.blue)
    .font("Helvetica-Bold")
    .fontSize(17)
    .text(receiptNumber, receiptBoxX + 48, receiptBoxY + 33, {
      width: 152,
    });
  doc
    .fillColor(colors.muted)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("DATE", receiptBoxX + 48, receiptBoxY + 58, {
      width: 120,
      characterSpacing: 0.8,
    });
  doc
    .fillColor(colors.text)
    .font("Helvetica")
    .fontSize(11)
    .text(formatDateOnly(paidAt), receiptBoxX + 48, receiptBoxY + 73, {
      width: 120,
    });

  doc
    .fillColor(colors.navyDeep)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text("REÇU DE PAIEMENT", pageLeft, pageTop + 64, {
      width: 300,
      lineGap: 2,
    });
  doc
    .fillColor(colors.blue)
    .font("Helvetica")
    .fontSize(13)
    .text("Document archivable et imprimable", pageLeft, pageTop + 104, {
      width: 300,
    });
  doc
    .fillColor(colors.text)
    .font("Helvetica")
    .fontSize(10.5)
    .text(
      "Ce document valide le paiement effectué à l'agence et peut être archivé dans le dossier client.",
      pageLeft,
      pageTop + 124,
      { width: 298, lineGap: 3 },
    );

  const carImageWidth = 176;
  const carImageHeight = 62;
  const carImageX = pageRight - carImageWidth;
  const carImageY = pageTop + 92;
  doc.save();
  doc
    .fillOpacity(0.1)
    .ellipse(
      carImageX + carImageWidth / 2,
      carImageY + carImageHeight + 5,
      carImageWidth * 0.34,
      6,
    )
    .fill("#000000");
  doc.restore();
  if (carBuffer) {
    doc.save();
    doc
      .roundedRect(carImageX, carImageY, carImageWidth, carImageHeight, 10)
      .clip();
    doc.image(carBuffer, carImageX, carImageY, {
      cover: [carImageWidth, carImageHeight],
      align: "center",
      valign: "center",
    });
    doc.restore();
  } else {
    doc
      .roundedRect(carImageX, carImageY, carImageWidth, carImageHeight, 10)
      .fillAndStroke(colors.white, colors.border);
    drawGlyph("car", carImageX + 59, carImageY + 7, 58, colors.navyDeep);
  }

  doc
    .moveTo(pageLeft, contactLineY)
    .lineTo(pageRight, contactLineY)
    .strokeColor(colors.border)
    .lineWidth(1)
    .stroke();
  drawGlyph("pin", pageLeft, contactLineY + 10, 16, colors.navyDeep);
  doc
    .fillColor(colors.text)
    .font("Helvetica")
    .fontSize(10.2)
    .text(`${companyCity}, Maroc`, pageLeft + 20, contactLineY + 8, {
      width: 170,
    });
  drawGlyph("phone", pageLeft + 172, contactLineY + 10, 16, colors.navyDeep);
  doc
    .fillColor(colors.text)
    .font("Helvetica")
    .fontSize(10.2)
    .text(companyPhone, pageLeft + 192, contactLineY + 8, {
      width: 130,
    });

  const cardGap = 16;
  const halfWidth = (pageWidth - cardGap) / 2;
  const leftCardY = cardsTop;
  const cardHeight = 112;
  drawCard(pageLeft, leftCardY, halfWidth, cardHeight, colors.white);
  drawCard(
    pageLeft + halfWidth + cardGap,
    leftCardY,
    halfWidth,
    cardHeight,
    colors.white,
  );
  drawSectionHeader(pageLeft + 18, leftCardY + 12, "Agence", "building");
  drawSectionHeader(
    pageLeft + halfWidth + cardGap + 18,
    leftCardY + 12,
    "Client",
    "user",
  );

  drawKeyValue(
    pageLeft + 20,
    leftCardY + 54,
    "Nom",
    companyName,
    "building",
    halfWidth - 32,
  );
  drawKeyValue(
    pageLeft + 20,
    leftCardY + 76,
    "Téléphone",
    companyPhone,
    "phone",
    halfWidth - 32,
  );
  drawKeyValue(
    pageLeft + 20,
    leftCardY + 98,
    "Adresse",
    companyAddress,
    "pin",
    halfWidth - 32,
  );

  const clientX = pageLeft + halfWidth + cardGap + 20;
  drawKeyValue(
    clientX,
    leftCardY + 54,
    "Nom complet",
    request.fullName,
    "user",
    halfWidth - 32,
  );
  drawKeyValue(
    clientX,
    leftCardY + 76,
    "CIN",
    request.cinOrPassport || "—",
    "receipt",
    halfWidth - 32,
  );
  drawKeyValue(
    clientX,
    leftCardY + 98,
    "Téléphone",
    request.phone || "—",
    "phone",
    halfWidth - 32,
  );

  drawCard(pageLeft, locationTop, pageWidth, locationCardHeight, colors.white);
  drawSectionHeader(
    pageLeft + 18,
    locationTop + 12,
    "Détails de la location",
    "calendar",
  );

  const gridX = pageLeft + 18;
  const gridY = locationTop + 52;
  const gridWidth = pageWidth - 36;
  const columnWidth = gridWidth / 3;
  const rowHeight = 41;

  doc
    .moveTo(gridX + columnWidth, gridY)
    .lineTo(gridX + columnWidth, gridY + rowHeight * 2)
    .strokeColor(colors.border)
    .stroke();
  doc
    .moveTo(gridX + columnWidth * 2, gridY)
    .lineTo(gridX + columnWidth * 2, gridY + rowHeight * 2)
    .strokeColor(colors.border)
    .stroke();
  doc
    .moveTo(gridX, gridY + rowHeight)
    .lineTo(gridX + gridWidth, gridY + rowHeight)
    .strokeColor(colors.border)
    .stroke();

  const detailCells = [
    { label: "Réservation", value: `#${request.id}`, icon: "calendar" },
    {
      label: "Véhicule",
      value: requestCar
        ? `${requestCar.brand ?? ""} ${requestCar.model ?? ""}`.trim() ||
          `Véhicule #${request.carId}`
        : `Véhicule #${request.carId}`,
      icon: "car",
    },
    {
      label: "Départ",
      value: formatDateOnly(request.startDate),
      icon: "calendar",
    },
    {
      label: "Retour",
      value: formatDateOnly(request.returnDate),
      icon: "calendar",
    },
    { label: "Durée", value: `${days} jour(s)`, icon: "clock" },
    { label: "Agence", value: companyCity, icon: "building" },
  ];

  detailCells.forEach((cell, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const cellX = gridX + columnWidth * col;
    const cellY = gridY + rowHeight * row;
    drawGlyph(cell.icon, cellX + 10, cellY + 8, 16, colors.navyDeep);
    doc
      .fillColor(colors.muted)
      .font("Helvetica-Bold")
      .fontSize(7.6)
      .text(cell.label.toUpperCase(), cellX + 32, cellY + 7, {
        width: columnWidth - 44,
        characterSpacing: 0.7,
      });
    doc
      .fillColor(colors.text)
      .font("Helvetica-Bold")
      .fontSize(10.2)
      .text(cell.value, cellX + 32, cellY + 19, {
        width: columnWidth - 44,
      });
  });

  drawCard(pageLeft, paymentTop, pageWidth, paymentCardHeight, colors.white);
  drawSectionHeader(
    pageLeft + 18,
    paymentTop + 12,
    "Détails de paiement",
    "wallet",
  );

  const tableX = pageLeft + 18;
  const tableY = paymentTop + 48;
  const tableWidth = pageWidth - 36;
  const rowLeftWidth = tableWidth - 90;
  const regularRowHeight = 13;
  const totalRowHeight = 24;
  const paymentRows = [
    [
      "Prix journalier",
      formatMoney(Number(requestCar.dailyPrice || paidAmount || 0)),
    ],
    ["Sous-total", formatMoney(breakdown.subtotal)],
    ["Taxes", formatMoney(breakdown.taxes)],
    ["Assurance", formatMoney(breakdown.assurance)],
    ["Réparations éventuelles", formatMoney(breakdown.repairs)],
  ];

  let cursorY = tableY;
  paymentRows.forEach((row) => {
    doc
      .moveTo(tableX, cursorY + regularRowHeight)
      .lineTo(tableX + tableWidth, cursorY + regularRowHeight)
      .strokeColor(colors.border)
      .stroke();
    doc
      .fillColor(colors.muted)
      .font("Helvetica")
      .fontSize(8.1)
      .text(row[0], tableX, cursorY + 1, { width: rowLeftWidth });
    doc
      .fillColor(colors.text)
      .font("Helvetica")
      .fontSize(8.1)
      .text(row[1], tableX + rowLeftWidth, cursorY + 1, {
        width: 90,
        align: "right",
      });
    cursorY += regularRowHeight;
  });

  doc
    .roundedRect(tableX, cursorY + 2, tableWidth, totalRowHeight, 10)
    .fill(colors.navyDeep);
  doc
    .fillColor(colors.white)
    .font("Helvetica-Bold")
    .fontSize(9.3)
    .text("MONTANT TOTAL PAYÉ", tableX + 12, cursorY + 8, {
      width: rowLeftWidth - 8,
      characterSpacing: 0.7,
    });
  doc
    .fillColor(colors.white)
    .font("Helvetica-Bold")
    .fontSize(9.8)
    .text(
      formatMoney(breakdown.totalPaid),
      tableX + rowLeftWidth,
      cursorY + 7,
      {
        width: 90,
        align: "right",
      },
    );
  cursorY += totalRowHeight + 7;
  doc
    .fillColor(colors.muted)
    .font("Helvetica")
    .fontSize(8.5)
    .text("Date de paiement", tableX, cursorY, { width: rowLeftWidth });
  doc
    .fillColor(colors.text)
    .font("Helvetica")
    .fontSize(8.5)
    .text(formatDateTimeWithSeconds(paidAt), tableX + rowLeftWidth, cursorY, {
      width: 90,
      align: "right",
    });
  cursorY += 12;
  doc
    .fillColor(colors.muted)
    .font("Helvetica")
    .fontSize(8.5)
    .text("Mode de paiement", tableX, cursorY, { width: rowLeftWidth });
  doc
    .fillColor(colors.text)
    .font("Helvetica")
    .fontSize(8.5)
    .text(
      formatPaymentMethod(request.paymentMethod),
      tableX + rowLeftWidth,
      cursorY,
      {
        width: 90,
        align: "right",
      },
    );

  drawCard(
    pageLeft,
    verificationTop,
    pageWidth,
    verificationCardHeight,
    colors.white,
  );
  drawSectionHeader(
    pageLeft + 18,
    verificationTop + 12,
    "Vérification et signatures",
    "shield",
  );

  const leftColumnX = pageLeft + 20;
  const leftColumnY = verificationTop + 44;
  const qrSize = 60;
  doc.image(qrBuffer, leftColumnX, leftColumnY, {
    width: qrSize,
    height: qrSize,
  });
  doc
    .fillColor(colors.muted)
    .font("Helvetica-Bold")
    .fontSize(8.2)
    .text("QR code", leftColumnX + 76, leftColumnY + 2, {
      width: 95,
      characterSpacing: 0.6,
    });
  doc
    .fillColor(colors.text)
    .font("Helvetica")
    .fontSize(8.2)
    .text("OU", leftColumnX + 76, leftColumnY + 20, {
      width: 95,
    });
  doc
    .fillColor(colors.muted)
    .font("Helvetica")
    .fontSize(8.2)
    .text("Visitez le lien ci-dessous", leftColumnX + 76, leftColumnY + 39, {
      width: 120,
    });

  const rightStartX = pageLeft + 246;
  doc
    .moveTo(rightStartX - 18, leftColumnY - 4)
    .lineTo(rightStartX - 18, verificationTop + verificationCardHeight - 16)
    .strokeColor(colors.border)
    .stroke();
  doc
    .fillColor(colors.muted)
    .font("Helvetica-Bold")
    .fontSize(8.2)
    .text("Vérification", rightStartX, leftColumnY + 1, {
      width: 140,
      characterSpacing: 0.6,
    });
  doc
    .fillColor(colors.blue)
    .font("Helvetica-Bold")
    .fontSize(9.2)
    .text(verificationUrl, rightStartX, leftColumnY + 17, {
      width: pageWidth - (rightStartX - pageLeft) - 24,
      link: verificationUrl,
      underline: true,
    });
  doc
    .moveTo(rightStartX, leftColumnY + 36)
    .lineTo(pageRight - 24, leftColumnY + 36)
    .strokeColor(colors.border)
    .stroke();
  doc
    .fillColor(colors.muted)
    .font("Helvetica-Bold")
    .fontSize(8.2)
    .text("Signature agence", rightStartX, leftColumnY + 43, {
      width: 130,
    });
  doc
    .moveTo(rightStartX, leftColumnY + 58)
    .lineTo(rightStartX + 132, leftColumnY + 58)
    .strokeColor(colors.navyDeep)
    .stroke();
  doc.save();
  doc.strokeColor(colors.navyDeep).lineWidth(1.2);
  doc
    .moveTo(rightStartX, leftColumnY + 56)
    .lineTo(rightStartX + 16, leftColumnY + 49)
    .lineTo(rightStartX + 34, leftColumnY + 58)
    .lineTo(rightStartX + 58, leftColumnY + 48)
    .lineTo(rightStartX + 86, leftColumnY + 60)
    .lineTo(rightStartX + 110, leftColumnY + 52)
    .stroke();
  doc.restore();
  doc
    .fillColor(colors.muted)
    .font("Helvetica-Bold")
    .fontSize(8.2)
    .text("Signature client", rightStartX + 146, leftColumnY + 43, {
      width: 110,
    });
  doc
    .moveTo(rightStartX + 146, leftColumnY + 58)
    .lineTo(pageRight - 24, leftColumnY + 58)
    .strokeColor(colors.border)
    .stroke();

  doc.roundedRect(pageLeft, footerTop, pageWidth, 46, 14).fill(colors.navyDeep);
  drawGlyph("phone", pageLeft + 12, footerTop + 10, 20, colors.white);
  doc
    .fillColor(colors.white)
    .font("Helvetica-Bold")
    .fontSize(11.5)
    .text("Merci de votre confiance.", pageLeft + 42, footerTop + 10, {
      width: 190,
    });
  doc
    .fillColor("#D8E5FF")
    .font("Helvetica")
    .fontSize(8.5)
    .text(
      "Pour toute question, contactez notre agence.",
      pageLeft + 42,
      footerTop + 26,
      {
        width: 210,
      },
    );
  drawGlyph("phone", pageLeft + 300, footerTop + 14, 14, colors.white);
  doc
    .fillColor(colors.white)
    .font("Helvetica")
    .fontSize(9)
    .text(companyPhone, pageLeft + 320, footerTop + 14, {
      width: 110,
    });
  drawGlyph("pin", pageLeft + 430, footerTop + 14, 14, colors.white);
  doc
    .fillColor(colors.white)
    .font("Helvetica")
    .fontSize(9)
    .text(`${companyCity}, Maroc`, pageLeft + 448, footerTop + 14, {
      width: 110,
    });

  doc.end();
  return pdfDone;
}

type ReceiptPdfArgs = Parameters<typeof buildReceiptPdfLegacy>[0];

function isMissingChromeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /Could not find Chrome|Browser was not found|executablePath|Chrome \(ver\./i.test(
    message,
  );
}

async function buildReceiptPdfSafe(args: ReceiptPdfArgs) {
  try {
    return await buildReceiptPdf(args);
  } catch (error) {
    if (isMissingChromeError(error)) {
      return buildReceiptPdfLegacy(args);
    }
    throw error;
  }
}

// GET /api/rental-requests/:id/receipt
router.get("/:id/receipt", authMiddleware, async (req, res) => {
  try {
    const requestId = parseInt(String(req.params.id), 10);
    const result = await fetchRequestWithCar(requestId);
    if (!result) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }

    if (req.user!.role === "CUSTOMER") {
      const [customer] = await db
        .select()
        .from(schema.customersTable)
        .where(eq(schema.customersTable.userId, req.user!.userId))
        .limit(1);
      if (!customer || result.customerId !== customer.id) {
        res.status(403).json({ error: "Accès non autorisé" });
        return;
      }
    }

    if (
      ![
        "RESERVED",
        "PAID",
        "ACTIVE_RENTAL",
        "CAR_DELIVERED",
        "CAR_RETURNED",
        "RETURNED",
        "COMPLETED",
      ].includes(result.status)
    ) {
      res
        .status(409)
        .json({
          error:
            "Le reçu PDF n'est disponible qu'après validation du paiement.",
        });
      return;
    }

    const [settings] = await db
      .select()
      .from(schema.companySettingsTable)
      .limit(1);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const receiptNumber = buildReceiptNumber(result.id);
    const verificationUrl = `${baseUrl}/api/rental-requests/${result.id}/receipt`;
    const receiptArgs = {
      settings: settings || {},
      request: result as any,
      receiptNumber,
      verificationUrl,
      baseUrl,
    };

    if (req.query.format === "html") {
      const receiptHtml = await buildReceiptHtml(receiptArgs);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "private, no-store");
      res.send(receiptHtml);
      return;
    }

    const pdfBuffer = await buildReceiptPdfSafe(receiptArgs);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="recu-${receiptNumber}.pdf"`,
    );
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    res.send(pdfBuffer);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/rental-requests
router.get("/", authMiddleware, async (req, res) => {
  try {
    await expireStaleAvailabilityLocks();
    const {
      status,
      customerId,
      carId,
      search,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const conditions: any[] = [];

    if (status)
      conditions.push(eq(schema.rentalRequestsTable.status, status as any));
    if (customerId)
      conditions.push(
        eq(schema.rentalRequestsTable.customerId, parseInt(customerId, 10)),
      );
    if (carId)
      conditions.push(
        eq(schema.rentalRequestsTable.carId, parseInt(carId, 10)),
      );
    if (search) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.rentalRequestsTable.fullName, pattern),
          ilike(schema.rentalRequestsTable.phone, pattern),
          ilike(schema.rentalRequestsTable.email, pattern),
          ilike(schema.rentalRequestsTable.cinOrPassport, pattern),
        ),
      );
    }

    // Customers can only see their own
    if (req.user!.role === "CUSTOMER") {
      const [customer] = await db
        .select()
        .from(schema.customersTable)
        .where(eq(schema.customersTable.userId, req.user!.userId))
        .limit(1);
      if (customer)
        conditions.push(eq(schema.rentalRequestsTable.customerId, customer.id));
    } else {
      conditions.push(sql`status <> 'CANCELLED'`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.rentalRequestsTable)
      .where(where);
    const requests = await db
      .select()
      .from(schema.rentalRequestsTable)
      .where(where)
      .orderBy(desc(schema.rentalRequestsTable.createdAt))
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);

    const carIds = [...new Set(requests.map((r) => r.carId))];
    const cars =
      carIds.length > 0
        ? await db
            .select()
            .from(schema.carsTable)
            .where(
              sql`${schema.carsTable.id} = ANY(ARRAY[${sql.join(
                carIds.map((id) => sql`${id}`),
                sql`, `,
              )}]::int[])`,
            )
        : [];
    const carsMap = Object.fromEntries(cars.map((c) => [c.id, c]));

    const result = requests.map((r) => ({
      ...r,
      estimatedTotalPrice: Number(r.estimatedTotalPrice),
      finalPrice: r.finalPrice ? Number(r.finalPrice) : null,
      car: carsMap[r.carId]
        ? {
            ...carsMap[r.carId],
            dailyPrice: Number(carsMap[r.carId].dailyPrice),
            weeklyPrice: carsMap[r.carId].weeklyPrice
              ? Number(carsMap[r.carId].weeklyPrice)
              : null,
            monthlyPrice: carsMap[r.carId].monthlyPrice
              ? Number(carsMap[r.carId].monthlyPrice)
              : null,
          }
        : null,
    }));

    res.json({ requests: result, total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/rental-requests
router.post("/", authMiddleware, async (req, res) => {
  try {
    await expireStaleAvailabilityLocks();
    const {
      carId,
      fullName,
      phone,
      email,
      cinOrPassport,
      drivingLicenseNumber,
      pickupLocation,
      returnLocation,
      estimatedTotalPrice,
      notes,
    } = req.body;
    const { startDate, returnDate, startAt, returnAt } = resolveRentalTimes(
      req.body,
    );

    if (
      !startDate ||
      !returnDate ||
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(returnAt.getTime()) ||
      returnAt <= startAt
    ) {
      res
        .status(400)
        .json({ error: "Dates ou heures de reservation invalides." });
      return;
    }

    const availabilityEndAt = addReturnBuffer(returnAt);
    if (
      await hasActiveAvailabilityOverlap(
        Number(carId),
        startDate,
        returnDate,
        undefined,
        startAt,
        availabilityEndAt,
      )
    ) {
      res
        .status(409)
        .json({
          error:
            "Cette voiture est deja reservee ou bloquee sur cette periode.",
        });
      return;
    }

    let customerId = null;
    if (req.user!.role === "CUSTOMER") {
      const [customer] = await db
        .select()
        .from(schema.customersTable)
        .where(eq(schema.customersTable.userId, req.user!.userId))
        .limit(1);
      if (customer) customerId = customer.id;
    }

    const [request] = await db
      .insert(schema.rentalRequestsTable)
      .values({
        customerId,
        carId,
        fullName,
        phone,
        email,
        cinOrPassport,
        drivingLicenseNumber,
        startDate,
        returnDate,
        startAt,
        returnAt,
        pickupLocation,
        returnLocation,
        estimatedTotalPrice: String(estimatedTotalPrice),
        notes,
        status: "DOCUMENT_SUBMISSION_WINDOW",
      })
      .returning();
    await createTemporaryHold(request);

    await logAudit(req, {
      userId: req.user!.userId,
      action: "CREATE_RENTAL_REQUEST",
      entityType: "rental_request",
      entityId: request.id,
    });

    const result = await fetchRequestWithCar(request.id);
    res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/rental-requests/check-expired
router.post(
  "/check-expired",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      await expireStaleAvailabilityLocks();
      const now = new Date();
      const expired = await db
        .select()
        .from(schema.rentalRequestsTable)
        .where(
          and(
            sql`status IN ('CALL_CONFIRMED', 'EXTENDED_PAYMENT_DEADLINE', 'WAITING_AGENCY_PAYMENT')`,
            lt(schema.rentalRequestsTable.paymentDeadline, now),
          ),
        );
      for (const r of expired) {
        await db
          .update(schema.rentalRequestsTable)
          .set({ status: "ABANDONED", abandonedAt: now })
          .where(eq(schema.rentalRequestsTable.id, r.id));
        await releaseRequestAvailabilityBlocks(r.id, "EXPIRED");
        if (r.customerId) {
          const [customer] = await db
            .select()
            .from(schema.customersTable)
            .where(eq(schema.customersTable.id, r.customerId))
            .limit(1);
          if (customer) {
            await createNotification({
              userId: customer.userId,
              title: "Demande de location abandonnée",
              message: `Votre demande de location n°${r.id} a été abandonnée car le délai de paiement est dépassé.`,
            });
          }
        }
      }
      res.json({ message: `${expired.length} demande(s) abandonnée(s)` });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// GET /api/rental-requests/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await fetchRequestWithCar(
      parseInt(String(req.params.id), 10),
    );
    if (!result) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }
    if (result.status === "CANCELLED" && req.user!.role !== "CUSTOMER") {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id
router.patch(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      const {
        fullName,
        phone,
        email,
        cinOrPassport,
        drivingLicenseNumber,
        pickupLocation,
        returnLocation,
        finalPrice,
        notes,
      } = req.body;
      const requestId = parseInt(String(req.params.id), 10);
      const [existing] = await db
        .select()
        .from(schema.rentalRequestsTable)
        .where(eq(schema.rentalRequestsTable.id, requestId))
        .limit(1);
      if (!existing) {
        res.status(404).json({ error: "Demande non trouvÃ©e" });
        return;
      }

      const hasDateUpdate =
        req.body.startDate ||
        req.body.returnDate ||
        req.body.startAt ||
        req.body.returnAt ||
        req.body.startHour ||
        req.body.returnHour;
      const dateUpdate = hasDateUpdate
        ? resolveRentalTimes({
            ...req.body,
            startDate: req.body.startDate ?? existing.startDate,
            returnDate: req.body.returnDate ?? existing.returnDate,
          })
        : null;
      if (
        dateUpdate &&
        (await hasActiveAvailabilityOverlap(
          existing.carId,
          dateUpdate.startDate,
          dateUpdate.returnDate,
          existing.id,
          dateUpdate.startAt,
          addReturnBuffer(dateUpdate.returnAt),
        ))
      ) {
        res
          .status(409)
          .json({ error: "Cette voiture est deja bloquee sur cette periode." });
        return;
      }

      const [updated] = await db
        .update(schema.rentalRequestsTable)
        .set({
          fullName,
          phone,
          email,
          cinOrPassport,
          drivingLicenseNumber,
          ...(dateUpdate && {
            startDate: dateUpdate.startDate,
            returnDate: dateUpdate.returnDate,
            startAt: dateUpdate.startAt,
            returnAt: dateUpdate.returnAt,
          }),
          pickupLocation,
          returnLocation,
          ...(finalPrice !== undefined &&
            finalPrice !== null && { finalPrice: String(finalPrice) }),
          notes,
        })
        .where(eq(schema.rentalRequestsTable.id, requestId))
        .returning();
      if (dateUpdate && updated) {
        const endAt = getRequestAvailabilityEndAt(updated);
        await db
          .update(schema.carAvailabilityBlocksTable)
          .set({
            startDate: updated.startDate,
            endDate: endAt.toISOString().slice(0, 10),
            startAt: getRequestStartAt(updated),
            endAt,
          })
          .where(
            and(
              eq(schema.carAvailabilityBlocksTable.rentalRequestId, updated.id),
              eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
            ),
          );
      }
      if (!updated) {
        res.status(404).json({ error: "Demande non trouvée" });
        return;
      }
      const result = await fetchRequestWithCar(updated.id);
      res.json(result);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// PATCH /api/rental-requests/:id/status
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      const { status, notes } = req.body;
      const [updated] = await db
        .update(schema.rentalRequestsTable)
        .set({ status, ...(notes && { notes }) })
        .where(
          eq(
            schema.rentalRequestsTable.id,
            parseInt(String(req.params.id), 10),
          ),
        )
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Demande non trouvée" });
        return;
      }
      if (["ABANDONED", "CANCELLED", "REJECTED"].includes(status)) {
        await releaseRequestAvailabilityBlocks(
          updated.id,
          status === "ABANDONED" ? "EXPIRED" : "RELEASED",
        );
      }
      await logAudit(req, {
        userId: req.user!.userId,
        action: `STATUS_CHANGE_${status}`,
        entityType: "rental_request",
        entityId: updated.id,
        details: notes,
      });
      const result = await fetchRequestWithCar(updated.id);
      res.json(result);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// PATCH /api/rental-requests/:id/confirm-call
router.patch(
  "/:id/confirm-call",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      const { notes, finalPrice } = req.body;
      const now = new Date();

      const [settings] = await db
        .select()
        .from(schema.companySettingsTable)
        .limit(1);
      const deadlineHours = getPaymentDeadlineHours(
        settings?.paymentDeadlineHours ?? 24,
      );
      const paymentDeadline = new Date(
        now.getTime() + deadlineHours * 60 * 60 * 1000,
      );

      const [updated] = await db
        .update(schema.rentalRequestsTable)
        .set({
          status: "CALL_CONFIRMED",
          callConfirmedAt: now,
          callConfirmedBy: req.user!.userId,
          paymentDeadline,
          ...(notes && { notes }),
          ...(finalPrice !== undefined &&
            finalPrice !== null && { finalPrice: String(finalPrice) }),
        })
        .where(
          eq(
            schema.rentalRequestsTable.id,
            parseInt(String(req.params.id), 10),
          ),
        )
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Demande non trouvée" });
        return;
      }

      await markRequestCallConfirmed(updated);

      if (updated.customerId) {
        const [customer] = await db
          .select()
          .from(schema.customersTable)
          .where(eq(schema.customersTable.id, updated.customerId))
          .limit(1);
        if (customer) {
          await createNotification({
            userId: customer.userId,
            title: "Demande confirmée - Paiement requis",
            message: `Votre demande n°${updated.id} a été confirmée. Vous avez ${deadlineHours}h pour passer à l'agence et effectuer le paiement.`,
          });
        }
      }

      await logAudit(req, {
        userId: req.user!.userId,
        action: "CONFIRM_CALL",
        entityType: "rental_request",
        entityId: updated.id,
      });
      const result = await fetchRequestWithCar(updated.id);
      res.json(result);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// PATCH /api/rental-requests/:id/extend-payment-deadline
router.patch(
  "/:id/extend-payment-deadline",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      await expireStaleAvailabilityLocks();
      const hours = Number(req.body.hours);
      if (![12, 24].includes(hours)) {
        res
          .status(400)
          .json({ error: "Extension autorisee: 12 ou 24 heures." });
        return;
      }

      const [existing] = await db
        .select()
        .from(schema.rentalRequestsTable)
        .where(
          eq(
            schema.rentalRequestsTable.id,
            parseInt(String(req.params.id), 10),
          ),
        )
        .limit(1);
      if (!existing) {
        res.status(404).json({ error: "Demande non trouvee" });
        return;
      }
      if (
        ![
          "CALL_CONFIRMED",
          "EXTENDED_PAYMENT_DEADLINE",
          "WAITING_AGENCY_PAYMENT",
        ].includes(existing.status)
      ) {
        res
          .status(409)
          .json({
            error:
              "Le delai ne peut etre prolonge qu'apres confirmation par appel.",
          });
        return;
      }

      const baseDeadline =
        existing.paymentDeadline && existing.paymentDeadline > new Date()
          ? existing.paymentDeadline
          : new Date();
      const paymentDeadline = new Date(
        baseDeadline.getTime() + hours * 60 * 60 * 1000,
      );

      const [updated] = await db
        .update(schema.rentalRequestsTable)
        .set({
          status: "EXTENDED_PAYMENT_DEADLINE",
          paymentDeadline,
          paymentDeadlineExtendedAt: new Date(),
          paymentDeadlineExtendedBy: req.user!.userId,
          paymentDeadlineExtensionHours: hours,
        })
        .where(eq(schema.rentalRequestsTable.id, existing.id))
        .returning();

      await markRequestCallConfirmed(updated, true);
      await logAudit(req, {
        userId: req.user!.userId,
        action: `EXTEND_PAYMENT_DEADLINE_${hours}H`,
        entityType: "rental_request",
        entityId: updated.id,
      });
      const result = await fetchRequestWithCar(updated.id);
      res.json(result);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// PATCH /api/rental-requests/:id/confirm-payment
router.patch(
  "/:id/confirm-payment",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      const { amount, notes, paymentMethod } = req.body;
      const now = new Date();
      const normalizedAmount = normalizeAmount(amount);
      const [updated] = await db
        .update(schema.rentalRequestsTable)
        .set({
          status: "PAID",
          paymentStatus: "PAID_AT_AGENCY",
          paymentMethod: paymentMethod ?? "CASH_AT_AGENCY",
          paidAtAgencyAt: now,
          paymentConfirmedBy: req.user!.userId,
          ...(normalizedAmount !== null && {
            finalPrice: String(normalizedAmount),
          }),
          ...(notes && { notes }),
        })
        .where(
          eq(
            schema.rentalRequestsTable.id,
            parseInt(String(req.params.id), 10),
          ),
        )
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Demande non trouvée" });
        return;
      }

      await markRequestReserved(updated);

      if (updated.customerId) {
        const [customer] = await db
          .select()
          .from(schema.customersTable)
          .where(eq(schema.customersTable.id, updated.customerId))
          .limit(1);
        if (customer) {
          await createNotification({
            userId: customer.userId,
            title: "Paiement confirmé - Réservation validée",
            message: `Votre paiement pour la demande n°${updated.id} a été confirmé. Votre réservation est validée.`,
          });
        }
      }

      await logAudit(req, {
        userId: req.user!.userId,
        action: "CONFIRM_PAYMENT",
        entityType: "rental_request",
        entityId: updated.id,
      });
      const result = await fetchRequestWithCar(updated.id);
      if (!result) {
        res.status(404).json({ error: "Demande non trouvée" });
        return;
      }

      const [settings] = await db
        .select()
        .from(schema.companySettingsTable)
        .limit(1);
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const receiptNumber = buildReceiptNumber(result.id);
      const verificationUrl = `${baseUrl}/api/rental-requests/${result.id}/receipt`;

      try {
        const pdfBuffer = await buildReceiptPdfSafe({
          settings: settings || {},
          request: result as any,
          receiptNumber,
          verificationUrl,
          baseUrl,
        });

        if (result.email) {
          await sendReceiptEmail(result.email, receiptNumber, pdfBuffer);
        }
      } catch (receiptError) {
        req.log.error(receiptError);
      }

      res.json({
        ...result,
        receiptUrl: `/api/rental-requests/${updated.id}/receipt`,
        receiptLabel: receiptNumber,
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// PATCH /api/rental-requests/:id/cancel
router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const [existing] = await db
      .select()
      .from(schema.rentalRequestsTable)
      .where(
        eq(schema.rentalRequestsTable.id, parseInt(String(req.params.id), 10)),
      )
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }

    if (req.user!.role === "CUSTOMER") {
      if (!existing.customerId) {
        res.status(403).json({ error: "Non autorisé" });
        return;
      }
      const [customer] = await db
        .select()
        .from(schema.customersTable)
        .where(eq(schema.customersTable.userId, req.user!.userId))
        .limit(1);
      if (!customer || customer.id !== existing.customerId) {
        res.status(403).json({ error: "Non autorisé" });
        return;
      }
    }

    const [updated] = await db
      .update(schema.rentalRequestsTable)
      .set({ status: "CANCELLED" })
      .where(
        eq(schema.rentalRequestsTable.id, parseInt(String(req.params.id), 10)),
      )
      .returning();
    await releaseRequestAvailabilityBlocks(updated.id);

    await logAudit(req, {
      userId: req.user!.userId,
      action: "CANCEL_RENTAL_REQUEST",
      entityType: "rental_request",
      entityId: updated.id,
    });
    const result = await fetchRequestWithCar(updated.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
