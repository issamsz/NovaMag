import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Barcode,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  X,
  ShoppingBag,
  Save,
  Check,
  Printer,
  ChevronRight,
  Package
} from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import ModernToast from '../common/ModernToast';
import { printBarcodeLabelDirect } from '../../services/labelPrinter';
import { useLanguage } from '../../i18n/LanguageContext';
import { MOCK_PRODUCTS, sanitizeProductsWithRealNames, sanitizePacksWithRealNames } from '../../mock/posData';

export const DEFAULT_PACKS = [
  {
    id: 'pack_1',
    name: 'Pack Informatique PC Portable + Accessoires',
    barcode: '202664380155',
    price: 43000,
    buyPrice: 38000,
    description: 'Pack complet : PC Portable Dell Vostro 15 avec ensemble Clavier & Souris sans fil Logitech',
    status: 'visible',
    items: [
      {
        productId: '2',
        productName: 'Souris & Clavier Sans Fil Logitech MK270 Pro',
        barcode: '202634359005',
        quantity: 1,
        buyPrice: 2000,
        price: 3200
      },
      {
        productId: '1',
        productName: 'PC Portable Dell Vostro 15 (Core i5 8Go)',
        barcode: '202611157366',
        quantity: 1,
        buyPrice: 36000,
        price: 39800
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'pack_2',
    name: 'Pack Caisse Enregistreuse POS Complète',
    barcode: '202677891234',
    price: 34500,
    buyPrice: 28500,
    description: 'Pack équipement caisse : Lecteur Code-barres Sans Fil + Imprimante Ticket 80mm + Tiroir Caisse RJ11',
    status: 'visible',
    items: [
      {
        productId: 1,
        productName: 'Lecteur Code-barres USB Sans Fil',
        barcode: '6130001001',
        quantity: 1,
        buyPrice: 9000,
        price: 12000
      },
      {
        productId: 10,
        productName: 'Imprimante Ticket Thermique 80mm USB',
        barcode: '6130001010',
        quantity: 1,
        buyPrice: 11000,
        price: 15500
      },
      {
        productId: 17,
        productName: 'Tiroir-Caisse Métallique RJ11 Pro',
        barcode: '6130001017',
        quantity: 1,
        buyPrice: 6500,
        price: 8500
      }
    ],
    createdAt: new Date().toISOString()
  }
];

export default function PacksView({ onNavigate }) {
  const { language, isRTL, t } = useLanguage();
  // 1. Liste des packs sauvegardés (nettoyés avec des vrais produits)
  const [packs, setPacks] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_packs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizePacksWithRealNames(parsed);
          if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
            try {
              localStorage.setItem('novamag_packs', JSON.stringify(sanitized));
            } catch (e) {}
          }
          return sanitized;
        }
      }
      localStorage.setItem('novamag_packs', JSON.stringify(DEFAULT_PACKS));
      return DEFAULT_PACKS;
    } catch {
      return DEFAULT_PACKS;
    }
  });

  // 2. Liste des produits du stock pour composer les packs (nettoyés avec des vrais produits)
  const [stockProducts, setStockProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_products');
      const raw = saved ? JSON.parse(saved) : MOCK_PRODUCTS;
      const sanitized = sanitizeProductsWithRealNames(raw);
      return sanitized;
    } catch {
      return MOCK_PRODUCTS;
    }
  });

  // 3. Paramètres système (imprimantes, DA, etc.)
  const [systemSettings, setSystemSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Écoute des synchronisations inter-onglets et événements globaux
  useEffect(() => {
    const handleSync = () => {
      try {
        const savedPacks = localStorage.getItem('novamag_packs');
        if (savedPacks) setPacks(sanitizePacksWithRealNames(JSON.parse(savedPacks)));
        const savedProducts = localStorage.getItem('novamag_products');
        if (savedProducts) setStockProducts(sanitizeProductsWithRealNames(JSON.parse(savedProducts)));
        const savedSettings = localStorage.getItem('novamag_system_settings');
        if (savedSettings) setSystemSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Erreur synchronisation packs :', e);
      }
    };

    window.addEventListener('novamag_packs_updated', handleSync);
    window.addEventListener('novamag_products_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('novamag_packs_updated', handleSync);
      window.removeEventListener('novamag_products_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Sauvegarde des packs avec dispatch d'événement
  const savePacksToStorage = (newPacks) => {
    setPacks(newPacks);
    try {
      localStorage.setItem('novamag_packs', JSON.stringify(newPacks));
      window.dispatchEvent(new Event('novamag_packs_updated'));
    } catch (e) {
      console.error('Erreur sauvegarde packs :', e);
    }
  };

  // Toast & Confirm State
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [packToEdit, setPackToEdit] = useState(null);

  // Modal Form Inputs
  const [packName, setPackName] = useState('');
  const [packBarcode, setPackBarcode] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  // Product Search inside Modal
  const [productSearch, setProductSearch] = useState('');

  // Générateur de code-barres aléatoire 12 chiffres
  const generateNewBarcode = () => {
    const code = '2026' + Math.floor(10000000 + Math.random() * 90000000);
    setPackBarcode(code);
    showToast(`Nouveau code-barres généré : ${code}`, 'info');
  };

  // Ouvrir la modale en mode Création
  const handleOpenAddModal = () => {
    setPackToEdit(null);
    setPackName('');
    setPackBarcode('2026' + Math.floor(10000000 + Math.random() * 90000000));
    setSellingPrice('');
    setPurchasePrice('');
    setDescription('');
    setSelectedItems([]);
    setProductSearch('');
    setIsModalOpen(true);
  };

  // Ouvrir la modale en mode Modification
  const handleOpenEditModal = (pack) => {
    setPackToEdit(pack);
    setPackName(pack.name || '');
    setPackBarcode(pack.barcode || '');
    setSellingPrice(pack.price ? String(pack.price) : '');
    setPurchasePrice(pack.buyPrice ? String(pack.buyPrice) : '');
    setDescription(pack.description || '');
    setSelectedItems(
      Array.isArray(pack.items)
        ? pack.items.map((it) => ({
            productId: it.productId || it.id,
            productName: it.productName || it.name,
            barcode: it.barcode || '',
            quantity: Number(it.quantity) || 1,
            price: Number(it.price || it.sellingPrice) || 0,
            buyPrice: Number(it.buyPrice || it.purchasePrice) || 0
          }))
        : []
    );
    setProductSearch('');
    setIsModalOpen(true);
  };

  // Toggle statut Visible / Caché
  const handleToggleStatus = (packId) => {
    const updated = packs.map((p) => {
      if (p.id === packId) {
        const nextStatus = p.status === 'visible' ? 'hidden' : 'visible';
        showToast(
          `Statut du pack mis à jour : ${nextStatus === 'visible' ? 'Visible' : 'Caché'}`,
          'info'
        );
        return { ...p, status: nextStatus };
      }
      return p;
    });
    savePacksToStorage(updated);
  };

  // Imprimer l'étiquette code-barres du pack
  const handlePrintBarcode = (pack) => {
    try {
      printBarcodeLabelDirect(
        {
          name: pack.name,
          barcode: pack.barcode,
          price: pack.price,
          priceType: 'Pack'
        },
        systemSettings || {}
      );
      showToast(`Impression étiquette code-barres : ${pack.barcode}`, 'success');
    } catch (err) {
      showToast(`Erreur d'impression : ${err.message}`, 'error');
    }
  };

  // Supprimer un pack avec confirmation
  const handleDeletePack = (pack) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer le pack ?',
      message: `Voulez-vous vraiment supprimer définitivement le pack "${pack.name}" (${pack.barcode}) ?`,
      onConfirm: () => {
        const updated = packs.filter((p) => p.id !== pack.id);
        savePacksToStorage(updated);
        showToast(`Le pack "${pack.name}" a été supprimé`, 'warning');
      }
    });
  };

  // Filtrage des produits pour la recherche dans la modale
  const matchingStockProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase().trim();
    return stockProducts.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
    ).slice(0, 10);
  }, [productSearch, stockProducts]);

  // Ajouter un produit à la composition du pack
  const handleAddProductToPack = (product) => {
    const existingIndex = selectedItems.findIndex(
      (it) => String(it.productId) === String(product.id)
    );

    if (existingIndex >= 0) {
      // Si déjà présent, on incrémente la quantité
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
      showToast(`Quantité augmentée pour ${product.name}`, 'info');
    } else {
      // Sinon on l'ajoute avec quantité 1
      const newItem = {
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        quantity: 1,
        price: Number(product.price || product.sellingPrice) || 0,
        buyPrice: Number(product.purchasePrice || product.cost || product.buyPrice) || 0
      };
      setSelectedItems([...selectedItems, newItem]);
      showToast(`"${product.name}" ajouté au pack`, 'success');
    }
  };

  // Modifier la quantité d'un produit sélectionné
  const handleUpdateQuantity = (productId, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    setSelectedItems((prev) =>
      prev.map((it) =>
        String(it.productId) === String(productId) ? { ...it, quantity: qty } : it
      )
    );
  };

  // Retirer un produit de la sélection
  const handleRemoveProductFromPack = (productId) => {
    setSelectedItems((prev) =>
      prev.filter((it) => String(it.productId) !== String(productId))
    );
  };

  // Calculs dynamiques de la composition
  const totalCalculatedBuyPrice = useMemo(() => {
    return selectedItems.reduce(
      (acc, it) => acc + (it.buyPrice || 0) * (it.quantity || 1),
      0
    );
  }, [selectedItems]);

  const totalCalculatedSellPrice = useMemo(() => {
    return selectedItems.reduce(
      (acc, it) => acc + (it.price || 0) * (it.quantity || 1),
      0
    );
  }, [selectedItems]);

  // Sauvegarder le pack (Création ou Mise à jour)
  const handleSavePack = (e) => {
    e?.preventDefault();

    if (!packName.trim()) {
      showToast('Veuillez renseigner le nom du pack', 'warning');
      return;
    }

    if (!packBarcode.trim()) {
      showToast('Veuillez renseigner ou générer un code-barres', 'warning');
      return;
    }

    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Veuillez renseigner un prix de vente valide', 'warning');
      return;
    }

    if (selectedItems.length === 0) {
      showToast('Veuillez sélectionner au moins un produit pour composer le pack', 'warning');
      return;
    }

    const buyPriceNum = parseFloat(purchasePrice) || totalCalculatedBuyPrice || 0;

    if (packToEdit) {
      // Modification
      const updated = packs.map((p) => {
        if (p.id === packToEdit.id) {
          return {
            ...p,
            name: packName.trim(),
            barcode: packBarcode.trim(),
            price: priceNum,
            buyPrice: buyPriceNum,
            description: description.trim(),
            items: selectedItems,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      savePacksToStorage(updated);
      showToast(`Le pack "${packName}" a été mis à jour avec succès`, 'success');
    } else {
      // Création
      const newPack = {
        id: `pack_${Date.now()}`,
        name: packName.trim(),
        barcode: packBarcode.trim(),
        price: priceNum,
        buyPrice: buyPriceNum,
        description: description.trim(),
        status: 'visible',
        items: selectedItems,
        createdAt: new Date().toISOString()
      };
      savePacksToStorage([...packs, newPack]);
      showToast(`Le nouveau pack "${packName}" a été créé avec succès`, 'success');
    }

    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto p-6 md:p-8">
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

      {/* En-tête de la Page (Image 3) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            {language === 'ar' ? 'إدارة الحزم والمجموعات' : 'Gestion des Packs'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar' ? 'تجميع عدة منتجات في عرض واحد بسعر خاص' : 'Regroupez plusieurs produits dans une offre à prix spécial'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'ar' ? 'إضافة حزمة جديدة +' : 'Ajouter un nouveau pack'}</span>
        </button>
      </div>

      {/* Tableau des Packs (Image 3) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-4 px-6">{language === 'ar' ? 'اسم الحزمة' : 'Nom du pack'}</th>
                <th className="py-4 px-6">{language === 'ar' ? 'الباركود' : 'Code-barres'}</th>
                <th className="py-4 px-6 text-center">{language === 'ar' ? 'عدد المنتجات' : 'Nombre de produits'}</th>
                <th className="py-4 px-6 text-blue-600 dark:text-blue-400 font-semibold text-center">
                  {language === 'ar' ? 'سعر البيع' : 'Prix de Vente'}
                </th>
                <th className="py-4 px-6 text-center">{language === 'ar' ? 'الحالة' : 'Statut'}</th>
                <th className="py-4 px-6 text-right rtl:text-left">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {packs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Boxes className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-base font-medium text-slate-600 dark:text-slate-300">
                      {language === 'ar' ? 'لا توجد حزم مسجلة حالياً' : 'Aucun pack enregistré pour le moment'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'ar' ? 'انقر على "إضافة حزمة جديدة" لتكوين أول عرض مجمع لك' : 'Cliquez sur "Ajouter un nouveau pack" pour composer votre première offre groupée'}
                    </p>
                  </td>
                </tr>
              ) : (
                packs.map((pack) => {
                  const isVisible = pack.status !== 'hidden';
                  const itemsCount = pack.items?.length || 0;
                  const compositionSummary = pack.items
                    ?.map((it) => `${it.productName || it.name} x${it.quantity || 1}`)
                    .join(', ');

                  return (
                    <tr
                      key={pack.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Nom du pack + Composition sous le titre */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {pack.name}
                        </div>
                        {compositionSummary && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                            {compositionSummary}
                          </div>
                        )}
                      </td>

                      {/* Code-barres */}
                      <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-300 font-medium">
                        {pack.barcode}
                      </td>

                      {/* Nombre de produits badge */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
                          {itemsCount} {language === 'ar' ? 'منتجات' : (itemsCount > 1 ? 'Produits' : 'Produit')}
                        </span>
                      </td>

                      {/* Prix de Vente */}
                      <td className="py-4 px-6 text-center font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">
                        {Number(pack.price || 0).toFixed(2)} DA
                      </td>

                      {/* Statut Badge */}
                      <td className="py-4 px-6 text-center">
                        {isVisible ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'نشط / مرئي' : 'Visible'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'مخفي' : 'Caché'}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right rtl:text-left">
                        <div className="inline-flex items-center justify-end gap-2">
                          {/* Toggle Visibilité */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(pack.id)}
                            title={isVisible ? (language === 'ar' ? 'إخفاء الحزمة' : 'Masquer le pack') : (language === 'ar' ? 'إظهار الحزمة' : 'Rendre visible')}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              isVisible
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Imprimer Étiquette Code-barres */}
                          <button
                            type="button"
                            onClick={() => handlePrintBarcode(pack)}
                            title={language === 'ar' ? 'طباعة ملصق الباركود' : "Imprimer l'étiquette code-barres"}
                            className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 transition-colors cursor-pointer"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>

                          {/* Modifier */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(pack)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'تعديل' : 'Modifier'}</span>
                          </button>

                          {/* Supprimer */}
                          <button
                            type="button"
                            onClick={() => handleDeletePack(pack)}
                            title={language === 'ar' ? 'حذف الحزمة' : 'Supprimer le pack'}
                            className="p-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-500 dark:bg-slate-900 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
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
      {/* MODALE : "Ajouter un nouveau pack" / "Modifier le pack" (Images 1 & 2)     */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn select-none">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {packToEdit ? (language === 'ar' ? 'تعديل الحزمة' : 'Modifier le pack') : (language === 'ar' ? 'إضافة حزمة جديدة' : 'Ajouter un nouveau pack')}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                  {language === 'ar' ? 'اختر المنتجات والكميات لتكوين الحزمة' : 'Choisissez les produits et les quantités pour créer le pack'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Top Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nom du pack */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'اسم الحزمة' : 'Nom du pack'}
                  </label>
                  <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: حزمة أجهزة كمبيوتر' : 'Ex: pack pc'}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-medium"
                    autoFocus
                  />
                </div>

                {/* Code-barres avec bouton générateur */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'الباركود' : 'Code-barres'}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={packBarcode}
                      onChange={(e) => setPackBarcode(e.target.value)}
                      placeholder="Ex: 202664380155"
                      className="w-full pr-11 pl-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-800 dark:text-white placeholder-slate-400 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                    <button
                      type="button"
                      onClick={generateNewBarcode}
                      title={language === 'ar' ? 'توليد باركود جديد' : 'Générer un nouveau code-barres'}
                      className="absolute right-1.5 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Barcode className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Prix de Vente * */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'سعر البيع' : 'Prix de Vente'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="Ex: 43000"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 placeholder-slate-400 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                {/* Prix d'Achat */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'سعر الشراء' : "Prix d'Achat"}
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="Ex: 38000"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: حزمة جهاز لابتوب مع لوحة مفاتيح وفأرة لاسلكية' : 'Ex: Pack pc laptop et sourie clavier son fil'}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              {/* Section : Produits du pack (Image 1 & 2) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    {language === 'ar' ? 'المنتجات المكونة للحزمة' : 'Produits du pack'}
                  </span>
                </div>

                {/* Input de recherche de produit (Live search) */}
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={language === 'ar' ? 'بحث عن منتج في المخزون بالاسم أو الباركود...' : 'Rechercher un article du stock par nom ou code-barres...'}
                    className="w-full pl-4 pr-10 rtl:pl-10 rtl:pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Dropdown / Liste des résultats de recherche (Image 2) */}
                {productSearch.trim().length > 0 && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-2 max-h-56 overflow-y-auto space-y-1">
                    {matchingStockProducts.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        {language === 'ar' ? 'لم يتم العثور على أي منتج مطابق' : 'Aucun produit correspondant trouvé'}
                      </div>
                    ) : (
                      matchingStockProducts.map((p) => {
                        const isAlreadyAdded = selectedItems.some(
                          (it) => String(it.productId) === String(p.id)
                        );
                        const priceDisplay = Number(p.price || p.sellingPrice || 0).toFixed(2);

                        return (
                          <div
                            key={p.id}
                            onClick={() => handleAddProductToPack(p)}
                            className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                              isAlreadyAdded
                                ? 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-700/60'
                                : 'hover:bg-blue-50/60 dark:hover:bg-slate-700/80'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-800 dark:text-white">
                                {p.name}
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                {p.barcode} • {priceDisplay} DA
                              </div>
                            </div>

                            {isAlreadyAdded ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 px-2 py-0.5 rounded-md">
                                {language === 'ar' ? 'مضاف' : 'added'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                              >
                                {language === 'ar' ? '+ إضافة' : '+ Ajouter'}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Liste des produits sélectionnés dans le pack (Image 2) */}
                <div className="space-y-2 pt-1">
                  {selectedItems.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                      {language === 'ar' ? 'اكتب كلمة بحث أو امسح الباركود أعلاه لإضافة منتجات إلى الحزمة' : 'Tapez un mot-clé ou code-barres ci-dessus pour ajouter des articles au pack'}
                    </div>
                  ) : (
                    selectedItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl"
                      >
                        {/* Infos produit */}
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-white">
                            {item.productName}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            {Number(item.price || 0).toFixed(2)} DA / unit
                          </div>
                        </div>

                        {/* Quantité & Bouton Supprimer */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{language === 'ar' ? 'الكمية:' : 'Quantité:'}</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(item.productId, e.target.value)
                              }
                              className="w-16 px-2.5 py-1 text-center font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-hidden focus:border-blue-500"
                            />
                            <span>{language === 'ar' ? 'قطعة' : 'unit'}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveProductFromPack(item.productId)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title={language === 'ar' ? 'إزالة من الحزمة' : 'Retirer du pack'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Carte Résumé Vert Pastel (Image 2) */}
                {selectedItems.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 space-y-1.5 mt-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      <span>{language === 'ar' ? "إجمالي سعر الشراء :" : "Total prix d'achat :"}</span>
                      <span className="font-mono">{totalCalculatedBuyPrice.toFixed(2)} DA</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      <span>{language === 'ar' ? 'إجمالي سعر البيع :' : 'Total prix de vente :'}</span>
                      <span className="font-mono">{totalCalculatedSellPrice.toFixed(2)} DA</span>
                    </div>

                    {/* Raccourci pour copier ces totaux aux champs prix du pack */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSellingPrice(String(totalCalculatedSellPrice));
                          setPurchasePrice(String(totalCalculatedBuyPrice));
                          showToast(language === 'ar' ? 'تم تطبيق المجاميع على أسعار الحزمة' : 'Totaux appliqués aux prix du pack', 'info');
                        }}
                        className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {language === 'ar' ? 'تطبيق هذه المجاميع كأسعار للحزمة' : 'Appliquer ces totaux comme prix du pack'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (Image 1 & 2) */}
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
                onClick={handleSavePack}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'ar' ? 'حفظ الحزمة' : 'Enregistrer le pack'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
