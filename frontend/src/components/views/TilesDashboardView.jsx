import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, Receipt, DollarSign, FileText, FileCheck, 
  Package, Boxes, Tag, ClipboardList, Barcode, 
  Settings, Truck, ShoppingBag, Users, Database, 
  BarChart3, TrendingUp, AlertTriangle, CheckCircle2, 
  RefreshCw, Printer, UserCheck, Clock, Calendar, 
  Monitor, Power, ArrowUpRight, ShieldCheck, Sparkles,
  Search, Keyboard, Gift, CreditCard, RotateCcw, Percent,
  Eye, CheckSquare, Square, ChevronRight, X
} from 'lucide-react';
import { getDashboardStats } from '../../services/api';
import { MOCK_INVOICES } from '../../mock/posData';
import ZReportModal from '../pos/ZReportModal';
import { useLanguage } from '../../i18n/LanguageContext';

export default function TilesDashboardView({ onNavigate, onLogout }) {
  const { language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [selectedDocFilter, setSelectedDocFilter] = useState('all'); // 'all', 'last3', 'inactive'
  const [docSearch, setDocSearch] = useState('');
  const [selectedDocId, setSelectedDocId] = useState(null);

  // Synchronisation des factures / documents récents
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return MOCK_INVOICES || [];
    } catch {
      return MOCK_INVOICES || [];
    }
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      if (res?.success && res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.warn('Dashboard stats fallback');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Filtrage des documents de la table droite
  const filteredInvoices = useMemo(() => {
    let list = [...invoices];
    if (selectedDocFilter === 'last3') {
      list = list.slice(0, 3);
    }
    if (docSearch.trim()) {
      const q = docSearch.toLowerCase();
      list = list.filter(inv => 
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.customerName || '').toLowerCase().includes(q) ||
        (inv.paymentMethod || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, selectedDocFilter, docSearch]);

  // Totaux calculés en direct style Gestmag
  const totals = useMemo(() => {
    const totalAmount = invoices.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
    const countTickets = invoices.filter(inv => !inv.type || inv.type === 'ticket' || inv.type === 'vente').length;
    const countFactures = invoices.filter(inv => inv.type === 'facture').length;
    return {
      amount: totalAmount,
      tickets: countTickets,
      factures: countFactures,
      commandes: 2,
      reservations: 0,
      remboursements: 0
    };
  }, [invoices]);

  const handlePrintDoc = () => {
    if (selectedDocId) {
      alert(`Impression du document #${selectedDocId} lancée vers l'imprimante ticket.`);
    } else if (invoices.length > 0) {
      alert(`Impression du dernier ticket (${invoices[0].invoiceNumber || '#1'}) lancée.`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1E2530] text-slate-100 select-none font-sans">
      
      {/* ══ 1. BANDEAU SUPÉRIEUR GESTMAG (Version & Licence & Alertes) ══ */}
      <div className="bg-[#181D26] border-b border-slate-700/80 px-4 py-1.5 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-white tracking-tight text-sm">Gestmag v3</span>
            <span className="text-[10px] text-slate-400 font-mono">2026 • 64 Bits</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] text-slate-300">N° de Série : <strong className="text-white font-mono">NOVA-MAG-2026-PRO</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] text-slate-400">Poste : <strong className="text-blue-400">Quick Informatique</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-rose-600/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow-2xs">
            Licence NovaMag Activée
          </span>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold px-3 py-1 rounded transition-colors cursor-pointer"
          >
            Changer de base de données
          </button>
        </div>
      </div>

      {/* ══ 2. CORPS CENTRAL : DISPOSITION GESTMAG (TUILES À GAUCHE + TABLE À DROITE) ══ */}
      <div className="flex-1 flex overflow-hidden min-h-0 p-2 gap-2">
        
        {/* ── PARTIE GAUCHE : LES TUILES GESTMAG COLORÉES (Largeur ~38%) ── */}
        <div className="w-[400px] xl:w-[440px] flex flex-col gap-1.5 overflow-y-auto pr-1 shrink-0 scrollbar-thin">
          
          {/* TUILE ROUGE MAJEURE : "His. Ventes Caisse" */}
          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="w-full bg-[#E05252] hover:bg-[#D44242] text-white p-3 rounded-sm flex items-center justify-between transition-all cursor-pointer shadow-md group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-lg text-white">
                His.
              </div>
              <div className="text-left rtl:text-right">
                <span className="text-lg font-black tracking-wide block leading-tight">
                  Ventes Caisse
                </span>
                <span className="text-[11px] text-rose-100 font-medium">
                  Point de vente direct (Touche F1)
                </span>
              </div>
            </div>
            <ShoppingCart className="w-8 h-8 opacity-80 group-hover:scale-110 transition-transform" />
          </button>

          {/* GRILLE DES TUILES COLORÉES GESTMAG */}
          <div className="grid grid-cols-3 gap-1.5">
            
            {/* LIGNE 1 : BLEU-GRIS */}
            <button
              type="button"
              onClick={() => onNavigate('sales_history')}
              className="bg-[#4E667E] hover:bg-[#5C7791] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <Receipt className="w-4 h-4 mb-1 text-slate-200" />
              <span className="text-[10px] font-bold leading-tight">Gestion Règlements Journée</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('sales_history')}
              className="bg-[#4E667E] hover:bg-[#5C7791] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <ShoppingCart className="w-4 h-4 mb-1 text-slate-200" />
              <span className="text-[10px] font-bold leading-tight">Gestion Ventes Journée</span>
            </button>

            <button
              type="button"
              onClick={() => setIsZReportOpen(true)}
              className="bg-[#4E667E] hover:bg-[#5C7791] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <DollarSign className="w-4 h-4 mb-1 text-amber-300" />
              <span className="text-[10px] font-bold leading-tight">Clôture Journée</span>
            </button>

            {/* LIGNE 2 : BLEU CLAIR */}
            <button
              type="button"
              onClick={() => onNavigate('sales_history')}
              className="bg-[#5B8CB9] hover:bg-[#689BCA] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4 mb-1 text-sky-200" />
              <span className="text-[10px] font-bold leading-tight">Règlements Journée</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('cash_drawer')}
              className="bg-[#5B8CB9] hover:bg-[#689BCA] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <CreditCard className="w-4 h-4 mb-1 text-sky-200" />
              <span className="text-[10px] font-bold leading-tight">Saisie des Arrhes</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('sales_history')}
              className="bg-[#5B8CB9] hover:bg-[#689BCA] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <RotateCcw className="w-4 h-4 mb-1 text-sky-200" />
              <span className="text-[10px] font-bold leading-tight">Correction Règlement</span>
            </button>

            {/* LIGNE 3 : CYAN & ORANGE */}
            <button
              type="button"
              onClick={() => onNavigate('pos')}
              className="bg-[#48A9BA] hover:bg-[#57B7C7] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <Calendar className="w-4 h-4 mb-1 text-cyan-100" />
              <span className="text-[10px] font-bold leading-tight">Gestion Abonnements</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('cash_drawer')}
              className="bg-[#E49343] hover:bg-[#EFA153] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <TrendingUp className="w-4 h-4 mb-1 text-amber-100" />
              <span className="text-[10px] font-bold leading-tight">Stat de Caisse</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="bg-[#469B97] hover:bg-[#54ABA7] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <CheckSquare className="w-4 h-4 mb-1 text-emerald-100" />
              <span className="text-[10px] font-bold leading-tight">Gestion Ch/Ca. Diff.</span>
            </button>

            {/* LIGNE 4 : CYAN & SAUMON */}
            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="bg-[#48A9BA] hover:bg-[#57B7C7] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <CreditCard className="w-4 h-4 mb-1 text-cyan-100" />
              <span className="text-[10px] font-bold leading-tight">Gestion Chèques Fidélité</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="bg-[#DC6B6B] hover:bg-[#E77A7A] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer col-span-2 active:scale-95 shadow-2xs"
            >
              <Users className="w-4 h-4 mb-1 text-rose-100" />
              <span className="text-[10px] font-bold leading-tight">État Fidélité Client & Carnet</span>
            </button>

            {/* LIGNE 5 : BONS D'AVOIRS & TIROIR */}
            <button
              type="button"
              onClick={() => onNavigate('sales_history')}
              className="bg-[#48A9BA] hover:bg-[#57B7C7] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <FileText className="w-4 h-4 mb-1 text-cyan-100" />
              <span className="text-[10px] font-bold leading-tight">Gestion Bons d'Avoirs</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="bg-[#E49343] hover:bg-[#EFA153] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <RotateCcw className="w-4 h-4 mb-1 text-amber-100" />
              <span className="text-[10px] font-bold leading-tight">Reprise Occasion</span>
            </button>

            <button
              type="button"
              onClick={() => {
                alert('Tiroir-caisse déclenché avec succès !');
              }}
              className="bg-[#469B97] hover:bg-[#54ABA7] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <DollarSign className="w-4 h-4 mb-1 text-emerald-100" />
              <span className="text-[10px] font-bold leading-tight">Ouvrir le Tiroir</span>
            </button>

            {/* LIGNE 6 : CHÈQUES KDO & RÉDUCTIONS */}
            <button
              type="button"
              onClick={() => onNavigate('promotions')}
              className="bg-[#48A9BA] hover:bg-[#57B7C7] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <Gift className="w-4 h-4 mb-1 text-cyan-100" />
              <span className="text-[10px] font-bold leading-tight">Gestion Chèques Kdo</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('promotions')}
              className="bg-[#DC6B6B] hover:bg-[#E77A7A] text-white p-2 rounded-sm text-center flex flex-col items-center justify-center min-h-[58px] transition-all cursor-pointer col-span-2 active:scale-95 shadow-2xs"
            >
              <Percent className="w-4 h-4 mb-1 text-rose-100" />
              <span className="text-[10px] font-bold leading-tight">État Réductions Ventes & Promotions</span>
            </button>
          </div>
        </div>

        {/* ── PARTIE DROITE : LA TABLE DES DOCUMENTS GESTMAG (Largeur ~62%) ── */}
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-700/80 rounded-sm overflow-hidden min-w-0">
          
          {/* TABLE BLANCHE DES DOCUMENTS */}
          <div className="flex-1 overflow-y-auto bg-white text-slate-900 min-h-0">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#2A3442] text-white sticky top-0 font-bold z-10 text-[11px]">
                <tr>
                  <th className="py-2 px-3 border-r border-slate-600">Type Document</th>
                  <th className="py-2 px-3 border-r border-slate-600">Date</th>
                  <th className="py-2 px-3 border-r border-slate-600 text-right">TTC</th>
                  <th className="py-2 px-3">Nom Client</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInvoices.map((inv, idx) => {
                  const isSelected = selectedDocId === inv.id;
                  const docType = inv.type === 'proforma' ? 'Pro-forma' : inv.type === 'commande' ? 'Commande' : 'Ticket Vente';
                  const dateStr = inv.timestamp ? new Date(inv.timestamp).toLocaleDateString('fr-FR') : '10/11/2026';
                  const timeStr = inv.timestamp ? new Date(inv.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '14:30';

                  return (
                    <tr
                      key={inv.id || idx}
                      onClick={() => setSelectedDocId(inv.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-bold' 
                          : idx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-slate-50 hover:bg-blue-50'
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold border-r border-slate-200 flex items-center gap-1.5">
                        <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                        <span>{docType} {inv.invoiceNumber || `#${inv.id || idx + 1}`}</span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px]">
                        {dateStr} {timeStr}
                      </td>
                      <td className={`py-2 px-3 border-r border-slate-200 font-mono font-black text-right ${isSelected ? 'text-white' : 'text-emerald-700'}`}>
                        {Number(inv.total || 0).toFixed(2)} DA
                      </td>
                      <td className="py-2 px-3 font-medium truncate max-w-[200px]">
                        {inv.customerName || 'Client Comptoir (Passager)'}
                      </td>
                    </tr>
                  );
                })}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 text-xs">
                      Aucun document enregistré pour cette sélection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* BARRE D'ACTIONS SOUS LA TABLE GESTMAG */}
          <div className="bg-[#242C38] border-t border-slate-700 p-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            
            {/* Boutons Action / Imprimer / Voir Règlement */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onNavigate('sales_history')}
                className="px-3 py-1.5 bg-[#3B4656] hover:bg-[#485669] text-white font-bold rounded-sm border border-slate-600 transition-colors cursor-pointer"
              >
                Action
              </button>

              <button
                type="button"
                onClick={handlePrintDoc}
                className="px-3 py-1.5 bg-[#3B4656] hover:bg-[#485669] text-white font-bold rounded-sm border border-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Imprimer</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('sales_history')}
                className="px-3 py-1.5 bg-[#3B4656] hover:bg-[#485669] text-white font-bold rounded-sm border border-slate-600 transition-colors cursor-pointer"
              >
                Voir Règlement
              </button>
            </div>

            {/* Totaux Gestmag en Direct */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10.5px] font-semibold text-slate-300">
              <div>Total Tickets : <strong className="text-white font-mono">{totals.tickets}</strong></div>
              <div>Total Commandes : <strong className="text-white font-mono">{totals.commandes}</strong></div>
              <div>Total Factures : <strong className="text-white font-mono">{totals.factures}</strong></div>
              <div>Total Règlements : <strong className="text-emerald-400 font-mono font-bold">{totals.amount.toFixed(2)} DA</strong></div>
            </div>

            {/* Filtres à droite Gestmag */}
            <div className="flex flex-col text-[10px] text-slate-300 space-y-0.5 border-l border-slate-700 pl-3">
              <span className="font-bold text-slate-400 uppercase text-[9px]">Dernières ventes</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="docFilter" 
                  checked={selectedDocFilter === 'last3'} 
                  onChange={() => setSelectedDocFilter('last3')}
                  className="rounded-sm accent-blue-500" 
                />
                <span>Les 3 derniers</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name="docFilter" 
                  checked={selectedDocFilter === 'all'} 
                  onChange={() => setSelectedDocFilter('all')}
                  className="rounded-sm accent-blue-500" 
                />
                <span className="font-bold text-white">Tous les documents</span>
              </label>
            </div>
          </div>

        </div>
      </div>

      {/* ══ 3. BARRE INFÉRIEURE COMPLÈTE GESTMAG (Poste, Recherche avec [⌨] [🔍], Icônes) ══ */}
      <div className="bg-[#141820] border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs select-none">
        
        {/* Info Poste */}
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Monitor className="w-4 h-4 text-blue-400" />
          <span>Poste 01 Nom Poste</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-mono text-[11px]">Session 1 Active</span>
          <span className="hidden sm:inline text-slate-500 text-[10px]">• Mono Poste</span>
        </div>

        {/* Champ Recherche Article / Document avec bouton [⌨] */}
        <div className="flex items-center gap-1 bg-[#1F2633] border border-slate-700 rounded-sm px-2 py-1 w-72">
          <input
            type="text"
            value={docSearch}
            onChange={(e) => setDocSearch(e.target.value)}
            placeholder="Recherche Article / Doc..."
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
          />
          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded cursor-pointer"
            title="Ouvrir le clavier tactile"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
          <Search className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Gros Boutons d'Action Inférieurs Gestmag */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadStats}
            className="flex flex-col items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-5 h-5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-[9px] font-bold mt-0.5">Rafraîchir</span>
          </button>

          <button
            type="button"
            onClick={handlePrintDoc}
            className="flex flex-col items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Printer className="w-5 h-5 text-amber-400" />
            <span className="text-[9px] font-bold mt-0.5">Duplicata</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('users')}
            className="flex flex-col items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-[9px] font-bold mt-0.5">Utilisateur</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5 text-slate-400 hover:text-white" />
            <span className="text-[9px] font-bold mt-0.5">Maintenance</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex flex-col items-center justify-center text-rose-400 hover:text-rose-300 transition-colors cursor-pointer ml-2"
          >
            <Power className="w-5 h-5 text-rose-500" />
            <span className="text-[9px] font-bold mt-0.5">Quitter</span>
          </button>
        </div>
      </div>

      {/* Modal Z */}
      <ZReportModal 
        isOpen={isZReportOpen} 
        onClose={() => setIsZReportOpen(false)} 
      />
    </div>
  );
}
