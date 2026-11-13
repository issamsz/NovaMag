import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Zap, Search, Check, Sparkles, 
  Tag, Palette, Edit2, ArrowUpDown 
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  getShortcuts, addShortcut, quickCreateShortcut, 
  deleteShortcut, updateShortcut, getProducts 
} from '../../services/api';

const EMOJI_CATEGORIES = [
  {
    name: 'Boulangerie & Pâtisserie',
    emojis: ['🥖', '🍞', '🥐', '🥪', '🥯', '🥨', '🧁', '🍰', '🎂', '🍪', '🍩', '🍫']
  },
  {
    name: 'Laitiers & Œufs & Huiles',
    emojis: ['🥚', '🥛', '🧀', '🧈', '🫒', '🍯']
  },
  {
    name: 'Boissons & Eaux',
    emojis: ['💧', '🥤', '☕', '🧃', '🧋', '🍵', '🫖', '🧊', '🍾']
  },
  {
    name: 'Fruits & Frais',
    emojis: ['🍎', '🍏', '🍌', '🍊', '🍋', '🍇', '🍉', '🍓', '🍒', '🍑', '🥑', '🍍']
  },
  {
    name: 'Légumes & Épices',
    emojis: ['🍅', '🥔', '🥕', '🧅', '🧄', '🥦', '🥒', '🌶️', '🌽', '🥗']
  },
  {
    name: 'Épicerie & Plats',
    emojis: ['🍚', '🥫', '🍝', '🧂', '🥞', '🧇', '🍿', '🥜', '🥩', '🍗', '🐟', '🌭', '🍔', '🍕']
  },
  {
    name: 'Caisse, Sacs & Divers',
    emojis: ['🛍️', '🛒', '📦', '🏷️', '⚡', '⭐', '🎁', '🔖', '🧼', '🧻', '🧴', '🧹', '🧾', '💰', '💳']
  }
];

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

