import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Moon,
  Sun,
  Bell,
  Keyboard,
  HelpCircle,
  Maximize2,
  Minimize2,
  Search,
  ShoppingCart,
  Store,
  Languages,
  Calculator,
  Minus,
  Square,
  X,
  RefreshCw,
  MapPin,
  Wind,
  Droplets
} from 'lucide-react';
import NotificationsPopover from './NotificationsPopover';
import KeyboardShortcutsModal from '../common/KeyboardShortcutsModal';
import StockAlertPostIt from '../common/StockAlertPostIt';
import { useLanguage } from '../../i18n/LanguageContext';

// Safe Barcode SVG Icon
const BarcodeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14" />
  </svg>
);


// Liste des villes d'Algérie avec coordonnées GPS pour météo réelle Open-Meteo
const ALGERIAN_CITIES = [
  { name: 'Réghaia', lat: 36.737, lon: 3.340 },
  { name: 'Alger', lat: 36.7538, lon: 3.0588 },
  { name: 'Rouiba', lat: 36.738, lon: 3.283 },
  { name: 'Boumerdès', lat: 36.766, lon: 3.477 },
  { name: 'Blida', lat: 36.47, lon: 2.83 },
  { name: 'Tipaza', lat: 36.59, lon: 2.44 },
  { name: 'Oran', lat: 35.6971, lon: -0.6308 },
  { name: 'Constantine', lat: 36.365, lon: 6.6147 },
  { name: 'Sétif', lat: 36.19, lon: 5.41 },
  { name: 'Annaba', lat: 36.9, lon: 7.7667 },
  { name: 'Batna', lat: 35.55, lon: 6.17 },
  { name: 'Tizi Ouzou', lat: 36.71, lon: 4.05 },
  { name: 'Béjaïa', lat: 36.75, lon: 5.08 },
  { name: 'Biskra', lat: 34.85, lon: 5.73 },
  { name: 'Chlef', lat: 36.16, lon: 1.33 },
  { name: 'Mostaganem', lat: 35.93, lon: 0.09 },
  { name: 'Tlemcen', lat: 34.88, lon: -1.31 },
];

const getWeatherInfo = (code) => {
  if (code === 0) return { icon: '☀️', label: 'Ensoleillé' };
  if (code === 1 || code === 2) return { icon: '🌤️', label: 'Éclaircies' };
  if (code === 3) return { icon: '☁️', label: 'Nuageux' };
  if (code === 45 || code === 48) return { icon: '🌫️', label: 'Brouillard' };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { icon: '🌧️', label: 'Pluie' };
  if ([71, 73, 75, 85, 86].includes(code)) return { icon: '❄️', label: 'Neige' };
  if ([95, 96, 99].includes(code)) return { icon: '⛈️', label: 'Orageux' };
  return { icon: '🌤️', label: 'Clair' };
};

// Données d'alertes de rupture de stock (Post-it & Centre de Notifications)
const DEFAULT_STOCK_ALERTS = [
  {
    id: 'alert-stock-baguette',
    titre: 'Rupture de Stock Critique ⚠️',
    title: 'Rupture de Stock Critique ⚠️',
    message: 'Le produit « Pain Baguette Tradition » est en rupture totale (0 unité en rayon). Réapprovisionnement urgent !',
    date: 'Aujourd\'hui à 17:30',
    time: '17:30',
    type: 'danger',
    severity: 'danger',
    category: 'stock',
    productName: 'Pain Baguette Tradition',
    stock: 0,
    actionLabel: 'Commander'
  },
  {
    id: 'alert-stock-candia',
    titre: 'Stock Faible (Seuil Minimum) ⚠️',
    title: 'Stock Faible (Seuil Minimum) ⚠️',
    message: '« Lait Candia Silhouette 1L » : plus que 2 unités disponibles (seuil minimum : 10).',
    date: 'Aujourd\'hui à 18:15',
    time: '18:15',
    type: 'warning',
    severity: 'warning',
    category: 'stock',
    productName: 'Lait Candia Silhouette 1L',
    stock: 2,
    actionLabel: 'Réapprovisionner'
  },
  {
    id: 'alert-stock-hamoud',
    titre: 'Alerte Réassort Boissons',
    title: 'Alerte Réassort Boissons',
    message: '« Hamoud Boualem Selecto 1L » : stock critique de 4 bouteilles restantes en magasin.',
    date: 'Aujourd\'hui à 19:00',
    time: '19:00',
    type: 'warning',
    severity: 'warning',
    category: 'stock',
    productName: 'Hamoud Boualem Selecto 1L',
    stock: 4,
    actionLabel: 'Commander'
  }
];

