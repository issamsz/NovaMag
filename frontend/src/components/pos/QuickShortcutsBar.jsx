import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function QuickShortcutsBar() {
  const { language } = useLanguage();

  const shortcuts = [
    { key: 'F1', label: language === 'ar' ? 'تسديد / قبض' : 'Encaisser', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { key: 'F2', label: language === 'ar' ? 'جديد' : 'Nouveau', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    { key: 'F3', label: language === 'ar' ? 'بحث' : 'Recherche', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    { key: 'F4', label: language === 'ar' ? 'تعديل الكمية' : 'Modifier Qté', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { key: 'Alt+1..8', label: language === 'ar' ? 'سلع سريعة...' : 'Pain, Œufs...', color: 'bg-amber-50 text-amber-900 border-amber-200' },
    { key: 'F6', label: language === 'ar' ? 'إظهار/إخفاء السريعة' : 'Afficher/Masquer Raccourcis', color: 'bg-amber-50 text-amber-900 border-amber-200' },
    { key: 'F8', label: language === 'ar' ? 'وضع المرتجع' : 'Mode Retour', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    { key: 'F9', label: language === 'ar' ? 'تقرير Z' : 'Ticket Z', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    { key: '+ / -', label: language === 'ar' ? 'تعديل الكمية' : 'Ajuster Qté', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    { key: 'Del', label: language === 'ar' ? 'حذف السطر' : 'Supprimer Ligne', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    { key: '↑ / ↓', label: language === 'ar' ? 'تحديد' : 'Sélectionner', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  ];

  return (
    <footer className="bg-white dark:bg-[#111C35] border-t border-slate-200 dark:border-slate-800 px-5 py-1.5 flex items-center justify-between text-xs select-none shrink-0">
      <div className="flex items-center gap-2.5 overflow-x-auto">
        <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
          {language === 'ar' ? 'الاختصارات :' : 'Raccourcis:'}
        </span>
        {shortcuts.map((sc, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-semibold text-[11px] ${sc.color}`}
          >
            <span className="kbd-badge">{sc.key}</span>
            <span>{sc.label}</span>
          </div>
        ))}
      </div>
      <div className="text-slate-400 font-mono text-[11px] shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
        {language === 'ar' ? 'محرك نقطة البيع NovaMag • لوحة المفاتيح نشطة' : 'NovaMag POS Engine • Zero Mouse Actif'}
      </div>
    </footer>
  );
}
