import React, { useState, useEffect } from 'react';
import { 
  X, Check, Package, Scale, Barcode, Plus, 
  FolderPlus, Calculator, Calendar, AlertTriangle,
  Trash2, Layers
} from 'lucide-react';
import { 
  createCategory, getProductBarcodes, 
  addProductBarcode, deleteProductBarcode 
} from '../../services/api';
import ConfirmDialog from '../common/ConfirmDialog';

export default function ProductFormModal({
  isOpen,
  productToEdit,
  categories = [],
  onRefreshCategories,
  onClose,
  onSave
}) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [prixAchat, setPrixAchat] = useState('');
  const [marge, setMarge] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [seuilAlerte, setSeuilAlerte] = useState('5');
  const [categoryId, setCategoryId] = useState('');
  const [dateExpiration, setDateExpiration] = useState('');
  const [isWeighted, setIsWeighted] = useState(false);
  const [error, setError] = useState('');

  // Quick Add Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  // Multi-barcodes / Packs State
  const [packsList, setPacksList] = useState([]);
  const [newPackBarcode, setNewPackBarcode] = useState('');
  const [newPackName, setNewPackName] = useState('');
  const [newPackMultiplier, setNewPackMultiplier] = useState('6');
  const [newPackPrice, setNewPackPrice] = useState('');
  const [packMsg, setPackMsg] = useState('');

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: 'Confirmation',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: () => {}
  });

  const loadPacks = async (prodId) => {
    if (!prodId) return;
    const res = await getProductBarcodes(prodId);
    if (res.success && res.data) {
      setPacksList(res.data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name || '');
        setBarcode(productToEdit.barcode || '');
        
        const pa = productToEdit.prix_achat !== undefined && productToEdit.prix_achat !== null ? productToEdit.prix_achat : '';
        const pv = productToEdit.price !== undefined ? productToEdit.price : '';
        const mg = productToEdit.marge_benefice !== undefined && productToEdit.marge_benefice !== null 
          ? productToEdit.marge_benefice 
          : (pa && pv && pa > 0 ? Number((((pv - pa) / pa) * 100).toFixed(2)) : '');

        setPrixAchat(pa !== '' ? pa.toString() : '');
        setPrice(pv !== '' ? pv.toString() : '');
        setMarge(mg !== '' ? mg.toString() : '');

        setStockQuantity(productToEdit.stock_quantity !== undefined ? productToEdit.stock_quantity.toString() : '0');
        setSeuilAlerte(productToEdit.seuil_alerte !== undefined && productToEdit.seuil_alerte !== null ? productToEdit.seuil_alerte.toString() : '5');
        setCategoryId(productToEdit.category_id ? productToEdit.category_id.toString() : '');
        setDateExpiration(productToEdit.date_expiration ? productToEdit.date_expiration.split('T')[0] : '');
        setIsWeighted(Boolean(productToEdit.is_weighted));
        loadPacks(productToEdit.id);
      } else {
        setName('');
        setBarcode('');
        setPrixAchat('');
        setMarge('');
        setPrice('');
        setStockQuantity('10');
        setSeuilAlerte('5');
        setCategoryId(categories.length > 0 ? categories[0].id.toString() : '');
        setDateExpiration('');
        setIsWeighted(false);
        setPacksList([]);
      }
      setIsAddingCategory(false);
      setNewCatName('');
      setError('');
      setPackMsg('');
    }
  }, [isOpen, productToEdit, categories]);

  const handleAddPack = async (e) => {
    e.preventDefault();
    if (!newPackBarcode.trim() || !productToEdit?.id) return;
    setPackMsg('');
    const res = await addProductBarcode(productToEdit.id, {
      barcode: newPackBarcode.trim(),
      packing_name: newPackName.trim() || `Pack (${newPackMultiplier}x)`,
      multiplier: parseFloat(newPackMultiplier) || 1,
      price: newPackPrice ? parseFloat(newPackPrice) : null
    });
    if (res.success) {
      setNewPackBarcode('');
      setNewPackName('');
      setNewPackPrice('');
      setPackMsg('Pack ajouté avec succès !');
      loadPacks(productToEdit.id);
      setTimeout(() => setPackMsg(''), 3000);
    } else {
      setPackMsg(res.message || 'Erreur lors de l\'ajout du pack');
    }
  };

  const handleDeletePack = (packId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer le pack",
      message: "Voulez-vous supprimer définitivement ce code-barres / pack ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: async () => {
        const res = await deleteProductBarcode(productToEdit.id, packId);
        if (res.success) {
          loadPacks(productToEdit.id);
        }
      }
    });
  };

  if (!isOpen) return null;

  // Smart Pricing Calculations
  const handlePrixAchatChange = (val) => {
    setPrixAchat(val);
    const pa = parseFloat(val);
    const mg = parseFloat(marge);
    const pv = parseFloat(price);

    if (!isNaN(pa) && pa > 0) {
      if (!isNaN(mg) && mg > 0) {
        // Compute Selling Price
        const computedPv = Number((pa * (1 + mg / 100)).toFixed(2));
        setPrice(computedPv.toString());
      } else if (!isNaN(pv) && pv > pa) {
        // Compute Margin
        const computedMg = Number((((pv - pa) / pa) * 100).toFixed(2));
        setMarge(computedMg.toString());
      }
    }
  };

  const handleMargeChange = (val) => {
    setMarge(val);
    const pa = parseFloat(prixAchat);
    const mg = parseFloat(val);

    if (!isNaN(pa) && pa > 0 && !isNaN(mg)) {
      const computedPv = Number((pa * (1 + mg / 100)).toFixed(2));
      setPrice(computedPv.toString());
    }
  };

  const handlePriceChange = (val) => {
    setPrice(val);
    const pa = parseFloat(prixAchat);
    const pv = parseFloat(val);

    if (!isNaN(pa) && pa > 0 && !isNaN(pv)) {
      const computedMg = Number((((pv - pa) / pa) * 100).toFixed(2));
      setMarge(computedMg.toString());
    }
  };

  // Barcode Generation
  const handleGenerateBarcode = () => {
    if (isWeighted) {
      const randomPlu = '20' + Math.floor(100 + Math.random() * 900);
      setBarcode(randomPlu);
    } else {
      const randomNum = Math.floor(100000000 + Math.random() * 900000000);
      setBarcode(`613${randomNum}`);
    }
  };

  // Quick Create Category Inline
  const handleQuickAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCatLoading(true);
    const res = await createCategory(newCatName.trim());
    setCatLoading(false);

    if (res.success && res.data) {
      if (onRefreshCategories) {
        await onRefreshCategories();
      }
      setCategoryId(res.data.id.toString());
      setIsAddingCategory(false);
      setNewCatName('');
    } else {
      alert(`Erreur: ${res.message || 'Impossible de créer la catégorie'}`);
    }
  };

  // Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Veuillez renseigner la désignation de l\'article.');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Veuillez saisir un prix de vente valide.');
      return;
    }

    const numPrixAchat = parseFloat(prixAchat) || 0;
    const numMarge = parseFloat(marge) || 0;
    const numStock = parseFloat(stockQuantity) || 0;
    const numAlert = parseInt(seuilAlerte, 10) || 5;

    const payload = {
      name: name.trim(),
      barcode: barcode.trim() || null,
      price: numPrice,
      prix_achat: numPrixAchat,
      marge_benefice: numMarge,
      stock_quantity: numStock,
      seuil_alerte: numAlert,
      is_weighted: isWeighted ? 1 : 0,
      category_id: categoryId ? parseInt(categoryId, 10) : null,
      date_expiration: dateExpiration ? dateExpiration : null
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              {isWeighted ? <Scale className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {productToEdit ? 'Modifier la Fiche Article' : 'Fiche Commerciale Article'}
              </h3>
              <p className="text-xs text-slate-500">Gestion des prix d'achat, marges, stock et alertes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* 1. Identification Section */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Identification de l'article
            </span>

            {/* Product Name */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Désignation de l'article <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lait Candia Viva Stérilisé 1L"
                className="w-full text-sm font-semibold text-slate-900 px-3.5 py-2.5 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden shadow-2xs"
                required
              />
            </div>

            {/* Barcode Field with Generator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Code-barres (EAN-13 ou Balance)</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  + Générer code-barres
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder={isWeighted ? "Ex: 20001 (Code balance 5 chiffres)" : "Ex: 6130001000018"}
                className="w-full text-sm font-mono font-bold text-slate-900 px-3.5 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden shadow-2xs"
              />
            </div>

            {/* Category with Quick Add Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold text-slate-700">
                  Catégorie / Rayon
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Nouvelle Catégorie</span>
                </button>
              </div>

              {/* Inline Quick Add Category Form */}
              {isAddingCategory && (
                <div className="mb-2 p-2 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center gap-2 animate-fadeIn">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Nom de la nouvelle catégorie..."
                    className="flex-1 text-xs font-bold px-3 py-1.5 bg-white border border-indigo-300 rounded-lg outline-hidden"
                  />
                  <button
                    type="button"
                    disabled={catLoading || !newCatName.trim()}
                    onClick={handleQuickAddCategory}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {catLoading ? 'Ajout...' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCatName('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs font-semibold text-slate-900 px-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden cursor-pointer"
              >
                <option value="">Sélectionnez une catégorie...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Tarification & Marges (Smart Calculation Section) */}
          <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculateur de Marge & Prix de Vente</span>
              </span>
              <span className="text-[10px] text-indigo-600 bg-white px-2 py-0.5 rounded-md font-semibold border border-indigo-200">
                Calcul dynamique automatique
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Prix d'Achat */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Prix d'Achat (DA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={prixAchat}
                    onChange={(e) => handlePrixAchatChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-sm font-mono font-bold text-slate-900 px-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden shadow-2xs"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    DA
                  </span>
                </div>
              </div>

              {/* Marge Bénéficiaire (%) */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Marge (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={marge}
                    onChange={(e) => handleMargeChange(e.target.value)}
                    placeholder="0.0"
                    className="w-full text-sm font-mono font-bold text-indigo-700 px-3 py-2 bg-white border-2 border-indigo-300 focus:border-indigo-600 rounded-xl outline-hidden shadow-2xs text-center"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-indigo-500">
                    %
                  </span>
                </div>
              </div>

              {/* Prix de Vente (TTC) */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Prix de Vente (DA) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-base font-mono font-black text-emerald-700 px-3 py-1.5 bg-white border-2 border-emerald-400 focus:border-emerald-600 rounded-xl outline-hidden shadow-2xs"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-600">
                    DA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Gestion de Stock & Alertes */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Stock, Alertes & Péremption
            </span>

            <div className="grid grid-cols-3 gap-3">
              {/* Quantité Stock */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  Stock Actuel
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={isWeighted ? "0.01" : "1"}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full text-sm font-mono font-bold text-slate-900 px-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    {isWeighted ? 'kg' : 'pièce'}
                  </span>
                </div>
              </div>

              {/* Seuil d'Alerte */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Seuil d'Alerte</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={seuilAlerte}
                  onChange={(e) => setSeuilAlerte(e.target.value)}
                  placeholder="5"
                  className="w-full text-sm font-mono font-bold text-slate-900 px-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden"
                />
              </div>

              {/* Date d'Expiration */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-rose-500" />
                  <span>Date Péremption</span>
                </label>
                <input
                  type="date"
                  value={dateExpiration}
                  onChange={(e) => setDateExpiration(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-900 px-2.5 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl outline-hidden cursor-pointer"
                />
              </div>
            </div>

            {/* Is Weighted Toggle */}
            <div 
              className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-center justify-between cursor-pointer" 
              onClick={() => setIsWeighted(!isWeighted)}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-amber-900 block">
                    Vendu au poids (Balance électronique)
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    Décodage automatique du poids pour les codes-barres balance
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isWeighted}
                onChange={(e) => setIsWeighted(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Codes-barres Multiples & Packs (Packs / Fardos / Cartons) */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Codes-barres Multiples & Gestion des Packs
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                {packsList.length} pack(s) enregistré(s)
              </span>
            </div>

            {packMsg && (
              <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold">
                {packMsg}
              </div>
            )}

            {productToEdit ? (
              <div className="space-y-2.5">
                {/* List of existing packs */}
                {packsList.length > 0 && (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {packsList.map((pk) => (
                      <div key={pk.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                            📦 x{pk.multiplier}
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-900">{pk.packing_name}</span>
                            <span className="text-slate-400 font-mono text-[11px] ml-2">Code: {pk.barcode}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-emerald-700">
                            {pk.price ? `${pk.price} DA` : `${Number(price * pk.multiplier).toFixed(2)} DA`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePack(pk.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Supprimer ce pack"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline form to add new pack */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    + Associer un nouveau Code-barres ou Pack (ex: Fardo, Carton)
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Code-barres du pack"
                      value={newPackBarcode}
                      onChange={(e) => setNewPackBarcode(e.target.value)}
                      className="text-xs font-mono font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-hidden focus:bg-white focus:border-indigo-600"
                    />
                    <input
                      type="text"
                      placeholder="Nom (ex: Pack 6, Fardo)"
                      value={newPackName}
                      onChange={(e) => setNewPackName(e.target.value)}
                      className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-hidden focus:bg-white focus:border-indigo-600"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Multiplicateur (ex: 6)"
                      value={newPackMultiplier}
                      onChange={(e) => setNewPackMultiplier(e.target.value)}
                      className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-hidden focus:bg-white focus:border-indigo-600"
                      title="Quantité d'unités déduites du stock"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Prix Pack DA (optionnel)"
                      value={newPackPrice}
                      onChange={(e) => setNewPackPrice(e.target.value)}
                      className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-hidden focus:bg-white focus:border-indigo-600 text-emerald-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPack}
                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enregistrer le Pack pour cet Article</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-100/70 rounded-xl text-center text-xs text-slate-500 font-medium">
                💡 Enregistrez d'abord cet article pour pouvoir lui associer des packs (Pack 6, Fardo, Carton) avec déduction automatique du stock.
              </div>
            )}
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="flex items-center gap-2.5 pt-3.5 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Check className="w-4 h-4" />
            <span>{productToEdit ? 'Enregistrer les Modifications' : 'Enregistrer l\'Article'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={() => {
          confirmDialog.onConfirm && confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
