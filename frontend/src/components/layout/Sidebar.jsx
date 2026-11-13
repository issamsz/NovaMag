import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Receipt,
  DollarSign,
  Package,
  Boxes,
  Tag,
  ClipboardList,
  Truck,
  ShoppingBag,
  Users,
  UserCheck,
  Settings,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  FileText,
  FileCheck,
  LogOut,
  ChevronDown,
  Sparkles,
  Camera,
  Smartphone
} from 'lucide-react';
import { canAccessView } from '../../services/permissions';
import { useLanguage } from '../../i18n/LanguageContext';

// Safe Barcode SVG Icon
const BarcodeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" {...props}>
    <path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14" />
  </svg>
);

const NAV_GROUPS = [
  {
    id: 'sales',
    label: 'Ventes & Caisse',
    labelAr: 'المبيعات والصندوق',
    items: [
      { id: 'pos',           label: 'Point de Vente',       labelAr: 'نقطة البيع',         icon: ShoppingCart },
      { id: 'sales_history', label: 'Journal des Ventes',   labelAr: 'سجل المبيعات',       icon: Receipt      },
      { id: 'cash_drawer',   label: 'Caisse & Clôture',     labelAr: 'إدارة الصندوق',     icon: DollarSign   },
    ]
  },
  {
    id: 'stock',
    label: 'Stock & Articles',
    labelAr: 'المخزon والمنتجات',
    items: [
      { id: 'products',   label: 'Articles & Stock',      labelAr: 'المنتجات والمخزون',   icon: Package      },
      { id: 'packs',      label: 'Packs & Fardeaux',      labelAr: 'العروض والحزم',       icon: Boxes        },
      { id: 'promotions', label: 'Remises & Promotions',  labelAr: 'التخفيضات والعروض',   icon: Tag          },
      { id: 'inventory',  label: 'Inventaire & Alertes',  labelAr: 'الجرد والتنبيهات',    icon: ClipboardList},
      { id: 'barcodes',   label: 'Codes-barres',          labelAr: 'طباعة الباركود',      icon: BarcodeIcon  },
    ]
  },
  {
    id: 'purchases_crm',
    label: 'Achats & Tiers',
    labelAr: 'المشتريات والمتعاملون',
    items: [
      { id: 'purchases', label: 'Factures Achats',       labelAr: 'فواتير المشتريات',   icon: ShoppingBag  },
      { id: 'suppliers', label: 'Fournisseurs',           labelAr: 'الموردون',           icon: Truck        },
      { id: 'customers', label: 'Clients',                labelAr: 'الزبائن والعملاء',   icon: Users        },
      { id: 'users',     label: 'Utilisateurs & Rôles',   labelAr: 'المستخدمون والأدوار',icon: UserCheck    },
    ]
  },
  {
    id: 'finance',
    label: 'Finance & Documents',
    labelAr: 'المالية والمستندات',
    items: [
      { id: 'proforma',    label: 'Factures Pro-forma',   labelAr: 'الفواتير الشكلية',   icon: FileText     },
      { id: 'order_forms', label: 'Bons de Commande',     labelAr: 'أوامر الشراء',       icon: FileCheck    },
      { id: 'reports',     label: 'Statistiques & Rapports', labelAr: 'التقارير والإحصائيات', icon: BarChart3 },
    ]
  },
  {
    id: 'system',
    label: 'Système',
    labelAr: 'النظام والإعدادات',
    items: [
      { id: 'settings', label: 'Paramètres',             labelAr: 'إعدادات النظام',     icon: Settings     },
      { id: 'mobile_companion', label: 'App Mobile PWA 📱',    labelAr: 'تطبيق الهاتف PWA 📱',             icon: Smartphone }
    ]
  }
  /*
  // Fonctionnalités IA désactivées temporairement
  {
    id: 'ai_copilot',
    label: 'NovaIA ✨',
    labelAr: 'الذكاء الاصطناعي ✨',
    items: [
      { id: 'nova_ia',          label: 'NovaIA Copilot ✨',    labelAr: 'مساعد NovaIA الذكي ✨',            icon: Sparkles,   isAi: true },
      { id: 'ocr_invoice',      label: 'Scanner Facture IA ✨', labelAr: 'مسح الفواتير بالذكاء الاصطناعي ✨', icon: Camera,     isAi: true },
      { id: 'mobile_companion', label: 'App Mobile PWA 📱',    labelAr: 'تطبيق الهاتف PWA 📱',             icon: Smartphone, isAi: true }
    ]
  }
  */
];

