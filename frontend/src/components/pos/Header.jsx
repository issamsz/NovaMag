import React, { useState, useEffect } from 'react';
import { ShoppingCart, Wifi, WifiOff, Clock, User, ShieldCheck, LayoutDashboard, LogOut, ShieldAlert } from 'lucide-react';
import { fetchHealth } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function Header({ 
  onSwitchToAdmin, 
  currentUser, 
  onLogout,
  isReturnMode = false,
  onToggleReturnMode,
  onOpenZReport,
  showQuickItems = false,
  onToggleQuickItems
}) {
  const { language } = useLanguage();
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
    const healthInterval = setInterval(checkServer, 10000);
    return () => clearInterval(healthInterval);
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-white dark:bg-[#111C35] border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between shadow-xs select-none shrink-0">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
          <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-0.5">
              <span>Nova</span><span className="text-indigo-600">Mag</span>
            </h1>
            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-indigo-100 dark:border-indigo-800">
              POS v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {language === 'ar' ? 'إدارة المخزون ونقطة بيع فائقة السرعة' : 'Gestion de Stock & Point de Vente Ultra-rapide'}
          </p>
        </div>
      </div>

      {/* Center Info / User & Shift Info */}
      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 px-3.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold">
          <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-indigo-600' : 'bg-emerald-500'}`}></div>
          <User className="w-3.5 h-3.5 text-indigo-600" />
          <span>{language === 'ar' ? 'المستخدم :' : 'Utilisateur :'} <strong className="text-slate-900 dark:text-white">{currentUser?.full_name || currentUser?.username || (language === 'ar' ? 'أمين صندوق' : 'Caissier')}</strong></span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
            isAdmin ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
          }`}>
            {isAdmin ? (language === 'ar' ? 'المدير' : 'Admin') : (language === 'ar' ? 'أمين صندوق' : 'Caissier')}
          </span>
        </div>
        <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700"></div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'ar' ? 'الجهاز :' : 'Poste :'} <strong className="text-slate-800 dark:text-slate-200">Caisse #01</strong></span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2.5">
        {/* Toggle Articles Rapides (Pain, Œufs...) */}
        {onToggleQuickItems && (
          <button
            type="button"
            onClick={onToggleQuickItems}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              showQuickItems
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 ring-1 ring-amber-400 font-black shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
            title={language === 'ar' ? 'عرض أو إخفاء السلع السريعة (F6)' : 'Afficher ou masquer les raccourcis d\'articles rapides (F6)'}
          >
            <span className="text-sm">⚡</span>
            <span>{showQuickItems ? (language === 'ar' ? 'إخفاء السريعة' : 'Masquer Raccourcis') : (language === 'ar' ? 'سلع سريعة' : 'Articles Rapides')}</span>
            <span className="text-[10px] font-mono px-1 py-0.2 bg-black/10 rounded font-bold">F6</span>
          </button>
        )}

        {/* Toggle Mode Retour / Mode Vente Button */}
        {onToggleReturnMode && (
          <button
            type="button"
            onClick={onToggleReturnMode}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              isReturnMode
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
            title={language === 'ar' ? 'التبديل بين وضع البيع العادي ووضع إرجاع البضائع (F8)' : 'Basculer entre le mode Vente normale et le mode Retour marchandise (F8)'}
          >
            <span className="text-sm">🔄</span>
            <span>{isReturnMode ? (language === 'ar' ? 'وضع المرتجع نشط' : 'MODE RETOUR ACTIF') : (language === 'ar' ? 'وضع المرتجع' : 'Mode Retour')}</span>
            <span className="text-[10px] font-mono px-1 py-0.2 bg-black/20 rounded font-bold">F8</span>
          </button>
        )}

        {/* Ticket Z / Clôture de Caisse */}
        {onOpenZReport && (
          <button
            type="button"
            onClick={onOpenZReport}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title={language === 'ar' ? 'تقرير Z لإغلاق الصندوق (F9)' : 'Consulter ou imprimer le Ticket Z de clôture de caisse (F9)'}
          >
            <span className="text-sm">📊</span>
            <span>{language === 'ar' ? 'تقرير Z' : 'Ticket Z'}</span>
            <span className="text-[10px] font-mono px-1 py-0.2 bg-black/10 rounded font-bold">F9</span>
          </button>
        )}

        {/* Switch to Admin Dashboard button (ONLY for Admin) */}
        {isAdmin ? (
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
            title={language === 'ar' ? 'لوحة التحكم' : "Accéder au panneau d'administration"}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
            <span>{language === 'ar' ? 'الإدارة' : 'Administration'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            <span>{language === 'ar' ? 'وضع الصندوق' : 'Mode Caisse'}</span>
          </div>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>

        {/* Network status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${
          serverOnline 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {serverOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Wifi className="w-3 h-3" />
              <span>{language === 'ar' ? 'متصل' : 'Connecté'}</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <WifiOff className="w-3 h-3" />
              <span>{language === 'ar' ? 'غير متصل' : 'Hors ligne'}</span>
            </>
          )}
        </div>

        {/* Real-time Clock */}
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{time.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>

        {/* Logout button */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
          title={language === 'ar' ? 'تسجيل الخروج' : 'Fermer la session'}
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>{language === 'ar' ? 'خروج' : 'Quitter'}</span>
        </button>
      </div>
    </header>
  );
}
