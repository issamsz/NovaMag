import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Scale } from 'lucide-react';
import { searchProducts } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ManualSearchModal({
  isOpen,
  onClose,
  onSelectProduct
}) {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchProducts(query);
      if (res.success) {
        setResults(res.data);
        setSelectedIndex(0);
      }
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        onSelectProduct(results[selectedIndex]);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white dark:bg-[#111C35] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'بحث يدوي [F3]' : 'Recherche Manuelle [F3]'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ar' ? 'البحث بالاسم أو الباركود' : 'Recherche par désignation ou code-barres'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <input
            ref={inputRef}
            type="text"
            data-ignore-global-scanner="true"
            data-ignore-global-shortcuts="true"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب اسم المنتج...' : 'Tapez le nom du produit...'}
            className="w-full text-sm font-bold text-slate-900 dark:text-white px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-indigo-400 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-hidden shadow-inner"
          />
          {loading && (
            <div className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2">
              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin block"></span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {query.trim()
                ? (language === 'ar' ? 'لم يتم العثور على منتجات' : 'Aucun produit trouvé')
                : (language === 'ar' ? 'ابدأ بالكتابة للبحث عن منتج' : 'Commencez à taper pour rechercher un produit')}
            </div>
          ) : (
            results.map((product, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-4 rtl:border-l-0 rtl:border-r-4 border-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      {product.is_weighted ? <Scale className="w-4 h-4 text-amber-600" /> : <Package className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{product.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {product.barcode || (language === 'ar' ? 'بدون كود' : 'Sans code')} • {language === 'ar' ? 'المخزون :' : 'Stock:'} {product.stock_quantity}
                      </div>
                    </div>
                  </div>
                  <div className="text-right rtl:text-left">
                    <span className="text-sm font-mono font-black text-indigo-700 dark:text-indigo-400">
                      {product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">DA</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>{language === 'ar' ? '↑↓ للتنقل' : '↑↓ Naviguer'}</span>
            <span>{language === 'ar' ? 'Enter للاختيار' : 'Entrée Choisir'}</span>
            <span>{language === 'ar' ? 'Esc للخروج' : 'Esc Quitter'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
}
