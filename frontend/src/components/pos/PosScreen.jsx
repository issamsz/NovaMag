import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import TopBar from '../layout/TopBar';
import PosHeader from './PosHeader';
import ProductCatalogGrid from './ProductCatalogGrid';
import PosSuperetteView from './PosSuperetteView';
import TicketPanel from './TicketPanel';
import PaymentModal from './PaymentModal';
import AddProductModal from './AddProductModal';
import AddCustomerModal from './AddCustomerModal';
import OpenCashDrawerModal from './OpenCashDrawerModal';
import FreeItemModal from './FreeItemModal';
import WeightQuantityModal from './WeightQuantityModal';
import QuantityModal from './QuantityModal';
import SuspendedTicketsModal from './SuspendedTicketsModal';
import InvoiceViewerModal from './InvoiceViewerModal';
import QuickShortcutsModal from './QuickShortcutsModal';
import CustomizationModal from './CustomizationModal';
import SaveOrderModal from './SaveOrderModal';
import ConfirmDialog from '../common/ConfirmDialog';
import ModernToast from '../common/ModernToast';
import { useLanguage } from '../../i18n/LanguageContext';
import { getShortcuts, getProducts, createProduct, updateProduct, getProductByBarcode, parseScaleBarcode } from '../../services/api';
import { calculateProductSellingPrice, deductQuantityFromBatches } from '../../services/batchPricing';
import { printThermalTicketDirect, triggerCashDrawerOpen } from '../../services/thermalPrinter';
import { playSaleValidationSound } from '../../services/soundService';
import { 
  MOCK_PRODUCTS, 
  MOCK_CATEGORIES, 
  MOCK_CUSTOMERS,
  MOCK_SUPPLIERS, 
  INITIAL_TICKET_ITEMS,
  MOCK_INVOICES,
  sanitizeProductsWithRealNames,
  sanitizePacksWithRealNames,
  matchesCategory
} from '../../mock/posData';
import { DEFAULT_PACKS } from '../views/PacksView';
import { DEFAULT_PROMOTIONS } from '../views/PromotionsView';

const DEFAULT_SHORTCUTS = [
  { id: 1, product_id: 1, label: 'Pain Baguette', name: 'Pain Baguette', price: 10, icon: '🥖', color: 'amber' },
  { id: 2, product_id: 2, label: 'Pain Amélioré', name: 'Pain Amélioré', price: 15, icon: '🍞', color: 'sky' },
  { id: 3, product_id: 3, label: 'Œuf (1 pièce)', name: 'Œuf (1 pièce)', price: 25, icon: '🥚', color: 'yellow' },
  { id: 4, product_id: 4, label: 'Plateau Œufs', name: "Plateau Œufs", price: 650, icon: '🥚', color: 'amber' },
  { id: 5, product_id: 5, label: 'Sachet Caisse', name: 'Sachet Caisse', price: 10, icon: '🛍️', color: 'slate' },
  { id: 6, product_id: 6, label: 'Lait Sachet', name: 'Lait Sachet', price: 25, icon: '🥛', color: 'sky' },
  { id: 7, product_id: 7, label: 'Eau 0.5L', name: 'Eau 0.5L', price: 35, icon: '💧', color: 'blue' },
  { id: 8, product_id: 8, label: 'Croissant', name: 'Croissant', price: 30, icon: '🥐', color: 'rose' },
  { id: 9, product_id: 9, label: 'Zitoune Vert', name: 'Zitoune Vert', price: 450, icon: '🫒', color: 'emerald', is_weighted: true },
  { id: 10, product_id: 10, label: 'Zitoune Noir', name: 'Zitoune Noir', price: 500, icon: '🫒', color: 'slate', is_weighted: true },
  { id: 11, product_id: 11, label: 'Gruiére', name: 'Gruiére', price: 1850, icon: '🧀', color: 'amber', is_weighted: true },
  { id: 12, product_id: 12, label: 'Yaourt Soummam', name: 'Yaourt Soummam', price: 35, icon: '🍨', color: 'rose' }
];

