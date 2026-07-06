import { existsSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import {
  calculateIncludedTaxBreakdown,
  getCompanyPricingConfig,
} from "./pricing";

type ReceiptRequest = {
  id: number;
  carId: number;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  cinOrPassport?: string | null;
  startDate: string | Date;
  returnDate: string | Date;
  paidAtAgencyAt?: string | Date | null;
  finalPrice?: number | string | null;
  estimatedTotalPrice?: number | string | null;
  paymentMethod?: string | null;
  car?: {
    brand?: string | null;
    model?: string | null;
    dailyPrice?: number | string | null;
    insuranceIncluded?: boolean | null;
    mainImageUrl?: string | null;
    depositAmount?: number | string | null;
  } | null;
};

type ReceiptArgs = {
  settings: any;
  request: ReceiptRequest;
  receiptNumber: string;
  verificationUrl: string;
  baseUrl: string;
};

type PdfRow = {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "default" | "muted" | "accent" | "warning";
};

function compactText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function firstExistingPath(candidates: string[]) {
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function registerReceiptFonts(doc: { registerFont: (name: string, src: string) => void }) {
  const windir = process.env.WINDIR ?? "C:\\Windows";
  const regularCandidates =
    process.platform === "win32"
      ? [
          path.join(windir, "Fonts", "tahoma.ttf"),
          path.join(windir, "Fonts", "arial.ttf"),
        ]
      : [
          "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
          "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
        ];
  const boldCandidates =
    process.platform === "win32"
      ? [
          path.join(windir, "Fonts", "tahomabd.ttf"),
          path.join(windir, "Fonts", "arialbd.ttf"),
        ]
      : [
          "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
          "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
        ];

  const regularPath = firstExistingPath(regularCandidates);
  const boldPath = firstExistingPath(boldCandidates);

  if (regularPath) doc.registerFont("receipt-regular", regularPath);
  if (boldPath) doc.registerFont("receipt-bold", boldPath);

  return {
    regular: regularPath ? "receipt-regular" : "Helvetica",
    bold: boldPath ? "receipt-bold" : "Helvetica-Bold",
  };
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
      const match = resolvedSource.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.*)$/i);
      if (!match?.[2]) return null;
      const mimeType = (match[1] ?? "").toLowerCase();
      if (mimeType.includes("svg")) return null;
      return Buffer.from(match[2], "base64");
    }

    const response = await fetch(resolvedSource);
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.includes("svg")) return null;

    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
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

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function toLocalMidnight(value: string | Date) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function paymentMethod(method?: string | null) {
  if (method === "CARD_AT_AGENCY") return "Carte a l'agence";
  if (method === "BANK_TRANSFER") return "Virement bancaire";
  return "Especes a l'agence";
}

function companyInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || "LA";
}

