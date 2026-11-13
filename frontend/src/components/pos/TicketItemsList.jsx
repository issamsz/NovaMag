import React, { useEffect, useRef } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, Scale, Package, Zap } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function TicketItemsList({ 
  items, 
  selectedIndex, 
  onSelectItem, 
  onUpdateQty, 
  onRemoveItem,
  showQuickItems = false,
  onToggleQuickItems,
  quickItemsCount = 0
}) {
  const { language } = useLanguage();
  const tableContainerRef = useRef(null);

  // Auto-scroll to selected or newly added item
  useEffect(() => {
    if (tableContainerRef.current && selectedIndex >= 0) {
      const activeRow = tableContainerRef.current.querySelector(`[data-row-index="${selectedIndex}"]`);
      if (activeRow) {
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex, items.length]);

  return (
    <div className="bg-white dark:bg-[#111C35] rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Table Top Header */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white">
            {language === 'ar' ? 'أسطر السلة الحالية' : 'Lignes du Ticket en cours'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {onToggleQuickItems && (
            <button
              type="button"
              onClick={onToggleQuickItems}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer border ${
                showQuickItems
                  ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs ring-1 ring-amber-400'
                  : 'bg-white dark:bg-slate-800 hover:bg-amber-50 text-slate-700 dark:text-slate-200 hover:text-amber-800 border-slate-200 dark:border-slate-700 hover:border-amber-200'
              }`}
              title={language === 'ar' ? 'عرض أو إخفاء السلع السريعة (F6)' : 'Afficher ou masquer les boutons des articles rapides (F6)'}
            >
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>{showQuickItems ? (language === 'ar' ? 'إخفاء السريعة' : 'Masquer Raccourcis') : (language === 'ar' ? 'سلع سريعة' : 'Articles Rapides')}</span>
              {quickItemsCount > 0 && (
                <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {quickItemsCount}
                </span>
              )}
              <span className="text-[10px] font-mono opacity-70 bg-black/10 px-1 py-0.2 rounded font-bold">F6</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>{language === 'ar' ? 'السلع :' : 'Articles:'}</span>
            <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full font-mono text-xs">
              {items.length}
            </span>
          </div>
        </div>
      </div>

      {/* Table Body / Scrollable Items */}
      <div ref={tableContainerRef} className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-3 text-slate-300 dark:text-slate-600">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'ar' ? 'سلة البيع فارغة' : 'Ticket de vente vide'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {language === 'ar' ? 'امسح باركود السلعة أو اضغط F3 للبحث اليدوي.' : "Scannez le code-barres d'un article ou appuyez sur F3 pour la recherche manuelle."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead className="bg-slate-100/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs uppercase font-extrabold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">{language === 'ar' ? 'التعيين والاسم' : 'Désignation'}</th>
                <th className="py-2.5 px-3 w-32 text-center">{language === 'ar' ? 'الكمية' : 'Quantité'}</th>
                <th className="py-2.5 px-3 w-28 text-right rtl:text-left">{language === 'ar' ? 'سعر الوحدة' : 'P.U'}</th>
                <th className="py-2.5 px-3 w-32 text-right rtl:text-left">{language === 'ar' ? 'إجمالي السطر' : 'Total Ligne'}</th>
                <th className="py-2.5 px-2 w-12 text-center">{language === 'ar' ? 'حذف' : 'Suppr.'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs">
              {items.map((item, index) => {
                const isSelected = selectedIndex === index;
                const lineTotal = item.price * item.quantity;

                return (
                  <tr
                    key={item.id + '-' + index}
                    data-row-index={index}
                    onClick={() => onSelectItem(index)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/40 font-bold border-l-4 rtl:border-l-0 rtl:border-r-4 border-indigo-600' 
                        : index % 2 === 0 ? 'bg-white dark:bg-[#111C35] hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center text-xs font-mono text-slate-400">
                      {index + 1}
                    </td>

                    {/* Product Name & details */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold ${item.is_return ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.name}
                        </span>
                        {item.is_return && (
                          <span className="inline-flex items-center gap-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                            {language === 'ar' ? 'مرتجع' : 'Retour'}
                          </span>
                        )}
                        {item.promoBadge && (
                          <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-700 border border-red-200 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                            🏷️ {item.promoBadge}
                          </span>
                        )}
                        {item.is_pack && (
                          <span className="inline-flex items-center gap-0.5 bg-indigo-100 text-indigo-800 border border-indigo-300 text-[10px] font-black px-1.5 py-0.2 rounded">
                            📦 {item.packing_name || `Pack (${item.multiplier}x)`}
                          </span>
                        )}
                        {item.is_weighted ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            <Scale className="w-3 h-3 text-amber-600" />
                            {language === 'ar' ? 'وزن' : 'Poids'}
                          </span>
                        ) : !item.is_pack && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                            <Package className="w-3 h-3 text-slate-400" />
                            {language === 'ar' ? 'قطعة' : 'Pièce'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Code: {item.barcode || 'N/A'}</span>
                        {item.multiplier > 1 && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">({item.multiplier} {language === 'ar' ? 'وحدات/مخزون' : 'unités/stock'})</span>
                        )}
                      </div>
                    </td>

                    {/* Quantity & Steppers */}
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs w-fit mx-auto">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(index, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-xs min-w-10 text-center px-1">
                          {item.is_weighted ? item.quantity.toFixed(3) : item.quantity}
                          <span className="text-[10px] text-slate-500 ml-0.5">
                            {item.is_weighted ? (language === 'ar' ? 'كغ' : 'kg') : ''}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(index, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Unit Price */}
                    <td className="py-2.5 px-3 text-right rtl:text-left font-mono text-xs text-slate-600 dark:text-slate-300">
                      {item.originalPrice && item.originalPrice !== item.price && (
                        <div className="text-[10px] text-slate-400 line-through">
                          {item.originalPrice.toFixed(2)} {language === 'ar' ? 'د.ج' : 'DA'}
                        </div>
                      )}
                      <span className={item.promoBadge ? 'text-red-600 font-bold' : ''}>
                        {item.price.toFixed(2)}
                      </span>{' '}
                      <span className="text-[10px] font-sans text-slate-400">{language === 'ar' ? 'د.ج' : 'DA'}</span>
                    </td>

                    {/* Line Total */}
                    <td className="py-2.5 px-3 text-right rtl:text-left font-mono text-sm font-extrabold text-indigo-700 dark:text-indigo-400">
                      {lineTotal.toFixed(2)} <span className="text-[10px] font-sans text-slate-500">{language === 'ar' ? 'د.ج' : 'DA'}</span>
                    </td>

                    {/* Delete action */}
                    <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title={language === 'ar' ? 'حذف السطر [Delete]' : 'Supprimer la ligne [Delete]'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
