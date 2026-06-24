import puppeteer from "puppeteer";
import QRCode from "qrcode";

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

function svgIcon(name: "building" | "user" | "calendar" | "wallet" | "shield" | "pin" | "phone" | "car" | "clock" | "receipt") {
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
  const taxes = Math.round(total * 0.1 * 100) / 100;
  const insurance = car.insuranceIncluded ? 0 : Math.round(total * 0.05 * 100) / 100;
  const subtotal = Math.round((total - taxes - insurance) * 100) / 100;
  const days = Math.max(1, Math.floor((toLocalMidnight(request.returnDate).getTime() - toLocalMidnight(request.startDate).getTime()) / 86_400_000) + 1);
  const vehicleName = `${car.brand ?? ""} ${car.model ?? ""}`.trim() || `Véhicule #${request.carId}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 220 });
  const logoUrl = assetUrl(settings.logoUrl, baseUrl);
  const vehicleImageUrl = assetUrl(car.mainImageUrl, baseUrl);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reçu ${escapeHtml(receiptNumber)}</title>
  <style>
    @page { size: A4; margin: 0; }
    :root { --navy:#102f66; --blue:#1f56b4; --ink:#10213d; --muted:#65748b; --line:#d7e0ec; --soft:#f7faff; }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; font-family: Arial, Helvetica, sans-serif; color: var(--ink); background: #eef2f7; }
    body { line-height: 1.4; }
    .print-tools { width: 210mm; margin: 18px auto; display: flex; justify-content: flex-end; }
    .print-tools button { border: 0; border-radius: 10px; padding: 11px 18px; background: var(--navy); color: white; font: 700 14px Arial; cursor: pointer; }
    .receipt-page { width: 210mm; min-height: 297mm; height: 297mm; margin: 0 auto 24px; padding: 8mm 9mm; box-sizing: border-box; overflow: hidden; background: white; display: flex; flex-direction: column; gap: 3.5mm; }
    .receipt-header { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(220px, .85fr); gap: 7mm; align-items: stretch; }
    .brand { display: flex; align-items: center; gap: 13px; margin-bottom: 10px; }
    .brand-logo { width: 45px; height: 45px; object-fit: contain; }
    .brand-mark { width: 45px; height: 45px; color: var(--navy); }
    .brand-mark svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.8; }
    .brand-name { font-size: 22px; line-height: 1.05; font-weight: 800; letter-spacing: .02em; color: var(--navy); text-transform: uppercase; max-width: 250px; }
    h1 { margin: 0 0 4px; color: var(--navy); font-size: 27px; line-height: 1.15; letter-spacing: .01em; }
    .subtitle { margin: 0 0 5px; color: var(--blue); font-size: 14px; }
    .description { margin: 0; max-width: 470px; color: var(--ink); font-size: 11px; line-height: 1.35; }
    .contact-row { display: flex; flex-wrap: wrap; gap: 22px; margin-top: 10px; padding-top: 9px; border-top: 1px solid var(--line); font-size: 10px; }
    .contact-row span { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; }
    .contact-row svg { width: 15px; height: 15px; fill: none; stroke: var(--navy); stroke-width: 1.8; }
    .header-side { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 10px; min-width: 0; }
    .receipt-info { border: 1px solid var(--line); border-radius: 16px; padding: 12px 14px; background: white; display: grid; grid-template-columns: 34px 1fr; gap: 10px; }
    .receipt-info > svg { width: 30px; height: 30px; fill: none; stroke: var(--navy); stroke-width: 1.7; }
    .receipt-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 12px; }
    .receipt-meta div:first-child { grid-column: 1 / -1; }
    small, .label { display: block; color: var(--muted); font-size: 8px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
    .receipt-meta strong { display: block; margin-top: 2px; color: var(--navy); font-size: 13px; }
    .vehicle-visual { min-height: 66px; overflow: hidden; border-radius: 15px; background: linear-gradient(135deg, #edf3fb, #dbe7f6); }
    .vehicle-visual img { display: block; width: 100%; height: 100%; max-height: 78px; object-fit: cover; object-position: center; }
    .card { border: 1px solid var(--line); border-radius: 18px; padding: 4.5mm 5mm; background: white; page-break-inside: avoid; break-inside: avoid; }
    .section-title { display: flex; align-items: center; gap: 11px; margin: 0 0 10px; color: var(--navy); font-size: 13px; font-weight: 800; letter-spacing: .02em; text-transform: uppercase; }
    .section-icon { width: 35px; height: 35px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; color: white; background: var(--navy); }
    .section-icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; }
    .party-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4.5mm; }
    .party-card { min-width: 0; }
    .party-row { display: grid; grid-template-columns: 16px 76px minmax(0, 1fr); gap: 8px; align-items: center; min-height: 20px; }
    .party-row + .party-row { margin-top: 4px; }
    .party-row > span svg { width: 14px; height: 14px; fill: none; stroke: var(--navy); stroke-width: 1.8; }
    .party-row small { font-size: 7.5px; letter-spacing: 0; text-transform: none; font-weight: 500; }
    .party-row strong { min-width: 0; overflow-wrap: anywhere; font-size: 9.5px; }
    .details-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .detail-item { min-width: 0; display: flex; align-items: center; gap: 10px; padding: 8px 10px; }
    .detail-item:nth-child(3n+2), .detail-item:nth-child(3n+3) { border-left: 1px solid var(--line); }
    .detail-item:nth-child(n+4) { border-top: 1px solid var(--line); }
    .detail-item .mini-icon { width: 26px; height: 26px; flex: 0 0 auto; display: grid; place-items: center; color: var(--navy); }
    .detail-item svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; }
    .detail-item strong { display: block; margin-top: 2px; font-size: 10.5px; overflow-wrap: anywhere; }
    .payment-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; }
    .payment-table td { height: 17px; padding: 1px 8px; border-bottom: 1px solid var(--line); }
    .payment-table td:first-child { color: var(--muted); }
    .payment-table td:last-child { width: 155px; text-align: right; color: var(--ink); }
    .payment-table .total td { height: 25px; border: 0; background: var(--navy); color: white; font-size: 10.5px; font-weight: 800; }
    .payment-table .total td:first-child { border-radius: 8px 0 0 8px; }
    .payment-table .total td:last-child { border-radius: 0 8px 8px 0; color: white; }
    .payment-table .meta td { border-bottom: 0; }
    .verification-grid { display: grid; grid-template-columns: 86px minmax(0, .95fr) minmax(0, 1.45fr); gap: 14px; align-items: stretch; }
    .qr { width: 82px; height: 82px; display: block; }
    .verification-copy { padding: 4px 14px 4px 0; border-right: 1px solid var(--line); font-size: 9px; }
    .verification-copy a { display: block; margin-top: 9px; color: var(--blue); font-weight: 700; overflow-wrap: anywhere; }
    .signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-items: end; }
    .signature { min-width: 0; }
    .signature-line { height: 34px; margin-top: 4px; border-bottom: 1px solid var(--navy); }
    .signature.agency .signature-line::after { content: "Location Auto Maroc"; display: block; padding: 10px 5px 0; color: var(--navy); font: italic 14px Georgia, serif; transform: rotate(-3deg); }
    .receipt-footer { margin-top: auto; min-height: 11mm; border-radius: 14px; padding: 8px 14px; color: white; background: var(--navy); display: grid; grid-template-columns: 1.4fr .75fr .75fr; gap: 10px; align-items: center; font-size: 8.5px; }
    .receipt-footer strong { display: block; font-size: 10px; }
    .receipt-footer span { display: flex; align-items: center; gap: 7px; }
    .receipt-footer svg { width: 14px; height: 14px; flex: 0 0 auto; fill: none; stroke: white; stroke-width: 1.8; }
    @media print {
      html, body { margin: 0; background: white; }
      .print-tools { display: none !important; }
      .receipt-page { margin: 0; page-break-inside: avoid; break-inside: avoid; overflow: hidden; }
    }
    @media screen and (max-width: 820px) {
      .print-tools { width: calc(100% - 24px); }
      .receipt-page { width: calc(100% - 24px); height: auto; min-height: 0; padding: 24px; overflow: visible; }
      .receipt-header, .party-grid, .verification-grid { grid-template-columns: 1fr; }
      .details-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .detail-item { border: 0 !important; border-top: 1px solid var(--line) !important; }
      .verification-copy { border-right: 0; border-bottom: 1px solid var(--line); padding: 0 0 15px; }
      .receipt-footer { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="print-tools"><button type="button" onclick="window.print()">Imprimer le reçu</button></div>
  <main class="receipt-page">
    <header class="receipt-header">
      <div>
        <div class="brand">
          ${logoUrl ? `<img class="brand-logo" src="${escapeHtml(logoUrl)}" alt="" />` : `<span class="brand-mark">${svgIcon("car")}</span>`}
          <div class="brand-name">${escapeHtml(companyName)}</div>
        </div>
        <h1>REÇU DE PAIEMENT</h1>
        <p class="subtitle">Document archivable et imprimable</p>
        <p class="description">Ce document confirme le paiement effectué auprès de l'agence et peut être conservé dans le dossier du client.</p>
        <div class="contact-row">
          <span>${svgIcon("pin")} ${escapeHtml(`${companyCity}, Maroc`)}</span>
          <span>${svgIcon("phone")} ${escapeHtml(companyPhone)}</span>
        </div>
      </div>
      <div class="header-side">
        <div class="receipt-info">
          ${svgIcon("receipt")}
          <div class="receipt-meta">
            <div><small>N° reçu</small><strong>${escapeHtml(receiptNumber)}</strong></div>
            <div><small>Date</small><strong>${escapeHtml(formatDate(paidAt))}</strong></div>
          </div>
        </div>
        ${vehicleImageUrl ? `<div class="vehicle-visual"><img src="${escapeHtml(vehicleImageUrl)}" alt="${escapeHtml(vehicleName)}" /></div>` : ""}
      </div>
    </header>

    <section class="party-grid">
      <article class="card party-card">
        <h2 class="section-title"><span class="section-icon">${svgIcon("building")}</span>Agence</h2>
        ${partyRow("building", "Nom", companyName)}
        ${partyRow("phone", "Téléphone", companyPhone)}
        ${partyRow("pin", "Adresse", companyAddress)}
      </article>
      <article class="card party-card">
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
          <tr><td>Taxes</td><td>${escapeHtml(formatMoney(taxes))}</td></tr>
          <tr><td>Assurance</td><td>${escapeHtml(formatMoney(insurance))}</td></tr>
          <tr><td>Réparations éventuelles</td><td>${escapeHtml(formatMoney(0))}</td></tr>
          <tr class="total"><td>Montant total payé</td><td>${escapeHtml(formatMoney(total))}</td></tr>
          <tr class="meta"><td>Date de paiement</td><td>${escapeHtml(formatDateTime(paidAt))}</td></tr>
          <tr class="meta"><td>Mode de paiement</td><td>${escapeHtml(paymentMethod(request.paymentMethod))}</td></tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2 class="section-title"><span class="section-icon">${svgIcon("shield")}</span>Vérification et signatures</h2>
      <div class="verification-grid">
        <img class="qr" src="${qrDataUrl}" alt="QR code de vérification" />
        <div class="verification-copy"><small>Vérification</small><a href="${escapeHtml(verificationUrl)}">${escapeHtml(verificationUrl)}</a></div>
        <div class="signatures">
          <div class="signature agency"><small>Signature agence</small><div class="signature-line"></div></div>
          <div class="signature"><small>Signature client</small><div class="signature-line"></div></div>
        </div>
      </div>
    </section>

    <footer class="receipt-footer">
      <div><strong>Merci de votre confiance.</strong>Pour toute question, contactez notre agence.</div>
      <span>${svgIcon("phone")} ${escapeHtml(companyPhone)}</span>
      <span>${svgIcon("pin")} ${escapeHtml(`${companyCity}, Maroc`)}</span>
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
