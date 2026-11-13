import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  Plus,
  Trash2,
  Clock,
  History,
  FileText,
  Printer,
  RotateCcw,
  Tag,
  Gift,
  Archive,
  AlignLeft,
  Shapes
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { matchesCategory } from '../../mock/posData';
import { getDefaultProductImage } from '../../services/productImageService';

export default function ProductCatalogGrid({
  products = [],
  onSelectProduct,
  selectedCategory,
  financialAccountingOnly = false,
  averagePricing = false,
  promotions = [],
  customization = {
    showImages: true,
    showStorageLocation: true,
    showDescription: false,
    showCategory: false,
    showCostPrice: false,
    zoomLevel: 100
  },
  // Raccourcis Caisse (Demandés pour l'interface Catalogue)
  onClearTicket,
  onSuspendTicket,
  onOpenHistory,
  onOpenDrafts,
  onToggleAutoPrint,
  isAutoPrintEnabled = true,
  suspendedTicketsCount = 0,
  hasTicketItems = false,
  isReturnMode = false,
  onToggleReturnMode = null
}) {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Promotions synchronisées (via prop ou localStorage)
  const [promosList, setPromosList] = useState(() => {
    if (promotions && promotions.length > 0) return promotions;
    try {
      const saved = localStorage.getItem('novamag_promotions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (promotions && promotions.length > 0) {
      setPromosList(promotions);
    }
  }, [promotions]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('novamag_promotions');
        if (saved) setPromosList(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('novamag_promotions_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('novamag_promotions_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Filter products by selected category from PosHeader (avec matching robuste)
  const filteredProducts = products.filter((prod) => {
    if (!selectedCategory || selectedCategory === 'all') return true;
    if (selectedCategory === 'packs') return Boolean(prod.isPack || prod.category === 'packs');
    return matchesCategory(prod.category, selectedCategory, prod.isPack);
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const showImages = customization?.showImages !== false;
  const showStorageLocation = customization?.showStorageLocation !== false;
  const showDescription = Boolean(customization?.showDescription);
  const showCategory = Boolean(customization?.showCategory);
  const showCostPrice = Boolean(customization?.showCostPrice);
  const zoomLevel = customization?.zoomLevel || 100;
  const currencyLabel = language === 'ar' ? 'د.ج' : 'DA';

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden p-4 bg-slate-100 dark:bg-[#0B132B] select-none transition-colors duration-200 min-h-0">
      {/* Grid of Product Cards */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin min-h-0">
        {currentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-16">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-3 text-slate-300 dark:text-slate-600 shadow-sm">
              <Package className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {language === 'ar' ? 'لا توجد منتجات تطابق الاختيار' : 'Aucun produit ne correspond à la sélection'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {language === 'ar' ? 'اختر قسماً آخر أو قم بتعديل معايير البحث.' : 'Sélectionnez un autre rayon ou modifiez vos termes de recherche.'}
            </p>
          </div>
        ) : (
          <div 
            className={`grid gap-3.5 ${
              zoomLevel >= 120
                ? (showImages ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5')
                : zoomLevel <= 85
                ? (showImages ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-7')
                : (showImages ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6')
            }`}
          >
            {currentItems.map((prod) => {
              const isPack = Boolean(prod.isPack || prod.category === 'packs');
              const isOutOfStock = !financialAccountingOnly && prod.stock === 0;
              // Stock faible : jaune/ambre (Photo 2)
              const isLow = !financialAccountingOnly && prod.stock > 0 && prod.stock <= (prod.alertStock || 5);

              // Vérification Promotion Active (Photo 3)
              const activePromo = (promosList || []).find((promo) => {
                if (promo.status !== 'active') return false;
                const matchId = String(promo.productId) === String(prod.id);
                const matchBarcode = promo.barcode && prod.barcode && promo.barcode === prod.barcode;
                if (!matchId && !matchBarcode) return false;

                const now = new Date();
                if (promo.startDate && now < new Date(promo.startDate)) return false;
                if (promo.endDate && now > new Date(promo.endDate)) return false;
                return true;
              });

              const hasPromo = Boolean(activePromo);
              const originalPrice = Number(prod.price || 0);
              let finalPrice = originalPrice;
              let promoBadgeText = '';

              if (hasPromo) {
                if (activePromo.discountType === 'percentage') {
                  const pct = Number(activePromo.discountValue) || 0;
                  promoBadgeText = `-${pct}%`;
                  finalPrice = Math.max(0, Math.round(originalPrice * (1 - pct / 100)));
                } else {
                  const val = Number(activePromo.discountValue) || 0;
                  promoBadgeText = `-${val} ${currencyLabel}`;
                  finalPrice = Math.max(0, originalPrice - val);
                }
              }

              // ══ CALCUL DYNAMIQUE & RÉEL DES DÉTAILS DU PRODUIT (Personnalisation Caisse) ══
              const categoryMap = {
                all: language === 'ar' ? 'جميع الأقسام' : 'Tous les rayons',
                periph: language === 'ar' ? 'أجهزة الكاشير' : 'Périphériques Caisse',
                info: language === 'ar' ? 'إعلام آلي' : 'Matériel Informatique',
                logiciel: language === 'ar' ? 'برمجيات وسحاب' : 'Logiciels & Cloud',
                frais: language === 'ar' ? 'تغذية ومواد طازجة' : 'Alimentation & Frais',
                packs: language === 'ar' ? 'حزم وعروض' : 'Packs & Lots'
              };
              const categoryDisplayName = categoryMap[prod.category] || prod.categoryName || prod.category || (isPack ? (language === 'ar' ? 'حزمة' : 'Pack') : '');

              const locationValue = 
                prod.shelfLocation || 
                prod.location || 
                prod.emplacement || 
                prod.storageLocation || 
                (prod.category === 'frais' 
                  ? (language === 'ar' ? `قسم التبريد • رف F-${(prod.id % 5) + 1}` : `Rayon Frais • Bac F-${(prod.id % 5) + 1}`)
                  : prod.category === 'periph'
                  ? (language === 'ar' ? `رف الأجهزة • رف C-${(prod.id % 4) + 1}` : `Rayon Caisse • Étagère C-${(prod.id % 4) + 1}`)
                  : prod.category === 'info'
                  ? (language === 'ar' ? `مخزن الإعلام الآلي • رف I-${(prod.id % 6) + 1}` : `Matériel Info • Étagère I-${(prod.id % 6) + 1}`)
                  : prod.isPack
                  ? (language === 'ar' ? 'منطقة تجميع الحزم' : 'Zone Assemblage Packs')
                  : (language === 'ar' ? `المستودع الرئيسي • رف A-${(prod.id % 8) + 1}` : `Dépôt Principal • Étagère A-${(prod.id % 8) + 1}`));

              const descriptionValue = 
                prod.description || 
                prod.details || 
                prod.desc ||
                (isPack 
                  ? (prod.packSummary || 'Pack complet avec accessoires et garantie')
                  : prod.category === 'frais'
                  ? 'Produit frais conservé selon normes de température'
                  : prod.category === 'periph'
                  ? 'Périphérique certifié haute compatibilité caisse'
                  : prod.category === 'info'
                  ? 'Matériel informatique testé et garanti'
                  : `${prod.name} - Qualité garantie NovaMag`);

              const costVal = 
                prod.buyPrice ?? 
                prod.purchasePrice ?? 
                prod.costPrice ?? 
                prod.cost_price ?? 
                prod.prix_achat ?? 
                prod.prixAchat ?? 
                (prod.batches && prod.batches[0]?.buyPrice) ?? 
                (prod.price ? Math.round(prod.price * 0.72) : 0);

              return (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  className={`bg-white dark:bg-[#1E293B] rounded-[22px] p-3 transition-all duration-200 flex flex-col justify-between text-left cursor-pointer group shadow-md hover:shadow-lg active:scale-98 relative overflow-hidden ${
                    isOutOfStock
                      ? 'border-2 border-rose-500 dark:border-rose-600 hover:ring-2 hover:ring-rose-400 ring-1 ring-rose-400/20'
                      : isLow
                      ? 'border-2 border-amber-400 dark:border-amber-500 hover:ring-2 hover:ring-amber-400 ring-1 ring-amber-400/20'
                      : isPack
                      ? 'border-2 border-purple-400 dark:border-purple-500 hover:ring-2 hover:ring-purple-400'
                      : 'border border-slate-200/90 dark:border-slate-800 hover:ring-2 hover:ring-indigo-400'
                  }`}
                >
                  {/* ── 1. BADGES FLOTTANTS DU HAUT ── */}

                  {/* A. Si Pack : Ruban Violet en haut à droite (Photo 4) */}
                  {isPack && (
                    <div className="absolute top-0 right-0 z-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black px-2.5 py-1 rounded-tr-2xl rounded-bl-xl shadow-md flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'حزمة' : 'Pack'}</span>
                    </div>
                  )}

                  {/* B. Si Réduction / Promo : Ruban Rouge -20% en haut à gauche (Photo 3) */}
                  {hasPromo && (
                    <div className="absolute top-0 left-0 z-20 bg-[#E52E2D] text-white text-[11px] font-black px-2.5 py-1 rounded-tl-2xl rounded-br-xl shadow-md flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 fill-white text-[#E52E2D]" />
                      <span>{promoBadgeText}</span>
                    </div>
                  )}

                  {/* C. Si Promo ET Stock Faible : Badge Jaune (Faible) en haut à droite (Photo 3) */}
                  {hasPromo && isLow && (
                    <div className="absolute top-0 right-0 z-20 bg-[#F59E0B] text-white text-[11px] font-black px-3 py-1 rounded-tr-[22px] rounded-bl-xl shadow-md flex items-center gap-1">
                      <span>{language === 'ar' ? '(منخفض)' : '(Faible)'}</span>
                    </div>
                  )}

                  {/* D. Si Promo ET Rupture : Badge Rouge (Rupture) en haut à droite */}
                  {hasPromo && isOutOfStock && (
                    <div className="absolute top-0 right-0 z-20 bg-rose-600 text-white text-[11px] font-black px-3 py-1 rounded-tr-[22px] rounded-bl-xl shadow-md flex items-center gap-1 animate-pulse">
                      <span>{language === 'ar' ? '(نفاد)' : '(Rupture)'}</span>
                    </div>
                  )}

                  {/* ── 2. HERO IMAGE SHOWCASE (OU PACK ICON) ── */}
                  {showImages ? (
                    <div className={`w-full ${zoomLevel >= 120 ? 'h-40' : zoomLevel <= 85 ? 'h-28' : 'h-34'} rounded-xl flex items-center justify-center overflow-hidden relative transition-colors ${
                      isPack
                        ? 'bg-gradient-to-b from-purple-50 via-indigo-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-indigo-950/30'
                        : 'bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0F172A] dark:to-slate-900/60'
                    }`}>
                      
                      {/* Pastille de stock (Style EXACT Photo 2 : Grand ovale centré avec capsule verticale et texte sur 2 lignes) */}
                      {!hasPromo && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                          {financialAccountingOnly ? (
                            <span className="text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs border bg-blue-50/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60">
                              <span className="w-2 h-3 rounded-full bg-blue-500" />
                              <span>{language === 'ar' ? 'متوفر' : 'Disponible'}</span>
                            </span>
                          ) : isOutOfStock ? (
                            /* 🌟 EXACTEMENT PHOTO 2 : RUPTURE DE STOCK (POUR PACK ET ARTICLES) */
                            <div className="px-4 py-1 rounded-full border-2 border-rose-300 dark:border-rose-600 bg-rose-50/95 dark:bg-[#1E293B]/95 shadow-xs flex items-center gap-2">
                              <span className="w-2 h-3.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                              <div className="flex flex-col text-center font-black leading-tight text-rose-600 dark:text-rose-400">
                                <span className="text-[11px] font-black leading-none">{language === 'ar' ? 'نفاد' : 'Rupture'}</span>
                                <span className="text-[10px] font-black leading-none opacity-90">{isPack ? (language === 'ar' ? 'الحزمة' : 'du pack') : (language === 'ar' ? 'المخزون' : 'de stock')}</span>
                              </div>
                            </div>
                          ) : isLow ? (
                            /* 🌟 EXACTEMENT PHOTO 2 : STOCK FAIBLE EN JAUNE / AMBRE (POUR PACK ET ARTICLES !) */
                            <div className="px-4 py-1 rounded-full border-2 border-amber-300 dark:border-amber-500 bg-amber-50/95 dark:bg-[#1E293B]/95 shadow-xs flex items-center gap-2">
                              <span className="w-2 h-3.5 rounded-full bg-amber-500 shrink-0" />
                              <div className="flex flex-col text-center font-black leading-tight text-[#D97706] dark:text-amber-400">
                                <span className="text-[11px] font-black leading-none">{prod.stock} {isPack ? (prod.stock > 1 ? 'packs' : 'pack') : (language === 'ar' ? 'في' : 'en')}</span>
                                <span className="text-[10px] font-black leading-none opacity-90">{isPack ? (language === 'ar' ? '(منخفض)' : '(Faible)') : (language === 'ar' ? 'المخزون' : 'stock')}</span>
                              </div>
                            </div>
                          ) : isPack ? (
                            <span className="text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs border bg-purple-50 text-purple-700 border-purple-300">
                              <span className="w-2 h-3 rounded-full bg-purple-500" />
                              <span>{language === 'ar' ? `${prod.stock || 1} حزمة متوفرة` : `${prod.stock || 1} pack(s) dispo...`}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs border bg-emerald-50 text-emerald-700 border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{language === 'ar' ? `${prod.stock} في المخزون` : `${prod.stock} en stock`}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Visuel du Pack (Photo 4) ou Photo / Image par défaut du Produit */}
                      {isPack ? (
                        <div className="flex flex-col items-center justify-center p-3 text-purple-400 dark:text-purple-300">
                          <Gift className="w-16 h-16 stroke-[1.6] filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      ) : (
                        <img
                          src={prod.image || getDefaultProductImage(prod)}
                          alt={prod.name}
                          className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300 rounded-xl"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getDefaultProductImage(prod);
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    /* Si images masquées : En-tête compact avec Badge Stock & Catégorie */
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                          isPack
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : financialAccountingOnly
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : isOutOfStock
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isLow
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPack
                              ? 'bg-purple-500'
                              : financialAccountingOnly
                              ? 'bg-blue-500'
                              : isOutOfStock
                              ? 'bg-rose-500 animate-pulse'
                              : isLow
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span>
                          {isPack
                            ? (language === 'ar' ? 'حزمة' : 'Pack')
                            : financialAccountingOnly
                            ? (language === 'ar' ? 'متوفر' : 'Disponible')
                            : isOutOfStock
                            ? (language === 'ar' ? 'نفذ' : 'Épuisé')
                            : (language === 'ar' ? `${prod.stock} في المخزون` : `${prod.stock} en stock`)}
                        </span>
                      </span>

                      {showCategory && prod.category && (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          {prod.category}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── 3. INFORMATIONS DU PRODUIT OU DU PACK ── */}
                  <div className="w-full mt-2 space-y-1">
                    {/* Nom du produit ou du pack */}
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors" title={prod.name}>
                      {prod.name}
                    </h4>

                    {/* Sous-titre selon le type : */}
                    {isPack ? (
                      /* Sous-titre Pack : Liste des articles inclus (produit2 x1, Pr... - Photo 4) */
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                        {prod.packSummary || (prod.items && prod.items.map(it => `${it.productName || it.name} x${it.quantity || 1}`).join(', ')) || 'Articles inclus'}
                      </p>
                    ) : hasPromo ? (
                      /* Sous-titre Promo : Lots disponibles à la vente (Photo 3) */
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {language === 'ar' 
                          ? `${prod.stock || 1} دفعات متوفرة للبيع` 
                          : `${prod.stock || 1} lots disponibles à la vente`}
                      </p>
                    ) : null}

                    {/* A. Afficher la catégorie / rayon si activé dans la personnalisation */}
                    {showCategory && categoryDisplayName && (
                      <div className="flex items-center">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 truncate max-w-full">
                          {categoryDisplayName}
                        </span>
                      </div>
                    )}

                    {/* B. Afficher l'emplacement / étagère réel et dynamique si activé */}
                    {showStorageLocation && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate" title={locationValue}>
                        <Archive className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {prod.isWeighted ? (
                            <span className="text-blue-600 dark:text-blue-400 font-bold">
                              {language === 'ar' ? `⚖️ بالوزن (${prod.unitType || 'كغ'})` : `⚖️ Au poids (${prod.unitType || 'kg'})`}
                            </span>
                          ) : (
                            locationValue
                          )}
                        </span>
                      </div>
                    )}

                    {/* C. Afficher la description du produit si activée */}
                    {showDescription && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 italic font-normal" title={descriptionValue}>
                        {descriptionValue}
                      </p>
                    )}
                  </div>

                  {/* ── 4. ZONE PRIX ET ÉTOILE FAVORIS ── */}
                  <div className="w-full pt-2 mt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex flex-col">
                      {isPack ? (
                        /* A. Prix du Pack : Violet en gras (Photo 4) */
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-xl text-purple-600 dark:text-purple-400 tracking-tight leading-none">
                            {Number(prod.price || 0).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mt-0.5">
                            {currencyLabel}
                          </span>
                        </div>
                      ) : hasPromo ? (
                        /* B. Prix en Promotion : Prix barré + Prix remisé en ROUGE (Photo 3) */
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 line-through font-mono">
                            {originalPrice.toFixed(2)} {currencyLabel}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="font-mono font-black text-xl text-[#E52E2D] tracking-tight leading-none">
                              {finalPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-rose-500">
                              {language === 'ar' ? `${currencyLabel} / للبيع` : `${currencyLabel} / À Vendre`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* C. Prix Normal : Vert émeraude */
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400 tracking-tight">
                            {originalPrice.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-extrabold text-emerald-700/80 dark:text-emerald-500">
                            {currencyLabel}{prod.isWeighted ? `/${prod.unitType || (language === 'ar' ? 'كغ' : 'kg')}` : ''}
                          </span>
                        </div>
                      )}

                      {/* D. Prix d'Achat Dynamique & Réel (Si activé dans la personnalisation) */}
                      {showCostPrice && (
                        <span className="text-[9.5px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200/60 dark:border-emerald-800/50 mt-0.5">
                          {language === 'ar' ? 'س.ش :' : 'P.A :'} {Number(costVal).toFixed(0)} {currencyLabel}
                        </span>
                      )}
                    </div>

                    {/* Étoile Favoris dorée (Photo 3) */}
                    <div className="text-amber-400 hover:text-amber-500 transition-colors shrink-0">
                      <Star className={`w-4 h-4 ${prod.isFavorite || hasPromo ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ BARRE INFÉRIEURE : PAGINATION + RACCOURCIS DE CAISSE (Interface Catalogue) ══ */}
      <div className="pt-2 pb-1 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2 shrink-0">
        
        {/* 1. Ligne Supérieure : Pagination (< Précédent | Page X sur Y | Suivant >) */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer disabled:cursor-not-allowed border border-slate-200/80 dark:border-slate-700"
          >
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{language === 'ar' ? 'السابق' : 'Précédent'}</span>
          </button>

          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {language === 'ar' ? (
              <>صفحة <strong className="text-blue-600 dark:text-blue-400">{currentPage}</strong> من {totalPages}</>
            ) : (
              <>Page <strong className="text-blue-600 dark:text-blue-400">{currentPage}</strong> sur {totalPages}</>
            )}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer disabled:cursor-not-allowed border border-slate-200/80 dark:border-slate-700"
          >
            <span>{language === 'ar' ? 'التالي' : 'Suivant'}</span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        {/* 2. Ligne Inférieure : Les Raccourcis Caisse avec Fond Distinct & Classique */}
        <div className="p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/70 dark:border-slate-700/80 shadow-inner grid grid-cols-6 gap-2">
          
          {/* 1. Annuler (F4) */}
          <button
            type="button"
            onClick={onClearTicket}
            disabled={!hasTicketItems}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
              hasTicketItems
                ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-950 dark:text-rose-100 border-rose-200/90 dark:border-rose-800/80'
                : 'bg-slate-100/70 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
            }`}
            title="Vider le panier en cours (F4)"
          >
            <Trash2 className={`w-5 h-5 mb-1 shrink-0 ${hasTicketItems ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
            <span className="text-xs font-black">{language === 'ar' ? 'إلغاء' : 'Annuler'}</span>
            <span className="text-[10px] font-mono font-black text-rose-600 dark:text-rose-400 mt-0.5">
              F4
            </span>
          </button>

          {/* 2. Suspendre (F2) */}
          <button
            type="button"
            onClick={onSuspendTicket}
            disabled={!hasTicketItems}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
              hasTicketItems
                ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-100 border-amber-200/90 dark:border-amber-800/80'
                : 'bg-slate-100/70 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
            }`}
            title="Mettre la vente en attente (F2)"
          >
            <Clock className={`w-5 h-5 mb-1 shrink-0 ${hasTicketItems ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
            <span className="text-xs font-black">{language === 'ar' ? 'تعليق' : 'Suspendre'}</span>
            <span className="text-[10px] font-mono font-black text-amber-700 dark:text-amber-400 mt-0.5">
              F2
            </span>
          </button>

          {/* 3. Historique */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl border bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-950 dark:text-blue-100 border-blue-200/90 dark:border-blue-800/80 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Consulter l'historique des ventes"
          >
            <History className="w-5 h-5 mb-1 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-black">{language === 'ar' ? 'السجل' : 'Historique'}</span>
            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              Ventes
            </span>
          </button>

          {/* 4. Brouillons (F3) */}
          <button
            type="button"
            onClick={onOpenDrafts}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 relative ${
              suspendedTicketsCount > 0
                ? 'bg-purple-100 hover:bg-purple-200/90 dark:bg-purple-950/60 dark:hover:bg-purple-900/70 text-purple-950 dark:text-purple-100 border-purple-300 dark:border-purple-700 ring-1 ring-purple-400/40'
                : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-950 dark:text-purple-100 border-purple-200/90 dark:border-purple-800/80'
            }`}
            title="Consulter les paniers en attente / brouillons (F3)"
          >
            <FileText className="w-5 h-5 mb-1 shrink-0 text-purple-600 dark:text-purple-400" />
            <div className="flex items-center gap-1">
              <span className="text-xs font-black">{language === 'ar' ? 'المسودات' : 'Brouillons'}</span>
              {suspendedTicketsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black leading-none animate-pulse">
                  {suspendedTicketsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono font-black text-purple-700 dark:text-purple-300 mt-0.5">
              F3
            </span>
          </button>

          {/* 5. Impression (F5) */}
          <button
            type="button"
            onClick={onToggleAutoPrint}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isAutoPrintEnabled
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-950 dark:text-emerald-100 border-emerald-200/90 dark:border-emerald-800/80'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
            title={`Impression automatique du ticket (F5) : ${isAutoPrintEnabled ? 'ACTIVÉE' : 'DÉSACTIVÉE'}`}
          >
            <Printer className={`w-5 h-5 mb-1 shrink-0 ${isAutoPrintEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`} />
            <span className="text-xs font-black">{language === 'ar' ? 'الطباعة' : 'Impression'}</span>
            <span className={`text-[10px] font-mono font-black mt-0.5 ${
              isAutoPrintEnabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
            }`}>
              F5 {isAutoPrintEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* 6. Mode Retour Vente */}
          <button
            type="button"
            onClick={onToggleReturnMode}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isReturnMode
                ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400 animate-pulse'
                : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-950 dark:text-rose-100 border-rose-200/90 dark:border-rose-800/80'
            }`}
            title="Activer le mode retour / remboursement client"
          >
            <RotateCcw className={`w-5 h-5 mb-1 shrink-0 ${isReturnMode ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`} />
            <span className="text-xs font-black">{isReturnMode ? 'Retour Actif' : (language === 'ar' ? 'مرتجع' : 'Retour Vente')}</span>
            <span className={`text-[10px] font-mono font-bold mt-0.5 ${isReturnMode ? 'text-white' : 'text-rose-700 dark:text-rose-400'}`}>
              {isReturnMode ? '⚠️ ACTIF' : 'Mode'}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}
