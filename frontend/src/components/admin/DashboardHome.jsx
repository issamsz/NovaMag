import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, AlertTriangle, Package, DollarSign, RefreshCw, 
  ArrowUpRight, ShoppingCart, Users, Layers, Plus, CheckCircle2,
  AlertCircle, ChevronRight, BarChart3, ShieldCheck, Calendar, Clock
} from 'lucide-react';
import { getDashboardStats, adjustStock } from '../../services/api';
import ZReportModal from '../pos/ZReportModal';

export default function DashboardHome({ onNavigate, currentUser }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [isZReportOpen, setIsZReportOpen] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const res = await getDashboardStats();
    if (res.success && res.data) {
      setStats(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleQuickRestock = async (productId, productName, qty = 10) => {
    const res = await adjustStock(productId, qty);
    if (res.success) {
      setActionMsg(`Réapprovisionné : +${qty} unités pour "${productName}"`);
      loadStats();
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const kpi = stats?.kpi || {
    totalProducts: 0,
    lowStockCount: 0,
    totalCostValue: 0,
    totalSellingValue: 0,
    potentialProfit: 0,
    averageMargin: 0,
    salesToday: 0,
    netProfitToday: 0,
    transactionsToday: 0,
    expiringCount: 0,
    expiredCount: 0
  };

  const lowStockItems = stats?.lowStockItems || [];
  const categories = stats?.categoryDistribution || [];
  const expiringItems = stats?.expiringItems || [];

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header Banner & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tableau de Bord Commercial
            </h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En direct
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Bienvenue, <strong>{currentUser?.full_name || 'Administrateur'}</strong>. Voici l'état en temps réel de votre supérette.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsZReportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-all cursor-pointer shadow-xs"
            title="Consulter le Ticket Z et clôture de caisse avec ventilation détaillée"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ticket Z / Clôture</span>
          </button>

          <button
            type="button"
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Ouvrir Caisse POS</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* 2. Primary KPI Cards Grid (5 Columns on Large screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Ventes du Jour */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ventes du Jour</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-slate-900 tracking-tight">
            {kpi.salesToday.toLocaleString('fr-FR')} <span className="text-xs font-sans font-bold text-emerald-600">DA</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            <span>{kpi.transactionsToday} ticket(s) encaissé(s)</span>
          </div>
        </div>

        {/* Card 2: Bénéfice Net Réel */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bénéfice Net Réel</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-slate-900 tracking-tight">
            {kpi.netProfitToday.toLocaleString('fr-FR')} <span className="text-xs font-sans font-bold text-indigo-600">DA</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            <span>Marge moy: <strong className="font-mono text-indigo-700">{kpi.averageMargin}%</strong></span>
          </div>
        </div>

        {/* Card 3: Alertes Stock Critique */}
        <div className={`rounded-2xl p-4 border shadow-2xs relative overflow-hidden group transition-all ${
          kpi.lowStockCount > 0 
            ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400' 
            : 'bg-white border-slate-200/80 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock Critique</span>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              kpi.lowStockCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>{kpi.lowStockCount}</span>
            <span className="text-[11px] font-sans font-bold text-slate-500">article(s)</span>
          </div>
          <div className="text-[11px] mt-1 font-medium">
            {kpi.lowStockCount > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Sous le seuil
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Stocks OK
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Alerte Péremptions (30 jours) */}
        <div className={`rounded-2xl p-4 border shadow-2xs relative overflow-hidden group transition-all ${
          (kpi.expiringCount > 0 || kpi.expiredCount > 0)
            ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400' 
            : 'bg-white border-slate-200/80 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Péremptions (30j)</span>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              kpi.expiredCount > 0 
                ? 'bg-rose-100 text-rose-600 animate-pulse' 
                : kpi.expiringCount > 0 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>{kpi.expiringCount + kpi.expiredCount}</span>
            <span className="text-[11px] font-sans font-bold text-slate-500">à risque</span>
          </div>
          <div className="text-[11px] mt-1 font-medium">
            {kpi.expiredCount > 0 ? (
              <span className="text-rose-600 font-bold">
                ⚠️ {kpi.expiredCount} déjà périmé(s)
              </span>
            ) : kpi.expiringCount > 0 ? (
              <span className="text-amber-700 font-bold">
                ⏳ {kpi.expiringCount} expire(nt) bientôt
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Aucun à 30j
              </span>
            )}
          </div>
        </div>

        {/* Card 5: Valeur Marchande Stock */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Valeur du Stock</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-xl font-mono font-black text-slate-900 tracking-tight">
            {kpi.totalSellingValue.toLocaleString('fr-FR')} <span className="text-xs font-sans font-bold text-amber-600">DA</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-medium">
            <span>Coût:</span>
            <span className="font-mono font-bold text-slate-700">
              {kpi.totalCostValue.toLocaleString('fr-FR')} DA
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section Two Columns: Low Stock Alerts Table & Categories Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Critical Stock Alerts List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Articles sous le Seuil d'Alerte</h2>
                <p className="text-[11px] text-slate-400">Nécessitent un bon de commande ou un réapprovisionnement</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Voir tous les articles</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-slate-700">Tous les stocks sont au-dessus des seuils</p>
                <p className="text-xs text-slate-400 mt-0.5">Aucun article ne nécessite de commande urgente pour le moment.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Article</th>
                    <th className="py-2.5 px-3">Rayon</th>
                    <th className="py-2.5 px-3 text-center">Stock Actuel</th>
                    <th className="py-2.5 px-3 text-center">Seuil Alerte</th>
                    <th className="py-2.5 px-3 text-right">Prix Achat</th>
                    <th className="py-2.5 px-4 text-center">Action Rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {lowStockItems.map((item) => {
                    const isUrgent = item.stock_quantity <= Math.ceil(item.seuil_alerte / 2);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.barcode || 'Sans code-barres'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                            {item.category_name || 'Général'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md ${
                            isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.stock_quantity} {item.is_weighted ? 'kg' : 'pcs'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {item.seuil_alerte}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {(item.prix_achat || 0).toFixed(2)} DA
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(item.id, item.name, 10)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition-all cursor-pointer"
                            title="Ajouter 10 unités immédiatement au stock"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+10 au stock</span>
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

        {/* Expiration Alerts Table (Péremptions dans les 30 jours) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Alerte Péremptions & Dates Limites (30 jours)</h2>
                <p className="text-[11px] text-slate-400">Articles proches de la date d'expiration à vendre en priorité ou retirer</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Gérer les articles</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {expiringItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-slate-700">Aucun produit ne périme dans les 30 prochains jours</p>
                <p className="text-xs text-slate-400 mt-0.5">Votre stock est frais et conforme aux normes sanitaires.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Article</th>
                    <th className="py-2.5 px-3">Date Limite</th>
                    <th className="py-2.5 px-3 text-center">Jours Restants</th>
                    <th className="py-2.5 px-3 text-center">Stock à Risque</th>
                    <th className="py-2.5 px-3 text-right">Valeur Coût</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expiringItems.map((item) => {
                    const daysLeft = Number(item.days_remaining);
                    const isExpired = daysLeft < 0;
                    const isCritical = daysLeft >= 0 && daysLeft <= 7;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.category_name || 'Général'}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {item.date_expiration}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isExpired ? (
                            <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              ⚠️ Périmé ({Math.abs(daysLeft)}j)
                            </span>
                          ) : isCritical ? (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              ⏳ Urgent ({daysLeft} jours)
                            </span>
                          ) : (
                            <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                              {daysLeft} jours
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {item.stock_quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          {(item.stock_quantity * (item.prix_achat || 0)).toFixed(2)} DA
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Category Breakdown & Quick Actions */}
        <div className="space-y-6">
          {/* Category Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Répartition par Rayon</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">{categories.length} rayons</span>
            </div>

            <div className="space-y-3">
              {categories.slice(0, 5).map((cat) => {
                const totalStockVal = kpi.totalSellingValue || 1;
                const percentage = Math.min(100, Math.round((cat.total_value / totalStockVal) * 100));

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 truncate max-w-[150px]">{cat.name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {cat.product_count} art. • {cat.total_value.toLocaleString('fr-FR')} DA
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(8, percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg shadow-indigo-950/20">
            <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Accès Rapides d'Administration</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4">Raccourcis vers les modules les plus fréquents</p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-xs font-bold cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Gestion des Articles & Stocks</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('categories')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-xs font-bold cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Gestion des Rayons & Catégories</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('users')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-xs font-bold cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Gestion des Utilisateurs & Caissiers</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Z Modal */}
      <ZReportModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
