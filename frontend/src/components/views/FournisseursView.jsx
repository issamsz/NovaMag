import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Coins, 
  ShoppingBag, 
  Edit3, 
  Trash2, 
  Printer, 
  LayoutGrid, 
  ListFilter, 
  CheckCircle2, 
  TrendingUp, 
  FileText, 
  X,
  Truck
} from 'lucide-react';
import AddSupplierModal from '../suppliers/AddSupplierModal';
import SettleSupplierDebtModal from '../suppliers/SettleSupplierDebtModal';
import SupplierHistoryModal, { INITIAL_SUPPLIER_PURCHASES, ensurePurchaseItems } from '../suppliers/SupplierHistoryModal';
import ModernToast from '../common/ModernToast';
import ConfirmDialog from '../common/ConfirmDialog';
import { useLanguage } from '../../i18n/LanguageContext';

// Fournisseurs par défaut réalistes
const INITIAL_SUPPLIERS = [
  {
    id: 1,
    name: 'Grossiste Matériel & POS Algérie',
    company: 'Grossiste Matériel & POS Algérie',
    phone: '0550 00 00 01',
    address: 'Sétif, Centre Ville',
    rc: '19/00-9876543B19',
    nif: '191900000000000',
    ai: '1901004523',
    nis: '001919000000000',
    initialDebt: 0,
    debt: 0,
    totalPurchases: 450000,
    purchaseCount: 4
  },
  {
    id: 2,
    name: 'Xprinter Algérie Officiel',
    company: 'Xprinter Algérie Officiel',
    phone: '0987 65 43 23',
    address: 'Oran, Es-Sénia',
    rc: '31/00-1122334B21',
    nif: '313100000000000',
    ai: '3101008899',
    nis: '003131000000000',
    initialDebt: 125000,
    debt: 125000,
    totalPurchases: 280000,
    purchaseCount: 3
  },
  {
    id: 3,
    name: 'Candia Laiterie Algérie',
    company: 'Candia Laiterie Algérie',
    phone: '025 88 99 00',
    address: 'Blida, Boufarik',
    rc: '09/00-5566778B09',
    nif: '090900000000000',
    ai: '0901003344',
    nis: '000909000000000',
    initialDebt: 45000,
    debt: 47000, // 45 000 DA (Dette initiale) + 2 000 DA (Crédit facture BA-2026-0104)
    totalPurchases: 195000,
    purchaseCount: 2
  },
  {
    id: 4,
    name: 'Distributeur Boissons Hamoud Boualem',
    company: 'Distributeur Boissons Hamoud Boualem',
    phone: '021 65 43 21',
    address: 'Alger, Rouïba',
    rc: '16/00-1234567B15',
    nif: '151600000000000',
    ai: '1601007788',
    nis: '001616000000000',
    initialDebt: 0,
    debt: 0,
    totalPurchases: 320000,
    purchaseCount: 8
  },
  {
    id: 5,
    name: 'Minoterie Safina & Céréales',
    company: 'Minoterie Safina & Céréales',
    phone: '026 33 22 11',
    address: 'Tizi Ouzou, Oued Aïssi',
    rc: '15/00-4455667B18',
    nif: '151500000000000',
    ai: '1501009900',
    nis: '001515000000000',
    initialDebt: 0,
    debt: 0,
    totalPurchases: 85000,
    purchaseCount: 2
  }
];

