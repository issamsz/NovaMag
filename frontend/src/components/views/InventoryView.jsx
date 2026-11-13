import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  Barcode,
  Tag,
  CheckCheck,
  Check,
  X,
  Eye,
  Info,
  Calendar,
  Layers,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import ModernToast from '../common/ModernToast';
import { useLanguage } from '../../i18n/LanguageContext';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, sanitizeProductsWithRealNames } from '../../mock/posData';

export default function InventoryView({ onNavigate }) {
  const { language, isRTL, t } = useLanguage();
  // 1. Liste des inventaires enregistrés dans localStorage
  const [inventories, setInventories] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_inventories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Liste des produits du stock réels
  const [stockProducts, setStockProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_products');
      const raw = saved ? JSON.parse(saved) : MOCK_PRODUCTS;
      return sanitizeProductsWithRealNames(raw);
    } catch {
      return MOCK_PRODUCTS;
    }
  });

  // Synchronisation dynamique
  useEffect(() => {
    const handleSync = () => {
      try {
        const savedInv = localStorage.getItem('novamag_inventories');
        if (savedInv) setInventories(JSON.parse(savedInv));
        const savedProd = localStorage.getItem('novamag_products');
        if (savedProd) setStockProducts(sanitizeProductsWithRealNames(JSON.parse(savedProd)));
      } catch (e) {
        console.error('Erreur synchronisation inventaire :', e);
      }
    };

    window.addEventListener('novamag_inventories_updated', handleSync);
    window.addEventListener('novamag_products_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('novamag_inventories_updated', handleSync);
      window.removeEventListener('novamag_products_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveInventories = (newList) => {
    setInventories(newList);
    try {
      localStorage.setItem('novamag_inventories', JSON.stringify(newList));
      window.dispatchEvent(new Event('novamag_inventories_updated'));
    } catch (e) {
      console.error('Erreur sauvegarde inventaires :', e);
    }
  };

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Modale Détails (Image 5)
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    inventory: null
  });

  // ÉTATS DU PROCESSUS D'INVENTAIRE :
  // 'idle' | 'start_modal' | 'counting'
  const [inventoryState, setInventoryState] = useState('idle');

  // Paramètres de configuration du nouvel inventaire (Image 2 & 6)
  const [scopeType, setScopeType] = useState('all'); // 'all' | 'category' | 'family'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('');
  const [limitWithStockOnly, setLimitWithStockOnly] = useState(false);
  const [note, setNote] = useState('');

  // Catégories et Familles uniques dynamiques
  const uniqueCategories = useMemo(() => {
    const map = new Map();
    MOCK_CATEGORIES.filter((c) => c.id !== 'all').forEach((c) => {
      map.set(c.id, c.name);
    });
    stockProducts.forEach((p) => {
      if (p.category && !map.has(p.category)) {
        map.set(p.category, p.category);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [stockProducts]);

  const uniqueFamilies = useMemo(() => {
    const set = new Set();
    stockProducts.forEach((p) => {
      if (p.family && p.family.trim()) {
        set.add(p.family.trim());
      }
    });
    if (set.size === 0) {
      set.add('Ordinateurs & Portables');
      set.add('Accessoires & Périphériques');
      set.add('Moniteurs');
      set.add('Alimentation');
    }
    return Array.from(set);
  }, [stockProducts]);

  // Feuilles de comptage (Image 3)
  const [sheetItems, setSheetItems] = useState([]);
  const [sheetSearch, setSheetSearch] = useState('');
  const [barcodeScanInput, setBarcodeScanInput] = useState('');
  const [showPricing, setShowPricing] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('all'); // 'all' | 'unconfirmed' | 'discrepancies' | 'expired'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'guided'

  const barcodeInputRef = useRef(null);

  // 1. Ouvrir la modale d'initialisation (Image 2)
  const handleOpenStartModal = () => {
    setScopeType('all');
    setSelectedCategory(uniqueCategories[0]?.id || '');
    setSelectedFamily(uniqueFamilies[0] || '');
    setLimitWithStockOnly(false);
    setNote('');
    setInventoryState('start_modal');
  };

  // 2. Lancer la feuille d'inventaire (Image 3)
  const handleStartInventory = () => {
    // Filtrer les articles selon la portée choisie (Tout le stock / Catégorie / Famille)
    let filtered = [...stockProducts];
    if (scopeType === 'category') {
      filtered = filtered.filter(
        (p) => p.category === selectedCategory || p.categoryName === selectedCategory
      );
    } else if (scopeType === 'family') {
      filtered = filtered.filter(
        (p) => (p.family || '').toLowerCase().trim() === selectedFamily.toLowerCase().trim()
      );
    }

    if (limitWithStockOnly) {
      filtered = filtered.filter((p) => (Number(p.stock) || 0) > 0);
    }

    if (filtered.length === 0) {
      showToast('Aucun article trouvé pour cette portée', 'warning');
      return;
    }

    const items = filtered.map((p) => {
      const theo = typeof p.stock === 'number' ? p.stock : 0;
      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode || '',
        theoreticalStock: theo,
        countedStock: theo, // initialisé par défaut au théorique
        isConfirmed: false,
        buyPrice: Number(p.purchasePrice || p.buyPrice || p.costPrice) || 0,
        sellPrice: Number(p.price || p.sellingPrice) || 0,
        supplier: p.supplier || 'Fournisseur Général',
        category: p.category || 'Général',
        expiryDate: p.expiryDate || null
      };
    });

    setSheetItems(items);
    setSheetSearch('');
    setBarcodeScanInput('');
    setActiveFilterTab('all');
    setViewMode('list');
    setInventoryState('counting');
  };

  // 3. Scanner un code-barres dans la feuille
  const handleBarcodeScan = (e) => {
    e?.preventDefault();
    const code = barcodeScanInput.trim();
    if (!code) return;

    const idx = sheetItems.findIndex((it) => it.barcode === code);
    if (idx >= 0) {
      const updated = [...sheetItems];
      // Si déjà confirmé, on incrémente de 1 le comptage physique
      updated[idx].countedStock = (Number(updated[idx].countedStock) || 0) + 1;
      updated[idx].isConfirmed = true;
      setSheetItems(updated);
      showToast(`+1 compté pour "${updated[idx].name}" (${updated[idx].countedStock})`, 'success');
      setBarcodeScanInput('');
    } else {
      showToast(`Code-barres non trouvé dans cette feuille : ${code}`, 'error');
    }
  };

  // 4. Modifier manuellement la quantité comptée
  const handleUpdateCounted = (itemId, val) => {
    const num = val === '' ? 0 : parseFloat(val);
    setSheetItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              countedStock: isNaN(num) ? 0 : num,
              isConfirmed: true
            }
          : it
      )
    );
  };

  // 5. Basculer la confirmation d'une ligne
  const handleToggleConfirm = (itemId) => {
    setSheetItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, isConfirmed: !it.isConfirmed } : it
      )
    );
  };

  // 6. Action rapide : Valider le reste au théorique
  const handleValidateRestToTheoretical = () => {
    setSheetItems((prev) =>
      prev.map((it) => ({
        ...it,
        countedStock: it.isConfirmed ? it.countedStock : it.theoreticalStock,
        isConfirmed: true
      }))
    );
    showToast('Tous les articles restants ont été validés au stock théorique', 'info');
  };

  // 7. Confirmer et ajuster définitivement le stock (Image 3 -> 4)
  const handleConfirmAndAdjust = () => {
    const confirmedCount = sheetItems.filter((it) => it.isConfirmed).length;
    const discrepancies = sheetItems.filter(
      (it) => it.countedStock !== it.theoreticalStock
    );

    const refNumber = `INV-2026-${String(inventories.length + 1).padStart(4, '0')}`;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateFormatted = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // 1. Mettre à jour les stocks réels dans `novamag_products`
    try {
      const savedProd = localStorage.getItem('novamag_products');
      const currentProducts = savedProd ? JSON.parse(savedProd) : stockProducts;

      const updatedProducts = currentProducts.map((p) => {
        const sheetItem = sheetItems.find((it) => it.id === p.id);
        if (sheetItem && sheetItem.isConfirmed) {
          return {
            ...p,
            stock: sheetItem.countedStock
          };
        }
        return p;
      });

      localStorage.setItem('novamag_products', JSON.stringify(updatedProducts));
      setStockProducts(updatedProducts);
      window.dispatchEvent(new Event('novamag_products_updated'));
    } catch (e) {
      console.error('Erreur mise à jour stock réel :', e);
    }

    // 2. Enregistrer la fiche d'inventaire
    const newInventory = {
      id: `inv_${Date.now()}`,
      ref: refNumber,
      scopeLabel:
        scopeType === 'all'
          ? 'Tout le stock'
          : scopeType === 'category'
          ? `Catégorie : ${uniqueCategories.find((c) => c.id === selectedCategory)?.name || selectedCategory}`
          : `Famille : ${selectedFamily}`,
      articlesCount: sheetItems.length,
      discrepanciesCount: discrepancies.length,
      totalDifferenceValue: discrepancies.reduce(
        (sum, it) => sum + (it.countedStock - it.theoreticalStock) * it.sellPrice,
        0
      ),
      dateStr: dateFormatted,
      author: 'admin',
      note: note.trim(),
      items: sheetItems,
      createdAt: now.toISOString()
    };

    saveInventories([newInventory, ...inventories]);
    setInventoryState('idle');
    showToast(`✓ Inventaire ${refNumber} validé avec succès (${discrepancies.length} écarts ajustés)`, 'success');

    // Ouvrir immédiatement la modale des détails (Image 5)
    setDetailsModal({
      isOpen: true,
      inventory: newInventory
    });
  };

  // Filtrage des articles de la feuille selon onglet et recherche
  const filteredSheetItems = useMemo(() => {
    return sheetItems.filter((it) => {
      // Recherche
      if (sheetSearch.trim()) {
        const q = sheetSearch.toLowerCase().trim();
        const match =
          it.name.toLowerCase().includes(q) ||
          it.barcode.includes(q) ||
          (it.supplier && it.supplier.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Onglet
      if (activeFilterTab === 'unconfirmed') return !it.isConfirmed;
      if (activeFilterTab === 'discrepancies') return it.countedStock !== it.theoreticalStock;
      if (activeFilterTab === 'expired') {
        if (!it.expiryDate) return false;
        return new Date(it.expiryDate) < new Date();
      }
      return true;
    });
  }, [sheetItems, sheetSearch, activeFilterTab]);

  // Statistiques de la feuille en cours
  const confirmedCount = sheetItems.filter((it) => it.isConfirmed).length;
  const remainingCount = sheetItems.length - confirmedCount;
  const discrepanciesCount = sheetItems.filter(
    (it) => it.countedStock !== it.theoreticalStock
  ).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto p-6 md:p-8 select-none">
      {/* Toast */}
      <ModernToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* ========================================================================= */}
      {/* PAGE PRINCIPALE : "Inventaire" (Image 1 & 4)                              */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-xs space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {language === 'ar' ? 'الجرد ومراقبة المخزون' : 'Inventaire'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-4xl leading-relaxed">
            {language === 'ar' ? 'قم بحساب المخزون الفعلي ومطابقته مع المخزون النظري في النظام. يتم تسجيل كل فارق كحركة تسوية في السجل.' : "Comptez le stock physique et réconciliez-le avec le stock théorique. Chaque écart enregistre un mouvement d'ajustement dans le journal."}
          </p>
        </div>

        {/* Boutons d'Action (Image 1 & 4) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenStartModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 stroke-[2.2]" />
            <span>{language === 'ar' ? 'جرد جديد' : 'Nouvel inventaire'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const saved = localStorage.getItem('novamag_inventories');
              if (saved) setInventories(JSON.parse(saved));
              showToast(language === 'ar' ? 'تم تحديث البيانات' : 'Données actualisées', 'info');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>{language === 'ar' ? 'تحديث' : 'Actualiser'}</span>
          </button>
        </div>

        {/* Liste des Inventaires ou État Vide (Image 1 & 4) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          {inventories.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-base font-semibold text-slate-400 dark:text-slate-500">
                {language === 'ar' ? 'لا توجد عمليات جرد سابقة' : 'Aucun inventaire'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inventories.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-all shadow-2xs"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {inv.ref}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                      <span>{inv.scopeLabel}</span>
                      <span>•</span>
                      <span>{inv.articlesCount} {language === 'ar' ? 'منتجات' : 'Articles'}</span>
                      <span>•</span>
                      <span className={inv.discrepanciesCount > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
                        {inv.discrepanciesCount} {language === 'ar' ? 'فوارق' : 'Écart'}
                      </span>
                      <span>•</span>
                      <span>{inv.dateStr}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {inv.author || 'admin'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailsModal({ isOpen: true, inventory: inv })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{language === 'ar' ? 'عرض' : 'Voir'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALE STEP 1 : "Nouvel inventaire" (Image 2)                             */}
      {/* ========================================================================= */}
      {inventoryState === 'start_modal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? 'جرد جديد' : 'Nouvel inventaire'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInventoryState('idle')}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Portée de l'inventaire */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'نطاق الجرد' : "Portée de l'inventaire"}
                </label>
                <select
                  value={scopeType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setScopeType(newType);
                    if (newType === 'category' && !selectedCategory && uniqueCategories.length > 0) {
                      setSelectedCategory(uniqueCategories[0].id);
                    }
                    if (newType === 'family' && !selectedFamily && uniqueFamilies.length > 0) {
                      setSelectedFamily(uniqueFamilies[0]);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="all">{language === 'ar' ? 'كل المخزون' : 'Tout le stock'}</option>
                  <option value="category">{language === 'ar' ? 'فئة معينة' : 'Catégorie'}</option>
                  <option value="family">{language === 'ar' ? 'عائلة معينة' : 'Famille'}</option>
                </select>

                {/* Sélecteur secondaire si "Catégorie" est sélectionné */}
                {scopeType === 'category' && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white outline-hidden focus:border-blue-500 cursor-pointer animate-fadeIn"
                  >
                    {uniqueCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Sélecteur secondaire si "Famille" est sélectionné */}
                {scopeType === 'family' && (
                  <select
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white outline-hidden focus:border-blue-500 cursor-pointer animate-fadeIn"
                  >
                    {uniqueFamilies.map((fam) => (
                      <option key={fam} value={fam}>
                        {fam}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Checkbox Card : Limiter aux articles ayant du stock */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="limitStockCheck"
                  checked={limitWithStockOnly}
                  onChange={(e) => setLimitWithStockOnly(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="limitStockCheck" className="cursor-pointer">
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    {language === 'ar' ? 'الاقتصار على المنتجات المتوفرة في المخزن فقط' : 'Limiter aux articles ayant du stock'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {language === 'ar' ? 'افتراضياً يتم تحميل كافة المنتجات حتى التي رصيدها صفر لتصحيحها إذا عثرت على بضاعة في الرفوف.' : "Par défaut, tous les produits de la portée sont chargés — y compris ceux à zéro, car c'est précisément ce que le comptage corrige lorsque vous trouvez de la marchandise en rayon."}
                  </div>
                </label>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'ملاحظة' : 'Note'}
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={language === 'ar' ? 'ملاحظة اختيارية حول جلسة الجرد...' : "Note optionnelle sur la session d'inventaire..."}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-hidden focus:border-blue-500 resize-none font-medium"
                />
              </div>

              {/* Bouton Démarrer l'inventaire */}
              <button
                type="button"
                onClick={handleStartInventory}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{language === 'ar' ? 'بدء الجرد' : "Démarrer l'inventaire"}</span>
              </button>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                {language === 'ar' ? 'سيتم تحميل جميع منتجات النطاق المختار. قم بعدّها تباعاً أو امسح باركود المنتج للانتقال إليه مباشرة.' : "Tous les produits de la portée seront chargés produit par produit. Comptez-les à la suite ou scannez le code-barres d'un produit pour y accéder."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEUILLE DE COMPTAGE PLEIN ÉCRAN : "Nouvel inventaire" (Image 3)           */}
      {/* ========================================================================= */}
      {inventoryState === 'counting' && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-[#070C18] animate-fadeIn select-none">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                <ClipboardList className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {language === 'ar' ? 'ورقة الجرد النشطة' : 'Nouvel inventaire'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {scopeType === 'all'
                    ? (language === 'ar' ? 'كل المخزون' : 'Tout le stock')
                    : scopeType === 'category'
                    ? `${language === 'ar' ? 'الفئة :' : 'Catégorie :'} ${uniqueCategories.find((c) => c.id === selectedCategory)?.name || selectedCategory}`
                    : `${language === 'ar' ? 'العائلة :' : 'Famille :'} ${selectedFamily}`}{' '}
                  • {sheetItems.length} {language === 'ar' ? 'منتجات' : `Produit${sheetItems.length > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: language === 'ar' ? 'الخروج من ورقة الجرد؟' : 'Quitter la feuille d’inventaire ?',
                  message: language === 'ar' ? 'سيتم إلغاء الحسابات غير المؤكدة.' : 'Les comptages non confirmés seront annulés.',
                  onConfirm: () => setInventoryState('idle')
                });
              }}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-Header Toolbar (Image 3) */}
          <div className="px-6 py-3 bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Recherche & Scanner */}
            <div className="flex items-center gap-3 flex-1 min-w-[320px] max-w-2xl">
              {/* Recherche texte */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={sheetSearch}
                  onChange={(e) => setSheetSearch(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث في ورقة الجرد...' : 'Rechercher dans la feuille...'}
                  className="w-full pl-3.5 pr-9 rtl:pl-9 rtl:pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-hidden focus:border-blue-500 font-medium"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Scanner code-barres direct */}
              <form onSubmit={handleBarcodeScan} className="relative flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeScanInput}
                  onChange={(e) => setBarcodeScanInput(e.target.value)}
                  placeholder={language === 'ar' ? 'مسح الباركود...' : 'Scannez le code-barres...'}
                  className="w-full pl-3.5 pr-9 rtl:pl-9 rtl:pr-3.5 py-2 bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white placeholder-slate-400 outline-hidden focus:border-blue-500"
                />
                <Barcode className="w-4 h-4 text-blue-600 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </form>
            </div>

            {/* Boutons d'Action rapide */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPricing(!showPricing)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  showPricing
                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400'
                    : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'الأسعار والمورد' : 'Prix & fournisseur'}</span>
              </button>

              <button
                type="button"
                onClick={handleValidateRestToTheoretical}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'ar' ? 'تأكيد المتبقي كالرصيد النظري' : 'Valider le reste au théorique'}</span>
              </button>
            </div>
          </div>

          {/* Filtres & Badges de Comptage (Image 3) */}
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Onglets Filtres */}
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: language === 'ar' ? 'الكل' : 'Tous' },
                { id: 'unconfirmed', label: language === 'ar' ? 'غير مؤكدة' : 'Non confirmés' },
                { id: 'discrepancies', label: language === 'ar' ? 'فوارق' : 'Écarts' },
                { id: 'expired', label: language === 'ar' ? 'منتهية الصلاحية' : 'Périmés', isDanger: true }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    activeFilterTab === tab.id
                      ? tab.isDanger
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50'
                        : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200 dark:border-slate-700'
                      : tab.isDanger
                      ? 'text-rose-500 hover:bg-rose-50/50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Badges de Statut */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/60">
                {language === 'ar' ? `المؤكدة: ${confirmedCount}` : `Confirmés: ${confirmedCount}`}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-100 dark:border-amber-900/60">
                {language === 'ar' ? `المتبقية: ${remainingCount}` : `Restants: ${remainingCount}`}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                {discrepanciesCount} {language === 'ar' ? 'فوارق' : 'Écart'}
              </span>
            </div>
          </div>

          {/* Corps de la Feuille : Liste des cartes d'articles (Image 3) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {filteredSheetItems.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                Aucun article ne correspond à ce filtre
              </div>
            ) : (
              filteredSheetItems.map((item) => {
                const diff = (Number(item.countedStock) || 0) - item.theoreticalStock;
                const isDiffZero = diff === 0;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 bg-white dark:bg-slate-800/90 rounded-2xl border transition-all ${
                      item.isConfirmed
                        ? 'border-emerald-200 dark:border-emerald-800/60 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Infos Produit */}
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                        <span>{item.barcode}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Théorique: {item.theoreticalStock}
                        </span>
                      </div>

                      {/* Badges Prix & Fournisseur (Image 3) */}
                      {showPricing && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            Achat <span className="font-bold">{item.buyPrice.toFixed(2)}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Vente <span className="font-bold">{item.sellPrice.toFixed(2)}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            Fournisseur <span className="font-bold">{item.supplier}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contrôles de Saisie : [ Compteur ] + [ Écart ] + [ Bouton Cercle/Check ] */}
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Saisie quantité comptée */}
                      <input
                        type="number"
                        min="0"
                        value={item.countedStock}
                        onChange={(e) => handleUpdateCounted(item.id, e.target.value)}
                        className="w-24 px-3 py-2 text-center text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                      />

                      {/* Indicateur d'écart */}
                      <div className="w-12 text-center font-bold text-sm">
                        {isDiffZero ? (
                          <span className="text-slate-400">0</span>
                        ) : diff > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                            +{diff}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-mono">
                            {diff}
                          </span>
                        )}
                      </div>

                      {/* Bouton Cercle de confirmation (Image 3) */}
                      <button
                        type="button"
                        onClick={() => handleToggleConfirm(item.id)}
                        title={item.isConfirmed ? 'Confirmé' : 'Non confirmé'}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          item.isConfirmed
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500'
                        }`}
                      >
                        {item.isConfirmed && <Check className="w-5 h-5 stroke-[2.5]" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Action Bar (Image 3) */}
          <div className="flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Confirmés {confirmedCount}/{sheetItems.length} • Restants: {remainingCount}
            </div>

            <button
              type="button"
              onClick={handleConfirmAndAdjust}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Confirmer et ajuster</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE : "Détails de l'inventaire" (Image 5)                              */}
      {/* ========================================================================= */}
      {detailsModal.isOpen && detailsModal.inventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-6">
            {/* Info Icon in Circle (Image 5) */}
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
              <Info className="w-8 h-8 stroke-[2.2]" />
            </div>

            {/* Title & Subtitle */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? `تفاصيل الجرد • ${detailsModal.inventory.ref}` : `Détails de l'inventaire • ${detailsModal.inventory.ref}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5">
                {detailsModal.inventory.scopeLabel}
              </p>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1">
                {detailsModal.inventory.dateStr}
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-white mt-1">
                {language === 'ar' ? 'المنتجات:' : 'Articles:'} {detailsModal.inventory.articlesCount} • {language === 'ar' ? 'الفوارق:' : 'Écart:'}{' '}
                {detailsModal.inventory.discrepanciesCount}
              </p>
            </div>

            {/* Message Écart (Image 5) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {detailsModal.inventory.discrepanciesCount === 0
                ? (language === 'ar' ? 'لا توجد أي فوارق — كامل المخزون الفعلي يطابق المخزون النظري تماماً.' : 'Aucun écart — tout le compté correspond au théorique.')
                : (language === 'ar' ? `تم تسجيل ${detailsModal.inventory.discrepanciesCount} منتج به فوارق في المخزون وتمت تسويتها آلياً في سجل الحركات.` : `${detailsModal.inventory.discrepanciesCount} article(s) présentaient des écarts de stock et ont été ajustés dans le journal.`)}
            </div>

            {/* Actions Buttons (Image 5) */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDetailsModal({ isOpen: false, inventory: null })}
                className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-all cursor-pointer"
              >
                {language === 'ar' ? 'إغلاق' : 'Annuler'}
              </button>

              <button
                type="button"
                onClick={() => setDetailsModal({ isOpen: false, inventory: null })}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {language === 'ar' ? 'حسناً' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
