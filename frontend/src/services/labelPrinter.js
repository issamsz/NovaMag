/**
/**
 * Service d'Impression Réelle d'Étiquettes Code-barres
 * NovaMag POS
 * Prise en charge des rouleaux d'étiquettes adhésives (Zebra, Xprinter, TSC, Rongta, etc.)
 */
import { generateCode128Svg } from './barcodeGenerator';

export const printBarcodeLabelDirect = (product = {}, settings = {}) => {
  const width = Math.max(20, Number(settings.labelWidth) || 40);
  const height = Math.max(15, Number(settings.labelHeight) || 20);
  const isAuto = settings.barcodeHeightAuto !== false;
  const barcodeHeight = isAuto 
    ? Math.max(3, Math.round(height * 0.32)) 
    : Math.max(2, Number(settings.barcodeHeight) || 4);

  const fields = settings.labelFields || {
    storeName: true,
    productName: true,
    price: true,
    priceType: false,
    barcodeNumber: true,
    variants: false,
    discount: false,
  };

  const storeName = settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag';
  const prodName = product.name || 'Lecteur Code-barres USB';
  const priceVal = typeof product.price === 'number' 
    ? product.price 
    : (Number(product.sellingPrice) || 6000);
  const formattedPrice = `${priceVal.toLocaleString('fr-FR')} DA`;
  const barcodeValue = product.barcode || '6131234567890';
  const priceTypeLabel = product.priceType || 'Détail';
  const variantText = product.variant || product.variants || 'Taille: L / Noir';
  const discountText = product.discount ? `-${product.discount}%` : '';

  // Barcode SVG calculation
  const barWidth = width <= 40 ? 1.05 : width <= 50 ? 1.25 : 1.45;
  const svgBarcode = generateCode128Svg(barcodeValue, {
    height: Math.round(barcodeHeight * 2.8),
    barWidth: barWidth,
    showText: false
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Étiquette - ${barcodeValue}</title>
        <style>
          @page {
            size: ${width}mm ${height}mm;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: ${width}mm;
            height: ${height}mm;
            background: #fff;
            overflow: hidden;
            font-family: 'Arial', 'Segoe UI', Tahoma, sans-serif;
            color: #000;
          }
          .label-box {
            width: ${width}mm;
            height: ${height}mm;
            padding: 0.8mm 1.2mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            text-align: center;
            overflow: hidden;
          }
          .store-header {
            font-size: ${Math.max(6, Math.round(width * 0.16))}px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            line-height: 1.1;
          }
          .product-title {
            font-size: ${Math.max(6.5, Math.round(width * 0.18))}px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            line-height: 1.15;
          }
          .barcode-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            max-height: ${barcodeHeight}mm;
            overflow: hidden;
          }
          .barcode-wrapper svg {
            max-width: 95%;
            height: auto;
          }
          .barcode-number {
            font-family: 'Courier New', monospace;
            font-size: ${Math.max(6, Math.round(width * 0.15))}px;
            font-weight: 800;
            letter-spacing: 0.5px;
            line-height: 1;
          }
          .price-badge {
            font-size: ${Math.max(7, Math.round(width * 0.22))}px;
            font-weight: 900;
            line-height: 1.1;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            font-size: ${Math.max(5.5, Math.round(width * 0.14))}px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="label-box">
          ${fields.storeName ? `<div class="store-header">${storeName}</div>` : ''}
          ${fields.productName ? `<div class="product-title">${prodName}</div>` : ''}
          
          <div class="barcode-wrapper">
            ${svgBarcode}
          </div>

          ${fields.barcodeNumber ? `<div class="barcode-number">${barcodeValue}</div>` : ''}

          ${(fields.price || fields.priceType || fields.discount || fields.variants) ? `
            <div class="meta-row">
              ${fields.variants ? `<span>${variantText}</span>` : ''}
              ${fields.priceType ? `<span>(${priceTypeLabel})</span>` : ''}
              ${fields.discount ? `<span style="color:#b91c1c;">${discountText}</span>` : ''}
              ${fields.price ? `<span class="price-badge">${formattedPrice}</span>` : ''}
            </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;

  // 1. Impression silencieuse directe si disponible via Electron
  if (typeof window !== 'undefined' && window.electronAPI?.printDirect && settings.directSilentPrint !== false) {
    const targetPrinter = settings.labelPrinter || settings.defaultPrinter || '';
    window.electronAPI.printDirect({
      html: htmlContent,
      deviceName: targetPrinter,
      silent: true
    }).catch(() => {});
    return;
  }

  // 2. Impression furtive via iframe (mode standard)
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

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('[Direct Label Print Fallback]:', err);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    }, 300);
  } catch (e) {
    console.error('[Label Print Error]:', e);
  }
};
