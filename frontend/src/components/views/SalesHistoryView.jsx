import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Receipt, Search, Filter, Printer, Eye, RotateCcw, Trash2,
  Calendar, User, DollarSign, FileText, ShoppingBag, Truck,
  BarChart3, ChevronDown, Check, X, Clock, ArrowLeft, Download,
  Share2, Tag, SlidersHorizontal, RefreshCw, Layers
} from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import { generateCode128Svg } from '../../services/barcodeGenerator';
import {
  printThermalTicketDirect,
  printSaleInvoiceA4,
  printDeliveryNoteA4,
  printDeliveryNoteThermal,
  printSaleInvoiceA5,
  triggerSilentIframePrint,
  printSalesSummaryReportA4,
  numberToFrenchWords
} from '../../services/thermalPrinter';
import { sanitizeSalesWithRealNames } from '../../mock/posData';
import { useLanguage } from '../../i18n/LanguageContext';
import { playSaleValidationSound } from '../../services/soundService';

// =========================================================================
// DONNÉES DE SECOURS PAR DÉFAUT (SI LOCALSTORAGE EST INITIALEMENT VIDE)
// =========================================================================
const DEFAULT_SALES = [
  {
    id: 5,
    invoiceNumber: 'INV-5',
    timestamp: '2026-11-08T15:21:43.000Z',
    dateStr: '08/11/2026 15:21:43',
    customer: 'Client Comptoir (Espèces)',
    customerPhone: '',
    cashier: 'Admin',
    paymentMethod: 'especes',
    total: 3200,
    subtotal: 3200,
    discount: 0,
    items: [
      { id: 'p2', name: 'Souris & Clavier Sans Fil Logitech MK270 Pro', category: 'Périphériques Caisse', family: 'Accessoires & Périphériques', quantity: 1, price: 3200, total: 3200, barcode: 'S-5' }
    ]
  },
  {
    id: 4,
    invoiceNumber: 'INV-4',
    timestamp: '2026-11-08T15:19:48.000Z',
    dateStr: '08/11/2026 15:19:48',
    customer: 'Client Comptoir (Espèces)',
    customerPhone: '',
    cashier: 'Admin',
    paymentMethod: 'especes',
    total: 5200,
    subtotal: 5200,
    discount: 0,
    items: [
      { id: 'p1', name: 'PC Portable Dell Vostro 15 (Core i5 8Go 512Go SSD)', category: 'Matériel Informatique', family: 'Ordinateurs & Portables', quantity: 2, price: 2600, total: 5200, barcode: 'S-4' }
    ]
  },
  {
    id: 3,
    invoiceNumber: 'INV-3',
    timestamp: '2026-11-08T15:19:09.000Z',
    dateStr: '08/11/2026 15:19:09',
    customer: 'Hamid Supérette & Cafétéria',
    customerPhone: '0555 12 34 56',
    cashier: 'Admin',
    paymentMethod: 'especes',
    total: 5200,
    subtotal: 5200,
    discount: 0,
    items: [
      { id: 'p1', name: 'PC Portable Dell Vostro 15 (Core i5 8Go 512Go SSD)', category: 'Matériel Informatique', family: 'Ordinateurs & Portables', quantity: 2, price: 2600, total: 5200, barcode: 'S-3' }
    ]
  }
];

