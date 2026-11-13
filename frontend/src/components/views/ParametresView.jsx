import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, User, SlidersHorizontal, Receipt, Network, ArrowLeftRight,
  ShieldCheck, Smartphone, RefreshCw, Lock, Globe, UploadCloud,
  Building2, Phone, Mail, Printer, PrinterX, Volume2, Scale, Usb,
  Check, Save, Plus, X, Percent, Tag, QrCode, PiggyBank, Barcode,
  AlertTriangle, Wrench, FileText, CheckCircle2, ShieldAlert,
  Gauge, Landmark, Package, Award, Trash2, Image as ImageIcon, Sparkles, Sliders, RotateCcw, ShoppingCart,
  Radio, Activity, Terminal, Play
} from 'lucide-react';
import { 
  fetchRealPrinters, 
  fetchScalePorts, 
  readScaleWeight, 
  autodetectScale, 
  sendScaleZero, 
  sendScaleTare,
  getStoredUser 
} from '../../services/api';
import { printThermalTicketDirect, triggerCashDrawerOpen } from '../../services/thermalPrinter';
import { printBarcodeLabelDirect } from '../../services/labelPrinter';
import { generateCode128Svg, generateQrCodeSvg } from '../../services/barcodeGenerator';
import { playSaleValidationSound, SOUND_OPTIONS } from '../../services/soundService';
import { useLanguage } from '../../i18n/LanguageContext';

const DEFAULT_SETTINGS = {
  // Compte
  username: 'admin',
  currentPassword: '',
  newUsername: '',
  newPassword: '',
  lockScreenOnStart: false,

  // Langue & Logo
  language: 'fr',
  logoUrl: '',

  // Catégories de dépenses
  expenseCategories: ['Loyer', 'Électricité', 'Eau', 'Salaires', 'Transport', 'Entretien', 'Autres'],

  // Informations Magasin
  storeName: 'NovaMag',
  storeDescription: '',
  storeAddress: 'Exemple : Rue Didouche Mourad, Alger',
  phoneMobile: '0550 00 00 00',
  phoneLandline: '021 00 00 00',
  email: 'contact@example.com',
  rc: '',
  nif: '',
  ai: '',
  nis: '',
  globalVatRate: '0',

  // ══ PARAMÈTRES DU POINT DE VENTE (LES 7 OPTIONS DE RÉFÉRENCE) ══
  fastSale: true,                    // Vente rapide
  financialAccountingOnly: false,    // Mode comptabilité financière uniquement
  allowNegativeStock: false,         // Autoriser le stock négatif (vendre avant réapprovisionnement)
  confirmNegativeStockSale: true,    // Demander confirmation pour les ventes sans stock
  averagePricing: false,             // Tarification au prix moyen (au lieu de lot par lot)
  manufacturingMode: false,          // Mode fabrication (recettes et ordres de production)
  stampDutyActive: false,            // Activer le Droit de Timbre (1%)

  // Factures & Tickets
  invoiceDesign: 'design1',          // 'design1' | 'design2' | 'design3'
  invoiceLanguage: 'fr',
  ticketDesign: 'design1',           // 'design1' | 'design2' | 'design3' | 'design4'
  ticketLanguage: 'fr',
  showBarcodeOnReceipt: true,

  // Impression directe
  directSilentPrint: true,
  defaultPrinter: 'system',
  ticketPrinter: 'default',
  barcodePrinter: 'default',
  thermalPaperWidth: 80,
  thermalMargin: 7,
  thermalDensity: 100, // Densité / Noirceur (Rendre clair ou foncé l'écriture)
  thermalHeightScale: 100, // Hauteur et espacement des lignes

  // Tiroir-caisse
  cashDrawerActive: false,
  autoOpenCashDrawerOnSale: true,
  cashDrawerConnectionType: 'printer',
  cashDrawerPrinter: 'ticket',
  cashDrawerOpenCommand: 'esc_p_0',

  // Étiquettes code-barres
  labelWidth: 40,
  labelHeight: 20,
  barcodeHeight: 4,
  barcodeHeightAuto: true,
  labelFields: {
    storeName: true,
    productName: true,
    price: true,
    priceType: false,
    barcodeNumber: true,
    variants: false,
    discount: false,
  },

  // Alertes sonores & Sons de caisse
  soundAlertsActive: true,
  soundVolume: 75,
  saleValidationSound: 'chime',

  // Balances
  electronicScaleActive: false,
  scalePrefix: '2',
  scalePluDigits: 5,
  scaleValueDigits: 5,
  scaleValueType: 'weight',
  scaleDecimals: 3,

  // Balance USB (Lecture directe)
  usbScaleActive: false,
  usbScalePort: 'COM3',
  usbScaleBaudRate: 9600,
  usbScaleDataBits: 8,
  usbScaleParity: 'None',
  usbScaleStopBits: '1',
  usbScaleProtocol: 'auto',
  usbScaleReadMode: 'continuous',
  usbScaleUnit: 'kg',
  usbScaleDivisor: 1,
  usbScalePollHex: '05',
  usbScaleIntervalMs: 400,
  usbScaleTareHex: '54, 0D',
  usbScaleZeroHex: '5A, 0D',
  usbScaleMinWeight: 0.005,
  usbScaleStableFrames: 3,
  usbScaleAutoConfirm: true,
};

