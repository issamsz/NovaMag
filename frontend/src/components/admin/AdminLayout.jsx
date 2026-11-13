import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Layers, Users, Settings, 
  LogOut, Wifi, WifiOff, Clock, ShieldCheck, ChevronRight, Store
} from 'lucide-react';
import DashboardHome from './DashboardHome';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';
import { fetchHealth } from '../../services/api';

export default function AdminLayout({ onSwitchToPos, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverOnline, setServerOnline] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkServer = async () => {
      const res = await fetchHealth();
      setServerOnline(res.success && res.status === 'UP');
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, badge: 'KPIs' },
    { id: 'pos', label: 'Caisse POS', icon: ShoppingCart, isPosLink: true },
    { id: 'products', label: 'Articles & Stock', icon: Package },
    { id: 'categories', label: 'Catégories', icon: Layers },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const handleNavClick = (item) => {
    if (item.isPosLink) {
      onSwitchToPos();
    } else {
      setActiveTab(item.id);
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Tableau de Bord Commercial';
      case 'products': return 'Gestion des Articles, Prix & Stocks';
      case 'categories': return 'Gestion des Rayons & Catégories';
      case 'users': return 'Gestion des Utilisateurs & Caissiers';
      case 'settings': return 'Paramètres du Magasin & Licence';
      default: return 'Administration';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Permanent Left Sidebar (w-64) */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white">Nova</span>
              <span className="text-xl font-black tracking-tight text-indigo-400">Mag</span>
              <span className="bg-indigo-950 text-indigo-300 text-[9px] px-1.5 py-0.2 rounded font-bold border border-indigo-800 uppercase">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Panneau d'Administration</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            Menu Principal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isPos = item.isPosLink;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  isPos
                    ? 'bg-emerald-600/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 mt-2'
                    : isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isPos ? 'text-emerald-400 group-hover:text-white' : isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && !isActive && (
                  <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                    {item.badge}
                  </span>
                )}

                {isPos && (
                  <span className="bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-700 group-hover:text-white text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">
                    Vente
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer in Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {currentUser?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser?.full_name || 'Admin'}
                </div>
                <div className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Administrateur</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Fermer la session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs shrink-0 select-none">
          {/* Breadcrumb & Section Title */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
              <span>NovaMag</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-indigo-600 font-bold capitalize">{activeTab}</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          {/* Right Controls: Quick POS switch, Network status & Live clock */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSwitchToPos}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Caisse POS</span>
            </button>

            <div className="h-5 w-px bg-slate-200"></div>

            {/* Server Online Status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
              serverOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {serverOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <Wifi className="w-3 h-3" />
                  <span>Connecté</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <WifiOff className="w-3 h-3" />
                  <span>Hors ligne</span>
                </>
              )}
            </div>

            {/* Clock */}
            <div className="text-slate-600 font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{time.toLocaleTimeString('fr-FR')}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-y-auto min-h-0 bg-slate-100/70">
          {activeTab === 'dashboard' && (
            <DashboardHome 
              onNavigate={(tab) => {
                if (tab === 'pos') onSwitchToPos();
                else setActiveTab(tab);
              }} 
              currentUser={currentUser} 
            />
          )}

          {activeTab === 'products' && (
            <div className="h-full">
              <AdminProducts 
                onSwitchToPos={onSwitchToPos} 
                currentUser={currentUser} 
                onLogout={onLogout} 
                isEmbedded={true} 
              />
            </div>
          )}

          {activeTab === 'categories' && (
            <AdminCategories />
          )}

          {activeTab === 'users' && (
            <AdminUsers currentUser={currentUser} />
          )}

          {activeTab === 'settings' && (
            <AdminSettings />
          )}
        </main>
      </div>
    </div>
  );
}
