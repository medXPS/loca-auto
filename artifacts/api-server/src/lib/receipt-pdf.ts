import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import {
  calculateIncludedTaxBreakdown,
  getCompanyPricingConfig,
} from "./pricing";
import { buildReceiptPdf as buildReceiptPdfSimple } from "./receipt-pdf-simple";

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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function assetUrl(source: string | null | undefined, baseUrl: string) {
  if (!source) return "";
  if (/^(https?:|data:)/i.test(source)) return source;
  try {
    return new URL(source, baseUrl).toString();
  } catch {
    return "";
  }
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

function keyValueTable(items: Array<[string, string]>) {
  return `<table class="kv-table">${items
    .map(
      ([label, value]) =>
        `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value || "—")}</td></tr>`,
    )
    .join("")}</table>`;
}

export async function buildReceiptHtml(args: ReceiptArgs) {
  const { settings, request, receiptNumber, verificationUrl, baseUrl } = args;
  const car = request.car ?? {};
  const companyName = settings.brandName || "Location Auto Maroc";
  const companyCity = settings.city || "Casablanca";
  const companyAddress = settings.address || `${companyCity}, Maroc`;
  const companyPhone = settings.phone || "+212600000000";
  const paidAt = request.paidAtAgencyAt ? new Date(request.paidAtAgencyAt) : new Date();
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
  const paymentNote = showDepositAmount
    ? "La caution est distincte du prix de location et peut etre restituee a la fin du contrat."
    : "Le montant ci-dessus correspond uniquement a la location.";
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
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 120,
  });
  const logoUrl = assetUrl(settings.logoUrl, baseUrl);

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reçu ${escapeHtml(receiptNumber)}</title>
  <style>
    @page { size: A4; margin: 0; }
    :root {
      --navy: #163a72;
      --accent: #1f56b4;
      --text: #10213d;
      --muted: #667085;
      --line: #d8e1ec;
      --soft: #f7f9fc;
      --paper: #ffffff;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      font-family: Arial, Helvetica, sans-serif;
      color: var(--text);
      background: #eef3f8;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { line-height: 1.25; }
    .print-tools {
      width: 210mm;
      margin: 14px auto 0;
      display: flex;
      justify-content: flex-end;
    }
    .print-tools button {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 9px 14px;
      background: white;
      color: var(--text);
      font: 700 12px Arial, Helvetica, sans-serif;
      cursor: pointer;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      margin: 0 auto 16px;
      padding: 9mm;
      background: var(--paper);
      border: 1px solid #d5dde8;
      display: flex;
      flex-direction: column;
      gap: 3.5mm;
      overflow: hidden;
    }
    .header {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(0, .85fr);
      gap: 4mm;
      align-items: stretch;
      padding-bottom: 4mm;
      border-bottom: 1px solid var(--line);
    }
    .brand {
      display: flex;
      gap: 12px;
      align-items: center;
      min-width: 0;
    }
    .logo {
      width: 42px;
      height: 42px;
      flex: 0 0 auto;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: var(--soft);
      overflow: hidden;
    }
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      padding: 4px;
      background: white;
    }
    .logo.fallback {
      display: grid;
      place-items: center;
      color: white;
      background: var(--navy);
      font-weight: 900;
      font-size: 14px;
      letter-spacing: .04em;
    }
    .brand-name {
      margin: 0;
      font-size: 20px;
      line-height: 1.05;
      color: var(--navy);
      font-weight: 800;
    }
    .brand-sub {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 10px;
    }
    .receipt-meta {
      text-align: right;
      display: grid;
      gap: 4px;
      align-content: center;
    }
    .receipt-meta .label {
      color: var(--muted);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-weight: 700;
    }
    .receipt-meta .number {
      color: var(--navy);
      font-size: 22px;
      font-weight: 900;
      line-height: 1;
    }
    .receipt-meta .date {
      color: var(--text);
      font-size: 11px;
    }
    .section {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px 12px;
      background: white;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .section-title {
      margin: 0 0 8px;
      color: var(--navy);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4mm;
    }
    .kv-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 10px;
    }
    .kv-table td {
      padding: 6px 0;
      border-bottom: 1px solid #eef2f7;
      vertical-align: top;
    }
    .kv-table tr:last-child td { border-bottom: 0; }
    .kv-table td:first-child {
      width: 38%;
      color: var(--muted);
      padding-right: 8px;
    }
    .kv-table td:last-child {
      text-align: right;
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .highlight td {
      padding-top: 8px;
      font-weight: 800;
      color: var(--navy) !important;
    }
    .payment-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(0, .75fr);
      gap: 4mm;
      align-items: start;
    }
    .payment-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 10px;
    }
    .payment-table td {
      padding: 6px 0;
      border-bottom: 1px solid #eef2f7;
      vertical-align: top;
    }
    .payment-table tr:last-child td { border-bottom: 0; }
    .payment-table td:first-child {
      color: var(--muted);
      padding-right: 8px;
    }
    .payment-table td:last-child {
      text-align: right;
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .payment-table .total td {
      border-top: 1px solid var(--line);
      padding-top: 8px;
      color: var(--navy);
      font-size: 11px;
      font-weight: 900;
    }
    .payment-table .deposit td {
      color: #8b5a00;
    }
    .payment-note {
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: 10px;
      background: #faf7ef;
      color: #7a5611;
      font-size: 9px;
      line-height: 1.35;
    }
    .side-stack {
      display: grid;
      gap: 8px;
    }
    .mini-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #fafbfc;
      padding: 8px 10px;
    }
    .mini-box small {
      display: block;
      color: var(--muted);
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-weight: 700;
    }
    .mini-box strong {
      display: block;
      margin-top: 3px;
      font-size: 10px;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    .verification {
      display: grid;
      grid-template-columns: 86px minmax(0, 1fr) minmax(0, .9fr);
      gap: 12px;
      align-items: start;
    }
    .qr {
      width: 84px;
      height: 84px;
      padding: 4px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: white;
    }
    .verify-copy {
      padding-right: 12px;
      border-right: 1px solid var(--line);
      font-size: 9px;
      line-height: 1.45;
    }
    .verify-copy p {
      margin: 0 0 6px;
    }
    .verify-copy a {
      color: var(--accent);
      font-weight: 700;
      word-break: break-all;
    }
    .signatures {
      display: grid;
      gap: 10px;
    }
    .signature small {
      display: block;
      color: var(--muted);
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-weight: 700;
    }
    .signature-line {
      height: 30px;
      margin-top: 4px;
      border-bottom: 1px solid var(--navy);
    }
    .signature.agency .signature-line::after {
      content: "Location Auto Maroc";
      display: block;
      padding-top: 8px;
      color: var(--navy);
      font: italic 12px Georgia, serif;
    }
    .footer {
      margin-top: auto;
      padding-top: 5px;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: flex-start;
      color: var(--muted);
      font-size: 8.5px;
    }
    .footer strong {
      display: block;
      color: var(--navy);
      font-size: 10px;
    }
    .footer .right {
      text-align: right;
    }
    @media print {
      html, body { background: white; }
      .print-tools { display: none !important; }
      .page { margin: 0; border: 0; }
    }
    @media screen and (max-width: 820px) {
      .print-tools { width: calc(100% - 24px); }
      .page {
        width: calc(100% - 24px);
        height: auto;
        min-height: 0;
        padding: 18px;
        overflow: visible;
      }
      .header,
      .grid-2,
      .payment-layout,
      .verification {
        grid-template-columns: 1fr;
      }
      .receipt-meta,
      .footer .right {
        text-align: left;
      }
      .verify-copy {
        border-right: 0;
        border-bottom: 1px solid var(--line);
        padding-right: 0;
        padding-bottom: 10px;
      }
      .footer {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="print-tools">
    <button type="button" onclick="window.print()">Imprimer</button>
  </div>

  <main class="page">
    <header class="header">
      <div class="brand">
        ${logoUrl
          ? `<div class="logo"><img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(companyName)}" /></div>`
          : `<div class="logo fallback">${escapeHtml(companyInitials(companyName))}</div>`}
        <div>
          <h1 class="brand-name">${escapeHtml(companyName)}</h1>
          <p class="brand-sub">${escapeHtml(companyCity)}, Maroc · ${escapeHtml(companyPhone)}</p>
        </div>
      </div>
      <div class="receipt-meta">
        <div class="label">Reçu de paiement</div>
        <div class="number">${escapeHtml(receiptNumber)}</div>
        <div class="date">${escapeHtml(formatDate(paidAt))}</div>
      </div>
    </header>

    <section class="grid-2">
      <article class="section">
        <h2 class="section-title">Agence</h2>
        ${keyValueTable([
          ["Nom", companyName],
          ["Téléphone", companyPhone],
          ["Adresse", companyAddress],
        ])}
      </article>
      <article class="section">
        <h2 class="section-title">Client</h2>
        ${keyValueTable([
          ["Nom complet", request.fullName],
          ["Téléphone", request.phone || "—"],
          ["CIN / passeport", request.cinOrPassport || "—"],
        ])}
      </article>
    </section>

    <section class="grid-2">
      <article class="section">
        <h2 class="section-title">Véhicule</h2>
        ${keyValueTable([
          ["Modèle", vehicleName],
          [
            "Prix journalier",
            Number.isFinite(dailyPrice) && dailyPrice > 0
              ? formatMoney(dailyPrice)
              : "—",
          ],
          ["Assurance", car.insuranceIncluded === true ? "Incluse" : "Non incluse"],
          ...(showDepositAmount
            ? [["Caution remboursable", formatMoney(depositAmount)] as [string, string]]
            : []),
        ])}
      </article>
      <article class="section">
        <h2 class="section-title">Location</h2>
        ${keyValueTable([
          ["Réservation", `#${request.id}`],
          ["Départ", formatDate(request.startDate)],
          ["Retour", formatDate(request.returnDate)],
          ["Durée", `${days} jour(s)`],
        ])}
      </article>
    </section>

    <section class="section">
      <h2 class="section-title">Paiement</h2>
      <div class="payment-layout">
        <div>
          <table class="payment-table" aria-label="Détails du paiement">
            <tbody>
              <tr><td>Sous-total location</td><td>${escapeHtml(formatMoney(subtotal))}</td></tr>
              <tr><td>Taxes${pricingConfig.taxRatePercent > 0 ? ` (${pricingConfig.taxRatePercent}%)` : ""}</td><td>${escapeHtml(formatMoney(taxes))}</td></tr>
              <tr><td>Assurance</td><td>${escapeHtml(formatMoney(insurance))}</td></tr>
              ${showDepositAmount ? `<tr class="deposit"><td>Caution remboursable</td><td>${escapeHtml(formatMoney(depositAmount))}</td></tr>` : ""}
              <tr class="total"><td>Total location</td><td>${escapeHtml(formatMoney(total))}</td></tr>
            </tbody>
          </table>
          <div class="payment-note">${escapeHtml(paymentNote)}</div>
        </div>
        <div class="side-stack">
          <div class="mini-box">
            <small>Date de paiement</small>
            <strong>${escapeHtml(formatDateTime(paidAt))}</strong>
          </div>
          <div class="mini-box">
            <small>Mode de paiement</small>
            <strong>${escapeHtml(paymentMethod(request.paymentMethod))}</strong>
          </div>
          <div class="mini-box">
            <small>Référence</small>
            <strong>${escapeHtml(receiptNumber)}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Vérification</h2>
      <div class="verification">
        <img class="qr" src="${qrDataUrl}" alt="QR code de vérification" />
        <div class="verify-copy">
          <p>Ce reçu peut être vérifié en ligne.</p>
          <a href="${escapeHtml(verificationUrl)}">${escapeHtml(verificationUrl)}</a>
          <p style="margin-top: 6px; color: var(--muted);">Document généré automatiquement par Location Auto Maroc.</p>
        </div>
        <div class="signatures">
          <div class="signature agency">
            <small>Signature agence</small>
            <div class="signature-line"></div>
          </div>
          <div class="signature">
            <small>Signature client</small>
            <div class="signature-line"></div>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div>
        <strong>${escapeHtml(companyName)}</strong>
        <span>${escapeHtml(companyCity)}, Maroc</span>
      </div>
      <div class="right">Paiement en agence uniquement · Reçu archivable</div>
    </footer>
  </main>
</body>
</html>`;

  return html;
}

type PdfRow = {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "default" | "muted" | "warning";
};

async function buildReceiptPdfLegacyCanvas(args: ReceiptArgs) {
  const { settings, request, receiptNumber, verificationUrl, baseUrl } = args;
  const car = request.car ?? {};
  const companyName = settings.brandName || "Location Auto Maroc";
  const companyCity = settings.city || "Casablanca";
  const companyAddress = settings.address || `${companyCity}, Maroc`;
  const companyPhone = settings.phone || "+212600000000";
  const paidAt = request.paidAtAgencyAt ? new Date(request.paidAtAgencyAt) : new Date();
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

  const [qrBuffer, logoBuffer] = await Promise.all([
    QRCode.toBuffer(verificationUrl, { margin: 1, width: 180 }),
    fetchImageBuffer(settings.logoUrl, baseUrl),
  ]);

  const doc = new PDFDocument({
    size: "A4",
    margin: 36,
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

  doc.on("error", () => {
    // The promise above handles the failure path.
  });

  const colors = {
    navy: "#163a72",
    accent: "#1f56b4",
    text: "#10213d",
    muted: "#667085",
    line: "#d8e1ec",
    paper: "#ffffff",
    soft: "#f7f9fc",
    warning: "#8b5a00",
  } as const;

  const pageLeft = doc.page.margins.left;
  const pageTop = doc.page.margins.top;
  const pageRight = doc.page.width - doc.page.margins.right;
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  const pageWidth = pageRight - pageLeft;
  const labelWidth = 128;
  let cursorY = pageTop;

  function ensureSpace(requiredHeight: number) {
    if (cursorY + requiredHeight <= pageBottom) return;
    doc.addPage({ size: "A4", margin: 36 });
    cursorY = doc.page.margins.top;
    drawHeader();
  }

  function drawHeader() {
    const bannerHeight = 78;
    ensureSpace(bannerHeight + 16);

    const bannerX = pageLeft;
    const bannerY = cursorY;
    const badgeSize = 42;
    const receiptBoxWidth = 198;
    const receiptBoxX = pageRight - receiptBoxWidth;

    doc.save();
    doc.fillColor(colors.navy).strokeColor(colors.navy);
    doc.roundedRect(bannerX, bannerY, pageWidth, bannerHeight, 14).fillAndStroke();
    doc.restore();

    const badgeX = bannerX + 14;
    const badgeY = bannerY + 18;
    let badgeRendered = false;

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
        badgeRendered = true;
      } catch {
        badgeRendered = false;
      } finally {
        doc.restore();
      }
    }

    if (!badgeRendered) {
      doc.save();
      doc.fillColor(colors.paper).strokeColor(colors.paper);
      doc.roundedRect(badgeX, badgeY, badgeSize, badgeSize, 11).fillAndStroke();
      doc.fillColor(colors.navy).font("Helvetica-Bold").fontSize(15);
      doc.text(companyInitials(companyName), badgeX, badgeY + 12, {
        width: badgeSize,
        align: "center",
      });
      doc.restore();
    }

    doc.fillColor(colors.paper).font("Helvetica-Bold").fontSize(18);
    doc.text(companyName, bannerX + 68, bannerY + 16, {
      width: pageWidth - receiptBoxWidth - 96,
    });
    doc.fillColor("#dbe7ff").font("Helvetica").fontSize(9);
    doc.text(`${companyCity}, Maroc`, bannerX + 68, bannerY + 40, {
      width: pageWidth - receiptBoxWidth - 96,
    });
    doc.text(companyPhone, bannerX + 68, bannerY + 54, {
      width: pageWidth - receiptBoxWidth - 96,
    });

    doc.save();
    doc.fillColor("#0f2d63").strokeColor("#5d86c9");
    doc.roundedRect(receiptBoxX, bannerY + 12, receiptBoxWidth, 54, 11).fillAndStroke();
    doc.restore();

    doc.fillColor("#dbe7ff").font("Helvetica").fontSize(8);
    doc.text("Receipt de paiement", receiptBoxX + 12, bannerY + 18, {
      width: receiptBoxWidth - 24,
      align: "right",
    });
    doc.fillColor(colors.paper).font("Helvetica-Bold").fontSize(14);
    doc.text(receiptNumber, receiptBoxX + 12, bannerY + 31, {
      width: receiptBoxWidth - 24,
      align: "right",
    });
    doc.fillColor("#dbe7ff").font("Helvetica").fontSize(8.5);
    doc.text(formatDate(paidAt), receiptBoxX + 12, bannerY + 48, {
      width: receiptBoxWidth - 24,
      align: "right",
    });

    cursorY = bannerY + bannerHeight + 16;
  }

  function drawCard(title: string, rows: PdfRow[]) {
    const cardPaddingX = 14;
    const cardPaddingY = 12;
    const titleSize = 10;
    const rowSize = 9;
    const rowGap = 6;
    const innerWidth = pageWidth - cardPaddingX * 2;
    const contentWidth = innerWidth - labelWidth - 12;
    const titleText = title.toUpperCase();

    doc.font("Helvetica-Bold").fontSize(titleSize);
    const titleHeight = doc.heightOfString(titleText, { width: innerWidth });

    const rowHeights = rows.map((row) => {
      const value = row.value || "—";
      doc.font("Helvetica").fontSize(rowSize);
      const labelHeight = doc.heightOfString(row.label, { width: labelWidth });
      doc.font(row.emphasis ? "Helvetica-Bold" : "Helvetica").fontSize(
        row.emphasis ? 9.5 : rowSize,
      );
      const valueHeight = doc.heightOfString(value, { width: contentWidth });
      return Math.max(labelHeight, valueHeight);
    });

    const bodyHeight =
      rowHeights.reduce((sum, height) => sum + height, 0) +
      Math.max(0, rows.length - 1) * rowGap;
    const cardHeight = cardPaddingY * 2 + titleHeight + 12 + bodyHeight;

    ensureSpace(cardHeight + 12);

    const cardX = pageLeft;
    const cardY = cursorY;

    doc.save();
    doc.fillColor(colors.paper).strokeColor(colors.line);
    doc.roundedRect(cardX, cardY, pageWidth, cardHeight, 12).fillAndStroke();
    doc.restore();

    doc.fillColor(colors.navy).font("Helvetica-Bold").fontSize(titleSize);
    doc.text(titleText, cardX + cardPaddingX, cardY + cardPaddingY, {
      width: innerWidth,
    });

    doc.moveTo(cardX + cardPaddingX, cardY + cardPaddingY + titleHeight + 6);
    doc.lineTo(cardX + pageWidth - cardPaddingX, cardY + cardPaddingY + titleHeight + 6);
    doc.strokeColor(colors.line).lineWidth(1).stroke();

    let rowY = cardY + cardPaddingY + titleHeight + 14;
    rows.forEach((row, index) => {
      const rowHeight = rowHeights[index];
      const value = row.value || "—";
      const valueColor =
        row.tone === "warning"
          ? colors.warning
          : row.emphasis
            ? colors.navy
            : colors.text;

      doc.fillColor(colors.muted).font("Helvetica").fontSize(rowSize);
      doc.text(row.label, cardX + cardPaddingX, rowY, {
        width: labelWidth,
      });

      doc.fillColor(valueColor)
        .font(row.emphasis ? "Helvetica-Bold" : "Helvetica")
        .fontSize(row.emphasis ? 9.5 : rowSize);
      doc.text(value, cardX + cardPaddingX + labelWidth + 12, rowY, {
        width: contentWidth,
        align: "right",
      });

      rowY += rowHeight;
      if (index < rows.length - 1) {
        rowY += rowGap;
        doc.moveTo(cardX + cardPaddingX, rowY - 3);
        doc.lineTo(cardX + pageWidth - cardPaddingX, rowY - 3);
        doc.strokeColor("#eef2f7").lineWidth(1).stroke();
      }
    });

    cursorY = cardY + cardHeight + 12;
  }

  function drawVerificationCard() {
    const cardPaddingX = 14;
    const cardPaddingY = 12;
    const titleSize = 10;
    const titleText = "VERIFICATION";
    const qrSize = 84;
    const textX = pageLeft + cardPaddingX + qrSize + 16;
    const textWidth = pageWidth - cardPaddingX * 2 - qrSize - 16;

    doc.font("Helvetica-Bold").fontSize(titleSize);
    const titleHeight = doc.heightOfString(titleText, { width: pageWidth - cardPaddingX * 2 });
    const intro = "Ce recu peut etre verifie en ligne.";
    const note = "Document genere automatiquement par Location Auto Maroc.";

    doc.font("Helvetica").fontSize(9);
    const introHeight = doc.heightOfString(intro, { width: textWidth });
    const urlHeight = doc.heightOfString(verificationUrl, {
      width: textWidth,
    });
    const noteHeight = doc.heightOfString(note, { width: textWidth });
    const bodyHeight = Math.max(qrSize, introHeight + urlHeight + noteHeight + 16);
    const cardHeight = cardPaddingY * 2 + titleHeight + 12 + bodyHeight;

    ensureSpace(cardHeight + 40);

    const cardX = pageLeft;
    const cardY = cursorY;

    doc.save();
    doc.fillColor(colors.paper).strokeColor(colors.line);
    doc.roundedRect(cardX, cardY, pageWidth, cardHeight, 12).fillAndStroke();
    doc.restore();

    doc.fillColor(colors.navy).font("Helvetica-Bold").fontSize(titleSize);
    doc.text(titleText, cardX + cardPaddingX, cardY + cardPaddingY, {
      width: pageWidth - cardPaddingX * 2,
    });

    doc.moveTo(cardX + cardPaddingX, cardY + cardPaddingY + titleHeight + 6);
    doc.lineTo(cardX + pageWidth - cardPaddingX, cardY + cardPaddingY + titleHeight + 6);
    doc.strokeColor(colors.line).lineWidth(1).stroke();

    const qrX = cardX + cardPaddingX;
    const qrY = cardY + cardPaddingY + titleHeight + 14;
    doc.save();
    doc.fillColor(colors.paper).strokeColor(colors.line);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 10).fillAndStroke();
    doc.restore();
    doc.image(qrBuffer, qrX + 4, qrY + 4, {
      fit: [qrSize - 8, qrSize - 8],
      align: "center",
      valign: "center",
    });

    const bodyY = qrY;
    doc.fillColor(colors.text).font("Helvetica").fontSize(9);
    doc.text(intro, textX, bodyY, { width: textWidth });
    doc.fillColor(colors.accent).font("Helvetica-Bold").fontSize(9);
    doc.text(verificationUrl, textX, bodyY + introHeight + 8, {
      width: textWidth,
      link: verificationUrl,
      underline: true,
    });
    doc.fillColor(colors.muted).font("Helvetica").fontSize(8);
    doc.text(note, textX, bodyY + introHeight + urlHeight + 12, {
      width: textWidth,
    });

    cursorY = cardY + cardHeight + 12;
  }

  function drawFooter() {
    const footerHeight = 52;
    ensureSpace(footerHeight + 8);

    const footerY = cursorY;
    const columnWidth = (pageWidth - 16) / 2;

    doc.fillColor(colors.muted).font("Helvetica-Bold").fontSize(8);
    doc.text("Signature agence", pageLeft, footerY, {
      width: columnWidth,
    });
    doc.moveTo(pageLeft, footerY + 16);
    doc.lineTo(pageLeft + columnWidth - 20, footerY + 16);
    doc.strokeColor(colors.navy).lineWidth(1).stroke();

    doc.text("Signature client", pageLeft + columnWidth + 16, footerY, {
      width: columnWidth,
    });
    doc.moveTo(pageLeft + columnWidth + 16, footerY + 16);
    doc.lineTo(pageRight, footerY + 16);
    doc.strokeColor(colors.navy).lineWidth(1).stroke();

    doc.fillColor(colors.muted).font("Helvetica").fontSize(8.25);
    doc.text(`${companyName} | ${companyCity}, Maroc`, pageLeft, footerY + 24, {
      width: pageWidth,
    });
    doc.text(
      "Paiement en agence uniquement · Recu archivable",
      pageLeft,
      footerY + 24,
      {
        width: pageWidth,
        align: "right",
      },
    );

    cursorY = footerY + footerHeight;
  }

  drawHeader();

  drawCard("Agence", [
    { label: "Nom", value: companyName },
    { label: "Telephone", value: companyPhone },
    { label: "Adresse", value: companyAddress },
  ]);

  drawCard("Client", [
    { label: "Nom complet", value: request.fullName },
    { label: "Telephone", value: request.phone || "—" },
    { label: "CIN / passeport", value: request.cinOrPassport || "—" },
    { label: "Email", value: request.email || "—" },
  ]);

  drawCard("Vehicule", [
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
    ...(showDepositAmount
      ? [{ label: "Caution remboursable", value: formatMoney(depositAmount) }]
      : []),
  ]);

  drawCard("Location", [
    { label: "Reservation", value: `#${request.id}` },
    { label: "Depart", value: formatDate(request.startDate) },
    { label: "Retour", value: formatDate(request.returnDate) },
    { label: "Duree", value: `${days} jour(s)` },
    { label: "Mode de paiement", value: paymentLabel },
  ]);

  drawCard("Paiement", [
    { label: "Sous-total location", value: formatMoney(subtotal) },
    {
      label: "Taxes",
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
    { label: "Date de paiement", value: formatDateTime(paidAt) },
    { label: "Reference", value: receiptNumber },
    {
      label: "Total location",
      value: formatMoney(total),
      emphasis: true,
    },
  ]);

  drawVerificationCard();
  drawFooter();

  doc.end();
  return pdfDone;
}

export async function buildReceiptPdf(args: ReceiptArgs) {
  return buildReceiptPdfSimple(args);
}
