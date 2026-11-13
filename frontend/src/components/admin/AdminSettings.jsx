import React, { useState } from 'react';
import { Settings, Store, Receipt, Key, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function AdminSettings() {
  const [storeInfo, setStoreInfo] = useState({
    name: 'Supérette NovaMag',
    address: '05 Rue Didouche Mourad, Alger',
    phone: '0550 12 34 56',
    receiptFooter: 'Merci de votre visite et à bientôt !'
  });

  const [savedMsg, setSavedMsg] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          <span>Paramètres du Magasin & Licence</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Configurez l'en-tête de vos tickets de caisse et consultez les détails de votre licence logicielle.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Paramètres enregistrés avec succès.</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Coordonnées du Magasin</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom du commerce</label>
              <input
                type="text"
                value={storeInfo.name}
                onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adresse</label>
              <input
                type="text"
                value={storeInfo.address}
                onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone</label>
              <input
                type="text"
                value={storeInfo.phone}
                onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message de bas de ticket</label>
              <input
                type="text"
                value={storeInfo.receiptFooter}
                onChange={(e) => setStoreInfo({ ...storeInfo, receiptFooter: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Enregistrer les Coordonnées
            </button>
          </form>
        </div>

        {/* License & POS Info Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Key className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Statut de Licence NovaMag</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold">Licence Professionnelle Active</div>
                    <div className="text-[10px] text-emerald-700">Valide jusqu'au 31/12/2026</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                  Actif
                </span>
              </div>

              <div className="text-xs text-slate-500 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Clé de Licence Machine</div>
                <div>NM-2026-SUP-DZ99-8874-A1B2</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Impression Ticket Caisse</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Format d'impression thermique supporté : <strong>80mm / 58mm ESC-POS</strong>. L'en-tête du ticket utilise automatiquement les coordonnées configurées à gauche.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
