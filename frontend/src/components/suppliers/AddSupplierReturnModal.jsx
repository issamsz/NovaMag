import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
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

export default function AddSupplierReturnModal({
  isOpen,
  supplier,
  purchases = [],
  onClose,
  onReturnAdded
}) {
  const { language, isRTL } = useLanguage();
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultReturnNo = `BRF-${Math.floor(100000 + Math.random() * 900000)}`;

  // Produits disponibles dans les achats de ce fournisseur pour sélection rapide
  const availableItems = (purchases || []).flatMap((p) => (p.items || []).map((it) => ({
    name: it.name || it.designation,
    unitPrice: Number(it.unitPrice || it.price || 0),
    invoiceNo: p.invoiceNumber
  })));

  const [returnNumber, setReturnNumber] = useState(defaultReturnNo);
  const [dateStr, setDateStr] = useState(todayStr);
  const [motif, setMotif] = useState('Produit périmé / Date de péremption proche');
  const [compensationType, setCompensationType] = useState('DEDUCT_DEBT'); // 'DEDUCT_DEBT' | 'CASH_REFUND'
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Liste multi-produits à retourner (1 à plusieurs produits !)
  const [items, setItems] = useState([
    {
      id: 1,
      name: availableItems[0]?.name || '',
      quantity: 1,
      unitPrice: availableItems[0]?.unitPrice || 0
    }
  ]);

  // Ajouter une ligne d'article
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

  // Supprimer une ligne d'article
  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Modifier un article
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

  // Calcul du total global
  const total = items.reduce((sum, it) => {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    return sum + q * p;
  }, 0);

  const currentDebt = Number(supplier.debt || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation des articles
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name || !it.name.trim()) {
        setError(`Veuillez renseigner la désignation de l'article #${i + 1}.`);
        return;
      }
      if (Number(it.quantity) <= 0) {
        setError(`La quantité de l'article #${i + 1} ("${it.name}") doit être supérieure à 0.`);
        return;
      }
      if (Number(it.unitPrice) <= 0) {
        setError(`Le prix unitaire de l'article #${i + 1} ("${it.name}") doit être supérieur à 0.`);
        return;
      }
    }

    if (total <= 0) {
      setError('Le montant total du bon de retour doit être supérieur à 0.');
      return;
    }

    const deductFromDebt = compensationType === 'DEDUCT_DEBT' ? total : 0;
    const cashRefund = compensationType === 'CASH_REFUND' ? total : 0;

    const returnRecord = {
      id: Date.now(),
      returnNumber: returnNumber || defaultReturnNo,
      supplierId: supplier.id,
      supplierName: supplier.name,
      dateStr: dateStr ? `${dateStr.split('-')[2]}/${dateStr.split('-')[1]}/${dateStr.split('-')[0]}` : new Date().toLocaleDateString('fr-FR'),
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

    // Sauvegarde dans localStorage
    try {
      const saved = localStorage.getItem('novamag_supplier_returns');
      const all = saved ? JSON.parse(saved) : [];
      localStorage.setItem('novamag_supplier_returns', JSON.stringify([returnRecord, ...all]));
    } catch {}

    // Mise à jour de la dette du fournisseur si déduction de dette
    let updatedSupplier = { ...supplier };
    if (deductFromDebt > 0) {
      const newDebt = Math.max(0, currentDebt - deductFromDebt);
      updatedSupplier.debt = newDebt;
      try {
        const savedSuppliers = localStorage.getItem('novamag_suppliers');
        if (savedSuppliers) {
          const list = JSON.parse(savedSuppliers);
          const idx = list.findIndex((s) => s.id === supplier.id);
          if (idx !== -1) {
            list[idx].debt = newDebt;
            localStorage.setItem('novamag_suppliers', JSON.stringify(list));
          }
        }
      } catch {}
    }

    // Si remboursement en espèces, mouvement de caisse entrant
    if (cashRefund > 0) {
      try {
        const savedCash = localStorage.getItem('novamag_cash_movements');
        const movements = savedCash ? JSON.parse(savedCash) : [];
        movements.unshift({
          id: Date.now(),
          type: 'IN',
          category: 'RETOUR_FOURNISSEUR',
          amount: cashRefund,
          description: `Remboursement espèces retour ${returnRecord.returnNumber} - ${supplier.name}`,
          timestamp: new Date().toISOString(),
          dateStr: returnRecord.dateStr
        });
        localStorage.setItem('novamag_cash_movements', JSON.stringify(movements));
      } catch {}
    }

    onReturnAdded && onReturnAdded(returnRecord, updatedSupplier);
    onClose();
  };

  if (!isOpen || !supplier) return null;

  return (
    <div 
      className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* En-tête (100% Français, aucun mot en arabe) */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-rose-600/20 shrink-0">
              <PackageMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'سند إرجاع للمورد جديد' : 'Nouveau Bon de Retour Fournisseur'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fournisseur : <span className="font-bold text-slate-700 dark:text-slate-300">{supplier.name}</span>
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

          {/* N° de bon et Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                N° Bon de Retour
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
                Date du Retour
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold outline-none focus:border-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* ══ SECTION MULTI-PRODUITS (1 À PLUSIEURS PRODUITS) ══ */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Articles à retourner ({items.length})</span>
              </label>

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-[11px] font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un autre article</span>
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
                        Article #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Supprimer cette ligne"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sélection ou saisie libre */}
                    {availableItems.length > 0 && (
                      <select
                        value={it.name}
                        onChange={(e) => handleItemChange(it.id, 'selectProduct', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-rose-500"
                      >
                        <option value="">-- Choisir depuis les achats récents --</option>
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
                          placeholder="Désignation de l'article..."
                          value={it.name}
                          onChange={(e) => handleItemChange(it.id, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qté"
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
                          placeholder="P.U (DA)"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(it.id, 'unitPrice', Math.max(0, Number(e.target.value)))}
                          className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-right outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-2 text-right">
                        <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                          {lineTotal.toLocaleString()} DA
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Motif du retour (100% Français) */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {language === 'ar' ? 'سبب الإرجاع' : 'Motif du Retour'}
            </label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Produit périmé / Date de péremption proche">Produit périmé / Date de péremption proche</option>
              <option value="Emballage détérioré / Produit endommagé">Emballage détérioré / Produit endommagé</option>
              <option value="Non-conforme à la commande / Erreur référence">Non-conforme à la commande / Erreur référence</option>
              <option value="Erreur de livraison / Surplus de stock">Erreur de livraison / Surplus de stock</option>
              <option value="Défaut de fabrication / Problème de qualité">Défaut de fabrication / Problème de qualité</option>
              <option value="Autre motif convenu avec le fournisseur">Autre motif convenu avec le fournisseur</option>
            </select>
          </div>

          {/* Mode de compensation (100% Français) */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              {language === 'ar' ? 'طريقة التعويض' : 'Mode de Compensation'} / Règlement
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Option 1 : Déduire de la dette */}
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
                    Déduire de la dette fournisseur
                  </span>
                </div>
                <p className="text-[10px] text-amber-800 dark:text-amber-400 mt-1 pl-5">
                  Réduit automatiquement la dette envers ce fournisseur de <span className="font-bold">{total.toLocaleString()} DA</span>.
                </p>
              </label>

              {/* Option 2 : Remboursement en espèces */}
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
                    Remboursement en espèces
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-400 mt-1 pl-5">
                  Le fournisseur rembourse en liquide (entrée de <span className="font-bold">{total.toLocaleString()} DA</span> en caisse).
                </p>
              </label>

            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Observation / Note
            </label>
            <input
              type="text"
              placeholder="Ex: Accord du commercial, lot vérifié..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-rose-500"
            />
          </div>

          {/* Carte récapitulative Total Global */}
          <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                Total Global du Bon de Retour
              </span>
              <span className="text-[11px] text-rose-600 dark:text-rose-300">
                {items.length} article(s) retourné(s)
              </span>
            </div>
            <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
              {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[2.4]" />
              <span>Valider le Bon de Retour ({total.toLocaleString()} DA)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
