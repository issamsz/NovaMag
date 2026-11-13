import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, Lock, Play, Search, Eye,
  User, AlertTriangle, CheckCircle2, MinusCircle, PlusCircle,
  ArrowLeft, RefreshCw, Printer, Clock, FileText, X,
  Trash2, ShoppingCart, TrendingUp, TrendingDown, Coins, Calendar
} from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import { printCashSessionReportA4, printCashSessionTicket } from '../../services/thermalPrinter';
import { useLanguage } from '../../i18n/LanguageContext';

// =========================================================================
// MOTIFS RAPIDES PRÉDÉFINIS (100% EN FRANÇAIS)
// =========================================================================
const QUICK_WITHDRAW_REASONS = [
  { label: 'Pause déjeuner', icon: '🥪', text: 'Pause déjeuner' },
  { label: 'Café / Boisson', icon: '☕', text: 'Café / Boisson' },
  { label: 'Pain / Boulangerie', icon: '🥖', text: 'Pain / Boulangerie' },
  { label: 'Retrait personnel', icon: '💵', text: 'Retrait personnel caissier' },
];

const QUICK_DEPOSIT_REASONS = [
  { label: 'Apport de monnaie', icon: '🪙', text: 'Apport de monnaie pour tiroir' },
  { label: 'Ajout personnel', icon: '💵', text: 'Ajout de fonds personnel' },
  { label: 'Rentrée diverse', icon: '💰', text: 'Rentrée d’espèces diverse' },
];

const QUICK_EXPENSE_REASONS = [
  { label: 'Fournitures / Sacs', icon: '🛍️', text: 'Achat sacs & fournitures' },
  { label: 'Facture Électricité / Net', icon: '💡', text: 'Facture électricité / net' },
  { label: 'Paiement fournisseur', icon: '📦', text: 'Paiement fournisseur express' },
  { label: 'Frais de transport', icon: '🚚', text: 'Frais de transport / livraison' },
  { label: 'Entretien magasin', icon: '🧹', text: 'Entretien & nettoyage' },
  { label: 'Dépense diverse', icon: '📑', text: 'Dépense diverse magasin' },
];

// =========================================================================
// FORMATTEURS DE DATE & MONNAIE STRICTEMENT EN FRANÇAIS
// =========================================================================
const formatMoney = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatFrenchTime = (dateStr) => {
  if (!dateStr) return '--:--';
  try {
    const d = new Date(dateStr);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '--:--';
  }
};

const formatFrenchDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const month = monthNames[d.getMonth()] || '';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${h}:${m}`;
  } catch {
    return dateStr || '—';
  }
};

const formatFrenchFullDate = (dateStr) => {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} à ${h}:${m}`;
  } catch {
    return dateStr || '--';
  }
};

const formatFrenchDateOnly = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// =========================================================================
// DONNÉES DÉMO COHÉRENTES INITIALES (CONFORME AUX PHOTOS DE L'UTILISATEUR)
// =========================================================================
const INITIAL_DEMO_SESSION = {
  isOpen: true,
  sessionNumber: 2,
  openingBalance: 4000,
  openedAt: '2026-11-08T15:17:00.000Z',
  openedBy: 'Admin'
};

const INITIAL_DEMO_MOVEMENTS = [
  {
    id: 'mov-1',
    type: 'withdraw',
    amount: 1000,
    reason: 'Pose déjeuné',
    timestamp: '2026-11-08T15:21:00.000Z'
  }
];

const INITIAL_DEMO_SALES = [
  { id: 5, invoiceNumber: 'INV-5', paymentMethod: 'especes', total: 3200, amountPaid: 3200, timestamp: '2026-11-08T15:21:00.000Z' },
  { id: 4, invoiceNumber: 'INV-4', paymentMethod: 'especes', total: 5200, amountPaid: 5200, timestamp: '2026-11-08T15:19:00.000Z' },
  { id: 3, invoiceNumber: 'INV-3', paymentMethod: 'especes', total: 3000, amountPaid: 3000, timestamp: '2026-11-08T15:19:00.000Z' },
  { id: 2, invoiceNumber: 'INV-2', paymentMethod: 'especes', total: 5200, amountPaid: 5200, timestamp: '2026-11-08T15:18:00.000Z' },
  { id: 1, invoiceNumber: 'INV-1', paymentMethod: 'especes', total: 5200, amountPaid: 5200, timestamp: '2026-11-08T15:18:00.000Z' }
];

const INITIAL_DEMO_HISTORY = [
  {
    id: 'sess-1',
    sessionNumber: 1,
    cashier: 'Admin',
    openedAt: '2026-11-08T03:44:00.000Z',
    closedAt: '2026-11-08T03:45:00.000Z',
    openingBalance: 0,
    countedCash: 0,
    expectedCash: 0,
    discrepancy: 0,
    status: 'closed',
    note: '',
    salesTotal: 0,
    encaissements: 0,
    decaissements: 0,
    movements: []
  }
];

