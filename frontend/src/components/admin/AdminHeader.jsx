import React, { useState, useEffect } from 'react';
import { ShoppingCart, LayoutDashboard, Wifi, WifiOff, LogOut, User, Clock } from 'lucide-react';
import { fetchHealth } from '../../services/api';

export default function AdminHeader({ onSwitchToPos, currentUser, onLogout }) {
  const [time, setTime] = useState(new Date());
  const [serverOnline, setServerOnline] = useState(true);

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

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shadow-xs select-none">
      {/* Brand & Mode */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
          <LayoutDashboard className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Nova<span className="text-indigo-600">Mag</span>
            </h1>
            <span className="bg-slate-900 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              Backoffice
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Gestion des stocks, articles et utilisateurs</p>
        </div>
      </div>

      {/* User Info, Switch to POS & Logout */}
      <div className="flex items-center gap-3.5">
        {/* User Pill */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
          <User className="w-3.5 h-3.5 text-indigo-600" />
          <span>{currentUser?.full_name || currentUser?.username || 'Administrateur'}</span>
          <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase">
            Admin
          </span>
        </div>

        {/* Switch to POS button */}
        <button
          type="button"
          onClick={onSwitchToPos}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Caisse POS</span>
        </button>

        <div className="h-5 w-px bg-slate-200"></div>

        {/* Server Status */}
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
        <div className="text-slate-600 font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{time.toLocaleTimeString('fr-FR')}</span>
        </div>

        <div className="h-5 w-px bg-slate-200"></div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 rounded-lg text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
          title="Fermer la session"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Quitter</span>
        </button>
      </div>
    </header>
  );
}