export default function TopBar({
  showSearchAndBarcode = true,
  searchQuery = '',
  setSearchQuery,
  barcodeInput = '',
  setBarcodeInput,
  onBarcodeSubmit,
  products = [],
  onSelectProduct,
  onSelectProductNotification,
  searchInputRef: externalSearchRef,
  onLogout
}) {
  const localSearchRef = useRef(null);
  const searchInputRef = externalSearchRef || localSearchRef;
  const barcodeInputRef = useRef(null);
  const [isBarcodeFocused, setIsBarcodeFocused] = useState(false);
  const { language, toggleLanguage, isRTL, t } = useLanguage();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('novamag_theme') === 'dark';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── ÉTATS POUR LE SYSTÈME D'ALERTES STOCK (POST-IT & CLOCHE NOTIFICATION) ──
  // 1. alerts : Tableau d'objets alerts (conserve les alertes même fermées du Post-it)
  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_stock_alerts');
      return saved ? JSON.parse(saved) : DEFAULT_STOCK_ALERTS;
    } catch {
      return DEFAULT_STOCK_ALERTS;
    }
  });

  // 2. activePostIts : Liste des alertes affichées sous forme de Post-it (flottant en bas à droite)
  const [activePostIts, setActivePostIts] = useState(() => {
    return DEFAULT_STOCK_ALERTS.slice(0, 2);
  });

  // 3. isNotificationOpen : Booléen pour afficher/masquer le menu déroulant (Dropdown) de la cloche 🔔
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const isNotificationsOpen = isNotificationOpen;
  const setIsNotificationsOpen = setIsNotificationOpen;

  // Fermeture (Dismiss) : Quand l'utilisateur clique sur 'X' ou 'Ignorer' sur un Post-it,
  // supprime cette alerte de activePostIts mais conserve-la dans alerts !
  const handleDismissPostIt = (alertId) => {
    setActivePostIts((prev) => prev.filter((item) => item.id !== alertId));
  };

  // Réafficher tous les Post-its à l'écran
  const handleRestoreAllPostIts = () => {
    if (alerts && alerts.length > 0) {
      setActivePostIts([...alerts]);
    }
  };

  // Basculer l'affichage de tous les Post-its (Afficher / Masquer)
  const handleToggleAllPostIts = () => {
    if (activePostIts.length > 0) {
      setActivePostIts([]);
    } else if (alerts && alerts.length > 0) {
      setActivePostIts([...alerts]);
    }
  };

  // Restauration : Si l'utilisateur clique sur une alerte dans le menu déroulant,
  // la remettre en Post-it (ou basculer son affichage)
  const handleTogglePostIt = (alert) => {
    setActivePostIts((prev) => {
      const exists = prev.some((p) => p.id === alert.id);
      if (exists) {
        return prev.filter((p) => p.id !== alert.id);
      }
      return [alert, ...prev];
    });
  };

  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState([]);
  const notifContainerRef = useRef(null);
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── MÉTÉO RÉELLE EN DIRECT (Open-Meteo & Cache Local) ──
  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_weather_city');
      return saved ? JSON.parse(saved) : ALGERIAN_CITIES[0];
    } catch {
      return ALGERIAN_CITIES[0];
    }
  });

  const [weatherData, setWeatherData] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_weather_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    const hour = new Date().getHours();
    const temp = (hour >= 11 && hour <= 15) ? 21 : (hour >= 8 && hour < 11) ? 18 : (hour > 15 && hour <= 19) ? 17 : 14;
    return {
      temperature: temp,
      weatherCode: 0,
      humidity: 60,
      windSpeed: 12,
      city: 'Réghaia',
      lastUpdated: null
    };
  });

  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [isWeatherPopoverOpen, setIsWeatherPopoverOpen] = useState(false);
  const weatherRef = useRef(null);

  const fetchRealWeather = async (cityObj = selectedCity) => {
    setIsWeatherLoading(true);
    let updated = false;

    // 1. Appel direct API Open-Meteo avec modèle haute résolution Météo-France (Méditerranée côtière)
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${cityObj.lat}&longitude=${cityObj.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&models=meteofrance_seamless&timezone=auto`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.current && typeof data.current.temperature_2m === 'number') {
          const fresh = {
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code,
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            city: cityObj.name,
            lastUpdated: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          };
          setWeatherData(fresh);
          try { localStorage.setItem('novamag_weather_data', JSON.stringify(fresh)); } catch(e){}
          updated = true;
        }
      }
    } catch (e) {
      // Échec réseau externe direct
    }

    // 2. Repli vers le backend local /api/weather
    if (!updated) {
      try {
        const res = await fetch(`/api/weather?lat=${cityObj.lat}&lon=${cityObj.lon}&city=${encodeURIComponent(cityObj.name)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            const fresh = {
              temperature: data.temperature,
              weatherCode: data.weatherCode,
              humidity: data.humidity,
              windSpeed: data.windSpeed,
              city: data.city || cityObj.name,
              lastUpdated: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            };
            setWeatherData(fresh);
            try { localStorage.setItem('novamag_weather_data', JSON.stringify(fresh)); } catch(e){}
            updated = true;
          }
        }
      } catch (e) {}
    }

    setIsWeatherLoading(false);
  };

  useEffect(() => {
    fetchRealWeather(selectedCity);
    const interval = setInterval(() => {
      fetchRealWeather(selectedCity);
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  // Fermeture du popover au clic externe
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (weatherRef.current && !weatherRef.current.contains(e.target)) {
        setIsWeatherPopoverOpen(false);
      }
    };
    if (isWeatherPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isWeatherPopoverOpen]);

  const handleSelectCity = (c) => {
    setSelectedCity(c);
    try { localStorage.setItem('novamag_weather_city', JSON.stringify(c)); } catch(e){}
    fetchRealWeather(c);
  };

  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      setIsWeatherLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const customCity = {
            name: 'Ma position',
            lat: Number(pos.coords.latitude.toFixed(3)),
            lon: Number(pos.coords.longitude.toFixed(3))
          };
          setSelectedCity(customCity);
          try { localStorage.setItem('novamag_weather_city', JSON.stringify(customCity)); } catch(e){}
          fetchRealWeather(customCity);
        },
        (err) => {
          setIsWeatherLoading(false);
          alert('Impossible d\'accéder au GPS. Veuillez choisir une ville dans la liste.');
        },
        { timeout: 6000 }
      );
    }
  };


  // Écouteur global pour focus automatique du champ de recherche (F7 ou bouton)
  useEffect(() => {
    const handleFocusSearch = () => {
      if (searchInputRef && searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    };
    window.addEventListener('novamag_focus_search', handleFocusSearch);
    return () => window.removeEventListener('novamag_focus_search', handleFocusSearch);
  }, [searchInputRef]);

  // ── AUTO-FOCUS PERMANENT DU CHAMP CODE-BARRES EN MODE CAISSE ──
  useEffect(() => {
    if (!showSearchAndBarcode) return;

    // Focus initial automatique dès l'ouverture de la caisse
    const initialTimer = setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 150);

    // Fonction de recentrage automatique
    const focusBarcodeInput = () => {
      const activeEl = document.activeElement;
      // Ne pas déranger l'utilisateur s'il tape dans une modale ou un autre champ spécifique
      const isInModal = activeEl?.closest?.('[role="dialog"], .modal, [data-modal="true"]');
      const isOtherInput = activeEl && activeEl !== barcodeInputRef.current && (
        activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable
      );
      if (!isInModal && !isOtherInput) {
        barcodeInputRef.current?.focus();
      }
    };

    // Re-focus dès que l'utilisateur clique sur la page (hors modale / champ texte)
    const handleDocumentClick = (e) => {
      const target = e.target;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      const isInModal = target?.closest?.('[role="dialog"], .modal, [data-modal="true"]');
      if (!isInput && !isInModal) {
        setTimeout(focusBarcodeInput, 60);
      }
    };

    // Écouteur d'événement personnalisé émis après ajout produit, clôture modal, etc.
    const handleExplicitRefocus = () => {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 50);
    };

    window.addEventListener('novamag_refocus_barcode', handleExplicitRefocus);
    document.addEventListener('click', handleDocumentClick);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('novamag_refocus_barcode', handleExplicitRefocus);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showSearchAndBarcode]);

  // ── INTERCEPTEUR MATÉRIEL POUR DOUCHETTE / SCANNER USB & SANS FIL ──
  // Dès qu'un code-barres commence à être scanné, le curseur est automatiquement
  // et instantanément envoyé dans le champ code-barres avant / dès la première frappe !
  useEffect(() => {
    if (!showSearchAndBarcode) return;

    let lastKeyTimestamp = 0;

    const handleGlobalScanKeyDown = (e) => {
      // Ignorer les touches de fonctions F1..F12, Escape, Tab, etc.
      if (e.key?.startsWith('F') || e.key === 'Tab' || e.key === 'Escape') return;

      const activeEl = document.activeElement;
      // Ne jamais intercepter si l'utilisateur est dans une modale (ex: création de produit)
      const isInModal = activeEl?.closest?.('[role="dialog"], .modal, [data-modal="true"]');
      if (isInModal) return;

      const now = Date.now();
      const interval = now - lastKeyTimestamp;
      lastKeyTimestamp = now;

      // Détection de frappe rapide de douchette (cadence matérielle < 45ms entre touches)
      const isScannerPace = interval < 45;

      // Si le curseur n'est PAS déjà dans le champ code-barres
      if (activeEl !== barcodeInputRef.current) {
        // Caractère unique imprimable (chiffres 0-9, lettres, tirets...)
        if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          const isOtherInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

          // Si le focus est dans le vide (hors champ texte) OU si c'est la douchette ultra-rapide
          if (!isOtherInput || isScannerPace) {
            if (barcodeInputRef.current) {
              // Rediriger le curseur immédiatement vers le champ code-barres
              barcodeInputRef.current.focus();

              // Si le focus était dans le vide, on capture le 1er caractère pour ne pas le perdre
              if (!isOtherInput) {
                e.preventDefault();
                const char = e.key;
                if (typeof setBarcodeInput === 'function') {
                  setBarcodeInput((prev) => (prev || '') + char);
                }
              }
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalScanKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalScanKeyDown, true);
  }, [showSearchAndBarcode, setBarcodeInput]);

  // Synchronisation dynamique du Logo et des Paramètres du magasin
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.storeName?.includes('لومينا') || parsed.storeName === 'لومينا ديجيتال سيرفيس') {
          parsed.storeName = 'NovaMag';
          try { localStorage.setItem('novamag_system_settings', JSON.stringify(parsed)); } catch(e){}
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('novamag_system_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.storeName?.includes('لومينا') || parsed.storeName === 'لومينا ديجيتال سيرفيس') {
            parsed.storeName = 'NovaMag';
          }
          setStoreSettings(parsed);
        }
      } catch {}
    };
    window.addEventListener('novamag_settings_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('novamag_settings_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Écouter l'ouverture du modal de raccourcis depuis n'importe où
  useEffect(() => {
    const handleOpenModal = () => setIsShortcutsModalOpen(true);
    window.addEventListener('novamag_open_shortcuts_modal', handleOpenModal);
    return () => window.removeEventListener('novamag_open_shortcuts_modal', handleOpenModal);
  }, []);

  // Focus search input on F7
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F7') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInputRef]);

  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const cleanQ = (searchQuery || '').trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!cleanQ) return [];
    return (products || []).filter((p) => {
      const matchName = (p.name || '').toLowerCase().includes(cleanQ);
      const matchBarcode = p.barcode ? String(p.barcode).toLowerCase().includes(cleanQ) : false;
      const matchCategory = (p.category || '').toLowerCase().includes(cleanQ);
      return matchName || matchBarcode || matchCategory;
    }).slice(0, 8);
  }, [cleanQ, products]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        e.preventDefault();
        onSelectProduct && onSelectProduct(searchResults[0]);
        if (typeof setSearchQuery === 'function') setSearchQuery('');
        setIsSearchDropdownOpen(false);
      } else if (onBarcodeSubmit && searchQuery) {
        e.preventDefault();
        onBarcodeSubmit(searchQuery);
        if (typeof setSearchQuery === 'function') setSearchQuery('');
        setIsSearchDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      if (typeof setSearchQuery === 'function') setSearchQuery('');
      setIsSearchDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('novamag_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('novamag_theme', 'light');
    }
  }, [isDarkMode]);

  // Click outside to close notifications popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  // Dynamic notification generator based on products (Stock & Expiry dates)
  const notifications = useMemo(() => {
    const alerts = [];
    const isFinancialOnly = Boolean(storeSettings?.financialAccountingOnly);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    products.forEach((prod) => {
      // 1. STOCK CHECKS (Ignorés en mode comptabilité financière uniquement)
      if (!isFinancialOnly) {
        if (prod.stock === 0) {
          // 🔴 ROUGE: Rupture de stock
          alerts.push({
            id: `stock-zero-${prod.id}`,
            productId: prod.id,
            productName: prod.name,
            category: 'stock',
            severity: 'danger',
            title: 'Rupture de Stock',
            message: 'Le stock est entièrement épuisé (0 unité en rayon). Réapprovisionnement urgent nécessaire.',
            time: 'Urgent',
            actionLabel: 'Commander'
          });
        } else if (prod.stock > 0 && prod.stock <= (prod.alertStock || 5)) {
          // 🟠 ORANGE: Stock faible
          alerts.push({
            id: `stock-low-${prod.id}`,
            productId: prod.id,
            productName: prod.name,
            category: 'stock',
            severity: 'warning',
            title: 'Stock Critique',
            message: `Plus que ${prod.stock} unité(s) en rayon (seuil d'alerte : ${prod.alertStock || 5}).`,
            time: 'En cours',
            actionLabel: 'Réapprovisionner'
          });
        }
      }

      // 2. EXPIRATION DATE CHECKS
      if (prod.expiryDate) {
        const expDate = new Date(prod.expiryDate);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // 🔴 ROUGE: Péremption dépassée
          alerts.push({
            id: `expiry-over-${prod.id}`,
            productId: prod.id,
            productName: prod.name,
            category: 'expiry',
            severity: 'danger',
            title: 'Péremption Dépassée',
            message: `Produit périmé depuis le ${prod.expiryDate} (${Math.abs(diffDays)} jour(s) de retard). À retirer impérativement de la vente !`,
            time: 'Expiré',
            actionLabel: 'Retirer du rayon'
          });
        } else if (diffDays <= 7) {
          // 🟠 ORANGE: Péremption proche
          alerts.push({
            id: `expiry-soon-${prod.id}`,
            productId: prod.id,
            productName: prod.name,
            category: 'expiry',
            severity: 'warning',
            title: 'Péremption Proche',
            message: `Expire dans ${diffDays === 0 ? "aujourd'hui" : `${diffDays} jour(s)`} (le ${prod.expiryDate}). Pensez à déstocker ou solder.`,
            time: diffDays === 0 ? "Aujourd'hui" : `J-${diffDays}`,
            actionLabel: 'Solder / Vérifier'
          });
        }
      }
    });

    return alerts;
  }, [products]);

  // Active notifications excluding dismissed ones
  const activeNotifications = useMemo(() => {
    return notifications.filter((n) => !dismissedNotifIds.includes(n.id));
  }, [notifications, dismissedNotifIds]);

  const hasDanger = activeNotifications.some((n) => n.severity === 'danger');
  const hasWarning = activeNotifications.some((n) => n.severity === 'warning');
  const alertCount = activeNotifications.length;

  const handleDismissNotification = (id) => {
    setDismissedNotifIds((prev) => [...prev, id]);
  };

  const handleClearAll = () => {
    setDismissedNotifIds(notifications.map((n) => n.id));
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = (barcodeInput || '').trim();
      if (code) {
        onBarcodeSubmit && onBarcodeSubmit(code);
        if (typeof setBarcodeInput === 'function') setBarcodeInput('');
        // Conserver le curseur dans le champ code-barres prêt pour le scan suivant
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 15);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <header className="h-16 bg-gradient-to-r from-[#06122C] via-[#0A1B44] to-[#06122C] text-white border-b border-[#0D2254] flex items-center justify-between px-4 shrink-0 select-none z-40 relative shadow-md">

      {/* ── LOGO & BRAND (Exactement comme dans la référence) ── */}
      <div className="flex items-center gap-3 shrink-0 mr-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/20">
          <ShoppingCart className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div className="flex flex-col leading-tight select-none">
          <span className="text-2xl font-black tracking-tight flex items-center">
            {(() => {
              const name = (storeSettings?.storeName || 'NovaMag').trim();
              if (!name || /nova\s*mag/i.test(name)) {
                return (
                  <>
                    <span style={{ color: '#ffffff' }} className="font-black">Nova</span>
                    <span style={{ color: '#00D1FF' }} className="font-black ml-0.5">Mag</span>
                  </>
                );
              }
              return <span style={{ color: '#ffffff' }} className="font-black">{name}</span>;
            })()}
          </span>
          <span className="text-[10px] text-slate-300 font-medium whitespace-nowrap tracking-normal mt-0.5">
            {storeSettings?.tagline || 'Point de Vente & Gestion de Stock'}
          </span>
        </div>
      </div>

      {/* ── Recherche + Scanner (Affiché uniquement sur caisse POS — Largeur diminuée et équilibrée) ── */}
      {showSearchAndBarcode && (
        <div className="flex items-center gap-2.5 max-w-xl mx-2">
          {/* 1. Search Input (F7 Focus) avec Dropdown Instantané */}
          <div className="relative w-56 sm:w-64 md:w-72" ref={searchContainerRef}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery || ''}
              onFocus={() => setIsSearchDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery && setSearchQuery(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={language === 'ar' ? 'بحث عن منتج (F7)...' : 'Rechercher produit (F7)...'}
              autoComplete="off"
              spellCheck="false"
              style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
              className="w-full text-xs sm:text-sm font-bold text-slate-900 pl-4 pr-16 rtl:pl-16 rtl:pr-4 py-2 bg-white rounded-full outline-none transition-all shadow-sm placeholder:text-slate-400 border border-slate-200 focus:ring-2 focus:ring-blue-500/30"
            />
            <div className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-black text-slate-500 bg-slate-100 border border-slate-300 rounded shadow-xs">
                F7
              </kbd>
              <Search className="w-4 h-4 text-slate-400" />
            </div>

            {/* Menu Déroulant des Résultats de Recherche en Direct */}
            {isSearchDropdownOpen && cleanQ.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Résultats pour "{searchQuery}"</span>
                  <span>{searchResults.length} trouvé{searchResults.length > 1 ? 's' : ''}</span>
                </div>

                {searchResults.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          onSelectProduct && onSelectProduct(prod);
                          if (typeof setSearchQuery === 'function') setSearchQuery('');
                          setIsSearchDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-blue-50 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-xl shrink-0">
                            {prod.iconText || '📦'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600">
                              {prod.name}
                            </h5>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              {prod.barcode && <span className="font-mono">Réf: {prod.barcode}</span>}
                              {prod.category && (
                                <span className="bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-500">
                                  {prod.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 pl-2">
                          <span className="font-mono font-black text-xs text-emerald-600">
                            {Number(prod.price).toFixed(2)} {language === 'ar' ? 'د.ج' : 'DA'}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            prod.stock <= 5 
                              ? 'bg-rose-50 text-rose-600' 
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {prod.stock} en stock
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Aucun article trouvé pour "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Barcode Scanner Input avec Auto-Focus Permanent et Détecteur de Douchette */}
          <div className="relative w-52 sm:w-60 md:w-64 shrink-0 transition-all">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onFocus={() => setIsBarcodeFocused(true)}
              onBlur={() => setIsBarcodeFocused(false)}
              onChange={(e) => setBarcodeInput && setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder={language === 'ar' ? 'مسح الباركود (المؤشر تلقائي)...' : 'Scanner code-barres (Curseur auto ⚡)...'}
              className={`w-full text-xs font-mono font-bold text-slate-800 pl-8 pr-16 rtl:pl-16 rtl:pr-8 py-2 bg-white rounded-full outline-none transition-all shadow-sm placeholder:text-slate-400 border ${
                isBarcodeFocused
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/10'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            />
            <BarcodeIcon className={`w-4 h-4 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              isBarcodeFocused ? 'text-emerald-600' : 'text-slate-500'
            }`} />
            
            {/* Indicateur visuel d'état du scanner */}
            <div className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <span className={`w-2 h-2 rounded-full ${isBarcodeFocused ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className={`text-[9px] font-black uppercase tracking-wider ${isBarcodeFocused ? 'text-emerald-600 font-mono' : 'text-slate-400'}`}>
                {isBarcodeFocused ? 'PRÊT' : 'SCAN'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── RIGHT: Utilitaires & Badges Conformes Référence ── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* 📅 Date & Heure Réelle en direct */}
        <div className="text-xs font-bold text-slate-200/90 hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
          <span>📅</span>
          <span className="font-mono">
            {currentDateTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
          <span className="font-mono text-cyan-300 font-black">
            {currentDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* ☀️ Degré de température Réel & Dynamique */}
        <div className="relative" ref={weatherRef}>
          <button
            type="button"
            onClick={() => setIsWeatherPopoverOpen(!isWeatherPopoverOpen)}
            className="text-xs font-bold text-slate-200 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 shadow-xs transition-all cursor-pointer group"
            title="Météo en direct - Cliquer pour détails et choix de la ville"
          >
            <span className="text-amber-400 text-sm leading-none drop-shadow-sm group-hover:scale-110 transition-transform">
              {getWeatherInfo(weatherData.weatherCode).icon}
            </span>
            <span className="font-black text-xs text-white">
              {weatherData.temperature}°C
            </span>
            <span className="text-[11px] text-blue-200 font-semibold truncate max-w-[80px]">
              {weatherData.city || selectedCity.name}
            </span>
            {isWeatherLoading && (
              <RefreshCw className="w-2.5 h-2.5 text-cyan-400 animate-spin ml-0.5" />
            )}
          </button>

          {/* Popover Détails Météo Réelle */}
          {isWeatherPopoverOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-gradient-to-b from-[#091838] via-[#06122C] to-[#040C1F] text-white border border-cyan-500/30 rounded-2xl shadow-2xl p-4 z-50 animate-scaleIn backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl drop-shadow-md">{getWeatherInfo(weatherData.weatherCode).icon}</span>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white">{weatherData.temperature}°C</span>
                      <span className="text-xs font-bold text-cyan-300">
                        {getWeatherInfo(weatherData.weatherCode).label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="font-semibold">{weatherData.city || selectedCity.name}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fetchRealWeather(selectedCity)}
                  disabled={isWeatherLoading}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                  title="Actualiser la météo en direct"
                >
                  <RefreshCw className={`w-4 h-4 ${isWeatherLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Indicateurs : Humidité & Vent */}
              <div className="grid grid-cols-2 gap-2 my-3">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                  <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Humidité</div>
                    <div className="text-xs font-black text-white">{weatherData.humidity || 60}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                  <Wind className="w-4 h-4 text-teal-400 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Vent</div>
                    <div className="text-xs font-black text-white">{weatherData.windSpeed || 12} km/h</div>
                  </div>
                </div>
              </div>

              {/* Sélecteur de ville rapide */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                  <span>Choisir la ville :</span>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <span>📍 GPS auto</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                  {ALGERIAN_CITIES.map((city) => {
                    const isSelected = (weatherData.city || selectedCity.name) === city.name;
                    return (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center truncate cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xs font-black ring-1 ring-cyan-300'
                            : 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white'
                        }`}
                        title={city.name}
                      >
                        {city.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {weatherData.lastUpdated && (
                <div className="text-[9.5px] text-slate-400 text-center mt-2.5 pt-2 border-t border-white/5 font-mono">
                  Dernière màj réelle : {weatherData.lastUpdated}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ⛶ Plein écran */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Plein Écran"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* ❓ Aide */}
        <button
          type="button"
          onClick={() => setIsShortcutsModalOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Aide & Raccourcis"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* 🖩 Calculatrice / Clavier */}
        <button
          type="button"
          onClick={() => setIsShortcutsModalOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Raccourcis & Calculatrice"
        >
          <Calculator className="w-4 h-4" />
        </button>

        {/* 🔔 Notifications (Centre de Notifications Cloche) */}
        <div ref={notifContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer relative"
            title="Centre de Notifications"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-white text-[9px] font-black flex items-center justify-center bg-rose-500 shadow-sm leading-none animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>

          <NotificationsPopover
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            notifications={alerts}
            activePostIts={activePostIts}
            onTogglePostIt={handleTogglePostIt}
            onRestoreAllPostIts={handleRestoreAllPostIts}
            onDismissNotification={handleDismissNotification}
            onClearAll={handleClearAll}
            onActionClick={(notif) => {
              setIsNotificationOpen(false);
              onSelectProductNotification && onSelectProductNotification(notif);
            }}
          />
        </div>

        {/* 🌙 Mode Nuit / Jour */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15"
          title="Mode Nuit / Jour"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

      </div>

      {/* Modal des Raccourcis Clavier (Style exact référence) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* ── ALERTE POST-IT FLOTTANTE EN BAS À DROITE (STYLE JAUNE PASTEL) ── */}
      <StockAlertPostIt
        activePostIts={activePostIts}
        allAlerts={alerts}
        onDismissPostIt={handleDismissPostIt}
        onRestoreAllPostIts={handleRestoreAllPostIts}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onActionClick={(notif) => {
          onSelectProductNotification && onSelectProductNotification(notif);
        }}
      />

    </header>
  );
}
