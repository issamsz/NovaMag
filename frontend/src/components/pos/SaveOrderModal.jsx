import React, { useState, useEffect } from 'react';
import { FileCheck, X, Calendar, DollarSign, CreditCard, Save } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function SaveOrderModal({
  isOpen,
  onClose,
  onSave,
  ticketItems = [],
  customer = null,
  totalAmount = 0,
  initialData = null
}) {
  const { language } = useLanguage();

  const getDefaultDeliveryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  };

  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate());
  const [depositAmount, setDepositAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Espèces (Cash)');
  const [notes, setNotes] = useState('');
  const [reserveStock, setReserveStock] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDeliveryDate(initialData.deliveryDate || initialData.dateLivraisonPrevue || getDefaultDeliveryDate());
        setDepositAmount(Number(initialData.depositPaid ?? initialData.acompte ?? 0));
        setPaymentMethod(initialData.paymentMethod || 'Espèces (Cash)');
        setNotes(initialData.notes || '');
        setReserveStock(initialData.reserveStock ?? true);
      } else {
        setDeliveryDate(getDefaultDeliveryDate());
        setDepositAmount(0);
        setPaymentMethod('Espèces (Cash)');
        setNotes('');
        setReserveStock(true);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const depositNum = Math.max(0, Math.min(totalAmount, Number(depositAmount) || 0));
    onSave({
      deliveryDate,
      depositAmount: depositNum,
      paymentMethod,
      notes,
      reserveStock
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-scaleUp">
        
        {/* En-tête bleu */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20">
              <FileCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h2 className="text-base font-black tracking-tight">
              {language === 'ar' ? 'حفظ كسند طلبية (حجز)' : 'Enregistrer comme bon de commande'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* 1. Date de livraison prévue */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'ar' ? 'تاريخ التسليم المتوقع' : 'Date de livraison prévue'}
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* 2. Acompte (DA) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'ar' ? 'العربون / التسبيق (د.ج)' : 'Acompte (DA)'}
            </label>
            <input
              type="number"
              min="0"
              max={totalAmount || 99999999}
              step="any"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/70 border-2 border-blue-500/80 rounded-xl text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
              placeholder="0"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {language === 'ar' ? 'عند التسليم، يُخصم العربون تلقائياً من الفاتورة النهائية' : 'À la livraison, l’acompte est imputé sur la facture réelle'}
            </p>
          </div>

          {/* 3. Mode de réception de l'acompte */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'ar' ? 'طريقة استلام العربون' : 'Mode de réception de l’acompte'}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="Espèces (Cash)">{language === 'ar' ? 'نقداً (كاش)' : 'Espèces (Cash)'}</option>
              <option value="Carte Bancaire / TPE">{language === 'ar' ? 'بطاقة بنكية / جهاز دفع' : 'Carte Bancaire / TPE'}</option>
              <option value="Chèque">{language === 'ar' ? 'شيك' : 'Chèque'}</option>
              <option value="Virement">{language === 'ar' ? 'تحويل بنكي' : 'Virement'}</option>
            </select>
          </div>

          {/* 4. Notes et conditions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {language === 'ar' ? 'ملاحظات وشروط خاصة' : 'Notes et conditions'}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'ar' ? 'شروط خاصة بالطلبية...' : 'Conditions particulières de la commande...'}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {/* 5. Checkbox Réserver le stock */}
          <div className="pt-1">
            <label className="inline-flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reserveStock}
                onChange={(e) => setReserveStock(e.target.checked)}
                className="w-4.5 h-4.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {language === 'ar' ? 'حجز الكميات في المخزون لهذه الطلبية' : 'Réserver le stock pour cette commande'}
              </span>
            </label>
          </div>

          {/* Boutons d'action en bas */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{language === 'ar' ? 'حفظ الطلبية' : 'Enregistrer la commande'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
