import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Scale, Plus, Search, Edit3, Trash2, 
  AlertTriangle, RefreshCw, PlusCircle, MinusCircle, Calendar, TrendingUp 
} from 'lucide-react';
import AdminHeader from './AdminHeader';
import ProductFormModal from './ProductFormModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { 
  getProducts, getCategories, createProduct, 
  updateProduct, deleteProduct, adjustStock 
} from '../../services/api';

export default function AdminProducts({ onSwitchToPos, currentUser, onLogout, isEmbedded = false }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [weightedFilter, setWeightedFilter] = useState('');

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

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

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    const [prodsRes, catsRes] = await Promise.all([
      getProducts({
        search,
        category_id: selectedCategory,
        is_weighted: weightedFilter
      }),
      getCategories()
    ]);

    if (prodsRes.success) setProducts(prodsRes.data);
    if (catsRes.success) setCategories(catsRes.data);
    setLoading(false);
  }, [search, selectedCategory, weightedFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Save (Create or Update)
  const handleSaveProduct = async (formData) => {
    let res;
    if (productToEdit) {
      res = await updateProduct(productToEdit.id, formData);
      if (res.success) {
        setActionMsg(`Article "${formData.name}" mis à jour avec succès`);
      }
    } else {
      res = await createProduct(formData);
      if (res.success) {
        setActionMsg(`Article "${formData.name}" ajouté avec succès`);
      }
    }

    if (res.success) {
      setIsModalOpen(false);
      setProductToEdit(null);
      loadData();
      setTimeout(() => setActionMsg(''), 4000);
    } else {
      alert(`Erreur: ${res.message}`);
    }
  };

  // Handle Delete
  const handleDeleteProduct = (prod) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer l'article",
      message: `Êtes-vous certain de vouloir supprimer définitivement l'article "${prod.name}" ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: async () => {
        const res = await deleteProduct(prod.id);
        if (res.success) {
          setActionMsg(`Article "${prod.name}" supprimé avec succès`);
          loadData();
          setTimeout(() => setActionMsg(''), 3000);
        } else {
          alert(`Échec de la suppression: ${res.message}`);
        }
      }
    });
  };

  // Handle Quick Stock Adjust
  const handleQuickStock = async (prodId, delta) => {
    const res = await adjustStock(prodId, delta);
    if (res.success) {
      setProducts((prev) => 
        prev.map((p) => p.id === prodId ? { ...p, stock_quantity: res.data.stock_quantity } : p)
      );
    }
  };

  // Stats Calculations
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
  const scaleProductsCount = products.filter((p) => p.is_weighted).length;
  const lowStockCount = products.filter((p) => p.stock_quantity <= (p.seuil_alerte || 5)).length;

  return (
    <div className={isEmbedded ? "h-full flex flex-col gap-4 overflow-hidden font-sans select-none" : "flex flex-col h-screen w-screen bg-slate-100 overflow-hidden font-sans select-none"}>
      {/* 1. Header (Standalone mode only) */}
      {!isEmbedded && (
        <AdminHeader onSwitchToPos={onSwitchToPos} currentUser={currentUser} onLogout={onLogout} />
      )}

      {/* 2. Main Content */}
      <main className={isEmbedded ? "flex-1 overflow-hidden flex flex-col gap-4 p-0" : "flex-1 p-6 overflow-hidden flex flex-col gap-4"}>
        {/* Top Summary Cards */}
        <div className="grid grid-cols-4 gap-4 shrink-0">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-0.5">Total Articles</span>
              <span className="text-2xl font-mono font-black text-slate-800">{totalProducts}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-0.5">Valeur Vente du Stock</span>
              <div className="text-xl font-mono font-black text-slate-800">
                {totalValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span className="text-xs font-sans text-emerald-600">DA</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              DA
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-0.5">Articles au Poids (Balance)</span>
              <span className="text-2xl font-mono font-black text-slate-800">{scaleProductsCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-0.5">Articles Sous Seuil d'Alerte</span>
              <span className="text-2xl font-mono font-black text-rose-600">{lowStockCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Recherche par nom ou code-barres..."
                className="w-full text-xs font-semibold text-slate-900 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-hidden focus:border-indigo-600 cursor-pointer"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Scale filter */}
            <div className="relative">
              <select
                value={weightedFilter}
                onChange={(e) => setWeightedFilter(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-hidden focus:border-indigo-600 cursor-pointer"
              >
                <option value="">Tous les types</option>
                <option value="0">Articles standards (pièces)</option>
                <option value="1">Articles au poids (kg)</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Actualiser la liste"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Action Notification */}
          {actionMsg && (
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-fadeIn">
              {actionMsg}
            </div>
          )}

          {/* Add Product Button */}
          <button
            type="button"
            onClick={() => {
              setProductToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </button>
        </div>

        {/* Products Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                <span>Chargement des articles...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <Package className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
                <span className="text-sm font-bold text-slate-600">Aucun produit ne correspond à la recherche</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-32">Code-barres</th>
                    <th className="py-2.5 px-3">Désignation</th>
                    <th className="py-2.5 px-3 w-36">Catégorie</th>
                    <th className="py-2.5 px-3 w-24 text-right">P. Achat</th>
                    <th className="py-2.5 px-2 w-20 text-center">Marge</th>
                    <th className="py-2.5 px-3 w-28 text-right">Prix Vente</th>
                    <th className="py-2.5 px-3 w-36 text-center">Stock / Seuil</th>
                    <th className="py-2.5 px-2 w-24 text-center">Péremption</th>
                    <th className="py-2.5 px-2 w-20 text-center">Type</th>
                    <th className="py-2.5 px-2 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 text-xs font-medium">
                  {products.map((p, idx) => {
                    const isLowStock = p.stock_quantity <= (p.seuil_alerte || 5);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>

                        <td className="py-2 px-3 font-mono font-bold text-slate-700">
                          {p.barcode ? (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                              {p.barcode}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sans code</span>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 text-xs block">{p.name}</span>
                        </td>

                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {p.category_name || <span className="text-slate-400">—</span>}
                        </td>

                        {/* Prix d'Achat */}
                        <td className="py-2 px-3 text-right font-mono text-slate-500">
                          {p.prix_achat ? p.prix_achat.toFixed(2) : '0.00'} <span className="text-[10px] font-sans">DA</span>
                        </td>

                        {/* Marge % */}
                        <td className="py-2 px-2 text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px]">
                            {p.marge_benefice ? `${p.marge_benefice.toFixed(1)}%` : '0%'}
                          </span>
                        </td>

                        {/* Prix de Vente */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-sm text-emerald-700">
                          {p.price.toFixed(2)} <span className="text-[10px] font-sans text-slate-500 font-normal">DA</span>
                        </td>

                        {/* Stock & Seuil d'Alerte */}
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickStock(p.id, -1)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                              title="Diminuer le stock"
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                            </button>
                            
                            <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs min-w-14 text-center ${
                              isLowStock
                                ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300' 
                                : 'bg-emerald-50 text-emerald-800'
                            }`} title={`Seuil d'alerte: ${p.seuil_alerte || 5}`}>
                              {p.is_weighted ? p.stock_quantity.toFixed(2) : p.stock_quantity}
                              <span className="text-[9px] ml-0.5">{p.is_weighted ? 'kg' : ''}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleQuickStock(p.id, 1)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                              title="Augmenter le stock"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Date de Péremption */}
                        <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-500">
                          {p.date_expiration ? (
                            <span className="inline-flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {p.date_expiration}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Type */}
                        <td className="py-2 px-2 text-center">
                          {p.is_weighted ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              <Scale className="w-3 h-3 text-amber-600" />
                              Poids
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                              <Package className="w-3 h-3 text-slate-400" />
                              Pièce
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setProductToEdit(p);
                                setIsModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Modifier l'article"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer l'article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        productToEdit={productToEdit}
        categories={categories}
        onRefreshCategories={loadData}
        onClose={() => {
          setIsModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
      />

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
