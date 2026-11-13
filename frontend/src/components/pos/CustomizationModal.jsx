import React from 'react';
import { 
  X, Image as ImageIcon, Archive, AlignLeft, Shapes, 
  ShoppingCart, RotateCcw, Plus, Minus, LayoutGrid, Zap, Check 
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CustomizationModal({
  isOpen,
  onClose,
  posLayoutMode = 'catalog',
  onSelectPosLayoutMode,
  customization = {
    showImages: true,
    showStorageLocation: true,
    showDescription: false,
    showCategory: false,
    showCostPrice: false,
    zoomLevel: 100
  },
  onUpdateCustomization,
  onOpenShortcutManager
}) {
  const { language, isRTL } = useLanguage();

  if (!isOpen) return null;

  const toggleOption = (key) => {
    const currentVal = Boolean(customization[key]);
    onUpdateCustomization({
      ...customization,
      [key]: !currentVal
    });
  };

  const setZoom = (newZoom) => {
    const clamped = Math.max(70, Math.min(140, newZoom));
    onUpdateCustomization({
      ...customization,
      zoomLevel: clamped
    });
  };

  const resetZoom = () => {
    onUpdateCustomization({
      ...customization,
      zoomLevel: 100
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn select-none">
      <div 
        className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-md overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête du Modal */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                {language === 'ar' ? 'تخصيص شاشة الصندوق' : 'Personnalisation de la Caisse'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {language === 'ar' ? 'عرض المنتجات، التخطيط وحجم الواجهة' : 'Affichage des articles, disposition et échelle visuelle'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
          
          {/* ══ 1. STYLE DE CAISSE (2 MODES) ══ */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              {language === 'ar' ? 'نمط العمل / شكل شاشة الصندوق' : 'Mode de travail / Style de caisse'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Mode 1: Catalogue Général */}
              <button
                type="button"
                onClick={() => onSelectPosLayoutMode && onSelectPosLayoutMode('catalog')}
                className={`flex flex-col p-2.5 rounded-2xl border text-left rtl:text-right transition-all cursor-pointer ${
                  posLayoutMode === 'catalog'
                    ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 dark:text-blue-100 shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <LayoutGrid className={`w-4 h-4 ${posLayoutMode === 'catalog' ? 'text-blue-600' : 'text-slate-400'}`} />
                  {posLayoutMode === 'catalog' && (
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-xs font-black">
                  {language === 'ar' ? 'الكتالوج (الافتراضي)' : 'Catalogue (Défaut)'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'ar' ? 'شبكة مع الصور والأقسام' : 'Grille avec photos et rayons'}
                </div>
              </button>

              {/* Mode 2: Mode Supérette */}
              <button
                type="button"
                onClick={() => {
                  if (onSelectPosLayoutMode) onSelectPosLayoutMode('superette');
                  onUpdateCustomization({
                    ...customization,
                    showImages: false
                  });
                }}
                className={`flex flex-col p-2.5 rounded-2xl border text-left rtl:text-right transition-all cursor-pointer ${
                  posLayoutMode === 'superette'
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-emerald-100 shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Zap className={`w-4 h-4 ${posLayoutMode === 'superette' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {posLayoutMode === 'superette' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-xs font-black">
                  {language === 'ar' ? 'وضع السوبرماركت السريع' : 'Mode Supérette'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'ar' ? 'كاشير سريع (خبز، بيض...)' : 'Caisse rapide (Pain, Œufs...)'}
                </div>
              </button>
            </div>
          </div>

          {/* ══ 2. OPTIONS D'AFFICHAGE DES CARTES ══ */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              {language === 'ar' ? 'خيارات عرض تفاصيل المنتج' : 'Affichage des détails du produit'}
            </div>

            <div className="space-y-2">
              {/* 1. Afficher les images / photos (Désactivé en mode supérette) */}
              <button
                type="button"
                disabled={posLayoutMode === 'superette'}
                onClick={() => posLayoutMode !== 'superette' && toggleOption('showImages')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all shadow-2xs select-none text-left rtl:text-right ${
                  posLayoutMode === 'superette'
                    ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    : 'bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-700/80 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    posLayoutMode === 'superette'
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-800'
                      : customization.showImages
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                  }`}>
                    {posLayoutMode !== 'superette' && customization.showImages && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${posLayoutMode === 'superette' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {language === 'ar' ? 'إظهار الصور' : 'Afficher les images'}
                      </span>
                      {posLayoutMode === 'superette' && (
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/50 px-1.5 py-0.2 rounded-md">
                          {language === 'ar' ? 'معطل في وضع السوبرماركت' : 'Désactivé en mode supérette'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* 2. Afficher l'emplacement / étagère */}
              <button
                type="button"
                onClick={() => toggleOption('showStorageLocation')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 cursor-pointer transition-all shadow-2xs select-none text-left rtl:text-right"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    customization.showStorageLocation
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                  }`}>
                    {customization.showStorageLocation && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'ar' ? 'إظهار الرف / مكان التخزين' : "Afficher l'emplacement / étagère"}
                  </span>
                </div>
                <Archive className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* 3. Afficher la description du produit */}
              <button
                type="button"
                onClick={() => toggleOption('showDescription')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 cursor-pointer transition-all shadow-2xs select-none text-left rtl:text-right"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    customization.showDescription
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                  }`}>
                    {customization.showDescription && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'ar' ? 'إظهار وصف المنتج' : 'Afficher la description du produit'}
                  </span>
                </div>
                <AlignLeft className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* 4. Afficher la catégorie / rayon */}
              <button
                type="button"
                onClick={() => toggleOption('showCategory')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 cursor-pointer transition-all shadow-2xs select-none text-left rtl:text-right"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    customization.showCategory
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                  }`}>
                    {customization.showCategory && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'ar' ? 'إظهار الفئة / القسم' : 'Afficher la catégorie / rayon'}
                  </span>
                </div>
                <Shapes className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* 5. Afficher le prix d'achat */}
              <button
                type="button"
                onClick={() => toggleOption('showCostPrice')}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 cursor-pointer transition-all shadow-2xs select-none text-left rtl:text-right"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                    customization.showCostPrice
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                  }`}>
                    {customization.showCostPrice && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'ar' ? 'إظهار سعر الشراء' : "Afficher le prix d'achat"}
                  </span>
                </div>
                <ShoppingCart className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* ══ 3. ZOOM / ÉCHELLE DE L'INTERFACE ══ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {language === 'ar' ? 'مقياس وحجم العرض' : "Échelle de l'affichage"}
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400" dir="ltr">
                {customization.zoomLevel || 100}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Bouton Zoom Out (-) */}
              <button
                type="button"
                onClick={() => setZoom((customization.zoomLevel || 100) - 5)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                title={language === 'ar' ? 'تصغير (-5%)' : "Réduire (-5%)"}
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Champ d'affichage central (100%) */}
              <div className="flex-1 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-black text-sm text-blue-600 dark:text-blue-400 shadow-2xs" dir="ltr">
                {customization.zoomLevel || 100}%
              </div>

              {/* Bouton Zoom In (+) */}
              <button
                type="button"
                onClick={() => setZoom((customization.zoomLevel || 100) + 5)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                title={language === 'ar' ? 'تكبير (+5%)' : "Agrandir (+5%)"}
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Bouton Réinitialiser (🔄) */}
              <button
                type="button"
                onClick={resetZoom}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                title={language === 'ar' ? 'إعادة التعيين إلى 100%' : "Réinitialiser l'échelle à 100%"}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Raccourcis Rapides de Zoom (Presets) */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[85, 100, 115, 130].map((level) => {
                const isActive = (customization.zoomLevel || 100) === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setZoom(level)}
                    className={`py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-500/30'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {level}%
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══ 4. LIEN VERS LES RACCOURCIS ══ */}
          {onOpenShortcutManager && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShortcutManager();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-98"
              >
                <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-600" />
                <span>{language === 'ar' ? 'إدارة اختصارات المواد السريعة (خبز، بيض، زيتون...)' : 'Gérer les raccourcis supérette (Pain, Œufs, Zitoune...)'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer avec bouton Terminer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
          >
            {language === 'ar' ? 'حفظ وإغلاق' : 'Enregistrer & Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
}
