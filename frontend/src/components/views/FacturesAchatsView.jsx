import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Printer,
  FileText,
  Calendar,
  Building2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  Barcode,
  Package,
  Layers,
  Percent,
  Clock,
  Coins,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  X,
  Edit3,
  Sparkles,
  Camera
} from 'lucide-react';
import SmartInvoiceOcrModal from '../purchases/SmartInvoiceOcrModal';
import { INITIAL_SUPPLIER_PURCHASES, ensurePurchaseItems } from '../suppliers/SupplierHistoryModal';
import PurchaseDetailsModal from '../suppliers/PurchaseDetailsModal';
import AddProductModal from '../pos/AddProductModal';
import ModernToast from '../common/ModernToast';
import ConfirmDialog from '../common/ConfirmDialog';
import { printPurchaseInvoiceA4, triggerSilentIframePrint } from '../../services/thermalPrinter';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../../mock/posData';
import { useLanguage } from '../../i18n/LanguageContext';

const INITIAL_SUPPLIERS = [
  { id: 1, name: 'Grossiste Matériel & POS Algérie', phone: '0550 00 00 01', debt: 0 },
  { id: 2, name: 'Xprinter Algérie Officiel', phone: '0987 65 43 23', debt: 125000 },
  { id: 3, name: 'Candia Laiterie Algérie', phone: '025 88 99 00', debt: 47000 },
  { id: 4, name: 'Distributeur Boissons Hamoud Boualem', phone: '021 55 44 33', debt: 0 },
  { id: 5, name: 'Minoterie Safina & Céréales', phone: '031 99 88 77', debt: 0 }
];

