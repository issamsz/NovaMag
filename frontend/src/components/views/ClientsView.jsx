import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  DollarSign, 
  ShoppingBag, 
  Coins, 
  Receipt, 
  Edit3, 
  Trash2, 
  Printer, 
  ArrowUpRight, 
  ShieldCheck, 
  LayoutGrid, 
  ListFilter, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Barcode,
  FileText,
  X
} from 'lucide-react';
import { MOCK_CUSTOMERS, MOCK_INVOICES } from '../../mock/posData';
import AddCustomerModal from '../pos/AddCustomerModal';
import SettleDebtModal from '../pos/SettleDebtModal';
import CustomerHistoryModal from '../pos/CustomerHistoryModal';
import ModernToast from '../common/ModernToast';
import ConfirmDialog from '../common/ConfirmDialog';
import { printCustomerBarcodeLabel } from '../../services/thermalPrinter';
import { useLanguage } from '../../i18n/LanguageContext';

const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
const cleanText = (t) =>
  String(t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const isMatchingCustomer = (inv, customer) => {
  if (!customer || !inv) return false;
  if (inv.customerId && customer.id && String(inv.customerId) === String(customer.id)) {
    return true;
  }
  const cPhone = cleanPhone(customer.phone);
  const invPhone = cleanPhone(inv.customerPhone);
  if (cPhone.length >= 8 && invPhone.length >= 8 && cPhone === invPhone) {
    return true;
  }
  const cName = cleanText(customer.name);
  const invName = cleanText(inv.customer || inv.customerName);
  if (cName && invName) {
    if (cName === invName) return true;
    if (cName.length > 4 && invName.includes(cName)) return true;
    if (invName.length > 4 && cName.includes(invName)) return true;
  }
  return false;
};

export default function ClientsView() {
  const { t, language } = useLanguage();
  // ══ 1. Données Clients ══
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_customers');
      return saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
    } catch {
      return MOCK_CUSTOMERS;
    }
  });

  // ══ 2. Historique des Ventes (Factures) ══
  const [salesHistory, setSalesHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_sales_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return MOCK_INVOICES;
    } catch {
      return MOCK_INVOICES;
    }
  });

  // ══ 3. Historique des Règlements de Dettes ══
  const [customerPayments, setCustomerPayments] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_customer_payments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ══ 4. Filtres et Affichage ══
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'debt' | 'uptodate'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (Étiquettes) | 'table' (Tableau)
  
  // ══ 5. Modals ══
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [customerToSettle, setCustomerToSettle] = useState(null);
  const [customerForHistory, setCustomerForHistory] = useState(null);

  // ══ 6. Toast Notifications ══
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // ══ 7. Modale de Confirmation Élégante ══
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Confirmation',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: () => {}
  });

  // Synchronisation avec localStorage et écoute des événements
  useEffect(() => {
    try {
      localStorage.setItem('novamag_customers', JSON.stringify(customers));
      window.dispatchEvent(new Event('novamag_customers_updated'));
    } catch (e) {}
  }, [customers]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const savedCust = localStorage.getItem('novamag_customers');
        if (savedCust) setCustomers(JSON.parse(savedCust));

        const savedSales = localStorage.getItem('novamag_sales_history');
        if (savedSales) setSalesHistory(JSON.parse(savedSales));

        const savedPayments = localStorage.getItem('novamag_customer_payments');
        if (savedPayments) setCustomerPayments(JSON.parse(savedPayments));
      } catch (e) {}
    };

    window.addEventListener('novamag_customers_updated', handleSync);
    window.addEventListener('novamag_sales_updated', handleSync);
    window.addEventListener('novamag_cash_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('novamag_customers_updated', handleSync);
      window.removeEventListener('novamag_sales_updated', handleSync);
      window.removeEventListener('novamag_cash_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Calcul des ventes et statistiques par client
  const customerStatsMap = useMemo(() => {
    const map = {};

    customers.forEach((c) => {
      // Invoices matching this customer
      const matchingInvoices = salesHistory.filter((inv) => isMatchingCustomer(inv, c));

      const totalSpent = matchingInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
      const invoiceCount = matchingInvoices.length;
      const lastInvoiceDate = matchingInvoices[0]?.dateStr || matchingInvoices[0]?.timestamp?.slice(0, 10) || null;

      // Current Debt
      const debt = Math.abs(c.balance < 0 ? c.balance : (c.debt || 0));

      map[c.id] = {
        totalSpent,
        invoiceCount,
        lastInvoiceDate,
        debt
      };
    });

    return map;
  }, [customers, salesHistory]);

  // Statistiques Générales Haut de Page
  const totalDebtOverall = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.balance < 0 ? Math.abs(c.balance) : (c.debt || 0)), 0);
  }, [customers]);

  const totalSalesToRegistered = useMemo(() => {
    return Object.values(customerStatsMap).reduce((acc, stat) => acc + (stat.totalSpent || 0), 0);
  }, [customerStatsMap]);

  const debtCustomersCount = useMemo(() => {
    return customers.filter((c) => (c.balance < 0 || (c.debt || 0) > 0)).length;
  }, [customers]);

  const upToDateCustomersCount = customers.length - debtCustomersCount;

  // Filtrage des clients pour l'affichage
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const stats = customerStatsMap[c.id] || { debt: 0 };
      const hasDebt = stats.debt > 0;

      if (activeFilter === 'debt' && !hasDebt) return false;
      if (activeFilter === 'uptodate' && hasDebt) return false;

      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase().trim();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.rc?.toLowerCase().includes(q) ||
        c.nif?.toLowerCase().includes(q)
      );
    });
  }, [customers, customerStatsMap, activeFilter, searchTerm]);

  // Gestion Sauvegarde Client (Ajout ou Modification)
  const handleSaveCustomer = (customerData, isEdit) => {
    if (isEdit) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerData.id ? customerData : c))
      );
      showToast(`✓ Informations du client "${customerData.name}" mises à jour avec succès`);
    } else {
      setCustomers((prev) => [customerData, ...prev]);
      showToast(`✓ Nouveau client "${customerData.name}" ajouté avec succès`);
    }
    setCustomerToEdit(null);
  };

  // Suppression d'un client
  const handleDeleteCustomer = (customer) => {
    if (customer.id === 1 || customer.name?.toLowerCase().includes('comptoir')) {
      showToast('Le client comptoir par défaut ne peut pas être supprimé', 'warning');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer le client",
      message: `Êtes-vous certain de vouloir supprimer définitivement le client "${customer.name}" ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => {
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
        showToast(`Client "${customer.name}" supprimé`, 'info');
      }
    });
  };

  // Callback après versement de dette
  const handleCustomerSettled = (updatedCustomer, paymentRecord) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
    setCustomerPayments((prev) => [paymentRecord, ...prev]);
    showToast(
      `✓ Versement de ${paymentRecord.amount.toLocaleString()} DA enregistré pour ${updatedCustomer.name}`,
      'success'
    );
  };

  return (
    <div className="flex-1 p-5 sm:p-7 overflow-y-auto bg-[#F1F4F9] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 space-y-6">
      
      {/* ══ EN-TÊTE PRINCIPAL ══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Users className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                {language === 'ar' ? 'الزبائن ودفتر الديون' : 'Clients & Carnet de Dettes'}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'ar'
                  ? 'إدارة حسابات الزبائن، متابعة الديون والائتمان، سجل المبيعات والمدفوعات.'
                  : 'Gestion des comptes clients, solde des dettes (crédits), historique des ventes et règlements.'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setCustomerToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5 stroke-[2.4]" />
          <span>{language === 'ar' ? 'زبون جديد' : 'Nouveau Client'}</span>
        </button>
      </div>

      {/* ══ CARTES STATISTIQUES GLOBALES ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Clients */}
        <div className="bg-white dark:bg-[#111C35] p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ar' ? 'إجمالي الزبائن' : 'Total Clients'}
            </span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-mono font-bold text-slate-800 dark:text-white">
              {customers.length}
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              {language === 'ar'
                ? `${upToDateCustomersCount} مسوى • ${debtCustomersCount} عليه دين`
                : `${upToDateCustomersCount} à jour • ${debtCustomersCount} avec dette`}
            </span>
          </div>
          <div className="absolute -right-2 -bottom-2 w-14 h-14 bg-blue-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Total Ventes Cumulées */}
        <div className="bg-white dark:bg-[#111C35] p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ar' ? 'مبيعات الزبائن (المشتريات)' : 'Ventes Clients (Achats)'}
            </span>
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-mono font-bold text-blue-900 dark:text-blue-200" dir="ltr">
              {totalSalesToRegistered.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </div>
            <span className="text-[10px] font-medium text-blue-600/80 dark:text-blue-400 flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" />
              {language === 'ar' ? 'رقم الأعمال المحقق' : "Chiffre d'affaires réalisé"}
            </span>
          </div>
          <div className="absolute -right-2 -bottom-2 w-14 h-14 bg-blue-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Créances / Crédit à Recouvrer */}
        <div className="bg-white dark:bg-[#111C35] p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ar' ? 'ديون مستحقة (ائتمان)' : 'Créances à Recouvrer (Crédit)'}
            </span>
            <Coins className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-mono font-bold text-rose-600 dark:text-rose-400" dir="ltr">
              {totalDebtOverall.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </div>
            <span className="text-[10px] font-medium text-rose-600/80 dark:text-rose-400">
              {language === 'ar' ? `${debtCustomersCount} زبون لديهم ديون جارية` : `${debtCustomersCount} client(s) ont un crédit en cours`}
            </span>
          </div>
          <div className="absolute -right-2 -bottom-2 w-14 h-14 bg-rose-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Comptes à Jour */}
        <div className="bg-white dark:bg-[#111C35] p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ar' ? 'حسابات مسواة (بدون دين)' : 'Comptes à Jour (Sans dette)'}
            </span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {upToDateCustomersCount} {language === 'ar' ? 'حساب' : 'comptes'}
            </div>
            <span className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400">
              {language === 'ar' ? 'الرصيد 0 دج أو إيجابي ✓' : 'Solde 0 DA ou positif ✓'}
            </span>
          </div>
          <div className="absolute -right-2 -bottom-2 w-14 h-14 bg-emerald-500/5 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* ══ BARRE DE RECHERCHE, FILTRES & COMMUTATEUR DE VUE ══ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111C35] p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        
        {/* Champ de recherche */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'بحث باسم الزبون، رقم الهاتف، الولاية، السجل التجاري...' : 'Rechercher par nom de client, numéro de téléphone, wilaya, RC...'}
            className="w-full text-xs font-semibold pl-10 rtl:pl-4 rtl:pr-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/15 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtres par Étiquette */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {language === 'ar' ? 'الكل' : 'Tous'} ({customers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('debt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'debt'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'عليهم دين' : 'Avec Dette'} ({debtCustomersCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('uptodate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'uptodate'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'مسواة' : 'À jour'} ({upToDateCustomersCount})</span>
          </button>
        </div>

        {/* Sélecteur de mode de vue (Étiquettes vs Tableau) */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title={language === 'ar' ? 'عرض بطاقات' : 'Affichage en style Cartes / Étiquettes'}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'ar' ? 'بطاقات' : 'Étiquettes'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title={language === 'ar' ? 'عرض جدول' : 'Affichage en Liste / Tableau compact'}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'ar' ? 'جدول' : 'Tableau'}</span>
          </button>
        </div>

      </div>

      {/* ══ VUE 1 : STYLE ÉTIQUETTES / CARTES CLIENTS (PAR DÉFAUT) ══ */}
      {viewMode === 'grid' && (
        filteredCustomers.length === 0 ? (
          <div className="bg-white dark:bg-[#111C35] rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto stroke-[1.5]" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Aucun client ne correspond à votre recherche
            </h3>
            <p className="text-xs text-slate-400">
              Essayez un autre mot-clé ou réinitialisez vos filtres.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCustomers.map((cust) => {
              const stats = customerStatsMap[cust.id] || { totalSpent: 0, invoiceCount: 0, debt: 0, lastInvoiceDate: null };
              const hasDebt = stats.debt > 0;
              const maxDebt = Number(cust.maxDebtLimit) || 0;
              const isCounter = cust.id === 1 || cust.name?.toLowerCase().includes('comptoir');

              return (
                <div
                  key={cust.id}
                  className={`bg-white dark:bg-[#111C35] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between relative group shadow-[0_6px_18px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.12),0_4px_10px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all duration-200 border-l-[5px] ${
                    hasDebt ? 'border-l-rose-500' : 'border-l-emerald-500'
                  }`}
                >
                  {/* Haut : Actions à gauche & Badge Initiale à droite */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      {/* Actions : Code-barres, Modifier, Supprimer */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const sysSettings = JSON.parse(localStorage.getItem('novamag_system_settings') || '{}');
                            printCustomerBarcodeLabel(cust, sysSettings);
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 text-slate-400 hover:text-indigo-600 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center transition-all cursor-pointer"
                          title="Imprimer l'étiquette code-barres"
                        >
                          <Barcode className="w-3.5 h-3.5 stroke-[2]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCustomerToEdit(cust);
                            setIsAddModalOpen(true);
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-blue-950/40 text-slate-400 hover:text-blue-600 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center transition-all cursor-pointer"
                          title="Modifier les coordonnées du client"
                        >
                          <Edit3 className="w-3.5 h-3.5 stroke-[2]" />
                        </button>

                        {!isCounter && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust)}
                            className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center transition-all cursor-pointer"
                            title="Supprimer le client"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        )}
                      </div>

                      {/* Badge Lettre Initiale */}
                      <div className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center border shadow-2xs ${
                        hasDebt
                          ? 'bg-rose-50 text-rose-600 border-rose-200/70 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                      }`}>
                        {cust.name?.trim()?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                    </div>

                    {/* Centre : Nom du client & Localisation */}
                    <div className="text-center mt-2.5 mb-3 px-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate" title={cust.name}>
                        {cust.name}
                      </h3>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{cust.address || (isCounter ? (language === 'ar' ? 'زبون عابر (نقدي)' : 'Client Comptoir (Passager)') : (language === 'ar' ? 'غير محدد' : 'Non spécifié'))}</span>
                      </div>
                    </div>

                    {/* Milieu : Données clés (Téléphone, Code, Total Achats, Dette) */}
                    <div className="space-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      {/* Téléphone */}
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                          {language === 'ar' ? 'الهاتف' : 'Téléphone'}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200" dir="ltr">
                          {cust.phone || '-'}
                        </span>
                      </div>

                      {/* Code Client */}
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                          {language === 'ar' ? 'رمز الزبون' : 'Code Client'}
                        </span>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300" dir="ltr">
                          {cust.barcode || `CLI-${String(cust.id).padStart(5, '0')}`}
                        </span>
                      </div>

                      {/* Total Achats */}
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                          {language === 'ar' ? 'إجمالي المشتريات' : 'Total Achats'}
                        </span>
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400" dir="ltr">
                          {stats.totalSpent.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                        </span>
                      </div>

                      {/* Solde Dette */}
                      <div className="flex items-center justify-between py-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                          {hasDebt
                            ? (language === 'ar' ? 'دين جارٍ' : 'Dette en cours')
                            : (language === 'ar' ? 'رصيد الدين' : 'Solde Dette')}
                        </span>
                        <span className={`font-mono text-xs font-bold ${
                          hasDebt ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`} dir="ltr">
                          {hasDebt 
                            ? `${stats.debt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA` 
                            : (language === 'ar' ? '0,00 DA (مسوى)' : '0,00 DA (À jour)')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bas : Bouton large type capsule (conforme modèle) */}
                  <div className="mt-3.5 pt-2">
                    {hasDebt ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomerForHistory(cust)}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="truncate">{language === 'ar' ? 'بطاقة الزبون' : 'Fiche Client'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerToSettle(cust)}
                          className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-98 shrink-0"
                          title={language === 'ar' ? 'تسوية الدين' : 'Régler la dette ou enregistrer un versement'}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تسديد' : 'Régler'}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCustomerForHistory(cust)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                      >
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>{language === 'ar' ? 'بطاقة الزبون' : 'Fiche Client'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ══ VUE 2 : MODE TABLEAU CLASSIQUE ══ */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-[#111C35] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <table className="w-full text-left rtl:text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">{language === 'ar' ? 'الزبون' : 'Client'}</th>
                <th className="py-3.5 px-3">{language === 'ar' ? 'رقم الهاتف' : 'Numéro de Téléphone'}</th>
                <th className="py-3.5 px-3 text-right rtl:text-left">{language === 'ar' ? 'إجمالي المبيعات' : 'Total Ventes (Achats)'}</th>
                <th className="py-3.5 px-3 text-right rtl:text-left">{language === 'ar' ? 'رصيد الحساب / الدين' : 'Solde Compte / Dette'}</th>
                <th className="py-3.5 px-3 text-center">{language === 'ar' ? 'سقف الائتمان' : 'Plafond Crédit'}</th>
                <th className="py-3.5 px-4 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredCustomers.map((cust) => {
                const stats = customerStatsMap[cust.id] || { totalSpent: 0, invoiceCount: 0, debt: 0 };
                const hasDebt = stats.debt > 0;
                const isCounter = cust.id === 1 || cust.name?.toLowerCase().includes('comptoir');

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Nom + Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {cust.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white">{cust.name}</div>
                          {cust.address && <div className="text-[10px] text-slate-400">{cust.address}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Téléphone */}
                    <td className="py-3 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300" dir="ltr">
                      {cust.phone || '-'}
                    </td>

                    {/* Ventes */}
                    <td className="py-3 px-3 text-right rtl:text-left">
                      <div className="font-mono font-bold text-slate-800 dark:text-white" dir="ltr">
                        {stats.totalSpent.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {stats.invoiceCount} {language === 'ar' ? 'فاتورة' : 'facture(s)'}
                      </span>
                    </td>

                    {/* Dette */}
                    <td className="py-3 px-3 text-right rtl:text-left font-mono font-semibold">
                      {hasDebt ? (
                        <span className="text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 font-bold" dir="ltr">
                          {stats.debt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA ({language === 'ar' ? 'دين' : 'Dette'})
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md font-medium" dir="ltr">
                          0,00 DA ({language === 'ar' ? 'مسوى' : 'À jour'})
                        </span>
                      )}
                    </td>

                    {/* Plafond */}
                    <td className="py-3 px-3 text-center font-mono text-slate-500" dir="ltr">
                      {Number(cust.maxDebtLimit) > 0 ? `${Number(cust.maxDebtLimit).toLocaleString()} DA` : (language === 'ar' ? 'غير محدود' : 'Illimité')}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCustomerToSettle(cust)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            hasDebt
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800'
                          }`}
                        >
                          {language === 'ar' ? 'تسديد دين' : 'Régler Dette'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setCustomerForHistory(cust)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                          title={language === 'ar' ? 'سجل المبيعات' : 'Historique des ventes'}
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCustomerToEdit(cust);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                          title={language === 'ar' ? 'تعديل' : 'Modifier'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {!isCounter && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                            title={language === 'ar' ? 'حذف' : 'Supprimer'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ MODAL D'AJOUT ET D'ÉDITION DE CLIENT ══ */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        customerToEdit={customerToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSave={handleSaveCustomer}
      />

      {/* ══ MODAL DE RÈGLEMENT DE DETTE (VERSEMENT) ══ */}
      <SettleDebtModal
        isOpen={Boolean(customerToSettle)}
        customer={customerToSettle}
        onClose={() => setCustomerToSettle(null)}
        onSettled={handleCustomerSettled}
      />

      {/* ══ MODAL D'HISTORIQUE DES VENTES ET DETTES DU CLIENT ══ */}
      <CustomerHistoryModal
        isOpen={Boolean(customerForHistory)}
        customer={customerForHistory}
        invoices={salesHistory}
        payments={customerPayments}
        onClose={() => setCustomerForHistory(null)}
        onOpenSettleDebt={(cust) => setCustomerToSettle(cust)}
        onUpdateCustomer={(updatedCustomer) => {
          setCustomers((prev) =>
            prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
          );
          setCustomerForHistory(updatedCustomer);
        }}
      />

      {/* ══ NOTIFICATION TOAST ══ */}
      <ModernToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* ══ MODALE DE CONFIRMATION ÉLÉGANTE (Remplace window.confirm) ══ */}
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
