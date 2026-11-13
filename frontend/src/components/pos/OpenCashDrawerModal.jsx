import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, X, ChevronUp, ChevronDown, MinusCircle, PlusCircle, 
  Lock, LayoutGrid, ArrowLeft, Check, History, Coffee, 
  Utensils, ShoppingBag, Truck, DollarSign, Wallet,
  User, AlertTriangle, CheckCircle2, FileText
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function OpenCashDrawerModal({
  isOpen,
  onClose,
  cashSession = { isOpen: false, openingBalance: 0 },
  onOpenSession,
  onCloseSession,
  cashMovements = [],
  onAddCashMovement,
  cashSalesTotal = 0,
  onNavigate
}) {
  const { language, isRTL } = useLanguage();

  const QUICK_WITHDRAW_REASONS = [
    { label: language === 'ar' ? 'غداء / ساندويتش' : 'Sandwich / Déjeuner', icon: '🥪', text: language === 'ar' ? 'وجبة غداء / ساندويتش' : 'Sandwich / Déjeuner' },
    { label: language === 'ar' ? 'قهوة / مشروب' : 'Café / Boisson', icon: '☕', text: language === 'ar' ? 'قهوة ومشروبات' : 'Café / Boisson' },
    { label: language === 'ar' ? 'خبز / مخبوزات' : 'Pain / Boulangerie', icon: '🥖', text: language === 'ar' ? 'خبز ومخبوزات' : 'Pain / Boulangerie' },
    { label: language === 'ar' ? 'أكياس / لوازم' : 'Fournitures / Sacs', icon: '🛍️', text: language === 'ar' ? 'شراء أكياس ولوازم المحل' : 'Achat de sacs / fournitures' },
    { label: language === 'ar' ? 'تسديد مورد سريع' : 'Règlement Fournisseur', icon: '📦', text: language === 'ar' ? 'دفع سريع للمورد' : 'Paiement fournisseur express' },
    { label: language === 'ar' ? 'مصروف متنوع' : 'Dépense Diverse', icon: '💸', text: language === 'ar' ? 'مصاريف نثرية متنوعة' : 'Dépense diverse' },
  ];

  const QUICK_DEPOSIT_REASONS = [
    { label: language === 'ar' ? 'تزويد فكة / صرف' : 'Apport de Monnaie', icon: '🪙', text: language === 'ar' ? 'إدخال فكة لصندوق المحل' : 'Apport de monnaie pour tiroir' },
    { label: language === 'ar' ? 'إضافة أموال شخصية' : 'Ajout Personnel', icon: '💵', text: language === 'ar' ? 'إضافة أموال شخصية للصندوق' : 'Ajout de fonds personnel' },
    { label: language === 'ar' ? 'مدخول نقدي إضافي' : 'Rentrée Diverse', icon: '💰', text: language === 'ar' ? 'مدخول نقدي متنوع' : 'Rentrée d’espèces diverse' },
  ];

  // Current Active Sub-View: 'dashboard' | 'open_form' | 'withdraw' | 'deposit' | 'history' | 'close_confirm'
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Opening Balance input state
  const [openingAmount, setOpeningAmount] = useState(cashSession?.openingBalance || 0);
  
  // Movement Input state (Retrait / Dépôt)
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // Clôture: Espèces réellement comptées dans le tiroir
  const [countedCash, setCountedCash] = useState('');
  const [closureNote, setClosureNote] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (!cashSession?.isOpen) {
        setCurrentView('open_form');
        setOpeningAmount(cashSession?.openingBalance || 0);
      } else {
        setCurrentView('dashboard');
      }
      setMovementAmount('');
      setMovementReason('');
      setClosureNote('');
    }
  }, [isOpen, cashSession?.isOpen, cashSession?.openingBalance]);

  useEffect(() => {
    if (isOpen && (currentView === 'open_form' || currentView === 'withdraw' || currentView === 'deposit' || currentView === 'close_confirm')) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 60);
    }
  }, [isOpen, currentView]);

  if (!isOpen) return null;

  // Calculs financiers de la session
  const openingBalance = Number(cashSession?.openingBalance || 0);
  const salesCash = Number(cashSalesTotal || 0);
  
  const depositsTotal = cashMovements
    .filter((m) => m.type === 'deposit')
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const withdrawalsTotal = cashMovements
    .filter((m) => m.type === 'withdraw')
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const totalCashIn = salesCash + depositsTotal;
  const totalCashOut = withdrawalsTotal;
  const currentCashBalance = openingBalance + totalCashIn - totalCashOut;

  // Soumission de l'ouverture de caisse (matin)
  const handleOpenSubmit = (e) => {
    e?.preventDefault();
    const val = parseFloat(openingAmount);
    const validAmount = isNaN(val) || val < 0 ? 0 : val;
    onOpenSession && onOpenSession(validAmount);
    setCurrentView('dashboard');
  };

  // Soumission d'un retrait (Sandwich, Café, etc.)
  const handleWithdrawSubmit = (e) => {
    e?.preventDefault();
    const amt = parseFloat(movementAmount);
    if (isNaN(amt) || amt <= 0) return;
    const reason = movementReason.trim() || (language === 'ar' ? 'سحب نقدي' : 'Retrait d’espèces');
    onAddCashMovement && onAddCashMovement({
      type: 'withdraw',
      amount: amt,
      reason
    });
    setMovementAmount('');
    setMovementReason('');
    setCurrentView('dashboard');
  };

  // Soumission d'un dépôt (Apport de monnaie, etc.)
  const handleDepositSubmit = (e) => {
    e?.preventDefault();
    const amt = parseFloat(movementAmount);
    if (isNaN(amt) || amt <= 0) return;
    const reason = movementReason.trim() || (language === 'ar' ? 'إيداع نقدي' : 'Dépôt d’espèces');
    onAddCashMovement && onAddCashMovement({
      type: 'deposit',
      amount: amt,
      reason
    });
    setMovementAmount('');
    setMovementReason('');
    setCurrentView('dashboard');
  };

  // Clôture de la caisse
  const handleConfirmClose = () => {
    const countedVal = parseFloat(countedCash);
    const validCounted = isNaN(countedVal) ? 0 : countedVal;
    const discrepancy = validCounted - currentCashBalance;

    onCloseSession && onCloseSession({
      discrepancy,
      countedCash: validCounted,
      expectedCash: currentCashBalance,
      note: closureNote.trim(),
      cashier: cashSession?.openedBy || 'Admin'
    });
    setCurrentView('open_form');
    onClose && onClose();
  };

  // Formatage de l'heure d'ouverture
  const openedTimeStr = cashSession?.openedAt 
    ? new Date(cashSession.openedAt).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '08:00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn select-none">
      <div 
        className="bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-scaleIn relative overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermer (X) en haut à droite / gauche */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* VUE 1 : TABLEAU DE BORD SESSION OUVERTE */}
        {/* ═══════════════════════════════════════════════════════ */}
        {currentView === 'dashboard' && (
          <div className="space-y-4">
            
            {/* En-tête : Caisse Ouverte #Session */}
            <div className="flex items-center justify-between pr-8 rtl:pr-0 rtl:pl-8">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
                      {language === 'ar' ? `الصندوق مفتوح #${cashSession?.sessionNumber || '01'}` : `Caisse Ouverte #${cashSession?.sessionNumber || '01'}`}
                    </h2>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {language === 'ar' 
                      ? `مفتوح منذ ${openedTimeStr} • ${cashSession?.openedBy || 'Admin'}` 
                      : `Ouverte depuis ${openedTimeStr} • ${cashSession?.openedBy || 'Admin'}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Grand Cadre Émeraude au Centre : SOLDE ACTUEL EN CAISSE */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 rounded-3xl p-5 text-center shadow-2xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                {language === 'ar' ? 'الرصيد الحالي في الصندوق' : 'Solde Actuel en Caisse'}
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-800 dark:text-emerald-300 tracking-tight mt-1" dir="ltr">
                {currentCashBalance.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-sans font-bold ml-1.5 opacity-80">DA</span>
              </div>
            </div>

            {/* 3 Cartes Récapitulatives : Solde Initial | Entrées | Sorties */}
            <div className="grid grid-cols-3 gap-2">
              {/* Solde Initial (Ouverture) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block">
                  {language === 'ar' ? 'الرصيد الافتتاحي' : 'Solde Initial'}
                </span>
                <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-200 mt-0.5 block truncate" dir="ltr">
                  {openingBalance.toFixed(2)}
                </span>
              </div>

              {/* Entrées / Ventes */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                  {language === 'ar' ? 'المبيعات والإيداعات' : 'Ventes & Entrées'}
                </span>
                <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block truncate" dir="ltr">
                  +{totalCashIn.toFixed(2)}
                </span>
              </div>

              {/* Sorties / Dépenses */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-2.5 text-center shadow-2xs">
                <span className="text-[10px] font-bold text-rose-500 block">
                  {language === 'ar' ? 'المصروفات والسحوبات' : 'Sorties & Dépenses'}
                </span>
                <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 mt-0.5 block truncate" dir="ltr">
                  -{totalCashOut.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 4 Boutons d'Action Principaux */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              
              {/* Bouton 1 : Retrait d'espèces */}
              <button
                type="button"
                onClick={() => setCurrentView('withdraw')}
                className="flex items-center justify-center gap-2 py-3 px-3 bg-amber-50/90 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-2xs active:scale-97"
              >
                <MinusCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>{language === 'ar' ? 'سحب نقدي' : "Retrait d'espèces"}</span>
              </button>

              {/* Bouton 2 : Dépôt d'espèces */}
              <button
                type="button"
                onClick={() => setCurrentView('deposit')}
                className="flex items-center justify-center gap-2 py-3 px-3 bg-emerald-50/90 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-2xs active:scale-97"
              >
                <PlusCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>{language === 'ar' ? 'إيداع نقدي' : "Dépôt d'espèces"}</span>
              </button>

              {/* Bouton 3 : Clôturer la caisse */}
              <button
                type="button"
                onClick={() => {
                  setCurrentView('close_confirm');
                  setCountedCash(currentCashBalance.toFixed(2));
                }}
                className="flex items-center justify-center gap-2 py-3 px-3 bg-rose-600 hover:bg-rose-700 active:scale-97 text-white rounded-2xl font-black text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>{language === 'ar' ? 'إغلاق الصندوق' : 'Clôturer la caisse'}</span>
              </button>

              {/* Bouton 4 : Journal de caisse */}
              <button
                type="button"
                onClick={() => setCurrentView('history')}
                className="flex items-center justify-center gap-2 py-3 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-2xs active:scale-97"
              >
                <LayoutGrid className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{language === 'ar' ? 'سجل حركات الصندوق' : 'Journal de caisse'}</span>
              </button>
            </div>

            {/* Lien Fermer en bas */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* VUE 2 : RETRAIT D'ESPÈCES */}
        {/* ═══════════════════════════════════════════════════════ */}
        {currentView === 'withdraw' && (
          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rtl:rotate-180"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <MinusCircle className="w-4 h-4 text-amber-600" />
                  <span>{language === 'ar' ? 'سحب نقدي (مصروف من الصندوق)' : "Retrait d'espèces (Sortie de caisse)"}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'ar' ? 'مثال: غداء، قهوة، مصروفات صغيرة، مشتريات للمحل' : 'Ex: Sandwich, café, menue dépense, achat magasin'}
                </p>
              </div>
            </div>

            {/* Saisie du montant */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                {language === 'ar' ? 'المبلغ المراد سحبه (دج)' : 'Montant à retirer (DA)'}
              </label>
              <div className="relative flex items-center border-2 border-amber-400 focus-within:border-amber-500 rounded-2xl bg-amber-50/20 overflow-hidden shadow-2xs">
                <input
                  ref={inputRef}
                  type="number"
                  min="1"
                  step="any"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-center text-2xl font-mono font-black text-amber-900 dark:text-amber-100 py-3 px-8 bg-transparent outline-none"
                  required
                />
                <span className="absolute right-4 rtl:right-auto rtl:left-4 font-mono font-bold text-xs text-amber-600">DA</span>
              </div>
            </div>

            {/* Puces de motifs rapides */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">
                {language === 'ar' ? 'السبب السريع' : 'Motif rapide'}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_WITHDRAW_REASONS.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMovementReason(r.text)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold text-left rtl:text-right transition-all cursor-pointer ${
                      movementReason === r.text
                        ? 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-amber-400/20'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-sm">{r.icon}</span>
                    <span className="truncate">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Saisie libre du motif */}
            <div>
              <input
                type="text"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder={language === 'ar' ? 'أو اكتب السبب يدوياً هنا...' : 'Ou précisez le motif manuellement...'}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500"
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={!movementAmount || parseFloat(movementAmount) <= 0}
                className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white shadow-md shadow-amber-600/20 transition-all cursor-pointer"
              >
                {language === 'ar' ? 'تأكيد السحب' : 'Confirmer le retrait'}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* VUE 3 : DÉPÔT D'ESPÈCES */}
        {/* ═══════════════════════════════════════════════════════ */}
        {currentView === 'deposit' && (
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rtl:rotate-180"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'إيداع نقدي (إدخال إلى الصندوق)' : "Dépôt d'espèces (Entrée de caisse)"}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'ar' ? 'مثال: تزويد فكة للدرج، إضافة أموال شخصية' : 'Ex: Apport de monnaie pour tiroir, ajout personnel hors vente'}
                </p>
              </div>
            </div>

            {/* Saisie du montant */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">
                {language === 'ar' ? 'المبلغ المراد إيداعه (دج)' : 'Montant à déposer (DA)'}
              </label>
              <div className="relative flex items-center border-2 border-emerald-400 focus-within:border-emerald-500 rounded-2xl bg-emerald-50/20 overflow-hidden shadow-2xs">
                <input
                  ref={inputRef}
                  type="number"
                  min="1"
                  step="any"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-center text-2xl font-mono font-black text-emerald-900 dark:text-emerald-100 py-3 px-8 bg-transparent outline-none"
                  required
                />
                <span className="absolute right-4 rtl:right-auto rtl:left-4 font-mono font-bold text-xs text-emerald-600">DA</span>
              </div>
            </div>

            {/* Puces de motifs rapides pour dépôt */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">
                {language === 'ar' ? 'السبب السريع' : 'Motif'}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_DEPOSIT_REASONS.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMovementReason(r.text)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold text-left rtl:text-right transition-all cursor-pointer ${
                      movementReason === r.text
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300 ring-2 ring-emerald-400/20'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-sm">{r.icon}</span>
                    <span className="truncate">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Saisie libre du motif */}
            <div>
              <input
                type="text"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder={language === 'ar' ? 'أو اكتب السبب يدوياً هنا...' : 'Ou précisez le motif manuellement...'}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={!movementAmount || parseFloat(movementAmount) <= 0}
                className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {language === 'ar' ? 'تأكيد الإيداع' : 'Confirmer le dépôt'}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* VUE 4 : JOURNAL / HISTORIQUE DES MOUVEMENTS DE CAISSE */}
        {/* ═══════════════════════════════════════════════════════ */}
        {currentView === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentView('dashboard')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors rtl:rotate-180"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-blue-600" />
                  <span>{language === 'ar' ? 'سجل حركات الصندوق' : 'Journal des mouvements de caisse'}</span>
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {cashMovements.length} {language === 'ar' ? 'حركة' : 'mouvement(s)'}
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {/* Ligne d'ouverture de caisse */}
              <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-blue-900 dark:text-blue-200">
                    {language === 'ar' ? 'الرصيد الافتتاحي للصندوق' : 'Solde d’ouverture de caisse'}
                  </div>
                  <div className="text-[10px] text-slate-400">{openedTimeStr}</div>
                </div>
                <span className="text-xs font-mono font-black text-blue-600" dir="ltr">
                  +{openingBalance.toFixed(2)} DA
                </span>
              </div>

              {/* Mouvements de retraits et dépôts */}
              {cashMovements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {language === 'ar' ? 'لا توجد أي حركات سحب أو إيداع مسجلة لهذه الجلسة.' : 'Aucun retrait ni dépôt enregistré pour cette session.'}
                </div>
              ) : (
                cashMovements.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      m.type === 'withdraw'
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/60'
                        : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {m.reason}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-black ${
                      m.type === 'withdraw' ? 'text-rose-600' : 'text-emerald-600'
                    }`} dir="ltr">
                      {m.type === 'withdraw' ? '-' : '+'}{Number(m.amount).toFixed(2)} DA
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'رجوع' : 'Retour'}
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose && onClose();
                    onNavigate('cash_drawer');
                  }}
                  className="flex-1 py-2.5 rounded-xl font-black text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'سجل الجلسات' : 'Journal des Sessions'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* VUE 5 : CLÔTURE DE CAISSE & CALCUL DE DIFFÉRENCE / FUITE */}
        {/* ═══════════════════════════════════════════════════════ */}
        {currentView === 'close_confirm' && (() => {
          const countedVal = parseFloat(countedCash);
          const validCounted = isNaN(countedVal) ? 0 : countedVal;
          const discrepancy = validCounted - currentCashBalance;

          return (
            <div className="space-y-4 animate-fadeIn">
              
              {/* En-tête : Titre, sous-titre & Icône Cadenas rouge */}
              <div className="flex items-center justify-between pr-8 rtl:pr-0 rtl:pl-8">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
                    {language === 'ar' ? 'إغلاق الجلسة' : 'Clôturer la session'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === 'ar' ? 'التحقق من المبلغ الفعلي الموجود في الصندوق' : 'Vérifier le montant réel dans la caisse'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>

              {/* Caissier / Utilisateur */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-slate-500 font-medium">{language === 'ar' ? 'أمين الصندوق :' : 'Caissier :'}</span>
                  <strong className="text-slate-800 dark:text-white font-bold">{cashSession?.openedBy || 'Admin'}</strong>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {language === 'ar' ? `فُتحت عند ${openedTimeStr}` : `Ouverte à ${openedTimeStr}`}
                </span>
              </div>

              {/* Ligne 1 : Solde Attendu */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between shadow-2xs">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {language === 'ar' ? 'الرصيد المتوقع' : 'Solde attendu'}
                </span>
                <span className="text-base font-mono font-black text-slate-800 dark:text-white" dir="ltr">
                  {currentCashBalance.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                </span>
              </div>

              {/* Ligne 2 : Solde Réel (DA) */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">
                  {language === 'ar' ? 'الرصيد الفعلي في الدرج (دج)' : 'Solde réel (DA)'}
                </label>
                <div className="relative flex items-center border-2 border-blue-500 rounded-2xl bg-white dark:bg-[#13223F] shadow-sm overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/20">
                  <input
                    ref={inputRef}
                    type="number"
                    step="any"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    placeholder="0"
                    className="w-full text-center text-2xl font-mono font-black text-blue-600 dark:text-blue-400 py-3 px-8 bg-transparent outline-none tracking-wide"
                    required
                  />
                  <span className="absolute right-3.5 rtl:right-auto rtl:left-3.5 font-mono font-bold text-xs text-slate-400 pointer-events-none">DA</span>
                </div>
              </div>

              {/* Ligne 3 : La Différence */}
              <div className="text-center py-1">
                {discrepancy < -0.01 ? (
                  <div className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono font-black text-sm bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {language === 'ar' 
                        ? `الفارق : ${discrepancy.toLocaleString('ar-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} دج (عجز / ناقص)` 
                        : `La Différence : ${discrepancy.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA (Fuite / Manquant)`}
                    </span>
                  </div>
                ) : discrepancy > 0.01 ? (
                  <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {language === 'ar' 
                        ? `الفارق : +${discrepancy.toLocaleString('ar-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} دج (فائض / زائد)` 
                        : `La Différence : +${discrepancy.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA (Excédent)`}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm">
                    <span>{language === 'ar' ? 'الفارق : +0.00 دج (مطابق تماماً)' : 'La Différence : +0,00 DA'}</span>
                  </div>
                )}
              </div>

              {/* Ligne 4 : Remarque */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {language === 'ar' ? 'ملاحظة (اختياري)' : 'Remarque (optionnel)'}
                </label>
                <input
                  type="text"
                  value={closureNote}
                  onChange={(e) => setClosureNote(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: فارق صرف، ساندويتش...' : 'Ex: Écart de monnaie, sandwich...'}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white transition-all"
                />
              </div>

              {/* Ligne 5 : Boutons d'action */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentView('dashboard')}
                  className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  className="flex-1 py-3 px-4 rounded-2xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>{language === 'ar' ? 'تأكيد إغلاق الصندوق' : 'Confirmer la clôture'}</span>
                </button>
              </div>

            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* VUE 6 : OUVERTURE DE CAISSE (LE MATIN) */}
        {/* ═══════════════════════════════════════════════════════ */}
        {currentView === 'open_form' && (
          <form onSubmit={handleOpenSubmit} className="space-y-4">
            <div className="flex items-start gap-3.5 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {language === 'ar' ? 'فتح الصندوق (الصباح)' : 'Ouvrir la caisse (Matin)'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {language === 'ar' ? 'أدخل الرصيد الافتتاحي للبدء في وردية اليوم.' : 'Saisissez le fond de caisse initial pour démarrer la journée.'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'ar' ? 'الرصيد الافتتاحي' : 'Solde d’ouverture'}
              </label>

              <div className="relative flex items-center border-2 border-blue-500 rounded-2xl bg-white dark:bg-[#13223F] shadow-sm overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/20">
                <input
                  ref={inputRef}
                  type="number"
                  min="0"
                  step="any"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  className="w-full text-center text-3xl font-black text-blue-600 dark:text-blue-400 py-3.5 px-10 bg-transparent outline-none tracking-wide font-mono"
                  placeholder="0"
                />
                <div className="absolute left-4 rtl:left-auto rtl:right-4 text-xs font-bold font-mono text-slate-400 pointer-events-none">
                  DA
                </div>
              </div>
            </div>

            {/* Coupures rapides */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {[1000, 2000, 5000, 10000, 20000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOpeningAmount(preset)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:border-blue-300 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  {preset.toLocaleString()} DA
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl font-black text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current stroke-none" />
                <span>{language === 'ar' ? 'فتح الوردية' : 'Ouvrir la session'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
