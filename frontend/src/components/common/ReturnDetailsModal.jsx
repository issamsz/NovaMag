import React from 'react';
import { 
  X, 
  Printer, 
  RotateCcw, 
  PackageMinus, 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  Coins, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { triggerSilentIframePrint, printReturnSlipA4 } from '../../services/thermalPrinter';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ReturnDetailsModal({
  isOpen,
  returnRecord,
  party = null, // supplier or customer object
  isSupplier = true,
  onClose
}) {
  const { language } = useLanguage();

  if (!isOpen || !returnRecord) return null;

  const sysSettings = (() => {
    try {
      return JSON.parse(localStorage.getItem('novamag_system_settings') || '{}');
    } catch {
      return {};
    }
  })();

  const storeName = sysSettings.storeName && !sysSettings.storeName.includes('لومينا') 
    ? sysSettings.storeName 
    : 'NovaMag POS';

  const items = returnRecord.items || [];
  const total = Number(returnRecord.total || 0);
  const retNum = returnRecord.returnNumber || `RET-${returnRecord.id}`;
  const partyName = party?.name || returnRecord.supplierName || returnRecord.customerName || (isSupplier ? (language === 'ar' ? 'المورد' : 'Fournisseur') : (language === 'ar' ? 'الزبون' : 'Client'));

  // Impression Ticket Thermique
  const handlePrintThermal = () => {
    const paperWidth = Number(sysSettings.thermalPaperWidth) > 0 ? Number(sysSettings.thermalPaperWidth) : 80;
    const margin = Number(sysSettings.thermalMargin) >= 0 ? Number(sysSettings.thermalMargin) : 5;

    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8" />
      <style>
        @page { margin: 0; size: ${paperWidth}mm auto; }
        body { font-family: monospace; margin: 0; padding: ${margin}mm; font-size: 11px; }
        .center { text-align: center; }
        .bold { font-weight: 800; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .divider { border-top: 1px dashed #444; margin: 6px 0; }
      </style></head><body>
        <div class="center bold" style="font-size: 14px;">${storeName}</div>
        <div class="center" style="font-size: 10px; color: #555;">${language === 'ar' ? 'وصل إرجاع' : 'BON DE RETOUR'} (${isSupplier ? (language === 'ar' ? 'مورد' : 'FOURNISSEUR') : (language === 'ar' ? 'زبون' : 'CLIENT')})</div>
        <div class="center bold" style="font-size: 12px; margin-top: 4px;">N° ${retNum}</div>
        <div class="center" style="font-size: 10px; color: #666;">Date : ${returnRecord.dateStr}</div>
        <div class="divider"></div>
        <div><b>${isSupplier ? (language === 'ar' ? 'المورد :' : 'Fournisseur :') : (language === 'ar' ? 'الزبون :' : 'Client :')}</b> ${partyName}</div>
        ${returnRecord.motif ? `<div><b>${language === 'ar' ? 'السبب :' : 'Motif :'}</b> ${returnRecord.motif}</div>` : ''}
        <div class="divider"></div>
        <table style="width: 100%; font-size: 10px;">
          <thead>
            <tr style="border-bottom: 1px solid #ddd;">
              <th style="text-align: left;">Art</th>
              <th style="text-align: center;">Qté</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(it => `
              <tr>
                <td>${it.name || it.designation}</td>
                <td style="text-align: center;">${it.quantity}</td>
                <td style="text-align: right;">${(Number(it.total || (it.quantity * (it.unitPrice || it.price || 0)))).toLocaleString('fr-FR')} DA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="row bold" style="font-size: 13px; color: #dc2626;">
          <span>${language === 'ar' ? 'إجمالي المرتجع :' : 'TOTAL RETOUR :'}</span>
          <span>${total.toLocaleString('fr-FR')} DA</span>
        </div>
        ${returnRecord.deductFromDebt > 0 ? `
          <div class="row">
            <span>${language === 'ar' ? 'مخصوم من الدين :' : 'Déduit dette :'}</span>
            <span>-${Number(returnRecord.deductFromDebt).toLocaleString('fr-FR')} DA</span>
          </div>
        ` : ''}
        ${returnRecord.cashRefund > 0 ? `
          <div class="row">
            <span>${language === 'ar' ? 'مسترجع نقداً :' : 'Remboursé cash :'}</span>
            <span>+${Number(returnRecord.cashRefund).toLocaleString('fr-FR')} DA</span>
          </div>
        ` : ''}
      </body></html>
    `;
    triggerSilentIframePrint(html, sysSettings);
  };

  // Impression Bon A4
  const handlePrintA4 = () => {
    printReturnSlipA4(returnRecord, party, isSupplier, sysSettings);
  };

  return (
    <div 
      className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-rose-600/20 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? `تفاصيل وصل الإرجاع رقم ${retNum}` : `Détails du Bon de Retour N° ${retNum}`}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                  {isSupplier ? (language === 'ar' ? 'مورد' : 'Fournisseur') : (language === 'ar' ? 'زبون' : 'Client')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'ar' ? 'التاريخ :' : 'Enregistré le :'} {returnRecord.dateStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Impression Ticket Thermique */}
            <button
              type="button"
              onClick={handlePrintThermal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title={language === 'ar' ? 'طباعة الوصل الحراري' : 'Imprimer le ticket thermique'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'ar' ? 'وصل حراري' : 'Ticket'}</span>
            </button>

            {/* Bouton Impression Bon A4 */}
            <button
              type="button"
              onClick={handlePrintA4}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title={language === 'ar' ? 'طباعة سند الإرجاع A4' : 'Imprimer le bon de retour A4'}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'ar' ? 'سند A4' : 'Bon A4'}</span>
            </button>

            {/* Fermer */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Corps défilant */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          
          {/* Fiche Tiers & Motif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                {isSupplier ? <Building2 className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isSupplier ? (language === 'ar' ? 'المورد' : 'Fournisseur') : (language === 'ar' ? 'الزبون' : 'Client')}
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {partyName}
                </span>
                {party?.phone && <div className="text-[11px] text-slate-500 mt-0.5">{language === 'ar' ? 'الهاتف :' : 'Tél :'} {party.phone}</div>}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {language === 'ar' ? 'سبب الإرجاع' : 'Motif du Retour'}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                  {returnRecord.motif || (language === 'ar' ? 'غير محدد' : 'Non spécifié')}
                </span>
              </div>
              {returnRecord.notes && (
                <div className="text-[11px] text-slate-500 italic mt-1">
                  {language === 'ar' ? 'ملاحظة :' : 'Note :'} {returnRecord.notes}
                </div>
              )}
            </div>
          </div>

          {/* Tableau de TOUS les articles retournés dans ce bon */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>{language === 'ar' ? `السلع المرجعة (${items.length || 1})` : `Articles Retournés (${items.length || 1})`}</span>
              </span>
            </div>

            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">#</th>
                  <th className="py-2.5 px-3">{language === 'ar' ? 'اسم وتعيين المنتج' : 'Désignation du produit'}</th>
                  <th className="py-2.5 px-3 text-center w-24">{language === 'ar' ? 'الكمية' : 'Quantité'}</th>
                  <th className="py-2.5 px-3 text-right rtl:text-left w-28">{language === 'ar' ? 'سعر الوحدة' : 'Prix Unitaire'}</th>
                  <th className="py-2.5 px-3 text-right rtl:text-left w-32">{language === 'ar' ? 'الإجمالي' : 'Total Ligne'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {items.length > 0 ? (
                  items.map((it, idx) => {
                    const itTotal = Number(it.total || (it.quantity * (it.unitPrice || it.price || 0))) || 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {it.name || it.designation}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {it.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right rtl:text-left font-mono text-slate-600 dark:text-slate-400">
                          {(Number(it.unitPrice || it.price || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                        </td>
                        <td className="py-2.5 px-3 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-white">
                          {itTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">1</td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? 'سلع مرجعة' : 'Articles retournés'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">1</td>
                    <td className="py-3 px-3 text-right rtl:text-left font-mono text-slate-600 dark:text-slate-400">
                      {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                    </td>
                    <td className="py-3 px-3 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-white">
                      {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mode de Compensation et Totaux */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {language === 'ar' ? 'إجمالي المرتجع' : 'Total Retourné'}
              </span>
              <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              returnRecord.deductFromDebt > 0 
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60' 
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                returnRecord.deductFromDebt > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-slate-400'
              }`}>
                {language === 'ar' ? 'مخصوم من الدين' : 'Déduit de la dette'}
              </span>
              <div className={`text-lg font-bold font-mono mt-0.5 ${
                returnRecord.deductFromDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
              }`}>
                {returnRecord.deductFromDebt > 0 
                  ? `-${Number(returnRecord.deductFromDebt).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA` 
                  : '-'}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              returnRecord.cashRefund > 0 
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60' 
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                returnRecord.cashRefund > 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-400'
              }`}>
                {language === 'ar' ? 'مسترجع نقداً' : 'Remboursé en espèces'}
              </span>
              <div className={`text-lg font-bold font-mono mt-0.5 ${
                returnRecord.cashRefund > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}>
                {returnRecord.cashRefund > 0 
                  ? `+${Number(returnRecord.cashRefund).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA` 
                  : '-'}
              </div>
            </div>
          </div>

        </div>

        {/* Pied de modal */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
        </div>

      </div>
    </div>
  );
}
