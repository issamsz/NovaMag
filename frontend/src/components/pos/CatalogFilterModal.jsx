import React from 'react';
import { SlidersHorizontal, Star, X, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CatalogFilterModal({
  isOpen,
  onClose,
  favoritesOnly = false,
  setFavoritesOnly,
  sortBy = 'default',
  setSortBy,
  selectedSupplier = 'all',
  setSelectedSupplier,
  stockStatus = 'all',
  setStockStatus,
  suppliers = [],
  onResetFilters,
  activeFiltersCount = 0
}) {
  const { language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-5 animate-scaleIn flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══ HEADER ══ */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-right rtl:text-left">
            <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">
              {language === 'ar' ? 'فلاتر الدليل والمنتجات' : 'Filtres du Catalogue'}
            </h3>
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div className="pt-4 space-y-4">
          
          {/* 1. Featured Products Button */}
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 ${
              favoritesOnly
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30 ring-2 ring-amber-400/50'
                : 'bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60'
            }`}
          >
            <Star className={`w-4 h-4 ${favoritesOnly ? 'fill-white stroke-white' : 'stroke-amber-700 dark:stroke-amber-300'}`} />
            <span>
              {favoritesOnly
                ? (language === 'ar' ? '★ منتجات مميزة (نشط)' : '★ Produits en vedette (Actif)')
                : (language === 'ar' ? '★ تصفية بالمنتجات المميزة' : '★ Filtrer par Produits en vedette')}
            </span>
          </button>

          {/* 2. Trier par */}
          <div>
            <label className="block text-right rtl:text-right text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              {language === 'ar' ? 'ترتيب المنتجات' : 'Trier les produits'}
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 cursor-pointer text-right rtl:text-right pr-9 pl-3 rtl:pr-3 rtl:pl-9 transition-all"
              >
                <option value="default">{language === 'ar' ? 'افتراضي (الأحدث أولاً)' : 'Par défaut (Plus récents d\'abord)'}</option>
                <option value="price-asc">{language === 'ar' ? 'السعر: من الأقل إلى الأعلى' : 'Prix : Du moins cher au plus cher'}</option>
                <option value="price-desc">{language === 'ar' ? 'السعر: من الأعلى إلى الأقل' : 'Prix : Du plus cher au moins cher'}</option>
                <option value="name-asc">{language === 'ar' ? 'الاسم: أبجدياً (أ ← ي)' : 'Nom : Alphabétique (A → Z)'}</option>
                <option value="name-desc">{language === 'ar' ? 'الاسم: أبجدياً عكسي' : 'Nom : Alphabétique (Z → A)'}</option>
                <option value="stock-asc">{language === 'ar' ? 'المخزون: الأقل مخزوناً أولاً' : 'Stock : Moins de stock d\'abord'}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Fournisseur */}
          <div>
            <label className="block text-right rtl:text-right text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              {language === 'ar' ? 'المورد' : 'Fournisseur'}
            </label>
            <div className="relative">
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 cursor-pointer text-right rtl:text-right pr-9 pl-3 rtl:pr-3 rtl:pl-9 transition-all"
              >
                <option value="all">{language === 'ar' ? 'جميع الموردين' : 'Tous les fournisseurs'}</option>
                {suppliers.map((sup, idx) => (
                  <option key={idx} value={sup}>{sup}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 4. État du stock */}
          <div>
            <label className="block text-right rtl:text-right text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              {language === 'ar' ? 'حالة المخزون' : 'État du stock'}
            </label>
            <div className="relative">
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 cursor-pointer text-right rtl:text-right pr-9 pl-3 rtl:pr-3 rtl:pl-9 transition-all"
              >
                <option value="all">{language === 'ar' ? 'جميع الحالات' : 'Tous les états'}</option>
                <option value="in-stock">{language === 'ar' ? 'المتوفر فقط (> 0)' : 'En stock uniquement (> 0)'}</option>
                <option value="low-stock">{language === 'ar' ? 'مخزون منخفض / حرج (≤ 5)' : 'Stock critique / faible (≤ 5)'}</option>
                <option value="out-of-stock">{language === 'ar' ? 'نفاد المخزون (0)' : 'Rupture de stock (0)'}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 5. Effacer les filtres */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onResetFilters}
              disabled={activeFiltersCount === 0}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إعادة ضبط الفلاتر' : 'Effacer les filtres'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
