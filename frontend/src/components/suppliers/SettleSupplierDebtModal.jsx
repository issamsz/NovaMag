import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  X, 
  Coins, 
  Building2, 
  CreditCard, 
  FileText, 
  Check, 
  AlertCircle,
  Calendar
} from 'lucide-react';

export default function SettleSupplierDebtModal({
  isOpen,
  supplier,
  onClose,
  onSettled
}) {
  const { language, isRTL } = useLanguage();
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'check' | 'bank_transfer'
  const [notes, setNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [error, setError] = useState('');

  const currentDebt = supplier ? Number(supplier.debt || 0) : 0;
  const initialDebt = supplier ? Number(supplier.initialDebt || 0) : 0;

  // Calcul des règlements antérieurs pour connaître le solde restant de la dette initiale
  const previousPayments = useMemo(() => {
    if (!supplier) return [];
    try {
      const saved = localStorage.getItem('novamag_supplier_payments');
      const all = saved ? JSON.parse(saved) : [];
      return all.filter((p) => String(p.supplierId) === String(supplier.id) || p.supplierName === supplier.name);
    } catch {
      return [];
    }
  }, [supplier, isOpen]);

  const totalPaidPrior = previousPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingInitialDebtPrior = Math.max(0, initialDebt - totalPaidPrior);

  useEffect(() => {
    if (isOpen) {
      setAmount(currentDebt > 0 ? String(currentDebt) : '');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('cash');
      setNotes('Règlement facture fournisseur');
      setReceiptNumber(`VR-${Date.now().toString().slice(-6)}`);
      setError('');
    }
  }, [isOpen, currentDebt]);

  if (!isOpen || !supplier) return null;

  const numAmount = parseFloat(amount) || 0;
  const remainingDebt = Math.max(0, currentDebt - numAmount);

  // ══ RÈGLE MÉTIER : Allocation prioritaire sur la dette initiale, puis sur les dettes d'achats ══
  const paidToInitialDebt = Math.min(remainingInitialDebtPrior, numAmount);
  const newRemainingInitialDebt = Math.max(0, remainingInitialDebtPrior - paidToInitialDebt);
  const paidToOtherDebt = Math.max(0, numAmount - paidToInitialDebt);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Veuillez saisir un montant de règlement valide supérieur à 0');
      return;
    }

    const dateParts = paymentDate.split('-');
    const formattedDateStr = dateParts.length === 3 
      ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` 
      : new Date().toLocaleDateString('fr-FR');
    const paymentTimestamp = paymentDate 
      ? new Date(paymentDate + 'T12:00:00').toISOString() 
      : new Date().toISOString();

    const paymentRecord = {
      id: Date.now(),
      supplierId: supplier.id,
      supplierName: supplier.name || supplier.company,
      amount: numAmount,
      paidToInitialDebt,
      paidToOtherDebt,
      remainingInitialDebt: newRemainingInitialDebt,
      previousDebt: currentDebt,
      remainingDebt: remainingDebt,
      method: paymentMethod === 'check' ? 'Chèque' : paymentMethod === 'bank_transfer' ? 'Virement Bancaire' : 'Espèces',
      notes: notes.trim(),
      receiptNumber: receiptNumber.trim() || `VR-${Date.now().toString().slice(-6)}`,
      dateStr: formattedDateStr,
      timestamp: paymentTimestamp,
      paymentDate: paymentDate
    };

    const updatedSupplier = {
      ...supplier,
      debt: remainingDebt,
      remainingInitialDebt: newRemainingInitialDebt
    };

    onSettled(updatedSupplier, paymentRecord);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn select-none overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* En-tête compact */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-[#111C35]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
              <Coins className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white tracking-tight">
                {language === 'ar' ? 'تسديد دين المورد' : 'Régler Dette Fournisseur'}
              </h2>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'ar' ? 'تسجيل دفعة نقدية لتسديد مستحقات المورد.' : "Enregistrement d'un versement pour régler les créances du fournisseur."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Corps avec défilement fluide et hauteur maîtrisée */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3 scrollbar-thin">
          
          {error && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Fiche récapitulative fournisseur */}
          <div className="p-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                {supplier.name?.charAt(0)?.toUpperCase() || 'F'}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{supplier.name}</h4>
                <p className="text-[10px] text-slate-500 truncate">{supplier.phone || supplier.address || 'Fournisseur'}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Dette Actuelle</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-rose-600 dark:text-rose-400">
                {currentDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
              </span>
            </div>
          </div>

          {/* Montant versé */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Montant à régler / verser au fournisseur</span>
              {currentDebt > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(currentDebt))}
                  className="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Régler la totalité ({currentDebt.toLocaleString()} DA)
                </button>
              )}
            </label>
            <div className="relative">
              <Coins className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-base font-mono font-bold pl-10 pr-12 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-slate-400">
                DA
              </span>
            </div>

            {/* ══ DÉTAIL D'ALLOCATION SELON LA RÈGLE : COMMENCE PAR DETTE INITIALE JUSQU'À 0 PUIS ACHATS ══ */}
            {initialDebt > 0 && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#FFFBEB] dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50 text-xs space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-amber-950 dark:text-amber-200 font-bold">
                  <span>Dette Initiale (Antérieure) :</span>
                  <span className="font-mono">{initialDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span>
                </div>
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-[10.5px] font-medium">
                  <span>Dette initiale restante avant ce versement :</span>
                  <span className="font-mono font-bold">{remainingInitialDebtPrior.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</span>
                </div>

                {numAmount > 0 && (
                  <div className="pt-1.5 border-t border-amber-200/80 dark:border-amber-900/50 space-y-1 text-[10.5px]">
                    <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span>1. Déduit en priorité sur la dette initiale :</span>
                      <span className="font-mono font-bold">
                        -{paidToInitialDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                      </span>
                    </div>

                    {paidToOtherDebt > 0 && (
                      <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 font-semibold">
                        <span>2. Déduit sur les dettes d'achats / factures :</span>
                        <span className="font-mono font-bold">
                          -{paidToOtherDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-100 pt-0.5 border-t border-amber-200/60 dark:border-amber-900/30">
                      <span>Dette initiale restante après ce versement :</span>
                      <span className="font-mono">
                        {newRemainingInitialDebt <= 0 
                          ? '0,00 DA (Entièrement Soldée ✓)' 
                          : `${newRemainingInitialDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mode de règlement */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Mode de paiement</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Espèces
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Virement
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('check')}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  paymentMethod === 'check'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Chèque
              </button>
            </div>
          </div>

          {/* Date & N° Reçu */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Date du règlement</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-rose-500 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                N° Reçu / Pièce
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Observation / Note */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Observation / Note</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note facultative..."
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-rose-500"
            />
          </div>

          {/* Récapitulatif restant */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Dette restante après ce règlement :</span>
            <span className={`font-mono font-bold ${remainingDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {remainingDebt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </span>
          </div>

          {/* Boutons d'action toujours visibles et bien calés */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === "ar" ? "إلغاء" : "Annuler"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[2.4]" />
              <span>Valider le Règlement ({numAmount.toLocaleString()} DA)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