export default function PosScreen({ onNavigate, searchQuery: propSearchQuery, setSearchQuery: propSetSearchQuery }) {
  const { language, isRTL, t } = useLanguage();
  // Modern Toast State (Declared at top to prevent any TDZ ReferenceError)
  const [toast, setToast] = useState({
    message: '',
    type: 'success'
  });

  const showToast = useCallback((msg, type = 'success') => {
    if (!msg) {
      setToast({ message: '', type: 'success' });
      return;
    }
    const detectedType = type !== 'success' 
      ? type 
      : msg.includes('✓') || msg.includes('succès') || msg.includes('★')
      ? 'success' 
      : msg.includes('Alerte') || msg.includes('vide') || msg.includes('inconnu')
      ? 'warning' 
      : 'info';
    setToast({ message: msg, type: detectedType });
  }, []);

  const setNotificationMsg = useCallback((msg) => {
    showToast(msg);
  }, [showToast]);

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_products');
      const baseCatalog = sanitizeProductsWithRealNames(MOCK_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Fusionner : garantir que le matériel informatique et la supérette cohabitent
          const merged = [...baseCatalog];
          parsed.forEach((p) => {
            const idx = merged.findIndex((m) => String(m.id) === String(p.id) || (p.barcode && m.barcode === p.barcode));
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...p, image: merged[idx].image || p.image };
            } else {
              merged.push(p);
            }
          });
          return merged;
        }
      }
      return baseCatalog;
    } catch {
      return sanitizeProductsWithRealNames(MOCK_PRODUCTS);
    }
  });

  // Sync products across views (e.g. StockView changes)
  useEffect(() => {
    const handleProductsSync = () => {
      try {
        const saved = localStorage.getItem('novamag_products');
        if (saved) setProducts(sanitizeProductsWithRealNames(JSON.parse(saved)));
      } catch (e) {}
    };
    window.addEventListener('novamag_products_updated', handleProductsSync);
    window.addEventListener('storage', handleProductsSync);
    return () => {
      window.removeEventListener('novamag_products_updated', handleProductsSync);
      window.removeEventListener('storage', handleProductsSync);
    };
  }, []);

  // 📦 Synchronisation et fusion des produits réels novamag.db avec les produits matériels & informatique
  useEffect(() => {
    let isMounted = true;
    async function fetchRealDbProducts() {
      try {
        const res = await getProducts();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const dbProductsFormatted = res.data.map((p) => ({
            ...p,
            stock: Number(p.stock_quantity ?? p.stock ?? 0)
          }));

          if (isMounted) {
            setProducts((prev) => {
              // 1. Base catalogue avec matériel informatique & caisse
              const baseCatalog = sanitizeProductsWithRealNames(MOCK_PRODUCTS);
              const mergedMap = new Map();

              // Ajouter la base informatique
              baseCatalog.forEach((p) => mergedMap.set(String(p.id), p));

              // 2. Préserver impérativement tous les produits déjà créés par l'utilisateur
              (prev || []).forEach((p) => {
                if (mergedMap.has(String(p.id))) {
                  mergedMap.set(String(p.id), { ...mergedMap.get(String(p.id)), ...p });
                } else {
                  mergedMap.set(String(p.id), p);
                }
              });

              // 3. Fusionner les produits de la base SQLite novamag.db
              dbProductsFormatted.forEach((dbP) => {
                const key = String(dbP.id);
                if (mergedMap.has(key)) {
                  mergedMap.set(key, { 
                    ...mergedMap.get(key), 
                    ...dbP, 
                    image: mergedMap.get(key)?.image || dbP.image,
                    stock: Number(dbP.stock_quantity ?? dbP.stock ?? mergedMap.get(key)?.stock ?? 0)
                  });
                } else {
                  // Vérifier si un produit local correspond au même code-barres
                  let matchedKey = null;
                  if (dbP.barcode) {
                    for (const [k, v] of mergedMap.entries()) {
                      if (v.barcode && String(v.barcode).trim() === String(dbP.barcode).trim()) {
                        matchedKey = k;
                        break;
                      }
                    }
                  }
                  if (matchedKey) {
                    mergedMap.set(matchedKey, { 
                      ...mergedMap.get(matchedKey), 
                      ...dbP,
                      image: mergedMap.get(matchedKey)?.image || dbP.image,
                      stock: Number(dbP.stock_quantity ?? dbP.stock ?? 0)
                    });
                  } else {
                    mergedMap.set(key, dbP);
                  }
                }
              });

              const merged = Array.from(mergedMap.values());
              try {
                localStorage.setItem('novamag_products', JSON.stringify(merged));
              } catch (e) {}

              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Sync products API error:', err);
      }
    }
    fetchRealDbProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync Packs (PacksView changes)
  const [packsList, setPacksList] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_packs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return sanitizePacksWithRealNames(parsed);
      }
      return sanitizePacksWithRealNames(DEFAULT_PACKS);
    } catch {
      return sanitizePacksWithRealNames(DEFAULT_PACKS);
    }
  });

  useEffect(() => {
    const handlePacksSync = () => {
      try {
        const saved = localStorage.getItem('novamag_packs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPacksList(sanitizePacksWithRealNames(parsed));
            return;
          }
        }
        setPacksList(sanitizePacksWithRealNames(DEFAULT_PACKS));
      } catch (e) {}
    };
    window.addEventListener('novamag_packs_updated', handlePacksSync);
    window.addEventListener('storage', handlePacksSync);
    return () => {
      window.removeEventListener('novamag_packs_updated', handlePacksSync);
      window.removeEventListener('storage', handlePacksSync);
    };
  }, []);

  // Sync Promotions réelles & dynamiques
  const [promotionsList, setPromotionsList] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_promotions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_PROMOTIONS;
    } catch {
      return DEFAULT_PROMOTIONS;
    }
  });

  useEffect(() => {
    const handlePromosSync = () => {
      try {
        const saved = localStorage.getItem('novamag_promotions');
        if (saved) setPromotionsList(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('novamag_promotions_updated', handlePromosSync);
    window.addEventListener('storage', handlePromosSync);
    return () => {
      window.removeEventListener('novamag_promotions_updated', handlePromosSync);
      window.removeEventListener('storage', handlePromosSync);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('novamag_products', JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  const [categories] = useState(MOCK_CATEGORIES);
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_customers');
      return saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
    } catch {
      return MOCK_CUSTOMERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('novamag_customers', JSON.stringify(customers));
    } catch (e) {}
  }, [customers]);

  const [selectedCustomer, setSelectedCustomer] = useState(MOCK_CUSTOMERS[0]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Sync System Settings (fastSale, financialAccountingOnly, etc.)
  const [systemSettings, setSystemSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      return saved ? JSON.parse(saved) : { fastSale: true, financialAccountingOnly: false };
    } catch {
      return { fastSale: true, financialAccountingOnly: false };
    }
  });

  useEffect(() => {
    const handleSettingsSync = () => {
      try {
        const saved = localStorage.getItem('novamag_system_settings');
        if (saved) setSystemSettings(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('novamag_settings_updated', handleSettingsSync);
    window.addEventListener('storage', handleSettingsSync);
    return () => {
      window.removeEventListener('novamag_settings_updated', handleSettingsSync);
      window.removeEventListener('storage', handleSettingsSync);
    };
  }, []);

  // Détection client comptoir (anonyme / passager) vs client régulier connu
  const isCounterCustomer = useCallback((customer) => {
    if (!customer) return true;
    if (customer.id === 1) return true;
    const name = (customer.name || '').toLowerCase();
    return name.includes('comptoir') || name.includes('passager');
  }, []);

  // Web Audio alert tone helper pour rupture de stock ou alerte scan
  const playStockAlertTone = useCallback((type = 'out_of_stock') => {
    if (systemSettings?.soundAlertsActive === false) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      const vol = (Number(systemSettings?.soundVolume ?? 75) / 100) * 0.3;
      gain.gain.value = vol;
      gain.connect(ctx.destination);

      if (type === 'out_of_stock') {
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
      } else if (type === 'success_beep') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.connect(gain);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch (e) {}
  }, [systemSettings]);

  const handleSaveCustomer = useCallback((newCustomer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
    showToast(`✓ Client "${newCustomer.name}" enregistré et sélectionné`, 'success');
  }, [showToast]);

  // POS State (Charge les articles restaurés en priorité s'il y a une vente en cours de modification)
  const [ticketItems, setTicketItems] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_ticket_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // Vente en cours de modification (Restaurée depuis l'historique)
  const [editingSale, setEditingSale] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_editing_invoice');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [editingProforma, setEditingProforma] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_editing_proforma');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isSaveOrderModalOpen, setIsSaveOrderModalOpen] = useState(false);
  const [editingOrderForm, setEditingOrderForm] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_editing_order_form');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Écoute de restauration d'un bon de commande pour modification dans le POS
  useEffect(() => {
    const handleRestoreOrder = () => {
      try {
        const savedOrder = localStorage.getItem('novamag_editing_order_form');
        if (savedOrder) {
          const order = JSON.parse(savedOrder);
          setEditingOrderForm(order);
          const savedItems = localStorage.getItem('novamag_ticket_items');
          if (savedItems) {
            const parsed = JSON.parse(savedItems);
            setTicketItems(Array.isArray(parsed) ? parsed : []);
          } else if (Array.isArray(order.items)) {
            setTicketItems(order.items);
          } else {
            setTicketItems([]);
          }
          if (order.clientName) {
            setSelectedCustomer({
              id: order.clientId || 1,
              name: order.clientName,
              phone: order.clientPhone || '',
              address: order.clientAddress || '',
              rc: order.clientRc || '',
              nif: order.clientNif || ''
            });
          }
        }
      } catch (e) {}
    };
    window.addEventListener('novamag_restore_order_for_edit', handleRestoreOrder);
    return () => {
      window.removeEventListener('novamag_restore_order_for_edit', handleRestoreOrder);
    };
  }, []);

  // Écoute de restauration d'une pro-forma pour modification dans le POS
  useEffect(() => {
    const handleRestoreProforma = () => {
      try {
        const savedProforma = localStorage.getItem('novamag_editing_proforma');
        if (savedProforma) {
          const proforma = JSON.parse(savedProforma);
          setEditingProforma(proforma);
          const savedItems = localStorage.getItem('novamag_ticket_items');
          if (savedItems) {
            const parsed = JSON.parse(savedItems);
            setTicketItems(Array.isArray(parsed) ? parsed : []);
          } else if (Array.isArray(proforma.items)) {
            setTicketItems(proforma.items);
          } else {
            setTicketItems([]);
          }
          if (proforma.clientName) {
            setSelectedCustomer({
              id: proforma.clientId || 1,
              name: proforma.clientName,
              phone: proforma.clientPhone || ''
            });
          }
        }
      } catch {}
    };

    window.addEventListener('novamag_restore_proforma', handleRestoreProforma);
    handleRestoreProforma();
    return () => {
      window.removeEventListener('novamag_restore_proforma', handleRestoreProforma);
    };
  }, []);

  // Écoute de restauration d'une vente depuis l'Historique des Ventes
  useEffect(() => {
    const handleRestoreSale = () => {
      try {
        const savedEditing = localStorage.getItem('novamag_editing_invoice');
        const savedItems = localStorage.getItem('novamag_ticket_items');
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems);
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            setTicketItems(parsedItems);
            setSelectedTicketIndex(0);
          }
        }
        if (savedEditing) {
          const inv = JSON.parse(savedEditing);
          setEditingSale(inv);
          if (inv.customer) {
            setSelectedCustomer({
              id: inv.customerId || 1,
              name: inv.customer,
              phone: inv.customerPhone || ''
            });
          }
          showToast(`✓ Vente ${inv.invoiceNumber || inv.id} chargée dans le panier pour modification`, 'info');
        }
      } catch {}
    };

    window.addEventListener('novamag_restore_sale', handleRestoreSale);
    // Vérifier également au montage
    handleRestoreSale();
    return () => {
      window.removeEventListener('novamag_restore_sale', handleRestoreSale);
    };
  }, [showToast]);

  // Synchronisation continue des articles du panier
  useEffect(() => {
    try {
      localStorage.setItem('novamag_ticket_items', JSON.stringify(ticketItems));
    } catch {}
  }, [ticketItems]);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : internalSearchQuery;
  const setSearchQuery = propSetSearchQuery || setInternalSearchQuery;
  const [barcodeInput, setBarcodeInput] = useState('');
  const searchInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isReturnMode, setIsReturnMode] = useState(false);

  // ══ Basculer Mode Retour Vente / Remboursement ══
  const handleToggleReturnMode = useCallback(() => {
    setIsReturnMode((prev) => {
      const nextMode = !prev;
      showToast(
        nextMode
          ? '🔄 Mode Retour activé : Scannez les articles retournés par le client pour remboursement'
          : '✓ Mode Vente normale réactivé',
        nextMode ? 'warning' : 'info'
      );
      return nextMode;
    });
  }, [showToast]);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductInitialBarcode, setNewProductInitialBarcode] = useState('');
  const [isOpenDrawerModalOpen, setIsOpenDrawerModalOpen] = useState(false);
  const [isFreeItemOpen, setIsFreeItemOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [selectedWeightedProduct, setSelectedWeightedProduct] = useState(null);

  // Exact Quantity Modal State (Touche Entrée ou clic sur badge quantité)
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [quantityModalItem, setQuantityModalItem] = useState(null);
  const [quantityModalIndex, setQuantityModalIndex] = useState(-1);

  // Modern Confirm Dialog State (Replaces native window.confirm)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: () => {}
  });

  // Suspended Tickets / Drafts State (Paniers en attente F2/F3)
  const [suspendedTickets, setSuspendedTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_suspended_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);

  // Sales History & Invoices State (F9: Dernière facture, F10: Facture précédente)
  const [salesHistory, setSalesHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_sales_history');
      return saved ? JSON.parse(saved) : MOCK_INVOICES;
    } catch {
      return MOCK_INVOICES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('novamag_sales_history', JSON.stringify(salesHistory));
    } catch (e) {}
  }, [salesHistory]);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentInvoiceIndex, setCurrentInvoiceIndex] = useState(0);

  // F5 / F9: Afficher la dernière facture & Centre d'impression
  const handleShowLatestInvoice = useCallback(() => {
    let list = salesHistory;
    if (!list || list.length === 0) {
      try {
        const saved = localStorage.getItem('novamag_sales_history') || localStorage.getItem('novamag_sales');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
            setSalesHistory(parsed);
          }
        }
      } catch (e) {}
    }

    if (!list || list.length === 0) {
      showToast(language === 'ar' ? 'لا توجد مبيعات مسجلة حالياً' : "Aucune facture enregistrée pour le moment", "info");
      return;
    }

    setCurrentInvoiceIndex(0);
    setIsInvoiceModalOpen(true);
    const latest = list[0];
    showToast(
      language === 'ar'
        ? `مركز الطباعة — آخر عملية بيع (فاتورة #${latest.invoiceNumber || latest.id})`
        : `Centre d'impression — Aperçu de la dernière vente (${latest.invoiceNumber || '#' + latest.id})`,
      "info"
    );
  }, [salesHistory, language, showToast]);

  // F10: Afficher la facture précédente de celle qui est affichée
  const handleShowPreviousInvoice = useCallback(() => {
    if (!salesHistory || salesHistory.length === 0) {
      showToast("Aucune facture enregistrée pour le moment", "info");
      return;
    }

    if (!isInvoiceModalOpen) {
      const targetIdx = salesHistory.length > 1 ? 1 : 0;
      setCurrentInvoiceIndex(targetIdx);
      setIsInvoiceModalOpen(true);
      showToast(`Facture précédente : ${salesHistory[targetIdx].invoiceNumber}`, "info");
      return;
    }

    if (currentInvoiceIndex + 1 < salesHistory.length) {
      const nextIdx = currentInvoiceIndex + 1;
      setCurrentInvoiceIndex(nextIdx);
      showToast(`Facture précédente : ${salesHistory[nextIdx].invoiceNumber}`, "info");
    } else {
      showToast("Première facture de l'historique atteinte (plus d'ancienne facture)", "warning");
    }
  }, [salesHistory, isInvoiceModalOpen, currentInvoiceIndex, showToast]);

  // Naviguer vers la facture suivante (plus récente)
  const handleShowNextInvoice = useCallback(() => {
    if (currentInvoiceIndex > 0) {
      const prevIdx = currentInvoiceIndex - 1;
      setCurrentInvoiceIndex(prevIdx);
      showToast(`Facture suivante : ${salesHistory[prevIdx].invoiceNumber}`, "info");
    }
  }, [currentInvoiceIndex, salesHistory, showToast]);

  // Auto-Print Receipt State (F5 toggle - Impression automatique du ticket)
  const [isAutoPrintEnabled, setIsAutoPrintEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_auto_print');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem('novamag_auto_print', JSON.stringify(isAutoPrintEnabled));
  }, [isAutoPrintEnabled]);

  const handleToggleAutoPrint = useCallback(() => {
    setIsAutoPrintEnabled((prev) => {
      const next = !prev;
      if (next) {
        showToast("✓ Impression automatique du ticket : ACTIVÉE", "success");
      } else {
        showToast("✕ Impression automatique désactivée (Mode sans ticket)", "info");
      }
      return next;
    });
  }, []);

  // ══ POS LAYOUT MODE (Personnalisation تخصيص : 'catalog' par défaut ou 'superette') ══
  const [posLayoutMode, setPosLayoutMode] = useState(() => {
    try {
      return localStorage.getItem('novamag_pos_layout_mode') || 'catalog';
    } catch {
      return 'catalog';
    }
  });

  const handleSelectPosLayoutMode = (mode) => {
    setPosLayoutMode(mode);
    try {
      localStorage.setItem('novamag_pos_layout_mode', mode);
    } catch {}
    if (mode === 'superette') {
      setCatalogCustomization(prev => ({
        ...prev,
        showImages: false
      }));
      try {
        const saved = localStorage.getItem('novamag_catalog_customization');
        const parsed = saved ? JSON.parse(saved) : {};
        localStorage.setItem('novamag_catalog_customization', JSON.stringify({ ...parsed, showImages: false }));
      } catch {}
      setFavoritesOnly(false);
      setPromoOnly(false);
      setPacksOnly(false);
      setSortBy('default');
      setSelectedSupplier('all');
      setStockStatus('all');
      setSelectedCategory('all');
      showToast(language === 'ar' ? '✓ تم تفعيل وضع كاسة السوبرماركت والبقالة' : '✓ Mode Caisse Supérette & Épicerie activé', 'success');
    } else {
      showToast(language === 'ar' ? '✓ تم تفعيل وضع الكتالوج العام' : '✓ Mode Catalogue Général activé', 'info');
    }
  };

  // ══ CATALOG & UI CUSTOMIZATION (تخصيص: Images, Emplacement, Description, Catégorie, Prix Achat, Zoom) ══
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [catalogCustomization, setCatalogCustomization] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_catalog_customization');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      showImages: true,
      showStorageLocation: true,
      showDescription: false,
      showCategory: false,
      showCostPrice: false,
      zoomLevel: 100
    };
  });

  const handleUpdateCustomization = (newCustomization) => {
    setCatalogCustomization(newCustomization);
    try {
      localStorage.setItem('novamag_catalog_customization', JSON.stringify(newCustomization));
    } catch {}
  };

  // ══ ARTICLES RAPIDES & RACCOURCIS (Pain, Œufs, Zitoune, Sacs...) ══
  const [shortcuts, setShortcuts] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_shortcuts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_SHORTCUTS;
  });
  const [isQuickShortcutsModalOpen, setIsQuickShortcutsModalOpen] = useState(false);
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const loadShortcutsList = useCallback(async () => {
    try {
      const res = await getShortcuts();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setShortcuts(res.data);
        try {
          localStorage.setItem('novamag_shortcuts', JSON.stringify(res.data));
        } catch (e) {}
        return;
      }
    } catch (e) {
      console.warn('Could not fetch server shortcuts, using local storage:', e);
    }
    try {
      const saved = localStorage.getItem('novamag_shortcuts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setShortcuts(parsed);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadShortcutsList();
  }, [loadShortcutsList]);

  // ══ CATALOG FILTERS STATE (Filtres & Tri comme sur la capture) ══
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [promoOnly, setPromoOnly] = useState(false);
  const [packsOnly, setPacksOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');

  // Fournisseurs dynamiques calculés à partir des articles réels et de la base fournisseurs
  const suppliers = useMemo(() => {
    const list = new Set();
    (products || []).forEach((p) => {
      const sup = p.supplier || p.fournisseur;
      if (sup && typeof sup === 'string' && sup.trim()) {
        list.add(sup.trim());
      }
    });

    try {
      const saved = localStorage.getItem('novamag_suppliers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((s) => {
            const name = s.name || s.company;
            if (name && typeof name === 'string' && name.trim()) list.add(name.trim());
          });
        }
      }
    } catch {}

    if (list.size === 0) {
      (MOCK_SUPPLIERS || []).forEach((s) => {
        if (s.name) list.add(s.name);
      });
    }

    return Array.from(list);
  }, [products]);

  const activeFiltersCount = 
    (favoritesOnly ? 1 : 0) + 
    (promoOnly ? 1 : 0) +
    (packsOnly ? 1 : 0) +
    (sortBy !== 'default' ? 1 : 0) + 
    (selectedSupplier !== 'all' ? 1 : 0) + 
    (stockStatus !== 'all' ? 1 : 0);

  const handleResetFilters = () => {
    setFavoritesOnly(false);
    setPromoOnly(false);
    setPacksOnly(false);
    setSortBy('default');
    setSelectedSupplier('all');
    setStockStatus('all');
    showToast(language === 'ar' ? 'تمت إعادة ضبط الفلاتر' : 'Filtres réinitialisés', 'info');
  };

  // Basculer l'affichage des produits en vedette / favoris (F6)
  const handleToggleFavorites = useCallback(() => {
    setFavoritesOnly((prev) => {
      const next = !prev;
      if (next) {
        showToast("★ Produits en vedette (elmoumayaza) affichés", "success");
      } else {
        showToast("Affichage de tous les produits", "info");
      }
      return next;
    });
  }, [showToast]);

  const [cashSession, setCashSession] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_cash_session');
      return saved ? JSON.parse(saved) : { isOpen: false, openingBalance: 0 };
    } catch {
      return { isOpen: false, openingBalance: 0 };
    }
  });

  // Mouvements d'espèces de la caisse (Retraits Sandwich, Café... & Dépôts)
  const [cashMovements, setCashMovements] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_cash_movements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleAddCashMovement = useCallback(({ type, amount, reason }) => {
    const newMovement = {
      id: `mov-${Date.now()}`,
      type, // 'withdraw' | 'deposit'
      amount: Number(amount),
      reason,
      timestamp: new Date().toISOString()
    };
    setCashMovements((prev) => {
      const updated = [newMovement, ...prev];
      try {
        localStorage.setItem('novamag_cash_movements', JSON.stringify(updated));
        window.dispatchEvent(new Event('novamag_cash_updated'));
      } catch {}
      return updated;
    });
    if (type === 'withdraw') {
      showToast(`✓ Retrait de ${Number(amount).toFixed(2)} DA enregistré (${reason})`, 'warning');
    } else {
      showToast(`✓ Dépôt de ${Number(amount).toFixed(2)} DA enregistré (${reason})`, 'success');
    }
  }, [showToast]);

  const handleCloseSession = useCallback((closureData) => {
    const sessionData = {
      isOpen: false,
      openingBalance: 0,
      sessionNumber: (cashSession?.sessionNumber || 1),
      closedAt: new Date().toISOString(),
      discrepancy: closureData?.discrepancy || 0,
      countedCash: closureData?.countedCash || 0,
      expectedCash: closureData?.expectedCash || 0,
      note: closureData?.note || '',
      cashier: closureData?.cashier || 'Admin'
    };
    setCashSession(sessionData);
    setCashMovements([]);
    try {
      localStorage.setItem('novamag_cash_session', JSON.stringify(sessionData));
      localStorage.removeItem('novamag_cash_movements');

      // Enregistrer également dans l'historique général des sessions
      const savedHistory = localStorage.getItem('novamag_cash_sessions_history');
      const historyList = savedHistory ? JSON.parse(savedHistory) : [];
      const closedRecord = {
        id: `sess-${Date.now()}`,
        sessionNumber: cashSession?.sessionNumber || 1,
        cashier: closureData?.cashier || cashSession?.openedBy || 'admin',
        openedAt: cashSession?.openedAt || new Date().toISOString(),
        closedAt: new Date().toISOString(),
        openingBalance: Number(cashSession?.openingBalance || 0),
        countedCash: Number(closureData?.countedCash || 0),
        expectedCash: Number(closureData?.expectedCash || 0),
        discrepancy: Number(closureData?.discrepancy || 0),
        status: 'closed',
        note: closureData?.note || '',
        movements: cashMovements || []
      };
      localStorage.setItem('novamag_cash_sessions_history', JSON.stringify([closedRecord, ...historyList]));
      window.dispatchEvent(new Event('novamag_cash_updated'));
    } catch {}
    
    if (closureData?.discrepancy < -0.01) {
      showToast(`⚠️ Clôture effectuée • Fuite / Manquant de ${Math.abs(closureData.discrepancy).toFixed(2)} DA détecté`, 'warning');
    } else if (closureData?.discrepancy > 0.01) {
      showToast(`✓ Clôture effectuée • Excédent de +${closureData.discrepancy.toFixed(2)} DA`, 'success');
    } else {
      showToast(language === 'ar' ? '✓ تم إغلاق الجلسة بنجاح (صندوق مطابق 0.00 دج فارق)' : '✓ Session clôturée avec succès (Caisse exacte, 0.00 DA d’écart)', 'success');
    }
  }, [cashSession, showToast]);

  // Persist suspended tickets to localStorage
  useEffect(() => {
    localStorage.setItem('novamag_suspended_tickets', JSON.stringify(suspendedTickets));
  }, [suspendedTickets]);

  // Resizable Ticket Panel State (Garde la largeur par défaut ou celle enregistrée)
  const [ticketWidth, setTicketWidth] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('novamag_ticket_width');
        if (saved && !isNaN(Number(saved)) && Number(saved) >= 320) {
          return Number(saved);
        }
        const defaultWidth = Math.min(500, Math.max(380, Math.round(window.innerWidth * 0.35)));
        return defaultWidth;
      }
    } catch (e) {}
    return 380;
  });
  const [isDragging, setIsDragging] = useState(false);
  const isResizingRef = useRef(false);

  // Drag resizer handler (Ticket on the RIGHT: width = window.innerWidth - e.clientX)
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 400 && newWidth <= Math.round(window.innerWidth * 0.75)) {
        setTicketWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setTicketWidth((w) => {
          localStorage.setItem('novamag_ticket_width', w.toString());
          return w;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Refs to guarantee event listener always accesses latest state without stale closures
  const ticketItemsRef = useRef(ticketItems);
  ticketItemsRef.current = ticketItems;
  const selectedTicketIndexRef = useRef(selectedTicketIndex);
  selectedTicketIndexRef.current = selectedTicketIndex;
  const handleInitiatePaymentRef = useRef(null);

  // Update item quantity (Strictly +1 / -1 without object mutation & Contrôle Stock Négatif)
  const handleUpdateQty = useCallback((index, delta) => {
    const isFinancialOnly = Boolean(systemSettings?.financialAccountingOnly);
    const allowNegative = Boolean(systemSettings?.allowNegativeStock);
    const confirmNegative = systemSettings?.confirmNegativeStockSale ?? true;

    setTicketItems((prev) => {
      if (!prev || prev.length === 0) return prev;
      const targetIndex = index >= 0 && index < prev.length ? index : prev.length - 1;
      const item = prev[targetIndex];
      if (!item) return prev;

      const isWeighted = Boolean(item.isWeighted);
      const isIncrement = delta > 0;
      const step = isWeighted ? (isIncrement ? 0.1 : -0.1) : (isIncrement ? 1 : -1);
      const currentQty = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 1;
      const newQty = Math.round((currentQty + step) * 1000) / 1000;

      // Minimum 1 (ou 0.1 kg) : le - ne supprime JAMAIS l'article, il s'arrête à 1
      if (!isIncrement && newQty < (isWeighted ? 0.1 : 1)) {
        showToast("Quantité minimale : 1 (Appuyez sur Suppr pour supprimer la ligne)", "info");
        return prev;
      }

      // Contrôle de stock lors de l'incrémentation
      if (isIncrement && !isFinancialOnly && !isReturnMode && !item.isFreeItem) {
        const matchingProd = products.find((p) => p.id === item.productId);
        if (matchingProd) {
          const availableStock = typeof matchingProd.stock === 'number' ? matchingProd.stock : 999;
          if (newQty > availableStock) {
            if (confirmNegative) {
              playStockAlertTone('out_of_stock');
              setConfirmDialog({
                isOpen: true,
                title: availableStock <= 0 ? 'Article Épuisé en Rayon' : 'Dépassement du Stock Disponible',
                message: availableStock <= 0
                  ? `Le produit « ${item.name} » est en rupture de stock (${availableStock}). Autoriser cette vente en stock négatif ?`
                  : `Augmenter la quantité de « ${item.name} » à ${newQty} dépasse le stock disponible (${availableStock}). Autoriser la vente en stock négatif ?`,
                confirmText: 'Oui, autoriser',
                cancelText: 'Annuler',
                type: 'warning',
                onConfirm: () => {
                  setConfirmDialog((p) => ({ ...p, isOpen: false }));
                  setTicketItems((curr) =>
                    curr.map((it, i) => (i === targetIndex ? { ...it, quantity: newQty } : it))
                  );
                  showToast(`Quantité augmentée en stock négatif (${newQty})`, 'warning');
                }
              });
              return prev; // Bloque l'incrémentation automatique tant que non confirmé
            } else if (!allowNegative) {
              playStockAlertTone('out_of_stock');
              showToast(
                `Stock insuffisant : plus que ${availableStock} unité(s) en rayon. Stock négatif non autorisé.`,
                'danger'
              );
              return prev;
            }
          }
        }
      }

      const updatedQty = Math.max(isWeighted ? 0.1 : 1, newQty);
      return prev.map((it, i) => (i === targetIndex ? { ...it, quantity: updatedQty } : it));
    });
  }, [products, systemSettings, isReturnMode, showToast, playStockAlertTone]);

  // Remove item (Réservé à la touche Suppr ou à l'icône corbeille)
  const handleRemoveItem = useCallback((index) => {
    setTicketItems((prev) => {
      if (!prev || prev.length === 0) return prev;
      const targetIndex = index >= 0 && index < prev.length ? index : prev.length - 1;
      const removedItem = prev[targetIndex];
      const filtered = prev.filter((_, i) => i !== targetIndex);
      setSelectedTicketIndex((current) => {
        if (filtered.length === 0) return 0;
        if (current >= filtered.length) return filtered.length - 1;
        return current;
      });
      if (removedItem) {
        showToast(`Article "${removedItem.name}" retiré du ticket`, "info");
      }
      return filtered;
    });
  }, [showToast]);

  // Open Direct Exact Quantity Modal
  const handleOpenQuantityModal = useCallback((item, index) => {
    setQuantityModalItem(item);
    setQuantityModalIndex(index);
    setIsQuantityModalOpen(true);
  }, []);

  // Save Direct Exact Quantity and Custom Line Total
  const handleSaveDirectQuantity = useCallback((newQty, newPrice, customTotal) => {
    if (!quantityModalItem && quantityModalIndex < 0) return;

    const isFinancialOnly = Boolean(systemSettings?.financialAccountingOnly);
    const allowNegative = Boolean(systemSettings?.allowNegativeStock);
    const confirmNegative = systemSettings?.confirmNegativeStockSale ?? true;

    const commitDirectQty = () => {
      setTicketItems((prev) => {
        let idx = quantityModalIndex;
        if (idx < 0 || idx >= prev.length || (quantityModalItem && prev[idx]?.id !== quantityModalItem.id)) {
          idx = prev.findIndex((it) => it.id === quantityModalItem?.id);
        }
        if (idx >= 0 && idx < prev.length) {
          return prev.map((it, i) => (i === idx ? { 
            ...it, 
            quantity: newQty,
            price: typeof newPrice === 'number' && newPrice >= 0 ? newPrice : it.price,
            customTotal: typeof customTotal === 'number' ? customTotal : undefined,
            originalPrice: it.originalPrice || it.price
          } : it));
        }
        return prev;
      });
      const itemName = quantityModalItem?.name || 'Article';
      const displayTotal = typeof customTotal === 'number' ? customTotal : (newQty * (newPrice || quantityModalItem?.price));
      showToast(`Total ligne validé à ${displayTotal.toFixed(2)} DA (${itemName})`, 'success');
      setIsQuantityModalOpen(false);
      setQuantityModalItem(null);
      setQuantityModalIndex(-1);
    };

    if (!isFinancialOnly && quantityModalItem && !isReturnMode && !quantityModalItem.isFreeItem) {
      const prod = products.find((p) => p.id === quantityModalItem.productId);
      if (prod) {
        const availableStock = typeof prod.stock === 'number' ? prod.stock : 999;
        if (newQty > availableStock) {
          if (confirmNegative) {
            playStockAlertTone('out_of_stock');
            setConfirmDialog({
              isOpen: true,
              title: availableStock <= 0 ? 'Article Épuisé en Rayon' : 'Dépassement du Stock Disponible',
              message: availableStock <= 0
                ? `Le produit « ${quantityModalItem.name} » est actuellement épuisé (${availableStock}). Autoriser la vente en stock négatif ?`
                : `La quantité saisie (${newQty}) pour « ${quantityModalItem.name} » dépasse le stock disponible (${availableStock}). Autoriser la vente en stock négatif ?`,
              confirmText: 'Oui, autoriser',
              cancelText: 'Annuler',
              type: 'warning',
              onConfirm: () => {
                setConfirmDialog((p) => ({ ...p, isOpen: false }));
                commitDirectQty();
              }
            });
            return;
          } else if (!allowNegative) {
            playStockAlertTone('out_of_stock');
            showToast(`Quantité refusée : stock limité à ${availableStock} unité(s). Stock négatif désactivé.`, 'danger');
            return;
          }
        }
      }
    }

    commitDirectQty();
  }, [quantityModalItem, quantityModalIndex, products, systemSettings, isReturnMode, showToast, playStockAlertTone]);

  // Global Keyboard Shortcuts (F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, +, -, Suppr, Flèches)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      const isFunctionKey = /^F[1-9]|F1[0-2]$/.test(e.key);

      // ➕ Touches pour le + (AZERTY touche =/+, Pavé numérique, QWERTY avec ou sans Shift)
      const isPlusKey =
        e.key === '+' ||
        e.key === '=' ||
        e.code === 'NumpadAdd' ||
        e.code === 'Equal' ||
        e.keyCode === 107 ||
        e.keyCode === 187 ||
        e.keyCode === 61;

      // ➖ Touches pour le - (AZERTY touche 6, Pavé numérique, QWERTY touche -)
      const isMinusKey =
        e.key === '-' ||
        e.code === 'NumpadSubtract' ||
        e.code === 'Minus' ||
        (e.code === 'Digit6' && !e.shiftKey) ||
        e.keyCode === 109 ||
        e.keyCode === 189;

      const isDeleteKey = e.key === 'Delete';

      // Avoid capturing regular keys if user is typing in a search bar or modal input
      if (!isFunctionKey && isInput) return;

      // Ignore key repeat while holding down
      if (e.repeat) return;

      const currentItems = ticketItemsRef.current;
      const currentIndex = selectedTicketIndexRef.current;

      // ⚡ Raccourcis Alt + 1..9 : Articles Rapides (Pain, Œufs, Zitoune...)
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code && e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', ''), 10);
        if (digit >= 1 && digit <= 9) {
          const scIndex = digit - 1;
          const currentShortcuts = shortcutsRef.current || [];
          if (currentShortcuts[scIndex]) {
            e.preventDefault();
            const sc = currentShortcuts[scIndex];
            handleSelectProduct({
              id: sc.product_id || sc.id,
              name: sc.label || sc.name,
              price: Number(sc.price || 0),
              barcode: sc.barcode,
              isWeighted: Boolean(sc.is_weighted || sc.isWeighted),
              is_weighted: Boolean(sc.is_weighted || sc.isWeighted),
              unit: sc.unit || 'pièce'
            });
            return;
          }
        }
      }

      // ➕ Touche + (Augmenter de exactement +1)
      if (isPlusKey) {
        if (currentItems.length > 0) {
          e.preventDefault();
          const targetIdx = currentIndex >= 0 && currentIndex < currentItems.length
            ? currentIndex
            : currentItems.length - 1;
          handleUpdateQty(targetIdx, 1);
        }
        return;
      }

      // ➖ Touche - (Diminuer de exactement -1)
      if (isMinusKey) {
        if (currentItems.length > 0) {
          e.preventDefault();
          const targetIdx = currentIndex >= 0 && currentIndex < currentItems.length
            ? currentIndex
            : currentItems.length - 1;
          handleUpdateQty(targetIdx, -1);
        }
        return;
      }

      // 🗑️ Touche Suppr (Supprimer la ligne sélectionnée)
      if (isDeleteKey) {
        if (currentItems.length > 0) {
          e.preventDefault();
          const targetIdx = currentIndex >= 0 && currentIndex < currentItems.length
            ? currentIndex
            : currentItems.length - 1;
          handleRemoveItem(targetIdx);
        }
        return;
      }

      // ⎋ Touche Échap (Ouverture manuelle du tiroir-caisse si aucun modal n'est ouvert)
      if (e.key === 'Escape') {
        const isAnyModalOpen = isPaymentModalOpen || isDraftsModalOpen || isSuspendedModalOpen || 
                               isAddCustomerOpen || isHistoryOpen || isFreeItemOpen || 
                               quantityModal.isOpen || isInvoiceViewerOpen || isPriceChangeModalOpen;
        if (!isAnyModalOpen && systemSettings?.cashDrawerActive) {
          e.preventDefault();
          triggerCashDrawerOpen(systemSettings);
          showToast('🪙 Tiroir-caisse ouvert (Échap)', 'info');
          return;
        }
      }

      // ⬇️ Flèche Bas (Naviguer dans les lignes du ticket)
      if (e.key === 'ArrowDown') {
        if (currentItems.length > 0) {
          e.preventDefault();
          setSelectedTicketIndex((prev) => Math.min(currentItems.length - 1, prev + 1));
        }
        return;
      }

      // ⬆️ Flèche Haut (Naviguer dans les lignes du ticket)
      if (e.key === 'ArrowUp') {
        if (currentItems.length > 0) {
          e.preventDefault();
          setSelectedTicketIndex((prev) => Math.max(0, prev - 1));
        }
        return;
      }

      // ⏎ Touche Entrée (Ouvrir la fenêtre de saisie de quantité exacte pour la ligne sélectionnée)
      if (e.key === 'Enter') {
        if (currentItems.length > 0) {
          e.preventDefault();
          const targetIdx = currentIndex >= 0 && currentIndex < currentItems.length
            ? currentIndex
            : currentItems.length - 1;
          const targetItem = currentItems[targetIdx];
          if (targetItem) {
            handleOpenQuantityModal(targetItem, targetIdx);
          }
        }
        return;
      }

      if ((e.key === 'r' || e.key === 'R') && (e.altKey || e.ctrlKey)) {
        e.preventDefault();
        handleToggleReturnMode();
        return;
      }

      if (e.key === 'F8') {
        e.preventDefault();
        setIsFreeItemOpen(true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleSuspendTicket();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsDraftsModalOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleClearTicket();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleShowLatestInvoice();
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleToggleFavorites();
      } else if (e.key === 'F7') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('novamag_focus_search'));
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleShowLatestInvoice();
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleShowPreviousInvoice();
      } else if (e.key === 'F1') {
        e.preventDefault();
        handleInitiatePaymentRef.current?.();
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsAddCustomerOpen(true);
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (currentItems.length > 0) {
          const lastIdx = currentItems.length - 1;
          const lastItem = currentItems[lastIdx];
          if (lastItem) {
            handleOpenQuantityModal(lastItem, lastIdx);
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [ticketItems, selectedTicketIndex, suspendedTickets, selectedCustomer, isReturnMode, handleToggleReturnMode, handleToggleAutoPrint, handleToggleFavorites, handleShowLatestInvoice, handleShowPreviousInvoice, handleUpdateQty, handleRemoveItem, handleOpenQuantityModal]);

  // Add Free Item to Ticket (Article Libre hors stock)
  const handleAddFreeItem = ({ name, price, buyPrice }) => {
    const newItem = {
      id: Date.now(),
      productId: `free-${Date.now()}`,
      name: name,
      price: price,
      buyPrice: buyPrice || 0,
      quantity: 1,
      barcode: 'LIBRE',
      isFreeItem: true
    };
    setTicketItems((prev) => {
      setSelectedTicketIndex(prev.length);
      return [...prev, newItem];
    });
    setNotificationMsg(`Article libre ajouté : ${name} (${price.toLocaleString()} DA)`);
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  // Commit exact product insertion into ticket with FIFO / Average lot pricing
  const commitAddProductToTicket = (product, qtyToAdd = 1, scannedBarcode = null) => {
    setTicketItems((prev) => {
      const isAveragePricing = Boolean(systemSettings?.averagePricing);
      const totalAlreadyInCart = prev
        .filter((it) => it.productId === product.id)
        .reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

      const pricing = calculateProductSellingPrice(
        product,
        systemSettings,
        scannedBarcode,
        totalAlreadyInCart
      );

      // 🏷️ Vérification dynamique d'une promotion active sur cet article
      const activePromo = (promotionsList || []).find((promo) => {
        if (promo.status !== 'active') return false;
        const matchId = String(promo.productId) === String(product.id);
        const matchBarcode = promo.barcode && product.barcode && promo.barcode === product.barcode;
        if (!matchId && !matchBarcode) return false;

        const now = new Date();
        if (promo.startDate && now < new Date(promo.startDate)) return false;
        if (promo.endDate && now > new Date(promo.endDate)) return false;
        if (promo.quantityLimit && Number(promo.quantityLimit) > 0) {
          if ((promo.soldCount || 0) >= Number(promo.quantityLimit)) return false;
        }
        return true;
      });

      let finalUnitPrice = pricing.price;
      let promoBadge = '';
      if (activePromo) {
        if (activePromo.discountType === 'percentage') {
          finalUnitPrice = Math.max(0, Math.round(pricing.price * (1 - Number(activePromo.discountValue) / 100)));
          promoBadge = `-${activePromo.discountValue}%`;
        } else {
          finalUnitPrice = Math.max(0, pricing.price - Number(activePromo.discountValue));
          promoBadge = `-${activePromo.discountValue} DA`;
        }
      }

      // Si moyenne pondérée : toutes les unités du produit ont le même prix moyen
      if (isAveragePricing) {
        const existingIdx = prev.findIndex((it) => it.productId === product.id);
        if (existingIdx >= 0) {
          setSelectedTicketIndex(existingIdx);
          return prev.map((it, i) =>
            i === existingIdx
              ? {
                  ...it,
                  quantity: it.quantity + qtyToAdd,
                  price: finalUnitPrice,
                  originalPrice: pricing.price,
                  promoId: activePromo?.id,
                  promoBadge: promoBadge || it.promoBadge,
                  batchNumber: 'PRIX MOYEN'
                }
              : it
          );
        }
        setSelectedTicketIndex(prev.length);
        return [
          ...prev,
          {
            id: Date.now(),
            productId: product.id,
            name: product.name,
            price: finalUnitPrice,
            originalPrice: pricing.price,
            promoId: activePromo?.id,
            promoBadge,
            quantity: qtyToAdd,
            barcode: product.barcode,
            stock: product.stock ?? product.stock_quantity,
            batchId: pricing.batchId,
            batchNumber: 'PRIX MOYEN'
          }
        ];
      }

      // Par défaut : Tarification par lot (FIFO)
      // Chercher une ligne existante ayant EXACTEMENT le même lot et le même prix
      const sameBatchIdx = prev.findIndex(
        (it) => it.productId === product.id && (pricing.batchId ? it.batchId === pricing.batchId : it.price === finalUnitPrice)
      );

      if (sameBatchIdx >= 0) {
        setSelectedTicketIndex(sameBatchIdx);
        return prev.map((it, i) =>
          i === sameBatchIdx ? { ...it, quantity: it.quantity + qtyToAdd } : it
        );
      }

      // Nouveau lot ou lot distinct : créer une nouvelle ligne nette sur le ticket
      setSelectedTicketIndex(prev.length);
      const isNewBatchTransition = totalAlreadyInCart > 0;
      if (isNewBatchTransition) {
        showToast(
          `✓ Transition de lot : ${pricing.batchNumber || 'Nouveau lot'} appliqué (${finalUnitPrice.toLocaleString()} DA)`,
          'info'
        );
      }

      if (activePromo) {
        showToast(`🏷️ Promotion active : ${promoBadge} appliquée sur "${product.name}"`, 'success');
      }

      return [
        ...prev,
        {
          id: Date.now() + Math.floor(Math.random() * 100),
          productId: product.id,
          name: product.name,
          price: finalUnitPrice,
          originalPrice: pricing.price,
          promoId: activePromo?.id,
          promoBadge,
          quantity: qtyToAdd,
          barcode: product.barcode,
          stock: product.stock ?? product.stock_quantity,
          batchId: pricing.batchId,
          batchNumber: pricing.batchNumber
        }
      ];
    });

    setNotificationMsg(`Ajouté : ${product.name}`);
    setTimeout(() => setNotificationMsg(''), 2500);
    window.dispatchEvent(new CustomEvent('novamag_refocus_barcode'));
  };

  // Add Product to Ticket (Support articles au poids / pesée, Lots FIFO & Contrôle Stock Négatif)
  const handleSelectProduct = (product, scannedBarcode = null) => {
    // Si c'est un Pack d'articles (Photo 4)
    if (product.isPack) {
      const packAsProduct = {
        id: product.id,
        name: product.name.includes('(Pack)') ? product.name : `${product.name} (Pack)`,
        barcode: product.barcode,
        price: Number(product.price) || 0,
        purchasePrice: Number(product.buyPrice || product.purchasePrice) || 0,
        stock: product.stock || 1,
        category: 'packs',
        isPack: true,
        packItems: product.items || product.packItems || []
      };
      commitAddProductToTicket(packAsProduct, 1, product.barcode);
      playStockAlertTone('success_beep');
      showToast(`✓ Pack ajouté : ${product.name}`, 'success');
      return;
    }

    // Si l'article est vendu au poids (au kg / g), ouvrir la modale de pesée dynamique
    if (product.isWeighted) {
      setSelectedWeightedProduct(product);
      setIsWeightModalOpen(true);
      return;
    }

    const liveProduct = products.find((p) => p.id === product.id) || product;
    const isFinancialOnly = Boolean(systemSettings?.financialAccountingOnly);
    const allowNegative = Boolean(systemSettings?.allowNegativeStock);
    const confirmNegative = systemSettings?.confirmNegativeStockSale ?? true;

    // Calcul du stock disponible vs quantité demandée
    const totalCartQty = ticketItems
      .filter((it) => it.productId === liveProduct.id)
      .reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    const targetQty = totalCartQty + 1;
    const availableStock = typeof liveProduct.stock === 'number' ? liveProduct.stock : 999;
    const isExceededOrOutOfStock = targetQty > availableStock;

    // ── GESTION RUPTURE DE STOCK / STOCK NÉGATIF ──
    if (isExceededOrOutOfStock && !isFinancialOnly && !isReturnMode) {
      // Cas 1 : Demande de confirmation activée (Demander confirmation pour les ventes sans stock)
      if (confirmNegative) {
        playStockAlertTone('out_of_stock');
        const isDepleted = availableStock <= 0;
        setConfirmDialog({
          isOpen: true,
          title: isDepleted ? 'Article en Rupture de Stock' : 'Dépassement du Stock Disponible',
          message: isDepleted
            ? `Le produit « ${liveProduct.name} » est actuellement épuisé (Stock disponible : ${availableStock}). Voulez-vous autoriser son ajout à la vente en stock négatif ?`
            : `La quantité demandée (${targetQty}) dépasse le stock restant (${availableStock}) pour « ${liveProduct.name} ». Voulez-vous continuer en stock négatif ?`,
          confirmText: 'Oui, autoriser la vente',
          cancelText: 'Annuler',
          type: 'warning',
          onConfirm: () => {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            commitAddProductToTicket(liveProduct, 1, scannedBarcode);
            showToast(`Article ajouté en stock négatif : ${liveProduct.name}`, 'warning');
          }
        });
        return;
      }

      // Cas 2 : Confirmation désactivée ET stock négatif non autorisé -> Blocage strict
      if (!allowNegative) {
        playStockAlertTone('out_of_stock');
        showToast(
          `Vente bloquée : « ${liveProduct.name} » est épuisé (${availableStock} disponible(s)). Le stock négatif est désactivé.`,
          'danger'
        );
        return;
      }
    }

    // Cas 3 : Stock suffisant ou autorisé sans confirmation
    commitAddProductToTicket(liveProduct, 1, scannedBarcode);
  };

  // Confirm Weight / Amount for Weighted Product (avec Contrôle Stock Négatif)
  const handleConfirmWeightItem = ({ product, weight, totalPrice, displayUnit, displayWeight }) => {
    const liveProduct = products.find((p) => p.id === product.id) || product;
    const isFinancialOnly = Boolean(systemSettings?.financialAccountingOnly);
    const allowNegative = Boolean(systemSettings?.allowNegativeStock);
    const confirmNegative = systemSettings?.confirmNegativeStockSale ?? true;

    const existingItem = ticketItems.find((it) => it.productId === liveProduct.id);
    const currentCartQty = existingItem ? Number(existingItem.quantity || 0) : 0;
    const targetQty = Math.round((currentCartQty + weight) * 1000) / 1000;
    const availableStock = typeof liveProduct.stock === 'number' ? liveProduct.stock : 999;
    const isExceededOrOutOfStock = targetQty > availableStock;

    const commitWeight = () => {
      setTicketItems((prev) => {
        const existingIdx = prev.findIndex((it) => it.productId === product.id);
        if (existingIdx >= 0) {
          const newQty = Math.round((prev[existingIdx].quantity + weight) * 1000) / 1000;
          setSelectedTicketIndex(existingIdx);
          return prev.map((it, i) =>
            i === existingIdx ? { ...it, quantity: newQty } : it
          );
        }
        setSelectedTicketIndex(prev.length);
        return [
          ...prev,
          {
            id: Date.now(),
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: weight,
            unit: product.unitType || 'kg',
            isWeighted: true,
            barcode: product.barcode,
            stock: product.stock ?? product.stock_quantity ?? liveProduct.stock
          }
        ];
      });

      const weightDisplayLabel = weight < 1 
        ? `${Math.round(weight * 1000)} g` 
        : `${parseFloat(weight.toFixed(3))} kg`;

      setNotificationMsg(`Pesée validée : ${product.name} (${weightDisplayLabel} • ${totalPrice.toFixed(2)} DA)`);
      setTimeout(() => setNotificationMsg(''), 3000);
    };

    if (isExceededOrOutOfStock && !isFinancialOnly && !isReturnMode) {
      if (confirmNegative) {
        playStockAlertTone('out_of_stock');
        setConfirmDialog({
          isOpen: true,
          title: 'Article au Poids : Rupture de Stock',
          message: `Le poids demandé (${weight} kg) dépasse le stock disponible (${availableStock} kg) pour « ${liveProduct.name} ». Autoriser la vente en stock négatif ?`,
          confirmText: 'Oui, autoriser',
          cancelText: 'Annuler',
          type: 'warning',
          onConfirm: () => {
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            commitWeight();
          }
        });
        return;
      }
      if (!allowNegative) {
        playStockAlertTone('out_of_stock');
        showToast(`Pesée refusée : stock insuffisant pour « ${liveProduct.name} » (${availableStock} kg disponibles).`, 'danger');
        return;
      }
    }

    commitWeight();
  };

  // Barcode Scan submission (Supporte factures, codes-barres généraux et codes-barres de lots)
  const handleBarcodeSubmit = async (code) => {
    if (!code || !code.trim()) return;
    const cleanCode = code.trim();

    // 1. Vérifier en priorité si le code scanné correspond à une FACTURE / TICKET DE CAISSE
    const invoiceIndex = salesHistory.findIndex((inv) => {
      if (!inv) return false;
      const invNum = (inv.invoiceNumber || '').trim().toLowerCase();
      const invCode = (inv.barcode || '').trim().toLowerCase();
      const scan = cleanCode.toLowerCase();
      const scanDigits = cleanCode.replace(/[^0-9]/g, '');
      const invDigits = (inv.invoiceNumber || '').replace(/[^0-9]/g, '');

      return (
        invNum === scan ||
        invCode === scan ||
        String(inv.id) === scan ||
        (scanDigits.length >= 4 && invDigits.length >= 4 && (invDigits === scanDigits || invDigits.endsWith(scanDigits) || scanDigits.endsWith(invDigits)))
      );
    });

    if (invoiceIndex !== -1) {
      const foundInvoice = salesHistory[invoiceIndex];
      setCurrentInvoiceIndex(invoiceIndex);
      setIsInvoiceModalOpen(true);
      setBarcodeInput('');
      showToast(`✓ Facture retrouvée : ${foundInvoice.invoiceNumber || '#' + foundInvoice.id} (${(foundInvoice.total || 0).toLocaleString('fr-FR')} DA)`, 'success');
      playStockAlertTone('success_beep');
      return;
    }

    // 2. Vérification si le code scanné correspond à une CARTE / CODE-BARRES CLIENT (ex: CLI-0001)
    const foundCustomer = (customers || []).find((c) => {
      if (!c) return false;
      const cBar = (c.barcode || '').trim().toLowerCase();
      const cId = `cli-${c.id}`.toLowerCase();
      const cIdPad = `cli-${String(c.id).padStart(5, '0')}`.toLowerCase();
      const scan = cleanCode.toLowerCase();
      return (cBar && cBar === scan) || cId === scan || cIdPad === scan;
    });

    if (foundCustomer) {
      setSelectedCustomer(foundCustomer);
      showToast(`✓ Carte Client reconnue : ${foundCustomer.name}`, 'success');
      playStockAlertTone('success_beep');
      setBarcodeInput('');
      return;
    }

    // 3. Détection dynamique d'étiquette de balance électronique (PLU + Poids/Prix)
    if (systemSettings?.electronicScaleActive) {
      const scaleResult = parseScaleBarcode(cleanCode, systemSettings);
      if (scaleResult.isScale) {
        const found = products.find((p) => {
          const pPlu = String(p.plu || '').trim();
          const pCode = String(p.barcode || '').trim();
          const cleanPlu = scaleResult.cleanPlu;
          const rawPlu = scaleResult.plu;
          return (
            (pPlu && (pPlu === cleanPlu || pPlu === rawPlu)) ||
            (pCode && (pCode === cleanPlu || pCode === rawPlu || pCode.endsWith(rawPlu))) ||
            String(p.id) === cleanPlu
          );
        });

        if (found) {
          if (scaleResult.valueType === 'weight') {
            const weightVal = scaleResult.weight || scaleResult.value || 1.0;
            const unitPrice = calculateProductSellingPrice(found, systemSettings);
            handleConfirmWeightItem({
              product: found,
              weight: weightVal,
              totalPrice: Math.round(weightVal * unitPrice * 100) / 100,
              displayUnit: 'Kg',
              displayWeight: weightVal
            });
            showToast(`✓ Pesée balance détectée : ${found.name} (${weightVal} kg)`, 'success');
            playStockAlertTone('success_beep');
            setBarcodeInput('');
            return;
          } else {
            // Type prix : montant total fixé par la balance
            const priceVal = scaleResult.price || scaleResult.value || 0;
            const unitPrice = calculateProductSellingPrice(found, systemSettings) || priceVal;
            const calculatedQty = unitPrice > 0 ? Number((priceVal / unitPrice).toFixed(3)) : 1;
            handleConfirmWeightItem({
              product: found,
              weight: calculatedQty,
              totalPrice: priceVal,
              displayUnit: 'Pcs',
              displayWeight: calculatedQty
            });
            showToast(`✓ Ticket balance détecté : ${found.name} (${priceVal.toLocaleString('fr-FR')} DA)`, 'success');
            playStockAlertTone('success_beep');
            setBarcodeInput('');
            return;
          }
        }
      }
    }

    // 3. Vérifier si le code correspond à un produit du catalogue ou un lot
    const match = products.find(
      (p) => p.barcode === cleanCode || p.batches?.some((b) => b.barcode && b.barcode === cleanCode)
    );
    if (match) {
      handleSelectProduct(match, cleanCode);
      setBarcodeInput('');
      playStockAlertTone('success_beep');
      return;
    }

    // 3b. Vérifier si le code correspond à un Pack / Fardeau
    const matchPack = (packsList || []).find(
      (pk) => pk.status !== 'hidden' && (pk.barcode === cleanCode || pk.name.toLowerCase() === cleanCode.toLowerCase())
    );
    if (matchPack) {
      const packAsProduct = {
        id: matchPack.id,
        name: `${matchPack.name} (Pack)`,
        barcode: matchPack.barcode,
        price: Number(matchPack.price) || 0,
        purchasePrice: Number(matchPack.buyPrice) || 0,
        stock: 999,
        category: 'packs',
        isPack: true,
        packItems: matchPack.items
      };
      commitAddProductToTicket(packAsProduct, 1, cleanCode);
      setBarcodeInput('');
      playStockAlertTone('success_beep');
      showToast(`Pack ajouté : ${matchPack.name}`, 'success');
      return;
    }

    // 3c. Vérifier en direct sur le serveur backend si le produit existe dans la base SQLite novamag.db
    try {
      const serverLookup = await getProductByBarcode(cleanCode);
      if (serverLookup && serverLookup.success && serverLookup.data) {
        const dbFound = {
          ...serverLookup.data,
          stock: Number(serverLookup.data.stock_quantity ?? serverLookup.data.stock ?? 0)
        };
        setProducts((prev) => [dbFound, ...prev.filter((p) => String(p.id) !== String(dbFound.id))]);
        handleSelectProduct(dbFound, cleanCode);
        setBarcodeInput('');
        playStockAlertTone('success_beep');
        showToast(`✓ Produit trouvé : ${dbFound.name}`, 'success');
        return;
      }
    } catch (e) {}

    // 4. Code-barres inconnu : demander confirmation pour ajouter le produit avec le code pré-rempli
    playStockAlertTone('error_beep');
    setBarcodeInput('');
    setConfirmDialog({
      isOpen: true,
      title: 'Ce produit n\'existe pas dans le catalogue',
      message: `Le code-barres "${cleanCode}" est introuvable. Voulez-vous créer et ajouter cet article à votre catalogue maintenant ?`,
      confirmText: 'Oui, créer le produit',
      cancelText: 'Annuler',
      type: 'info',
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setNewProductInitialBarcode(cleanCode);
        setIsAddProductOpen(true);
      }
    });
  };

  // Écoute des événements du TopBar et Footer émis depuis le layout parent
  useEffect(() => {
    const handleBarSubmit = (e) => {
      if (e.detail) handleBarcodeSubmit(e.detail);
    };
    const handleSelectProd = (e) => {
      if (e.detail) handleSelectProduct(e.detail);
    };
    const handleFooterAction = (e) => {
      const action = e.detail;
      if (action === 'cancel') handleClearTicket();
      else if (action === 'suspend') handleSuspendTicket();
      else if (action === 'history') onNavigate ? onNavigate('sales_history') : setIsInvoiceModalOpen(true);
      else if (action === 'drafts') setIsDraftsModalOpen(true);
      else if (action === 'ticket') handleShowLatestInvoice();
    };

    window.addEventListener('novamag_barcode_submit', handleBarSubmit);
    window.addEventListener('novamag_select_product', handleSelectProd);
    window.addEventListener('novamag_footer_action', handleFooterAction);

    return () => {
      window.removeEventListener('novamag_barcode_submit', handleBarSubmit);
      window.removeEventListener('novamag_select_product', handleSelectProd);
      window.removeEventListener('novamag_footer_action', handleFooterAction);
    };
  }, [handleBarcodeSubmit, handleSelectProduct, onNavigate]);

  // Clear Ticket (F4) - Custom Modern Confirmation Dialog (No window.confirm!)
  const handleClearTicket = () => {
    if (ticketItems.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Annuler le ticket en cours ?',
      message: 'Tous les articles saisis seront retirés du ticket. Cette opération est irréversible.',
      confirmText: 'Oui, vider le ticket',
      cancelText: 'Conserver',
      type: 'danger',
      onConfirm: () => {
        setTicketItems([]);
        setSelectedCustomer(null);
        setSelectedTicketIndex(0);
        setEditingSale(null);
        try {
          localStorage.removeItem('novamag_ticket_items');
          localStorage.removeItem('novamag_editing_invoice');
        } catch {}
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(language === 'ar' ? 'تم إلغاء التذكرة بنجاح' : 'Ticket annulé avec succès', 'info');
      }
    });
  };

  // Vider le ticket silencieusement sans modal de confirmation (pour pro-forma et validations automatiques)
  const handleResetTicketSilently = useCallback(() => {
    setTicketItems([]);
    setSelectedCustomer(null);
    setSelectedTicketIndex(0);
    setEditingSale(null);
    setEditingProforma(null);
    try {
      localStorage.removeItem('novamag_ticket_items');
      localStorage.removeItem('novamag_editing_invoice');
      localStorage.removeItem('novamag_editing_proforma');
    } catch {}
  }, []);

  // ══ Application d'une remise réelle sur le ticket (Global ou Sélectionné) ══
  const handleApplyDiscount = useCallback(({ type, value, target }) => {
    setTicketItems((prev) => {
      if (!prev || prev.length === 0) return prev;
      const rawSubtotal = prev.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0);
      if (rawSubtotal <= 0) return prev;

      if (target === 'selected' && selectedTicketIndexRef.current >= 0 && selectedTicketIndexRef.current < prev.length) {
        return prev.map((item, idx) => {
          if (idx !== selectedTicketIndexRef.current) return item;
          const orig = item.price * (item.quantity || 1);
          const discountAmt = type === 'percentage'
            ? Math.round(orig * (Math.min(100, Math.max(0, value)) / 100))
            : Math.min(orig, Math.max(0, value));
          const newTot = Math.max(0, orig - discountAmt);
          return {
            ...item,
            customTotal: newTot,
            discount: discountAmt,
            discountType: type,
            discountValue: value
          };
        });
      } else {
        const totalDiscountAmt = type === 'percentage'
          ? Math.round(rawSubtotal * (Math.min(100, Math.max(0, value)) / 100))
          : Math.min(rawSubtotal, Math.max(0, value));

        return prev.map((item) => {
          const orig = item.price * (item.quantity || 1);
          const ratio = rawSubtotal > 0 ? (orig / rawSubtotal) : (1 / prev.length);
          const itemDiscount = Math.round(totalDiscountAmt * ratio);
          const newTot = Math.max(0, orig - itemDiscount);
          return {
            ...item,
            customTotal: newTot,
            discount: itemDiscount,
            discountType: type,
            discountValue: value
          };
        });
      }
    });

    showToast(
      language === 'ar'
        ? `✓ تم تطبيق الخصم: ${value}${type === 'percentage' ? '%' : ' د.ج'}`
        : `✓ Remise de ${value}${type === 'percentage' ? '%' : ' DA'} appliquée avec succès !`,
      'success'
    );
  }, [language, showToast]);

  const handleRemoveDiscount = useCallback(() => {
    setTicketItems((prev) =>
      prev.map((item) => {
        const { customTotal, discount, discountType, discountValue, ...rest } = item;
        return rest;
      })
    );
    showToast(language === 'ar' ? '✓ تم إلغاء الخصم' : '✓ Remise retirée du ticket', 'info');
  }, [language, showToast]);

  // ══ Suspend Current Ticket (Mettre en attente - F2) ══
  const handleSuspendTicket = () => {
    if (ticketItems.length === 0) {
      showToast(language === 'ar' ? 'السلة فارغة، لا يوجد منتجات لتعليقها.' : "Le panier est vide, aucun article à mettre en attente.", "warning");
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const draftNumber = suspendedTickets.length + 1;

    const newDraft = {
      id: `draft-${Date.now()}`,
      number: draftNumber,
      title: selectedCustomer ? `Client: ${selectedCustomer.name}` : `Brouillon #${draftNumber} - ${timeStr}`,
      items: [...ticketItems],
      customer: selectedCustomer,
      isReturnMode: isReturnMode,
      createdAt: now.toISOString(),
      timeStr: timeStr
    };

    setSuspendedTickets((prev) => [newDraft, ...prev]);
    // Vider le panier pour servir le client suivant immédiatement !
    setTicketItems([]);
    setSelectedCustomer(null);
    setSelectedTicketIndex(0);
    setIsReturnMode(false);

    showToast(`✓ Panier mis en attente et enregistré comme brouillon #${draftNumber} !`, "success");
  };

  // ══ Restore Suspended Ticket (Rappeler un brouillon - F3) ══
  const handleRestoreTicket = (draft) => {
    const doRestore = () => {
      setTicketItems(draft.items || []);
      setSelectedTicketIndex(0);
      if (draft.customer) {
        setSelectedCustomer(draft.customer);
      } else {
        setSelectedCustomer(null);
      }
      if (draft.isReturnMode !== undefined) {
        setIsReturnMode(draft.isReturnMode);
      }

      setSuspendedTickets((prev) => prev.filter((d) => d.id !== draft.id));
      setIsDraftsModalOpen(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      playSaleValidationSound();
      showToast(`✓ Brouillon rappelé avec succès (${draft.items.length} article(s) rechargés) !`, "success");
    };

    if (ticketItems.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Remplacer le panier actuel ?',
        message: 'Le ticket en cours contient déjà des articles. Souhaitez-vous le remplacer par ce panier en attente ?',
        confirmText: 'Remplacer',
        cancelText: 'Conserver l\'actuel',
        type: 'warning',
        onConfirm: doRestore
      });
    } else {
      doRestore();
    }
  };

  // Supprimer un brouillon spécifique
  const handleDeleteDraft = (draftId) => {
    setSuspendedTickets((prev) => prev.filter((d) => d.id !== draftId));
    showToast("Brouillon supprimé.", "info");
  };

  // Vider tous les brouillons
  const handleClearAllDrafts = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Vider tous les brouillons ?',
      message: 'Tous les paniers suspendus seront définitivement supprimés.',
      confirmText: 'Vider tout',
      cancelText: 'Conserver',
      type: 'danger',
      onConfirm: () => {
        setSuspendedTickets([]);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('Tous les brouillons ont été effacés', 'info');
      }
    });
  };

  // Confirm Payment or Refund
  const handleConfirmPayment = useCallback((paymentData) => {
    setIsPaymentOpen(false);

    const isFinancialOnly = Boolean(systemSettings?.financialAccountingOnly);

    if (isReturnMode) {
      // 🔄 MODE RETOUR DYNAMIQUE : Réintégration des articles retournés dans le stock (sauf si mode comptabilité financière uniquement)
      if (!isFinancialOnly) {
        setProducts((prev) => {
          const updated = prev.map((p) => {
            const returnedItem = ticketItems.find((it) => it.productId === p.id);
            if (returnedItem) {
              return { ...p, stock: p.stock + Number(returnedItem.quantity || 1) };
            }
            return p;
          });
          try {
            localStorage.setItem('novamag_products', JSON.stringify(updated));
            window.dispatchEvent(new Event('novamag_products_updated'));
          } catch {}
          return updated;
        });
      }

      const totalRefund = ticketItems.reduce((acc, it) => acc + (typeof it.customTotal === 'number' ? it.customTotal : it.price * it.quantity), 0);
      
      // Enregistrer le bon de retour / remboursement dans l'historique des ventes
      const returnNumber = `RET-${new Date().getFullYear()}-${String(salesHistory.length + 1).padStart(4, '0')}`;
      const returnInvoice = {
        id: Date.now(),
        invoiceNumber: returnNumber,
        timestamp: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }),
        customerId: selectedCustomer?.id || null,
        customer: selectedCustomer?.name || 'Client Comptoir (Passager)',
        customerPhone: selectedCustomer?.phone || '',
        cashier: 'Admin (Caisse 1)',
        paymentMethod: paymentData?.method || 'cash',
        amountPaid: -totalRefund,
        change: 0,
        debtGenerated: 0,
        printReceipt: Boolean(paymentData?.printReceipt),
        total: -totalRefund, // Montant négatif qui équilibre la caisse et le CA
        subtotal: -totalRefund,
        discount: 0,
        type: 'return',
        status: 'refunded',
        items: [...ticketItems]
      };

      setSalesHistory((prev) => [returnInvoice, ...prev]);

      try {
        localStorage.removeItem('novamag_ticket_items');
        window.dispatchEvent(new Event('novamag_sales_updated'));
        window.dispatchEvent(new Event('novamag_cash_updated'));
      } catch {}

      setNotificationMsg(
        `✓ Remboursement validé : ${totalRefund.toLocaleString()} DA restitués au client (${ticketItems.length} article(s))`
      );
      setTimeout(() => setNotificationMsg(''), 4000);

      // Réinitialiser le mode retour vers le mode vente normale
      setIsReturnMode(false);
      setTicketItems([]);
      setSelectedTicketIndex(0);
    } else {
      // 🛒 VENTE NORMALE
      // Si Mode Comptabilité Financière Uniquement est ACTIVÉ : Pas de déduction du stock physique !
      // Seuls l'aspect financier, les dettes et l'historique sont enregistrés.
      if (!isFinancialOnly) {
        setProducts((prev) =>
          prev.map((p) => {
            const soldItems = ticketItems.filter((it) => it.productId === p.id);
            if (soldItems.length > 0) {
              const totalSoldQty = soldItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0);
              const allowNegative = Boolean(systemSettings?.allowNegativeStock);
              const confirmNegative = systemSettings?.confirmNegativeStockSale ?? true;

              let updatedBatches = Array.isArray(p.batches) && p.batches.length > 0
                ? p.batches.map((b) => ({ ...b }))
                : null;

              if (updatedBatches) {
                for (const item of soldItems) {
                  updatedBatches = deductQuantityFromBatches(updatedBatches, item.quantity, item.batchId);
                }
              }

              const newStock = updatedBatches
                ? updatedBatches.reduce((acc, b) => acc + Number(b.quantity || 0), 0)
                : (allowNegative || confirmNegative ? p.stock - totalSoldQty : Math.max(0, p.stock - totalSoldQty));

              // Prochain prix de vente en FIFO
              let nextPrice = p.price;
              if (updatedBatches) {
                const remainingBatches = updatedBatches.filter((b) => Number(b.quantity) > 0);
                if (remainingBatches.length > 0 && remainingBatches[0].sellPrice) {
                  nextPrice = Number(remainingBatches[0].sellPrice);
                }
              }

              return {
                ...p,
                stock: newStock,
                price: nextPrice,
                batches: updatedBatches || p.batches
              };
            }
            return p;
          })
        );
      }

      // Enregistrer la facture dans l'historique des ventes
      const totalAmount = typeof paymentData.finalTotal === 'number'
        ? paymentData.finalTotal
        : ticketItems.reduce((acc, it) => acc + (typeof it.customTotal === 'number' ? it.customTotal : it.price * it.quantity), 0);
      
      const debtAmount = Number(paymentData.debtAmount || 0);

      // Si de la dette est générée, mettre à jour le solde et la dette du client en temps réel
      if (debtAmount > 0 && selectedCustomer?.id && selectedCustomer.id !== 1) {
        setCustomers((prev) =>
          prev.map((c) => {
            if (c.id === selectedCustomer.id) {
              const currentDebt = Math.abs(c.balance < 0 ? c.balance : (c.debt || c.initialDebt || 0));
              const updatedDebt = currentDebt + debtAmount;
              const updatedCust = {
                ...c,
                balance: -updatedDebt,
                debt: updatedDebt
              };
              setSelectedCustomer(updatedCust);
              return updatedCust;
            }
            return c;
          })
        );
      }

      const newInvoice = {
        id: Date.now(),
        invoiceNumber: `FAC-${new Date().getFullYear()}-${String(salesHistory.length + 1).padStart(4, '0')}`,
        timestamp: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }),
        customerId: selectedCustomer?.id || null,
        customer: selectedCustomer?.name || 'Client Comptoir (Passager)',
        customerPhone: selectedCustomer?.phone || '',
        cashier: 'Admin (Caisse 1)',
        paymentMethod: paymentData.method,
        amountPaid: paymentData.amountPaid || 0,
        change: paymentData.change || 0,
        debtGenerated: debtAmount,
        printReceipt: paymentData.printReceipt,
        total: totalAmount,
        subtotal: totalAmount,
        discount: 0,
        items: [...ticketItems]
      };

      if (editingSale) {
        const updatedInvoice = {
          ...editingSale,
          total: totalAmount,
          subtotal: totalAmount,
          paymentMethod: paymentData.method,
          amountPaid: paymentData.amountPaid || 0,
          change: paymentData.change || 0,
          debtGenerated: debtAmount,
          printReceipt: paymentData.printReceipt,
          items: [...ticketItems],
          customer: selectedCustomer?.name || editingSale.customer,
          customerId: selectedCustomer?.id || editingSale.customerId,
          customerPhone: selectedCustomer?.phone || editingSale.customerPhone || ''
        };

        setSalesHistory((prev) => prev.map((s) => (s.id === editingSale.id ? updatedInvoice : s)));
        setEditingSale(null);
        try {
          localStorage.removeItem('novamag_editing_invoice');
          localStorage.removeItem('novamag_ticket_items');
          window.dispatchEvent(new Event('novamag_sales_updated'));
          window.dispatchEvent(new Event('novamag_cash_updated'));
        } catch {}

        if (paymentData.printReceipt) {
          const isDirectSilent = Boolean(systemSettings?.directSilentPrint);
          if (isDirectSilent) {
            printThermalTicketDirect(updatedInvoice, systemSettings);
          } else {
            setCurrentInvoiceIndex(0);
            setIsInvoiceModalOpen(true);
          }
        }
        playSaleValidationSound();
        showToast(`✓ Facture ${editingSale.invoiceNumber || editingSale.id} modifiée avec succès`, 'success');
      } else {
        setSalesHistory((prev) => [newInvoice, ...prev]);
        try {
          localStorage.removeItem('novamag_ticket_items');
          window.dispatchEvent(new Event('novamag_sales_updated'));
          window.dispatchEvent(new Event('novamag_cash_updated'));
        } catch {}

        // 🏷️ Mise à jour dynamique des promotions (incrémentation du nombre d'unités vendues)
        try {
          const promoItems = (ticketItems || []).filter((it) => it.promoId);
          if (promoItems.length > 0) {
            const savedPromos = localStorage.getItem('novamag_promotions');
            if (savedPromos) {
              const promos = JSON.parse(savedPromos);
              let hasPromoChanges = false;
              const updatedPromos = promos.map((pr) => {
                const soldForThisPromo = promoItems
                  .filter((it) => it.promoId === pr.id)
                  .reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

                if (soldForThisPromo > 0) {
                  hasPromoChanges = true;
                  const newSoldCount = (Number(pr.soldCount) || 0) + soldForThisPromo;
                  const isCompleted = pr.quantityLimit && newSoldCount >= Number(pr.quantityLimit);
                  return {
                    ...pr,
                    soldCount: newSoldCount,
                    status: isCompleted ? 'completed' : pr.status
                  };
                }
                return pr;
              });

              if (hasPromoChanges) {
                localStorage.setItem('novamag_promotions', JSON.stringify(updatedPromos));
                window.dispatchEvent(new Event('novamag_promotions_updated'));
              }
            }
          }
        } catch (e) {
          console.error('Erreur mise à jour dynamique promotions :', e);
        }

        // 🖨️ Impression directe ou ouverture de l'aperçu selon les paramètres
        if (paymentData.printReceipt) {
          const isDirectSilent = Boolean(systemSettings?.directSilentPrint);
          if (isDirectSilent) {
            // ⚡ Impression Silencieuse Directe : pas d'aperçu avant impression, impression immédiate !
            printThermalTicketDirect(newInvoice, systemSettings);
          } else {
            // Mode avec aperçu avant impression
            setCurrentInvoiceIndex(0);
            setIsInvoiceModalOpen(true);
          }
        }
      }

      // 🪙 Ouverture automatique du tiroir-caisse lors de la vente si activé
      if (systemSettings?.cashDrawerActive && (systemSettings?.autoOpenCashDrawerOnSale ?? true)) {
        triggerCashDrawerOpen(systemSettings);
      }

      const printStatusText = paymentData.printReceipt
        ? (systemSettings?.directSilentPrint ? ' • Ticket imprimé direct' : ' • Aperçu ticket ouvert')
        : ' • Sans ticket';
      const debtStatusText = debtAmount > 0 ? ` (+${debtAmount.toLocaleString()} DA dette enregistrée)` : '';
      const modeText = isFinancialOnly ? ' • Mode financier (stock non déduit)' : '';
      playSaleValidationSound();
      showToast(
        `✓ Vente validée : ${(paymentData.amountPaid || 0).toLocaleString()} DA reçus (${ticketItems.length} article(s)${debtStatusText}${printStatusText}${modeText})`,
        'success'
      );
      setTicketItems([]);
      setSelectedTicketIndex(0);
    }
  }, [isReturnMode, systemSettings, ticketItems, selectedCustomer, salesHistory.length, showToast]);

  // ══ Validation de la vente (Mode Vente Rapide vs Dialogue de Règlement & Contrôle Stock Négatif) ══
  const handleInitiatePayment = useCallback(() => {
    if (ticketItems.length === 0) {
      showToast(language === 'ar' ? 'السلة فارغة، أضف منتجات قبل التأكيد.' : "Le panier est vide, ajoutez des articles avant de valider.", "warning");
      return;
    }

    const isFinancialOnly = Boolean(systemSettings?.financialAccountingOnly);
    const allowNegative = Boolean(systemSettings?.allowNegativeStock);
    const confirmNegative = systemSettings?.confirmNegativeStockSale ?? true;
    const isFastSale = systemSettings?.fastSale ?? true;
    const isCounter = isCounterCustomer(selectedCustomer);

    const proceedWithCheckout = () => {
      // ⚡ Vente Rapide : Si activée ET Client Comptoir (non enregistré / passager) ET hors mode retour
      // Validation directe et immédiate sans boîte de confirmation
      if (isFastSale && isCounter && !isReturnMode) {
        const grandTotal = ticketItems.reduce(
          (acc, it) => acc + (typeof it.customTotal === 'number' ? it.customTotal : it.price * it.quantity),
          0
        );

        handleConfirmPayment({
          method: 'cash',
          amountPaid: grandTotal,
          change: 0,
          debtAmount: 0,
          finalTotal: grandTotal,
          printReceipt: isAutoPrintEnabled
        });
        return;
      }

      // Si client connu sélectionné (avec compte, crédit ou dette) OU si Vente Rapide désactivée :
      // Ouvrir la boîte de dialogue de paiement pour vérification
      setIsPaymentOpen(true);
    };

    // ── VÉRIFICATION STOCK NÉGATIF AVANT FINALISATION ──
    if (!isFinancialOnly && !isReturnMode) {
      const negativeItems = ticketItems.filter((it) => {
        if (it.isFreeItem) return false;
        const prod = products.find((p) => p.id === it.productId);
        if (!prod) return false;
        const avail = typeof prod.stock === 'number' ? prod.stock : 999;
        return it.quantity > avail;
      });

      if (negativeItems.length > 0) {
        if (!allowNegative && !confirmNegative) {
          playStockAlertTone('out_of_stock');
          showToast(
            `Vente refusée : ${negativeItems.length} article(s) sans stock alors que le stock négatif est désactivé.`,
            'danger'
          );
          return;
        }

        if (confirmNegative) {
          playStockAlertTone('out_of_stock');
          const names = negativeItems.map((it) => `« ${it.name} »`).join(', ');
          setConfirmDialog({
            isOpen: true,
            title: 'Confirmation de Vente sans Stock',
            message: `Ce ticket contient des articles sans stock suffisant (${names}). Confirmez-vous la finalisation de la vente en stock négatif ?`,
            confirmText: 'Oui, finaliser la vente',
            cancelText: 'Vérifier le ticket',
            type: 'warning',
            onConfirm: () => {
              setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
              proceedWithCheckout();
            }
          });
          return;
        }
      }
    }

    proceedWithCheckout();
  }, [ticketItems, products, systemSettings, selectedCustomer, isReturnMode, isAutoPrintEnabled, isCounterCustomer, handleConfirmPayment, showToast, playStockAlertTone]);

  // Maintenir la référence à jour pour les raccourcis clavier
  handleInitiatePaymentRef.current = handleInitiatePayment;

  // Confirm Opening Cash Float / Session
  const handleConfirmOpenSession = (openingAmount) => {
    const sessionData = {
      isOpen: true,
      sessionNumber: (cashSession?.sessionNumber ? cashSession.sessionNumber + 1 : 1),
      openingBalance: openingAmount,
      openedAt: new Date().toISOString(),
      openedBy: 'Admin'
    };
    setCashSession(sessionData);
    setCashMovements([]);
    localStorage.setItem('novamag_cash_session', JSON.stringify(sessionData));
    localStorage.removeItem('novamag_cash_movements');
    try {
      window.dispatchEvent(new Event('novamag_cash_updated'));
    } catch {}
    showToast(`✓ Caisse ouverte • Fond de caisse initial : ${openingAmount.toLocaleString()} DA`, 'success');
  };

  // Ventes en espèces réalisées durant la session active
  const cashSalesTotal = salesHistory
    .filter((inv) => {
      if (!cashSession?.openedAt) return true;
      const isCash = inv.paymentMethod === 'cash' || !inv.paymentMethod;
      const isAfterOpen = new Date(inv.timestamp) >= new Date(cashSession.openedAt);
      return isCash && isAfterOpen;
    })
    .reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);

  // Pack d'articles formatés pour affichage dans le catalogue (Photo 4)
  const formattedPacks = useMemo(() => {
    return (packsList || [])
      .filter((pk) => pk.status !== 'hidden')
      .map((pk) => ({
        id: pk.id,
        name: pk.name,
        barcode: pk.barcode || `PACK-${pk.id}`,
        price: Number(pk.price) || 0,
        buyPrice: Number(pk.buyPrice) || 0,
        stock: typeof pk.stock === 'number' ? pk.stock : 1,
        category: 'packs',
        isPack: true,
        items: pk.items || [],
        packSummary: (pk.items || []).map((it) => `${it.productName || it.name} x${it.quantity || 1}`).join(', ')
      }));
  }, [packsList]);

  // Calcul dynamique et temps réel du nombre exact d'articles par rayon (placé après formattedPacks)
  const categoriesWithCounts = useMemo(() => {
    const allProducts = [...products, ...(formattedPacks || [])];
    return categories.map((cat) => {
      if (cat.id === 'all') {
        return { ...cat, count: allProducts.length };
      }
      const count = allProducts.filter((p) => matchesCategory(p.category, cat.id, p.isPack)).length;
      return { ...cat, count };
    });
  }, [categories, products, formattedPacks]);

  // Filter & Sort products by search query, category, and modal filters
  const displayedProducts = useMemo(() => {
    // Clés d'articles en promotion active (calculé une seule fois pour le filtre et le tri)
    const activePromoProductKeys = new Set();
    const now = new Date();
    (promotionsList || []).forEach((promo) => {
      if (promo.status !== 'active') return;
      if (promo.startDate && now < new Date(promo.startDate)) return;
      if (promo.endDate && now > new Date(promo.endDate)) return;
      if (promo.quantityLimit && Number(promo.quantityLimit) > 0) {
        if ((promo.soldCount || 0) >= Number(promo.quantityLimit)) return;
      }
      if (promo.productId) activePromoProductKeys.add('id:' + promo.productId);
      if (promo.barcode) activePromoProductKeys.add('barcode:' + promo.barcode);
    });

    const combined = [...products, ...formattedPacks];
    return combined
      .filter((p) => {
        // Recherche textuelle et code-barres
        const matchSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.barcode && p.barcode.includes(searchQuery)) ||
          (p.packSummary && p.packSummary.toLowerCase().includes(searchQuery.toLowerCase()));

        // Rayon / Catégorie sélectionnée (support robuste des identifiants et libellés)
        const matchCategory =
          selectedCategory === 'all' ||
          (selectedCategory === 'packs'
            ? Boolean(p.isPack || p.category === 'packs')
            : matchesCategory(p.category, selectedCategory, p.isPack));

        // Vérification si l'article est en promotion
        const itemHasPromo = activePromoProductKeys.has('id:' + p.id) || (p.barcode && activePromoProductKeys.has('barcode:' + p.barcode));

        // Filtre Produits en vedette (★ Favoris)
        const matchFavorites = !favoritesOnly || Boolean(p.isFavorite);

        // Filtre Promotions uniquement
        const matchPromo = (!promoOnly && stockStatus !== 'promo-only') || itemHasPromo;

        // Filtre Packs uniquement
        const matchPacks = (!packsOnly && stockStatus !== 'packs-only') || Boolean(p.isPack);

        // Filtre Fournisseur robuste
        const matchSupplier =
          selectedSupplier === 'all' ||
          (p.supplier && (
            p.supplier === selectedSupplier ||
            p.supplier.toLowerCase().trim() === selectedSupplier.toLowerCase().trim()
          ));

        // Filtre État du stock
        let matchStock = true;
        if (stockStatus === 'in-stock') {
          matchStock = p.stock > 0;
        } else if (stockStatus === 'low-stock') {
          matchStock = p.stock > 0 && p.stock <= (p.alertStock || 5);
        } else if (stockStatus === 'out-of-stock') {
          matchStock = p.stock === 0;
        } else if (stockStatus === 'promo-only') {
          matchStock = itemHasPromo;
        } else if (stockStatus === 'packs-only') {
          matchStock = Boolean(p.isPack);
        }

        return matchSearch && matchCategory && matchFavorites && matchPromo && matchPacks && matchSupplier && matchStock;
      })
      .sort((a, b) => {
        // 1. Si l'utilisateur choisit un tri explicite (Prix, Nom, Stock), l'appliquer en priorité absolue
        const priceA = Number(a.price ?? a.sale_price ?? 0);
        const priceB = Number(b.price ?? b.sale_price ?? 0);

        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' });
        if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '', 'fr', { sensitivity: 'base' });
        if (sortBy === 'stock-asc') return (Number(a.stock) || 0) - (Number(b.stock) || 0);

        // 2. Tri Par défaut : Packs (1) et Promotions actives (2) en tête sur la 1ère page
        const aHasPromo = activePromoProductKeys.has('id:' + a.id) || (a.barcode && activePromoProductKeys.has('barcode:' + a.barcode));
        const bHasPromo = activePromoProductKeys.has('id:' + b.id) || (b.barcode && activePromoProductKeys.has('barcode:' + b.barcode));

        const aPriority = a.isPack ? 1 : aHasPromo ? 2 : 3;
        const bPriority = b.isPack ? 1 : bHasPromo ? 2 : 3;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        return 0;
      });
  }, [products, formattedPacks, promotionsList, searchQuery, selectedCategory, favoritesOnly, promoOnly, packsOnly, selectedSupplier, stockStatus, sortBy]);

  const handleSaveProformaFromPOS = () => {
    if (ticketItems.length === 0) {
      showToast('Veuillez ajouter au moins un article pour la pro-forma', 'error');
      return;
    }

    const today = new Date();
    const subTotal = ticketItems.reduce(
      (acc, it) => acc + (Number(it.price || it.sale_price || 0) * Number(it.quantity || 1)),
      0
    );
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 15);

    const proformaItems = ticketItems.map((it, idx) => ({
      id: it.id || idx + 1,
      barcode: it.barcode || `REF-${it.id || idx + 1}`,
      name: it.name || 'Article',
      quantity: Number(it.quantity || 1),
      unit: it.unit || 'Pièce',
      priceHT: Number(it.price || it.sale_price || 0),
      tva: 0,
      totalHT: Number(it.quantity || 1) * Number(it.price || it.sale_price || 0)
    }));

    try {
      const saved = localStorage.getItem('novamag_proformas');
      let list = saved ? JSON.parse(saved) : [];

      if (editingProforma && !editingProforma.isNew) {
        // Modification d'une pro-forma existante
        list = list.map((p) =>
          p.id === editingProforma.id
            ? {
                ...p,
                clientName: selectedCustomer?.name || p.clientName || 'Client Comptoir (Espèces)',
                clientPhone: selectedCustomer?.phone || p.clientPhone || '',
                items: proformaItems,
                totalHT: subTotal,
                discount: 0,
                totalEstimated: subTotal
              }
            : p
        );
        playSaleValidationSound();
        showToast(language === 'ar' ? 'تم تعديل الفاتورة التقديرية بنجاح!' : 'Pro-forma modifiée avec succès !', 'success');
      } else {
        // Création d'une nouvelle pro-forma
        const nextId = list.length + 1;
        const docNumber = `PRO-${today.getFullYear()}-${String(nextId).padStart(4, '0')}`;
        const newProforma = {
          id: Date.now(),
          index: nextId,
          documentNumber: docNumber,
          date: today.toISOString(),
          clientName: selectedCustomer?.name || 'Client Comptoir (Espèces)',
          clientAddress: selectedCustomer?.address || '',
          clientRc: selectedCustomer?.rc || '',
          clientNif: selectedCustomer?.nif || '',
          clientPhone: selectedCustomer?.phone || '',
          validityDays: 15,
          validUntil: validUntilDate.toISOString().slice(0, 10),
          status: 'pending',
          items: proformaItems,
          totalHT: subTotal,
          discount: 0,
          totalEstimated: subTotal,
          notes: 'Prix valables 15 jours.'
        };
        list.unshift(newProforma);
        playSaleValidationSound();
        showToast(language === 'ar' ? 'تم إنشاء الفاتورة التقديرية بنجاح!' : 'Pro-forma créée avec succès !', 'success');
      }

      localStorage.setItem('novamag_proformas', JSON.stringify(list));
      window.dispatchEvent(new Event('novamag_proformas_updated'));
      localStorage.removeItem('novamag_editing_proforma');
      localStorage.removeItem('novamag_ticket_items');
      setEditingProforma(null);
      setTicketItems([]);
      // On reste directement sur le Point de Vente avec le panier vidé, sans redirection
    } catch (e) {
      showToast('Erreur lors de l\'enregistrement de la pro-forma', 'error');
    }
  };

  const handleCancelEditProforma = () => {
    setEditingProforma(null);
    setTicketItems([]);
    try {
      localStorage.removeItem('novamag_editing_proforma');
      localStorage.removeItem('novamag_ticket_items');
    } catch {}
    showToast('Mode Pro-forma annulé, panier réinitialisé', 'info');
    if (onNavigate) {
      onNavigate('proforma');
    }
  };

  const handleCancelEditOrderForm = () => {
    setEditingOrderForm(null);
    setTicketItems([]);
    try {
      localStorage.removeItem('novamag_editing_order_form');
      localStorage.removeItem('novamag_ticket_items');
    } catch {}
    showToast('Modification de la commande annulée, panier réinitialisé', 'info');
  };

  const handleSaveOrderFromPOS = (orderData) => {
    if (ticketItems.length === 0) {
      showToast('Veuillez ajouter au moins un article pour la commande', 'error');
      return;
    }

    const today = new Date();
    const subTotal = ticketItems.reduce(
      (acc, it) => acc + (Number(it.price || it.sale_price || 0) * Number(it.quantity || 1)),
      0
    );

    const orderItems = ticketItems.map((it, idx) => ({
      id: it.id || idx + 1,
      barcode: it.barcode || `REF-${it.id || idx + 1}`,
      name: it.name || 'Article',
      quantity: Number(it.quantity || 1),
      unit: it.unit || 'Pièce',
      priceHT: Number(it.price || it.sale_price || 0),
      totalHT: Number(it.quantity || 1) * Number(it.price || it.sale_price || 0)
    }));

    try {
      const saved = localStorage.getItem('novamag_order_forms');
      let list = saved ? JSON.parse(saved) : [];

      if (editingOrderForm && !editingOrderForm.isNew) {
        list = list.map((o) =>
          o.id === editingOrderForm.id
            ? {
                ...o,
                deliveryDate: orderData.deliveryDate,
                dateLivraisonPrevue: orderData.deliveryDate,
                depositPaid: orderData.depositAmount,
                acompte: orderData.depositAmount,
                paymentMethod: orderData.paymentMethod,
                notes: orderData.notes,
                reserveStock: orderData.reserveStock,
                clientName: selectedCustomer?.name || o.clientName || 'Client Comptoir (Espèces)',
                clientPhone: selectedCustomer?.phone || o.clientPhone || '',
                items: orderItems,
                itemsCount: orderItems.length,
                total: subTotal,
                totalHT: subTotal,
                remainingDue: Math.max(0, subTotal - orderData.depositAmount)
              }
            : o
        );
        showToast(`✓ Bon de commande ${editingOrderForm.documentNumber} modifié avec succès !`, 'success');
      } else {
        const nextId = list.length + 1;
        const docNum = `BC-${today.getFullYear()}-${String(nextId).padStart(4, '0')}`;
        const newOrder = {
          id: Date.now(),
          index: nextId,
          documentNumber: docNum,
          date: today.toISOString(),
          deliveryDate: orderData.deliveryDate,
          dateLivraisonPrevue: orderData.deliveryDate,
          clientName: selectedCustomer?.name || 'Client Comptoir (Espèces)',
          clientAddress: selectedCustomer?.address || '',
          clientPhone: selectedCustomer?.phone || '',
          clientRc: selectedCustomer?.rc || '',
          clientNif: selectedCustomer?.nif || '',
          status: 'pending',
          items: orderItems,
          itemsCount: orderItems.length,
          total: subTotal,
          totalHT: subTotal,
          discount: 0,
          depositPaid: orderData.depositAmount,
          acompte: orderData.depositAmount,
          remainingDue: Math.max(0, subTotal - orderData.depositAmount),
          paymentMethod: orderData.paymentMethod,
          notes: orderData.notes,
          reserveStock: orderData.reserveStock
        };
        list.unshift(newOrder);
        showToast(`✓ Bon de commande ${docNum} enregistré avec succès !`, 'success');
      }

      localStorage.setItem('novamag_order_forms', JSON.stringify(list));
      window.dispatchEvent(new Event('novamag_order_forms_updated'));
      localStorage.removeItem('novamag_editing_order_form');
      localStorage.removeItem('novamag_ticket_items');
      setTicketItems([]);
      setEditingOrderForm(null);
      setIsSaveOrderModalOpen(false);
      playSaleValidationSound();
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'enregistrement du bon de commande", 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 bg-slate-100 dark:bg-[#0B1120] relative">
      {/* Modern Toast Notification (Floating Sleek Card) */}
      <ModernToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Main Screen: Catalog Area (CENTER/LEFT) + Resizer Handle + Ticket Panel (RIGHT) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">

        {/* 1. CENTER / MAIN: PosHeader (Action Buttons) + ProductCatalogGrid */}
        <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${posLayoutMode === 'superette' ? 'bg-gradient-to-b from-[#EBF3FE] via-[#F4F8FE] to-[#DCE8FC]' : 'bg-slate-100'} transition-colors duration-200`}>
          <PosHeader
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categoriesWithCounts}
            isReturnMode={isReturnMode}
            setIsReturnMode={setIsReturnMode}
            onToggleReturnMode={handleToggleReturnMode}
            onAddProduct={() => setIsAddProductOpen(true)}
            onAddCustomer={() => setIsAddCustomerOpen(true)}
            onOpenDrawer={() => setIsOpenDrawerModalOpen(true)}
            cashSession={cashSession}
            onFreeItem={() => setIsFreeItemOpen(true)}
            favoritesOnly={favoritesOnly}
            setFavoritesOnly={setFavoritesOnly}
            promoOnly={promoOnly}
            setPromoOnly={setPromoOnly}
            packsOnly={packsOnly}
            setPacksOnly={setPacksOnly}
            sortBy={sortBy}
            setSortBy={setSortBy}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
            stockStatus={stockStatus}
            setStockStatus={setStockStatus}
            suppliers={suppliers}
            onResetFilters={handleResetFilters}
            activeFiltersCount={activeFiltersCount}
            posLayoutMode={posLayoutMode}
            onSelectPosLayoutMode={handleSelectPosLayoutMode}
            onOpenShortcutManager={() => setIsQuickShortcutsModalOpen(true)}
            onOpenCustomizationModal={() => setIsCustomizationModalOpen(true)}
          />

          {/* ══ AFFICHAGE DU CENTRE SELON LE MODE CHOISI (تخصيص) ══ */}
          <div className={`flex-1 min-h-0 flex flex-col overflow-hidden ${posLayoutMode === 'superette' ? 'bg-transparent' : 'bg-slate-100'}`}>
            {posLayoutMode === 'catalog' ? (
              <ProductCatalogGrid
                products={displayedProducts}
                promotions={promotionsList}
                onSelectProduct={handleSelectProduct}
                selectedCategory={selectedCategory}
                customization={catalogCustomization}
                financialAccountingOnly={systemSettings?.financialAccountingOnly ?? false}
                averagePricing={Boolean(systemSettings?.averagePricing)}
                onClearTicket={handleClearTicket}
                onSuspendTicket={handleSuspendTicket}
                onOpenHistory={() => onNavigate ? onNavigate('sales_history') : setIsInvoiceModalOpen(true)}
                onOpenDrafts={() => setIsDraftsModalOpen(true)}
                onToggleAutoPrint={handleToggleAutoPrint}
                isAutoPrintEnabled={isAutoPrintEnabled}
                suspendedTicketsCount={suspendedTickets.length}
                hasTicketItems={ticketItems.length > 0}
                isReturnMode={isReturnMode}
                onToggleReturnMode={handleToggleReturnMode}
              />
            ) : (
              <PosSuperetteView
                products={products}
                shortcuts={shortcuts}
                customization={catalogCustomization}
                onSelectProduct={handleSelectProduct}
                onOpenShortcutManager={() => setIsQuickShortcutsModalOpen(true)}
                lastScannedItem={ticketItems[ticketItems.length - 1] || null}
                weightedProducts={products.filter((p) => p.isWeighted || p.is_weighted)}
                onDirectBarcode={(barcode) => handleBarcodeSubmit(barcode)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onClearTicket={handleClearTicket}
                onSuspendTicket={handleSuspendTicket}
                onOpenHistory={() => onNavigate ? onNavigate('sales_history') : setIsInvoiceModalOpen(true)}
                onOpenDrafts={() => setIsDraftsModalOpen(true)}
                onToggleAutoPrint={handleToggleAutoPrint}
                isAutoPrintEnabled={isAutoPrintEnabled}
                onOpenPayment={handleInitiatePayment}
                onToggleFavorites={handleToggleFavorites}
                favoritesOnly={favoritesOnly}
                onOpenCustomerModal={() => setIsAddCustomerOpen(true)}
                suspendedTicketsCount={suspendedTickets.length}
                isReturnMode={isReturnMode}
                onToggleReturnMode={handleToggleReturnMode}
              />
            )}
          </div>
        </div>

        {/* 2. Zone de redimensionnement invisible entre catalogue et ticket */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1 -ml-1 cursor-col-resize hover:bg-blue-500/30 transition-colors z-10 shrink-0 select-none ${
            isDragging ? 'bg-blue-500/40' : 'bg-transparent'
          }`}
          title="Glisser pour ajuster la largeur du ticket"
        />

        {/* 3. RIGHT SIDE: Resizable Ticket Panel */}
        <TicketPanel
          width={ticketWidth}
          ticketItems={ticketItems}
          selectedIndex={selectedTicketIndex}
          onSelectItem={setSelectedTicketIndex}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onClearTicket={handleClearTicket}
          onOpenPayment={handleInitiatePayment}
          customers={customers}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          isReturnMode={isReturnMode}
          isFastSale={systemSettings?.fastSale ?? true}
          financialAccountingOnly={systemSettings?.financialAccountingOnly ?? false}
          onSuspendTicket={handleSuspendTicket}
          onOpenDrafts={() => setIsDraftsModalOpen(true)}
          onOpenHistory={() => onNavigate ? onNavigate('sales_history') : setIsInvoiceModalOpen(true)}
          editingSale={editingSale}
          onCancelEditSale={() => {
            setEditingSale(null);
            setTicketItems([]);
            try {
              localStorage.removeItem('novamag_editing_invoice');
              localStorage.removeItem('novamag_ticket_items');
            } catch {}
            showToast('Modification annulée, panier réinitialisé', 'info');
          }}
          editingProforma={editingProforma}
          onSaveProforma={handleSaveProformaFromPOS}
          onCancelEditProforma={handleCancelEditProforma}
          editingOrderForm={editingOrderForm}
          onOpenSaveOrderModal={() => setIsSaveOrderModalOpen(true)}
          onCancelEditOrderForm={handleCancelEditOrderForm}
          suspendedTicketsCount={suspendedTickets.length}
          isAutoPrintEnabled={isAutoPrintEnabled}
          onToggleAutoPrint={handleToggleAutoPrint}
          onOpenLatestSaleReceipt={handleShowLatestInvoice}
          onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
          onOpenQuantityModal={(item, idx) => handleOpenQuantityModal(item, idx)}
          onEditWeightedItem={(item) => {
            const prod = products.find((p) => p.id === item.productId) || {
              id: item.productId,
              name: item.name,
              price: item.price,
              unitType: item.unit || 'kg',
              isWeighted: true
            };
            setSelectedWeightedProduct(prod);
            setIsWeightModalOpen(true);
          }}
          showToast={showToast}
          onResetTicketSilently={handleResetTicketSilently}
          onApplyDiscount={handleApplyDiscount}
          onRemoveDiscount={handleRemoveDiscount}
          products={products}
        />
      </div>

      {/* Payment Confirmation Modal (Exacte réplique de l'interface de règlement et vérification du plafond de dette) */}
      <PaymentModal
        isOpen={isPaymentOpen}
        grandTotal={ticketItems.reduce((acc, it) => acc + (typeof it.customTotal === 'number' ? it.customTotal : it.price * it.quantity), 0)}
        isReturnMode={isReturnMode}
        selectedCustomer={selectedCustomer}
        customerName={selectedCustomer?.name}
        defaultPrintReceipt={isAutoPrintEnabled}
        onClose={() => setIsPaymentOpen(false)}
        onConfirm={handleConfirmPayment}
        onOpenAddCustomer={() => {
          setIsPaymentOpen(false);
          setIsAddCustomerOpen(true);
        }}
      />

      {/* Add New Product Modal (Matches exact reference design with 3 tabs) */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setNewProductInitialBarcode('');
        }}
        initialBarcode={newProductInitialBarcode}
        categories={categories}
        onSave={async (newProd) => {
          // 1. Mise à jour instantanée du catalogue local
          setProducts((prev) => {
            const updated = [newProd, ...prev.filter((p) => String(p.id) !== String(newProd.id))];
            try {
              localStorage.setItem('novamag_products', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
          setNewProductInitialBarcode('');
          showToast(`✓ Produit "${newProd.name}" ajouté avec succès`, 'success');

          // 2. Persistance définitive dans la base de données SQLite novamag.db
          try {
            const payload = {
              barcode: newProd.barcode || null,
              name: newProd.name,
              price: Number(newProd.price) || 0,
              prix_achat: Number(newProd.purchasePrice ?? newProd.buyPrice ?? newProd.prix_achat ?? 0),
              stock_quantity: Number(newProd.stock ?? 0),
              seuil_alerte: Number(newProd.alertStock ?? 5),
              is_weighted: newProd.isWeighted ? 1 : 0,
              category_id: newProd.category_id || (newProd.category && !isNaN(newProd.category) ? Number(newProd.category) : 3)
            };
            const apiRes = await createProduct(payload);
            if (apiRes && apiRes.success && apiRes.data) {
              const savedDbProduct = {
                ...newProd,
                ...apiRes.data,
                id: apiRes.data.id,
                stock: Number(apiRes.data.stock_quantity ?? newProd.stock ?? 0)
              };
              setProducts((prev) => {
                const refreshed = prev.map((p) => (p.id === newProd.id ? savedDbProduct : p));
                try {
                  localStorage.setItem('novamag_products', JSON.stringify(refreshed));
                } catch (e) {}
                return refreshed;
              });
              window.dispatchEvent(new Event('novamag_products_updated'));
            }
          } catch (err) {
            console.warn('Erreur sauvegarde SQLite createProduct:', err);
          }
        }}
      />

      {/* Add Customer Modal (Exact match to reference with Initial Debt and Credit Limit) */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSave={handleSaveCustomer}
      />

      {/* Open Cash Drawer / Opening Session Modal (Exact match to reference) */}
      <OpenCashDrawerModal
        isOpen={isOpenDrawerModalOpen}
        onClose={() => setIsOpenDrawerModalOpen(false)}
        cashSession={cashSession}
        onOpenSession={handleConfirmOpenSession}
        onCloseSession={handleCloseSession}
        cashMovements={cashMovements}
        onAddCashMovement={handleAddCashMovement}
        cashSalesTotal={cashSalesTotal}
        onNavigate={onNavigate}
      />

      {/* Free Item Modal (Article Libre hors stock - Exact match to reference) */}
      <FreeItemModal
        isOpen={isFreeItemOpen}
        onClose={() => setIsFreeItemOpen(false)}
        onAdd={handleAddFreeItem}
      />

      {/* Weight / Scale Quantity Modal (Produit vendu au poids / Pesée dynamique) */}
      <WeightQuantityModal
        isOpen={isWeightModalOpen}
        product={selectedWeightedProduct}
        systemSettings={systemSettings}
        onClose={() => setIsWeightModalOpen(false)}
        onConfirm={handleConfirmWeightItem}
      />

      {/* Direct Exact Quantity Modal (Saisie de quantité exacte via Entrée ou Clic) */}
      <QuantityModal
        isOpen={isQuantityModalOpen}
        item={quantityModalItem}
        onClose={() => {
          setIsQuantityModalOpen(false);
          setQuantityModalItem(null);
          setQuantityModalIndex(-1);
        }}
        onSave={handleSaveDirectQuantity}
      />

      {/* Suspended Tickets / Drafts Modal (Paniers en attente F3) */}
      <SuspendedTicketsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        suspendedTickets={suspendedTickets}
        onRestoreTicket={handleRestoreTicket}
        onDeleteTicket={handleDeleteDraft}
        onClearAllDrafts={handleClearAllDrafts}
      />

      {/* Visualiseur de Factures & Tickets Récents (F9: Dernière vente, F10: Facture précédente) */}
      <InvoiceViewerModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoices={salesHistory}
        currentIndex={currentInvoiceIndex}
        onSelectIndex={(idx) => setCurrentInvoiceIndex(idx)}
        onPrevious={handleShowPreviousInvoice}
        onNext={handleShowNextInvoice}
        onGoLatest={handleShowLatestInvoice}
      />

      {/* Modal de Personnalisation de Caisse (تخصيص: Style caisse, Photos, Emplacement, Prix d'achat, Zoom) */}
      <CustomizationModal
        isOpen={isCustomizationModalOpen}
        onClose={() => setIsCustomizationModalOpen(false)}
        posLayoutMode={posLayoutMode}
        onSelectPosLayoutMode={handleSelectPosLayoutMode}
        customization={catalogCustomization}
        onUpdateCustomization={handleUpdateCustomization}
        onOpenShortcutManager={() => setIsQuickShortcutsModalOpen(true)}
      />

      {/* Gestionnaire des Articles Rapides (Pain, Œufs, Zitoune...) */}
      <QuickShortcutsModal
        isOpen={isQuickShortcutsModalOpen}
        onClose={() => setIsQuickShortcutsModalOpen(false)}
        onShortcutsChanged={loadShortcutsList}
      />

      {/* Modal Enregistrer comme bon de commande (Conforme Image 1) */}
      <SaveOrderModal
        isOpen={isSaveOrderModalOpen}
        onClose={() => setIsSaveOrderModalOpen(false)}
        onSave={handleSaveOrderFromPOS}
        ticketItems={ticketItems}
        customer={selectedCustomer}
        totalAmount={ticketItems.reduce((acc, it) => acc + (typeof it.customTotal === 'number' ? it.customTotal : it.price * it.quantity), 0)}
        initialData={editingOrderForm}
      />

      {/* Modern Confirmation Dialog (Replaces native browser window.confirm popups) */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
