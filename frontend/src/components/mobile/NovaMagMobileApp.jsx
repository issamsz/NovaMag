import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Home,
  ShoppingCart,
  Sparkles,
  Settings,
  Bell,
  Camera,
  ScanLine,
  FileText,
  TrendingUp,
  Package,
  Plus,
  Minus,
  Trash2,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  X,
  CreditCard,
  Banknote,
  Bot,
  User,
  Wifi,
  Battery,
  Smartphone,
  ChevronRight,
  Zap,
  Mic,
  Check,
  Tag,
  Keyboard,
  HelpCircle,
  Upload,
  Layers,
  Building2,
  Eye,
  Key,
  Edit3
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { MOCK_PRODUCTS } from '../../mock/posData';
import { getCategories, getProducts } from '../../services/api';

// Articles réels de la supérette NovaMag (synchronisés avec la base SQLite novamag.db)
export const REAL_STORE_PRODUCTS = [
  { id: 42, name: 'Pain Baguette Ordinaire', price: 10.0, iconText: '🥖', barcode: 'NB-PAIN', category: 'Boulangerie & Vrac', stock: 999 },
  { id: 43, name: 'Pain Traditionnel Amélioré', price: 15.0, iconText: '🍞', barcode: 'NB-AMEL', category: 'Boulangerie & Vrac', stock: 999 },
  { id: 47, name: 'Lait Pasteurisé en Sachet 1L', price: 25.0, iconText: '🥛', barcode: 'NB-LAIT', category: 'Boulangerie & Vrac', stock: 997 },
  { id: 28, name: 'Lait Candia Viva Stérilisé 1L', price: 135.0, iconText: '🥛', barcode: '6130001000018', category: 'Produits Laitiers & Fromages', stock: 25 },
  { id: 35, name: 'Lait Candia Candilait 1L', price: 140.0, iconText: '🥛', barcode: '6131234567890', category: 'Produits Laitiers & Fromages', stock: 48 },
  { id: 29, name: 'Yaourt Soummam aux Fruits 100g', price: 35.0, iconText: '🥣', barcode: '6130002000025', category: 'Produits Laitiers & Fromages', stock: 120 },
  { id: 36, name: 'Fromage Gruyère Local au Poids (kg)', price: 1850.0, iconText: '🧀', barcode: '20001', category: 'Boucherie & Fromagerie (Balance)', stock: 14.5, is_weighted: 1 },
  { id: 37, name: 'Fromage Cheddar Rouge au Poids (kg)', price: 1450.0, iconText: '🧀', barcode: '20002', category: 'Boucherie & Fromagerie (Balance)', stock: 18.2, is_weighted: 1 },
  { id: 38, name: 'Viande Bovine Fraîche Hachée (kg)', price: 2200.0, iconText: '🥩', barcode: '20003', category: 'Boucherie & Fromagerie (Balance)', stock: 11.0, is_weighted: 1 },
  { id: 30, name: 'Boisson Gazeuse Hamoud Boualem Sélecto 1L', price: 110.0, iconText: '🥤', barcode: '6130003000032', category: 'Boissons & Jus', stock: 7 },
  { id: 31, name: 'Jus Ramy Orange avec Pulpe 1.25L', price: 140.0, iconText: '🍊', barcode: '6130004000049', category: 'Boissons & Jus', stock: 45 },
  { id: 48, name: 'Bouteille Eau Minérale 0.5L', price: 35.0, iconText: '💧', barcode: 'NB-EAU', category: 'Boissons & Jus', stock: 999 },
  { id: 32, name: 'Farine Supérieure Safina 1kg', price: 65.0, iconText: '🌾', barcode: '6130005000056', category: 'Épicerie Générale', stock: 5 },
  { id: 33, name: 'Pâtes Sim Spaghetti n°5 500g', price: 75.0, iconText: '🍝', barcode: '6130006000063', category: 'Épicerie Générale', stock: 95 },
  { id: 34, name: 'Huile de Table Végétale Afia 5L', price: 650.0, iconText: '🌻', barcode: '6130007000070', category: 'Épicerie Générale', stock: 25 },
  { id: 51, name: 'Olives Vertes (Zitoune kg)', price: 450.0, iconText: '🫒', barcode: 'NB-ZITOUN-V', category: 'Épicerie Générale', stock: 50, is_weighted: 1 },
  { id: 52, name: 'Olives Noires (Zitoune kg)', price: 500.0, iconText: '🫒', barcode: 'NB-ZITOUN-N', category: 'Épicerie Générale', stock: 40, is_weighted: 1 },
  { id: 44, name: 'Œuf Frais Fermier (Unité)', price: 25.0, iconText: '🥚', barcode: 'NB-OEUF-1', category: 'Boulangerie & Vrac', stock: 999 },
  { id: 45, name: 'Plateau d\'Œufs (30 pièces)', price: 650.0, iconText: '🥚', barcode: 'NB-OEUF-30', category: 'Boulangerie & Vrac', stock: 998 },
  { id: 49, name: 'Croissant / Brioche au Beurre', price: 30.0, iconText: '🥐', barcode: 'NB-CROISSANT', category: 'Boulangerie & Vrac', stock: 999 },
  { id: 39, name: 'Bananes Fraîches d\'Importation (kg)', price: 420.0, iconText: '🍌', barcode: '21001', category: 'Fruits & Légumes (Balance)', stock: 52, is_weighted: 1 },
  { id: 40, name: 'Pommes Rouges Locales Délicieuses (kg)', price: 360.0, iconText: '🍎', barcode: '21002', category: 'Fruits & Légumes (Balance)', stock: 38.5, is_weighted: 1 },
  { id: 50, name: 'Kit Nettoyant & Entretien', price: 500.0, iconText: '🧼', barcode: '6132531170014', category: 'Kit Nétoyage', stock: 10 }
];

const POPULAR_MOBILE_ITEMS = REAL_STORE_PRODUCTS;

export function getCategoryEmoji(catName) {
  if (!catName) return '📦';
  const c = catName.toLowerCase();
  if (c.includes('lait') || c.includes('fromage')) return '🥛';
  if (c.includes('boisson') || c.includes('jus') || c.includes('eau')) return '🥤';
  if (c.includes('boulangerie') || c.includes('pain') || c.includes('vrac')) return '🥖';
  if (c.includes('fruit') || c.includes('légume')) return '🍎';
  if (c.includes('boucherie') || c.includes('viande')) return '🥩';
  if (c.includes('chocolat') || c.includes('confiserie') || c.includes('biscuit')) return '🍫';
  if (c.includes('nettoy') || c.includes('entretien') || c.includes('hygiène') || c.includes('kit')) return '🧼';
  if (c.includes('épicerie')) return '🥫';
  return '🏷️';
}

export function getProductEmoji(name, category) {
  const n = (name || '').toLowerCase();
  if (n.includes('pain') || n.includes('baguette')) return '🥖';
  if (n.includes('croissant') || n.includes('brioche')) return '🥐';
  if (n.includes('lait')) return '🥛';
  if (n.includes('yaourt')) return '🥣';
  if (n.includes('fromage') || n.includes('cheddar') || n.includes('gruyère')) return '🧀';
  if (n.includes('viande') || n.includes('haché') || n.includes('bœuf') || n.includes('boeuf')) return '🥩';
  if (n.includes('banane')) return '🍌';
  if (n.includes('pomme')) return '🍎';
  if (n.includes('orange') || n.includes('jus') || n.includes('ramy')) return '🍊';
  if (n.includes('hamoud') || n.includes('sélecto') || n.includes('selecto') || n.includes('boisson')) return '🥤';
  if (n.includes('eau')) return '💧';
  if (n.includes('oeuf') || n.includes('œuf')) return '🥚';
  if (n.includes('farine') || n.includes('safina')) return '🌾';
  if (n.includes('pâte') || n.includes('spaghetti') || n.includes('sim')) return '🍝';
  if (n.includes('huile') || n.includes('afia')) return '🌻';
  if (n.includes('olive') || n.includes('zitoun')) return '🫒';
  if (n.includes('chocolat')) return '🍫';
  if (n.includes('nettoy') || n.includes('crash')) return '🧼';
  return getCategoryEmoji(category);
}

