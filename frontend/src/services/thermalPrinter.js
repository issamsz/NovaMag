/**
 * Impression Directe et Silencieuse de Tickets de Caisse (Thermal Printer)
 * NovaMag POS
 */
import { generateCode128Svg, generateQrCodeSvg } from './barcodeGenerator';
import { triggerCashDrawerHardware } from './api';

export const printThermalTicketDirect = (invoice, settings = {}) => {
  if (!invoice) return;

  const paperWidth = Number(settings.thermalPaperWidth) > 0 ? Number(settings.thermalPaperWidth) : 80;
  const margin = Number(settings.thermalMargin) >= 0 ? Number(settings.thermalMargin) : (paperWidth <= 60 ? 4 : 7);
  const density = Number(settings.thermalDensity) > 0 ? Number(settings.thermalDensity) : 100; // Densité / Noirceur (Clair ou Foncé)
  const heightScale = Number(settings.thermalHeightScale) > 0 ? Number(settings.thermalHeightScale) : 100; // Hauteur du ticket
  const printableWidth = Math.max(30, paperWidth - (margin * 2));
  
  // Hauteur et espacements verticaux
  const heightRatio = heightScale / 100;
  const baseFontSize = Math.max(8, Math.round(11 * heightRatio));
  const itemFontSize = Math.max(8, Math.round(10 * heightRatio));
  const titleFontSize = Math.max(11, Math.round(15 * heightRatio));
  const totalFontSize = Math.max(11, Math.round(14 * heightRatio));
  const rowPadding = Math.max(1, Math.round(3 * heightRatio));
  const dividerMargin = Math.max(2, Math.round(5 * heightRatio));

  // Densité / Noirceur thermique (Rendre claire ou foncée l'écriture)
  let textStroke = 'none';
  let textShadow = 'none';
  let bodyColor = '#000000';
  let defaultFontWeight = '600';
  let boldFontWeight = '800';

  if (density <= 80) {
    bodyColor = '#374151'; // Écriture plus claire / douce
    defaultFontWeight = '500';
    boldFontWeight = '700';
  } else if (density <= 105) {
    bodyColor = '#000000'; // Noir standard
    defaultFontWeight = '600';
    boldFontWeight = '800';
  } else if (density <= 125) {
    bodyColor = '#000000'; // Écriture foncée
    defaultFontWeight = '700';
    boldFontWeight = '900';
    textStroke = '0.25px #000000';
    textShadow = '0 0 0.35px #000000';
  } else {
    bodyColor = '#000000'; // Écriture très foncée / noir intense
    defaultFontWeight = '800';
    boldFontWeight = '900';
    textStroke = '0.45px #000000';
    textShadow = '0 0 0.6px #000000';
  }

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag';
  const phone = settings.phone || settings.phoneMobile || settings.phoneLandline || '';
  const address = settings.address || '';
  const showBarcode = settings.showBarcodeOnReceipt ?? true;

  // Création d'un conteneur invisible d'impression directe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow || iframe.contentDocument;
  const iframeDoc = doc.document || doc;

  const itemsHtml = (invoice.items || []).map((it) => {
    const qty = it.quantity || 1;
    const price = it.price || 0;
    const total = typeof it.customTotal === 'number' ? it.customTotal : qty * price;
    const lotBadge = it.batchNumber ? `<div style="font-size: ${Math.max(7, Math.round(8 * heightRatio))}px; color: #444;">[Lot: ${it.batchNumber}]</div>` : '';
    
    return `
      <tr style="border-bottom: 1px dashed #bbb;">
        <td style="padding: ${rowPadding}px 0; text-align: left; vertical-align: top;">
          <div style="font-weight: ${boldFontWeight}; font-size: ${itemFontSize}px;">${it.name}</div>
          ${lotBadge}
          <div style="font-size: ${Math.max(7, Math.round(9 * heightRatio))}px; opacity: 0.9;">${qty} x ${price.toLocaleString('fr-FR')} DA</div>
        </td>
        <td style="padding: ${rowPadding}px 0; text-align: right; vertical-align: top; font-weight: ${boldFontWeight}; font-size: ${itemFontSize}px;">
          ${total.toLocaleString('fr-FR')} DA
        </td>
      </tr>
    `;
  }).join('');

  const barcodeNumber = invoice.invoiceNumber?.replace(/[^0-9]/g, '') || String(invoice.id || '2026001');

  const ticketDesign = settings.ticketDesign || 'Ticket 1';
  let designSpecificBody = '';

  if (ticketDesign === 'Ticket 2') {
    // ── MODÈLE TICKET 2 : Encadré avec QR Code et boîte client ──
    const qrSvg = generateQrCodeSvg(`TICKET:${invoice.invoiceNumber || invoice.id}|TOTAL:${invoice.total}`, 65);
    designSpecificBody = `
      <div style="border: 2px solid #000; border-radius: 6px; padding: 10px; margin: 4px;">
        <div class="text-center" style="border-bottom: 2px dashed #000; padding-bottom: 8px;">
          <div style="font-size: 18px; font-weight: 900; letter-spacing: 0.5px;">★ ${storeName} ★</div>
          <div class="subtitle" style="font-size: 10px; font-weight: bold;">TICKET DE CAISSE OFFICIEL</div>
          ${phone ? `<div class="subtitle">Tél : ${phone}</div>` : ''}
        </div>

        <div style="padding: 6px 0; border-bottom: 1px dashed #000; font-size: 10px;">
          <div style="display: flex; justify-content: space-between;"><strong>TICKET :</strong> <span>${invoice.invoiceNumber || '#' + invoice.id}</span></div>
          <div style="display: flex; justify-content: space-between;"><strong>DATE :</strong> <span>${invoice.dateStr || new Date().toLocaleString('fr-FR')}</span></div>
          <div style="display: flex; justify-content: space-between;"><strong>CLIENT :</strong> <span>${invoice.customer || 'Client Comptoir'}</span></div>
          <div style="display: flex; justify-content: space-between;"><strong>CAISSIER :</strong> <span>${invoice.cashier || 'Admin'}</span></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 8px 0;">
          <thead>
            <tr style="border-bottom: 1.5px solid #000; font-size: 10px;">
              <th style="text-align: left; padding-bottom: 3px;">DÉSIGNATION</th>
              <th style="text-align: right; padding-bottom: 3px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 2px solid #000; padding-top: 6px; margin-top: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900;">
            <span>TOTAL :</span>
            <span>${(Number(invoice.total) || 0).toLocaleString('fr-FR')} DA</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 3px;">
            <span>RÈGLEMENT :</span>
            <span style="font-weight: bold; text-transform: uppercase;">${invoice.paymentMethod || 'Espèces'}</span>
          </div>
        </div>

        <div style="margin-top: 10px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          ${qrSvg}
          <div style="font-size: 9px; margin-top: 4px; font-weight: bold;">Scannez pour vérification de conformité</div>
          <div style="font-size: 9px; margin-top: 3px; font-style: italic;">*** MERCI DE VOTRE VISITE ***</div>
        </div>
      </div>
    `;
  } else if (ticketDesign === 'Ticket 3') {
    // ── MODÈLE TICKET 3 : Superette compact & Bannière inversée ──
    designSpecificBody = `
      <div class="ticket-container" style="padding: 2px;">
        <div class="text-center" style="margin-bottom: 6px;">
          <div style="font-size: 20px; font-weight: 900; background: #000; color: #fff; padding: 4px 6px; letter-spacing: 1px;">${storeName}</div>
          <div style="font-size: 10px; font-weight: bold; margin-top: 3px;">SUPERETTE & COMMERCE ALIMENTAIRE</div>
          ${phone ? `<div style="font-size: 9.5px;">Tél: ${phone}</div>` : ''}
        </div>

        <div style="font-size: 10px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0;">
          <div style="display: flex; justify-content: space-between;"><span>#${invoice.invoiceNumber || invoice.id}</span> <span>${invoice.dateStr || new Date().toLocaleString('fr-FR')}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Clt: ${invoice.customer || 'Passage'}</span> <span>Caisse 01</span></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 6px 0;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background: #000; color: #fff; padding: 6px; text-align: center; margin: 8px 0; border-radius: 3px;">
          <div style="font-size: 10px; letter-spacing: 0.5px;">TOTAL À PAYER</div>
          <div style="font-size: 20px; font-weight: 900; font-family: monospace;">${(Number(invoice.total) || 0).toLocaleString('fr-FR')} DA</div>
        </div>

        <div style="font-size: 10px; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between;"><span>Reçu :</span> <span>${(Number(invoice.amountPaid) || Number(invoice.total) || 0).toLocaleString('fr-FR')} DA</span></div>
          ${Number(invoice.change) > 0 ? `<div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Rendu :</span> <span>${Number(invoice.change).toLocaleString('fr-FR')} DA</span></div>` : ''}
        </div>

        ${showBarcode ? `
          <div class="barcode-box" style="margin-top: 6px; text-align: center;">
            ${generateCode128Svg(invoice.invoiceNumber || barcodeNumber, {
              height: 32,
              barWidth: 1.4,
              showText: true
            })}
          </div>
        ` : ''}

        <div style="text-align: center; font-size: 9.5px; font-weight: bold; margin-top: 6px;">
          *** MERCI ET À BIENTÔT ***
        </div>
      </div>
    `;
  } else {
    // ── MODÈLE TICKET 1 : Standard épuré ──
    designSpecificBody = `
      <div class="ticket-container">
        <!-- En-tête magasin -->
        <div class="text-center">
          <div class="title">${storeName}</div>
          <div class="subtitle">Gestion de Stock & Point de Vente</div>
          ${phone ? `<div class="subtitle">Tél : ${phone}</div>` : ''}
          ${address ? `<div class="subtitle">${address}</div>` : ''}
        </div>

        <div class="divider"></div>

        <!-- Méta facture -->
        <div class="row">
          <span>Ticket N° :</span>
          <span class="bold">${invoice.invoiceNumber || '#' + invoice.id}</span>
        </div>
        <div class="row">
          <span>Date & Heure :</span>
          <span>${invoice.dateStr || new Date().toLocaleString('fr-FR')}</span>
        </div>
        <div class="row">
          <span>Client :</span>
          <span class="bold">${invoice.customer || 'Client Comptoir'}</span>
        </div>
        <div class="row">
          <span>Caisse :</span>
          <span>Caisse #01</span>
        </div>

        <div class="divider"></div>

        <!-- Liste des articles -->
        <table>
          <thead>
            <tr>
              <th style="text-align: left; padding-bottom: 2px;">Désignation</th>
              <th style="text-align: right; padding-bottom: 2px;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="double-divider"></div>

        <!-- Totaux & Règlement -->
        <div class="row grand-total">
          <span>TOTAL À PAYER :</span>
          <span>${(Number(invoice.total) || 0).toLocaleString('fr-FR')} DA</span>
        </div>
        <div class="row">
          <span>Mode de règlement :</span>
          <span class="bold">${invoice.paymentMethod === 'card' ? 'Carte Bancaire' : invoice.paymentMethod === 'credit' ? 'À Crédit' : 'Espèces'}</span>
        </div>
        <div class="row">
          <span>Montant reçu :</span>
          <span>${(Number(invoice.amountPaid) || Number(invoice.total) || 0).toLocaleString('fr-FR')} DA</span>
        </div>
        ${Number(invoice.change) > 0 ? `
          <div class="row bold">
            <span>Monnaie rendue :</span>
            <span>${Number(invoice.change).toLocaleString('fr-FR')} DA</span>
          </div>
        ` : ''}
        ${Number(invoice.debtGenerated) > 0 ? `
          <div class="row bold" style="color: #000;">
            <span>Dette enregistrée :</span>
            <span>+${Number(invoice.debtGenerated).toLocaleString('fr-FR')} DA</span>
          </div>
        ` : ''}

        <div class="divider"></div>

        ${showBarcode ? `
          <div class="barcode-box" style="margin-top: 8px; text-align: center;">
            <div style="margin-bottom: 2px; display: flex; justify-content: center;">
              ${generateCode128Svg(invoice.invoiceNumber || barcodeNumber, {
                height: Math.max(30, Math.round(38 * heightRatio)),
                barWidth: paperWidth <= 60 ? 1.25 : 1.55,
                showText: true
              })}
            </div>
          </div>
        ` : ''}

        <div class="footer-note">
          Merci de votre confiance et à bientôt !
        </div>
      </div>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket [${ticketDesign}] - ${invoice.invoiceNumber || 'Vente'}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, 'Courier New', Courier, monospace;
            color: ${bodyColor};
            background: #fff;
            margin: 0;
            padding: 0;
            line-height: ${(1.35 * heightRatio).toFixed(2)};
          }
          @media screen {
            html, body {
              width: 100% !important;
              max-width: 480px !important;
              margin: 0 auto !important;
              padding: 18px 24px !important;
              font-size: 12px !important;
            }
            .ticket-container { width: 100% !important; }
            .title { font-size: 20px !important; }
            .subtitle { font-size: 11px !important; }
            .row { font-size: 12px !important; margin: 3.5px 0 !important; }
            table th { font-size: 11px !important; }
            table td { font-size: 12px !important; }
            .grand-total { font-size: 18px !important; }
            .barcode-box svg { max-width: 280px !important; }
          }
          @media print {
            @page {
              size: ${paperWidth}mm auto;
              margin: 2mm ${margin}mm 4mm ${margin}mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace, 'Consolas', sans-serif;
              font-size: ${baseFontSize}px;
              font-weight: ${defaultFontWeight};
              width: ${printableWidth}mm;
              max-width: ${printableWidth}mm;
              -webkit-text-stroke: ${textStroke};
              text-shadow: ${textShadow};
            }
            .ticket-container { width: 100%; }
            .title { font-size: ${titleFontSize}px; }
            .subtitle { font-size: ${Math.max(7, Math.round(9 * heightRatio))}px; }
            .row { font-size: ${Math.max(7, Math.round(9.5 * heightRatio))}px; }
            table th { font-size: ${Math.max(7, Math.round(9 * heightRatio))}px; }
            .grand-total { font-size: ${totalFontSize}px; }
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: ${boldFontWeight}; }
          .title { font-weight: 900; letter-spacing: 0.5px; }
          .subtitle { margin-top: ${Math.max(1, Math.round(2 * heightRatio))}px; }
          .divider { border-top: 1px dashed ${bodyColor}; margin: ${dividerMargin}px 0; }
          .double-divider { border-top: 2px solid ${bodyColor}; margin: ${dividerMargin + 1}px 0; }
          .row { display: flex; justify-content: space-between; align-items: center; margin: ${Math.max(1, Math.round(2 * heightRatio))}px 0; }
          .row span { white-space: nowrap; }
          table { width: 100%; border-collapse: collapse; margin: ${dividerMargin - 1}px 0; }
          th { text-transform: uppercase; border-bottom: 1px solid ${bodyColor}; padding-bottom: ${rowPadding}px; font-weight: ${boldFontWeight}; }
          .grand-total { font-weight: 900; padding: ${rowPadding}px 0; }
          .footer-note { font-size: ${Math.max(8, Math.round(9 * heightRatio))}px; margin-top: ${dividerMargin + 3}px; text-align: center; font-style: italic; }
          .barcode-box { text-align: center; margin-top: ${dividerMargin}px; }
        </style>
      </head>
      <body>
        ${designSpecificBody}
      </body>
    </html>
  `;

  // Déclenchement selon le mode (Aperçu à l'écran si silencieux décoché, ou impression directe)
  triggerSilentIframePrint(htmlContent, settings, {
    title: `Ticket de Caisse #${invoice.invoiceNumber || invoice.id}`,
    format: 'thermal',
    widthMm: paperWidth
  });
};

/**
 * Commande d'Ouverture Physique & Sonore du Tiroir-Caisse
 * Envoie la commande d'impulsion électrique ESC/POS (Port RJ11/RJ12 de l'imprimante thermique)
 * et déclenche le retour sonore authentique d'ouverture mécanique
 */
export const triggerCashDrawerOpen = async (settings = {}) => {
  // 1. Déclenchement physique matériel via le backend NovaMag (Spooler Windows Win32 RAW / Port COM)
  try {
    triggerCashDrawerHardware(settings);
  } catch (e) {
    console.warn('[Hardware cash drawer trigger warning]:', e);
  }

  // 2. Retour sonore mécanique réaliste (Web Audio API)
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Déclic mécanique du loquet (latch release)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(110, now + 0.08);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.08);

      // Tintement de clochette métallique d'ouverture de caisse (Bell chime 1760Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now + 0.04);
      gain2.gain.setValueAtTime(0.35, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.6);
    }
  } catch (e) {}

  // 3. Commande d'impulsion via conteneur d'impression silencieuse navigateur
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow || iframe.contentDocument;
    const iframeDoc = doc.document || doc;

    const commandCode = settings.cashDrawerOpenCommand || 'esc_p_0';
    // Séquence ESC/POS d'impulsion 24V : ESC p 0 25 250 (\x1b\x70\x00\x19\xfa)
    const kickBytes = commandCode === 'esc_p_1' ? '\x1b\x70\x01\x19\xfa' : '\x1b\x70\x00\x19\xfa';

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html><html><head><style>@page{margin:0;size:5mm 5mm;}body{margin:0;padding:0;}</style></head><body><!-- DRAWER_KICK: ${kickBytes} --></body></html>`);
    iframeDoc.close();

    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1500);
  } catch (e) {}
};

/**
 * Convertit un montant en toutes lettres en français (ex: 8500 -> Huit mille cinq cents dinars algériens)
 */
export function numberToFrenchWords(num) {
  const n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'Zéro dinar algérien';

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

  function convertGroup(val) {
    let str = '';
    const h = Math.floor(val / 100);
    const r = val % 100;

    if (h > 0) {
      if (h === 1) str += 'cent';
      else str += units[h] + ' cents';
      if (r > 0) str += ' ';
    }

    if (r > 0) {
      if (r < 20) {
        str += units[r];
      } else if (r < 70) {
        const t = Math.floor(r / 10);
        const u = r % 10;
        str += tens[t];
        if (u === 1) str += ' et un';
        else if (u > 1) str += '-' + units[u];
      } else if (r < 80) {
        const u = r - 60;
        str += 'soixante';
        if (u === 11) str += ' et onze';
        else str += '-' + units[u];
      } else if (r < 90) {
        const u = r - 80;
        str += 'quatre-vingt';
        if (u === 0) str += 's';
        else str += '-' + units[u];
      } else {
        const u = r - 80;
        str += 'quatre-vingt-' + units[u];
      }
    }
    return str;
  }

  let words = '';
  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const remainder = n % 1000;

  if (millions > 0) {
    if (millions === 1) words += 'un million ';
    else words += convertGroup(millions) + ' millions ';
  }

  if (thousands > 0) {
    if (thousands === 1) words += 'mille ';
    else words += convertGroup(thousands) + ' mille ';
  }

  if (remainder > 0) {
    words += convertGroup(remainder) + ' ';
  }

  words = words.trim();
  const formatted = words.charAt(0).toUpperCase() + words.slice(1);
  return `${formatted} dinars algériens`;
}

/**
 * Convertit un montant en toutes lettres en arabe (ex: 89000 -> تسعة وثمانون ألف دينار جزائري)
 */
export function numberToArabicWords(num) {
  const n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'صفر';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(val) {
    if (val === 0) return '';
    const h = Math.floor(val / 100);
    const rem = val % 100;
    const parts = [];

    if (h > 0) {
      parts.push(hundreds[h]);
    }

    if (rem > 0) {
      if (rem <= 10) {
        parts.push(ones[rem]);
      } else if (rem < 20) {
        parts.push(teens[rem - 10]);
      } else {
        const u = rem % 10;
        const t = Math.floor(rem / 10);
        if (u > 0) {
          parts.push(ones[u] + ' و' + tens[t]);
        } else {
          parts.push(tens[t]);
        }
      }
    }

    return parts.join(' و');
  }

  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const remainder = n % 1000;

  const result = [];

  if (millions > 0) {
    if (millions === 1) result.push('مليون');
    else if (millions === 2) result.push('مليونان');
    else if (millions >= 3 && millions <= 10) result.push(convertGroup(millions) + ' ملايين');
    else result.push(convertGroup(millions) + ' مليون');
  }

  if (thousands > 0) {
    if (thousands === 1) result.push('ألف');
    else if (thousands === 2) result.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) result.push(convertGroup(thousands) + ' آلاف');
    else result.push(convertGroup(thousands) + ' ألف');
  }

  if (remainder > 0) {
    result.push(convertGroup(remainder));
  }

  return result.join(' و');
}

/**
 * Helper de formatage de date en DD/MM/YYYY
 */
export function formatDateDMY(dateStr) {
  if (!dateStr) return '';
  const clean = String(dateStr).slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return clean;
}

/**
 * Helper d'exécution d'impression silencieuse iframe / Electron
 */
export function triggerSilentIframePrint(htmlContent, settings = {}, options = {}) {
  const isDirectSilent = settings.directSilentPrint !== false && !options.forcePreview;

  // 1. Mode Aperçu Avant Impression Interactif (quand l'impression silencieuse est décochée ou aperçu forcé)
  if (!isDirectSilent || options.forcePreview) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('novamag_show_print_preview', {
        detail: {
          title: options.title || 'Aperçu du Document',
          html: htmlContent,
          format: options.format || 'thermal',
          widthMm: options.widthMm || Number(settings.thermalPaperWidth) || 80,
          settings: settings
        }
      }));
      return;
    }
  }

  // 2. Priorité absolue : Impression directe et silencieuse via Electron API si activée
  if (typeof window !== 'undefined' && window.electronAPI?.printDirect) {
    const targetPrinter = (settings.printerTicket === 'default' || settings.ticketPrinter === 'default')
      ? (settings.defaultPrinter || '') 
      : (settings.printerTicket || settings.ticketPrinter || '');

    window.electronAPI.printDirect({
      html: htmlContent,
      deviceName: targetPrinter || '',
      silent: true
    }).catch((err) => {
      console.warn('[Electron Print Error]:', err);
    });
    return;
  }

  // 2. Fallback pour navigateur web classique
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow || iframe.contentDocument;
  const iframeDoc = doc.document || doc;

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.warn('[Direct Print Fallback]:', err);
      try { window.print(); } catch (e) {}
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 4000);
    }
  }, 350);
}

/**
 * ══ 1. Impression Thermique d'un Reçu de Versement sur Dette (Conforme Photo 2) ══
 */
export const printDebtReceiptThermal = (payment, customer, settings = {}) => {
  if (!payment || !customer) return;

  const paperWidth = Number(settings.thermalPaperWidth) > 0 ? Number(settings.thermalPaperWidth) : 80;
  const margin = Number(settings.thermalMargin) >= 0 ? Number(settings.thermalMargin) : 6;
  const printableWidth = Math.max(30, paperWidth - (margin * 2));
  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag';
  const phone = settings.phone || settings.phoneMobile || settings.phoneLandline || '';
  const receiptCode = payment.receiptNumber || `REC-${new Date().getFullYear()}-${String(payment.id || Date.now()).slice(-4)}`;
  const barcodeSvg = generateCode128Svg(receiptCode, { height: 36, barWidth: 1.4 });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Reçu de Paiement - ${receiptCode}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            color: #000;
            background: #fff;
            line-height: 1.35;
          }

          /* Mode écran / Aperçu Electron (Photos 2 & 5) */
          @media screen {
            html, body {
              width: 100% !important;
              max-width: 480px !important;
              margin: 0 auto !important;
              padding: 18px 24px !important;
              font-size: 12px !important;
            }
            .store-title { font-size: 20px !important; }
            .badge-banner { font-size: 13px !important; padding: 7px 10px !important; }
            .amount-val { font-size: 26px !important; }
            table { font-size: 12px !important; }
            .barcode-box svg, svg { max-width: 280px !important; }
          }

          /* Mode impression directe physique */
          @media print {
            @page { margin: 0; size: ${paperWidth}mm auto; }
            body {
              padding: ${margin}mm;
              width: ${printableWidth}mm;
              font-size: 11px;
            }
          }

          .text-center { text-align: center; }
          .store-header { text-align: center; margin-bottom: 6px; }
          .store-title { font-size: 16px; font-weight: 900; text-transform: uppercase; }
          .store-sub { font-size: 10px; color: #444; }
          .divider { border-bottom: 1.5px solid #000; margin: 6px 0; }
          .dash-divider { border-bottom: 1px dashed #777; margin: 6px 0; }
          .badge-banner {
            background: #000;
            color: #fff;
            padding: 6px 10px;
            text-align: center;
            font-weight: 900;
            font-size: 12px;
            border-radius: 4px;
            margin: 6px 0;
            letter-spacing: 0.5px;
          }
          .amount-card {
            border: 2px solid #000;
            border-radius: 8px;
            padding: 8px;
            text-align: center;
            margin: 8px 0;
          }
          .amount-label { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          .amount-val { font-size: 22px; font-weight: 900; font-family: monospace; margin: 3px 0; }
          .amount-words { font-size: 9.5px; font-style: italic; color: #222; border-top: 1px dotted #aaa; padding-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
          td { padding: 2.5px 0; vertical-align: top; }
          .footer-note { font-size: 9px; text-align: center; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="store-header">
          <div class="store-title">${storeName}</div>
          <div class="store-sub">Point de Vente & Gestion de Stock</div>
          ${phone ? `<div class="store-sub">Tél : ${phone}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="badge-banner">
          REÇU DE RÈGLEMENT DE DETTE
        </div>

        <table>
          <tr>
            <td><strong>N° Reçu :</strong></td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">${receiptCode}</td>
          </tr>
          <tr>
            <td><strong>Date & Heure :</strong></td>
            <td style="text-align: right;">${payment.dateStr || new Date().toLocaleString('fr-FR')}</td>
          </tr>
          <tr>
            <td><strong>Client :</strong></td>
            <td style="text-align: right; font-weight: bold;">${customer.name}</td>
          </tr>
          ${customer.phone ? `<tr><td><strong>Tél Client :</strong></td><td style="text-align: right;">${customer.phone}</td></tr>` : ''}
          <tr>
            <td><strong>Reçu par :</strong></td>
            <td style="text-align: right;">Admin (Caisse 1)</td>
          </tr>
        </table>

        <!-- Cadre central montant reçu -->
        <div class="amount-card">
          <div class="amount-label">MONTANT VERSÉ</div>
          <div class="amount-val">${Number(payment.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</div>
          <div class="amount-words">${numberToFrenchWords(payment.amount)}</div>
        </div>

        <!-- Détails financiers -->
        <table>
          <tr>
            <td>Mode de règlement :</td>
            <td style="text-align: right; font-weight: bold; text-transform: uppercase;">${payment.method || 'Espèces'}</td>
          </tr>
          ${payment.notes ? `<tr><td>Référence / Note :</td><td style="text-align: right; font-size: 9.5px;">${payment.notes}</td></tr>` : ''}
          <tr style="border-top: 1px dashed #777;">
            <td style="padding-top: 4px;">Dette avant versement :</td>
            <td style="text-align: right; font-family: monospace; padding-top: 4px;">${Number(payment.previousDebt || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
          </tr>
          <tr>
            <td>Montant déduit :</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: #000;">-${Number(payment.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
          </tr>
          <tr style="border-top: 2px solid #000; font-size: 12px;">
            <td style="padding-top: 4px;"><strong>DETTE RESTANTE :</strong></td>
            <td style="text-align: right; font-family: monospace; font-weight: 900; padding-top: 4px; font-size: 13px;">
              ${Number(payment.remainingDebt || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </td>
          </tr>
        </table>

        <div class="dash-divider"></div>

        <!-- Code-barres scannable -->
        <div style="text-align: center; margin: 8px 0;">
          ${barcodeSvg}
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 8.5px; margin-top: 14px; text-align: center;">
          <div style="border-top: 1px dotted #888; width: 45%; padding-top: 3px;">Signature Client</div>
          <div style="border-top: 1px dotted #888; width: 45%; padding-top: 3px;">Cachet & Caissier</div>
        </div>

        <div class="footer-note">
          Merci pour votre confiance • NovaMag POS
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Reçu de Règlement de Dette #${receiptCode}`,
    format: 'thermal',
    widthMm: paperWidth
  });
};

/**
 * ══ 2. Impression de l'Étiquette Code-Barres Client ══
 */
export const printCustomerBarcodeLabel = (customer, settings = {}) => {
  if (!customer) return;

  const w = Number(settings.labelWidth) || 50;
  const h = Number(settings.labelHeight) || 30;
  const customerName = (customer.name || customer.fullName || customer.customer || 'CLIENT').trim();
  const customerBarcode = customer.barcode || `CLI-${String(customer.id).padStart(5, '0')}`;
  
  // Hauteur du code-barres proportionnelle à l'étiquette
  const barcodeHeight = Math.max(18, Math.min(30, Math.floor(h * 0.45)));
  const barcodeSvg = generateCode128Svg(customerBarcode, { height: barcodeHeight, barWidth: 1.4 });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Code-Barres Client - ${customerName}</title>
        <style>
          @page { margin: 0; size: ${w}mm ${h}mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 1.5mm 2mm;
            width: ${w}mm;
            height: ${h}mm;
            font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            align-items: center;
            background: #fff;
            color: #000;
          }
          .cust-name { 
            font-size: 13px; 
            font-weight: 900; 
            text-transform: uppercase; 
            letter-spacing: 0.3px;
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            max-width: 98%;
            line-height: 1.2;
          }
          .cust-phone { 
            font-size: 9.5px; 
            font-weight: 600; 
            font-family: monospace; 
            color: #222;
            line-height: 1.1;
          }
          .barcode-wrap {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
          }
          .barcode-wrap svg {
            max-width: 96%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="cust-name">${customerName}</div>
        ${customer.phone ? `<div class="cust-phone">${customer.phone}</div>` : ''}
        <div class="barcode-wrap">${barcodeSvg}</div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Étiquette Code-Barres - ${customerName}`,
    format: 'label',
    widthMm: w
  });
};

/**
 * ══ 3. Impression Thermique Relevé / Facture Globale "Du ... Au ..." ══
 */
export const printCustomerStatementThermal = (customer, periodInvoices = [], periodPayments = [], dateRange = {}, settings = {}) => {
  if (!customer) return;

  const paperWidth = Number(settings.thermalPaperWidth) > 0 ? Number(settings.thermalPaperWidth) : 80;
  const margin = Number(settings.thermalMargin) >= 0 ? Number(settings.thermalMargin) : 6;
  const printableWidth = Math.max(30, paperWidth - (margin * 2));
  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag';
  const phone = settings.phone || settings.phoneMobile || '';
  
  const totalInvoiced = periodInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalSettled = periodPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const currentDebt = Math.abs(customer.balance < 0 ? customer.balance : (customer.debt || 0));

  const rowsHtml = [
    ...periodInvoices.map((inv) => ({
      date: inv.dateStr || inv.timestamp?.slice(0, 10),
      ref: inv.invoiceNumber,
      label: `Vente (${inv.items?.length || 1} art.)`,
      debit: Number(inv.total) || 0,
      credit: 0
    })),
    ...periodPayments.map((p) => ({
      date: p.dateStr?.slice(0, 10) || p.timestamp?.slice(0, 10),
      ref: p.receiptNumber || 'REGLEMENT',
      label: 'Versement dette',
      debit: 0,
      credit: Number(p.amount) || 0
    }))
  ]
  .sort((a, b) => (a.date > b.date ? 1 : -1))
  .map((row) => `
    <tr style="border-bottom: 1px dashed #ccc; font-size: 9.5px;">
      <td style="padding: 3px 0;">
        <div style="font-weight: bold;">${row.date} • ${row.ref}</div>
        <div style="color: #444;">${row.label}</div>
      </td>
      <td style="padding: 3px 0; text-align: right; font-family: monospace;">
        ${row.debit > 0 ? `+${row.debit.toFixed(2)}` : ''}
        ${row.credit > 0 ? `<span style="color: #15803d; font-weight: bold;">-${row.credit.toFixed(2)}</span>` : ''}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Relevé de Compte - ${customer.name}</title>
        <style>
          @page { margin: 0; size: ${paperWidth}mm auto; }
          body {
            margin: 0;
            padding: ${margin}mm;
            width: ${printableWidth}mm;
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            font-size: 11px;
            color: #000;
          }
          .title { font-size: 14px; font-weight: 900; text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          .summary-box { border: 1.5px solid #000; padding: 6px; margin: 6px 0; border-radius: 6px; font-size: 10.5px; }
        </style>
      </head>
      <body>
        <div style="text-align: center; font-weight: bold; font-size: 15px;">${storeName}</div>
        ${phone ? `<div style="text-align: center; font-size: 10px;">Tél : ${phone}</div>` : ''}
        <div style="border-bottom: 1.5px solid #000; margin: 5px 0;"></div>
        
        <div class="title">RELEVÉ DE COMPTE / FACTURE GLOBALE</div>
        <div style="text-align: center; font-size: 9.5px; color: #444; margin-bottom: 6px;">
          Période : ${dateRange.start || 'Début'} au ${dateRange.end || 'Ce jour'}
        </div>

        <div style="background: #f4f4f4; padding: 5px; border-radius: 5px; font-size: 10.5px; margin-bottom: 6px;">
          <strong>Client :</strong> ${customer.name}<br/>
          ${customer.phone ? `Tél : ${customer.phone}<br/>` : ''}
          ${customer.rc ? `RC : ${customer.rc} • NIF : ${customer.nif || '-'}` : ''}
        </div>

        <div class="summary-box">
          <div style="display: flex; justify-content: space-between;">
            <span>Total Ventes / Factures :</span>
            <strong>+${totalInvoiced.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</strong>
          </div>
          <div style="display: flex; justify-content: space-between; color: #15803d;">
            <span>Total Versements Reçus :</span>
            <strong>-${totalSettled.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</strong>
          </div>
          <div style="border-top: 1px solid #000; margin-top: 4px; padding-top: 3px; display: flex; justify-content: space-between; font-weight: 900; font-size: 12px;">
            <span>SOLDE ACTUEL DÛ :</span>
            <span>${currentDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span>
          </div>
        </div>

        <div style="font-weight: 800; font-size: 10px; text-transform: uppercase; margin: 6px 0 2px;">Détail des Opérations :</div>
        <table>${rowsHtml}</table>

        <div style="text-align: center; margin-top: 12px; font-size: 8.5px; color: #555;">
          Document édité le ${new Date().toLocaleDateString('fr-FR')} • NovaMag POS
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Facture Globale / Relevé - ${customer.name}`,
    format: 'thermal',
    widthMm: paperWidth
  });
};

/**
 * ══ 3.bis Impression Facture Globale Périodique A4 (Design Photos 2 & 3 - En Français) ══
 */
export const printCustomerGlobalInvoiceA4 = (customer, periodInvoices = [], periodPayments = [], dateRange = {}, settings = {}) => {
  if (!customer) return;

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : (settings.storeName || 'NovaMag');
  const phone = settings.phone || settings.phoneMobile || '';
  const fixe = settings.phoneFixe || '';
  const email = settings.email || '';
  const rc = settings.rc || '';
  const nif = settings.nif || '';
  const ai = settings.ai || settings.articleImposition || '';
  const nis = settings.nis || '';

  const startFormatted = dateRange.start ? formatDateDMY(dateRange.start) : '01/01/2026';
  const endFormatted = dateRange.end ? formatDateDMY(dateRange.end) : formatDateDMY(new Date().toISOString().slice(0, 10));
  const issueDateFormatted = formatDateDMY(new Date().toISOString().slice(0, 10));

  const year = new Date().getFullYear();
  const invoiceNum = `FR-${year}-${String(customer.id || 1).padStart(4, '0')}`;

  // Regroupement et cumul des articles vendus sur toute la période
  const aggregatedMap = new Map();

  periodInvoices.forEach((inv) => {
    const items = Array.isArray(inv.items) && inv.items.length > 0
      ? inv.items
      : [{
          reference: inv.invoiceNumber || 'VNT',
          name: `Vente N° ${inv.invoiceNumber || inv.id} (${inv.dateStr || inv.timestamp?.slice(0, 10) || ''})`,
          unit: 'Pièce',
          quantity: 1,
          price: Number(inv.total) || 0,
          tva: 0
        }];

    items.forEach((item) => {
      const ref = item.reference || item.barcode || item.code || `REF-${item.id || 'ART'}`;
      const name = item.name || item.designation || item.title || 'Article';
      const key = `${ref}___${name}`;
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const unit = item.unit || 'Pièce';
      const tva = item.tva ?? 0;

      if (!aggregatedMap.has(key)) {
        aggregatedMap.set(key, {
          ref,
          name,
          unit,
          quantity: qty,
          unitPrice: price,
          tva,
          total: qty * price
        });
      } else {
        const exist = aggregatedMap.get(key);
        exist.quantity += qty;
        exist.total += qty * price;
      }
    });
  });

  const aggregatedItems = Array.from(aggregatedMap.values());

  const totalHT = aggregatedItems.reduce((sum, item) => sum + item.total, 0);
  const discount = 0;
  const tvaAmount = 0;
  const totalTTC = totalHT;
  const currentDebt = Math.abs(customer.balance < 0 ? customer.balance : (customer.debt || 0));

  // 1. Montant réglé au comptant lors des ventes de la période
  const paidOnPeriodSales = periodInvoices.reduce((sum, inv) => {
    const tot = Number(inv.total) || 0;
    const debtGen = Number(inv.debtGenerated) || (inv.paymentMethod === 'credit' ? tot : 0);
    const paidAtSale = Math.max(0, tot - debtGen);
    return sum + paidAtSale;
  }, 0);

  // 2. Versements / Règlements de dette reçus sur la période
  const totalDebtPayments = periodPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // 3. Total de tous les paiements perçus durant cette période
  const totalSettledOverall = paidOnPeriodSales + totalDebtPayments;

  // 4. Dette Initiale (Solde Antérieur avant la période sélectionnée)
  // Formule comptable : SoldeFinal = DetteInitiale + TotalTTC - TotalReglements
  // => DetteInitiale = SoldeFinal + TotalReglements - TotalTTC
  const calculatedInitialDebt = Math.max(0, currentDebt + totalSettledOverall - totalTTC);
  const initialDebt = (customer.initialDebt !== undefined && customer.initialDebt !== null)
    ? Number(customer.initialDebt)
    : calculatedInitialDebt;

  // 5. Total Global Dû = Total Ventes de la période + Dette Initiale Antérieure
  const totalDueGlobal = totalTTC + initialDebt;

  const amountInWords = numberToFrenchWords(totalTTC);

  const tableRowsHtml = aggregatedItems.length > 0
    ? aggregatedItems.map((item, idx) => `
        <tr>
          <td style="font-weight: 800; font-family: monospace; text-align: center;">${String(idx + 1).padStart(2, '0')}</td>
          <td style="font-family: monospace; font-weight: 700; text-align: center;">${item.ref}</td>
          <td class="desc" style="font-weight: 600; text-align: left; padding-left: 8px;">${item.name}</td>
          <td style="text-align: center;">${item.unit}</td>
          <td style="font-family: monospace; font-weight: bold; text-align: center;">${item.quantity.toFixed(2)}</td>
          <td style="font-family: monospace; text-align: right; padding-right: 8px;">${item.unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="font-family: monospace; text-align: center;">${item.tva || 0}%</td>
          <td style="font-family: monospace; font-weight: 900; text-align: right; padding-right: 8px;">${item.total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="8" style="padding: 18px; color: #64748b; font-weight: bold; text-align: center;">
            Aucune vente enregistrée pour ce client sur la période sélectionnée.
          </td>
        </tr>
      `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${invoiceNum} - Facture Globale</title>
        <style>
          @page {
            margin: 12mm 15mm;
            size: A4 portrait;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 12mm 15mm;
            font-family: 'Segoe UI', Arial, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #0f172a;
            background: #fff;
            font-size: 11px;
            line-height: 1.35;
          }
          @media print {
            body {
              padding: 0;
            }
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .store-title {
            font-size: 22px;
            font-weight: 900;
            color: #000;
            margin-bottom: 5px;
            letter-spacing: -0.5px;
            text-transform: uppercase;
          }
          .store-meta {
            font-size: 10px;
            color: #334155;
            line-height: 1.6;
          }
          .meta-row {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
          }
          .meta-item {
            display: inline-flex;
            gap: 4px;
          }
          .meta-label { font-weight: bold; color: #000; }

          .customer-box {
            border: 1.5px solid #000;
            border-radius: 12px;
            padding: 10px 14px;
            width: 330px;
            background: #fff;
            text-align: left;
          }
          .cust-row {
            margin-bottom: 2.5px;
            font-size: 11px;
          }
          .cust-name {
            font-size: 13.5px;
            font-weight: 900;
            color: #000;
            margin-bottom: 5px;
            text-transform: uppercase;
          }

          .invoice-box {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .pill-badge {
            display: inline-block;
            padding: 5px 14px;
            border: 1.5px solid #2563eb;
            color: #2563eb;
            border-radius: 8px;
            font-weight: 900;
            font-size: 13px;
            background: #eff6ff;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
          }
          .invoice-title {
            font-size: 16px;
            font-weight: 900;
            color: #000;
            margin-bottom: 2px;
          }
          .invoice-date {
            font-size: 12px;
            font-weight: 700;
            color: #334155;
          }

          .period-banner {
            border: 1.5px dashed #7c3aed;
            background: #faf5ff;
            color: #5b21b6;
            border-radius: 10px;
            padding: 8px 14px;
            text-align: center;
            font-weight: 800;
            font-size: 12px;
            margin: 12px 0 10px 0;
          }

          table.main-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000;
            margin-top: 6px;
          }
          table.main-table th {
            border: 1px solid #000;
            padding: 7px 5px;
            background: #fff;
            color: #000;
            font-weight: 900;
            font-size: 11px;
            text-align: center;
            letter-spacing: 0.3px;
          }
          table.main-table td {
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 10.5px;
          }

          .summary-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 14px;
            gap: 20px;
          }

          .totals-table {
            width: 270px;
            border-collapse: collapse;
            border: 1.5px solid #000;
          }
          .totals-table td {
            border: 1px solid #000;
            padding: 4.5px 8px;
            font-size: 11px;
            font-weight: bold;
          }
          .totals-table td.val {
            text-align: right;
            font-family: monospace;
            font-size: 11.5px;
          }
          .totals-table tr.highlight-blue {
            background-color: #dbeafe !important;
            color: #1e3a8a !important;
            font-weight: 900 !important;
          }

          .words-box {
            flex: 1;
            padding-top: 8px;
            font-size: 12px;
            color: #1e293b;
          }
          .words-amount {
            color: #1d4ed8;
            font-weight: 800;
            font-size: 13px;
            margin-top: 4px;
          }

          .signatures-box {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding: 0 40px;
            text-align: center;
          }
          .sig-col {
            width: 220px;
          }
          .sig-name {
            font-size: 11.5px;
            font-weight: 900;
            margin-bottom: 35px;
          }
          .sig-line {
            border-top: 1px solid #000;
            font-size: 10px;
            font-weight: 700;
            padding-top: 4px;
          }

          .legal-footer {
            margin-top: 25px;
            text-align: center;
            font-size: 9.5px;
            color: #475569;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
          }
        </style>
      </head>
      <body>
        <!-- En-tête : Nom de l'établissement & Coordonnées fiscales -->
        <div style="text-align: left; margin-bottom: 12px;">
          <div class="store-title">${storeName}</div>
          <div class="store-meta">
            <div class="meta-row" style="justify-content: flex-start;">
              <span class="meta-item"><span class="meta-label">Tél :</span> ${phone || '-'}</span>
              <span class="meta-item"><span class="meta-label">Fixe :</span> ${fixe || '-'}</span>
              <span class="meta-item"><span class="meta-label">Email :</span> ${email || '-'}</span>
            </div>
            <div class="meta-row" style="justify-content: flex-start; margin-top: 2px;">
              <span class="meta-item"><span class="meta-label">RC :</span> ${rc || '-'}</span>
              <span class="meta-item"><span class="meta-label">NIF :</span> ${nif || '-'}</span>
              <span class="meta-item"><span class="meta-label">AI :</span> ${ai || '-'}</span>
              <span class="meta-item"><span class="meta-label">NIS :</span> ${nis || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Section Infos Facture (Gauche) & Cadre Client (Droite) -->
        <div class="header-top">
          <!-- Infos Facture -->
          <div class="invoice-box">
            <div class="pill-badge">FACTURE GLOBALE</div>
            <div class="invoice-title">Facture Globale N° : ${invoiceNum}</div>
            <div class="invoice-date">Date d'émission : ${issueDateFormatted}</div>
          </div>

          <!-- Cadre Client -->
          <div class="customer-box">
            <div class="cust-name">Client : ${customer.name}</div>
            <div class="cust-row"><strong>Adresse :</strong> ${customer.address || '-'}</div>
            <div class="cust-row"><strong>Téléphone :</strong> ${customer.phone || '-'}</div>
            <div class="cust-row"><strong>Registre de Commerce :</strong> ${customer.rc || '-'}</div>
            <div class="cust-row"><strong>NIF :</strong> ${customer.nif || '-'}</div>
            ${initialDebt > 0 ? `
              <div class="cust-row" style="margin-top: 4px; padding-top: 3px; border-top: 1px dashed #cbd5e1; color: #b91c1c; font-weight: 800;">
                <strong>Dette Initiale :</strong> ${initialDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Bannière Période de regroupement -->
        <div class="period-banner">
          Période de regroupement : Du ${startFormatted} au ${endFormatted} • Nombre de ventes regroupées : ${periodInvoices.length}
          ${initialDebt > 0 ? ` • <span style="color: #b91c1c; font-weight: 900;">Dette Initiale au ${startFormatted} : ${initialDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</span>` : ''}
        </div>

        <!-- Tableau des Produits Regroupés avec Bordures Réelles -->
        <table class="main-table">
          <thead>
            <tr>
              <th style="width: 35px;">#</th>
              <th style="width: 90px;">RÉFÉRENCE</th>
              <th>DÉSIGNATION DU PRODUIT</th>
              <th style="width: 60px;">UNITÉ</th>
              <th style="width: 80px;">QTÉ TOTALE</th>
              <th style="width: 95px;">P.U. HT</th>
              <th style="width: 60px;">% TVA</th>
              <th style="width: 105px;">TOTAL HT</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <!-- Totaux et Montant en Lettres -->
        <div class="summary-section">
          <!-- Montant en lettres (à gauche) -->
          <div class="words-box">
            Arrêté les achats de la période à la somme de :
            <div class="words-amount">${amountInWords}.</div>
            ${currentDebt > 0 ? `
              <div style="font-size: 11px; color: #b91c1c; font-weight: 700; margin-top: 8px;">
                Solde actuel restant dû : <strong>${numberToFrenchWords(currentDebt)}</strong>.
              </div>
            ` : ''}
          </div>

          <!-- Tableau des totaux (à droite) -->
          <table class="totals-table">
            <tr>
              <td>Total Ventes HT (Période)</td>
              <td class="val">${totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
            </tr>
            ${discount > 0 ? `
              <tr>
                <td>Remise</td>
                <td class="val">-${discount.toFixed(2)} DA</td>
              </tr>
            ` : ''}
            <tr>
              <td>TVA (0%)</td>
              <td class="val">${tvaAmount.toFixed(2)} DA</td>
            </tr>
            <tr>
              <td>Total Ventes TTC (Période)</td>
              <td class="val">${totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
            </tr>
            ${initialDebt > 0 ? `
              <tr style="background-color: #fef2f2; font-weight: 800;">
                <td style="color: #b91c1c;">Dette Initiale (Solde Antérieur)</td>
                <td class="val" style="color: #b91c1c; font-weight: 900;">+${initialDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
              </tr>
            ` : ''}
            <tr class="highlight-blue">
              <td>Total Global Dû</td>
              <td class="val">${totalDueGlobal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
            </tr>
            ${paidOnPeriodSales > 0 ? `
              <tr>
                <td style="color: #15803d;">Règlement Ventes (Comptant)</td>
                <td class="val" style="color: #15803d; font-weight: bold;">-${paidOnPeriodSales.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
              </tr>
            ` : ''}
            ${totalDebtPayments > 0 ? `
              <tr>
                <td style="color: #15803d;">Versements sur Dette Reçus</td>
                <td class="val" style="color: #15803d; font-weight: bold;">-${totalDebtPayments.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
              </tr>
            ` : ''}
            ${(paidOnPeriodSales > 0 && totalDebtPayments > 0) ? `
              <tr style="background-color: #f0fdf4; font-weight: 800;">
                <td style="color: #15803d;">Total Règlements Reçus</td>
                <td class="val" style="color: #15803d; font-weight: 900;">-${totalSettledOverall.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
              </tr>
            ` : ''}
            <tr style="border-top: 2px solid #000; background: ${currentDebt > 0 ? '#fff1f2' : '#f0fdf4'};">
              <td style="color: ${currentDebt > 0 ? '#b91c1c' : '#15803d'}; font-weight: 900; font-size: 11.5px;">Solde Restant Dû (Dette)</td>
              <td class="val" style="color: ${currentDebt > 0 ? '#b91c1c' : '#15803d'}; font-weight: 900; font-size: 12px;">${currentDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
            </tr>
          </table>
        </div>

        <!-- Signatures et Cachet -->
        <div class="signatures-box">
          <div class="sig-col">
            <div class="sig-name">Destinataire : ${customer.name}</div>
            <div class="sig-line">Cachet & Signature</div>
          </div>
          <div class="sig-col">
            <div class="sig-name">Émetteur : ${storeName}</div>
            <div class="sig-line">Cachet & Signature</div>
          </div>
        </div>

        <!-- Note légale de bas de page -->
        <div class="legal-footer">
          Facture globale récapitulative regroupant l'ensemble des ventes du client durant la période indiquée. Valable pour la comptabilité et la gestion commerciale.
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `${invoiceNum} - Facture Globale (${customer.name})`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

/**
 * ══ 4. Impression Thermique du Résumé Client Complet (Conforme Photo 1) ══
 */
export const printCustomerSummaryThermal = (customer, invoices = [], payments = [], settings = {}) => {
  if (!customer) return;

  const paperWidth = Number(settings.thermalPaperWidth) > 0 ? Number(settings.thermalPaperWidth) : 80;
  const margin = Number(settings.thermalMargin) >= 0 ? Number(settings.thermalMargin) : 5;
  const printableWidth = Math.max(30, paperWidth - (margin * 2));
  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : (settings.storeName || 'NovaMag');
  const customerBarcode = customer.barcode || `CLI-${String(customer.id).padStart(5, '0')}`;
  const barcodeSvg = generateCode128Svg(customerBarcode, { height: 34, barWidth: 1.4 });

  // 1. Calcul des totaux financiers
  const totalSalesAmount = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalPaidOnSales = invoices.reduce((sum, inv) => {
    const tot = Number(inv.total) || 0;
    const debtGen = Number(inv.debtGenerated) || (inv.paymentMethod === 'credit' ? tot : 0);
    return sum + Math.max(0, tot - debtGen);
  }, 0);
  const totalDebtPayments = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalSettled = totalPaidOnSales + totalDebtPayments;
  const currentDebt = Math.abs(customer.balance < 0 ? customer.balance : (customer.debt || 0));

  // Formule Dette Initiale (Solde Antérieur)
  const calculatedInitialDebt = Math.max(0, currentDebt + totalSettled - totalSalesAmount);
  const initialDebt = (customer.initialDebt !== undefined && customer.initialDebt !== null)
    ? Number(customer.initialDebt)
    : calculatedInitialDebt;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('fr-FR');
  const timeFormatted = now.toLocaleTimeString('fr-FR');

  // Lignes des Ventes
  const invoicesRowsHtml = invoices.length > 0
    ? invoices.map((inv) => {
        const invDate = inv.dateStr?.slice(0, 10) || inv.timestamp?.slice(0, 10) || '-';
        const invTotal = Number(inv.total) || 0;
        const invDebt = Number(inv.debtGenerated) || (inv.paymentMethod === 'credit' ? invTotal : 0);
        return `
          <tr>
            <td style="font-weight: bold; font-family: monospace; white-space: nowrap;">${inv.invoiceNumber}</td>
            <td style="font-family: monospace; white-space: nowrap;">${invDate}</td>
            <td class="num" style="font-weight: bold; white-space: nowrap;">${invTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="num" style="color: ${invDebt > 0 ? '#b91c1c' : '#555'}; font-weight: ${invDebt > 0 ? 'bold' : 'normal'}; white-space: nowrap;">
              ${invDebt > 0 ? invDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
            </td>
          </tr>
        `;
      }).join('')
    : `
        <tr>
          <td colspan="4" style="text-align: center; color: #777; padding: 10px; font-weight: bold;">Aucun achat enregistré.</td>
        </tr>
      `;

  // Lignes des Versements
  const paymentsRowsHtml = payments.length > 0
    ? payments.map((p) => {
        const pDate = p.dateStr?.slice(0, 10) || p.timestamp?.slice(0, 10) || '-';
        const pAmount = Number(p.amount) || 0;
        const pRef = p.receiptNumber || `REC-${p.id || 'P'}`;
        const pNote = p.note || 'Règlement dette';
        return `
          <tr>
            <td style="font-weight: bold; font-family: monospace; white-space: nowrap;">${pRef}</td>
            <td style="font-family: monospace; white-space: nowrap;">${pDate}</td>
            <td class="num" style="color: #15803d; font-weight: 900; white-space: nowrap;">-${pAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="color: #444; font-size: 9.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">${pNote}</td>
          </tr>
        `;
      }).join('')
    : `
        <tr>
          <td colspan="4" style="text-align: center; color: #777; padding: 10px; font-weight: bold;">Aucun versement enregistré.</td>
        </tr>
      `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Résumé Client - ${customer.name}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #000;
            line-height: 1.35;
            background: #fff;
          }
          
          /* Vue écran / Aperçu Electron */
          @media screen {
            html, body {
              width: 100% !important;
              max-width: 520px !important;
              margin: 0 auto !important;
              padding: 16px 22px !important;
              font-size: 11.5px !important;
            }
            .barcode-box svg {
              max-width: 280px !important;
              height: 40px !important;
            }
          }

          /* Impression directe thermique */
          @media print {
            @page { margin: 0; size: ${paperWidth}mm auto; }
            body {
              padding: ${margin}mm;
              width: ${printableWidth}mm;
              font-size: 10.5px;
            }
          }

          .barcode-box {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 5px;
          }
          .barcode-box svg {
            max-width: 90%;
            height: auto;
          }
          .title {
            font-size: 15px;
            font-weight: 900;
            text-align: center;
            letter-spacing: -0.2px;
            margin: 3px 0 2px;
            text-transform: uppercase;
          }
          .date-time {
            font-size: 10px;
            color: #444;
            text-align: center;
            margin-bottom: 6px;
            font-family: monospace;
          }
          .divider-dash {
            border-bottom: 1.5px dashed #000;
            margin: 8px 0;
          }
          .client-info {
            font-size: 11px;
            line-height: 1.55;
          }
          .client-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .synth-box {
            border: 1.5px solid #000;
            border-radius: 6px;
            padding: 8px 10px;
            margin: 9px 0;
            font-size: 11px;
            background: #fff;
          }
          .synth-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
            gap: 12px;
          }
          .synth-row .val {
            font-family: monospace;
            font-size: 12px;
            font-weight: 800;
            white-space: nowrap !important;
          }
          .section-title {
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            margin: 10px 0 4px 0;
            border-bottom: 1.5px solid #000;
            padding-bottom: 3px;
            letter-spacing: 0.3px;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 8px;
          }
          table.data-table th {
            border-bottom: 1.5px solid #000;
            padding: 4px 4px;
            text-align: left;
            font-size: 9.5px;
            font-weight: 900;
            white-space: nowrap;
          }
          table.data-table td {
            border-bottom: 1px dashed #ccc;
            padding: 4.5px 4px;
            vertical-align: middle;
          }
          table.data-table td.num {
            text-align: right;
            font-family: monospace;
            font-weight: 700;
          }
          .footer-end {
            text-align: center;
            font-size: 9.5px;
            font-weight: bold;
            color: #333;
            margin-top: 10px;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <!-- 1. Code-barres client centré au sommet -->
        <div class="barcode-box">
          ${barcodeSvg}
        </div>

        <!-- 2. Titre et Date/Heure -->
        <div class="title">RÉSUMÉ DU CLIENT</div>
        <div class="date-time">${dateFormatted} • ${timeFormatted}</div>

        <div class="divider-dash"></div>

        <!-- 3. Coordonnées Client -->
        <div class="client-info">
          <div class="client-row">
            <span>Nom :</span>
            <strong>${customer.name}</strong>
          </div>
          <div class="client-row">
            <span>Téléphone :</span>
            <strong>${customer.phone || '-'}</strong>
          </div>
          <div class="client-row">
            <span>ID Client :</span>
            <strong style="font-family: monospace;">${customerBarcode}</strong>
          </div>
        </div>

        <div class="divider-dash"></div>

        <!-- 4. Encadré Synthèse Financière (Photo 1 & 2) -->
        <div class="synth-box">
          <div class="synth-row">
            <span>Total des Achats :</span>
            <span class="val">${totalSalesAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}&nbsp;DA</span>
          </div>
          <div class="synth-row" style="color: #b91c1c;">
            <span>Dette Initiale (Solde Antérieur) :</span>
            <span class="val">+${initialDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}&nbsp;DA</span>
          </div>
          <div class="synth-row" style="color: #15803d;">
            <span>Total Versements Reçus :</span>
            <span class="val">-${totalDebtPayments.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}&nbsp;DA</span>
          </div>
          <div class="synth-row" style="border-top: 1.5px solid #000; margin-top: 5px; padding-top: 4px; font-weight: 900; font-size: 12px; color: ${currentDebt > 0 ? '#b91c1c' : '#15803d'};">
            <span>Solde Actuel Dû (Dette) :</span>
            <span class="val" style="font-size: 13px;">${currentDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}&nbsp;DA</span>
          </div>
        </div>

        <!-- 5. Section Ventes / Achats -->
        <div class="section-title">VENTES & ACHATS (${invoices.length})</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 38%; white-space: nowrap;">N° Facture</th>
              <th style="width: 24%; white-space: nowrap;">Date</th>
              <th class="num" style="width: 20%; white-space: nowrap;">Total TTC</th>
              <th class="num" style="width: 18%; white-space: nowrap;">Crédit</th>
            </tr>
          </thead>
          <tbody>
            ${invoicesRowsHtml}
          </tbody>
        </table>

        <!-- 6. Section Versements & Règlements de Dette -->
        <div class="section-title">VERSEMENTS & RÈGLEMENTS (${payments.length})</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 38%; white-space: nowrap;">N° Reçu</th>
              <th style="width: 24%; white-space: nowrap;">Date</th>
              <th class="num" style="width: 20%; white-space: nowrap;">Montant</th>
              <th style="width: 18%; white-space: nowrap;">Motif</th>
            </tr>
          </thead>
          <tbody>
            ${paymentsRowsHtml}
          </tbody>
        </table>

        <div class="divider-dash"></div>

        <!-- 7. Pied de document -->
        <div class="footer-end">
          *** ${storeName.toUpperCase()} POS - FIN DU RÉSUMÉ ***
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Résumé Client - ${customer.name}`,
    format: 'thermal',
    widthMm: paperWidth,
    forcePreview: true
  });
};

/**
 * ══ 5. Impression Facture Complète A4 (Conforme Photo 5) ══
 */
export const printSaleInvoiceA4 = (invoice, customer = {}, settings = {}) => {
  if (!invoice) return;

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag';
  const phone = settings.phone || settings.phoneMobile || '';
  const address = settings.address || '';
  const barcodeSvg = generateCode128Svg(invoice.invoiceNumber || String(invoice.id), { height: 38, barWidth: 1.5 });
  const qrSvg = generateQrCodeSvg(`FACTURE:${invoice.invoiceNumber || invoice.id}|TOTAL:${invoice.total}|DATE:${invoice.dateStr || ''}`, 70);

  const design = settings.design || 'Classique A4';
  const totalAmount = Number(invoice.total || 0);
  const subTotalAmount = Number(invoice.subtotal || invoice.total || 0);
  const discountAmount = Number(invoice.discount || 0);

  let htmlContent = '';

  // ══════════════════════════════════════════════════════════════════════
  // MODÈLE 1 : ENCADRÉ (Cadres structurés, bordures nettes, double encadré)
  // ══════════════════════════════════════════════════════════════════════
  if (design === 'Encadré') {
    const itemsRows = (invoice.items || []).map((it, idx) => {
      const qty = it.quantity || 1;
      const price = it.price || 0;
      const total = typeof it.customTotal === 'number' ? it.customTotal : qty * price;
      return `
        <tr style="border-bottom: 1.5px solid #0f172a;">
          <td style="padding: 7px 10px; border-right: 1.5px solid #0f172a; text-align: center; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 7px 10px; border-right: 1.5px solid #0f172a; font-weight: 700;">${it.name}</td>
          <td style="padding: 7px 10px; border-right: 1.5px solid #0f172a; text-align: center; font-family: monospace; font-weight: 800;">${qty}</td>
          <td style="padding: 7px 10px; border-right: 1.5px solid #0f172a; text-align: right; font-family: monospace;">${price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
          <td style="padding: 7px 10px; text-align: right; font-family: monospace; font-weight: 800;">${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
        </tr>
      `;
    }).join('');

    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Facture Encadrée ${invoice.invoiceNumber}</title>
          <style>
            @page { margin: 12mm 15mm; size: A4 portrait; }
            * { box-sizing: border-box; }
            body {
              margin: 0; padding: 12mm 15mm;
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #0f172a; background: #fff; font-size: 11.5px;
            }
            .outer-frame { border: 2.5px solid #0f172a; padding: 16px; border-radius: 4px; }
            .box { border: 1.5px solid #0f172a; padding: 10px; border-radius: 3px; }
            .box-title { font-size: 10px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #0f172a; padding-bottom: 3px; margin-bottom: 5px; }
            table.framed-table { width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; margin-top: 15px; }
            table.framed-table th { background: #e2e8f0; border-bottom: 1.5px solid #0f172a; border-right: 1.5px solid #0f172a; padding: 7px 10px; font-size: 10.5px; text-transform: uppercase; font-weight: 900; }
            table.framed-table th:last-child { border-right: none; }
          </style>
        </head>
        <body>
          <div class="outer-frame">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
              <div>
                <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">${storeName}</div>
                <div style="font-size: 11px; color: #475569; font-weight: 600;">ÉTABLISSEMENT COMMERCIAL • VENTE EN GROS ET DÉTAIL</div>
                <div>${address || ''}</div>
                <div>${phone ? `Tél : ${phone}` : ''}</div>
              </div>
              <div style="text-align: right;">
                <div style="border: 2px solid #0f172a; padding: 6px 14px; font-size: 16px; font-weight: 900; background: #f8fafc; display: inline-block;">
                  FACTURE N° ${invoice.invoiceNumber || invoice.id}
                </div>
                <div style="font-size: 11px; margin-top: 4px; font-weight: bold;">Date : ${invoice.dateStr || invoice.timestamp?.slice(0, 10)}</div>
                <div style="margin-top: 5px;">${barcodeSvg}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
              <div class="box">
                <div class="box-title">CADRE CLIENT</div>
                <div style="font-size: 13px; font-weight: 900;">${invoice.customer || customer.name || 'Client Comptoir'}</div>
                <div>Téléphone : ${customer.phone || '-'}</div>
                <div>Adresse : ${customer.address || '-'}</div>
                ${customer.rc ? `<div>RC: ${customer.rc} • NIF: ${customer.nif || '-'}</div>` : ''}
              </div>
              <div class="box">
                <div class="box-title">MODALITÉS DE RÈGLEMENT</div>
                <div>Mode de règlement : <strong style="text-transform: uppercase;">${invoice.paymentMethod || 'Espèces'}</strong></div>
                <div>Caissier / Opérateur : <strong>${invoice.cashier || 'Admin'}</strong></div>
                <div>Statut : <strong style="color: #15803d;">ACQUITTÉE / VALIDÉE</strong></div>
              </div>
            </div>

            <table class="framed-table">
              <thead>
                <tr>
                  <th style="width: 35px; text-align: center;">N°</th>
                  <th style="text-align: left;">Désignation des Articles</th>
                  <th style="width: 70px; text-align: center;">Qté</th>
                  <th style="width: 110px; text-align: right;">Prix Unitaire</th>
                  <th style="width: 120px; text-align: right;">Montant Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 14px;">
              <div style="width: 55%; border: 1.5px solid #0f172a; padding: 10px; font-size: 11px; background: #f8fafc;">
                Arrêté la présente facture à la somme de :<br/>
                <strong style="font-size: 11.5px;">${numberToFrenchWords(invoice.total)}</strong>.
              </div>
              <table style="width: 40%; border-collapse: collapse; border: 1.5px solid #0f172a;">
                <tr style="border-bottom: 1px solid #0f172a;">
                  <td style="padding: 5px 8px; font-weight: bold;">Sous-Total :</td>
                  <td style="padding: 5px 8px; text-align: right; font-family: monospace;">${subTotalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
                </tr>
                ${discountAmount > 0 ? `
                  <tr style="border-bottom: 1px solid #0f172a; color: #dc2626;">
                    <td style="padding: 5px 8px;">Remise accordée :</td>
                    <td style="padding: 5px 8px; text-align: right; font-family: monospace;">-${discountAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
                  </tr>
                ` : ''}
                <tr style="background: #0f172a; color: #fff; font-weight: 900; font-size: 13px;">
                  <td style="padding: 7px 8px;">TOTAL TTC :</td>
                  <td style="padding: 7px 8px; text-align: right; font-family: monospace;">${totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
                </tr>
              </table>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 35px; text-align: center; font-size: 11px; font-weight: bold;">
              <div style="border: 1px dashed #0f172a; width: 220px; height: 75px; padding: 6px;">Visa & Cachet Client</div>
              <div style="border: 1px dashed #0f172a; width: 220px; height: 75px; padding: 6px;">Cachet & Signature Établissement</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════
  // MODÈLE 2 : DÉTAILLÉ A4 (Format comptable multi-colonnes Réf, P.U. HT, TVA, TTC)
  // ══════════════════════════════════════════════════════════════════════
  else if (design === 'Détaillé A4') {
    const itemsRows = (invoice.items || []).map((it, idx) => {
      const qty = it.quantity || 1;
      const price = it.price || 0;
      const ref = it.barcode || `REF-${it.productId || it.id || idx + 1}`;
      const lineTotal = typeof it.customTotal === 'number' ? it.customTotal : qty * price;
      return `
        <tr style="border-bottom: 1px solid #cbd5e1; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
          <td style="padding: 6px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-family: monospace; font-size: 10.5px;">${ref}</td>
          <td style="padding: 6px 8px; font-weight: 700;">${it.name}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold;">${qty}</td>
          <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 6px 8px; text-align: center; color: #64748b;">0%</td>
          <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 800; color: #1e3a8a;">${lineTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
        </tr>
      `;
    }).join('');

    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Facture Détaillée ${invoice.invoiceNumber}</title>
          <style>
            @page { margin: 12mm 15mm; size: A4 portrait; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 12mm 15mm; font-family: Arial, sans-serif; color: #1e293b; background: #fff; font-size: 11px; }
            table.detail-table { width: 100%; border-collapse: collapse; margin-top: 15px; border: 1px solid #cbd5e1; }
            table.detail-table th { background: #1e3a8a; color: #fff; padding: 7px 8px; font-size: 10px; text-transform: uppercase; font-weight: 800; border: 1px solid #1e3a8a; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px;">
            <div>
              <div style="font-size: 24px; font-weight: 900; color: #1e3a8a;">${storeName}</div>
              <div style="font-size: 11px; color: #475569;">BUREAU COMMERCIAL & FACTURATION DÉTAILLÉE</div>
              <div>${address || ''}</div>
              <div>${phone ? `Tél : ${phone}` : ''}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: 900; color: #1e3a8a;">FACTURE COMMERCIALE DÉTAILLÉE</div>
              <div style="font-family: monospace; font-size: 13px; font-weight: 800; color: #0284c7;">N° : ${invoice.invoiceNumber || invoice.id}</div>
              <div style="font-size: 10.5px; color: #64748b; margin-top: 3px;">Date d'opération : ${invoice.dateStr || invoice.timestamp?.slice(0, 10)}</div>
              <div style="margin-top: 4px;">${barcodeSvg}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px;">
            <div style="padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
              <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 3px;">Doit (Client) :</div>
              <div style="font-size: 13px; font-weight: 900;">${invoice.customer || customer.name || 'Client Comptoir'}</div>
              <div>Contact : ${customer.phone || '-'}</div>
              <div>Adresse : ${customer.address || '-'}</div>
            </div>
            <div style="padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
              <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 3px;">Règlement & Livraisons :</div>
              <div>Mode de règlement : <strong>${invoice.paymentMethod || 'Espèces'}</strong></div>
              <div>Caissier : <strong>${invoice.cashier || 'Admin'}</strong></div>
              <div>Échéance : <strong>Comptant</strong></div>
            </div>
          </div>

          <table class="detail-table">
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th style="width: 95px;">RÉFÉRENCE</th>
                <th>DÉSIGNATION DES MARCHANDISES</th>
                <th style="width: 50px;">QTÉ</th>
                <th style="width: 90px; text-align: right;">P.U. HT</th>
                <th style="width: 45px;">TVA</th>
                <th style="width: 105px; text-align: right;">TOTAL TTC</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-top: 14px;">
            <div style="width: 56%; padding: 10px; background: #f8fafc; border-left: 3px solid #1e3a8a; font-size: 11px;">
              Arrêté la présente facture à la somme TTC de :<br/>
              <strong>${numberToFrenchWords(invoice.total)}</strong>.
              <div style="margin-top: 6px; font-size: 10px; color: #64748b;">Dispense de timbre fiscal selon la réglementation en vigueur.</div>
            </div>
            <table style="width: 38%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px; border-bottom: 1px solid #cbd5e1;">Total Brut HT :</td>
                <td style="padding: 4px; text-align: right; font-family: monospace; font-weight: bold;">${subTotalAmount.toFixed(2)} DA</td>
              </tr>
              ${discountAmount > 0 ? `
                <tr style="color: #dc2626;">
                  <td style="padding: 4px; border-bottom: 1px solid #cbd5e1;">Remise commerciale :</td>
                  <td style="padding: 4px; text-align: right; font-family: monospace;">-${discountAmount.toFixed(2)} DA</td>
                </tr>
              ` : ''}
              <tr>
                <td style="padding: 4px; border-bottom: 1px solid #cbd5e1;">Montant TVA (0%) :</td>
                <td style="padding: 4px; text-align: right; font-family: monospace;">0.00 DA</td>
              </tr>
              <tr style="background: #1e3a8a; color: #fff; font-size: 13px; font-weight: 900;">
                <td style="padding: 6px 8px;">NET À PAYER :</td>
                <td style="padding: 6px 8px; text-align: right; font-family: monospace;">${totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
              </tr>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 35px; text-align: center; font-size: 10.5px; font-weight: bold;">
            <div style="border-top: 1px solid #64748b; width: 200px; padding-top: 6px;">Le Réceptionnaire (Client)</div>
            <div style="border-top: 1px solid #64748b; width: 200px; padding-top: 6px;">Direction / Service Facturation</div>
          </div>
        </body>
      </html>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════
  // MODÈLE 3 : PREMIUM LOGO (Design moderne haute gamme, logo géant, QR Code)
  // ══════════════════════════════════════════════════════════════════════
  else if (design === 'Premium logo') {
    const itemsRows = (invoice.items || []).map((it, idx) => {
      const qty = it.quantity || 1;
      const price = it.price || 0;
      const total = typeof it.customTotal === 'number' ? it.customTotal : qty * price;
      return `
        <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background: #fbfcfd;' : ''}">
          <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">${it.name}</td>
          <td style="padding: 10px 12px; text-align: center; font-family: monospace; font-weight: 800; color: #0284c7;">${qty}</td>
          <td style="padding: 10px 12px; text-align: right; font-family: monospace; color: #475569;">${price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
          <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: 900; color: #0f172a;">${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
        </tr>
      `;
    }).join('');

    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Facture Premium ${invoice.invoiceNumber}</title>
          <style>
            @page { margin: 12mm 16mm; size: A4 portrait; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 12mm 16mm; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff; font-size: 11.5px; }
            .premium-header { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 18px 22px; border-radius: 12px; margin-bottom: 16px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
            table.premium-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
            table.premium-table th { background: #0f172a; color: #fff; padding: 9px 12px; font-size: 10.5px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.4px; }
          </style>
        </head>
        <body>
          <div class="premium-header">
            <div>
              <div style="display: flex; items-center; gap: 10px;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #fff;">★</div>
                <div>
                  <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.3px;">${storeName}</div>
                  <div style="font-size: 10.5px; color: #94a3b8;">SOLUTIONS COMMERCIALES HAUTE PRÉCISION</div>
                </div>
              </div>
              <div style="font-size: 11px; color: #cbd5e1; margin-top: 6px;">${address || ''} • Tél: ${phone || '-'}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 22px; font-weight: 900; color: #38bdf8; letter-spacing: -0.5px;">FACTURE</div>
              <div style="font-family: monospace; font-size: 14px; color: #fff; font-weight: 800;">N° ${invoice.invoiceNumber || invoice.id}</div>
              <div style="font-size: 10.5px; color: #94a3b8; margin-top: 3px;">Date : ${invoice.dateStr || invoice.timestamp?.slice(0, 10)}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
            <div class="card">
              <div style="font-size: 9.5px; font-weight: 900; color: #2563eb; text-transform: uppercase; margin-bottom: 4px;">Facturé à :</div>
              <div style="font-size: 14px; font-weight: 900; color: #0f172a;">${invoice.customer || customer.name || 'Client Comptoir'}</div>
              <div style="color: #64748b;">Téléphone : ${customer.phone || '-'}</div>
              <div style="color: #64748b;">Adresse : ${customer.address || '-'}</div>
            </div>
            <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 9.5px; font-weight: 900; color: #2563eb; text-transform: uppercase; margin-bottom: 4px;">Règlement & Validation :</div>
                <div>Mode : <strong style="text-transform: uppercase;">${invoice.paymentMethod || 'Espèces'}</strong></div>
                <div>Opérateur : <strong>${invoice.cashier || 'Admin'}</strong></div>
                <div style="color: #16a34a; font-weight: 800;">✓ Document Certifié Conforme</div>
              </div>
              <div>${qrSvg}</div>
            </div>
          </div>

          <table class="premium-table">
            <thead>
              <tr>
                <th style="text-align: left;">Désignation Produit / Service</th>
                <th style="width: 70px; text-align: center;">Qté</th>
                <th style="width: 120px; text-align: right;">Prix Unitaire</th>
                <th style="width: 130px; text-align: right;">Total Net</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="max-width: 55%; font-size: 11px;">
              Arrêté la présente facture à la somme de :<br/>
              <strong style="color: #0f172a; font-size: 12px;">${numberToFrenchWords(invoice.total)}</strong>.
            </div>
            <div style="text-align: right;">
              ${discountAmount > 0 ? `<div style="font-size: 11px; color: #dc2626;">Remise : -${discountAmount.toFixed(2)} DA</div>` : ''}
              <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Total Général TTC</div>
              <div style="font-size: 22px; font-family: monospace; font-weight: 900; color: #0f172a;">
                ${totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span style="font-size: 13px; color: #2563eb;">DA</span>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 35px; text-align: center; font-size: 11px; font-weight: bold; color: #64748b;">
            <div style="border-top: 1.5px solid #cbd5e1; width: 220px; padding-top: 8px;">Cachet & Signature Client</div>
            <div style="border-top: 1.5px solid #cbd5e1; width: 220px; padding-top: 8px;">Cachet & Signature Établissement</div>
          </div>
        </body>
      </html>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════
  // MODÈLE PAR DÉFAUT : CLASSIQUE A4 (Moderne bleu roi épuré)
  // ══════════════════════════════════════════════════════════════════════
  else {
    const itemsRows = (invoice.items || []).map((it, idx) => {
      const qty = it.quantity || 1;
      const price = it.price || 0;
      const total = typeof it.customTotal === 'number' ? it.customTotal : qty * price;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
          <td style="padding: 8px 12px; font-weight: 600;">${it.name}</td>
          <td style="padding: 8px 12px; text-align: center; font-family: monospace; font-weight: bold;">${qty}</td>
          <td style="padding: 8px 12px; text-align: right; font-family: monospace;">${price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
          <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-weight: bold;">${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
        </tr>
      `;
    }).join('');

    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Facture ${invoice.invoiceNumber}</title>
          <style>
            @page { margin: 15mm 18mm; size: A4 portrait; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 15mm 18mm; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; line-height: 1.45; }
            .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 15px; }
            .store-name { font-size: 24px; font-weight: 900; color: #1e3a8a; }
            .invoice-card { background: #f1f5f9; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #2563eb; color: #fff; padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
            .totals-table { width: 340px; margin-left: auto; margin-top: 15px; border-collapse: collapse; }
            .totals-table td { padding: 6px 12px; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <div class="store-name">${storeName}</div>
              <div style="font-size: 12px; color: #64748b; font-weight: 600;">Point de Vente & Gestion Commerciale</div>
              ${address ? `<div>${address}</div>` : ''}
              ${phone ? `<div>Tél : ${phone}</div>` : ''}
            </div>

            <div style="text-align: right;">
              <div style="font-size: 20px; font-weight: 900; color: #0f172a;">FACTURE COMMERCIALE</div>
              <div style="font-size: 14px; font-family: monospace; font-weight: 800; color: #2563eb;">${invoice.invoiceNumber}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Date : ${invoice.dateStr || invoice.timestamp?.slice(0, 10)}</div>
              <div style="margin-top: 6px;">${barcodeSvg}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="invoice-card">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Informations Client</div>
              <div style="font-size: 14px; font-weight: 900;">${invoice.customer || customer.name || 'Client Comptoir'}</div>
              ${customer.phone ? `<div>Tél : ${customer.phone}</div>` : ''}
              ${customer.address ? `<div>Adresse : ${customer.address}</div>` : ''}
            </div>

            <div class="invoice-card">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Informations de Règlement</div>
              <div>Mode de paiement : <strong style="text-transform: uppercase;">${invoice.paymentMethod || 'Espèces'}</strong></div>
              <div>Vendeur / Caissier : <strong>${invoice.cashier || 'Admin'}</strong></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="border-top-left-radius: 6px;">Désignation Produit</th>
                <th style="text-align: center;">Qté</th>
                <th style="text-align: right;">Prix Unitaire</th>
                <th style="text-align: right; border-top-right-radius: 6px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <table class="totals-table">
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td><strong>Sous-Total :</strong></td>
              <td style="text-align: right; font-family: monospace;">${subTotalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
            </tr>
            ${discountAmount > 0 ? `
              <tr style="border-bottom: 1px solid #cbd5e1; color: #15803d;">
                <td>Remise :</td>
                <td style="text-align: right; font-family: monospace;">-${discountAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
              </tr>
            ` : ''}
            <tr style="background: #2563eb; color: #fff; font-size: 15px; font-weight: 900;">
              <td style="padding: 8px 12px; border-bottom-left-radius: 6px;">NET À PAYER :</td>
              <td style="padding: 8px 12px; text-align: right; font-family: monospace; border-bottom-right-radius: 6px;">
                ${totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
              </td>
            </tr>
          </table>

          <div style="margin-top: 25px; padding: 10px; background: #f8fafc; border-left: 3px solid #2563eb; font-size: 11px;">
            Arrêté la présente facture à la somme de : <strong>${numberToFrenchWords(invoice.total)}</strong>.
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center;">
            <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 6px;">Cachet & Signature Client</div>
            <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 6px;">Cachet & Signature Établissement</div>
          </div>
        </body>
      </html>
    `;
  }

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Facture A4 [${design}] #${invoice.invoiceNumber || invoice.id}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

/**
 * Impression Bon d'Achat Fournisseur A4
 */
export const printPurchaseInvoiceA4 = (purchase, supplier = {}, settings = {}) => {
  if (!purchase) return;

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag';
  const phone = settings.phone || settings.phoneMobile || '';
  const address = settings.address || '';
  const invNum = purchase.invoiceNumber || `BA-${purchase.id}`;
  const barcodeSvg = generateCode128Svg(invNum, { height: 40, barWidth: 1.6 });

  const items = purchase.items || [];
  const total = Number(purchase.total || 0);
  const paid = Number(purchase.paid || 0);
  const unpaid = Number(purchase.unpaid ?? (total - paid)) || 0;

  const itemsRows = items.length > 0 ? items.map((it, idx) => {
    const qty = it.quantity || 1;
    const price = Number(it.unitPrice || it.price || 0);
    const lineTotal = Number(it.total || (qty * price));
    return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
        <td style="padding: 8px 12px; text-align: center; font-family: monospace; color: #64748b;">${idx + 1}</td>
        <td style="padding: 8px 12px; font-weight: 600;">${it.name || it.designation}</td>
        <td style="padding: 8px 12px; text-align: center; font-family: monospace; font-weight: bold;">${qty}</td>
        <td style="padding: 8px 12px; text-align: right; font-family: monospace;">${price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
        <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-weight: bold;">${lineTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
      </tr>
    `;
  }).join('') : `
    <tr>
      <td style="padding: 10px 12px; text-align: center;">1</td>
      <td style="padding: 10px 12px; font-weight: 600;">${purchase.description || 'Marchandises diverses'}</td>
      <td style="padding: 10px 12px; text-align: center; font-weight: bold;">1</td>
      <td style="padding: 10px 12px; text-align: right;">${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
      <td style="padding: 10px 12px; text-align: right; font-weight: bold;">${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
    </tr>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Bon d'Achat ${invNum}</title>
        <style>
          @page {
            margin: 15mm 18mm;
            size: A4 portrait;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 15mm 18mm;
            font-family: 'Segoe UI', Arial, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #1e293b;
            background: #fff;
            font-size: 12px;
            line-height: 1.45;
          }
          @media screen {
            body {
              padding: 28px 34px !important;
            }
          }
          .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 15px; }
          .store-name { font-size: 24px; font-weight: 900; color: #1e3a8a; }
          .invoice-card { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #2563eb; color: #fff; padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
          .totals-table { width: 340px; margin-left: auto; margin-top: 15px; border-collapse: collapse; }
          .totals-table td { padding: 6px 12px; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div class="store-name">${storeName}</div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">Gestion Commerciale & Point de Vente</div>
            ${address ? `<div>${address}</div>` : ''}
            ${phone ? `<div>Tél : ${phone}</div>` : ''}
          </div>

          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 900; color: #0f172a;">BON D'ACHAT / RÉCEPTION</div>
            <div style="font-size: 14px; font-family: monospace; font-weight: 800; color: #2563eb;">${invNum}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Date : ${purchase.dateStr || purchase.timestamp?.slice(0, 10)}</div>
            <div style="margin-top: 6px;">${barcodeSvg}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div class="invoice-card">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Fournisseur</div>
            <div style="font-size: 14px; font-weight: 900;">${supplier?.name || purchase.supplierName}</div>
            ${supplier?.phone ? `<div>Tél : ${supplier.phone}</div>` : ''}
            ${supplier?.address ? `<div>Adresse : ${supplier.address}</div>` : ''}
            ${supplier?.rc ? `<div>RC : ${supplier.rc} • NIF : ${supplier.nif || '-'}</div>` : ''}
          </div>

          <div class="invoice-card">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Informations de Paiement</div>
            <div>Mode de règlement : <strong style="text-transform: uppercase;">${purchase.paymentMethod || 'Espèces'}</strong></div>
            <div>Statut : <strong>${unpaid > 0 ? `Partiel (Reste à crédit : ${unpaid.toLocaleString()} DA)` : 'Soldé / Payé ✓'}</strong></div>
            ${unpaid > 0 ? `<div style="color: #dc2626; font-weight: bold; margin-top: 3px;">⚠ Dette fournisseur générée : ${unpaid.toLocaleString()} DA</div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; width: 40px; text-align: center;">#</th>
              <th>Désignation du Produit</th>
              <th style="text-align: center; width: 80px;">Quantité</th>
              <th style="text-align: right; width: 120px;">Prix Unitaire</th>
              <th style="text-align: right; border-top-right-radius: 6px; width: 130px;">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <table class="totals-table">
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td><strong>TOTAL ACHAT :</strong></td>
            <td style="text-align: right; font-family: monospace; font-size: 14px; font-weight: 900; color: #1e3a8a;">
              ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #cbd5e1; color: #15803d;">
            <td>Montant Réglé :</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">
              ${paid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </td>
          </tr>
          <tr style="${unpaid > 0 ? 'background: #fef2f2; color: #dc2626;' : 'background: #f0fdf4; color: #15803d;'} font-weight: 900;">
            <td style="padding: 8px 12px; border-bottom-left-radius: 6px;">${unpaid > 0 ? 'RESTE À CRÉDIT :' : 'SOLDE DU BON :'}</td>
            <td style="padding: 8px 12px; text-align: right; font-family: monospace; border-bottom-right-radius: 6px;">
              ${unpaid > 0 ? `${unpaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA` : '0,00 DA (Payé ✓)'}
            </td>
          </tr>
        </table>

        <div style="margin-top: 25px; padding: 10px; background: #f8fafc; border-left: 3px solid #2563eb; font-size: 11px;">
          Arrêté le présent bon d'achat à la somme de : <strong>${numberToFrenchWords(total)}</strong>.
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center;">
          <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 6px;">Réceptionnaire / Magasin</div>
          <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 6px;">Fournisseur / Livreur</div>
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Bon d'Achat A4 #${invNum}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

/**
 * Impression Bon de Retour A4 (Fournisseur ou Client)
 */
export const printReturnSlipA4 = (returnRecord, party = {}, settings = {}, isSupplier = true) => {
  if (!returnRecord) return;

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag';
  const phone = settings.phone || settings.phoneMobile || '';
  const address = settings.address || '';
  const retNum = returnRecord.returnNumber || `RET-${returnRecord.id}`;
  const barcodeSvg = generateCode128Svg(retNum, { height: 40, barWidth: 1.6 });

  const items = returnRecord.items || [];
  const total = Number(returnRecord.total || 0);

  const itemsRows = items.length > 0 ? items.map((it, idx) => {
    const qty = it.quantity || 1;
    const price = Number(it.unitPrice || it.price || 0);
    const lineTotal = Number(it.total || (qty * price));
    return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
        <td style="padding: 8px 12px; text-align: center; font-family: monospace; color: #64748b;">${idx + 1}</td>
        <td style="padding: 8px 12px; font-weight: 600;">${it.name || it.designation}</td>
        <td style="padding: 8px 12px; text-align: center; font-family: monospace; font-weight: bold;">${qty}</td>
        <td style="padding: 8px 12px; text-align: right; font-family: monospace;">${price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
        <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-weight: bold;">${lineTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
      </tr>
    `;
  }).join('') : `
    <tr>
      <td colspan="5" style="padding: 12px; text-align: center;">Articles retournés (${total.toLocaleString()} DA)</td>
    </tr>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Bon de Retour ${retNum}</title>
        <style>
          @page {
            margin: 15mm 18mm;
            size: A4 portrait;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 15mm 18mm;
            font-family: 'Segoe UI', Arial, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #1e293b;
            background: #fff;
            font-size: 12px;
            line-height: 1.45;
          }
          @media screen {
            body {
              padding: 28px 34px !important;
            }
          }
          .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e11d48; padding-bottom: 15px; margin-bottom: 15px; }
          .store-name { font-size: 24px; font-weight: 900; color: #881337; }
          .invoice-card { background: #fff1f2; padding: 12px; border-radius: 8px; border: 1px solid #fecdd3; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #e11d48; color: #fff; padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
          .totals-table { width: 340px; margin-left: auto; margin-top: 15px; border-collapse: collapse; }
          .totals-table td { padding: 6px 12px; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div class="store-name">${storeName}</div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">Gestion des Retours & Réclamations</div>
            ${address ? `<div>${address}</div>` : ''}
            ${phone ? `<div>Tél : ${phone}</div>` : ''}
          </div>

          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 900; color: #e11d48;">
              ${isSupplier ? 'BON DE RETOUR FOURNISSEUR' : 'BON DE RETOUR CLIENT'}
            </div>
            <div style="font-size: 14px; font-family: monospace; font-weight: 800; color: #0f172a;">${retNum}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Date : ${returnRecord.dateStr || returnRecord.timestamp?.slice(0, 10)}</div>
            <div style="margin-top: 6px;">${barcodeSvg}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div class="invoice-card">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #9f1239; margin-bottom: 4px;">
              ${isSupplier ? 'Fournisseur Concerné' : 'Client Concerné'}
            </div>
            <div style="font-size: 14px; font-weight: 900;">${party?.name || returnRecord.supplierName || returnRecord.customerName}</div>
            ${party?.phone ? `<div>Tél : ${party.phone}</div>` : ''}
            ${party?.address ? `<div>Adresse : ${party.address}</div>` : ''}
          </div>

          <div class="invoice-card">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #9f1239; margin-bottom: 4px;">Détails du Retour</div>
            <div>Motif : <strong>${returnRecord.motif || 'Non spécifié'}</strong></div>
            <div>Compensation : <strong>${returnRecord.deductFromDebt > 0 ? 'Déduction de la dette' : 'Remboursement en espèces'}</strong></div>
            ${returnRecord.notes ? `<div>Note : <em>${returnRecord.notes}</em></div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="border-top-left-radius: 6px; width: 40px; text-align: center;">#</th>
              <th>Désignation du Produit Retourné</th>
              <th style="text-align: center; width: 80px;">Quantité</th>
              <th style="text-align: right; width: 120px;">Prix Unitaire</th>
              <th style="text-align: right; border-top-right-radius: 6px; width: 130px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <table class="totals-table">
          <tr style="border-bottom: 1px solid #cbd5e1; background: #e11d48; color: #fff; font-weight: 900;">
            <td style="padding: 8px 12px; border-top-left-radius: 6px;">TOTAL RETOURNÉ :</td>
            <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-size: 14px; border-top-right-radius: 6px;">
              ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </td>
          </tr>
          ${returnRecord.deductFromDebt > 0 ? `
            <tr style="color: #b45309; font-weight: bold; border-bottom: 1px solid #cbd5e1;">
              <td>Déduction de la dette :</td>
              <td style="text-align: right; font-family: monospace;">-${Number(returnRecord.deductFromDebt).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
            </tr>
          ` : ''}
          ${returnRecord.cashRefund > 0 ? `
            <tr style="color: #15803d; font-weight: bold; border-bottom: 1px solid #cbd5e1;">
              <td>Remboursement Espèces :</td>
              <td style="text-align: right; font-family: monospace;">+${Number(returnRecord.cashRefund).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
            </tr>
          ` : ''}
        </table>

        <div style="margin-top: 25px; padding: 10px; background: #fff1f2; border-left: 3px solid #e11d48; font-size: 11px;">
          Arrêté le présent bon de retour à la somme de : <strong>${numberToFrenchWords(total)}</strong>.
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center;">
          <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 6px;">Cachet & Signature Magasin</div>
          <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 6px;">${isSupplier ? 'Fournisseur / Livreur' : 'Signature Client'}</div>
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Bon de Retour A4 #${retNum}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

/**
 * =========================================================================
 * IMPRESSION BILAN DE CAISSE / RAPPORT DE SESSION (A4 & TICKET THERMIQUE)
 * =========================================================================
 */

export const printCashSessionReportA4 = (session, settings = {}) => {
  if (!session) return;

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag POS';
  const phone = settings.phone || settings.phoneMobile || '';
  const address = settings.address || '';
  const sessNum = session.sessionNumber || 1;
  const cashier = (session.cashier && session.cashier !== 'BZ Technology') ? session.cashier : 'Admin';
  const isClosed = session.status === 'closed' || !!session.closedAt;

  const fmtMoney = (v) => Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DA';
  const fmtDate = (dStr) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} à ${h}:${m}`;
    } catch {
      return dStr || '—';
    }
  };

  const opening = Number(session.openingBalance || 0);
  const encaissements = Number(session.encaissements || 0);
  const decaissements = Number(session.decaissements || 0);
  const expected = typeof session.expectedCash === 'number' ? session.expectedCash : (opening + encaissements - decaissements);
  const counted = typeof session.countedCash === 'number' ? session.countedCash : null;
  const discrepancy = typeof session.discrepancy === 'number' ? session.discrepancy : (counted !== null ? (counted - expected) : null);

  const transactions = session.transactions || [];
  const txRows = transactions.length > 0 ? transactions.map((t, idx) => {
    const isPos = t.isPositive !== false;
    const sign = isPos ? '+' : '-';
    const color = isPos ? '#15803d' : '#dc2626';
    const timeFormatted = t.time ? (function() {
      try {
        const d = new Date(t.time);
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      } catch { return '--:--'; }
    })() : '--:--';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
        <td style="padding: 7px 10px; text-align: center; font-family: monospace; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 10px; font-family: monospace; font-weight: 600; text-align: center;">${timeFormatted}</td>
        <td style="padding: 7px 10px; font-weight: 700;">${t.typeLabel || t.type || 'Opération'}</td>
        <td style="padding: 7px 10px; color: #334155;">${t.description || '—'}</td>
        <td style="padding: 7px 10px; text-align: right; font-family: monospace; font-weight: 800; color: ${color};">
          ${sign}${fmtMoney(t.amount)}
        </td>
      </tr>
    `;
  }).join('') : `
    <tr>
      <td colspan="5" style="padding: 16px; text-align: center; color: #94a3b8; font-style: italic;">
        Aucune transaction enregistrée dans cette session.
      </td>
    </tr>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Bilan de Caisse #${sessNum}</title>
        <style>
          @page {
            margin: 15mm 18mm;
            size: A4 portrait;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 18mm 20mm;
            font-size: 12px;
            line-height: 1.45;
          }
          @media print {
            body {
              padding: 0;
            }
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .store-name {
            font-size: 22px;
            font-weight: 900;
            color: #1e3a8a;
            letter-spacing: -0.5px;
          }
          .report-badge {
            text-align: right;
          }
          .report-title {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-tag {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            margin-top: 4px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 18px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px 16px;
          }
          .kpi-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 18px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 12px;
            background: #ffffff;
          }
          .kpi-title {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 800;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .kpi-val {
            font-size: 15px;
            font-weight: 900;
            font-family: monospace;
          }
          table.tx-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
          }
          table.tx-table th {
            background: #1e293b;
            color: #ffffff;
            padding: 8px 10px;
            text-align: left;
            font-weight: 700;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 35px;
            padding-top: 10px;
          }
          .sig-box {
            width: 220px;
            border-top: 1.5px solid #94a3b8;
            padding-top: 6px;
            text-align: center;
            font-weight: 600;
            font-size: 11px;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="store-name">${storeName}</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 3px;">
              ${address ? `<span>${address}</span> • ` : ''}
              ${phone ? `<span>Tél: ${phone}</span>` : ''}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
              Édité le : <strong>${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
          </div>
          <div class="report-badge">
            <div class="report-title">Bilan de Caisse</div>
            <div style="font-size: 13px; font-weight: 800; color: #2563eb;">Session #${sessNum}</div>
            <span class="status-tag" style="${isClosed ? 'background: #dcfce7; color: #166534; border: 1px solid #86efac;' : 'background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;'}">
              ${isClosed ? '● Clôturée' : '● Session Active'}
            </span>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <div style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700;">Caissier / Responsable</div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">${cashier}</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700;">Période d'ouverture</div>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px;">
              Du : ${fmtDate(session.openedAt)}<br/>
              Au : ${isClosed ? fmtDate(session.closedAt) : 'En cours...'}
            </div>
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card" style="border-left: 4px solid #3b82f6;">
            <div class="kpi-title">Solde Ouverture</div>
            <div class="kpi-val" style="color: #1e40af;">${fmtMoney(opening)}</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #10b981;">
            <div class="kpi-title">Total Encaissements</div>
            <div class="kpi-val" style="color: #047857;">+${fmtMoney(encaissements)}</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #ef4444;">
            <div class="kpi-title">Total Décaissements</div>
            <div class="kpi-val" style="color: #b91c1c;">-${fmtMoney(decaissements)}</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #6366f1; background: #f8fafc;">
            <div class="kpi-title">Solde Théorique</div>
            <div class="kpi-val" style="color: #4338ca;">${fmtMoney(expected)}</div>
          </div>
        </div>

        ${isClosed && counted !== null ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px;">
            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px;">
              <span style="font-size: 11px; font-weight: 700; color: #475569;">Espèces Réelles Comptées en Clôture :</span>
              <span style="float: right; font-family: monospace; font-size: 15px; font-weight: 900; color: #0f172a;">${fmtMoney(counted)}</span>
            </div>
            <div style="background: ${discrepancy < -0.01 ? '#fef2f2; border: 1px solid #fca5a5' : (discrepancy > 0.01 ? '#f0fdf4; border: 1px solid #86efac' : '#f8fafc; border: 1px solid #cbd5e1')}; border-radius: 10px; padding: 10px 14px;">
              <span style="font-size: 11px; font-weight: 700; color: ${discrepancy < -0.01 ? '#991b1b' : (discrepancy > 0.01 ? '#166534' : '#334155')};">
                Écart de Caisse :
              </span>
              <span style="float: right; font-family: monospace; font-size: 15px; font-weight: 900; color: ${discrepancy < -0.01 ? '#dc2626' : (discrepancy > 0.01 ? '#15803d' : '#047857')};">
                ${discrepancy > 0 ? '+' : ''}${fmtMoney(discrepancy)} ${Math.abs(discrepancy) <= 0.01 ? '✓ (Exact)' : ''}
              </span>
            </div>
          </div>
        ` : ''}

        ${session.note ? `
          <div style="margin-bottom: 18px; padding: 10px 14px; background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 6px; font-size: 11px;">
            <strong>Note de session :</strong> ${session.note}
          </div>
        ` : ''}

        <div style="font-weight: 800; font-size: 12px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 15px;">
          Journal des Opérations & Transactions (${transactions.length})
        </div>

        <table class="tx-table">
          <thead>
            <tr>
              <th style="width: 35px; text-align: center; border-top-left-radius: 6px;">#</th>
              <th style="width: 65px; text-align: center;">Heure</th>
              <th style="width: 140px;">Type d'Opération</th>
              <th>Description / Justificatif</th>
              <th style="width: 120px; text-align: right; border-top-right-radius: 6px;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${txRows}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">Visa / Signature du Caissier</div>
          <div class="sig-box">Visa de la Direction / Gérance</div>
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Bilan de Caisse A4 #${sessNum}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

export const printCashSessionTicket = (session, settings = {}) => {
  if (!session) return;

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag';
  const phone = settings.phone || settings.phoneMobile || '';
  const sessNum = session.sessionNumber || 1;
  const cashier = (session.cashier && session.cashier !== 'BZ Technology') ? session.cashier : 'Admin';
  const isClosed = session.status === 'closed' || !!session.closedAt;

  const fmtMoney = (v) => Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DA';
  const opening = Number(session.openingBalance || 0);
  const encaissements = Number(session.encaissements || 0);
  const decaissements = Number(session.decaissements || 0);
  const expected = typeof session.expectedCash === 'number' ? session.expectedCash : (opening + encaissements - decaissements);
  const counted = typeof session.countedCash === 'number' ? session.countedCash : null;
  const discrepancy = typeof session.discrepancy === 'number' ? session.discrepancy : (counted !== null ? (counted - expected) : null);

  const transactions = session.transactions || [];
  const txLines = transactions.slice(0, 30).map((t) => {
    const isPos = t.isPositive !== false;
    const sign = isPos ? '+' : '-';
    let timeStr = '--:--';
    try {
      const d = new Date(t.time);
      timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    } catch {}
    const label = (t.typeLabel || t.type || '').slice(0, 14);

    return `
      <tr>
        <td style="font-family: monospace; font-size: 10px;">${timeStr}</td>
        <td style="font-size: 10px; font-weight: bold;">${label}</td>
        <td style="text-align: right; font-family: monospace; font-size: 10px; font-weight: bold;">${sign}${fmtMoney(t.amount)}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket Bilan Caisse #${sessNum}</title>
        <style>
          @page { margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            margin: 0 auto;
            padding: 8px 4px;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="text-center bold" style="font-size: 14px;">${storeName}</div>
        ${phone ? `<div class="text-center" style="font-size: 10px;">Tél: ${phone}</div>` : ''}
        <div class="divider"></div>
        <div class="text-center bold" style="font-size: 13px;">*** BILAN DE CAISSE ***</div>
        <div class="text-center bold">SESSION #${sessNum} (${isClosed ? 'CLÔTURÉE' : 'EN COURS'})</div>
        <div class="divider"></div>
        
        <div class="row"><span>Caissier :</span><span class="bold">${cashier}</span></div>
        <div class="row"><span>Date :</span><span>${new Date().toLocaleDateString('fr-FR')}</span></div>
        <div class="divider"></div>

        <div class="row"><span>Solde Ouverture :</span><span class="bold">${fmtMoney(opening)}</span></div>
        <div class="row"><span>Encaissements :</span><span class="bold">+${fmtMoney(encaissements)}</span></div>
        <div class="row"><span>Décaissements :</span><span class="bold">-${fmtMoney(decaissements)}</span></div>
        <div class="divider"></div>
        <div class="row bold" style="font-size: 12px;"><span>SOLDE THÉORIQUE :</span><span>${fmtMoney(expected)}</span></div>

        ${isClosed && counted !== null ? `
          <div class="row bold"><span>Espèces Comptées :</span><span>${fmtMoney(counted)}</span></div>
          <div class="row bold" style="font-size: 12px;"><span>ÉCART DE CAISSE :</span><span>${discrepancy > 0 ? '+' : ''}${fmtMoney(discrepancy)}</span></div>
        ` : ''}

        ${transactions.length > 0 ? `
          <div class="divider"></div>
          <div class="bold text-center" style="font-size: 10px;">DERNIERS MOUVEMENTS (${transactions.length})</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
            ${txLines}
          </table>
        ` : ''}

        <div class="divider"></div>
        <div class="text-center" style="font-size: 9px; margin-top: 8px;">
          Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Ticket Bilan Caisse #${sessNum}`,
    format: 'thermal',
    widthMm: 80,
    forcePreview: true
  });
};

/**
 * =========================================================================
 * IMPRESSION BON DE LIVRAISON (A4 & TICKET THERMIQUE AVEC CHAUFFEUR & MATRICULE)
 * =========================================================================
 */
export const printDeliveryNoteA4 = (invoice, deliveryDetails = {}, settings = {}) => {
  if (!invoice) return;

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag POS';
  const phone = settings.phone || settings.phoneMobile || '';
  const address = settings.address || '';
  const blNum = (invoice.invoiceNumber || `FAC-${invoice.id}`).replace('FAC', 'BL').replace('INV', 'BL');
  const barcodeSvg = generateCode128Svg(blNum, { height: 38, barWidth: 1.5 });

  const driverName = deliveryDetails.driver?.trim() || 'Non spécifié';
  const plateNumber = deliveryDetails.plateNumber?.trim() || 'Non spécifiée';

  const items = invoice.items || [];
  const total = Number(invoice.total || 0);

  const itemsRows = items.map((it, idx) => {
    const qty = it.quantity || 1;
    const price = Number(it.price || it.unitPrice || 0);
    const lineTotal = Number(it.total || (qty * price));
    return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background: #f8fafc;' : ''}">
        <td style="padding: 8px 12px; text-align: center; font-family: monospace; color: #64748b;">${idx + 1}</td>
        <td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${it.name || it.designation}</td>
        <td style="padding: 8px 12px; text-align: center; font-family: monospace; font-weight: 800;">${qty}</td>
        <td style="padding: 8px 12px; text-align: right; font-family: monospace;">${price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
        <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-weight: 800; color: #1e3a8a;">${lineTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Bon de Livraison ${blNum}</title>
        <style>
          @page {
            margin: 15mm 18mm;
            size: A4 portrait;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 18mm 20mm;
            font-size: 12px;
            line-height: 1.45;
          }
          @media print {
            body { padding: 0; }
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #0284c7;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .store-name {
            font-size: 22px;
            font-weight: 900;
            color: #0369a1;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 18px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 14px;
          }
          .card-title {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            padding: 8px 12px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 16px;
            margin-top: 45px;
            text-align: center;
          }
          .sig-box {
            border-top: 1.5px solid #94a3b8;
            padding-top: 6px;
            font-weight: 700;
            font-size: 11px;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="store-name">${storeName}</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
              ${address ? `<span>${address}</span> • ` : ''}
              ${phone ? `<span>Tél: ${phone}</span>` : ''}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
              Édité le : <strong>${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 900; color: #0284c7; text-transform: uppercase;">Bon de Livraison</div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; font-family: monospace;">${blNum}</div>
            <div style="margin-top: 4px; display: inline-block;">${barcodeSvg}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="card">
            <div class="card-title" style="color: #0284c7;">Destinataire / Client</div>
            <div style="font-size: 14px; font-weight: 900; color: #0f172a;">${invoice.customer || 'Client Comptoir'}</div>
            ${invoice.customerPhone ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Tél : ${invoice.customerPhone}</div>` : ''}
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date commande : ${invoice.dateStr || invoice.timestamp?.slice(0, 16) || '—'}</div>
          </div>

          <div class="card" style="border-left: 4px solid #0284c7;">
            <div class="card-title" style="color: #0284c7;">Informations Livraison & Transport</div>
            <div style="font-size: 12px; margin-top: 2px;">
              <span style="color: #64748b; font-weight: 600;">Livreur / Chauffeur :</span>
              <strong style="color: #0f172a; margin-left: 4px;">${driverName}</strong>
            </div>
            <div style="font-size: 12px; margin-top: 4px;">
              <span style="color: #64748b; font-weight: 600;">Immatriculation Véhicule :</span>
              <strong style="color: #0f172a; margin-left: 4px; font-family: monospace;">${plateNumber}</strong>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center; border-top-left-radius: 6px;">#</th>
              <th style="text-align: left;">Désignation des Marchandises</th>
              <th style="width: 80px; text-align: center;">Quantité</th>
              <th style="width: 120px; text-align: right;">Prix Unitaire</th>
              <th style="width: 130px; text-align: right; border-top-right-radius: 6px;">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
          <div style="width: 260px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 10px 14px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
              <span style="font-weight: 700; color: #475569;">TOTAL TTC :</span>
              <span style="font-family: monospace; font-weight: 900; color: #0284c7; font-size: 15px;">
                ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
              </span>
            </div>
          </div>
        </div>

        <div style="margin-top: 20px; padding: 8px 12px; background: #f0fdf4; border-left: 3px solid #16a34a; font-size: 11px; color: #166534;">
          Marchandise contrôlée et livrée en bon état conformément à la commande.
        </div>

        <div class="signatures">
          <div class="sig-box">Visa / Expéditeur Magasin</div>
          <div class="sig-box">Signature du Livreur</div>
          <div class="sig-box">Bon pour Réception Client</div>
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Bon de Livraison A4 #${blNum}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

export const printDeliveryNoteThermal = (invoice, deliveryDetails = {}, settings = {}) => {
  if (!invoice) return;

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag';
  const blNum = (invoice.invoiceNumber || `FAC-${invoice.id}`).replace('FAC', 'BL').replace('INV', 'BL');
  const driverName = deliveryDetails.driver?.trim() || 'Non spécifié';
  const plateNumber = deliveryDetails.plateNumber?.trim() || 'Non spécifiée';
  const items = invoice.items || [];
  const total = Number(invoice.total || 0);

  const lines = items.map((it) => `
    <tr>
      <td style="font-size: 10px; font-weight: bold;">${it.name || it.designation}</td>
      <td style="text-align: center; font-size: 10px; font-family: monospace;">x${it.quantity || 1}</td>
      <td style="text-align: right; font-size: 10px; font-family: monospace; font-weight: bold;">${Number(it.total || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket Bon Livraison #${blNum}</title>
        <style>
          @page { margin: 0; }
          body { font-family: monospace; width: 72mm; margin: 0 auto; padding: 6px 4px; font-size: 11px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 13px;">${storeName}</div>
        <div class="divider"></div>
        <div class="center bold">*** BON DE LIVRAISON ***</div>
        <div class="center bold">${blNum}</div>
        <div class="divider"></div>
        <div class="row"><span>Client :</span><span class="bold">${invoice.customer || 'Client'}</span></div>
        <div class="row"><span>Livreur :</span><span class="bold">${driverName}</span></div>
        <div class="row"><span>Matricule :</span><span class="bold">${plateNumber}</span></div>
        <div class="divider"></div>
        <table style="width: 100%; border-collapse: collapse;">
          ${lines}
        </table>
        <div class="divider"></div>
        <div class="row bold" style="font-size: 12px;"><span>TOTAL :</span><span>${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
        <div class="divider"></div>
        <div class="center" style="font-size: 9px; margin-top: 6px;">Signature & Réception :</div>
        <div style="height: 35px; border-bottom: 1px solid #000; margin-top: 4px;"></div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Bon de Livraison Ticket #${blNum}`,
    format: 'thermal',
    widthMm: 80,
    forcePreview: true
  });
};

export const printSaleInvoiceA5 = (invoice, customer = {}, settings = {}) => {
  if (!invoice) return;

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag POS';
  const phone = settings.phone || settings.phoneMobile || '';
  const address = settings.address || '';
  const invNum = invoice.invoiceNumber || `FAC-${invoice.id}`;
  const barcodeSvg = generateCode128Svg(invNum, { height: 32, barWidth: 1.4 });
  const items = invoice.items || [];
  const total = Number(invoice.total || 0);

  const itemsRows = items.map((it, idx) => {
    const qty = it.quantity || 1;
    const price = Number(it.price || it.unitPrice || 0);
    const lineTotal = Number(it.total || (qty * price));
    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10.5px;">
        <td style="padding: 5px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 5px 8px; font-weight: 700;">${it.name || it.designation}</td>
        <td style="padding: 5px 8px; text-align: center; font-weight: bold;">${qty}</td>
        <td style="padding: 5px 8px; text-align: right; font-family: monospace;">${price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: bold;">${lineTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Facture A5 ${invNum}</title>
        <style>
          @page { margin: 10mm 12mm; size: A5 landscape; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 10mm; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1e293b; color: #fff; padding: 6px 8px; font-size: 10px; text-align: left; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 10px;">
          <div>
            <div style="font-size: 18px; font-weight: 900; color: #1e3a8a;">${storeName}</div>
            <div style="color: #64748b; font-size: 10px;">${address ? `${address} • ` : ''}${phone ? `Tél: ${phone}` : ''}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: 900; color: #2563eb;">FACTURE COMPACTE A5</div>
            <div style="font-family: monospace; font-weight: bold; font-size: 11px;">${invNum}</div>
            <div style="margin-top: 2px;">${barcodeSvg}</div>
          </div>
        </div>

        <div style="margin-bottom: 10px; font-size: 11px;">
          <strong>Client :</strong> ${invoice.customer || 'Client Comptoir'} • <strong>Date :</strong> ${invoice.dateStr || invoice.timestamp?.slice(0, 16) || '—'}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Désignation</th>
              <th style="width: 60px; text-align: center;">Qté</th>
              <th style="width: 90px; text-align: right;">P.U (DA)</th>
              <th style="width: 100px; text-align: right;">Total (DA)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 900; color: #1e3a8a;">
            TOTAL NET : ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
          </div>
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, settings, {
    title: `Facture A5 #${invNum}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * IMPRESSION A4 DU RÉCAPITULATIF DES VENTES (CONFORME AU MODÈLE DU PDF)
 * ══════════════════════════════════════════════════════════════════════
 */
export const printSalesSummaryReportA4 = (reportData = {}, sysSettings = {}) => {
  const {
    sales = [],
    dateFrom = '',
    dateTo = '',
    customerFilter = 'all',
    totalSales = 0,
    totalPaid = 0,
    remainingDebt = 0,
    salesCount = sales.length,
    issuer = 'Admin',
    docNumber = `RM-${new Date().getFullYear()}-${String(sales.length).padStart(4, '0')}`,
    emissionDate = new Date().toLocaleDateString('fr-FR')
  } = reportData;

  const storeName = sysSettings.storeName || 'NOVA MAG';
  const storeAddress = sysSettings.storeAddress || '';
  const storePhone = sysSettings.storePhone || '';
  const storeEmail = sysSettings.storeEmail || '';
  const storeNif = sysSettings.storeNif || '';
  const storeRc = sysSettings.storeRc || '';
  const storeAi = sysSettings.storeAi || '';
  const storeNis = sysSettings.storeNis || '';

  const periodText = (dateFrom && dateTo) 
    ? `du ${dateFrom} au ${dateTo}` 
    : (dateFrom ? `à partir du ${dateFrom}` : (dateTo ? `jusqu'au ${dateTo}` : 'Toutes les dates'));

  const perimeterText = customerFilter === 'all' ? 'Tous les clients' : customerFilter;

  const amountInWords = numberToFrenchWords(totalSales);

  const tableRowsHtml = sales.length > 0 
    ? sales.map((sale, idx) => {
        const invNum = sale.invoiceNumber || `INV-${sale.id}`;
        const saleDate = sale.dateStr || (sale.timestamp ? new Date(sale.timestamp).toLocaleString('fr-FR') : '—');
        const clientName = sale.customer || 'Client Comptoir (Passager)';
        const articlesCount = (sale.items || []).reduce((acc, it) => acc + Number(it.quantity || 1), 0);
        const saleTotal = Number(sale.total || 0);
        const salePaid = sale.amountPaid !== undefined 
          ? Math.min(Number(sale.amountPaid || 0), saleTotal) 
          : (sale.paymentMethod === 'credit' ? 0 : saleTotal);

        return `
          <tr style="background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="padding: 6px 8px; text-align: center; font-weight: 700; font-family: monospace; border-bottom: 1px solid #e2e8f0;">
              ${String(idx + 1).padStart(2, '0')}
            </td>
            <td style="padding: 6px 8px; font-weight: 700; font-family: monospace; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
              ${invNum}
            </td>
            <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 10px;">
              ${saleDate}
            </td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">
              ${clientName}
            </td>
            <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-family: monospace;">
              ${articlesCount}
            </td>
            <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 600; color: #059669;">
              ${salePaid.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 800; color: #0f172a;">
              ${saleTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        `;
      }).join('')
    : `
      <tr>
        <td colspan="7" style="padding: 24px; text-align: center; color: #64748b; font-weight: 600;">
          Aucune vente enregistrée pour la sélection courante.
        </td>
      </tr>
    `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${docNumber} - Récapitulatif des Ventes</title>
        <style>
          @page {
            margin: 10mm 12mm;
            size: A4 portrait;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 10mm 12mm;
            font-family: 'Segoe UI', Arial, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #0f172a;
            background: #fff;
            font-size: 11px;
            line-height: 1.35;
          }
          @media print {
            body { padding: 0; }
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 800;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 6px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #94a3b8;
          }
        </style>
      </head>
      <body>
        <!-- EN-TÊTE CONFORME PDF -->
        <table style="width: 100%; margin-bottom: 14px;">
          <tr>
            <td style="vertical-align: top; width: 55%;">
              <div style="font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 4px;">
                ${storeName}
              </div>
              ${storeAddress ? `<div style="color: #475569; font-size: 10px;">${storeAddress}</div>` : ''}
              ${storePhone ? `<div style="color: #475569; font-size: 10px;">Tél : ${storePhone}</div>` : ''}
              ${storeEmail ? `<div style="color: #475569; font-size: 10px;">Email : ${storeEmail}</div>` : ''}
              <div style="color: #64748b; font-size: 9.5px; margin-top: 4px;">
                ${storeRc ? `RC : ${storeRc} ` : ''}
                ${storeNif ? `• NIF : ${storeNif} ` : ''}
                ${storeAi ? `• AI : ${storeAi} ` : ''}
                ${storeNis ? `• NIS : ${storeNis}` : ''}
              </div>
              <div style="margin-top: 8px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10.5px; display: inline-block;">
                <div><strong>Périmètre :</strong> ${perimeterText}</div>
                <div><strong>Nombre de ventes :</strong> ${salesCount}</div>
              </div>
            </td>
            <td style="vertical-align: top; width: 45%; text-align: right;">
              <div style="display: inline-block; padding: 6px 14px; border: 1.5px solid #059669; background: #ecfdf5; color: #065f46; font-size: 14px; font-weight: 900; border-radius: 8px; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.3px;">
                Récapitulatif des ventes
              </div>
              <div style="font-size: 11px; color: #1e293b; margin-top: 4px;">
                <strong>Récapitulatif N° :</strong> <span style="font-family: monospace; font-weight: 800;">${docNumber}</span>
              </div>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                <strong>Date d'émission :</strong> ${emissionDate}
              </div>
            </td>
          </tr>
        </table>

        <!-- BANDEAU PÉRIODE -->
        <div style="margin-bottom: 12px; padding: 6px 12px; background: #f1f5f9; border-left: 4px solid #059669; border-radius: 4px; font-size: 11px; font-weight: 700; color: #0f172a;">
          Période : ${periodText}
        </div>

        <!-- TABLEAU DES VENTES -->
        <table style="margin-bottom: 16px;">
          <thead>
            <tr>
              <th style="width: 32px; text-align: center;">#</th>
              <th style="width: 120px; text-align: left;">N° Facture</th>
              <th style="width: 130px; text-align: center;">Date</th>
              <th style="text-align: left;">Client</th>
              <th style="width: 60px; text-align: center;">Articles</th>
              <th style="width: 105px; text-align: right;">Payé</th>
              <th style="width: 115px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <!-- BLOC RÉCAPITULATIF FINANCIER & MONTANT EN LETTRES -->
        <table style="width: 100%; margin-bottom: 24px; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; width: 55%; padding-right: 20px;">
              <div style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px;">
                  Montant en lettres :
                </div>
                <div style="font-size: 11px; font-style: italic; font-weight: 700; color: #0f172a; line-height: 1.4;">
                  ${amountInWords} Dinars Algériens
                </div>
              </div>
              <div style="margin-top: 10px; font-size: 9px; color: #64748b; font-style: italic; line-height: 1.35;">
                Document interne récapitulant l'activité des ventes sur la période indiquée. Ne constitue pas une facture fiscale officielle.
              </div>
            </td>
            <td style="vertical-align: top; width: 45%;">
              <div style="border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff;">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                  <tr>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 600;">Nombre de ventes</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 800; font-family: monospace;">${salesCount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 600;">Total des ventes</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 900; font-family: monospace; color: #0f172a;">${totalSales.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #059669; font-weight: 700;">Total payé</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 900; font-family: monospace; color: #059669;">${totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
                  </tr>
                  <tr style="background: ${remainingDebt > 0 ? '#fff1f2' : '#f8fafc'};">
                    <td style="padding: 6px 10px; color: ${remainingDebt > 0 ? '#e11d48' : '#64748b'}; font-weight: 800;">Reste à payer</td>
                    <td style="padding: 6px 10px; text-align: right; font-weight: 900; font-family: monospace; color: ${remainingDebt > 0 ? '#e11d48' : '#0f172a'};">${remainingDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>

        <!-- BAS DE PAGE / SIGNATURE -->
        <table style="width: 100%; margin-top: 30px;">
          <tr>
            <td style="vertical-align: top; width: 50%;">
              <div style="font-size: 11px; font-weight: 700; color: #334155;">
                Émetteur : <span style="font-weight: 800; color: #0f172a;">${issuer}</span>
              </div>
            </td>
            <td style="vertical-align: top; width: 50%; text-align: right;">
              <div style="font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 35px;">
                Signature et cachet :
              </div>
              <div style="display: inline-block; width: 180px; border-bottom: 1px dashed #94a3b8;"></div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, sysSettings, {
    title: `Recapitulatif_Ventes_${docNumber}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * IMPRESSION A4 DE LA LISTE DES PRIX (CONFORME À LA PHOTO 5 DU MODÈLE)
 * ══════════════════════════════════════════════════════════════════════
 */
export const printProductPriceListA4 = (options = {}, products = [], sysSettings = {}) => {
  const {
    onlyInStock = false,
    hideWithoutPrice = true,
    showBarcode = false,
    groupByCategory = false,
    columnsCount = 2,
    perimeter = 'Tous les produits'
  } = options;

  let list = [...products];
  if (onlyInStock) list = list.filter((p) => Number(p.stock || 0) > 0);
  if (hideWithoutPrice) list = list.filter((p) => Number(p.price || p.sellingPrice || 0) > 0);

  const storeName = sysSettings.storeName || 'NOVA MAG';
  const emissionDate = new Date().toLocaleDateString('fr-FR');
  const cols = Math.max(1, Math.min(4, Number(columnsCount) || 2));

  // Préparation des lignes en fonction du nombre de colonnes par page
  let tableRowsHtml = '';

  if (groupByCategory) {
    // Regroupement par catégorie
    const groups = {};
    list.forEach((p) => {
      const cat = p.categoryName || p.category || 'Général';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    Object.keys(groups).forEach((catName) => {
      const prodsInCat = groups[catName];
      tableRowsHtml += `
        <tr>
          <td colspan="${cols * 2}" style="padding: 10px 8px 6px; background: #f1f5f9; font-weight: 900; font-size: 12px; color: #1e293b; text-transform: uppercase; border-top: 2px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">
            📁 Rayon / Catégorie : ${catName} (${prodsInCat.length} articles)
          </td>
        </tr>
      `;

      for (let i = 0; i < prodsInCat.length; i += cols) {
        const chunk = prodsInCat.slice(i, i + cols);
        tableRowsHtml += '<tr>';
        for (let c = 0; c < cols; c++) {
          const item = chunk[c];
          if (item) {
            const price = Number(item.price || item.sellingPrice || 0);
            tableRowsHtml += `
              <td style="padding: 7px 10px; font-family: monospace; font-weight: 800; font-size: 11px; color: #0f172a; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; width: ${100 / (cols * 2)}%;">
                ${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style="padding: 7px 10px; font-weight: 700; font-size: 11px; color: #0f172a; border-bottom: 1px solid #e2e8f0; border-right: ${c < cols - 1 ? '2px solid #cbd5e1' : 'none'}; text-align: right; width: ${100 / (cols * 2)}%;">
                ${item.name}
                ${showBarcode && item.barcode ? `<span style="display: block; font-size: 9px; color: #64748b; font-family: monospace;">${item.barcode}</span>` : ''}
              </td>
            `;
          } else {
            tableRowsHtml += `
              <td style="border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;"></td>
              <td style="border-bottom: 1px solid #e2e8f0; border-right: ${c < cols - 1 ? '2px solid #cbd5e1' : 'none'};"></td>
            `;
          }
        }
        tableRowsHtml += '</tr>';
      }
    });
  } else {
    // Mode continu multi-colonnes standard (Photo 5)
    for (let i = 0; i < list.length; i += cols) {
      const chunk = list.slice(i, i + cols);
      tableRowsHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        const item = chunk[c];
        if (item) {
          const price = Number(item.price || item.sellingPrice || 0);
          tableRowsHtml += `
            <td style="padding: 7px 10px; font-family: monospace; font-weight: 800; font-size: 11px; color: #0f172a; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; width: ${100 / (cols * 2)}%;">
              ${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style="padding: 7px 10px; font-weight: 700; font-size: 11px; color: #0f172a; border-bottom: 1px solid #e2e8f0; border-right: ${c < cols - 1 ? '2px solid #cbd5e1' : 'none'}; text-align: right; width: ${100 / (cols * 2)}%;">
              ${item.name}
              ${showBarcode && item.barcode ? `<span style="display: block; font-size: 9px; color: #64748b; font-family: monospace;">${item.barcode}</span>` : ''}
            </td>
          `;
        } else {
          tableRowsHtml += `
            <td style="border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;"></td>
            <td style="border-bottom: 1px solid #e2e8f0; border-right: ${c < cols - 1 ? '2px solid #cbd5e1' : 'none'};"></td>
          `;
        }
      }
      tableRowsHtml += '</tr>';
    }
  }

  // En-têtes répétées selon le nombre de colonnes
  let headersHtml = '';
  for (let c = 0; c < cols; c++) {
    headersHtml += `
      <th style="padding: 8px 10px; background: #f8fafc; font-size: 10.5px; font-weight: 800; color: #1e293b; border-bottom: 2px solid #0f172a; border-right: 1px solid #e2e8f0; text-align: left;">
        Prix de Vente (DA)
      </th>
      <th style="padding: 8px 10px; background: #f8fafc; font-size: 10.5px; font-weight: 800; color: #1e293b; border-bottom: 2px solid #0f172a; border-right: ${c < cols - 1 ? '2px solid #cbd5e1' : 'none'}; text-align: right;">
        Nom du Produit
      </th>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Liste_des_Prix_${emissionDate.replace(/\//g, '-')}</title>
        <style>
          @page {
            margin: 10mm 12mm;
            size: A4 portrait;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 10mm 12mm;
            font-family: 'Segoe UI', Arial, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #0f172a;
            background: #fff;
            font-size: 11px;
            line-height: 1.35;
          }
          @media print {
            body { padding: 0; }
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
        </style>
      </head>
      <body>
        <!-- EN-TÊTE DU MAGASIN (PHOTO 5) -->
        <div style="text-align: right; margin-bottom: 10px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
            ${storeName}
          </h1>
        </div>
        <div style="border-top: 2.5px solid #0f172a; margin-bottom: 12px;"></div>

        <!-- MÉTADONNÉES & TITRE -->
        <table style="width: 100%; margin-bottom: 10px;">
          <tr>
            <td style="vertical-align: top; width: 50%;">
              <div style="font-size: 11px; font-weight: 700; color: #334155;">
                Date : <span style="font-weight: 800; color: #0f172a;">${emissionDate}</span>
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #334155; margin-top: 2px;">
                Nombre de produits : <span style="font-weight: 800; color: #0f172a;">${list.length}</span>
              </div>
            </td>
            <td style="vertical-align: top; width: 50%; text-align: right;">
              <div style="font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: -0.3px;">
                Liste des Prix <span style="color: #0f172a; font-weight: 900;">|</span>
              </div>
            </td>
          </tr>
        </table>

        <!-- BANDEAU PÉRIMÈTRE -->
        <div style="margin-bottom: 14px; padding: 7px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; font-weight: 700; color: #334155; text-align: right;">
          Périmètre : <strong style="color: #0f172a;">${perimeter}</strong>
        </div>

        <!-- TABLEAU MULTI-COLONNES DES PRODUITS -->
        <table style="width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; margin-bottom: 18px;">
          <thead>
            <tr>
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #64748b;">Aucun produit à afficher.</td></tr>'}
          </tbody>
        </table>

        <!-- NOTE DE BAS DE PAGE (PHOTO 5) -->
        <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #64748b; font-style: italic;">
          .Prix susceptibles d'être modifiés sans préavis
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, sysSettings, {
    title: `Liste_des_Prix_${emissionDate.replace(/\//g, '-')}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

/**
 * =========================================================================
 * IMPRESSION A4 FACTURE PRO-FORMA - DESIGN PROFESSIONNEL NOVAMAG (100% FRANÇAIS)
 * =========================================================================
 */
export const printProFormaA4 = (proforma, settings = {}) => {
  if (!proforma) return;

  const sysSettings = (() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      return saved ? { ...JSON.parse(saved), ...settings } : settings;
    } catch {
      return settings;
    }
  })();

  // Nom du magasin exclusivement en français
  const storeName = sysSettings.storeName && !sysSettings.storeName.includes('لومينا')
    ? sysSettings.storeName
    : 'NovaMag POS';
  const companyAddress = sysSettings.address || sysSettings.storeAddress || 'Alger, Algérie';
  const phone = sysSettings.phone || sysSettings.phoneMobile || '-';
  const phoneFixed = sysSettings.phoneFixed || sysSettings.storePhone || '-';
  const email = sysSettings.email || sysSettings.storeEmail || 'contact@novamag.dz';
  const rc = sysSettings.rc || sysSettings.storeRC || '-';
  const nif = sysSettings.nif || sysSettings.storeNIF || '-';
  const ai = sysSettings.ai || sysSettings.storeAI || '-';
  const nis = sysSettings.nis || sysSettings.storeNIS || '-';

  const docNum = proforma.documentNumber || `PRO-${proforma.id || '2026-0001'}`;
  const rawDate = proforma.date || new Date().toISOString();
  const dateFormatted = formatDateDMY(rawDate) || '08/11/2026';
  
  const isConverted = proforma.status === 'converted';
  const realInvoiceNum = proforma.convertedInvoiceNumber || `FAC-${new Date().getFullYear()}-${String(docNum).replace(/[^0-9]/g, '').slice(-4) || '0001'}`;
  const convertedDateFormatted = proforma.convertedAt ? formatDateDMY(proforma.convertedAt) : dateFormatted;

  const validityDays = Number(proforma.validityDays) || 15;
  const validUntilFormatted = (() => {
    if (proforma.validUntil) return formatDateDMY(proforma.validUntil);
    try {
      const d = new Date(rawDate);
      d.setDate(d.getDate() + validityDays);
      return formatDateDMY(d.toISOString());
    } catch {
      return '23/11/2026';
    }
  })();

  const clientName = proforma.clientName || proforma.client || 'Client Comptoir (Espèces)';
  const clientAddress = proforma.clientAddress || '-';
  const clientRc = proforma.clientRc || '-';
  const clientNif = proforma.clientNif || '-';
  const clientPhone = proforma.clientPhone || '-';

  const items = Array.isArray(proforma.items) ? proforma.items : [];
  const totalHT = Number(proforma.totalHT ?? proforma.total ?? 0);
  const discount = Number(proforma.discount ?? proforma.remise ?? 0);
  const netHT = Math.max(0, totalHT - discount);
  const totalEstimated = Number(proforma.totalEstimated ?? netHT) || 0;

  const rowsHtml = items.map((it, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const ref = it.barcode || it.ref || it.code || `REF-${it.id || idx + 1}`;
    const designation = it.name || it.designation || it.product_name || 'Article';
    const qty = Number(it.quantity || it.qty || 1).toFixed(2);
    const unit = it.unit || 'Pièce';
    const priceHT = Number(it.priceHT ?? it.price ?? 0).toFixed(2);
    const tva = it.tva !== undefined ? `${it.tva}%` : '0%';
    const lineTotal = Number(it.totalHT ?? (Number(it.quantity || 1) * Number(it.priceHT ?? it.price ?? 0))).toFixed(2);
    const bgRow = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

    return `
      <tr style="height: 36px; background-color: ${bgRow};">
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #475569; font-size: 11px;">${num}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-size: 11px; font-weight: 600; color: #334155;">${ref}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-weight: 700; color: #0f172a; font-size: 11.5px;">${designation}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #0f172a; font-size: 11.5px;">${qty}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px;">${unit}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 11.5px;">${priceHT}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px;">${tva}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 900; color: #1e3a8a; font-size: 12px;">${lineTotal}</td>
      </tr>
    `;
  }).join('');

  const frenchAmountWords = numberToFrenchWords(totalEstimated);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr" dir="ltr">
      <head>
        <meta charset="utf-8" />
        <title>${isConverted ? `Facture ${realInvoiceNum}` : `Facture Pro-forma ${docNum}`}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 16mm 14mm 16mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 28px 32px;
            font-size: 11.5px;
            line-height: 1.45;
          }
        </style>
      </head>
      <body>
        <!-- EN-TÊTE PRINCIPAL CORPORATE NOVAMAG -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid ${isConverted ? '#10b981' : '#2563eb'};">
          <tr>
            <!-- IDENTITÉ DU MAGASIN (GAUCHE) -->
            <td style="vertical-align: top; width: 55%;">
              <div style="font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 4px;">
                ${storeName}
              </div>
              <div style="font-size: 11px; font-weight: 700; color: ${isConverted ? '#059669' : '#2563eb'}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                Commerce & Distribution • Point de Vente
              </div>
              <div style="font-size: 11.5px; color: #334155; margin-bottom: 4px;">
                <strong>Adresse :</strong> ${companyAddress}
              </div>
              <div style="font-size: 11px; color: #334155; margin-bottom: 4px;">
                <strong>Tél :</strong> ${phone} &nbsp;•&nbsp; <strong>Fixe :</strong> ${phoneFixed} &nbsp;•&nbsp; <strong>Email :</strong> ${email}
              </div>
              <div style="font-size: 10.5px; color: #475569; font-weight: 600;">
                <span><strong>RC :</strong> ${rc}</span> &nbsp;|&nbsp;
                <span><strong>NIF :</strong> ${nif}</span> &nbsp;|&nbsp;
                <span><strong>AI :</strong> ${ai}</span> &nbsp;|&nbsp;
                <span><strong>NIS :</strong> ${nis}</span>
              </div>
            </td>

            <!-- BLOC TITRE DOCUMENT & DATES (DROITE) -->
            <td style="vertical-align: top; width: 45%; text-align: right;">
              <div style="display: inline-block; background: ${isConverted ? '#ecfdf5' : '#eff6ff'}; border: 1.5px solid ${isConverted ? '#a7f3d0' : '#bfdbfe'}; border-radius: 12px; padding: 12px 18px; text-align: right; min-width: 260px;">
                <div style="font-size: 10px; font-weight: 800; color: ${isConverted ? '#047857' : '#1d4ed8'}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">
                  ${isConverted ? 'FACTURE DÉFINITIVE DE VENTE' : 'Proposition Commerciale'}
                </div>
                <div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.3px;">
                  ${isConverted ? `FACTURE N° ${realInvoiceNum}` : `PRO-FORMA N° ${docNum}`}
                </div>
                ${isConverted ? `
                  <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 6px;">
                    Réf. devis d'origine : <strong>${docNum}</strong>
                  </div>
                  <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">
                    Date de facturation : <strong>${convertedDateFormatted}</strong>
                  </div>
                  <div style="font-size: 11px; font-weight: 800; color: #16a34a; margin-top: 4px;">
                    Statut : <strong>VENTE VALIDÉE & COMPTABILISÉE</strong>
                  </div>
                ` : `
                  <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">
                    Date d'émission : <strong>${dateFormatted}</strong>
                  </div>
                  <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">
                    Validité de l'offre : <strong>${validityDays} jours</strong>
                  </div>
                  <div style="font-size: 11px; font-weight: 700; color: #dc2626;">
                    Valable jusqu'au : <strong>${validUntilFormatted}</strong>
                  </div>
                `}
              </div>
            </td>
          </tr>
        </table>

        <!-- BANDEAU DE STATUT OFFICIEL -->
        ${isConverted ? `
          <div style="margin-bottom: 20px; background: #ecfdf5; border-left: 4px solid #10b981; border-top: 1px solid #d1fae5; border-right: 1px solid #d1fae5; border-bottom: 1px solid #d1fae5; border-radius: 6px; padding: 7px 14px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11.5px; font-weight: 800; color: #065f46;">
              ✅ FACTURE DE VENTE OFFICIELLE — DOCUMENT COMPTABLE ET FISCAL VALABLE
            </span>
            <span style="font-size: 10px; font-weight: 800; color: #047857; background: #d1fae5; padding: 2px 8px; border-radius: 4px;">
              STOCK DÉBITÉ • VENTE ACQUITTÉE
            </span>
          </div>
        ` : `
          <div style="margin-bottom: 20px; background: #fffbeb; border-left: 4px solid #f59e0b; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7; border-radius: 6px; padding: 7px 14px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11.5px; font-weight: 800; color: #92400e;">
              ⚠️ FACTURE PRO-FORMA — DOCUMENT D'INFORMATION DEVIS SANS VALEUR COMPTABLE NI FISCALE
            </span>
            <span style="font-size: 10px; font-weight: 700; color: #b45309; background: #fef3c7; padding: 2px 8px; border-radius: 4px;">
              Prix garantis ${validityDays} jours
            </span>
          </div>
        `}

        <!-- CADRE CLIENT / DESTINATAIRE -->
        <div style="margin-bottom: 22px; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; background: #ffffff;">
          <div style="font-size: 10px; font-weight: 900; color: ${isConverted ? '#059669' : '#2563eb'}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">
            ${isConverted ? 'Client / Facturé à :' : 'Client / Destinataire du devis :'}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">
                  ${clientName}
                </div>
                <div style="color: #475569; margin-bottom: 2px;">
                  <strong>Adresse :</strong> ${clientAddress}
                </div>
                <div style="color: #475569;">
                  <strong>Téléphone :</strong> ${clientPhone}
                </div>
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <div style="color: #334155; margin-bottom: 3px;">
                  <strong>N° Registre Commerce (RC) :</strong> ${clientRc}
                </div>
                <div style="color: #334155;">
                  <strong>Identifiant Fiscal (NIF) :</strong> ${clientNif}
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- TABLEAU DES ARTICLES -->
        <div style="position: relative; margin-bottom: 24px;">
          <!-- FILIGRANE DISCRET -->
          <div style="position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-18deg); font-size: 78px; font-weight: 900; color: ${isConverted ? 'rgba(16, 185, 129, 0.04)' : 'rgba(37, 99, 235, 0.05)'}; pointer-events: none; z-index: 1; letter-spacing: 8px; white-space: nowrap; user-select: none;">
            ${isConverted ? 'FACTURE OFFICIELLE' : 'DEVIS PRO-FORMA'}
          </div>

          <table style="width: 100%; border-collapse: collapse; position: relative; z-index: 2; border: 1.5px solid #0f172a; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff; height: 34px;">
                <th style="padding: 8px 10px; font-size: 10.5px; font-weight: 800; text-align: center; width: 5%;">N°</th>
                <th style="padding: 8px 10px; font-size: 10.5px; font-weight: 800; text-align: center; width: 17%;">RÉFÉRENCE</th>
                <th style="padding: 8px 12px; font-size: 10.5px; font-weight: 800; text-align: left; width: 36%;">DÉSIGNATION DE L'ARTICLE</th>
                <th style="padding: 8px 10px; font-size: 10.5px; font-weight: 800; text-align: center; width: 9%;">QTÉ</th>
                <th style="padding: 8px 10px; font-size: 10.5px; font-weight: 800; text-align: center; width: 7%;">UNITÉ</th>
                <th style="padding: 8px 12px; font-size: 10.5px; font-weight: 800; text-align: right; width: 12%;">PRIX UNIT. HT</th>
                <th style="padding: 8px 10px; font-size: 10.5px; font-weight: 800; text-align: center; width: 6%;">TVA</th>
                <th style="padding: 8px 12px; font-size: 10.5px; font-weight: 800; text-align: right; width: 14%;">MONTANT HT</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="padding: 24px; text-align: center; color: #94a3b8;">Aucun article dans cette facture.</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- ZONE INFÉRIEURE : TOTAL EN LETTRES & CACHET (GAUCHE) / BLOC FINANCIER (DROITE) -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <!-- TOTAL EN LETTRES & SIGNATURE -->
            <td style="vertical-align: top; width: 56%; padding-right: 25px;">
              <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 15px; margin-bottom: 16px;">
                <div style="font-size: 10.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px;">
                  Montant total arrêté en lettres :
                </div>
                <div style="font-size: 12px; font-weight: 800; color: #0f172a; font-style: italic; line-height: 1.4;">
                  « ${frenchAmountWords} »
                </div>
              </div>

              <!-- BLOCS SIGNATURE & CACHET -->
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <td style="width: 50%; padding-right: 8px;">
                    <div style="border: 1.5px dashed #cbd5e1; border-radius: 8px; height: 95px; padding: 8px 10px; text-align: center;">
                      <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">
                        ${isConverted ? 'Pour Réception & Conformité (Client)' : 'Bon pour Accord (Client)'}
                      </div>
                      <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">
                        ${isConverted ? 'Date et signature du client' : 'Date & Signature précédée de "Bon pour accord"'}
                      </div>
                    </div>
                  </td>
                  <td style="width: 50%; padding-left: 8px;">
                    <div style="border: 1.5px dashed #cbd5e1; border-radius: 8px; height: 95px; padding: 8px 10px; text-align: center;">
                      <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">
                        ${isConverted ? 'Cachet & Signature (Pour Acquît)' : 'Cachet & Signature Établissement'}
                      </div>
                      <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">
                        ${storeName}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>

            <!-- RÉCAPITULATIF FINANCIER -->
            <td style="vertical-align: top; width: 44%;">
              <div style="border: 2px solid #0f172a; border-radius: 12px; overflow: hidden; background: #ffffff;">
                <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                    <span>Total Brut HT :</span>
                    <span style="font-weight: 800; color: #0f172a;">${totalHT.toFixed(2)} DA</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                    <span>Remise Commerciale :</span>
                    <span style="font-weight: 800; color: #dc2626;">-${discount.toFixed(2)} DA</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                    <span>Net HT Imposable :</span>
                    <span style="font-weight: 800; color: #0f172a;">${netHT.toFixed(2)} DA</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #334155;">
                    <span>Total TVA (0%) :</span>
                    <span style="font-weight: 800; color: #0f172a;">0.00 DA</span>
                  </div>
                </div>

                <!-- TOTAL ESTIMÉ OU TOTAL NET TTC -->
                <div style="padding: 12px 16px; background: #0f172a; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${isConverted ? 'NET À PAYER (TTC) :' : 'Total Estimé (TTC) :'}
                  </div>
                  <div style="font-size: 18px; font-weight: 900; color: #60a5fa; letter-spacing: -0.3px;">
                    ${totalEstimated.toFixed(2)} DA
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- MENTION LÉGALE CORPORATE FRANÇAIS (BAS DE PAGE) -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 10px; color: #64748b; text-align: center; line-height: 1.4;">
          ${isConverted
            ? `Document comptable officiel généré par NovaMag POS • Facture définitive acquittée • Marchandise livrée et débitée des stocks magasin.`
            : `Document généré par NovaMag POS • Ce devis est valable pendant ${validityDays} jours à compter de sa date d'émission • En cas d'acceptation, merci de retourner ce document signé et revêtu du cachet commercial.`}
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, sysSettings, {
    title: isConverted ? `Facture_Definitive_${realInvoiceNum}` : `Facture_Proforma_${docNum}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * IMPRESSION A4 DU BON DE COMMANDE CLIENT (AVEC ACOMPTE & LIVRAISON PRÉVUE)
 * Conforme aux maquettes NovaMag (Corporate, Français, Reste à payer, Conditions)
 * ════════════════════════════════════════════════════════════════════════════════
 */
export const printOrderFormA4 = (orderForm, settings = {}) => {
  if (!orderForm) return;

  const sysSettings = (() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      return saved ? { ...JSON.parse(saved), ...settings } : settings;
    } catch {
      return settings;
    }
  })();

  const storeName = sysSettings.storeName && !sysSettings.storeName.includes('لومينا')
    ? sysSettings.storeName
    : 'NovaMag POS';
  const companyAddress = sysSettings.address || sysSettings.storeAddress || 'Alger, Algérie';
  const phone = sysSettings.phone || sysSettings.phoneMobile || '-';
  const phoneFixed = sysSettings.phoneFixed || sysSettings.storePhone || '-';
  const email = sysSettings.email || sysSettings.storeEmail || 'contact@novamag.dz';
  const rc = sysSettings.rc || sysSettings.storeRC || '-';
  const nif = sysSettings.nif || sysSettings.storeNIF || '-';
  const ai = sysSettings.ai || sysSettings.storeAI || '-';
  const nis = sysSettings.nis || sysSettings.storeNIS || '-';

  const docNum = orderForm.documentNumber || `BC-${orderForm.id || '2026-0001'}`;
  const rawDate = orderForm.date || new Date().toISOString();
  const dateFormatted = formatDateDMY(rawDate) || '09/11/2026';

  const deliveryRawDate = orderForm.deliveryDate || orderForm.expectedDeliveryDate || orderForm.dateLivraisonPrevue || rawDate;
  const deliveryDateFormatted = formatDateDMY(deliveryRawDate) || '16/11/2026';

  const isDelivered = orderForm.status === 'delivered' || orderForm.status === 'validated';
  const isCancelled = orderForm.status === 'cancelled';
  const statusLabel = isDelivered ? 'Livrée' : isCancelled ? 'Annulée' : 'En attente';
  const statusColor = isDelivered ? '#10b981' : isCancelled ? '#ef4444' : '#f59e0b';
  const statusBg = isDelivered ? '#ecfdf5' : isCancelled ? '#fef2f2' : '#fffbeb';
  const statusBorder = isDelivered ? '#a7f3d0' : isCancelled ? '#fecaca' : '#fde68a';

  const realInvoiceNum = orderForm.convertedInvoiceNumber || `FAC-${new Date().getFullYear()}-${String(docNum).replace(/[^0-9]/g, '').slice(-4) || '0001'}`;
  const deliveredDateFormatted = orderForm.deliveredAt ? formatDateDMY(orderForm.deliveredAt) : (deliveryDateFormatted || dateFormatted);

  const clientName = orderForm.clientName || orderForm.client || 'Client Comptoir (Espèces)';
  const clientAddress = orderForm.clientAddress || '-';
  const clientRc = orderForm.clientRc || '-';
  const clientNif = orderForm.clientNif || '-';
  const clientPhone = orderForm.clientPhone || '-';

  const items = Array.isArray(orderForm.items) ? orderForm.items : [];
  const totalAmount = Number(orderForm.total ?? orderForm.totalHT ?? 0);
  const discount = Number(orderForm.discount ?? 0);
  const netTotal = Math.max(0, totalAmount - discount);
  const depositPaid = Number(orderForm.depositPaid ?? orderForm.deposit ?? orderForm.acompte ?? 0);
  const remainingDue = Math.max(0, netTotal - depositPaid);

  const frenchAmountWords = numberToFrenchWords(netTotal);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SI LA COMMANDE EST LIVRÉE : IMPRESSION EN FACTURE DÉFINITIVE DE VENTE
  // ─────────────────────────────────────────────────────────────────────────────
  if (isDelivered) {
    const invoiceRowsHtml = items.map((it, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const ref = it.barcode || it.ref || it.code || `REF-${it.id || idx + 1}`;
      const designation = it.name || it.designation || it.product_name || 'Article';
      const qty = Number(it.quantity || it.qty || 1).toFixed(2);
      const unit = it.unit || 'Pièce';
      const priceHT = Number(it.priceHT ?? it.price ?? it.sale_price ?? 0).toFixed(2);
      const tva = it.tva !== undefined ? `${it.tva}%` : '0%';
      const lineTotal = Number(it.totalHT ?? it.total ?? (Number(it.quantity || 1) * Number(it.priceHT ?? it.price ?? 0))).toFixed(2);
      const bgRow = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

      return `
        <tr style="height: 36px; background-color: ${bgRow};">
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #475569; font-size: 11px;">${num}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-size: 11px; font-weight: 600; color: #334155;">${ref}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-weight: 700; color: #0f172a; font-size: 11.5px;">${designation}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #0f172a; font-size: 11.5px;">${qty}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px;">${unit}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 11.5px;">${priceHT}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px;">${tva}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 900; color: #047857; font-size: 12px;">${lineTotal}</td>
        </tr>
      `;
    }).join('');

    const invoiceHtml = `
      <!DOCTYPE html>
      <html lang="fr" dir="ltr">
        <head>
          <meta charset="utf-8" />
          <title>Facture ${realInvoiceNum}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 16mm 14mm 16mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 28px 32px;
              font-size: 11.5px;
              line-height: 1.45;
            }
          </style>
        </head>
        <body>
          <!-- EN-TÊTE PRINCIPAL CORPORATE NOVAMAG ÉMERAUDE -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #10b981;">
            <tr>
              <!-- IDENTITÉ DU MAGASIN (GAUCHE) -->
              <td style="vertical-align: top; width: 55%;">
                <div style="font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 4px;">
                  ${storeName}
                </div>
                <div style="font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                  Commerce & Distribution • Facture de Vente Officielle
                </div>
                <div style="font-size: 11.5px; color: #334155; margin-bottom: 4px;">
                  <strong>Adresse :</strong> ${companyAddress}
                </div>
                <div style="font-size: 11px; color: #334155; margin-bottom: 4px;">
                  <strong>Tél :</strong> ${phone} &nbsp;•&nbsp; <strong>Fixe :</strong> ${phoneFixed} &nbsp;•&nbsp; <strong>Email :</strong> ${email}
                </div>
                <div style="font-size: 10.5px; color: #475569; font-weight: 600;">
                  <span><strong>RC :</strong> ${rc}</span> &nbsp;|&nbsp;
                  <span><strong>NIF :</strong> ${nif}</span> &nbsp;|&nbsp;
                  <span><strong>AI :</strong> ${ai}</span> &nbsp;|&nbsp;
                  <span><strong>NIS :</strong> ${nis}</span>
                </div>
              </td>

              <!-- BLOC TITRE FACTURE DÉFINITIVE & DATES (DROITE) -->
              <td style="vertical-align: top; width: 45%; text-align: right;">
                <div style="display: inline-block; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 12px; padding: 12px 18px; text-align: right; min-width: 270px;">
                  <div style="font-size: 10px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">
                    FACTURE DÉFINITIVE DE VENTE
                  </div>
                  <div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.3px;">
                    FACTURE N° ${realInvoiceNum}
                  </div>
                  <div style="font-size: 10.5px; font-weight: 700; color: #64748b; margin-bottom: 4px;">
                    Réf. commande d'origine : <strong>${docNum}</strong>
                  </div>
                  <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 3px;">
                    Date d'émission : <strong>${deliveredDateFormatted}</strong>
                  </div>
                  <div style="font-size: 11px; font-weight: 800; color: #16a34a; margin-top: 4px;">
                    Statut : <strong>VENTE VALIDÉE & MARCHANDISE LIVRÉE</strong>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- BANDEAU DE STATUT OFFICIEL COMPTABLE -->
          <div style="margin-bottom: 20px; background: #ecfdf5; border-left: 4px solid #10b981; border-top: 1px solid #d1fae5; border-right: 1px solid #d1fae5; border-bottom: 1px solid #d1fae5; border-radius: 6px; padding: 7px 14px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11.5px; font-weight: 800; color: #065f46;">
              ✅ FACTURE DE VENTE OFFICIELLE — DOCUMENT COMPTABLE ET FISCAL VALABLE
            </span>
            <span style="font-size: 10px; font-weight: 800; color: #047857; background: #d1fae5; padding: 2px 8px; border-radius: 4px;">
              STOCK DÉBITÉ • VENTE ACQUITTÉE
            </span>
          </div>

          <!-- CADRE CLIENT / FACTURÉ À -->
          <div style="margin-bottom: 22px; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; background: #ffffff;">
            <div style="font-size: 10px; font-weight: 900; color: #059669; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">
              Client / Facturé à :
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
              <tr>
                <td style="width: 50%; vertical-align: top;">
                  <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">
                    ${clientName}
                  </div>
                  <div style="color: #475569; margin-bottom: 2px;">
                    <strong>Adresse :</strong> ${clientAddress}
                  </div>
                  <div style="color: #475569;">
                    <strong>Téléphone :</strong> ${clientPhone}
                  </div>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right;">
                  <div style="color: #334155; margin-bottom: 3px;">
                    <strong>N° Registre Commerce (RC) :</strong> ${clientRc}
                  </div>
                  <div style="color: #334155;">
                    <strong>Identifiant Fiscal (NIF) :</strong> ${clientNif}
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- TABLEAU DES ARTICLES -->
          <div style="position: relative; margin-bottom: 24px;">
            <!-- FILIGRANE DISCRET -->
            <div style="position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-18deg); font-size: 76px; font-weight: 900; color: rgba(16, 185, 129, 0.05); pointer-events: none; z-index: 1; letter-spacing: 8px; white-space: nowrap; user-select: none;">
              FACTURE OFFICIELLE
            </div>

            <table style="width: 100%; border-collapse: collapse; position: relative; z-index: 2; border: 1.5px solid #0f172a; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #0f172a; color: #ffffff; height: 34px;">
                  <th style="padding: 8px 10px; font-size: 10.5px; font-weight: 800; text-align: center; width: 5%;">N°</th>
                  <th style="padding: 8px 10px; font-size: 10.5px; font-weight: 800; text-align: center; width: 17%;">RÉFÉRENCE</th>
                  <th style="padding: 8px 12px; font-size: 10.5px; font-weight: 800; text-align: left; width: 36%;">DÉSIGNATION DE L'ARTICLE</th>
                  <th style="padding: 8px 10px; font-size: 10.5px; font-weight: 800; text-align: center; width: 9%;">QTÉ</th>
                  <th style="padding: 8px 10px; font-size: 10.5px; font-weight: 800; text-align: center; width: 7%;">UNITÉ</th>
                  <th style="padding: 8px 12px; font-size: 10.5px; font-weight: 800; text-align: right; width: 12%;">PRIX UNIT. HT</th>
                  <th style="padding: 8px 10px; font-size: 10.5px; font-weight: 800; text-align: center; width: 6%;">TVA</th>
                  <th style="padding: 8px 12px; font-size: 10.5px; font-weight: 800; text-align: right; width: 14%;">MONTANT HT</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceRowsHtml || '<tr><td colspan="8" style="padding: 24px; text-align: center; color: #94a3b8;">Aucun article dans cette facture.</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- ZONE INFÉRIEURE : TOTAL EN LETTRES & CACHET (GAUCHE) / BLOC FINANCIER (DROITE) -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr>
              <!-- TOTAL EN LETTRES & SIGNATURE -->
              <td style="vertical-align: top; width: 56%; padding-right: 25px;">
                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 15px; margin-bottom: 16px;">
                  <div style="font-size: 10.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px;">
                    Montant total arrêté en lettres :
                  </div>
                  <div style="font-size: 12px; font-weight: 800; color: #0f172a; font-style: italic; line-height: 1.4;">
                    « ${frenchAmountWords} »
                  </div>
                </div>

                <!-- BLOCS SIGNATURE & CACHET -->
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                  <tr>
                    <td style="width: 50%; padding-right: 8px;">
                      <div style="border: 1.5px dashed #cbd5e1; border-radius: 8px; height: 95px; padding: 8px 10px; text-align: center;">
                        <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">
                          Pour Réception & Conformité (Client)
                        </div>
                        <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">
                          Date et signature du client
                        </div>
                      </div>
                    </td>
                    <td style="width: 50%; padding-left: 8px;">
                      <div style="border: 1.5px dashed #cbd5e1; border-radius: 8px; height: 95px; padding: 8px 10px; text-align: center;">
                        <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">
                          Cachet & Signature (Pour Acquît)
                        </div>
                        <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">
                          ${storeName}
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>

              <!-- RÉCAPITULATIF FINANCIER -->
              <td style="vertical-align: top; width: 44%;">
                <div style="border: 2px solid #0f172a; border-radius: 12px; overflow: hidden; background: #ffffff;">
                  <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                      <span>Total Brut HT :</span>
                      <span style="font-weight: 800; color: #0f172a;">${totalAmount.toFixed(2)} DA</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                      <span>Remise Commerciale :</span>
                      <span style="font-weight: 800; color: #dc2626;">-${discount.toFixed(2)} DA</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                      <span>Net HT Imposable :</span>
                      <span style="font-weight: 800; color: #0f172a;">${netTotal.toFixed(2)} DA</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                      <span>Total TVA (0%) :</span>
                      <span style="font-weight: 800; color: #0f172a;">0.00 DA</span>
                    </div>
                    ${depositPaid > 0 ? `
                      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #166534; margin-bottom: 6px; border-top: 1px dashed #cbd5e1; padding-top: 5px;">
                        <span>Acompte déjà versé :</span>
                        <span>-${depositPaid.toFixed(2)} DA</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #1e3a8a;">
                        <span>Solde réglé à livraison :</span>
                        <span>${remainingDue.toFixed(2)} DA</span>
                      </div>
                    ` : ''}
                  </div>

                  <!-- NET À PAYER (TTC) -->
                  <div style="padding: 12px 16px; background: #0f172a; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                      NET À PAYER (TTC) :
                    </div>
                    <div style="font-size: 18px; font-weight: 900; color: #34d399; letter-spacing: -0.3px;">
                      ${netTotal.toFixed(2)} DA
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- MENTION LÉGALE CORPORATE FRANÇAIS (BAS DE PAGE) -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 10px; color: #64748b; text-align: center; line-height: 1.4;">
            Document comptable officiel généré par NovaMag POS • Facture définitive acquittée • Marchandise livrée et débitée des stocks magasin.
          </div>
        </body>
      </html>
    `;

    triggerSilentIframePrint(invoiceHtml, sysSettings, {
      title: `Facture_Definitive_${realInvoiceNum}`,
      format: 'A4',
      widthMm: 210,
      forcePreview: true
    });
    return;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. SI LA COMMANDE EST EN ATTENTE OU ANNULÉE : IMPRESSION BON DE COMMANDE
  // ─────────────────────────────────────────────────────────────────────────────
  const rowsHtml = items.map((it, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const ref = it.barcode || it.ref || it.code || `REF-${it.id || idx + 1}`;
    const designation = it.name || it.designation || it.product_name || 'Article';
    const qty = Number(it.quantity || it.qty || 1).toFixed(2);
    const unit = it.unit || 'Pièce';
    const priceHT = Number(it.priceHT ?? it.price ?? it.sale_price ?? 0).toFixed(2);
    const lineTotal = Number(it.totalHT ?? it.total ?? (Number(it.quantity || 1) * Number(it.priceHT ?? it.price ?? 0))).toFixed(2);
    const itemStatus = isCancelled ? 'Annulé' : 'En attente';
    const bgRow = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

    return `
      <tr style="height: 36px; background-color: ${bgRow};">
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #475569; font-size: 11px;">${num}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-size: 11px; font-weight: 600; color: #334155;">${ref}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-weight: 700; color: #0f172a; font-size: 11.5px;">${designation}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px;">${unit}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #0f172a; font-size: 11.5px;">${qty}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 11.5px;">${priceHT}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 900; color: #1e3a8a; font-size: 12px;">${lineTotal}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: ${statusColor}; font-size: 11px;">${itemStatus}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr" dir="ltr">
      <head>
        <meta charset="utf-8" />
        <title>Bon de Commande ${docNum}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm 16mm 14mm 16mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 26px 30px;
            font-size: 11.5px;
            line-height: 1.45;
          }
        </style>
      </head>
      <body>
        <!-- EN-TÊTE PRINCIPAL CORPORATE NOVAMAG -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #2563eb;">
          <tr>
            <!-- IDENTITÉ DU MAGASIN (GAUCHE) -->
            <td style="vertical-align: top; width: 55%;">
              <div style="font-size: 25px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 4px;">
                ${storeName}
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                Commerce & Distribution • Point de Vente
              </div>
              <div style="font-size: 11.5px; color: #334155; margin-bottom: 4px;">
                <strong>Adresse :</strong> ${companyAddress}
              </div>
              <div style="font-size: 11px; color: #334155; margin-bottom: 4px;">
                <strong>Tél :</strong> ${phone} &nbsp;•&nbsp; <strong>Fixe :</strong> ${phoneFixed} &nbsp;•&nbsp; <strong>Email :</strong> ${email}
              </div>
              <div style="font-size: 10.5px; color: #475569; font-weight: 600;">
                <span><strong>RC :</strong> ${rc}</span> &nbsp;|&nbsp;
                <span><strong>NIF :</strong> ${nif}</span> &nbsp;|&nbsp;
                <span><strong>AI :</strong> ${ai}</span> &nbsp;|&nbsp;
                <span><strong>NIS :</strong> ${nis}</span>
              </div>
            </td>

            <!-- BLOC TITRE DU DOCUMENT & DATE DE LIVRAISON (DROITE) -->
            <td style="vertical-align: top; width: 45%; text-align: right;">
              <div style="display: inline-block; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 12px 18px; text-align: right; min-width: 270px;">
                <div style="font-size: 10px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">
                  COMMANDE CLIENT
                </div>
                <div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.3px;">
                  BON DE COMMANDE N° ${docNum}
                </div>
                <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 3px;">
                  Date de commande : <strong>${dateFormatted}</strong>
                </div>
                <div style="font-size: 12px; font-weight: 900; color: #2563eb; margin-bottom: 5px;">
                  Livraison prévue : <strong>${deliveryDateFormatted}</strong>
                </div>
                <div style="font-size: 11px; font-weight: 800; margin-top: 4px;">
                  Statut : <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">${statusLabel}</span>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- BANDEAU INFO BON DE COMMANDE CLIENT -->
        <div style="margin-bottom: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 7px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">
            📋 Bon de Commande Client — Réservation de Stock avec Acompte
          </div>
          <div style="font-size: 10.5px; font-weight: 700; color: #166534;">
            Livraison convenue au : ${deliveryDateFormatted}
          </div>
        </div>

        <!-- ENCADRÉ CLIENT DESTINATAIRE -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr>
            <td style="border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; background: #f8fafc;">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #2563eb; letter-spacing: 0.5px; margin-bottom: 4px;">
                Client / Destinataire de la commande :
              </div>
              <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 4px;">
                ${clientName}
              </div>
              <div style="font-size: 11px; color: #334155;">
                <strong>Adresse :</strong> ${clientAddress} &nbsp;•&nbsp; 
                <strong>Tél :</strong> ${clientPhone} &nbsp;•&nbsp; 
                <strong>RC :</strong> ${clientRc} &nbsp;•&nbsp; 
                <strong>NIF :</strong> ${clientNif}
              </div>
            </td>
          </tr>
        </table>

        <!-- TABLEAU DES ARTICLES DE LA COMMANDE -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; height: 34px;">
              <th style="padding: 6px 10px; text-align: center; width: 5%;">N°</th>
              <th style="padding: 6px 10px; text-align: center; width: 17%;">Réf</th>
              <th style="padding: 6px 12px; text-align: left; width: 33%;">Désignation</th>
              <th style="padding: 6px 10px; text-align: center; width: 9%;">Unité</th>
              <th style="padding: 6px 10px; text-align: center; width: 8%;">Qté</th>
              <th style="padding: 6px 12px; text-align: right; width: 13%;">Prix HT</th>
              <th style="padding: 6px 12px; text-align: right; width: 15%;">Total</th>
              <th style="padding: 6px 10px; text-align: center; width: 10%;">Livraison</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `
              <tr>
                <td colspan="8" style="padding: 24px; text-align: center; color: #64748b; font-style: italic;">
                  Aucun article spécifié sur cette commande
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- ZONE INFÉRIEURE : TOTAL HT, ACOMPTE & RESTE À PAYER -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr>
            <!-- RÉCAPITULATIF GAUCHE (HT / REMISE / NET) -->
            <td style="vertical-align: top; width: 50%; padding-right: 12px;">
              <div style="border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                  <span>Total HT :</span>
                  <span style="font-weight: 800; color: #0f172a;">${totalAmount.toFixed(2)} DA</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                  <span>Remise :</span>
                  <span style="font-weight: 800; color: #dc2626;">-${discount.toFixed(2)} DA</span>
                </div>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #0f172a;">
                  <span>Total :</span>
                  <span style="font-weight: 900;">${netTotal.toFixed(2)} DA</span>
                </div>
              </div>
            </td>

            <!-- RÉCAPITULATIF DROIT (MONTANT TOTAL / ACOMPTE / RESTE À PAYER) -->
            <td style="vertical-align: top; width: 50%; padding-left: 12px;">
              <div style="border: 2px solid #3b82f6; border-radius: 12px; padding: 12px 16px; background: #eff6ff;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #1e3a8a; margin-bottom: 6px;">
                  <span>Montant total :</span>
                  <span style="font-size: 13px; font-weight: 900; color: #0f172a;">${netTotal.toFixed(2)} DA</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #166534; margin-bottom: 6px;">
                  <span>Acompte versé :</span>
                  <span style="font-size: 13px; font-weight: 900; color: #16a34a;">${depositPaid.toFixed(2)} DA</span>
                </div>
                <div style="border-top: 1.5px solid #bfdbfe; padding-top: 6px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; color: #b91c1c;">
                  <span>Reste à payer :</span>
                  <span style="font-size: 14px; font-weight: 900; color: #dc2626;">${remainingDue.toFixed(2)} DA</span>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- TOTAL EN LETTRES -->
        <div style="margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 14px;">
          <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 2px;">
            Total en lettres :
          </div>
          <div style="font-size: 11.5px; font-weight: 800; color: #0f172a; font-style: italic;">
            « ${frenchAmountWords} »
          </div>
        </div>

        <!-- CONDITIONS DU BON DE COMMANDE -->
        <div style="margin-bottom: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 14px; font-size: 10px; color: #475569; line-height: 1.45;">
          <strong>Conditions :</strong> l'acompte n'est pas remboursable une fois la préparation de la commande commencée. Le vendeur s'engage à livrer à la date convenue. Toute modification doit faire l'objet d'un accord écrit des deux parties.
        </div>

        <!-- SIGNATURES & CACHETS (CONFORME PHOTO 4) -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 12px;">
          <tr>
            <td style="width: 50%; padding-right: 20px; vertical-align: top;">
              <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
                L'expéditeur :
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #2563eb; margin-bottom: 30px;">
                ${storeName}
              </div>
              <div style="border-top: 1px solid #94a3b8; width: 85%; padding-top: 4px; font-size: 10px; color: #64748b;">
                Signature et cachet
              </div>
            </td>
            <td style="width: 50%; padding-left: 20px; vertical-align: top; text-align: right;">
              <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
                Signature client :
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 30px;">
                ${clientName}
              </div>
              <div style="border-top: 1px solid #94a3b8; width: 85%; margin-left: auto; padding-top: 4px; font-size: 10px; color: #64748b;">
                Signature
              </div>
            </td>
          </tr>
        </table>

        <!-- BAS DE PAGE -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 9.5px; color: #94a3b8; text-align: center;">
          Document généré par NovaMag POS • Bon de commande et réservation de marchandise
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, sysSettings, {
    title: `Bon_de_Commande_${docNum}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * IMPRESSION A4 DU RAPPORT STATISTIQUE & EXÉCUTIF (CONFORME PHOTOS 4 & 5)
 * Design Corporate NovaMag (En-tête officiel, DA, KPI financiers, Dettes, Stock, Rentabilité)
 * ════════════════════════════════════════════════════════════════════════════════
 */
export const printStatisticsReportA4 = (statsData = {}, settings = {}) => {
  const sysSettings = (() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      return saved ? { ...JSON.parse(saved), ...settings } : settings;
    } catch {
      return settings;
    }
  })();

  const storeName = sysSettings.storeName && !sysSettings.storeName.includes('لومينا')
    ? sysSettings.storeName
    : 'NovaMag POS';
  const companyAddress = sysSettings.address || sysSettings.storeAddress || 'Alger, Algérie';
  const phone = sysSettings.phone || sysSettings.phoneMobile || '-';
  const phoneFixed = sysSettings.phoneFixed || sysSettings.storePhone || '-';
  const email = sysSettings.email || sysSettings.storeEmail || 'contact@novamag.dz';
  const rc = sysSettings.rc || sysSettings.storeRC || '-';
  const nif = sysSettings.nif || sysSettings.storeNIF || '-';
  const ai = sysSettings.ai || sysSettings.storeAI || '-';
  const nis = sysSettings.nis || sysSettings.storeNIS || '-';

  const dateFrom = statsData.dateFrom || '09/11/2026 00:00';
  const dateTo = statsData.dateTo || '09/11/2026 23:59';
  const generatedAt = new Date().toLocaleString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const revenues = Number(statsData.revenues ?? 9760);
  const returns = Number(statsData.returns ?? 0);
  const netRevenue = Number(statsData.netRevenue ?? (revenues - returns));
  const cogs = Number(statsData.cogs ?? 6400);
  const grossProfit = Number(statsData.grossProfit ?? (netRevenue - cogs));
  const expenses = Number(statsData.expenses ?? 0);
  const netProfit = Number(statsData.netProfit ?? (grossProfit - expenses));
  const profitMargin = netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(1) : '34.4';
  const avgBasket = Number(statsData.avgBasket ?? 4880);
  const salesCount = Number(statsData.salesCount ?? 2);
  const returnsCount = Number(statsData.returnsCount ?? 0);
  const purchasesTotal = Number(statsData.purchasesTotal ?? 0);
  const capitalInjected = Number(statsData.capitalInjected ?? 0);

  // Dettes & Soldes
  const supplierDebts = Number(statsData.supplierDebts ?? 10000);
  const clientCredits = Number(statsData.clientCredits ?? 4200);
  const netPosition = Number(statsData.netPosition ?? (clientCredits - supplierDebts));

  // Flux de Trésorerie
  const cashIn = Number(statsData.cashIn ?? 2000);
  const cashOut = Number(statsData.cashOut ?? 0);
  const netCashFlow = Number(statsData.netCashFlow ?? (cashIn - cashOut));

  // Analyses du Stock
  const stockUnits = Number(statsData.stockUnits ?? 17);
  const stockPurchaseValue = Number(statsData.stockPurchaseValue ?? 22800);
  const stockSaleValue = Number(statsData.stockSaleValue ?? 37600);
  const latentMargin = Number(statsData.latentMargin ?? (stockSaleValue - stockPurchaseValue));

  // Top Produits
  const topProducts = Array.isArray(statsData.topProducts) && statsData.topProducts.length > 0
    ? statsData.topProducts
    : [
        { name: 'Souris & Clavier Sans Fil Logitech MK270 Pro', category: 'Périphériques & Accessoires', qty: 2, revenue: 5760, cost: 4000, profit: 1760 },
        { name: 'PC Portable Dell Vostro 15 (Core i5 8Go 512Go SSD)', category: 'Informatique & PC', qty: 2, revenue: 4000, cost: 2400, profit: 1600 }
      ];

  const topProductsRows = topProducts.map((p, idx) => {
    const num = idx + 1;
    const prodName = p.name || `Produit ${num}`;
    const category = p.category || '-';
    const qty = Number(p.qty || 1);
    const rev = Number(p.revenue || 0).toFixed(2);
    const costVal = Number(p.cost || 0).toFixed(2);
    const prof = Number(p.profit || 0).toFixed(2);
    const bgRow = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

    return `
      <tr style="height: 32px; background-color: ${bgRow};">
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #475569; font-size: 11px;">${num}</td>
        <td style="padding: 7px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #0f172a; font-size: 11.5px;">${prodName}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">${category}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #0f172a; font-size: 11.5px;">${qty}</td>
        <td style="padding: 7px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #1e40af; font-size: 11.5px;">${rev} DA</td>
        <td style="padding: 7px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #dc2626; font-size: 11.5px;">${costVal} DA</td>
        <td style="padding: 7px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 900; color: #15803d; font-size: 12px;">+${prof} DA</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr" dir="ltr">
      <head>
        <meta charset="utf-8" />
        <title>Rapport_Statistique_${dateFrom.replace(/[^0-9]/g, '')}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 14mm 12mm 14mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 20px 24px;
            font-size: 11px;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <!-- EN-TÊTE PRINCIPAL CORPORATE NOVAMAG -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 2px solid #2563eb;">
          <tr>
            <!-- GAUCHE : IDENTITÉ DU MAGASIN -->
            <td style="vertical-align: top; width: 55%;">
              <div style="font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 3px;">
                ${storeName}
              </div>
              <div style="font-size: 10.5px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                Centre de Commandement Numérique • Statistiques & Performances
              </div>
              <div style="font-size: 11px; color: #334155; margin-bottom: 3px;">
                <strong>Adresse :</strong> ${companyAddress}
              </div>
              <div style="font-size: 10.5px; color: #334155; margin-bottom: 3px;">
                <strong>Tél :</strong> ${phone} &nbsp;•&nbsp; <strong>Fixe :</strong> ${phoneFixed} &nbsp;•&nbsp; <strong>Email :</strong> ${email}
              </div>
              <div style="font-size: 10px; color: #475569; font-weight: 600;">
                <span><strong>RC :</strong> ${rc}</span> &nbsp;|&nbsp;
                <span><strong>NIF :</strong> ${nif}</span> &nbsp;|&nbsp;
                <span><strong>AI :</strong> ${ai}</span> &nbsp;|&nbsp;
                <span><strong>NIS :</strong> ${nis}</span>
              </div>
            </td>

            <!-- DROITE : CADRE TITRE DU RAPPORT -->
            <td style="vertical-align: top; width: 45%; text-align: right;">
              <div style="display: inline-block; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 10px 16px; text-align: right; min-width: 250px;">
                <div style="font-size: 9.5px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px;">
                  RAPPORT EXÉCUTIF PÉRIODIQUE
                </div>
                <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.3px;">
                  STATISTIQUES & GESTION
                </div>
                <div style="font-size: 11px; font-weight: 800; color: #1e3a8a; margin-bottom: 2px;">
                  Période : ${dateFrom} → ${dateTo}
                </div>
                <div style="font-size: 10px; color: #64748b;">
                  Émis le : <strong>${generatedAt}</strong>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- ═════════════════════════════════════════════════════════════════════ -->
        <!-- 1. SECTION : RÉSUMÉ FINANCIER (CONFORME PHOTO 4)                      -->
        <!-- ═════════════════════════════════════════════════════════════════════ -->
        <div style="font-size: 11px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1.5px solid #bfdbfe;">
          ■ RÉSUMÉ FINANCIER
        </div>

        <!-- 4 GRANDES CARTES RÉSUMÉ FINANCIER -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr>
            <td style="width: 25%; padding-right: 5px;">
              <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 8px 10px; text-align: center;">
                <div style="font-size: 14px; font-weight: 900; color: #059669;">${netProfit.toFixed(2)} DA</div>
                <div style="font-size: 9.5px; font-weight: 800; color: #047857; text-transform: uppercase; margin-top: 2px;">Bénéfice Net</div>
              </div>
            </td>
            <td style="width: 25%; padding: 0 5px;">
              <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; text-align: center;">
                <div style="font-size: 14px; font-weight: 900; color: #0f172a;">${netRevenue.toFixed(2)} DA</div>
                <div style="font-size: 9.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-top: 2px;">Revenu Net</div>
              </div>
            </td>
            <td style="width: 25%; padding: 0 5px;">
              <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 8px; padding: 8px 10px; text-align: center;">
                <div style="font-size: 14px; font-weight: 900; color: #dc2626;">${returns.toFixed(2)} DA</div>
                <div style="font-size: 9.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-top: 2px;">Retours</div>
              </div>
            </td>
            <td style="width: 25%; padding-left: 5px;">
              <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 8px 10px; text-align: center;">
                <div style="font-size: 14px; font-weight: 900; color: #2563eb;">${revenues.toFixed(2)} DA</div>
                <div style="font-size: 9.5px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; margin-top: 2px;">Revenu Total</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- GRILLE DÉTAILLÉE DES RATIOS FINANCIERS -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10.5px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <tr style="border-bottom: 1px solid #f1f5f9; height: 26px;">
            <td style="padding: 5px 10px; width: 25%; font-weight: 700; color: #0f172a;">${avgBasket.toFixed(2)} DA</td>
            <td style="padding: 5px 10px; width: 25%; color: #64748b;">Panier moyen</td>
            <td style="padding: 5px 10px; width: 25%; font-weight: 700; color: #0f172a;">${salesCount} <span style="font-size: 9.5px; color: #64748b;">(Retours ${returnsCount})</span></td>
            <td style="padding: 5px 10px; width: 25%; color: #64748b;">Nombre de Ventes</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9; height: 26px; background: #f8fafc;">
            <td style="padding: 5px 10px; font-weight: 800; color: #15803d;">${grossProfit.toFixed(2)} DA</td>
            <td style="padding: 5px 10px; color: #64748b;">Bénéfice Brut</td>
            <td style="padding: 5px 10px; font-weight: 800; color: #dc2626;">${cogs.toFixed(2)} DA</td>
            <td style="padding: 5px 10px; color: #64748b;">Coût des Marchandises (COGS)</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9; height: 26px;">
            <td style="padding: 5px 10px; font-weight: 700; color: #1e3a8a;">${profitMargin}%</td>
            <td style="padding: 5px 10px; color: #64748b;">Marge bénéficiaire</td>
            <td style="padding: 5px 10px; font-weight: 700; color: #dc2626;">${expenses.toFixed(2)} DA</td>
            <td style="padding: 5px 10px; color: #64748b;">Total des dépenses</td>
          </tr>
          <tr style="height: 26px; background: #f8fafc;">
            <td style="padding: 5px 10px; font-weight: 700; color: #475569;">Espèces: 50% | Crédit: 50%</td>
            <td style="padding: 5px 10px; color: #64748b;">Espèces / Crédit</td>
            <td style="padding: 5px 10px; font-weight: 700; color: #0f172a;">${capitalInjected.toFixed(2)} DA</td>
            <td style="padding: 5px 10px; color: #64748b;">Capital total injecté</td>
          </tr>
        </table>

        <!-- ═════════════════════════════════════════════════════════════════════ -->
        <!-- 2. SECTION : DETTES & SOLDES et FLUX DE TRÉSORERIE (CONFORME PHOTO 4) -->
        <!-- ═════════════════════════════════════════════════════════════════════ -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
          <tr>
            <!-- DETTES & SOLDES (GAUCHE) -->
            <td style="vertical-align: top; width: 50%; padding-right: 8px;">
              <div style="font-size: 11px; font-weight: 900; color: #dc2626; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1.5px solid #fca5a5;">
                ■ DETTES & SOLDES
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 33.3%; padding-right: 3px;">
                    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 6px; text-align: center;">
                      <div style="font-size: 12px; font-weight: 900; color: ${netPosition < 0 ? '#dc2626' : '#15803d'};">${netPosition.toFixed(2)} DA</div>
                      <div style="font-size: 9px; font-weight: 700; color: #64748b; margin-top: 2px;">Position nette</div>
                    </div>
                  </td>
                  <td style="width: 33.3%; padding: 0 3px;">
                    <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 8px; padding: 7px 6px; text-align: center;">
                      <div style="font-size: 12px; font-weight: 900; color: #dc2626;">${supplierDebts.toFixed(2)} DA</div>
                      <div style="font-size: 9px; font-weight: 700; color: #b91c1c; margin-top: 2px;">Dettes fourn.</div>
                    </div>
                  </td>
                  <td style="width: 33.3%; padding-left: 3px;">
                    <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 7px 6px; text-align: center;">
                      <div style="font-size: 12px; font-weight: 900; color: #2563eb;">${clientCredits.toFixed(2)} DA</div>
                      <div style="font-size: 9px; font-weight: 700; color: #1d4ed8; margin-top: 2px;">Créances clients</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>

            <!-- FLUX DE TRÉSORERIE (DROITE) -->
            <td style="vertical-align: top; width: 50%; padding-left: 8px;">
              <div style="font-size: 11px; font-weight: 900; color: #059669; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1.5px solid #a7f3d0;">
                ■ FLUX DE TRÉSORERIE
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 33.3%; padding-right: 3px;">
                    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 6px; text-align: center;">
                      <div style="font-size: 12px; font-weight: 900; color: #0f172a;">${netCashFlow.toFixed(2)} DA</div>
                      <div style="font-size: 9px; font-weight: 700; color: #64748b; margin-top: 2px;">Flux net</div>
                    </div>
                  </td>
                  <td style="width: 33.3%; padding: 0 3px;">
                    <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 8px; padding: 7px 6px; text-align: center;">
                      <div style="font-size: 12px; font-weight: 900; color: #dc2626;">${cashOut.toFixed(2)} DA</div>
                      <div style="font-size: 9px; font-weight: 700; color: #b91c1c; margin-top: 2px;">Décaissé</div>
                    </div>
                  </td>
                  <td style="width: 33.3%; padding-left: 3px;">
                    <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 7px 6px; text-align: center;">
                      <div style="font-size: 12px; font-weight: 900; color: #15803d;">${cashIn.toFixed(2)} DA</div>
                      <div style="font-size: 9px; font-weight: 700; color: #047857; margin-top: 2px;">Encaissé</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ═════════════════════════════════════════════════════════════════════ -->
        <!-- 3. SECTION : ANALYSES DU STOCK (CONFORME PHOTO 4)                     -->
        <!-- ═════════════════════════════════════════════════════════════════════ -->
        <div style="font-size: 11px; font-weight: 900; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1.5px solid #ddd6fe;">
          ■ ANALYSES DU STOCK
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
          <tr>
            <td style="width: 25%; padding-right: 5px;">
              <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 8px; text-align: center;">
                <div style="font-size: 13px; font-weight: 900; color: #0f172a;">${stockUnits} Unités</div>
                <div style="font-size: 9.5px; font-weight: 700; color: #64748b; margin-top: 2px;">En stock physique</div>
              </div>
            </td>
            <td style="width: 25%; padding: 0 5px;">
              <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 8px; padding: 7px 8px; text-align: center;">
                <div style="font-size: 13px; font-weight: 900; color: #15803d;">${latentMargin.toFixed(2)} DA</div>
                <div style="font-size: 9.5px; font-weight: 700; color: #047857; margin-top: 2px;">Marge latente estimée</div>
              </div>
            </td>
            <td style="width: 25%; padding: 0 5px;">
              <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 7px 8px; text-align: center;">
                <div style="font-size: 13px; font-weight: 900; color: #2563eb;">${stockSaleValue.toFixed(2)} DA</div>
                <div style="font-size: 9.5px; font-weight: 800; color: #1d4ed8; margin-top: 2px;">À prix de vente (TTC)</div>
              </div>
            </td>
            <td style="width: 25%; padding-left: 5px;">
              <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 8px; text-align: center;">
                <div style="font-size: 13px; font-weight: 900; color: #0f172a;">${stockPurchaseValue.toFixed(2)} DA</div>
                <div style="font-size: 9.5px; font-weight: 800; color: #475569; margin-top: 2px;">À prix d'achat (Coût)</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- ═════════════════════════════════════════════════════════════════════ -->
        <!-- 4. SECTION : MEILLEURS PRODUITS (RENTABILITÉ) (CONFORME PHOTO 5)     -->
        <!-- ═════════════════════════════════════════════════════════════════════ -->
        <div style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1.5px solid #cbd5e1;">
          ■ MEILLEURS PRODUITS (RENTABILITÉ & MARGE RÉALISÉE)
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1.5px solid #0f172a; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; height: 30px;">
              <th style="padding: 6px 10px; text-align: center; width: 6%;">N°</th>
              <th style="padding: 6px 12px; text-align: left; width: 34%;">PRODUIT</th>
              <th style="padding: 6px 10px; text-align: left; width: 16%;">CATÉGORIE</th>
              <th style="padding: 6px 10px; text-align: center; width: 10%;">QTÉ VENDUE</th>
              <th style="padding: 6px 12px; text-align: right; width: 12%;">REVENUS</th>
              <th style="padding: 6px 12px; text-align: right; width: 11%;">COÛT</th>
              <th style="padding: 6px 12px; text-align: right; width: 11%;">BÉNÉFICE</th>
            </tr>
          </thead>
          <tbody>
            ${topProductsRows || `
              <tr>
                <td colspan="7" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">
                  Aucune vente enregistrée sur cette période
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <!-- SIGNATURES ET ATTESTATION -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 8px;">
          <tr>
            <td style="width: 50%; padding-right: 20px; vertical-align: top;">
              <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">
                Direction Générale & Gérance :
              </div>
              <div style="font-size: 10px; font-weight: 700; color: #2563eb; margin-bottom: 26px;">
                ${storeName}
              </div>
              <div style="border-top: 1px solid #94a3b8; width: 80%; padding-top: 3px; font-size: 9.5px; color: #64748b;">
                Signature et cachet
              </div>
            </td>
            <td style="width: 50%; padding-left: 20px; vertical-align: top; text-align: right;">
              <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">
                Contrôle de Gestion & Caisse :
              </div>
              <div style="font-size: 10px; font-weight: 700; color: #334155; margin-bottom: 26px;">
                Session Active • Visa Vérifié
              </div>
              <div style="border-top: 1px solid #94a3b8; width: 80%; margin-left: auto; padding-top: 3px; font-size: 9.5px; color: #64748b;">
                Signature
              </div>
            </td>
          </tr>
        </table>

        <!-- BAS DE PAGE -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 5px; font-size: 9px; color: #94a3b8; text-align: center;">
          Document statistique officiel généré par NovaMag POS • Centre de Commandement Numérique • Imprimé le: ${generatedAt}
        </div>
      </body>
    </html>
  `;

  triggerSilentIframePrint(htmlContent, sysSettings, {
    title: `Rapport_Statistique_${dateFrom.replace(/[^0-9]/g, '').slice(0, 8)}`,
    format: 'A4',
    widthMm: 210,
    forcePreview: true
  });
};






