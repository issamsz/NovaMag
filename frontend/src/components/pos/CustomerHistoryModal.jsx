import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Receipt, 
  Coins, 
  Calendar, 
  Printer, 
  CreditCard, 
  Clock, 
  ArrowUpRight, 
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  Eye,
  Barcode,
  Filter,
  Download,
  RotateCcw,
  PackageMinus,
  Trash2
} from 'lucide-react';
import { 
  printThermalTicketDirect, 
  printDebtReceiptThermal, 
  printCustomerBarcodeLabel, 
  printCustomerGlobalInvoiceA4,
  printCustomerSummaryThermal,
  triggerSilentIframePrint
} from '../../services/thermalPrinter';
import { generateCode128Svg } from '../../services/barcodeGenerator';
import { MOCK_INVOICES } from '../../mock/posData';
import SaleDetailsModal from './SaleDetailsModal';
import AddCustomerReturnModal from './AddCustomerReturnModal';
import ReturnDetailsModal from '../common/ReturnDetailsModal';
import PaymentDetailsModal from '../common/PaymentDetailsModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { useLanguage } from '../../i18n/LanguageContext';

const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
const cleanText = (t) =>
  String(t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const isMatchingCustomer = (item, customer) => {
  if (!customer || !item) return false;
  if (item.customerId && customer.id && String(item.customerId) === String(customer.id)) {
    return true;
  }
  const cPhone = cleanPhone(customer.phone);
  const itemPhone = cleanPhone(item.customerPhone);
  if (cPhone.length >= 8 && itemPhone.length >= 8 && cPhone === itemPhone) {
    return true;
  }
  const cName = cleanText(customer.name);
  const itemName = cleanText(item.customer || item.customerName);
  if (cName && itemName) {
    if (cName === itemName) return true;
    if (cName.length > 4 && itemName.includes(cName)) return true;
    if (itemName.length > 4 && cName.includes(itemName)) return true;
  }
  return false;
};

/**
 * Normalise n'importe quel format de date (ISO, DD/MM/YYYY, etc.) en 'YYYY-MM-DD' strict
 */
const normalizeToIsoDate = (val) => {
  if (!val) return null;
  const str = String(val).trim();

  // YYYY-MM-DD (ISO)
  const matchIso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`;
  }

  // DD/MM/YYYY ou DD-MM-YYYY
  const matchDmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (matchDmy) {
    const d = matchDmy[1].padStart(2, '0');
    const m = matchDmy[2].padStart(2, '0');
    const y = matchDmy[3];
    return `${y}-${m}-${d}`;
  }

  // Fallback Date()
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
};

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getFirstDayOfMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export default function CustomerHistoryModal({
  isOpen,
  customer,
  invoices = [],
  payments = [],
  onClose,
  onOpenSettleDebt,
  onUpdateCustomer
}) {
  const { language, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'payments' | 'returns'
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState(null);
  const [selectedReturnForDetails, setSelectedReturnForDetails] = useState(null);
  const [selectedPaymentForDetails, setSelectedPaymentForDetails] = useState(null);
  const [isAddReturnModalOpen, setIsAddReturnModalOpen] = useState(false);
  const [returnsList, setReturnsList] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Confirmation',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: () => {}
  });
  
  // Plage de dates pour Relevé de compte / Facture Globale "Du ... Au ..."
  const [startDate, setStartDate] = useState(getFirstDayOfMonthStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  // Charger les retours de ce client
  const loadReturns = () => {
    if (!customer) return;
    try {
      const saved = localStorage.getItem('novamag_customer_returns');
      const all = saved ? JSON.parse(saved) : [];
      const filtered = all.filter((r) => isMatchingCustomer(r, customer));
      setReturnsList(filtered);
    } catch {
      setReturnsList([]);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      loadReturns();
    }
  }, [isOpen, customer]);

  // Résolution sécurisée de la liste complète des factures
  const resolvedInvoices = useMemo(() => {
    if (Array.isArray(invoices) && invoices.length > 0) return invoices;
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
  }, [invoices]);

  // Filtrer les factures de ce client (déclaré avant tout return pour respecter les règles des hooks React)
  const customerInvoices = useMemo(() => {
    if (!customer) return [];
    return resolvedInvoices.filter((inv) => isMatchingCustomer(inv, customer));
  }, [customer, resolvedInvoices]);

  // Filtrer les versements de ce client
  const customerPayments = useMemo(() => {
    if (!customer) return [];
    return (payments || []).filter((p) => isMatchingCustomer(p, customer));
  }, [customer, payments]);

  // Factures et versements filtrés par la plage de dates (Normalisation stricte ISO YYYY-MM-DD)
  const filteredPeriodInvoices = useMemo(() => {
    return customerInvoices.filter((inv) => {
      const invIsoDate = normalizeToIsoDate(inv.dateStr) || normalizeToIsoDate(inv.timestamp);
      if (!invIsoDate) return true;
      if (startDate && invIsoDate < startDate) return false;
      if (endDate && invIsoDate > endDate) return false;
      return true;
    });
  }, [customerInvoices, startDate, endDate]);

  const filteredPeriodPayments = useMemo(() => {
    return customerPayments.filter((p) => {
      const pIsoDate = normalizeToIsoDate(p.dateStr) || normalizeToIsoDate(p.timestamp);
      if (!pIsoDate) return true;
      if (startDate && pIsoDate < startDate) return false;
      if (endDate && pIsoDate > endDate) return false;
      return true;
    });
  }, [customerPayments, startDate, endDate]);

  if (!isOpen || !customer) return null;

  const sysSettings = (() => {
    try {
      return JSON.parse(localStorage.getItem('novamag_system_settings') || '{}');
    } catch {
      return {};
    }
  })();

  const customerBarcode = customer.barcode || `CLI-${String(customer.id).padStart(5, '0')}`;
  const barcodeSvg = generateCode128Svg(customerBarcode, { height: 32, barWidth: 1.4 });

  const totalSalesAmount = customerInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const currentDebt = Math.abs(customer.balance < 0 ? customer.balance : (customer.debt || 0));
  const initialDebt = Number(customer.initialDebt || 0);
  const totalPaymentsAmount = customerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingInitialDebt = Math.max(0, initialDebt - totalPaymentsAmount);

  // Impression Reçu Ticket direct
  const handlePrintSingleInvoice = (inv) => {
    printThermalTicketDirect(inv, sysSettings);
  };

  // Impression Versement sur dette individuel (Photo 2)
  const handlePrintSinglePayment = (p) => {
    printDebtReceiptThermal(p, customer, sysSettings);
  };

  // Impression Code-barres Client
  const handlePrintCustomerBarcode = () => {
    printCustomerBarcodeLabel(customer, sysSettings);
  };

  // Impression Résumé Client Complet (Photo 1)
  const handlePrintCustomerSummary = () => {
    printCustomerSummaryThermal(customer, customerInvoices, customerPayments, sysSettings);
  };

  // Impression Facture Globale / Périodique A4 "Du ... Au ..." (Conforme Photos 2 & 3)
  const handlePrintGlobalStatement = () => {
    printCustomerGlobalInvoiceA4(
      customer, 
      filteredPeriodInvoices, 
      filteredPeriodPayments, 
      { start: startDate, end: endDate }, 
      sysSettings
    );
  };

  // Callback après enregistrement d'un retour client
  const handleReturnAdded = (newReturn, updatedCustomer) => {
    setReturnsList((prev) => [newReturn, ...prev]);
    if (onUpdateCustomer && updatedCustomer) {
      onUpdateCustomer(updatedCustomer);
    }
  };

  // Suppression d'un bon de retour client
  const handleDeleteCustomerReturn = (ret) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer le bon de retour",
      message: `Êtes-vous certain de vouloir supprimer le bon de retour N° ${ret.returnNumber} ? Cette action restituera la créance associée le cas échéant.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => {
        try {
          const saved = localStorage.getItem('novamag_customer_returns');
          if (saved) {
            const all = JSON.parse(saved);
            const filtered = all.filter((r) => r.id !== ret.id);
            localStorage.setItem('novamag_customer_returns', JSON.stringify(filtered));
            setReturnsList((prev) => prev.filter((r) => r.id !== ret.id));

            // Si déduction de dette, restituer la dette
            if (ret.deductFromDebt > 0) {
              const currentDebtVal = Math.abs(customer.balance < 0 ? customer.balance : (customer.debt || 0));
              const restoredDebt = currentDebtVal + Number(ret.deductFromDebt);
              const updated = { ...customer, debt: restoredDebt };
              if (updated.balance < 0) updated.balance = -restoredDebt;

              const savedCustomers = localStorage.getItem('novamag_customers');
              if (savedCustomers) {
                const list = JSON.parse(savedCustomers);
                const idx = list.findIndex((c) => c.id === customer.id);
                if (idx !== -1) {
                  list[idx].debt = restoredDebt;
                  if (list[idx].balance < 0) list[idx].balance = -restoredDebt;
                  localStorage.setItem('novamag_customers', JSON.stringify(list));
                }
              }
              if (onUpdateCustomer) onUpdateCustomer(updated);
            }
          }
        } catch {}
      }
    });
  };

  // Impression reçu thermique de retour client
  const handlePrintCustomerReturnTicket = (ret) => {
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
        <div class="center" style="font-size: 10px; color: #555;">BON DE RETOUR CLIENT</div>
        <div class="center bold" style="font-size: 12px; margin-top: 3px;">N° ${ret.returnNumber}</div>
        <div class="center" style="font-size: 10px; color: #666;">Date : ${ret.dateStr}</div>
        <div class="divider"></div>
        <div><b>Client :</b> ${customer.name}</div>
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
          <span>TOTAL RETOURNÉ :</span>
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn select-none">
        <div 
          className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-5xl shadow-2xl space-y-5 animate-scaleIn relative flex flex-col max-h-[94vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ══ EN-TÊTE PRINCIPAL ══ */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4 shrink-0">
            
            {/* Profil Client */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-600/20 shrink-0">
                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {language === 'ar' ? `ملف الزبون : ${customer.name}` : `Fiche Client : ${customer.name}`}
                  </h2>
                  {currentDebt > 0 ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shadow-2xs">
                      {language === 'ar' ? 'دين :' : 'Dette :'} {currentDebt.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      {language === 'ar' ? 'الحساب مستوفى ✓' : 'Compte à jour ✓'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
                  {customer.phone || (language === 'ar' ? 'بدون رقم هاتف' : 'Pas de numéro')} {customer.address ? `• ${customer.address}` : ''}
                  {customer.rc ? ` • RC: ${customer.rc}` : ''}
                </p>
              </div>
            </div>

            {/* Widget Code-barres Client + Boutons En-tête (Alignés strictement sur la même ligne) */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-nowrap">
              
              {/* Cadre Code-barres Client scannable */}
              <div className="flex items-center gap-2 p-1.5 px-2 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrintCustomerBarcode}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Imprimer l'étiquette code-barres de ce client"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <div className="text-center pr-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 block leading-tight">
                    {customerBarcode}
                  </span>
                  <div 
                    className="h-6 w-24 overflow-hidden flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                  />
                </div>
              </div>

              {/* Bouton Régler Dette */}
              {currentDebt > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose && onClose();
                    onOpenSettleDebt && onOpenSettleDebt(customer);
                  }}
                  className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98 whitespace-nowrap"
                >
                  <Coins className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تسديد الدين' : 'Régler Dette'}</span>
                </button>
              )}

              {/* Bouton Fermer */}
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={language === 'ar' ? 'إغلاق' : 'Fermer'}
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

            </div>

          </div>

          {/* ══ BARRE PLAGE DE DATES & IMPRESSION FACTURE GLOBALE ══ */}
          <div className="p-2.5 sm:p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl flex items-center justify-between gap-3 text-xs shrink-0 flex-nowrap overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 shrink-0 flex-nowrap">
              <span className="font-black text-blue-900 dark:text-blue-200 flex items-center gap-1.5 whitespace-nowrap">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{language === 'ar' ? 'فترة الكشف :' : 'Période du Relevé :'}</span>
              </span>
              
              <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                <span className="font-bold text-slate-500 text-[11px]">{language === 'ar' ? 'من' : 'Du'}</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[125px] px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 font-mono text-xs outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                <span className="font-bold text-slate-500 text-[11px]">{language === 'ar' ? 'إلى' : 'Au'}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[125px] px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 font-mono text-xs outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-nowrap">
              {/* 1. Facture Globale en premier */}
              <button
                type="button"
                onClick={handlePrintGlobalStatement}
                className="px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shrink-0 whitespace-nowrap"
                title={language === 'ar' ? 'طباعة الفاتورة الإجمالية لملخص المبيعات' : 'Imprimer la facture globale récapitulative des ventes sur la période sélectionnée'}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'ar' ? 'فاتورة إجمالية' : 'Facture Globale'}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/25 text-[10px] font-mono font-bold" dir="ltr">
                  ({filteredPeriodInvoices.length} {language === 'ar' ? 'عملية' : `vente${filteredPeriodInvoices.length > 1 ? 's' : ''}`})
                </span>
              </button>

              {/* 2. Résumé Client en dernier */}
              <button
                type="button"
                onClick={handlePrintCustomerSummary}
                className="px-3.5 py-1.5 sm:py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shrink-0 whitespace-nowrap"
                title={language === 'ar' ? 'طباعة كشف حساب الزبون الشامل' : "Imprimer le résumé client complet avec l'historique des ventes, versements et dettes"}
              >
                <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                <span>{language === 'ar' ? 'ملخص الزبون' : 'Résumé Client'}</span>
              </button>
            </div>
          </div>

          {/* ══ 3 CARTES STATISTIQUES ══ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {language === 'ar' ? 'إجمالي المبيعات' : 'Total Ventes (Achats)'}
              </span>
              <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5" dir="ltr">
                {totalSalesAmount.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{customerInvoices.length} {language === 'ar' ? 'طلب' : 'commande(s)'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {language === 'ar' ? 'الدين المتبقي المستحق' : 'Dette Restante Due'}
              </span>
              <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5" dir="ltr">
                {currentDebt.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{currentDebt > 0 ? (language === 'ar' ? 'مستحق مفتوح' : 'Créance ouverte') : (language === 'ar' ? 'الحساب مستوفى ✓' : 'Compte à jour ✓')}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {language === 'ar' ? 'سقف الدين المسموح' : 'Plafond de Crédit'}
              </span>
              <div className="text-xl font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5" dir="ltr">
                {Number(customer.maxDebtLimit) > 0 ? `${Number(customer.maxDebtLimit).toLocaleString()} DA` : (language === 'ar' ? 'غير محدود' : 'Illimité')}
              </div>
              <span className="text-[10px] text-slate-500 font-bold">
                {Number(customer.maxDebtLimit) > 0 && currentDebt > 0 
                  ? (language === 'ar' ? `مستعمل بنسبة ${Math.round((currentDebt / Number(customer.maxDebtLimit)) * 100)}%` : `${Math.round((currentDebt / Number(customer.maxDebtLimit)) * 100)}% utilisé`) 
                  : (language === 'ar' ? 'مسموح' : 'Autorisé')}
              </span>
            </div>
          </div>

          {/* ══ CARTE AMBRE : DETTE INITIALE CLIENT ══ */}
          {initialDebt > 0 && (
            <div className="p-4 rounded-2xl bg-[#FFFBEB] dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-950 dark:text-amber-200">
                    {language === 'ar' ? 'الدين الافتتاحي للزبون' : 'Dette Initiale du Client'}
                  </span>
                  {remainingInitialDebt <= 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      {language === 'ar' ? 'مُسدد بالكامل ✓' : 'Entièrement Soldée ✓'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                  {language === 'ar' ? 'الدين الافتتاحي السابق قبل استخدام البرنامج : ' : 'Dette initiale (dettes antérieures avant utilisation du logiciel) : '}
                  <span className="font-mono font-bold text-amber-900 dark:text-amber-200" dir="ltr">
                    {initialDebt.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
                  </span>
                </p>
              </div>

              <div className="text-left sm:text-right rtl:text-right rtl:sm:text-left shrink-0">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 block">
                  {language === 'ar' ? 'الدين الافتتاحي (المتبقي) :' : 'Dette Initiale (Restant) :'}
                </span>
                <div className={`text-lg sm:text-xl font-black font-mono mt-0.5 ${
                  remainingInitialDebt > 0 ? 'text-amber-900 dark:text-amber-200' : 'text-emerald-600 dark:text-emerald-400'
                }`} dir="ltr">
                  {remainingInitialDebt > 0 
                    ? `${remainingInitialDebt.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA`
                    : (language === 'ar' ? '0.00 دج (مُسدد ✓)' : '0,00 DA (Soldée ✓)')}
                </div>
              </div>
            </div>
          )}

          {/* ══ ONGLETS : FACTURES VS VERSEMENTS ══ */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 shrink-0 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>{language === 'ar' ? `سجل المبيعات والفواتير (${customerInvoices.length})` : `Historique des Ventes & Factures (${customerInvoices.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'payments'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>{language === 'ar' ? `دفعات وتسديدات الديون (${customerPayments.length})` : `Versements & Règlements de Dette (${customerPayments.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('returns')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'returns'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'ar' ? `المرتجعات والمستردات (${returnsList.length})` : `Retours & Remboursements (${returnsList.length})`}</span>
            </button>
          </div>

          {/* ══ LISTE DÉROULANTE CONTENU ══ */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            
            {/* TAB 1 : FACTURES CLIENT */}
            {activeTab === 'invoices' && (
              customerInvoices.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs font-bold">
                  Aucune facture enregistrée pour ce client pour le moment.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerInvoices.map((inv) => (
                    <div
                      key={inv.id || inv.invoiceNumber}
                      onClick={() => setSelectedInvoiceForDetails(inv)}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:border-blue-400 dark:hover:border-blue-700 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {inv.dateStr || inv.timestamp?.slice(0, 16).replace('T', ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {inv.items?.length || 0} article(s) • Mode : <span className="font-bold uppercase text-slate-700 dark:text-slate-300">{inv.paymentMethod || 'Espèces'}</span>
                            {inv.debtGenerated > 0 && (
                              <span className="text-rose-600 font-bold ml-2">
                                (+{inv.debtGenerated.toLocaleString()} DA dette)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="text-right">
                          <div className="font-mono font-black text-base text-slate-900 dark:text-white">
                            {(Number(inv.total) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600">
                            Payé : {(Number(inv.amountPaid || inv.total)).toLocaleString()} DA
                          </span>
                        </div>

                        {/* Bouton Voir Détails (Ouvre SaleDetailsModal Photo 5) */}
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForDetails(inv)}
                          className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Voir les détails complets de la facture"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Bouton Imprimer Reçu Ticket direct */}
                        <button
                          type="button"
                          onClick={() => handlePrintSingleInvoice(inv)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Imprimer le ticket de caisse thermique"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* TAB 2 : VERSEMENTS ET RÈGLEMENTS DE DETTE (Conforme Photo 3 avec Bouton Impression) */}
            {activeTab === 'payments' && (
              customerPayments.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs font-bold">
                  Aucun versement de dette enregistré pour ce client pour le moment.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerPayments.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPaymentForDetails(p)}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between gap-3 hover:border-emerald-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            Versement sur dette • {p.dateStr}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Mode : <span className="font-bold uppercase text-slate-700 dark:text-slate-300">{p.method || 'Espèces'}</span> • Dette avant : {Number(p.previousDebt || 0).toLocaleString()} DA
                            {p.notes && <span className="italic ml-2 text-slate-400">({p.notes})</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="text-right">
                          <div className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                            -{(Number(p.amount) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            Reste : {(Number(p.remainingDebt || 0)).toLocaleString()} DA
                          </span>
                        </div>

                        {/* Bouton Voir Détails Versement */}
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentForDetails(p)}
                          className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Voir les détails complets du versement"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Bouton d'impression du versement */}
                        <button
                          type="button"
                          onClick={() => handlePrintSinglePayment(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                          title="Imprimer le reçu thermique de ce versement"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Imprimer Reçu</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* TAB 3 : RETOURS ET REMBOURSEMENTS CLIENT */}
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
                    <span>{language === 'ar' ? 'مرتجع زبون جديد' : 'Nouveau Retour Client'}</span>
                  </button>

                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    <RotateCcw className="w-4 h-4" />
                    <span>{language === 'ar' ? 'مرتجعات الزبون' : 'Retours Client'}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 text-left rtl:text-right font-bold">{language === 'ar' ? 'رقم / تاريخ السند' : 'N° / Date du bon'}</th>
                        <th className="py-2.5 px-3 text-left rtl:text-right font-bold">{language === 'ar' ? 'سبب الإرجاع' : 'Motif du retour'}</th>
                        <th className="py-2.5 px-3 text-center font-bold">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                        <th className="py-2.5 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                          {language === 'ar' ? 'خصم من الدين' : 'Déduction Dette'}
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {language === 'ar' ? 'استرداد نقدي' : 'Remboursement Espèces'}
                        </th>
                        <th className="py-2.5 px-3 text-right rtl:text-left font-bold">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {returnsList.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                            {language === 'ar' ? 'لا توجد مرتجعات مسجلة لهذا الزبون حالياً.' : 'Aucun retour enregistré pour ce client pour le moment.'}
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
                              <div className="text-[10px] text-slate-400" dir="ltr">{ret.dateStr}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                              <div>{ret.motif}</div>
                              {ret.items && ret.items.length > 0 && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {ret.items.length} {language === 'ar' ? 'مادة' : 'article(s)'} : {ret.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-white" dir="ltr">
                              {Number(ret.total || 0).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400" dir="ltr">
                              {ret.deductFromDebt > 0 
                                ? `${Number(ret.deductFromDebt).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA` 
                                : '-'}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                              {ret.cashRefund > 0 
                                ? `${Number(ret.cashRefund).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA` 
                                : '-'}
                            </td>
                            <td className="py-3 px-3 text-right rtl:text-left" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReturnForDetails(ret)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title={language === 'ar' ? 'عرض تفاصيل المرتجع' : 'Voir les détails complets du retour'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintCustomerReturnTicket(ret)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title={language === 'ar' ? 'طباعة وصل المرتجع' : 'Imprimer le ticket de retour'}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomerReturn(ret)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title={language === 'ar' ? 'حذف هذا المرتجع' : 'Supprimer ce retour'}
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

      {/* ══ MODAL DÉTAILS DE LA FACTURE (IMAGE 5) ══ */}
      <SaleDetailsModal
        isOpen={Boolean(selectedInvoiceForDetails)}
        invoice={selectedInvoiceForDetails}
        customer={customer}
        onClose={() => setSelectedInvoiceForDetails(null)}
      />

      {/* ══ MODAL D'AJOUT DE RETOUR CLIENT ══ */}
      <AddCustomerReturnModal
        isOpen={isAddReturnModalOpen}
        customer={customer}
        invoices={customerInvoices}
        onClose={() => setIsAddReturnModalOpen(false)}
        onReturnAdded={handleReturnAdded}
      />

      {/* ══ MODAL DÉTAILS D'UN RETOUR CLIENT ══ */}
      <ReturnDetailsModal
        isOpen={Boolean(selectedReturnForDetails)}
        returnRecord={selectedReturnForDetails}
        party={customer}
        isSupplier={false}
        onClose={() => setSelectedReturnForDetails(null)}
      />

      {/* ══ MODAL DÉTAILS D'UN VERSEMENT DE DETTE CLIENT ══ */}
      <PaymentDetailsModal
        isOpen={Boolean(selectedPaymentForDetails)}
        payment={selectedPaymentForDetails}
        party={customer}
        isSupplier={false}
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
