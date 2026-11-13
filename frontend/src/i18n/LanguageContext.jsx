import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_language');
      if (saved === 'ar' || saved === 'fr') return saved;
      
      const sysSaved = localStorage.getItem('novamag_system_settings');
      if (sysSaved) {
        const parsed = JSON.parse(sysSaved);
        if (parsed.language === 'ar' || parsed.language === 'fr') return parsed.language;
      }
      return 'fr';
    } catch {
      return 'fr';
    }
  });

  const isRTL = language === 'ar';

  const applyDirection = useCallback((lang) => {
    if (typeof document !== 'undefined') {
      const isArabic = lang === 'ar';
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
      if (isArabic) {
        document.body.classList.add('rtl-active');
      } else {
        document.body.classList.remove('rtl-active');
      }
    }
  }, []);

  useEffect(() => {
    applyDirection(language);
  }, [language, applyDirection]);

  const setLanguage = useCallback((newLang) => {
    const lang = newLang === 'ar' ? 'ar' : 'fr';
    setLanguageState(lang);
    try {
      localStorage.setItem('novamag_language', lang);
      
      const sysSaved = localStorage.getItem('novamag_system_settings');
      const parsed = sysSaved ? JSON.parse(sysSaved) : {};
      parsed.language = lang;
      localStorage.setItem('novamag_system_settings', JSON.stringify(parsed));
      
      window.dispatchEvent(new Event('novamag_language_changed'));
      window.dispatchEvent(new Event('novamag_settings_updated'));
    } catch (e) {}
    applyDirection(lang);
  }, [applyDirection]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'fr' ? 'ar' : 'fr');
  }, [language, setLanguage]);

  // Écouter les changements externes de paramètres (ex: depuis ParametresView)
  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const saved = localStorage.getItem('novamag_language');
        if (saved && saved !== language && (saved === 'ar' || saved === 'fr')) {
          setLanguageState(saved);
          applyDirection(saved);
        } else {
          const sysSaved = localStorage.getItem('novamag_system_settings');
          if (sysSaved) {
            const parsed = JSON.parse(sysSaved);
            if (parsed.language && parsed.language !== language && (parsed.language === 'ar' || parsed.language === 'fr')) {
              setLanguageState(parsed.language);
              applyDirection(parsed.language);
            }
          }
        }
      } catch (e) {}
    };

    window.addEventListener('novamag_language_changed', handleSettingsUpdate);
    window.addEventListener('novamag_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('novamag_language_changed', handleSettingsUpdate);
      window.removeEventListener('novamag_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, [language, applyDirection]);

  // Fonction de traduction sécurisée avec résolution imbriquée (ex: t('nav_items.pos'))
  const t = useCallback((path, fallback = '') => {
    if (!path) return fallback;
    const dict = translations[language] || translations.fr;
    const parts = path.split('.');
    let cur = dict;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) {
        cur = cur[p];
      } else {
        // Fallback vers le dictionnaire français
        let frCur = translations.fr;
        for (const fp of parts) {
          if (frCur && typeof frCur === 'object' && fp in frCur) {
            frCur = frCur[fp];
          } else {
            return fallback || path;
          }
        }
        return frCur || fallback || path;
      }
    }
    return typeof cur === 'string' ? cur : (fallback || path);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback gracieux si utilisé hors provider
    return {
      language: 'fr',
      setLanguage: () => {},
      toggleLanguage: () => {},
      isRTL: false,
      t: (path, fallback) => fallback || path
    };
  }
  return context;
}
