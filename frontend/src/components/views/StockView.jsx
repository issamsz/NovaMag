import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Columns3,
  Star,
  Trash2,
  TrendingUp,
  Barcode,
  Layers,
  FileText,
  Printer,
  X,
  Check,
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  RotateCcw,
  Landmark,
  Wallet,
  ShoppingCart,
  Calendar,
  Hourglass,
  Percent,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit3
} from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, sanitizeProductsWithRealNames } from '../../mock/posData';
import AddProductModal from '../pos/AddProductModal';
import ConfirmDialog from '../common/ConfirmDialog';
import ModernToast from '../common/ModernToast';
import { printBarcodeLabelDirect } from '../../services/labelPrinter';
import { printProductPriceListA4 } from '../../services/thermalPrinter';
import { useLanguage } from '../../i18n/LanguageContext';
import { getDefaultProductImage } from '../../services/productImageService';
import { createProduct, updateProduct, deleteProduct as apiDeleteProduct } from '../../services/api';

export default function StockView() {
  const { t, language } = useLanguage();
  // ── 1. État des Produits ──
  const [productsList, setProductsList] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_products');
      const raw = saved ? JSON.parse(saved) : MOCK_PRODUCTS;
      const sanitized = sanitizeProductsWithRealNames(raw);
      if (saved && JSON.stringify(raw) !== JSON.stringify(sanitized)) {
        try {
          localStorage.setItem('novamag_products', JSON.stringify(sanitized));
          setTimeout(() => window.dispatchEvent(new Event('novamag_products_updated')), 50);
        } catch (e) {}
      }
      return sanitized;
    } catch {
      return MOCK_PRODUCTS;
    }
  });

  const saveProducts = (newProducts) => {
    setProductsList(newProducts);
    try {
      localStorage.setItem('novamag_products', JSON.stringify(newProducts));
      window.dispatchEvent(new Event('novamag_products_updated'));
    } catch (e) {
      console.error('Failed to save products', e);
    }
  };

  // ── 2. Paramètres système ──
  const [systemSettings, setSystemSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleSettingsSync = () => {
      try {
        const saved = localStorage.getItem('novamag_system_settings');
        if (saved) setSystemSettings(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('novamag_settings_updated', handleSettingsSync);
    window.addEventListener('storage', handleSettingsSync);
    return () => {
      window.removeEventListener('novamag_settings_updated', handleSettingsSync);
      window.removeEventListener('storage', handleSettingsSync);
    };
  }, []);

  // ── 3. Fournisseurs & Historique des ventes pour les analytics (Dynamique & Synchronisé) ──
  const [suppliersList, setSuppliersList] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_suppliers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [salesHistory, setSalesHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_sales_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Synchronisation dynamique en temps réel avec les ventes, produits et fournisseurs
  useEffect(() => {
    const handleSalesSync = () => {
      try {
        const saved = localStorage.getItem('novamag_sales_history');
        if (saved) setSalesHistory(JSON.parse(saved));
      } catch (e) {}
    };

    const handleProductsSync = () => {
      try {
        const saved = localStorage.getItem('novamag_products');
        if (saved) {
          const sanitized = sanitizeProductsWithRealNames(JSON.parse(saved));
          setProductsList(sanitized);
        }
      } catch (e) {}
    };

    const handleSuppliersSync = () => {
      try {
        const saved = localStorage.getItem('novamag_suppliers');
        if (saved) setSuppliersList(JSON.parse(saved));
      } catch (e) {}
    };

    window.addEventListener('novamag_sales_updated', handleSalesSync);
    window.addEventListener('novamag_products_updated', handleProductsSync);
    window.addEventListener('novamag_suppliers_updated', handleSuppliersSync);
    window.addEventListener('storage', handleSalesSync);

    return () => {
      window.removeEventListener('novamag_sales_updated', handleSalesSync);
      window.removeEventListener('novamag_products_updated', handleProductsSync);
      window.removeEventListener('novamag_suppliers_updated', handleSuppliersSync);
      window.removeEventListener('storage', handleSalesSync);
    };
  }, []);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // ── 4. Modales ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isPriceListOpen, setIsPriceListOpen] = useState(false);
  const [statsProduct, setStatsProduct] = useState(null);
  const [batchesProduct, setBatchesProduct] = useState(null);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    product: null
  });

  // ── 5. Filtres Avancés & Recherche (Conforme Photo Modèle) ──
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true); // Affiché par défaut comme sur la photo
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);

  const columnsRef = useRef(null);

  // Visibilité des colonnes (Photo 1)
  const [visibleColumns, setVisibleColumns] = useState({
    barcode: true,
    product: true,
    stock: true,
    batches: true,
    price: false,
    actions: true
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fermeture du dropdown des colonnes au clic extérieur
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target)) {
        setIsColumnsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getCategoryName = (catId) => {
    const cat = MOCK_CATEGORIES.find((c) => c.id === catId);
    return cat ? cat.name : (catId || 'Général');
  };

  // Liste des Familles disponibles extraites des produits
  const availableFamilies = useMemo(() => {
    const set = new Set();
    productsList.forEach((p) => {
      if (p.family) set.add(p.family);
      if (p.subCategory) set.add(p.subCategory);
    });
    if (set.size === 0) {
      set.add('Famille1');
    }
    return Array.from(set);
  }, [productsList]);

  // Liste des Fournisseurs disponibles
  const availableSuppliers = useMemo(() => {
    const set = new Set();
    suppliersList.forEach((s) => {
      if (s.name) set.add(s.name);
    });
    productsList.forEach((p) => {
      if (p.supplier) set.add(p.supplier);
      (p.batches || []).forEach((b) => {
        if (b.supplier) set.add(b.supplier);
      });
    });
    return Array.from(set);
  }, [suppliersList, productsList]);

  // Toggle Vedette (★)
  const handleToggleFavorite = (product, e) => {
    if (e) e.stopPropagation();
    const updated = productsList.map((p) => {
      if (p.id === product.id) {
        return { ...p, isFavorite: !p.isFavorite };
      }
      return p;
    });

    const isNowFavorite = !product.isFavorite;
    saveProducts(updated);

    if (isNowFavorite) {
      showToast(`★ "${product.name}" ajouté aux produits en vedette`, 'success');
    } else {
      showToast(`"${product.name}" retiré des produits en vedette`, 'info');
    }
  };

  // Sauvegarde Produit
  const handleSaveProduct = async (savedProd) => {
    let updated;
    const exists = productsList.some((p) => p.id === savedProd.id);
    if (exists) {
      updated = productsList.map((p) => (p.id === savedProd.id ? savedProd : p));
      showToast(`✓ Produit "${savedProd.name}" modifié avec succès`, 'success');
      try {
        const payload = {
          barcode: savedProd.barcode || null,
          name: savedProd.name,
          price: Number(savedProd.price) || 0,
          prix_achat: Number(savedProd.purchasePrice ?? savedProd.buyPrice ?? savedProd.prix_achat ?? 0),
          stock_quantity: Number(savedProd.stock ?? 0),
          seuil_alerte: Number(savedProd.alertStock ?? 5),
          is_weighted: savedProd.isWeighted ? 1 : 0
        };
        await updateProduct(savedProd.id, payload);
      } catch (e) {}
    } else {
      updated = [savedProd, ...productsList];
      showToast(`✓ Nouveau produit "${savedProd.name}" ajouté`, 'success');
      try {
        const payload = {
          barcode: savedProd.barcode || null,
          name: savedProd.name,
          price: Number(savedProd.price) || 0,
          prix_achat: Number(savedProd.purchasePrice ?? savedProd.buyPrice ?? savedProd.prix_achat ?? 0),
          stock_quantity: Number(savedProd.stock ?? 0),
          seuil_alerte: Number(savedProd.alertStock ?? 5),
          is_weighted: savedProd.isWeighted ? 1 : 0,
          category_id: savedProd.category_id || (savedProd.category && !isNaN(savedProd.category) ? Number(savedProd.category) : 3)
        };
        const res = await createProduct(payload);
        if (res && res.success && res.data) {
          savedProd.id = res.data.id;
        }
      } catch (e) {}
    }
    saveProducts(updated);
    setProductToEdit(null);
    setIsAddModalOpen(false);
  };

  // Suppression Produit
  const handleDeleteProduct = () => {
    if (!confirmDelete.product) return;
    const prod = confirmDelete.product;
    const updated = productsList.filter((p) => p.id !== prod.id);
    saveProducts(updated);
    setConfirmDelete({ isOpen: false, product: null });
    showToast(`Produit "${prod.name}" supprimé`, 'info');
  };

  // ── 6. Filtrage & Tri Dynamique des Produits ──
  const filteredProducts = useMemo(() => {
    let result = productsList.filter((prod) => {
      // 1. Recherche texte (Nom, Code-barres, Catégorie, Famille)
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        prod.name?.toLowerCase().includes(q) ||
        prod.barcode?.toLowerCase().includes(q) ||
        getCategoryName(prod.category).toLowerCase().includes(q) ||
        (prod.family && prod.family.toLowerCase().includes(q));

      // 2. Filtre Catégorie
      const matchCat =
        selectedCategory === 'all' ||
        prod.category === selectedCategory ||
        getCategoryName(prod.category) === selectedCategory;

      // 3. Filtre Famille
      const matchFamily =
        selectedFamily === 'all' ||
        prod.family === selectedFamily ||
        prod.subCategory === selectedFamily;

      // 4. Filtre Fournisseur
      const matchSupplier =
        selectedSupplier === 'all' ||
        prod.supplier === selectedSupplier ||
        (prod.batches || []).some((b) => b.supplier === selectedSupplier);

      // 5. Filtre Statut du Stock
      let matchStock = true;
      const stock = Number(prod.stock || 0);
      const alertStock = Number(prod.alertStock || 5);
      if (stockStatusFilter === 'in-stock') matchStock = stock > 0;
      else if (stockStatusFilter === 'low-stock') matchStock = stock > 0 && stock <= alertStock;
      else if (stockStatusFilter === 'out-of-stock') matchStock = stock === 0;

      // 6. En vedette
      const matchFav = !favoritesOnly || Boolean(prod.isFavorite);

      return matchSearch && matchCat && matchFamily && matchSupplier && matchStock && matchFav;
    });

    // 7. Tri (Tri sélectionné)
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return (b.id || 0) - (a.id || 0);
      }
      if (sortBy === 'oldest') {
        return (a.id || 0) - (b.id || 0);
      }
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'price-asc') {
        return Number(a.price || 0) - Number(b.price || 0);
      }
      if (sortBy === 'price-desc') {
        return Number(b.price || 0) - Number(a.price || 0);
      }
      if (sortBy === 'stock-asc') {
        return Number(a.stock || 0) - Number(b.stock || 0);
      }
      if (sortBy === 'stock-desc') {
        return Number(b.stock || 0) - Number(a.stock || 0);
      }
      return 0;
    });

    return result;
  }, [
    productsList,
    searchQuery,
    selectedCategory,
    selectedFamily,
    selectedSupplier,
    stockStatusFilter,
    favoritesOnly,
    sortBy
  ]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedFamily, selectedSupplier, stockStatusFilter, favoritesOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedFamily !== 'all' ? 1 : 0) +
    (selectedSupplier !== 'all' ? 1 : 0) +
    (stockStatusFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'recent' ? 1 : 0) +
    (favoritesOnly ? 1 : 0);

  // ── 7. Options et Impression de la Liste des Prix (Photo 2 & Photo 5) ──
  const [priceListUseFilters, setPriceListUseFilters] = useState(true);
  const [priceListInStockOnly, setPriceListInStockOnly] = useState(false);
  const [priceListHideWithoutPrice, setPriceListHideWithoutPrice] = useState(true);
  const [priceListShowBarcode, setPriceListShowBarcode] = useState(false);
  const [priceListGroupByCategory, setPriceListGroupByCategory] = useState(false);
  const [priceListColumns, setPriceListColumns] = useState(2);

  const handlePrintPriceList = () => {
    const baseList = priceListUseFilters ? filteredProducts : productsList;
    const perimeter = priceListUseFilters
      ? (selectedCategory !== 'all' ? `Rayon: ${getCategoryName(selectedCategory)}` : 'Tous les produits filtrés')
      : 'Tous les produits';

    printProductPriceListA4(
      {
        onlyInStock: priceListInStockOnly,
        hideWithoutPrice: priceListHideWithoutPrice,
        showBarcode: priceListShowBarcode,
        groupByCategory: priceListGroupByCategory,
        columnsCount: priceListColumns,
        perimeter
      },
      baseList,
      systemSettings || {}
    );
  };

  // ── 8. Statistiques / Analytics du Produit (Photo 3) ──
  const productStats = useMemo(() => {
    if (!statsProduct) return null;

    let totalQtySold = 0;
    let totalRevenue = 0;
    const saleDates = new Set();

    (salesHistory || []).forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const match =
          (item.productId && item.productId === statsProduct.id) ||
          (item.id && item.id === statsProduct.id) ||
          (item.barcode && statsProduct.barcode && item.barcode === statsProduct.barcode) ||
          (item.name && item.name.toLowerCase() === statsProduct.name?.toLowerCase());

        if (match) {
          const qty = Number(item.quantity || 1);
          const price = Number(item.price || item.unitPrice || 0);
          totalQtySold += qty;
          totalRevenue += qty * price;
          if (sale.timestamp || sale.dateStr) {
            saleDates.add((sale.timestamp || sale.dateStr).slice(0, 10));
          }
        }
      });
    });

    const costPrice = Number(
      statsProduct.buyPrice ||
      statsProduct.costPrice ||
      (statsProduct.batches && statsProduct.batches[0]?.cost) ||
      ((statsProduct.price || 0) * 0.6)
    );

    const netProfit = totalRevenue - totalQtySold * costPrice;
    const stockQty = Number(statsProduct.stock || 0);
    const stockValue = stockQty * costPrice;
    const sellPrice = Number(statsProduct.price || statsProduct.sellingPrice || 0);
    const marginPercent = sellPrice > 0 ? (((sellPrice - costPrice) / sellPrice) * 100) : 0;

    const activeDays = Math.max(1, saleDates.size);
    const dailySales = totalQtySold > 0 ? Math.round(totalQtySold / activeDays) : 0;
    const daysUntilStockout = dailySales > 0 ? Math.max(1, Math.round(stockQty / dailySales)) : '—';

    const batches = statsProduct.batches || [
      { id: 'b1', name: 'BATCH-1', quantity: stockQty, cost: costPrice, price: sellPrice }
    ];
    const todayStr = new Date().toISOString().split('T')[0];
    const expiredBatchesCount = batches.filter((b) => b.expiryDate && b.expiryDate < todayStr).length;

    return {
      totalRevenue,
      netProfit,
      totalQtySold,
      stockValue,
      marginPercent: marginPercent.toFixed(1),
      dailySales: dailySales || (totalQtySold > 0 ? totalQtySold : 0),
      daysUntilStockout: daysUntilStockout === '—' ? (stockQty > 0 ? 'Illimité' : '0') : `${daysUntilStockout} jours`,
      stockQty,
      availableStock: stockQty,
      expiredStock: 0,
      expiredBatchesCount,
      totalBatchesCount: Math.max(1, batches.length),
      variants: statsProduct.variants || []
    };
  }, [statsProduct, salesHistory]);

  // ── 9. Gestion des Lots d'un Produit (Photo 4) ──
  const [lotForm, setLotForm] = useState({
    id: null,
    name: '',
    quantity: '',
    cost: '',
    price: '',
    wholesalePrice: '',
    expiryDate: '',
    supplier: ''
  });

  // Charger les lots existants ou initialiser avec compatibilité totale batchNumber/buyPrice/sellPrice
  const currentBatches = useMemo(() => {
    if (!batchesProduct) return [];
    if (batchesProduct.batches && Array.isArray(batchesProduct.batches) && batchesProduct.batches.length > 0) {
      return batchesProduct.batches.map((b, idx) => {
        const name = b.name || b.batchNumber || b.lotNumber || b.ref || `LOT-${idx + 1}`;
        const cost = Number(b.cost ?? b.buyPrice ?? b.costPrice ?? (batchesProduct.buyPrice || (batchesProduct.price ? batchesProduct.price * 0.6 : 0)));
        const price = Number(b.price ?? b.sellPrice ?? batchesProduct.price ?? 0);
        return {
          id: b.id || `batch-${batchesProduct.id}-${idx + 1}`,
          name,
          batchNumber: b.batchNumber || name,
          quantity: Number(b.quantity || 0),
          cost,
          buyPrice: cost,
          price,
          sellPrice: price,
          wholesalePrice: b.wholesalePrice || null,
          expiryDate: b.expiryDate || b.receivedAt || '',
          supplier: b.supplier || '',
          isDefault: Boolean(b.isDefault || idx === 0)
        };
      });
    }

    const defaultCost = Number(batchesProduct.buyPrice || batchesProduct.costPrice || (batchesProduct.price ? batchesProduct.price * 0.6 : 0));
    const defaultPrice = Number(batchesProduct.price || batchesProduct.sellingPrice || 0);

    return [
      {
        id: `batch-${batchesProduct.id}-1`,
        name: 'LOT-1 (Principal)',
        batchNumber: 'LOT-1 (Principal)',
        quantity: Number(batchesProduct.stock || 0),
        cost: defaultCost,
        buyPrice: defaultCost,
        price: defaultPrice,
        sellPrice: defaultPrice,
        wholesalePrice: batchesProduct.wholesalePrice || null,
        expiryDate: '',
        supplier: '',
        isDefault: true
      }
    ];
  }, [batchesProduct]);

  // Calcul dynamique de la marge pour le formulaire de lot
  const lotMarginPercent = useMemo(() => {
    const cost = parseFloat(lotForm.cost);
    const price = parseFloat(lotForm.price);
    if (!isNaN(cost) && !isNaN(price) && price > 0) {
      return (((price - cost) / price) * 100).toFixed(1);
    }
    return '';
  }, [lotForm.cost, lotForm.price]);

  const handleSaveBatch = (e) => {
    e.preventDefault();
    if (!batchesProduct) return;
    if (!lotForm.quantity || isNaN(parseFloat(lotForm.quantity))) {
      showToast('Veuillez saisir une quantité valide', 'warning');
      return;
    }

    const qty = parseFloat(lotForm.quantity);
    const cost = parseFloat(lotForm.cost) || 0;
    const price = parseFloat(lotForm.price) || batchesProduct.price || 0;
    const wholesale = lotForm.wholesalePrice ? parseFloat(lotForm.wholesalePrice) : null;
    const name = lotForm.name.trim() || `LOT-${currentBatches.length + 1}`;

    let updatedBatches;
    if (lotForm.id) {
      // Modifier un lot existant
      updatedBatches = currentBatches.map((b) =>
        b.id === lotForm.id
          ? {
              ...b,
              name,
              batchNumber: name,
              quantity: qty,
              cost,
              buyPrice: cost,
              price,
              sellPrice: price,
              wholesalePrice: wholesale,
              expiryDate: lotForm.expiryDate,
              supplier: lotForm.supplier
            }
          : b
      );
      showToast(`Lot "${name}" modifié`, 'success');
    } else {
      // Ajouter un nouveau lot
      const newBatch = {
        id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        batchNumber: name,
        quantity: qty,
        cost,
        buyPrice: cost,
        price,
        sellPrice: price,
        wholesalePrice: wholesale,
        expiryDate: lotForm.expiryDate,
        supplier: lotForm.supplier,
        isDefault: currentBatches.length === 0
      };
      updatedBatches = [...currentBatches, newBatch];
      showToast(`Nouveau lot "${name}" ajouté`, 'success');
    }

    // Recalcul du stock total du produit à partir de tous les lots
    const newTotalStock = updatedBatches.reduce((acc, b) => acc + Number(b.quantity || 0), 0);
    const updatedProd = {
      ...batchesProduct,
      batches: updatedBatches,
      stock: newTotalStock,
      price: updatedBatches.find((b) => b.isDefault)?.price || price || batchesProduct.price,
      buyPrice: updatedBatches.find((b) => b.isDefault)?.cost || cost || batchesProduct.buyPrice
    };

    const updatedList = productsList.map((p) => (p.id === batchesProduct.id ? updatedProd : p));
    saveProducts(updatedList);
    setBatchesProduct(updatedProd);

    // Réinitialiser le formulaire
    setLotForm({
      id: null,
      name: '',
      quantity: '',
      cost: '',
      price: '',
      wholesalePrice: '',
      expiryDate: '',
      supplier: ''
    });
  };

  const handleSetDefaultBatch = (batch) => {
    if (!batchesProduct) return;
    const updatedBatches = currentBatches.map((b) => ({
      ...b,
      isDefault: b.id === batch.id
    }));

    const updatedProd = {
      ...batchesProduct,
      batches: updatedBatches,
      price: batch.price || batchesProduct.price,
      buyPrice: batch.cost || batchesProduct.buyPrice
    };

    const updatedList = productsList.map((p) => (p.id === batchesProduct.id ? updatedProd : p));
    saveProducts(updatedList);
    setBatchesProduct(updatedProd);
    showToast(`Lot "${batch.name}" défini comme lot par défaut`, 'info');
  };

  const handleDeleteBatch = (batch) => {
    if (!batchesProduct) return;
    if (currentBatches.length <= 1) {
      showToast('Le produit doit posséder au moins un lot actif', 'warning');
      return;
    }

    const updatedBatches = currentBatches.filter((b) => b.id !== batch.id);
    const newTotalStock = updatedBatches.reduce((acc, b) => acc + Number(b.quantity || 0), 0);
    const updatedProd = {
      ...batchesProduct,
      batches: updatedBatches,
      stock: newTotalStock
    };

    const updatedList = productsList.map((p) => (p.id === batchesProduct.id ? updatedProd : p));
    saveProducts(updatedList);
    setBatchesProduct(updatedProd);
    showToast(`Lot "${batch.name}" supprimé`, 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1120] relative">
      {/* Toast Notification */}
      <ModernToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pr-5 md:pr-7 space-y-4 max-w-full box-border">

        {/* ℹ️ Banner Mode Comptabilité Financière */}
        {systemSettings?.financialAccountingOnly && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-between gap-3 text-indigo-900 dark:text-indigo-200 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black">Mode comptabilité financière uniquement actif</h3>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
                  Le suivi du stock physique est désactivé. Les ventes ne déduisent pas de stock, tandis que les dettes et l'historique sont enregistrés.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 shrink-0">
              Actif (Paramètres)
            </span>
          </div>
        )}

        {/* ── 1. EN-TÊTE CONFORME PHOTO 1 : Titre à Gauche, Boutons à Droite ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          {/* Titre */}
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'ar' ? 'إدارة المخزون والمنتجات' : 'Gestion des Stocks & Produits'}
            </h1>
          </div>

          {/* Boutons d'action en haut à droite */}
          <div className="flex items-center gap-3">
            {/* Bouton Liste des prix (Photo 1) */}
            <button
              type="button"
              onClick={() => setIsPriceListOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-xs font-bold shadow-2xs transition-all cursor-pointer hover:shadow-xs active:scale-97"
            >
              <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 stroke-[2]" />
              <span>{language === 'ar' ? 'قائمة الأسعار' : 'Liste des prix'}</span>
            </button>

            {/* Bouton Ajouter un Nouveau Produit (Photo 1) */}
            <button
              type="button"
              onClick={() => {
                setProductToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{language === 'ar' ? 'إضافة منتج جديد' : 'Ajouter un Nouveau Produit'}</span>
            </button>
          </div>
        </div>

        {/* ── 2. BARRE DE RECHERCHE ET OUTILS (EXACTEMENT CONFORME À LA PHOTO DU MODÈLE) ── */}
        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5 transition-colors">
          
          {/* Ligne 1 : Recherche + Bouton Filtres Avancés + Bouton Colonnes */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Barre de recherche */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'بحث في المخزون (الاسم، الباركود)...' : 'Rechercher dans le stock (nom, code-barres)...'}
                className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 pl-4 pr-10 rtl:pl-10 rtl:pr-4 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Boutons d'outils à droite */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Bouton Filtres Avancés */}
              <button
                type="button"
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  isFilterExpanded
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{language === 'ar' ? 'فلاتر متقدمة' : 'Filtres Avancés'}</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center ml-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Bouton Colonnes */}
              <div ref={columnsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Columns3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{language === 'ar' ? 'الأعمدة' : 'Colonnes'}</span>
                </button>

                {isColumnsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2.5 z-30 animate-scaleIn text-xs">
                    <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 px-2 py-1 mb-1 tracking-wider">
                      Afficher les colonnes
                    </div>
                    <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 font-medium">
                      <input
                        type="checkbox"
                        checked={visibleColumns.barcode}
                        onChange={() => setVisibleColumns((p) => ({ ...p, barcode: !p.barcode }))}
                        className="rounded text-blue-600"
                      />
                      <span>Code-barres</span>
                    </label>
                    <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 font-medium">
                      <input
                        type="checkbox"
                        checked={visibleColumns.product}
                        onChange={() => setVisibleColumns((p) => ({ ...p, product: !p.product }))}
                        className="rounded text-blue-600"
                      />
                      <span>Nom du Produit</span>
                    </label>
                    <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 font-medium">
                      <input
                        type="checkbox"
                        checked={visibleColumns.stock}
                        onChange={() => setVisibleColumns((p) => ({ ...p, stock: !p.stock }))}
                        className="rounded text-blue-600"
                      />
                      <span>Qté Valide</span>
                    </label>
                    <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 font-medium">
                      <input
                        type="checkbox"
                        checked={visibleColumns.batches}
                        onChange={() => setVisibleColumns((p) => ({ ...p, batches: !p.batches }))}
                        className="rounded text-blue-600"
                      />
                      <span>Lots</span>
                    </label>
                    <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-700 dark:text-slate-200 font-medium">
                      <input
                        type="checkbox"
                        checked={visibleColumns.price}
                        onChange={() => setVisibleColumns((p) => ({ ...p, price: !p.price }))}
                        className="rounded text-blue-600"
                      />
                      <span>Prix Unitaire</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ligne de séparation fine et zone des filtres avancés (Photo du modèle) */}
          {isFilterExpanded && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 animate-fadeIn space-y-3.5">
              {/* Ligne 1 : Catégorie, Famille, Fournisseur, Statut du Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Catégorie */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'الفئة' : 'Catégorie'}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 pr-9 rtl:pr-3.5 rtl:pl-9 transition-colors cursor-pointer shadow-2xs"
                    >
                      <option value="all">{language === 'ar' ? 'جميع الفئات' : 'Toutes les catégories'}</option>
                      {MOCK_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Famille */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'العائلة' : 'Famille'}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFamily}
                      onChange={(e) => setSelectedFamily(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 pr-9 rtl:pr-3.5 rtl:pl-9 transition-colors cursor-pointer shadow-2xs"
                    >
                      <option value="all">{language === 'ar' ? 'جميع العائلات' : 'Toutes les Familles'}</option>
                      {availableFamilies.map((fam) => (
                        <option key={fam} value={fam}>
                          {fam}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Fournisseur */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'المورد' : 'Fournisseur'}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 pr-9 rtl:pr-3.5 rtl:pl-9 transition-colors cursor-pointer shadow-2xs"
                    >
                      <option value="all">{language === 'ar' ? 'جميع الموردين' : 'Tous les Fournisseurs'}</option>
                      {availableSuppliers.map((sup) => (
                        <option key={sup} value={sup}>
                          {sup}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Statut du Stock */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'حالة المخزون' : 'Statut du Stock'}
                  </label>
                  <div className="relative">
                    <select
                      value={stockStatusFilter}
                      onChange={(e) => setStockStatusFilter(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 pr-9 rtl:pr-3.5 rtl:pl-9 transition-colors cursor-pointer shadow-2xs"
                    >
                      <option value="all">{language === 'ar' ? 'جميع الحالات' : 'Tous les Statuts'}</option>
                      <option value="in-stock">{language === 'ar' ? 'متوفر بالمخزن (> 0)' : 'En stock (> 0)'}</option>
                      <option value="low-stock">{language === 'ar' ? 'مخزون حرج / تنبيه (≤ 5)' : 'Stock critique / Alerte (≤ 5)'}</option>
                      <option value="out-of-stock">{language === 'ar' ? 'نفاد المخزون (0)' : 'Rupture de stock (0)'}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Ligne 2 : Tri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'الترتيب' : 'Tri'}
                  </label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 pr-9 rtl:pr-3.5 rtl:pl-9 transition-colors cursor-pointer shadow-2xs"
                    >
                      <option value="recent">{language === 'ar' ? 'الأحدث' : 'Plus récents'}</option>
                      <option value="oldest">{language === 'ar' ? 'الأقدم' : 'Plus anciens'}</option>
                      <option value="name-asc">{language === 'ar' ? 'اسم المنتج (أ ← ي)' : 'Nom du Produit (A → Z)'}</option>
                      <option value="name-desc">{language === 'ar' ? 'اسم المنتج (ي ← أ)' : 'Nom du Produit (Z → A)'}</option>
                      <option value="price-asc">{language === 'ar' ? 'السعر تصاعدياً' : 'Prix croissant'}</option>
                      <option value="price-desc">{language === 'ar' ? 'السعر تنازلياً' : 'Prix décroissant'}</option>
                      <option value="stock-desc">{language === 'ar' ? 'الكمية (الأعلى)' : 'Quantité en stock (Plus élevé)'}</option>
                      <option value="stock-asc">{language === 'ar' ? 'الكمية (الأقل)' : 'Quantité en stock (Moins élevé)'}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── 3. TABLEAU PRINCIPAL DES PRODUITS (PHOTO 1) ── */}
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors w-full box-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-extrabold select-none">
                  {visibleColumns.barcode && (
                    <th className="py-3 px-4 w-44">{language === 'ar' ? 'الباركود' : 'Code-barres'}</th>
                  )}
                  {visibleColumns.product && (
                    <th className="py-3 px-4">{language === 'ar' ? 'اسم المنتج' : 'Nom du Produit'}</th>
                  )}
                  {visibleColumns.stock && (
                    <th className="py-3 px-4 text-center w-36">{language === 'ar' ? 'الكمية المتاحة' : 'Qté Valide'}</th>
                  )}
                  {visibleColumns.batches && (
                    <th className="py-3 px-4 text-center w-28">{language === 'ar' ? 'الدفعات' : 'Lots'}</th>
                  )}
                  {visibleColumns.price && (
                    <th className="py-3 px-4 text-right rtl:text-left w-32">{language === 'ar' ? 'السعر (دج)' : 'Prix (DA)'}</th>
                  )}
                  {visibleColumns.actions && (
                    <th className="py-3 px-4 text-center min-w-[380px]">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-slate-400 dark:text-slate-500">
                      <Package className="w-10 h-10 mx-auto stroke-1 mb-2 opacity-50" />
                      <p className="font-bold text-sm">
                        {language === 'ar' ? 'لا يوجد أي منتج يطابق بحثك' : 'Aucun article ne correspond à votre recherche'}
                      </p>
                      <p className="text-xs mt-1">
                        {language === 'ar' ? 'قم بتعديل الفلاتر أو أضف منتجاً جديداً.' : 'Modifiez vos filtres ou ajoutez un nouveau produit.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((prod) => {
                    const isOutOfStock = Number(prod.stock || 0) === 0;
                    const isLowStock = Number(prod.stock || 0) > 0 && Number(prod.stock || 0) <= (prod.alertStock || 5);
                    const batchesCount = (prod.batches && prod.batches.length) || 1;

                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        {/* 1. Code-barres (Pilule conforme Photo 1) */}
                        {visibleColumns.barcode && (
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 text-xs font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                              <Barcode className="w-4 h-4 text-slate-400 stroke-[1.8]" />
                              <span>{prod.barcode || 'N/A'}</span>
                            </div>
                          </td>
                        )}

                        {/* 2. Nom du Produit + Catégorie + Famille (Photo 1) */}
                        {visibleColumns.product && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                                <img
                                    src={prod.image || getDefaultProductImage(prod)}
                                    alt={prod.name}
                                    className="w-full h-full object-cover rounded-xl"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = getDefaultProductImage(prod);
                                    }}
                                  />
                              </div>

                              <div>
                                <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                                  {prod.name}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                  {getCategoryName(prod.category)} • {language === 'ar' ? 'العائلة' : 'Famille'}: {prod.family || 'Famille1'}
                                </div>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* 3. Qté Valide (Badge pastille couleur conforme Photo 1) */}
                        {visibleColumns.stock && (
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isOutOfStock ? (
                              <div className="inline-flex flex-col items-center justify-center px-3.5 py-1.5 rounded-2xl bg-rose-100/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-bold text-xs min-w-[70px]">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  <strong className="text-sm font-black">0</strong>
                                </span>
                                <span className="text-[10px] opacity-80">{language === 'ar' ? '(منتهي)' : '(Épuisé)'}</span>
                              </div>
                            ) : isLowStock ? (
                              <div className="inline-flex flex-col items-center justify-center px-3.5 py-1.5 rounded-2xl bg-[#FEF3C7] dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold text-xs min-w-[70px]">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  <strong className="text-sm font-black">{prod.stock}</strong>
                                </span>
                                <span className="text-[10px] opacity-90">{language === 'ar' ? '(منخفض)' : '(Faible)'}</span>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-center justify-center px-3.5 py-1.5 rounded-2xl bg-[#D1FAE5] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold text-xs min-w-[70px]">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <strong className="text-sm font-black">{prod.stock}</strong>
                                </span>
                                <span className="text-[10px] opacity-90">{language === 'ar' ? 'متاح' : 'Valide'}</span>
                              </div>
                            )}
                          </td>
                        )}

                        {/* 4. Lots (Photo 1) */}
                        {visibleColumns.batches && (
                          <td className="py-3 px-4 text-center whitespace-nowrap font-black text-slate-800 dark:text-slate-200 text-xs">
                            {batchesCount} {language === 'ar' ? 'دفعات' : 'LOTS'}
                          </td>
                        )}

                        {/* 5. Prix Unitaire (optionnel) */}
                        {visibleColumns.price && (
                          <td className="py-3 px-4 text-right rtl:text-left whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white text-xs" dir="ltr">
                            {prod.price?.toFixed(2)} DA
                          </td>
                        )}

                        {/* 6. Actions (Photo 1 : Star, Stock & Lots, Modifier Infos Produit, Stats 📈, Trash 🗑) */}
                        {visibleColumns.actions && (
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              
                              {/* Bouton Étoile Favori / Vedette */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleFavorite(prod, e)}
                                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${
                                  prod.isFavorite
                                    ? 'bg-[#FFFBEB] dark:bg-amber-950/40 border-amber-300 dark:border-amber-600 text-amber-500 shadow-2xs'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 hover:text-amber-400'
                                }`}
                                title={prod.isFavorite ? (language === 'ar' ? 'مميز' : 'En vedette') : (language === 'ar' ? 'إضافة إلى المميزات' : 'Ajouter aux vedettes')}
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    prod.isFavorite ? 'fill-amber-400 text-amber-500' : 'stroke-[2]'
                                  }`}
                                />
                              </button>

                              {/* Bouton Stock & Lots (Vert Menthe - Ouvre Photo 4) */}
                              <button
                                type="button"
                                onClick={() => setBatchesProduct(prod)}
                                className="px-3.5 py-2 rounded-2xl bg-[#D1FAE5] hover:bg-emerald-200 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-97"
                                title={language === 'ar' ? 'إدارة الدفعات والمستودعات' : 'Gérer les lots et dépôts de ce produit'}
                              >
                                {language === 'ar' ? 'المخزون والدفعات' : 'Stock & Lots'}
                              </button>

                              {/* Bouton Modifier Infos Produit (Bleu Doux) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setProductToEdit(prod);
                                  setIsAddModalOpen(true);
                                }}
                                className="px-3.5 py-2 rounded-2xl bg-[#EEF4FF] hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-97"
                                title={language === 'ar' ? 'تعديل بيانات المنتج' : 'Modifier la fiche produit'}
                              >
                                {language === 'ar' ? 'تعديل بيانات المنتج' : 'Modifier Infos Produit'}
                              </button>

                              {/* Bouton Analytics / Statistiques (📈 - Ouvre Photo 3) */}
                              <button
                                type="button"
                                onClick={() => setStatsProduct(prod)}
                                className="w-9 h-9 rounded-2xl bg-[#EEF4FF] hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-97"
                                title="Voir les statistiques & la rentabilité"
                              >
                                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                              </button>

                              {/* Bouton Supprimer (🗑) */}
                              <button
                                type="button"
                                onClick={() => setConfirmDelete({ isOpen: true, product: prod })}
                                className="w-9 h-9 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-all cursor-pointer"
                                title="Supprimer cet article"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── 4. BARRE DE PAGINATION (PHOTO 1) ── */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Précédent
            </button>

            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              Page {currentPage} sur {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Suivant
            </button>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 5. MODALE LISTE DES PRIX (EXACTEMENT PHOTO 2)                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isPriceListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn select-none">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 animate-scaleIn space-y-5">
            
            <div className="text-center pt-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Liste des Prix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Une feuille avec les noms des produits et leurs prix de vente, en-tête boutique inclus
              </p>
            </div>

            {/* Carte Périmètre actuel */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priceListUseFilters}
                  onChange={(e) => setPriceListUseFilters(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                    Utiliser les filtres actuels du tableau
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {priceListUseFilters ? `Périmètre : ${filteredProducts.length} produit(s) sélectionnés` : 'Tous les produits du magasin'}
                  </span>
                </div>
              </label>
            </div>

            {/* Grille 2x2 des options de génération */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priceListInStockOnly}
                  onChange={(e) => setPriceListInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">En stock uniquement</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priceListHideWithoutPrice}
                  onChange={(e) => setPriceListHideWithoutPrice(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Masquer sans prix</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priceListShowBarcode}
                  onChange={(e) => setPriceListShowBarcode(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Afficher le code-barres</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priceListGroupByCategory}
                  onChange={(e) => setPriceListGroupByCategory(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Grouper par catégorie</span>
              </label>
            </div>

            {/* Nombre de colonnes par page */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nombre de colonnes par page
              </label>
              <select
                value={priceListColumns}
                onChange={(e) => setPriceListColumns(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value={1}>1 colonne</option>
                <option value={2}>2 colonnes (Recommandé)</option>
                <option value={3}>3 colonnes</option>
                <option value={4}>4 colonnes</option>
              </select>
            </div>

            {/* Boutons d'action (Photo 2) */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsPriceListOpen(false)}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer text-center"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handlePrintPriceList}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-black text-white bg-[#1E293B] hover:bg-[#0F172A] cursor-pointer text-center shadow-md transition-all active:scale-98"
              >
                PDF
              </button>

              <button
                type="button"
                onClick={handlePrintPriceList}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 cursor-pointer text-center shadow-md shadow-blue-600/25 transition-all active:scale-98"
              >
                Imprimer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 6. MODALE STATISTIQUES PRODUIT (EXACTEMENT PHOTO 3)                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {statsProduct && productStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn select-none">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl p-6 animate-scaleIn space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Entête avec Nom du produit & Code-barres */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {statsProduct.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {statsProduct.barcode || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatsProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grille des 4 métriques principales (Ligne 1 - Photo 3) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* 1. Revenu Total */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 relative">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Revenu Total</span>
                <span className="text-base font-mono font-black text-slate-900 dark:text-white block">
                  {productStats.totalRevenue.toFixed(2)} DA
                </span>
                <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>

              {/* 2. Bénéfice Net */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 relative">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Bénéfice Net</span>
                <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400 block">
                  {productStats.netProfit.toFixed(2)} DA
                </span>
                <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              {/* 3. Quantité Vendue */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 relative">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Quantité Vendue</span>
                <span className="text-base font-mono font-black text-purple-600 dark:text-purple-400 block">
                  {productStats.totalQtySold}
                </span>
                <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>

              {/* 4. Valeur du Stock */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 relative">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Valeur du Stock</span>
                <span className="text-base font-mono font-black text-amber-600 dark:text-amber-400 block">
                  {productStats.stockValue.toFixed(2)} DA
                </span>
                <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Grille des 3 métriques secondaires (Ligne 2 - Photo 3) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* 5. Marge Bénéficiaire */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Marge Bénéficiaire</span>
                  <span className="text-base font-mono font-black text-teal-600 dark:text-teal-400">
                    {productStats.marginPercent}%
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </div>

              {/* 6. Ventes Quotidiennes */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Ventes Quotidiennes</span>
                  <span className="text-base font-mono font-black text-blue-600 dark:text-blue-400">
                    {productStats.dailySales}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>

              {/* 7. Jours avant Rupture */}
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Jours avant Rupture</span>
                  <span className="text-base font-mono font-black text-rose-600 dark:text-rose-400">
                    {productStats.daysUntilStockout}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                  <Hourglass className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 2 Colonnes du bas : Statut du Stock & Performance des variantes (Photo 3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Panneau Gauche : Statut du Stock */}
              <div className="p-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mb-3">
                  Statut du Stock
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Stock total restant</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{productStats.stockQty}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Stock disponible à la vente</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{productStats.availableStock}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Stock expiré</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-mono">{productStats.expiredStock}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Lots (Expirés / Total)</span>
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {productStats.expiredBatchesCount} / {productStats.totalBatchesCount}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Panneau Droit : Performance des variantes */}
              <div className="p-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex flex-col justify-center items-center text-center">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mb-auto w-full text-left">
                  Performance des variantes
                </h4>
                <div className="py-8 text-xs text-slate-400 font-medium">
                  {productStats.variants && productStats.variants.length > 0 ? (
                    <div className="w-full text-left space-y-2">
                      {productStats.variants.map((v, i) => (
                        <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-100">
                          <span>{v.name}</span>
                          <span className="font-mono font-bold">{v.stock || 0} en stock</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    'Aucune donnée pour les variantes'
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 7. MODALE GÉRER LES LOTS DU PRODUIT (EXACTEMENT PHOTO 4)             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {batchesProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn select-none">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl p-6 animate-scaleIn space-y-5 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Gérer les Lots: {batchesProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setBatchesProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULAIRE D'AJOUT / MODIFICATION D'UN LOT (PHOTO 4) */}
            <form onSubmit={handleSaveBatch} className="space-y-3 bg-slate-50/70 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200/70 dark:border-slate-800">
              {/* Nom / Réf du Lot */}
              <div>
                <input
                  type="text"
                  placeholder="Ex : Lot de janvier / Fournisseur X"
                  value={lotForm.name}
                  onChange={(e) => setLotForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full text-xs font-medium p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500"
                />
              </div>

              {/* Ligne : Quantité, Prix d'Achat, Marge, Prix de Détail, Prix de Gros, Date de Péremption */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={lotForm.quantity}
                    onChange={(e) => setLotForm((p) => ({ ...p, quantity: e.target.value }))}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Prix d'Achat *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={lotForm.cost}
                    onChange={(e) => setLotForm((p) => ({ ...p, cost: e.target.value }))}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    Marge bénéficiaire
                  </label>
                  <div className="w-full p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs text-center">
                    {lotMarginPercent ? `${lotMarginPercent}%` : '%'}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Prix de Détail *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={lotForm.price}
                    onChange={(e) => setLotForm((p) => ({ ...p, price: e.target.value }))}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Prix de Gros
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Optionnel"
                    value={lotForm.wholesalePrice}
                    onChange={(e) => setLotForm((p) => ({ ...p, wholesalePrice: e.target.value }))}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Date de Péremption
                  </label>
                  <input
                    type="date"
                    value={lotForm.expiryDate}
                    onChange={(e) => setLotForm((p) => ({ ...p, expiryDate: e.target.value }))}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              {/* Ligne 2 : Fournisseur & Bouton Ajouter un Lot */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
                <div className="flex-1 max-w-sm">
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Fournisseur (optionnel)
                  </label>
                  <select
                    value={lotForm.supplier}
                    onChange={(e) => setLotForm((p) => ({ ...p, supplier: e.target.value }))}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="">Choisir un fournisseur...</option>
                    {suppliersList.map((sup) => (
                      <option key={sup.id} value={sup.name}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {lotForm.id && (
                    <button
                      type="button"
                      onClick={() =>
                        setLotForm({
                          id: null,
                          name: '',
                          quantity: '',
                          cost: '',
                          price: '',
                          wholesalePrice: '',
                          expiryDate: '',
                          supplier: ''
                        })
                      }
                      className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Annuler la modif
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    {lotForm.id ? 'Mettre à jour le Lot' : 'Ajouter un Lot'}
                  </button>
                </div>
              </div>
            </form>

            {/* TABLEAU DES LOTS ACTUELLEMENT STOCKÉS (PHOTO 4) */}
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2.5">
                Lots Actuellement Stockés
              </h4>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold text-[10px] uppercase">
                      <th className="py-2.5 px-3">Lot</th>
                      <th className="py-2.5 px-3 text-center">Quantité</th>
                      <th className="py-2.5 px-3 text-right">Coût</th>
                      <th className="py-2.5 px-3 text-center">Détail / Gros</th>
                      <th className="py-2.5 px-3 text-center">Date de Péremption</th>
                      <th className="py-2.5 px-3">Fournisseur</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {currentBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{b.name || b.batchNumber || 'Lot sans nom'}</span>
                            {b.isDefault && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                                Défaut
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-sm text-slate-900 dark:text-white">
                          {b.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                          {Number(b.cost ?? b.buyPrice ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="font-black text-blue-600 block">
                            {Number(b.price ?? b.sellPrice ?? 0).toFixed(2)}
                          </span>
                          {b.wholesalePrice && (
                            <span className="text-[10px] text-slate-400 block">
                              Gros: {Number(b.wholesalePrice).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">
                          {b.expiryDate ? (isNaN(new Date(b.expiryDate).getTime()) ? b.expiryDate : new Date(b.expiryDate).toLocaleDateString('fr-FR')) : '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {b.supplier || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!b.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultBatch(b)}
                                className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                              >
                                Définir par défaut
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setLotForm({
                                  id: b.id,
                                  name: b.name || b.batchNumber || '',
                                  quantity: b.quantity,
                                  cost: b.cost ?? b.buyPrice ?? '',
                                  price: b.price ?? b.sellPrice ?? '',
                                  wholesalePrice: b.wholesalePrice || '',
                                  expiryDate: b.expiryDate || '',
                                  supplier: b.supplier || ''
                                });
                              }}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                            >
                              Modifier
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteBatch(b)}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                            >
                              Supprimer le Lot
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODALE: Ajouter ou Modifier Produit ── */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setProductToEdit(null);
        }}
        categories={MOCK_CATEGORIES}
        productToEdit={productToEdit}
        onSave={handleSaveProduct}
      />

      {/* ── MODALE: Confirmer la suppression du produit ── */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Supprimer l'article ?"
        message={`Êtes-vous certain de vouloir supprimer définitivement "${confirmDelete.product?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        cancelText="Conserver"
        type="danger"
        onConfirm={handleDeleteProduct}
        onCancel={() => setConfirmDelete({ isOpen: false, product: null })}
      />

    </div>
  );
}
