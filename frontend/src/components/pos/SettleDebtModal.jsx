import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  Coins, 
  Check, 
  Printer, 
  AlertCircle, 
  ArrowRight, 
  Receipt, 
  Wallet, 
  Banknote, 
  Building2,
  Calendar
} from 'lucide-react';
import { printThermalTicketDirect, printDebtReceiptThermal } from '../../services/thermalPrinter';
import { useLanguage } from '../../i18n/LanguageContext';

export default function SettleDebtModal({
  isOpen,
  customer,
  onClose,
  onSettled
}) {
  const { language, isRTL } = useLanguage();
  const currentDebt = customer ? Math.abs(customer.balance < 0 ? customer.balance : (customer.debt || 0)) : 0;
  const initialDebt = customer ? Number(customer.initialDebt || 0) : 0;

  // Calcul des règlements antérieurs du client
  const customerPayments = useMemo(() => {
    if (!customer) return [];
    try {
      const all = JSON.parse(localStorage.getItem('novamag_customer_payments') || '[]');
      return all.filter((p) => String(p.customerId) === String(customer.id) || p.customerName === customer.name);
    } catch {
      return [];
    }
  }, [customer, isOpen]);

  const totalPaidPrior = customerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingInitialDebtPrior = Math.max(0, initialDebt - totalPaidPrior);

  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('especes');
  const [notes, setNotes] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && customer) {
      setAmountPaid(currentDebt > 0 ? String(currentDebt) : '');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('especes');
      setNotes(language === 'ar' ? 'تسديد حساب زبون' : 'Règlement compte client');
      setPrintReceipt(true);
      setErrorMessage('');

      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, customer, currentDebt, language]);

  if (!isOpen || !customer) return null;

  const numAmount = parseFloat(amountPaid) || 0;
  const remainingDebt = Math.max(0, currentDebt - numAmount);
  const isOverpaying = numAmount > currentDebt && currentDebt > 0;

  const paidToInitialDebt = Math.min(remainingInitialDebtPrior, numAmount);
  const newRemainingInitialDebt = Math.max(0, remainingInitialDebtPrior - paidToInitialDebt);
  const paidToOtherDebt = Math.max(0, numAmount - paidToInitialDebt);

  const handleQuickAmount = (val) => {
    setAmountPaid(String(val));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMessage(language === 'ar' ? 'يرجى إدخال مبلغ صحيح أكبر من 0 دج' : 'Veuillez saisir un montant valide supérieur à 0 DA');
      return;
    }

    const newDebt = Math.max(0, currentDebt - numAmount);
    const updatedCustomer = {
      ...customer,
      balance: -newDebt,
      debt: newDebt,
      remainingInitialDebt: newRemainingInitialDebt
    };

    const dParts = paymentDate.split('-');
    const dateFormatted = dParts.length === 3 
      ? `${dParts[2]}/${dParts[1]}/${dParts[0]} à ${new Date().toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}` 
      : new Date().toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR');
    const paymentTimestamp = paymentDate 
      ? new Date(paymentDate + 'T12:00:00').toISOString() 
      : new Date().toISOString();

    const paymentRecord = {
      id: Date.now(),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone || '',
      dateStr: dateFormatted,
      timestamp: paymentTimestamp,
      paymentDate: paymentDate,
      amount: numAmount,
      paidToInitialDebt,
      paidToOtherDebt,
      remainingInitialDebt: newRemainingInitialDebt,
      previousDebt: currentDebt,
      remainingDebt: newDebt,
      method: paymentMethod,
      notes: notes || (language === 'ar' ? 'تسديد دين' : 'Règlement de dette')
    };

    try {
      const existingPayments = JSON.parse(localStorage.getItem('novamag_customer_payments') || '[]');
      localStorage.setItem('novamag_customer_payments', JSON.stringify([paymentRecord, ...existingPayments]));
    } catch (err) {
      console.warn(err);
    }

    try {
      const cashMovements = JSON.parse(localStorage.getItem('novamag_cash_movements') || '[]');
      cashMovements.push({
        id: Date.now(),
        type: 'IN',
        category: 'REGLEMENT_DETTE',
        amount: numAmount,
        reason: language === 'ar' ? `تسديد دين زبون : ${customer.name}` : `Règlement dette client : ${customer.name}`,
        date: new Date().toISOString(),
        method: paymentMethod
      });
      localStorage.setItem('novamag_cash_movements', JSON.stringify(cashMovements));
      window.dispatchEvent(new Event('novamag_cash_updated'));
    } catch (err) {
      console.warn(err);
    }

    if (printReceipt) {
      try {
        const sysSettings = JSON.parse(localStorage.getItem('novamag_system_settings') || '{}');
        printDebtReceiptThermal(paymentRecord, updatedCustomer, sysSettings);
      } catch (err) {
        console.warn('Erreur impression ticket dette:', err);
      }
    }

    onSettled && onSettled(updatedCustomer, paymentRecord);
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn select-none overflow-y-auto">
      <div 
        className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl animate-scaleIn relative flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-[#111C35]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shrink-0">
              <Coins className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'ar' ? 'تسديد دين الزبون' : 'Régler la dette du client'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                {customer.name} {customer.phone ? `• ${customer.phone}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={language === 'ar' ? 'إغلاق' : 'Fermer'}
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">

        {/* Cadre récapitulatif Dette Actuelle */}
        <div className="bg-rose-50/80 dark:bg-rose-950/30 border-2 border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
              {language === 'ar' ? 'الدين الحالي المستحق' : 'Dette actuelle à recouvrer'}
            </span>
            <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5" dir="ltr">
              {currentDebt.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
            </div>
          </div>
          {currentDebt > 0 && (
            <button
              type="button"
              onClick={() => handleQuickAmount(currentDebt)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer active:scale-98"
            >
              {language === 'ar' ? 'تسديد الكل' : 'Tout solder'}
            </button>
          )}
        </div>

        {/* Formulaire de versement */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Montant versé */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'مبلغ الدفعة (دج)' : 'Montant du versement (DA)'} <span className="text-rose-500">*</span>
              </label>
              {isOverpaying && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {language === 'ar' ? 'الدفعة أكبر من الدين' : 'Versement supérieur à la dette'}
                </span>
              )}
            </div>

            <div className="relative flex items-center border-2 border-blue-500 rounded-2xl bg-white dark:bg-slate-900 px-4 py-2.5 shadow-xs focus-within:ring-4 focus-within:ring-blue-500/15">
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="any"
                required
                value={amountPaid}
                onChange={(e) => {
                  setAmountPaid(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="0.00"
                className="w-full text-2xl font-black font-mono text-blue-600 dark:text-blue-400 bg-transparent outline-none"
              />
              <span className="text-xs font-black font-mono px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 ml-2 rtl:ml-0 rtl:mr-2 shrink-0">
                DA
              </span>
            </div>

            {/* Raccourcis montants rapides */}
            <div className="flex items-center gap-1.5 mt-2">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className="flex-1 py-1.5 text-[11px] font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 hover:border-blue-400 text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
                >
                  +{amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Détail d'allocation */}
            {initialDebt > 0 && (
              <div className="mt-3 p-3 rounded-2xl bg-[#FFFBEB] dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-amber-950 dark:text-amber-200 font-bold">
                  <span>{language === 'ar' ? 'الدين الافتتاحي (السابق) :' : 'Dette Initiale (Antérieure) :'}</span>
                  <span className="font-mono" dir="ltr">{initialDebt.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA</span>
                </div>
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-[11px] font-medium">
                  <span>{language === 'ar' ? 'الدين الافتتاحي المتبقي قبل هذه الدفعة :' : 'Dette initiale restante avant ce versement :'}</span>
                  <span className="font-mono font-bold" dir="ltr">{remainingInitialDebtPrior.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA</span>
                </div>

                {numAmount > 0 && (
                  <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/50 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span>{language === 'ar' ? '1. يُخصم أولاً من الدين الافتتاحي :' : '1. Déduit en priorité sur la dette initiale :'}</span>
                      <span className="font-mono font-bold" dir="ltr">
                        -{paidToInitialDebt.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
                      </span>
                    </div>

                    {paidToOtherDebt > 0 && (
                      <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 font-semibold">
                        <span>{language === 'ar' ? '2. يُخصم من مبيعات الآجل المتبقية :' : '2. Déduit sur les ventes / crédits restants :'}</span>
                        <span className="font-mono font-bold" dir="ltr">
                          -{paidToOtherDebt.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-100 pt-1 border-t border-amber-200/60 dark:border-amber-900/30">
                      <span>{language === 'ar' ? 'الدين الافتتاحي المتبقي بعد هذه الدفعة :' : 'Dette initiale restante après ce versement :'}</span>
                      <span className="font-mono" dir="ltr">
                        {newRemainingInitialDebt <= 0 
                          ? (language === 'ar' ? '0.00 دج (مُسدد بالكامل ✓)' : '0,00 DA (Entièrement Soldée ✓)') 
                          : `${newRemainingInitialDebt.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date & Note du versement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'ar' ? 'تاريخ الدفعة' : 'Date du versement'}</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'ملاحظة' : 'Observation / Note'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'ar' ? 'تسديد حساب زبون...' : 'Règlement compte client...'}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Mode de règlement */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'ar' ? 'طريقة الدفع' : 'Mode de paiement'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'especes', label: language === 'ar' ? 'نقداً' : 'Espèces', icon: Banknote },
                { id: 'cib', label: language === 'ar' ? 'بطاقة CIB' : 'CIB / Dahabia', icon: CreditCard },
                { id: 'virement', label: language === 'ar' ? 'تحويل / شيك' : 'Virement / Chèque', icon: Building2 }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reste à devoir en temps réel */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              {language === 'ar' ? 'باقي الدين بعد التسديد :' : 'Reste de la dette après règlement :'}
            </span>
            <span className={`font-black font-mono text-sm ${
              remainingDebt === 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`} dir="ltr">
              {remainingDebt.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
              {remainingDebt === 0 && (language === 'ar' ? ' (تم السداد ✓)' : ' (Soldé ✓)')}
            </span>
          </div>

          {/* Option Ticket de reçu */}
          <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
            <input
              type="checkbox"
              checked={printReceipt}
              onChange={(e) => setPrintReceipt(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              {language === 'ar' ? 'طباعة وصل استلام حراري' : 'Imprimer un reçu de règlement thermique'}
            </span>
          </label>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-bold text-center">
              {errorMessage}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-5 rounded-2xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{language === 'ar' ? `تأكيد الدفعة (${numAmount.toLocaleString()} دج)` : `Valider le versement (${numAmount.toLocaleString()} DA)`}</span>
            </button>
          </div>

        </form>
        </div>
      </div>
    </div>
  );
}