export default function CashManagementView({ onNavigate }) {
  const { t, language } = useLanguage();
  // Onglets : 'current' (Session Actuelle - Par défaut) | 'history' (Historique des Sessions)
  const [activeTab, setActiveTab] = useState('current');

  // Utilisateur connecté réel
  const currentRealUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('novamag_user');
      if (raw) {
        const u = JSON.parse(raw);
        return u.full_name || u.username || 'Admin';
      }
    } catch {}
    return 'Admin';
  }, []);

  // Nom du magasin
  const sysSettings = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('novamag_system_settings') || '{}');
    } catch {
      return {};
    }
  }, []);

  const storeName = useMemo(() => {
    return sysSettings.storeName && !sysSettings.storeName.includes('لومينا')
      ? sysSettings.storeName
      : 'NovaMag POS';
  }, [sysSettings]);

  // 1. Session Active (État réel partagé avec POS)
  const [cashSession, setCashSession] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_cash_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isOpen === 'boolean') return parsed;
      }
      localStorage.setItem('novamag_cash_session', JSON.stringify(INITIAL_DEMO_SESSION));
      return INITIAL_DEMO_SESSION;
    } catch {
      return INITIAL_DEMO_SESSION;
    }
  });

  // 2. Mouvements de caisse réels (Dépôts, Retraits, Dépenses)
  const [cashMovements, setCashMovements] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_cash_movements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem('novamag_cash_movements', JSON.stringify(INITIAL_DEMO_MOVEMENTS));
      return INITIAL_DEMO_MOVEMENTS;
    } catch {
      return INITIAL_DEMO_MOVEMENTS;
    }
  });

  // 3. Ventes réelles POS
  const [salesHistory, setSalesHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_sales_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('novamag_sales_history', JSON.stringify(INITIAL_DEMO_SALES));
      return INITIAL_DEMO_SALES;
    } catch {
      return INITIAL_DEMO_SALES;
    }
  });

  // 4. Historique réel des sessions clôturées
  const [closedSessionsHistory, setClosedSessionsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_cash_sessions_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('novamag_cash_sessions_history', JSON.stringify(INITIAL_DEMO_HISTORY));
      return INITIAL_DEMO_HISTORY;
    } catch {
      return INITIAL_DEMO_HISTORY;
    }
  });

  // Synchronisation dynamique en temps réel avec le POS et le localStorage
  const handleSync = useCallback(() => {
    try {
      const savedSession = localStorage.getItem('novamag_cash_session');
      if (savedSession) setCashSession(JSON.parse(savedSession));

      const savedMovements = localStorage.getItem('novamag_cash_movements');
      if (savedMovements) setCashMovements(JSON.parse(savedMovements));

      const savedSales = localStorage.getItem('novamag_sales_history');
      if (savedSales) setSalesHistory(JSON.parse(savedSales));

      const savedHistory = localStorage.getItem('novamag_cash_sessions_history');
      if (savedHistory) setClosedSessionsHistory(JSON.parse(savedHistory));
    } catch (e) {}
  }, []);

  useEffect(() => {
    window.addEventListener('storage', handleSync);
    window.addEventListener('novamag_cash_updated', handleSync);
    window.addEventListener('novamag_sales_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('novamag_cash_updated', handleSync);
      window.removeEventListener('novamag_sales_updated', handleSync);
    };
  }, [handleSync]);

  // Nettoyage automatique des mentions fictives 'BZ Technology'
  useEffect(() => {
    try {
      const savedHist = localStorage.getItem('novamag_cash_sessions_history');
      if (savedHist && savedHist.includes('BZ Technology')) {
        const updated = JSON.parse(savedHist).map((s) => ({
          ...s,
          cashier: s.cashier === 'BZ Technology' ? 'Admin' : s.cashier
        }));
        setClosedSessionsHistory(updated);
        localStorage.setItem('novamag_cash_sessions_history', JSON.stringify(updated));
      }
      const savedActive = localStorage.getItem('novamag_cash_session');
      if (savedActive && savedActive.includes('BZ Technology')) {
        const parsed = JSON.parse(savedActive);
        parsed.openedBy = currentRealUser || 'Admin';
        setCashSession(parsed);
        localStorage.setItem('novamag_cash_session', JSON.stringify(parsed));
      }
    } catch {}
  }, [currentRealUser]);

  // Notifications Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('info');
  const showToast = (msg, type = 'info') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4500);
  };

  // Saisie ouverture
  const [openAmountInput, setOpenAmountInput] = useState('4000');

  // Modals d'actions
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState('withdraw'); // 'deposit' | 'withdraw' | 'expense'
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // Modale Détails d'une session
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);

  // Modale de Confirmation Élégante (Remplace window.confirm)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Confirmation',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: () => {}
  });

  // Saisie clôture
  const [countedCash, setCountedCash] = useState('');
  const [closureNote, setClosureNote] = useState('');

  // Filtres Historique
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCashier, setFilterCashier] = useState('all');

  // =========================================================================
  // CALCULS DYNAMIQUES EN TEMPS RÉEL SUR LA SESSION ACTIVE
  // =========================================================================
  const openingBalance = Number(cashSession?.openingBalance || 0);

  // Ventes espèces réelles enregistrées depuis l'ouverture de la session
  const activeSessionSales = useMemo(() => {
    if (!cashSession?.isOpen || !cashSession?.openedAt) return [];
    const openTime = new Date(cashSession.openedAt).getTime();
    return salesHistory.filter((inv) => {
      const invTime = new Date(inv.timestamp || inv.dateStr).getTime();
      return invTime >= openTime;
    });
  }, [cashSession, salesHistory]);

  const activeCashSalesTotal = useMemo(() => {
    return activeSessionSales.reduce((sum, inv) => {
      const method = (inv.paymentMethod || 'especes').toLowerCase();
      if (method === 'especes' || method === 'cash') {
        const cashIn = typeof inv.amountPaid === 'number'
          ? Math.max(0, inv.amountPaid - (inv.change || 0))
          : Number(inv.total || 0);
        return sum + cashIn;
      }
      return sum;
    }, 0);
  }, [activeSessionSales]);

  // Versements de dettes clients en espèces pendant la session
  const activeCustomerPayments = useMemo(() => {
    if (!cashSession?.isOpen || !cashSession?.openedAt) return [];
    try {
      const saved = localStorage.getItem('novamag_customer_payments');
      const all = saved ? JSON.parse(saved) : [];
      const openTime = new Date(cashSession.openedAt).getTime();
      return all.filter((p) => {
        const pTime = new Date(p.timestamp || p.dateStr).getTime();
        const isCash = !p.paymentMethod || p.paymentMethod.toLowerCase().includes('esp') || p.paymentMethod.toLowerCase().includes('cash');
        return pTime >= openTime && isCash;
      });
    } catch {
      return [];
    }
  }, [cashSession]);

  const activeCustomerPaymentsTotal = useMemo(() => {
    return activeCustomerPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  }, [activeCustomerPayments]);

  // Mouvements réels de la session
  const activeDepositsTotal = useMemo(() => {
    return cashMovements
      .filter((m) => m.type === 'deposit')
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);
  }, [cashMovements]);

  const activeWithdrawalsTotal = useMemo(() => {
    return cashMovements
      .filter((m) => m.type === 'withdraw')
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);
  }, [cashMovements]);

  const activeExpensesTotal = useMemo(() => {
    return cashMovements
      .filter((m) => m.type === 'expense')
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);
  }, [cashMovements]);

  // Totaux de synthèse (Exactement conformes aux Photos 1 & 2)
  const totalEncaissements = activeCashSalesTotal + activeDepositsTotal + activeCustomerPaymentsTotal;
  const totalDecaissements = activeWithdrawalsTotal + activeExpensesTotal;
  const currentLiveCashBalance = openingBalance + totalEncaissements - totalDecaissements;

  // =========================================================================
  // JOURNAL DYNAMIQUE DES TRANSACTIONS EN TEMPS RÉEL (100% EN FRANÇAIS)
  // =========================================================================
  const liveTransactions = useMemo(() => {
    const list = [];

    // 1. Ventes espèces POS
    activeSessionSales.forEach((inv) => {
      const method = (inv.paymentMethod || 'especes').toLowerCase();
      if (method === 'especes' || method === 'cash') {
        const cashIn = typeof inv.amountPaid === 'number'
          ? Math.max(0, inv.amountPaid - (inv.change || 0))
          : Number(inv.total || 0);
        list.push({
          id: `sale-${inv.id || inv.invoiceNumber}`,
          time: inv.timestamp || inv.dateStr,
          type: 'sale',
          typeLabel: 'Vente espèces',
          icon: <ShoppingCart className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
          badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          description: inv.invoiceNumber || `INV-${inv.id}`,
          amount: cashIn,
          isPositive: true
        });
      }
    });

    // 2. Mouvements de caisse
    cashMovements.forEach((m) => {
      if (m.type === 'deposit') {
        list.push({
          id: m.id,
          time: m.timestamp,
          type: 'deposit',
          typeLabel: "Dépôt d'espèces",
          icon: <PlusCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
          badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
          description: m.reason || "Apport de monnaie",
          amount: Number(m.amount || 0),
          isPositive: true
        });
      } else if (m.type === 'withdraw') {
        list.push({
          id: m.id,
          time: m.timestamp,
          type: 'withdraw',
          typeLabel: "Retrait d'espèces",
          icon: <MinusCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
          badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          description: m.reason || "Retrait de caisse",
          amount: Number(m.amount || 0),
          isPositive: false
        });
      } else if (m.type === 'expense') {
        list.push({
          id: m.id,
          time: m.timestamp,
          type: 'expense',
          typeLabel: "Dépense",
          icon: <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
          badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
          description: m.reason || "Dépense diverse",
          amount: Number(m.amount || 0),
          isPositive: false
        });
      }
    });

    // 3. Versements de dettes clients
    activeCustomerPayments.forEach((p) => {
      list.push({
        id: `cpay-${p.id}`,
        time: p.timestamp || p.dateStr,
        type: 'customer_payment',
        typeLabel: 'Versement client',
        icon: <Coins className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
        badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        description: `Versement ${p.customerName || 'Client'}`,
        amount: Number(p.amount || 0),
        isPositive: true
      });
    });

    // Tri chronologique décroissant (les plus récents en premier)
    return list.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
  }, [activeSessionSales, cashMovements, activeCustomerPayments]);

  // =========================================================================
  // CONSTRUCTION DU TABLEAU HISTORIQUE DES SESSIONS
  // =========================================================================
  const allRealSessions = useMemo(() => {
    const list = [];

    // Session ouverte en direct en tête du tableau
    if (cashSession?.isOpen) {
      const liveCashier = (cashSession.openedBy && cashSession.openedBy !== 'BZ Technology')
        ? cashSession.openedBy
        : (currentRealUser || 'Admin');

      list.push({
        id: 'active-session-live',
        isActive: true,
        sessionNumber: cashSession.sessionNumber || 2,
        cashier: liveCashier,
        openedAt: cashSession.openedAt || new Date().toISOString(),
        closedAt: null,
        openingBalance: openingBalance,
        countedCash: null,
        expectedCash: currentLiveCashBalance,
        discrepancy: null,
        status: 'open',
        note: '',
        movements: cashMovements,
        salesCount: activeSessionSales.length,
        salesTotal: activeCashSalesTotal,
        encaissements: totalEncaissements,
        decaissements: totalDecaissements,
        transactions: liveTransactions
      });
    }

    // Sessions clôturées
    closedSessionsHistory.forEach((s) => {
      const cleanCashier = (s.cashier && s.cashier !== 'BZ Technology') ? s.cashier : 'Admin';
      list.push({
        ...s,
        cashier: cleanCashier
      });
    });

    return list;
  }, [
    cashSession,
    currentRealUser,
    openingBalance,
    currentLiveCashBalance,
    cashMovements,
    activeSessionSales,
    activeCashSalesTotal,
    totalEncaissements,
    totalDecaissements,
    liveTransactions,
    closedSessionsHistory
  ]);

  // Liste des employés réels présents pour le filtre
  const cashierOptions = useMemo(() => {
    const set = new Set();
    if (currentRealUser) set.add(currentRealUser);
    allRealSessions.forEach((s) => {
      if (s.cashier && s.cashier !== 'BZ Technology') set.add(s.cashier);
    });
    // Récupérer les vrais comptes créés dans NovaMag si disponibles
    try {
      const savedUsers = localStorage.getItem('novamag_users');
      if (savedUsers) {
        const uList = JSON.parse(savedUsers);
        if (Array.isArray(uList)) {
          uList.forEach((u) => {
            const n = u.full_name || u.username;
            if (n && n !== 'BZ Technology') set.add(n);
          });
        }
      }
    } catch {}
    if (set.size === 0) set.add('Admin');
    return Array.from(set);
  }, [currentRealUser, allRealSessions]);

  // Filtrage du tableau de l'historique
  const filteredSessions = useMemo(() => {
    return allRealSessions.filter((sess) => {
      if (filterCashier !== 'all' && sess.cashier?.toLowerCase() !== filterCashier.toLowerCase()) {
        return false;
      }
      if (filterDateFrom) {
        const sessDate = sess.openedAt ? new Date(sess.openedAt) : null;
        const fromLimit = new Date(`${filterDateFrom}T00:00:00`);
        if (sessDate && sessDate < fromLimit) return false;
      }
      if (filterDateTo) {
        const sessDate = sess.openedAt ? new Date(sess.openedAt) : null;
        const toLimit = new Date(`${filterDateTo}T23:59:59.999`);
        if (sessDate && sessDate > toLimit) return false;
      }
      return true;
    });
  }, [allRealSessions, filterCashier, filterDateFrom, filterDateTo]);

  // =========================================================================
  // GESTION DES ACTIONS (OUVERTURE, MOUVEMENTS, CLÔTURE)
  // =========================================================================
  const handleOpenSession = (e) => {
    e?.preventDefault();
    const val = parseFloat(openAmountInput);
    const validAmount = isNaN(val) || val < 0 ? 0 : val;

    const nextSessionNum = (closedSessionsHistory[0]?.sessionNumber || 1) + 1;
    const newSession = {
      isOpen: true,
      sessionNumber: nextSessionNum,
      openingBalance: validAmount,
      openedAt: new Date().toISOString(),
      openedBy: currentRealUser || 'Admin'
    };

    setCashSession(newSession);
    setCashMovements([]);
    localStorage.setItem('novamag_cash_session', JSON.stringify(newSession));
    localStorage.removeItem('novamag_cash_movements');

    try {
      window.dispatchEvent(new Event('novamag_cash_updated'));
    } catch {}

    showToast(`✓ Session #${nextSessionNum} ouverte avec succès (${formatMoney(validAmount)} DA)`, 'success');
  };

  const handleSaveMovement = (e) => {
    e?.preventDefault();
    const amt = parseFloat(movementAmount);
    if (isNaN(amt) || amt <= 0) return;

    let defaultReason = "Mouvement d'espèces";
    if (movementType === 'deposit') defaultReason = "Apport de monnaie";
    if (movementType === 'withdraw') defaultReason = "Retrait de caisse";
    if (movementType === 'expense') defaultReason = "Dépense magasin";

    const reason = movementReason.trim() || defaultReason;
    const newMovement = {
      id: `mov-${Date.now()}`,
      type: movementType,
      amount: amt,
      reason,
      timestamp: new Date().toISOString()
    };

    const updated = [newMovement, ...cashMovements];
    setCashMovements(updated);
    localStorage.setItem('novamag_cash_movements', JSON.stringify(updated));

    try {
      window.dispatchEvent(new Event('novamag_cash_updated'));
    } catch {}

    setMovementAmount('');
    setMovementReason('');
    setIsMovementModalOpen(false);

    if (movementType === 'deposit') {
      showToast(`✓ Dépôt de ${formatMoney(amt)} DA enregistré (${reason})`, 'success');
    } else if (movementType === 'withdraw') {
      showToast(`✓ Retrait de ${formatMoney(amt)} DA enregistré (${reason})`, 'warning');
    } else {
      showToast(`✓ Dépense de ${formatMoney(amt)} DA enregistrée (${reason})`, 'info');
    }
  };

  const handleConfirmClose = () => {
    const countedVal = parseFloat(countedCash);
    const validCounted = isNaN(countedVal) ? 0 : countedVal;
    const discrepancy = validCounted - currentLiveCashBalance;

    const closedRecord = {
      id: `sess-${Date.now()}`,
      sessionNumber: cashSession?.sessionNumber || 2,
      cashier: (cashSession?.openedBy && cashSession?.openedBy !== 'BZ Technology') ? cashSession.openedBy : (currentRealUser || 'Admin'),
      openedAt: cashSession?.openedAt || new Date().toISOString(),
      closedAt: new Date().toISOString(),
      openingBalance: openingBalance,
      countedCash: validCounted,
      expectedCash: currentLiveCashBalance,
      discrepancy: discrepancy,
      status: 'closed',
      note: closureNote.trim(),
      salesTotal: activeCashSalesTotal,
      salesCount: activeSessionSales.length,
      encaissements: totalEncaissements,
      decaissements: totalDecaissements,
      movements: [...cashMovements],
      transactions: [...liveTransactions]
    };

    const updatedHistory = [closedRecord, ...closedSessionsHistory];
    setClosedSessionsHistory(updatedHistory);
    localStorage.setItem('novamag_cash_sessions_history', JSON.stringify(updatedHistory));

    const resetSession = {
      isOpen: false,
      openingBalance: 0,
      sessionNumber: (cashSession?.sessionNumber || 2) + 1,
      closedAt: new Date().toISOString()
    };
    setCashSession(resetSession);
    setCashMovements([]);
    localStorage.setItem('novamag_cash_session', JSON.stringify(resetSession));
    localStorage.removeItem('novamag_cash_movements');

    try {
      window.dispatchEvent(new Event('novamag_cash_updated'));
    } catch {}

    setIsCloseModalOpen(false);
    setCountedCash('');
    setClosureNote('');

    if (discrepancy < -0.01) {
      showToast(`⚠️ Session #${closedRecord.sessionNumber} clôturée — Manquant: ${formatMoney(discrepancy)} DA`, 'warning');
    } else if (discrepancy > 0.01) {
      showToast(`✓ Session #${closedRecord.sessionNumber} clôturée — Excédent: +${formatMoney(discrepancy)} DA`, 'success');
    } else {
      showToast(`✓ Session #${closedRecord.sessionNumber} clôturée — Caisse exacte (+0,00 DA)`, 'success');
    }
  };

  const handleClearHistory = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Vider l'historique",
      message: "Êtes-vous certain de vouloir vider l'historique des anciennes sessions de caisse ? Cette action est irréversible.",
      confirmText: "Vider l'historique",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => {
        setClosedSessionsHistory([]);
        localStorage.removeItem('novamag_cash_sessions_history');
        showToast('Historique des sessions réinitialisé', 'info');
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 overflow-y-auto font-sans select-none p-5 sm:p-7 space-y-5">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 1. EN-TÊTE PRINCIPAL & ONGLET SWITCH (PHOTO 1 & 3)     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('cash_mgmt.title', 'Gestion de la Caisse')}
            </h1>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('pos')}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('cash_mgmt.back_to_pos', 'Retour POS')}</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {t('cash_mgmt.subtitle', 'Suivi des sessions de caisse et des ventes journalières')}
          </p>
        </div>

        {/* Boutons Sélecteur d'onglets (Conforme Photos) */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/70 dark:border-slate-700/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'current'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('cash_mgmt.tab_current', 'Session Actuelle')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('cash_mgmt.tab_history', 'Historique des Sessions')}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 2. ONGLET 1 : SESSION ACTUELLE (CONFORME PHOTOS 1 & 2)  */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'current' && (
        <div className="space-y-4 animate-fadeIn">

          {cashSession?.isOpen ? (
            <>
              {/* BANDEAU VERT DE SESSION ACTIVE (CONFORME PHOTO 1) */}
              <div className="bg-[#EBFBF3] dark:bg-emerald-950/30 border border-[#A7F3D0] dark:border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-2xs gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {language === 'ar'
                        ? `جلسة نشطة #${cashSession.sessionNumber || 2} — ${(cashSession.openedBy && cashSession.openedBy !== 'BZ Technology') ? cashSession.openedBy : (currentRealUser || 'Admin')}`
                        : `Session Active #${cashSession.sessionNumber || 2} — ${(cashSession.openedBy && cashSession.openedBy !== 'BZ Technology') ? cashSession.openedBy : (currentRealUser || 'Admin')}`}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('cash_mgmt.opened_since', 'Ouverte depuis')} {formatFrenchTime(cashSession.openedAt)} {formatFrenchDateOnly(cashSession.openedAt)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCountedCash(currentLiveCashBalance.toFixed(2));
                    setClosureNote('');
                    setIsCloseModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('cash_mgmt.close_session', 'Fermer la session')}</span>
                </button>
              </div>

              {/* 4 CARTES DE SYNTHÈSE EN RANGÉE (CONFORME PHOTO 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Solde d'ouverture */}
                <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Wallet className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{t('cash_mgmt.opening_balance', "Solde d'ouverture")}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
                    {formatMoney(openingBalance)}
                  </div>
                </div>

                {/* 2. Encaissements */}
                <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t('cash_mgmt.cash_in', 'Encaissements')}</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
                    {formatMoney(totalEncaissements)}
                  </div>
                </div>

                {/* 3. Décaissements */}
                <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{t('cash_mgmt.cash_out', 'Décaissements')}</span>
                  </div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight mt-2">
                    {formatMoney(totalDecaissements)}
                  </div>
                </div>

                {/* 4. Solde actuel (Carte pleine en Bleu - Conforme Photo 1) */}
                <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-lg shadow-blue-600/25 flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-100">
                    <Coins className="w-4 h-4 text-blue-200 shrink-0" />
                    <span>{t('cash_mgmt.current_balance', 'Solde actuel')}</span>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight mt-2">
                    {formatMoney(currentLiveCashBalance)}
                  </div>
                </div>
              </div>

              {/* 3 BOUTONS D'ACTIONS RAPIDES (CONFORME PHOTO 1) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Dépôt d'espèces */}
                <button
                  type="button"
                  onClick={() => {
                    setMovementType('deposit');
                    setMovementAmount('');
                    setMovementReason('');
                    setIsMovementModalOpen(true);
                  }}
                  className="py-3 px-4 rounded-2xl bg-[#EAFBF3] hover:bg-[#DCFCE7] dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-[#A7F3D0] dark:border-emerald-800/80 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-98"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('cash_mgmt.cash_deposit', "Dépôt d'espèces")}</span>
                </button>

                {/* 2. Retrait d'espèces */}
                <button
                  type="button"
                  onClick={() => {
                    setMovementType('withdraw');
                    setMovementAmount('');
                    setMovementReason('');
                    setIsMovementModalOpen(true);
                  }}
                  className="py-3 px-4 rounded-2xl bg-[#FEF9E7] hover:bg-[#FEF3C7] dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border border-[#FDE68A] dark:border-amber-800/80 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-98"
                >
                  <MinusCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t('cash_mgmt.cash_withdrawal', "Retrait d'espèces")}</span>
                </button>

                {/* 3. Ajouter une dépense */}
                <button
                  type="button"
                  onClick={() => {
                    setMovementType('expense');
                    setMovementAmount('');
                    setMovementReason('');
                    setIsMovementModalOpen(true);
                  }}
                  className="py-3 px-4 rounded-2xl bg-[#FDF2F2] hover:bg-[#FEE2E2] dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-[#FECACA] dark:border-rose-800/80 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-98"
                >
                  <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{t('cash_mgmt.add_expense', 'Ajouter une dépense')}</span>
                </button>
              </div>

              {/* JOURNAL DES TRANSACTIONS (CONFORME PHOTO 1 & 2) */}
              <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 text-sm font-bold text-slate-800 dark:text-white">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{language === 'ar' ? 'سجل العمليات والحركات' : 'Journal des transactions'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const activeObj = {
                          sessionNumber: cashSession.sessionNumber || 2,
                          cashier: (cashSession.openedBy && cashSession.openedBy !== 'BZ Technology') ? cashSession.openedBy : (currentRealUser || 'Admin'),
                          status: 'open',
                          openedAt: cashSession.openedAt,
                          closedAt: null,
                          openingBalance,
                          encaissements: totalEncaissements,
                          decaissements: totalDecaissements,
                          expectedCash: currentLiveCashBalance,
                          countedCash: null,
                          discrepancy: null,
                          transactions: liveTransactions
                        };
                        printCashSessionReportA4(activeObj, sysSettings);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-98"
                      title={language === 'ar' ? 'طباعة تقرير الحصيلة بصيغة A4' : 'Imprimer le bilan de la session active en A4'}
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">{language === 'ar' ? 'طباعة تقرير A4' : 'Imprimer le Bilan A4'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSync}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={language === 'ar' ? 'تحديث فوري' : 'Actualiser en direct'}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="py-3.5 px-6">{language === 'ar' ? 'الوقت' : 'Heure'}</th>
                        <th className="py-3.5 px-6 text-center sm:text-left rtl:sm:text-right">{language === 'ar' ? 'النوع' : 'Type'}</th>
                        <th className="py-3.5 px-6">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                        <th className="py-3.5 px-6 text-right rtl:text-left">{language === 'ar' ? 'المبلغ' : 'Montant'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {liveTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                            {language === 'ar' ? 'لا توجد حركات أو مبيعات مسجلة حتى الآن.' : 'Aucune transaction (vente ou mouvement) enregistrée pour le moment.'}
                          </td>
                        </tr>
                      ) : (
                        liveTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Heure au format français (ex: 15:21) */}
                            <td className="py-3.5 px-6 text-slate-500 font-medium whitespace-nowrap">
                              {formatFrenchTime(tx.time)}
                            </td>

                            {/* Badge type 100% en Français ou Arabe */}
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${tx.badgeStyle}`}>
                                {tx.icon}
                                <span>{language === 'ar' ? (
                                  tx.type === 'sale' ? 'مبيعات نقدية' :
                                  tx.type === 'deposit' ? 'إيداع نقدي' :
                                  tx.type === 'withdraw' ? 'سحب نقدي' :
                                  tx.type === 'expense' ? 'مصروف' :
                                  tx.type === 'customer_payment' ? 'تسديد زبون' : tx.typeLabel
                                ) : tx.typeLabel}</span>
                              </span>
                            </td>

                            {/* Description (INV-X, Pose déjeuné, etc.) */}
                            <td className="py-3.5 px-6 font-semibold text-slate-700 dark:text-slate-200">
                              {tx.description}
                            </td>

                            {/* Montant formaté (+3 200,00 ou -1 000,00) */}
                            <td className={`py-3.5 px-6 text-right font-black text-sm whitespace-nowrap ${
                              tx.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {tx.isPositive ? '+' : '-'}{formatMoney(tx.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* CAS : AUCUNE SESSION ACTIVE - FORMULAIRE D'OUVERTURE */
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xs max-w-xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Wallet className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Aucune session de caisse active
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Définissez le fond de caisse initial pour démarrer la saisie des ventes et mouvements.
                </p>
              </div>

              <form onSubmit={handleOpenSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Fond de caisse d'ouverture (DA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={openAmountInput}
                    onChange={(e) => setOpenAmountInput(e.target.value)}
                    placeholder="4000"
                    className="w-full text-center text-3xl font-mono font-black text-blue-600 dark:text-blue-400 py-3.5 px-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-2xl outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {[1000, 2000, 4000, 5000, 10000, 20000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOpenAmountInput(preset.toString())}
                      className="px-3 py-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                    >
                      {preset.toLocaleString('fr-FR')} DA
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current stroke-none" />
                  <span>Ouvrir la session</span>
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 3. ONGLET 2 : HISTORIQUE DES SESSIONS (PHOTO 3)        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fadeIn">

          {/* BARRE DE RECHERCHE & FILTRES (CONFORME PHOTO 3) */}
          <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-2xs flex flex-wrap items-center gap-4">
            {/* Date De */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">{language === 'ar' ? 'من' : 'De'}</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              />
            </div>

            {/* Date À */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">{language === 'ar' ? 'إلى' : 'À'}</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              />
            </div>

            {/* Filtre Employé */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">{language === 'ar' ? 'المستخدم' : 'Employé'}</label>
              <select
                value={filterCashier}
                onChange={(e) => setFilterCashier(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'جميع المستخدمين' : 'Tous les employés'}</option>
                {cashierOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Bouton Recherche Bleu */}
            <button
              type="button"
              onClick={handleSync}
              className="ml-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'بحث' : 'Recherche'}</span>
            </button>
          </div>

          {/* TABLEAU DES SESSIONS (CONFORME PHOTO 3) */}
          <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3.5 px-4 text-center">#</th>
                    <th className="py-3.5 px-4">{language === 'ar' ? 'المستخدم' : 'Employé'}</th>
                    <th className="py-3.5 px-4">{language === 'ar' ? 'فُتحت في' : 'Ouvert à'}</th>
                    <th className="py-3.5 px-4">{language === 'ar' ? 'أُغلقت في' : 'Fermé à'}</th>
                    <th className="py-3.5 px-4 text-right">{t('cash_mgmt.opening_balance', "Solde d'ouverture")}</th>
                    <th className="py-3.5 px-4 text-right">{language === 'ar' ? 'رصيد الإغلاق' : 'Solde de clôture'}</th>
                    <th className="py-3.5 px-4 text-right">{language === 'ar' ? 'المتوقع' : 'Prévu'}</th>
                    <th className="py-3.5 px-4 text-right">{language === 'ar' ? 'الفارق' : 'Différence'}</th>
                    <th className="py-3.5 px-4 text-center">{language === 'ar' ? 'الحالة' : 'Statut'}</th>
                    <th className="py-3.5 px-4 text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                        {language === 'ar' ? 'لم يتم العثور على أي جلسة تطابق الفلاتر المحددة.' : 'Aucune session trouvée pour les filtres sélectionnés.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((sess) => {
                      const isOpen = sess.status === 'open';
                      const diff = Number(sess.discrepancy || 0);

                      return (
                        <tr key={sess.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {/* # N° de session */}
                          <td className="py-3.5 px-4 font-mono font-bold text-center text-slate-600 dark:text-slate-400">
                            {sess.sessionNumber}
                          </td>

                          {/* Employé */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {(sess.cashier && sess.cashier !== 'BZ Technology') ? sess.cashier : (currentRealUser || 'Admin')}
                          </td>

                          {/* Ouvert à (Français) */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatFrenchDate(sess.openedAt)}
                          </td>

                          {/* Fermé à (Français) */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {isOpen ? '—' : formatFrenchDate(sess.closedAt)}
                          </td>

                          {/* Solde d'ouverture */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {formatMoney(sess.openingBalance)}
                          </td>

                          {/* Solde de clôture */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {isOpen || sess.countedCash === null ? '—' : formatMoney(sess.countedCash)}
                          </td>

                          {/* Prévu */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {isOpen ? '—' : formatMoney(sess.expectedCash)}
                          </td>

                          {/* Différence */}
                          <td className="py-3.5 px-4 text-right font-mono font-black">
                            {isOpen || sess.discrepancy === null ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <span className={diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                {diff >= 0 ? '+' : ''}{formatMoney(diff)}
                              </span>
                            )}
                          </td>

                          {/* Statut (En cours / Clôturée) */}
                          <td className="py-3.5 px-4 text-center">
                            {isOpen ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-[#EAFBF3] text-emerald-700 border border-[#A7F3D0] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                {language === 'ar' ? 'مفتوحة' : 'En cours'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                {language === 'ar' ? 'مغلقة' : 'Clôturée'}
                              </span>
                            )}
                          </td>

                          {/* Action (Ouvrir Détails 👁️) */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedSessionDetail(sess)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Voir les détails complets de la session"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {closedSessionsHistory.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider l'historique</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 4. MODAL DÉTAILS DE LA SESSION (CONFORME PHOTO 4)       */}
      {/* ═══════════════════════════════════════════════════════ */}
      {selectedSessionDetail && (() => {
        const isOpen = selectedSessionDetail.status === 'open';
        const opening = Number(selectedSessionDetail.openingBalance || 0);
        const counted = selectedSessionDetail.countedCash !== null ? Number(selectedSessionDetail.countedCash) : null;
        const diff = Number(selectedSessionDetail.discrepancy || 0);
        const salesTotal = Number(selectedSessionDetail.salesTotal || selectedSessionDetail.encaissements || 0);

        // Récupérer la liste des transactions de cette session
        const sessionTransactions = isOpen
          ? liveTransactions
          : (selectedSessionDetail.transactions || []);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn select-none"
            onClick={() => setSelectedSessionDetail(null)}
          >
            <div
              className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête de la modale */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Détails de la session
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      #{selectedSessionDetail.sessionNumber} • {(selectedSessionDetail.cashier && selectedSessionDetail.cashier !== 'BZ Technology') ? selectedSessionDetail.cashier : (currentRealUser || 'Admin')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSessionDetail(null)}
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Corps déroulant de la modale */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* 4 Cartes de Synthèse (Conforme Photo 4) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Solde d'ouverture */}
                  <div className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-left rtl:text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {language === 'ar' ? 'رصيد الافتتاح' : "SOLDE D'OUVERTURE"}
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white mt-1 block" dir="ltr">
                      {formatMoney(opening)} DA
                    </span>
                  </div>

                  {/* Total des ventes */}
                  <div className="bg-[#F0F7FF] dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-4 text-left rtl:text-right">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      {language === 'ar' ? 'إجمالي المبيعات' : 'TOTAL DES VENTES'}
                    </span>
                    <span className="text-base font-black text-blue-600 dark:text-blue-400 mt-1 block" dir="ltr">
                      {formatMoney(salesTotal)} DA
                    </span>
                  </div>

                  {/* Solde de clôture */}
                  <div className="bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-left rtl:text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {language === 'ar' ? 'رصيد الإغلاق' : 'SOLDE DE CLÔTURE'}
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white mt-1 block" dir="ltr">
                      {isOpen || counted === null ? '0,00 DA' : `${formatMoney(counted)} DA`}
                    </span>
                  </div>

                  {/* Différence */}
                  <div className="bg-[#F0FDF4] dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 rounded-2xl p-4 text-left rtl:text-right">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      {language === 'ar' ? 'الفارق' : 'DIFFÉRENCE'}
                    </span>
                    <span className={`text-base font-black mt-1 block ${
                      diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`} dir="ltr">
                      {diff >= 0 ? '+' : ''}{formatMoney(diff)} DA
                    </span>
                  </div>
                </div>

                {/* Bandeau Horaires (Conforme Photo 4 - 100% en Français) */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{language === 'ar' ? 'فُتحت في :' : 'Ouvert à :'} <strong>{formatFrenchFullDate(selectedSessionDetail.openedAt)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{language === 'ar' ? 'أُغلقت في :' : 'Fermé à :'} <strong>{selectedSessionDetail.closedAt ? formatFrenchFullDate(selectedSessionDetail.closedAt) : '--'}</strong></span>
                  </div>
                </div>

                {/* Tableau Journal des transactions dans la modale (Conforme Photo 4) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{language === 'ar' ? 'سجل العمليات والحركات' : 'Journal des transactions'}</span>
                  </div>

                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left rtl:text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase sticky top-0">
                        <tr>
                          <th className="py-3 px-4">{language === 'ar' ? 'الوقت' : 'Heure'}</th>
                          <th className="py-3 px-4">{language === 'ar' ? 'النوع' : 'Type'}</th>
                          <th className="py-3 px-4">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                          <th className="py-3 px-4 text-right rtl:text-left">{language === 'ar' ? 'المبلغ' : 'Montant'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sessionTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                              {language === 'ar' ? 'لا توجد حركات مسجلة لهذه الجلسة.' : 'Aucune transaction enregistrée pour cette session.'}
                            </td>
                          </tr>
                        ) : (
                          sessionTransactions.map((tx, idx) => (
                            <tr key={tx.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                                {formatFrenchTime(tx.time || tx.timestamp)}
                              </td>
                              <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                                {language === 'ar' ? (
                                  tx.type === 'withdraw' ? 'سحب نقدي' : tx.type === 'deposit' ? 'إيداع نقدي' : 'مبيعات نقدية'
                                ) : (
                                  tx.typeLabel || (tx.type === 'withdraw' ? "Retrait d'espèces" : tx.type === 'deposit' ? "Dépôt d'espèces" : "Ventes en espèces")
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                                {tx.description || tx.reason}
                              </td>
                              <td className={`py-2.5 px-4 text-right rtl:text-left font-black whitespace-nowrap ${
                                tx.isPositive !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`} dir="ltr">
                                {tx.isPositive !== false ? '+' : '-'}{formatMoney(tx.amount)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Pied de la modale */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printCashSessionTicket(selectedSessionDetail, sysSettings)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
                    title={language === 'ar' ? 'طباعة وصل حراري (80 مم)' : 'Imprimer un ticket thermique de caisse (80mm)'}
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'ar' ? 'وصل (80 مم)' : 'Ticket (80mm)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => printCashSessionReportA4(selectedSessionDetail, sysSettings)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
                    title={language === 'ar' ? 'طباعة التقرير الكامل بصيغة A4' : 'Imprimer le bilan complet au format A4'}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{language === 'ar' ? 'طباعة تقرير A4' : 'Imprimer le Bilan A4'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSessionDetail(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إغلاق' : 'Fermer'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 5. MODALE DE CLÔTURE DE SESSION ACTIVE                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      {isCloseModalOpen && (() => {
        const countedVal = parseFloat(countedCash);
        const validCounted = isNaN(countedVal) ? 0 : countedVal;
        const discrepancy = validCounted - currentLiveCashBalance;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn select-none">
            <div className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scaleIn relative">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Clôturer la session
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comptage réel et calcul d'écart automatique
                  </p>
                </div>
              </div>

              {/* Solde attendu */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Solde attendu</span>
                <span className="text-base font-mono font-black text-slate-900 dark:text-white">
                  {formatMoney(currentLiveCashBalance)} DA
                </span>
              </div>

              {/* Saisie montant compté */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Solde réel compté (DA)
                </label>
                <input
                  type="number"
                  step="any"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-center text-2xl font-mono font-black text-blue-600 dark:text-blue-400 py-3 px-4 bg-slate-50 dark:bg-slate-900 border-2 border-blue-500 rounded-2xl outline-none"
                  autoFocus
                  required
                />
              </div>

              {/* Écart en direct */}
              <div className="text-center py-1">
                {discrepancy < -0.01 ? (
                  <div className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono font-black text-xs bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Différence : {formatMoney(discrepancy)} DA (Manquant)</span>
                  </div>
                ) : discrepancy > 0.01 ? (
                  <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Différence : +{formatMoney(discrepancy)} DA (Excédent)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs">
                    <span>Différence : +0,00 DA (Caisse exacte)</span>
                  </div>
                )}
              </div>

              {/* Note optionnelle */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Observation (optionnel)</label>
                <input
                  type="text"
                  value={closureNote}
                  onChange={(e) => setClosureNote(e.target.value)}
                  placeholder="Ex: Écart de monnaie, sandwich..."
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirmer la clôture</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 6. MODALE UNIFIÉE MOUVEMENT (DÉPÔT / RETRAIT / DÉPENSE) */}
      {/* ═══════════════════════════════════════════════════════ */}
      {isMovementModalOpen && (() => {
        const isDep = movementType === 'deposit';
        const isWith = movementType === 'withdraw';
        const presets = isDep ? QUICK_DEPOSIT_REASONS : isWith ? QUICK_WITHDRAW_REASONS : QUICK_EXPENSE_REASONS;
        const title = isDep ? "Dépôt d'espèces" : isWith ? "Retrait d'espèces" : "Ajouter une dépense";
        const subtitle = isDep ? "Entrée de fonds dans la caisse" : isWith ? "Sortie de fonds de la caisse" : "Frais ou charge diverse";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn select-none">
            <form onSubmit={handleSaveMovement} className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scaleIn relative">
              <button
                type="button"
                onClick={() => setIsMovementModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDep
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
                    : isWith
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'
                }`}>
                  {isDep ? <PlusCircle className="w-5 h-5" /> : isWith ? <MinusCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-400">{subtitle}</p>
                </div>
              </div>

              {/* Saisie montant */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Montant (DA)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-center text-2xl font-mono font-black py-3 px-4 border-2 rounded-2xl outline-none bg-slate-50 dark:bg-slate-900 focus:border-blue-500 text-slate-900 dark:text-white"
                  required
                  autoFocus
                />
              </div>

              {/* Motifs rapides */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Motif rapide</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {presets.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMovementReason(r.text)}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer ${
                        movementReason === r.text
                          ? 'bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{r.icon}</span>
                      <span className="truncate">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Saisie motif personnalisée */}
              <input
                type="text"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="Ou précisez le motif manuellement..."
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500"
              />

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!movementAmount || parseFloat(movementAmount) <= 0}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs text-white transition-all cursor-pointer ${
                    isDep
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25'
                      : isWith
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/25'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25'
                  }`}
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 7. TOAST ET DIALOGUE DE CONFIRMATION                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounceIn">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
            toastType === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-amber-500/10'
              : toastType === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 shadow-emerald-500/10'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700'
          }`}>
            <AlertTriangle className={`w-4 h-4 shrink-0 ${toastType === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`} />
            <span>{toastMsg}</span>
            <button
              type="button"
              onClick={() => setToastMsg('')}
              className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
