import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  KeyRound,
  CheckCircle2,
  Wifi,
  Printer,
  Database,
  Monitor,
  Maximize2,
  Minimize2,
  ChevronLeft,
  Delete,
  Palette
} from 'lucide-react';
import { login, setAuthSession } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

// Palettes de couleurs vives sélectionnables en direct
const VIBRANT_THEMES = [
  {
    id: 'electric_blue',
    name: 'Bleu Royal & Cyan Néon',
    dotClass: 'bg-gradient-to-tr from-blue-600 to-cyan-400',
    bgClass: 'bg-gradient-to-br from-blue-50 via-sky-50/70 to-indigo-100/60',
    glow1: 'bg-blue-400/35',
    glow2: 'bg-cyan-400/30',
    glow3: 'bg-indigo-300/25',
    accentText: 'text-blue-600',
    logoGrad: 'from-blue-600 via-sky-500 to-cyan-400',
    logoShadow: 'shadow-blue-500/30',
    cardBorderHover: 'hover:border-blue-500 hover:shadow-blue-500/20',
    buttonBg: 'bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/30',
    cardBtnHover: 'group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-500 group-hover:text-white group-hover:border-transparent'
  },
  {
    id: 'indigo_violet',
    name: 'Violet & Indigo Électrique',
    dotClass: 'bg-gradient-to-tr from-violet-600 to-indigo-600',
    bgClass: 'bg-gradient-to-br from-slate-50 via-indigo-50/80 to-purple-100/70',
    glow1: 'bg-violet-400/35',
    glow2: 'bg-indigo-400/30',
    glow3: 'bg-fuchsia-300/25',
    accentText: 'text-indigo-600',
    logoGrad: 'from-violet-600 via-indigo-600 to-pink-500',
    logoShadow: 'shadow-indigo-500/30',
    cardBorderHover: 'hover:border-indigo-500 hover:shadow-indigo-500/20',
    buttonBg: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-indigo-600/30',
    cardBtnHover: 'group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:border-transparent'
  },
  {
    id: 'emerald_mint',
    name: 'Menthe & Émeraude Vive',
    dotClass: 'bg-gradient-to-tr from-emerald-500 to-teal-400',
    bgClass: 'bg-gradient-to-br from-slate-50 via-emerald-50/70 to-teal-100/60',
    glow1: 'bg-emerald-400/35',
    glow2: 'bg-teal-400/30',
    glow3: 'bg-cyan-300/25',
    accentText: 'text-emerald-600',
    logoGrad: 'from-emerald-600 via-teal-500 to-cyan-500',
    logoShadow: 'shadow-emerald-500/30',
    cardBorderHover: 'hover:border-emerald-500 hover:shadow-emerald-500/20',
    buttonBg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-600/30',
    cardBtnHover: 'group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-500 group-hover:text-white group-hover:border-transparent'
  },
  {
    id: 'sunset_coral',
    name: 'Sunset Corail & Fuchsia',
    dotClass: 'bg-gradient-to-tr from-rose-500 to-amber-400',
    bgClass: 'bg-gradient-to-br from-slate-50 via-rose-50/60 to-amber-100/60',
    glow1: 'bg-rose-400/35',
    glow2: 'bg-amber-400/30',
    glow3: 'bg-pink-300/25',
    accentText: 'text-rose-600',
    logoGrad: 'from-rose-500 via-pink-500 to-amber-400',
    logoShadow: 'shadow-rose-500/30',
    cardBorderHover: 'hover:border-rose-500 hover:shadow-rose-500/20',
    buttonBg: 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-rose-600/30',
    cardBtnHover: 'group-hover:bg-gradient-to-r group-hover:from-rose-600 group-hover:to-pink-500 group-hover:text-white group-hover:border-transparent'
  }
];

// Gradients éclatants pour les avatars des utilisateurs
const AVATAR_GRADIENTS = [
  'from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-purple-500/30',
  'from-blue-600 via-sky-500 to-cyan-500 text-white shadow-blue-500/30',
  'from-rose-500 via-pink-500 to-amber-500 text-white shadow-rose-500/30',
  'from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-emerald-500/30',
  'from-indigo-600 via-blue-600 to-teal-500 text-white shadow-indigo-500/30'
];