export async function buildReceiptPdf(args: ReceiptArgs) {
  const { settings, request, receiptNumber, verificationUrl, baseUrl } = args;
  const car = request.car ?? {};
  const companyName = settings.brandName || "Location Auto Maroc";
  const companyCity = settings.city || "Casablanca";
  const companyAddress = settings.address || `${companyCity}, Maroc`;
  const companyPhone = settings.phone || "+212600000000";
  const paidAt = request.paidAtAgencyAt
    ? new Date(request.paidAtAgencyAt)
    : new Date();
  const total = Number(request.finalPrice ?? request.estimatedTotalPrice ?? 0);
  const pricingConfig = getCompanyPricingConfig(settings);
  const taxBreakdown = calculateIncludedTaxBreakdown(
    total,
    pricingConfig.taxRatePercent,
  );
  const taxes = taxBreakdown.taxAmount;
  const subtotal = taxBreakdown.subtotalBeforeTax;
  const insurance = 0;
  const dailyPrice = Number(car.dailyPrice ?? Number.NaN);
  const depositAmount = Number(car.depositAmount ?? 0);
  const showDepositAmount = Number.isFinite(depositAmount) && depositAmount > 0;
  const days = Math.max(
    1,
    Math.floor(
      (toLocalMidnight(request.returnDate).getTime() -
        toLocalMidnight(request.startDate).getTime()) /
        86_400_000,
    ) + 1,
  );
  const vehicleName =
    `${car.brand ?? ""} ${car.model ?? ""}`.trim() || `Vehicule #${request.carId}`;
  const paymentLabel = paymentMethod(request.paymentMethod);

  const logoBuffer = await fetchImageBuffer(settings.logoUrl, baseUrl);

  const doc = new PDFDocument({
    size: "A4",
    margin: 32,
    info: {
      Title: `Recu ${receiptNumber}`,
      Author: companyName,
      Subject: "Recu de paiement",
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

  const fonts = registerReceiptFonts(doc);
  const colors = {
    navy: "#163a72",
    accent: "#1f56b4",
    text: "#10213d",
    muted: "#667085",
    line: "#d8e1ec",
    paper: "#ffffff",
    warning: "#8b5a00",
  } as const;

  const pageLeft = doc.page.margins.left;
  const pageTop = doc.page.margins.top;
  const pageRight = doc.page.width - doc.page.margins.right;
  const pageWidth = pageRight - pageLeft;
  const gap = 8;
  const headerHeight = 74;
  const cardPaddingX = 12;
  const cardPaddingY = 8;
  const titleHeight = 12;
  const rowHeight = 12;
  const rowGap = 2;
  const labelWidth = 126;
  const valueWidth = pageWidth - cardPaddingX * 2 - labelWidth - 10;
  const contentWidth = pageWidth - cardPaddingX * 2;

  const rowCardHeight = (rowCount: number) =>
    cardPaddingY * 2 +
    titleHeight +
    5 +
    rowCount * rowHeight +
    Math.max(0, rowCount - 1) * rowGap;

  function normalizeLine(value: unknown, fallback = "—") {
    const text = compactText(value);
    return text || fallback;
  }

  function drawCard(options: {
    x: number;
    y: number;
    width: number;
    title: string;
    rows: PdfRow[];
  }) {
    const { x, y, width, title, rows } = options;
    const height = rowCardHeight(rows.length);
    const innerLabelWidth = Math.min(labelWidth, Math.floor(width * 0.34));
    const innerValueWidth = width - cardPaddingX * 2 - innerLabelWidth - 10;

    doc.save();
    doc.fillColor(colors.paper).strokeColor(colors.line);
    doc.roundedRect(x, y, width, height, 12).fillAndStroke();
    doc.restore();

    doc.fillColor(colors.navy).font(fonts.bold).fontSize(10.25);
    doc.text(title.toUpperCase(), x + cardPaddingX, y + cardPaddingY, {
      width: contentWidth,
      height: titleHeight,
      ellipsis: true,
    });

    const ruleY = y + cardPaddingY + titleHeight + 4;
    doc.moveTo(x + cardPaddingX, ruleY);
    doc.lineTo(x + width - cardPaddingX, ruleY);
    doc.strokeColor(colors.line).lineWidth(1).stroke();

    let rowY = ruleY + 4;
    rows.forEach((row, index) => {
      const valueColor =
        row.tone === "warning"
          ? colors.warning
          : row.tone === "accent"
            ? colors.accent
            : row.tone === "muted"
              ? colors.muted
              : colors.text;

      doc.fillColor(colors.muted).font(fonts.regular).fontSize(8);
      doc.text(normalizeLine(row.label), x + cardPaddingX, rowY, {
        width: innerLabelWidth,
        height: rowHeight,
        ellipsis: true,
      });

      doc.fillColor(valueColor)
        .font(row.strong ? fonts.bold : fonts.regular)
        .fontSize(row.strong ? 9.3 : 8.8);
      doc.text(normalizeLine(row.value), x + cardPaddingX + innerLabelWidth + 10, rowY, {
        width: innerValueWidth,
        height: rowHeight,
        align: "right",
        ellipsis: true,
      });

      if (index < rows.length - 1) {
        const separatorY = rowY + rowHeight - 1;
        doc.moveTo(x + cardPaddingX, separatorY);
        doc.lineTo(x + width - cardPaddingX, separatorY);
        doc.strokeColor("#eef2f7").lineWidth(1).stroke();
      }

      rowY += rowHeight + rowGap;
    });

    return height;
  }

  function drawHeader() {
    const headerX = pageLeft;
    const headerY = pageTop;
    const receiptBoxWidth = 184;
    const receiptBoxHeight = 52;
    const badgeSize = 42;
    const receiptBoxX = pageRight - receiptBoxWidth;

    doc.save();
    doc.fillColor(colors.navy).strokeColor(colors.navy);
    doc.roundedRect(headerX, headerY, pageWidth, headerHeight, 16).fillAndStroke();
    doc.restore();

    const badgeX = headerX + 14;
    const badgeY = headerY + 16;
    let renderedLogo = false;

    if (logoBuffer) {
      doc.save();
      try {
        doc.fillColor(colors.paper).strokeColor(colors.paper);
        doc.roundedRect(badgeX, badgeY, badgeSize, badgeSize, 11).fillAndStroke();
        doc.image(logoBuffer, badgeX + 4, badgeY + 4, {
          fit: [badgeSize - 8, badgeSize - 8],
          align: "center",
          valign: "center",
        });
        renderedLogo = true;
      } catch {
        renderedLogo = false;
      } finally {
        doc.restore();
      }
    }

    if (!renderedLogo) {
      doc.save();
      doc.fillColor(colors.paper).strokeColor(colors.paper);
      doc.roundedRect(badgeX, badgeY, badgeSize, badgeSize, 11).fillAndStroke();
      doc.fillColor(colors.navy).font(fonts.bold).fontSize(15);
      doc.text(companyInitials(companyName), badgeX, badgeY + 12, {
        width: badgeSize,
        align: "center",
      });
      doc.restore();
    }

    doc.fillColor(colors.paper).font(fonts.bold).fontSize(17);
    doc.text(companyName, headerX + 68, headerY + 14, {
      width: pageWidth - receiptBoxWidth - 92,
      height: 18,
      ellipsis: true,
    });
    doc.fillColor("#dbe7ff").font(fonts.regular).fontSize(8.5);
    doc.text(`${companyCity}, Maroc`, headerX + 68, headerY + 36, {
      width: pageWidth - receiptBoxWidth - 92,
      height: 12,
      ellipsis: true,
    });
    doc.text(companyPhone, headerX + 68, headerY + 49, {
      width: pageWidth - receiptBoxWidth - 92,
      height: 12,
      ellipsis: true,
    });

    doc.save();
    doc.fillColor("#0f2d63").strokeColor("#5d86c9");
    doc.roundedRect(
      receiptBoxX,
      headerY + 11,
      receiptBoxWidth,
      receiptBoxHeight,
      11,
    ).fillAndStroke();
    doc.restore();

    doc.fillColor("#dbe7ff").font(fonts.regular).fontSize(8);
    doc.text("Recu de paiement", receiptBoxX + 12, headerY + 16, {
      width: receiptBoxWidth - 24,
      align: "right",
    });
    doc.fillColor(colors.paper).font(fonts.bold).fontSize(13.5);
    doc.text(receiptNumber, receiptBoxX + 12, headerY + 28, {
      width: receiptBoxWidth - 24,
      align: "right",
      ellipsis: true,
    });
    doc.fillColor("#dbe7ff").font(fonts.regular).fontSize(8.2);
    doc.text(formatDate(paidAt), receiptBoxX + 12, headerY + 45, {
      width: receiptBoxWidth - 24,
      align: "right",
    });
  }

  function drawFooter(y: number) {
    const footerHeight = 28;

    doc.save();
    doc.moveTo(pageLeft, y);
    doc.lineTo(pageRight, y);
    doc.strokeColor(colors.line).lineWidth(1).stroke();

    doc.fillColor(colors.navy).font(fonts.bold).fontSize(8.5);
    doc.text(companyName, pageLeft, y + 7, {
      width: pageWidth * 0.5,
      height: 10,
      ellipsis: true,
    });

    doc.fillColor(colors.muted).font(fonts.regular).fontSize(7.8);
    doc.text(`${companyCity}, Maroc`, pageLeft, y + 18, {
      width: pageWidth * 0.5,
      height: 9,
      ellipsis: true,
    });

    doc.text("Paiement en agence uniquement · Recu archivable", pageLeft, y + 7, {
      width: pageWidth,
      height: 18,
      align: "right",
      ellipsis: true,
    });
    doc.restore();

    return footerHeight;
  }

  const agencyRows: PdfRow[] = [
    { label: "Nom", value: companyName },
    { label: "Telephone", value: companyPhone },
    { label: "Adresse", value: companyAddress },
  ];

  const clientRows: PdfRow[] = [
    { label: "Nom complet", value: request.fullName },
    { label: "Telephone", value: request.phone || "—" },
    { label: "CIN / passeport", value: request.cinOrPassport || "—" },
    { label: "Email", value: request.email || "—" },
  ];

  const vehicleRows: PdfRow[] = [
    { label: "Modele", value: vehicleName },
    {
      label: "Prix journalier",
      value:
        Number.isFinite(dailyPrice) && dailyPrice > 0
          ? formatMoney(dailyPrice)
          : "—",
    },
    {
      label: "Assurance",
      value: car.insuranceIncluded === true ? "Incluse" : "Non incluse",
    },
  ];

  const locationRows: PdfRow[] = [
    { label: "Reservation", value: `#${request.id}` },
    { label: "Depart", value: formatDate(request.startDate) },
    { label: "Retour", value: formatDate(request.returnDate) },
    { label: "Duree", value: `${days} jour(s)` },
  ];

  const paymentRows: PdfRow[] = [
    { label: "Montant HT", value: formatMoney(subtotal) },
    {
      label: pricingConfig.taxRatePercent > 0 ? `TVA (${pricingConfig.taxRatePercent}%)` : "TVA",
      value: formatMoney(taxes),
    },
    { label: "Assurance", value: formatMoney(insurance) },
    ...(showDepositAmount
      ? [
          {
            label: "Caution remboursable",
            value: formatMoney(depositAmount),
            tone: "warning" as const,
          },
        ]
      : []),
    { label: "Mode de paiement", value: paymentLabel },
    { label: "Date de paiement", value: formatDateTime(paidAt) },
    { label: "Référence", value: receiptNumber },
    { label: "Total TTC", value: formatMoney(total), strong: true },
  ];

  let cursorY = pageTop;
  drawHeader();
  cursorY += headerHeight + gap;

  drawCard({
    x: pageLeft,
    y: cursorY,
    width: pageWidth,
    title: "Agence",
    rows: agencyRows,
  });
  cursorY += rowCardHeight(agencyRows.length) + gap;

  drawCard({
    x: pageLeft,
    y: cursorY,
    width: pageWidth,
    title: "Client",
    rows: clientRows,
  });
  cursorY += rowCardHeight(clientRows.length) + gap;

  drawCard({
    x: pageLeft,
    y: cursorY,
    width: pageWidth,
    title: "Vehicule",
    rows: vehicleRows,
  });
  cursorY += rowCardHeight(vehicleRows.length) + gap;

  drawCard({
    x: pageLeft,
    y: cursorY,
    width: pageWidth,
    title: "Location",
    rows: locationRows,
  });
  cursorY += rowCardHeight(locationRows.length) + gap;

  drawCard({
    x: pageLeft,
    y: cursorY,
    width: pageWidth,
    title: "Paiement",
    rows: paymentRows,
  });
  cursorY += rowCardHeight(paymentRows.length) + gap;

  drawFooter(cursorY);

  doc.end();
  return pdfDone;
}
