import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Printer,
  Edit3,
  Truck,
  X,
  Trash2,
  RefreshCw,
  Info,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';
import { printOrderFormA4 } from '../../services/thermalPrinter';
import { playSaleValidationSound } from '../../services/soundService';
import ConfirmDialog from '../common/ConfirmDialog';
import ModernToast from '../common/ModernToast';
import { useLanguage } from '../../i18n/LanguageContext';

const INITIAL_ORDERS = [
  {
    id: 2,
    documentNumber: 'BC - 2026 - 0002',
    date: '2026-11-09T14:30:00',
    deliveryDate: '2026-11-16',
    dateLivraisonPrevue: '2026-11-16',
    clientName: 'Client Comptoir (Espèces)',
    clientAddress: '',
    clientPhone: '',
    clientRc: '',
    clientNif: '',
    itemsCount: 2,
    items: [
      { id: 1, barcode: '202611157366', name: 'PC Portable Dell Vostro 15 (Core i5 8Go 512Go SSD)', category: 'Matériel Informatique', unit: 'Pièce', quantity: 1, priceHT: 2000, totalHT: 2000 },
      { id: 2, barcode: '202634359005', name: 'Souris & Clavier Sans Fil Logitech MK270 Pro', category: 'Périphériques Caisse', unit: 'Pièce', quantity: 1, priceHT: 2560, totalHT: 2560 }
    ],
    total: 4560,
    totalHT: 4560,
    discount: 0,
    depositPaid: 2000,
    acompte: 2000,
    remainingDue: 2560,
    paymentMethod: 'Espèces (Cash)',
    notes: 'Conditions particulières de la commande...',
    reserveStock: true,
    status: 'pending' // 'pending' | 'delivered' | 'cancelled'
  },
  {
    id: 1,
    documentNumber: 'BC - 2026 - 0001',
    date: '2026-11-08T10:15:00',
    deliveryDate: '2026-11-15',
    dateLivraisonPrevue: '2026-11-15',
    clientName: 'Client Comptoir (Espèces)',
    clientAddress: '',
    clientPhone: '',
    clientRc: '',
    clientNif: '',
    itemsCount: 2,
    items: [
      { id: 1, barcode: '202611157366', name: 'PC Portable Dell Vostro 15 (Core i5 8Go 512Go SSD)', category: 'Matériel Informatique', unit: 'Pièce', quantity: 1, priceHT: 2000, totalHT: 2000 },
      { id: 2, barcode: '202634359005', name: 'Souris & Clavier Sans Fil Logitech MK270 Pro', category: 'Périphériques Caisse', unit: 'Pièce', quantity: 1, priceHT: 3200, totalHT: 3200 }
    ],
    total: 5200,
    totalHT: 5200,
    discount: 0,
    depositPaid: 0,
    acompte: 0,
    remainingDue: 5200,
    paymentMethod: 'Espèces (Cash)',
    notes: '',
    reserveStock: true,
    status: 'pending'
  }
];