export default function NovaMagMobileApp({ onExitMobile, onNavigateView }) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'cart' | 'novaia' | 'settings'

  // Données factices réactives
  const [dailySales, setDailySales] = useState(84500.0);
  const [itemsSold, setItemsSold] = useState(142);
  const [cartItems, setCartItems] = useState([
    { id: 42, name: 'Pain Baguette Ordinaire', price: 10.0, qty: 3, barcode: 'NB-PAIN' },
    { id: 28, name: 'Lait Candia Viva Stérilisé 1L', price: 135.0, qty: 2, barcode: '6130001000018' },
  ]);

  // Alertes de stock
  const [alerts, setAlerts] = useState([
    {
      id: 'a1',
      title: 'Rupture Immédiate',
      product: 'Yaourt Danone Fraise',
      stock: 0,
      minStock: 20,
      severity: 'danger',
      time: 'Il y a 10 min',
      supplier: 'Candia / Danone Algérie'
    },
    {
      id: 'a2',
      title: 'Stock Critique',
      product: 'Eau Minérale Saida 0.5L',
      stock: 4,
      minStock: 24,
      severity: 'warning',
      time: 'Il y a 25 min',
      supplier: 'Distributeur Boissons Hamoud'
    },
  ]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Modals Mobile
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [ocrStep, setOcrStep] = useState('capture'); // 'capture' | 'scanning' | 'result'
  const [ocrScanMode, setOcrScanMode] = useState('demo'); // 'demo' | 'real_ai' | 'manual'
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrProgressMsg, setOcrProgressMsg] = useState('');
  const [ocrInvoiceImage, setOcrInvoiceImage] = useState(null);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('novamag_gemini_api_key') || '');
  const [isGeminiKeyModalOpen, setIsGeminiKeyModalOpen] = useState(false);
  const [tempApiKeyInput, setTempApiKeyInput] = useState('');
  const [editingOcrItem, setEditingOcrItem] = useState(null);
  const [isEditingSupplierModalOpen, setIsEditingSupplierModalOpen] = useState(false);
  const [tempSupplierForm, setTempSupplierForm] = useState({ supplierName: '', invoiceNumber: '' });
  const invoiceCameraInputRef = useRef(null);
  const invoiceGalleryInputRef = useRef(null);
  const [ocrInvoiceData, setOcrInvoiceData] = useState({
    supplierName: 'Candia Laiterie Algérie',
    invoiceNumber: 'FAC-2026-7841',
    date: new Date().toISOString().split('T')[0],
    items: [
      { tempId: 'c-1', name: 'Lait Candia Silhouette 1L (Pack 6)', barcode: '6131112223334', quantity: 30, buyPrice: 110, suggestedSellPrice: 135, isKnown: true, category: 'Frais' },
      { tempId: 'c-2', name: 'Fromage Portion La Vache Qui Rit (16P)', barcode: '6134445556667', quantity: 50, buyPrice: 240, suggestedSellPrice: 280, isKnown: true, category: 'Frais' },
      { tempId: 'c-3', name: 'Yaourt Brassé Danone Fraise 110g', barcode: '6139998887771', quantity: 120, buyPrice: 38, suggestedSellPrice: 50, isKnown: false, category: 'Frais' },
      { tempId: 'c-4', name: 'Beurre Doux Pasteurisé Safina 200g', barcode: '6135551112229', quantity: 40, buyPrice: 290, suggestedSellPrice: 340, isKnown: true, category: 'Frais' }
    ]
  });
  const [mobileToast, setMobileToast] = useState(null);

  // Vraie Caméra & Scanner Code-barres
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const photoInputRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle' | 'starting' | 'active' | 'error'
  const [cameraErrorType, setCameraErrorType] = useState(''); // 'HTTP_RESTRICTION' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'UNKNOWN'
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [showHttpGuide, setShowHttpGuide] = useState(false);

  const showToast = (msg, type = 'success') => {
    setMobileToast({ msg, type });
    setTimeout(() => setMobileToast(null), 2500);
  };

  // Chat NovaIA
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Bonjour ! Je suis votre Copilote NovaIA ✨. Que voulez-vous analyser aujourd\'hui sur votre magasin ?',
      time: '12:00'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'novaia' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiTyping, activeTab]);

  // Recherche d'articles dans le panier
  const [cartSearchQuery, setCartSearchQuery] = useState('');

  // Recherche & Catégorie sur la page d'accueil
  const [homeCategory, setHomeCategory] = useState('Tous');
  const [homeSearch, setHomeSearch] = useState('');

  // États pour les données synchronisées de la base réelle
  const [dbCategories, setDbCategories] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);

  // Chargement direct des rayons et produits réels depuis la base SQLite (/api)
  useEffect(() => {
    let isMounted = true;
    async function loadRealStoreData() {
      try {
        const [catsRes, prodsRes] = await Promise.allSettled([
          getCategories(),
          getProducts()
        ]);
        if (!isMounted) return;
        if (catsRes.status === 'fulfilled' && catsRes.value?.success && Array.isArray(catsRes.value.data)) {
          const validCats = catsRes.value.data.filter(c => c.name && !c.name.startsWith('TestCat_'));
          setDbCategories(validCats);
        }
        if (prodsRes.status === 'fulfilled' && prodsRes.value?.success && Array.isArray(prodsRes.value.data)) {
          const validProds = prodsRes.value.data.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price) || 0,
            barcode: p.barcode || '',
            category: p.category_name || p.category || 'Épicerie Générale',
            stock: p.stock_quantity !== undefined ? Number(p.stock_quantity) : 20,
            is_weighted: Boolean(p.is_weighted),
            iconText: getProductEmoji(p.name, p.category_name || p.category)
          }));
          setDbProducts(validProds);
        }
      } catch (err) {
        console.warn('[NovaMag Mobile] Chargement données API:', err);
      }
    }
    loadRealStoreData();
    return () => { isMounted = false; };
  }, []);

  // Catalogue global des articles disponibles (Supérette réelle)
  const allCatalogProducts = useMemo(() => {
    const map = new Map();

    // 1. Initialiser avec les 24 articles réels du magasin
    REAL_STORE_PRODUCTS.forEach((p) => {
      map.set(p.name.toLowerCase(), {
        ...p,
        iconText: p.iconText || getProductEmoji(p.name, p.category)
      });
    });

    // 2. Fusionner avec les données fraîches de la base de données (si API connectée)
    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      dbProducts.forEach((p) => {
        map.set(p.name.toLowerCase(), {
          id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          barcode: p.barcode || '',
          category: p.category || 'Épicerie Générale',
          stock: p.stock ?? 20,
          is_weighted: Boolean(p.is_weighted),
          iconText: p.iconText || getProductEmoji(p.name, p.category)
        });
      });
    }

    // 3. Fusionner avec les produits du stockage local (si créés récemment par l'utilisateur)
    try {
      const saved = localStorage.getItem('novamag_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((p) => {
            if (!p.name) return;
            const key = p.name.toLowerCase();
            const existing = map.get(key);
            const cat = p.category || existing?.category || 'Épicerie Générale';
            if (existing) {
              if (p.stock !== undefined) existing.stock = Number(p.stock);
              if (p.price !== undefined) existing.price = Number(p.price);
              if (p.barcode) existing.barcode = p.barcode;
            } else {
              map.set(key, {
                id: p.id || `custom-${Date.now()}`,
                name: p.name,
                price: Number(p.price || p.sale_price || p.selling_price) || 0,
                iconText: getProductEmoji(p.name, cat),
                barcode: p.barcode || '',
                category: cat,
                stock: Number(p.stock ?? 15),
                is_weighted: Boolean(p.is_weighted)
              });
            }
          });
        }
      }
    } catch (e) {}

    return Array.from(map.values());
  }, [dbProducts]);

  // Extraction dynamique et intelligente des vrais rayons (catégories) du magasin
  const availableRayons = useMemo(() => {
    const set = new Set();

    // Catégories issues de la base SQLite
    if (Array.isArray(dbCategories)) {
      dbCategories.forEach((c) => {
        if (c.name && !c.name.startsWith('TestCat_')) {
          set.add(c.name.trim());
        }
      });
    }

    // Catégories issues des produits du magasin
    allCatalogProducts.forEach((p) => {
      if (p.category && typeof p.category === 'string' && p.category.trim() && !p.category.startsWith('TestCat_')) {
        set.add(p.category.trim());
      }
    });

    // Fallback garanti sur les vrais rayons de la supérette
    if (set.size === 0) {
      [
        'Produits Laitiers & Fromages',
        'Boissons & Jus',
        'Épicerie Générale',
        'Boulangerie & Vrac',
        'Fruits & Légumes (Balance)',
        'Boucherie & Fromagerie (Balance)',
        'Kit Nétoyage'
      ].forEach((c) => set.add(c));
    }

    return ['Tous', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, [dbCategories, allCatalogProducts]);

  // Filtrage des articles sur la page d'accueil
  const homeFilteredProducts = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      const matchCat = homeCategory === 'Tous' || p.category === homeCategory;
      const q = homeSearch.trim().toLowerCase();
      const matchSearch = !q || (p.name || '').toLowerCase().includes(q) || (p.barcode || '').includes(q);
      return matchCat && matchSearch;
    });
  }, [allCatalogProducts, homeCategory, homeSearch]);

  // Filtrage en direct de la recherche
  const filteredProducts = useMemo(() => {
    const q = cartSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return allCatalogProducts.filter((p) => {
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchBarcode = (p.barcode || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      return matchName || matchBarcode || matchCat;
    });
  }, [cartSearchQuery, allCatalogProducts]);

  // Ajouter un article au panier avec feedback haptique et sonore simulé
  const handleAddToCart = (product, qty = 1) => {
    const pName = product.name;
    const pPrice = Number(product.price) || 0;
    const pBarcode = product.barcode || '';

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.id === product.id ||
          (pBarcode && item.barcode === pBarcode) ||
          item.name.toLowerCase() === pName.toLowerCase()
      );
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + qty,
        };
        return updated;
      }
      return [
        {
          id: product.id || Date.now(),
          name: pName,
          price: pPrice,
          qty,
          barcode: pBarcode,
        },
        ...prevItems,
      ];
    });

    showToast(`✓ +${qty} ${pName} (${(pPrice * qty).toFixed(2)} DA)`);
    try {
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (e) {}
  };

  // Gestionnaire Audio Haute-Compatibilité Mobile (Web Audio + Auto-Unlock Mobile Chrome/Safari)
  const audioContextRef = useRef(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  };

  // Déverrouiller le moteur audio sur n'importe quel tap / clic sur mobile
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('click', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

  // Jouer les sons de caisse mobile (Bip de succès caisse ou double-ton d'erreur)
  const playMobileSound = (type = 'success') => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      if (type === 'success') {
        // Bip aigu très net type douchette professionnelle (1850 Hz)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1850, now);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.09);
      } else {
        // Double bip d'erreur d'avertissement grave bien audible (420 Hz -> 260 Hz)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(420, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc1.connect(gain);
        osc1.start(now);
        osc1.stop(now + 0.12);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(260, now + 0.14);
        const gain2 = ctx.createGain();
        gain2.connect(ctx.destination);
        gain2.gain.setValueAtTime(0.55, now + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc2.connect(gain2);
        osc2.start(now + 0.14);
        osc2.stop(now + 0.32);
      }
    } catch (e) {}
  };

  // Traitement d'un code-barres détecté par la caméra ou photo
  const handleBarcodeDetected = (code) => {
    if (!code || code === lastScannedCode) return;
    setLastScannedCode(code);
    setTimeout(() => setLastScannedCode(null), 2500);

    const cleanCode = String(code).trim();
    // Chercher dans le catalogue mobile
    const found = allCatalogProducts.find((p) => p.barcode === cleanCode || (p.barcode && cleanCode.includes(p.barcode)));

    if (found) {
      playMobileSound('success');
      try {
        if (navigator.vibrate) navigator.vibrate(60);
      } catch (e) {}
      handleAddToCart(found, 1);
      showToast(`✓ Scanné : ${found.name} (${found.price.toFixed(2)} DA)`);
      setIsScannerOpen(false);
    } else {
      // Produit non répertorié : bip sonore d'erreur + vibration + toast
      playMobileSound('error');
      try {
        if (navigator.vibrate) navigator.vibrate([120, 80, 160]);
      } catch (e) {}
      showToast(`⚠️ Ce produit n'existe pas dans le catalogue (Code: ${cleanCode})`, 'warning');
      setIsScannerOpen(false);
    }
  };

  // Cycle de vie de la caméra en temps réel (getUserMedia)
  useEffect(() => {
    if (!isScannerOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      setCameraStatus('idle');
      setIsTorchOn(false);
      setIsTorchAvailable(false);
      return;
    }

    let isMounted = true;
    setCameraStatus('starting');
    setCameraErrorType('');

    // Détection de restriction HTTP : Chrome sur Android désactive getUserMedia sur http://ip
    const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('error');
      setCameraErrorType(isSecure ? 'NOT_FOUND' : 'HTTP_RESTRICTION');
      return;
    }

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setCameraStatus('active');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          try {
            await videoRef.current.play();
          } catch (e) {}
        }

        // Moteur de détection de code-barres natif
        if ('BarcodeDetector' in window) {
          try {
            const detector = new window.BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
            });

            scanIntervalRef.current = setInterval(async () => {
              if (!videoRef.current || videoRef.current.readyState < 2) return;
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  handleBarcodeDetected(barcodes[0].rawValue);
                }
              } catch (err) {}
            }, 300);
          } catch (e) {}
        }
      } catch (err) {
        if (!isMounted) return;
        setCameraStatus('error');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraErrorType('PERMISSION_DENIED');
        } else {
          setCameraErrorType('UNKNOWN');
        }
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [isScannerOpen]);

  // S'assurer que le flux caméra est bien branché à la balise vidéo dès le montage
  useEffect(() => {
    if (isScannerOpen && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.play().catch(() => {});
    }
  }, [isScannerOpen, cameraStatus]);

  // Capture photo via l'appareil photo Android natif (100% fonctionnel sur Chrome HTTP)
  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast('Photo capturée, analyse...');
    const img = new Image();
    img.onload = async () => {
      if ('BarcodeDetector' in window) {
        try {
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
          });
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleBarcodeDetected(barcodes[0].rawValue);
            return;
          }
        } catch (err) {}
      }
      showToast('⚠️ Aucun code-barres reconnu sur cette photo', 'warning');
    };
    img.src = URL.createObjectURL(file);
  };

  // Bascule de la lampe torche
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && isTorchAvailable) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !isTorchOn }]
        });
        setIsTorchOn(!isTorchOn);
      } catch (e) {}
    }
  };

  // Simulation de scan code-barres mobile
  const handleSimulateScan = (scannedName = 'Lait Candia Viva Stérilisé 1L', price = 135, barcode = '6130001000018') => {
    setIsScannerOpen(false);
    handleAddToCart({ name: scannedName, price: Number(price), barcode: barcode || '' }, 1);
  };

  // ══ MOTEUR OCR FACTURES MOBILE & VISION IA (DÉSACTIVÉ TEMPORAIREMENT) ══
  // Désactivé temporairement selon demande utilisateur (Aucun appel à l'API Gemini)
  const callGeminiVisionOcr = async (base64Data, mimeType = 'image/jpeg') => {
    console.log('[NovaMag] Gemini Vision AI est temporairement désactivé.');
    return null;
  };

  // Lancer l'analyse OCR avec barre de progression dynamique
  const startOcrScanProcess = async (imageUrl = null, base64Data = null, mimeType = 'image/jpeg', isDemo = false) => {
    setOcrStep('scanning');
    setOcrProgress(15);
    setOcrProgressMsg('Cadrage & détection optique du document...');

    // 1. MODE DÉMO (Exemple pré-rempli)
    if (isDemo) {
      setOcrScanMode('demo');
      setOcrInvoiceData({
        supplierName: 'Candia Laiterie Algérie (Exemple Démo)',
        invoiceNumber: 'FAC-2026-7841',
        date: new Date().toISOString().split('T')[0],
        items: [
          { tempId: 'c-1', name: 'Lait Candia Silhouette 1L (Pack 6)', barcode: '6131112223334', quantity: 30, buyPrice: 110, suggestedSellPrice: 135, isKnown: true, category: 'Frais' },
          { tempId: 'c-2', name: 'Fromage Portion La Vache Qui Rit (16P)', barcode: '6134445556667', quantity: 50, buyPrice: 240, suggestedSellPrice: 280, isKnown: true, category: 'Frais' },
          { tempId: 'c-3', name: 'Yaourt Brassé Danone Fraise 110g', barcode: '6139998887771', quantity: 120, buyPrice: 38, suggestedSellPrice: 50, isKnown: false, category: 'Frais' },
          { tempId: 'c-4', name: 'Beurre Doux Pasteurisé Safina 200g', barcode: '6135551112229', quantity: 40, buyPrice: 290, suggestedSellPrice: 340, isKnown: true, category: 'Frais' }
        ]
      });
      setTimeout(() => { setOcrProgress(50); setOcrProgressMsg('Lecture OCR Démo : Candia Laiterie...'); }, 400);
      setTimeout(() => { setOcrProgress(85); setOcrProgressMsg('Extraction des 4 lignes d\'articles de test...'); }, 800);
      setTimeout(() => {
        setOcrProgress(100);
        setOcrStep('result');
        playMobileSound('success');
        showToast('⚡ Facture Démo Candia chargée');
      }, 1200);
      return;
    }

    // 2. VRAIE PHOTO : Tenter l'extraction réelle avec Gemini Vision si clé configurée
    const apiKey = localStorage.getItem('novamag_gemini_api_key');
    if (apiKey && base64Data) {
      setOcrScanMode('real_ai');
      setOcrProgress(30);
      setOcrProgressMsg('Connexion à l\'IA Gemini Vision en direct...');

      try {
        setOcrProgress(65);
        setOcrProgressMsg('Extraction optique des articles, prix et quantités de VOTRE facture...');
        const extracted = await callGeminiVisionOcr(base64Data, mimeType);

        if (extracted && extracted.items && extracted.items.length > 0) {
          const savedProducts = JSON.parse(localStorage.getItem('novamag_products') || '[]');
          const enriched = extracted.items.map((it, idx) => {
            const match = savedProducts.find(p => p.barcode === it.barcode || p.name.toLowerCase() === it.name.toLowerCase());
            return {
              tempId: it.tempId || `gem-${Date.now()}-${idx}`,
              name: it.name || `Article #${idx + 1}`,
              barcode: it.barcode || `${613000000000 + Math.floor(Math.random() * 999999)}`,
              quantity: Number(it.quantity) || 1,
              buyPrice: Number(it.buyPrice) || 0,
              suggestedSellPrice: Number(it.suggestedSellPrice) || Math.round((Number(it.buyPrice) || 0) * 1.25),
              isKnown: Boolean(match),
              category: it.category || 'Alimentation'
            };
          });

          setOcrInvoiceData({
            supplierName: extracted.supplierName || 'Fournisseur Extrait',
            invoiceNumber: extracted.invoiceNumber || `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date: extracted.date || new Date().toISOString().split('T')[0],
            items: enriched
          });

          setOcrProgress(100);
          setOcrStep('result');
          playMobileSound('success');
          showToast(`✓ ${enriched.length} articles réels extraits par l'IA Gemini ✨`);
          return;
        }
      } catch (err) {
        console.error('Erreur extraction Gemini:', err);
        showToast(`⚠️ Erreur IA : ${err.message || 'Vérifiez la clé'}`, 'warning');
      }
    }

    // 3. VRAIE PHOTO SANS CLÉ GEMINI : Saisie & Réconciliation Assistée depuis la Photo
    setOcrScanMode('manual');
    setOcrProgress(50);
    setOcrProgressMsg('Photo enregistrée • Préparation de la saisie assistée...');

    setTimeout(() => {
      setOcrProgress(100);
      setOcrInvoiceData({
        supplierName: 'Mon Fournisseur (Touchez pour modifier)',
        invoiceNumber: `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        items: [
          {
            tempId: `real-1`,
            name: 'Article 1 de votre facture (Touchez pour éditer)',
            barcode: `${613000000000 + Math.floor(Math.random() * 999999)}`,
            quantity: 10,
            buyPrice: 100,
            suggestedSellPrice: 130,
            isKnown: false,
            category: 'Alimentation'
          }
        ]
      });
      setOcrStep('result');
      playMobileSound('success');
      showToast('📷 Photo prête ! Ajustez les articles ou activez Gemini IA');
    }, 1000);
  };

  // Sélection d'une photo de facture via caméra native ou fichier
  const handleInvoiceFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOcrInvoiceImage(url);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      startOcrScanProcess(url, base64, file.type || 'image/jpeg', false);
    };
    reader.readAsDataURL(file);
  };

  // Test rapide avec facture démo
  const handleStartDemoInvoice = () => {
    setOcrInvoiceImage(null);
    startOcrScanProcess(null, null, null, true);
  };

  // Supprimer une ligne d'article de la facture
  const handleDeleteOcrItem = (tempId) => {
    setOcrInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.tempId !== tempId)
    }));
    showToast('Ligne supprimée');
  };

  // Ajustement rapide de la quantité
  const handleQuickChangeQty = (tempId, delta) => {
    setOcrInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.tempId === tempId) {
          const newQty = Math.max(1, (Number(it.quantity) || 1) + delta);
          return { ...it, quantity: newQty };
        }
        return it;
      })
    }));
  };

  // Ajouter une nouvelle ligne d'article
  const handleAddNewOcrLine = () => {
    const newItem = {
      tempId: `item-${Date.now()}`,
      name: `Nouvel Article #${ocrInvoiceData.items.length + 1}`,
      barcode: `${613000000000 + Math.floor(Math.random() * 999999)}`,
      quantity: 1,
      buyPrice: 100,
      suggestedSellPrice: 130,
      isKnown: false,
      category: 'Alimentation'
    };
    setOcrInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setEditingOcrItem(newItem);
  };

  // Enregistrer la modification d'un article
  const handleSaveOcrItemEdit = (e) => {
    e?.preventDefault();
    if (!editingOcrItem) return;
    setOcrInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.tempId === editingOcrItem.tempId ? { ...editingOcrItem } : it))
    }));
    setEditingOcrItem(null);
    showToast('Article mis à jour');
  };

  // Enregistrer le nom du fournisseur et réf facture
  const handleSaveSupplierEdit = (e) => {
    e?.preventDefault();
    setOcrInvoiceData((prev) => ({
      ...prev,
      supplierName: tempSupplierForm.supplierName.trim() || prev.supplierName,
      invoiceNumber: tempSupplierForm.invoiceNumber.trim() || prev.invoiceNumber
    }));
    setIsEditingSupplierModalOpen(false);
    showToast('En-tête de facture mis à jour');
  };

  // Sauvegarder la clé Gemini API
  const handleSaveGeminiKey = () => {
    const cleanKey = tempApiKeyInput.trim();
    if (cleanKey) {
      localStorage.setItem('novamag_gemini_api_key', cleanKey);
      setGeminiApiKey(cleanKey);
      showToast('✓ Clé Gemini IA enregistrée !');
    } else {
      localStorage.removeItem('novamag_gemini_api_key');
      setGeminiApiKey('');
      showToast('Clé Gemini supprimée');
    }
    setIsGeminiKeyModalOpen(false);
  };

  // Créer rapidement un article inconnu au catalogue depuis la facture mobile
  const handleQuickCreateOcrProduct = (item) => {
    try {
      const savedProducts = localStorage.getItem('novamag_products');
      const currentList = savedProducts ? JSON.parse(savedProducts) : [];

      const newProd = {
        id: Date.now(),
        name: item.name,
        barcode: item.barcode,
        category: item.category || 'Alimentation',
        buy_price: Number(item.buyPrice),
        buyPrice: Number(item.buyPrice),
        price: Number(item.suggestedSellPrice),
        sale_price: Number(item.suggestedSellPrice),
        stock: 0,
        alert_stock: 10,
        alertStock: 10
      };

      localStorage.setItem('novamag_products', JSON.stringify([...currentList, newProd]));
      window.dispatchEvent(new Event('storage'));

      setOcrInvoiceData((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.tempId === item.tempId ? { ...it, isKnown: true } : it))
      }));

      playMobileSound('success');
      showToast(`✓ Produit "${item.name}" créé au catalogue !`);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la création du produit', 'error');
    }
  };

  // Validation finale de la facture et injection directe en stock
  const handleFinalValidateOcrInvoice = () => {
    try {
      if (ocrInvoiceData.items.length === 0) {
        showToast('Ajoutez au moins un article avant de valider', 'warning');
        return;
      }

      // Auto-création de sécurité pour tout article encore non réconcilié
      ocrInvoiceData.items.filter((it) => !it.isKnown).forEach((it) => {
        handleQuickCreateOcrProduct(it);
      });

      // 1. Incrémenter les stocks dans localStorage novamag_products
      const savedProducts = localStorage.getItem('novamag_products');
      let currentProducts = savedProducts ? JSON.parse(savedProducts) : [];

      ocrInvoiceData.items.forEach((item) => {
        const idx = currentProducts.findIndex((p) => p.barcode === item.barcode || p.name === item.name);
        if (idx !== -1) {
          const currentQty = Number(currentProducts[idx].stock) || 0;
          currentProducts[idx].stock = currentQty + Number(item.quantity);
          currentProducts[idx].buy_price = Number(item.buyPrice);
        } else {
          currentProducts.push({
            id: Date.now() + Math.random(),
            name: item.name,
            barcode: item.barcode,
            category: item.category || 'Alimentation',
            buy_price: Number(item.buyPrice),
            price: Number(item.suggestedSellPrice),
            stock: Number(item.quantity),
            alert_stock: 10
          });
        }
      });
      localStorage.setItem('novamag_products', JSON.stringify(currentProducts));

      // 2. Enregistrer la facture d'achat dans novamag_purchase_invoices
      const savedInvoices = JSON.parse(localStorage.getItem('novamag_purchase_invoices') || '[]');
      const totalQty = ocrInvoiceData.items.reduce((acc, it) => acc + Number(it.quantity), 0);
      const subtotalHT = ocrInvoiceData.items.reduce((acc, it) => acc + Number(it.buyPrice) * Number(it.quantity), 0);
      const taxAmount = Math.round(subtotalHT * 0.19);
      const totalTTC = subtotalHT + taxAmount;

      const newInv = {
        id: Date.now(),
        invoiceNumber: ocrInvoiceData.invoiceNumber,
        supplierName: ocrInvoiceData.supplierName,
        date: ocrInvoiceData.date,
        totalAmount: totalTTC,
        subtotalHT,
        taxAmount,
        status: 'Payée',
        paymentMethod: 'Espèces',
        itemsCount: totalQty,
        items: ocrInvoiceData.items,
        source: ocrScanMode === 'real_ai' ? 'gemini_vision_ocr' : 'mobile_ocr'
      };
      localStorage.setItem('novamag_purchase_invoices', JSON.stringify([newInv, ...savedInvoices]));
      window.dispatchEvent(new Event('storage'));

      playMobileSound('success');
      showToast(`✓ Facture validée (+${totalQty} pièces en stock)`);
      setIsOcrOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la validation du stock', 'error');
    }
  };

  // Simulation d'envoi de message IA
  const handleSendMessage = (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsAiTyping(true);

    setTimeout(() => {
      let aiReply = "J'analyse vos données en direct...";
      const lower = text.toLowerCase();
      if (lower.includes('rupture') || lower.includes('stock')) {
        aiReply = "⚠️ Deux articles nécessitent une commande urgente :\n1. Yaourt Danone Fraise (Stock: 0)\n2. Eau Saida 0.5L (Stock: 4 unités). Voulez-vous préparer un bon de commande fournisseur ?";
      } else if (lower.includes('vente') || lower.includes('chiffre')) {
        aiReply = `📊 Vos ventes du jour s'élèvent à 84.500,00 DA (+14% vs hier). Les produits frais représentent 62% des encaissements d'aujourd'hui.`;
      } else if (lower.includes('marge') || lower.includes('rentab')) {
        aiReply = `💡 Votre marge brute moyenne est de 28.4%. Le rayon 'Boulangerie & Pâtisserie' dégage votre meilleure rentabilité (38.5%).`;
      } else if (lower.includes('demain') || lower.includes('prévision')) {
        aiReply = `🔮 Prévisions pour demain : Ventes estimées entre 92.000 DA et 105.000 DA (Forte affluence attendue entre 16h30 et 19h00).`;
      } else {
        aiReply = `J'ai bien noté votre demande : "${text}". Votre catalogue contient 1.240 références actives et votre solde de caisse actuel est parfaitement réconcilié.`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAiTyping(false);
    }, 1200);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="w-full h-[100dvh] bg-slate-50 flex flex-col relative select-none overflow-hidden">
      
      {/* ══ APPLICATION PLEINE LARGEUR (100% FLUIDE) ══ */}
      <div className="w-full h-full flex flex-col relative bg-slate-50 overflow-hidden">

        {/* ── 1. HEADER MOBILE (Fixe en haut, pleine largeur) ── */}
        <header className="bg-slate-900 text-white px-4 py-3 shrink-0 border-b border-slate-800">
          <div className="w-full max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-tight text-white">NovaMag Mobile</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-400/30">
                    PWA ✨
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-none">Compagnon Caisse & Stock</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onExitMobile && (
                <button
                  type="button"
                  onClick={onExitMobile}
                  className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                  title="Quitter la vue mobile et retourner au bureau"
                >
                  PC 💻
                </button>
              )}

              {/* Cloche d'alertes avec badge rouge pulsant */}
              <button
                type="button"
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 flex items-center justify-center text-slate-200 relative transition-all cursor-pointer"
                title="Centre de notifications & alertes de stock"
              >
                <Bell className="w-4 h-4 text-white" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {alerts.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── TOAST NOTIFICATION MOBILE FLOTTANT ── */}
        {mobileToast && (
          <div className="absolute top-16 inset-x-4 z-50 animate-in slide-in-from-top-3">
            <div
              className={`px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
                mobileToast.type === 'warning'
                  ? 'bg-amber-950/95 text-amber-200 border-amber-500/60 shadow-amber-500/20'
                  : mobileToast.type === 'danger'
                  ? 'bg-rose-950/95 text-rose-200 border-rose-500/60 shadow-rose-500/20'
                  : 'bg-slate-900/95 text-white border-slate-700'
              }`}
            >
              {mobileToast.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="flex-1">{mobileToast.msg}</span>
            </div>
          </div>
        )}

        {/* ── 2. ZONE DE CONTENU VARIABLE SELON L'ONGLET ACTIF ── */}
        
        {/* ══ ONGLET 1 : ACCUEIL (HOME) ══ */}
        {activeTab === 'home' && (
          <div className="flex-1 overflow-y-auto p-4 pb-28 scrollbar-none">
            <div className="w-full max-w-4xl mx-auto space-y-5">
            
            {/* Section Statistiques Rapides */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Statistiques Rapides</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Aujourd'hui</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Card 1 : Ventes du Jour */}
                <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold text-slate-600">Ventes du Jour</span>
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-black text-emerald-600 font-mono tracking-tight">
                      {dailySales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Dinars (DA)</span>
                  </div>
                </div>

                {/* Card 2 : Articles Vendus */}
                <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold text-slate-600">Articles Vendus</span>
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-black text-indigo-600 font-mono tracking-tight">
                      {itemsSold}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">pièces scannées</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ══ SECTION CATALOGUE D'ARTICLES DU RAYON ══ */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>Articles du Magasin</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                      {homeFilteredProducts.length} articles
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Touchez un article pour l'ajouter directement au ticket de caisse</p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('cart')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100 active:scale-95 transition-all"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Panier ({cartItems.reduce((acc, i) => acc + i.qty, 0)})</span>
                </button>
              </div>

              {/* Barre de Recherche Rapide */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={homeSearch}
                  onChange={(e) => setHomeSearch(e.target.value)}
                  placeholder="Rechercher un article (pain, lait, boisson, code-barres)..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-indigo-500 shadow-xs"
                />
                {homeSearch && (
                  <button
                    type="button"
                    onClick={() => setHomeSearch('')}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtres par Catégorie Réelle (Rayons de la Supérette) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {availableRayons.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setHomeCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      homeCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    <span>{cat === 'Tous' ? '✨' : getCategoryEmoji(cat)}</span>
                    <span>{cat === 'Tous' ? 'Tous les rayons' : cat}</span>
                  </button>
                ))}
              </div>

              {/* Grille des Produits */}
              {homeFilteredProducts.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-3xl">🔍</span>
                  <p className="text-xs font-bold text-slate-700">Aucun article ne correspond à "{homeSearch}"</p>
                  <button
                    type="button"
                    onClick={() => { setHomeSearch(''); setHomeCategory('Tous'); }}
                    className="text-xs text-indigo-600 font-bold underline"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {homeFilteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 border border-slate-100 group-hover:border-indigo-100 flex items-center justify-center text-2xl transition-colors shrink-0 shadow-2xs">
                            {prod.iconText || '📦'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                              {prod.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                              <span className="bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-600">{prod.category}</span>
                              {prod.barcode && <span className="font-mono text-slate-400 truncate">#{prod.barcode.slice(-4)}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Badge Stock en direct */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                            Number(prod.stock || 0) > 10
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : Number(prod.stock || 0) > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}
                        >
                          {Number(prod.stock || 0) > 0 ? `Stock: ${prod.stock}` : 'Rupture'}
                        </span>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {prod.price.toFixed(2)}{' '}
                            <span className="text-[10px] font-bold text-indigo-600">DA</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleAddToCart(prod, 1);
                            playMobileSound('success');
                            showToast(`✓ Ajouté : ${prod.name}`);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Ajouter</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section Achats & Intelligence Artificielle (Désactivée temporairement) */}
            {/*
            <section className="space-y-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Achats & Intelligence Artificielle</span>
              <button
                type="button"
                onClick={() => {
                  setIsOcrOpen(true);
                  setOcrStep('capture');
                }}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-white p-4 rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>Scanner Facture IA</span>
                      <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-bold">OCR Pro</span>
                    </div>
                    <div className="text-[11px] text-emerald-100">Numériser et réconcilier vos factures fournisseurs</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-200" />
              </button>
            </section>
            */}

            {/* Alertes de Stock Rapides */}
            <section className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Alertes Récentes</span>
              <div className="space-y-2">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 ${
                      al.severity === 'danger'
                        ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{al.severity === 'danger' ? '🚨' : '⚠️'}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">{al.product}</div>
                        <div className="text-[10px] font-bold opacity-80">{al.title} • Reste: {al.stock}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            </div>
          </div>
        )}

        {/* ══ ONGLET 2 : PANIER / POS MOBILE (CART) ══ */}
        {activeTab === 'cart' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50 pb-20 sm:pb-16 w-full">
            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0">
            {/* Header du Ticket */}
            <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Ticket en cours</h3>
                  <span className="text-[11px] font-bold text-slate-400">
                    {cartItems.reduce((acc, i) => acc + i.qty, 0)} article(s) • {cartTotal.toFixed(2)} DA
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-bold shadow-xs cursor-pointer transition-all"
                  title="Scanner un code-barres"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan</span>
                </button>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCartItems([]);
                      showToast('Panier vidé');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Vider
                  </button>
                )}
              </div>
            </div>

            {/* ── BARRE DE RECHERCHE D'ARTICLES MOBILE ── */}
            <div className="p-2.5 bg-white border-b border-slate-200 space-y-2 shrink-0 shadow-xs">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={cartSearchQuery}
                  onChange={(e) => setCartSearchQuery(e.target.value)}
                  placeholder="Rechercher un article à ajouter..."
                  className="w-full pl-9 pr-16 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-indigo-500 focus:outline-none transition-all shadow-inner"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {cartSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => setCartSearchQuery('')}
                      className="w-6 h-6 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors"
                      title="Effacer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                    title="Ouvrir le scanner photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Raccourcis rapides d'articles (Chips horizontaux) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider shrink-0 mr-0.5">
                  Rapides :
                </span>
                {allCatalogProducts.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddToCart(item, 1)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 text-slate-700 font-bold shrink-0 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{item.iconText}</span>
                    <span className="truncate max-w-[85px]">{item.name}</span>
                    <span className="text-[10px] text-emerald-600 font-mono font-black">+{item.price}D</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── CONTENU DU PANIER OU RÉSULTATS DE RECHERCHE ── */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-24">
              {/* Si l'utilisateur est en train de chercher */}
              {cartSearchQuery.trim() !== '' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wide">
                      Résultats ({filteredProducts.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCartSearchQuery('')}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      Retour au panier
                    </button>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 space-y-3 shadow-xs">
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-xl font-black">
                        🔍
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">Aucun produit trouvé</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Aucun article ne correspond à "{cartSearchQuery}"
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleAddToCart({
                            name: cartSearchQuery,
                            price: 100,
                            category: 'Article Libre',
                          });
                          setCartSearchQuery('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter comme article libre (100 DA)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredProducts.map((p) => {
                        const inCart = cartItems.find(
                          (i) => i.id === p.id || (p.barcode && i.barcode === p.barcode) || i.name.toLowerCase() === p.name.toLowerCase()
                        );
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleAddToCart(p, 1)}
                            className="bg-white hover:bg-indigo-50/40 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center text-base shrink-0 transition-colors">
                                {p.iconText || '📦'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                  {p.name}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] font-mono font-bold text-emerald-600">
                                    {p.price.toFixed(2)} DA
                                  </span>
                                  {p.barcode && (
                                    <span className="text-[10px] font-mono text-slate-400 truncate">
                                      #{p.barcode}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {inCart && (
                                <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                  x{inCart.qty}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(p, 1);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-black shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Ajouter</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : cartItems.length === 0 ? (
                /* ── PANIER VIDE : AVEC SUGGESTIONS RAPIDES EN 1 CLIC ── */
                <div className="h-full flex flex-col items-center justify-center p-2 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50/80 text-indigo-500 flex items-center justify-center mb-2 shadow-inner">
                    <ShoppingCart className="w-7 h-7 text-indigo-500" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800">Votre panier est vide</h4>
                  <p className="text-[11px] text-slate-400 max-w-[260px] mt-0.5 mb-4">
                    Recherchez un article ci-dessus ou touchez une suggestion pour commencer :
                  </p>

                  {/* Suggestions d'articles 1-clic direct */}
                  <div className="w-full grid grid-cols-2 gap-2 text-left">
                    {allCatalogProducts.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddToCart(item, 1)}
                        className="bg-white hover:bg-indigo-50 active:scale-95 p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{item.iconText}</span>
                          <div className="min-w-0">
                            <div className="text-[11px] font-black text-slate-900 truncate group-hover:text-indigo-600">
                              {item.name}
                            </div>
                            <div className="text-[10px] font-mono font-bold text-emerald-600">
                              {item.price.toFixed(2)} DA
                            </div>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-600 shrink-0 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scanner Code-barres</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ── LISTE DES ARTICLES DANS LE PANIER ── */
                <div className="space-y-2">
                  {cartItems.map((item) => {
                    const lineTotal = item.price * item.qty;
                    return (
                      <div
                        key={item.id}
                        className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-slate-900 truncate">{item.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-500">
                              {item.price.toFixed(2)} DA × {item.qty}
                            </span>
                            <span className="text-[11px] font-mono font-black text-emerald-600">
                              = {lineTotal.toFixed(2)} DA
                            </span>
                          </div>
                        </div>

                        {/* Contrôles Quantité Mobile */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.qty <= 1) {
                                setCartItems(cartItems.filter((i) => i.id !== item.id));
                                showToast(`Article retiré`);
                              } else {
                                setCartItems(
                                  cartItems.map((i) =>
                                    i.id === item.id ? { ...i, qty: i.qty - 1 } : i
                                  )
                                );
                              }
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold transition-colors ${
                              item.qty === 1
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            title={item.qty === 1 ? 'Supprimer' : 'Diminuer'}
                          >
                            {item.qty === 1 ? (
                              <Trash2 className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Minus className="w-3 h-3" />
                            )}
                          </button>

                          <span className="w-6 text-center text-xs font-mono font-black">
                            {item.qty}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setCartItems(
                                cartItems.map((i) =>
                                  i.id === item.id ? { ...i, qty: i.qty + 1 } : i
                                )
                              );
                            }}
                            className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold transition-colors"
                            title="Augmenter"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── FOOTER DU PANIER / TOTAL & ENCAISSEMENT ── */}
            {cartItems.length > 0 && (
              <div className="p-3 bg-white border-t border-slate-200 space-y-2.5 shrink-0 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    Total Ticket ({cartItems.reduce((acc, i) => acc + i.qty, 0)} art.)
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900">
                    {cartTotal.toFixed(2)} DA
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDailySales((prev) => prev + cartTotal);
                    setItemsSold((prev) => prev + cartItems.reduce((s, i) => s + i.qty, 0));
                    setCartItems([]);
                    showToast(`✓ Vente validée : ${cartTotal.toFixed(2)} DA`);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-600/25 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Encaisser Maintenant ({cartTotal.toFixed(2)} DA)</span>
                </button>
              </div>
            )}
            </div>
          </div>
        )}

        {/* ══ ONGLET 3 : NOVAIA ASSISTANT COPILOT ✨ (DÉSACTIVÉ TEMPORAIREMENT) ══ */}
        {/*
        {activeTab === 'novaia' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50 pb-20 w-full">
            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-amber-400 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-tight text-white">NovaIA Copilot ✨</h3>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En direct avec votre stock
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatMessages([chatMessages[0]])}
                className="text-[10px] font-bold text-slate-400 hover:text-white"
              >
                Effacer
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                    <div className={`text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {msg.time}
                    </div>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isAiTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="bg-white px-3 py-2 rounded-2xl border border-slate-200 flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {['Produits en rupture ?', 'Prévisions de ventes demain', 'Analyser mes marges', 'Chiffre d\'aujourd\'hui'].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer border border-indigo-200/50"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Posez une question sur le magasin..."
                className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            </div>
          </div>
        )}
        */}

        {/* ══ ONGLET 4 : PARAMÈTRES MOBILE (SETTINGS) ══ */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 pb-28 sm:pb-24 w-full">
            <div className="w-full max-w-3xl mx-auto space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Configuration Mobile</h3>
            
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center">
                  BZ
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">BZ Technology (Gérant)</div>
                  <div className="text-[10px] text-slate-400 font-mono">ID POS: CAISSE-MOBILE-01</div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Synchronisation Serveur</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Connecté
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs font-bold text-slate-700">
              <div className="p-3.5 flex items-center justify-between">
                <span>Mode Offline (Sans Connexion)</span>
                <span className="text-indigo-600 font-mono">Actif ✓</span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span>Vibreur au scan code-barres</span>
                <span className="text-emerald-600">Activé</span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span>Version PWA / Capacitor</span>
                <span className="text-slate-400 font-mono text-[10px]">v2.6.4 Mobile</span>
              </div>
            </div>

            {onExitMobile && (
              <button
                type="button"
                onClick={onExitMobile}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
              >
                Retourner à l'interface Caisse Complète (PC)
              </button>
            )}
            </div>
          </div>
        )}

        {/* ── 3. BOTTOM NAVIGATION BAR (Fixée en bas, pleine largeur avec onglets centrés) ── */}
        <nav
          className="absolute bottom-0 inset-x-0 w-full bg-white border-t border-gray-200 pt-2 pb-6 sm:pb-3.5 z-40 shadow-lg"
          style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom, 1.75rem))' }}
        >
          <div className="w-full max-w-lg mx-auto flex justify-around items-center">
          
          {/* Onglet Accueil */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'home' ? 'text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className={`text-[10px] ${activeTab === 'home' ? 'font-black' : 'font-medium'}`}>
              Accueil
            </span>
            {activeTab === 'home' && <span className="w-1 h-1 rounded-full bg-indigo-600" />}
          </button>

          {/* Onglet Panier / POS */}
          <button
            type="button"
            onClick={() => setActiveTab('cart')}
            className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer relative ${
              activeTab === 'cart' ? 'text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-rose-600 text-white text-[8px] font-black flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
            <span className={`text-[10px] ${activeTab === 'cart' ? 'font-black' : 'font-medium'}`}>
              Panier
            </span>
            {activeTab === 'cart' && <span className="w-1 h-1 rounded-full bg-indigo-600" />}
          </button>

          {/* Onglet NovaIA ✨ (Désactivé temporairement) */}
          {/*
          <button
            type="button"
            onClick={() => setActiveTab('novaia')}
            className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'novaia' ? 'text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <span className={`text-[10px] ${activeTab === 'novaia' ? 'font-black text-indigo-700' : 'font-medium'}`}>
              NovaIA ✨
            </span>
            {activeTab === 'novaia' && <span className="w-1 h-1 rounded-full bg-indigo-600" />}
          </button>
          */}

          {/* Onglet Paramètres */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'settings' ? 'text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Settings className="w-5 h-5 stroke-[2.2]" />
            <span className={`text-[10px] ${activeTab === 'settings' ? 'font-black' : 'font-medium'}`}>
              Paramètres
            </span>
            {activeTab === 'settings' && <span className="w-1 h-1 rounded-full bg-indigo-600" />}
          </button>
          </div>
        </nav>

        {/* ══ CENTRE DE NOTIFICATIONS & ALERTES DE STOCK (CLOCHE 🔔) ══ */}
        {isAlertsOpen && (
          <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex flex-col justify-end animate-in fade-in"
            onClick={() => setIsAlertsOpen(false)}
          >
            <div
              className="bg-white rounded-t-[32px] p-5 space-y-4 shadow-2xl max-h-[85%] flex flex-col animate-in slide-in-from-bottom duration-200 border-t border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Poignée de glissement */}
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 mb-1" />

              {/* Header du panneau de notification */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center relative shadow-2xs">
                    <Bell className="w-5 h-5 text-rose-600" />
                    {alerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                        {alerts.length}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">Centre de Notifications</h3>
                    <p className="text-[11px] text-slate-400">
                      {alerts.length > 0
                        ? `${alerts.length} alerte(s) de stock en attente`
                        : 'Toutes les alertes sont traitées'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {alerts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAlerts([]);
                        showToast('Toutes les alertes ont été effacées');
                      }}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Tout effacer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAlertsOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Liste défilante des alertes */}
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[50vh] pr-0.5">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner font-black">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Aucune alerte active</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-[240px] mx-auto">
                        Toutes vos alertes ont été traitées ou ignorées. Vos niveaux de stock sont sous contrôle !
                      </p>
                    </div>
                  </div>
                ) : (
                  alerts.map((al) => (
                    <div
                      key={al.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        al.severity === 'danger'
                          ? 'bg-rose-50/70 border-rose-200/90 text-rose-950'
                          : 'bg-amber-50/70 border-amber-200/90 text-amber-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="text-xl mt-0.5 shrink-0">
                            {al.severity === 'danger' ? '🚨' : '⚠️'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  al.severity === 'danger'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {al.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {al.time || 'Récemment'}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 mt-1 truncate">
                              {al.product}
                            </h4>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                              Stock restant :{' '}
                              <strong className="font-black text-rose-600">
                                {al.stock} unité(s)
                              </strong>
                              {al.supplier ? ` • Fournisseur : ${al.supplier}` : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setAlerts(alerts.filter((a) => a.id !== al.id));
                            showToast(`Alerte "${al.product}" retirée`);
                          }}
                          className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                          title="Ignorer l'alerte"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Actions rapides par alerte (Copilote désactivé temporairement) */}
                    </div>
                  ))
                )}
              </div>

              {/* Bouton de fermeture */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsAlertsOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL SCANNER CODE-BARRES VIRTUEL & CAMÉRA RÉELLE MOBILE ══ */}
        {isScannerOpen && (
          <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col justify-between overflow-hidden select-none">
            {/* Input photo caché pour capture Android native (Fonctionne même en HTTP !) */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={photoInputRef}
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {/* FLUX VIDÉO CAMÉRA EN DIRECT (Monté en continu pour que videoRef soit immédiatement attaché) */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="absolute inset-0 w-full h-full object-cover z-0 bg-black"
            />

            {/* ── TOP BAR DU SCANNER ── */}
            <div className="relative z-20 px-4 pt-4 pb-2 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Scanner Caméra</h3>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {cameraStatus === 'active' ? 'Caméra en direct active' : 'Mode Scanner Mobile'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isTorchAvailable && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isTorchOn
                        ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/40'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title="Lampe Torche"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── ZONE CENTRALE : VISEUR OU AVERTISSEMENT HTTP CHROME ── */}
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 text-center">
              {cameraStatus === 'error' && cameraErrorType === 'HTTP_RESTRICTION' ? (
                /* Écran explicatif propre si Chrome bloque le flux vidéo direct en HTTP */
                <div className="max-w-xs mx-auto bg-slate-900/95 border border-amber-500/40 rounded-3xl p-5 space-y-3.5 shadow-2xl backdrop-blur-md">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl font-black">
                    📸
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Scanner Caméra Android</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Chrome bloque le flux vidéo en direct sur les adresses IP (<strong>92.168.100.30</strong>) non HTTPS.
                    </p>
                  </div>

                  {/* BOUTON CLÉ : APPAREIL PHOTO DIRECT (FONCTIONNE À 100% EN HTTP !) */}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Prendre Photo avec l'Appareil</span>
                  </button>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-center text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShowHttpGuide(!showHttpGuide)}
                      className="text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showHttpGuide ? 'Masquer astuce' : 'Activer flux direct dans Chrome ?'}</span>
                    </button>
                  </div>

                  {showHttpGuide && (
                    <div className="p-3 bg-slate-950 rounded-xl text-[10px] text-left text-slate-400 space-y-1.5 border border-slate-800 font-mono">
                      <div>1. Ouvrez dans Chrome : <strong>chrome://flags</strong></div>
                      <div>2. Cherchez : <em>Insecure origins treated as secure</em></div>
                      <div>3. Ajoutez : <strong>http://92.168.100.30:3000</strong></div>
                      <div>4. Activez (Enabled) et relancez Chrome !</div>
                    </div>
                  )}
                </div>
              ) : (
                /* VISEUR MODERNE EN COURS DE SCAN */
                <div className="flex flex-col items-center gap-3">
                  <div className="w-64 h-64 border-2 border-indigo-400 rounded-3xl relative flex items-center justify-center overflow-hidden shadow-[0_0_35px_rgba(99,102,241,0.6)] bg-transparent">
                    {/* Coins de cadrage professionnels */}
                    <div className="absolute top-2 left-2 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

                    {/* Ligne laser animée */}
                    <div className="absolute inset-x-0 h-1 bg-rose-500 shadow-[0_0_15px_#f43f5e] animate-pulse" />
                    <ScanLine className="w-24 h-24 text-white/20" />
                  </div>
                  <p className="text-xs font-bold text-white bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-xs">
                    Alignez le code-barres dans le cadre
                  </p>
                </div>
              )}
            </div>

            {/* ── COMMANDES ET ACTIONS EN BAS ── */}
            <div className="relative z-20 p-4 pb-8 space-y-3 bg-gradient-to-t from-black via-black/90 to-transparent">
              {/* Boutons d'actions */}
              <div className="flex items-center gap-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex-1 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-black rounded-xl border border-white/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Prendre Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsScannerOpen(false);
                    setIsManualInputOpen(true);
                  }}
                  className="flex-1 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-black rounded-xl border border-white/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Keyboard className="w-4 h-4 text-indigo-400" />
                  <span>Saisie Code</span>
                </button>
              </div>

              {/* Raccourcis de simulation démo */}
              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => handleSimulateScan('Pain Baguette Ordinaire', 10, 'NB-PAIN')}
                  className="py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>🥖</span>
                  <span>Pain (10 DA)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateScan('Lait Candia Viva Stérilisé 1L', 135, '6130001000018')}
                  className="py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>🥛</span>
                  <span>Lait (135 DA)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(false)}
                className="w-full max-w-sm mx-auto block py-2 text-xs text-slate-400 hover:text-white font-bold transition-colors cursor-pointer text-center"
              >
                Fermer le scanner
              </button>
            </div>
          </div>
        )}

        {/* ══ MODAL SAISIE MANUELLE ══ */}
        {isManualInputOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 w-full max-w-xs space-y-4 shadow-2xl">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-900 uppercase">Saisie Manuelle</h4>
                <button onClick={() => setIsManualInputOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Code-barres ou nom..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (manualCode) {
                    const clean = manualCode.trim();
                    const found = allCatalogProducts.find(
                      (p) =>
                        p.barcode === clean ||
                        (p.barcode && clean.includes(p.barcode)) ||
                        p.name.toLowerCase() === clean.toLowerCase()
                    );
                    if (found) {
                      playMobileSound('success');
                      try {
                        if (navigator.vibrate) navigator.vibrate(60);
                      } catch (e) {}
                      handleAddToCart(found, 1);
                      showToast(`✓ Ajouté : ${found.name} (${found.price.toFixed(2)} DA)`);
                    } else {
                      playMobileSound('error');
                      try {
                        if (navigator.vibrate) navigator.vibrate([120, 80, 160]);
                      } catch (e) {}
                      showToast(`⚠️ Ce produit n'existe pas dans le catalogue (Code: ${clean})`, 'warning');
                    }
                    setManualCode('');
                    setIsManualInputOpen(false);
                  }
                }}
                className="w-full py-3 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        )}

        {/* ══ MODAL SCANNER FACTURE IA MOBILE (OCR PRO) (DÉSACTIVÉ TEMPORAIREMENT) ══ */}
        {false && isOcrOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col justify-between overflow-hidden">
            {/* Étape 1 : Prise de vue / Sélection du document */}
            {ocrStep === 'capture' && (
              <div className="flex-1 flex flex-col justify-between p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">OCR Facture IA</span>
                      <p className="text-[10px] text-slate-400">Scan & Réconciliation Stock</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsOcrOpen(false)} 
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Cadre Visuel Décoratif */}
                <div className="text-center space-y-4 my-auto">
                  <div className="relative mx-auto w-44 h-52 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-slate-900/90 flex flex-col items-center justify-center p-4 shadow-2xl shadow-emerald-950/60">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-2">
                      <FileText className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-black text-slate-200">Facture Papier ou Bon</span>
                    <span className="text-[9px] text-slate-400 mt-1">Numérisation automatique des lignes</span>
                    
                    {/* Repères d'angle */}
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">Scanner une Facture Fournisseur</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Prenez en photo votre bon ou facture. NovaIA extrait les produits et alimente votre stock instantanément.
                    </p>
                  </div>
                </div>

                {/* Inputs Fichiers Masqués */}
                <input 
                  ref={invoiceCameraInputRef} 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={handleInvoiceFileSelected} 
                />
                <input 
                  ref={invoiceGalleryInputRef} 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="hidden" 
                  onChange={handleInvoiceFileSelected} 
                />

                {/* Boutons d'Action Inférieurs */}
                <div className="space-y-2.5 pb-2">
                  <button
                    type="button"
                    onClick={() => invoiceCameraInputRef.current?.click()}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Prendre Photo de la Facture</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => invoiceGalleryInputRef.current?.click()}
                      className="py-3 bg-slate-900 border border-slate-700 hover:border-slate-600 active:scale-[0.98] text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span>Fichier / Galerie</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartDemoInvoice}
                      className="py-3 bg-emerald-950/60 border border-emerald-600/40 hover:bg-emerald-900/60 active:scale-[0.98] text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>Démo Candia (Test)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOcrOpen(false)}
                    className="w-full py-2 text-xs text-slate-400 font-bold hover:text-white cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}

            {/* Étape 2 : Animation de scan laser & OCR en temps réel */}
            {ocrStep === 'scanning' && (
              <div className="flex-1 flex flex-col justify-between p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span className="text-xs font-black uppercase text-emerald-400">Analyse Nova OCR en cours...</span>
                  </div>
                  <span className="text-xs font-black text-cyan-400">{ocrProgress}%</span>
                </div>

                {/* Viseur de scan laser */}
                <div className="my-auto space-y-5">
                  <div className="relative mx-auto w-64 h-72 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-900 shadow-2xl shadow-emerald-500/20">
                    {ocrInvoiceImage ? (
                      <img src={ocrInvoiceImage} alt="Facture" className="w-full h-full object-cover opacity-75" />
                    ) : (
                      <div className="p-4 space-y-2.5 opacity-80 select-none">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                          <span className="text-[11px] font-black text-emerald-400">CANDIA ALGÉRIE</span>
                          <span className="text-[9px] text-slate-400">FAC-2026-7841</span>
                        </div>
                        <div className="space-y-1.5 py-2">
                          <div className="h-2.5 bg-slate-700/80 rounded w-4/5" />
                          <div className="h-2 bg-slate-800 rounded w-full" />
                          <div className="h-2 bg-slate-800 rounded w-5/6" />
                          <div className="h-2 bg-slate-800 rounded w-3/4" />
                          <div className="h-2.5 bg-slate-700/80 rounded w-2/3" />
                        </div>
                        <div className="pt-2 border-t border-slate-700 flex justify-between">
                          <div className="h-3 bg-emerald-500/30 rounded w-16" />
                          <div className="h-3 bg-cyan-500/40 rounded w-20" />
                        </div>
                      </div>
                    )}

                    {/* Faisceau Laser */}
                    <div 
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#34d399] transition-all duration-300"
                      style={{ top: `${Math.min(95, Math.max(5, ocrProgress))}%` }}
                    />
                    <div 
                      className="absolute inset-x-0 h-16 bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none transition-all duration-300"
                      style={{ top: `${Math.min(85, Math.max(0, ocrProgress - 15))}%` }}
                    />
                  </div>

                  {/* Barre de Progression & Message dynamique */}
                  <div className="space-y-2 text-center max-w-xs mx-auto">
                    <div className="w-full bg-slate-900 border border-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                    <p className="text-xs font-bold text-slate-300 transition-all min-h-[32px] flex items-center justify-center">
                      {ocrProgressMsg}
                    </p>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-500 pb-2">
                  Traitement OCR NovaIA Mobile • Conforme gestion de stock
                </div>
              </div>
            )}

            {/* Étape 3 : Résultat de l'extraction, Réconciliation & Édition Interactive */}
            {ocrStep === 'result' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Header */}
                <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setOcrStep('capture')}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 active:scale-95 cursor-pointer"
                      title="Reprendre une photo"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black uppercase text-white">Facture Fournisseur</h4>
                        {ocrScanMode === 'real_ai' ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                            ✨ IA Gemini
                          </span>
                        ) : ocrScanMode === 'demo' ? (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                            ⚡ Mode Démo
                          </span>
                        ) : (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-bold">
                            📷 Photo Réelle
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">Vérifiez et ajustez vos articles avant injection</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {ocrInvoiceImage && (
                      <button
                        type="button"
                        onClick={() => setIsPhotoPreviewOpen(true)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Photo</span>
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => setIsOcrOpen(false)} 
                      className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contenu Défilable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* Bannière d'aide & Clé Gemini IA */}
                  {ocrScanMode !== 'real_ai' && (
                    <div className="p-3 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/80 border border-indigo-500/40 rounded-2xl flex items-center justify-between gap-2 shadow-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-black text-indigo-300">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                          <span>Activer l'IA Gemini Vision</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-tight mt-0.5">
                          Pour que NovaIA lise et sorte 100% des articles de vos vraies photos automatiquement.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempApiKeyInput(geminiApiKey);
                          setIsGeminiKeyModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-[10px] rounded-xl flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                      >
                        <Key className="w-3 h-3" />
                        <span>Clé Gratuite</span>
                      </button>
                    </div>
                  )}

                  {/* Carte En-tête Facture (Modifiable) */}
                  <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Fournisseur</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTempSupplierForm({
                                supplierName: ocrInvoiceData.supplierName,
                                invoiceNumber: ocrInvoiceData.invoiceNumber
                              });
                              setIsEditingSupplierModalOpen(true);
                            }}
                            className="text-[10px] text-cyan-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>Modifier</span>
                          </button>
                        </div>
                        <h3 className="text-sm font-black text-white truncate">{ocrInvoiceData.supplierName}</h3>
                        <span className="text-[10px] text-slate-400">Réf: {ocrInvoiceData.invoiceNumber} • {ocrInvoiceData.date}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Total Facture (TTC)</span>
                        <div className="text-sm font-black text-emerald-400">
                          {Math.round(ocrInvoiceData.items.reduce((acc, it) => acc + (Number(it.buyPrice) * Number(it.quantity)), 0) * 1.19).toLocaleString()} DA
                        </div>
                      </div>
                    </div>

                    {/* Statut de Réconciliation */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Réconciliation stock :</span>
                      <div className="flex gap-1.5">
                        <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {ocrInvoiceData.items.filter(it => it.isKnown).length} réconciliés
                        </span>
                        {ocrInvoiceData.items.filter(it => !it.isKnown).length > 0 && (
                          <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {ocrInvoiceData.items.filter(it => !it.isKnown).length} à créer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Liste des Lignes Extraites & Éditables */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-black uppercase text-slate-400">
                        Articles de la facture ({ocrInvoiceData.items.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddNewOcrLine}
                        className="text-[10px] bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 px-2 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ajouter article</span>
                      </button>
                    </div>

                    {ocrInvoiceData.items.length === 0 ? (
                      <div className="p-6 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
                        <p className="text-xs">Aucun article dans cette facture.</p>
                        <button
                          type="button"
                          onClick={handleAddNewOcrLine}
                          className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                        >
                          + Ajouter le 1er article
                        </button>
                      </div>
                    ) : (
                      ocrInvoiceData.items.map((item) => (
                        <div 
                          key={item.tempId}
                          className={`p-3 rounded-xl border transition-all ${
                            item.isKnown 
                              ? 'bg-slate-900/70 border-slate-800' 
                              : 'bg-amber-950/25 border-amber-500/40'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h5 className="text-xs font-black text-white truncate">{item.name}</h5>
                                <button
                                  type="button"
                                  onClick={() => setEditingOcrItem(item)}
                                  className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                  title="Modifier"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-mono">Code: {item.barcode}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-emerald-400">
                                {(Number(item.buyPrice || 0) * Number(item.quantity || 1)).toLocaleString()} DA
                              </span>
                              <div className="text-[10px] text-slate-400">
                                P.U: <strong className="text-white">{item.buyPrice} DA</strong>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-between items-center">
                            {/* Contrôle rapide de la quantité */}
                            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                              <span className="text-[10px] text-slate-400">Qté:</span>
                              <button
                                type="button"
                                onClick={() => handleQuickChangeQty(item.tempId, -1)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-black cursor-pointer active:scale-95"
                              >
                                -
                              </button>
                              <span className="text-xs font-black text-white px-1">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleQuickChangeQty(item.tempId, 1)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-black cursor-pointer active:scale-95"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.isKnown ? (
                                <span className="text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Réconcilié
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleQuickCreateOcrProduct(item)}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                  <span>Créer catalogue</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteOcrItem(item.tempId)}
                                className="w-6 h-6 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 flex items-center justify-center cursor-pointer active:scale-95"
                                title="Supprimer cet article"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer Fixe pour Validation Stock */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleFinalValidateOcrInvoice}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>Valider & Injecter en Stock (+{ocrInvoiceData.items.reduce((acc, it) => acc + Number(it.quantity || 0), 0)} Pièces)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOcrStep('capture')}
                    className="w-full py-1 text-center text-xs text-slate-400 hover:text-slate-200 font-bold cursor-pointer"
                  >
                    Reprendre une photo
                  </button>
                </div>
              </div>
            )}

            {/* ── MODAL 1 : PRÉVISUALISATION PHOTO FACTURE ── */}
            {isPhotoPreviewOpen && ocrInvoiceImage && (
              <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col justify-between p-4 animate-in fade-in">
                <div className="flex justify-between items-center text-white pb-2">
                  <span className="text-xs font-black uppercase text-cyan-300">Photo originale de la facture</span>
                  <button
                    type="button"
                    onClick={() => setIsPhotoPreviewOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 flex items-center justify-center overflow-auto p-2">
                  <img src={ocrInvoiceImage} alt="Facture originale" className="max-h-full max-w-full object-contain rounded-xl shadow-2xl" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoPreviewOpen(false)}
                  className="w-full py-3 bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Fermer la photo
                </button>
              </div>
            )}

            {/* ── MODAL 2 : MODIFIER / AJOUTER UN ARTICLE DE FACTURE ── */}
            {editingOcrItem && (
              <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white space-y-3 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase text-emerald-400">Modifier l'article</h4>
                    <button
                      type="button"
                      onClick={() => setEditingOcrItem(null)}
                      className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveOcrItemEdit} className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Désignation</label>
                      <input
                        type="text"
                        value={editingOcrItem.name}
                        onChange={(e) => setEditingOcrItem({ ...editingOcrItem, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-emerald-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Quantité</label>
                        <input
                          type="number"
                          min="1"
                          value={editingOcrItem.quantity}
                          onChange={(e) => setEditingOcrItem({ ...editingOcrItem, quantity: Number(e.target.value) || 1 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">P. Achat (DA)</label>
                        <input
                          type="number"
                          min="0"
                          value={editingOcrItem.buyPrice}
                          onChange={(e) => setEditingOcrItem({ ...editingOcrItem, buyPrice: Number(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">P. Vente (DA)</label>
                        <input
                          type="number"
                          min="0"
                          value={editingOcrItem.suggestedSellPrice}
                          onChange={(e) => setEditingOcrItem({ ...editingOcrItem, suggestedSellPrice: Number(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-cyan-400 focus:outline-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Code-barres</label>
                        <input
                          type="text"
                          value={editingOcrItem.barcode}
                          onChange={(e) => setEditingOcrItem({ ...editingOcrItem, barcode: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-black text-xs rounded-xl text-white cursor-pointer"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDeleteOcrItem(editingOcrItem.tempId);
                          setEditingOcrItem(null);
                        }}
                        className="px-3 py-2.5 bg-red-600/30 hover:bg-red-600/50 text-red-400 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Supprimer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── MODAL 3 : MODIFIER FOURNISSEUR & RÉF FACTURE ── */}
            {isEditingSupplierModalOpen && (
              <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white space-y-3 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase text-cyan-400">Modifier l'en-tête</h4>
                    <button
                      type="button"
                      onClick={() => setIsEditingSupplierModalOpen(false)}
                      className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveSupplierEdit} className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nom du Fournisseur</label>
                      <input
                        type="text"
                        value={tempSupplierForm.supplierName}
                        onChange={(e) => setTempSupplierForm({ ...tempSupplierForm, supplierName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-cyan-500"
                        placeholder="Ex: Distributeur Boissons Hamoud"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">N° de Facture ou Bon</label>
                      <input
                        type="text"
                        value={tempSupplierForm.invoiceNumber}
                        onChange={(e) => setTempSupplierForm({ ...tempSupplierForm, invoiceNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-cyan-500"
                        placeholder="Ex: FAC-2026-0042"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 font-black text-xs rounded-xl text-white cursor-pointer mt-2"
                    >
                      Mettre à jour
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── MODAL 4 : CONFIGURER CLÉ GEMINI IA GRATUITE ── */}
            {/* Modal Clé Gemini (Désactivé temporairement) */}
            {false && isGeminiKeyModalOpen && (
              <div className="fixed inset-0 z-[115] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="w-full max-w-sm bg-slate-900 border border-indigo-500/50 rounded-2xl p-4 text-white space-y-3 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <Key className="w-4 h-4" />
                      <h4 className="text-xs font-black uppercase">Clé API Google Gemini</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsGeminiKeyModalOpen(false)}
                      className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Obtenez une clé API gratuite sur Google AI Studio. Une fois collée ici, NovaIA lit directement 100% des articles, quantités et prix de vos vraies photos de factures !
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Votre Clé API Gemini</label>
                    <input
                      type="password"
                      value={tempApiKeyInput}
                      onChange={(e) => setTempApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-indigo-500"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveGeminiKey}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl cursor-pointer"
                    >
                      Enregistrer la clé
                    </button>

                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 text-center text-[11px] text-indigo-300 hover:underline block font-semibold"
                    >
                      🔗 Obtenir une clé Gemini gratuite sur Google AI Studio
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
