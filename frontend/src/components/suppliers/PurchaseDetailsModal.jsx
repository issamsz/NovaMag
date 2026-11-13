import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  X, 
  Printer, 
  FileText, 
  Building2, 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  Tag, 
  Coins,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Check,
  ArrowRight,
  Trash2
} from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import { triggerSilentIframePrint, printPurchaseInvoiceA4 } from '../../services/thermalPrinter';

export default function PurchaseDetailsModal({
  isOpen,
  purchase: initialPurchase,
  supplier = null,
  onClose,
  onEdit = null,
  onDelete = null,
  onPurchaseUpdated = null
}) {
  const [purchase, setPurchase] = useState(initialPurchase);

  // État du formulaire de versement
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentReceipt, setPaymentReceipt] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  // Confirmation de suppression
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    setPurchase(initialPurchase);
    setIsPaymentOpen(false);
    setIsConfirmDeleteOpen(false);
    setPaymentError('');
    setPaymentSuccess('');
  }, [initialPurchase, isOpen]);

  if (!isOpen || !purchase) return null;

  const invoiceNum = purchase.invoiceNumber || `BA-${purchase.id}`;
  const sysSettings = (() => {
    try {
      return JSON.parse(localStorage.getItem('novamag_system_settings') || '{}');
    } catch {
      return {};
    }
  })();

  const storeName = sysSettings.storeName && !sysSettings.storeName.includes('لومينا') 
    ? sysSettings.storeName 
    : 'NovaMag POS';

  const unpaid = Number(purchase.unpaid ?? (Number(purchase.total || 0) - Number(purchase.paid || 0))) || 0;
  const isPaid = unpaid <= 0;
  const items = purchase.items || [];
  const total = Number(purchase.total || 0);
  const paid = Number(purchase.paid || 0);

  // Ouvrir le volet de versement
  const handleOpenPayment = () => {
    setPaymentAmount(unpaid > 0 ? String(unpaid) : '');
    setPaymentMethod('Espèces');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentReceipt(`VR-${Date.now().toString().slice(-6)}`);
    setPaymentNote(`Règlement facture ${invoiceNum}`);
    setPaymentError('');
    setPaymentSuccess('');
    setIsPaymentOpen(true);
  };

  // Enregistrer le versement sur ce bon d'achat
  const handleConfirmPayment = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount) || 0;
    if (amountNum <= 0) {
      setPaymentError('Veuillez saisir un montant valide supérieur à 0 DA');
      return;
    }

    const newPaid = paid + amountNum;
    const newUnpaid = Math.max(0, unpaid - amountNum);
    const newStatus = newUnpaid <= 0 ? 'PAID' : 'PARTIAL';

    const updatedPurchase = {
      ...purchase,
      paid: newPaid,
      unpaid: newUnpaid,
      status: newStatus
    };

    // 1. Mettre à jour dans novamag_supplier_purchases
    try {
      const saved = localStorage.getItem('novamag_supplier_purchases');
      const all = saved ? JSON.parse(saved) : [];
      const updatedAll = all.map((p) => (p.id === purchase.id || p.invoiceNumber === purchase.invoiceNumber ? updatedPurchase : p));
      localStorage.setItem('novamag_supplier_purchases', JSON.stringify(updatedAll));
    } catch {}

    // 2. Mettre à jour la dette du fournisseur dans novamag_suppliers
    try {
      const savedSuppliers = localStorage.getItem('novamag_suppliers');
      const suppliers = savedSuppliers ? JSON.parse(savedSuppliers) : [];
      const targetSupId = supplier?.id || purchase.supplierId;
      const updatedSuppliers = suppliers.map((s) => {
        if (String(s.id) === String(targetSupId) || s.name === purchase.supplierName) {
          const currentSupDebt = Number(s.debt || 0);
          return {
            ...s,
            debt: Math.max(0, currentSupDebt - amountNum)
          };
        }
        return s;
      });
      localStorage.setItem('novamag_suppliers', JSON.stringify(updatedSuppliers));
    } catch {}

    // 3. Enregistrer l'opération dans l'historique des règlements (novamag_supplier_payments)
    try {
      const dateParts = paymentDate.split('-');
      const formattedDateStr = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : new Date().toLocaleDateString('fr-FR');
      const paymentRecord = {
        id: Date.now(),
        supplierId: supplier?.id || purchase.supplierId,
        supplierName: supplier?.name || purchase.supplierName,
        invoiceNumber: invoiceNum,
        purchaseId: purchase.id,
        amount: amountNum,
        method: paymentMethod,
        receiptNumber: paymentReceipt || `VR-${Date.now().toString().slice(-6)}`,
        notes: paymentNote || `Règlement bon d'achat ${invoiceNum}`,
        dateStr: formattedDateStr,
        timestamp: new Date().toISOString()
      };

      const savedPayments = localStorage.getItem('novamag_supplier_payments');
      const allPayments = savedPayments ? JSON.parse(savedPayments) : [];
      allPayments.unshift(paymentRecord);
      localStorage.setItem('novamag_supplier_payments', JSON.stringify(allPayments));
    } catch {}

    // 4. Mouvement de caisse sortant si payé en Espèces
    if (paymentMethod === 'Espèces') {
      try {
        const savedCash = localStorage.getItem('novamag_cash_movements');
        const movements = savedCash ? JSON.parse(savedCash) : [];
        movements.unshift({
          id: Date.now(),
          type: 'OUT',
          category: 'REGLEMENT_DETTE_FOURNISSEUR',
          amount: amountNum,
          description: `Règlement Bon N° ${invoiceNum} - ${supplier?.name || purchase.supplierName}`,
          date: new Date().toISOString(),
          paymentMethod: 'Espèces'
        });
        localStorage.setItem('novamag_cash_movements', JSON.stringify(movements));
      } catch {}
    }

    // Notifier le système et mettre à jour l'affichage
    setPurchase(updatedPurchase);
    setPaymentSuccess(`✓ Versement de ${amountNum.toLocaleString()} DA enregistré avec succès !`);
    setTimeout(() => {
      setIsPaymentOpen(false);
      setPaymentSuccess('');
    }, 1200);

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('novamag_purchases_updated'));
    if (onPurchaseUpdated) onPurchaseUpdated(updatedPurchase);
  };

  // Impression Ticket Thermique Bon d'Achat
  const handlePrintThermal = () => {
    const paperWidth = Number(sysSettings.thermalPaperWidth) > 0 ? Number(sysSettings.thermalPaperWidth) : 80;
    const margin = Number(sysSettings.thermalMargin) >= 0 ? Number(sysSettings.thermalMargin) : 5;

    const itemsRowsHtml = items.map((it, idx) => `
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 4px 0; text-align: left; vertical-align: top;">
          <div style="font-weight: 700; font-size: 11px;">${it.name || it.designation}</div>
          <div style="font-size: 10px; color: #555;">${it.quantity} x ${(Number(it.unitPrice || it.price || 0)).toLocaleString('fr-FR')} DA</div>
        </td>
        <td style="padding: 4px 0; text-align: right; vertical-align: top; font-weight: 700; font-size: 11px;">
          ${(Number(it.total || (it.quantity * (it.unitPrice || it.price || 0)))).toLocaleString('fr-FR')} DA
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8" />
      <style>
        @page { margin: 0; size: ${paperWidth}mm auto; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; margin: 0; padding: ${margin}mm; font-size: 11px; color: #000; }
        .text-center { text-align: center; }
        .divider { border-top: 1px dashed #444; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
        .bold { font-weight: 800; }
      </style></head><body>
        <div class="text-center">
          <div style="font-size: 14px; font-weight: 900;">${storeName}</div>
          <div style="font-size: 10px; color: #555; margin-top: 2px;">BON D'ACHAT FOURNISSEUR</div>
          <div style="font-size: 12px; font-weight: 800; margin-top: 4px;">N° ${invoiceNum}</div>
          <div style="font-size: 10px; color: #666;">Date : ${purchase.dateStr || purchase.timestamp?.slice(0, 10)}</div>
        </div>
        <div class="divider"></div>
        <div style="font-size: 10px; margin-bottom: 4px;">
          <div><b>{language === 'ar' ? 'المورد :' : 'Fournisseur :'}</b> ${supplier?.name || purchase.supplierName}</div>
          ${supplier?.phone ? `<div><b>Tél :</b> ${supplier.phone}</div>` : ''}
        </div>
        <div class="divider"></div>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsRowsHtml || `<tr><td style="padding: 6px 0;">${purchase.description || 'Marchandises diverses'}</td><td style="text-align: right; font-weight: 700;">${total.toLocaleString('fr-FR')} DA</td></tr>`}
        </table>
        <div class="divider"></div>
        <div class="row bold" style="font-size: 13px;">
          <span>{language === 'ar' ? 'إجمالي الشراء' : 'TOTAL ACHAT'} :</span>
          <span>${total.toLocaleString('fr-FR')} DA</span>
        </div>
        <div class="row" style="color: #059669; font-weight: 700;">
          <span>Montant Réglé :</span>
          <span>${paid.toLocaleString('fr-FR')} DA</span>
        </div>
        ${unpaid > 0 ? `
          <div class="row" style="color: #dc2626; font-weight: 800;">
            <span>Reste à Crédit :</span>
            <span>${unpaid.toLocaleString('fr-FR')} DA</span>
          </div>
        ` : `
          <div class="text-center" style="font-size: 10px; color: #059669; font-weight: 800; margin-top: 4px;">
            [ ENTIÈREMENT RÉGLÉ ✓ ]
          </div>
        `}
        <div class="divider"></div>
        <div style="font-size: 9px; text-align: center; color: #777;">
          Mode : ${purchase.paymentMethod || 'Espèces'}
        </div>
      </body></html>
    `;
    triggerSilentIframePrint(html, sysSettings);
  };

  // Impression Bon d'Achat A4 Pro Impeccable
  const handlePrintA4 = () => {
    printPurchaseInvoiceA4(purchase, supplier, sysSettings);
  };

  // Suppression du bon d'achat
  const handleConfirmDelete = () => {
    try {
      const saved = localStorage.getItem('novamag_supplier_purchases');
      if (saved) {
        const all = JSON.parse(saved);
        const filtered = all.filter(
          (p) => String(p.id) !== String(purchase.id) && String(p.invoiceNumber) !== String(purchase.invoiceNumber)
        );
        localStorage.setItem('novamag_supplier_purchases', JSON.stringify(filtered));
      }

      // Si le bon avait un reste impayé, ajuster la dette fournisseur le cas échéant
      const unpaidVal = Number(purchase.unpaid ?? (Number(purchase.total || 0) - Number(purchase.paid || 0))) || 0;
      if (unpaidVal > 0 && purchase.supplierId) {
        const savedSuppliers = localStorage.getItem('novamag_suppliers');
        if (savedSuppliers) {
          const list = JSON.parse(savedSuppliers);
          const idx = list.findIndex((s) => String(s.id) === String(purchase.supplierId));
          if (idx !== -1) {
            list[idx].debt = Math.max(0, (Number(list[idx].debt || 0)) - unpaidVal);
            localStorage.setItem('novamag_suppliers', JSON.stringify(list));
            window.dispatchEvent(new Event('novamag_suppliers_updated'));
          }
        }
      }

      window.dispatchEvent(new Event('novamag_purchases_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }

    if (onDelete) {
      onDelete(purchase);
    } else if (onPurchaseUpdated) {
      onPurchaseUpdated(null);
    }
    setIsConfirmDeleteOpen(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
              isPaid 
                ? 'bg-blue-600 text-white shadow-blue-600/20' 
                : 'bg-rose-600 text-white shadow-rose-600/20'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bon d'Achat N° {invoiceNum}
                </h3>
                {isPaid ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900/40">
                    Payé ✓
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/40">
                    Reste à crédit : {unpaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Date : <span className="font-semibold text-slate-700 dark:text-slate-300">{purchase.dateStr || purchase.timestamp?.slice(0, 10)}</span> • Mode : <span className="font-semibold text-slate-700 dark:text-slate-300">{purchase.paymentMethod || 'Espèces'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* 1. Carreau Modifier (Conforme Photo 2) */}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(purchase);
                }}
                className="h-8 sm:h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
                title="Modifier ce bon d'achat"
              >
                <span className="text-[11px]">Modifier</span>
                <Edit3 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </button>
            )}

            {/* 2. Carreau Supprimer (Conforme Photo 2) */}
            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="h-8 sm:h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
              title="Supprimer ce bon d'achat"
            >
              <span className="text-[11px]">Supprimer</span>
              <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            </button>

            {/* 2. Carreau Faire un Versement (Conforme Photo 2) */}
            {unpaid > 0 && (
              <button
                type="button"
                onClick={handleOpenPayment}
                className="h-8 sm:h-9 px-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
                title="Enregistrer un versement"
              >
                <span className="text-[11px]">Versement</span>
                <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </button>
            )}

            {/* 3. Carreau Impression Ticket (Conforme Photo 2) */}
            <button
              type="button"
              onClick={handlePrintThermal}
              className="h-8 sm:h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-slate-900 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
              title="Imprimer le ticket thermique"
            >
              <span className="text-[11px]">Ticket</span>
              <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </button>

            {/* 4. Carreau Impression Facture A4 (Plein Indigo - Conforme Photo 2) */}
            <button
              type="button"
              onClick={handlePrintA4}
              className="h-8 sm:h-9 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-98"
              title="Imprimer le bon d'achat format A4"
            >
              <span className="text-[11px]">Bon A4</span>
              <FileText className="w-3.5 h-3.5 text-indigo-100 shrink-0" />
            </button>

            {/* 5. Carreau Fermer */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Corps déroulant */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          
          {/* Fiche Fournisseur */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fournisseur</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {supplier?.name || purchase.supplierName}
                </span>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  {supplier?.phone && <span>Tél : {supplier.phone}</span>}
                  {supplier?.address && <span>• {supplier.address}</span>}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
              {supplier?.nif && <div>NIF : <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{supplier.nif}</span></div>}
              {supplier?.rc && <div>RC : <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{supplier.rc}</span></div>}
            </div>
          </div>

          {/* Tableau des articles achetés */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                <span>Articles Réceptionnés ({items.length || 1})</span>
              </span>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3 text-center w-10">#</th>
                  <th className="py-2 px-3">Désignation du produit</th>
                  <th className="py-2 px-3 text-center w-24">Quantité</th>
                  <th className="py-2 px-3 text-right w-28">Prix Unitaire</th>
                  <th className="py-2 px-3 text-right w-32">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {items.length > 0 ? (
                  items.map((it, idx) => {
                    const itTotal = Number(it.total || (it.quantity * (it.unitPrice || it.price || 0))) || 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {it.name || it.designation}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {it.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {(Number(it.unitPrice || it.price || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {itTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">1</td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {purchase.description || 'Marchandises diverses'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">1</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Récapitulatif Financier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Bon d'Achat</span>
              <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Montant Payé</span>
              <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {paid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              unpaid > 0 
                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' 
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
            }`}>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  unpaid > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}>
                  {unpaid > 0 ? 'Reste à Crédit' : 'Solde du Bon'}
                </span>
                <div className={`text-lg font-bold font-mono mt-0.5 ${
                  unpaid > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {unpaid > 0 ? `${unpaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA` : '0,00 DA (Soldé ✓)'}
                </div>
              </div>

              {unpaid > 0 && (
                <button
                  type="button"
                  onClick={handleOpenPayment}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Verser un Acompte</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Pied de modal */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div>
            {unpaid > 0 && (
              <button
                type="button"
                onClick={handleOpenPayment}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Coins className="w-4 h-4 stroke-[2.2]" />
                <span>Régler / Faire un Versement</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* ══ MODALE INTÉGRÉE : FAIRE UN VERSEMENT SUR CE BON D'ACHAT ══ */}
        {isPaymentOpen && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-scaleIn">
              
              {/* En-tête */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs">
                    <Coins className="w-5 h-5 stroke-[2.4]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Enregistrer un Versement
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bon N° <span className="font-bold text-slate-700 dark:text-slate-300">{invoiceNum}</span> • {supplier?.name || purchase.supplierName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Reste à payer actuel en rappel */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Reste à payer actuel sur ce bon :</span>
                <span className="font-mono font-black text-sm text-rose-600 dark:text-rose-400">
                  {unpaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                </span>
              </div>

              {paymentError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {paymentSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{paymentSuccess}</span>
                </div>
              )}

              <form onSubmit={handleConfirmPayment} className="space-y-3">
                {/* Montant à verser */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Montant à Verser (DA)
                    </label>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(unpaid))}
                      className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Régler la totalité ({unpaid.toLocaleString()} DA)
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={`Ex: ${unpaid}`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-base font-black text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                {/* Mode de règlement */}
                <div>
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Mode de Règlement
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Espèces', 'Virement Bancaire', 'Chèque'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          paymentMethod === m
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {m === 'Virement Bancaire' ? 'Virement' : m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & N° Reçu */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      N° Reçu / Pièce
                    </label>
                    <input
                      type="text"
                      value={paymentReceipt}
                      onChange={(e) => setPaymentReceipt(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Observation / Note
                  </label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Note facultative..."
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Boutons d'action */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                  >
                    Valider le Versement
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>

      {/* ══ MODALE DE CONFIRMATION DE SUPPRESSION NOVA MAG ══ */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        title="Supprimer la facture d'achat"
        message={`Êtes-vous certain de vouloir supprimer définitivement la facture d'achat N° ${invoiceNum} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
}
