import puppeteer from "puppeteer";
import QRCode from "qrcode";
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

export async function buildReceiptPdf(args: ReceiptArgs) {
  const html = await buildReceiptHtml(args);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForNetworkIdle({ idleTime: 250, timeout: 30_000 });
    await page.emulateMediaType("print");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
