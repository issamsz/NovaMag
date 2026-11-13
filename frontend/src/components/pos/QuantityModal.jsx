import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function QuantityModal({
  isOpen,
  item,
  onClose,
  onSave
}) {
  const { language } = useLanguage();
  const qtyInputRef = useRef(null);
  const totalInputRef = useRef(null);

  const [qtyInput, setQtyInput] = useState('1');
  const [totalInput, setTotalInput] = useState('');
  const [isTotalEdited, setIsTotalEdited] = useState(false);
  const [weightUnit, setWeightUnit] = useState('kg');

  const isWeighted = Boolean(item?.isWeighted);
  const catalogUnitPrice = item?.originalPrice || item?.price || 0;

  useEffect(() => {
    if (isOpen && item) {
      setIsTotalEdited(false);
      const currentQty = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 1;
      const initialTotal = typeof item.customTotal === 'number'
        ? item.customTotal
        : Math.round(catalogUnitPrice * currentQty * 100) / 100;

      if (isWeighted) {
        if (currentQty < 1) {
          setWeightUnit('g');
          setQtyInput(Math.round(currentQty * 1000).toString());
        } else {
          setWeightUnit('kg');
          setQtyInput(currentQty.toString());
        }
      } else {
        setWeightUnit('piece');
        setQtyInput(currentQty.toString());
      }

      setTotalInput(initialTotal.toFixed(2));
      if (typeof item.customTotal === 'number') {
        setIsTotalEdited(true);
      }

      setTimeout(() => {
        if (qtyInputRef.current) {
          qtyInputRef.current.focus();
          qtyInputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, item, isWeighted, catalogUnitPrice]);

  if (!isOpen || !item) return null;

  // Calcul de la quantité
  const cleanQtyStr = String(qtyInput || '').replace(',', '.').trim();
  const numQty = parseFloat(cleanQtyStr);
  const hasValidQty = !isNaN(numQty) && numQty > 0;
  const calculatedQty = hasValidQty
    ? isWeighted
      ? weightUnit === 'g' ? Math.round((numQty / 1000) * 1000) / 1000 : Math.round(numQty * 1000) / 1000
      : Math.max(1, Math.round(numQty))
    : 0;

  // Total standard
  const standardTotal = Math.round(catalogUnitPrice * calculatedQty * 100) / 100;

  // Total effectif
  const cleanTotStr = String(totalInput || '').replace(',', '.').trim();
  const numTot = parseFloat(cleanTotStr);
  const effectiveTotal = isTotalEdited && !isNaN(numTot) && numTot >= 0
    ? numTot
    : standardTotal;

  // Mise à jour de la quantité
  const handleQtyChange = (val) => {
    const clean = val.replace(',', '.');
    if (clean === '' || /^[0-9]*\.?[0-9]*$/.test(clean)) {
      setQtyInput(clean);
      if (!isTotalEdited) {
        const pNum = parseFloat(clean);
        if (!isNaN(pNum) && pNum > 0) {
          const cQty = isWeighted ? (weightUnit === 'g' ? pNum / 1000 : pNum) : pNum;
          const autoTot = Math.round(catalogUnitPrice * cQty * 100) / 100;
          setTotalInput(autoTot.toFixed(2));
        } else {
          setTotalInput('0.00');
        }
      }
    }
  };

  // Modification directe du Total par le caissier (ex: 2050 -> 2000)
  const handleTotalChange = (val) => {
    const clean = val.replace(',', '.');
    if (clean === '' || /^[0-9]*\.?[0-9]*$/.test(clean)) {
      setIsTotalEdited(true);
      setTotalInput(clean);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (calculatedQty > 0) {
      const finalUnitPrice = calculatedQty > 0
        ? Math.round((effectiveTotal / calculatedQty) * 100) / 100
        : catalogUnitPrice;

      onSave(calculatedQty, finalUnitPrice, isTotalEdited ? effectiveTotal : undefined);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const unitHeaderLabel = isWeighted
    ? weightUnit === 'g' ? (language === 'ar' ? 'غرام' : 'g') : (language === 'ar' ? 'كغ' : 'Kg')
    : (language === 'ar' ? 'قطعة' : 'Pièce');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0F172A] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-scaleIn flex flex-col space-y-5 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* ══ 1. EN-TÊTE ULTRA-LISIBLE (Nom complet sans coupure) ══ */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={language === 'ar' ? 'إغلاق (Esc)' : 'Fermer (Échap)'}
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="text-right rtl:text-left flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md inline-block mb-1">
              {language === 'ar' ? 'الوحدة :' : 'Unité :'} {unitHeaderLabel}
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug break-words">
              {item.name}
            </h3>
          </div>
        </div>

        {/* ══ 2. FORMULAIRE MINIMALISTE ET AÉRÉ ══ */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          
          {/* CHAMP 1 : QUANTITÉ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              {isWeighted ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (weightUnit !== 'g') {
                        setWeightUnit('g');
                        const cur = parseFloat(qtyInput) || 0;
                        handleQtyChange(Math.round(cur * 1000).toString());
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      weightUnit === 'g'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'ar' ? 'غرام (g)' : 'Grammes (g)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (weightUnit !== 'kg') {
                        setWeightUnit('kg');
                        const cur = parseFloat(qtyInput) || 0;
                        handleQtyChange((cur / 1000).toString());
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      weightUnit === 'kg'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'ar' ? 'كيلوغرام (kg)' : 'Kilos (kg)'}
                  </button>
                </div>
              ) : <div />}

              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {language === 'ar' ? 'الكمية' : 'Quantité'}
              </label>
            </div>

            <div className="relative">
              <input
                ref={qtyInputRef}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={qtyInput}
                onChange={(e) => handleQtyChange(e.target.value)}
                placeholder="1"
                className="w-full text-2xl font-mono font-black text-slate-900 dark:text-white px-4 py-3 bg-white dark:bg-slate-800 border-2 border-blue-500 ring-2 ring-blue-500/20 rounded-2xl outline-none text-right rtl:text-right shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* CHAMP 2 : PRIX TOTAL (DIRECTEMENT MODIFIABLE) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              {isTotalEdited && Math.abs(standardTotal - effectiveTotal) > 0.001 ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsTotalEdited(false);
                    setTotalInput(standardTotal.toFixed(2));
                  }}
                  className="text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {language === 'ar' ? `↺ استعادة (${standardTotal.toFixed(2)} د.ج)` : `↺ Rétablir (${standardTotal.toFixed(2)} DA)`}
                </button>
              ) : <div />}
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'السعر الإجمالي' : 'Prix Total'}
              </label>
            </div>

            <div className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
              <span className="text-xs font-bold font-mono text-slate-400 tracking-wider">
                DZD
              </span>
              <input
                ref={totalInputRef}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={totalInput}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="0.00"
                className="w-full text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 bg-transparent outline-none text-right rtl:text-right"
              />
            </div>

            {/* Badge de remise en vert foncé contrasté (JAMAIS en jaune) */}
            {isTotalEdited && standardTotal > effectiveTotal && (
              <div className="mt-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl flex items-center justify-between text-xs font-black text-emerald-950 dark:text-emerald-100">
                <span>{language === 'ar' ? `★ خصم ممنوح : -${(standardTotal - effectiveTotal).toFixed(2)} د.ج` : `★ Remise accordée : -${(standardTotal - effectiveTotal).toFixed(2)} DA`}</span>
                <span className="text-[11px] font-normal text-emerald-800 dark:text-emerald-300">
                  {language === 'ar' ? `(الأصلي : ${standardTotal.toFixed(2)} د.ج)` : `(Initial : ${standardTotal.toFixed(2)} DA)`}
                </span>
              </div>
            )}
          </div>

          {/* ══ 3. BOUTONS D'ACTION (Identiques au modèle) ══ */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>

            <button
              type="submit"
              disabled={calculatedQty <= 0}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center active:scale-98"
            >
              {language === 'ar' ? 'تأكيد' : 'Confirmer'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
