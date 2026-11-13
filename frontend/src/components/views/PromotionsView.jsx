import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Calendar,
  X,
  Pause,
  Play,
  Edit3,
  Trash2,
  Save,
  ShoppingCart,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import ModernToast from '../common/ModernToast';
import { useLanguage } from '../../i18n/LanguageContext';
import { getDefaultProductImage } from '../../services/productImageService';
import { MOCK_PRODUCTS, sanitizeProductsWithRealNames } from '../../mock/posData';

export const DEFAULT_PROMOTIONS = [
  {
    id: 'promo_1',
    productId: '2',
    productName: 'Souris & Clavier Sans Fil Logitech MK270 Pro',
    barcode: '202634359005',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80',
    originalPrice: 2000,
    discountType: 'percentage', // 'percentage' | 'fixed'
    discountValue: 20,
    startDate: '2026-11-08T20:59',
    endDate: '2026-11-21T23:59',
    quantityLimit: 30,
    soldCount: 0,
    status: 'active', // 'active' | 'paused' | 'expired' | 'completed'
    createdAt: new Date().toISOString()
  }
];

export default function PromotionsView({ onNavigate }) {
  const { language, isRTL, t } = useLanguage();
  // 1. Liste des promotions
  const [promotions, setPromotions] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_promotions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('novamag_promotions', JSON.stringify(DEFAULT_PROMOTIONS));
      return DEFAULT_PROMOTIONS;
    } catch {
      return DEFAULT_PROMOTIONS;
    }
  });

  // 2. Produits disponibles en stock
  const [stockProducts, setStockProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_products');
      const raw = saved ? JSON.parse(saved) : MOCK_PRODUCTS;
      return sanitizeProductsWithRealNames(raw);
    } catch {
      return MOCK_PRODUCTS;
    }
  });

  // Synchronisation globale et inter-onglets
  useEffect(() => {
    const handleSync = () => {
      try {
        const savedPromos = localStorage.getItem('novamag_promotions');
        if (savedPromos) setPromotions(JSON.parse(savedPromos));
        const savedProducts = localStorage.getItem('novamag_products');
        if (savedProducts) setStockProducts(sanitizeProductsWithRealNames(JSON.parse(savedProducts)));
      } catch (e) {
        console.error('Erreur synchronisation promotions :', e);
      }
    };

    window.addEventListener('novamag_promotions_updated', handleSync);
    window.addEventListener('novamag_products_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('novamag_promotions_updated', handleSync);
      window.removeEventListener('novamag_products_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const savePromotionsToStorage = (newPromos) => {
    setPromotions(newPromos);
    try {
      localStorage.setItem('novamag_promotions', JSON.stringify(newPromos));
      window.dispatchEvent(new Event('novamag_promotions_updated'));
    } catch (e) {
      console.error('Erreur sauvegarde promotions :', e);
    }
  };

  // Toast & Confirm State
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoToEdit, setPromoToEdit] = useState(null);

  // Form Fields
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' | 'fixed'
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantityLimit, setQuantityLimit] = useState('');

  // Formater date actuelle pour input datetime-local
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // Ouvrir modal en création
  const handleOpenAddModal = () => {
    setPromoToEdit(null);
    setSelectedProduct(null);
    setProductSearch('');
    setIsSearchingProduct(false);
    setDiscountType('percentage');
    setDiscountValue('20');
    setStartDate(getCurrentDateTimeLocal());
    setEndDate('');
    setQuantityLimit('');
    setIsModalOpen(true);
  };

  // Ouvrir modal en édition
  const handleOpenEditModal = (promo) => {
    setPromoToEdit(promo);
    setSelectedProduct({
      id: promo.productId,
      name: promo.productName,
      barcode: promo.barcode,
      price: promo.originalPrice,
      image: promo.image
    });
    setProductSearch('');
    setIsSearchingProduct(false);
    setDiscountType(promo.discountType || 'percentage');
    setDiscountValue(String(promo.discountValue || ''));
    setStartDate(promo.startDate || getCurrentDateTimeLocal());
    setEndDate(promo.endDate || '');
    setQuantityLimit(promo.quantityLimit ? String(promo.quantityLimit) : '');
    setIsModalOpen(true);
  };

  // Basculer statut (Pause / Actif)
  const handleToggleStatus = (promoId) => {
    const updated = promotions.map((p) => {
      if (p.id === promoId) {
        const nextStatus = p.status === 'active' ? 'paused' : 'active';
        showToast(
          `Promotion ${nextStatus === 'active' ? 'activée' : 'mise en pause'}`,
          nextStatus === 'active' ? 'success' : 'warning'
        );
        return { ...p, status: nextStatus };
      }
      return p;
    });
    savePromotionsToStorage(updated);
  };

  // Supprimer une promotion
  const handleDeletePromo = (promo) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer la promotion ?',
      message: `Voulez-vous vraiment supprimer la remise sur "${promo.productName}" ?`,
      onConfirm: () => {
        const updated = promotions.filter((p) => p.id !== promo.id);
        savePromotionsToStorage(updated);
        showToast('Promotion supprimée', 'warning');
      }
    });
  };

  // Filtrage des produits pour la recherche de la modale
  const matchingStockProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase().trim();
    return stockProducts.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
    ).slice(0, 8);
  }, [productSearch, stockProducts]);

  // Sauvegarde de la promotion
  const handleSavePromo = (e) => {
    e?.preventDefault();

    if (!selectedProduct) {
      showToast('Veuillez sélectionner un article pour la promotion', 'warning');
      return;
    }

    const valNum = parseFloat(discountValue);
    if (isNaN(valNum) || valNum <= 0) {
      showToast('Veuillez renseigner une valeur de remise valide', 'warning');
      return;
    }

    if (discountType === 'percentage' && valNum > 100) {
      showToast('Le pourcentage de remise ne peut pas dépasser 100%', 'warning');
      return;
    }

    if (!startDate) {
      showToast('Veuillez renseigner la date de début', 'warning');
      return;
    }

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      showToast('La date de fin doit être postérieure à la date de début', 'warning');
      return;
    }

    const limitNum = quantityLimit.trim() ? parseInt(quantityLimit, 10) : null;

    if (promoToEdit) {
      // Modification
      const updated = promotions.map((p) => {
        if (p.id === promoToEdit.id) {
          return {
            ...p,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            barcode: selectedProduct.barcode,
            image: selectedProduct.image,
            originalPrice: Number(selectedProduct.price) || 0,
            discountType,
            discountValue: valNum,
            startDate,
            endDate: endDate || null,
            quantityLimit: limitNum,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      savePromotionsToStorage(updated);
      showToast(`Promotion pour "${selectedProduct.name}" mise à jour`, 'success');
    } else {
      // Création
      const newPromo = {
        id: `promo_${Date.now()}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        barcode: selectedProduct.barcode,
        image: selectedProduct.image,
        originalPrice: Number(selectedProduct.price) || 0,
        discountType,
        discountValue: valNum,
        startDate,
        endDate: endDate || null,
        quantityLimit: limitNum,
        soldCount: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      savePromotionsToStorage([...promotions, newPromo]);
      showToast(`Promotion créée avec succès pour "${selectedProduct.name}"`, 'success');
    }

    setIsModalOpen(false);
  };

  // Formatage des dates pour affichage dans le tableau
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto p-6 md:p-8 select-none">
      {/* Toast Notification */}
      <ModernToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* En-tête de la Page (Image 1 & 4) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            {language === 'ar' ? 'إدارة العروض الترويجية' : 'Gestion des Promotions'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar' ? 'قم بتهيئة الخصومات لفترات زمنية محددة' : 'Configurez des remises pour des périodes spécifiques'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'ar' ? 'إنشاء عرض ترويجي جديد +' : 'Créer une nouvelle promotion'}</span>
        </button>
      </div>

      {/* Tableau des Promotions (Image 1 & 4) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <th className="py-4 px-6">{language === 'ar' ? 'المنتج' : 'Produit'}</th>
                <th className="py-4 px-6 text-center">{language === 'ar' ? 'الخصم' : 'Remise'}</th>
                <th className="py-4 px-6 text-center">{language === 'ar' ? 'فترة الصلاحية' : 'Validité'}</th>
                <th className="py-4 px-6 text-center">{language === 'ar' ? 'حد الكمية' : 'Limite de quantité'}</th>
                <th className="py-4 px-6 text-center">{language === 'ar' ? 'الحالة' : 'Statut'}</th>
                <th className="py-4 px-6 text-right rtl:text-left">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-base font-semibold text-slate-400 dark:text-slate-500">
                      {language === 'ar' ? 'لا توجد عروض ترويجية حالياً' : 'Aucune promotion'}
                    </p>
                  </td>
                </tr>
              ) : (
                promotions.map((promo) => {
                  const isActive = promo.status === 'active';
                  const isPaused = promo.status === 'paused';
                  const isCompleted = promo.status === 'completed';
                  const isExpired =
                    promo.endDate && new Date(promo.endDate) < new Date();

                  const discountText =
                    promo.discountType === 'percentage'
                      ? `-%${promo.discountValue}`
                      : `-${promo.discountValue} DA`;

                  return (
                    <tr
                      key={promo.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* 1. Produit (Image + Nom + Code-barres) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                            <img
                                src={promo.image || getDefaultProductImage({ name: promo.productName, category: promo.category })}
                                alt={promo.productName}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = getDefaultProductImage({ name: promo.productName, category: promo.category });
                                }}
                              />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {promo.productName}
                            </div>
                            <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                              {promo.barcode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Remise (Rouge en gras) */}
                      <td className="py-4 px-6 text-center">
                        <span className="font-bold text-red-600 dark:text-red-500 font-mono text-base">
                          {discountText}
                        </span>
                      </td>

                      {/* 3. Validité (Date début + Date fin avec حتى/jusqu'au en rouge) */}
                      <td className="py-4 px-6 text-center">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {formatDateDisplay(promo.startDate)}
                        </div>
                        {promo.endDate ? (
                          <div className="text-xs font-semibold text-red-600 dark:text-red-400 mt-0.5">
                            {language === 'ar' ? 'إلى غاية : ' : "jusqu'au : "}{formatDateDisplay(promo.endDate)}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {language === 'ar' ? 'بدون حد زمني' : 'Sans limite'}
                          </div>
                        )}
                      </td>

                      {/* 4. Limite de quantité (0 vert / 30 gris) */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {promo.soldCount || 0}
                          </span>
                          <div className="w-10 h-px bg-slate-200 dark:bg-slate-700 my-0.5" />
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {promo.quantityLimit ? promo.quantityLimit : '∞'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Statut Badge */}
                      <td className="py-4 px-6 text-center">
                        {isExpired ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {language === 'ar' ? 'منتهي الصلاحية' : 'Expiré'}
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            {language === 'ar' ? 'مكتمل / نفد' : 'Épuisé'}
                          </span>
                        ) : isPaused ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            {language === 'ar' ? 'موقوف مؤقتاً' : 'En pause'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {language === 'ar' ? 'نشط الآن' : 'Actif'}
                          </span>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td className="py-4 px-6 text-right rtl:text-left">
                        <div className="inline-flex items-center justify-end gap-2">
                          {/* Toggle Pause / Play */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(promo.id)}
                            title={isActive ? (language === 'ar' ? 'إيقاف مؤقت' : 'Mettre en pause') : (language === 'ar' ? 'إعادة التنشيط' : 'Réactiver')}
                            className="p-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-850 dark:text-amber-400 transition-colors cursor-pointer"
                          >
                            {isActive ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current" />
                            )}
                          </button>

                          {/* Modifier */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(promo)}
                            title={language === 'ar' ? 'تعديل العرض' : 'Modifier la promotion'}
                            className="p-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-400 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Supprimer */}
                          <button
                            type="button"
                            onClick={() => handleDeletePromo(promo)}
                            title={language === 'ar' ? 'حذف العرض' : 'Supprimer la promotion'}
                            className="p-2 rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALE : "Créer une Promotion" / "Modifier la Promotion" (Image 2 & 3)     */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn select-none">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {promoToEdit ? (language === 'ar' ? 'تعديل العرض الترويجي' : 'Modifier la Promotion') : (language === 'ar' ? 'إنشاء عرض ترويجي جديد' : 'Créer une Promotion')}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 1. Sélection du produit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'اختر المنتج المراد تخفيض سعره' : 'Sélectionner un produit'} <span className="text-rose-500">*</span>
                </label>

                {selectedProduct ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                            src={selectedProduct.image || getDefaultProductImage(selectedProduct)}
                            alt=""
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getDefaultProductImage(selectedProduct);
                            }}
                          />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedProduct.name}
                        </div>
                        <div className="text-xs font-mono text-slate-400 dark:text-slate-500">
                          {selectedProduct.barcode} • {language === 'ar' ? 'السعر: ' : 'Prix : '}{' '}
                          {Number(selectedProduct.price || 0).toFixed(2)} DA
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        setIsSearchingProduct(true);
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 cursor-pointer"
                    >
                      {language === 'ar' ? 'تغيير' : 'Changer'}
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setIsSearchingProduct(true);
                      }}
                      onFocus={() => setIsSearchingProduct(true)}
                      placeholder={language === 'ar' ? 'بحث عن منتج بالاسم أو الباركود...' : 'Rechercher par nom ou code-barres'}
                      className="w-full pl-4 pr-10 rtl:pl-10 rtl:pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/10 font-medium"
                      autoFocus
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

                    {/* Liste des résultats de recherche */}
                    {isSearchingProduct && productSearch.trim().length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 max-h-56 overflow-y-auto space-y-1">
                        {matchingStockProducts.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400">
                            {language === 'ar' ? 'لم يتم العثور على أي منتج' : 'Aucun produit correspondant trouvé'}
                          </div>
                        ) : (
                          matchingStockProducts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedProduct(p);
                                setIsSearchingProduct(false);
                                setProductSearch('');
                              }}
                              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                            >
                              <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-white">
                                  {p.name}
                                </div>
                                <div className="text-xs text-slate-400 font-mono">
                                  {p.barcode} • {Number(p.price || 0).toFixed(2)} DA
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                {language === 'ar' ? 'اختيار' : 'Choisir'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Type de remise & Valeur de la remise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'نوع الخصم' : 'Type de remise'}
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-hidden focus:border-red-500 font-medium cursor-pointer"
                  >
                    <option value="percentage">{language === 'ar' ? 'نسبة مئوية (%)' : 'Pourcentage (%)'}</option>
                    <option value="fixed">{language === 'ar' ? 'مبلغ ثابت (دج)' : 'Montant fixe (DA)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'قيمة الخصم' : 'Valeur de la remise'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: 20' : 'Par exemple : 20'}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                  />
                </div>
              </div>

              {/* 3. Date de début & Date de fin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'تاريخ البدء' : 'Date de début'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-hidden focus:border-red-500 font-medium cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'تاريخ الانتهاء' : 'Date de fin'} <span className="text-slate-400 font-normal">{language === 'ar' ? '(اختياري)' : '(optionnel)'}</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="jj/mm/aaaa --:--"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white outline-hidden focus:border-red-500 font-medium cursor-pointer"
                  />
                </div>
              </div>

              {/* 4. Encadré Jaune/Ambre : Limite de quantité (Image 2 & 3) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-300">
                  <ShoppingCart className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>{language === 'ar' ? 'حد كمية المبيعات' : 'Limite de quantité'}</span>
                </div>
                <p className="text-xs text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                  {language === 'ar' ? 'إذا تركته فارغاً، فسيظل العرض سارياً طوال الفترة المحددة مهما كان عدد المبيعات.' : "Si vous le laissez vide, l'offre sera valable pendant toute la période spécifiée, quelles que soient les ventes."}
                </p>

                <div className="pt-1">
                  <input
                    type="number"
                    min="1"
                    value={quantityLimit}
                    onChange={(e) => setQuantityLimit(e.target.value)}
                    placeholder={language === 'ar' ? 'الكمية القصوى المسموح بها...' : 'Quantité autorisée...'}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-800 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>

              <button
                type="button"
                onClick={handleSavePromo}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium text-sm shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'ar' ? 'حفظ العرض' : 'Enregistrer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
