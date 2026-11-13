import React, { useState, useEffect } from 'react';
import { 
  X, Printer, RefreshCw, Calendar, Banknote, CreditCard, 
  FileText, RotateCcw, TrendingUp, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { getZReport } from '../../services/api';
import { triggerSilentIframePrint } from '../../services/thermalPrinter';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ZReportModal({ isOpen, onClose, currentUser }) {
  const { language, isRTL } = useLanguage();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReport = async (date) => {
    setLoading(true);
    const res = await getZReport(date);
    if (res.success && res.data) {
      setReport(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport(selectedDate);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const handlePrint = () => {
    try {
      const sysSettings = JSON.parse(localStorage.getItem('novamag_system_settings') || '{}');
      const storeName = sysSettings.storeName && !sysSettings.storeName.includes('لومينا') ? sysSettings.storeName : 'NovaMag';
      const phone = sysSettings.phone || '';
      const totalNet = Number(report?.total_net_sales || 0);

      const html = `
        <!DOCTYPE html>
        <html dir="${isRTL ? 'rtl' : 'ltr'}">
          <head>
            <meta charset="utf-8" />
            <title>${language === 'ar' ? 'تقرير Z • إغلاق' : 'Ticket Z • Clôture'}</title>
            <style>
              body { font-family: monospace; width: 72mm; margin: 0 auto; padding: 8px 4px; font-size: 11px; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 6px 0; }
              .row { display: flex; justify-content: space-between; margin: 2px 0; }
            </style>
          </head>
          <body>
            <div class="center bold" style="font-size: 14px;">${storeName}</div>
            ${phone ? `<div class="center" style="font-size: 10px;">${language === 'ar' ? 'هاتف: ' : 'Tél: '}${phone}</div>` : ''}
            <div class="divider"></div>
            <div class="center bold" style="font-size: 13px;">*** ${language === 'ar' ? 'تقرير Z • إغلاق الوردية' : 'TICKET Z • CLÔTURE'} ***</div>
            <div class="center">${language === 'ar' ? 'التاريخ : ' : 'Date : '}${selectedDate}</div>
            <div class="divider"></div>
            <div class="row"><span>${language === 'ar' ? 'مبيعات نقداً :' : 'Ventes Espèces :'}</span><span class="bold">${Number(paymentSummary.especes?.net || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
            <div class="row"><span>${language === 'ar' ? 'مبيعات بالبطاقة :' : 'Ventes Carte :'}</span><span class="bold">${Number(paymentSummary.carte?.net || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
            <div class="row"><span>${language === 'ar' ? 'مبيعات بالدين :' : 'Ventes Crédit :'}</span><span class="bold">${Number(paymentSummary.credit?.net || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
            <div class="divider"></div>
            <div class="row bold" style="font-size: 12px;"><span>${language === 'ar' ? 'الصافي الإجمالي لليوم :' : 'TOTAL NET DU JOUR :'}</span><span>${totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span></div>
            <div class="divider"></div>
            <div class="center" style="font-size: 9px;">${language === 'ar' ? 'طُبع في' : 'Imprimé le'} ${new Date().toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')} ${language === 'ar' ? 'على الساعة' : 'à'} ${new Date().toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</div>
          </body>
        </html>
      `;
      triggerSilentIframePrint(html, sysSettings, {
        title: `Ticket Z du ${selectedDate}`,
        format: 'thermal',
        widthMm: 80,
        forcePreview: true
      });
    } catch {
      window.print();
    }
  };

  const paymentSummary = report?.payment_methods || report?.payment_summary || {
    especes: { sales: 0, returns: 0, net: 0, count: 0 },
    carte: { sales: 0, returns: 0, net: 0, count: 0 },
    credit: { sales: 0, returns: 0, net: 0, count: 0 }
  };

  const credits = report?.payment_methods?.credit?.customers || report?.credits_registered || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'تقرير Z • إغلاق الصندوق' : 'Ticket Z • Clôture de Caisse'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {language === 'ar' ? 'المطابقة المحاسبية حسب طريقة الدفع' : 'Rapprochement comptable par mode de paiement'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg outline-hidden"
            />
            <button
              type="button"
              onClick={() => fetchReport(selectedDate)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={language === 'ar' ? 'تحديث' : 'Actualiser'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Report Body */}
        <div className="overflow-y-auto pr-1 py-4 space-y-4 flex-1 scrollbar-thin">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs font-bold">
                {language === 'ar' ? 'جارٍ إنشاء التقرير...' : 'Génération du rapport en cours...'}
              </p>
            </div>
          ) : !report ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              {language === 'ar' ? 'لا توجد بيانات متاحة لهذا التاريخ.' : 'Aucune donnée disponible pour cette date.'}
            </div>
          ) : (
            <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200">
              {/* Receipt Top Banner */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  {language === 'ar' ? 'سوبرماركت نوفاماج • الصندوق المركزي' : 'SUPERETTE NOVAMAG • CAISSE CENTRALE'}
                </span>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {language === 'ar' ? `التقرير اليومي ليوم ${report.date}` : `RAPPORT JOURNALIER DU ${report.date}`}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'ar' ? 'المسؤول :' : 'Responsable :'} {currentUser?.full_name || (language === 'ar' ? 'أمين الصندوق' : 'Caissier')} • {report.summary?.total_transactions || 0} {language === 'ar' ? 'معاملة' : 'Transactions'}
                </div>
              </div>

              {/* KPI Net Sales */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md text-center">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block">
                  {language === 'ar' ? 'صافي المبيعات المحقق' : "Chiffre d'Affaires Net Réalisé"}
                </span>
                <div className="text-3xl font-mono font-black my-1 text-emerald-400" dir="ltr">
                  {report.summary?.net_sales?.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-sm font-sans text-white">DA</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-300 font-medium">
                  <span>{language === 'ar' ? 'المبيعات:' : 'Ventes:'} <strong dir="ltr">{report.summary?.gross_sales?.toFixed(2)} DA</strong> ({report.summary?.sales_count})</span>
                  <span>•</span>
                  <span>{language === 'ar' ? 'المرتجعات:' : 'Retours:'} <strong className="text-rose-300" dir="ltr">-{report.summary?.total_returns?.toFixed(2)} DA</strong> ({report.summary?.returns_count})</span>
                </div>
              </div>

              {/* Breakdown by Payment Mode */}
              <div className="space-y-2.5">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                  {language === 'ar' ? 'التفصيل حسب طريقة الدفع' : 'Ventilation par Mode de Règlement'}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {/* Espèces */}
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        <span>{language === 'ar' ? 'نقداً' : 'Espèces'}</span>
                      </span>
                      <span className="text-[10px] font-bold bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-700">
                        {paymentSummary.especes.count} {language === 'ar' ? 'عملية' : 'op.'}
                      </span>
                    </div>
                    <div>
                      <div className="text-lg font-mono font-black text-emerald-900 dark:text-emerald-200" dir="ltr">
                        {paymentSummary.especes.net.toFixed(2)}{' '}
                        <span className="text-[10px] font-sans font-bold">DA</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                        {language === 'ar' ? 'يُحسب في درج النقود' : 'À compter dans le tiroir-caisse'}
                      </div>
                    </div>
                  </div>

                  {/* Carte CIB / Edahabia */}
                  <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                        <span>{language === 'ar' ? 'بطاقة بنكية CIB' : 'Carte CIB'}</span>
                      </span>
                      <span className="text-[10px] font-bold bg-white dark:bg-slate-800 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                        {paymentSummary.carte.count} {language === 'ar' ? 'عملية' : 'op.'}
                      </span>
                    </div>
                    <div>
                      <div className="text-lg font-mono font-black text-blue-900 dark:text-blue-200" dir="ltr">
                        {paymentSummary.carte.net.toFixed(2)}{' '}
                        <span className="text-[10px] font-sans font-bold">DA</span>
                      </div>
                      <div className="text-[10px] text-blue-700 dark:text-blue-400 font-medium mt-0.5">
                        {language === 'ar' ? 'إجمالي المحصل على جهاز الدفع' : 'Total télécollecte terminal TPE'}
                      </div>
                    </div>
                  </div>

                  {/* Crédit (Dettes) */}
                  <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        <span>{language === 'ar' ? 'آجل (ديون)' : 'Crédit (Dette)'}</span>
                      </span>
                      <span className="text-[10px] font-bold bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-700">
                        {paymentSummary.credit.count} {language === 'ar' ? 'عملية' : 'op.'}
                      </span>
                    </div>
                    <div>
                      <div className="text-lg font-mono font-black text-amber-900 dark:text-amber-200" dir="ltr">
                        {paymentSummary.credit.net.toFixed(2)}{' '}
                        <span className="text-[10px] font-sans font-bold">DA</span>
                      </div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                        {language === 'ar' ? 'مستحقات على الزبائن للتحصيل' : 'Créances clients à recouvrer'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Debts Detail Table */}
              {credits.length > 0 && (
                <div className="border border-amber-200 dark:border-amber-850 rounded-2xl overflow-hidden bg-amber-50/40 dark:bg-amber-950/20">
                  <div className="p-3 bg-amber-100/60 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-850 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>{language === 'ar' ? 'تفاصيل المبيعات بالدين لليوم (سجل الكريدي)' : 'Détail des Ventes à Crédit du Jour (Carnet de Dette)'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      {credits.length} {language === 'ar' ? 'زبون' : 'client(s)'}
                    </span>
                  </div>
                  <table className="w-full text-left rtl:text-right text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-amber-200/80 dark:border-amber-850 text-[10px] text-amber-900 dark:text-amber-300 uppercase font-bold bg-white/60 dark:bg-slate-900/60">
                        <th className="p-2">{language === 'ar' ? 'التذكرة' : 'Ticket'}</th>
                        <th className="p-2">{language === 'ar' ? 'الزبون' : 'Client'}</th>
                        <th className="p-2">{language === 'ar' ? 'ملاحظات' : 'Observations'}</th>
                        <th className="p-2 text-right rtl:text-left">{language === 'ar' ? 'المبلغ دج' : 'Montant DA'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-200/50 dark:divide-amber-850/50">
                      {credits.map((cr) => (
                        <tr key={cr.id} className="hover:bg-amber-100/40 dark:hover:bg-amber-950/40 font-medium">
                          <td className="p-2 font-mono text-slate-600 dark:text-slate-400">{cr.ticket_number}</td>
                          <td className="p-2 font-extrabold text-slate-900 dark:text-white">{cr.customer_name}</td>
                          <td className="p-2 text-slate-500 dark:text-slate-400 italic text-[11px]">{cr.notes || '-'}</td>
                          <td className="p-2 text-right rtl:text-left font-mono font-black text-amber-950 dark:text-amber-200" dir="ltr">
                            {Number(cr.total_amount).toFixed(2)} DA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'طباعة تقرير Z' : 'Imprimer Ticket Z'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