// Principaux éléments affichés en mode compact (icônes seules)
const COMPACT_ITEMS = [
  { id: 'pos',              label: 'Vente',        labelAr: 'البيع',         icon: ShoppingCart },
  { id: 'products',         label: 'Stock',        labelAr: 'المخزون',       icon: Package      },
  { id: 'reports',          label: 'Rapports',     labelAr: 'التقارير',      icon: BarChart3    },
  { id: 'customers',        label: 'Clients',      labelAr: 'الزبائن',       icon: Users        },
  { id: 'suppliers',        label: 'Fournisseurs', labelAr: 'الموردون',      icon: Truck        },
  { id: 'proforma',         label: 'Pro-forma',    labelAr: 'فاتورة شكلية',  icon: FileText     },
  { id: 'order_forms',      label: 'Commande',     labelAr: 'طلبيات',        icon: FileCheck    },
  { id: 'settings',         label: 'Paramètres',   labelAr: 'الإعدادات',     icon: Settings     },
  { id: 'mobile_companion', label: 'Mobile 📱',    labelAr: 'الهاتف 📱',     icon: Smartphone },
  // { id: 'nova_ia',          label: 'NovaIA ✨',    labelAr: 'NovaIA ✨',     icon: Sparkles,   isAi: true },
];

export default function Sidebar({ activeView, setActiveView, onLogout }) {
  const { isRTL, language } = useLanguage();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_sidebar_collapsed');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [expandedGroups, setExpandedGroups] = useState({
    ai_copilot: true,
    sales: true,
    stock: true,
    purchases_crm: true,
    finance: true,
    system: true
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('novamag_sidebar_collapsed', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('novamag_user');
      return stored ? JSON.parse(stored) : { full_name: 'BZ Technology', username: 'admin', role: 'admin' };
    } catch {
      return { full_name: 'BZ Technology', username: 'admin', role: 'admin' };
    }
  });

  useEffect(() => {
    const handleUserUpdate = () => {
      try {
        const stored = localStorage.getItem('novamag_user');
        if (stored) setCurrentUser(JSON.parse(stored));
      } catch (e) {}
    };
    window.addEventListener('novamag_user_updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);
    return () => {
      window.removeEventListener('novamag_user_updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const displayName = currentUser?.full_name || currentUser?.username || 'BZ Technology';
  const userInitial = (displayName || 'B')[0].toUpperCase();
  const roleDisplay = (currentUser?.role || 'admin').toUpperCase();

  return (
    <aside
      className={`relative flex flex-col h-full max-h-screen min-h-0 bg-[#06122C] text-slate-100 ${
        isRTL ? 'border-l' : 'border-r'
      } border-[#0D2254] shrink-0 z-40 select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      {/* ── Bouton Toggle Intégré (Parfaitement aligné dans le menu, sans aucun débordement extérieur) ── */}
      <div className="shrink-0 px-2 py-2 border-b border-[#0D2254] flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 pl-1">
            {language === 'ar' ? 'القائمة' : 'Navigation'}
          </span>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          className={`${
            isCollapsed ? 'w-full h-8' : 'w-7 h-7'
          } rounded-xl bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95`}
          title={isCollapsed ? (language === 'ar' ? 'توسيع القائمة' : 'Déplier le menu') : (language === 'ar' ? 'تصغير القائمة' : 'Réduire le menu')}
        >
          {isCollapsed ? (
            isRTL ? <ChevronLeft className="w-4 h-4 stroke-[2.5]" /> : <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          ) : (
            isRTL ? <ChevronRight className="w-4 h-4 stroke-[2.5]" /> : <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* ── CONTENU DU MENU : MODE EXPANSÉ (Avec Sous-Menus Complets) ── */}
      {!isCollapsed ? (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scrollbar-thin">
          {NAV_GROUPS.map((group) => {
            const isGroupOpen = expandedGroups[group.id] !== false;

            return (
              <div key={group.id} className="space-y-1">
                {/* En-tête de Groupe avec accordéon */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <span>{language === 'ar' ? group.labelAr : group.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isGroupOpen ? 'rotate-0' : '-rotate-90'}`} />
                </button>

                {/* Sous-menus du groupe */}
                {isGroupOpen && (
                  <div className="space-y-0.5 pl-1 rtl:pl-0 rtl:pr-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveView(item.id)}
                          className={`w-full py-2 px-2.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer text-left rtl:text-right ${
                            isActive
                              ? (item.isAi
                                  ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/30 font-black ring-1 ring-purple-300/40'
                                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20 font-black')
                              : (item.isAi
                                  ? 'text-purple-300 hover:text-white hover:bg-purple-950/40 bg-purple-950/20 border border-purple-500/30 font-bold'
                                  : 'text-slate-300 hover:text-white hover:bg-white/5 font-semibold')
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? (item.isAi ? 'text-amber-300 animate-pulse' : 'text-white')
                              : (item.isAi ? 'text-amber-400' : 'text-slate-400')
                          }`} />
                          <span className="text-xs truncate">
                            {language === 'ar' ? item.labelAr : item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── CONTENU DU MENU : MODE COMPACT (76px) ── */
        <div className="flex-1 overflow-y-auto py-2 px-1.5 flex flex-col items-center space-y-2 scrollbar-none">
          {COMPACT_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`w-full py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? (item.isAi
                        ? 'bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/40 ring-1 ring-amber-300/40'
                        : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/35 ring-1 ring-white/20')
                    : (item.isAi
                        ? 'text-purple-300 hover:text-white hover:bg-purple-900/40 bg-purple-950/30 border border-purple-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/10')
                }`}
                title={language === 'ar' ? item.labelAr : item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${
                  isActive
                    ? (item.isAi ? 'text-amber-300 animate-pulse' : 'text-white')
                    : (item.isAi ? 'text-amber-400' : 'text-slate-300')
                }`} />
                <span className={`text-[10px] mt-1 tracking-tight truncate leading-tight ${isActive ? 'font-black text-white' : 'font-semibold text-slate-300'}`}>
                  {language === 'ar' ? item.labelAr : item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── PIED DU MENU : CARTE UTILISATEUR & MENU POPUP ── */}
      <div className="relative p-2.5 border-t border-[#0D2254]" ref={userMenuRef}>
        {/* Menu Popover (Affiché au-dessus de la carte) */}
        {isUserMenuOpen && (
          <div
            className={`absolute z-50 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-2.5 text-slate-800 dark:text-slate-100 animate-scaleIn ${
              isCollapsed
                ? (isRTL ? 'right-full bottom-0 mr-2 w-64' : 'left-full bottom-0 ml-2 w-64')
                : 'bottom-full left-2 right-2 mb-2 w-auto'
            }`}
          >
            {/* En-tête du profil utilisateur (Conforme photo) */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 mb-2 border border-slate-100 dark:border-slate-800/80">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {displayName}
                </div>
                <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {roleDisplay}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {/* 1. Utilisateurs */}
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setActiveView('users');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left rtl:text-right"
              >
                <Users className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{language === 'ar' ? 'المستخدمون' : 'Utilisateurs'}</span>
              </button>

              {/* 2. Paramètres (Ouvre directement le volet Compte) */}
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  try {
                    localStorage.setItem('novamag_settings_target_tab', 'account');
                    window.dispatchEvent(new CustomEvent('novamag_navigate_settings_tab', { detail: 'account' }));
                  } catch (e) {}
                  setActiveView('settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left rtl:text-right"
              >
                <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{language === 'ar' ? 'الإعدادات' : 'Paramètres'}</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

              {/* 3. Déconnexion */}
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onLogout && onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left rtl:text-right"
              >
                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Déclencheur : Carte profil en bas de la barre */}
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-11 h-11 mx-auto rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-blue-600/30 cursor-pointer transition-all active:scale-95 border border-blue-400/40"
            title={`${displayName} (${roleDisplay})`}
          >
            {userInitial}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group active:scale-98"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
                {userInitial}
              </div>
              <div className="text-left rtl:text-right min-w-0">
                <div className="text-xs font-black text-white truncate group-hover:text-cyan-300 transition-colors">
                  {displayName}
                </div>
                <span className="inline-block text-[9px] font-black uppercase tracking-wider text-slate-300 bg-white/10 px-1.5 py-0.2 rounded-md">
                  {roleDisplay}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>
        )}
      </div>
    </aside>
  );
}
