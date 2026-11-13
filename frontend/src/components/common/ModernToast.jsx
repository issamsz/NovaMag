import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ModernToast({
  message,
  type = 'success', // 'success' | 'warning' | 'info' | 'error'
  onClose,
  duration = 3500
}) {
  const { language, isRTL } = useLanguage();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success' || !type;
  const isWarning = type === 'warning';
  const isError = type === 'error';
  const isInfo = type === 'info';

  return (
    <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-[9999] animate-slideInRight max-w-sm select-none`}>
      <div
        className={`flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/60 overflow-hidden ${
          isInfo ? (isRTL ? 'border-r-[5px] border-r-blue-600' : 'border-l-[5px] border-l-blue-600') : ''
        }`}
      >
        {/* Status Icon */}
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
            isSuccess
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60'
              : isWarning
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60'
              : isError
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60'
              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          ) : isWarning ? (
            <AlertCircle className="w-5 h-5 stroke-[2.5]" />
          ) : isError ? (
            <AlertCircle className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <Info className="w-5 h-5 stroke-[2.5]" />
          )}
        </div>

        {/* Message */}
        <div className={`flex-1 ${isRTL ? 'pl-1' : 'pr-1'}`}>
          <p className="text-xs sm:text-[13px] font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
