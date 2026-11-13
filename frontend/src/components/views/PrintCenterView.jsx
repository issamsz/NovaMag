import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Barcode,
  Printer,
  Eye,
  FileText,
  Package,
  Users,
  Search,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Tag,
  Copy,
  Layers,
  Sparkles,
  Save,
  ChevronDown
} from 'lucide-react';
import ModernToast from '../common/ModernToast';
import { useLanguage } from '../../i18n/LanguageContext';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_CUSTOMERS, sanitizeProductsWithRealNames } from '../../mock/posData';
import { generateCode128Svg } from '../../services/barcodeGenerator';
import { fetchRealPrinters } from '../../services/api';

// Formats d'étiquettes standards
const LABEL_SIZES = [
  { id: '50x30', name: '50 x 30 mm', width: 50, height: 30, barcodeHeight: 14 },
  { id: '40x20', name: '40 x 20 mm', width: 40, height: 20, barcodeHeight: 9 },
  { id: '40x30', name: '40 x 30 mm', width: 40, height: 30, barcodeHeight: 14 },
  { id: '60x40', name: '60 x 40 mm', width: 60, height: 40, barcodeHeight: 19 },
  { id: '80x50', name: '80 x 50 mm', width: 80, height: 50, barcodeHeight: 24 },
  { id: '100x50', name: '100 x 50 mm', width: 100, height: 50, barcodeHeight: 25 },
  { id: '30x20', name: '30 x 20 mm (Bijoux/Optique)', width: 30, height: 20, barcodeHeight: 8 }
];

