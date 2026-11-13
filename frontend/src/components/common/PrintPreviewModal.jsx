import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Eye, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Receipt, 
  Barcode, 
  Check, 
  Download 
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function PrintPreviewModal() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const handleOpenPreview = (e) => {
      if (e.detail) {
        setPreviewData(e.detail);
        setZoomLevel(100);
        setIsOpen(true);
      }
    };

    window.addEventListener('novamag_show_print_preview', handleOpenPreview);
    return () => {
      window.removeEventListener('novamag_show_print_preview', handleOpenPreview);
    };
  }, []);

  if (!isOpen || !previewData) return null;

  const { title, html, format, widthMm, settings } = previewData;

  const handlePrintNow = () => {
    if (typeof window !== 'undefined' && window.electronAPI?.printDirect) {
      const targetPrinter = (format === 'A4')
        ? (settings?.printerA4 || settings?.defaultPrinter || '')
        : ((settings?.printerTicket === 'default' || settings?.ticketPrinter === 'default')
            ? (settings?.defaultPrinter || '')
            : (settings?.printerTicket || settings?.ticketPrinter || ''));

      window.electronAPI.printDirect({
        html: html,
        deviceName: targetPrinter || '',
        silent: !!targetPrinter && targetPrinter !== 'Microsoft Print to PDF'
      }).then(() => {
        setIsOpen(false);
      }).catch((err) => {
        console.warn('Fallback print window error:', err);
        fallbackPrintWindow();
      });
    } else {
      fallbackPrintWindow();
    }
  };

  const fallbackPrintWindow = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.error(e);
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
          setIsOpen(false);
        }, 1500);
      }, 300);
    };
  };

  const getContainerWidth = () => {
    if (format === 'A4') return 'max-w-3xl';
    if (widthMm === 58) return 'max-w-[280px]';
    return 'max-w-[370px]'; // standard 80mm
  };

  return (
    <div className="fixed inset-0 z-90 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden shadow-2xl animate-scaleIn">
        
        {/* ══ EN-TÊTE MODERNE ══ */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between gap-4 shrink-0">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              {format === 'A4' ? <FileText className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-black text-white truncate flex items-center gap-2">
                <span>{title || (language === 'ar' ? 'معاينة المستند قبل الطباعة' : 'Aperçu du Document')}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                  {format === 'A4' ? 'A4' : `${widthMm || 80}mm`}
                </span>
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  {language === 'ar' ? 'جاهز للطباعة' : 'Prêt pour impression'}
                </span>
                <span>•</span>
                <span className="text-slate-400 truncate">
                  {language === 'ar' ? 'وضع المعاينة (الطباعة الصامتة غير مفعلة)' : 'Mode aperçu (Impression silencieuse désactivée)'}
                </span>
              </div>
            </div>
          </div>

          {/* Contrôles Zoom & Boutons d'Action */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Contrôles de Zoom */}
            <div className="hidden sm:flex items-center bg-slate-900/80 border border-slate-700 rounded-xl px-1.5 py-1 text-slate-300 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(60, z - 15))}
                className="p-1 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                title={language === 'ar' ? 'تصغير' : 'Zoomer arrière'}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                className="p-1 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                title={language === 'ar' ? 'تكبير' : 'Zoomer avant'}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bouton Imprimer Maintenant */}
            <button
              type="button"
              onClick={handlePrintNow}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4 stroke-[2.4]" />
              <span>{language === 'ar' ? 'طباعة الآن' : 'Imprimer maintenant'}</span>
            </button>

            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={language === 'ar' ? 'إغلاق المعاينة' : "Fermer l'aperçu"}
            >
              <X className="w-5 h-5 stroke-[2.4]" />
            </button>

          </div>

        </div>

        {/* ══ ZONE DE VISUALISATION (PAPIER SIMULÉ) ══ */}
        <div className="flex-1 bg-slate-950 p-6 sm:p-8 overflow-y-auto overflow-x-hidden flex justify-center items-start scrollbar-thin">
          <div 
            className={`w-full ${getContainerWidth()} bg-white text-black shadow-2xl transition-all duration-150 origin-top rounded-xl overflow-hidden border border-slate-300 ring-4 ring-slate-800/40 my-2`}
            style={{ 
              transform: `scale(${zoomLevel / 100})`,
              minHeight: format === 'A4' ? '1280px' : 'auto',
            }}
          >
            <iframe
              srcDoc={html}
              title="Aperçu Document"
              className="w-full border-none pointer-events-auto"
              style={{
                height: format === 'A4' ? '1280px' : '850px',
                background: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* ══ PIED DE PAGE D'AIDE ══ */}
        <div className="px-5 py-2.5 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            {language === 'ar' ? (
              <>💡 ملاحظة : يمكنك إعادة تفعيل الطباعة المباشرة الصامتة من <strong>الإعدادات</strong> بمجرد تجهيز طابعتك.</>
            ) : (
              <>💡 Conseil : Vous pouvez réactiver l'impression directe silencieuse dans les <strong>Paramètres</strong> dès que votre imprimante physique est prête.</>
            )}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-slate-300 hover:text-white font-bold hover:underline cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق المعاينة' : "Fermer l'aperçu"}
          </button>
        </div>

      </div>
    </div>
  );
}