export default function SalesHistoryView({ onNavigate, currentUser: propCurrentUser }) {
  const { t, language, isRTL } = useLanguage();

  // Utilisateur connecté courant
  const currentUser = useMemo(() => {
    if (propCurrentUser) return propCurrentUser;
    try {
      const raw = localStorage.getItem('novamag_user');
      return raw ? JSON.parse(raw) : { name: 'Admin', role: 'admin' };
    } catch {
      return { name: 'Admin', role: 'admin' };
    }
  }, [propCurrentUser]);

  // 1. Liste des ventes enregistrées
  const [sales, setSales] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_sales_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizeSalesWithRealNames(parsed);
          if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
            try {
              localStorage.setItem('novamag_sales_history', JSON.stringify(sanitized));
            } catch (e) {}
          }
          return sanitized;
        }
      }
      localStorage.setItem('novamag_sales_history', JSON.stringify(DEFAULT_SALES));
      return DEFAULT_SALES;
    } catch {
      return DEFAULT_SALES;
    }
  });

  // Synchronisation dynamique
  const handleSync = useCallback(() => {
    try {
      const saved = localStorage.getItem('novamag_sales_history');
      if (saved) setSales(sanitizeSalesWithRealNames(JSON.parse(saved)));
    } catch {}
  }, []);

  useEffect(() => {
    window.addEventListener('storage', handleSync);
    window.addEventListener('novamag_sales_updated', handleSync);
    window.addEventListener('novamag_cash_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('novamag_sales_updated', handleSync);
      window.removeEventListener('novamag_cash_updated', handleSync);
    };
  }, [handleSync]);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('info');
  const showToast = (msg, type = 'info') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Paramètres système (Nom de magasin, imprimantes...)
  const sysSettings = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('novamag_system_settings') || '{}');
    } catch {
      return {};
    }
  }, []);

  // 2. Filtres
  const [searchInvoiceNum, setSearchInvoiceNum] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // 3. Modales
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null); // Modal Détails de la vente (Photo 2)
  const [selectedSaleForPrintCenter, setSelectedSaleForPrintCenter] = useState(null); // Modal Centre d'impression (Photo 3)
  const [deliveryModalData, setDeliveryModalData] = useState(null); // Modal Détails de livraison (Photos 4 & 5)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false); // Modal Récapitulatif (Bouton Vert Photo 1)

  // Champs de la modale de livraison
  const [deliveryDriver, setDeliveryDriver] = useState('');
  const [deliveryPlate, setDeliveryPlate] = useState('');
  const [deliveryDesignType, setDeliveryDesignType] = useState('A4'); // 'A4' | 'A5' | 'thermal'

  // Boîte de dialogue de confirmation (Suppression sécurisée)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Confirmation',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: () => {}
  });

  // Liste des clients uniques pour le filtre
  const customerOptions = useMemo(() => {
    const set = new Set();
    sales.forEach((s) => {
      if (s.customer) set.add(s.customer);
    });
    // Ajouter aussi les clients enregistrés
    try {
      const savedClients = localStorage.getItem('novamag_clients');
      if (savedClients) {
        JSON.parse(savedClients).forEach((c) => {
          if (c.name) set.add(c.name);
        });
      }
    } catch {}
    return Array.from(set);
  }, [sales]);

  // Liste des utilisateurs / caissiers uniques pour le filtre
  const userOptions = useMemo(() => {
    const set = new Set();
    sales.forEach((s) => {
      const clean = (s.cashier && s.cashier !== 'BZ Technology') ? s.cashier : 'Admin';
      set.add(clean);
    });
    set.add('Admin');
    return Array.from(set);
  }, [sales]);

  // 4. Filtrage dynamique des ventes
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Recherche numéro de commande / facture
      if (searchInvoiceNum.trim()) {
        const q = searchInvoiceNum.trim().toLowerCase();
        const num = (s.invoiceNumber || `INV-${s.id}`).toLowerCase();
        if (!num.includes(q)) return false;
      }

      // Filtre Client
      if (filterCustomer !== 'all') {
        if (!s.customer || s.customer.toLowerCase() !== filterCustomer.toLowerCase()) return false;
      }

      // Filtre Utilisateur
      if (filterUser !== 'all') {
        const u = (s.cashier && s.cashier !== 'BZ Technology') ? s.cashier : 'Admin';
        if (u.toLowerCase() !== filterUser.toLowerCase()) return false;
      }

      // Filtre Date "Du"
      if (filterDateFrom) {
        const sDate = new Date(s.timestamp || s.dateStr || 0);
        const limitFrom = new Date(`${filterDateFrom}T00:00:00`);
        if (sDate < limitFrom) return false;
      }

      // Filtre Date "Au"
      if (filterDateTo) {
        const sDate = new Date(s.timestamp || s.dateStr || 0);
        const limitTo = new Date(`${filterDateTo}T23:59:59.999`);
        if (sDate > limitTo) return false;
      }

      // Filtres Avancés
      if (filterPaymentMethod !== 'all') {
        const method = (s.paymentMethod || 'especes').toLowerCase();
        if (filterPaymentMethod === 'especes' && !method.includes('esp') && !method.includes('cash')) return false;
        if (filterPaymentMethod === 'carte' && !method.includes('card') && !method.includes('cart')) return false;
        if (filterPaymentMethod === 'credit' && !method.includes('credit') && !method.includes('dette')) return false;
      }

      if (minAmount && Number(s.total || 0) < Number(minAmount)) return false;
      if (maxAmount && Number(s.total || 0) > Number(maxAmount)) return false;

      return true;
    });
  }, [sales, searchInvoiceNum, filterCustomer, filterUser, filterDateFrom, filterDateTo, filterPaymentMethod, minAmount, maxAmount]);

  // Statistiques calculées sur les ventes filtrées (Pour le Récapitulatif)
  const salesSummary = useMemo(() => {
    const totalCA = filteredSales.reduce((acc, s) => acc + Number(s.total || 0), 0);
    const totalCount = filteredSales.length;
    const totalArticles = filteredSales.reduce((acc, s) => {
      const items = s.items || [];
      return acc + items.reduce((sub, it) => sub + Number(it.quantity || 1), 0);
    }, 0);
    const avgBasket = totalCount > 0 ? (totalCA / totalCount) : 0;

    let cashTotal = 0;
    let cardTotal = 0;
    let creditTotal = 0;

    filteredSales.forEach((s) => {
      const m = (s.paymentMethod || 'especes').toLowerCase();
      const tot = Number(s.total || 0);
      if (m.includes('card') || m.includes('cart')) cardTotal += tot;
      else if (m.includes('credit') || m.includes('dette')) creditTotal += tot;
      else cashTotal += tot;
    });

    const totalPaid = filteredSales.reduce((acc, s) => {
      const saleTotal = Number(s.total || 0);
      if (s.amountPaid !== undefined) {
        return acc + Math.min(Number(s.amountPaid || 0), saleTotal);
      }
      return acc + (s.paymentMethod === 'credit' ? 0 : saleTotal);
    }, 0);

    const remainingDebt = Math.max(0, totalCA - totalPaid);

    return { totalCA, totalCount, totalArticles, avgBasket, cashTotal, cardTotal, creditTotal, totalPaid, remainingDebt };
  }, [filteredSales]);

  // 5. Actions sur une vente
  // a) Restaurer pour Modification (Charge les articles dans le panier du POS)
  const handleRestoreForModification = (sale) => {
    try {
      const itemsToRestore = (sale.items || []).map((it) => ({
        id: it.id || it.productId || `p-${Date.now()}-${Math.random()}`,
        productId: it.productId || it.id,
        name: it.name || it.designation || 'Article',
        price: Number(it.price || it.unitPrice || 0),
        unitPrice: Number(it.unitPrice || it.price || 0),
        quantity: Number(it.quantity || 1),
        barcode: it.barcode || '',
        category: it.category || 'Général',
        total: Number(it.total || ((it.quantity || 1) * (it.price || it.unitPrice || 0)))
      }));

      // Sauvegarde dans le panier POS actif
      localStorage.setItem('novamag_ticket_items', JSON.stringify(itemsToRestore));
      localStorage.setItem('novamag_editing_invoice', JSON.stringify(sale));
      window.dispatchEvent(new Event('novamag_restore_sale'));
      playSaleValidationSound();

      showToast(language === 'ar' ? `✓ تمت استعادة الفاتورة ${sale.invoiceNumber || sale.id} إلى السلة للتعديل` : `✓ Facture ${sale.invoiceNumber || sale.id} restaurée dans le panier`, 'success');

      // Basculer vers la page du Point de Vente
      if (onNavigate) {
        onNavigate('pos');
      }
    } catch {
      showToast(language === 'ar' ? "حدث خطأ أثناء استعادة الفاتورة" : "Erreur lors de la restauration de la vente", 'error');
    }
  };

  // b) Supprimer la vente
  const handleDeleteSale = (sale) => {
    const invNum = sale.invoiceNumber || `INV-${sale.id}`;
    setConfirmDialog({
      isOpen: true,
      title: language === 'ar' ? "حذف الفاتورة" : "Supprimer la vente",
      message: language === 'ar'
        ? `هل أنت متأكد من رغبتك في حذف الفاتورة رقم ${invNum} بمبلغ ${Number(sale.total || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} دج؟ لا يمكن التراجع عن هذه العملية.`
        : `Êtes-vous certain de vouloir supprimer la vente N° ${invNum} d'un montant de ${Number(sale.total || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA ? Cette opération est irréversible.`,
      confirmText: language === 'ar' ? "تأكيد الحذف" : "Supprimer la Vente",
      cancelText: language === 'ar' ? "إلغاء" : "Annuler",
      type: "danger",
      onConfirm: () => {
        setSales((prev) => {
          const updated = prev.filter((s) => s.id !== sale.id);
          try {
            localStorage.setItem('novamag_sales_history', JSON.stringify(updated));
            window.dispatchEvent(new Event('novamag_sales_updated'));
            window.dispatchEvent(new Event('novamag_cash_updated'));
          } catch {}
          return updated;
        });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(language === 'ar' ? `✓ تم حذف الفاتورة رقم ${invNum} بنجاح` : `✓ Vente N° ${invNum} supprimée avec succès`, 'info');
      }
    });
  };

  // c) Initier un retour depuis le panier POS (nouvelle méthode)
  const handleInitiateReturn = (sale) => {
    try {
      const itemsToLoad = (sale.items || []).map((it) => ({
        id: it.id || it.productId || `p-${Date.now()}-${Math.random()}`,
        productId: it.productId || it.id,
        name: it.name || it.designation || 'Article',
        price: Number(it.price || it.unitPrice || 0),
        unitPrice: Number(it.unitPrice || it.price || 0),
        quantity: Number(it.quantity || 1),
        barcode: it.barcode || '',
        category: it.category || 'Général',
        total: Number(it.total || ((it.quantity || 1) * (it.price || it.unitPrice || 0)))
      }));
      localStorage.setItem('novamag_ticket_items', JSON.stringify(itemsToLoad));
      localStorage.setItem('novamag_editing_invoice', JSON.stringify({ ...sale, isReturnMode: true }));
      window.dispatchEvent(new Event('novamag_restore_sale'));
      showToast(`✓ Retour initié pour ${sale.invoiceNumber || sale.id} — supprimez les articles non rendus puis cliquez sur Rembourser`, 'success');
      if (onNavigate) onNavigate('pos');
    } catch {
      showToast('Erreur lors de l\'initialisation du retour', 'error');
    }
  };

  // Formatage monétaire
  const formatMoney = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 select-none">

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold animate-slideDown flex items-center gap-2 ${
          toastType === 'success' ? 'bg-emerald-600 text-white border-emerald-500' :
          toastType === 'error' ? 'bg-rose-600 text-white border-rose-500' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 1. ZONE SUPÉRIEURE FIXE : EN-TÊTE & FILTRES RAPIDES     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-7 pb-2 shrink-0 space-y-4">
        
        {/* En-tête principal (Photo 1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {language === 'ar' ? 'سجل المبيعات' : 'Historique des Ventes'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'ar' ? 'عرض ومتابعة كافة المبيعات والعمليات السابقة' : 'Consulter et suivre les ventes précédentes'}
                </p>
              </div>
            </div>
          </div>

          {/* Boutons d'Action Haut Droite (Conforme Photo 1) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Bouton Filtres Avancés */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                showAdvancedFilters
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>{language === 'ar' ? 'تصفية متقدمة' : 'Filtres Avancés'}</span>
              {(filterPaymentMethod !== 'all' || minAmount || maxAmount) && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              )}
            </button>

            {/* Bouton Filtrer / Rafraîchir */}
            <button
              type="button"
              onClick={handleSync}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer active:scale-98"
            >
              <Filter className="w-4 h-4 stroke-[2.2]" />
              <span>{language === 'ar' ? 'تصفية' : 'Filtrer'}</span>
            </button>

            {/* Bouton Récapitulatif (Bouton Vert Conforme Photo 1) */}
            <button
              type="button"
              onClick={() => setIsSummaryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00A86B] hover:bg-[#00925D] text-white rounded-xl text-xs font-black shadow-sm shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
            >
              <BarChart3 className="w-4 h-4 stroke-[2.4]" />
              <span>{language === 'ar' ? 'ملخص' : 'Récapitulatif'}</span>
            </button>

          </div>
        </div>

        {/* Barre des filtres rapides (Conforme Photo 1) */}
        <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
            
            {/* 1. Numéro de Commande */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'رقم الطلب / الفاتورة' : 'Numéro de Commande'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'رقم الطلب...' : 'Numéro de Commande'}
                  value={searchInvoiceNum}
                  onChange={(e) => setSearchInvoiceNum(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-hidden focus:border-blue-500 font-medium transition-all"
                />
                {searchInvoiceNum && (
                  <button
                    type="button"
                    onClick={() => setSearchInvoiceNum('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Client */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'العميل' : 'Client'}
              </label>
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-hidden focus:border-blue-500 font-medium transition-all cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'جميع العملاء' : 'Tous les clients'}</option>
                {customerOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 3. Utilisateur */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'المستخدم' : 'Utilisateur'}
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-hidden focus:border-blue-500 font-medium transition-all cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'جميع المستخدمين' : 'Tous les utilisateurs'}</option>
                {userOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* 4. Du (Date début) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'من' : 'Du'}
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-hidden focus:border-blue-500 font-medium transition-all cursor-pointer"
              />
            </div>

            {/* 5. Au (Date fin) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'إلى' : 'Au'}
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-hidden focus:border-blue-500 font-medium transition-all cursor-pointer"
              />
            </div>

          </div>

          {/* Filtres Avancés supplémentaires déroulants */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3.5 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'طريقة الدفع' : 'Mode de Paiement'}
                </label>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium cursor-pointer"
                >
                  <option value="all">{language === 'ar' ? 'جميع الطرق' : 'Tous les modes'}</option>
                  <option value="especes">{language === 'ar' ? 'نقداً فقط' : 'Espèces uniquement'}</option>
                  <option value="carte">{language === 'ar' ? 'بطاقة ذهبية / بنكية' : 'Carte bancaire'}</option>
                  <option value="credit">{language === 'ar' ? 'دفع آجل / دين' : 'Ventes à crédit / Dette'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'المبلغ الأدنى (دج)' : 'Montant Minimum (DA)'}
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'ar' ? 'المبلغ الأقصى (دج)' : 'Montant Maximum (DA)'}
                </label>
                <input
                  type="number"
                  placeholder="Ex. 50000"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 2. ZONE CONTENANT LE TABLEAU : DÉFILEMENT VERTICAL FLUIDE */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-7 pt-1 pb-20 space-y-4">
        
        {/* 3. TABLEAU DES VENTES (CONFORME PHOTO 1) */}
        <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs border-collapse">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center w-28">{language === 'ar' ? 'رقم البيع' : 'Vente N°'}</th>
                  <th className="py-3.5 px-4 w-40">{language === 'ar' ? 'التاريخ والوقت' : 'Date & Heure'}</th>
                  <th className="py-3.5 px-4">{language === 'ar' ? 'العميل' : 'Client'}</th>
                  <th className="py-3.5 px-4 text-center w-24">{language === 'ar' ? 'الكمية' : 'Quantité'}</th>
                  <th className="py-3.5 px-4 text-center w-32">{language === 'ar' ? 'الإجمالي (دج)' : 'Total (DA)'}</th>
                  <th className="py-3.5 px-4 text-center min-w-[430px] w-[430px]">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-bold">{language === 'ar' ? 'لا توجد مبيعات مطابقة لمعايير البحث.' : 'Aucune vente ne correspond à vos critères.'}</p>
                      <p className="text-xs text-slate-400 mt-1">{language === 'ar' ? 'يرجى تعديل فلاتر البحث أعلاه.' : 'Modifiez les filtres de recherche ci-dessus.'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale, idx) => {
                    const invNum = sale.invoiceNumber || `INV-${sale.id}`;
                    const totalQty = (sale.items || []).reduce((acc, it) => acc + Number(it.quantity || 1), 0);
                    const isCleanCash = sale.paymentMethod === 'especes' || !sale.paymentMethod;
                    const isEven = idx % 2 === 0;

                    return (
                      <tr 
                        key={sale.id} 
                        className={`transition-colors ${
                          isEven 
                            ? 'bg-white dark:bg-[#111C35]' 
                            : 'bg-slate-100/80 dark:bg-[#1A2648]'
                        } hover:bg-blue-100/60 dark:hover:bg-blue-900/40`}
                      >
                        
                        {/* Vente N° */}
                        <td className="py-4 px-4 font-mono font-bold text-center text-slate-800 dark:text-slate-200">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="font-black">{invNum}</span>
                            {sale.refInvoice && (
                              <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                Réf: {sale.refInvoice}
                              </span>
                            )}
                            {(sale.type === 'return' || Number(sale.total) < 0) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                {language === 'ar' ? 'مرتجع' : 'Bon de Retour'}
                              </span>
                            )}
                            {sale.status === 'partial_return' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                {language === 'ar' ? 'مرتجع جزئي' : `Retour Partiel (-${formatMoney(sale.refundedAmount || 0)} DA)`}
                              </span>
                            )}
                            {sale.status === 'refunded' && sale.type !== 'return' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                {language === 'ar' ? 'مسترجع بالكامل' : 'Totalement Remboursé'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date & Heure */}
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {sale.dateStr || (sale.timestamp ? new Date(sale.timestamp).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR') : '—')}
                        </td>

                        {/* Client (Organisé sur 2 lignes) */}
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900 dark:text-white leading-tight">
                              {sale.customer || (language === 'ar' ? 'زبون عابر (نقدي)' : 'Client Comptoir')}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                              {isCleanCash ? (language === 'ar' ? '(نقدا)' : '(Espèces)') : `(${sale.paymentMethod || (language === 'ar' ? 'نقدا' : 'Espèces')})`}
                            </span>
                          </div>
                        </td>

                        {/* Quantité */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {totalQty}
                        </td>

                        {/* Total (DA) */}
                        <td className={`py-3 px-4 text-center font-mono font-black text-sm whitespace-nowrap ${
                          (sale.type === 'return' || sale.status === 'refunded' || Number(sale.total) < 0)
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {Number(sale.total) < 0
                            ? `- ${formatMoney(Math.abs(sale.total))}`
                            : formatMoney(sale.total)}
                        </td>

                        {/* Actions : Exactement conforme à la photo du modèle */}
                        <td className="py-2.5 px-3 text-center align-middle whitespace-nowrap min-w-[430px] w-[430px]">
                          <div className="flex items-center justify-center gap-2 mx-auto flex-nowrap shrink-0">
                            
                            {/* 1. Imprimer */}
                            <button
                              type="button"
                              onClick={() => setSelectedSaleForPrintCenter(sale)}
                              className="h-11 px-3.5 rounded-2xl bg-[#EEF4FF] dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-97 select-none shrink-0"
                              title={language === 'ar' ? 'طباعة الفاتورة أو الوصل' : 'Imprimer'}
                            >
                              <Printer className="w-4 h-4 stroke-[2.2]" />
                              <span>{language === 'ar' ? 'طباعة' : 'Imprimer'}</span>
                            </button>

                            {/* 2. Voir Détails (👁️) */}
                            <button
                              type="button"
                              onClick={() => setSelectedSaleDetail(sale)}
                              className="w-11 h-11 rounded-2xl bg-[#FFFBEB] dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-97 select-none shrink-0"
                              title={language === 'ar' ? 'معاينة تفاصيل البيع' : 'Voir les détails'}
                            >
                              <Eye className="w-4 h-4 stroke-[2.2]" />
                            </button>

                            {/* 3. Restaurer pour Modification (Texte sur 2 lignes) */}
                            <button
                              type="button"
                              onClick={() => handleRestoreForModification(sale)}
                              className="h-11 px-4 rounded-2xl bg-[#EEF4FF] dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold text-[11px] leading-tight flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-2xs active:scale-97 select-none shrink-0"
                              title={language === 'ar' ? 'استرجاع الفاتورة للتعديل' : 'Restaurer pour modification'}
                            >
                              <span>{language === 'ar' ? 'استرجاع' : 'Restaurer pour'}</span>
                              <span>{language === 'ar' ? 'للتعديل' : 'Modification'}</span>
                            </button>

                            {/* 4. Supprimer la Vente (Texte sur 2 lignes) */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSale(sale)}
                              className="h-11 px-4 rounded-2xl bg-[#FEF2F2] dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-[11px] leading-tight flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-2xs active:scale-97 select-none shrink-0"
                              title={language === 'ar' ? 'حذف هذه الفاتورة' : 'Supprimer la vente'}
                            >
                              <span>{language === 'ar' ? 'حذف' : 'Supprimer'}</span>
                              <span>{language === 'ar' ? 'الفاتورة' : 'la Vente'}</span>
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

      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 4. MODAL DÉTAILS DE LA VENTE (PHOTO 2)                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      {selectedSaleDetail && (() => {
        const sale = selectedSaleDetail;
        const invNum = sale.invoiceNumber || `INV-${sale.id}`;
        const cashier = (sale.cashier && sale.cashier !== 'BZ Technology') ? sale.cashier : 'Admin';
        const barcodeVal = `S-${sale.id}`;
        const barcodeSvg = generateCode128Svg(barcodeVal, { height: 35, barWidth: 1.5 });
        const items = sale.items || [];
        const totalItemsCount = items.reduce((acc, it) => acc + Number(it.quantity || 1), 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn select-none">
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-4xl shadow-2xl space-y-5 animate-scaleIn relative flex flex-col max-h-[92vh] overflow-y-auto">
              
              {/* Header Modal (Conforme Photo 2) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                    <Receipt className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>{language === 'ar' ? `تفاصيل عملية البيع #${sale.id || invNum}` : `Détails de la vente #${sale.id || invNum}`}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {sale.dateStr || (sale.timestamp ? new Date(sale.timestamp).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR') : '—')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                      <User className="w-3.5 h-3.5" />
                      {cashier}
                    </span>
                  </div>

                  {/* Bloc Code-barres avec bouton impression */}
                  <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs mt-3 w-fit">
                    <div className="px-2">
                      <div 
                        className="h-8 overflow-hidden flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-500 block text-center">
                        {barcodeVal}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>@page{margin:0;size:40mm 25mm;}body{margin:0;padding:2mm;text-align:center;font-family:monospace;font-size:9px;}</style></head><body><div style="font-weight:900;">${invNum}</div><div style="display:flex;justify-content:center;">${barcodeSvg}</div></body></html>`;
                        triggerSilentIframePrint(html, sysSettings);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={language === 'ar' ? 'طباعة الباركود' : 'Imprimer le code-barres'}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Boutons d'impression haut droite (Conforme Photo 2) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printSaleInvoiceA4(sale, { name: sale.customer }, sysSettings)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{language === 'ar' ? 'طباعة الفاتورة' : 'Imprimer la facture'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => printThermalTicketDirect(sale, sysSettings)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{language === 'ar' ? 'طباعة الوصل' : 'Imprimer le bon'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSaleDetail(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Corps (2 Colonnes Conformes Photo 2) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 overflow-y-auto pr-1">
                
                {/* Colonne Gauche : Produits vendus (7/12) */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span>{language === 'ar' ? 'المنتجات المباعة' : 'Produits vendus'}</span>
                  </div>

                  <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left rtl:text-right text-xs border-collapse">
                      <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">{language === 'ar' ? 'المنتج' : 'PRODUIT'}</th>
                          <th className="py-2.5 px-3 text-center">{language === 'ar' ? 'الكمية' : 'QUANTITÉ'}</th>
                          <th className="py-2.5 px-3 text-right rtl:text-left">{language === 'ar' ? 'سعر البيع' : 'PRIX DE VENTE'}</th>
                          <th className="py-2.5 px-3 text-right rtl:text-left">{language === 'ar' ? 'المجموع' : 'SOUS-TOTAL'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                              <div>{it.name || it.designation}</div>
                              {it.barcode && <span className="text-[10px] font-mono text-slate-400 font-normal">{it.barcode}</span>}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{it.quantity || 1}</td>
                            <td className="py-3 px-3 text-right rtl:text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(it.price || it.unitPrice)}</td>
                            <td className="py-3 px-3 text-right rtl:text-left font-mono font-black text-blue-600 dark:text-blue-400">{formatMoney(it.total || ((it.quantity || 1) * (it.price || 0)))}</td>
                            {sale.type !== 'return' && (
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleReturnItemFromSale(sale, it)}
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 mx-auto cursor-pointer shadow-2xs active:scale-95 transition-all"
                                  title="Retourner 1 unité de cet article et rembourser le client"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>{language === 'ar' ? 'إرجاع 1' : 'Retourner 1'}</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section Historique des retours enregistrés sur cette facture */}
                  {Array.isArray(sale.returnedItems) && sale.returnedItems.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-300">
                        <RotateCcw className="w-4 h-4 text-amber-600" />
                        <span>{language === 'ar' ? `سجل الإرجاعات المرتبطة بهذه الفاتورة (${sale.returnedItems.length})` : `Retours enregistrés sur cette facture (${sale.returnedItems.length})`}</span>
                      </div>
                      <div className="divide-y divide-amber-200/60 dark:divide-amber-800/60 text-xs">
                        {sale.returnedItems.map((r, rIdx) => (
                          <div key={rIdx} className="py-1.5 flex justify-between items-center">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              ✓ 1x {r.name} • <span className="text-[10px] text-slate-500 font-normal">{r.dateStr}</span>
                            </span>
                            <span className="font-mono font-black text-rose-600">
                              - {formatMoney(r.amount)} DA
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Colonne Droite : Résumé de la vente + Détails du client (5/12) */}
                <div className="lg:col-span-4 space-y-4">
                  
                  {/* Résumé de la vente */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                      {language === 'ar' ? 'ملخص البيع' : 'Résumé de la vente'}
                    </span>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-bold">{language === 'ar' ? 'العناصر :' : 'Articles :'}</span>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200">{totalItemsCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-bold">{language === 'ar' ? 'الخصم :' : 'Remise :'}</span>
                      <span className="font-mono font-bold text-rose-500">{formatMoney(sale.discount || 0)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase">{language === 'ar' ? 'الإجمالي (دج) :' : 'Total (DA) :'}</span>
                      <span className="font-mono font-black text-xl text-blue-600 dark:text-blue-400" dir="ltr">
                        {formatMoney(sale.total)} DA
                      </span>
                    </div>
                  </div>

                  {/* Détails du client */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {language === 'ar' ? 'بيانات العميل' : 'DÉTAILS DU CLIENT'}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-black text-xs text-slate-900 dark:text-white">
                          {sale.customer || (language === 'ar' ? 'زبون عابر' : 'Client Comptoir')}
                        </div>
                        {sale.customerPhone ? (
                          <div className="text-[10px] font-mono text-slate-400">
                            {sale.customerPhone}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            {sale.paymentMethod ? `${language === 'ar' ? 'طريقة الدفع: ' : 'Règlement : '}${sale.paymentMethod}` : (language === 'ar' ? 'دفع عند الصندوق' : 'Règlement au comptoir')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Détails du vendeur (Conforme Photo 1) */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {language === 'ar' ? 'بيانات البائع' : 'DÉTAILS DU VENDEUR'}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {language === 'ar' ? 'البائع :' : 'Vendeur :'} <span className="font-mono font-black">{cashier}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'ar' ? 'نقطة البيع :' : 'Caisse :'} <span className="font-mono font-bold text-emerald-600">Poste Caisse #01</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 5. MODAL CENTRE D'IMPRESSION (PHOTO 3)                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      {selectedSaleForPrintCenter && (() => {
        const sale = selectedSaleForPrintCenter;
        const invNum = sale.invoiceNumber || `INV-${sale.id}`;

        const handleSelectDelivery = (design) => {
          setDeliveryDesignType(design);
          setDeliveryModalData(sale);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn select-none">
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto animate-scaleIn">
              
              {/* En-tête bleu dégradé (Conforme Photo 3) */}
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 stroke-[2.2]" />
                  <div>
                    <h3 className="text-base font-black tracking-tight">{language === 'ar' ? 'مركز الطباعة' : "Centre d'impression"}</h3>
                    <p className="text-xs text-blue-100 font-mono">{invNum}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSaleForPrintCenter(null)}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Onglets Imprimer / PDF */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-xl text-xs font-black bg-blue-600 text-white shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'طباعة' : 'Imprimer'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => printSaleInvoiceA4(sale, { name: sale.customer }, sysSettings)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'PDF / مشاركة' : 'PDF / Partager'}</span>
                  </button>
                </div>

                {/* Section 1 : Imprimer la facture (Choisir le design) */}
                <div className="p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black text-slate-800 dark:text-white">{language === 'ar' ? 'طباعة الفاتورة' : 'Imprimer la facture'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{language === 'ar' ? 'اختيار النموذج' : 'Choisir le design'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => printSaleInvoiceA4(sale, { name: sale.customer }, sysSettings)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white shadow-2xs hover:bg-blue-700 cursor-pointer"
                    >
                      {language === 'ar' ? '★ كلاسيكي A4' : '★ Classique A4'}
                    </button>
                    <button
                      type="button"
                      onClick={() => printSaleInvoiceA4(sale, { name: sale.customer }, sysSettings)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {language === 'ar' ? 'مؤطر' : 'Encadré'}
                    </button>
                    <button
                      type="button"
                      onClick={() => printSaleInvoiceA4(sale, { name: sale.customer }, sysSettings)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {language === 'ar' ? 'مفصل A4' : 'Détaillé A4'}
                    </button>
                    <button
                      type="button"
                      onClick={() => printSaleInvoiceA5(sale, { name: sale.customer }, sysSettings)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {language === 'ar' ? 'مضغوط A5' : 'Compact A5'}
                    </button>
                    <button
                      type="button"
                      onClick={() => printThermalTicketDirect(sale, sysSettings)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {language === 'ar' ? 'حراري 80mm' : 'Thermique 80mm'}
                    </button>
                  </div>
                </div>

                {/* Section 2 : Imprimer le bon (Choisir le design) */}
                <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-slate-800 dark:text-white">{language === 'ar' ? 'طباعة الوصل' : 'Imprimer le bon'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{language === 'ar' ? 'اختيار النموذج' : 'Choisir le design'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => printThermalTicketDirect(sale, sysSettings)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white shadow-2xs hover:bg-blue-700 cursor-pointer"
                    >
                      {language === 'ar' ? '★ وصل (نموذج 1)' : '★ Ticket (Design 1)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => printThermalTicketDirect(sale, sysSettings)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {language === 'ar' ? 'وصل (نموذج 2)' : 'Ticket (Design 2)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => printSaleInvoiceA5(sale, { name: sale.customer }, sysSettings)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {language === 'ar' ? 'إيصال A5' : 'Reçu A5'}
                    </button>
                  </div>
                </div>

                {/* Section 3 : Bon de livraison (Choisir le design) */}
                <div className="p-4 rounded-2xl border border-cyan-100 dark:border-cyan-900/50 bg-cyan-50/30 dark:bg-cyan-950/20 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs font-black text-slate-800 dark:text-white">{language === 'ar' ? 'وصل تسليم' : 'Bon de livraison'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{language === 'ar' ? 'اختيار النموذج' : 'Choisir le design'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelectDelivery('A4')}
                      className="px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white shadow-2xs hover:bg-blue-700 cursor-pointer"
                    >
                      {language === 'ar' ? '★ قياسي A4' : '★ Standard A4'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDelivery('A5')}
                      className="px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {language === 'ar' ? 'مضغوط A5' : 'Compact A5'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDelivery('thermal')}
                      className="px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {language === 'ar' ? 'حراري 80mm' : 'Thermique 80mm'}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 6. MODAL DÉTAILS DE LIVRAISON (PHOTOS 4 & 5)           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {deliveryModalData && (() => {
        const sale = deliveryModalData;

        const handleConfirmPrintDelivery = () => {
          const details = {
            driver: deliveryDriver,
            plateNumber: deliveryPlate
          };

          if (deliveryDesignType === 'thermal') {
            printDeliveryNoteThermal(sale, details, sysSettings);
          } else {
            printDeliveryNoteA4(sale, details, sysSettings);
          }

          setDeliveryModalData(null);
          setSelectedSaleForPrintCenter(null);
        };

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn select-none">
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
              
              {/* En-tête Cyan (Conforme Photos 4 & 5) */}
              <div className="bg-[#0284C7] px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-5 h-5 stroke-[2.3]" />
                  <h3 className="text-base font-black tracking-tight">{language === 'ar' ? 'بيانات التوصيل والتسليم' : 'Détails de livraison'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliveryModalData(null)}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulaire Livreur & Matricule (Conforme Photos 4 & 5) */}
              <div className="p-6 space-y-4">
                
                {/* Livreur */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'اسم السائق / الموزع' : 'Livreur'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'اسم السائق (اختياري)' : 'Nom du livreur (facultatif)'}
                    value={deliveryDriver}
                    onChange={(e) => setDeliveryDriver(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-cyan-400 dark:border-cyan-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-cyan-500/20 text-xs font-medium"
                    autoFocus
                  />
                </div>

                {/* Matricule */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ar' ? 'رقم لوحة المركبة / الترقيم' : 'Matricule'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'ترقيم المركبة (اختياري)' : 'Matricule du véhicule (facultatif)'}
                    value={deliveryPlate}
                    onChange={(e) => setDeliveryPlate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-cyan-500 text-xs font-medium"
                  />
                </div>

                <p className="text-[11px] text-slate-400 font-medium">
                  {language === 'ar' ? 'حقول اختيارية — اتركها فارغة إذا لم تكن مطلوبة.' : 'Champs facultatifs — laissez vide si non requis.'}
                </p>

                {/* Boutons Annuler & Imprimer (Conforme Photos 4 & 5) */}
                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryModalData(null)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPrintDelivery}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-cyan-600/20 transition-all cursor-pointer active:scale-98"
                  >
                    <Printer className="w-4 h-4 stroke-[2.2]" />
                    <span>{language === 'ar' ? 'تأكيد والطباعة' : 'Imprimer'}</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 7. MODAL RÉCAPITULATIF (CONFORME MODÈLE A4 DU PDF)     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn select-none">
          <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-scaleIn">
            
            {/* Entête de la fenêtre */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800">
                  <BarChart3 className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {language === 'ar' ? 'ملخص المبيعات' : 'Récapitulatif des Ventes'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {language === 'ar' ? `وثيقة ملخص رسمي لـ ${filteredSales.length} عملية بيع محددة` : `Document récapitulatif officiel sur ${filteredSales.length} vente(s) sélectionnée(s)`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* En-tête du document conforme au PDF */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {sysSettings?.storeName || 'NOVA MAG'}
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 space-y-0.5">
                  {sysSettings?.storeAddress && <div>{sysSettings.storeAddress}</div>}
                  {sysSettings?.storePhone && <div>{language === 'ar' ? 'الهاتف :' : 'Tél :'} {sysSettings.storePhone}</div>}
                  <div className="text-[11px] text-slate-400">
                    {sysSettings?.storeRc && `RC : ${sysSettings.storeRc} `}
                    {sysSettings?.storeNif && `• NIF : ${sysSettings.storeNif} `}
                    {sysSettings?.storeAi && `• AI : ${sysSettings.storeAi}`}
                  </div>
                </div>

                <div className="mt-3 inline-flex flex-col gap-1 p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">{language === 'ar' ? 'النطاق : ' : 'Périmètre : '}</span>
                    <strong className="text-slate-800 dark:text-slate-100 font-bold">
                      {filterCustomer === 'all' ? (language === 'ar' ? 'جميع العملاء' : 'Tous les clients') : filterCustomer}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">{language === 'ar' ? 'عدد المبيعات : ' : 'Nombre de ventes : '}</span>
                    <strong className="text-slate-800 dark:text-slate-100 font-mono font-bold">
                      {salesSummary.totalCount}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="text-right rtl:text-left flex flex-col sm:items-end rtl:sm:items-start">
                <span className="inline-block px-3 py-1.5 rounded-xl border border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-2">
                  {language === 'ar' ? 'ملخص المبيعات' : 'Récapitulatif des ventes'}
                </span>
                <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {language === 'ar' ? 'رقم الوثيقة :' : 'Récapitulatif N° :'} <span className="font-mono font-bold text-slate-900 dark:text-white" dir="ltr">RM-{new Date().getFullYear()}-{String(filteredSales.length).padStart(4, '0')}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'ar' ? 'تاريخ الإصدار :' : "Date d'émission :"} <span className="font-semibold">{new Date().toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                </div>
              </div>
            </div>

            {/* Bandeau de période */}
            <div className="px-4 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border-l-4 rtl:border-l-0 rtl:border-r-4 border-emerald-500 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
              <span>
                {language === 'ar' ? 'الفترة :' : 'Période :'} {filterDateFrom && filterDateTo 
                  ? (language === 'ar' ? `من ${filterDateFrom} إلى ${filterDateTo}` : `du ${filterDateFrom} au ${filterDateTo}`)
                  : (filterDateFrom ? (language === 'ar' ? `ابتداءً من ${filterDateFrom}` : `à partir du ${filterDateFrom}`) : (filterDateTo ? (language === 'ar' ? `حتى ${filterDateTo}` : `jusqu'au ${filterDateTo}`) : (language === 'ar' ? 'كافة التواريخ' : 'Toutes les dates')))}
              </span>
              <span className="font-mono text-[11px] opacity-80">
                {salesSummary.totalArticles} {language === 'ar' ? 'منتج مباع' : 'article(s) vendu(s)'}
              </span>
            </div>

            {/* Tableau des ventes du récapitulatif */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left rtl:text-right text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">#</th>
                    <th className="py-2.5 px-3 w-28">{language === 'ar' ? 'رقم الفاتورة' : 'N° Facture'}</th>
                    <th className="py-2.5 px-3 text-center w-36">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th className="py-2.5 px-3">{language === 'ar' ? 'العميل' : 'Client'}</th>
                    <th className="py-2.5 px-3 text-center w-20">{language === 'ar' ? 'المنتجات' : 'Articles'}</th>
                    <th className="py-2.5 px-3 text-right rtl:text-left w-28">{language === 'ar' ? 'المدفوع' : 'Payé'}</th>
                    <th className="py-2.5 px-3 text-right rtl:text-left w-28">{language === 'ar' ? 'المجموع' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {filteredSales.map((sale, idx) => {
                    const invNum = sale.invoiceNumber || `INV-${sale.id}`;
                    const saleDate = sale.dateStr || (sale.timestamp ? new Date(sale.timestamp).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR') : '—');
                    const articlesCount = (sale.items || []).reduce((acc, it) => acc + Number(it.quantity || 1), 0);
                    const saleTotal = Number(sale.total || 0);
                    const salePaid = sale.amountPaid !== undefined 
                      ? Math.min(Number(sale.amountPaid || 0), saleTotal) 
                      : (sale.paymentMethod === 'credit' ? 0 : saleTotal);

                    return (
                      <tr 
                        key={sale.id || idx}
                        className={idx % 2 === 1 ? 'bg-slate-50/60 dark:bg-slate-800/30' : 'bg-white dark:bg-[#111C35]'}
                      >
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-500 text-[11px]">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {invNum}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-500 text-[11px] whitespace-nowrap">
                          {saleDate}
                        </td>
                        <td className="py-2 px-3 text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[200px]">
                          {sale.customer || (language === 'ar' ? 'زبون عابر' : 'Client Comptoir')}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {articlesCount}
                        </td>
                        <td className="py-2 px-3 text-right rtl:text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(salePaid)}
                        </td>
                        <td className="py-2 px-3 text-right rtl:text-left font-mono font-black text-slate-900 dark:text-white">
                          {formatMoney(saleTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Synthèse financière et montant en lettres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    {language === 'ar' ? 'المبلغ بالحروف :' : 'Montant en lettres :'}
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 italic leading-relaxed">
                    {numberToFrenchWords(salesSummary.totalCA)} {language === 'ar' ? 'دينار جزائري' : 'Dinars Algériens'}
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  {language === 'ar' ? 'وثيقة ملخص داخلية لحركة المبيعات خلال الفترة المحددة. لا تعتبر فاتورة جبائية رسمية.' : "Document interne récapitulant l'activité des ventes sur la période indiquée. Ne constitue pas une facture fiscale officielle."}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900/60 text-xs">
                <div className="p-2.5 px-3.5 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{language === 'ar' ? 'عدد المبيعات' : 'Nombre de ventes'}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{salesSummary.totalCount}</span>
                </div>
                <div className="p-2.5 px-3.5 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{language === 'ar' ? 'إجمالي المبيعات' : 'Total des ventes'}</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white" dir="ltr">{formatMoney(salesSummary.totalCA)} DA</span>
                </div>
                <div className="p-2.5 px-3.5 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{language === 'ar' ? 'إجمالي المدفوع' : 'Total payé'}</span>
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-400" dir="ltr">{formatMoney(salesSummary.totalPaid)} DA</span>
                </div>
                <div className={`p-2.5 px-3.5 flex justify-between items-center ${salesSummary.remainingDebt > 0 ? 'bg-rose-50/50 dark:bg-rose-950/30' : ''}`}>
                  <span className={`font-bold ${salesSummary.remainingDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {language === 'ar' ? 'المتبقي للدفع (ديون)' : 'Reste à payer'}
                  </span>
                  <span className={`font-mono font-black ${salesSummary.remainingDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`} dir="ltr">
                    {formatMoney(salesSummary.remainingDebt)} DA
                  </span>
                </div>
              </div>
            </div>

            {/* Pied de page avec boutons d'action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {language === 'ar' ? 'المحرر :' : 'Émetteur :'} <strong className="text-slate-800 dark:text-slate-200">{(currentUser && currentUser.name) || 'Admin'}</strong>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إغلاق' : 'Fermer'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    printSalesSummaryReportA4({
                      sales: filteredSales,
                      dateFrom: filterDateFrom,
                      dateTo: filterDateTo,
                      customerFilter: filterCustomer,
                      totalSales: salesSummary.totalCA,
                      totalPaid: salesSummary.totalPaid,
                      remainingDebt: salesSummary.remainingDebt,
                      salesCount: salesSummary.totalCount,
                      issuer: (currentUser && currentUser.name) || 'Admin',
                      docNumber: `RM-${new Date().getFullYear()}-${String(filteredSales.length).padStart(4, '0')}`,
                      emissionDate: new Date().toLocaleDateString('fr-FR')
                    }, sysSettings);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-97 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4 stroke-[2.2]" />
                  <span>{language === 'ar' ? 'طباعة تقرير الملخص A4' : 'Imprimer le Récapitulatif A4'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Boîte de dialogue de confirmation (Suppression) */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
