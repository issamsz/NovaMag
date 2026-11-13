import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  X, 
  Building2, 
  Phone, 
  MapPin, 
  FileText, 
  Coins, 
  Receipt, 
  ShoppingBag, 
  Printer, 
  Calendar, 
  Eye, 
  Plus,
  CheckCircle2,
  RotateCcw,
  PackageMinus,
  Trash2
} from 'lucide-react';
import PurchaseDetailsModal from './PurchaseDetailsModal';
import AddSupplierReturnModal from './AddSupplierReturnModal';
import ReturnDetailsModal from '../common/ReturnDetailsModal';
import PaymentDetailsModal from '../common/PaymentDetailsModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { triggerSilentIframePrint } from '../../services/thermalPrinter';

// Factures d'achats initiales réalistes et complètes avec articles détaillés
export const INITIAL_SUPPLIER_PURCHASES = [
  {
    id: 101,
    supplierId: 3,
    supplierName: 'Candia Laiterie Algérie',
    invoiceNumber: 'BA-2026-0089',
    description: 'Pack Lait UHT Demi-Écrémé & Produits Laitiers',
    dateStr: '28/10/2026',
    timestamp: '2026-10-28T10:30:00.000Z',
    total: 120000,
    paid: 120000,
    unpaid: 0,
    status: 'PAID',
    paymentMethod: 'Virement Bancaire',
    items: [
      { name: 'Pack Lait UHT Candia Demi-Écrémé 1L (Pack de 12)', quantity: 60, unitPrice: 1350, total: 81000 },
      { name: 'Pack Candia Silhouette Écrémé 1L (Pack de 12)', quantity: 26, unitPrice: 1500, total: 39000 }
    ]
  },
  {
    id: 102,
    supplierId: 3,
    supplierName: 'Candia Laiterie Algérie',
    invoiceNumber: 'BA-2026-0104',
    description: 'Assortiment Yaourts Nature Brassé & Fromages Frais (Crédit : 2 000 DA)',
    dateStr: '03/11/2026',
    timestamp: '2026-11-03T14:15:00.000Z',
    total: 75000,
    paid: 73000,
    unpaid: 2000,
    status: 'PARTIAL',
    paymentMethod: 'Chèque (Partiel : 73 000 DA)',
    items: [
      { name: 'Yaourt Nature Brassé Candia (Carton de 24 pots)', quantity: 25, unitPrice: 1800, total: 45000 },
      { name: 'Fromage Frais Traditionnel Candia 500g', quantity: 100, unitPrice: 300, total: 30000 }
    ]
  },
  {
    id: 103,
    supplierId: 1,
    supplierName: 'Grossiste Matériel & POS Algérie',
    invoiceNumber: 'BA-2026-0015',
    description: 'Terminaux Tactiles All-in-One & Scanneurs 2D',
    dateStr: '15/10/2026',
    timestamp: '2026-10-15T09:00:00.000Z',
    total: 450000,
    paid: 450000,
    unpaid: 0,
    status: 'PAID',
    paymentMethod: 'Virement Bancaire',
    items: [
      { name: 'Terminal Tactile All-in-One POS 15.6" Pro Nova', quantity: 5, unitPrice: 70000, total: 350000 },
      { name: 'Scanneur Code-barres 2D Filaire USB Haute Précision', quantity: 10, unitPrice: 10000, total: 100000 }
    ]
  },
  {
    id: 104,
    supplierId: 2,
    supplierName: 'Xprinter Algérie Officiel',
    invoiceNumber: 'BA-2026-0042',
    description: 'Lot Imprimantes Thermiques XP-Q800 & Rouleaux 80mm',
    dateStr: '22/10/2026',
    timestamp: '2026-10-22T11:45:00.000Z',
    total: 280000,
    paid: 280000,
    unpaid: 0,
    status: 'PAID',
    paymentMethod: 'Espèces',
    items: [
      { name: 'Imprimante Thermique XP-Q800 80mm USB+LAN', quantity: 14, unitPrice: 18000, total: 252000 },
      { name: 'Carton Rouleaux Papier Thermique 80x80 (50 rouleaux)', quantity: 4, unitPrice: 7000, total: 28000 }
    ]
  },
  {
    id: 105,
    supplierId: 4,
    supplierName: 'Distributeur Boissons Hamoud Boualem',
    invoiceNumber: 'BA-2026-0071',
    description: 'Palettes Sélecto, Slim & Gazouz Blanche 1L',
    dateStr: '25/10/2026',
    timestamp: '2026-10-25T16:20:00.000Z',
    total: 320000,
    paid: 320000,
    unpaid: 0,
    status: 'PAID',
    paymentMethod: 'Chèque',
    items: [
      { name: 'Palette Sélecto 1L (72 fardeaux de 6 bouteilles)', quantity: 2, unitPrice: 80000, total: 160000 },
      { name: 'Palette Slim Citron 1L (72 fardeaux)', quantity: 1, unitPrice: 80000, total: 80000 },
      { name: 'Palette Hamoud Blanche 1L (72 fardeaux)', quantity: 1, unitPrice: 80000, total: 80000 }
    ]
  },
  {
    id: 106,
    supplierId: 5,
    supplierName: 'Minoterie Safina & Céréales',
    invoiceNumber: 'BA-2026-0055',
    description: 'Sacs Farine Extra Panifiable & Semoule Supérieure',
    dateStr: '18/10/2026',
    timestamp: '2026-10-18T08:30:00.000Z',
    total: 85000,
    paid: 85000,
    unpaid: 0,
    status: 'PAID',
    paymentMethod: 'Espèces',
    items: [
      { name: 'Sac Farine Extra Panifiable Safina 25kg', quantity: 20, unitPrice: 2500, total: 50000 },
      { name: 'Sac Semoule Supérieure Moyenne 25kg', quantity: 14, unitPrice: 2500, total: 35000 }
    ]
  }
];

