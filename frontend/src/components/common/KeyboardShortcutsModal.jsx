import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  const { language } = useLanguage();

  // Fermer avec la touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
      <div 
        className="bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 animate-scaleIn relative flex flex-col overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête : Titre & Bouton Fermer */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-500 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
            title={language === 'ar' ? 'إغلاق [Esc]' : 'Fermer [Échap]'}
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
              {language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Raccourcis Clavier'}
            </h2>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Contenu : 2 Colonnes structurées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 flex-1 scrollbar-thin">
          
          {/* ══════════════ COLONNE 1 ══════════════ */}
          <div className="space-y-4">
            
            {/* 1. Écran des Ventes (Titre Bleu) */}
            <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-wide">
                {language === 'ar' ? 'شاشة البيع والصندوق' : 'Écran des Ventes'}
              </div>

              <div className="space-y-2.5">
                
                {/* F7 : Recherche produit */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'البحث عن منتج بالاسم' : 'Recherche de produit par nom'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                    F7
                  </kbd>
                </div>

                {/* F1 : Règlement / Vente (Mis en avant en bleu) */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'تسديد / تأكيد عملية البيع' : 'Règlement / Valider la vente'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 font-mono font-black text-blue-700 dark:text-blue-300 shadow-2xs text-[11px]">
                    F1
                  </kbd>
                </div>

                {/* F4 : Vider la caisse */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'تفريغ سلة الشراء' : 'Vider le panier / la caisse'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                    F4
                  </kbd>
                </div>

                {/* F2 : Mettre en attente */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'تعليق السلة (حفظ مسودة)' : 'Mettre le panier en attente (Brouillon)'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                    F2
                  </kbd>
                </div>

                {/* F3 : Ouvrir les brouillons */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'فتح السلات المعلقة' : 'Ouvrir les tickets en attente'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                    F3
                  </kbd>
                </div>

              </div>
            </div>

            {/* 2. Navigation dans le panier (Titre Bleu) */}
            <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-wide">
                {language === 'ar' ? 'التنقل داخل السلة' : 'Navigation dans le Panier'}
              </div>

              <div className="space-y-2.5">
                
                {/* ↑ ↓ : Navigation lignes */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'التنقل بين أسطر السلة' : 'Naviguer entre les lignes du panier'}
                  </span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 font-mono font-bold text-blue-700 dark:text-blue-300 shadow-2xs text-xs">
                      ↑
                    </kbd>
                    <kbd className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 font-mono font-bold text-blue-700 dark:text-blue-300 shadow-2xs text-xs">
                      ↓
                    </kbd>
                  </div>
                </div>

                {/* Suppr : Supprimer la ligne */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'حذف السطر المحدد' : 'Supprimer la ligne sélectionnée'}
                  </span>
                  <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-rose-600 dark:text-rose-400 shadow-2xs text-[10px]">
                    Suppr / Del
                  </kbd>
                </div>

                {/* Entrée : Modifier quantité */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'إدخال الكمية بدقة بلوحة المفاتيح' : 'Saisir la quantité exacte au clavier'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                    Enter ⏎
                  </kbd>
                </div>

              </div>
            </div>

          </div>

          {/* ══════════════ COLONNE 2 ══════════════ */}
          <div className="space-y-4">
            
            {/* 3. Opérations Rapides (Titre Vert) */}
            <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-wide">
                {language === 'ar' ? 'العمليات السريعة' : 'Opérations Rapides'}
              </div>

              <div className="space-y-2.5">
                
                {/* F9 / F10 : Historique des commandes */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'التنقل بين المبيعات السابقة' : 'Naviguer entre les ventes précédentes'}
                  </span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                      F9
                    </kbd>
                    <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                      F10
                    </kbd>
                  </div>
                </div>

                {/* F5 : Impression automatique */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'الطباعة التلقائية (تفعيل / إيقاف)' : 'Impression automatique (Activer/Couper)'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                    F5
                  </kbd>
                </div>

                {/* F6 : Favoris */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'تصفية المنتجات المفضلة' : 'Filtrer les produits favoris'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                    F6
                  </kbd>
                </div>

                {/* F11 : Sélectionner un client */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'تحديد زبون' : 'Sélectionner un client'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                    F11
                  </kbd>
                </div>

                {/* F12 : Modifier la quantité du dernier article */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'تعديل كمية السطر الأخير' : 'Modifier la quantité de la dernière ligne'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-200 shadow-2xs text-[11px]">
                    F12
                  </kbd>
                </div>

                {/* + / - : Augmenter / Diminuer quantité */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'زيادة / إنقاص الكمية (+1 / -1)' : 'Augmenter / Diminuer la quantité (+1 / -1)'}
                  </span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400 shadow-2xs text-xs">
                      +
                    </kbd>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-rose-600 dark:text-rose-400 shadow-2xs text-xs">
                      -
                    </kbd>
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Navigation Rapide (Titre Ambre/Orange) */}
            <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black text-amber-600 dark:text-amber-400 tracking-wide">
                {language === 'ar' ? 'التنقل والإدخال السريع' : 'Navigation Rapide'}
              </div>

              <div className="space-y-2.5">
                
                {/* F8 : Produit libre (Mis en avant en jaune/ambre) */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ar' ? 'منتج حر / سعر مباشر' : 'Produit libre / Prix direct'}
                  </span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 font-mono font-black text-amber-800 dark:text-amber-200 shadow-2xs text-[11px]">
                    F8
                  </kbd>
                </div>

                {/* Pavé numérique / Numpad */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 leading-tight">
                    {language === 'ar' ? 'أرقام لوحة الأرقام تُدخل مباشرة في خانة الباركود' : 'Chiffres du pavé numérique saisis directement dans le code-barres'}
                  </span>
                  <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300 shadow-2xs text-[10px] shrink-0 ml-2 rtl:ml-0 rtl:mr-2">
                    Numpad
                  </kbd>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Pied de page : Bouton Fermer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-start rtl:justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
        </div>

      </div>
    </div>
  );
}