export default function FournisseursView() {
  const { t, language } = useLanguage();
  // ══ 1. Données Fournisseurs ══
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_suppliers');
      let list = saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
      // Synchroniser le crédit de 2 000 DA sur Candia pour tester les versements prioritaires
      const candia = list.find((s) => s.id === 3 || s.name?.includes('Candia'));
      if (candia && candia.debt === 45000) {
        candia.debt = 47000;
        localStorage.setItem('novamag_suppliers', JSON.stringify(list));
      }
      return list;
    } catch {
      return INITIAL_SUPPLIERS;
    }
  });

  // ══ 2. Filtres & Affichage ══
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'debt' | 'uptodate'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (Étiquettes) | 'table' (Tableau)

  // ══ 3. Modals ══
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [supplierToSettle, setSupplierToSettle] = useState(null);
  const [supplierForHistory, setSupplierForHistory] = useState(null);

  // ══ 4. Toast Notifications ══
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // ══ 5. Modale de Confirmation Élégante ══
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Confirmation',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: () => {}
  });

  // Synchronisation avec localStorage
  useEffect(() => {
    try {
      localStorage.setItem('novamag_suppliers', JSON.stringify(suppliers));
      window.dispatchEvent(new Event('novamag_suppliers_updated'));
    } catch (e) {
      console.error(e);
    }
  }, [suppliers]);

  // Synchronisation dynamique des achats fournisseurs depuis localStorage avec enrichissement automatique
  const purchasesList = useMemo(() => {
    try {
      let saved = localStorage.getItem('novamag_supplier_purchases');
      if (!saved || saved === '[]') {
        const enriched = ensurePurchaseItems(INITIAL_SUPPLIER_PURCHASES);
        return enriched;
      }
      return ensurePurchaseItems(JSON.parse(saved));
    } catch {
      return ensurePurchaseItems(INITIAL_SUPPLIER_PURCHASES);
    }
  }, []);

  const supplierPurchasesMap = useMemo(() => {
    const map = {};
    purchasesList.forEach((p) => {
      const id = p.supplierId;
      if (!map[id]) map[id] = { total: 0, count: 0 };
      map[id].total += Number(p.total || 0);
      map[id].count += 1;
    });
    return map;
  }, [purchasesList]);

  // ══ 5. Calculs KPI Globaux ══
  const totalSuppliersCount = suppliers.length;
  const debtSuppliersCount = suppliers.filter((s) => Number(s.debt || 0) > 0).length;
  const upToDateSuppliersCount = totalSuppliersCount - debtSuppliersCount;
  const totalDebtOverall = suppliers.reduce((sum, s) => sum + (Number(s.debt) || 0), 0);
  const totalPurchasesOverall = Object.values(supplierPurchasesMap).reduce((sum, s) => sum + s.total, 0);

  // Filtrage des fournisseurs
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const debt = Number(s.debt || 0);
      if (activeFilter === 'debt' && debt <= 0) return false;
      if (activeFilter === 'uptodate' && debt > 0) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.company?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.contact?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.rc?.toLowerCase().includes(q) ||
        s.nif?.toLowerCase().includes(q)
      );
    });
  }, [suppliers, activeFilter, searchTerm]);

  // Sauvegarde fournisseur
  const handleSaveSupplier = (supplierData, isEdit) => {
    if (isEdit) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierData.id ? supplierData : s))
      );
      showToast(`✓ Informations du fournisseur "${supplierData.name}" mises à jour avec succès`);
    } else {
      setSuppliers((prev) => [supplierData, ...prev]);
      showToast(`✓ Nouveau fournisseur "${supplierData.name}" ajouté avec succès`);
    }
    setSupplierToEdit(null);
  };

  // Suppression fournisseur
  const handleDeleteSupplier = (supplier) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer le fournisseur",
      message: `Êtes-vous certain de vouloir supprimer définitivement le fournisseur "${supplier.name}" ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => {
        setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
        showToast(`Fournisseur "${supplier.name}" supprimé`, 'info');
      }
    });
  };

  // Callback règlement dette fournisseur
  const handleSupplierSettled = (updatedSupplier, paymentRecord) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s))
    );
    try {
      const saved = localStorage.getItem('novamag_supplier_payments');
      const all = saved ? JSON.parse(saved) : [];
      localStorage.setItem('novamag_supplier_payments', JSON.stringify([paymentRecord, ...all]));
    } catch (e) {}

    // Si une part du règlement est allouée aux dettes de factures d'achat, mettre à jour la facture correspondante
    if (paymentRecord.paidToOtherDebt > 0) {
      try {
        const savedPurchases = localStorage.getItem('novamag_supplier_purchases');
        let purchases = savedPurchases ? JSON.parse(savedPurchases) : [];
        let remainingToDeduct = paymentRecord.paidToOtherDebt;
        purchases = purchases.map((p) => {
          if ((String(p.supplierId) === String(updatedSupplier.id) || p.supplierName === updatedSupplier.name) && remainingToDeduct > 0) {
            const unpaid = Number(p.unpaid || 0);
            if (unpaid > 0) {
              const deduct = Math.min(unpaid, remainingToDeduct);
              p.unpaid = unpaid - deduct;
              p.paid = (Number(p.paid || 0)) + deduct;
              if (p.unpaid <= 0) p.status = 'PAID';
              remainingToDeduct -= deduct;
            }
          }
          return p;
        });
        localStorage.setItem('novamag_supplier_purchases', JSON.stringify(purchases));
      } catch (e) {}
    }

    showToast(
      `✓ Règlement de ${paymentRecord.amount.toLocaleString()} DA enregistré pour le fournisseur ${updatedSupplier.name}`,
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
              <Truck className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                {language === 'ar' ? 'الموردون ودفتر الديون' : 'Fournisseurs & Carnet de Dettes'}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'ar'
                  ? 'إدارة حسابات الموردين، متابعة ديون المشتريات، سجل فواتير الاستلام والمدفوعات.'
                  : 'Gestion des comptes fournisseurs, suivi des dettes d\'achats, historique des réceptions et règlements.'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSupplierToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
          <span>{language === 'ar' ? 'مورد جديد' : 'Nouveau Fournisseur'}</span>
        </button>
      </div>

      {/* ══ CARTES STATISTIQUES GLOBALES (4 KPI) ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Fournisseurs */}
        <div className="bg-white dark:bg-[#111C35] p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ar' ? 'إجمالي الموردين' : 'Total Fournisseurs'}
            </span>
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-mono font-bold text-slate-800 dark:text-white">
              {totalSuppliersCount}
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              {language === 'ar'
                ? `${upToDateSuppliersCount} مسوى • ${debtSuppliersCount} عليه دين`
                : `${upToDateSuppliersCount} à jour • ${debtSuppliersCount} avec dette`}
            </span>
          </div>
          <div className="absolute -right-2 -bottom-2 w-14 h-14 bg-blue-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Total Achats Réalisés */}
        <div className="bg-white dark:bg-[#111C35] p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ar' ? 'مشتريات الموردين' : 'Achats Fournisseurs'}
            </span>
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-mono font-bold text-blue-900 dark:text-blue-200" dir="ltr">
              {totalPurchasesOverall.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </div>
            <span className="text-[10px] font-medium text-blue-600/80 dark:text-blue-400 flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" />
              {language === 'ar' ? 'إجمالي البضائع المشتراة' : 'Total des marchandises acquises'}
            </span>
          </div>
          <div className="absolute -right-2 -bottom-2 w-14 h-14 bg-blue-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Dettes Fournisseurs à Régler */}
        <div className="bg-white dark:bg-[#111C35] p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ar' ? 'ديون الموردين (واجبة الدفع)' : 'Dettes Fournisseurs (À régler)'}
            </span>
            <Coins className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-mono font-bold text-rose-600 dark:text-rose-400" dir="ltr">
              {totalDebtOverall.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </div>
            <span className="text-[10px] font-medium text-rose-600/80 dark:text-rose-400">
              {language === 'ar'
                ? `${debtSuppliersCount} مورد لديهم رصيد مستحق`
                : `${debtSuppliersCount} fournisseur(s) avec solde à payer`}
            </span>
          </div>
          <div className="absolute -right-2 -bottom-2 w-14 h-14 bg-rose-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Fournisseurs Réglés (À Jour) */}
        <div className="bg-white dark:bg-[#111C35] p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'ar' ? 'موردون مسوون' : 'Fournisseurs Réglés'}
            </span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1.5">
            <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {upToDateSuppliersCount} {language === 'ar' ? 'حساب' : 'comptes'}
            </div>
            <span className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400">
              {language === 'ar' ? 'الرصيد 0 دج (ديون مسواة) ✓' : 'Solde 0 DA (Dettes apurées) ✓'}
            </span>
          </div>
          <div className="absolute -right-2 -bottom-2 w-14 h-14 bg-emerald-500/5 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* ══ BARRE DE RECHERCHE, FILTRES & COMMUTATEUR DE VUE ══ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111C35] p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        
        {/* Champ de recherche */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'بحث باسم المورد، الهاتف، المدينة، السجل التجاري...' : 'Rechercher par nom de fournisseur, téléphone, ville, RC, NIF...'}
            className="w-full text-xs font-medium pl-10 rtl:pl-4 rtl:pr-10 pr-9 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtres Pilules */}
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
            {language === 'ar' ? 'الكل' : 'Tous'} ({totalSuppliersCount})
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
            <span>{language === 'ar' ? 'عليهم دين' : 'Avec Dette'} ({debtSuppliersCount})</span>
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
            <span>{language === 'ar' ? 'مسوون' : 'À jour'} ({upToDateSuppliersCount})</span>
          </button>
        </div>

        {/* Sélecteur Étiquettes vs Tableau */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
            className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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

      {/* ══ VUE 1 : STYLE ÉTIQUETTES / CARTES FOURNISSEURS (CONFORME PHOTO 1) ══ */}
      {viewMode === 'grid' && (
        filteredSuppliers.length === 0 ? (
          <div className="bg-white dark:bg-[#111C35] rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto stroke-[1.5]" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Aucun fournisseur ne correspond à votre recherche
            </h3>
            <p className="text-xs text-slate-400">
              Essayez un autre mot-clé ou réinitialisez vos filtres.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSuppliers.map((sup) => {
              const debt = Number(sup.debt || 0);
              const hasDebt = debt > 0;
              const purchasesInfo = supplierPurchasesMap[sup.id] || { total: 0, count: 0 };
              const purchases = purchasesInfo.total;
              const purchaseCount = purchasesInfo.count;

              return (
                <div
                  key={sup.id}
                  className={`bg-white dark:bg-[#111C35] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between relative group shadow-[0_6px_18px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.12),0_4px_10px_rgba(15,23,42,0.06)] hover:-translate-y-1 transition-all duration-200 border-l-[5px] ${
                    hasDebt ? 'border-l-rose-500' : 'border-l-emerald-500'
                  }`}
                >
                  {/* Haut : Actions (Modifier/Supprimer) à gauche & Badge Initiale à droite */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      {/* Boutons Actions (Supprimer + Modifier) */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(sup)}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center transition-all cursor-pointer"
                          title="Supprimer le fournisseur"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSupplierToEdit(sup);
                            setIsAddModalOpen(true);
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-blue-950/40 text-slate-400 hover:text-blue-600 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center transition-all cursor-pointer"
                          title="Modifier les coordonnées du fournisseur"
                        >
                          <Edit3 className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                      </div>

                      {/* Badge Lettre Initiale */}
                      <div className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center border shadow-2xs ${
                        hasDebt
                          ? 'bg-rose-50 text-rose-600 border-rose-200/70 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                      }`}>
                        {sup.name?.trim()?.charAt(0)?.toUpperCase() || 'F'}
                      </div>
                    </div>

                    {/* Centre : Nom du fournisseur & Ville / Localisation */}
                    <div className="text-center mt-2.5 mb-3 px-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate" title={sup.name}>
                        {sup.name}
                      </h3>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{sup.address || 'Non spécifié'}</span>
                      </div>
                    </div>

                    {/* Milieu : Données clés (Téléphone, NIF, RC, Solde/Dette) */}
                    <div className="space-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      {/* Téléphone */}
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                          {language === 'ar' ? 'الهاتف' : 'Téléphone'}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200" dir="ltr">
                          {sup.phone || '-'}
                        </span>
                      </div>

                      {/* NIF */}
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">NIF</span>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300" dir="ltr">
                          {sup.nif || '-'}
                        </span>
                      </div>

                      {/* RC */}
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">RC</span>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300" dir="ltr">
                          {sup.rc || '-'}
                        </span>
                      </div>

                      {/* Solde Dette */}
                      <div className="flex items-center justify-between py-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                          {hasDebt
                            ? (language === 'ar' ? 'دين مستحق' : 'Dette à payer')
                            : (language === 'ar' ? 'رصيد الدين' : 'Solde Dette')}
                        </span>
                        <span className={`font-mono text-xs font-bold ${
                          hasDebt ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`} dir="ltr">
                          {hasDebt 
                            ? `${debt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA` 
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
                          onClick={() => setSupplierForHistory(sup)}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="truncate">{language === 'ar' ? 'بطاقة المورد' : 'Fiche Fournisseur'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSupplierToSettle(sup)}
                          className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-98 shrink-0"
                          title={language === 'ar' ? 'تسوية الدين' : 'Régler le versement de la dette'}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تسديد' : 'Régler'}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSupplierForHistory(sup)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                      >
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>{language === 'ar' ? 'بطاقة المورد' : 'Fiche Fournisseur'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ══ VUE 2 : MODE TABLEAU ══ */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-[#111C35] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <table className="w-full text-left rtl:text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">{language === 'ar' ? 'المورد' : 'Fournisseur'}</th>
                <th className="py-3 px-3">{language === 'ar' ? 'الهاتف والمدينة' : 'Téléphone & Ville'}</th>
                <th className="py-3 px-3">{language === 'ar' ? 'المعرفات الجبائية' : 'Identifiants Fiscaux'}</th>
                <th className="py-3 px-3 text-right rtl:text-left">{language === 'ar' ? 'إجمالي المشتريات' : 'Total Achats'}</th>
                <th className="py-3 px-3 text-right rtl:text-left">{language === 'ar' ? 'دين المورد' : 'Dette Fournisseur'}</th>
                <th className="py-3 px-4 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredSuppliers.map((sup) => {
                const debt = Number(sup.debt || 0);
                const hasDebt = debt > 0;

                return (
                  <tr key={sup.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {sup.name?.charAt(0)?.toUpperCase() || 'F'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white">{sup.name}</div>
                          {sup.company && sup.company !== sup.name && <div className="text-[10px] text-slate-400">{sup.company}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-slate-600 dark:text-slate-300" dir="ltr">{sup.phone || '-'}</div>
                      <div className="text-[10px] text-slate-400">{sup.address || '-'}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500" dir="ltr">
                      {sup.nif ? `NIF: ${sup.nif}` : ''} {sup.rc ? `• RC: ${sup.rc}` : ''}
                    </td>

                    <td className="py-3 px-3 text-right rtl:text-left">
                      <div className="font-mono font-bold text-slate-800 dark:text-white" dir="ltr">
                        {(Number(supplierPurchasesMap[sup.id]?.total || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {supplierPurchasesMap[sup.id]?.count || 0} {language === 'ar' ? 'وصل' : 'bon(s)'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right rtl:text-left font-mono font-semibold">
                      {hasDebt ? (
                        <span className="text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 font-bold" dir="ltr">
                          {debt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA ({language === 'ar' ? 'دين' : 'Dette'})
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md font-medium" dir="ltr">
                          0,00 DA ({language === 'ar' ? 'مسوى' : 'À jour'})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSupplierForHistory(sup)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title={language === 'ar' ? 'بطاقة المورد' : 'Fiche Fournisseur'}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSupplierToSettle(sup)}
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
                          onClick={() => {
                            setSupplierToEdit(sup);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title={language === 'ar' ? 'تعديل' : 'Modifier'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(sup)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title={language === 'ar' ? 'حذف' : 'Supprimer'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddSupplierModal
        isOpen={isAddModalOpen}
        supplierToEdit={supplierToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setSupplierToEdit(null);
        }}
        onSave={handleSaveSupplier}
      />

      <SettleSupplierDebtModal
        isOpen={!!supplierToSettle}
        supplier={supplierToSettle}
        onClose={() => setSupplierToSettle(null)}
        onSettled={(updatedSupplier, paymentRecord) => {
          handleSupplierSettled(updatedSupplier, paymentRecord);
          if (supplierForHistory && supplierForHistory.id === updatedSupplier.id) {
            setSupplierForHistory(updatedSupplier);
          }
        }}
      />

      <SupplierHistoryModal
        isOpen={!!supplierForHistory}
        supplier={supplierForHistory}
        onClose={() => setSupplierForHistory(null)}
        onOpenSettle={(sup) => setSupplierToSettle(sup)}
        onUpdateSupplier={(updatedSupplier) => {
          setSuppliers((prev) =>
            prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s))
          );
          setSupplierForHistory(updatedSupplier);
        }}
      />

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