// Helper robuste d'enrichissement et de migration des articles pour toutes les factures d'achat
export function ensurePurchaseItems(list) {
  if (!Array.isArray(list) || list.length === 0) {
    try {
      localStorage.setItem('novamag_supplier_purchases', JSON.stringify(INITIAL_SUPPLIER_PURCHASES));
    } catch {}
    return INITIAL_SUPPLIER_PURCHASES;
  }

  let hasChanged = false;
  const enriched = list.map((p) => {
    // Si la facture a déjà des articles valides et non vides
    if (Array.isArray(p.items) && p.items.length > 0) {
      return p;
    }

    // 1. Recherche par numéro de facture ou identifiant dans INITIAL_SUPPLIER_PURCHASES
    const match = INITIAL_SUPPLIER_PURCHASES.find(
      (ip) => (ip.invoiceNumber && ip.invoiceNumber === p.invoiceNumber) || ip.id === p.id
    );

    if (match && Array.isArray(match.items) && match.items.length > 0) {
      hasChanged = true;
      return {
        ...p,
        items: match.items,
        description: p.description || match.description
      };
    }

    // 2. Si pas trouvé dans INITIAL_SUPPLIER_PURCHASES, synthétiser à partir de la description/total
    hasChanged = true;
    const name = p.description || 'Marchandise diverse';
    const total = Number(p.total || 0);
    return {
      ...p,
      items: [
        {
          name,
          quantity: 1,
          unitPrice: total,
          total
        }
      ]
    };
  });

  if (hasChanged) {
    try {
      localStorage.setItem('novamag_supplier_purchases', JSON.stringify(enriched));
    } catch {}
  }

  return enriched;
}