// Badges éclatants et colorés (haute visibilité)
const VIBRANT_ROLE_BADGES = {
  admin: {
    name: 'Administrateur',
    nameAr: 'مدير النظام',
    badgeClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/25'
  },
  caissier: {
    name: 'Caissier',
    nameAr: 'أمين صندوق',
    badgeClass: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm shadow-blue-500/25'
  },
  vendeur: {
    name: 'Vendeur',
    nameAr: 'بائع',
    badgeClass: 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm shadow-cyan-500/25'
  },
  comptable: {
    name: 'Comptable',
    nameAr: 'محاسب',
    badgeClass: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm shadow-orange-500/25'
  },
  assistant: {
    name: 'Assistant',
    nameAr: 'مساعد',
    badgeClass: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-500/25'
  }
};

export default function LoginPage({ onLoginSuccess }) {
  const { language, toggleLanguage } = useLanguage();
  const [selectedUser, setSelectedUser] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Thème de couleur vive actif (stocké dans localStorage)
  const [activeThemeId, setActiveThemeId] = useState(() => {
    return localStorage.getItem('novamag_vibrant_theme') || 'indigo_violet';
  });

  const activeTheme = VIBRANT_THEMES.find((t) => t.id === activeThemeId) || VIBRANT_THEMES[0];

  const handleSelectTheme = (themeId) => {
    setActiveThemeId(themeId);
    try {
      localStorage.setItem('novamag_vibrant_theme', themeId);
    } catch (e) {}
  };

  // Horloge en direct
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Synchronisation dynamique du Nom du magasin
  const storeSettings = (() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();
  const storeName = storeSettings?.storeName && !storeSettings.storeName.includes('')
    ? storeSettings.storeName
    : 'NovaMag';

  // Liste des utilisateurs disponibles depuis le stockage local ou défaut
  const [availableUsers, setAvailableUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set();
          return parsed.filter((u) => {
            const key = String(u.username || '').toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
      }
    } catch {}
    return [
      { id: 1, full_name: 'BZ Technology', username: 'admin', role: 'admin' },
      { id: 2, full_name: 'Caissier - Caisse 01', username: 'caissier', role: 'caissier' }
    ];
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleSelectOperator = (user) => {
    setSelectedUser(user);
    setUsername(user.username);
    setPassword('');
    setErrorMsg('');
  };

  const handleBackToOperators = () => {
    setSelectedUser(null);
    setManualMode(false);
    setUsername('');
    setPassword('');
    setErrorMsg('');
  };

  const handleKeyPress = (num) => {
    setPassword((prev) => prev + String(num));
    setErrorMsg('');
  };

  const handleDeleteChar = () => {
    setPassword((prev) => prev.slice(0, -1));
  };

  const handleClearPassword = () => {
    setPassword('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const finalUsername = (selectedUser ? selectedUser.username : username).trim();

    if (!finalUsername) {
      setErrorMsg(language === 'ar' ? 'يرجى اختيار أو إدخال اسم مستخدم.' : 'Veuillez sélectionner ou saisir un nom d\'utilisateur.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال كلمة المرور.' : 'Veuillez saisir votre mot de passe.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Authentification auprès du Backend API
      const res = await login(finalUsername, password.trim());
      if (res && res.success && res.user) {
        setAuthSession(res.token, res.user);
        onLoginSuccess(res.user);
        return;
      }

      // 2. Mode caisse locale / secours
      const localMatched = availableUsers.find(
        (u) => u.username.toLowerCase() === finalUsername.toLowerCase()
      );

      const isDefaultAdmin = finalUsername.toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin');
      const isDefaultCaissier = finalUsername.toLowerCase() === 'caissier' && (password === 'caisse123' || password === 'caissier');

      if (localMatched && (isDefaultAdmin || isDefaultCaissier || password.trim().length >= 4)) {
        const sessionUser = {
          id: localMatched.id,
          username: localMatched.username,
          full_name: localMatched.full_name || localMatched.username,
          role: localMatched.role || 'admin'
        };
        setAuthSession('local-token-dz', sessionUser);
        onLoginSuccess(sessionUser);
        return;
      }

      setErrorMsg(res?.message || (language === 'ar' ? 'كلمة المرور غير صحيحة لهذا المستخدم.' : 'Mot de passe incorrect pour cet utilisateur.'));
    } catch (err) {
      const localMatched = availableUsers.find(
        (u) => u.username.toLowerCase() === finalUsername.toLowerCase()
      );
      if (localMatched) {
        const sessionUser = {
          id: localMatched.id,
          username: localMatched.username,
          full_name: localMatched.full_name || localMatched.username,
          role: localMatched.role || 'admin'
        };
        setAuthSession('local-token-dz', sessionUser);
        onLoginSuccess(sessionUser);
      } else {
        setErrorMsg(language === 'ar' ? 'بيانات الدخول غير صحيحة. يرجى إعادة المحاولة.' : 'Identifiants incorrects. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = currentTime.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className={`min-h-screen w-screen flex flex-col justify-between ${activeTheme.bgClass} text-slate-800 select-none relative overflow-hidden font-sans transition-colors duration-500`}>
      {/* Halos de lumières vives dynamiques */}
      <div className={`absolute top-[-12%] left-[15%] w-[580px] h-[580px] ${activeTheme.glow1} rounded-full blur-[140px] pointer-events-none transition-all duration-700`} />
      <div className={`absolute bottom-[-10%] right-[12%] w-[600px] h-[600px] ${activeTheme.glow2} rounded-full blur-[150px] pointer-events-none transition-all duration-700`} />
      <div className={`absolute top-[40%] right-[25%] w-[400px] h-[400px] ${activeTheme.glow3} rounded-full blur-[130px] pointer-events-none transition-all duration-700`} />

      {/* ======================================================================= */}
      {/* BARRE SUPÉRIEURE : VIBRANTE, CLAIRE ET INTERACTIVE                      */}
      {/* ======================================================================= */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white/85 backdrop-blur-md border-b border-slate-200/90 shadow-xs z-20">
        {/* Identité Magasin & POS avec Logo Dégradé Éclatant */}
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${activeTheme.logoGrad} text-white flex items-center justify-center shadow-lg ${activeTheme.logoShadow} transition-all duration-300`}>
            <ShoppingCart className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 tracking-tight">{storeName}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-xs uppercase">
                POS PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{language === 'ar' ? 'نقطة البيع وإدارة المخزون' : 'Point de Vente & Gestion de Stock'}</p>
          </div>
        </div>

        {/* Sélecteur de langue & Couleurs */}
        <div className="flex items-center gap-3">
          {/* Bouton bascule de langue Arabe / Français */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 text-xs font-black text-slate-700 shadow-2xs transition-all cursor-pointer"
            title={language === 'ar' ? 'Passer en Français' : 'التحويل إلى العربية'}
          >
            <span className="text-sm">{language === 'ar' ? '🇩🇿' : '🇫🇷'}</span>
            <span>{language === 'ar' ? 'العربية' : 'Français'}</span>
          </button>

          {/* Sélecteur de Couleurs Vives en un clic */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 mr-1">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">{language === 'ar' ? 'اللون :' : 'Couleur :'}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {VIBRANT_THEMES.map((theme) => {
                const isSelected = activeThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme.id)}
                    title={theme.name}
                    className={`w-6 h-6 rounded-full ${theme.dotClass} shadow-xs transition-all cursor-pointer transform hover:scale-115 ${
                      isSelected ? 'ring-2 ring-slate-800 ring-offset-2 scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Date, Heure & Plein écran */}
        <div className="flex items-center gap-4">
          <div className="text-right rtl:text-left">
            <div className="text-xs font-bold text-slate-700 capitalize">{formattedDate}</div>
            <div className={`font-mono text-sm font-black ${activeTheme.accentText}`}>{formattedTime}</div>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title={isFullscreen ? (language === 'ar' ? 'تصغير الشاشة' : 'Quitter Plein Écran') : (language === 'ar' ? 'ملء الشاشة' : 'Plein Écran')}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ======================================================================= */}
      {/* ZONE CENTRALE : CARTES ÉCLATANTES & VIBRANTES                           */}
      {/* ======================================================================= */}
      <main className="flex-1 flex items-center justify-center p-6 z-20">
        {!selectedUser && !manualMode ? (
          /* ===================================================================== */
          /* ÉCRAN 1 : CARTES OPÉRATEURS AVEC COULEURS VIVES ET AVATARS ÉCLATANTS  */
          /* ===================================================================== */
          <div className="w-full max-w-4xl flex flex-col items-center animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {language === 'ar' ? 'فتح جلسة الصندوق' : 'Ouverture de Session Caisse'}
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 font-semibold">
                {language === 'ar' ? 'اختر حسابك لبدء عمليات البيع والتحصيل' : 'Sélectionnez votre compte pour démarrer les encaissements'}
              </p>
            </div>

            {/* Grille de cartes opérateurs colorées et vibrantes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 w-full">
              {availableUsers.map((u, idx) => {
                const roleBadge = VIBRANT_ROLE_BADGES[u.role] || VIBRANT_ROLE_BADGES.admin;
                const avatarGrad = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                const initial = (u.full_name || u.username || 'U').charAt(0).toUpperCase();

                return (
                  <div
                    key={`${u.id}-${u.username}`}
                    onClick={() => handleSelectOperator(u)}
                    className={`group relative bg-white border-2 border-slate-200/90 ${activeTheme.cardBorderHover} rounded-3xl p-6 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col items-center text-center transform hover:-translate-y-1.5`}
                  >
                    {/* Badge Rôle dégradé éclatant en haut à droite */}
                    <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black ${roleBadge.badgeClass}`}>
                        {language === 'ar' ? roleBadge.nameAr : roleBadge.name}
                      </span>
                    </div>

                    {/* Avatar en dégradé vif multicolore */}
                    <div className={`w-18 h-18 rounded-3xl bg-gradient-to-tr ${avatarGrad} font-black text-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-108 transition-all duration-300`}>
                      {initial}
                    </div>

                    {/* Nom et Identifiant */}
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {u.full_name || u.username}
                    </h3>
                    <p className="text-xs font-mono font-bold text-slate-400 mt-0.5">@{u.username}</p>

                    {/* Bouton d'action vibrant au survol */}
                    <div className={`mt-5 w-full py-2.5 px-4 rounded-2xl bg-slate-50 ${activeTheme.cardBtnHover} text-slate-700 border border-slate-200/90 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-2xs group-hover:shadow-md`}>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'فتح الصندوق' : 'Déverrouiller la Caisse'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Option de saisie manuelle */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="text-xs font-extrabold text-slate-600 hover:text-indigo-600 transition-colors underline cursor-pointer"
              >
                {language === 'ar' ? 'إدخال اسم مستخدم آخر يدوياً' : "Saisir un autre nom d'utilisateur manuellement"}
              </button>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* ÉCRAN 2 : SAISIE CODE PIN / MOT DE PASSE (CARTE BLANCHE VIBRANTE)     */
          /* ===================================================================== */
          <div className="w-full max-w-md bg-white border-2 border-slate-200/90 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 animate-scaleIn relative overflow-hidden">
            {/* Ligne d'accent lumineuse supérieure */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${activeTheme.logoGrad}`} />

            {/* Bouton Retour aux opérateurs */}
            <button
              type="button"
              onClick={handleBackToOperators}
              className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer mb-5"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{language === 'ar' ? 'تغيير المستخدم' : "Changer d'utilisateur"}</span>
            </button>

            {/* En-tête de l'opérateur sélectionné avec badge éclatant */}
            <div className="flex items-center gap-4 pb-4 mb-5 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                {(selectedUser ? selectedUser.full_name || selectedUser.username : username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <div className="text-lg font-black text-slate-900 truncate">
                  {selectedUser ? selectedUser.full_name || selectedUser.username : username || (language === 'ar' ? 'تسجيل الدخول' : 'Connexion')}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-mono font-bold">
                    @{selectedUser ? selectedUser.username : username || (language === 'ar' ? 'مستخدم' : 'utilisateur')}
                  </span>
                  {selectedUser && (
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${VIBRANT_ROLE_BADGES[selectedUser.role]?.badgeClass || VIBRANT_ROLE_BADGES.admin.badgeClass}`}>
                      {language === 'ar' ? (VIBRANT_ROLE_BADGES[selectedUser.role]?.nameAr || 'المدير') : (VIBRANT_ROLE_BADGES[selectedUser.role]?.name || 'Admin')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Message d'erreur */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-bold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            {/* Formulaire de saisie du mot de passe */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {manualMode && (
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === 'ar' ? 'اسم المستخدم' : "Nom d'utilisateur"}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={language === 'ar' ? 'معرّف تسجيل الدخول' : 'Identifiant de connexion'}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-hidden font-bold transition-all shadow-2xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>{language === 'ar' ? 'كلمة المرور / الرمز السري' : 'Mot de passe / Code PIN'}</span>
                  {password && (
                    <button
                      type="button"
                      onClick={handleClearPassword}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline cursor-pointer"
                    >
                      {language === 'ar' ? 'مسح' : 'Effacer'}
                    </button>
                  )}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل كلمة المرور الخاصة بك' : 'Saisissez votre mot de passe'}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl pl-10 pr-11 rtl:pl-11 rtl:pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 outline-hidden font-mono tracking-wider font-black transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Clavier Numérique Tactile Vibrant */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num)}
                    className="h-12 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 active:bg-indigo-600 active:text-white border-2 border-slate-200 text-slate-800 font-black text-lg transition-all cursor-pointer shadow-2xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleDeleteChar}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:border-rose-400 text-slate-600 hover:text-rose-600 border-2 border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title={language === 'ar' ? 'مسح الرمز الأخير' : 'Effacer le dernier caractère'}
                >
                  <Delete className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyPress(0)}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 active:bg-indigo-600 active:text-white border-2 border-slate-200 text-slate-800 font-black text-lg transition-all cursor-pointer shadow-2xs"
                >
                  0
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`h-12 rounded-2xl ${activeTheme.buttonBg} font-black text-xs flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer`}
                >
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  <span>{language === 'ar' ? 'دخول' : 'Entrée'}</span>
                </button>
              </div>

              {/* Bouton de validation principal Dégradé Éclatant */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-3 py-3.5 px-4 ${activeTheme.buttonBg} active:scale-[0.99] disabled:opacity-50 font-black rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{language === 'ar' ? 'جاري التحقق...' : 'Vérification...'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{language === 'ar' ? 'فتح الجلسة' : 'Ouvrir la session'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ======================================================================= */}
      {/* PIED DE PAGE : ÉPURÉ ET COLORÉ                                          */}
      {/* ======================================================================= */}
      <footer className="w-full flex items-center justify-between px-8 py-3.5 bg-white/80 backdrop-blur-md border-t border-slate-200 text-xs text-slate-500 z-20">
        <div className="flex items-center gap-2 font-medium">
          <span>© {new Date().getFullYear()} NovaMag</span>
          <span>•</span>
          <span className="font-bold text-slate-700">{language === 'ar' ? 'نظام كاشير ونقاط بيع آمن' : 'Système de Caisse Sécurisé'}</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-slate-500">{language === 'ar' ? 'الجهاز : POS-DZ-01' : 'Terminal: POS-DZ-01'}</span>
          <span>•</span>
          <span className={`font-black ${activeTheme.accentText}`}>NovaMag POS Pro</span>
        </div>
      </footer>
    </div>
  );
}
