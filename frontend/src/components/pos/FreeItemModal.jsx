import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function FreeItemModal({
  isOpen,
  onClose,
  onAdd
}) {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSalePrice('');
      setBuyPrice('');
      setErrorMsg('');
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    const finalPrice = parseFloat(salePrice);
    if (isNaN(finalPrice) || finalPrice <= 0) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال سعر بيع صحيح أكبر من 0.' : 'Veuillez saisir un prix de vente valide supérieur à 0.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const finalBuyPrice = buyPrice ? parseFloat(buyPrice) : 0;
    const finalName = name.trim() || (language === 'ar' ? 'منتج حر (متنوع)' : 'Article Libre (Divers)');

    onAdd && onAdd({
      name: finalName,
      price: finalPrice,
      buyPrice: isNaN(finalBuyPrice) ? 0 : finalBuyPrice
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
        className="bg-white dark:bg-[#0E1A30] border border-slate-100 dark:border-[#1E2E4E] rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden animate-scaleIn relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══ ORANGE HEADER ══ */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between text-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white stroke-[2.3]" />
              <Plus className="w-2.5 h-2.5 text-white absolute -top-1 -right-1 stroke-[3]" />
            </div>
            <h2 className="text-base font-black tracking-tight text-white">
              {language === 'ar' ? 'إضافة منتج حر' : 'Ajouter un produit libre'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* ══ FORM BODY ══ */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Nom du produit */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              {language === 'ar' ? 'اسم المنتج' : 'Nom du produit'}
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: خدمة توصيل، صيانة، متنوعات...' : 'Ex: Service de livraison, réparation...'}
              className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 py-3 px-3.5 rounded-2xl border-2 border-amber-500/90 focus:border-orange-500 bg-white dark:bg-[#13223F] outline-none transition-all shadow-2xs placeholder:text-slate-400 focus:ring-4 focus:ring-orange-500/15"
            />
          </div>

          {/* 2. Prix de vente (DA) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              {language === 'ar' ? 'سعر البيع (د.ج)' : 'Prix de vente (DA)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0.00"
                className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 py-3 pl-3.5 pr-10 rtl:pl-10 rtl:pr-3.5 rounded-2xl border border-slate-200 dark:border-[#233860] focus:border-orange-500 bg-white dark:bg-[#13223F] outline-none transition-all shadow-2xs placeholder:text-slate-400 focus:ring-4 focus:ring-orange-500/15 font-mono"
              />
              <span className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                DA
              </span>
            </div>
          </div>

          {/* 3. Prix d’achat (optionnel) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              {language === 'ar' ? 'سعر الشراء (اختياري)' : 'Prix d’achat (optionnel)'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
                className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 py-3 pl-3.5 pr-10 rtl:pl-10 rtl:pr-3.5 rounded-2xl border border-slate-200 dark:border-[#233860] focus:border-orange-500 bg-white dark:bg-[#13223F] outline-none transition-all shadow-2xs placeholder:text-slate-400 focus:ring-4 focus:ring-orange-500/15 font-mono"
              />
              <span className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                DA
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* ══ SUBMIT BUTTON ══ */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl font-black text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <div className="relative flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white stroke-[2.3]" />
                <Plus className="w-2 h-2 text-white absolute -top-0.5 -right-0.5 stroke-[3]" />
              </div>
              <span>{language === 'ar' ? 'إضافة إلى السلة' : 'Ajouter au panier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
