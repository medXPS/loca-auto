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
  if (method === "CARD_AT_AGENCY") return "Carte à l'agence";
  if (method === "BANK_TRANSFER") return "Virement bancaire";
  return "Espèces à l'agence";
}

function svgIcon(
  name:
    | "building"
    | "user"
    | "calendar"
    | "wallet"
    | "shield"
    | "pin"
    | "phone"
    | "car"
    | "clock"
    | "receipt"
    | "check",
) {
  const paths = {
    building:
      '<path d="M4 21h16M6 21V4h12v17M9 8h2m2 0h2M9 12h2m2 0h2M9 16h2m2 0h2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/>',
    wallet:
      '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5Z"/>',
    shield:
      '<path d="M12 3 5 6v5c0 4.8 2.8 8.2 7 10 4.2-1.8 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>',
    pin:
      '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    phone:
      '<path d="M6.6 3.5 9 8 6.8 9.7c1.4 3 3.5 5.1 6.5 6.5L15 14l4.5 2.4-.5 4c-.1.9-.9 1.6-1.8 1.6C9 21.5 2.5 15 2 6.8 2 5.9 2.7 5.1 3.6 5l3-.5Z"/>',
    car: '<path d="m5 11 2-5h10l2 5M3 12h18v6H3zM6 18v2m12-2v2M6.5 15h.01m11 0h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    receipt:
      '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6m-6 4h6"/>',
    check: '<path d="m5 13 4 4 10-12"/>',
  } as const;

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

function row(label: string, value: string, highlight = false) {
  return `<div class="row${highlight ? " highlight" : ""}"><span>${escapeHtml(
    label,
  )}</span><strong>${escapeHtml(value || "—")}</strong></div>`;
}

function metaItem(label: string, value: string) {
  return `<div class="meta-item"><small>${escapeHtml(
    label,
  )}</small><strong>${escapeHtml(value || "—")}</strong></div>`;
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
  const taxBreakdown = calculateIncludedTaxBreakdown(total, pricingConfig.taxRatePercent);
  const taxes = taxBreakdown.taxAmount;
  const insurance = 0;
  const dailyPriceValue = Number(car.dailyPrice ?? Number.NaN);
  const dailyPriceLabel =
    Number.isFinite(dailyPriceValue) && dailyPriceValue > 0
      ? formatMoney(dailyPriceValue)
      : "—";
  const depositAmount = Number(car.depositAmount ?? 0);
  const showDepositAmount = Number.isFinite(depositAmount) && depositAmount > 0;
  const paymentNote = showDepositAmount
    ? "La caution est distincte du revenu. Elle reste visible pour le client et peut être restituée a la fin de la location."
    : "Le montant ci-dessus correspond au paiement de la location valide en agence.";
  const subtotal = taxBreakdown.subtotalBeforeTax;
  const days = Math.max(
    1,
    Math.floor(
      (toLocalMidnight(request.returnDate).getTime() -
        toLocalMidnight(request.startDate).getTime()) /
        86_400_000,
    ) + 1,
  );
  const vehicleName =
    `${car.brand ?? ""} ${car.model ?? ""}`.trim() || `Véhicule #${request.carId}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 180,
  });
  const logoUrl = assetUrl(settings.logoUrl, baseUrl);
  const insuranceState =
    car.insuranceIncluded === true
      ? "Incluse"
      : car.insuranceIncluded === false
        ? "Non incluse"
        : "Non précisée";

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reçu ${escapeHtml(receiptNumber)}</title>
  <style>
    @page { size: A4; margin: 0; }
    :root {
      --navy: #123a72;
      --blue: #1f56b4;
      --ink: #10213d;
      --muted: #667085;
      --line: #d7e0ec;
      --soft: #f6f9ff;
      --paper: #ffffff;
      --success: #eaf7ef;
      --success-ink: #13704b;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      font-family: Arial, Helvetica, sans-serif;
      color: var(--ink);
      background: #eef3f9;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { line-height: 1.3; }
    .print-tools {
      width: 210mm;
      margin: 14px auto 0;
      display: flex;
      justify-content: flex-end;
    }
    .print-tools button {
      border: 0;
      border-radius: 12px;
      padding: 10px 16px;
      background: var(--navy);
      color: white;
      font: 700 13px Arial, sans-serif;
      cursor: pointer;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      margin: 0 auto 16px;
      padding: 8.5mm;
      background: var(--paper);
      border: 1px solid #d5deea;
      display: flex;
      flex-direction: column;
      gap: 4mm;
      overflow: hidden;
    }
    .header {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.95fr);
      gap: 4mm;
      align-items: stretch;
    }
    .brand-card,
    .meta-card,
    .card {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fff;
    }
    .brand-card {
      padding: 11px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    }
    .brand-top {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .brand-logo,
    .brand-fallback {
      width: 46px;
      height: 46px;
      flex: 0 0 auto;
      border-radius: 12px;
    }
    .brand-logo {
      object-fit: contain;
      background: white;
      padding: 4px;
      border: 1px solid var(--line);
    }
    .brand-fallback {
      display: grid;
      place-items: center;
      color: white;
      background: linear-gradient(135deg, var(--navy), var(--blue));
    }
    .brand-fallback svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.9;
    }
    .eyebrow {
      margin: 0 0 4px;
      color: var(--blue);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      color: var(--navy);
      font-size: 28px;
      line-height: 1.05;
      letter-spacing: -.03em;
    }
    .subtitle {
      margin: 6px 0 0;
      font-size: 11px;
      color: var(--muted);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--soft);
      color: var(--navy);
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }
    .chip svg {
      width: 13px;
      height: 13px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
    }
    .meta-card {
      padding: 12px;
      background: linear-gradient(135deg, var(--navy), #0f4a98);
      color: #fff;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 12px;
    }
    .meta-item small,
    .row span,
    .section-title small {
      display: block;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-weight: 700;
    }
    .meta-item small {
      color: rgba(255, 255, 255, .75);
    }
    .meta-item strong {
      display: block;
      margin-top: 3px;
      font-size: 12px;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,.13);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .status-badge svg {
      width: 14px;
      height: 14px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4mm;
    }
    .card {
      padding: 11px 12px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 10px;
      color: var(--navy);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .02em;
      text-transform: uppercase;
    }
    .section-title svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      flex: 0 0 auto;
    }
    .rows {
      display: grid;
      gap: 6px;
    }
    .row {
      display: grid;
      grid-template-columns: 92px minmax(0, 1fr);
      gap: 10px;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #eef2f7;
    }
    .row:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }
    .row span {
      color: var(--muted);
      line-height: 1.15;
    }
    .row strong {
      min-width: 0;
      text-align: right;
      font-size: 11px;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
    .row.highlight {
      padding: 8px 10px;
      border: 1px solid #cfe0ff;
      border-radius: 12px;
      background: #f4f8ff;
    }
    .row.highlight span {
      color: var(--blue);
    }
    .payment-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(220px, .85fr);
      gap: 4mm;
      align-items: start;
    }
    .payment-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 9.5px;
    }
    .payment-table td {
      padding: 6px 0;
      border-bottom: 1px solid #eef2f7;
      vertical-align: top;
    }
    .payment-table td:first-child {
      color: var(--muted);
      padding-right: 8px;
    }
    .payment-table td:last-child {
      text-align: right;
      font-weight: 700;
      word-break: break-word;
    }
    .payment-table .total td {
      border-top: 1px solid #c9d7ea;
      border-bottom: 0;
      padding-top: 8px;
      font-size: 11px;
      color: var(--navy);
      font-weight: 900;
    }
    .payment-table .deposit td:first-child {
      color: #b05600;
    }
    .payment-table .deposit td:last-child {
      color: #b05600;
    }
    .payment-note {
      margin-top: 9px;
      padding: 8px 10px;
      border-radius: 12px;
      background: #fff8ea;
      color: #8a5a00;
      font-size: 9px;
      line-height: 1.4;
    }
    .payment-meta {
      display: grid;
      gap: 8px;
    }
    .mini-box {
      padding: 9px 10px;
      border: 1px solid #dfe7f2;
      border-radius: 12px;
      background: #fafcff;
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
      font-size: 11px;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    .verification-layout {
      display: grid;
      grid-template-columns: 86px minmax(0, 1fr) minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }
    .qr-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
    }
    .qr-box img {
      width: 82px;
      height: 82px;
      padding: 4px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: white;
    }
    .qr-box span {
      font-size: 8px;
      color: var(--muted);
      text-align: center;
      line-height: 1.35;
    }
    .verification-copy {
      padding-right: 10px;
      border-right: 1px solid var(--line);
      font-size: 9px;
      line-height: 1.5;
    }
    .verification-copy p {
      margin: 0 0 8px;
    }
    .verification-copy a {
      color: var(--blue);
      font-weight: 700;
      word-break: break-all;
    }
    .hint {
      margin-top: 8px !important;
      color: var(--muted);
    }
    .signatures {
      display: grid;
      gap: 12px;
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
      border-bottom: 1.5px solid var(--navy);
    }
    .signature.agency .signature-line::after {
      content: "Location Auto Maroc";
      display: block;
      padding-top: 9px;
      color: var(--navy);
      font: italic 13px Georgia, serif;
      transform: rotate(-3deg);
    }
    .footer {
      margin-top: auto;
      padding-top: 6px;
      border-top: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 8.5px;
      color: var(--muted);
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
        padding: 20px;
        overflow: visible;
      }
      .header,
      .grid,
      .payment-layout,
      .verification-layout {
        grid-template-columns: 1fr;
      }
      .row {
        grid-template-columns: 1fr;
      }
      .row strong {
        text-align: left;
      }
      .verification-copy {
        border-right: 0;
        border-bottom: 1px solid var(--line);
        padding-right: 0;
        padding-bottom: 12px;
      }
      .footer {
        flex-direction: column;
        align-items: flex-start;
      }
      .footer .right {
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <div class="print-tools">
    <button type="button" onclick="window.print()">Imprimer le reçu</button>
  </div>

  <main class="page">
    <header class="header">
      <section class="brand-card">
        <div class="brand-top">
          ${logoUrl
            ? `<img class="brand-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(companyName)}" />`
            : `<span class="brand-fallback">${svgIcon("car")}</span>`}
          <div>
            <p class="eyebrow">${escapeHtml(companyName)}</p>
            <h1>Reçu de paiement</h1>
            <p class="subtitle">Paiement validé en agence. Document lisible, simple et archivable.</p>
          </div>
        </div>
        <div class="chips">
          <span class="chip">${svgIcon("check")}Paiement agence</span>
          <span class="chip">${svgIcon("shield")}Vérification QR</span>
          <span class="chip">${svgIcon("receipt")}Réf. ${escapeHtml(receiptNumber)}</span>
        </div>
      </section>

      <aside class="meta-card">
        <div class="meta-grid">
          ${metaItem("N° reçu", receiptNumber)}
          ${metaItem("Date", formatDate(paidAt))}
          ${metaItem("Client", request.fullName)}
          ${metaItem("Véhicule", vehicleName)}
        </div>
        <div class="status-badge">${svgIcon("check")}Payé à l'agence</div>
      </aside>
    </header>

    <section class="grid">
      <article class="card">
        <h2 class="section-title">${svgIcon("building")}Agence</h2>
        <div class="rows">
          ${row("Nom", companyName)}
          ${row("Téléphone", companyPhone)}
          ${row("Adresse", companyAddress)}
        </div>
      </article>

      <article class="card">
        <h2 class="section-title">${svgIcon("user")}Client</h2>
        <div class="rows">
          ${row("Nom complet", request.fullName)}
          ${row("Téléphone", request.phone || "—")}
          ${row("CIN / passeport", request.cinOrPassport || "—")}
        </div>
      </article>
    </section>

    <section class="grid">
      <article class="card">
        <h2 class="section-title">${svgIcon("car")}Véhicule</h2>
        <div class="rows">
          ${row("Modèle", vehicleName)}
          ${row("Prix journalier", dailyPriceLabel)}
          ${row("Assurance", insuranceState)}
          ${showDepositAmount ? row("Caution remboursable", formatMoney(depositAmount), true) : ""}
        </div>
      </article>

      <article class="card">
        <h2 class="section-title">${svgIcon("calendar")}Location</h2>
        <div class="rows">
          ${row("Réservation", `#${request.id}`)}
          ${row("Départ", formatDate(request.startDate))}
          ${row("Retour", formatDate(request.returnDate))}
          ${row("Durée", `${days} jour(s)`)}
        </div>
      </article>
    </section>

    <section class="card">
      <h2 class="section-title">${svgIcon("wallet")}Paiement</h2>
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
        <div class="payment-meta">
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

    <section class="card">
      <h2 class="section-title">${svgIcon("shield")}Vérification</h2>
      <div class="verification-layout">
        <div class="qr-box">
          <img src="${qrDataUrl}" alt="QR code de vérification" />
          <span>Scanner pour vérifier l'authenticité du reçu</span>
        </div>
        <div class="verification-copy">
          <p>Ce reçu peut être vérifié en ligne via le lien ci-dessous.</p>
          <a href="${escapeHtml(verificationUrl)}">${escapeHtml(verificationUrl)}</a>
          <p class="hint">Document généré automatiquement par Location Auto Maroc.</p>
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
        <span>${escapeHtml(companyCity)}, Maroc · ${escapeHtml(companyPhone)}</span>
      </div>
      <div class="right">Paiement agence uniquement · Reçu archivable</div>
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
    await page.waitForNetworkIdle({ idleTime: 300, timeout: 30_000 });
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
