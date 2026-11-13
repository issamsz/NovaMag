import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, X, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  type = "danger", // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel,
  onClose
}) {
  const { language } = useLanguage();

  const resolvedTitle = title || (language === 'ar' ? 'تأكيد' : 'Confirmation');
  const resolvedMessage = message || (language === 'ar' ? 'هل أنت متأكد من رغبتك في المتابعة؟' : 'Êtes-vous sûr de vouloir continuer ?');
  const resolvedConfirmText = confirmText || (language === 'ar' ? 'تأكيد' : 'Confirmer');
  const resolvedCancelText = cancelText || (language === 'ar' ? 'إلغاء' : 'Annuler');
  const handleClose = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  const handleConfirm = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (onConfirm) onConfirm();
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel, onClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn select-none"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-scaleIn flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close icon top-right */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center pt-2">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner ${
              isDanger
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60'
                : isWarning
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60'
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            ) : isWarning ? (
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <HelpCircle className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>

          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            {resolvedTitle}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed px-2">
            {resolvedMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 mt-6 pt-2">
          {/* Cancel button */}
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
          >
            {resolvedCancelText}
          </button>

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{resolvedConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
