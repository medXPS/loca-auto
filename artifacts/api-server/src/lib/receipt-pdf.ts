import puppeteer from "puppeteer";
import QRCode from "qrcode";
import { calculateIncludedTaxBreakdown, getCompanyPricingConfig } from "./pricing";

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
    second: "2-digit",
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
    | "handshake"
) {
  const paths = {
    building: '<path d="M4 21h16M6 21V4h12v17M9 8h2m2 0h2M9 12h2m2 0h2M9 16h2m2 0h2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5Z"/>',
    shield: '<path d="M12 3 5 6v5c0 4.8 2.8 8.2 7 10 4.2-1.8 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    phone: '<path d="M6.6 3.5 9 8 6.8 9.7c1.4 3 3.5 5.1 6.5 6.5L15 14l4.5 2.4-.5 4c-.1.9-.9 1.6-1.8 1.6C9 21.5 2.5 15 2 6.8 2 5.9 2.7 5.1 3.6 5l3-.5Z"/>',
    car: '<path d="m5 11 2-5h10l2 5M3 12h18v6H3zM6 18v2m12-2v2M6.5 15h.01m11 0h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6m-6 4h6"/>',
    handshake: '<path d="m7 12 3-3 3 3 4-4 4 4-6 6a3 3 0 0 1-4.2 0L3 10l4-4 3 3"/>',
  } as const;

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

function detailItem(icon: Parameters<typeof svgIcon>[0], label: string, value: string) {
  return `<div class="detail-item"><span class="mini-icon">${svgIcon(icon)}</span><span><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></span></div>`;
}

function partyRow(icon: Parameters<typeof svgIcon>[0], label: string, value: string) {
  return `<div class="party-row"><span>${svgIcon(icon)}</span><small>${escapeHtml(label)}</small><strong>${escapeHtml(value || "—")}</strong></div>`;
}

export async function buildReceiptHtml(args: ReceiptArgs) {
  const { settings, request, receiptNumber, verificationUrl, baseUrl } = args;
  const car = request.car ?? {};
  const companyName = settings.brandName || "Location Auto Maroc";
  const companyCity = settings.city || "Casablanca";
  const companyAddress = settings.address || `${companyCity}, Maroc`;
  const companyPhone = settings.phone || "+212600000000";
  const paidAt = request.paidAtAgencyAt ? new Date(request.paidAtAgencyAt) : new Date();
  const total = Number(request.finalPrice || request.estimatedTotalPrice || 0);
  const pricingConfig = getCompanyPricingConfig(settings);
  const taxBreakdown = calculateIncludedTaxBreakdown(total, pricingConfig.taxRatePercent);
  const taxes = taxBreakdown.taxAmount;
  const insurance = 0;
  const depositAmount = Number(car.depositAmount || 0);
  const showDepositAmount =
    Number.isFinite(depositAmount) && depositAmount > 0;
  const subtotal = taxBreakdown.subtotalBeforeTax;
  const days = Math.max(
    1,
    Math.floor((toLocalMidnight(request.returnDate).getTime() - toLocalMidnight(request.startDate).getTime()) / 86_400_000) + 1
  );
  const vehicleName = `${car.brand ?? ""} ${car.model ?? ""}`.trim() || `Véhicule #${request.carId}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 220 });
  const logoUrl = assetUrl(settings.logoUrl, baseUrl);
  const carImageUrl = assetUrl(car.mainImageUrl, baseUrl);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reçu ${escapeHtml(receiptNumber)}</title>
  <style>
    @page { size: A4; margin: 0; }
    :root {
      --navy:#082b63;
      --navy-2:#063b8e;
      --blue:#0b55c7;
      --ink:#0d1830;
      --muted:#65758f;
      --line:#d8e2f0;
      --soft:#f6f9ff;
      --paper:#ffffff;
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
    .print-tools { width: 210mm; margin: 18px auto; display: flex; justify-content: flex-end; }
    .print-tools button { border: 0; border-radius: 12px; padding: 11px 18px; background: var(--navy); color: white; font: 800 14px Arial; cursor: pointer; }
    .receipt-page {
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      margin: 0 auto 24px;
      padding: 9mm 10mm;
      background: var(--paper);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 4.2mm;
      border: 1px solid #cfd9e8;
    }
    .receipt-header { display: grid; grid-template-columns: 1.35fr .9fr; gap: 8mm; align-items: start; }
    .brand { display: flex; align-items: center; gap: 13px; margin-bottom: 14px; }
    .brand-logo, .brand-mark { width: 48px; height: 48px; flex: 0 0 auto; }
    .brand-logo { object-fit: contain; }
    .brand-mark { display: grid; place-items: center; color: var(--navy); }
    .brand-mark svg { width: 46px; height: 46px; fill: none; stroke: currentColor; stroke-width: 1.9; }
    .brand-name { color: var(--navy); font-size: 22px; font-weight: 900; line-height: 1.05; letter-spacing: .02em; text-transform: uppercase; }
    h1 { margin: 0 0 9px; color: var(--ink); font-size: 31px; line-height: 1; letter-spacing: -.03em; }
    h1 span { color: var(--navy); }
    .subtitle { margin: 0 0 6px; color: var(--blue); font-size: 14px; }
    .description { margin: 0; max-width: 455px; font-size: 11px; line-height: 1.45; color: var(--ink); }
    .contact-row { display: flex; flex-wrap: wrap; gap: 26px; margin-top: 13px; font-size: 10.5px; }
    .contact-row span { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
    .contact-row svg { width: 15px; height: 15px; fill: none; stroke: var(--navy); stroke-width: 2; }
    .receipt-box { border: 1px solid var(--line); border-radius: 16px; padding: 12px 16px; display: grid; grid-template-columns: 42px 1fr; gap: 12px; align-items: center; background: #fff; }
    .big-icon { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, var(--navy), var(--navy-2)); }
    .big-icon svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.9; }
    .receipt-number small, small { display: block; color: var(--muted); font-size: 8px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
    .receipt-number strong { display: block; margin-top: 3px; color: var(--blue); font-size: 22px; line-height: 1; letter-spacing: .02em; }
    .receipt-date { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); }
    .receipt-date strong { display: block; margin-top: 4px; font-size: 12px; color: var(--ink); }
    .car-cover { margin-top: 5mm; height: 31mm; border-radius: 14px; overflow: hidden; background: linear-gradient(135deg, #eef3f9, #dbe6f3); position: relative; }
    .car-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .car-cover.empty { display: grid; place-items: center; color: var(--navy); }
    .car-cover.empty svg { width: 70px; height: 70px; fill: none; stroke: currentColor; stroke-width: 1.4; opacity: .35; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5mm; }
    .card { border: 1px solid var(--line); border-radius: 15px; padding: 4.8mm 5.3mm; background: white; break-inside: avoid; page-break-inside: avoid; }
    .section-title { display: flex; align-items: center; gap: 12px; margin: 0 0 12px; color: var(--navy); font-size: 13px; font-weight: 900; letter-spacing: .03em; text-transform: uppercase; }
    .section-icon { width: 31px; height: 31px; border-radius: 50%; display: grid; place-items: center; color: white; background: var(--navy); flex: 0 0 auto; }
    .section-icon svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.9; }
    .party-row { display: grid; grid-template-columns: 17px 90px minmax(0, 1fr); gap: 9px; align-items: center; min-height: 22px; border-bottom: 1px solid #eef2f7; }
    .party-row:last-child { border-bottom: 0; }
    .party-row > span svg { width: 14px; height: 14px; fill: none; stroke: var(--navy); stroke-width: 1.9; }
    .party-row small { font-size: 7.5px; letter-spacing: 0; text-transform: none; font-weight: 500; }
    .party-row strong { min-width: 0; overflow-wrap: anywhere; font-size: 10px; }
    .details-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .detail-item { min-width: 0; display: flex; align-items: center; gap: 11px; padding: 8px 12px; }
    .detail-item:nth-child(3n+2), .detail-item:nth-child(3n+3) { border-left: 1px solid var(--line); }
    .detail-item:nth-child(n+4) { border-top: 1px solid var(--line); }
    .mini-icon { width: 22px; height: 22px; display: grid; place-items: center; color: var(--navy); flex: 0 0 auto; }
    .mini-icon svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.9; }
    .detail-item strong { display: block; margin-top: 3px; font-size: 11px; overflow-wrap: anywhere; }
    .payment-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9.5px; }
    .payment-table td { height: 19px; padding: 1px 10px; border-bottom: 1px solid var(--line); }
    .payment-table td:first-child { color: var(--muted); }
    .payment-table td:last-child { width: 165px; text-align: right; font-weight: 700; color: var(--ink); }
    .payment-table .total td { height: 31px; border: 0; background: linear-gradient(135deg, var(--navy), var(--navy-2)); color: #fff; font-size: 12px; font-weight: 900; text-transform: uppercase; }
    .payment-table .total td:first-child { border-radius: 9px 0 0 9px; }
    .payment-table .total td:last-child { border-radius: 0 9px 9px 0; color: #fff; font-size: 14px; }
    .payment-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20mm; margin-top: 9px; padding: 0 10px; font-size: 10px; }
    .payment-meta strong { display: block; margin-top: 3px; }
    .verification-grid { display: grid; grid-template-columns: 88px minmax(0, 1fr) minmax(0, 1.55fr); gap: 14px; align-items: start; }
    .qr { width: 82px; height: 82px; display: block; border: 1px solid var(--line); border-radius: 8px; padding: 3px; }
    .verify-help { font-size: 9.5px; line-height: 1.55; padding-right: 14px; border-right: 1px solid var(--line); }
    .verify-link a { color: var(--blue); font-size: 9.5px; font-weight: 800; overflow-wrap: anywhere; }
    .signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
    .signature-line { height: 31px; margin-top: 3px; border-bottom: 1.5px solid var(--navy); }
    .signature.agency .signature-line::after { content: "Location Auto Maroc"; display: block; padding: 9px 6px 0; color: var(--navy); font: italic 14px Georgia, serif; transform: rotate(-5deg); }
    .footer-bar { margin-top: auto; border-radius: 14px; padding: 14px 18px; background: linear-gradient(135deg, var(--navy), var(--navy-2)); color: white; display: grid; grid-template-columns: 42px 1fr 1px 170px; gap: 14px; align-items: center; }
    .footer-badge { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: var(--navy); background: white; }
    .footer-badge svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; }
    .footer-bar strong { display: block; font-size: 12px; }
    .footer-bar small { margin-top: 2px; color: rgba(255,255,255,.85); font-size: 9px; letter-spacing: 0; text-transform: none; font-weight: 500; }
    .footer-sep { height: 34px; background: rgba(255,255,255,.65); }
    .footer-help { font-size: 9px; line-height: 1.35; }
    .footer-help b { display: block; font-size: 10px; }
    @media print {
      html, body { background: white; }
      .print-tools { display: none !important; }
      .receipt-page { margin: 0; border: 0; }
    }
    @media screen and (max-width: 820px) {
      .print-tools { width: calc(100% - 24px); }
      .receipt-page { width: calc(100% - 24px); height: auto; min-height: 0; padding: 24px; overflow: visible; }
      .receipt-header, .grid-2, .verification-grid { grid-template-columns: 1fr; }
      .details-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .detail-item { border-left: 0 !important; border-top: 1px solid var(--line) !important; }
      .footer-bar { grid-template-columns: 42px 1fr; }
      .footer-sep, .footer-help { display: none; }
      .verify-help { border-right: 0; border-bottom: 1px solid var(--line); padding: 0 0 12px; }
    }
  </style>
</head>
<body>
  <div class="print-tools"><button type="button" onclick="window.print()">Imprimer le reçu</button></div>

  <main class="receipt-page">
    <header class="receipt-header">
      <div>
        <div class="brand">
          ${logoUrl ? `<img class="brand-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(companyName)}" />` : `<span class="brand-mark">${svgIcon("car")}</span>`}
          <div class="brand-name">${escapeHtml(companyName)}</div>
        </div>

        <h1><span>REÇU</span> DE PAIEMENT</h1>
        <p class="subtitle">Document archivable et imprimable</p>
        <p class="description">Ce document confirme le paiement effectué à l'agence et peut être conservé dans le dossier client.</p>

        <div class="contact-row">
          <span>${svgIcon("pin")} ${escapeHtml(`${companyCity}, Maroc`)}</span>
          <span>${svgIcon("phone")} ${escapeHtml(companyPhone)}</span>
        </div>
      </div>

      <aside>
        <div class="receipt-box">
          <span class="big-icon">${svgIcon("receipt")}</span>
          <div class="receipt-number">
            <small>N° reçu</small>
            <strong>${escapeHtml(receiptNumber)}</strong>
            <div class="receipt-date"><small>Date</small><strong>${escapeHtml(formatDate(paidAt))}</strong></div>
          </div>
        </div>
        ${carImageUrl ? `<div class="car-cover"><img src="${escapeHtml(carImageUrl)}" alt="${escapeHtml(vehicleName)}" /></div>` : `<div class="car-cover empty">${svgIcon("car")}</div>`}
      </aside>
    </header>

    <section class="grid-2">
      <article class="card">
        <h2 class="section-title"><span class="section-icon">${svgIcon("building")}</span>Agence</h2>
        ${partyRow("building", "Nom", companyName)}
        ${partyRow("phone", "Téléphone", companyPhone)}
        ${partyRow("pin", "Adresse", companyAddress)}
      </article>

      <article class="card">
        <h2 class="section-title"><span class="section-icon">${svgIcon("user")}</span>Client</h2>
        ${partyRow("user", "Nom complet", request.fullName)}
        ${partyRow("receipt", "CIN", request.cinOrPassport || "—")}
        ${partyRow("phone", "Téléphone", request.phone || "—")}
      </article>
    </section>

    <section class="card">
      <h2 class="section-title"><span class="section-icon">${svgIcon("calendar")}</span>Détails de la location</h2>
      <div class="details-grid">
        ${detailItem("calendar", "Réservation", `#${request.id}`)}
        ${detailItem("car", "Véhicule", vehicleName)}
        ${detailItem("calendar", "Départ", formatDate(request.startDate))}
        ${detailItem("calendar", "Retour", formatDate(request.returnDate))}
        ${detailItem("clock", "Durée", `${days} jour(s)`)}
        ${detailItem("building", "Agence", companyCity)}
      </div>
    </section>

    <section class="card">
      <h2 class="section-title"><span class="section-icon">${svgIcon("wallet")}</span>Détails de paiement</h2>
      <table class="payment-table" aria-label="Détails du paiement">
        <tbody>
          <tr><td>Prix journalier</td><td>${escapeHtml(formatMoney(Number(car.dailyPrice || total)))}</td></tr>
          <tr><td>Sous-total</td><td>${escapeHtml(formatMoney(subtotal))}</td></tr>
          <tr><td>Taxes${pricingConfig.taxRatePercent > 0 ? ` (${pricingConfig.taxRatePercent}%)` : ""}</td><td>${escapeHtml(formatMoney(taxes))}</td></tr>
          <tr><td>Assurance</td><td>${escapeHtml(formatMoney(insurance))}</td></tr>
          ${showDepositAmount ? `<tr><td>Caution (remboursable)</td><td>${escapeHtml(formatMoney(depositAmount))}</td></tr>` : ""}
          <tr><td>Réparations éventuelles</td><td>${escapeHtml(formatMoney(0))}</td></tr>
          <tr class="total"><td>Montant total payé</td><td>${escapeHtml(formatMoney(total))}</td></tr>
        </tbody>
      </table>
      <div class="payment-meta">
        <div><small>Date de paiement</small><strong>${escapeHtml(formatDateTime(paidAt))}</strong></div>
        <div><small>Mode de paiement</small><strong>${escapeHtml(paymentMethod(request.paymentMethod))}</strong></div>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title"><span class="section-icon">${svgIcon("shield")}</span>Vérification et signatures</h2>
      <div class="verification-grid">
        <img class="qr" src="${qrDataUrl}" alt="QR code de vérification" />
        <div class="verify-help">Scannez pour vérifier l'authenticité de ce reçu ou visitez le lien ci-dessous.</div>
        <div>
          <div class="verify-link"><small>Lien de vérification</small><a href="${escapeHtml(verificationUrl)}">${escapeHtml(verificationUrl)}</a></div>
          <div class="signatures">
            <div class="signature agency"><small>Signature agence</small><div class="signature-line"></div></div>
            <div class="signature"><small>Signature client</small><div class="signature-line"></div></div>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer-bar">
      <span class="footer-badge">${svgIcon("handshake")}</span>
      <div><strong>Merci de votre confiance.</strong><small>Nous vous remercions d'avoir choisi ${escapeHtml(companyName)}.</small></div>
      <span class="footer-sep"></span>
      <div class="footer-help"><b>Besoin d'aide ?</b>${escapeHtml(companyPhone)}</div>
    </footer>
  </main>
</body>
</html>`;
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
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 30_000 });
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