const COLOR_OPTIONS = [
  { id: 'amber', name: 'Ambre / Pain', bgClass: 'bg-amber-500 hover:bg-amber-400 text-white border-amber-600', dotClass: 'bg-white' },
  { id: 'yellow', name: 'Jaune / Œuf', bgClass: 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-yellow-500', dotClass: 'bg-black/40' },
  { id: 'emerald', name: 'Vert Frais', bgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700', dotClass: 'bg-white' },
  { id: 'teal', name: 'Teal Menthe', bgClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-700', dotClass: 'bg-white' },
  { id: 'sky', name: 'Ciel / Lait', bgClass: 'bg-sky-500 hover:bg-sky-400 text-white border-sky-600', dotClass: 'bg-white' },
  { id: 'blue', name: 'Bleu / Eau', bgClass: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-700', dotClass: 'bg-white' },
  { id: 'indigo', name: 'Indigo', bgClass: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-700', dotClass: 'bg-white' },
  { id: 'purple', name: 'Violet', bgClass: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-700', dotClass: 'bg-white' },
  { id: 'rose', name: 'Rose', bgClass: 'bg-rose-500 hover:bg-rose-400 text-white border-rose-600', dotClass: 'bg-white' },
  { id: 'orange', name: 'Orange', bgClass: 'bg-orange-500 hover:bg-orange-400 text-white border-orange-600', dotClass: 'bg-white' },
  { id: 'red', name: 'Rouge', bgClass: 'bg-red-600 hover:bg-red-500 text-white border-red-700', dotClass: 'bg-white' },
  { id: 'slate', name: 'Gris Sachet', bgClass: 'bg-slate-700 hover:bg-slate-600 text-white border-slate-800', dotClass: 'bg-white' },
];

export default function QuickShortcutsModal({
  isOpen,
  onClose,
  onShortcutsChanged
}) {
  const { language, isRTL } = useLanguage();
  const [shortcuts, setShortcuts] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'catalog' | 'create'
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Catalog Picker State
  const [allProducts, setAllProducts] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [catalogLabel, setCatalogLabel] = useState('');
  const [catalogIcon, setCatalogIcon] = useState('⚡');
  const [catalogColor, setCatalogColor] = useState('indigo');

  // Quick Create State
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newIcon, setNewIcon] = useState('🥖');
  const [newColor, setNewColor] = useState('amber');

  // Load shortcuts
  const loadShortcuts = async () => {
    setLoading(true);
    const res = await getShortcuts();
    if (res.success && res.data) {
      setShortcuts(res.data);
    }
    setLoading(false);
  };

  // Load catalog products for picker
  const loadCatalog = async () => {
    const res = await getProducts();
    if (res.success && res.data) {
      setAllProducts(res.data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadShortcuts();
      loadCatalog();
      setMsg({ text: '', type: '' });
      setSelectedProduct(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Remove Shortcut
  const handleRemove = async (shortcutId) => {
    const res = await deleteShortcut(shortcutId);
    if (res.success) {
      setMsg({ text: 'Raccourci retiré avec succès', type: 'success' });
      await loadShortcuts();
      onShortcutsChanged();
    } else {
      setMsg({ text: res.message || 'Erreur de suppression', type: 'error' });
    }
  };

  // Handle Add from Catalog
  const handleAddFromCatalog = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      setMsg({ text: 'Veuillez sélectionner un article du catalogue', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await addShortcut({
      product_id: selectedProduct.id,
      label: catalogLabel ? catalogLabel.trim() : selectedProduct.name,
      icon: catalogIcon,
      color: catalogColor,
      sort_order: shortcuts.length + 1
    });

    if (res.success) {
      setMsg({ text: 'Article ajouté aux raccourcis avec succès !', type: 'success' });
      setSelectedProduct(null);
      setCatalogLabel('');
      setActiveTab('list');
      await loadShortcuts();
      onShortcutsChanged();
    } else {
      setMsg({ text: res.message || 'Erreur lors de l\'ajout', type: 'error' });
    }
    setLoading(false);
  };

  // Handle Quick Create (New item without barcode)
  const handleQuickCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) {
      setMsg({ text: 'Veuillez renseigner la désignation et le prix', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await quickCreateShortcut({
      name: newName.trim(),
      label: newLabel ? newLabel.trim() : newName.trim(),
      price: parseFloat(newPrice),
      prix_achat: newCostPrice ? parseFloat(newCostPrice) : 0,
      icon: newIcon,
      color: newColor
    });

    if (res.success) {
      setMsg({ text: 'Nouvel article rapide créé et ajouté aux raccourcis !', type: 'success' });
      setNewName('');
      setNewLabel('');
      setNewPrice('');
      setNewCostPrice('');
      setActiveTab('list');
      await loadShortcuts();
      onShortcutsChanged();
    } else {
      setMsg({ text: res.message || 'Erreur lors de la création', type: 'error' });
    }
    setLoading(false);
  };

  const filteredCatalog = allProducts.filter((p) => {
    const q = catalogSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Zap className="w-5 h-5 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {language === 'ar' ? 'إدارة المنتجات السريعة والاختصارات' : 'Gestion des Articles Rapides & Raccourcis'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'ar' ? 'المنتجات اليومية بدون باركود (الخبز، البيض، الأكياس...) المعروضة على شاشة الكاسة' : "Articles fréquents sans code-barres (Pain, Œufs, Sacs...) affichés sur l'écran de caisse"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {msg.text && (
          <div
            className={`mx-6 mt-3 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shrink-0 ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{msg.text}</span>
            <button
              type="button"
              onClick={() => setMsg({ text: '', type: '' })}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex gap-2 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {language === 'ar' ? `الاختصارات الحالية (${shortcuts.length})` : `Raccourcis Actuels (${shortcuts.length})`}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'ar' ? 'إنشاء منتج بدون باركود' : 'Créer un article sans code-barres'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>{language === 'ar' ? 'إضافة من المخزون الحالي' : 'Ajouter depuis le stock existant'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Current Shortcuts List */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {shortcuts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
                  <p className="text-sm font-bold text-slate-600 mb-1">{language === 'ar' ? 'لا توجد اختصارات على شاشة الكاسة' : 'Aucun raccourci sur la caisse'}</p>
                  <p className="text-xs text-slate-400 mb-4">
                    {language === 'ar' ? 'أضف منتجاتك اليومية مثل الخبز أو البيض أو الأكياس.' : 'Ajoutez vos articles quotidiens comme la baguette de pain ou les œufs.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm cursor-pointer"
                  >
                    {language === 'ar' ? '+ إنشاء منتج سريع' : '+ Créer un article rapide'}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {shortcuts.map((sc, idx) => (
                    <div
                      key={sc.shortcut_id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-mono font-bold text-xs text-slate-400">
                          #{idx + 1}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                          {sc.icon || '⚡'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900">
                              {sc.label || sc.name}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {sc.color}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">
                            {sc.name !== sc.label && <span>{sc.name} • </span>}
                            <span className="font-mono font-bold text-indigo-700">
                              {Number(sc.price).toFixed(2)} DA
                            </span>
                            {sc.barcode && (
                              <span className="text-slate-400 font-mono text-[11px] ml-2">
                                (Code: {sc.barcode})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemove(sc.shortcut_id)}
                          title="Retirer ce raccourci"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Quick Create without Barcode */}
          {activeTab === 'create' && (
            <form onSubmit={handleQuickCreate} className="space-y-4 max-w-lg mx-auto">
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 font-medium">
                {language === 'ar' ? '💡 أنشئ منتجاً بدون باركود (خبز، بيض، كيس...). ستتم إضافته تلقائياً إلى المنتجات وعرضه في شاشة البيع.' : "💡 Créez un article qui n'a pas de code-barres (Pain, Œuf, Sac...). Il sera automatiquement ajouté aux produits et placé sur l'écran tactile de la caisse."}
              </div>

              {/* Name & Short Label */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'ar' ? 'التسمية الكاملة' : 'Désignation complète'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={language === "ar" ? "مثال: خبز باغات عادي" : "Ex: Pain Baguette Maison"}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 focus:bg-white outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'ar' ? 'الاسم المختصر على الزر' : 'Nom court sur le bouton'}
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder={language === "ar" ? "مثال: باغات" : "Ex: Baguette"}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'ar' ? 'سعر البيع (دج)' : 'Prix de Vente (DA)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Ex: 15.00"
                    className="w-full text-sm font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 focus:bg-white outline-hidden text-emerald-700"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'ar' ? 'سعر الشراء (دج) (اختياري)' : "Prix d'Achat (DA) (Optionnel)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    placeholder="Ex: 12.00"
                    className="w-full text-sm font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              {/* Icon / Emoji Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>{language === 'ar' ? 'أيقونة الزر :' : 'Icône du bouton :'} <span className="text-xl ml-1">{newIcon}</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Cliquez sur une icône ou tapez votre émoji</span>
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    maxLength={4}
                    className="w-16 text-center text-xl font-bold py-1 bg-white border border-slate-300 rounded-xl"
                  />
                  <span className="text-xs text-slate-500 font-medium">Aperçu en direct</span>
                </div>
                <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200 scrollbar-thin">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="mb-2 last:mb-0">
                      <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        {cat.name}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewIcon(emoji)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                              newIcon === emoji
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-sm scale-110'
                                : 'bg-white hover:bg-indigo-50 border border-slate-200'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Preset Picker avec vraies couleurs de fond vives */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {language === "ar" ? "لون الزر (الخلفية)" : "Couleur du bouton (Fond vif)"}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setNewColor(col.id)}
                      className={`p-2 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-95 ${col.bgClass} ${
                        newColor === col.id
                          ? 'ring-3 ring-indigo-500 ring-offset-2 scale-102 shadow-md'
                          : 'opacity-90 hover:opacity-100'
                      }`}
                    >
                      <span className="truncate text-[11px]">{col.name.split('/')[0]}</span>
                      {newColor === col.id ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ar' ? 'حفظ وعرض على شاشة الكاسة' : 'Enregistrer et Afficher sur la Caisse'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Add from Catalog */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={language === "ar" ? "بحث عن منتج موجود في المخزن..." : "Rechercher un produit existant dans le stock..."}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-hidden"
                />
              </div>

              {/* Product selector grid */}
              <div className="border border-slate-200 rounded-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                {filteredCatalog.map((prod) => {
                  const isSelected = selectedProduct?.id === prod.id;
                  const alreadyShortcut = shortcuts.some((s) => s.product_id === prod.id);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        if (!alreadyShortcut) {
                          setSelectedProduct(prod);
                          setCatalogLabel(prod.name);
                        }
                      }}
                      className={`p-2.5 flex items-center justify-between text-xs transition-colors ${
                        alreadyShortcut
                          ? 'opacity-40 bg-slate-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-indigo-50 border-l-4 border-indigo-600 cursor-pointer font-bold'
                          : 'hover:bg-slate-50 cursor-pointer font-medium'
                      }`}
                    >
                      <div>
                        <div className="text-slate-900 font-bold">{prod.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {prod.barcode || 'Sans code'} •{' '}
                          <span className="text-indigo-600 font-bold">
                            {Number(prod.price).toFixed(2)} DA
                          </span>
                        </div>
                      </div>

                      {alreadyShortcut ? (
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                          {language === 'ar' ? 'مضاف مسبقاً' : 'Déjà en raccourci'}
                        </span>
                      ) : isSelected ? (
                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> {language === "ar" ? "محدد" : "Sélectionné"}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Configuration when a product is picked */}
              {selectedProduct && (
                <form
                  onSubmit={handleAddFromCatalog}
                  className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3 animate-fadeIn"
                >
                  <div className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{language === 'ar' ? `إعداد الزر لـ: ${selectedProduct.name}` : `Configurer le bouton pour: ${selectedProduct.name}`}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {language === 'ar' ? 'النص القصير على الزر' : 'Libellé court du bouton'}
                      </label>
                      <input
                        type="text"
                        value={catalogLabel}
                        onChange={(e) => setCatalogLabel(e.target.value)}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center justify-between">
                        <span>{language === 'ar' ? 'أيقونة (إيموجي)' : 'Icône (Emoji)'}</span>
                        <span className="text-[10px] text-slate-400">Cliquez sur une icône</span>
                      </label>
                      <div className="flex items-center gap-2 mb-1.5">
                        <input
                          type="text"
                          value={catalogIcon}
                          onChange={(e) => setCatalogIcon(e.target.value)}
                          maxLength={4}
                          className="w-16 text-center text-xl font-bold py-1 bg-white border border-slate-300 rounded-xl"
                        />
                        <span className="text-xs text-slate-500 font-medium">Aperçu</span>
                      </div>
                      <div className="max-h-28 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200 scrollbar-thin">
                        <div className="flex flex-wrap gap-1">
                          {ALL_EMOJIS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setCatalogIcon(em)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all cursor-pointer ${
                                catalogIcon === em
                                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 scale-110 shadow-xs'
                                  : 'hover:bg-slate-100'
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Choix de la couleur avec vraies couleurs de fond vives */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {language === "ar" ? "لون الزر (الخلفية)" : "Couleur du bouton (Fond vif)"}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                      {COLOR_OPTIONS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setCatalogColor(col.id)}
                          className={`p-2 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-95 ${col.bgClass} ${
                            catalogColor === col.id
                              ? 'ring-3 ring-indigo-500 ring-offset-2 scale-102 shadow-md'
                              : 'opacity-90 hover:opacity-100'
                          }`}
                        >
                          <span className="truncate text-[11px]">{col.name.split('/')[0]}</span>
                          {catalogColor === col.id ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إضافة إلى اختصارات الكاسة' : 'Ajouter aux Raccourcis Caisse'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
