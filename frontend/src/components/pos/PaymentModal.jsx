import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Check, Banknote, CreditCard, FileText, Printer, RotateCcw, 
  AlertCircle, AlertTriangle, Info, PrinterCheck, PrinterX, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function PaymentModal({
  isOpen,
  grandTotal = 0,
  isReturnMode = false,
  selectedCustomer = null,
  customerName = '',
  defaultPrintReceipt = true,
  onClose,
  onConfirm,
  onOpenAddCustomer
}) {
  const { language, isRTL, t } = useLanguage();
  // Mode de paiement : 'especes' | 'carte' | 'virement' | 'cheque' | 'credit'
  const [method, setMethod] = useState('especes');
  
  // Montant reçu saisi par le caissier
  const [amountPaidInput, setAmountPaidInput] = useState('');
  
  // Impression du ticket
  const [printReceipt, setPrintReceipt] = useState(defaultPrintReceipt);
  
  // Modal de confirmation de dépassement de plafond de dette
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);

  // Message d'erreur si crédit demandé sur client comptoir passager
  const [customerRequiredError, setCustomerRequiredError] = useState(false);

  const baseTotal = Math.abs(grandTotal);

  useEffect(() => {
    if (isOpen) {
      setPrintReceipt(defaultPrintReceipt);
      setMethod('especes');
      setAmountPaidInput(baseTotal > 0 ? baseTotal.toFixed(2) : '0');
      setShowCreditWarning(false);
      setPendingPaymentData(null);
      setCustomerRequiredError(false);
    }
  }, [isOpen, defaultPrintReceipt, baseTotal]);

  // Calculs monétaires
  const total = baseTotal;
  const parsedPaid = parseFloat(String(amountPaidInput || '').replace(',', '.'));
  const amountPaid = isNaN(parsedPaid) || parsedPaid < 0 ? 0 : parsedPaid;

  // Si paiement espèces ou carte et montant reçu >= total : rendu monnaie
  const change = method !== 'credit' && amountPaid > total ? amountPaid - total : 0;

  // Dette / Crédit généré par cette vente
  let debtAmount = 0;
  if (method === 'credit') {
    debtAmount = total;
  } else if (amountPaid < total) {
    debtAmount = total - amountPaid;
  }

  // Informations de dette du client sélectionné
  const isAnonymous = !selectedCustomer || selectedCustomer.id === 1 || selectedCustomer.name?.toLowerCase().includes('passager');
  const currentCustomerDebt = Math.abs(
    selectedCustomer?.balance < 0 
      ? selectedCustomer.balance 
      : (selectedCustomer?.debt || selectedCustomer?.initialDebt || 0)
  );
  const maxDebtLimit = Number(selectedCustomer?.maxDebtLimit || 0);
  const projectedDebt = currentCustomerDebt + debtAmount;
  const isCreditExceeded = maxDebtLimit > 0 && projectedDebt > maxDebtLimit;

  // Action bouton "Dette complète (Reçu = 0)"
  const handleToggleFullDebt = () => {
    if (amountPaid === 0 && method === 'credit') {
      // Rétablir le paiement intégral en espèces
      setMethod('especes');
      setAmountPaidInput(total.toFixed(2));
      setCustomerRequiredError(false);
    } else {
      // Passer en dette complète
      if (isAnonymous) {
        setCustomerRequiredError(true);
      }
      setMethod('credit');
      setAmountPaidInput('0');
    }
  };

  // Exécution finale du paiement
  const executePayment = useCallback((data) => {
    onConfirm({
      method: data.method,
      amountPaid: data.amountPaid,
      change: data.change,
      debtAmount: data.debtAmount,
      printReceipt: data.printReceipt,
      finalTotal: data.finalTotal,
      discount: 0
    });
  }, [onConfirm]);

  // Validation formulaire
  const handleSubmit = useCallback((e) => {
    e?.preventDefault();

    // Si de la dette est demandée mais aucun client enregistré n'est associé
    if (debtAmount > 0 && isAnonymous) {
      setCustomerRequiredError(true);
      return;
    }

    setCustomerRequiredError(false);

    const paymentPayload = {
      method: debtAmount === total ? 'credit' : method,
      amountPaid: method === 'credit' ? 0 : Math.min(amountPaid, total),
      change: change,
      debtAmount: debtAmount,
      printReceipt: printReceipt,
      finalTotal: total
    };

    // Vérifier si le plafond de crédit du client est dépassé
    if (debtAmount > 0 && isCreditExceeded) {
      setPendingPaymentData(paymentPayload);
      setShowCreditWarning(true);
      return;
    }

    executePayment(paymentPayload);
  }, [debtAmount, isAnonymous, total, method, amountPaid, change, printReceipt, isCreditExceeded, executePayment]);

  // Raccourcis clavier (F1 / Entrée pour confirmer, Échap pour fermer)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (showCreditWarning && pendingPaymentData) {
          executePayment(pendingPaymentData);
          setShowCreditWarning(false);
        } else {
          handleSubmit();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (showCreditWarning) {
          setShowCreditWarning(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCreditWarning, pendingPaymentData, handleSubmit, onClose, executePayment]);

  // Si modal non ouverte, ne rien afficher APRÈS que tous les hooks ont été exécutés
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL PRINCIPALE : FINALISER LE PAIEMENT (EXACT DESIGN RÉFÉRENCE) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-4 animate-scaleIn relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête : Titre & Bouton Fermer */}
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
            {isReturnMode
              ? (language === 'ar' ? 'استرجاع المنتجات وإعادة المبلغ' : "Remboursement et retour d'articles")
              : (language === 'ar' ? 'إتمام الدفع وتسجيل عملية البيع' : 'Finaliser le paiement et enregistrer la vente')}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
            title={language === 'ar' ? 'إغلاق [Échap]' : 'Fermer [Échap]'}
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 1. Cadre Sombre : Total Requis (Style exact référence) */}
        <div className="bg-[#111827] dark:bg-[#0B1120] text-white rounded-2xl py-4 px-5 text-center shadow-md border border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
            {language === 'ar' ? 'المبلغ الإجمالي المستحق' : 'Total requis'}
          </div>
          <div className="text-3xl font-mono font-black text-white tracking-tight" dir="ltr">
            {total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl font-sans font-bold text-slate-300">DA</span>
          </div>
        </div>

        {/* Formulaire de paiement */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* 2. Mode de paiement */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 text-left rtl:text-right">
              {language === 'ar' ? 'طريقة الدفع' : 'Mode de paiement'}
            </label>
            <select
              value={method}
              onChange={(e) => {
                const nextMethod = e.target.value;
                setMethod(nextMethod);
                if (nextMethod === 'credit') {
                  setAmountPaidInput('0');
                  if (isAnonymous) setCustomerRequiredError(true);
                } else if (amountPaidInput === '0' || amountPaidInput === '') {
                  setAmountPaidInput(total.toFixed(2));
                  setCustomerRequiredError(false);
                }
              }}
              className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="especes">{language === 'ar' ? 'نقداً (Espèces)' : 'Espèces (نقداً)'}</option>
              <option value="carte">{language === 'ar' ? 'بطاقة ذهبية / بنكية (Carte CIB)' : 'Carte CIB / Dahabia (بطاقة بنكية)'}</option>
              <option value="virement">{language === 'ar' ? 'تحويل بنكي (Virement)' : 'Virement bancaire (تحويل بنكي)'}</option>
              <option value="cheque">{language === 'ar' ? 'شيك بنكي (Chèque)' : 'Chèque (شيك)'}</option>
              <option value="credit">{language === 'ar' ? 'دفع آجل / دين (À crédit)' : 'À crédit / Dette (دين / دفع آجل)'}</option>
            </select>
          </div>

          {/* 3. Montant reçu du client (DA) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 text-left rtl:text-right">
              {language === 'ar' ? 'المبلغ المستلم من الزبون (دج)' : 'Montant reçu du client (DA)'}
            </label>
            <div className="relative flex items-center border-2 border-blue-500 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20">
              <input
                type="number"
                min="0"
                step="any"
                value={amountPaidInput}
                onChange={(e) => {
                  setAmountPaidInput(e.target.value);
                  setCustomerRequiredError(false);
                }}
                placeholder={total.toFixed(2)}
                className="w-full text-center text-2xl font-mono font-black text-slate-900 dark:text-white bg-transparent outline-none"
                autoFocus
                dir="ltr"
              />
            </div>
          </div>

          {/* 4. Rendu monnaie ou Reste à crédit */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'الحساب والمتبقي :' : 'Le reste :'}
            </span>
            
            {debtAmount > 0 ? (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold font-mono">
                {language === 'ar' ? `المتبقي في الدين : ${debtAmount.toFixed(2)} دج` : `Reste à crédit : ${debtAmount.toFixed(2)} DA`}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold font-mono">
                {language === 'ar' ? `الصرف المتبقي للزبون : ${change.toFixed(2)} دج` : `Rendu monnaie : ${change.toFixed(2)} DA`}
              </span>
            )}
          </div>

          {/* 5. Bouton Rose/Rouge : Dette complète (Reçu = 0) (Style exact référence) */}
          <button
            type="button"
            onClick={handleToggleFullDebt}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              amountPaid === 0 && method === 'credit'
                ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 text-rose-800 dark:text-rose-200'
                : 'bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900 text-rose-700 dark:text-rose-300'
            }`}
          >
            <CreditCard className="w-4 h-4 text-rose-600" />
            <span>{language === 'ar' ? 'دين كامل (المبلغ المستلم = 0 دج)' : 'Dette complète (Montant reçu = 0 DA)'}</span>
          </button>

          {/* Alerte si client anonyme lors d'une vente à crédit */}
          {customerRequiredError && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{language === 'ar' ? 'تحديد زبون إلزامي للبيع بالدين :' : 'Client régulier requis pour le crédit :'}</span>
              </div>
              <p className="text-[11px] leading-tight">
                {language === 'ar'
                  ? `لتسجيل الدفع الآجل، يرجى اختيار أو تسجيل زبون دائم بدلاً من "${selectedCustomer?.name || 'زبون عادي'}".`
                  : `Pour enregistrer une dette, veuillez d'abord sélectionner ou ajouter un client nommé au lieu de "${selectedCustomer?.name || 'Client Comptoir'}".`}
              </p>
              {onOpenAddCustomer && (
                <button
                  type="button"
                  onClick={onOpenAddCustomer}
                  className="w-full py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                >
                  {language === 'ar' ? '+ إضافة زبون جديد الآن' : '+ Ajouter un client maintenant'}
                </button>
              )}
            </div>
          )}

          {/* 6. Barre d'action inférieure : Gros bouton vert + options impression */}
          <div className="pt-2 flex items-center gap-2">
            
            {/* Gros bouton vert de validation */}
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="px-1.5 py-0.5 rounded bg-emerald-700/60 text-[10px] font-mono tracking-wider">
                F1
              </span>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{language === 'ar' ? 'تأكيد ودفع الفاتورة' : 'Confirmer et facturer la vente'}</span>
            </button>

            {/* Bouton Ticket Thermique (Actif / Inactif) */}
            <button
              type="button"
              onClick={() => setPrintReceipt(!printReceipt)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                printReceipt
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
              }`}
              title={printReceipt ? (language === 'ar' ? 'طباعة الوصل مفعلة (انقر للتعطيل)' : 'Impression ticket activée (cliquez pour désactiver)') : (language === 'ar' ? 'طباعة الوصل معطلة' : 'Impression ticket désactivée')}
            >
              <Printer className="w-5 h-5" />
            </button>

            {/* Bouton Sans impression / Options */}
            <button
              type="button"
              onClick={() => setPrintReceipt(false)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                !printReceipt
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
              }`}
              title={language === 'ar' ? 'تأكيد دون طباعة وصل' : 'Valider sans imprimer de ticket'}
            >
              <PrinterX className="w-5 h-5" />
            </button>

          </div>

        </form>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 2 : CONFIRMATION DÉPASSEMENT PLAFOND DE CRÉDIT             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showCreditWarning && pendingPaymentData && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
          <div 
            className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icône bleue informative (i) dans un cercle doux */}
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Info className="w-8 h-8 stroke-[2.2]" />
            </div>

            {/* Titre */}
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'تأكيد العملية' : "Confirmation de l'opération"}
              </h3>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                {language === 'ar' ? 'تنبيه : هذا الزبون سيتجاوز سقف الائتمان المسموح به !' : 'Attention : ce client va dépasser son plafond de crédit !'}
              </p>
            </div>

            {/* Détails financiers */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3.5 space-y-2 border border-slate-100 dark:border-slate-700/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'الدين الحالي :' : 'Dette actuelle :'}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">
                  {currentCustomerDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {language === 'ar' ? 'د.ج' : 'DA'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'السقف المسموح به :' : 'Plafond autorisé :'}</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {maxDebtLimit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {language === 'ar' ? 'د.ج' : 'DA'}
                </span>
              </div>

              <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="font-black text-rose-600 dark:text-rose-400">{language === 'ar' ? 'الدين بعد هذه الفاتورة :' : 'Dette après cette facture :'}</span>
                <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                  {projectedDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {language === 'ar' ? 'د.ج' : 'DA'}
                </span>
              </div>
            </div>

            {/* Question */}
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'هل ترغب في المتابعة وتأكيد العملية رغم ذلك؟' : 'Voulez-vous continuer malgré tout ?'}
            </div>

            {/* Boutons Confirmer (bleu) & Annuler (blanc) */}
            <div className="w-full grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  executePayment(pendingPaymentData);
                  setShowCreditWarning(false);
                }}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-600/20 active:scale-98 transition-all cursor-pointer"
              >
                {language === 'ar' ? 'تأكيد ومتابعة' : 'Confirmer'}
              </button>

              <button
                type="button"
                onClick={() => setShowCreditWarning(false)}
                className="py-2.5 px-4 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
