import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Info,
  Layers,
  Tag,
  Barcode,
  Plus,
  Trash2,
  Calendar,
  Image as ImageIcon,
  Package,
  Boxes,
  Percent,
  Upload,
  AlertTriangle,
  ChevronDown,
  Columns
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getDefaultProductImage } from '../../services/productImageService';

export default function AddProductModal({
  isOpen,
  onClose,
  onSave,
  categories = [],
  productToEdit = null,
  initialBarcode = ''
}) {
  const { language, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('base'); // 'base' | 'pricing' | 'variants'

  // Tab 1: Infos de base
  const [barcode, setBarcode] = useState(() => initialBarcode || ('2026' + Math.floor(10000000 + Math.random() * 90000000)));
  const [extraBarcodes, setExtraBarcodes] = useState([]);
  const [newExtraBarcode, setNewExtraBarcode] = useState('');
  const [showAddExtraBarcode, setShowAddExtraBarcode] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[1]?.id || 'periph');
  const [family, setFamily] = useState('');
  const [supplier, setSupplier] = useState('');
  const [alertStock, setAlertStock] = useState('5');
  const [shelfLocation, setShelfLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  // Lot initial / Stock de départ
  const [initialQty, setInitialQty] = useState('0');
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [profitMargin, setProfitMargin] = useState('0');
  const [retailPrice, setRetailPrice] = useState('0');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Tab 2: Propriétés & tarifs
  const [unitOfMeasure, setUnitOfMeasure] = useState('Pièce (U)');
  const [weightVolume, setWeightVolume] = useState('');
  const [color, setColor] = useState('');
  const [wholesaleUnit, setWholesaleUnit] = useState('');
  const [wholesaleBaseQty, setWholesaleBaseQty] = useState('');
  
  // Extra prices
  const [extraPrices, setExtraPrices] = useState([]);
  const [showAddExtraPrice, setShowAddExtraPrice] = useState(false);
  const [newPriceLabel, setNewPriceLabel] = useState('');
  const [newPriceValue, setNewPriceValue] = useState('');

  // Tab 3: Variantes & couleurs (Matches exact reference design)
  const [isVariantsEnabled, setIsVariantsEnabled] = useState(false);
  const [optionGroups, setOptionGroups] = useState([]);
  const [showAddOptionGroup, setShowAddOptionGroup] = useState(false);
  const [newOptionGroupName, setNewOptionGroupName] = useState('');
  const [newOptionGroupValues, setNewOptionGroupValues] = useState('');
  const [generatedVariants, setGeneratedVariants] = useState([]);

  // Colonnes optionnelles du tableau des variantes (Prix de gros, Date d'expiration)
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [showWholesaleColumn, setShowWholesaleColumn] = useState(false);
  const [showExpiryColumn, setShowExpiryColumn] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setBarcode(productToEdit.barcode || '');
      setCategory(productToEdit.category || categories[1]?.id || 'periph');
      setFamily(productToEdit.family || '');
      setSupplier(productToEdit.supplier || '');
      setAlertStock((productToEdit.alertStock ?? 5).toString());
      setShelfLocation(productToEdit.shelfLocation || '');
      setDescription(productToEdit.description || '');
      setImagePreview(productToEdit.image || null);
      setInitialQty((productToEdit.stock ?? 0).toString());
      setPurchasePrice((productToEdit.purchasePrice ?? 0).toString());
      setRetailPrice((productToEdit.price ?? 0).toString());
      setWholesalePrice((productToEdit.wholesalePrice ?? '').toString());
      setExpiryDate(productToEdit.expiryDate || '');
      setUnitOfMeasure(productToEdit.unit || 'Pièce (U)');
      setExtraBarcodes(productToEdit.extraBarcodes || []);
      setExtraPrices(productToEdit.extraPrices || []);
      if (productToEdit.price && productToEdit.purchasePrice) {
        const pa = parseFloat(productToEdit.purchasePrice);
        const pv = parseFloat(productToEdit.price);
        if (pa > 0) {
          setProfitMargin((((pv - pa) / pa) * 100).toFixed(1));
        }
      }
    } else if (isOpen) {
      setName('');
      setBarcode(initialBarcode || ('2026' + Math.floor(10000000 + Math.random() * 90000000)));
      setCategory(categories[1]?.id || 'periph');
      setFamily('');
      setSupplier('');
      setAlertStock('5');
      setShelfLocation('');
      setDescription('');
      setImagePreview(null);
      setInitialQty('0');
      setPurchasePrice('0');
      setProfitMargin('0');
      setRetailPrice('0');
      setWholesalePrice('');
      setExpiryDate('');
      setUnitOfMeasure('Pièce (U)');
      setExtraBarcodes([]);
      setExtraPrices([]);
    }
  }, [productToEdit, isOpen, categories, initialBarcode]);

  if (!isOpen) return null;

  // Calcul automatique de la marge / prix de vente
  const handleMarginChange = (m) => {
    setProfitMargin(m);
    const pa = parseFloat(purchasePrice) || 0;
    const marginVal = parseFloat(m) || 0;
    if (pa > 0) {
      const calculatedSelling = pa * (1 + marginVal / 100);
      setRetailPrice(Math.round(calculatedSelling).toString());
    }
  };

  const handlePurchasePriceChange = (val) => {
    setPurchasePrice(val);
    const pa = parseFloat(val) || 0;
    const marginVal = parseFloat(profitMargin) || 0;
    if (pa > 0 && marginVal > 0) {
      const calculatedSelling = pa * (1 + marginVal / 100);
      setRetailPrice(Math.round(calculatedSelling).toString());
    }
  };

  const handleRetailPriceChange = (val) => {
    setRetailPrice(val);
    const pa = parseFloat(purchasePrice) || 0;
    const pv = parseFloat(val) || 0;
    if (pa > 0 && pv >= pa) {
      const calculatedMargin = ((pv - pa) / pa) * 100;
      setProfitMargin(calculatedMargin.toFixed(1));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExtraBarcode = () => {
    if (newExtraBarcode.trim()) {
      setExtraBarcodes([...extraBarcodes, newExtraBarcode.trim()]);
      setNewExtraBarcode('');
      setShowAddExtraBarcode(false);
    }
  };

  const handleAddExtraPrice = () => {
    if (newPriceLabel.trim() && newPriceValue.trim()) {
      setExtraPrices([
        ...extraPrices,
        { id: Date.now(), label: newPriceLabel.trim(), price: parseFloat(newPriceValue) || 0 }
      ]);
      setNewPriceLabel('');
      setNewPriceValue('');
      setShowAddExtraPrice(false);
    }
  };

  const handleAddOptionGroup = () => {
    if (newOptionGroupName.trim()) {
      const vals = newOptionGroupValues
        ? newOptionGroupValues.split(',').map(s => s.trim()).filter(Boolean)
        : ['Standard'];
      setOptionGroups([
        ...optionGroups,
        {
          id: Date.now(),
          name: newOptionGroupName.trim(),
          values: vals.length > 0 ? vals : ['Option 1']
        }
      ]);
      setNewOptionGroupName('');
      setNewOptionGroupValues('');
      setShowAddOptionGroup(false);
    }
  };

  const handleGenerateVariants = () => {
    if (optionGroups.length === 0) {
      setFormError('Veuillez ajouter au moins un groupe d\'options (ex: Taille ou Couleur) avant de générer le tableau.');
      setTimeout(() => setFormError(''), 4000);
      return;
    }

    // Cartesian product
    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(c => curr.map(n => [...c, n]));
      }, [[]]);
    };

    const groupArrays = optionGroups.map(g => g.values.map(val => `${g.name}: ${val}`));
    const combinations = cartesian(groupArrays);

    const baseCode = barcode.trim() || '2026';
    const pa = purchasePrice || '0';
    const pv = retailPrice || '0';
    const defaultQty = initialQty !== '0' ? initialQty : '10';

    const generated = combinations.map((comb, idx) => ({
      id: `var_${Date.now()}_${idx}`,
      name: comb.join(' / '),
      barcode: `${baseCode}-${idx + 1}`,
      qty: defaultQty,
      purchasePrice: pa,
      retailPrice: pv,
      wholesalePrice: wholesalePrice || '',
      expiryDate: expiryDate || '',
      active: true
    }));

    setGeneratedVariants(generated);
  };

  const handleUpdateVariant = (id, field, value) => {
    setGeneratedVariants(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const handleToggleVariantActive = (id) => {
    setGeneratedVariants(prev =>
      prev.map(item => item.id === id ? { ...item, active: !item.active } : item)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Veuillez saisir le nom du produit.');
      setActiveTab('base');
      setTimeout(() => setFormError(''), 4000);
      return;
    }

    // Calculer le stock total si les variantes sont activées
    const finalStock = isVariantsEnabled && generatedVariants.length > 0
      ? generatedVariants.filter(v => v.active).reduce((sum, v) => sum + (parseInt(v.qty, 10) || 0), 0)
      : (parseInt(initialQty, 10) || 0);

    const newProduct = {
      ...(productToEdit || {}),
      id: productToEdit ? productToEdit.id : Date.now(),
      name: name.trim(),
      barcode: barcode.trim(),
      extraBarcodes,
      category,
      family,
      supplier,
      stock: finalStock,
      alertStock: parseInt(alertStock, 10) || 5,
      shelfLocation,
      description,
      image: imagePreview || getDefaultProductImage({ name, category }),
      price: parseFloat(retailPrice) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
      expiryDate,
      unit: unitOfMeasure,
      isWeighted: unitOfMeasure.includes('Kg') || unitOfMeasure.includes('Gramme'),
      unitType: unitOfMeasure.includes('Gramme') ? 'g' : 'kg',
      weightVolume,
      color,
      wholesaleUnit,
      wholesaleBaseQty,
      extraPrices,
      isVariantsEnabled,
      optionGroups,
      variants: isVariantsEnabled ? generatedVariants : []
    };

    onSave && onSave(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn">
        
        {/* ══ HEADER ══ */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {productToEdit 
              ? (language === 'ar' ? 'تعديل المنتج' : 'Modifier le Produit') 
              : (language === 'ar' ? 'إضافة منتج جديد' : 'Ajouter un Nouveau Produit')}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title={language === 'ar' ? 'إغلاق' : 'Fermer'}
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* ══ TABS NAVIGATION ══ */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          {/* Tab 1 */}
          <button
            type="button"
            onClick={() => setActiveTab('base')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
              activeTab === 'base'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/90 dark:border-blue-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 border-transparent'
            }`}
          >
            <Info className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'المعلومات الأساسية' : 'Infos de base'}</span>
          </button>

          {/* Tab 2 */}
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
              activeTab === 'pricing'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/90 dark:border-blue-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'الخصائص والأسعار' : 'Propriétés & tarifs'}</span>
          </button>

          {/* Tab 3 */}
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
              activeTab === 'variants'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/90 dark:border-blue-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 border-transparent'
            }`}
          >
            <Tag className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'الخيارات والألوان' : 'Variantes & couleurs'}</span>
          </button>
        </div>

        {/* ══ TAB CONTENT (SCROLLABLE BODY) ══ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">

          {/* ─────────────────── TAB 1 : INFOS DE BASE ─────────────────── */}
          {activeTab === 'base' && (
            <div className="space-y-6">
              
              {/* Row 1: Code-barres & Codes-barres supplémentaires */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Code-barres Principal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Code-barres
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Ex: 202649166796"
                      className="flex-1 text-sm font-mono font-bold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setBarcode('2026' + Math.floor(10000000 + Math.random() * 90000000))}
                      className="w-11 h-11 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Générer un code-barres aléatoire"
                    >
                      <Barcode className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Codes-barres supplémentaires */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'ar' ? 'باركودات إضافية (اختياري)' : 'Codes-barres Supplémentaires (Optionnel)'}
                  </label>
                  <div className="p-3 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-2">
                    {extraBarcodes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {extraBarcodes.map((code, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700"
                          >
                            <span>{code}</span>
                            <button
                              type="button"
                              onClick={() => setExtraBarcodes(extraBarcodes.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {showAddExtraBarcode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newExtraBarcode}
                          onChange={(e) => setNewExtraBarcode(e.target.value)}
                          placeholder={language === "ar" ? "باركود جديد..." : "Nouveau code-barres..."}
                          className="flex-1 text-xs font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-xl outline-hidden focus:border-blue-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddExtraBarcode}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Ajouter
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddExtraBarcode(false)}
                          className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddExtraBarcode(true)}
                        className="w-full py-2 bg-white hover:bg-blue-50/60 text-blue-600 border border-blue-200/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? '+ إضافة باركود' : '+ Ajouter un Code-barres'}</span>
                      </button>
                    )}

                    <p className="text-[10px] text-slate-400 font-medium">
                      {language === 'ar' ? 'ملاحظة: يجب أن يكون كل باركود فريداً.' : 'Remarque : Chaque code-barres doit être unique.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Nom du Produit & Catégorie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nom du Produit <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex. Téléphone Portable..."
                    className="w-full text-xs font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all cursor-pointer"
                  >
                    {categories.filter(c => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="autre">Autre Catégorie</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Famille & Fournisseur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Famille
                  </label>
                  <input
                    type="text"
                    value={family}
                    onChange={(e) => setFamily(e.target.value)}
                    placeholder="Exemple : Famille Coca-Cola"
                    className="w-full text-xs font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Fournisseur
                  </label>
                  <select
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="">Choisissez dans la liste des fournisseurs</option>
                    <option value="distrib_nord">Sarl Distribution Nord</option>
                    <option value="grossiste_centre">Grossiste Alimentaire Centre</option>
                    <option value="tech_import">Tech & POS Import Algérie</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Alerte Stock Minimum & Emplacement / Étagère */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alerte Stock Minimum
                  </label>
                  <input
                    type="number"
                    value={alertStock}
                    onChange={(e) => setAlertStock(e.target.value)}
                    className="w-full text-xs font-mono font-bold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Emplacement / Étagère
                  </label>
                  <input
                    type="text"
                    value={shelfLocation}
                    onChange={(e) => setShelfLocation(e.target.value)}
                    placeholder="ex. Rayon A - Étagère 2"
                    className="w-full text-xs font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Row 5: Infos Supplémentaires (Description) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Infos Supplémentaires (Description)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes, caractéristiques spécifiques ou description du produit..."
                  className="w-full text-xs font-medium text-slate-800 p-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Row 6: Image du Produit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Image du Produit
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                      src={imagePreview || getDefaultProductImage({ name: name || 'Nouveau', category })} 
                      alt="Aperçu" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getDefaultProductImage({ name: name || 'Nouveau', category });
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Choisir un fichier</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="text-[11px] text-slate-400">
                      {imagePreview ? 'Image sélectionnée' : 'Aucun fichier choisi'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION: INFOS DU LOT INITIAL (STOCK DE DÉPART) ── */}
              <div className="pt-4 border-t border-slate-200/80 space-y-4">
                <h3 className="text-sm font-black text-blue-900 tracking-tight">
                  Infos du lot initial (Stock de départ)
                </h3>

                {/* Quantité Initiale & Prix d'Achat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Quantité Initiale
                    </label>
                    <input
                      type="number"
                      value={initialQty}
                      onChange={(e) => setInitialQty(e.target.value)}
                      className="w-full text-xs font-mono font-bold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Prix d'Achat (DA)
                    </label>
                    <input
                      type="number"
                      value={purchasePrice}
                      onChange={(e) => handlePurchasePriceChange(e.target.value)}
                      className="w-full text-xs font-mono font-bold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* Marge Bénéficiaire Card (Green Banner) */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900">Marge bénéficiaire</span>
                    <div className="flex items-center gap-1 bg-white border border-emerald-300 rounded-xl px-2 py-1 shadow-2xs">
                      <input
                        type="number"
                        value={profitMargin}
                        onChange={(e) => handleMarginChange(e.target.value)}
                        className="w-12 text-center text-xs font-mono font-black text-emerald-800 outline-hidden"
                      />
                      <span className="text-xs font-bold text-emerald-600">%</span>
                    </div>
                  </div>

                  {/* Quick percentage pills */}
                  <div className="flex items-center gap-1.5">
                    {[10, 20, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleMarginChange(pct.toString())}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prix de Vente au Détail & {language === 'ar' ? 'سعر البيع بالجملة (دج)' : 'Prix de Vente en Gros'} */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === 'ar' ? 'سعر البيع بالتجزئة (دج)' : 'Prix de Vente au Détail (DA)'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={retailPrice}
                      onChange={(e) => handleRetailPriceChange(e.target.value)}
                      className="w-full text-xs font-mono font-black text-blue-600 px-3.5 py-2.5 bg-white border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Prix de Vente en Gros
                    </label>
                    <input
                      type="number"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      placeholder="Optionnel"
                      className="w-full text-xs font-mono font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Date de Péremption */}
                <div className="max-w-xs">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Date de Péremption
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full text-xs font-medium text-slate-700 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl outline-hidden shadow-2xs transition-all"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ─────────────────── TAB 2 : PROPRIÉTÉS & TARIFS ─────────────────── */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">

              {/* Card 1: {language === 'ar' ? 'خصائص المنتج (الوحدة، الوزن، اللون)' : 'Propriétés du Produit (Unité, Poids, Couleur)'} */}
              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Propriétés du Produit (Unité, Poids, Couleur)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === "ar" ? "وحدة القياس" : "Unité de Mesure"}
                    </label>
                    <select
                      value={unitOfMeasure}
                      onChange={(e) => setUnitOfMeasure(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-hidden focus:border-blue-500"
                    >
                      <option value="Pièce (U)">{language === "ar" ? "قطعة (U)" : "Pièce (U)"}</option>
                      <option value="Kilogramme (Kg)">{language === "ar" ? "كيلوغرام (كغ)" : "Kilogramme (Kg)"}</option>
                      <option value="Gramme (g)">{language === "ar" ? "غرام (غ)" : "Gramme (g)"}</option>
                      <option value="Litre (L)">{language === "ar" ? "لتر (L)" : "Litre (L)"}</option>
                      <option value="Mètre (m)">{language === "ar" ? "متر (m)" : "Mètre (m)"}</option>
                      <option value="Carton / Pack">{language === "ar" ? "كرتون / حزمة" : "Carton / Pack"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === "ar" ? "الوزن / الحجم" : "Poids / Volume"}
                    </label>
                    <input
                      type="text"
                      value={weightVolume}
                      onChange={(e) => setWeightVolume(e.target.value)}
                      placeholder={language === "ar" ? "مثال: 500غ" : "Exemple : 500g"}
                      className="w-full text-xs font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === "ar" ? "اللون" : "Couleur"}
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder={language === "ar" ? "مثال: أحمر" : "Exemple : Rouge"}
                      className="w-full text-xs font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Paramètres de Tarification de Gros (Optionnel) - Purple Theme */}
              <div className="p-4 bg-purple-50/30 border border-purple-200/80 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-purple-900 font-black text-xs">
                  <Boxes className="w-4 h-4 text-purple-600" />
                  <span>{language === 'ar' ? 'إعدادات تسعير الجملة (اختياري)' : 'Paramètres de Tarification de Gros (Optionnel)'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === "ar" ? "وحدة الجملة" : "Unité de Gros"}
                    </label>
                    <input
                      type="text"
                      value={wholesaleUnit}
                      onChange={(e) => setWholesaleUnit(e.target.value)}
                      placeholder={language === "ar" ? "اتركه فارغاً إن لم يوجد" : "Laissez vide si aucun"}
                      className="w-full text-xs font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-hidden focus:border-purple-500 placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === 'ar' ? 'الكمية الأساسية في وحدة الجملة' : "Quantité de Base dans l'Unité Majeure"}
                    </label>
                    <input
                      type="text"
                      value={wholesaleBaseQty}
                      onChange={(e) => setWholesaleBaseQty(e.target.value)}
                      placeholder={language === "ar" ? "مثال: 24 قطعة في الكرتون" : "ex. 24 pièces par carton"}
                      className="w-full text-xs font-semibold text-slate-800 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-hidden focus:border-purple-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Prix Supplémentaires du Produit - Green Theme */}
              <div className="p-4 bg-emerald-50/30 border border-emerald-200/80 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'أسعار إضافية للمنتج' : 'Prix Supplémentaires du Produit'}</span>
                </div>

                {extraPrices.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {extraPrices.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <span className="font-bold text-slate-800">{ep.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-emerald-700">
                            {ep.price.toFixed(2)} DA
                          </span>
                          <button
                            type="button"
                            onClick={() => setExtraPrices(extraPrices.filter(p => p.id !== ep.id))}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showAddExtraPrice ? (
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newPriceLabel}
                        onChange={(e) => setNewPriceLabel(e.target.value)}
                        placeholder={language === "ar" ? "مثال: سعر خاص / نصف جملة..." : "Ex: Prix VIP / Demi-gros..."}
                        className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500"
                      />
                      <input
                        type="number"
                        value={newPriceValue}
                        onChange={(e) => setNewPriceValue(e.target.value)}
                        placeholder={language === "ar" ? "المبلغ (دج)..." : "Montant (DA)..."}
                        className="text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddExtraPrice(false)}
                        className="px-3 py-1.5 text-slate-500 text-xs font-bold cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleAddExtraPrice}
                        className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        {language === 'ar' ? 'حفظ السعر' : 'Enregistrer le tarif'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddExtraPrice(true)}
                    className="w-full py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{language === 'ar' ? '+ إضافة سعر إضافي' : '+ Ajouter un Prix Supplémentaire'}</span>
                  </button>
                )}

                <p className="text-[10px] text-slate-400 font-medium">
                  {language === 'ar' ? 'مثال: سعر زبون دائم / سعر توصيل / جملة خاصة...' : 'Exemple : Prix VIP / Prix de livraison / Gros spécial...'}
                </p>
              </div>

            </div>
          )}

          {/* ─────────────────── TAB 3 : VARIANTES & COULEURS ─────────────────── */}
          {activeTab === 'variants' && (
            <div className="space-y-5">
              {/* 1. Main Configuration Box */}
              <div className="p-5 bg-blue-50/20 border border-blue-200/70 rounded-3xl space-y-5">
                
                {/* Toggle Switch Header (Matches Screenshot 1 & 2) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-indigo-950 font-black text-sm">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
                      <Tag className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span>{language === 'ar' ? 'تهيئة المتغيرات والخيارات' : 'Config. des variantes et options'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsVariantsEnabled(!isVariantsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        isVariantsEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                          isVariantsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      {language === 'ar' ? 'تفعيل المتغيرات لهذا المنتج' : 'Activer les variantes pour ce produit'}
                    </span>
                  </div>
                </div>

                {/* When Toggle is ACTIVE (Matches Screenshot 2 & 3) */}
                {isVariantsEnabled && (
                  <div className="space-y-4 pt-2 border-t border-blue-100">

                    {/* Block 1: {language === 'ar' ? 'مجموعات الخيارات (المقاس، اللون، إلخ)' : "Groupes d'options (Taille, Couleur, etc.)"} */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                      <h4 className="text-xs font-bold text-slate-900">
                        Groupes d'options (Taille, Couleur, etc.)
                      </h4>

                      {/* List of defined option groups */}
                      {optionGroups.length > 0 && (
                        <div className="space-y-2 pb-1">
                          {optionGroups.map((grp) => (
                            <div
                              key={grp.id}
                              className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900">{grp.name} :</span>
                                <div className="flex flex-wrap gap-1">
                                  {grp.values.map((v, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-[11px]"
                                    >
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setOptionGroups(optionGroups.filter(g => g.id !== grp.id))}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add option group form or button */}
                      {showAddOptionGroup ? (
                        <div className="p-3 bg-slate-50 border border-blue-200 rounded-xl space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                {language === 'ar' ? 'اسم المجموعة (مثال: المقاس، اللون)' : 'Nom du groupe (ex: Taille, Couleur, Modèle)'}
                              </label>
                              <input
                                type="text"
                                value={newOptionGroupName}
                                onChange={(e) => setNewOptionGroupName(e.target.value)}
                                placeholder={language === "ar" ? "مثال: المقاس" : "Ex: Taille"}
                                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-bold"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                {language === 'ar' ? 'القيم (مفصولة بفواصل)' : 'Valeurs (séparées par des virgules)'}
                              </label>
                              <input
                                type="text"
                                value={newOptionGroupValues}
                                onChange={(e) => setNewOptionGroupValues(e.target.value)}
                                placeholder={language === "ar" ? "مثال: S, M, L, XL" : "Ex: S, M, L, XL"}
                                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 font-semibold"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddOptionGroup(false)}
                              className="px-3 py-1.5 text-slate-500 text-xs font-bold cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={handleAddOptionGroup}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                            >
                              {language === 'ar' ? 'تأكيد المجموعة' : 'Valider le groupe'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAddOptionGroup(true)}
                          className="w-full py-2.5 bg-blue-50/70 hover:bg-blue-100/70 text-blue-600 border border-blue-200/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>{language === 'ar' ? '+ إضافة مجموعة خيارات' : "+ Ajouter un groupe d'options"}</span>
                        </button>
                      )}
                    </div>

                    {/* Block 2: {language === 'ar' ? 'قائمة المتغيرات المنشأة' : 'Liste des variantes générées'} */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">
                          Liste des variantes générées
                        </h4>

                        <div className="flex items-center gap-2">
                          {/* Dropdown Colonnes (Matches Screenshot) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition-colors"
                            >
                              <Columns className="w-3.5 h-3.5 text-slate-500" />
                              <span>Colonnes</span>
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </button>

                            {/* Dropdown Menu Popup */}
                            {isColumnsDropdownOpen && (
                              <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-40 p-2 min-w-[190px] space-y-1 animate-fadeIn">
                                <label className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-bold text-slate-700 select-none transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={showWholesaleColumn}
                                    onChange={(e) => setShowWholesaleColumn(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span>Prix de gros</span>
                                </label>

                                <label className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-bold text-slate-700 select-none transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={showExpiryColumn}
                                    onChange={(e) => setShowExpiryColumn(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span>Date d’expiration</span>
                                </label>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={handleGenerateVariants}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-black shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
                          >
                            Générer / Actualiser le tableau
                          </button>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-600 font-extrabold uppercase tracking-wider">
                              <th className="py-2.5 px-3 text-center w-8">#</th>
                              <th className="py-2.5 px-3">Variante</th>
                              <th className="py-2.5 px-3">Code-barres (Auto/Manuel)</th>
                              <th className="py-2.5 px-2 text-center w-16">Qté</th>
                              <th className="py-2.5 px-3">Prix d'achat</th>
                              <th className="py-2.5 px-3">Prix de vente</th>
                              {showWholesaleColumn && (
                                <th className="py-2.5 px-3">Prix de gros</th>
                              )}
                              {showExpiryColumn && (
                                <th className="py-2.5 px-3">Date d’expiration</th>
                              )}
                              <th className="py-2.5 px-3 text-center w-16">Actif</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {generatedVariants.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6 + (showWholesaleColumn ? 1 : 0) + (showExpiryColumn ? 1 : 0) + 1}
                                  className="py-8 text-center text-slate-400 text-xs font-medium"
                                >
                                  Ajoutez des propriétés, puis cliquez sur "{language === 'ar' ? 'توليد / تحديث الجدول' : 'Générer / Mettre à jour le tableau'}"
                                </td>
                              </tr>
                            ) : (
                              generatedVariants.map((v, i) => (
                                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-bold">
                                    {i + 1}
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-slate-900">
                                    {v.name}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="text"
                                      value={v.barcode}
                                      onChange={(e) => handleUpdateVariant(v.id, 'barcode', e.target.value)}
                                      className="w-full font-mono text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 font-bold"
                                    />
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    <input
                                      type="number"
                                      value={v.qty}
                                      onChange={(e) => handleUpdateVariant(v.id, 'qty', e.target.value)}
                                      className="w-14 text-center font-mono text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 font-bold"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="number"
                                      value={v.purchasePrice}
                                      onChange={(e) => handleUpdateVariant(v.id, 'purchasePrice', e.target.value)}
                                      className="w-20 font-mono text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 font-bold"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="number"
                                      value={v.retailPrice}
                                      onChange={(e) => handleUpdateVariant(v.id, 'retailPrice', e.target.value)}
                                      className="w-24 font-mono text-xs px-2 py-1 bg-slate-50 border border-blue-300 rounded-lg outline-hidden focus:border-blue-600 font-black text-blue-600"
                                    />
                                  </td>
                                  {showWholesaleColumn && (
                                    <td className="py-2.5 px-3">
                                      <input
                                        type="number"
                                        value={v.wholesalePrice || ''}
                                        placeholder="Optionnel"
                                        onChange={(e) => handleUpdateVariant(v.id, 'wholesalePrice', e.target.value)}
                                        className="w-24 font-mono text-xs px-2 py-1 bg-slate-50 border border-purple-200 rounded-lg outline-hidden focus:border-purple-600 font-semibold"
                                      />
                                    </td>
                                  )}
                                  {showExpiryColumn && (
                                    <td className="py-2.5 px-3">
                                      <input
                                        type="date"
                                        value={v.expiryDate || ''}
                                        onChange={(e) => handleUpdateVariant(v.id, 'expiryDate', e.target.value)}
                                        className="w-32 text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 font-medium text-slate-700"
                                      />
                                    </td>
                                  )}
                                  <td className="py-2.5 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={v.active}
                                      onChange={() => handleToggleVariantActive(v.id)}
                                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Block 3: Alert Box (Matches Screenshot 3) */}
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-amber-900 leading-relaxed">
                        Attention : Lors de l'activation de cette fonctionnalité, la quantité et le prix du "Lot initial" standard du produit ne seront pas utilisés. Les données de stock et de tarification seront tirées du tableau des variantes ci-dessus.
                      </p>
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* ══ FOOTER ══ */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="text-xs font-bold text-slate-500">
            {formError ? (
              <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                ⚠️ {formError}
              </span>
            ) : (
              <span>* Champs obligatoires pour la fiche article</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{productToEdit ? (language === 'ar' ? 'حفظ التعديلات' : 'Enregistrer les modifications') : (language === 'ar' ? 'حفظ المنتج' : 'Enregistrer le produit')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
