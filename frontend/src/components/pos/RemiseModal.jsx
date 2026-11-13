import React, { useState, useEffect } from 'react';
import { Tag, Percent, DollarSign, X, Check, Trash2, Sparkles } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function RemiseModal({
  isOpen,
  onClose,
  ticketItems = [],
  selectedIndex = 0,
  onApplyDiscount,
  onRemoveDiscount
}) {
  const { language } = useLanguage();
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState('');
  const [target, setTarget] = useState('global'); // 'global' | 'selected'

  // Calcul du sous-total brut standard sans les remises personnalisées
  const rawSubtotal = ticketItems.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0);
  
  // Article sélectionné actuellement
  const selectedItem = ticketItems[selectedIndex] || null;
  const rawSelectedItemTotal = selectedItem ? selectedItem.price * (selectedItem.quantity || 1) : 0;

  // Détection si une remise est déjà active sur le ticket ou l'article
  const hasExistingDiscount = ticketItems.some(it => typeof it.customTotal === 'number' && it.customTotal < (it.price * it.quantity));

  useEffect(() => {
    if (isOpen) {
      setDiscountValue('');
      setDiscountType('percent');
      setTarget('global');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calcul dynamique de l'économie et du nouveau total selon la cible
  const baseAmount = target === 'selected' && selectedItem ? rawSelectedItemTotal : rawSubtotal;
  const numVal = parseFloat(discountValue) || 0;
  
  let calculatedDiscount = 0;
  if (discountType === 'percent') {
    calculatedDiscount = Math.round(baseAmount * (Math.min(100, Math.max(0, numVal)) / 100));
  } else {
    calculatedDiscount = Math.min(baseAmount, Math.max(0, numVal));
  }
  const newAmount = Math.max(0, baseAmount - calculatedDiscount);

  const handleApply = (e) => {
    e?.preventDefault();
    if (numVal <= 0) {
      onClose();
      return;
    }
    if (typeof onApplyDiscount === 'function') {
      onApplyDiscount({
        type: discountType === 'percent' ? 'percentage' : 'fixed',
        value: numVal,
        target: target
      });
    }
    onClose();
  };

  const handleQuickPercent = (pct) => {
    setDiscountType('percent');
    setDiscountValue(String(pct));
  };

  const handleQuickFixed = (amt) => {
    setDiscountType('fixed');
    setDiscountValue(String(amt));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══ En-tête de la Modal ══ */}
        <div className="bg-[#0C2156] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Tag className="w-4 h-4 fill-amber-400 text-[#0C2156]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {language === 'ar' ? 'تطبيق خصم / تخفيض' : 'Appliquer une Remise'}
              </h3>
              <p className="text-[11px] text-blue-200/80">
                {language === 'ar' ? 'خصم مئوي أو مبلغ دينار على السلة' : 'Remise en % ou montant direct en DA'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ══ Corps de la Modal ══ */}
        <div className="p-4 sm:p-5 space-y-4">

          {/* 1. Sélection de la cible (Tout le ticket VS Article spécifique) */}
          {ticketItems.length > 1 && selectedItem && (
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTarget('global')}
                className={`py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  target === 'global'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sur tout le ticket
              </button>
              <button
                type="button"
                onClick={() => setTarget('selected')}
                className={`py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer truncate ${
                  target === 'selected'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={`Article: ${selectedItem.name}`}
              >
                Sur cet article ({selectedItem.name})
              </button>
            </div>
          )}

          {/* 2. Type de remise : Pourcentage vs Montant fixe DA */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDiscountType('percent');
                setDiscountValue('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer ${
                discountType === 'percent'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Pourcentage (%)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDiscountType('fixed');
                setDiscountValue('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer ${
                discountType === 'fixed'
                  ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="font-mono font-black text-sm">DA</span>
              <span>Montant Fixe (DA)</span>
            </button>
          </div>

          {/* 3. Champ de saisie direct de la valeur */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {discountType === 'percent' ? 'Valeur du pourcentage (%) :' : 'Montant de la remise (DA) :'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={discountType === 'percent' ? 100 : baseAmount}
                step={discountType === 'percent' ? '1' : '10'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                autoFocus
                placeholder={discountType === 'percent' ? 'Ex: 10 pour 10%' : 'Ex: 200 pour 200 DA'}
                className="w-full text-lg font-mono font-black text-slate-900 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all placeholder:text-slate-400"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                {discountType === 'percent' ? '%' : 'DA'}
              </span>
            </div>
          </div>

          {/* 4. Raccourcis de remises rapides en 1 clic */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 mb-1.5 block">
              Remises rapides en 1 clic :
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {discountType === 'percent' ? (
                [5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-800 text-xs font-black rounded-lg transition-colors cursor-pointer border border-slate-200/80 active:scale-95"
                  >
                    -{pct}%
                  </button>
                ))
              ) : (
                [50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickFixed(amt)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-800 text-xs font-black rounded-lg transition-colors cursor-pointer border border-slate-200/80 active:scale-95"
                  >
                    -{amt} DA
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 5. Récapitulatif dynamique avec économie */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-semibold">
              <span>Montant initial :</span>
              <span className="font-mono">{baseAmount.toFixed(2)} DA</span>
            </div>
            <div className="flex items-center justify-between text-emerald-700 font-black">
              <span>Remise accordée :</span>
              <span className="font-mono">-{calculatedDiscount.toFixed(2)} DA</span>
            </div>
            <div className="flex items-center justify-between text-slate-900 font-black pt-1 border-t border-slate-200 text-sm">
              <span>Nouveau total :</span>
              <span className="font-mono text-blue-700">{newAmount.toFixed(2)} DA</span>
            </div>
          </div>

        </div>

        {/* ══ Boutons d'Action Inférieurs ══ */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {hasExistingDiscount && (
            <button
              type="button"
              onClick={() => {
                if (typeof onRemoveDiscount === 'function') onRemoveDiscount();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-300 text-xs font-black transition-colors cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Annuler la remise</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={numVal <= 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00C853] hover:bg-[#00B048] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Appliquer</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
