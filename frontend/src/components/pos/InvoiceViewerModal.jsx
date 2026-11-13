import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Receipt,
  FileText,
  Truck,
  Share2,
  Eye,
  CheckCircle2,
  Barcode as BarcodeIcon
} from 'lucide-react';
import {
  printThermalTicketDirect,
  printSaleInvoiceA4,
  printSaleInvoiceA5,
  printDeliveryNoteA4,
  printDeliveryNoteThermal
} from '../../services/thermalPrinter';
import { generateCode128Svg } from '../../services/barcodeGenerator';
import { useLanguage } from '../../i18n/LanguageContext';

export default function InvoiceViewerModal({
  isOpen,
  onClose,
  invoices = [],
  currentIndex = 0,
  onSelectIndex,
  onPrevious,
  onNext,
  onGoLatest
}) {
  const { language, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('print'); // 'print' | 'share' | 'preview'
  const [showDirectPreview, setShowDirectPreview] = useState(false);
  const [selectedInvoiceDesign, setSelectedInvoiceDesign] = useState('Classique A4');
  const [selectedReceiptDesign, setSelectedReceiptDesign] = useState('Ticket 1');
  const [selectedDeliveryDesign, setSelectedDeliveryDesign] = useState('Standard A4');

  const [ticketSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const paperWidth = Number(ticketSettings.thermalPaperWidth) > 0 ? Number(ticketSettings.thermalPaperWidth) : 80;
  const margin = Number(ticketSettings.thermalMargin) >= 0 ? Number(ticketSettings.thermalMargin) : (paperWidth <= 60 ? 4 : 7);
  const density = Number(ticketSettings.thermalDensity) > 0 ? Number(ticketSettings.thermalDensity) : 100;
  const heightScale = Number(ticketSettings.thermalHeightScale) > 0 ? Number(ticketSettings.thermalHeightScale) : 100;
  const heightRatio = heightScale / 100;
  const containerWidthPx = Math.round(paperWidth * 4.4);
  const paddingLateralPx = Math.max(8, Math.round(margin * 4.4));
  const isDarkDense = density >= 110;
  const isLightDense = density <= 80;
  const currencyLabel = language === 'ar' ? 'د.ج' : 'DA';

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
      } else if (e.key === 'F5' || e.key === 'F9') {
        e.preventDefault();
        onGoLatest && onGoLatest();
      } else if (e.key === 'F10' || e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrevious && onPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext && onNext();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        printThermalTicketDirect(invoices[currentIndex] || invoices[0], ticketSettings);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onPrevious, onNext, onGoLatest, onClose, invoices, currentIndex, ticketSettings]);

  if (!isOpen || !invoices || invoices.length === 0) return null;

  const invoice = invoices[currentIndex] || invoices[0];
  const isLatest = currentIndex === 0;
  const hasPrevious = currentIndex < invoices.length - 1;
  const hasNext = currentIndex > 0;
  const invoiceNum = invoice.invoiceNumber || `FAC-${invoice.id}`;

  const customerObj = {
    name: invoice.customer || 'Client Standard',
    phone: invoice.customerPhone || ''
  };

  const handlePrintAction = (type, designName) => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      const settings = saved ? JSON.parse(saved) : ticketSettings;

      if (type === 'facture_a4') {
        printSaleInvoiceA4(invoice, customerObj, { ...settings, design: designName });
      } else if (type === 'facture_a5') {
        printSaleInvoiceA5(invoice, customerObj, { ...settings, design: designName });
      } else if (type === 'ticket_thermal') {
        printThermalTicketDirect(invoice, { ...settings, ticketDesign: designName });
      } else if (type === 'delivery_a4') {
        printDeliveryNoteA4(invoice, {}, { ...settings, design: designName });
      } else if (type === 'delivery_thermal') {
        printDeliveryNoteThermal(invoice, {}, settings);
      }
    } catch (err) {
      console.error('Erreur impression :', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111C35] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══ 1. HEADER BLEU DÉGRADÉ EXACTEMENT COMME SUR LA PHOTO 1 ══ */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-xs">
              <Printer className="w-5 h-5 stroke-[2.2] text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>{language === 'ar' ? "مركز الطباعة" : "Centre d'impression"}</span>
                {isLatest && (
                  <span className="text-[10px] bg-emerald-400/25 border border-emerald-300/40 text-emerald-100 font-bold px-2 py-0.5 rounded-full">
                    {language === 'ar' ? 'آخر بيع' : 'Dernière'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-blue-100 font-mono font-medium">
                {language === 'ar' ? `آخر عملية بيع : ${invoiceNum}` : `Dernière vente : ${invoiceNum}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer text-white"
            title={language === 'ar' ? 'إغلاق (Esc)' : 'Fermer (Échap)'}
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* ══ 2. BARRE D'ONGLETS : IMPRIMER / PDF / APERÇU DIRECT ══ */}
        <div className="p-4 pb-0 shrink-0">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            {/* Onglet 1: Imprimer */}
            <button
              type="button"
              onClick={() => { setActiveTab('print'); setShowDirectPreview(false); }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'print' && !showDirectPreview
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'طباعة' : 'Imprimer'}</span>
            </button>

            {/* Onglet 2: PDF / Partager */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('share');
                handlePrintAction('facture_a4', 'Classique A4');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'share'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'PDF / مشاركة' : 'PDF / Partager'}</span>
            </button>

            {/* Onglet 3: Aperçu direct du ticket */}
            <button
              type="button"
              onClick={() => setShowDirectPreview((prev) => !prev)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                showDirectPreview
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'معاينة التذكرة' : 'Aperçu Ticket'}</span>
            </button>
          </div>
        </div>

        {/* ══ 3. CONTENU SCROLLABLE : CHOIX DES DESIGNS (CONFORME PHOTO 1) ══ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* SECTION 1 : Imprimer la facture (Choisir le design) */}
          <div className="p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/20 space-y-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 stroke-[2.2]" />
              <span className="text-xs font-black text-slate-800 dark:text-white">
                {language === 'ar' ? 'طباعة الفاتورة' : 'Imprimer la facture'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'ar' ? 'اختيار النموذج' : 'Choisir le design'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: 'Classique A4', type: 'facture_a4', fr: 'Classique A4', ar: 'كلاسيكي A4' },
                { id: 'Encadré', type: 'facture_a4', fr: 'Encadré', ar: 'مؤطر' },
                { id: 'Détaillé A4', type: 'facture_a4', fr: 'Détaillé A4', ar: 'مفصل A4' },
                { id: 'Premium logo', type: 'facture_a4', fr: 'Premium logo', ar: 'شعار احترافي' },
                { id: 'Compact A5', type: 'facture_a5', fr: 'Compact A5', ar: 'مضغوط A5' },
                { id: 'Thermique 80mm', type: 'ticket_thermal', fr: 'Thermique 80mm', ar: 'حراري 80mm' }
              ].map((des) => {
                const isSel = selectedInvoiceDesign === des.id;
                return (
                  <button
                    key={des.id}
                    type="button"
                    onClick={() => {
                      setSelectedInvoiceDesign(des.id);
                      handlePrintAction(des.type, des.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer active:scale-95 ${
                      isSel
                        ? 'bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isSel ? '★ ' : ''}{language === 'ar' ? des.ar : des.fr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2 : Imprimer le bon (Choisir le design) */}
          <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-2.5">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
              <span className="text-xs font-black text-slate-800 dark:text-white">
                {language === 'ar' ? 'طباعة الوصل' : 'Imprimer le bon'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'ar' ? 'اختيار النموذج' : 'Choisir le design'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: 'Ticket 1', type: 'ticket_thermal', fr: 'Ticket (Design 1)', ar: 'وصل (نموذج 1)' },
                { id: 'Ticket 2', type: 'ticket_thermal', fr: 'Ticket (Design 2)', ar: 'وصل (نموذج 2)' },
                { id: 'Ticket 3', type: 'ticket_thermal', fr: 'Ticket (Design 3)', ar: 'وصل (نموذج 3)' },
                { id: 'Bon livraison A4', type: 'delivery_a4', fr: 'Bon de livraison A4 (Design 4)', ar: 'وصل تسليم A4 (نموذج 4)' },
                { id: 'Reçu A5', type: 'facture_a5', fr: 'Reçu A5', ar: 'إيصال A5' }
              ].map((des) => {
                const isSel = selectedReceiptDesign === des.id;
                return (
                  <button
                    key={des.id}
                    type="button"
                    onClick={() => {
                      setSelectedReceiptDesign(des.id);
                      handlePrintAction(des.type, des.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer active:scale-95 ${
                      isSel
                        ? 'bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isSel ? '★ ' : ''}{language === 'ar' ? des.ar : des.fr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3 : Bon de livraison (Choisir le design) */}
          <div className="p-4 rounded-2xl border border-cyan-100 dark:border-cyan-900/50 bg-cyan-50/20 dark:bg-cyan-950/20 space-y-2.5">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-600 stroke-[2.2]" />
              <span className="text-xs font-black text-slate-800 dark:text-white">
                {language === 'ar' ? 'وصل تسليم' : 'Bon de livraison'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'ar' ? 'اختيار النموذج' : 'Choisir le design'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { id: 'Standard A4', type: 'delivery_a4', fr: 'Standard A4', ar: 'قياسي A4' },
                { id: 'Compact A5', type: 'delivery_a4', fr: 'Compact A5', ar: 'مضغوط A5' },
                { id: 'Thermique 80mm', type: 'delivery_thermal', fr: 'Thermique 80mm', ar: 'حراري 80mm' }
              ].map((des) => {
                const isSel = selectedDeliveryDesign === des.id;
                return (
                  <button
                    key={des.id}
                    type="button"
                    onClick={() => {
                      setSelectedDeliveryDesign(des.id);
                      handlePrintAction(des.type, des.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer active:scale-95 ${
                      isSel
                        ? 'bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isSel ? '★ ' : ''}{language === 'ar' ? des.ar : des.fr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══ APERÇU DIRECT DU TICKET (DÉPLIABLE OU ACTIF) ══ */}
          {showDirectPreview && (
            <div className="pt-2 flex flex-col items-center animate-fadeIn border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span>Modèle actif : <strong className="text-indigo-600 dark:text-indigo-400 font-black">{selectedReceiptDesign}</strong></span>
              </div>
              <div
                style={{
                  width: `${containerWidthPx}px`,
                  maxWidth: '100%',
                  paddingLeft: `${paddingLateralPx}px`,
                  paddingRight: `${paddingLateralPx}px`,
                  transform: `scaleY(${heightRatio})`,
                  transformOrigin: 'top center',
                  color: isLightDense ? '#374151' : '#000000',
                  fontWeight: isDarkDense ? '700' : isLightDense ? '500' : '600',
                  textShadow: isDarkDense ? '0 0 0.35px #000' : 'none'
                }}
                className={`bg-white rounded-2xl py-4 shadow-md font-mono text-xs select-text text-black ${
                  selectedReceiptDesign === 'Ticket 2'
                    ? 'border-2 border-dashed border-slate-400'
                    : selectedReceiptDesign === 'Ticket 3'
                    ? 'border-2 border-slate-900'
                    : 'border border-slate-200'
                }`}
              >
                {/* ── HEADER TICKET 3 : BANDEAU NOIR INVERSÉ ── */}
                {selectedReceiptDesign === 'Ticket 3' ? (
                  <div className="bg-black text-white text-center py-2 px-1 rounded-lg mb-2">
                    <div className="text-sm font-black tracking-widest uppercase">
                      {ticketSettings.storeName && !ticketSettings.storeName.includes('لومينا') ? ticketSettings.storeName : 'NOVA MAG POS'}
                    </div>
                    <div className="text-[9px] font-bold opacity-80 uppercase tracking-wider">
                      SUPERETTE & POINT DE VENTE DÉTAIL
                    </div>
                  </div>
                ) : (
                  <div className="text-center pb-2 border-b border-dashed border-slate-300">
                    <div className="text-sm font-black tracking-wider text-slate-900">
                      {ticketSettings.storeName && !ticketSettings.storeName.includes('لومينا') ? ticketSettings.storeName : 'NOVA MAG POS'}
                    </div>
                    {ticketSettings.storePhone && (
                      <div className="text-[10px] text-slate-600 font-bold mt-0.5">Tél : {ticketSettings.storePhone}</div>
                    )}
                  </div>
                )}

                {/* ── ENCADRÉ CLIENT POUR TICKET 2 ── */}
                {selectedReceiptDesign === 'Ticket 2' && (
                  <div className="my-2 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[9.5px] space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">CLIENT :</span>
                      <span>{invoice.customer || 'Client Standard'}</span>
                    </div>
                    {invoice.customerPhone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">TÉL :</span>
                        <span>{invoice.customerPhone}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">TICKET :</span>
                    <span className="font-bold">{invoiceNum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DATE :</span>
                    <span className="font-bold" dir="ltr">{invoice.dateStr || new Date(invoice.timestamp).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-slate-300 text-[10px]">
                  <div className="divide-y divide-slate-100">
                    {(invoice.items || []).map((it, idx) => (
                      <div key={idx} className="py-0.5 flex justify-between">
                        <span className="font-bold truncate max-w-[160px]">{it.name} x{it.quantity}</span>
                        <span className="font-bold" dir="ltr">{((it.price * it.quantity) - (it.discount || 0)).toFixed(2)} {currencyLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── BANDEAU TOTAL ── */}
                {selectedReceiptDesign === 'Ticket 3' ? (
                  <div className="bg-black text-white my-2 p-2 rounded-lg flex justify-between font-black text-xs">
                    <span>TOTAL À PAYER :</span>
                    <span dir="ltr">{Number(invoice.total || 0).toLocaleString()} {currencyLabel}</span>
                  </div>
                ) : (
                  <div className="py-2 border-b border-dashed border-slate-300 flex justify-between font-black text-xs">
                    <span>TOTAL :</span>
                    <span className="text-blue-600" dir="ltr">{Number(invoice.total || 0).toLocaleString()} {currencyLabel}</span>
                  </div>
                )}

                {/* ── BARCODE / QR CODE ── */}
                {ticketSettings.showBarcodeOnReceipt !== false && (
                  <div className="pt-2 flex flex-col items-center gap-1">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: generateCode128Svg(invoiceNum, { height: 28, barWidth: 1.3, showText: true })
                      }}
                    />
                    {selectedReceiptDesign === 'Ticket 2' && (
                      <span className="text-[9px] text-slate-400 font-mono">Vérification QR Code Sécurisée</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ 4. FOOTER AVEC NAVIGATION ENTRE LES DERNIÈRES VENTES ══ */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold shrink-0 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                hasPrevious
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
                  : 'opacity-30 bg-transparent text-slate-400 border border-transparent cursor-not-allowed'
              }`}
              title="Vente précédente (F10)"
            >
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{language === 'ar' ? 'السابقة' : 'Précédente'}</span>
              <kbd className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">F10</kbd>
            </button>

            <button
              type="button"
              onClick={onGoLatest}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isLatest
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 shadow-2xs'
              }`}
              title="Dernière vente (F5)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'آخر عملية بيع' : 'Dernière vente'}</span>
              <kbd className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">F5</kbd>
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                hasNext
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
                  : 'opacity-30 bg-transparent text-slate-400 border border-transparent cursor-not-allowed'
              }`}
              title="Vente suivante"
            >
              <span>{language === 'ar' ? 'التالية' : 'Suivante'}</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
          >
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
}
