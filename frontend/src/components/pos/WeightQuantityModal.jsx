import React, { useState, useEffect, useRef } from 'react';
import { Scale, X, ChevronUp, ChevronDown, Check, Activity, RotateCcw, Play } from 'lucide-react';
import { readScaleWeight, sendScaleZero, sendScaleTare } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function WeightQuantityModal({
  isOpen,
  product,
  systemSettings,
  onClose,
  onConfirm
}) {
  const { language, isRTL } = useLanguage();
  // Underlying weight in kilograms (number)
  const [weightKg, setWeightKg] = useState(1);
  // Input display text (sans aucune virgule: ex. en grammes "444" ou "1" ou "1.5")
  const [weightInputStr, setWeightInputStr] = useState('1');
  // Current active unit: 'g' when < 1kg, 'kg' when >= 1kg
  const [activeUnit, setActiveUnit] = useState('kg');
  // Total price in DA (string for input editing)
  const [totalPriceStr, setTotalPriceStr] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Live USB Scale states
  const [isScaleReading, setIsScaleReading] = useState(false);
  const [liveScaleWeight, setLiveScaleWeight] = useState(null);
  const [scaleStableFrames, setScaleStableFrames] = useState(0);
  const [scaleRawData, setScaleRawData] = useState('');

  const weightInputRef = useRef(null);
  const lastWeightRef = useRef(null);
  const stableCountRef = useRef(0);
  const autoConfirmedRef = useRef(false);

  // Helper: Format weight for display SANS VIRGULE
  // < 1 kg -> grammes entiers sans virgule (ex: 444, 250, 500, 750)
  // >= 1 kg -> kg sans virgule (ex: 1, 2 ou avec point 1.5 si décimal)
  const formatWeightValue = (kgVal, forcedUnit = null) => {
    const unit = forcedUnit || (kgVal < 1 ? 'g' : 'kg');
    if (unit === 'g') {
      const grams = Math.round(kgVal * 1000);
      return { valStr: grams.toString(), unit: 'g' };
    } else {
      // Kilogrammes SANS virgule : arrondi propre (1 pour 1.0, 1.5 si décimal)
      const cleanVal = parseFloat((Math.round(kgVal * 1000) / 1000).toFixed(3));
      return { valStr: cleanVal.toString(), unit: 'kg' };
    }
  };

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen && product) {
      const price = parseFloat(product.price) || 0;
      setUnitPrice(price);

      // Default: 1 kg (affiché "1" sans virgule ni zéros inutiles)
      const defaultKg = 1;
      setWeightKg(defaultKg);
      setActiveUnit('kg');
      setWeightInputStr('1');
      setTotalPriceStr(price.toFixed(2));

      setTimeout(() => {
        if (weightInputRef.current) {
          weightInputRef.current.focus();
          weightInputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, product]);

  // USB/COM Scale real-time polling effect
  useEffect(() => {
    if (!isOpen || !product || !systemSettings?.usbScaleActive) return;

    autoConfirmedRef.current = false;
    stableCountRef.current = 0;
    lastWeightRef.current = null;
    setIsScaleReading(true);

    const intervalMs = Math.max(250, Number(systemSettings?.usbScaleIntervalMs) || 400);
    const minWeight = Number(systemSettings?.usbScaleMinWeight) || 0.005;
    const requiredFrames = Number(systemSettings?.usbScaleStabilityFrames) || 3;
    const autoConfirm = Boolean(systemSettings?.usbScaleAutoConfirm);

    let isMounted = true;

    const pollScale = async () => {
      try {
        const res = await readScaleWeight({
          port: systemSettings.usbScalePort || 'COM3',
          baudRate: systemSettings.usbScaleBaudRate || 9600,
          dataBits: systemSettings.usbScaleDataBits || 8,
          parity: systemSettings.usbScaleParity || 'None',
          stopBits: systemSettings.usbScaleStopBits || 1,
          protocol: systemSettings.usbScaleProtocol || 'auto',
          pollCommandHex: systemSettings.usbScalePollCommandHex || '05',
          divider: systemSettings.usbScaleDivider || 1,
          unit: systemSettings.usbScaleUnit || 'kg'
        });

        if (!isMounted) return;

        if (res.success && typeof res.weight === 'number') {
          const w = res.weight;
          setLiveScaleWeight(w);
          setScaleRawData(res.raw || '');

          if (w >= minWeight) {
            // Check stability
            if (lastWeightRef.current !== null && Math.abs(lastWeightRef.current - w) <= 0.002) {
              stableCountRef.current += 1;
            } else {
              stableCountRef.current = 1;
            }
            lastWeightRef.current = w;
            setScaleStableFrames(stableCountRef.current);

            // Update modal state with scale reading
            setWeightKg(w);
            const { valStr, unit } = formatWeightValue(w);
            setActiveUnit(unit);
            setWeightInputStr(valStr);
            setTotalPriceStr((w * unitPrice).toFixed(2));

            // Auto-confirm if required frames met and hasn't already auto-confirmed
            if (autoConfirm && stableCountRef.current >= requiredFrames && !autoConfirmedRef.current) {
              autoConfirmedRef.current = true;
              setTimeout(() => {
                if (isMounted) {
                  onConfirm(product, w);
                }
              }, 200);
            }
          }
        }
      } catch (err) {
        console.warn('Erreur lecture balance USB:', err);
      }
    };

    pollScale();
    const timer = setInterval(pollScale, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(timer);
      setIsScaleReading(false);
    };
  }, [isOpen, product, systemSettings, unitPrice]);

  const handleScaleZero = async () => {
    try {
      await sendScaleZero({
        port: systemSettings?.usbScalePort || 'COM3',
        baudRate: systemSettings?.usbScaleBaudRate || 9600,
        zeroCommandHex: systemSettings?.usbScaleZeroCommandHex || '5A, 0D'
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleScaleTare = async () => {
    try {
      await sendScaleTare({
        port: systemSettings?.usbScalePort || 'COM3',
        baudRate: systemSettings?.usbScaleBaudRate || 9600,
        tareCommandHex: systemSettings?.usbScaleTareCommandHex || '54, 0D'
      });
    } catch (e) {
      console.warn(e);
    }
  };

  if (!isOpen || !product) return null;

  // ══ 1. Handle Total Price Change -> Synchronizes Weight SANS VIRGULE ══
  // Si montant < prix du kg (< 1 kg) -> s'affiche en grammes ronds sans virgule (ex: 200 DA -> 444 g)
  // Si montant >= prix du kg (>= 1 kg) -> s'affiche en kg (ex: 1 ou 1.5, JAMAIS avec virgule ",")
  const handlePriceChange = (newPriceStr) => {
    setTotalPriceStr(newPriceStr);
    const p = parseFloat(newPriceStr);

    if (!isNaN(p) && p >= 0 && unitPrice > 0) {
      const calculatedKg = p / unitPrice;
      setWeightKg(calculatedKg);

      if (calculatedKg < 1) {
        // En grammes ronds : strictement aucune virgule (ex: 444)
        const grams = Math.round(calculatedKg * 1000);
        setActiveUnit('g');
        setWeightInputStr(grams.toString());
      } else {
        // En kg sans virgule (ex: 1 ou 1.111 avec point, jamais de ",")
        const cleanKg = parseFloat(calculatedKg.toFixed(3));
        setActiveUnit('kg');
        setWeightInputStr(cleanKg.toString());
      }
    } else {
      setWeightKg(0);
      setWeightInputStr('0');
    }
  };

  // ══ 2. Handle Weight Input Change (Direct Typing SANS VIRGULE) ══
  const handleWeightInputChange = (rawStr) => {
    // Si l'utilisateur tape une virgule, on la remplace par un point
    const cleaned = rawStr.replace(',', '.');
    setWeightInputStr(cleaned);
    const parsed = parseFloat(cleaned);

    if (!isNaN(parsed) && parsed >= 0) {
      let newKg = 0;
      if (activeUnit === 'g') {
        newKg = parsed / 1000;
        // Si la saisie en grammes atteint >= 1000 g, basculer proprement en kg
        if (parsed >= 1000) {
          setActiveUnit('kg');
          newKg = parsed / 1000;
        }
      } else {
        newKg = parsed;
      }

      setWeightKg(newKg);
      setTotalPriceStr((newKg * unitPrice).toFixed(2));
    } else {
      setWeightKg(0);
      setTotalPriceStr('0.00');
    }
  };

  // On blur of weight input: clean and format nicely
  const handleWeightInputBlur = () => {
    if (weightKg > 0) {
      const { valStr, unit } = formatWeightValue(weightKg);
      setActiveUnit(unit);
      setWeightInputStr(valStr);
      setTotalPriceStr((weightKg * unitPrice).toFixed(2));
    }
  };

  // ══ 3. Presets (250g, 500g, 750g, 1 kg, 1.5 kg, 2 kg) ══
  const applyPresetWeight = (kgVal) => {
    setWeightKg(kgVal);
    const { valStr, unit } = formatWeightValue(kgVal);
    setActiveUnit(unit);
    setWeightInputStr(valStr);
    setTotalPriceStr((kgVal * unitPrice).toFixed(2));
  };

  // ══ 4. Steppers (▲ / ▼) ══
  const stepWeight = (direction) => {
    let nextKg = weightKg;

    if (activeUnit === 'g') {
      // Step by 50g in gram mode (sans virgule)
      const currentGrams = Math.round(weightKg * 1000);
      const nextGrams = Math.max(10, currentGrams + (direction > 0 ? 50 : -50));
      nextKg = nextGrams / 1000;
    } else {
      // Step by 100g (0.1 kg) in kg mode
      nextKg = Math.max(0.1, Math.round((weightKg + (direction > 0 ? 0.1 : -0.1)) * 1000) / 1000);
    }

    setWeightKg(nextKg);
    const { valStr, unit } = formatWeightValue(nextKg);
    setActiveUnit(unit);
    setWeightInputStr(valStr);
    setTotalPriceStr((nextKg * unitPrice).toFixed(2));
  };

  // ══ 5. Manual Unit Toggle (Clicking on the unit badge) ══
  const toggleUnit = () => {
    const targetUnit = activeUnit === 'g' ? 'kg' : 'g';
    setActiveUnit(targetUnit);
    if (targetUnit === 'g') {
      setWeightInputStr(Math.round(weightKg * 1000).toString());
    } else {
      const cleanKg = parseFloat(weightKg.toFixed(3));
      setWeightInputStr(cleanKg.toString());
    }
  };

  // ══ 6. Submit ══
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (weightKg <= 0) {
      setErrorMessage(language === 'ar' ? 'يرجى إدخال وزن صحيح أكبر من الصفر.' : 'Veuillez saisir un poids valide supérieur à zéro.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    setErrorMessage('');

    const calculatedTotal = parseFloat(totalPriceStr) || weightKg * unitPrice;

    onConfirm && onConfirm({
      product,
      weight: weightKg,
      displayUnit: activeUnit,
      displayWeight: weightInputStr,
      totalPrice: calculatedTotal
    });

    onClose && onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose && onClose();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn select-none"
    >
      <div
        className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-[390px] p-6 animate-scaleIn relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══ HEADER ══ */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className={isRTL ? "text-left" : "text-right"}>
            <h2 className={`text-sm font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5 ${isRTL ? 'justify-start' : 'justify-end'}`}>
              <span>{language === 'ar' ? 'الكمية - يباع بالوزن' : 'Quantité - Vendu au poids'}</span>
              <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </h2>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {product.name} • <span className="text-indigo-600 dark:text-indigo-400 font-mono">{unitPrice.toFixed(2)} DA/{language === 'ar' ? 'كغ' : 'kg'}</span>
            </p>
          </div>
        </div>

        {/* ══ FORM BODY ══ */}
        <form onSubmit={handleSubmit} className="pt-4 space-y-4">

          {/* Bannière Détection Directe Balance USB */}
          {systemSettings?.usbScaleActive && (
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <span>{language === 'ar' ? 'ميزان USB' : 'Balance USB'} ({systemSettings.usbScalePort || 'COM3'})</span>
                    {scaleStableFrames >= (Number(systemSettings.usbScaleStabilityFrames) || 3) && (
                      <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] rounded font-mono font-bold leading-none">
                        {language === 'ar' ? 'مستقر' : 'STABLE'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    {liveScaleWeight !== null ? `${liveScaleWeight.toFixed(3)} ${language === 'ar' ? 'كغ' : 'kg'}` : (language === 'ar' ? 'بانتظار الوزن...' : 'En attente du poids...')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleScaleTare}
                  className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title={language === 'ar' ? 'معايرة الميزان' : 'Effectuer la tare sur la balance'}
                >
                  {language === 'ar' ? 'معايرة' : 'Tare'}
                </button>
                <button
                  type="button"
                  onClick={handleScaleZero}
                  className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title={language === 'ar' ? 'تصفير الميزان' : 'Remettre la balance à zéro'}
                >
                  {language === 'ar' ? 'تصفير' : 'Zéro'}
                </button>
              </div>
            </div>
          )}
          
          {/* 1. Quantité (Poids) - Sans virgule */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              {/* Unit Badge (Interactive) */}
              <button
                type="button"
                onClick={toggleUnit}
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  activeUnit === 'g'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                }`}
                title={language === 'ar' ? 'التبديل بين الغرام والكيلوغرام' : 'Cliquer pour basculer manuellement entre Grammes (g) et Kilogrammes (kg)'}
              >
                <span>
                  {language === 'ar' 
                    ? (activeUnit === 'g' ? 'الوحدة : غرام (غ)' : 'الوحدة : كيلوغرام (كغ)') 
                    : `UNITÉ : ${activeUnit === 'g' ? 'GRAMMES (g)' : 'KILOGRAMMES (kg)'}`}
                </span>
                <span className="text-[8px] opacity-60">⇄</span>
              </button>

              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {language === 'ar' ? 'الكمية (الوزن)' : 'Quantité (Poids)'}
              </label>
            </div>

            {/* Blue input container */}
            <div className="relative flex items-center border-2 border-blue-500 rounded-2xl bg-white dark:bg-slate-900 shadow-xs focus-within:ring-4 focus-within:ring-blue-500/20 overflow-hidden">
              
              {/* Steppers Up/Down on left */}
              <div className="flex flex-col items-center justify-center pl-2.5 pr-1">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => stepWeight(1)}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={activeUnit === 'g' ? "+50 g" : "+100 g"}
                >
                  <ChevronUp className="w-4 h-4 stroke-[3]" />
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => stepWeight(-1)}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={activeUnit === 'g' ? "-50 g" : "-100 g"}
                >
                  <ChevronDown className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              {/* Weight Value Input (Strictement sans virgule ",") */}
              <input
                ref={weightInputRef}
                type="text"
                inputMode="decimal"
                value={weightInputStr}
                onChange={(e) => handleWeightInputChange(e.target.value)}
                onBlur={handleWeightInputBlur}
                className="w-full text-center text-3xl font-black font-mono text-blue-600 dark:text-blue-400 py-3 pr-10 pl-2 bg-transparent outline-none tracking-wide"
                placeholder={activeUnit === 'g' ? "500" : "1"}
              />

              {/* Dynamic Unit Suffix inside input (g or kg) */}
              <span className="absolute right-3.5 rtl:right-auto rtl:left-3.5 text-xs font-black font-mono text-slate-400 pointer-events-none select-none uppercase">
                {language === 'ar' ? (activeUnit === 'g' ? 'غ' : 'كغ') : activeUnit}
              </span>
            </div>

            {/* Quick Weight Presets (250g, 500g, 750g, 1 kg, 1.5 kg, 2 kg) */}
            <div className="flex items-center justify-between gap-1 mt-2">
              {[
                { label: language === 'ar' ? '250غ' : '250g', val: 0.25 },
                { label: language === 'ar' ? '500غ' : '500g', val: 0.5 },
                { label: language === 'ar' ? '750غ' : '750g', val: 0.75 },
                { label: language === 'ar' ? '1 كغ' : '1 kg', val: 1.0 },
                { label: language === 'ar' ? '1.5 كغ' : '1.5 kg', val: 1.5 },
                { label: language === 'ar' ? '2 كغ' : '2 kg', val: 2.0 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPresetWeight(preset.val)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                    Math.abs(weightKg - preset.val) < 0.001
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 hover:border-blue-400 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Prix Total - Green amount box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-slate-400">
                {unitPrice.toFixed(2)} DA/{language === 'ar' ? 'كغ' : 'kg'}
              </span>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {language === 'ar' ? 'السعر الإجمالي' : 'Prix Total'}
              </label>
            </div>

            <div className="relative flex items-center border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-2.5 focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
              {/* Currency Badge on Left */}
              <div className="text-xs font-extrabold font-mono text-slate-400 dark:text-slate-500 px-2 pointer-events-none select-none">
                DA
              </div>

              {/* Total Price Input */}
              <input
                type="number"
                step="any"
                min="0"
                value={totalPriceStr}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full text-center text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 bg-transparent outline-none tracking-tight pr-6"
                placeholder="0.00"
              />
            </div>

            {/* Quick Price Presets */}
            <div className="flex items-center justify-between gap-1 mt-2">
              {[50, 100, 200, 500, 1000].map((presetPrice) => (
                <button
                  key={presetPrice}
                  type="button"
                  onClick={() => handlePriceChange(presetPrice.toString())}
                  className="flex-1 py-1 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 hover:border-emerald-400 text-slate-600 dark:text-slate-300 transition-all cursor-pointer text-center"
                >
                  {presetPrice} DA
                </button>
              ))}
            </div>
          </div>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold text-center animate-shake">
              {errorMessage}
            </div>
          )}

          {/* ══ BUTTONS ══ */}
          <div className="flex items-center gap-3 pt-2">
            {/* Confirmer (Blue solid) */}
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{language === 'ar' ? 'تأكيد' : 'Confirmer'}</span>
            </button>

            {/* Annuler (Slate soft) */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-center"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
