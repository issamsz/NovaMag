import React from 'react';
import { PauseCircle, X, RotateCcw, Trash2, ShoppingBag, Clock, User } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { playSaleValidationSound } from '../../services/soundService';

export default function SuspendedTicketsModal({
  isOpen,
  onClose,
  suspendedTickets = [],
  onRestoreTicket,
  onDeleteTicket,
  onClearAllDrafts
}) {
  const { language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══ HEADER ══ */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-right rtl:text-left">
            <div className="flex items-center justify-end rtl:justify-start gap-2">
              <h2 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
                {language === 'ar' ? 'السلات المعلقة (المسودات)' : 'Paniers en attente (Brouillons)'}
              </h2>
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <PauseCircle className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar' ? 'سلات بيع معلقة مؤقتاً للعودة إليها لاحقاً.' : 'Commandes suspendues temporairement pour y revenir plus tard.'}
            </p>
          </div>
        </div>

        {/* ══ BODY / LIST OF SUSPENDED CARTS ══ */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {suspendedTickets.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {language === 'ar' ? 'لا توجد سلات معلقة' : 'Aucun panier en attente'}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                {language === 'ar' ? 'عند الضغط على "تعليق (F2)"، تُحفظ السلة هنا لخدمة الزبون التالي.' : 'Lorsque vous cliquez sur "Attente (F2)", la commande actuelle est sauvegardée ici pour servir le client suivant.'}
              </p>
            </div>
          ) : (
            suspendedTickets.map((draft, idx) => {
              const totalAmount = draft.items.reduce(
                (sum, it) => sum + (it.price * it.quantity),
                0
              );
              const totalItemsCount = draft.items.reduce(
                (sum, it) => sum + (it.isWeighted ? 1 : it.quantity),
                0
              );

              return (
                <div
                  key={draft.id || idx}
                  className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-amber-400/60 dark:hover:border-amber-600/60 hover:shadow-md transition-all group"
                >
                  {/* Left Action Buttons */}
                  <div className="flex items-center gap-2 order-2 sm:order-1">
                    <button
                      type="button"
                      onClick={() => onDeleteTicket(draft.id)}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title={language === 'ar' ? 'حذف هذا السند المعلق' : 'Supprimer définitivement ce brouillon'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playSaleValidationSound();
                        onRestoreTicket(draft);
                      }}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{language === 'ar' ? 'استعادة' : 'Restaurer'}</span>
                    </button>
                  </div>

                  {/* Right Details */}
                  <div className="flex-1 text-right rtl:text-left order-1 sm:order-2">
                    <div className="flex items-center justify-end rtl:justify-start gap-2.5">
                      <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                        {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {language === 'ar' ? 'د.ج' : 'DA'}
                      </span>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-end rtl:justify-start gap-1.5">
                        <span>{draft.title || (language === 'ar' ? `مسودة #${draft.number || idx + 1}` : `Brouillon #${draft.number || idx + 1}`)}</span>
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      </h4>
                    </div>

                    <div className="flex items-center justify-end rtl:justify-start gap-3 text-[11px] text-slate-400 mt-1">
                      {draft.customer && (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
                          <User className="w-3 h-3 text-slate-400" />
                          {draft.customer.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        {draft.items.length} {language === 'ar' ? 'سلعة' : 'produit(s)'} ({totalItemsCount} {language === 'ar' ? 'وحدة' : 'unité(s)'})
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {draft.timeStr || new Date(draft.createdAt || Date.now()).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    {/* Preview of item names */}
                    <div className="flex items-center justify-end rtl:justify-start flex-wrap gap-1 mt-1.5">
                      {draft.items.slice(0, 3).map((it, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md truncate max-w-[140px]"
                        >
                          {it.quantity}x {it.name}
                        </span>
                      ))}
                      {draft.items.length > 3 && (
                        <span className="text-[10px] text-slate-400">
                          +{draft.items.length - 3} {language === 'ar' ? 'أخرى' : 'autre(s)'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ══ FOOTER ══ */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
          {suspendedTickets.length > 0 ? (
            <button
              type="button"
              onClick={onClearAllDrafts}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline cursor-pointer"
            >
              {language === 'ar' ? 'مسح كل المسودات المعلقة' : 'Vider tous les brouillons'}
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
}
