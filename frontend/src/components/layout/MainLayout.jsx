import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import PosScreen from '../pos/PosScreen';
import StockView from '../views/StockView';
import PacksView from '../views/PacksView';
import PromotionsView from '../views/PromotionsView';
import InventoryView from '../views/InventoryView';
import PrintCenterView from '../views/PrintCenterView';
import ClientsView from '../views/ClientsView';
import FournisseursView from '../views/FournisseursView';
import FacturesAchatsView from '../views/FacturesAchatsView';
import RapportsView from '../views/RapportsView';
import ParametresView from '../views/ParametresView';
import UsersView from '../views/UsersView';
import CashManagementView from '../views/CashManagementView';
import SalesHistoryView from '../views/SalesHistoryView';
import ProFormaView from '../views/ProFormaView';
import OrderFormsView from '../views/OrderFormsView';
import NovaIaCopilotView from '../views/NovaIaCopilotView';
import NovaMagMobileApp from '../mobile/NovaMagMobileApp';
import { canAccessView, getRoleDefinition } from '../../services/permissions';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { MOCK_PRODUCTS } from '../../mock/posData';

export default function MainLayout({ onLogout }) {
  const { language } = useLanguage();
  const [activeView, setActiveView] = useState('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_products');
      return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
    } catch {
      return MOCK_PRODUCTS;
    }
  });

  useEffect(() => {
    const handleProductsSync = () => {
      try {
        const saved = localStorage.getItem('novamag_products');
        if (saved) setProducts(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('novamag_products_updated', handleProductsSync);
    window.addEventListener('storage', handleProductsSync);
    return () => {
      window.removeEventListener('novamag_products_updated', handleProductsSync);
      window.removeEventListener('storage', handleProductsSync);
    };
  }, []);

  // Synchronisation dynamique du profil utilisateur
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('novamag_user');
      return stored ? JSON.parse(stored) : { id: 1, username: 'admin', role: 'admin', full_name: 'BZ Technology' };
    } catch {
      return { id: 1, username: 'admin', role: 'admin', full_name: 'BZ Technology' };
    }
  });

  useEffect(() => {
    const handleUserUpdate = () => {
      try {
        const stored = localStorage.getItem('novamag_user');
        if (stored) {
          const user = JSON.parse(stored);
          setCurrentUser(user);
          // Si la vue courante devient inaccessible pour le nouveau rôle, rediriger vers 'pos'
          if (!canAccessView(user, activeView)) {
            setActiveView('pos');
          }
        }
      } catch (e) {}
    };
    window.addEventListener('novamag_user_updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);
    return () => {
      window.removeEventListener('novamag_user_updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, [activeView]);

  const renderActiveView = () => {
    // Vérification de sécurité dynamique des autorisations du rôle
    if (!canAccessView(currentUser, activeView)) {
      const roleDef = getRoleDefinition(currentUser?.role);
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-[#0B1120] text-center select-none">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-sm border border-rose-200 dark:border-rose-900/40">
            <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {language === 'ar' ? 'الدخول غير مصرّح به' : 'Accès Non Autorisé'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-6 leading-relaxed">
            {language === 'ar'
              ? <>ملفك الحالي <strong className="text-slate-800 dark:text-slate-200">« {roleDef.name} »</strong> لا يملك الصلاحيات الكافية للوصول إلى هذا القسم.</>
              : <>Votre profil actuel <strong className="text-slate-800 dark:text-slate-200">« {roleDef.name} »</strong> n'a pas les autorisations nécessaires pour accéder à cette section.</>}
          </p>
          <button
            type="button"
            onClick={() => setActiveView('pos')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{language === 'ar' ? 'العودة إلى نقطة البيع' : 'Retourner au Point de Vente'}</span>
          </button>
        </div>
      );
    }
    switch (activeView) {
      case 'pos':
        return (
          <PosScreen
            onNavigate={setActiveView}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case 'products':
        return <StockView />;
      case 'barcodes':
        return <PrintCenterView onNavigate={setActiveView} />;
      case 'inventory':
        return <InventoryView onNavigate={setActiveView} />;
      case 'promotions':
        return <PromotionsView onNavigate={setActiveView} />;
      case 'packs':
        return <PacksView onNavigate={setActiveView} />;
      case 'customers':
        return <ClientsView />;
      case 'suppliers':
        return <FournisseursView />;
      case 'purchases':
        return <FacturesAchatsView onNavigate={setActiveView} />;
      case 'cash_drawer':
        return <CashManagementView onNavigate={setActiveView} />;
      case 'reports':
        return <RapportsView />;
      case 'sales_history':
        return <SalesHistoryView onNavigate={setActiveView} />;
      case 'settings':
        return <ParametresView />;
      case 'users':
        return <UsersView onNavigate={setActiveView} />;
      case 'proforma':
        return <ProFormaView onNavigate={setActiveView} />;
      case 'order_forms':
        return <OrderFormsView onNavigate={setActiveView} />;
      // AI features temporarily disabled:
      case 'nova_ia':
        return <PosScreen onNavigate={setActiveView} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      case 'ocr_invoice':
        return <FacturesAchatsView onNavigate={setActiveView} autoOpenOcr={false} />;
      case 'mobile_companion':
        return <NovaMagMobileApp onExitMobile={() => setActiveView('pos')} onNavigateView={setActiveView} />;
      default:
        return (
          <PosScreen
            onNavigate={setActiveView}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
    }
  };

  if (activeView === 'mobile_companion') {
    return <NovaMagMobileApp onExitMobile={() => setActiveView('pos')} onNavigateView={setActiveView} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans bg-[#06122C] text-slate-100 select-none">
      {/* ── 1. TOP BAR PLEINE LARGEUR (En-tête officiel tout en haut) ── */}
      <TopBar
        showSearchAndBarcode={activeView === 'pos'}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        barcodeInput={barcodeInput}
        setBarcodeInput={setBarcodeInput}
        onBarcodeSubmit={(barcode) => {
          window.dispatchEvent(new CustomEvent('novamag_barcode_submit', { detail: barcode }));
          setBarcodeInput('');
        }}
        products={products}
        onSelectProduct={(p) => {
          window.dispatchEvent(new CustomEvent('novamag_select_product', { detail: p }));
        }}
        onSelectProductNotification={(notif) => {
          setSearchQuery(notif.productName);
        }}
        onLogout={onLogout}
      />

      {/* ── 2. CORPS : SIDEBAR À GAUCHE + VUES AU CENTRE ── */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={onLogout}
        />

        <div className="flex-1 flex flex-col overflow-hidden min-h-0 w-full bg-[#F8FAFC] dark:bg-[#0B1120]">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
}