export default function OrderFormsView({ onNavigate }) {
  const { t, language } = useLanguage();
  const [ordersList, setOrdersList] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_order_forms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Si d'anciens mock Hamoud/Candia existaient, migrer vers le nouveau format
          if (parsed[0].type === 'fournisseur' || !parsed[0].items) {
            localStorage.setItem('novamag_order_forms', JSON.stringify(INITIAL_ORDERS));
            return INITIAL_ORDERS;
          }
          return parsed;
        }
      }
    } catch (e) {}
    try {
      localStorage.setItem('novamag_order_forms', JSON.stringify(INITIAL_ORDERS));
    } catch (e) {}
    return INITIAL_ORDERS;
  });

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'delivered', 'cancelled'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Notifications
  const [deliverModalItem, setDeliverModalItem] = useState(null);
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const [toast, setToast] = useState({
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadOrders = () => {
    try {
      const saved = localStorage.getItem('novamag_order_forms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed[0].type === 'fournisseur' || !parsed[0].items) {
            setOrdersList(INITIAL_ORDERS);
            return;
          }
          setOrdersList(parsed);
          return;
        }
      }
      setOrdersList(INITIAL_ORDERS);
    } catch {
      setOrdersList(INITIAL_ORDERS);
    }
  };

  useEffect(() => {
    loadOrders();
    const handleUpdate = () => loadOrders();
    window.addEventListener('novamag_order_forms_updated', handleUpdate);
    return () => {
      window.removeEventListener('novamag_order_forms_updated', handleUpdate);
    };
  }, []);

  const saveOrders = (updated) => {
    setOrdersList(updated);
    try {
      localStorage.setItem('novamag_order_forms', JSON.stringify(updated));
      window.dispatchEvent(new Event('novamag_order_forms_updated'));
    } catch (e) {}
  };

  // Format date DD/MM/YYYY
  const formatDateDMY = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Filtrage selon l'onglet
  const filteredList = useMemo(() => {
    return ordersList.filter((item) => {
      if (activeTab === 'pending' && item.status !== 'pending') return false;
      if (activeTab === 'delivered' && item.status !== 'delivered' && item.status !== 'validated') return false;
      if (activeTab === 'cancelled' && item.status !== 'cancelled') return false;
      return true;
    });
  }, [ordersList, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const currentOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  // Largeur ajustable de la case Client (mémorisée en localStorage)
  const [clientColWidth, setClientColWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_orders_client_col_width');
      return saved ? Number(saved) : 160;
    } catch {
      return 160;
    }
  });

  const handleClientResizeMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = clientColWidth;

    const onMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(110, Math.min(450, startWidth + diff));
      setClientColWidth(newWidth);
      try {
        localStorage.setItem('novamag_orders_client_col_width', String(newWidth));
      } catch {}
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Impression
  const handlePrint = (item) => {
    printOrderFormA4(item);
  };

  // Modifier la commande dans le point de vente
  const handleEdit = (item) => {
    try {
      localStorage.setItem('novamag_editing_order_form', JSON.stringify(item));
      const posItems = (item.items || []).map((it) => ({
        id: it.id,
        productId: it.id,
        barcode: it.barcode,
        name: it.name,
        price: Number(it.priceHT || it.price || 0),
        sale_price: Number(it.priceHT || it.price || 0),
        quantity: Number(it.quantity || 1),
        unit: it.unit || 'Pièce'
      }));
      localStorage.setItem('novamag_ticket_items', JSON.stringify(posItems));
      if (onNavigate) {
        onNavigate('pos');
        setTimeout(() => {
          window.dispatchEvent(new Event('novamag_restore_order_for_edit'));
        }, 100);
      }
    } catch (e) {
      showToast('Erreur lors du chargement dans le point de vente', 'error');
    }
  };

  // Confirmation de livraison (Conforme Image 5)
  const handleConfirmDeliver = () => {
    if (!deliverModalItem) return;
    const item = deliverModalItem;

    // 1. Débit du stock des articles
    try {
      const savedProducts = localStorage.getItem('novamag_products');
      if (savedProducts) {
        let products = JSON.parse(savedProducts);
        if (Array.isArray(products)) {
          const orderItems = item.items || [];
          products = products.map((prod) => {
            const matched = orderItems.find(
              (oi) => (oi.barcode && prod.barcode && String(oi.barcode) === String(prod.barcode)) ||
                      (oi.id && prod.id && Number(oi.id) === Number(prod.id)) ||
                      (oi.name && prod.name && oi.name.toLowerCase() === prod.name.toLowerCase())
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
          price: Number(it.priceHT || it.price || 0),
          total: Number(it.quantity || 1) * Number(it.priceHT || it.price || 0)
        })),
        total: Number(item.total || item.totalHT || 0),
        subtotal: Number(item.total || item.totalHT || 0),
        amountPaid: Number(item.depositPaid || item.acompte || item.total || 0),
        debtGenerated: Number(item.remainingDue || 0),
        paymentMethod: item.paymentMethod || 'Espèces (Cash)',
        status: (Number(item.remainingDue || 0) > 0) ? 'partial' : 'paid',
        cashier: 'sam (Admin)',
        source: 'order_form',
        orderNumber: item.documentNumber
      };
      sales.unshift(newSale);
      localStorage.setItem('novamag_sales_history', JSON.stringify(sales));
      window.dispatchEvent(new Event('novamag_sales_updated'));
    } catch (e) {
      console.warn("Erreur lors de l'enregistrement de la vente:", e);
    }

    // 3. Mise à jour de la commande
    const updated = ordersList.map((o) =>
      o.id === item.id
        ? {
            ...o,
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
            convertedInvoiceNumber: realInvoiceNumber
          }
        : o
    );
    saveOrders(updated);
    setDeliverModalItem(null);
    playSaleValidationSound();
    showToast(`✓ Commande ${item.documentNumber} livrée et convertie en facture réelle N° ${realInvoiceNumber} !`, 'success');
  };

  // Annulation de la commande
  const handleConfirmCancel = () => {
    if (!cancelModalItem) return;
    const updated = ordersList.map((o) =>
      o.id === cancelModalItem.id ? { ...o, status: 'cancelled' } : o
    );
    saveOrders(updated);
    setCancelModalItem(null);
    showToast(`Bon de commande ${cancelModalItem.documentNumber} annulé.`, 'info');
  };

  // Suppression
  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;
    const updated = ordersList.filter((o) => o.id !== deleteConfirmItem.id);
    saveOrders(updated);
    setDeleteConfirmItem(null);
    showToast(`Bon de commande supprimé définitivement.`, 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-[#0B1120] overflow-hidden select-none p-3 sm:p-4 space-y-3">
      <ModernToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* ── EN-TÊTE CONFORME IMAGE 2 ── */}
      <div className="bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 shadow-xs">
              <FileCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'ar' ? 'طلبيات الزبائن (سندات الطلب)' : 'Bons de commande'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {language === 'ar'
                  ? 'حجوزات الزبائن مع تسبيق (عربون) — قابلة للتحويل إلى فاتورة حقيقية عند التسليم'
                  : 'Réservations clients avec acompte — convertibles en facture réelle à la livraison'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              loadOrders();
              showToast(language === 'ar' ? 'تم تحديث قائمة سندات الطلب' : 'Liste des bons de commande actualisée', 'info');
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{language === 'ar' ? 'تحديث' : 'Actualiser'}</span>
          </button>
        </div>

        {/* ── ONGLETS DE FILTRAGE (Tous, En attente, Livrée, Annulée) ── */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {[
            { id: 'all', label: language === 'ar' ? 'الكل' : 'Tous' },
            { id: 'pending', label: language === 'ar' ? 'قيد الانتظار' : 'En attente' },
            { id: 'delivered', label: language === 'ar' ? 'تم التسليم' : 'Livrée' },
            { id: 'cancelled', label: language === 'ar' ? 'ملغاة' : 'Annulée' }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TABLEAU PRINCIPAL DES COMMANDES (Format compact pour éviter le défilement) ── */}
      <div className="flex-1 bg-white dark:bg-[#111C35] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 select-none">
                <th className="py-2.5 px-3 whitespace-nowrap">{language === 'ar' ? 'رقم السند' : 'N° document'}</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">{language === 'ar' ? 'التسليم المتوقع' : 'Livraison prévue'}</th>
                <th
                  style={{ width: `${clientColWidth}px`, minWidth: `${clientColWidth}px` }}
                  className="relative py-2.5 px-2.5 text-center whitespace-nowrap select-none group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{language === 'ar' ? 'الزبون' : 'Client'}</span>
                  </div>
                  {/* Poignée interactive pour élargir la colonne Client */}
                  <div
                    onMouseDown={handleClientResizeMouseDown}
                    title="Glisser pour élargir ou rétrécir la case Client"
                    className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/40 active:bg-blue-600 transition-colors z-10 flex items-center justify-center group-hover:bg-slate-300/40 dark:group-hover:bg-slate-700/50"
                  >
                    <div className="w-[1.5px] h-3.5 bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 rounded-full" />
                  </div>
                </th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">{language === 'ar' ? 'السلع' : 'Articles'}</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">{language === 'ar' ? 'الإجمالي (د.ج)' : 'Total (DA)'}</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">{language === 'ar' ? 'العربون' : 'Acompte'}</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">{language === 'ar' ? 'المتبقي' : 'Reste'}</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap">{language === 'ar' ? 'الحالة' : 'Statut'}</th>
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11.5px]">
              {currentOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-9 h-9 mx-auto mb-1.5 opacity-30" />
                    <p className="font-bold text-xs">{language === 'ar' ? 'لا توجد سندات طلبية' : 'Aucun bon de commande trouvé'}</p>
                    <p className="text-[10.5px] mt-0.5">{language === 'ar' ? 'سجّل طلبية من نقطة البيع تحت سلة الشراء' : 'Enregistrez une commande depuis le point de vente sous le panier'}</p>
                  </td>
                </tr>
              ) : (
                currentOrders.map((order, idx) => {
                  const isDelivered = order.status === 'delivered' || order.status === 'validated';
                  const isCancelled = order.status === 'cancelled';
                  const isPending = !isDelivered && !isCancelled;

                  const totalVal = Number(order.total ?? order.totalHT ?? 0);
                  const acompteVal = Number(order.depositPaid ?? order.deposit ?? order.acompte ?? 0);
                  const resteVal = Number(order.remainingDue ?? Math.max(0, totalVal - acompteVal));

                  // Alternance zébrée des lignes (gris bleuté plus soutenu et bien visible)
                  const isEven = idx % 2 === 0;
                  const rowBg = isEven
                    ? 'bg-white dark:bg-[#111C35]'
                    : 'bg-slate-100 dark:bg-slate-800/60';

                  return (
                    <tr
                      key={order.id}
                      className={`${rowBg} hover:bg-blue-100/60 dark:hover:bg-slate-700/60 transition-colors font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200/60 dark:border-slate-800/60`}
                    >
                      {/* N° document */}
                      <td className="py-2.5 px-3 font-black font-mono text-slate-900 dark:text-white whitespace-nowrap text-xs">
                        {order.documentNumber}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
                        {formatDateDMY(order.date)}
                      </td>

                      {/* Date de livraison prévue */}
                      <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
                        {formatDateDMY(order.deliveryDate || order.expectedDeliveryDate || order.dateLivraisonPrevue)}
                      </td>

                      {/* Client (Largeur ajustable librement à la souris) */}
                      <td
                        style={{ width: `${clientColWidth}px`, minWidth: `${clientColWidth}px`, maxWidth: `${clientColWidth}px` }}
                        className="py-2.5 px-2.5 text-center font-bold text-slate-900 dark:text-white truncate"
                        title={order.clientName || 'Client Comptoir'}
                      >
                        {order.clientName || 'Client Comptoir (Espèces)'}
                      </td>

                      {/* Articles de la commande */}
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800 dark:text-slate-200">
                        {order.itemsCount || (order.items ? order.items.length : 1)}
                      </td>

                      {/* Total (DA) */}
                      <td className="py-2.5 px-2 text-center font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {totalVal.toFixed(2)}
                      </td>

                      {/* Acompte */}
                      <td className="py-2.5 px-2 text-center font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {acompteVal.toFixed(2)}
                      </td>

                      {/* Reste */}
                      <td className="py-2.5 px-2 text-center font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {resteVal.toFixed(2)}
                      </td>

                      {/* Statut (Colonne dédiée avec Badge Pilule Pastel) */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {isPending && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100/90 text-amber-800 border border-amber-200/80 shadow-2xs">
                            {language === 'ar' ? 'قيد الانتظار' : 'En attente'}
                          </span>
                        )}
                        {isDelivered && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                            {language === 'ar' ? 'تم التسليم' : 'Livrée'}
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100/90 text-rose-800 border border-rose-200/80 shadow-2xs">
                            {language === 'ar' ? 'ملغاة' : 'Annulée'}
                          </span>
                        )}
                      </td>

                      {/* Actions (Boutons Pastel compacts alignés sur 1 ligne horizontale) */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1 flex-nowrap">
                          {/* 1. Imprimer */}
                          <button
                            type="button"
                            onClick={() => handlePrint(order)}
                            className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                            title={isDelivered ? (language === 'ar' ? 'طباعة فاتورة البيع النهائية A4' : 'Imprimer la facture définitive de vente A4') : (language === 'ar' ? 'طباعة سند الطلب A4' : 'Imprimer le bon de commande A4')}
                          >
                            <Printer className="w-3.5 h-3.5 stroke-[2]" />
                          </button>

                          {/* Actions actives uniquement si En attente */}
                          {isPending && (
                            <>
                              {/* 2. Modifier */}
                              <button
                                type="button"
                                onClick={() => handleEdit(order)}
                                className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                                title={language === 'ar' ? 'تعديل الطلبية في نقطة البيع' : 'Modifier la commande au point de vente'}
                              >
                                <Edit3 className="w-3.5 h-3.5 stroke-[2]" />
                              </button>

                              {/* 3. Livrer */}
                              <button
                                type="button"
                                onClick={() => setDeliverModalItem(order)}
                                className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                                title={language === 'ar' ? 'تسليم الطلبية وتحويلها إلى فاتورة حقيقية' : 'Livrer la commande et convertir en facture réelle'}
                              >
                                <Truck className="w-3.5 h-3.5 stroke-[2]" />
                              </button>

                              {/* 4. Annuler */}
                              <button
                                type="button"
                                onClick={() => setCancelModalItem(order)}
                                className="w-7 h-7 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 dark:hover:bg-orange-900/60 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                                title={language === 'ar' ? 'إلغاء سند الطلب هذا' : 'Annuler ce bon de commande'}
                              >
                                <X className="w-3.5 h-3.5 stroke-[2]" />
                              </button>
                            </>
                          )}

                          {/* 5. Supprimer */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(order)}
                            className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                            title={language === 'ar' ? 'حذف نهائي' : 'Supprimer définitivement'}
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

        {/* ── PAGINATION ── */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-bold bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'السابق' : 'Précédent'}</span>
          </button>

          <span>
            {language === 'ar' ? 'صفحة ' : 'Page '}
            <strong className="text-blue-600">{currentPage}</strong>
            {language === 'ar' ? ' من ' : ' sur '}
            {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
          >
            <span>{language === 'ar' ? 'التالي' : 'Suivant'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── MODAL CONFIRMATION LIVRAISON ── */}
      {deliverModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-none">
          <div className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scaleUp">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-5 shadow-xs border border-blue-100 dark:border-blue-900/40">
              <Info className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              {language === 'ar' ? 'تأكيد العملية' : 'Confirmer l’Opération'}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-8 leading-relaxed max-w-sm mx-auto">
              {language === 'ar'
                ? 'تسليم كامل الطلبية وتحويلها إلى فاتورة حقيقية؟ سيتم خصم الكميات من المخزون.'
                : 'Livrer toute la commande et la convertir en facture réelle ? Le stock sera débité.'}
            </p>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setDeliverModalItem(null)}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeliver}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/30 active:scale-95"
              >
                {language === 'ar' ? 'تأكيد' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMATION ANNULATION ── */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-none">
          <div className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scaleUp">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center mx-auto mb-5 shadow-xs border border-orange-100">
              <AlertCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              {language === 'ar' ? 'إلغاء الطلبية' : 'Annuler la Commande'}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-8 leading-relaxed">
              {language === 'ar'
                ? `هل أنت متأكد من رغبتك في إلغاء سند الطلب ${cancelModalItem.documentNumber} ؟`
                : `Êtes-vous sûr de vouloir annuler le bon de commande ${cancelModalItem.documentNumber} ?`}
            </p>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setCancelModalItem(null)}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'رجوع' : 'Retour'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-orange-600/30 active:scale-95"
              >
                {language === 'ar' ? 'تأكيد الإلغاء' : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SUPPRESSION DÉFINITIVE ── */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmItem)}
        title={language === 'ar' ? 'حذف سند الطلب' : 'Supprimer le bon de commande'}
        message={deleteConfirmItem ? (language === 'ar' ? `هل أنت متأكد من حذف سند الطلب ${deleteConfirmItem.documentNumber} نهائياً؟` : `Êtes-vous sûr de vouloir supprimer définitivement le bon de commande ${deleteConfirmItem.documentNumber} ?`) : ''}
        confirmText={language === 'ar' ? 'حذف نهائي' : 'Supprimer définitivement'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Annuler'}
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmItem(null)}
      />
    </div>
  );
}
