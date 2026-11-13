import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  PackageMinus, 
  Plus, 
  Trash2, 
  Calendar, 
  Check, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AddCustomerReturnModal({
  isOpen,
  customer,
  invoices = [],
  onClose,
  onReturnAdded
}) {
  const { language, isRTL } = useLanguage();
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultReturnNo = `BRC-${Math.floor(100000 + Math.random() * 900000)}`;

  // Produits disponibles dans les ventes de ce client
  const availableItems = (invoices || []).flatMap((inv) => (inv.items || []).map((it) => ({
    name: it.name || it.designation,
    unitPrice: Number(it.price || it.unitPrice || 0),
    invoiceNo: inv.invoiceNumber
  })));

  const [returnNumber, setReturnNumber] = useState(defaultReturnNo);
  const [dateStr, setDateStr] = useState(todayStr);
  const [motif, setMotif] = useState("Changement d'avis / Non souhaité");
  const [compensationType, setCompensationType] = useState(
    (customer?.balance < 0 || customer?.debt > 0) ? 'DEDUCT_DEBT' : 'CASH_REFUND'
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Multi-produits
  const [items, setItems] = useState([
    {
      id: 1,
      name: availableItems[0]?.name || '',
      quantity: 1,
      unitPrice: availableItems[0]?.unitPrice || 0
    }
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        quantity: 1,
        unitPrice: 0
      }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === 'selectProduct') {
          const found = availableItems.find((p) => p.name === value);
          return {
            ...it,
            name: value,
            unitPrice: found ? found.unitPrice : it.unitPrice
          };
        }
        return { ...it, [field]: value };
      })
    );
  };

  const total = items.reduce((sum, it) => {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    return sum + q * p;
  }, 0);

  const currentDebt = Math.abs(customer ? (customer.balance < 0 ? customer.balance : (customer.debt || 0)) : 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name || !it.name.trim()) {
        setError(language === 'ar' ? `يرجى تحديد اسم المادة #${i + 1}.` : `Veuillez renseigner la désignation de l'article #${i + 1}.`);
        return;
      }
      if (Number(it.quantity) <= 0) {
        setError(language === 'ar' ? `يجب أن تكون كمية المادة #${i + 1} أكبر من 0.` : `La quantité de l'article #${i + 1} doit être supérieure à 0.`);
        return;
      }
      if (Number(it.unitPrice) <= 0) {
        setError(language === 'ar' ? `يجب أن يكون سعر المادة #${i + 1} أكبر من 0.` : `Le prix unitaire de l'article #${i + 1} doit être supérieur à 0.`);
        return;
      }
    }

    if (total <= 0) {
      setError(language === 'ar' ? 'يجب أن يكون المبلغ الإجمالي أكبر من 0.' : 'Le montant total doit être supérieur à 0.');
      return;
    }

    const deductFromDebt = compensationType === 'DEDUCT_DEBT' ? total : 0;
    const cashRefund = compensationType === 'CASH_REFUND' ? total : 0;

    const returnRecord = {
      id: Date.now(),
      returnNumber: returnNumber || defaultReturnNo,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      dateStr: dateStr ? `${dateStr.split('-')[2]}/${dateStr.split('-')[1]}/${dateStr.split('-')[0]}` : new Date().toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR'),
      isoDate: dateStr,
      timestamp: new Date().toISOString(),
      motif,
      total,
      deductFromDebt,
      cashRefund,
      compensationType,
      items: items.map((it) => ({
        name: it.name.trim(),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        total: Number(it.quantity) * Number(it.unitPrice)
      })),
      notes: notes.trim()
    };

    try {
      const saved = localStorage.getItem('novamag_customer_returns');
      const all = saved ? JSON.parse(saved) : [];
      localStorage.setItem('novamag_customer_returns', JSON.stringify([returnRecord, ...all]));
    } catch {}

    let updatedCustomer = { ...customer };
    if (deductFromDebt > 0) {
      const newDebt = Math.max(0, currentDebt - deductFromDebt);
      updatedCustomer.debt = newDebt;
      if (updatedCustomer.balance < 0) {
        updatedCustomer.balance = -newDebt;
      }
      try {
        const savedCustomers = localStorage.getItem('novamag_customers');
        if (savedCustomers) {
          const list = JSON.parse(savedCustomers);
          const idx = list.findIndex((c) => c.id === customer.id);
          if (idx !== -1) {
            list[idx].debt = newDebt;
            if (list[idx].balance < 0) list[idx].balance = -newDebt;
            localStorage.setItem('novamag_customers', JSON.stringify(list));
          }
        }
      } catch {}
    }

    if (cashRefund > 0) {
      try {
        const savedCash = localStorage.getItem('novamag_cash_movements');
        const movements = savedCash ? JSON.parse(savedCash) : [];
        movements.unshift({
          id: Date.now(),
          type: 'OUT',
          category: 'RETOUR_CLIENT',
          amount: cashRefund,
          description: language === 'ar' 
            ? `استرداد نقدي لمرتجع ${returnRecord.returnNumber} - زبون ${customer.name}` 
            : `Remboursement espèces retour ${returnRecord.returnNumber} - Client ${customer.name}`,
          timestamp: new Date().toISOString(),
          dateStr: returnRecord.dateStr
        });
        localStorage.setItem('novamag_cash_movements', JSON.stringify(movements));
      } catch {}
    }

    onReturnAdded && onReturnAdded(returnRecord, updatedCustomer);
    onClose();
  };

  if (!isOpen || !customer) return null;

  return (
    <div 
      className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-rose-600/20 shrink-0">
              <PackageMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'سند إرجاع زبون جديد' : 'Nouveau Bon de Retour Client'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ar' ? 'الزبون :' : 'Client :'} <span className="font-bold text-slate-700 dark:text-slate-300">{customer.name}</span>
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

        {/* Formulaire défilant */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* N° et Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {language === 'ar' ? 'رقم سند الإرجاع' : 'N° Bon de Retour'}
              </label>
              <input
                type="text"
                value={returnNumber}
                onChange={(e) => setReturnNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {language === 'ar' ? 'تاريخ الإرجاع' : 'Date du Retour'}
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold outline-none focus:border-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section Multi-produits */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>{language === 'ar' ? `المواد المراد إرجاعها (${items.length})` : `Articles à retourner (${items.length})`}</span>
              </label>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-[11px] font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إضافة مادة أخرى' : 'Ajouter un autre article'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => {
                const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);

                return (
                  <div 
                    key={it.id} 
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {language === 'ar' ? `مادة #${idx + 1}` : `Article #${idx + 1}`}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title={language === 'ar' ? 'حذف هذا السطر' : 'Supprimer cette ligne'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {availableItems.length > 0 && (
                      <select
                        value={it.name}
                        onChange={(e) => handleItemChange(it.id, 'selectProduct', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-rose-500"
                      >
                        <option value="">{language === 'ar' ? '-- اختر من مشتريات هذا الزبون --' : '-- Choisir depuis les achats de ce client --'}</option>
                        {availableItems.map((p, pIdx) => (
                          <option key={pIdx} value={p.name}>
                            {p.name} ({p.unitPrice.toLocaleString()} DA) [{p.invoiceNo}]
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder={language === 'ar' ? 'تعيين المادة...' : "Désignation de l'article..."}
                          value={it.name}
                          onChange={(e) => handleItemChange(it.id, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder={language === 'ar' ? 'الكمية' : 'Qté'}
                          value={it.quantity}
                          onChange={(e) => handleItemChange(it.id, 'quantity', Math.max(1, Number(e.target.value)))}
                          className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-center outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          placeholder={language === 'ar' ? 'سعر الوحدة' : 'P.U (DA)'}
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(it.id, 'unitPrice', Math.max(0, Number(e.target.value)))}
                          className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-right rtl:text-left outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-2 text-right rtl:text-left">
                        <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400" dir="ltr">
                          {lineTotal.toLocaleString()} DA
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Motif du retour */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {language === 'ar' ? 'سبب الإرجاع' : 'Motif du Retour'}
            </label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Changement d'avis / Non souhaité">{language === 'ar' ? 'تراجع عن الشراء / غير مرغوب' : "Changement d'avis / Non souhaité"}</option>
              <option value="Article défectueux / Endommagé">{language === 'ar' ? 'مادة معطوبة / تالفة' : 'Article défectueux / Endommagé'}</option>
              <option value="Erreur de modèle ou de référence">{language === 'ar' ? 'خطأ في النوع أو المرجع' : 'Erreur de modèle ou de référence'}</option>
              <option value="Date de péremption dépassée ou proche">{language === 'ar' ? 'تاريخ الصلاحية منتهي أو قريب' : 'Date de péremption dépassée ou proche'}</option>
              <option value="Autre motif convenu avec le client">{language === 'ar' ? 'سبب آخر متفق عليه مع الزبون' : 'Autre motif convenu avec le client'}</option>
            </select>
          </div>

          {/* Mode de compensation */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              {language === 'ar' ? 'طريقة التعويض / الاسترداد' : 'Mode de Compensation / Remboursement'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                compensationType === 'DEDUCT_DEBT'
                  ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="compensationType"
                    checked={compensationType === 'DEDUCT_DEBT'}
                    onChange={() => setCompensationType('DEDUCT_DEBT')}
                    className="accent-amber-600"
                  />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {language === 'ar' ? 'خصم من دين الزبون' : 'Déduire de la dette client'}
                  </span>
                </div>
                <p className="text-[10px] text-amber-800 dark:text-amber-400 mt-1 pl-5 rtl:pl-0 rtl:pr-5">
                  {language === 'ar' 
                    ? `خصم من رصيد دين الزبون بمقدار ${total.toLocaleString()} دج.` 
                    : `Déduit le crédit du client de ${total.toLocaleString()} DA.`}
                </p>
              </label>

              <label className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                compensationType === 'CASH_REFUND'
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="compensationType"
                    checked={compensationType === 'CASH_REFUND'}
                    onChange={() => setCompensationType('CASH_REFUND')}
                    className="accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {language === 'ar' ? 'استرداد نقدي فوري' : 'Remboursement en espèces'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-400 mt-1 pl-5 rtl:pl-0 rtl:pr-5">
                  {language === 'ar' 
                    ? `إرجاع المبلغ نقداً للزبون من الصندوق (${total.toLocaleString()} دج).` 
                    : `Rembourse le client en liquide depuis la caisse (${total.toLocaleString()} DA).`}
                </p>
              </label>

            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {language === 'ar' ? 'ملاحظة' : 'Observation / Note'}
            </label>
            <input
              type="text"
              placeholder={language === 'ar' ? 'مثال: تغليف سليم، موافقة مسبقة...' : 'Ex: Emballage intact, accord client...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-rose-500"
            />
          </div>

          {/* Total Global */}
          <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                {language === 'ar' ? 'الإجمالي الكلي لسند الإرجاع' : 'Total Global du Bon de Retour'}
              </span>
              <span className="text-[11px] text-rose-600 dark:text-rose-300">
                {items.length} {language === 'ar' ? 'مادة مرجعة' : 'article(s) retourné(s)'}
              </span>
            </div>
            <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400" dir="ltr">
              {total.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[2.4]" />
              <span>{language === 'ar' ? `تأكيد سند الإرجاع (${total.toLocaleString()} دج)` : `Valider le Bon de Retour (${total.toLocaleString()} DA)`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
