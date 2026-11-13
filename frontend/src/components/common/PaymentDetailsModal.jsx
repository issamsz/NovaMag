import React from 'react';
import { 
  X, 
  Coins, 
  Printer, 
  Building2, 
  User, 
  Calendar, 
  CheckCircle2, 
  FileText,
  CreditCard
} from 'lucide-react';
import { printDebtReceiptThermal, triggerSilentIframePrint } from '../../services/thermalPrinter';
import { useLanguage } from '../../i18n/LanguageContext';

export default function PaymentDetailsModal({
  isOpen,
  payment,
  party = null, // supplier or customer
  isSupplier = true,
  onClose
}) {
  const { language } = useLanguage();

  if (!isOpen || !payment) return null;

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

  const receiptNo = payment.receiptNumber || `VR-${payment.id}`;
  const amount = Number(payment.amount || 0);
  const paidToInitial = Number(payment.paidToInitialDebt || 0);
  const paidToOther = Number(payment.paidToOtherDebt || (amount - paidToInitial)) || 0;
  const remainingDebt = Number(payment.remainingDebt || 0);
  const partyName = party?.name || payment.supplierName || payment.customerName || (isSupplier ? (language === 'ar' ? 'المورد' : 'Fournisseur') : (language === 'ar' ? 'الزبون' : 'Client'));

  const handlePrint = () => {
    if (!isSupplier && party) {
      printDebtReceiptThermal(payment, party, sysSettings);
      return;
    }

    // Impression ticket versement fournisseur
    const paperWidth = Number(sysSettings.thermalPaperWidth) > 0 ? Number(sysSettings.thermalPaperWidth) : 80;
    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8" />
      <style>
        @page { margin: 0; size: ${paperWidth}mm auto; }
        body { font-family: monospace; margin: 0; padding: 6mm; font-size: 11px; }
        .center { text-align: center; }
        .bold { font-weight: 800; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .divider { border-top: 1px dashed #444; margin: 6px 0; }
      </style></head><body>
        <div class="center bold" style="font-size: 14px;">${storeName}</div>
        <div class="center" style="font-size: 10px; color: #555;">${language === 'ar' ? 'وصل تسديد مورد' : 'REÇU DE RÈGLEMENT FOURNISSEUR'}</div>
        <div class="center bold" style="font-size: 12px; margin-top: 4px;">N° ${receiptNo}</div>
        <div class="center" style="font-size: 10px; color: #666;">Date : ${payment.dateStr}</div>
        <div class="divider"></div>
        <div><b>${language === 'ar' ? 'المورد :' : 'Fournisseur :'}</b> ${partyName}</div>
        <div><b>${language === 'ar' ? 'طريقة الدفع :' : 'Mode :'}</b> ${payment.method || 'Espèces'}</div>
        ${payment.notes ? `<div><b>Note :</b> ${payment.notes}</div>` : ''}
        <div class="divider"></div>
        <div class="row bold" style="font-size: 14px; color: #059669;">
          <span>${language === 'ar' ? 'المبلغ المسدد :' : 'MONTANT VERSÉ :'}</span>
          <span>${amount.toLocaleString('fr-FR')} DA</span>
        </div>
        ${paidToInitial > 0 ? `
          <div class="row" style="color: #d97706;">
            <span>${language === 'ar' ? 'مخصوم من الدين الأولي :' : 'Déduit sur dette initiale :'}</span>
            <span>-${paidToInitial.toLocaleString('fr-FR')} DA</span>
          </div>
        ` : ''}
        ${paidToOther > 0 ? `
          <div class="row" style="color: #2563eb;">
            <span>${language === 'ar' ? 'مخصوم من فواتير الشراء :' : 'Déduit sur factures d\'achats :'}</span>
            <span>-${paidToOther.toLocaleString('fr-FR')} DA</span>
          </div>
        ` : ''}
        <div class="divider"></div>
        <div class="row bold">
          <span>${language === 'ar' ? 'الدين المتبقي :' : 'Dette restante :'}</span>
          <span>${remainingDebt.toLocaleString('fr-FR')} DA</span>
        </div>
      </body></html>
    `;
    triggerSilentIframePrint(html, sysSettings);
  };

  return (
    <div 
      className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-600/20 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? `تفاصيل التسديد رقم ${receiptNo}` : `Détails du Règlement N° ${receiptNo}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSupplier ? (language === 'ar' ? 'المورد' : 'Fournisseur') : (language === 'ar' ? 'الزبون' : 'Client')} : <span className="font-bold text-slate-700 dark:text-slate-300">{partyName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'ar' ? 'طباعة الوصل' : 'Imprimer le Reçu'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4 overflow-y-auto scrollbar-thin">
          
          {/* Montant versé principal */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
              {language === 'ar' ? 'إجمالي المبلغ المسدد' : 'Montant Total Réglé'}
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1 inline-block">
              {language === 'ar' ? 'التاريخ :' : 'Date :'} {payment.dateStr} • {language === 'ar' ? 'طريقة الدفع :' : 'Mode :'} {payment.method || (language === 'ar' ? 'نقداً' : 'Espèces')}
            </span>
          </div>

          {/* Ventilation / Détail de l'allocation */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
              {language === 'ar' ? 'تفصيل توزيع المبلغ المسدد :' : "Détail de l'affectation du règlement :"}
            </span>

            <div className="space-y-2 text-xs">
              {/* Part dette initiale */}
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200 block">
                    {language === 'ar' ? '1. مخصوم من الرصيد الأولي (السابق) :' : '1. Déduit sur la Dette Initiale (Antérieure) :'}
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">
                    {language === 'ar' ? 'أولوية قصوى وفق القواعد المحاسبية' : 'Priorité absolue selon la règle comptable'}
                  </span>
                </div>
                <div className="font-mono font-bold text-amber-900 dark:text-amber-200 text-sm">
                  -{paidToInitial.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                </div>
              </div>

              {/* Part factures */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-900 dark:text-blue-200 block">
                    {language === 'ar' ? '2. مخصوم من الفواتير والمشتريات الأخيرة :' : '2. Déduit sur les Factures & Achats récents :'}
                  </span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-400">
                    {language === 'ar' ? 'تسديد الفواتير الآجلة المتبقية' : 'Solde des factures à crédit restantes'}
                  </span>
                </div>
                <div className="font-mono font-bold text-blue-900 dark:text-blue-200 text-sm">
                  -{paidToOther.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                </div>
              </div>
            </div>

            {/* Solde restant */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-400">
                {language === 'ar' ? 'الدين المتبقي بعد هذا التسديد :' : 'Dette restante après ce règlement :'}
              </span>
              <span className="font-mono text-slate-900 dark:text-white text-sm">
                {remainingDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
              </span>
            </div>
          </div>

          {/* Observations */}
          {payment.notes && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {language === 'ar' ? 'ملاحظة' : 'Observation'}
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 block">{payment.notes}</span>
            </div>
          )}

        </div>

        {/* Pied */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
        </div>

      </div>
    </div>
  );
}