export default function FacturesAchatsView({ onNavigate, autoOpenOcr = false }) {
  const { t, language } = useLanguage();
  // Mode liste vs Mode création
  const [isCreating, setIsCreating] = useState(false);

  // État du modal Scan Intelligent des Factures (Smart OCR IA)
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(autoOpenOcr);

  useEffect(() => {
    if (autoOpenOcr) {
      setIsOcrModalOpen(true);
    }
  }, [autoOpenOcr]);

  // État des Factures d'Achat (Migration automatique et enrichissement des articles)
  const [purchasesList, setPurchasesList] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_supplier_purchases');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return ensurePurchaseItems(parsed);
        }
      }
      return ensurePurchaseItems(INITIAL_SUPPLIER_PURCHASES);
    } catch {
      return ensurePurchaseItems(INITIAL_SUPPLIER_PURCHASES);
    }
  });

  // État des Fournisseurs
  const [suppliersList, setSuppliersList] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_suppliers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_SUPPLIERS;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  });

  // État des Produits
  const [productsList, setProductsList] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_products');
      return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
    } catch {
      return MOCK_PRODUCTS;
    }
  });

  // Synchronisation
  const reloadData = () => {
    try {
      const savedP = localStorage.getItem('novamag_supplier_purchases');
      if (savedP) setPurchasesList(ensurePurchaseItems(JSON.parse(savedP)));
      const savedS = localStorage.getItem('novamag_suppliers');
      if (savedS) setSuppliersList(JSON.parse(savedS));
      const savedProd = localStorage.getItem('novamag_products');
      if (savedProd) setProductsList(JSON.parse(savedProd));
    } catch {}
  };

  useEffect(() => {
    window.addEventListener('storage', reloadData);
    window.addEventListener('novamag_products_updated', reloadData);
    return () => {
      window.removeEventListener('storage', reloadData);
      window.removeEventListener('novamag_products_updated', reloadData);
    };
  }, []);

  // Enregistrement d'une facture validée depuis le Scan Intelligent IA
  const handleSaveOcrInvoice = (newInvoice) => {
    try {
      const updatedPurchases = [newInvoice, ...purchasesList];
      setPurchasesList(updatedPurchases);
      localStorage.setItem('novamag_supplier_purchases', JSON.stringify(updatedPurchases));

      // Mettre à jour les stocks dans novamag_products
      const currentProducts = JSON.parse(localStorage.getItem('novamag_products') || '[]');
      const updatedProducts = currentProducts.map((p) => {
        const itemInInvoice = (newInvoice.items || []).find(
          (it) => it.productId === p.id || (p.barcode && it.barcode && p.barcode === it.barcode)
        );
        if (itemInInvoice) {
          const addedQty = Number(itemInInvoice.quantity) || 0;
          return {
            ...p,
            stock: (Number(p.stock) || 0) + addedQty
          };
        }
        return p;
      });

      localStorage.setItem('novamag_products', JSON.stringify(updatedProducts));
      setProductsList(updatedProducts);

      try {
        window.dispatchEvent(new Event('novamag_products_updated'));
        window.dispatchEvent(new Event('novamag_supplier_purchases_updated'));
      } catch {}

      showToast(`✓ Facture IA « ${newInvoice.invoiceNumber} » validée avec succès ! Stocks mis à jour.`);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la validation de la facture IA', 'error');
    }
  };

  // Notifications Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Modale de confirmation personnalisée (remplace window.confirm)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Confirmation',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: () => {}
  });

  // Modale Détails d'une facture
  const [selectedPurchaseForDetails, setSelectedPurchaseForDetails] = useState(null);

  // Modale Ajout Rapide Nouveau Produit
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Recherche & Filtres dans la liste
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'UNPAID'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrage des factures
  const filteredPurchases = useMemo(() => {
    return purchasesList.filter((p) => {
      const unpaid = Number(p.unpaid ?? (Number(p.total || 0) - Number(p.paid || 0))) || 0;
      if (statusFilter === 'PAID' && unpaid > 0) return false;
      if (statusFilter === 'UNPAID' && unpaid <= 0) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        p.invoiceNumber?.toLowerCase().includes(q) ||
        p.supplierName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.dateStr?.toLowerCase().includes(q)
      );
    });
  }, [purchasesList, statusFilter, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / itemsPerPage));
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPurchases.slice(start, start + itemsPerPage);
  }, [filteredPurchases, currentPage]);

  // Suppression d'une facture
  const handleDeletePurchase = (purchase) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer la facture d'achat",
      message: `Êtes-vous sûr de vouloir supprimer définitivement la facture d'achat N° ${purchase.invoiceNumber} ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger',
      onConfirm: () => {
        const updated = purchasesList.filter((p) => p.id !== purchase.id);
        setPurchasesList(updated);
        try {
          localStorage.setItem('novamag_supplier_purchases', JSON.stringify(updated));
        } catch {}
        showToast(`Facture d'achat N° ${purchase.invoiceNumber} supprimée`, 'info');
      }
    });
  };

  // Impression Ticket Thermique Rapide
  const handlePrintThermal = (p) => {
    const sysSettings = (() => {
      try { return JSON.parse(localStorage.getItem('novamag_system_settings') || '{}'); } catch { return {}; }
    })();
    const storeName = sysSettings.storeName && !sysSettings.storeName.includes('لومينا') ? sysSettings.storeName : 'NovaMag POS';
    const paperWidth = Number(sysSettings.thermalPaperWidth) > 0 ? Number(sysSettings.thermalPaperWidth) : 80;
    const unpaid = Number(p.unpaid ?? (Number(p.total || 0) - Number(p.paid || 0))) || 0;

    // Récupérer les articles avec repli garanti
    const items = (Array.isArray(p.items) && p.items.length > 0)
      ? p.items
      : (ensurePurchaseItems([p])[0]?.items || [
          { name: p.description || 'Marchandise diverse', quantity: 1, unitPrice: Number(p.total || 0), total: Number(p.total || 0) }
        ]);

    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8" />
      <style>
        @page { margin: 0; size: ${paperWidth}mm auto; }
        body { font-family: monospace; margin: 0; padding: 5mm; font-size: 11px; }
        .center { text-align: center; }
        .bold { font-weight: 800; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .divider { border-top: 1px dashed #444; margin: 5px 0; }
      </style></head><body>
        <div class="center bold" style="font-size: 14px;">${storeName}</div>
        <div class="center" style="font-size: 10px; color: #555;">BON D'ACHAT FOURNISSEUR</div>
        <div class="center bold" style="font-size: 12px; margin-top: 3px;">N° ${p.invoiceNumber}</div>
        <div class="center" style="font-size: 10px; color: #666;">Date : ${p.dateStr}</div>
        <div class="divider"></div>
        <div><b>Fournisseur :</b> ${p.supplierName}</div>
        <div class="divider"></div>
        ${items.map((it) => `
          <div class="row">
            <span>${it.quantity}x ${it.name}</span>
            <span class="bold">${Number(it.total || 0).toLocaleString()} DA</span>
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="row bold" style="font-size: 13px;">
          <span>TOTAL ACHAT :</span>
          <span>${Number(p.total || 0).toLocaleString()} DA</span>
        </div>
        <div class="row" style="color: #059669;">
          <span>Payé :</span>
          <span>${Number(p.paid || 0).toLocaleString()} DA</span>
        </div>
        ${unpaid > 0 ? `
          <div class="row" style="color: #dc2626; font-weight: 800;">
            <span>Reste à Crédit :</span>
            <span>${unpaid.toLocaleString()} DA</span>
          </div>
        ` : ''}
      </body></html>
    `;
    triggerSilentIframePrint(html, sysSettings, {
      title: `Bon d'Achat #${p.invoiceNumber}`,
      format: 'thermal',
      widthMm: paperWidth
    });
  };

  // ══════════════════════════════════════════════════════════════════
  // ÉTAT DU FORMULAIRE DE CRÉATION / MODIFICATION DE FACTURE D'ACHAT
  // ══════════════════════════════════════════════════════════════════
  const [editingPurchaseId, setEditingPurchaseId] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliersList[0]?.id || 1);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [receptionDate, setReceptionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taxRate, setTaxRate] = useState(0); // TVA %
  const [shippingCost, setShippingCost] = useState(0); // Transport & Frais annexes
  const [amountPaidNow, setAmountPaidNow] = useState(0); // Montant payé maintenant
  const [dueDate, setDueDate] = useState(''); // Date d'échéance de la dette
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Articles dans la nouvelle facture
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Générer un numéro de facture par défaut lors de l'ouverture
  const handleOpenCreateForm = () => {
    setEditingPurchaseId(null);
    const nextNum = `BA-2026-${String(Math.floor(100 + purchasesList.length + 1)).padStart(4, '0')}`;
    setInvoiceNumberInput(nextNum);
    setReceptionDate(new Date().toISOString().slice(0, 10));
    setTaxRate(0);
    setShippingCost(0);
    setAmountPaidNow(0);
    setDueDate('');
    setPaymentMethod('Espèces');
    setInvoiceNotes('');
    setInvoiceItems([]);
    setProductSearchQuery('');
    setIsCreating(true);
  };

  // Ouvrir le formulaire en mode MODIFICATION avec pré-remplissage complet
  const handleOpenEditForm = (purchase) => {
    setEditingPurchaseId(purchase.id);
    setSelectedSupplierId(purchase.supplierId || suppliersList[0]?.id || 1);
    setInvoiceNumberInput(purchase.invoiceNumber || '');

    // Conversion de date sécurisée
    let formattedDate = new Date().toISOString().slice(0, 10);
    if (purchase.isoDate) {
      formattedDate = purchase.isoDate;
    } else if (purchase.dateStr && purchase.dateStr.includes('/')) {
      const parts = purchase.dateStr.split('/');
      if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    setReceptionDate(formattedDate);
    setTaxRate(Number(purchase.taxRate) || 0);
    setShippingCost(Number(purchase.shippingCost) || 0);
    setAmountPaidNow(Number(purchase.paid) || 0);
    setDueDate(purchase.dueDate || '');
    setPaymentMethod(purchase.paymentMethod || 'Espèces');
    setInvoiceNotes(purchase.notes || '');

    // Charger les articles avec prix, marges et quantités
    const loadedItems = (purchase.items || []).map((it, idx) => {
      const buyPrice = Number(it.unitPrice ?? it.buyPrice ?? it.price ?? 0);
      const sellPrice = Number(it.sellPrice ?? (buyPrice ? Math.round(buyPrice * 1.25) : 0));
      const wholesalePrice = Number(it.wholesalePrice ?? (sellPrice ? Math.round(sellPrice * 0.9) : 0));
      const margin = buyPrice > 0 ? Math.round(((sellPrice - buyPrice) / buyPrice) * 100) : 25;

      return {
        id: it.id || it.productId || Date.now() + idx,
        productId: it.productId || it.id || idx + 1,
        name: it.name || it.designation || 'Article',
        currentStock: it.currentStock ?? it.stock ?? 10,
        quantity: Number(it.quantity) || 1,
        buyPrice,
        marginPercent: Number(it.marginPercent ?? margin),
        sellPrice,
        wholesalePrice
      };
    });

    setInvoiceItems(loadedItems);
    setProductSearchQuery('');
    setSelectedPurchaseForDetails(null);
    setIsCreating(true);
  };

  // Produits filtrés pour la recherche
  const matchingProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return [];
    const q = productSearchQuery.toLowerCase().trim();
    return productsList.filter(
      (prod) =>
        prod.name?.toLowerCase().includes(q) ||
        prod.barcode?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [productsList, productSearchQuery]);

  // Ajouter un produit à la facture
  const handleAddProductToInvoice = (prod) => {
    const buyPrice = Number(prod.buyPrice || prod.costPrice || prod.price * 0.75 || 0);
    const sellPrice = Number(prod.price || 0);
    const wholesalePrice = Number(prod.wholesalePrice || sellPrice * 0.9 || 0);
    const margin = buyPrice > 0 ? Math.round(((sellPrice - buyPrice) / buyPrice) * 100) : 25;

    // Si déjà présent, incrémenter quantité
    const existingIndex = invoiceItems.findIndex((it) => it.productId === prod.id);
    if (existingIndex !== -1) {
      setInvoiceItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
    } else {
      setInvoiceItems((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          productId: prod.id,
          name: prod.name,
          barcode: prod.barcode || '',
          currentStock: Number(prod.stock || 0),
          quantity: 1,
          buyPrice,
          marginPercent: margin,
          sellPrice,
          wholesalePrice
        }
      ]);
    }
    setProductSearchQuery('');
    setIsSearchDropdownOpen(false);
  };

  // Modifier un article du tableau
  const handleItemFieldChange = (itemId, field, val) => {
    setInvoiceItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;

        const updated = { ...it, [field]: val };

        // Recalcul synchronisé Prix Achat / Marge / Prix Vente
        if (field === 'buyPrice' || field === 'marginPercent') {
          const bp = field === 'buyPrice' ? Number(val) : it.buyPrice;
          const mp = field === 'marginPercent' ? Number(val) : it.marginPercent;
          updated.sellPrice = Math.round(bp * (1 + mp / 100));
        } else if (field === 'sellPrice') {
          const sp = Number(val);
          if (it.buyPrice > 0) {
            updated.marginPercent = Math.round(((sp - it.buyPrice) / it.buyPrice) * 100);
          }
        }

        return updated;
      })
    );
  };

  // Supprimer un article de la facture
  const handleRemoveItem = (itemId) => {
    setInvoiceItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  // Calculs Financiers de la facture
  const subtotalHT = invoiceItems.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.buyPrice) || 0),
    0
  );
  const taxAmount = Math.round((subtotalHT * (Number(taxRate) || 0)) / 100);
  const netTotalToPay = subtotalHT + taxAmount + (Number(shippingCost) || 0);
  const currentUnpaidDebt = Math.max(0, netTotalToPay - (Number(amountPaidNow) || 0));

  // Enregistrement de la nouvelle facture d'achat
  const handleSavePurchaseInvoice = (e) => {
    e?.preventDefault();

    if (!selectedSupplierId) {
      showToast('Veuillez sélectionner un fournisseur.', 'warning');
      return;
    }
    if (invoiceItems.length === 0) {
      showToast('Veuillez ajouter au moins un produit à la facture.', 'warning');
      return;
    }
    if (!invoiceNumberInput.trim()) {
      showToast('Veuillez renseigner un numéro de facture (Bon).', 'warning');
      return;
    }

    const supplier = suppliersList.find((s) => String(s.id) === String(selectedSupplierId)) || {
      id: selectedSupplierId,
      name: 'Fournisseur Inconnu'
    };

    const newPurchaseRecord = {
      id: Date.now(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      invoiceNumber: invoiceNumberInput.trim(),
      description: `${invoiceItems.length} article(s) réceptionné(s)`,
      dateStr: receptionDate ? `${receptionDate.split('-')[2]}/${receptionDate.split('-')[1]}/${receptionDate.split('-')[0]}` : new Date().toLocaleDateString('fr-FR'),
      isoDate: receptionDate,
      timestamp: new Date().toISOString(),
      dueDate: dueDate || null,
      subtotal: subtotalHT,
      taxRate: Number(taxRate) || 0,
      taxAmount,
      shippingCost: Number(shippingCost) || 0,
      total: netTotalToPay,
      paid: Number(amountPaidNow) || 0,
      unpaid: currentUnpaidDebt,
      status: currentUnpaidDebt <= 0 ? 'PAID' : (Number(amountPaidNow) > 0 ? 'PARTIAL' : 'UNPAID'),
      paymentMethod,
      notes: invoiceNotes.trim(),
      items: invoiceItems.map((it) => ({
        productId: it.productId,
        name: it.name,
        quantity: Number(it.quantity),
        unitPrice: Number(it.buyPrice),
        sellPrice: Number(it.sellPrice),
        wholesalePrice: Number(it.wholesalePrice),
        marginPercent: Number(it.marginPercent),
        total: Number(it.quantity) * Number(it.buyPrice)
      }))
    };

    // 1. Sauvegarder ou Mettre à Jour la facture d'achat
    let updatedPurchases = [];

    if (editingPurchaseId) {
      const existingPurchase = purchasesList.find((p) => p.id === editingPurchaseId);
      const oldUnpaid = Number(existingPurchase?.unpaid ?? (Number(existingPurchase?.total || 0) - Number(existingPurchase?.paid || 0))) || 0;
      const debtDiff = currentUnpaidDebt - oldUnpaid;

      const updatedRecord = {
        ...(existingPurchase || {}),
        ...newPurchaseRecord,
        id: editingPurchaseId,
        timestamp: existingPurchase?.timestamp || newPurchaseRecord.timestamp
      };

      updatedPurchases = purchasesList.map((p) => (p.id === editingPurchaseId ? updatedRecord : p));

      // Ajuster la dette fournisseur selon la variation
      if (debtDiff !== 0) {
        try {
          const savedSuppliers = localStorage.getItem('novamag_suppliers');
          let sups = savedSuppliers ? JSON.parse(savedSuppliers) : suppliersList;
          const sIdx = sups.findIndex((s) => String(s.id) === String(supplier.id));
          if (sIdx !== -1) {
            sups[sIdx].debt = Math.max(0, (Number(sups[sIdx].debt) || 0) + debtDiff);
            setSuppliersList(sups);
            localStorage.setItem('novamag_suppliers', JSON.stringify(sups));
          }
        } catch {}
      }

      showToast(`✓ Facture d'achat N° ${invoiceNumberInput} modifiée avec succès !`, 'success');
    } else {
      updatedPurchases = [newPurchaseRecord, ...purchasesList];

      // 2. Mettre à jour automatiquement le Stock des produits (Augmentation du stock !)
      try {
        const savedProducts = localStorage.getItem('novamag_products');
        let prods = savedProducts ? JSON.parse(savedProducts) : productsList;
        invoiceItems.forEach((item) => {
          const pIdx = prods.findIndex((p) => p.id === item.productId);
          if (pIdx !== -1) {
            prods[pIdx].stock = (Number(prods[pIdx].stock) || 0) + Number(item.quantity);
            prods[pIdx].buyPrice = Number(item.buyPrice);
            prods[pIdx].costPrice = Number(item.buyPrice);
            prods[pIdx].price = Number(item.sellPrice);
            if (item.wholesalePrice) prods[pIdx].wholesalePrice = Number(item.wholesalePrice);
          }
        });
        setProductsList(prods);
        localStorage.setItem('novamag_products', JSON.stringify(prods));
        window.dispatchEvent(new Event('novamag_products_updated'));
      } catch (e) {
        console.error('Erreur mise à jour stock:', e);
      }

      // 3. Mettre à jour la dette du fournisseur si crédit restant
      if (currentUnpaidDebt > 0) {
        try {
          const savedSuppliers = localStorage.getItem('novamag_suppliers');
          let sups = savedSuppliers ? JSON.parse(savedSuppliers) : suppliersList;
          const sIdx = sups.findIndex((s) => String(s.id) === String(supplier.id));
          if (sIdx !== -1) {
            sups[sIdx].debt = (Number(sups[sIdx].debt) || 0) + currentUnpaidDebt;
            sups[sIdx].totalPurchases = (Number(sups[sIdx].totalPurchases) || 0) + netTotalToPay;
            setSuppliersList(sups);
            localStorage.setItem('novamag_suppliers', JSON.stringify(sups));
          }
        } catch {}
      }

      // 4. Mouvement de caisse sortant si payé en espèces
      if (Number(amountPaidNow) > 0 && paymentMethod === 'Espèces') {
        try {
          const savedCash = localStorage.getItem('novamag_cash_movements');
          const movements = savedCash ? JSON.parse(savedCash) : [];
          movements.unshift({
            id: Date.now(),
            type: 'OUT',
            category: 'ACHAT_FOURNISSEUR',
            amount: Number(amountPaidNow),
            description: `Paiement facture achat ${newPurchaseRecord.invoiceNumber} - ${supplier.name}`,
            timestamp: new Date().toISOString(),
            dateStr: newPurchaseRecord.dateStr
          });
          localStorage.setItem('novamag_cash_movements', JSON.stringify(movements));
        } catch {}
      }

      showToast(`✓ Facture d'achat ${newPurchaseRecord.invoiceNumber} enregistrée et stock mis à jour !`, 'success');
    }

    setPurchasesList(updatedPurchases);
    try {
      localStorage.setItem('novamag_supplier_purchases', JSON.stringify(updatedPurchases));
    } catch {}

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('novamag_purchases_updated'));
    setIsCreating(false);
    setEditingPurchaseId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F1F4F9] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 select-none">
      
      {/* ══════════════════════════════════════════════════════════════════
          VUE 1 : REGISTRE DES FACTURES D'ACHAT (CONFORME PHOTO 1)
         ══════════════════════════════════════════════════════════════════ */}
      {!isCreating ? (
        <div className="flex-1 flex flex-col p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* En-tête Principal (Photo 1) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Actions à Gauche : Nouvelle Facture & Scanner IA */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.8]" />
                <span>{language === 'ar' ? '+ فاتورة شراء جديدة' : '+ Nouvelle Facture d\'Achat'}</span>
              </button>

              {/* Scanner Facture IA désactivé temporairement
              <button
                type="button"
                onClick={() => setIsOcrModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse stroke-[2.5]" />
                <span>{language === 'ar' ? '📷 مسح الفاتورة بالذكاء الاصطناعي ✨' : '📷 Scanner Facture IA ✨'}</span>
              </button>
              */}
            </div>

            {/* Titre & Sous-titre à Droite */}
            <div className="text-left sm:text-right">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center sm:justify-end gap-2.5">
                <span>{language === 'ar' ? 'سجل فواتير الشراء' : 'Registre des Factures d\'Achat'}</span>
                <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {language === 'ar'
                  ? 'متابعة السلع والكميات المستلمة من الموردين والمدفوعات'
                  : 'Suivi des marchandises et quantités réceptionnées des fournisseurs'}
              </p>
            </div>

          </div>

          {/* Barre de Recherche et Filtres */}
          <div className="bg-white dark:bg-[#111C35] p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث برقم الفاتورة، المورد...' : 'Rechercher par N° facture, fournisseur...'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'ar' ? 'الكل' : 'Toutes'} ({purchasesList.length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('PAID'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'PAID'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'ar' ? 'مسددة' : 'Payées'}
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('UNPAID'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'UNPAID'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'ar' ? 'آجلة (باقي للدفع)' : 'À Crédit (Reste à payer)'}
              </button>
            </div>
          </div>

          {/* Tableau Conforme à la Photo 1 - Hauteur Compacte & Équilibrée */}
          <div className="bg-white dark:bg-[#111C35] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-[#F8FAFC] dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-b border-slate-200/90 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-center w-32">{language === 'ar' ? 'رقم الفاتورة' : 'N° Facture'}</th>
                    <th className="py-2.5 px-3 font-bold text-left rtl:text-right">{language === 'ar' ? 'المورد / التاريخ' : 'Fournisseur / Date'}</th>
                    <th className="py-2.5 px-3 font-bold text-center w-32">{language === 'ar' ? 'المبلغ الإجمالي' : 'Montant Total'}</th>
                    <th className="py-2.5 px-3 font-bold text-center w-28 text-blue-600 dark:text-blue-400">{language === 'ar' ? 'المدفوع' : 'Payé'}</th>
                    <th className="py-2.5 px-3 font-bold text-center w-36 text-rose-600 dark:text-rose-400">{language === 'ar' ? 'الباقي / الرصيد' : 'Reste / Solde'}</th>
                    <th className="py-2.5 px-3 font-bold text-center w-40">{language === 'ar' ? 'الطباعة والإجراءات' : 'Impression & Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {paginatedPurchases.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-slate-400 font-medium">
                        Aucune facture d'achat trouvée.
                      </td>
                    </tr>
                  ) : (
                    paginatedPurchases.map((p, idx) => {
                      const total = Number(p.total || 0);
                      const paid = Number(p.paid || 0);
                      const unpaid = Number(p.unpaid ?? (total - paid)) || 0;
                      const itemCount = p.items?.length || 0;
                      const supplierObj = suppliersList.find((s) => String(s.id) === String(p.supplierId));
                      const isEven = idx % 2 === 0;

                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors ${
                            isEven 
                              ? 'bg-white dark:bg-[#111C35]' 
                              : 'bg-slate-100 dark:bg-[#19264c]'
                          } hover:bg-emerald-50/70 dark:hover:bg-slate-800/80`}
                        >
                          {/* N° Facture */}
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-800 dark:text-white">
                            {p.invoiceNumber || `BA-${p.id}`}
                          </td>

                          {/* Fournisseur / Date (Compact) */}
                          <td className="py-2 px-3">
                            <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                              {p.supplierName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 leading-none">
                              <span>{p.dateStr || p.timestamp?.slice(0, 10)}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono font-bold text-[9.5px]">
                                {itemCount} article{itemCount > 1 ? 's' : ''}
                              </span>
                            </div>
                          </td>

                          {/* Montant Total */}
                          <td className="py-2 px-3 text-center font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                          </td>

                          {/* Payé (En Bleu - Compact) */}
                          <td className="py-2 px-3 text-center font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                            {paid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                          </td>

                          {/* Reste / Solde (En Rouge/Rose - Compact) */}
                          <td className="py-2 px-3 text-center">
                            <div className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400 leading-tight">
                              {unpaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                            </div>
                            <div className="text-[9.5px] text-slate-400 leading-none mt-0.5">
                              {p.dueDate ? `Échéance : ${p.dueDate}` : 'Aucune date d\'échéance'}
                            </div>
                          </td>

                          {/* Impression & Actions (Pilules compactes) */}
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1. Bouton Impression A4 */}
                              <button
                                type="button"
                                onClick={() => {
                                  const sysSettings = (() => {
                                    try { return JSON.parse(localStorage.getItem('novamag_system_settings') || '{}'); } catch { return {}; }
                                  })();
                                  printPurchaseInvoiceA4(p, supplierObj, sysSettings);
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40 transition-all cursor-pointer shadow-2xs"
                                title="Imprimer la Facture A4"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              {/* 2. Bouton Impression Ticket */}
                              <button
                                type="button"
                                onClick={() => handlePrintThermal(p)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 transition-all cursor-pointer shadow-2xs"
                                title="Imprimer le Ticket Thermique"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* 3. Bouton Voir Détails */}
                              <button
                                type="button"
                                onClick={() => setSelectedPurchaseForDetails(p)}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 transition-all cursor-pointer shadow-2xs"
                                title="Consulter les détails du bon"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* 4. Bouton Modifier */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(p)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 transition-all cursor-pointer shadow-2xs"
                                title="Modifier cette facture d'achat"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* 5. Supprimer */}
                              <button
                                type="button"
                                onClick={() => handleDeletePurchase(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                title="Supprimer la facture"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Pagination en bas */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Précédent
              </button>

              <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                Page {currentPage} sur {totalPages}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Suivant
              </button>
            </div>

          </div>

        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           VUE 2 : FORMULAIRE DE CRÉATION DE FACTURE D'ACHAT (PHOTO 2)
           ══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col h-full overflow-hidden p-3.5 sm:p-4 space-y-3">
          
          {/* En-tête Supérieur Formulaire (Conforme Photo 2) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            
            {/* Bouton d'Enregistrement Vert à Gauche (Photo 2) */}
            <button
              type="button"
              onClick={handleSavePurchaseInvoice}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 transition-all cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4 stroke-[2.4]" />
              <span>{editingPurchaseId ? 'Enregistrer les Modifications' : 'Enregistrer la Facture & Mettre à jour le Stock'}</span>
            </button>

            {/* Titre & Sous-titre à Droite avec Flèche Retour (Photo 2) */}
            <div className="flex items-center gap-3 text-left sm:text-right">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center sm:justify-end gap-2">
                  <span>{editingPurchaseId ? 'Modification Facture d\'Achat' : 'Création Facture d\'Achat'}</span>
                  {editingPurchaseId && (
                    <span className="text-[10.5px] px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-mono font-bold">
                      {invoiceNumberInput}
                    </span>
                  )}
                </h1>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {editingPurchaseId ? 'Modifiez les quantités, prix ou données de la facture' : 'Le stock sera automatiquement mis à jour ⚡'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingPurchaseId(null);
                }}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Retour à la liste"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.4]" />
              </button>
            </div>

          </div>

          {/* Disposition en 2 Colonnes (Conforme Photo 2) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
            
            {/* ══ COLONNE GAUCHE (8/12 ou 9/12 sur grand écran) : CATALOGUE PRODUITS & TABLEAU D'ARTICLES ══ */}
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col bg-white dark:bg-[#111C35] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-3.5 space-y-3 min-h-0">
              
              {/* Barre Supérieure : Bouton Nouveau Produit + Recherche Produit avec Code-barres */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  {language === 'ar' ? '+ منتج جديد' : '+ Nouveau Produit'}
                </button>

                <div className="relative flex-1">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'البحث عن منتج وتحديده (بالاسم أو الباركود)...' : 'Rechercher et sélectionner un produit (Nom ou Code-barres)...'}
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setIsSearchDropdownOpen(true);
                      }}
                      onFocus={() => setIsSearchDropdownOpen(true)}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium outline-none focus:border-emerald-500"
                    />
                    <Barcode className="w-5 h-5 text-slate-400 absolute right-3 pointer-events-none" />
                  </div>

                  {/* Dropdown d'auto-complétion produits */}
                  {isSearchDropdownOpen && matchingProducts.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {matchingProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleAddProductToInvoice(p)}
                          className="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-800 dark:text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Code: {p.barcode || 'N/A'} • Stock actuel: <strong className="text-slate-600 dark:text-slate-300">{p.stock || 0}</strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-600">
                              {(p.buyPrice || p.costPrice || p.price * 0.75).toLocaleString()} DA
                            </span>
                            <span className="text-[10px] text-slate-400 block">Prix Achat estimé</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tableau des Articles Ajoutés (Conforme Photo 1 - Style Pilules Pastel & 100% Visible Sans Défilement) */}
              <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8FAFC] dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold text-[11px]">
                      <tr>
                        <th className="py-2 px-2.5 align-middle">Produit</th>
                        <th className="py-2 px-1 text-center w-16 align-middle">Qté</th>
                        <th className="py-2 px-1 text-center w-22 align-middle leading-tight">
                          <div>Prix Achat</div>
                          <div className="text-[9px] font-semibold text-slate-400">Unité</div>
                        </th>
                        <th className="py-2 px-1 text-center w-16 align-middle">Marge %</th>
                        <th className="py-2 px-1 text-center w-24 align-middle leading-tight">
                          <div>Prix Vente</div>
                          <div className="text-[9.5px] font-extrabold text-emerald-600 dark:text-emerald-400">Proposé</div>
                        </th>
                        <th className="py-2 px-1 text-center w-22 align-middle leading-tight">
                          <div>Prix de</div>
                          <div className="text-[9.5px] font-extrabold text-amber-600 dark:text-amber-400">Gros</div>
                        </th>
                        <th className="py-2 px-2 text-right w-24 align-middle">Sous-Total</th>
                        <th className="py-2 px-1 text-center w-9 align-middle"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {invoiceItems.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-16 text-center text-slate-400 font-medium">
                            <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                            <div>Sélectionnez des produits depuis la barre supérieure pour les ajouter à la facture</div>
                          </td>
                        </tr>
                      ) : (
                        invoiceItems.map((it, itIdx) => {
                          const rowTotal = (Number(it.quantity) || 0) * (Number(it.buyPrice) || 0);
                          const isEven = itIdx % 2 === 0;

                          return (
                            <tr 
                              key={it.id} 
                              className={`transition-colors ${
                                isEven ? 'bg-white dark:bg-[#111C35]' : 'bg-slate-50/70 dark:bg-[#162347]'
                              } hover:bg-emerald-50/40 dark:hover:bg-slate-800/60`}
                            >
                              {/* Nom Produit & Code */}
                              <td className="py-2 px-2.5">
                                <div className="font-bold text-slate-800 dark:text-white truncate max-w-[140px] sm:max-w-[170px] leading-tight" title={it.name}>
                                  {it.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Stock: {it.currentStock}
                                </div>
                              </td>

                              {/* Quantité (Champ arrondi centré - Photo 1) */}
                              <td className="py-2 px-1 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={it.quantity}
                                  onChange={(e) =>
                                    handleItemFieldChange(it.id, 'quantity', Math.max(1, Number(e.target.value)))
                                  }
                                  className="w-14 px-1 py-1 text-center font-mono text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                                />
                              </td>

                              {/* Prix Achat Unité (Champ arrondi centré - Photo 1) */}
                              <td className="py-2 px-1 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="10"
                                  value={it.buyPrice}
                                  onChange={(e) =>
                                    handleItemFieldChange(it.id, 'buyPrice', Math.max(0, Number(e.target.value)))
                                  }
                                  className="w-20 px-1 py-1 text-center font-mono text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                                />
                              </td>

                              {/* Marge % (Avec symbole % stylé en filigrane - Photo 1) */}
                              <td className="py-2 px-1 text-center">
                                <div className="relative inline-flex items-center justify-center">
                                  <input
                                    type="number"
                                    value={it.marginPercent}
                                    onChange={(e) =>
                                      handleItemFieldChange(it.id, 'marginPercent', Number(e.target.value))
                                    }
                                    className="w-14 pl-4 pr-1 py-1 text-center font-mono text-xs font-bold rounded-xl border border-blue-200/80 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 outline-none focus:border-blue-500"
                                  />
                                  <span className="absolute left-1.5 text-[10px] text-blue-400 font-bold pointer-events-none select-none">%</span>
                                </div>
                              </td>

                              {/* Prix Vente Conseillé (Pilule verte pastel douce - Photo 1) */}
                              <td className="py-2 px-1 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="10"
                                  value={it.sellPrice}
                                  onChange={(e) =>
                                    handleItemFieldChange(it.id, 'sellPrice', Math.max(0, Number(e.target.value)))
                                  }
                                  className="w-20 px-1 py-1 text-center font-mono text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-800 bg-[#E6F9F0] dark:bg-emerald-950/50 text-[#065F46] dark:text-emerald-300 outline-none focus:border-emerald-500 shadow-2xs"
                                />
                              </td>

                              {/* Prix de Gros (Pilule jaune/ambre pastel douce - Photo 1) */}
                              <td className="py-2 px-1 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="10"
                                  value={it.wholesalePrice}
                                  onChange={(e) =>
                                    handleItemFieldChange(it.id, 'wholesalePrice', Math.max(0, Number(e.target.value)))
                                  }
                                  className="w-20 px-1 py-1 text-center font-mono text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-800 bg-[#FEF9E7] dark:bg-amber-950/50 text-[#92400E] dark:text-amber-300 outline-none focus:border-amber-500 shadow-2xs"
                                />
                              </td>

                              {/* Sous-Total (Montant en gras - Photo 1) */}
                              <td className="py-2 px-2 text-right font-mono font-black text-xs text-slate-800 dark:text-white whitespace-nowrap">
                                {rowTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                              </td>

                              {/* Action Supprimer (Bouton carré blanc avec bordure - Photo 1) */}
                              <td className="py-2 px-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(it.id)}
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
                                  title="Supprimer la ligne"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Barre récapitulative bas de tableau */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">
                    {invoiceItems.length} article(s) dans cette facture
                  </span>
                  <div className="font-mono font-black text-slate-900 dark:text-white">
                    Sous-Total Brut : {subtotalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </div>
                </div>
              </div>

            </div>

            {/* ══ COLONNE DROITE (4/12 ou 3/12 sur grand écran) : COÛTS, PAIEMENT & METADONNÉES ══ */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col justify-between h-full min-h-0 space-y-2.5 overflow-y-auto lg:overflow-y-visible">
              
              {/* Carte 1 : Données de Base de la Facture (Compacte) */}
              <div className="bg-white dark:bg-[#111C35] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs space-y-2 shrink-0">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Données de la Facture
                </span>

                {/* Fournisseur */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5 truncate h-4 leading-4">
                    Fournisseur
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {suppliersList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.phone ? `(${s.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* N° Facture / Bon & Date de Réception (En 2 Colonnes pour un gain de place vertical) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label 
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5 truncate h-4 leading-4"
                      title="N° Facture (Bon)"
                    >
                      N° Facture (Bon)
                    </label>
                    <input
                      type="text"
                      placeholder="INV-2026-001"
                      value={invoiceNumberInput}
                      onChange={(e) => setInvoiceNumberInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label 
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5 truncate h-4 leading-4"
                      title="Date de Réception"
                    >
                      Date Réception
                    </label>
                    <input
                      type="date"
                      value={receptionDate}
                      onChange={(e) => setReceptionDate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Carte 2 : Calcul Coûts & Paiement (Alignement parfait sur la même ligne) */}
              <div className="bg-white dark:bg-[#111C35] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xs space-y-2 shrink-0">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Coûts & Règlement
                </span>

                {/* TVA % et Transport (Alignés sur la même ligne exacte avec labels calibrés) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col">
                    <label 
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 truncate leading-4 h-4 block"
                      title="Taxe / TVA (%)"
                    >
                      Taxe / TVA (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label 
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 truncate leading-4 h-4 block"
                      title="Transport / Frais (DA)"
                    >
                      Frais Transport (DA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 text-right rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Montant Payé Maintenant */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate h-4 leading-4">
                      Montant Payé (DA)
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmountPaidNow(netTotalToPay)}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Payer la totalité
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={amountPaidNow}
                    onChange={(e) => setAmountPaidNow(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 text-right rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Date d'Échéance & Mode de règlement (En 2 colonnes compactes) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label 
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5 truncate h-4 leading-4"
                      title="Date d'Échéance de la Dette"
                    >
                      Échéance Dette
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label 
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5 truncate h-4 leading-4"
                      title="Mode de Règlement"
                    >
                      Règlement
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Espèces">Espèces</option>
                      <option value="Virement Bancaire">Virement</option>
                      <option value="Chèque">Chèque</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ══ CARTE SOMBRE RÉCAPITULATIF TOTAUX (PHOTO 2 & 3 - VISIBLE SANS SCROLL) ══ */}
              <div className="bg-[#111C35] text-white rounded-2xl p-3 border border-slate-800 shadow-md space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Net à Payer
                  </span>
                  <div className="text-xl font-black font-mono text-blue-400">
                    {netTotalToPay.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 text-[11px]">
                    Dette Restante Générée :
                  </span>
                  <div className={`font-mono font-black text-xs ${
                    currentUnpaidDebt > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {currentUnpaidDebt > 0 
                      ? `${currentUnpaidDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA` 
                      : '0,00 DA (Payé ✓)'}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ══ MODALE DÉTAILS D'UN BON D'ACHAT ══ */}
      <PurchaseDetailsModal
        isOpen={Boolean(selectedPurchaseForDetails)}
        purchase={selectedPurchaseForDetails}
        supplier={suppliersList.find((s) => String(s.id) === String(selectedPurchaseForDetails?.supplierId))}
        onClose={() => setSelectedPurchaseForDetails(null)}
        onEdit={handleOpenEditForm}
        onDelete={(deletedP) => {
          setSelectedPurchaseForDetails(null);
          reloadData();
          showToast(`Facture d'achat N° ${deletedP.invoiceNumber} supprimée`, 'info');
        }}
        onPurchaseUpdated={(updatedP) => {
          setSelectedPurchaseForDetails(updatedP);
          reloadData();
        }}
      />

      {/* ══ MODALE AJOUT RAPIDE NOUVEAU PRODUIT ══ */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        categories={MOCK_CATEGORIES}
        onClose={() => setIsAddProductModalOpen(false)}
        onSave={(newProd) => {
          const updated = [newProd, ...productsList];
          setProductsList(updated);
          try {
            localStorage.setItem('novamag_products', JSON.stringify(updated));
            window.dispatchEvent(new Event('novamag_products_updated'));
          } catch {}
          handleAddProductToInvoice(newProd);
          setIsAddProductModalOpen(false);
          showToast(`✓ Produit "${newProd.name}" créé et ajouté à la facture !`);
        }}
      />

      {/* ══ MODALE SCAN INTELLIGENT DES FACTURES IA (SMART OCR) ══ */}
      {isOcrModalOpen && (
        <SmartInvoiceOcrModal
          isOpen={isOcrModalOpen}
          onClose={() => {
            setIsOcrModalOpen(false);
            if (autoOpenOcr && onNavigate) {
              onNavigate('purchases');
            }
          }}
          onSaveInvoice={handleSaveOcrInvoice}
          catalogProducts={productsList}
          suppliersList={suppliersList}
        />
      )}

      {/* Notification Toast */}
      <ModernToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Modal de Confirmation Élégante (Remplace window.confirm) */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={() => {
          confirmDialog.onConfirm && confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