export default function PrintCenterView({ onNavigate }) {
  const { language, isRTL, t } = useLanguage();
  // 1. Liste des produits réels du magasin
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_products');
      const raw = saved ? JSON.parse(saved) : MOCK_PRODUCTS;
      return sanitizeProductsWithRealNames(raw);
    } catch {
      return MOCK_PRODUCTS;
    }
  });

  // Paramètres système (Nom magasin, imprimantes, etc.)
  const [systemSettings, setSystemSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const storeName = systemSettings?.storeName && !systemSettings.storeName.includes('لومينا')
    ? systemSettings.storeName
    : 'NovaMag';

  // Synchronisation dynamique
  useEffect(() => {
    const handleSync = () => {
      try {
        const savedProd = localStorage.getItem('novamag_products');
        if (savedProd) setProducts(sanitizeProductsWithRealNames(JSON.parse(savedProd)));
        const savedSettings = localStorage.getItem('novamag_system_settings');
        if (savedSettings) setSystemSettings(JSON.parse(savedSettings));
      } catch (e) {}
    };
    window.addEventListener('novamag_products_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('novamag_products_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // ---------------------------------------------------------
  // COLONNE 1 : SÉLECTION DES PRODUITS
  // ---------------------------------------------------------
  const [sourceType, setSourceType] = useState('products'); // 'products' | 'clients'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());

  // Familles et fournisseurs uniques
  const uniqueFamilies = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.family && p.family.trim()) set.add(p.family.trim());
    });
    return Array.from(set);
  }, [products]);

  const uniqueSuppliers = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.supplier && p.supplier.trim()) set.add(p.supplier.trim());
    });
    return Array.from(set);
  }, [products]);

  // Filtrage des articles de la colonne 1
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q));
        if (!match) return false;
      }
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedFamily !== 'all' && (p.family || '').toLowerCase() !== selectedFamily.toLowerCase()) return false;
      if (selectedSupplier !== 'all' && (p.supplier || '').toLowerCase() !== selectedSupplier.toLowerCase()) return false;
      return true;
    });
  }, [products, searchTerm, selectedCategory, selectedFamily, selectedSupplier]);

  // ---------------------------------------------------------
  // COLONNE 2 : FILE D'IMPRESSION (QUEUE)
  // ---------------------------------------------------------
  // Initialiser par défaut avec 2 articles pour reproduire l'écran des captures
  const [queue, setQueue] = useState(() => {
    const prod1 = products[1] || products[0];
    const prod2 = products[0] || products[1];
    if (!prod1) return [];
    return [
      {
        id: prod1.id,
        name: prod1.name,
        barcode: prod1.barcode || '202634359005',
        price: Number(prod1.price || prod1.sellingPrice) || 3200,
        quantity: 1,
        stock: prod1.stock || 5
      },
      {
        id: prod2.id,
        name: prod2.name,
        barcode: prod2.barcode || '202611157366',
        price: Number(prod2.price || prod2.sellingPrice) || 2000,
        quantity: 1,
        stock: prod2.stock || 16
      }
    ];
  });

  const [uniformQty, setUniformQty] = useState(1);

  // Nombre total d'étiquettes dans la file
  const totalLabelsCount = useMemo(() => {
    return queue.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [queue]);

  // Ajouter la sélection à la file d'impression
  const handleAddSelectedToQueue = () => {
    if (selectedProductIds.size === 0) {
      showToast('Veuillez cocher au moins un article', 'warning');
      return;
    }

    const itemsToAdd = products.filter((p) => selectedProductIds.has(p.id));
    const newQueue = [...queue];

    itemsToAdd.forEach((prod) => {
      const existing = newQueue.find((it) => it.id === prod.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        newQueue.push({
          id: prod.id,
          name: prod.name,
          barcode: prod.barcode || '',
          price: Number(prod.price || prod.sellingPrice) || 0,
          quantity: 1,
          stock: prod.stock || 0
        });
      }
    });

    setQueue(newQueue);
    setSelectedProductIds(new Set());
    showToast(`${itemsToAdd.length} article(s) ajouté(s) à la file`, 'success');
  };

  // Ajouter tous les résultats filtrés
  const handleAddAllFilteredToQueue = () => {
    if (filteredProducts.length === 0) return;
    const newQueue = [...queue];
    filteredProducts.forEach((prod) => {
      const existing = newQueue.find((it) => it.id === prod.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        newQueue.push({
          id: prod.id,
          name: prod.name,
          barcode: prod.barcode || '',
          price: Number(prod.price || prod.sellingPrice) || 0,
          quantity: 1,
          stock: prod.stock || 0
        });
      }
    });
    setQueue(newQueue);
    showToast(`${filteredProducts.length} article(s) ajouté(s) à la file`, 'success');
  };

  // Vider la file d'impression
  const handleClearQueue = () => {
    setQueue([]);
    showToast('File d\'impression vidée', 'info');
  };

  // Retirer un article de la file
  const handleRemoveFromQueue = (index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  // Mettre à jour quantité ou prix dans la file
  const handleUpdateQueueItem = (index, field, value) => {
    setQueue((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, [field]: value } : it
      )
    );
  };

  // Appliquer quantité unique à tous
  const handleApplyUniformQty = () => {
    const q = Math.max(1, parseInt(uniformQty, 10) || 1);
    setQueue((prev) => prev.map((it) => ({ ...it, quantity: q })));
    showToast(`Quantité fixée à ${q} pour tous les articles`, 'info');
  };

  // Définir quantité = stock disponible
  const handleSetQtyToStock = () => {
    setQueue((prev) =>
      prev.map((it) => ({
        ...it,
        quantity: Math.max(1, Number(it.stock) || 1)
      }))
    );
    showToast('Quantités alignées sur le stock réel en rayon', 'info');
  };

  // Basculer la sélection d'un produit (case à cocher)
  const handleToggleSelectProduct = (id) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Tout sélectionner dans les résultats filtrés
  const handleToggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  // ---------------------------------------------------------
  // COLONNE 3 : APERÇU EN DIRECT & PARAMÈTRES D'ÉTIQUETTE
  // ---------------------------------------------------------
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [labelType, setLabelType] = useState('barcode'); // 'barcode' | 'price_only'
  const [selectedLabelSizeId, setSelectedLabelSizeId] = useState('50x30');
  const [autoBarcodeHeight, setAutoBarcodeHeight] = useState(true);
  const [printedPriceType, setPrintedPriceType] = useState('retail'); // 'retail' (Détail) | 'wholesale' (Gros) | 'semi_wholesale'
  const [pageLayout, setPageLayout] = useState('single'); // 'single' (Une par page) | 'sheet' (Planche multiple)

  // Options du contenu d'étiquette (Image 4)
  const [labelFields, setLabelFields] = useState({
    storeName: false,
    productName: true,
    price: false,
    priceType: false,
    barcodeNumber: true,
    variants: false,
    discount: false
  });

  const toggleLabelField = (key) => {
    setLabelFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ---------------------------------------------------------
  // IMPRIMANTE & ENREGISTREMENT PAR DÉFAUT (Image f62efd3d.png)
  // ---------------------------------------------------------
  const [availablePrinters, setAvailablePrinters] = useState([
    { name: 'default', displayName: 'Imprimante par défaut' }
  ]);
  const [selectedPrinter, setSelectedPrinter] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.labelPrinter || 'default';
      }
    } catch {}
    return 'default';
  });

  useEffect(() => {
    async function loadPrinters() {
      try {
        const res = await fetchRealPrinters();
        if (res?.success && Array.isArray(res.printers) && res.printers.length > 0) {
          const list = [
            { name: 'default', displayName: 'Imprimante par défaut' },
            ...res.printers.map((p) => ({
              name: p.name,
              displayName: p.displayName || p.name
            }))
          ];
          setAvailablePrinters(list);
        }
      } catch (e) {}
    }
    loadPrinters();
  }, []);

  const handleSaveDefaultPrinter = () => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      const current = saved ? JSON.parse(saved) : {};
      current.labelPrinter = selectedPrinter;
      localStorage.setItem('novamag_system_settings', JSON.stringify(current));
      setSystemSettings(current);
      window.dispatchEvent(new Event('novamag_settings_updated'));
      showToast('✓ Imprimante enregistrée par défaut pour les étiquettes', 'success');
    } catch (e) {
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const activeLabelSize = useMemo(() => {
    return LABEL_SIZES.find((s) => s.id === selectedLabelSizeId) || LABEL_SIZES[0];
  }, [selectedLabelSizeId]);

  // Produit actuellement affiché dans l'aperçu
  const previewItem = queue[currentPreviewIndex] || queue[0] || {
    name: 'Souris & Clavier Sans Fil Logitech MK270 Pro',
    barcode: '202634359005',
    price: 3200
  };

  // Génération du SVG du code-barres pour l'aperçu en direct
  const previewBarcodeSvg = useMemo(() => {
    if (labelType === 'price_only') return '';
    try {
      const code = previewItem.barcode || '202634359005';
      const h = autoBarcodeHeight ? activeLabelSize.barcodeHeight : 16;
      return generateCode128Svg(code, {
        height: Math.round(h * 3),
        barWidth: activeLabelSize.width <= 40 ? 1.1 : 1.35,
        showText: false
      });
    } catch {
      return '';
    }
  }, [previewItem, labelType, autoBarcodeHeight, activeLabelSize]);

  // ---------------------------------------------------------
  // MODALE D'APERÇU D'IMPRESSION (Image 2)
  // ---------------------------------------------------------
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Exécution de l'impression réelle
  const handlePrintAll = () => {
    if (queue.length === 0) {
      showToast('La file d\'impression est vide', 'warning');
      return;
    }

    try {
      // Construction du code HTML pour impression directe
      let allLabelsHtml = '';
      queue.forEach((item) => {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const code = item.barcode || '202634359005';
        const formattedPrice = `${Number(item.price || 0).toLocaleString('fr-FR')} DA`;
        const svg = generateCode128Svg(code, {
          height: Math.round(activeLabelSize.barcodeHeight * 2.8),
          barWidth: activeLabelSize.width <= 40 ? 1.05 : 1.35,
          showText: false
        });

        for (let i = 0; i < qty; i++) {
          allLabelsHtml += `
            <div class="print-label-page" style="page-break-after: always; width:${activeLabelSize.width}mm; height:${activeLabelSize.height}mm; box-sizing:border-box; padding:1.2mm; display:flex; flex-direction:column; justify-content:space-between; align-items:center; text-align:center; overflow:hidden; font-family:'Arial',sans-serif;">
              ${labelFields.storeName ? `<div style="font-size:9px; font-weight:bold; text-transform:uppercase;">${storeName}</div>` : ''}
              ${labelFields.productName ? `<div style="font-size:10px; font-weight:bold; max-height:2.8em; overflow:hidden; line-height:1.2;">${item.name}</div>` : ''}
              ${
                labelType === 'price_only'
                  ? `<div style="font-size:22px; font-weight:900; margin:auto 0; color:#000;">${formattedPrice}</div>`
                  : `
                    <div style="width:100%; display:flex; justify-content:center; align-items:center; overflow:hidden;">
                      ${svg}
                    </div>
                    ${labelFields.barcodeNumber ? `<div style="font-family:monospace; font-size:10px; font-weight:bold; letter-spacing:0.5px;">${code}</div>` : ''}
                  `
              }
              ${labelFields.price && labelType !== 'price_only' ? `<div style="font-size:12px; font-weight:900;">${formattedPrice}</div>` : ''}
            </div>
          `;
        }
      });

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Impression Étiquettes - NovaMag</title>
            <style>
              @page {
                size: ${activeLabelSize.width}mm ${activeLabelSize.height}mm;
                margin: 0;
              }
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { background: #fff; color: #000; }
            </style>
          </head>
          <body>
            ${allLabelsHtml}
          </body>
        </html>
      `;

      // Impression silencieuse ou fenêtre d'impression
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow || iframe.contentDocument;
      const iframeDoc = doc.document || doc;
      iframeDoc.open();
      iframeDoc.write(fullHtml);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.warn('Erreur impression :', e);
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          }, 3000);
        }
      }, 400);

      showToast(`Impression de ${totalLabelsCount} étiquette(s) envoyée`, 'success');
      setIsPreviewModalOpen(false);
    } catch (err) {
      showToast(`Erreur : ${err.message}`, 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] p-5 select-none overflow-hidden">
      {/* Toast */}
      <ModernToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* ========================================================================= */}
      {/* EN-TÊTE PRINCIPAL (Image 1)                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Barcode className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {language === 'ar' ? 'مركز الطباعة والملصقات' : "Centre d'impression"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar' ? 'طباعة ملصقات الباركود أو بطاقات الأسعار لعدة منتجات أو لفئة كاملة' : "Imprimer les étiquettes code-barres ou prix de plusieurs produits ou d'une catégorie entière"}
            </p>
          </div>
        </div>

        {/* Boutons d'action en haut à droite (Image 1) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
            <Tag className="w-4 h-4 text-slate-400" />
            <span>{language === 'ar' ? 'إجمالي الملصقات :' : 'Total étiquettes :'}</span>
            <span className="text-blue-600 dark:text-blue-400 text-sm">{totalLabelsCount}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>{language === 'ar' ? 'معاينة' : 'Aperçu'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrintAll}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ar' ? 'طباعة' : 'Imprimer'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRILLE À 3 COLONNES AVEC HAUTEUR CONTRÔLÉE (Image 1 & 4c80c748.png)      */}
      {/* ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 overflow-hidden items-stretch">
        {/* ----------------------------------------------------------------------- */}
        {/* COLONNE 1 : CHOISIR LES PRODUITS (lg:col-span-3)                         */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
              <Package className="w-4 h-4 text-blue-600" />
              <span>{language === 'ar' ? 'اختيار المنتجات' : 'Choisir les produits'}</span>
            </div>
            <span className="text-xs text-slate-400">
              {filteredProducts.length} {language === 'ar' ? 'منتجات' : 'produit(s)'}
            </span>
          </div>

          <div className="space-y-3 shrink-0 my-3">
            {/* Radio Switch : Produits vs Clients */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="sourceType"
                  checked={sourceType === 'products'}
                  onChange={() => setSourceType('products')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'ar' ? 'منتجات' : 'Produits'}</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="sourceType"
                  checked={sourceType === 'clients'}
                  onChange={() => setSourceType('clients')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'ar' ? 'زبائن' : 'Clients'}</span>
              </label>
            </div>

            {/* Recherche */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'ar' ? 'بحث بالاسم أو الباركود...' : 'Rechercher par nom ou code-barres'}
                className="w-full pl-3.5 pr-8 rtl:pl-8 rtl:pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-hidden focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filtres Catégorie, Famille, Fournisseur */}
            <div className="grid grid-cols-3 gap-1.5">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 outline-hidden focus:border-blue-500 truncate cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'كل الفئات' : 'Toutes'}</option>
                {MOCK_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 outline-hidden focus:border-blue-500 truncate cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'كل العائلات' : 'Toutes'}</option>
                {uniqueFamilies.map((fam) => (
                  <option key={fam} value={fam}>
                    {fam}
                  </option>
                ))}
              </select>

              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 outline-hidden focus:border-blue-500 truncate cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'الموردين' : 'Tous les f...'}</option>
                {uniqueSuppliers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Liste des articles avec scroll interne */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Aucun produit trouvé
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isChecked = selectedProductIds.has(p.id);
                const isInQueue = queue.some((it) => it.id === p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleSelectProduct(p.id)}
                    className="flex items-start gap-2.5 pt-2 first:pt-0 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelectProduct(p.id)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {p.name}
                        </span>
                        {isInQueue && (
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">
                            ✓
                          </span>
                        )}
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono shrink-0">
                          {Number(p.price || p.sellingPrice || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono truncate">{p.barcode}</span>
                        <span>Stock: {p.stock ?? 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bas de colonne 1 : Tout sélectionner + Boutons d'ajout */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    filteredProducts.length > 0 &&
                    selectedProductIds.size === filteredProducts.length
                  }
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Tout sélectionner</span>
              </label>
              <span className="font-bold text-blue-600">{selectedProductIds.size}</span>
            </div>

            <button
              type="button"
              onClick={handleAddSelectedToQueue}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إضافة المحدد إلى القائمة' : 'Ajouter la sélection'}</span>
            </button>

            <button
              type="button"
              onClick={handleAddAllFilteredToQueue}
              className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إضافة جميع النتائج' : 'Tous les résultats'}</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLONNE 2 : FILE D'IMPRESSION (lg:col-span-4)                            */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{language === 'ar' ? 'قائمة انتظار الطباعة' : "File d'impression"}</span>
            </div>
            <button
              type="button"
              onClick={handleClearQueue}
              className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
            >
              {language === 'ar' ? 'تفريغ القائمة' : 'Vider'}
            </button>
          </div>

          {/* Contrôles de masse */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2 shrink-0 my-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {language === 'ar' ? 'كمية موحدة' : 'Quantité unique'}
              </span>
              <input
                type="number"
                min="1"
                value={uniformQty}
                onChange={(e) => setUniformQty(e.target.value)}
                className="w-16 px-2.5 py-1 text-center font-bold text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyUniformQty}
                className="flex-1 py-1 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                {language === 'ar' ? 'تطبيق على الكل' : 'Appliquer à tous'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSetQtyToStock}
              className="w-full py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'ar' ? 'الكمية = الرصيد المتوفر بالمخزن' : 'Quantité = stock disponible'}</span>
            </button>
          </div>

          {/* Liste des cartes d'articles dans la file avec scroll interne */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
            {queue.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {language === 'ar' ? 'قائمة الطباعة فارغة حالياً. اختر منتجات من اليسار لإضافتها.' : 'La file d\'impression est vide. Sélectionnez des articles à gauche pour les ajouter.'}
              </div>
            ) : (
              queue.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => setCurrentPreviewIndex(idx)}
                  className={`p-3 bg-white dark:bg-slate-800 border rounded-xl transition-all cursor-pointer ${
                    currentPreviewIndex === idx
                      ? 'border-blue-400 dark:border-blue-500 shadow-2xs bg-blue-50/20'
                      : 'border-slate-200/90 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {/* Titre & Supprimer */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                      {item.name}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromQueue(idx);
                      }}
                      className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                      title={language === 'ar' ? 'إزالة' : 'Retirer'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {item.barcode}
                  </div>

                  {/* Inputs PRIX et QTÉ (Image 1) */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {language === 'ar' ? 'السعر' : 'PRIX'}
                      </span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          handleUpdateQueueItem(idx, 'price', e.target.value)
                        }
                        className="w-full px-2 py-1 text-center font-bold text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {language === 'ar' ? 'الكمية' : 'QTÉ'}
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateQueueItem(
                            idx,
                            'quantity',
                            Math.max(1, parseInt(e.target.value, 10) || 1)
                          )
                        }
                        className="w-full px-2 py-1 text-center font-bold text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer de la colonne 2 */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            <span>{queue.length} {language === 'ar' ? 'منتجات' : 'Articles'}</span>
            <span>
              {language === 'ar' ? 'إجمالي الملصقات : ' : 'Total étiquettes : '}
              <strong className="text-blue-600 dark:text-blue-400 text-sm">
                {totalLabelsCount}
              </strong>
            </span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* COLONNE 3 : APERÇU DE L'ÉTIQUETTE & PARAMÈTRES (lg:col-span-5)           */}
        {/* Défilement interne propre sans allonger la page (Image 4c80c748.png)     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col overflow-hidden">
          {/* Header avec pagination (Fixe en haut) */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>{language === 'ar' ? 'معاينة الملصق' : "Aperçu de l'étiquette"}</span>
            </div>

            {queue.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPreviewIndex((prev) =>
                      prev > 0 ? prev - 1 : queue.length - 1
                    )
                  }
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  {currentPreviewIndex + 1}/{queue.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPreviewIndex((prev) =>
                      prev < queue.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ZONE DÉFILANTE INTERNE DE LA COLONNE 3 (Aperçu + Tous les Réglages) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-4 pt-3">
            {/* Boîte d'Aperçu Graphique avec fond quadrillé (Image 1 & 3) */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[190px] border border-dashed border-slate-300 dark:border-slate-700">
              <div
                className="bg-white text-slate-900 rounded-md shadow-md p-3 flex flex-col items-center justify-between text-center transition-all"
                style={{
                  width: `${activeLabelSize.width * 5.2}px`,
                  minHeight: `${activeLabelSize.height * 4.6}px`,
                  maxWidth: '100%'
                }}
              >
                {/* Nom magasin */}
                {labelFields.storeName && (
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-700">
                    {storeName}
                  </div>
                )}

                {/* Nom produit */}
                {labelFields.productName && (
                  <div className="text-xs font-black text-slate-900 line-clamp-2 leading-tight">
                    {previewItem.name}
                  </div>
                )}

                {/* Code-barres SVG ou Prix Seul */}
                {labelType === 'price_only' ? (
                  <div className="my-auto py-2">
                    <span className="text-2xl font-black text-slate-900">
                      {Number(previewItem.price || 0).toLocaleString('fr-FR')} DA
                    </span>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center my-1">
                    <div
                      className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                      dangerouslySetInnerHTML={{ __html: previewBarcodeSvg }}
                    />
                    {labelFields.barcodeNumber && (
                      <div className="font-mono text-[11px] font-bold text-slate-800 tracking-wider mt-0.5">
                        {previewItem.barcode}
                      </div>
                    )}
                  </div>
                )}

                {/* Prix en bas si coché */}
                {labelFields.price && labelType !== 'price_only' && (
                  <div className="text-xs font-black text-slate-900 mt-1">
                    {Number(previewItem.price || 0).toLocaleString('fr-FR')} DA
                  </div>
                )}
              </div>

              {/* Légende sous l'aperçu */}
              <p className="text-[11px] text-slate-400 mt-2.5 font-medium text-center">
                {activeLabelSize.name} • Hauteur du code-barres (mm):{' '}
                {activeLabelSize.barcodeHeight} • {previewItem.name}
              </p>
            </div>

            {/* PARAMÈTRES D'ÉTIQUETTE */}
            {/* 1. Type d'étiquette */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'نوع الملصق' : "Type d'étiquette"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    labelType === 'barcode'
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="labelType"
                    checked={labelType === 'barcode'}
                    onChange={() => setLabelType('barcode')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs">{language === 'ar' ? 'باركود وسعر' : 'Code-barres'}</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    labelType === 'price_only'
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="labelType"
                    checked={labelType === 'price_only'}
                    onChange={() => setLabelType('price_only')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs">{language === 'ar' ? 'السعر فقط' : 'Prix seul'}</span>
                </label>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                {language === 'ar' ? '« السعر فقط » يطبع السعر بحجم كبير بدون خطوط باركود، ومناسب للبضائع غير المرمزة.' : "« Prix seul » Imprime le prix en grand sans code-barres et accepte les produits sans code-barres."}
              </p>
            </div>

            {/* 2. Taille de l'étiquette */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'مقاس الملصق' : "Taille de l'étiquette"}
              </label>
              <select
                value={selectedLabelSizeId}
                onChange={(e) => setSelectedLabelSizeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                {LABEL_SIZES.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Hauteur du code-barres automatique */}
            <div className="flex items-center justify-between py-1">
              <label
                htmlFor="autoHeightCheck"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {language === 'ar' ? 'ارتفاع الباركود تلقائي' : 'Hauteur du code-barres automatique'}
              </label>
              <input
                type="checkbox"
                id="autoHeightCheck"
                checked={autoBarcodeHeight}
                onChange={(e) => setAutoBarcodeHeight(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* 4. Contenu de l'étiquette */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-white">
                {language === 'ar' ? 'محتويات الملصق' : "Contenu de l'étiquette"}
              </label>
              <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelFields.storeName}
                    onChange={() => toggleLabelField('storeName')}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span>{language === 'ar' ? 'اسم المحل' : 'Nom du magasin'}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelFields.productName}
                    onChange={() => toggleLabelField('productName')}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span>{language === 'ar' ? 'اسم المنتج' : 'Nom du produit'}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelFields.price}
                    onChange={() => toggleLabelField('price')}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span>{language === 'ar' ? 'السعر' : 'Prix'}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelFields.priceType}
                    onChange={() => toggleLabelField('priceType')}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span>{language === 'ar' ? 'نوع السعر' : 'Type de prix'}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelFields.barcodeNumber}
                    onChange={() => toggleLabelField('barcodeNumber')}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span>{language === 'ar' ? 'أرقام الباركود' : 'Numéro du code-barres'}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelFields.variants}
                    onChange={() => toggleLabelField('variants')}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span>{language === 'ar' ? 'المقاس / اللون' : 'Variantes'}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelFields.discount}
                    onChange={() => toggleLabelField('discount')}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300"
                  />
                  <span>{language === 'ar' ? 'التخفيض' : 'Remise'}</span>
                </label>
              </div>
            </div>

            {/* 5. Prix imprimé */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'السعر المراد طباعته' : 'Prix imprimé'}
              </label>
              <select
                value={printedPriceType}
                onChange={(e) => setPrintedPriceType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="retail">{language === 'ar' ? 'سعر التجزئة (مفرق)' : 'Détail'}</option>
                <option value="wholesale">{language === 'ar' ? 'سعر الجملة' : 'Gros'}</option>
                <option value="semi_wholesale">{language === 'ar' ? 'سعر نصف الجملة' : 'Demi-gros'}</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                {language === 'ar' ? 'يطبق على كافة المنتجات إلا التي تم تعديل سعرها يدوياً في القائمة.' : "S'applique à toutes les lignes sauf celles dont le prix a été modifié manuellement."}
              </p>
            </div>

            {/* 6. Disposition */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'تخطيط الصفحة' : 'Disposition'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    pageLayout === 'single'
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="pageLayout"
                    checked={pageLayout === 'single'}
                    onChange={() => setPageLayout('single')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs">{language === 'ar' ? 'ملصق واحد لكل ورقة' : 'Une étiquette par page'}</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    pageLayout === 'sheet'
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="pageLayout"
                    checked={pageLayout === 'sheet'}
                    onChange={() => setPageLayout('sheet')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs">{language === 'ar' ? 'لوحة ملصقات متعددة (A4)' : 'Planche multiple'}</span>
                </label>
              </div>
            </div>

            {/* 7. Imprimante & Enregistrer par défaut (Image f62efd3d.png & 4c80c748.png) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 pb-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'الطابعة المحددة' : 'Imprimante'}
                </label>
                <div className="relative">
                  <select
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white outline-hidden shadow-2xs appearance-none cursor-pointer pr-10 rtl:pr-4 rtl:pl-10"
                  >
                    {availablePrinters.map((pr) => (
                      <option key={pr.name} value={pr.name}>
                        {pr.displayName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveDefaultPrinter}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.99]"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>{language === 'ar' ? 'تعيين كافتراضية' : 'Enregistrer par défaut'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALE : "Aperçu d'impression" (Image 2)                                  */}
      {/* ========================================================================= */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modale */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? 'معاينة الطباعة' : "Aperçu d'impression"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {totalLabelsCount} {language === 'ar' ? 'ملصقات' : 'étiquette(s)'} • {activeLabelSize.name}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrintAll}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'ar' ? 'طباعة' : 'Imprimer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Zone d'affichage des étiquettes (Image 2) */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950 flex flex-col items-center gap-6">
              {queue.map((item, idx) => {
                const code = item.barcode || '202634359005';
                const svg = generateCode128Svg(code, {
                  height: 38,
                  barWidth: 1.35,
                  showText: false
                });

                return Array.from({ length: item.quantity || 1 }).map((_, copyIdx) => (
                  <div
                    key={`${item.id}-${idx}-${copyIdx}`}
                    className="bg-white text-slate-900 rounded-lg shadow-lg p-3 flex flex-col items-center justify-between text-center transition-all"
                    style={{
                      width: `${activeLabelSize.width * 5.2}px`,
                      minHeight: `${activeLabelSize.height * 4.6}px`,
                      maxWidth: '100%'
                    }}
                  >
                    {labelFields.storeName && (
                      <div className="text-[10px] font-extrabold uppercase text-slate-700">
                        {storeName}
                      </div>
                    )}

                    {labelFields.productName && (
                      <div className="text-xs font-black text-slate-900 line-clamp-2 leading-tight">
                        {item.name}
                      </div>
                    )}

                    {labelType === 'price_only' ? (
                      <div className="my-auto py-2">
                        <span className="text-2xl font-black text-slate-900">
                          {Number(item.price || 0).toLocaleString('fr-FR')} DA
                        </span>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center justify-center my-1">
                        <div
                          className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                          dangerouslySetInnerHTML={{ __html: svg }}
                        />
                        {labelFields.barcodeNumber && (
                          <div className="font-mono text-[11px] font-bold text-slate-800 tracking-wider mt-0.5">
                            {code}
                          </div>
                        )}
                      </div>
                    )}

                    {labelFields.price && labelType !== 'price_only' && (
                      <div className="text-xs font-black text-slate-900 mt-1">
                        {Number(item.price || 0).toLocaleString('fr-FR')} DA
                      </div>
                    )}
                  </div>
                ));
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
