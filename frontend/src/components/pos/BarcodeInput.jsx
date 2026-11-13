import React, { useState, useEffect, useRef } from 'react';
import { Scan, CornerDownLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function BarcodeInput({ onScan, errorMsg, successMsg, autoFocusRef }) {
  const { language } = useLanguage();
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (autoFocusRef) {
      autoFocusRef.current = inputRef.current;
    }
  }, [autoFocusRef]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const barcode = value.trim();
    if (barcode) {
      onScan(barcode);
      setValue('');
    }
  };

  return (
    <div className="bg-white dark:bg-[#111C35] rounded-2xl p-3.5 shadow-2xs border border-slate-200 dark:border-slate-800 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Scan className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span>{language === 'ar' ? 'مسح الباركود (القارئ أو الإدخال اليدوي)' : 'Scanner Code-barres (Douchette ou saisie)'}</span>
        </label>
        <span className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
          {language === 'ar' ? 'جاهز للمسح' : 'Prêt (Zero Mouse)'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 rtl:left-auto rtl:right-3.5 text-indigo-600 pointer-events-none">
            <Scan className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            data-barcode-input="true"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={language === 'ar' ? 'امسح الباركود أو اكتب الرمز...' : 'Scanner le code-barres ou taper le code...'}
            className="w-full pr-24 pl-11 rtl:pr-11 rtl:pl-24 py-2.5 text-base font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-hidden transition-all shadow-inner placeholder:text-slate-400 placeholder:text-xs placeholder:font-sans"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            className="absolute right-2 rtl:right-auto rtl:left-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <span>{language === 'ar' ? 'تأكيد' : 'Valider'}</span>
            <CornerDownLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      </form>

      {/* Dynamic Status / Feedback Notifications */}
      {errorMsg && (
        <div className="mt-2 py-1.5 px-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-bold animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="truncate">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-2 py-1.5 px-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5 text-emerald-700 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span className="truncate">{successMsg}</span>
        </div>
      )}
    </div>
  );
}
