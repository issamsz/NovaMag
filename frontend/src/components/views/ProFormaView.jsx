import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Edit3,
  ArrowRight,
  X,
  Trash2,
  RefreshCw,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  Percent,
  Coins,
  Info,
  RotateCcw
} from 'lucide-react';
import { printProFormaA4 } from '../../services/thermalPrinter';
import { playSaleValidationSound } from '../../services/soundService';
import ConfirmDialog from '../common/ConfirmDialog';
import { useLanguage } from '../../i18n/LanguageContext';

// Liste de démarrage vide par défaut (aucune fausse donnée)
const INITIAL_PROFORMAS = [];

export default function ProFormaView({ onNavigate }) {
  const { t, language } = useLanguage();
  const [proformasList, setProformasList] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_proformas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrer les éventuels faux produits d'exemple (produit1 / produit2)
          return parsed.filter((p) => {
            const hasDummy = (p.items || []).some(
              (it) => it.barcode === '202634359005' || it.barcode === '202611157366' || (it.name && it.name.toLowerCase().includes('produit1'))
            );
            return !hasDummy;
          });
        }
      }
    } catch (e) {}
    return INITIAL_PROFORMAS;
  });

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'converted', 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal de Confirmation de Conversion (Image 3)
  const [convertModalItem, setConvertModalItem] = useState(null);

  // Modal de Confirmation d'Annulation
  const [cancelModalItem, setCancelModalItem] = useState(null);

  // Boîte de Dialogue Moderne de Confirmation (Pas de window.confirm !)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Supprimer définitivement',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: null
  });

  // Toast temporaire
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Synchronisation avec les mises à jour externes
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('novamag_proformas');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setProformasList(
              parsed.filter((p) => {
                const hasDummy = (p.items || []).some(
                  (it) => it.barcode === '202634359005' || it.barcode === '202611157366' || (it.name && it.name.toLowerCase().includes('produit1'))
                );
                return !hasDummy;
              })
            );
          }
        }
      } catch (e) {}
    };
    window.addEventListener('novamag_proformas_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('novamag_proformas_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Sauvegarde dans localStorage à chaque mise à jour
  const saveProformas = (updated) => {
    setProformasList(updated);
    try {
      localStorage.setItem('novamag_proformas', JSON.stringify(updated));
      window.dispatchEvent(new Event('novamag_proformas_updated'));
    } catch (e) {}
  };

  // Décompte par onglet
  const counts = useMemo(() => {
    const total = proformasList.length;
    const pending = proformasList.filter((p) => p.status === 'pending').length;
    const converted = proformasList.filter((p) => p.status === 'converted').length;
    const cancelled = proformasList.filter((p) => p.status === 'cancelled').length;
    return { total, pending, converted, cancelled };
  }, [proformasList]);

  // Filtrage et recherche
  const filteredList = useMemo(() => {
    return proformasList.filter((p) => {
      if (activeTab === 'pending' && p.status !== 'pending') return false;
      if (activeTab === 'converted' && p.status !== 'converted') return false;
      if (activeTab === 'cancelled' && p.status !== 'cancelled') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDoc = (p.documentNumber || '').toLowerCase().includes(q);
        const matchClient = (p.clientName || '').toLowerCase().includes(q);
        return matchDoc || matchClient;
      }
      return true;
    });
  }, [proformasList, activeTab, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  // Largeur ajustable de la case Client (mémorisée en localStorage)
  const [clientColWidth, setClientColWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_proforma_client_col_width');
      return saved ? Number(saved) : 180;
    } catch {
      return 180;
    }
  });

  const handleClientResizeMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = clientColWidth;

    const onMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(120, Math.min(480, startWidth + diff));
      setClientColWidth(newWidth);
      try {
        localStorage.setItem('novamag_proforma_client_col_width', String(newWidth));
      } catch {}
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleRefresh = () => {
    try {
      const saved = localStorage.getItem('novamag_proformas');
      if (saved) {
        setProformasList(JSON.parse(saved));
      }
      showToast('Liste des factures pro-forma actualisée', 'info');
    } catch (e) {}
  };

  // Actions de ligne
  const handlePrint = (item) => {
    printProFormaA4(item);
  };

  const handleConvert = (item) => {
    if (item.status === 'converted') {
      showToast('Cette pro-forma a déjà été convertie en facture réelle.', 'info');
      return;
    }
    setConvertModalItem(item);
  };

  const handleConfirmConvert = () => {
    if (!convertModalItem) return;
    const item = convertModalItem;

    // 1. Débit du stock des articles dans novamag_products
    try {
      const savedProducts = localStorage.getItem('novamag_products');
      if (savedProducts) {
        let products = JSON.parse(savedProducts);
        if (Array.isArray(products)) {
          const proformaItems = item.items || [];
          products = products.map((prod) => {
            const matched = proformaItems.find(
              (pi) => (pi.barcode && prod.barcode && String(pi.barcode) === String(prod.barcode)) ||
                      (pi.id && prod.id && Number(pi.id) === Number(prod.id)) ||
                      (pi.name && prod.name && pi.name.toLowerCase() === prod.name.toLowerCase())
            );
            if (matched) {
              const currentStock = Number(prod.stock ?? prod.quantity ?? 100);
              const qtyToDeduct = Number(matched.quantity || 1);
              const nextStock = Math.max(0, currentStock - qtyToDeduct);
              return {
                ...prod,
                stock: nextStock,
                quantity: nextStock
              };
            }
            return prod;
          });
          localStorage.setItem('novamag_products', JSON.stringify(products));
          window.dispatchEvent(new Event('novamag_products_updated'));
        }
      }
    } catch (e) {
      console.warn('Erreur lors du débit de stock:', e);
    }

    // 2. Création et insertion de la vente réelle dans novamag_sales_history
    const year = new Date().getFullYear();
    const realInvoiceNumber = `FAC-${year}-${String(Date.now()).slice(-4)}`;
    try {
      const savedSales = localStorage.getItem('novamag_sales_history');
      const sales = savedSales ? JSON.parse(savedSales) : [];
      const newSale = {
        id: Date.now(),
        invoiceNumber: realInvoiceNumber,
        date: new Date().toISOString(),
        customer: item.clientName || 'Client Comptoir (Espèces)',
        customer_name: item.clientName || 'Client Comptoir (Espèces)',
        items: (item.items || []).map((it) => ({
          id: it.id,
          barcode: it.barcode,
          name: it.name,
          quantity: Number(it.quantity || 1),
          price: Number(it.priceHT || 0),
          total: Number(it.totalHT || 0)
        })),
        total: Number(item.totalEstimated || item.totalHT || 0),
        totalHT: Number(item.totalHT || 0),
        discount: Number(item.discount || 0),
        payment_method: 'Espèces',
        status: 'paid',
        source: 'proforma',
        proformaNumber: item.documentNumber,
        cashier: 'sam (Admin)'
      };
      sales.unshift(newSale);
      localStorage.setItem('novamag_sales_history', JSON.stringify(sales));
      window.dispatchEvent(new Event('novamag_sales_updated'));
    } catch (e) {
      console.warn('Erreur lors de l\'enregistrement de la vente réelle:', e);
    }

    // 3. Mise à jour de la pro-forma
    const updated = proformasList.map((p) =>
      p.id === item.id
        ? {
            ...p,
            status: 'converted',
            convertedAt: new Date().toISOString(),
            convertedInvoiceNumber: realInvoiceNumber
          }
        : p
    );
    saveProformas(updated);

    setConvertModalItem(null);
    playSaleValidationSound();
    showToast(`Pro-forma ${item.documentNumber} convertie en facture réelle N° ${realInvoiceNumber} ! Le stock a été débité.`, 'success');
  };

  const handleOpenCancelModal = (item) => {
    setCancelModalItem(item);
  };

  const handleConfirmCancel = () => {
    if (!cancelModalItem) return;
    const item = cancelModalItem;
    const updated = proformasList.map((p) =>
      p.id === item.id ? { ...p, status: 'cancelled', cancelledAt: new Date().toISOString() } : p
    );
    saveProformas(updated);
    setCancelModalItem(null);
    showToast(`Pro-forma ${item.documentNumber} annulée avec succès.`, 'info');
  };

  const handleReactivate = (item) => {
    const updated = proformasList.map((p) =>
      p.id === item.id ? { ...p, status: 'pending' } : p
    );
    saveProformas(updated);
    showToast(`Pro-forma ${item.documentNumber} réactivée (En attente).`, 'info');
  };

  const handleDelete = (item) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer la facture pro-forma ?',
      message: `Êtes-vous sûr de vouloir supprimer définitivement la pro-forma ${item.documentNumber} ? Cette action est irréversible.`,
      confirmText: 'Supprimer définitivement',
      cancelText: 'Annuler',
      type: 'danger',
      onConfirm: () => {
        const updated = proformasList.filter((p) => p.id !== item.id);
        saveProformas(updated);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`Pro-forma ${item.documentNumber} supprimée.`, 'info');
      }
    });
  };

  // Basculement direct vers le Point de Vente pour créer avec les vrais articles du stock
  const handleOpenCreateInPOS = () => {
    try {
      localStorage.setItem('novamag_ticket_items', JSON.stringify([]));
      localStorage.setItem(
        'novamag_editing_proforma',
        JSON.stringify({ isNew: true, clientName: 'Client Comptoir (Espèces)' })
      );
      window.dispatchEvent(new Event('novamag_restore_proforma'));
      if (onNavigate) onNavigate('pos');
    } catch (e) {
      showToast('Erreur lors de la redirection vers le Point de Vente', 'error');
    }
  };

  // Basculement vers le Point de Vente avec les articles réels de la pro-forma à modifier
  const handleOpenEditInPOS = (item) => {
    try {
      const ticketItems = (item.items || []).map((it) => ({
        id: it.id || Date.now() + Math.random(),
        productId: it.productId || it.id,
        name: it.name,
        barcode: it.barcode,
        price: Number(it.priceHT ?? it.price ?? 0),
        sale_price: Number(it.priceHT ?? it.price ?? 0),
        quantity: Number(it.quantity || 1),
        unit: it.unit || 'Pièce',
        tva: it.tva || 0
      }));
      localStorage.setItem('novamag_ticket_items', JSON.stringify(ticketItems));
      localStorage.setItem('novamag_editing_proforma', JSON.stringify(item));
      window.dispatchEvent(new Event('novamag_restore_proforma'));
      if (onNavigate) onNavigate('pos');
    } catch (e) {
      showToast('Erreur lors du chargement dans le Point de Vente', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-hidden select-none">
      {/* Toast de Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-fadeIn">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white ${
              toast.type === 'error'
                ? 'bg-rose-600 shadow-rose-600/30'
                : toast.type === 'info'
                ? 'bg-blue-600 shadow-blue-600/30'
                : 'bg-emerald-600 shadow-emerald-600/30'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* EN-TÊTE PRINCIPAL : TITRE, SOUS-TITRE & BOUTON ACTUALISER (IMAGE 1)     */}
      {/* ======================================================================= */}
      <div className="px-8 pt-7 pb-5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Titre & Description */}
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
              <FileText className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'ar' ? 'الفواتير الشكلية (برو-فورما)' : 'Factures pro-forma'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {language === 'ar'
                  ? 'عروض أسعار غير محاسبية — قابلة للتعديل والتحويل إلى فاتورة حقيقية فور قبول الزبون'
                  : 'Devis non comptables — modifiables puis convertibles en factures réelles à l\'acceptation du client'}
              </p>
            </div>
          </div>

          {/* Boutons d'Action Header */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreateInPOS}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
              title={language === 'ar' ? 'إنشاء فاتورة شكلية جديدة من نقطة البيع' : 'Créer une pro-forma directement depuis le Point de Vente avec votre stock réel'}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'ar' ? 'فاتورة شكلية جديدة' : 'Nouvelle Pro-forma'}</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.2]" />
              <span>{language === 'ar' ? 'تحديث' : 'Actualiser'}</span>
            </button>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* ONGLET DE FILTRAGE : TOUS / EN ATTENTE / CONVERTIE / ANNULÉE (IMAGE 1) */}
        {/* ======================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: language === 'ar' ? 'الكل' : 'Tous', count: counts.total },
              { id: 'pending', label: language === 'ar' ? 'قيد الانتظار' : 'En attente', count: counts.pending },
              { id: 'converted', label: language === 'ar' ? 'محوّلة' : 'Convertie', count: counts.converted },
              { id: 'cancelled', label: language === 'ar' ? 'ملغاة' : 'Annulée', count: counts.cancelled }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200/90 dark:border-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Recherche */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par N° ou client..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 outline-hidden font-medium transition-all"
            />
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* TABLEAU DES FACTURES PRO-FORMA (CONFORME BON DE COMMANDE : TAILLE & ZÉBRURE) */}
      {/* ======================================================================= */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 select-none bg-slate-50/70 dark:bg-slate-900/40">
                  <th className="py-2.5 px-3 whitespace-nowrap">{language === 'ar' ? 'رقم السند' : 'N° document'}</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">{language === 'ar' ? 'التاريخ والوقت' : 'Date & Heure'}</th>
                  <th
                    style={{ width: `${clientColWidth}px`, minWidth: `${clientColWidth}px` }}
                    className="relative py-2.5 px-2.5 text-center whitespace-nowrap select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Client</span>
                    </div>
                    {/* Poignée interactive pour élargir la case Client */}
                    <div
                      onMouseDown={handleClientResizeMouseDown}
                      title="Glisser pour élargir ou rétrécir la case Client"
                      className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/40 active:bg-blue-600 transition-colors z-10 flex items-center justify-center group-hover:bg-slate-300/40 dark:group-hover:bg-slate-700/50"
                    >
                      <div className="w-[1.5px] h-3.5 bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 rounded-full" />
                    </div>
                  </th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Articles</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Total (DA)</th>
                  <th className="py-2.5 px-2 text-center whitespace-nowrap">Statut</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11.5px]">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                      Aucune facture pro-forma ne correspond à ces critères.
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((item, idx) => {
                    const itemCount = item.items?.length || 0;
                    const formattedDate = (() => {
                      if (!item.date) return '-';
                      try {
                        const d = new Date(item.date);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        const hours = String(d.getHours()).padStart(2, '0');
                        const min = String(d.getMinutes()).padStart(2, '0');
                        const sec = String(d.getSeconds()).padStart(2, '0');
                        return `${day}/${month}/${year} ${hours}:${min}:${sec}`;
                      } catch {
                        return item.date;
                      }
                    })();

                    // Alternance zébrée des lignes (gris bleuté identique aux bons de commande)
                    const isEven = idx % 2 === 0;
                    const rowBg = isEven
                      ? 'bg-white dark:bg-[#111C35]'
                      : 'bg-slate-100 dark:bg-slate-800/60';

                    return (
                      <tr
                        key={item.id}
                        className={`${rowBg} hover:bg-blue-100/60 dark:hover:bg-slate-700/60 transition-colors font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200/60 dark:border-slate-800/60 group`}
                      >
                        {/* 1. N° document */}
                        <td className="py-2.5 px-3 font-mono font-black text-xs text-slate-900 dark:text-white whitespace-nowrap">
                          {item.documentNumber}
                        </td>

                        {/* 2. Date & Heure */}
                        <td className="py-2.5 px-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formattedDate}
                        </td>

                        {/* 3. Client (Largeur ajustable librement à la souris) */}
                        <td
                          style={{ width: `${clientColWidth}px`, minWidth: `${clientColWidth}px`, maxWidth: `${clientColWidth}px` }}
                          className="py-2.5 px-2.5 text-center font-bold text-slate-900 dark:text-white truncate"
                          title={item.clientName || 'Client Comptoir'}
                        >
                          {item.clientName || 'Client Comptoir (Espèces)'}
                        </td>

                        {/* 4. Articles */}
                        <td className="py-2.5 px-2 text-center font-bold text-xs text-slate-800 dark:text-slate-200">
                          {itemCount}
                        </td>

                        {/* 5. Total (DA) */}
                        <td className="py-2.5 px-2 text-center font-black text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {(Number(item.totalEstimated || item.totalHT || 0)).toFixed(2)}
                        </td>

                        {/* 6. Statut (Badge pilule pastel compact) */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          {item.status === 'pending' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100/90 text-amber-800 border border-amber-200/80 shadow-2xs">
                              En attente
                            </span>
                          )}
                          {item.status === 'converted' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                              Convertie
                            </span>
                          )}
                          {item.status === 'cancelled' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100/90 text-rose-800 border border-rose-200/80 shadow-2xs">
                              Annulée
                            </span>
                          )}
                        </td>

                        {/* 7. Actions (Boutons compacts alignés sur 1 ligne horizontale) */}
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1 flex-nowrap">
                            {/* Bouton 1 : Imprimer */}
                            <button
                              type="button"
                              onClick={() => handlePrint(item)}
                              className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title={item.status === 'converted' ? `Imprimer la Facture Définitive A4 (${item.convertedInvoiceNumber || item.documentNumber})` : 'Imprimer Facture Pro-forma (A4)'}
                            >
                              <Printer className="w-3.5 h-3.5 stroke-[2]" />
                            </button>

                            {/* CAS 1 : STATUT EN ATTENTE (PENDING) */}
                            {item.status === 'pending' && (
                              <>
                                {/* Modifier */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditInPOS(item)}
                                  className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                                  title="Modifier dans le Point de Vente"
                                >
                                  <Edit3 className="w-3.5 h-3.5 stroke-[2]" />
                                </button>

                                {/* Convertir en facture réelle */}
                                <button
                                  type="button"
                                  onClick={() => handleConvert(item)}
                                  className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                                  title="Convertir en vente réelle"
                                >
                                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                                </button>

                                {/* Annuler */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancelModal(item)}
                                  className="w-7 h-7 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                                  title="Annuler cette pro-forma"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[2.2]" />
                                </button>
                              </>
                            )}

                            {/* CAS 2 : STATUT CONVERTIE */}
                            {item.status === 'converted' && (
                              <span
                                className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center shadow-2xs"
                                title={`Déjà convertie en facture réelle N° ${item.convertedInvoiceNumber || ''}`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
                              </span>
                            )}

                            {/* CAS 3 : STATUT ANNULÉE */}
                            {item.status === 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleReactivate(item)}
                                className="px-2 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Réactiver cette pro-forma (remettre en attente)"
                              >
                                <RotateCcw className="w-3 h-3 stroke-[2]" />
                                <span>Réactiver</span>
                              </button>
                            )}

                            {/* Bouton Supprimer */}
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ======================================================================= */}
          {/* BARRE DE PAGINATION : PRÉCÉDENT / PAGE 1 / 1 / SUIVANT (IMAGE 1)       */}
          {/* ======================================================================= */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer font-bold"
            >
              Précédent
            </button>

            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Page {currentPage} / {totalPages}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer font-bold"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* POPUP DE CONFIRMATION DE CONVERSION EN FACTURE RÉELLE (CONFORME IMAGE 3) */}
      {/* ======================================================================= */}
      {convertModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-scaleIn">
            {/* Icône Info en bleu clair arrondi */}
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-5 border border-blue-100 dark:border-blue-900/30">
              <Info className="w-8 h-8 stroke-[2.2]" />
            </div>

            {/* Titre */}
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2.5">
              Confirmer l’Opération
            </h3>

            {/* Message conforme Image 3 */}
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mb-7 max-w-xs mx-auto">
              Convertir cette pro-forma en facture réelle ? Le stock sera débité.
            </p>

            {/* Boutons d'action Annuler / Confirmer */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConvertModalItem(null)}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmConvert}
                className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-sm font-black shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* POPUP DE CONFIRMATION D'ANNULATION (EXACTE RÉPLIQUE DU MODAL CONVERTIR) */}
      {/* ======================================================================= */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-scaleIn">
            {/* Icône Cercle Orange/Ambre */}
            <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-5 border border-orange-100 dark:border-orange-900/30">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            {/* Titre */}
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2.5">
              Confirmer l’Opération
            </h3>

            {/* Message exact */}
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mb-7 max-w-xs mx-auto">
              Annuler la facture pro-forma {cancelModalItem.documentNumber} ?
            </p>

            {/* Boutons d'action Annuler / Confirmer */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCancelModalItem(null)}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-7 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-sm font-black shadow-md shadow-orange-600/30 transition-all cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boîte de Dialogue Élégante de Confirmation (Remplacement complet de window.confirm) */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
