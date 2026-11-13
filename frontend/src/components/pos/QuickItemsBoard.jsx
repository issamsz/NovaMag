import React, { useState } from 'react';
import { Zap, Settings, Plus, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const COLOR_MAP = {
  amber: {
    container: 'bg-amber-50/80 hover:bg-amber-100 border-amber-200/90 hover:border-amber-300 text-amber-950 shadow-xs shadow-amber-950/5',
    priceTag: 'bg-amber-100 text-amber-900 border-amber-200',
    keyBadge: 'bg-amber-200 text-amber-900'
  },
  yellow: {
    container: 'bg-yellow-50/80 hover:bg-yellow-100 border-yellow-200/90 hover:border-yellow-300 text-yellow-950 shadow-xs shadow-yellow-950/5',
    priceTag: 'bg-yellow-100 text-yellow-900 border-yellow-200',
    keyBadge: 'bg-yellow-200 text-yellow-900'
  },
  slate: {
    container: 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/90 hover:border-slate-300 text-slate-900 shadow-xs shadow-slate-950/5',
    priceTag: 'bg-slate-200 text-slate-800 border-slate-300',
    keyBadge: 'bg-slate-300 text-slate-900'
  },
  sky: {
    container: 'bg-sky-50/80 hover:bg-sky-100 border-sky-200/90 hover:border-sky-300 text-sky-950 shadow-xs shadow-sky-950/5',
    priceTag: 'bg-sky-100 text-sky-900 border-sky-200',
    keyBadge: 'bg-sky-200 text-sky-900'
  },
  blue: {
    container: 'bg-blue-50/80 hover:bg-blue-100 border-blue-200/90 hover:border-blue-300 text-blue-950 shadow-xs shadow-blue-950/5',
    priceTag: 'bg-blue-100 text-blue-900 border-blue-200',
    keyBadge: 'bg-blue-200 text-blue-900'
  },
  orange: {
    container: 'bg-orange-50/80 hover:bg-orange-100 border-orange-200/90 hover:border-orange-300 text-orange-950 shadow-xs shadow-orange-950/5',
    priceTag: 'bg-orange-100 text-orange-900 border-orange-200',
    keyBadge: 'bg-orange-200 text-orange-900'
  },
  emerald: {
    container: 'bg-emerald-50/80 hover:bg-emerald-100 border-emerald-200/90 hover:border-emerald-300 text-emerald-950 shadow-xs shadow-emerald-950/5',
    priceTag: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    keyBadge: 'bg-emerald-200 text-emerald-900'
  },
  rose: {
    container: 'bg-rose-50/80 hover:bg-rose-100 border-rose-200/90 hover:border-rose-300 text-rose-950 shadow-xs shadow-rose-950/5',
    priceTag: 'bg-rose-100 text-rose-900 border-rose-200',
    keyBadge: 'bg-rose-200 text-rose-900'
  },
  purple: {
    container: 'bg-purple-50/80 hover:bg-purple-100 border-purple-200/90 hover:border-purple-300 text-purple-950 shadow-xs shadow-purple-950/5',
    priceTag: 'bg-purple-100 text-purple-900 border-purple-200',
    keyBadge: 'bg-purple-200 text-purple-900'
  },
  indigo: {
    container: 'bg-indigo-50/80 hover:bg-indigo-100 border-indigo-200/90 hover:border-indigo-300 text-indigo-950 shadow-xs shadow-indigo-950/5',
    priceTag: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    keyBadge: 'bg-indigo-200 text-indigo-900'
  }
};

export default function QuickItemsBoard({
  shortcuts = [],
  onSelectProduct,
  onOpenManager,
  isAdmin = false,
  onClose
}) {
  const { language } = useLanguage();
  const [lastClickedId, setLastClickedId] = useState(null);

  const handleClick = (shortcut) => {
    setLastClickedId(shortcut.shortcut_id);
    setTimeout(() => setLastClickedId(null), 300);

    // Build standard product object expected by addProductToTicket
    const product = {
      id: shortcut.product_id || shortcut.id,
      name: shortcut.name,
      price: shortcut.price,
      barcode: shortcut.barcode,
      is_weighted: Boolean(shortcut.is_weighted)
    };

    onSelectProduct(product);
  };

  return (
    <div className="bg-white rounded-2xl p-2.5 shadow-2xs border border-slate-200 shrink-0 animate-fadeIn">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
          </div>
          <span className="text-xs font-black text-slate-800 tracking-tight">
            {language === 'ar' ? 'السلع السريعة (بدون باركود)' : 'Articles Rapides (Sans Code-barres)'}
          </span>
          <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
            {shortcuts.length} {language === 'ar' ? 'سلع' : 'articles'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline ml-1 rtl:ml-0 rtl:mr-1">
            ({language === 'ar' ? `اختصارات: Alt+1 إلى Alt+${Math.min(shortcuts.length, 8)}` : `Raccourcis clavier: Alt+1 à Alt+${Math.min(shortcuts.length, 8)}`})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenManager}
            title={language === 'ar' ? 'إدارة السلع السريعة' : 'Gérer les articles rapides (ajouter, modifier, réorganiser)'}
            className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-0.5 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Settings className="w-3 h-3" />
            <span>{language === 'ar' ? 'إدارة' : 'Gérer'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title={language === 'ar' ? 'إخفاء' : 'Masquer le panneau des articles rapides'}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Shortcuts Grid: 4 columns on small, up to 8 columns on large/wide screens */}
      {shortcuts.length === 0 ? (
        <div className="py-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs text-slate-400 mb-2">{language === 'ar' ? 'لم يتم ضبط سلع سريعة' : 'Aucun raccourci configuré'}</p>
          <button
            type="button"
            onClick={onOpenManager}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'إضافة اختصارات (خبز، بيض...)' : 'Ajouter des raccourcis (Pain, Œufs...)'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-[148px] overflow-y-auto pr-0.5 scrollbar-thin">
          {shortcuts.map((sc, index) => {
            const colorScheme = COLOR_MAP[sc.color] || COLOR_MAP.amber;
            const isClicked = lastClickedId === sc.shortcut_id;

            return (
              <button
                key={sc.shortcut_id || index}
                type="button"
                onClick={() => handleClick(sc)}
                className={`relative flex flex-col justify-between p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer select-none group ${
                  colorScheme.container
                } ${isClicked ? 'scale-90 ring-2 ring-indigo-500 shadow-md' : 'active:scale-95 hover:shadow-sm'}`}
              >
                {/* Top Row: Icon/Emoji & Key Index */}
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xl leading-none group-hover:scale-110 transition-transform">
                    {sc.icon || '⚡'}
                  </span>
                  {index < 8 && (
                    <span
                      className={`text-[9px] font-mono font-black px-1 rounded-md opacity-80 ${colorScheme.keyBadge}`}
                      title={`Raccourci Alt+${index + 1}`}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Middle: Short Name */}
                <div className="text-[11px] font-extrabold leading-tight line-clamp-1 truncate w-full text-slate-900 mb-1">
                  {sc.label || sc.name}
                </div>

                {/* Bottom: Price in DA */}
                <div className="flex items-baseline justify-between w-full mt-auto">
                  <span
                    className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md border text-slate-900 shadow-2xs ${colorScheme.priceTag}`}
                  >
                    {Number(sc.price).toLocaleString('fr-FR', {
                      minimumFractionDigits: Number(sc.price) % 1 === 0 ? 0 : 2,
                      maximumFractionDigits: 2
                    })}{' '}
                    <span className="text-[9px] font-bold">DA</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