export default function SupplierHistoryModal({
  isOpen,
  supplier,
  onClose,
  onOpenSettle,
  onUpdateSupplier
}) {
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' | 'payments' | 'returns'
  const [selectedPurchaseForDetails, setSelectedPurchaseForDetails] = useState(null);
  const [selectedReturnForDetails, setSelectedReturnForDetails] = useState(null);
  const [selectedPaymentForDetails, setSelectedPaymentForDetails] = useState(null);
  const [isAddReturnModalOpen, setIsAddReturnModalOpen] = useState(false);
  const [returnsList, setReturnsList] = useState([]);
  const [purchasesVersion, setPurchasesVersion] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Confirmation',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: () => {}
  });

  // Charger les retours fournisseur depuis localStorage
  const loadReturns = () => {
    if (!supplier) return;
    try {
      const saved = localStorage.getItem('novamag_supplier_returns');
      const all = saved ? JSON.parse(saved) : [];
      const filtered = all.filter(
        (r) => String(r.supplierId) === String(supplier.id) || r.supplierName === supplier.name
      );
      setReturnsList(filtered);
    } catch {
      setReturnsList([]);
    }
  };

  useEffect(() => {
    if (isOpen && supplier) {
      loadReturns();
    }
  }, [isOpen, supplier]);

  useEffect(() => {
    const handleSyncPurchases = () => setPurchasesVersion((v) => v + 1);
    window.addEventListener('novamag_purchases_updated', handleSyncPurchases);
    window.addEventListener('storage', handleSyncPurchases);
    return () => {
      window.removeEventListener('novamag_purchases_updated', handleSyncPurchases);
      window.removeEventListener('storage', handleSyncPurchases);
    };
  }, []);

  // Charger les achats depuis localStorage avec initialisation intelligente si vide
  const purchases = useMemo(() => {
    if (!supplier) return [];
    try {
      let saved = localStorage.getItem('novamag_supplier_purchases');
      let all = saved ? JSON.parse(saved) : [];
      if (!all || all.length === 0) {
        all = ensurePurchaseItems(INITIAL_SUPPLIER_PURCHASES);
      } else {
        // Synchroniser le crédit de 2 000 DA sur la facture BA-2026-0104 de Candia
        const inv102 = all.find((p) => p.id === 102 || p.invoiceNumber === 'BA-2026-0104');
        if (inv102 && (inv102.paid === 75000 || !inv102.unpaid)) {
          inv102.paid = 73000;
          inv102.unpaid = 2000;
          inv102.status = 'PARTIAL';
          inv102.description = 'Assortiment Yaourts Nature Brassé & Fromages Frais (Crédit : 2 000 DA)';
          inv102.paymentMethod = 'Chèque (Partiel : 73 000 DA)';
          inv102.items = [
            { name: 'Yaourt Nature Brassé Candia (Carton de 24 pots)', quantity: 25, unitPrice: 1800, total: 45000 },
            { name: 'Fromage Frais Traditionnel Candia 500g', quantity: 100, unitPrice: 300, total: 30000 }
          ];
        }

        // Compléter et sauvegarder les items si manquants
        all = ensurePurchaseItems(all);
      }
      return all.filter((p) => String(p.supplierId) === String(supplier.id) || p.supplierName === supplier.name);
    } catch {
      return [];
    }
  }, [supplier, isOpen, purchasesVersion]);

  // Charger les règlements de dette fournisseur depuis localStorage
  const payments = useMemo(() => {
    if (!supplier) return [];
    try {
      const saved = localStorage.getItem('novamag_supplier_payments');
      const all = saved ? JSON.parse(saved) : [];
      return all.filter((p) => String(p.supplierId) === String(supplier.id) || p.supplierName === supplier.name);
    } catch {
      return [];
    }
  }, [supplier, isOpen, purchasesVersion]);

  if (!isOpen || !supplier) return null;

  const currentDebt = Number(supplier.debt || 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const initialDebt = Number(supplier.initialDebt || 0);

  // Allocation de versement sur la dette initiale
  const initialDebtPaid = Math.min(initialDebt, totalPaid);
  const remainingInitialDebt = Math.max(0, initialDebt - totalPaid);

  // Callback après ajout d'un retour
  const handleReturnAdded = (newReturn, updatedSupplier) => {
    setReturnsList((prev) => [newReturn, ...prev]);
    if (onUpdateSupplier && updatedSupplier) {
      onUpdateSupplier(updatedSupplier);
    }
  };

  // Suppression d'un bon de retour
  const handleDeleteReturn = (ret) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer le bon de retour",
      message: `Êtes-vous certain de vouloir supprimer le bon de retour N° ${ret.returnNumber} ? Cette action restituera la dette associée le cas échéant.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => {
        try {
          const saved = localStorage.getItem('novamag_supplier_returns');
          if (saved) {
            const all = JSON.parse(saved);
            const filtered = all.filter((r) => r.id !== ret.id);
            localStorage.setItem('novamag_supplier_returns', JSON.stringify(filtered));
            setReturnsList((prev) => prev.filter((r) => r.id !== ret.id));

            // Si déduction de dette, restituer la dette
            if (ret.deductFromDebt > 0) {
              const restoredDebt = (Number(supplier.debt || 0)) + Number(ret.deductFromDebt);
              const updated = { ...supplier, debt: restoredDebt };
              const savedSuppliers = localStorage.getItem('novamag_suppliers');
              if (savedSuppliers) {
                const list = JSON.parse(savedSuppliers);
                const idx = list.findIndex((s) => s.id === supplier.id);
                if (idx !== -1) {
                  list[idx].debt = restoredDebt;
                  localStorage.setItem('novamag_suppliers', JSON.stringify(list));
                }
              }
              if (onUpdateSupplier) onUpdateSupplier(updated);
            }
          }
        } catch {}
      }
    });
  };

  // Impression reçu thermique de retour
  const handlePrintReturnTicket = (ret) => {
    const sysSettings = (() => {
      try { return JSON.parse(localStorage.getItem('novamag_system_settings') || '{}'); } catch { return {}; }
    })();
    const storeName = sysSettings.storeName && !sysSettings.storeName.includes('لومينا') ? sysSettings.storeName : 'NovaMag POS';
    const paperWidth = Number(sysSettings.thermalPaperWidth) > 0 ? Number(sysSettings.thermalPaperWidth) : 80;

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
        <div class="center" style="font-size: 10px; color: #555;">BON DE RETOUR FOURNISSEUR</div>
        <div class="center bold" style="font-size: 12px; margin-top: 3px;">N° ${ret.returnNumber}</div>
        <div class="center" style="font-size: 10px; color: #666;">Date : ${ret.dateStr}</div>
        <div class="divider"></div>
        <div><b>Fournisseur :</b> ${supplier.name}</div>
        <div><b>Motif :</b> ${ret.motif}</div>
        <div class="divider"></div>
        ${(ret.items || []).map((it) => `
          <div class="row">
            <span>${it.quantity}x ${it.name}</span>
            <span class="bold">${(Number(it.total || 0)).toLocaleString()} DA</span>
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="row bold" style="font-size: 13px;">
          <span>TOTAL RETOUR :</span>
          <span>${Number(ret.total || 0).toLocaleString()} DA</span>
        </div>
        ${ret.deductFromDebt > 0 ? `
          <div class="row" style="color: #d97706; font-weight: 700;">
            <span>Déduit de la dette :</span>
            <span>-${Number(ret.deductFromDebt).toLocaleString()} DA</span>
          </div>
        ` : ''}
        ${ret.cashRefund > 0 ? `
          <div class="row" style="color: #059669; font-weight: 700;">
            <span>Remboursement Espèces :</span>
            <span>+${Number(ret.cashRefund).toLocaleString()} DA</span>
          </div>
        ` : ''}
      </body></html>
    `;
    triggerSilentIframePrint(html, sysSettings);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn select-none"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* En-tête */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/20 shrink-0">
                {supplier.name?.charAt(0)?.toUpperCase() || 'F'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800 dark:text-white truncate">
                    {supplier.name}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                    FOURN-{String(supplier.id).slice(-4)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  {supplier.phone && (
                    <span className="flex items-center gap-1 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      <Phone className="w-3 h-3 text-blue-500" />
                      {supplier.phone}
                    </span>
                  )}
                  {supplier.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{supplier.address}</span>
                    </span>
                  )}
                  {supplier.nif && <span>• NIF : {supplier.nif}</span>}
                  {supplier.rc && <span>• RC : {supplier.rc}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentDebt > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettle && onOpenSettle(supplier);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Régler Dette</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* Corps */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
            
            {/* 3 Cartes statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* 1. Total Achats */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Achats (Dépenses)</span>
                <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                  {totalPurchases.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{purchases.length} bon(s) d'achat</span>
              </div>

              {/* 2. Total Règlements Versés */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Règlements Versés</span>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{payments.length} versement(s)</span>
              </div>

              {/* 3. Dette Restante à Payer */}
              <div className={`p-3.5 rounded-xl border ${
                currentDebt > 0
                  ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  currentDebt > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}>
                  Dettes Restantes à Payer
                </span>
                <div className={`text-lg font-bold font-mono mt-0.5 ${
                  currentDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {currentDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                </div>
                <span className={`text-[10px] font-medium ${
                  currentDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {currentDebt > 0 ? 'Créance fournisseur ouverte' : 'Compte fournisseur à jour ✓'}
                </span>
              </div>
            </div>

            {/* Carte Dette Initiale Fournisseur */}
            <div className="p-4 rounded-2xl bg-[#FFFBEB] dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-950 dark:text-amber-200">
                    Dette Initiale du Fournisseur
                  </span>
                  {remainingInitialDebt <= 0 && initialDebt > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      Entièrement Soldée ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                  Dette initiale (dettes antérieures avant utilisation du logiciel) :{' '}
                  <span className="font-mono font-bold text-amber-900 dark:text-amber-200">
                    {initialDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </span>
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 block">
                  Dette Initiale (Restant) :
                </span>
                <div className={`text-lg sm:text-xl font-black font-mono mt-0.5 ${
                  remainingInitialDebt > 0 ? 'text-amber-900 dark:text-amber-200' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {remainingInitialDebt > 0 
                    ? `${remainingInitialDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA`
                    : '0,00 DA (Soldée ✓)'}
                </div>
              </div>
            </div>

            {/* Onglets (3 Onglets avec Retours Fournisseur Conforme Photo 2) */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('purchases')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'purchases'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Bons d'Achat & Factures ({purchases.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'payments'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Règlements de Dettes ({payments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('returns')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'returns'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retours Fournisseur ({returnsList.length})</span>
              </button>
            </div>

            {/* ══ TAB 1 : BONS D'ACHAT (CLIQUABLES AVEC DÉTAILS) ══ */}
            {activeTab === 'purchases' && (
              purchases.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Aucun bon d'achat enregistré pour ce fournisseur pour le moment.
                </div>
              ) : (
                <div className="space-y-2">
                  {purchases.map((p) => {
                    const unpaidAmount = Number(p.unpaid ?? (Number(p.total || 0) - Number(p.paid || 0))) || 0;
                    const isPaid = unpaidAmount <= 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPurchaseForDetails(p)}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:border-blue-400 dark:hover:border-blue-700 transition-all flex items-center justify-between gap-3 text-xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                            isPaid 
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' 
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 dark:text-white">Bon N° {p.invoiceNumber || p.id}</span>
                              {isPaid ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-900/40">
                                  Payé ✓
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-200/60 dark:border-rose-900/40">
                                  Reste à crédit : {unpaidAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {p.description || 'Bon d\'achat marchandise'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Date : {p.dateStr || p.timestamp?.slice(0, 10)} • Règlement : {p.paymentMethod || 'Espèces'}
                              {!isPaid && ` (Payé : ${(Number(p.paid || 0)).toLocaleString()} DA)`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="text-right">
                            <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                              {(Number(p.total) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                            </div>
                            {!isPaid && (
                              <div className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                                Crédit : {unpaidAmount.toLocaleString()} DA
                              </div>
                            )}
                          </div>

                          {/* Bouton Voir Détails */}
                          <button
                            type="button"
                            onClick={() => setSelectedPurchaseForDetails(p)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                            title="Voir les détails complets du bon d'achat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ══ TAB 2 : RÈGLEMENTS DE DETTES ══ */}
            {activeTab === 'payments' && (
              payments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Aucun versement de dette enregistré pour ce fournisseur.
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPaymentForDetails(p)}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:border-emerald-400 dark:hover:border-emerald-700 transition-all flex items-center justify-between gap-3 text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Coins className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-white">Règlement N° {p.receiptNumber}</span>
                            {p.paidToInitialDebt > 0 && (
                              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold border border-amber-200/60 dark:border-amber-900/40">
                                Dette Initiale : -{Number(p.paidToInitialDebt).toLocaleString()} DA
                              </span>
                            )}
                            {p.paidToOtherDebt > 0 && (
                              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold border border-blue-200/60 dark:border-blue-900/40">
                                Achats : -{Number(p.paidToOtherDebt).toLocaleString()} DA
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{p.dateStr} • Mode : {p.method} {p.notes && `(${p.notes})`}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            -{(Number(p.amount) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">Reste : {Number(p.remainingDebt || 0).toLocaleString()} DA</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedPaymentForDetails(p)}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Voir les détails complets du versement"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ══ TAB 3 : RETOURS FOURNISSEUR (100% FRANÇAIS SANS ARABE) ══ */}
            {activeTab === 'returns' && (
              <div className="space-y-3">
                {/* En-tête de section avec Titre et Bouton */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddReturnModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                  >
                    <PackageMinus className="w-4 h-4 stroke-[2.4]" />
                    <span>Nouveau Retour Fournisseur</span>
                  </button>

                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    <RotateCcw className="w-4 h-4" />
                    <span>Retours Fournisseur</span>
                  </div>
                </div>

                {/* Tableau 100% Français */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 text-left font-bold">N° / Date du bon</th>
                        <th className="py-2.5 px-3 text-left font-bold">Motif du retour</th>
                        <th className="py-2.5 px-3 text-center font-bold">Total</th>
                        <th className="py-2.5 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                          Déduction Dette
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          Remboursement Espèces
                        </th>
                        <th className="py-2.5 px-3 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {returnsList.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                            Aucun retour enregistré pour ce fournisseur pour le moment.
                          </td>
                        </tr>
                      ) : (
                        returnsList.map((ret) => (
                          <tr 
                            key={ret.id} 
                            onClick={() => setSelectedReturnForDetails(ret)}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-3">
                              <div className="font-mono font-bold text-slate-800 dark:text-white group-hover:text-rose-600 transition-colors">
                                {ret.returnNumber}
                              </div>
                              <div className="text-[10px] text-slate-400">{ret.dateStr}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                              <div>{ret.motif}</div>
                              {ret.items && ret.items.length > 0 && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {ret.items.length} article(s) : {ret.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-white">
                              {Number(ret.total || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                              {ret.deductFromDebt > 0 
                                ? `${Number(ret.deductFromDebt).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA` 
                                : '-'}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {ret.cashRefund > 0 
                                ? `${Number(ret.cashRefund).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA` 
                                : '-'}
                            </td>
                            <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReturnForDetails(ret)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Voir les détails complets du retour"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintReturnTicket(ret)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Imprimer le ticket thermique"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReturn(ret)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Supprimer ce retour"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* ══ MODAL DÉTAILS D'UN BON D'ACHAT ══ */}
      <PurchaseDetailsModal
        isOpen={Boolean(selectedPurchaseForDetails)}
        purchase={selectedPurchaseForDetails}
        supplier={supplier}
        onClose={() => setSelectedPurchaseForDetails(null)}
        onDelete={() => {
          setSelectedPurchaseForDetails(null);
          try {
            const savedSuppliers = localStorage.getItem('novamag_suppliers');
            if (savedSuppliers) {
              const list = JSON.parse(savedSuppliers);
              const found = list.find((s) => String(s.id) === String(supplier.id));
              if (found && onUpdateSupplier) onUpdateSupplier(found);
            }
          } catch {}
        }}
        onPurchaseUpdated={(updatedP) => {
          setSelectedPurchaseForDetails(updatedP);
          if (onUpdateSupplier) onUpdateSupplier(supplier);
        }}
      />

      {/* ══ MODAL D'AJOUT DE RETOUR FOURNISSEUR ══ */}
      <AddSupplierReturnModal
        isOpen={isAddReturnModalOpen}
        supplier={supplier}
        purchases={purchases}
        onClose={() => setIsAddReturnModalOpen(false)}
        onReturnAdded={handleReturnAdded}
      />

      {/* ══ MODAL DÉTAILS D'UN RETOUR FOURNISSEUR ══ */}
      <ReturnDetailsModal
        isOpen={Boolean(selectedReturnForDetails)}
        returnRecord={selectedReturnForDetails}
        party={supplier}
        isSupplier={true}
        onClose={() => setSelectedReturnForDetails(null)}
      />

      {/* ══ MODAL DÉTAILS D'UN RÈGLEMENT DE DETTE ══ */}
      <PaymentDetailsModal
        isOpen={Boolean(selectedPaymentForDetails)}
        payment={selectedPaymentForDetails}
        party={supplier}
        isSupplier={true}
        onClose={() => setSelectedPaymentForDetails(null)}
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
    </>
  );
}
