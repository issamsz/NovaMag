import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Trash2, Edit2, Search, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { getCategories, createCategory, authFetch } from '../../services/api';
import ConfirmDialog from '../common/ConfirmDialog';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [editName, setEditName] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const res = await getCategories();
    if (res.success && res.data) {
      setCategories(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setErrorMsg('');
    const res = await createCategory(newCatName.trim());
    if (res.success) {
      setActionMsg(`Catégorie "${newCatName.trim()}" créée avec succès`);
      setNewCatName('');
      loadCategories();
      setTimeout(() => setActionMsg(''), 4000);
    } else {
      setErrorMsg(res.message || 'Erreur lors de la création');
    }
  };

  const handleStartEdit = (cat) => {
    setEditingCat(cat);
    setEditName(cat.name);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCat || !editName.trim()) return;

    setErrorMsg('');
    try {
      const res = await authFetch(`/categories/${editingCat.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg(`Catégorie mise à jour`);
        setEditingCat(null);
        setEditName('');
        loadCategories();
        setTimeout(() => setActionMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Erreur de modification');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = (cat) => {
    const isNotEmpty = cat.products_count > 0;
    const msg = isNotEmpty
      ? `Cette catégorie contient ${cat.products_count} article(s). Les articles passeront en sans catégorie. Voulez-vous continuer ?`
      : `Supprimer définitivement la catégorie "${cat.name}" ?`;

    setConfirmDialog({
      isOpen: true,
      title: "Supprimer la catégorie",
      message: msg,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await authFetch(`/categories/${cat.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok && data.success) {
            setActionMsg(`Catégorie supprimée`);
            loadCategories();
            setTimeout(() => setActionMsg(''), 4000);
          } else {
            setErrorMsg(data.message || 'Erreur de suppression');
          }
        } catch (err) {
          setErrorMsg(err.message);
        }
      }
    });
  };
        setErrorMsg(data.message || 'Erreur de suppression');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            <span>Gestion des Rayons & Catégories</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Organisez les produits de votre supérette par rayons commerciaux.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCategories}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Notifications */}
      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Add Form & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form: Add New Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs h-fit">
          <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Ajouter un Rayon / Catégorie</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Nom du rayon visible sur la caisse</p>

          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nom de la catégorie</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="ex: Biscuits & Gâteaux"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer le Rayon</span>
            </button>
          </form>
        </div>

        {/* Right Table: Categories List */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une catégorie..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
              />
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {filteredCategories.length} catégorie(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-4">Nom de la Catégorie</th>
                  <th className="py-2.5 px-4 text-center">Articles Rattachés</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      {editingCat?.id === cat.id ? (
                        <form onSubmit={handleSaveEdit} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 border border-indigo-500 rounded-lg text-xs bg-white text-slate-900"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold"
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCat(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px]"
                          >
                            Annuler
                          </button>
                        </form>
                      ) : (
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{cat.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full font-mono text-[11px]">
                        {cat.products_count} article(s)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