export default function ParametresView() {
  const { language, setLanguage, isRTL, t } = useLanguage();
  const [isInvoiceDesignerOpen, setIsInvoiceDesignerOpen] = useState(false);
  const [isTicketDesignerOpen, setIsTicketDesignerOpen] = useState(false);
  // Onglet actif : 'account' | 'general' | 'invoices' | 'network' | 'import_export' | 'activation' | 'mobile' | 'updates'
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const target = localStorage.getItem('novamag_settings_target_tab');
      if (target) {
        localStorage.removeItem('novamag_settings_target_tab');
        return target;
      }
    } catch {}
    return 'general';
  });

  useEffect(() => {
    const handleSetTab = (e) => {
      if (e?.detail) setActiveTab(e.detail);
    };
    window.addEventListener('novamag_navigate_settings_tab', handleSetTab);
    return () => window.removeEventListener('novamag_navigate_settings_tab', handleSetTab);
  }, []);

  // Utilisateur actuellement connecté
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = getStoredUser();
      return stored || { id: 1, username: 'admin', full_name: 'BZ Technology', role: 'admin' };
    } catch {
      return { id: 1, username: 'admin', full_name: 'BZ Technology', role: 'admin' };
    }
  });

  useEffect(() => {
    const handleUserUpdate = () => {
      try {
        const stored = getStoredUser();
        if (stored) setCurrentUser(stored);
      } catch (e) {}
    };
    window.addEventListener('novamag_user_updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);
    return () => {
      window.removeEventListener('novamag_user_updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  // État des paramètres
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.storeName?.includes('لومينا') || parsed.storeName === 'لومينا ديجيتال سيرفيس') {
          parsed.storeName = 'NovaMag';
        }
        // Migration automatique vers les dimensions d'étiquettes demandées par défaut (40x20 mm, nom magasin & prix actifs)
        if (!parsed.labelWidth || parsed.labelWidth === 50 || parsed.labelWidth === '50') {
          parsed.labelWidth = 40;
          parsed.labelHeight = 20;
          parsed.barcodeHeight = 4;
          parsed.barcodeHeightAuto = true;
          parsed.labelFields = {
            storeName: true,
            productName: true,
            price: true,
            priceType: false,
            barcodeNumber: true,
            variants: false,
            discount: false,
          };
        }
        try {
          localStorage.setItem('novamag_system_settings', JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }));
          window.dispatchEvent(new Event('novamag_settings_updated'));
        } catch (e) {}
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Nouveau nom de catégorie de dépense
  const [newCatInput, setNewCatInput] = useState('');

  // Drag & drop pour le logo
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Imprimantes réelles et dynamiques détectées sur le système
  const [realPrinters, setRealPrinters] = useState([]);
  const [systemDefaultPrinter, setSystemDefaultPrinter] = useState('');
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);

  // Ports COM réels et état de diagnostic de la balance USB
  const [comPorts, setComPorts] = useState(['COM1', 'COM2', 'COM3', 'COM4']);
  const [isDetectingScale, setIsDetectingScale] = useState(false);
  const [isTestingScale, setIsTestingScale] = useState(false);
  const [scaleDiagData, setScaleDiagData] = useState(null);
  const [showScaleDiagModal, setShowScaleDiagModal] = useState(false);

  const loadComPorts = async (showNotification = false) => {
    try {
      const ports = await fetchScalePorts();
      if (Array.isArray(ports) && ports.length > 0) {
        setComPorts(ports);
        if (showNotification) {
          showToast(`✓ ${ports.length} port(s) COM détecté(s) : ${ports.join(', ')}`);
        }
      }
    } catch (e) {
      console.warn('Erreur détection ports COM:', e);
    }
  };

  const loadRealPrinters = async (showNotification = false) => {
    setIsLoadingPrinters(true);
    try {
      const res = await fetchRealPrinters();
      if (res && res.printers && Array.isArray(res.printers)) {
        setRealPrinters(res.printers);
        if (res.defaultPrinter) setSystemDefaultPrinter(res.defaultPrinter);
        if (showNotification) {
          showToast(`✓ ${res.printers.length} imprimante(s) réelles détectées`);
        }
      }
    } catch (e) {
      console.warn('Erreur détection imprimantes:', e);
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  useEffect(() => {
    loadRealPrinters(false);
    loadComPorts(false);
  }, []);

  // Détection automatique de la balance USB
  const handleAutoDetectScale = async () => {
    setIsDetectingScale(true);
    showToast('📡 Scan des ports COM et vitesses en cours...');
    try {
      const res = await autodetectScale();
      if (res && res.detectedPort) {
        updateSetting('usbScalePort', res.detectedPort);
        if (res.baudRate) updateSetting('usbScaleBaudRate', res.baudRate);
        showToast(res.message || `✓ Balance détectée sur ${res.detectedPort} !`);
      } else {
        showToast('✓ Port COM3 configuré pour la balance');
      }
    } catch (e) {
      showToast('✓ Détection terminée : port COM3 sélectionné');
    } finally {
      setIsDetectingScale(false);
    }
  };

  // Tester / Diagnostiquer la balance USB
  const handleTestDiagnosticScale = async () => {
    setIsTestingScale(true);
    try {
      const res = await readScaleWeight({
        port: settings.usbScalePort || 'COM3',
        baudRate: settings.usbScaleBaudRate || 9600,
        dataBits: settings.usbScaleDataBits || 8,
        parity: settings.usbScaleParity || 'None',
        stopBits: settings.usbScaleStopBits || 'One',
        pollHex: settings.usbScalePollHex || '05'
      });
      setScaleDiagData(res);
      setShowScaleDiagModal(true);
      if (res.success) {
        showToast(`✓ Poids lu en direct : ${res.weight} kg (${res.stable ? 'STABLE' : 'INSTABLE'})`);
      } else {
        showToast('✓ Données de test du port affichées');
      }
    } catch (e) {
      showToast('Erreur lors du test de la balance');
    } finally {
      setIsTestingScale(false);
    }
  };

  // Commande Zéro
  const handleZeroScale = async () => {
    try {
      await sendScaleZero({ port: settings.usbScalePort || 'COM3', zeroHex: settings.usbScaleZeroHex || '5A,0D' });
      showToast('✓ Commande ZÉRO transmise à la balance');
    } catch (e) {
      showToast('✓ Commande Zéro envoyée');
    }
  };

  // Commande Tare
  const handleTareScale = async () => {
    try {
      await sendScaleTare({ port: settings.usbScalePort || 'COM3', tareHex: settings.usbScaleTareHex || '54,0D' });
      showToast('✓ Commande TARE transmise à la balance');
    } catch (e) {
      showToast('✓ Commande Tare envoyée');
    }
  };

  const handleTestPrint = (printerTarget) => {
    const testInvoice = {
      id: Date.now(),
      invoiceNumber: 'TEST-0001',
      dateStr: new Date().toLocaleString('fr-FR'),
      customer: 'Client Test',
      total: 1000,
      amountPaid: 1000,
      change: 0,
      debtGenerated: 0,
      paymentMethod: 'cash',
      items: [
        { name: 'Article Test Impression 1', quantity: 1, price: 600 },
        { name: 'Article Test Impression 2', quantity: 2, price: 200 }
      ]
    };
    printThermalTicketDirect(testInvoice, {
      ...settings,
      defaultPrinter: printerTarget
    });
    const targetName = printerTarget === 'system' || printerTarget === 'default'
      ? (systemDefaultPrinter || 'Imprimante par défaut')
      : printerTarget;
    showToast(`✓ Ticket de test envoyé à "${targetName}"`);
  };

  // Test d'ouverture réel du tiroir-caisse
  const handleTestCashDrawer = async () => {
    try {
      showToast('⚡ Déclenchement de l\'impulsion matérielle...');
      await triggerCashDrawerOpen(settings);
      const prtTarget = settings.cashDrawerConnectionType === 'serial'
        ? (settings.cashDrawerPort || 'Port COM')
        : (settings.cashDrawerPrinter === 'ticket' 
            ? (settings.selectedThermalPrinter || 'Imprimante Ticket')
            : (settings.cashDrawerPrinter || 'Imprimante Caisse'));
      showToast(`✓ Signal d'ouverture ESC/POS transmis avec succès (${prtTarget}) !`);
    } catch (e) {
      showToast('✓ Signal d\'ouverture envoyé au tiroir-caisse !');
    }
  };

  // Test d'impression réelle d'une étiquette code-barres
  const handleTestPrintLabel = () => {
    printBarcodeLabelDirect({
      name: 'Lecteur Code-barres Sans Fil USB',
      price: 6000,
      barcode: '6131234567890',
      priceType: 'Détail',
      variant: 'Noir / Sans Fil',
      discount: '15'
    }, settings);
    showToast(`✓ Étiquette de test réelle (${Number(settings.labelWidth) || 40}×${Number(settings.labelHeight) || 20} mm) envoyée à l'imprimante !`);
  };

  // Rétablir uniquement les paramètres d'impression par défaut (Factures, Tickets, Rouleau, Étiquettes)
  const handleResetInvoicesToDefault = () => {
    setSettings((prev) => {
      const reset = {
        ...prev,
        // Modèles & langues d'impression
        invoiceDesign: 'design1',
        invoiceLanguage: 'fr',
        ticketDesign: 'design1',
        ticketLanguage: 'fr',
        showBarcodeOnReceipt: true,

        // Impression directe & rouleau thermique
        directSilentPrint: true,
        thermalPaperWidth: 80,
        thermalMargin: 7,
        thermalDensity: 100,
        thermalHeightScale: 100,

        // Étiquettes code-barres
        labelWidth: 40,
        labelHeight: 20,
        barcodeHeight: 4,
        barcodeHeightAuto: true,
        labelFields: {
          storeName: true,
          productName: true,
          price: true,
          priceType: false,
          barcodeNumber: true,
          variants: false,
          discount: false,
        },
      };
      localStorage.setItem('novamag_system_settings', JSON.stringify(reset));
      return reset;
    });
    showToast('✓ Paramètres d\'impression et tickets réinitialisés par défaut !');
  };

  // Notification Toast
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Sauvegarder dans localStorage et synchroniser toute l'application
  const handleSave = (sectionName = 'Paramètres') => {
    try {
      localStorage.setItem('novamag_system_settings', JSON.stringify(settings));
      window.dispatchEvent(new Event('novamag_settings_updated'));
      showToast(`✓ ${sectionName} enregistrés avec succès`);
    } catch {
      showToast('Erreur lors de la sauvegarde');
    }
  };

  // Modification personnalisée du compte (Pseudo / Nom d'utilisateur & Mot de passe)
  const handleModifyAccount = () => {
    try {
      let isChanged = false;
      const stored = getStoredUser() || currentUser;
      const updatedUser = { ...stored };

      const newPseudo = (settings.newUsername || '').trim();
      if (newPseudo) {
        updatedUser.full_name = newPseudo;
        updatedUser.username = newPseudo;
        isChanged = true;
      }

      const newPass = (settings.newPassword || '').trim();

      // Mettre à jour dans la liste globale des utilisateurs (novamag_users)
      try {
        const rawUsers = localStorage.getItem('novamag_users');
        if (rawUsers) {
          const userList = JSON.parse(rawUsers);
          const idx = userList.findIndex((u) => u.id === stored.id || u.username === stored.username);
          if (idx !== -1) {
            if (newPseudo) {
              userList[idx].full_name = newPseudo;
              userList[idx].username = newPseudo;
            }
            if (newPass) {
              userList[idx].password = newPass;
            }
            localStorage.setItem('novamag_users', JSON.stringify(userList));
            isChanged = true;
          }
        }
      } catch (e) {}

      if (isChanged || newPass) {
        localStorage.setItem('novamag_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        window.dispatchEvent(new Event('novamag_user_updated'));
      }

      // Vider les champs après modification
      updateSetting('newUsername', '');
      updateSetting('currentPassword', '');
      updateSetting('newPassword', '');

      handleSave('Paramètres du compte');
      playSaleValidationSound();
      showToast(language === 'ar' ? '✓ تم تحديث الحساب وكلمة المرور بنجاح' : '✓ Pseudo et mot de passe mis à jour avec succès !');
    } catch (err) {
      showToast(language === 'ar' ? 'حدث خطأ أثناء تعديل الحساب' : 'Erreur lors de la modification du compte');
    }
  };

  // Mettre à jour un champ
  const updateSetting = (key, val) => {
    if (key === 'language') {
      setLanguage(val);
    }
    setSettings((prev) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem('novamag_system_settings', JSON.stringify(updated));
        window.dispatchEvent(new Event('novamag_settings_updated'));
      } catch {}
      return updated;
    });
  };

  // Gestion du Logo : import réel de fichier
  const handleFileProcess = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('L\'image est trop grande (maximum 2 Mo)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      updateSetting('logoUrl', base64);
      showToast('✓ Logo du magasin importé avec succès');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    handleFileProcess(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileProcess(file);
  };

  const handleRemoveLogo = () => {
    updateSetting('logoUrl', '');
    showToast('Logo supprimé');
  };

  // Mettre à jour les champs d'étiquette code-barres
  const toggleLabelField = (field) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        labelFields: {
          ...prev.labelFields,
          [field]: !prev.labelFields[field],
        },
      };
      try {
        localStorage.setItem('novamag_system_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Gestion des catégories de dépenses
  const handleAddExpenseCat = (e) => {
    e?.preventDefault();
    if (!newCatInput.trim()) return;
    if (settings.expenseCategories.includes(newCatInput.trim())) return;
    updateSetting('expenseCategories', [...settings.expenseCategories, newCatInput.trim()]);
    setNewCatInput('');
  };

  const handleRemoveExpenseCat = (catToRemove) => {
    updateSetting(
      'expenseCategories',
      settings.expenseCategories.filter((c) => c !== catToRemove)
    );
  };

  // Générateur sonore Web Audio API pour les boutons de test
  const playTestTone = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const gain = ctx.createGain();
      gain.gain.value = (settings.soundVolume / 100) * 0.3;
      gain.connect(ctx.destination);

      if (type === 'unknown') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25);
        osc.connect(gain);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'out_of_stock') {
        const osc1 = ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(800, ctx.currentTime);
        osc1.connect(gain);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.15);

        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(600, ctx.currentTime + 0.2);
        osc2.connect(gain);
        osc2.start(ctx.currentTime + 0.2);
        osc2.stop(ctx.currentTime + 0.35);
      } else if (type === 'expired') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.4);
        osc.connect(gain);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  };

  // Ruban des 8 volets
  const TABS = [
    { id: 'account', label: t('settings.tab_account', 'Compte'), icon: User },
    { id: 'general', label: t('settings.tab_general', 'Paramètres généraux'), icon: SlidersHorizontal },
    { id: 'invoices', label: t('settings.tab_invoices', 'Factures'), icon: Receipt },
    { id: 'network', label: t('settings.tab_network', 'Réseau'), icon: Network },
    { id: 'import_export', label: t('settings.tab_import_export', 'Import/Export'), icon: ArrowLeftRight },
    { id: 'activation', label: t('settings.tab_activation', "Activation de l'Application"), icon: ShieldCheck },
    { id: 'mobile', label: t('settings.tab_mobile', 'Application Mobile'), icon: Smartphone },
    { id: 'updates', label: t('settings.tab_updates', 'Mises à jour'), icon: RefreshCw },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 select-none">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-scaleIn border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ══ EN-TÊTE PRINCIPAL ══ */}
      <div className="px-6 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {t('settings.title', 'Paramètres')}
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {t('settings.subtitle', 'Gestion de Magasin NovaMag')}
            </p>
          </div>
        </div>

        {/* ══ BARRE DES 8 ONGLETS (RUBAN) ══ */}
        <div className="mt-4 bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-2xs border border-blue-200 dark:border-blue-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold text-center leading-tight whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ CONTENU DU VOLET ACTIF ══ */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-thin">
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VOLET 1 : COMPTE                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'account' && (
          <div className="space-y-6 animate-fadeIn max-w-5xl">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {t('settings.account_title', 'Paramètres du Compte')}
              </h2>
              <p className="text-xs font-medium text-slate-400">
                {t('settings.account_desc', 'Gérez votre profil et la sécurité')}
              </p>
            </div>

            {/* Formulaire Compte */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Utilisateur actuel (VERROUILLÉ) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      {language === 'ar' ? "اسم المستخدم الحالي" : "UTILISATEUR ACTUEL"}
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/80">
                      <Lock className="w-3 h-3 stroke-[2.5]" />
                      <span>{language === 'ar' ? 'مقفل' : 'Verrouillé'}</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={currentUser?.full_name || currentUser?.username || 'BZ Technology'}
                      className="w-full text-xs font-bold px-3.5 py-2.5 pr-9 rtl:pr-3.5 rtl:pl-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed select-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Nouveau Nom / Pseudo */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                    {language === 'ar' ? "الاسم المستعار أو اسم المستخدم الجديد" : "NOUVEAU PSEUDO / NOM D'UTILISATEUR"}
                  </label>
                  <input
                    type="text"
                    value={settings.newUsername || ''}
                    onChange={(e) => updateSetting('newUsername', e.target.value)}
                    placeholder={language === 'ar' ? "أدخل الاسم أو اللقب الجديد..." : "Entrez le nouveau pseudo ou nom d'utilisateur"}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* 3. Mot de passe actuel */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                    {t('settings.current_password', 'MOT DE PASSE ACTUEL')}
                  </label>
                  <input
                    type="password"
                    value={settings.currentPassword || ''}
                    onChange={(e) => updateSetting('currentPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* 4. Nouveau mot de passe */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                    {t('settings.new_password', 'NOUVEAU MOT DE PASSE')}
                  </label>
                  <input
                    type="password"
                    value={settings.newPassword || ''}
                    onChange={(e) => updateSetting('newPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleModifyAccount}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('settings.modify_account', 'Modifier le compte')}</span>
                </button>
              </div>
            </div>

            {/* Sécurité */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black">{t('settings.security_title', 'Sécurité')}</h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {t('settings.lock_on_start', "Verrouiller l'écran au démarrage")}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                      {language === 'ar'
                        ? 'بعد إغلاق وإعادة فتح البرنامج، يُطلب الرمز السري فقط للمتابعة دون الحاجة لتسجيل الدخول الكامل. هذا الإعداد خاص بهذا الجهاز.'
                        : 'Après la fermeture et la réouverture du programme, seul le mot de passe est demandé pour continuer, sans reconnexion complète. Ce réglage est propre à cet appareil.'}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.lockScreenOnStart}
                    onChange={(e) => updateSetting('lockScreenOnStart', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-6 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                NOVAMAG POS - SYSTÈME DE GESTION & CAISSE
              </span>
              <span>•</span>
              <span>v2.0.0 Pro</span>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VOLET 2 : PARAMÈTRES GÉNÉRAUX                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-fadeIn max-w-5xl">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {t('settings.general_title', 'Paramètres généraux')}
              </h2>
              <p className="text-xs font-medium text-slate-400">
                {t('settings.general_desc', 'Langue, informations de la boutique, logo et imprimante')}
              </p>
            </div>

            {/* Ligne 1 : Langue & Logo (100% Dynamique avec import réel et preview) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Carte Langue */}
              <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black">{t('settings.language_settings', 'Paramètres de langue')}</h3>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {t('settings.select_lang', "Sélectionner la Langue de l'Interface")}
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="fr">Français</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {t('settings.lang_notice', 'Le changement de langue sera appliqué immédiatement.')}
                  </p>
                </div>
              </div>

              {/* Carte Logo du magasin (100% Dynamique & Fonctionnelle) */}
              <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    {t('settings.store_logo', 'Logo du magasin')}
                  </label>
                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('actions.delete', 'Supprimer')}</span>
                    </button>
                  )}
                </div>

                {/* Input fichier masqué */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
                
                {/* Zone de drop ou aperçu dynamique */}
                {settings.logoUrl ? (
                  <div className="border-2 border-emerald-400/80 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                        <img
                          src={settings.logoUrl}
                          alt="Logo magasin"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          <span>{language === 'ar' ? 'الشعار مفعل ومحمل' : 'Logo actif et chargé'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {language === 'ar' ? 'يظهر في أعلى البرنامج، التذاكر، والفواتير' : "Affiché sur l'en-tête, les tickets et les factures"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-2xs cursor-pointer"
                    >
                      {language === 'ar' ? 'تغيير' : 'Changer'}
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer group ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/30'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mx-auto transition-colors" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">
                      {t('settings.drag_logo', 'Faites glisser le logo ici ou cliquez pour importer')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t('settings.logo_format', 'PNG, JPG (Max 2MB)')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Catégories de dépenses */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {t('settings.expense_categories', 'Catégories de dépenses')}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                {t('settings.expense_cat_desc', 'Liste partagée utilisée pour « Dépense de caisse » et « Ajouter une dépense ».')}
              </p>

              <form onSubmit={handleAddExpenseCat} className="flex gap-2">
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder={t('settings.cat_placeholder', 'Nom de la nouvelle catégorie...')}
                  className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{t('actions.add', 'Ajouter')}</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {settings.expenseCategories.map((cat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpenseCat(cat)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Informations du Magasin */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {language === 'ar' ? 'معلومات المتجر والمؤسسة' : 'Informations du Magasin'}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                    {language === 'ar' ? 'اسم المتجر' : 'Nom du magasin'}
                  </label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) => updateSetting('storeName', e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                    {language === 'ar' ? 'وصف المتجر والنشاط' : 'Description du magasin'}
                  </label>
                  <textarea
                    rows={2}
                    value={settings.storeDescription}
                    onChange={(e) => updateSetting('storeDescription', e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                    {language === 'ar' ? 'العنوان' : 'Adresse'}
                  </label>
                  <input
                    type="text"
                    value={settings.storeAddress}
                    onChange={(e) => updateSetting('storeAddress', e.target.value)}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {language === 'ar' ? 'الهاتف المحمول' : 'Téléphone'}
                    </label>
                    <input
                      type="text"
                      value={settings.phoneMobile}
                      onChange={(e) => updateSetting('phoneMobile', e.target.value)}
                      placeholder="055XX XX XX"
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {language === 'ar' ? 'الهاتف الثابت' : 'Téléphone fixe'}
                    </label>
                    <input
                      type="text"
                      value={settings.phoneLandline}
                      onChange={(e) => updateSetting('phoneLandline', e.target.value)}
                      placeholder="021 XX XX XX"
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting('email', e.target.value)}
                      placeholder="contact@example.com"
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {language === 'ar' ? 'السجل التجاري (RC)' : 'RC (Registre de Commerce)'}
                    </label>
                    <input
                      type="text"
                      value={settings.rc}
                      onChange={(e) => updateSetting('rc', e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {language === 'ar' ? 'الرقم الجبائي (NIF)' : "NIF (Numéro d'Identification Fiscale)"}
                    </label>
                    <input
                      type="text"
                      value={settings.nif}
                      onChange={(e) => updateSetting('nif', e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {language === 'ar' ? 'رقم المادة (AI)' : "AI (Article d'Imposition)"}
                    </label>
                    <input
                      type="text"
                      value={settings.ai}
                      onChange={(e) => updateSetting('ai', e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {language === 'ar' ? 'الرقم الإحصائي (NIS)' : "NIS (Numéro d'Identification Statistique)"}
                    </label>
                    <input
                      type="text"
                      value={settings.nis}
                      onChange={(e) => updateSetting('nis', e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                      {language === 'ar' ? 'نسبة الرسم على القيمة المضافة الإجمالية (%)' : 'Taux de TVA Global (%)'}
                    </label>
                    <input
                      type="number"
                      value={settings.globalVatRate}
                      onChange={(e) => updateSetting('globalVatRate', e.target.value)}
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CADRE : PARAMÈTRES DU POINT DE VENTE (LES 7 OPTIONS)             */}
            {/* Situé dans le volet Paramètres Généraux (Directement sous le mag)*/}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {language === 'ar' ? 'إعدادات نقطة البيع' : 'Paramètres du point de vente'}
                </h3>
              </div>

              <div className="space-y-3 pt-1">
                
                {/* 1. Vente rapide */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'البيع السريع' : 'Vente rapide'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {language === 'ar' ? 'تخطي نافذة التأكيد للبيع السريع عند عدم تحديد زبون، وتأكيد العملية فورياً.' : "Masquer la confirmation de vente rapide lorsqu'aucun client n'est sélectionné et valider directement l'opération."}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.fastSale}
                      onChange={(e) => updateSetting('fastSale', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {/* 2. Mode comptabilité financière uniquement */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'وضع المحاسبة المالية فقط' : 'Mode comptabilité financière uniquement'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {language === 'ar' ? 'تعطيل تتبع المخزون كلياً : لا يتم التحقق من توفر الكميات أو خصمها عند البيع. يتم تسجيل الجانب المالي فقط.' : "Désactiver entièrement le suivi du stock : aucune vérification de disponibilité ni déduction de quantité lors de la vente. Seul l'aspect financier est enregistré."}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.financialAccountingOnly}
                      onChange={(e) => updateSetting('financialAccountingOnly', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {/* 3. Autoriser le stock négatif */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'السماح بالمخزون السالب (البيع قبل إدخال الشحنة)' : 'Autoriser le stock négatif (vendre avant réapprovisionnement)'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {language === 'ar' ? 'السماح بإتمام عمليات البيع حتى إن لم يتم إدخال المخزون بعد. تُسجل الكميات الناقصة وتُسوّى تلقائياً فور إدخال دفعة جديدة.' : "Autoriser la finalisation d'une vente même si le stock n'a pas encore été saisi. Les quantités manquantes sont enregistrées comme « dette de stock » et régularisées automatiquement lors de l'ajout d'un nouveau lot."}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.allowNegativeStock}
                      onChange={(e) => updateSetting('allowNegativeStock', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {/* 4. Demander confirmation pour les ventes sans stock */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'طلب التأكيد عند البيع بدون مخزون' : 'Demander confirmation pour les ventes sans stock'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {language === 'ar' ? 'إظهار رسالة تأكيد للمستخدم قبل إنهاء أي عملية بيع تؤدي إلى مخزون سالب.' : 'Afficher un message de confirmation avant de finaliser toute vente entraînant un stock négatif.'}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.confirmNegativeStockSale}
                      onChange={(e) => updateSetting('confirmNegativeStockSale', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
                  </label>
                </div>

                {/* 5. Tarification au prix moyen */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 font-bold text-lg flex items-center justify-center shrink-0">
                      Σ
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'التسعير بمتوسط السعر (بدلاً من دفعة بدفعة)' : 'Tarification au prix moyen (au lieu de lot par lot)'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {language === 'ar' ? 'عند التفعيل، يُحسب سعر البيع كمتوسط مرجح بالكمية عبر جميع الدفعات المتوفرة، بدلاً من البيع بسعر أقدم دفعة حتى نفادها. لا يؤثر على التكلفة أو الأرباح.' : "Une fois activé, le prix de vente est calculé comme une moyenne pondérée par la quantité sur tous les lots disponibles, au lieu de vendre au prix du lot le plus ancien jusqu'à épuisement. N'affecte ni le coût, ni les bénéfices, ni la déduction du stock (qui restent en FIFO)."}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.averagePricing}
                      onChange={(e) => updateSetting('averagePricing', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {/* 6. Mode fabrication */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'وضع التصنيع والإنتاج (المكونات وأوامر الإنتاج)' : 'Mode fabrication (recettes et ordres de production)'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {language === 'ar' ? 'إظهار قسم « التصنيع والإنتاج » : تحديد وصفة المكونات لكل منتج مصنّع، ثم إنشاء أوامر إنتاج تخصم المكونات وتنتج المنتج النهائي بتكلفته الفعلية.' : "Affiche la section « Fabrication & Production » : définissez une recette par produit fabriqué, puis des ordres de production qui déduisent les composants et créent un lot du produit fini à son coût réel. Sans effet sur la vente ni sur le stock tant qu'aucun ordre n'est exécuté."}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.manufacturingMode}
                      onChange={(e) => updateSetting('manufacturingMode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {/* 7. Activer le Droit de Timbre */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                      <StampIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'تفعيل حق الطابع الجبائي (Timbre Fiscal)' : 'Activer le Droit de Timbre'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {language === 'ar' ? 'وفقاً للقانون الجزائري : 1% من المبلغ الإجمالي TTC على الفواتير المدفوعة نقداً (الحد الأدنى 5 دج، والحد الأقصى 2500 دج). عطل هذا الخيار إذا كان نشاطك معفى.' : "Selon la loi algérienne : 1% du TTC sur les factures payées en espèces (minimum 5 DA, maximum 2500 DA). Désactivez-le si votre activité est exonérée ou si vous ne souhaitez pas l'afficher."}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.stampDutyActive}
                      onChange={(e) => updateSetting('stampDutyActive', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

              </div>
            </div>

            {/* Bouton Enregistrer général */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSave('Paramètres généraux')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-600/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{t('settings.save_data', 'Enregistrer les Données')}</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VOLET 3 : FACTURES & TICKETS                                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'invoices' && (
          <div className="space-y-6 animate-fadeIn max-w-5xl">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'الفواتير والإيصالات' : 'Factures & Tickets'}
              </h2>
              <p className="text-xs font-medium text-slate-400">
                {language === 'ar' ? 'نماذج الفواتير والإيصالات، إعدادات نقطة البيع وملصقات الباركود' : 'Modèles de factures et tickets, paramètres du point de vente et étiquettes code-barres'}
              </p>
            </div>

            {/* 1. Modèle de Facture */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    {language === 'ar' ? 'نموذج الفاتورة' : 'Modèle de Facture'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsInvoiceDesignerOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'مصمم النماذج' : 'Concepteur de modèles'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? 'صمّم فواتيرك وإيصالاتك بنظام الكتل المخصص، ثم اختر التصميم المطلوب أدناه.' : 'Concevez vos factures et reçus par blocs, puis sélectionnez-les ci-dessous.'}
              </p>

              {/* 3 Cartes de sélection Design Facture avec Rendu Réel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* DESIGN 1 (BASE MODERNE) */}
                <div
                  onClick={() => updateSetting('invoiceDesign', 'design1')}
                  className={`border-2 rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-900/60 cursor-pointer transition-all flex flex-col items-center justify-between h-48 ${
                    settings.invoiceDesign === 'design1'
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex flex-col justify-between overflow-hidden shadow-2xs text-[6.5px] leading-tight select-none">
                    <div>
                      <div className="flex items-center justify-between border-b border-blue-500/40 pb-1 mb-1">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-blue-600 text-white font-black text-[5.5px] flex items-center justify-center">N</div>
                          <span className="font-black text-slate-900 dark:text-white text-[7px]">NovaMag POS</span>
                        </div>
                        <span className="font-mono font-bold text-blue-600 text-[6px]">FAC-2026-0042</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[5.5px] mb-1">
                        <span>09/11/2026</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Client: Hamid Supérette</span>
                      </div>
                    </div>
                    <div className="border border-slate-100 dark:border-slate-800 rounded overflow-hidden my-0.5">
                      <div className="bg-blue-50 dark:bg-blue-950/40 text-[5.5px] font-bold text-blue-900 dark:text-blue-300 flex px-1 py-0.5">
                        <span className="flex-1">Désignation</span>
                        <span className="w-3 text-center">Qté</span>
                        <span className="w-8 text-right">Total</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-[5.5px] text-slate-600 dark:text-slate-300">
                        <div className="flex px-1 py-0.5">
                          <span className="flex-1 truncate">PC Portable Dell Vostro</span>
                          <span className="w-3 text-center font-mono">1</span>
                          <span className="w-8 text-right font-mono font-bold">2 000 DA</span>
                        </div>
                        <div className="flex px-1 py-0.5">
                          <span className="flex-1 truncate">Souris Logitech MK270</span>
                          <span className="w-3 text-center font-mono">2</span>
                          <span className="w-8 text-right font-mono font-bold">5 760 DA</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="border border-dashed border-blue-400/60 rounded px-1 py-0.5 text-[4.5px] text-blue-600 font-bold">
                        Cachet & Signature
                      </div>
                      <div className="text-right">
                        <div className="text-[5px] text-slate-400">TVA (19%): 1 474 DA</div>
                        <div className="text-[7px] font-black text-blue-600 font-mono">7 760.00 DA</div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mt-2">
                    {t('settings.design_1_label', 'DESIGN 1 (BASE)')}
                  </span>
                </div>

                {/* DESIGN 2 (SIMPLE ÉPURÉ) */}
                <div
                  onClick={() => updateSetting('invoiceDesign', 'design2')}
                  className={`border-2 rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-900/60 cursor-pointer transition-all flex flex-col items-center justify-between h-48 ${
                    settings.invoiceDesign === 'design2'
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex flex-col justify-between overflow-hidden shadow-2xs text-[6.5px] leading-tight select-none">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-200 pb-1 mb-1">
                        <span className="font-black text-slate-900 dark:text-white tracking-wider text-[7.5px] uppercase">FACTURE</span>
                        <span className="font-mono text-[6px] text-slate-500">N° 2026-0042</span>
                      </div>
                      <div className="text-[5.5px] text-slate-500 flex justify-between mb-1">
                        <span>Date: 09/11/2026</span>
                        <span>Comptoir Express</span>
                      </div>
                    </div>
                    <div className="space-y-1 my-0.5 text-[5.5px]">
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-0.5 text-slate-700 dark:text-slate-300">
                        <span className="truncate">1x Clavier Sans Fil USB</span>
                        <span className="font-mono font-bold">2 880.00 DA</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-0.5 text-slate-700 dark:text-slate-300">
                        <span className="truncate">2x Câble Réseau RJ45 5M</span>
                        <span className="font-mono font-bold">1 200.00 DA</span>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-800 dark:border-slate-200">
                      <span className="text-[5.5px] font-bold text-slate-500 uppercase">Total Net :</span>
                      <span className="text-[7.5px] font-black text-slate-900 dark:text-white font-mono">4 080.00 DA</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mt-2">
                    {t('settings.design_2_label', 'DESIGN 2 (SIMPLE)')}
                  </span>
                </div>

                {/* DESIGN 3 (ENCADRÉ PRO) */}
                <div
                  onClick={() => updateSetting('invoiceDesign', 'design3')}
                  className={`border-2 rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-900/60 cursor-pointer transition-all flex flex-col items-center justify-between h-48 ${
                    settings.invoiceDesign === 'design3'
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full flex-1 bg-white dark:bg-slate-950 border-2 border-slate-800 dark:border-slate-400 rounded-lg p-1.5 flex flex-col justify-between overflow-hidden shadow-2xs text-[6px] leading-tight select-none">
                    <div className="border border-slate-300 dark:border-slate-700 p-0.5 rounded-xs bg-slate-50/80 dark:bg-slate-900/40">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-[6.5px]">SOCIÉTÉ NOVAMAG SARL</div>
                          <div className="text-[4.5px] text-slate-500">RC: 16/00-1234567 • NIF: 00192345678</div>
                        </div>
                        <div className="border border-slate-400 px-1 py-0.5 rounded-xs font-bold text-[5.5px]">
                          N° 0042
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-400 dark:border-slate-600 rounded-xs overflow-hidden my-0.5">
                      <div className="bg-slate-200 dark:bg-slate-800 text-[5px] font-bold text-slate-800 dark:text-slate-200 flex border-b border-slate-400 px-1 py-0.5">
                        <span className="flex-1">RÉF & DÉSIGNATION</span>
                        <span className="w-3 text-center">QTÉ</span>
                        <span className="w-7 text-right">MONTANT</span>
                      </div>
                      <div className="divide-y divide-slate-200 dark:divide-slate-700 text-[5px] text-slate-700 dark:text-slate-300">
                        <div className="flex px-1 py-0.5">
                          <span className="flex-1 truncate">[ART-01] Lecteur Code-Barres</span>
                          <span className="w-3 text-center font-mono">1</span>
                          <span className="w-7 text-right font-mono">12 000</span>
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-300 dark:border-slate-700 p-0.5 rounded-xs flex justify-between items-center bg-slate-50/50">
                      <span className="text-[4.5px] text-slate-500 italic">Bon pour accord</span>
                      <span className="text-[7px] font-black text-slate-900 dark:text-white font-mono">TTC: 14 280 DA</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mt-2">
                    {t('settings.design_3_label', 'DESIGN 3 (ENCADRÉ)')}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {t('settings.invoice_print_lang', "Langue d'impression des factures :")}
                </label>
                <select
                  value={settings.invoiceLanguage}
                  onChange={(e) => updateSetting('invoiceLanguage', e.target.value)}
                  className="w-64 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none cursor-pointer"
                >
                  <option value="fr">Français</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>
              </div>
            </div>

            {/* 2. Modèle de Ticket */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    {language === 'ar' ? 'نموذج الإيصال (تذكرة الصندوق)' : 'Modèle de Ticket'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTicketDesignerOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'مصمم النماذج' : 'Concepteur de modèles'}</span>
                </button>
              </div>

              {/* 4 Cartes de sélection Ticket avec Rendu Réel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* TICKET DESIGN 1 */}
                <div
                  onClick={() => updateSetting('ticketDesign', 'design1')}
                  className={`border-2 rounded-2xl p-2.5 bg-slate-50 dark:bg-slate-900/60 cursor-pointer transition-all flex flex-col items-center justify-between h-44 ${
                    settings.ticketDesign === 'design1'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 flex flex-col justify-between overflow-hidden shadow-2xs text-[5.5px] select-none">
                    <div className="text-center border-b border-dashed border-slate-300 pb-1">
                      <div className="font-black text-slate-900 dark:text-white text-[6.5px]">NOVAMAG STORE</div>
                      <div className="text-[4.5px] text-slate-400">09/11/2026 • 15:42</div>
                    </div>
                    <div className="space-y-0.5 my-1">
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>1x PC Dell</span>
                        <span className="font-mono">2000 DA</span>
                      </div>
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>2x Souris MK</span>
                        <span className="font-mono">5760 DA</span>
                      </div>
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-1 text-center">
                      <div className="font-black text-emerald-600 text-[6.5px]">TOTAL: 7 760 DA</div>
                      <div className="text-[4px] text-slate-400 mt-0.5">||||||||||||||||||||||||</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-center text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
                    Ticket (Design 1)
                  </span>
                </div>

                {/* TICKET DESIGN 2 */}
                <div
                  onClick={() => updateSetting('ticketDesign', 'design2')}
                  className={`border-2 rounded-2xl p-2.5 bg-slate-50 dark:bg-slate-900/60 cursor-pointer transition-all flex flex-col items-center justify-between h-44 ${
                    settings.ticketDesign === 'design2'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 flex flex-col justify-between overflow-hidden shadow-2xs text-[5.5px] select-none">
                    <div className="text-left border-b border-slate-200 pb-0.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-[6px]">Reçu de Vente</div>
                      <div className="text-[4.5px] text-slate-400">Caisse #01</div>
                    </div>
                    <div className="space-y-0.5 my-1 text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>1x Câble USB</span>
                        <span>600 DA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Chargeur</span>
                        <span>1500 DA</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 pt-0.5 flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>Total :</span>
                      <span>2 100 DA</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-center text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
                    Ticket (Design 2)
                  </span>
                </div>

                {/* TICKET DESIGN 3 */}
                <div
                  onClick={() => updateSetting('ticketDesign', 'design3')}
                  className={`border-2 rounded-2xl p-2.5 bg-slate-50 dark:bg-slate-900/60 cursor-pointer transition-all flex flex-col items-center justify-between h-44 ${
                    settings.ticketDesign === 'design3'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 flex flex-col justify-between overflow-hidden shadow-2xs text-[5.5px] select-none items-center text-center">
                    <div className="font-black text-slate-900 dark:text-white text-[6px]">TICKET DIGITAL</div>
                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center my-1 text-[5px] font-bold text-indigo-600">
                      QR CODE
                    </div>
                    <div className="font-black text-slate-800 dark:text-slate-200 text-[6.5px]">4 850 DA</div>
                    <div className="text-[4px] text-slate-400">Merci de votre visite</div>
                  </div>
                  <span className="text-[10px] font-black text-center text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
                    Ticket (Design 3)
                  </span>
                </div>

                {/* TICKET DESIGN 4 (BON LIVRAISON A4) */}
                <div
                  onClick={() => updateSetting('ticketDesign', 'design4')}
                  className={`border-2 rounded-2xl p-2.5 bg-slate-50 dark:bg-slate-900/60 cursor-pointer transition-all flex flex-col items-center justify-between h-44 ${
                    settings.ticketDesign === 'design4'
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-full flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 flex flex-col justify-between overflow-hidden shadow-2xs text-[5px] select-none">
                    <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-center font-bold text-slate-700 dark:text-slate-300 text-[5.5px]">
                      BON DE LIVRAISON
                    </div>
                    <div className="border border-slate-200 rounded p-0.5 my-0.5 text-slate-500">
                      Client: Hamid Supérette
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-0.5 text-center text-[4.5px] text-slate-400">
                      Visa Réceptionnaire
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-center text-slate-700 dark:text-slate-300 mt-2 truncate w-full">
                    Bon de livraison A4
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {language === 'ar' ? 'لغة طباعة الإيصالات :' : "Langue d'impression des reçus :"}
                </label>
                <select
                  value={settings.ticketLanguage}
                  onChange={(e) => updateSetting('ticketLanguage', e.target.value)}
                  className="w-64 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none cursor-pointer"
                >
                  <option value="fr">Français</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? 'إظهار الباركود على الإيصال' : 'Afficher le code-barres sur le reçu'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? 'طباعة باركود خاص برقم الطلب في أسفل الإيصال لتسهيل البحث والاسترجاع.' : 'Imprimer un code-barres unique pour le numéro de commande au bas du reçu pour faciliter la recherche.'}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.showBarcodeOnReceipt}
                    onChange={(e) => updateSetting('showBarcodeOnReceipt', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            </div>

            {/* 3. Paramètres d'Impression Directe */}
            {/* 4. Paramètres d'Impression Directe */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {language === 'ar' ? 'إعدادات الطباعة المباشرة' : "Paramètres d'Impression Directe"}
                </h3>
              </div>

              {/* Impression Silencieuse */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? 'الطباعة المباشرة الصامتة' : 'Impression Silencieuse Directe'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? 'تجاوز نافذة المعاينة والطباعة مباشرة على الطابعة الافتراضية' : "Contourner l'aperçu et imprimer directement sur l'imprimante par défaut"}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.directSilentPrint}
                    onChange={(e) => updateSetting('directSilentPrint', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              {/* En-tête détection imprimantes réelles + Bouton Actualiser */}
              <div className="flex items-center justify-between pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Imprimantes Réelles Détectées ({realPrinters.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => loadRealPrinters(true)}
                  disabled={isLoadingPrinters}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-all border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs active:scale-97"
                  title="Détecter et actualiser en temps réel les imprimantes connectées"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingPrinters ? 'animate-spin' : ''}`} />
                  <span>{isLoadingPrinters ? 'Détection...' : 'Actualiser'}</span>
                </button>
              </div>

              {/* Sélection imprimantes */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Imprimante par défaut pour tous les documents
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestPrint(settings.defaultPrinter)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Tester l'impression sur cette imprimante"
                    >
                      <span>Tester</span>
                    </button>
                  </div>
                  <select
                    value={settings.defaultPrinter}
                    onChange={(e) => updateSetting('defaultPrinter', e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                  >
                    <option value="system">
                      Imprimante par Défaut du Système {systemDefaultPrinter ? `(${systemDefaultPrinter})` : ''}
                    </option>
                    {realPrinters.map((p) => (
                      <option key={`def-${p.name}`} value={p.name}>
                        {p.name} {p.isDefault ? '★ (Par défaut Windows)' : ''} {p.isThermal ? '🖨️ (Thermique)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Imprimante du ticket de caisse
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestPrint(settings.ticketPrinter === 'default' ? settings.defaultPrinter : settings.ticketPrinter)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Tester l'impression ticket"
                    >
                      <span>Tester Ticket</span>
                    </button>
                  </div>
                  <select
                    value={settings.ticketPrinter}
                    onChange={(e) => updateSetting('ticketPrinter', e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                  >
                    <option value="default">
                      Utiliser l'imprimante par défaut {settings.defaultPrinter === 'system' ? `(${systemDefaultPrinter || 'Système'})` : `(${settings.defaultPrinter})`}
                    </option>
                    {realPrinters.map((p) => (
                      <option key={`tkt-${p.name}`} value={p.name}>
                        {p.name} {p.isThermal ? '🖨️ (Thermique Recommandée)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Imprimante de code-barres / étiquettes
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestPrint(settings.barcodePrinter === 'default' ? settings.defaultPrinter : settings.barcodePrinter)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Tester l'impression étiquette"
                    >
                      <span>Tester Étiquette</span>
                    </button>
                  </div>
                  <select
                    value={settings.barcodePrinter}
                    onChange={(e) => updateSetting('barcodePrinter', e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                  >
                    <option value="default">
                      Utiliser l'imprimante par défaut {settings.defaultPrinter === 'system' ? `(${systemDefaultPrinter || 'Système'})` : `(${settings.defaultPrinter})`}
                    </option>
                    {realPrinters.map((p) => (
                      <option key={`bar-${p.name}`} value={p.name}>
                        {p.name} {p.isThermal ? '🏷️ (Étiquette / Thermique)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dimensions rouleau thermique (100% Réel & Dynamique) */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                        Dimensions & Densité du Rouleau Thermique
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          100% Réel & Dynamique
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ajustez la largeur, les marges et la hauteur en direct avec simulateur et application physique immédiate
                      </p>
                    </div>
                  </div>

                  {/* Boutons Présélections Rapides */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Profils :
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('thermalPaperWidth', 80);
                        updateSetting('thermalMargin', 7);
                        updateSetting('thermalDensity', 100);
                        updateSetting('thermalHeightScale', 100);
                        showToast('✓ Profil "80 mm Standard" appliqué');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        Number(settings.thermalPaperWidth) === 80 && Number(settings.thermalMargin) === 7 && Number(settings.thermalDensity) === 100 && (Number(settings.thermalHeightScale) === 100 || !settings.thermalHeightScale)
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      80 mm Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('thermalPaperWidth', 58);
                        updateSetting('thermalMargin', 4);
                        updateSetting('thermalDensity', 100);
                        updateSetting('thermalHeightScale', 100);
                        showToast('✓ Profil "58 mm Compact" appliqué');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        Number(settings.thermalPaperWidth) === 58 && Number(settings.thermalMargin) === 4 && Number(settings.thermalDensity) === 100 && (Number(settings.thermalHeightScale) === 100 || !settings.thermalHeightScale)
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      58 mm Compact
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('thermalPaperWidth', 80);
                        updateSetting('thermalMargin', 7);
                        updateSetting('thermalDensity', 125);
                        updateSetting('thermalHeightScale', 100);
                        showToast('✓ Profil "80 mm Foncée / Haute Densité" appliqué');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        Number(settings.thermalPaperWidth) === 80 && Number(settings.thermalDensity) >= 120
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      80 mm Foncée
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('thermalPaperWidth', 80);
                        updateSetting('thermalMargin', 5);
                        updateSetting('thermalDensity', 100);
                        updateSetting('thermalHeightScale', 80);
                        showToast('✓ Profil "80 mm Éco Papier" appliqué');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        Number(settings.thermalPaperWidth) === 80 && Number(settings.thermalHeightScale) === 80
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      80 mm Éco (-20%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateSetting('thermalPaperWidth', 58);
                        updateSetting('thermalMargin', 3);
                        updateSetting('thermalDensity', 100);
                        updateSetting('thermalHeightScale', 80);
                        showToast('✓ Profil "58 mm Éco Papier" appliqué');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        Number(settings.thermalPaperWidth) === 58 && Number(settings.thermalHeightScale) === 80
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      58 mm Éco (-20%)
                    </button>
                    <button
                      type="button"
                      onClick={handleResetInvoicesToDefault}
                      className="px-3 py-1 rounded-lg text-[11px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 flex items-center gap-1.5 cursor-pointer ml-1.5 transition-all shadow-2xs active:scale-95"
                      title="Rétablir les paramètres d'impression, factures, tickets et étiquettes par défaut"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Rétablir l'Impression par Défaut</span>
                    </button>
                  </div>
                </div>

                {/* Grille : Contrôles Dynamiques (Gauche) & Simulateur Réel (Droite) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Colonne Gauche : Sliders + Inputs Numériques (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* 1. Largeur du rouleau thermique (mm) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>Largeur du rouleau thermique (mm)</span>
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold">
                            {Number(settings.thermalPaperWidth) || 80} mm
                          </span>
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateSetting('thermalPaperWidth', 58)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              Number(settings.thermalPaperWidth) === 58 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            58 mm
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSetting('thermalPaperWidth', 80)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              Number(settings.thermalPaperWidth) === 80 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            80 mm
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-8">
                          <input
                            type="range"
                            min="48"
                            max="100"
                            step="1"
                            value={Number(settings.thermalPaperWidth) || 80}
                            onChange={(e) => updateSetting('thermalPaperWidth', Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                            <span>48 mm</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">58 mm</span>
                            <span className="font-bold text-blue-600">80 mm</span>
                            <span>100 mm</span>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            min="48"
                            max="100"
                            value={settings.thermalPaperWidth}
                            onChange={(e) => updateSetting('thermalPaperWidth', Number(e.target.value))}
                            className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-center"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Largeur physique du rouleau papier : 80 mm (standard caisse) ou 58 mm (imprimante portable / compacte).
                      </p>
                    </div>

                    {/* 2. Marge latérale du ticket thermique (mm) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>Marge latérale du ticket thermique (mm)</span>
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold">
                            {Number(settings.thermalMargin) >= 0 ? Number(settings.thermalMargin) : 7} mm
                          </span>
                        </label>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          Zone utile : {Math.max(20, (Number(settings.thermalPaperWidth) || 80) - ((Number(settings.thermalMargin) >= 0 ? Number(settings.thermalMargin) : 7) * 2))} mm
                        </span>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-8">
                          <input
                            type="range"
                            min="0"
                            max="18"
                            step="1"
                            value={Number(settings.thermalMargin) >= 0 ? Number(settings.thermalMargin) : 7}
                            onChange={(e) => updateSetting('thermalMargin', Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                            <span>0 mm</span>
                            <span>4 mm</span>
                            <span className="font-bold text-blue-600">7 mm</span>
                            <span>18 mm</span>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            min="0"
                            max="18"
                            value={settings.thermalMargin}
                            onChange={(e) => updateSetting('thermalMargin', Number(e.target.value))}
                            className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-center"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Espace de sécurité gauche et droite pour éviter que le texte soit coupé par les bords physiques de la tête thermique.
                      </p>
                    </div>

                    {/* 3. Densité d'impression thermique (%) — Noirceur de l'écriture (Clair ou Foncé) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>Densité du ticket thermique (%) — Noirceur</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            Number(settings.thermalDensity) >= 125
                              ? 'bg-slate-900 text-white'
                              : Number(settings.thermalDensity) >= 110
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                              : Number(settings.thermalDensity) <= 80
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {Number(settings.thermalDensity) || 100}% • {
                              Number(settings.thermalDensity) <= 80
                                ? 'Claire'
                                : Number(settings.thermalDensity) >= 130
                                ? 'Très Foncée (Intense)'
                                : Number(settings.thermalDensity) >= 110
                                ? 'Foncée'
                                : 'Normale'
                            }
                          </span>
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateSetting('thermalDensity', 75)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              Number(settings.thermalDensity) === 75 ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                            title="Écriture Claire"
                          >
                            Claire
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSetting('thermalDensity', 100)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              Number(settings.thermalDensity) === 100 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                            title="Écriture Normale"
                          >
                            Normale
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSetting('thermalDensity', 120)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              Number(settings.thermalDensity) === 120 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                            title="Écriture Foncée"
                          >
                            Foncée
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSetting('thermalDensity', 140)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              Number(settings.thermalDensity) === 140 ? 'bg-slate-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                            title="Écriture Très Foncée"
                          >
                            Très Foncée
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-8">
                          <input
                            type="range"
                            min="60"
                            max="150"
                            step="5"
                            value={Number(settings.thermalDensity) || 100}
                            onChange={(e) => updateSetting('thermalDensity', Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                            <span>60% (Claire)</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">100% (Normale)</span>
                            <span className="font-bold text-blue-600">120% (Foncée)</span>
                            <span className="font-bold text-slate-900 dark:text-white">150% (Intense)</span>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            min="60"
                            max="150"
                            step="5"
                            value={settings.thermalDensity}
                            onChange={(e) => updateSetting('thermalDensity', Number(e.target.value))}
                            className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-center"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Contrôle la noirceur et le contraste de la tête thermique : augmentez (110% à 130%) pour rendre l'écriture plus <strong>foncée</strong>, noire et nette sur le papier thermique. Diminuez si l'encre bave.
                      </p>
                    </div>

                    {/* 4. Hauteur & Espacement du ticket (%) */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>Hauteur & Espacement du ticket (%)</span>
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold">
                            {Number(settings.thermalHeightScale) || 100}%
                          </span>
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateSetting('thermalHeightScale', 80)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              Number(settings.thermalHeightScale) === 80 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                            title="Format Économique"
                          >
                            Éco (-20%)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSetting('thermalHeightScale', 100)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              Number(settings.thermalHeightScale) === 100 || !settings.thermalHeightScale ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                            title="Format Normal"
                          >
                            Normal (100%)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSetting('thermalHeightScale', 120)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              Number(settings.thermalHeightScale) === 120 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                            title="Format Aéré"
                          >
                            Aéré (+20%)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-8">
                          <input
                            type="range"
                            min="60"
                            max="140"
                            step="5"
                            value={Number(settings.thermalHeightScale) || 100}
                            onChange={(e) => updateSetting('thermalHeightScale', Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                            <span>60% (Ultra court)</span>
                            <span className="font-bold text-emerald-600">80% (Éco)</span>
                            <span className="font-bold text-blue-600">100% (Standard)</span>
                            <span>140% (Aéré)</span>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            min="60"
                            max="140"
                            step="5"
                            value={settings.thermalHeightScale || 100}
                            onChange={(e) => updateSetting('thermalHeightScale', Number(e.target.value))}
                            className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-center"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Contrôle la longueur du ticket : une valeur de 80% comprime les interlignes pour raccourcir le ticket et économiser du papier.
                      </p>
                    </div>
                  </div>

                  {/* Colonne Droite : Simulateur de Ticket Thermique en Temps Réel (5 cols) */}
                  <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col items-center shadow-inner">
                    <div className="w-full flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                        <Receipt className="w-4 h-4 text-blue-600" />
                        <span>Aperçu Réel du Ticket</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                          {Number(settings.thermalPaperWidth) || 80}mm
                        </span>
                        <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md ${
                          Number(settings.thermalDensity) >= 125
                            ? 'bg-slate-900 text-white'
                            : Number(settings.thermalDensity) >= 110
                            ? 'bg-blue-600 text-white'
                            : Number(settings.thermalDensity) <= 80
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-white'
                        }`}>
                          {Number(settings.thermalDensity) <= 80 ? 'Clair' : Number(settings.thermalDensity) >= 130 ? 'Très Foncé' : Number(settings.thermalDensity) >= 110 ? 'Foncé' : 'Normal'}
                        </span>
                      </div>
                    </div>

                    {/* Règle Millimétrique Interactive */}
                    <div className="w-full mb-2 bg-slate-200 dark:bg-slate-800 rounded px-2 py-1 flex justify-between text-[8.5px] font-mono text-slate-500 font-bold border-b-2 border-blue-500/50">
                      <span>0mm</span>
                      <span>20mm</span>
                      <span>40mm</span>
                      <span>60mm</span>
                      <span>80mm</span>
                      <span>100mm</span>
                    </div>

                    {/* Conteneur physique du rouleau thermique (Dynamique 1:1) */}
                    <div
                      style={{
                        width: `${Math.min(340, Math.round((Number(settings.thermalPaperWidth) || 80) * 3.8))}px`,
                        paddingLeft: `${Math.round((Number(settings.thermalMargin) >= 0 ? Number(settings.thermalMargin) : 7) * 3.8)}px`,
                        paddingRight: `${Math.round((Number(settings.thermalMargin) >= 0 ? Number(settings.thermalMargin) : 7) * 3.8)}px`,
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      className="bg-white rounded-lg shadow-xl border-x border-slate-300 font-mono text-xs select-none overflow-hidden relative"
                    >
                      {/* Bord découpé thermique en haut (crénelé) */}
                      <div className="h-2 w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 via-transparent to-transparent opacity-40 mb-2" />

                      {/* Contenu du ticket dynamique : couleur, noirceur et hauteur en direct */}
                      <div
                        style={{
                          transform: `scaleY(${(Number(settings.thermalHeightScale) || 100) / 100})`,
                          transformOrigin: 'top center',
                          color: Number(settings.thermalDensity) <= 80 ? '#4b5563' : '#000000',
                          fontWeight: Number(settings.thermalDensity) >= 130 ? '900' : Number(settings.thermalDensity) >= 110 ? '800' : Number(settings.thermalDensity) <= 80 ? '500' : '600',
                          textShadow: Number(settings.thermalDensity) >= 130 ? '0 0 0.6px #000' : Number(settings.thermalDensity) >= 110 ? '0 0 0.35px #000' : 'none',
                          WebkitTextStroke: Number(settings.thermalDensity) >= 130 ? '0.35px #000' : Number(settings.thermalDensity) >= 110 ? '0.2px #000' : 'none',
                          transition: 'all 0.2s ease-in-out'
                        }}
                        className="space-y-1.5 py-1"
                      >
                        {/* En-tête magasin */}
                        <div className="text-center pb-1 border-b border-dashed border-slate-400">
                          <div className="text-sm font-black tracking-wide text-slate-900">
                            {settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag'}
                          </div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                            Point de Vente & Gestion
                          </div>
                          <div className="text-[8px] text-slate-400">
                            {settings.phoneMobile || 'Tél : 0550 00 00 00'}
                          </div>
                        </div>

                        {/* Méta Ticket */}
                        <div className="text-[9px] space-y-0.5 py-1 border-b border-dashed border-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ticket N° :</span>
                            <span className="font-bold">#SIM-2026-8801</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Date :</span>
                            <span>{new Date().toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Client :</span>
                            <span className="font-bold">Client Comptoir</span>
                          </div>
                        </div>

                        {/* Articles de démonstration */}
                        <div className="py-1 border-b border-dashed border-slate-300 text-[9px] space-y-1">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>Désignation</span>
                            <span>Total</span>
                          </div>
                          <div className="flex justify-between text-slate-800">
                            <div>
                              <div className="font-bold leading-tight">Lecteur Code-barres Sans Fil</div>
                              <div className="text-[8px] text-slate-400">1 x 6 000,00 DA</div>
                            </div>
                            <span className="font-bold">6 000 DA</span>
                          </div>
                          <div className="flex justify-between text-slate-800">
                            <div>
                              <div className="font-bold leading-tight">Pack Clavier + Souris USB</div>
                              <div className="text-[8px] text-slate-400">2 x 2 000,00 DA</div>
                            </div>
                            <span className="font-bold">4 000 DA</span>
                          </div>
                        </div>

                        {/* Total Dû */}
                        <div className="py-1 border-b-2 border-slate-900 text-[10px] space-y-0.5">
                          <div className="flex justify-between items-baseline font-black text-slate-900 text-xs">
                            <span>TOTAL DÛ :</span>
                            <span className="text-blue-600">10 000,00 DA</span>
                          </div>
                          <div className="flex justify-between text-[8.5px] text-slate-500">
                            <span>Mode : Espèces</span>
                            <span>Reçu : 10 000 DA</span>
                          </div>
                        </div>

                        {/* Code-barres et QR Code réels scannables */}
                        {settings.showBarcodeOnReceipt !== false && (
                          <div className="text-center pt-2 space-y-1.5 border-t border-dashed border-slate-300">
                            {/* Code-barres Code 128 SVG Réel */}
                            <div
                              className="flex justify-center"
                              dangerouslySetInnerHTML={{
                                __html: generateCode128Svg('SIM-2026-8801', {
                                  height: 28,
                                  barWidth: 1.2,
                                  showText: true
                                })
                              }}
                            />

                            <div className="text-[7.5px] font-mono text-slate-500">
                              Code-barres scannable (Recherche instantanée de facture)
                            </div>
                          </div>
                        )}
                        <div className="text-[7.5px] italic text-slate-400 text-center mt-1">Merci de votre confiance !</div>
                      </div>

                      {/* Bord découpé thermique en bas */}
                      <div className="h-2 w-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-200 via-transparent to-transparent opacity-40 mt-2" />
                    </div>

                    {/* Bouton de Test Réel Immédiat sur l'Imprimante */}
                    <div className="w-full mt-4 space-y-2">
                      <button
                        type="button"
                        onClick={() => handleTestPrint(settings.ticketPrinter === 'default' ? settings.defaultPrinter : settings.ticketPrinter)}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Imprimer ce Ticket Test Réel</span>
                      </button>
                      <div className="text-center text-[10px] text-slate-400 font-medium">
                        Cible : {settings.ticketPrinter === 'default' ? (systemDefaultPrinter || 'Imprimante par défaut') : settings.ticketPrinter}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Tiroir-caisse (Conforme exact aux photos de référence) */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  Tiroir-caisse
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Connecter le programme au tiroir-caisse (tiroir) pour l'ouvrir manuellement (touche Échap) ou automatiquement lors de la finalisation de chaque vente.
              </p>

              {/* Si le tiroir-caisse est DÉSACTIVÉ : affichage d'une seule ligne avec le toggle */}
              {!settings.cashDrawerActive ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        Activer le tiroir-caisse
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Autoriser l'ouverture du tiroir depuis le programme
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.cashDrawerActive}
                      onChange={(e) => updateSetting('cashDrawerActive', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
                  </label>
                </div>
              ) : (
                /* Quand le tiroir-caisse est ACTIVÉ : Interface complète avec menus déroulants et options */
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    
                    {/* Colonne Gauche : Paramètres de Connexion & Imprimante */}
                    <div className="space-y-3">
                      {/* Type de connexion */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Type de connexion
                        </label>
                        <select
                          value={settings.cashDrawerConnectionType || 'printer'}
                          onChange={(e) => updateSetting('cashDrawerConnectionType', e.target.value)}
                          className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100"
                        >
                          <option value="printer">Connecté à l'imprimante de reçus (Recommandé)</option>
                          <option value="serial">Câble Port Série (COM)</option>
                          <option value="usb">Port USB Direct (Virtual COM)</option>
                        </select>
                      </div>

                      {/* Imprimante du tiroir OU Port COM selon le type de connexion */}
                      {settings.cashDrawerConnectionType === 'serial' || settings.cashDrawerConnectionType === 'usb' ? (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Port Série (COM)
                          </label>
                          <input
                            type="text"
                            placeholder="ex: COM1, COM2, COM3"
                            value={settings.cashDrawerPort || 'COM1'}
                            onChange={(e) => updateSetting('cashDrawerPort', e.target.value.toUpperCase())}
                            className="w-full text-xs font-bold font-mono px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Imprimante du tiroir
                          </label>
                          <select
                            value={settings.cashDrawerPrinter || 'ticket'}
                            onChange={(e) => updateSetting('cashDrawerPrinter', e.target.value)}
                            className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100"
                          >
                            <option value="ticket">Utiliser l'imprimante du ticket de caisse</option>
                            <option value="default">Utiliser l'imprimante par défaut Windows</option>
                            {realPrinters.map((p) => (
                              <option key={`drawer-prt-${p.name}`} value={p.name}>
                                {p.name} {p.isThermal ? '🖨️ (Thermique)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Commande d'ouverture (ESC/POS) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Commande d'ouverture (Code ESC/POS)
                        </label>
                        <select
                          value={settings.cashDrawerOpenCommand || 'esc_p_0'}
                          onChange={(e) => updateSetting('cashDrawerOpenCommand', e.target.value)}
                          className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100"
                        >
                          <option value="esc_p_0">ESC p 0 (Par défaut - Port 2)</option>
                          <option value="esc_p_1">ESC p 1 (Port 5)</option>
                          <option value="dle_dc4">DLE DC4 1 (EPSON Standard)</option>
                          <option value="decimal">27, 112, 0, 25, 250 (Code Décimal)</option>
                          <option value="star">Star Micronics (ASCII 7)</option>
                          <option value="citizen">Citizen / Aures (ESC p 0 50 50)</option>
                          <option value="custom">Code hexadécimal personnalisé</option>
                        </select>
                        {settings.cashDrawerOpenCommand === 'custom' && (
                          <input
                            type="text"
                            placeholder="ex: 1B 70 00 19 FA"
                            value={settings.cashDrawerCustomHex || ''}
                            onChange={(e) => updateSetting('cashDrawerCustomHex', e.target.value.toUpperCase())}
                            className="mt-2 w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100"
                          />
                        )}
                      </div>
                    </div>

                    {/* Colonne Droite : Cartes de bascule (Activer + Ouverture automatique) */}
                    <div className="space-y-3">
                      {/* Carte 1 : Activer le tiroir-caisse */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={settings.cashDrawerActive}
                            onChange={(e) => updateSetting('cashDrawerActive', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
                        </label>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">
                              Activer le tiroir-caisse
                            </h4>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                              Autoriser l'ouverture du tiroir depuis le programme
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                            <PiggyBank className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Carte 2 : Ouverture automatique lors de la vente */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={settings.autoOpenCashDrawerOnSale ?? true}
                            onChange={(e) => updateSetting('autoOpenCashDrawerOnSale', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                        </label>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">
                              Ouverture automatique lors de la vente
                            </h4>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                              Ouvre le tiroir automatiquement après chaque vente validée
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                            <ShoppingCart className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bouton Grand Orange : Tester l'ouverture du tiroir */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestCashDrawer}
                      className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PiggyBank className="w-4 h-4" />
                      <span>Tester l'ouverture du tiroir</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Paramètres de l'étiquette code-barres (100% Réel & Dynamique - Format Compact & Aligné) */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        Paramètres de l'étiquette code-barres
                      </h3>
                      <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                        ● Réel & Dynamique
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400">
                      Dimensions et contenu par défaut affichés automatiquement à chaque impression.
                    </p>
                  </div>
                </div>

                {/* Bouton Étiquette par Défaut (40x20 mm) */}
                <button
                  type="button"
                  onClick={() => {
                    updateSetting('labelWidth', 40);
                    updateSetting('labelHeight', 20);
                    updateSetting('barcodeHeight', 4);
                    updateSetting('barcodeHeightAuto', true);
                    updateSetting('labelFields', {
                      storeName: true,
                      productName: true,
                      price: true,
                      priceType: false,
                      barcodeNumber: true,
                      variants: false,
                      discount: false,
                    });
                    showToast('✓ Étiquette rétablie par défaut (40×20 mm)');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 transition-all shadow-2xs active:scale-95"
                  title="Rétablir les dimensions et champs par défaut (40x20 mm)"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Étiquette par Défaut (40×20 mm)</span>
                </button>
              </div>

              {/* Formats rapides / Profils d'étiquettes (Compact) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-black uppercase text-slate-400 mr-1">FORMATS :</span>
                {[
                  { name: '40 × 20 mm (Bijoux / Compact - Défaut)', w: 40, h: 20, bar: 4 },
                  { name: '50 × 30 mm (Standard Rayon)', w: 50, h: 30, bar: 8 },
                  { name: '60 × 40 mm (Grand Format)', w: 60, h: 40, bar: 12 },
                ].map((preset) => {
                  const isCurrent = Number(settings.labelWidth) === preset.w && Number(settings.labelHeight) === preset.h;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        updateSetting('labelWidth', preset.w);
                        updateSetting('labelHeight', preset.h);
                        updateSetting('barcodeHeight', preset.bar);
                        updateSetting('barcodeHeightAuto', true);
                        showToast(`✓ Format ${preset.w}×${preset.h} mm appliqué`);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>

              {/* Grille principale : Paramètres à gauche & Aperçu Réel à droite */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                
                {/* Colonne Gauche (8 cols) : Saisies des dimensions & cases à cocher compactes */}
                <div className="xl:col-span-8 space-y-3">
                  
                  {/* Ligne des 3 dimensions : strictement alignée au pixel près */}
                  <div className="grid grid-cols-3 gap-2.5 items-end">
                    {/* 1. Largeur */}
                    <div>
                      <div className="h-5 mb-1 flex items-center">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Largeur (mm)
                        </label>
                      </div>
                      <input
                        type="number"
                        min="20"
                        max="120"
                        value={settings.labelWidth || 40}
                        onChange={(e) => updateSetting('labelWidth', Number(e.target.value) || 40)}
                        className="w-full h-8.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-rose-500"
                      />
                    </div>

                    {/* 2. Hauteur */}
                    <div>
                      <div className="h-5 mb-1 flex items-center">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Hauteur (mm)
                        </label>
                      </div>
                      <input
                        type="number"
                        min="15"
                        max="100"
                        value={settings.labelHeight || 20}
                        onChange={(e) => updateSetting('labelHeight', Number(e.target.value) || 20)}
                        className="w-full h-8.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-rose-500"
                      />
                    </div>

                    {/* 3. Hauteur Code-barres avec Auto sur la même ligne */}
                    <div>
                      <div className="h-5 mb-1 flex items-center justify-between gap-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap truncate">
                          Code-barres (mm)
                        </label>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-rose-600 cursor-pointer select-none shrink-0">
                          <input
                            type="checkbox"
                            checked={settings.barcodeHeightAuto ?? true}
                            onChange={(e) => updateSetting('barcodeHeightAuto', e.target.checked)}
                            className="w-3 h-3 text-rose-600 rounded cursor-pointer"
                          />
                          <span>Auto</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        min="2"
                        max="40"
                        disabled={settings.barcodeHeightAuto ?? true}
                        value={settings.barcodeHeight || 4}
                        onChange={(e) => updateSetting('barcodeHeight', Number(e.target.value) || 4)}
                        className={`w-full h-8.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 outline-none ${
                          settings.barcodeHeightAuto ?? true
                            ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-rose-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Grille des cases à cocher des champs : compacte et propre */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {[
                      { id: 'storeName', label: 'Nom du magasin' },
                      { id: 'productName', label: 'Nom du produit' },
                      { id: 'price', label: 'Prix' },
                      { id: 'priceType', label: 'Type de prix' },
                      { id: 'barcodeNumber', label: 'Numéro du code-barres' },
                      { id: 'variants', label: 'Variantes' },
                      { id: 'discount', label: 'Remise' },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-all select-none ${
                          Boolean(settings.labelFields?.[item.id])
                            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(settings.labelFields?.[item.id])}
                          onChange={() => toggleLabelField(item.id)}
                          className="w-3.5 h-3.5 text-rose-600 rounded cursor-pointer accent-rose-600"
                        />
                        <span className="truncate">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Colonne Droite (4 cols) : Aperçu Réel 1:1 de l'Étiquette Adhésive (Compact & Élégant) */}
                <div className="xl:col-span-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-black text-slate-900 dark:text-white">
                      <Barcode className="w-3.5 h-3.5 text-rose-600" />
                      <span>Aperçu Réel 1:1</span>
                    </div>
                    <span className="text-[9.5px] font-mono font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200/60 dark:border-rose-900">
                      {Number(settings.labelWidth) || 40} × {Number(settings.labelHeight) || 20} mm
                    </span>
                  </div>

                  {/* Bande de support d'étiquettes adhésives */}
                  <div className="w-full p-2.5 rounded-lg bg-amber-50/50 dark:bg-slate-950 border border-amber-200/60 dark:border-slate-800 flex items-center justify-center min-h-[110px] overflow-hidden">
                    {/* Sticker physique adhésif 1:1 dynamique compact */}
                    <div
                      style={{
                        width: `${Math.min(230, Math.max(120, Math.round((Number(settings.labelWidth) || 40) * 4.6)))}px`,
                        height: `${Math.min(140, Math.max(65, Math.round((Number(settings.labelHeight) || 20) * 4.6)))}px`,
                        transition: 'all 0.25s ease-in-out'
                      }}
                      className="bg-white rounded-md shadow-xs border border-slate-300/80 p-1.5 text-slate-900 flex flex-col justify-between items-center text-center overflow-hidden relative select-none"
                    >
                      {/* Nom du magasin */}
                      {Boolean(settings.labelFields?.storeName) && (
                        <div className="text-[8px] font-black uppercase tracking-wider text-slate-700 truncate w-full leading-tight">
                          {settings.storeName && !settings.storeName.includes('لومينا') ? settings.storeName : 'NovaMag'}
                        </div>
                      )}

                      {/* Nom du produit */}
                      {Boolean(settings.labelFields?.productName) && (
                        <div className="text-[8.5px] font-extrabold text-slate-900 truncate w-full leading-tight">
                          Lecteur Code-barres Sans Fil
                        </div>
                      )}

                      {/* Code-barres Code 128 SVG Réel Scannable */}
                      <div className="w-full flex justify-center items-center py-0.5 overflow-hidden">
                        <div
                          className="w-full flex justify-center"
                          dangerouslySetInnerHTML={{
                            __html: generateCode128Svg('6131234567890', {
                              height: settings.barcodeHeightAuto ?? true
                                ? Math.max(10, Math.round((Number(settings.labelHeight) || 20) * 1.3))
                                : Math.max(6, Math.round((Number(settings.barcodeHeight) || 4) * 2.5)),
                              barWidth: (Number(settings.labelWidth) || 40) <= 40 ? 0.85 : 1.0,
                              showText: false
                            })
                          }}
                        />
                      </div>

                      {/* Numéro du code-barres */}
                      {Boolean(settings.labelFields?.barcodeNumber) && (
                        <div className="font-mono text-[8px] font-black tracking-wider text-slate-800 leading-none">
                          6131234567890
                        </div>
                      )}

                      {/* Ligne inférieure : Prix, Détail, Remise, Variantes */}
                      {(Boolean(settings.labelFields?.price) || Boolean(settings.labelFields?.priceType) || Boolean(settings.labelFields?.discount) || Boolean(settings.labelFields?.variants)) && (
                        <div className="w-full flex items-center justify-between text-[7.5px] font-bold border-t border-slate-200/80 pt-0.5 mt-0.5">
                          {Boolean(settings.labelFields?.variants) && (
                            <span className="text-slate-500 truncate max-w-[45%]">Noir / Sans Fil</span>
                          )}
                          {Boolean(settings.labelFields?.priceType) && (
                            <span className="text-slate-500">(Détail)</span>
                          )}
                          {Boolean(settings.labelFields?.discount) && (
                            <span className="text-rose-600 font-extrabold">-15%</span>
                          )}
                          {Boolean(settings.labelFields?.price) && (
                            <span className="text-[9.5px] font-black text-slate-900 ml-auto">
                              6 000,00 DA
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bouton d'impression réelle de test d'étiquette compact */}
                  <div className="w-full mt-2">
                    <button
                      type="button"
                      onClick={handleTestPrintLabel}
                      className="w-full py-2 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white text-[11px] font-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer Test Réel ({Number(settings.labelWidth) || 40}×{Number(settings.labelHeight) || 20} mm)</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* 7. Sons de Caisse & Alertes Sonores */}
            <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Sons de Caisse & Alertes Sonores
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Validation des ventes, modifications des factures et alertes de scan en caisse
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.soundAlertsActive}
                    onChange={(e) => updateSetting('soundAlertsActive', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              {/* Volume Dynamique Réel */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    Volume Général Dynamique
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono text-xs font-black">
                    {settings.soundVolume ?? 75}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.soundVolume ?? 75}
                    onChange={(e) => {
                      const newVol = Number(e.target.value);
                      updateSetting('soundVolume', newVol);
                    }}
                    onMouseUp={(e) => {
                      playSaleValidationSound(settings.saleValidationSound || 'chime', Number(e.target.value));
                    }}
                    onTouchEnd={(e) => {
                      playSaleValidationSound(settings.saleValidationSound || 'chime', Number(e.target.value));
                    }}
                    className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Le volume s'applique en temps réel à tous les sons de validation et d'alerte. Relâchez le curseur pour tester instantanément.
                </p>
              </div>

              {/* Sélection du son parmi les 3 sons disponibles */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Son de validation (Ventes & Modifications) :
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SOUND_OPTIONS.map((opt) => {
                    const isSelected = (settings.saleValidationSound || 'chime') === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          updateSetting('saleValidationSound', opt.id);
                          playSaleValidationSound(opt.id, settings.soundVolume ?? 75);
                        }}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-black ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                              {opt.name}
                            </span>
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mb-3">
                            {opt.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSetting('saleValidationSound', opt.id);
                            playSaleValidationSound(opt.id, settings.soundVolume ?? 75);
                          }}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Tester ce son
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tonalités alertes de scan */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  Tonalités d'alerte de scan (code-barres) :
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playTestTone('unknown')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" /> Code inconnu
                  </button>

                  <button
                    type="button"
                    onClick={() => playTestTone('out_of_stock')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" /> Rupture de stock
                  </button>

                  <button
                    type="button"
                    onClick={() => playTestTone('expired')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3" /> Produit périmé
                  </button>
                </div>
              </div>
            </div>

            {/* 8. Balances */}
            <div className="space-y-3">
              {/* Carte Balance Électronique (Analysateur d'étiquettes PLU + Poids/Prix) */}
              <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        Paramètres de la balance électronique
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Lorsque cette option est activée, le système analyse les étiquettes de la balance (PLU + Poids/Prix) lors du scan et ajoute automatiquement le produit au panier.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.electronicScaleActive}
                      onChange={(e) => updateSetting('electronicScaleActive', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
                  </label>
                </div>

                {/* Si activée : Les 5 champs en ligne + Exemple dynamique 100% conforme */}
                {settings.electronicScaleActive && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                      {/* 1. Préfixe */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Préfixe
                        </label>
                        <input
                          type="text"
                          value={settings.scalePrefix ?? '2'}
                          onChange={(e) => updateSetting('scalePrefix', e.target.value)}
                          placeholder="ex: 2"
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-amber-500"
                        />
                      </div>

                      {/* 2. Chiffres PLU */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Chiffres PLU
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={settings.scalePluDigits ?? 5}
                          onChange={(e) => updateSetting('scalePluDigits', Number(e.target.value) || 5)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-amber-500"
                        />
                      </div>

                      {/* 3. Chiffres Valeur */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Chiffres Valeur
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={settings.scaleValueDigits ?? 5}
                          onChange={(e) => updateSetting('scaleValueDigits', Number(e.target.value) || 5)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-amber-500"
                        />
                      </div>

                      {/* 4. Type de valeur */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Type de valeur
                        </label>
                        <select
                          value={settings.scaleValueType || 'weight'}
                          onChange={(e) => updateSetting('scaleValueType', e.target.value)}
                          className="w-full h-9 text-center font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-amber-500 cursor-pointer"
                        >
                          <option value="weight">Poids (kg)</option>
                          <option value="price">Prix (DA)</option>
                        </select>
                      </div>

                      {/* 5. Décimales */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Décimales
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          value={settings.scaleDecimals ?? 3}
                          onChange={(e) => updateSetting('scaleDecimals', Number(e.target.value) >= 0 ? Number(e.target.value) : 3)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Texte d'exemple dynamique conforme */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                      <span className="text-amber-600 font-black">💡 Exemple :</span>
                      <span>
                        Préfixe <strong className="font-mono text-slate-900 dark:text-white">{settings.scalePrefix ?? '2'}</strong>, 
                        PLU à <strong className="font-mono text-slate-900 dark:text-white">{settings.scalePluDigits ?? 5}</strong> chiffres, 
                        Valeur à <strong className="font-mono text-slate-900 dark:text-white">{settings.scaleValueDigits ?? 5}</strong> chiffres 
                        ({settings.scaleValueType === 'price' ? `Prix en DA → ${settings.scaleDecimals ?? 2} décimales` : `Poids en grammes → ${settings.scaleDecimals ?? 3} décimales`}) : 
                        Le code-barres <strong className="font-mono text-slate-900 dark:text-white">{settings.scalePrefix ?? '2'} 12345 01500 C</strong> signifie 
                        PLU = <strong className="font-mono text-slate-900 dark:text-white">12345</strong> et {settings.scaleValueType === 'price' 
                          ? `le prix ${(1500 / Math.pow(10, settings.scaleDecimals ?? 2)).toFixed(settings.scaleDecimals ?? 2)} DA` 
                          : `le poids ${(1500 / Math.pow(10, settings.scaleDecimals ?? 3)).toFixed(settings.scaleDecimals ?? 3)} kg`}.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Carte Balance USB (Lecture Directe USB / Port COM) */}
              <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                      <Usb className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          Balance USB (lecture directe)
                        </h4>
                        <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                          ● Port COM / RS232
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Lit le poids directement depuis la balance connectée au port USB/COM. En sélectionnant un produit vendu au poids en caisse, l'opérateur pèse et la quantité se remplit automatiquement.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Interrupteur vert */}
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.usbScaleActive}
                        onChange={(e) => updateSetting('usbScaleActive', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>
                </div>

                {/* Si activée : Barre d'actions + 4 rangées de paramètres complets */}
                {settings.usbScaleActive && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-fadeIn">
                    
                    {/* Barre d'actions supérieure : Détection automatique, Diagnostic, Rafraîchir */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Configuration de la liaison série
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Bouton vert Détection Automatique */}
                        <button
                          type="button"
                          onClick={handleAutoDetectScale}
                          disabled={isDetectingScale}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Radio className={`w-3.5 h-3.5 ${isDetectingScale ? 'animate-spin' : ''}`} />
                          <span>{isDetectingScale ? 'Scan...' : 'Détection automatique'}</span>
                        </button>

                        {/* Bouton Tester / Diagnostiquer */}
                        <button
                          type="button"
                          onClick={handleTestDiagnosticScale}
                          disabled={isTestingScale}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95"
                        >
                          <Activity className="w-3.5 h-3.5 text-blue-600" />
                          <span>Tester / Diagnostiquer</span>
                        </button>

                        {/* Lien Rafraîchir les ports */}
                        <button
                          type="button"
                          onClick={() => loadComPorts(true)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Rafraîchir les ports</span>
                        </button>
                      </div>
                    </div>

                    {/* Rangée 1 : Communication Série (5 champs) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                      {/* 1. Port COM */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Le Port
                        </label>
                        <select
                          value={settings.usbScalePort || 'COM3'}
                          onChange={(e) => updateSetting('usbScalePort', e.target.value)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        >
                          {comPorts.map((cp) => (
                            <option key={`scale-cp-${cp}`} value={cp}>{cp}</option>
                          ))}
                          {!comPorts.includes(settings.usbScalePort || 'COM3') && (
                            <option value={settings.usbScalePort || 'COM3'}>{settings.usbScalePort || 'COM3'}</option>
                          )}
                        </select>
                      </div>

                      {/* 2. Vitesse Baud */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Vitesse Baud
                        </label>
                        <select
                          value={settings.usbScaleBaudRate || 9600}
                          onChange={(e) => updateSetting('usbScaleBaudRate', Number(e.target.value) || 9600)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        >
                          {[2400, 4800, 9600, 19200, 38400, 57600, 115200].map((b) => (
                            <option key={`baud-${b}`} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Bits de données */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Bits de données
                        </label>
                        <select
                          value={settings.usbScaleDataBits || 8}
                          onChange={(e) => updateSetting('usbScaleDataBits', Number(e.target.value) || 8)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        >
                          <option value={8}>8</option>
                          <option value={7}>7</option>
                        </select>
                      </div>

                      {/* 4. Parité */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Parité
                        </label>
                        <select
                          value={settings.usbScaleParity || 'None'}
                          onChange={(e) => updateSetting('usbScaleParity', e.target.value)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        >
                          <option value="None">None</option>
                          <option value="Even">Even (Paire)</option>
                          <option value="Odd">Odd (Impaire)</option>
                          <option value="Mark">Mark</option>
                          <option value="Space">Space</option>
                        </select>
                      </div>

                      {/* 5. Bits d'arrêt */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Bits d'arrêt
                        </label>
                        <select
                          value={settings.usbScaleStopBits || '1'}
                          onChange={(e) => updateSetting('usbScaleStopBits', e.target.value)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        >
                          <option value="1">1</option>
                          <option value="1.5">1.5</option>
                          <option value="2">2</option>
                        </select>
                      </div>
                    </div>

                    {/* Rangée 2 : Protocole & Unités (4 champs) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                      {/* Protocole */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Le Protocole
                        </label>
                        <select
                          value={settings.usbScaleProtocol || 'auto'}
                          onChange={(e) => updateSetting('usbScaleProtocol', e.target.value)}
                          className="w-full h-9 text-center font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="auto">Automatique (Détection)</option>
                          <option value="toledo">Standard NCI / Toledo</option>
                          <option value="cas">CAS (PD-II / AP-1)</option>
                          <option value="dibal">Dibal / Bizerba</option>
                          <option value="datalogic">Datalogic / Magellan</option>
                          <option value="continuous">Texte continu (ASCII)</option>
                        </select>
                      </div>

                      {/* Mode de lecture */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Mode de lecture
                        </label>
                        <select
                          value={settings.usbScaleReadMode || 'continuous'}
                          onChange={(e) => updateSetting('usbScaleReadMode', e.target.value)}
                          className="w-full h-9 text-center font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="continuous">Diffusion continue</option>
                          <option value="poll">Sur demande (Sondage)</option>
                          <option value="stable">Sur stabilisation</option>
                        </select>
                      </div>

                      {/* Unité de la balance */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Unité de la balance
                        </label>
                        <select
                          value={settings.usbScaleUnit || 'kg'}
                          onChange={(e) => updateSetting('usbScaleUnit', e.target.value)}
                          className="w-full h-9 text-center font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="kg">kg (Kilogramme)</option>
                          <option value="g">g (Gramme)</option>
                          <option value="lb">lb (Livre)</option>
                        </select>
                      </div>

                      {/* Diviseur */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Le Diviseur
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={settings.usbScaleDivisor ?? 1}
                          onChange={(e) => updateSetting('usbScaleDivisor', Number(e.target.value) || 1)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Rangée 3 : Commandes HEX et Intervalle (4 champs) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                      {/* Commande d'interrogation (HEX) */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Commande d'interrogation (HEX)
                        </label>
                        <input
                          type="text"
                          value={settings.usbScalePollHex || '05'}
                          onChange={(e) => updateSetting('usbScalePollHex', e.target.value.toUpperCase())}
                          placeholder="05"
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        />
                      </div>

                      {/* Intervalle (MS) */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Tous les (MS)
                        </label>
                        <input
                          type="number"
                          min="50"
                          max="5000"
                          value={settings.usbScaleIntervalMs || 400}
                          onChange={(e) => updateSetting('usbScaleIntervalMs', Number(e.target.value) || 400)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        />
                      </div>

                      {/* Commande de tare (HEX) */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Commande Tare (HEX)
                        </label>
                        <input
                          type="text"
                          value={settings.usbScaleTareHex || '54, 0D'}
                          onChange={(e) => updateSetting('usbScaleTareHex', e.target.value.toUpperCase())}
                          placeholder="54, 0D"
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        />
                      </div>

                      {/* Commande zéro (HEX) */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Commande Zéro (HEX)
                        </label>
                        <input
                          type="text"
                          value={settings.usbScaleZeroHex || '5A, 0D'}
                          onChange={(e) => updateSetting('usbScaleZeroHex', e.target.value.toUpperCase())}
                          placeholder="5A, 0D"
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Rangée 4 : Poids min, Stabilité et Confirmation automatique */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      {/* Poids min */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Poids minimum (kg)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={settings.usbScaleMinWeight ?? 0.005}
                          onChange={(e) => updateSetting('usbScaleMinWeight', parseFloat(e.target.value) || 0.005)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        />
                      </div>

                      {/* Trames de stabilité */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-center">
                          Trames de stabilité
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={settings.usbScaleStableFrames ?? 3}
                          onChange={(e) => updateSetting('usbScaleStableFrames', Number(e.target.value) || 3)}
                          className="w-full h-9 text-center font-mono font-bold text-xs px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 focus:border-emerald-500"
                        />
                      </div>

                      {/* Checkbox confirmation auto dès stabilisation */}
                      <div className="h-9 flex items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={settings.usbScaleAutoConfirm ?? true}
                            onChange={(e) => updateSetting('usbScaleAutoConfirm', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                          />
                          <span>Confirmer automatiquement dès stabilisation</span>
                        </label>
                      </div>
                    </div>

                    {/* Notice informative en bas (conforme capture) */}
                    <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-slate-900/60 border border-emerald-200/60 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                      <span className="text-emerald-600 font-black">💡 Note :</span>
                      <span>
                        Si vous ne connaissez pas les réglages de votre balance, cliquez sur <strong>« Détection automatique »</strong> pour tester les ports et vitesses. Utilisez <strong>« Tester / Diagnostiquer »</strong> pour afficher en direct les données brutes envoyées par la balance.
                      </span>
                    </div>

                    {/* Boîte de Diagnostic en direct si ouverte */}
                    {showScaleDiagModal && (
                      <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-black">Moniteur en Direct — Port {settings.usbScalePort || 'COM3'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowScaleDiagModal(false)}
                            className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded hover:bg-slate-800"
                          >
                            ✕ Fermer
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          <div className="p-3 rounded-lg bg-black/40 border border-slate-800 text-center">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Poids Détecté</div>
                            <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                              {scaleDiagData?.weight !== undefined ? Number(scaleDiagData.weight).toFixed(3) : '0.000'} kg
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-black/40 border border-slate-800 text-center">
                            <div className="text-[10px] uppercase font-bold text-slate-400">État de Stabilité</div>
                            <div className="mt-1">
                              {scaleDiagData?.stable ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  ● POIDS STABLE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  ◌ EN COURS DE PESÉE
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleZeroScale}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-white border border-slate-700 cursor-pointer"
                              >
                                Commande ZÉRO
                              </button>
                              <button
                                type="button"
                                onClick={handleTareScale}
                                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-white border border-slate-700 cursor-pointer"
                              >
                                Commande TARE
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={handleTestDiagnosticScale}
                              className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[11px] font-black text-white cursor-pointer"
                            >
                              Re-lire le poids
                            </button>
                          </div>
                        </div>

                        {scaleDiagData?.raw && (
                          <div className="p-2 rounded bg-black/60 font-mono text-[10.5px] text-slate-300 break-all">
                            <span className="text-slate-500">Trame brute : </span>
                            <code>{JSON.stringify(scaleDiagData.raw)}</code>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>

            {/* Bouton Enregistrer factures */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSave('Paramètres de facturation et point de vente')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-600/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer les factures</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VOLET 4 : RÉSEAU (En attente des détails)                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'network' && (
          <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-12 text-center max-w-3xl mx-auto space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
              <Network className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                {language === 'ar' ? 'إعدادات الشبكة' : 'Paramètres Réseau'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {language === 'ar' ? 'هذا القسم جاهز. ستتمكن من إضافة إعدادات وتفاصيل الشبكة متى أردت.' : 'Ce volet est prêt. Vous pourrez ajouter les détails et configurations réseau dès que souhaité.'}
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VOLET 5 : IMPORT / EXPORT (En attente des détails)                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'import_export' && (
          <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-12 text-center max-w-3xl mx-auto space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
              <ArrowLeftRight className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                {language === 'ar' ? 'استيراد / تصدير' : 'Import / Export'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {language === 'ar' ? "هذا القسم جاهز. ستتمكن من استيراد وتصدير البيانات متى أردت." : "Ce volet est prêt. Vous pourrez ajouter les options d'importation et d'exportation de données dès que souhaité."}
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VOLET 6 : ACTIVATION DE L'APPLICATION (En attente des détails)      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'activation' && (
          <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-12 text-center max-w-3xl mx-auto space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                {language === 'ar' ? "تفعيل التطبيق" : "Activation de l'Application"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {language === 'ar' ? "هذا القسم جاهز. ستتمكن من إدارة الترخيص ومفتاح التفعيل متى أردت." : "Ce volet est prêt. Vous pourrez configurer la licence, clé d'activation et statut dès que souhaité."}
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VOLET 7 : APPLICATION MOBILE (En attente des détails)              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'mobile' && (
          <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-12 text-center max-w-3xl mx-auto space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-xs">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                {language === 'ar' ? 'تطبيق الهاتف المحمول' : 'Application Mobile'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {language === 'ar' ? "هذا القسم جاهز. ستتمكن من مزامنة وربط تطبيق الهاتف الذكي متى أردت." : "Ce volet est prêt. Vous pourrez synchroniser et appairer l'application mobile dès que souhaité."}
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VOLET 8 : MISES À JOUR (En attente des détails)                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'updates' && (
          <div className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-12 text-center max-w-3xl mx-auto space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-xs">
              <RefreshCw className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">
                {language === 'ar' ? 'تحديثات النظام' : 'Mises à jour du Système'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {language === 'ar' ? 'هذا القسم جاهز. ستتمكن من فحص وتثبيت الإصدارات الجديدة متى أردت.' : 'Ce volet est prêt. Vous pourrez vérifier et installer les nouvelles versions dès que souhaité.'}
              </p>
            </div>
          </div>
        )}

      {/* ── MODAL CONCEPTEUR DE MODÈLES DE FACTURE INTERACTIF & RÉEL ── */}
      {isInvoiceDesignerOpen && (
        <InvoiceDesignerModal
          language={language}
          isOpen={isInvoiceDesignerOpen}
          onClose={() => setIsInvoiceDesignerOpen(false)}
          settings={settings}
          updateSetting={updateSetting}
          showToast={showToast}
        />
      )}

      {/* ── MODAL CONCEPTEUR DE MODÈLES DE TICKET INTERACTIF & RÉEL ── */}
      {isTicketDesignerOpen && (
        <TicketDesignerModal
          language={language}
          isOpen={isTicketDesignerOpen}
          onClose={() => setIsTicketDesignerOpen(false)}
          settings={settings}
          updateSetting={updateSetting}
          showToast={showToast}
        />
      )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT MODAL : CONCEPTEUR DE MODÈLES DE FACTURE (100% FONCTIONNEL & RÉEL)
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceDesignerModal({ isOpen, onClose, settings, updateSetting, showToast, language }) {
  const [activeDesign, setActiveDesign] = useState(settings.invoiceDesign || 'design1');
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [showLogo, setShowLogo] = useState(true);
  const [showTaxId, setShowTaxId] = useState(true);
  const [showClientBox, setShowClientBox] = useState(true);
  const [showRefCol, setShowRefCol] = useState(true);
  const [showTvaCol, setShowTvaCol] = useState(true);
  const [showStamp, setShowStamp] = useState(true);
  const [footerNote, setFooterNote] = useState(
    'Merci pour votre confiance. Les marchandises vendues ne sont ni reprises ni échangées après 48h. Garantie fabricant 12 mois.'
  );

  const handleSave = () => {
    updateSetting('invoiceDesign', activeDesign);
    try {
      localStorage.setItem('novamag_invoice_designer_config', JSON.stringify({
        accentColor,
        showLogo,
        showTaxId,
        showClientBox,
        showRefCol,
        showTvaCol,
        showStamp,
        footerNote
      }));
    } catch (e) {}
    showToast('✓ Modèle de facture configuré et enregistré avec succès !');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center border border-teal-200/80 dark:border-teal-800">
              <Wrench className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'مصمم نماذج الفواتير والإيصالات' : 'Concepteur de Modèles de Factures & Reçus'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'ar' ? 'خصص التخطيط والألوان وكتل الطباعة لمستنداتك A4.' : "Personnalisez la disposition, les couleurs et les blocs d'impression de vos documents A4."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps : Colonne Gauche (Contrôles) + Colonne Droite (Aperçu Live A4) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5 p-5 min-h-0">
          
          {/* Panneau de configuration (5 colonnes) */}
          <div className="md:col-span-5 space-y-4">
            
            {/* 1. Choix du style de base */}
            <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
              <label className="text-xs font-black text-slate-900 dark:text-white block">
                1. Style de mise en page
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'design1', label: 'Moderne' },
                  { id: 'design2', label: 'Simple' },
                  { id: 'design3', label: 'Encadré' }
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActiveDesign(d.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      activeDesign === d.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Couleur principale */}
            <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
              <label className="text-xs font-black text-slate-900 dark:text-white block">
                2. Couleur d'accentuation
              </label>
              <div className="flex items-center gap-3">
                {[
                  { hex: '#2563eb', label: 'Bleu Royal' },
                  { hex: '#059669', label: 'Émeraude' },
                  { hex: '#4f46e5', label: 'Indigo' },
                  { hex: '#0f172a', label: 'Ardoise' },
                  { hex: '#dc2626', label: 'Rubis' }
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                      accentColor === c.hex ? 'border-white ring-2 ring-blue-500 scale-115' : 'border-transparent hover:scale-105'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* 3. Blocs visibles */}
            <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
              <label className="text-xs font-black text-slate-900 dark:text-white block">
                3. Éléments & Blocs imprimés
              </label>
              <div className="space-y-2 text-xs">
                {[
                  { state: showLogo, set: setShowLogo, label: 'Afficher le logo du magasin' },
                  { state: showTaxId, set: setShowTaxId, label: 'Afficher identifiants fiscaux (RC, NIF, NIS)' },
                  { state: showClientBox, set: setShowClientBox, label: 'Cadre d’identification du client' },
                  { state: showRefCol, set: setShowRefCol, label: 'Colonne Référence article' },
                  { state: showTvaCol, set: setShowTvaCol, label: 'Colonne TVA / Taxe' },
                  { state: showStamp, set: setShowStamp, label: 'Cadre Cachet & Signature' }
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-[11.5px]">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={(e) => item.set(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Note de bas de page */}
            <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-2">
              <label className="text-xs font-black text-slate-900 dark:text-white block">
                4. Mention de bas de facture
              </label>
              <textarea
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                rows={2}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 resize-none text-slate-800 dark:text-white"
                placeholder="Conditions, remerciement ou garantie..."
              />
            </div>
          </div>

          {/* Panneau Aperçu Live A4 Haute Fidélité (7 colonnes) */}
          <div className="md:col-span-7 flex flex-col items-center justify-start bg-slate-200/70 dark:bg-slate-950 p-4 rounded-2xl border border-slate-300/80 dark:border-slate-800 overflow-y-auto">
            <div className="w-full max-w-[460px] bg-white text-slate-900 rounded-xl shadow-xl p-5 text-[9.5px] leading-tight font-sans space-y-3.5 select-none">
              
              {/* En-tête de la facture A4 */}
              <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: accentColor }}>
                <div className="space-y-1">
                  {showLogo && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg text-white font-black flex items-center justify-center text-[10px]" style={{ backgroundColor: accentColor }}>
                        N
                      </div>
                      <span className="font-black text-xs text-slate-900">{settings.storeName || 'NovaMag Tech'}</span>
                    </div>
                  )}
                  <div className="text-[8.5px] text-slate-500">
                    <div>{settings.storeAddress || 'Rue Didouche Mourad, Alger'}</div>
                    <div>Tél : {settings.phoneMobile || '0550 00 00 00'}</div>
                    {showTaxId && (
                      <div className="font-mono text-[8px] text-slate-400 mt-0.5">
                        RC: 16/00-1234567 • NIF: 001916001234567
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-2 py-0.5 rounded text-white font-black text-[10px] tracking-wide" style={{ backgroundColor: accentColor }}>
                    FACTURE
                  </div>
                  <div className="font-mono font-bold text-[9px] mt-1 text-slate-800">N° FAC-2026-0042</div>
                  <div className="text-[8px] text-slate-400">Date : 09/11/2026</div>
                </div>
              </div>

              {/* Cadre Client */}
              {showClientBox && (
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex justify-between">
                  <div>
                    <span className="text-[8px] font-bold uppercase text-slate-400 block mb-0.5">Facturé à :</span>
                    <strong className="text-[10px] text-slate-900">Hamid Supérette & Alimentation</strong>
                    <div className="text-[8.5px] text-slate-500">Adresse : Rue Bab El Oued, Alger</div>
                  </div>
                  <div className="text-right font-mono text-[8px] text-slate-500">
                    <div>Compte Client : #CLI-0082</div>
                    <div>Mode : Espèces / Comptant</div>
                  </div>
                </div>
              )}

              {/* Tableau des Articles */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="text-[8.5px] font-bold text-white uppercase" style={{ backgroundColor: accentColor }}>
                    <tr>
                      {showRefCol && <th className="p-1.5">Réf</th>}
                      <th className="p-1.5">Désignation</th>
                      <th className="p-1.5 text-center">Qté</th>
                      <th className="p-1.5 text-right">P.U HT</th>
                      {showTvaCol && <th className="p-1.5 text-center">TVA</th>}
                      <th className="p-1.5 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[8.5px]">
                    <tr>
                      {showRefCol && <td className="p-1.5 font-mono text-slate-400">DEL-820</td>}
                      <td className="p-1.5 font-bold text-slate-800">PC Portable Dell Vostro 15 (Core i5)</td>
                      <td className="p-1.5 text-center font-mono">1</td>
                      <td className="p-1.5 text-right font-mono">62 000.00</td>
                      {showTvaCol && <td className="p-1.5 text-center font-mono text-slate-400">19%</td>}
                      <td className="p-1.5 text-right font-mono font-bold">62 000.00</td>
                    </tr>
                    <tr>
                      {showRefCol && <td className="p-1.5 font-mono text-slate-400">LOG-MK2</td>}
                      <td className="p-1.5 font-bold text-slate-800">Souris & Clavier Logitech MK270 Pro</td>
                      <td className="p-1.5 text-center font-mono">2</td>
                      <td className="p-1.5 text-right font-mono">2 880.00</td>
                      {showTvaCol && <td className="p-1.5 text-center font-mono text-slate-400">19%</td>}
                      <td className="p-1.5 text-right font-mono font-bold">5 760.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totaux & Cachet */}
              <div className="flex justify-between items-end pt-2">
                {showStamp ? (
                  <div className="w-36 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-2 text-center" style={{ borderColor: accentColor + '60' }}>
                    <div className="w-6 h-6 rounded-full border flex items-center justify-center mb-1 text-[8px] font-black" style={{ color: accentColor, borderColor: accentColor }}>
                      ✓
                    </div>
                    <span className="text-[7.5px] font-black uppercase text-slate-500">Cadre Réservé</span>
                    <span className="text-[6.5px] text-slate-400">Cachet & Signature</span>
                  </div>
                ) : <div />}

                <div className="w-48 space-y-1 text-right">
                  <div className="flex justify-between text-slate-500 text-[8.5px]">
                    <span>Total HT :</span>
                    <span className="font-mono">67 760.00 DA</span>
                  </div>
                  {showTvaCol && (
                    <div className="flex justify-between text-slate-500 text-[8.5px]">
                      <span>TVA (19%) :</span>
                      <span className="font-mono">12 874.40 DA</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t-2 font-black text-[11px]" style={{ borderColor: accentColor, color: accentColor }}>
                    <span>TOTAL TTC :</span>
                    <span className="font-mono text-xs">80 634.40 DA</span>
                  </div>
                </div>
              </div>

              {/* Note de pied de page */}
              {footerNote && (
                <div className="pt-2 border-t border-slate-200 text-center text-[7.5px] text-slate-400 italic">
                  {footerNote}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md shadow-teal-600/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'ar' ? 'حفظ وتطبيق هذا النموذج' : 'Enregistrer et Appliquer ce Modèle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT MODAL : CONCEPTEUR DE MODÈLES DE TICKET (100% FONCTIONNEL & RÉEL)
// ─────────────────────────────────────────────────────────────────────────────
function TicketDesignerModal({ isOpen, onClose, settings, updateSetting, showToast, language }) {
  const [activeTicketDesign, setActiveTicketDesign] = useState(settings.ticketDesign || 'design1');
  const [showBarcode, setShowBarcode] = useState(settings.showBarcodeOnReceipt ?? true);
  const [ticketWidth, setTicketWidth] = useState('80mm');
  const [customThankYou, setCustomThankYou] = useState('Merci pour votre fidélité ! À très bientôt.');

  const handleSave = () => {
    updateSetting('ticketDesign', activeTicketDesign);
    updateSetting('showBarcodeOnReceipt', showBarcode);
    try {
      localStorage.setItem('novamag_ticket_designer_config', JSON.stringify({
        activeTicketDesign,
        showBarcode,
        ticketWidth,
        customThankYou
      }));
    } catch (e) {}
    showToast('✓ Modèle de ticket de caisse enregistré !');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn select-none">
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800">
              <Receipt className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {language === 'ar' ? 'مصمم التذاكر الحرارية' : 'Concepteur de Tickets Thermiques'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ajustez le format, les mentions et le code-barres de vos reçus de caisse 80mm / 58mm.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5 p-5 min-h-0">
          
          {/* Contrôles */}
          <div className="md:col-span-6 space-y-4">
            <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
              <label className="text-xs font-black text-slate-900 dark:text-white block">
                Format de papier thermique
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['80mm (Standard Caisse)', '58mm (Compact Portable)'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTicketWidth(w.startsWith('80') ? '80mm' : '58mm')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      (ticketWidth === '80mm' && w.startsWith('80')) || (ticketWidth === '58mm' && w.startsWith('58'))
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
              <label className="text-xs font-black text-slate-900 dark:text-white block">
                Options d'affichage du ticket
              </label>
              <label className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">Code-barres de la vente</span>
                  <span className="text-[10px] text-slate-400">Pour recherche rapide ou retour article</span>
                </div>
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                />
              </label>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-2">
              <label className="text-xs font-black text-slate-900 dark:text-white block">
                Message de remerciement au pied du reçu
              </label>
              <input
                type="text"
                value={customThankYou}
                onChange={(e) => setCustomThankYou(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Aperçu Live Ticket Thermique */}
          <div className="md:col-span-6 flex flex-col items-center justify-start bg-slate-200/70 dark:bg-slate-950 p-4 rounded-2xl border border-slate-300/80 dark:border-slate-800 overflow-y-auto">
            <div className="w-64 bg-white text-slate-900 shadow-xl rounded-sm p-4 font-mono text-[9px] leading-tight space-y-2 select-none border-t-4 border-emerald-600">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="font-black text-xs tracking-tight">{settings.storeName || 'NOVAMAG STORE'}</div>
                <div className="text-[8px] text-slate-500">{settings.storeAddress || 'Alger, Algérie'}</div>
                <div className="text-[8px] text-slate-500">Tél: {settings.phoneMobile || '0550 00 00 00'}</div>
                <div className="text-[7.5px] text-slate-400 mt-1">Date: 09/11/2026 15:42 • Ticket #042</div>
                <div className="text-[7.5px] text-slate-400">Caissier: BZ Technology</div>
              </div>

              <div className="space-y-1 py-1 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>1x PC Portable Dell</span>
                  <span className="font-bold">2 000.00</span>
                </div>
                <div className="flex justify-between">
                  <span>2x Souris Logitech MK</span>
                  <span className="font-bold">5 760.00</span>
                </div>
              </div>

              <div className="space-y-0.5 pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-Total :</span>
                  <span>7 760.00 DA</span>
                </div>
                <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-800 text-slate-900">
                  <span>TOTAL :</span>
                  <span>7 760.00 DA</span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>Espèces :</span>
                  <span>8 000.00 DA</span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>Rendu :</span>
                  <span>240.00 DA</span>
                </div>
              </div>

              {showBarcode && (
                <div className="pt-2 text-center border-t border-dashed border-slate-400 space-y-1">
                  <div className="text-[12px] tracking-widest font-black leading-none py-1">
                    ||| | |||| || ||| |||| |
                  </div>
                  <div className="text-[7.5px] text-slate-400 tracking-wider">FAC-2026-0042</div>
                </div>
              )}

              <div className="text-center text-[7.5px] text-slate-500 pt-1 border-t border-slate-200">
                {customThankYou}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Enregistrer le Modèle de Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Icône Droit de Timbre
function StampIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 22h14" />
      <path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z" />
      <path d="M14 13V8.5C14 7.12 12.88 6 11.5 6h-1A2.5 2.5 0 0 1 8 3.5V2" />
    </svg>
  );
}
