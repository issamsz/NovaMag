import React from 'react';
import { CreditCard, RotateCcw, Search, Hash, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function SummaryPanel({
  items,
  grandTotal,
  totalQty,
  isReturnMode = false,
  onOpenPayment,
  onClearTicket,
  onOpenSearch,
  onEditQty
}) {
  const { language } = useLanguage();
  const hasItems = items.length > 0;
  const isRefund = isReturnMode || grandTotal < 0;

  return (
    <div className="bg-white dark:bg-[#111C35] rounded-2xl p-4 shadow-2xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between flex-1 min-h-0 overflow-y-auto">
      {/* Top Section: Metrics + Grand Total */}
      <div className="space-y-3">
        {/* Compact Metrics Strip */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{language === 'ar' ? 'إجمالي السلع :' : 'Total Articles:'}</span>
            <span className="font-mono text-indigo-700 dark:text-indigo-400 font-black text-sm">{items.length}</span>
          </div>
          <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{language === 'ar' ? 'إجمالي الوحدات :' : 'Total Unités:'}</span>
            <span className="font-mono text-indigo-700 dark:text-indigo-400 font-black text-sm">{totalQty}</span>
          </div>
        </div>

        {/* Grand Total Card (Hero Section) */}
        <div className={`rounded-2xl p-4 text-white shadow-md text-center relative overflow-hidden transition-all ${
          isRefund
            ? 'bg-gradient-to-br from-rose-950 via-rose-900 to-slate-900 shadow-rose-950/20'
            : 'bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 shadow-indigo-950/20'
        }`}>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-white/80 block mb-1">
            {isRefund
              ? (language === 'ar' ? '⚠️ صافي الإرجاع (استرجاع)' : '⚠️ NET À REMBOURSER (RETOUR)')
              : (language === 'ar' ? 'صافي الدفع (شامل الرسوم)' : 'NET À PAYER (TTC)')}
          </span>

          <div className="my-1 flex items-baseline justify-center gap-2">
            <span className="text-3xl md:text-4xl font-mono font-black tracking-tight text-white drop-shadow-sm">
              {Math.abs(grandTotal).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-base font-bold ${isRefund ? 'text-rose-300' : 'text-emerald-400'}`}>
              DA
            </span>
          </div>

          <div className="text-[11px] text-white/70 font-medium">
            {isRefund
              ? (language === 'ar' ? 'استرجاع للزبون وإعادة للمخزون' : 'Remboursement client & réintégration stock')
              : (language === 'ar' ? 'شامل لجميع الرسوم والضرائب' : 'Toutes taxes et droits compris')}
          </div>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="mt-3 space-y-2.5">
        {/* Giant Emerald/Rose Encaisser or Rembourser Button */}
        <button
          type="button"
          disabled={!hasItems}
          onClick={onOpenPayment}
          className={`w-full py-3.5 px-5 rounded-xl font-black text-base md:text-lg flex items-center justify-between shadow-md transition-all cursor-pointer ${
            hasItems
              ? isRefund
                ? 'bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white shadow-rose-700/30 ring-2 ring-rose-500/50'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-emerald-700/30 ring-2 ring-emerald-500/50'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="tracking-wide">
              {isRefund
                ? (language === 'ar' ? 'إرجاع المبلغ' : 'REMBOURSER')
                : (language === 'ar' ? 'تسديد / قبض' : 'ENCAISSER')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/25 text-white text-xs px-2 py-0.5 rounded-md font-mono font-bold">
              F1
            </span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </div>
        </button>

        {/* Secondary POS Actions */}
        <div className="grid grid-cols-3 gap-2">
          {/* F2 Clear */}
          <button
            type="button"
            disabled={!hasItems}
            onClick={onClearTicket}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 text-slate-700 dark:text-slate-200 hover:text-rose-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'جديد [F2]' : 'Nouveau [F2]'}</span>
          </button>

          {/* F3 Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 text-slate-700 dark:text-slate-200 hover:text-indigo-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'بحث [F3]' : 'Chercher [F3]'}</span>
          </button>

          {/* F4 Edit Qty */}
          <button
            type="button"
            disabled={!hasItems}
            onClick={onEditQty}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-200 text-slate-700 dark:text-slate-200 hover:text-amber-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'الكمية [F4]' : 'Quantité [F4]'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
