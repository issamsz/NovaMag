import React from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  User, 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  BadgePercent, 
  ShieldCheck, 
  Tag, 
  ArrowRight,
  Barcode
} from 'lucide-react';
import { generateCode128Svg } from '../../services/barcodeGenerator';
import { printThermalTicketDirect, printSaleInvoiceA4, triggerSilentIframePrint } from '../../services/thermalPrinter';
import { useLanguage } from '../../i18n/LanguageContext';

export default function SaleDetailsModal({
  isOpen,
  invoice,
  customer = null,
  onClose
}) {
  const { language, isRTL } = useLanguage();

  if (!isOpen || !invoice) return null;

  const invoiceNum = invoice.invoiceNumber || `FAC-${invoice.id}`;
  const barcodeSvg = generateCode128Svg(invoiceNum, { height: 38, barWidth: 1.5 });
  const sysSettings = (() => {
    try {
      return JSON.parse(localStorage.getItem('novamag_system_settings') || '{}');
    } catch {
      return {};
    }
  })();

  const handlePrintThermal = () => {
    printThermalTicketDirect(invoice, sysSettings);
  };

  const handlePrintA4 = () => {
    printSaleInvoiceA4(invoice, customer, sysSettings);
  };

  const handlePrintBarcodeOnly = () => {
    const w = Number(sysSettings?.labelWidth) || 40;
    const h = Number(sysSettings?.labelHeight) || 20;
    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8" /><style>
        @page { margin: 0; size: ${w}mm ${h}mm; }
        body { margin: 0; padding: 2mm; text-align: center; font-family: monospace; font-size: 9px; }
      </style></head><body>
        <div style="font-weight: 900; margin-bottom: 2px;">${invoiceNum}</div>
        <div style="display: flex; justify-content: center;">${barcodeSvg}</div>
      </body></html>
    `;
    triggerSilentIframePrint(html, sysSettings);
  };

  const items = invoice.items || [];
  const totalAmount = Number(invoice.total || 0);
  const discount = Number(invoice.discount || 0);
  const customerDebt = customer ? Math.abs(customer.balance < 0 ? customer.balance : (customer.debt || 0)) : (invoice.debtGenerated || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn select-none">
      <div 
        className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-4xl shadow-2xl space-y-5 animate-scaleIn relative flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ══ EN-TÊTE PRINCIPAL ══ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4 shrink-0">
          
          {/* Boutons d'Action Rapides Gauche */}
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={language === 'ar' ? 'إغلاق' : 'Fermer'}
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Imprimer le Ticket Thermique */}
            <button
              type="button"
              onClick={handlePrintThermal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.2]" />
              <span>{language === 'ar' ? 'طباعة الإيصال' : 'Imprimer le Reçu'}</span>
            </button>

            {/* Imprimer la Facture A4 */}
            <button
              type="button"
              onClick={handlePrintA4}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 stroke-[2.2]" />
              <span>{language === 'ar' ? 'طباعة الفاتورة (A4)' : 'Imprimer la Facture (A4)'}</span>
            </button>
          </div>

          {/* Numéro Facture + Code-barres En-tête Droite */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4 order-1 sm:order-2">
            
            <div className="text-left sm:text-right rtl:text-right rtl:sm:text-left">
              <div className="flex items-center sm:justify-end rtl:sm:justify-start gap-2 text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                <span>{language === 'ar' ? `تفاصيل عملية البيع #${invoiceNum}` : `Détails de la Vente #${invoiceNum}`}</span>
                <ShoppingBag className="w-5 h-5 text-blue-600 hidden sm:inline" />
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">
                {invoice.cashier || 'Admin'} • {invoice.dateStr || invoice.timestamp?.slice(0, 16).replace('T', ' ')}
              </div>
            </div>

            {/* Cadre Code-barres avec bouton impression rapide */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <button
                type="button"
                onClick={handlePrintBarcodeOnly}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={language === 'ar' ? 'طباعة ملصق الباركود للفاتورة' : "Imprimer l'étiquette code-barres de la facture"}
              >
                <Printer className="w-4 h-4" />
              </button>
              <div className="text-center pr-1 rtl:pr-0 rtl:pl-1">
                <span className="text-[10px] font-mono font-bold text-slate-500 block leading-tight">
                  {invoiceNum}
                </span>
                <div 
                  className="h-7 w-28 overflow-hidden flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />
              </div>
            </div>

          </div>

        </div>

        {/* ══ CORPS DU MODAL (2 COLONNES) ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          
          {/* COLONNE GAUCHE (4/12) */}
          <div className="lg:col-span-4 space-y-3.5">
            
            {/* 1. Résumé de la Vente */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {language === 'ar' ? 'ملخص البيع' : 'Résumé de la Vente'}
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  {language === 'ar' ? 'عدد المواد :' : "Nombre d'articles :"}
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-white" dir="ltr">{items.length}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  {language === 'ar' ? 'الخصم الممنوح :' : 'Remise accordée :'}
                </span>
                <span className="font-mono font-bold text-rose-600" dir="ltr">{discount.toFixed(2)} DA</span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  {language === 'ar' ? 'الصافي الإجمالي ش.ض' : 'Total Net TTC'}
                </span>
                <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5" dir="ltr">
                  {totalAmount.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
                </div>
              </div>
            </div>

            {/* 2. Données Client */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {language === 'ar' ? 'بيانات الزبون' : 'Données Client'}
              </span>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-black text-sm text-slate-900 dark:text-white truncate">
                    {invoice.customer || customer?.name || (language === 'ar' ? 'زبون عابر' : 'Client Comptoir (Passager)')}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500" dir="ltr">
                    {invoice.customerPhone || customer?.phone || (language === 'ar' ? 'بدون هاتف' : 'Sans téléphone')}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">{language === 'ar' ? 'الرصيد / الدين :' : 'Solde / Dette :'}</span>
                {customerDebt > 0 ? (
                  <span className="font-mono font-black text-rose-600" dir="ltr">
                    {language === 'ar' ? 'دين :' : 'Dette :'} {customerDebt.toLocaleString()} DA
                  </span>
                ) : (
                  <span className="font-bold text-emerald-600">{language === 'ar' ? 'مستوفى ✓' : 'À jour ✓'}</span>
                )}
              </div>
            </div>

            {/* 3. Données Vendeur / Caisse */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {language === 'ar' ? 'بيانات البائع / الصندوق' : 'Données Vendeur'}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm text-slate-900 dark:text-white">
                    {invoice.cashier || 'admin'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {language === 'ar' ? 'المسؤول / الصندوق الرئيسي' : 'Gérant / Caisse Principale'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLONNE DROITE (8/12) */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#0B1120]">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>{language === 'ar' ? `المواد المباعة (${items.length})` : `Articles Vendus (${items.length})`}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-bold">
                  {language === 'ar' ? 'طريقة الدفع :' : 'Mode :'} <span className="uppercase text-slate-700 dark:text-slate-300 font-black">{invoice.paymentMethod === 'especes' ? (language === 'ar' ? 'نقداً' : 'Espèces') : invoice.paymentMethod === 'carte' ? (language === 'ar' ? 'بطاقة CIB' : 'Carte CIB') : invoice.paymentMethod === 'credit' ? (language === 'ar' ? 'آجل' : 'Crédit') : (invoice.paymentMethod || 'Espèces')}</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">{language === 'ar' ? 'المنتج' : 'Produit'}</th>
                      <th className="py-2.5 px-3 text-center">{language === 'ar' ? 'الكمية' : 'Quantité'}</th>
                      <th className="py-2.5 px-3 text-right rtl:text-left">{language === 'ar' ? 'سعر الوحدة' : 'Prix Unitaire'}</th>
                      <th className="py-2.5 px-3.5 text-right rtl:text-left">{language === 'ar' ? 'المجموع' : 'Sous-Total'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {items.map((item, idx) => {
                      const qty = item.quantity || 1;
                      const price = item.price || 0;
                      const sub = typeof item.customTotal === 'number' ? item.customTotal : qty * price;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                            {item.name}
                            {item.batchNumber && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                {language === 'ar' ? 'الدفعة :' : 'Lot :'} {item.batchNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black text-slate-700 dark:text-slate-300" dir="ltr">
                            {qty}
                          </td>
                          <td className="py-3 px-3 text-right rtl:text-left font-mono text-slate-600 dark:text-slate-400" dir="ltr">
                            {price.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
                          </td>
                          <td className="py-3 px-3.5 text-right rtl:text-left font-mono font-black text-blue-600 dark:text-blue-400" dir="ltr">
                            {sub.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { minimumFractionDigits: 2 })} DA
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note en bas */}
            <div className="pt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{invoice.notes || (language === 'ar' ? 'فاتورة مسجلة ومحاسبية' : 'Facture enregistrée et comptabilisée')}</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
              >
                {language === 'ar' ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
