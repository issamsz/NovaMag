import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Lock, 
  Unlock,
  RotateCcw, 
  ShoppingCart, 
  Layers, 
  ChevronDown, 
  SlidersHorizontal,
  Check,
  Star,
  Tag,
  Gift,
  X,
  LayoutGrid,
  Zap,
  Settings,
  UserPlus
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

// Safe Barcode SVG Icon
const BarcodeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14" />
  </svg>
);

// Formattage du montant exactement comme sur la photo : ex. 24.800,00
const formatDisplayBalance = (val) => {
  const num = Number(val) || 0;
  const parts = num.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intPart},${parts[1]}`;
};

// Récupération dynamique et synchronisée du solde réel de la session active
const getLiveBalanceFromStorage = () => {
  try {
    const savedSess = localStorage.getItem('novamag_cash_session');
    if (!savedSess) return 0;
    const sess = JSON.parse(savedSess);
    if (!sess.isOpen) return 0;

    const opening = Number(sess.openingBalance || 0);
    const openTime = sess.openedAt ? new Date(sess.openedAt).getTime() : 0;

    const savedSales = localStorage.getItem('novamag_sales_history');
    const sales = savedSales ? JSON.parse(savedSales) : [];
    const cashSales = sales
      .filter((inv) => {
        const invTime = new Date(inv.timestamp || inv.dateStr).getTime();
        const method = (inv.paymentMethod || 'especes').toLowerCase();
        const isCash = method === 'especes' || method === 'cash';
        return isCash && (!openTime || invTime >= openTime);
      })
      .reduce((sum, inv) => {
        const cashIn = typeof inv.amountPaid === 'number'
          ? Math.max(0, inv.amountPaid - (inv.change || 0))
          : Number(inv.total || 0);
        return sum + cashIn;
      }, 0);

    const savedMovs = localStorage.getItem('novamag_cash_movements');
    const movements = savedMovs ? JSON.parse(savedMovs) : [];
    const deposits = movements.filter((m) => m.type === 'deposit').reduce((s, m) => s + Number(m.amount || 0), 0);
    const withdrawals = movements.filter((m) => m.type === 'withdraw' || m.type === 'expense').reduce((s, m) => s + Number(m.amount || 0), 0);

    const savedCust = localStorage.getItem('novamag_customer_payments');
    const custPayments = savedCust ? JSON.parse(savedCust) : [];
    const custCash = custPayments
      .filter((p) => {
        const pTime = new Date(p.timestamp || p.dateStr).getTime();
        const isCash = !p.paymentMethod || p.paymentMethod.toLowerCase().includes('esp') || p.paymentMethod.toLowerCase().includes('cash');
        return (!openTime || pTime >= openTime) && isCash;
      })
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    return opening + cashSales + deposits + custCash - withdrawals;
  } catch {
    return 0;
  }
};

export default function PosHeader({
  selectedCategory,
  setSelectedCategory,
  categories = [],
  isReturnMode = false,
  setIsReturnMode,
  onToggleReturnMode,
  onOpenDrawer,
  onFreeItem,
  onAddProduct,
  onAddCustomer,
  cashSession,
  // Filters props
  favoritesOnly = false,
  setFavoritesOnly,
  promoOnly = false,
  setPromoOnly,
  packsOnly = false,
  setPacksOnly,
  sortBy = 'default',
  setSortBy,
  selectedSupplier = 'all',
  setSelectedSupplier,
  stockStatus = 'all',
  setStockStatus,
  suppliers = [],
  onResetFilters,
  activeFiltersCount = 0,
  // Customization & Layout props
  posLayoutMode = 'catalog',
  onSelectPosLayoutMode,
  onOpenShortcutManager,
  onOpenCustomizationModal
}) {
  const { t, language, isRTL } = useLanguage();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // État du solde réel en direct pour le point de vente
  const [liveCashBalance, setLiveCashBalance] = useState(getLiveBalanceFromStorage);

  useEffect(() => {
    const handleUpdate = () => {
      setLiveCashBalance(getLiveBalanceFromStorage());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('novamag_cash_updated', handleUpdate);
    window.addEventListener('novamag_sales_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('novamag_cash_updated', handleUpdate);
      window.removeEventListener('novamag_sales_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    setLiveCashBalance(getLiveBalanceFromStorage());
  }, [cashSession]);

  const categoryRef = useRef(null);
  const filterRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory) || categories[0] || { name: 'Tous les rayons' };

  // Traduction du nom de la catégorie "Tous les rayons" sans altérer les noms réels créés par l'utilisateur
  const getCategoryDisplayName = (cat) => {
    if (!cat) return t('pos.all_departments', 'Tous les rayons');
    if (cat.id === 'all' || cat.name === 'Tous les rayons' || cat.name?.toLowerCase().includes('tous les rayons')) {
      return t('pos.all_departments', 'Tous les rayons');
    }
    return cat.name;
  };

  const isSuperette = posLayoutMode === 'superette';

  return (
    <div className={`shrink-0 select-none relative z-30 overflow-visible transition-colors ${
      isSuperette
        ? 'bg-[#EBF3FF] border-b border-blue-200/60 px-4 py-2'
        : 'bg-white dark:bg-[#0F172A] border-b border-slate-200/80 dark:border-slate-800 px-4 py-2'
    }`}>
      <div className="flex items-center justify-between gap-3 relative overflow-visible">

        {/* ══ 1. ACTIONS RAPIDES DE CAISSE (Left Side) ══ */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* ══ BOUTON PERSONNALISATION (Icône seule sans texte) ══ */}
          <button
            type="button"
            onClick={onOpenCustomizationModal}
            className="flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 border bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
            title={t('pos.customize', 'Personnaliser l\'affichage de la caisse')}
          >
            <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          </button>

          {/* ══ BOUTON FILTRE (Déplacé après le bouton Personnaliser, Masqué/Désactivé en Mode Supérette) ══ */}
          {!isSuperette && (
            <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => {
                setIsFilterOpen(!isFilterOpen);
                setIsCategoryOpen(false);
              }}
              className={`flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer shadow-xs border relative ${
                activeFiltersCount > 0 || isFilterOpen
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-700 ring-1 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title={t('pos.filters', 'Options de filtres et tri')}
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-blue-600 text-white text-[8px] font-black leading-none">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Compact Filter Popover directly under the button */}
            {isFilterOpen && (
              <div className="absolute left-0 rtl:left-auto rtl:right-0 top-full mt-2 w-72 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-3.5 animate-scaleIn divide-y divide-slate-100 dark:divide-slate-800/80">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-white">
                    <span>{t('pos.filters', 'Filtres')}</span>
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* Body: Compact elements matching user screenshot */}
                <div className="pt-3 space-y-3 rtl:text-right ltr:text-left">
                  
                  {/* Filtres Rapides : Favoris / En Promo / Packs (Comportement exclusif automatique) */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* 1. Favoris */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !favoritesOnly;
                        setFavoritesOnly && setFavoritesOnly(next);
                        if (next) {
                          setPromoOnly && setPromoOnly(false);
                          setPacksOnly && setPacksOnly(false);
                          if (stockStatus === 'promo-only' || stockStatus === 'packs-only') {
                            setStockStatus && setStockStatus('all');
                          }
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-97 ${
                        favoritesOnly
                          ? 'bg-amber-500 text-white shadow-amber-500/25 ring-2 ring-amber-400/40'
                          : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60'
                      }`}
                      title="Articles Favoris (F6)"
                    >
                      <Star className={`w-3 h-3 ${favoritesOnly ? 'fill-white stroke-white' : 'stroke-amber-700 dark:stroke-amber-300'}`} />
                      <span>{language === 'ar' ? 'مميزة' : 'Favoris'}</span>
                    </button>

                    {/* 2. En Promo */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !promoOnly;
                        setPromoOnly && setPromoOnly(next);
                        if (next) {
                          setFavoritesOnly && setFavoritesOnly(false);
                          setPacksOnly && setPacksOnly(false);
                          if (stockStatus === 'packs-only') {
                            setStockStatus && setStockStatus('all');
                          }
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-97 ${
                        promoOnly
                          ? 'bg-rose-600 text-white shadow-rose-600/25 ring-2 ring-rose-400/40'
                          : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60'
                      }`}
                      title="Articles avec réduction active"
                    >
                      <Tag className={`w-3 h-3 ${promoOnly ? 'fill-white stroke-white' : 'stroke-rose-600 dark:stroke-rose-300'}`} />
                      <span>{language === 'ar' ? 'عروض' : 'Promo'}</span>
                    </button>

                    {/* 3. Packs */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !packsOnly;
                        setPacksOnly && setPacksOnly(next);
                        if (next) {
                          setFavoritesOnly && setFavoritesOnly(false);
                          setPromoOnly && setPromoOnly(false);
                          if (stockStatus === 'promo-only') {
                            setStockStatus && setStockStatus('all');
                          }
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-97 ${
                        packsOnly
                          ? 'bg-purple-600 text-white shadow-purple-600/25 ring-2 ring-purple-400/40'
                          : 'bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60'
                      }`}
                      title="Packs et lots d'articles"
                    >
                      <Gift className={`w-3 h-3 ${packsOnly ? 'fill-white stroke-white' : 'stroke-purple-600 dark:stroke-purple-300'}`} />
                      <span>{language === 'ar' ? 'حزم' : 'Packs'}</span>
                    </button>
                  </div>

                  {/* 1. Trier les produits */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {t('pos.sort_products', 'Trier les produits')}
                    </label>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy && setSortBy(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 cursor-pointer rtl:text-right ltr:text-left pr-7 rtl:pr-2.5 rtl:pl-7 transition-all"
                      >
                        <option value="default">{t('pos.sort_default', 'Par défaut (Plus récents)')}</option>
                        <option value="price-asc">{t('pos.sort_price_asc', 'Prix : Moins cher au plus cher')}</option>
                        <option value="price-desc">{t('pos.sort_price_desc', 'Prix : Plus cher au moins cher')}</option>
                        <option value="name-asc">{t('pos.sort_name_asc', 'Nom : A → Z')}</option>
                        <option value="name-desc">{t('pos.sort_name_desc', 'Nom : Z → A')}</option>
                        <option value="stock-asc">{t('pos.sort_stock_asc', "Stock : Moins de stock d'abord")}</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* 2. Fournisseur */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {t('pos.supplier', 'Fournisseur')}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier && setSelectedSupplier(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 cursor-pointer rtl:text-right ltr:text-left pr-7 rtl:pr-2.5 rtl:pl-7 transition-all"
                      >
                        <option value="all">{t('pos.all_suppliers', 'Tous les fournisseurs')}</option>
                        {suppliers.map((sup, idx) => (
                          <option key={idx} value={sup}>{sup}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* 3. État du stock */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {t('pos.stock_status', 'État du stock')}
                    </label>
                    <div className="relative">
                      <select
                        value={stockStatus}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStockStatus && setStockStatus(val);
                          if (val === 'promo-only') {
                            setPromoOnly && setPromoOnly(true);
                            setPacksOnly && setPacksOnly(false);
                            setFavoritesOnly && setFavoritesOnly(false);
                          } else if (val === 'packs-only') {
                            setPacksOnly && setPacksOnly(true);
                            setPromoOnly && setPromoOnly(false);
                            setFavoritesOnly && setFavoritesOnly(false);
                          } else {
                            if (promoOnly) setPromoOnly && setPromoOnly(false);
                            if (packsOnly) setPacksOnly && setPacksOnly(false);
                          }
                        }}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 cursor-pointer rtl:text-right ltr:text-left pr-7 rtl:pr-2.5 rtl:pl-7 transition-all"
                      >
                        <option value="all">{t('pos.all_statuses', 'Tous les états')}</option>
                        <option value="in-stock">{t('pos.in_stock', 'En stock (> 0)')}</option>
                        <option value="low-stock">{t('pos.low_stock_filter', 'Stock critique (≤ 5)')}</option>
                        <option value="out-of-stock">{t('pos.out_of_stock_filter', 'Rupture de stock (0)')}</option>
                        <option value="promo-only">🏷️ {language === 'ar' ? 'العروض الترويجية فقط' : 'Articles en promotion'}</option>
                        <option value="packs-only">🎁 {language === 'ar' ? 'الحزم فقط' : 'Packs uniquement'}</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* 4. Effacer les filtres */}
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={() => onResetFilters && onResetFilters()}
                      disabled={activeFiltersCount === 0}
                      className="w-full py-1.5 px-3 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{t('pos.clear_filters', 'Effacer les filtres')}</span>
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
          )}

          {/* ══ 1. Art. Libre (F8) ══ */}
          <button
            type="button"
            onClick={onFreeItem}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-100 to-amber-200/90 hover:from-amber-200 hover:to-amber-300 text-amber-950 border border-amber-300 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-97"
            title="Saisir un article avec prix libre (F8)"
          >
            <BarcodeIcon className="w-4 h-4 text-amber-900 shrink-0" />
            <span>{t('pos.free_item', 'Art. Libre')}</span>
            <span className="text-[9px] font-mono font-black bg-amber-300/80 text-amber-950 px-1.5 py-0.5 rounded-md leading-none border border-amber-400/50">
              F8
            </span>
          </button>

          {/* ══ 2. Raccourcis (Affiché uniquement en mode Supérette) ══ */}
          {isSuperette && (
            <button
              type="button"
              onClick={onOpenShortcutManager}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-97 border bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 text-purple-950 border-purple-200"
              title={language === 'ar' ? 'الاختصارات' : "Raccourcis rapides"}
            >
              <span className="text-purple-600 text-sm">★</span>
              <span>{language === 'ar' ? 'الاختصارات' : 'Raccourcis'}</span>
            </button>
          )}

          {/* ══ 3. Solde Caisse en direct ══ */}
          <button
            type="button"
            onClick={onOpenDrawer}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-97 border bg-gradient-to-r from-emerald-100 to-teal-100 hover:from-emerald-200 hover:to-teal-200 text-emerald-950 border-emerald-300"
            title="Solde en caisse"
          >
            <span className="text-emerald-700 text-sm">💵</span>
            <span className="font-mono font-black text-emerald-950 text-xs sm:text-[13px] tracking-tight" dir="ltr">
              {formatDisplayBalance(liveCashBalance)} {language === 'ar' ? 'د.ج' : 'DA'}
            </span>
          </button>

          {/* ══ 3.bis Bouton Retour Vente / Mode Retour ══ */}
          {(onToggleReturnMode || setIsReturnMode) && (
            <button
              type="button"
              onClick={onToggleReturnMode || (() => setIsReturnMode(!isReturnMode))}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-97 border ${
                isReturnMode
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-md shadow-rose-600/30 ring-2 ring-rose-400 animate-pulse'
                  : 'bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 text-rose-900 border-rose-200 hover:border-rose-300'
              }`}
              title={language === 'ar' ? 'التبديل بين وضع البيع ووضع استرجاع السلع' : 'Basculer entre Mode Vente et Mode Retour marchandise'}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReturnMode ? 'text-white animate-spin' : 'text-rose-600'}`} />
              <span>
                {isReturnMode
                  ? (language === 'ar' ? 'وضع المرتجع نشط ⚠️' : 'MODE RETOUR ACTIF ⚠️')
                  : (language === 'ar' ? 'مرتجع بيع' : 'Retour Vente')}
              </span>
            </button>
          )}
        </div>

        {/* ══ 2. CATALOGUE CONTROLS (Right Side) ══ */}
        <div className="flex items-center gap-2 shrink-0 overflow-visible">

          {/* ══ 4. + Produit ══ */}
          {onAddProduct && (
            <button
              type="button"
              onClick={onAddProduct}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md shadow-blue-600/30 whitespace-nowrap active:scale-97"
              title="Créer un nouveau produit"
            >
              <Plus className="w-4 h-4 stroke-[3] shrink-0" />
              <span>{t('pos.product', '+ Produit')}</span>
            </button>
          )}

          {/* ══ 5. Tous les rayons (Dropdown) — Masqué uniquement en mode Supérette, conservé en mode Catalogue ══ */}
          {posLayoutMode !== 'superette' && (
            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryOpen(!isCategoryOpen);
                  setIsFilterOpen(false);
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl text-xs font-black border border-slate-200 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-97"
                title="Filtrer par rayon / catégorie"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{getCategoryDisplayName(selectedCategoryObj)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}" />
              </button>

              {/* Dropdown Menu - Perfectly positioned and visible (z-50) */}
              {isCategoryOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xl z-50 py-1.5 animate-scaleIn divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {t('pos.departments_categories', 'Rayons & Catégories')}
                  </div>
                  <div className="py-1">
                    {categories.map((cat) => {
                      const isSelected = selectedCategory === cat.id;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            <span className={isSelected ? 'font-black' : ''}>{getCategoryDisplayName(cat)}</span>
                          </div>
                          {cat.count !== undefined && (
                            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800">
                              {cat.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
