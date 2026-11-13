import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Package, 
  Printer, 
  FileText, 
  Clock, 
  XCircle, 
  Tag, 
  CreditCard, 
  FileCheck,
  History,
  Zap,
  Landmark,
  RotateCcw,
  User,
  ShoppingCart,
  X
} from 'lucide-react';
import { canAddClientInPOS } from '../../services/permissions';
import { printProFormaA4 } from '../../services/thermalPrinter';
import { useLanguage } from '../../i18n/LanguageContext';
import ProductVisual from './ProductVisual';
import RemiseModal from './RemiseModal';

export default function TicketPanel({
  ticketItems = [],
  selectedIndex = 0,
  onSelectItem,
  onUpdateQty,
  onRemoveItem,
  onClearTicket,
  onOpenPayment,
  customers = [],
  selectedCustomer,
  setSelectedCustomer,
  isReturnMode = false,
  width = 380,
  onEditWeightedItem,
  onOpenQuantityModal,
  onSuspendTicket,
  onOpenDrafts,
  onOpenHistory,
  editingSale = null,
  onCancelEditSale = null,
  editingProforma = null,
  onSaveProforma = null,
  onCancelEditProforma = null,
  editingOrderForm = null,
  onOpenSaveOrderModal = null,
  onCancelEditOrderForm = null,
  suspendedTicketsCount = 0,
  isAutoPrintEnabled = true,
  onToggleAutoPrint,
  onOpenLatestSaleReceipt = null,
  onOpenAddCustomer,
  isFastSale = true,
  financialAccountingOnly = false,
  showToast = null,
  onResetTicketSilently = null,
  onApplyDiscount = null,
  onRemoveDiscount = null,
  products = []
}) {
  const { t, language, isRTL } = useLanguage();
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isRemiseModalOpen, setIsRemiseModalOpen] = useState(false);
  const customerDropdownRef = useRef(null);

  // Fonction pour désélectionner immédiatement le client et repasser en client comptoir (passager)
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setIsCustomerDropdownOpen(false);
  };

  // Fermer le menu déroulant des clients au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    if (isCustomerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCustomerDropdownOpen]);

  // Synchronisation dynamique du profil utilisateur pour vérifier les permissions
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('novamag_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
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

  const allowAddCustomer = canAddClientInPOS(currentUser);

  // Totals calculations (Prise en compte des montants personnalisés / négociés et remises)
  const getItemTotal = (it) => (typeof it.customTotal === 'number' ? it.customTotal : it.price * it.quantity);
  const rawSubTotal = ticketItems.reduce((acc, it) => acc + (it.price * (it.quantity || 1)), 0);
  const subTotal = ticketItems.reduce((acc, it) => acc + getItemTotal(it), 0);
  const totalDiscount = Math.max(0, rawSubTotal - subTotal);
  const grandTotal = isReturnMode ? -Math.abs(subTotal) : subTotal;

  // Détection client comptoir (anonyme / passager) vs client régulier connu
  const isCounter = !selectedCustomer || selectedCustomer.id === 1 || selectedCustomer.name?.toLowerCase().includes('comptoir') || selectedCustomer.name?.toLowerCase().includes('passager');
  const isDirectFastSale = isFastSale && isCounter && !isReturnMode;

  // Nom d'affichage du client : Si c'est le client comptoir passager anonyme, on traduit selon la langue
  // Mais si c'est un vrai client enregistré (ex: Hamid Supérette), on préserve son nom original de la BDD !
  const getCustomerDisplayName = (cust) => {
    if (!cust) return t('pos.walk_in_customer', 'Client Comptoir (Passager)');
    const nameLower = (cust.name || '').toLowerCase();
    if (cust.id === 1 || nameLower.includes('comptoir') || nameLower.includes('passager')) {
      return t('pos.walk_in_customer', 'Client Comptoir (Passager)');
    }
    return cust.name;
  };

  const filteredCustomers = customers.filter((c) =>
    (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch)
  );

  return (
    <div 
      style={{ width: `${width}px` }}
      className="bg-white dark:bg-[#0F172A] border-l-2 border-slate-200/90 dark:border-slate-800 flex flex-col justify-between h-full shrink-0 shadow-lg z-10 select-none transition-colors duration-200"
    >
      {/* 1. Barre Recherche & Ajout Client (Avec fond stylisé & déconnexion fluide) */}
      <div 
        className="p-2.5 border-b border-blue-200/70 dark:border-slate-800 bg-gradient-to-r from-[#EBF3FE] via-[#F4F8FE] to-[#EBF3FE] dark:from-[#0B1736] dark:via-[#0F1C42] dark:to-[#09132E] relative shrink-0 shadow-xs"
        ref={customerDropdownRef}
      >
        <div className="flex items-center gap-2">
          {/* Champ de recherche pilule avec contour bleu et fond blanc épuré */}
          <div className="relative flex-1">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setIsCustomerDropdownOpen(true);
              }}
              onFocus={() => setIsCustomerDropdownOpen(true)}
              placeholder="Rechercher client (nom ou tél)..."
              className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 pl-4 pr-8 rtl:pl-8 rtl:pr-4 py-2 bg-white dark:bg-slate-800 border border-blue-400 focus:border-blue-500 rounded-full outline-none shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:ring-2 focus:ring-blue-400/20"
            />
            {customerSearch ? (
              <button
                type="button"
                onClick={() => setCustomerSearch('')}
                className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Search className="w-3.5 h-3.5 text-blue-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
          </div>

          {/* Bouton Rond Vert Menthe d'Ajout Client */}
          <button
            type="button"
            disabled={!allowAddCustomer}
            onClick={() => {
              setIsCustomerDropdownOpen(false);
              onOpenAddCustomer && onOpenAddCustomer();
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all active:scale-95 shadow-xs ${
              allowAddCustomer
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/80 cursor-pointer ring-1 ring-emerald-400/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
            }`}
            title={allowAddCustomer ? 'Ajouter un nouveau client' : 'Non autorisé'}
          >
            <UserPlus className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Client Actif Sélectionné (Affiché s'il s'agit d'un client spécifique comme Issam) */}
        {selectedCustomer && !isCounter && (
          <div className="mt-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl flex items-center justify-between text-xs shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 shadow-xs" />
              <div className="truncate">
                <span className="font-black text-slate-900 dark:text-white">
                  {getCustomerDisplayName(selectedCustomer)}
                </span>
                {selectedCustomer.phone && (
                  <span className="ml-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
                    ({selectedCustomer.phone})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedCustomer.balance < 0 && (
                <span className="text-[10px] font-mono font-black text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800" dir="ltr">
                  {language === 'ar' ? 'دين :' : 'Dette :'} {Math.abs(selectedCustomer.balance).toFixed(0)} {language === 'ar' ? 'د.ج' : 'DA'}
                </span>
              )}
              <button
                type="button"
                onClick={handleClearCustomer}
                className="text-slate-400 hover:text-white hover:bg-rose-500 p-1 rounded-lg transition-all cursor-pointer"
                title="Désélectionner ce client (remettre en comptoir)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Menu Déroulant des Clients */}
        {isCustomerDropdownOpen && (
          <div className="absolute top-full left-2 right-2 mt-1.5 bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-1.5 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-scaleIn">
            {/* Option Client Comptoir (Passager) par défaut */}
            <div
              onClick={handleClearCustomer}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">👤</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {t('pos.walk_in_customer', 'Client Comptoir (Passager)')}
                </span>
              </div>
              {isCounter && (
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                  Actif
                </span>
              )}
            </div>

            {/* Liste des clients filtrés */}
            {filteredCustomers.filter(c => c.id !== 1 && !c.name?.toLowerCase().includes('comptoir')).map((cust) => {
              const isCurrent = selectedCustomer && selectedCustomer.id === cust.id;

              return (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setCustomerSearch('');
                    setIsCustomerDropdownOpen(false);
                  }}
                  className={`p-2 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors ${
                    isCurrent ? 'bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800' : 'hover:bg-blue-50/60 dark:hover:bg-blue-950/40'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{getCustomerDisplayName(cust)}</div>
                    {cust.phone && <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{cust.phone}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {cust.balance < 0 && (
                      <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800" dir="ltr">
                        {language === 'ar' ? 'دين :' : 'Dette :'} {Math.abs(cust.balance)} {language === 'ar' ? 'د.ج' : 'DA'}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-1.5 py-0.2 rounded-md">
                        Sélectionné
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredCustomers.filter(c => c.id !== 1 && !c.name?.toLowerCase().includes('comptoir')).length === 0 && customerSearch && (
              <div className="p-3 text-center text-xs text-slate-400">
                Aucun client trouvé pour "{customerSearch}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Scrollable Ticket Lines List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {/* Banner indicator when in Return / Refund mode */}
        {isReturnMode && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between animate-fadeIn shadow-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>Mode Retour Actif</span>
            </span>
            <span className="text-[10px] uppercase font-black tracking-wider bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-md">
              Remboursement
            </span>
          </div>
        )}

        {/* Badge discret si Mode Comptabilité Financière Uniquement est actif */}
        {financialAccountingOnly && (
          <div className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/70 text-indigo-700 dark:text-indigo-300 text-[10.5px] font-bold flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Mode Financier (Sans suivi stock)</span>
            </span>
            <span className="text-[9px] uppercase font-black tracking-wider bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded">
              Dettes & Ventes
            </span>
          </div>
        )}

        {/* Bandeau si le Mode Pro-forma (Création ou Modification) est actif */}
        {editingProforma && (
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-200 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
            <span className="flex items-center gap-1.5 truncate">
              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">
                {editingProforma.isNew
                  ? 'Nouvelle Pro-forma (Ajoutez vos articles)'
                  : `Modif. Pro-forma ${editingProforma.documentNumber}`}
              </span>
            </span>
            <button
              type="button"
              onClick={onCancelEditProforma}
              className="text-[10px] font-black text-rose-600 hover:text-rose-800 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800 shadow-2xs cursor-pointer ml-2 shrink-0"
              title="Quitter le mode pro-forma"
            >
              Annuler
            </button>
          </div>
        )}

        {/* Bandeau si une vente précédente est restaurée pour modification */}
        {editingSale && (
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
            <span className="flex items-center gap-1.5 truncate">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Modif. Vente #{editingSale.invoiceNumber || editingSale.id}</span>
            </span>
            <button
              type="button"
              onClick={onCancelEditSale}
              className="text-[10px] font-black text-rose-600 hover:text-rose-800 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800 shadow-2xs cursor-pointer ml-2 shrink-0"
              title="Annuler la modification et vider le panier"
            >
              Annuler
            </button>
          </div>
        )}

        {/* Bandeau si un bon de commande est en cours de modification */}
        {editingOrderForm && (
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-400 dark:border-indigo-700 text-indigo-950 dark:text-indigo-200 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
            <span className="flex items-center gap-1.5 truncate">
              <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate">
                {`Modif. Commande ${editingOrderForm.documentNumber}`}
              </span>
            </span>
            <button
              type="button"
              onClick={onCancelEditOrderForm}
              className="text-[10px] font-black text-rose-600 hover:text-rose-800 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs cursor-pointer ml-2 shrink-0"
              title="Quitter la modification de commande"
            >
              Annuler
            </button>
          </div>
        )}

        {ticketItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center mb-2.5 text-slate-300 dark:text-slate-600 shadow-2xs">
              <Package className="w-7 h-7 stroke-[1.5]" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isReturnMode ? 'Sélectionnez les articles à retourner' : 'Ticket de caisse vide'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[200px]">
              Scannez ou cliquez sur un produit du catalogue pour l'ajouter.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ticketItems.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={item.id || index}
                  onClick={() => onSelectItem && onSelectItem(index)}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 shadow-2xs group cursor-pointer ${
                    isSelected
                      ? 'border-2 border-blue-500 bg-white shadow-sm'
                      : isReturnMode
                      ? 'border-rose-200 bg-rose-50/30'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  {/* 1. Miniature 3D Réaliste du Produit */}
                  <div className="w-12 h-10 flex items-center justify-center shrink-0">
                    <ProductVisual
                      id={item.id}
                      name={item.name}
                      className="w-11 h-9 object-contain"
                    />
                  </div>

                  {/* 2. Nom de l'article & prix unitaire */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-black text-slate-900 truncate leading-tight" title={item.name}>
                      {item.name}
                    </h5>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-500 font-bold">
                      <span>{item.price.toFixed(2)} {language === 'ar' ? 'د.ج' : 'DA'}</span>
                      <span>•</span>
                      <span>{item.isWeighted ? (item.unit || 'kg') : '1 pièce'}</span>
                      {item.batchNumber && (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">
                          {item.batchNumber}
                        </span>
                      )}
                    </div>
                    {/* Stock restant */}
                    {(() => {
                      const cleanItemName = (item.name || '').trim().toLowerCase();
                      const cleanBarcode = item.barcode ? String(item.barcode).trim() : '';

                      // 1. Recherche intelligente dans le catalogue des produits (ID, Code-barres ou Nom)
                      const prod = (products || []).find(p => {
                        if (item.productId && String(p.id) === String(item.productId)) return true;
                        if (cleanBarcode && p.barcode && String(p.barcode).trim() === cleanBarcode) return true;
                        if (cleanItemName && p.name) {
                          const pName = p.name.trim().toLowerCase();
                          if (pName === cleanItemName) return true;
                          if (pName.includes(cleanItemName) || cleanItemName.includes(pName)) return true;
                        }
                        return false;
                      });

                      // 2. Détermination du stock disponible
                      const rawStock = prod
                        ? (prod.stock !== undefined && prod.stock !== null ? prod.stock : prod.stock_quantity)
                        : (item.stock !== undefined && item.stock !== null ? item.stock : undefined);

                      if (rawStock === undefined || rawStock === null) {
                        return (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border mt-0.5 text-slate-400 bg-slate-50 border-slate-200">
                            📦 Stock: —
                          </span>
                        );
                      }

                      const stockActuel = Number(rawStock);
                      const apresVente = stockActuel - (Number(item.quantity) || 0);
                      const couleur = apresVente <= 0
                        ? 'text-rose-600 bg-rose-50 border-rose-200'
                        : apresVente <= 5
                        ? 'text-amber-600 bg-amber-50 border-amber-200'
                        : 'text-emerald-600 bg-emerald-50 border-emerald-200';
                      const icone = apresVente <= 0 ? '🚫' : apresVente <= 5 ? '⚠️' : '📦';

                      return (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${couleur}`}>
                          <span>{icone}</span>
                          <span>Stock: {stockActuel}</span>
                          {apresVente !== stockActuel && (
                            <span className="opacity-80">({apresVente >= 0 ? `→ ${apresVente}` : `déficit ${apresVente}`})</span>
                          )}
                        </span>
                      );
                    })()}
                  </div>

                  {/* 3. Stepper Quantité [- 1 +] */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 shrink-0 border border-slate-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem && onSelectItem(index);
                        onUpdateQty(index, -1);
                      }}
                      className="w-5 h-5 flex items-center justify-center bg-white rounded-lg text-slate-700 hover:bg-slate-200 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                      title="Diminuer (-)"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem && onSelectItem(index);
                        if (onOpenQuantityModal) {
                          onOpenQuantityModal(item, index);
                        } else if (item.isWeighted && onEditWeightedItem) {
                          onEditWeightedItem(item);
                        }
                      }}
                      className="text-center font-mono font-black text-xs text-slate-900 px-1 min-w-[20px] cursor-pointer hover:text-blue-600"
                    >
                      {item.isWeighted && typeof item.quantity === 'number'
                        ? item.quantity < 1
                          ? `${Math.round(item.quantity * 1000)}g`
                          : `${parseFloat(item.quantity.toFixed(3))}kg`
                        : item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem && onSelectItem(index);
                        onUpdateQty(index, 1);
                      }}
                      className="w-5 h-5 flex items-center justify-center bg-white rounded-lg text-slate-700 hover:bg-slate-200 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                      title="Augmenter (+)"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* 4. Bouton Poubelle Rouge */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem && onRemoveItem(index);
                    }}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>
              );
            })}

            {/* Barre de raccourcis sous la liste des articles */}
            <div className="mt-2 py-1.5 px-3 bg-slate-100/90 rounded-xl text-[10px] font-mono font-bold text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1 text-emerald-700"><kbd className="font-bold text-emerald-800 bg-white px-1 rounded shadow-2xs">Esc</kbd> Fermer</span>
              <span className="flex items-center gap-1 text-rose-700"><kbd className="font-bold text-rose-800 bg-white px-1 rounded shadow-2xs">Suppr</kbd> Suppr</span>
              <span className="flex items-center gap-1 text-indigo-700"><kbd className="font-bold text-indigo-800 bg-white px-1 rounded shadow-2xs">↵ Entrée</kbd> Qté / Total</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Summary & Payments — Conforme Photo 3 */}
      <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
        
        {/* BLOC TOTAL EXACTEMENT COMME SUR LA PHOTO 3 */}
        <div className={`rounded-2xl p-3 sm:p-4 shadow-xl relative overflow-hidden ${
          isReturnMode
            ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border border-rose-800'
            : 'bg-gradient-to-r from-[#071946] via-[#0B256B] to-[#0A1F56] border border-blue-900/60 shadow-blue-950/40'
        }`}>
          {/* Filigrane Chariot sur la droite */}
          <ShoppingCart className="w-16 h-16 text-blue-300/15 absolute -right-1 -bottom-1 pointer-events-none stroke-[1.8]" />

          {/* Ligne 1 : Sous-total à gauche & Bouton Remise orange à droite */}
          <div className="flex items-center justify-between text-xs font-bold text-white mb-1.5 relative z-10">
            <div className="flex items-center gap-1.5 opacity-90">
              <span>{t('pos.cart_subtotal', 'Sous-total :')}</span>
              <span className="font-mono">{Math.abs(rawSubTotal).toFixed(2)} {language === 'ar' ? 'د.ج' : 'DA'}</span>
              {totalDiscount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] shadow-xs">
                  -{totalDiscount.toFixed(2)} {language === 'ar' ? 'د.ج' : 'DA'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (ticketItems.length === 0) {
                  showToast && showToast("Le panier est vide, aucun article auquel appliquer une remise.", "warning");
                  return;
                }
                setIsRemiseModalOpen(true);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-[11px] font-black shadow-xs transition-transform active:scale-95 cursor-pointer ${
                totalDiscount > 0 ? 'bg-[#FF9800] ring-2 ring-white/40' : 'bg-[#FF9800] hover:bg-[#F57C00]'
              }`}
              title="Appliquer une remise sur le ticket"
            >
              <Tag className="w-3.5 h-3.5 fill-white text-[#FF9800]" />
              <span>{language === 'ar' ? 'تخفيض' : 'Remise'}</span>
              {totalDiscount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
          </div>

          {/* Ligne 2 : Titre TOTAL DÛ */}
          <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-white relative z-10">
            {isReturnMode ? t('pos.cart_refund_total', 'Total Remboursement') : t('pos.cart_total_due', 'TOTAL DÛ')}
          </div>

          {/* Ligne 3 : Montant DA en or/jaune intense comme sur la photo */}
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight leading-none text-[#FFC700] drop-shadow-sm mt-1 relative z-10" dir="ltr">
            {Math.abs(grandTotal).toFixed(2)}
            <span className="text-2xl font-black ml-2 text-[#FFD700]">{language === 'ar' ? 'د.ج' : 'DA'}</span>
          </div>
        </div>

        {/* Bouton Principal : Enregistrement Pro-forma OU Encaissement Vente (F9 / F1) */}
        {editingProforma ? (
          <button
            type="button"
            disabled={ticketItems.length === 0}
            onClick={onSaveProforma}
            className="w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 active:scale-98 text-white shadow-lg shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5 stroke-[2.5]" />
            <span>
              {editingProforma.isNew
                ? (language === 'ar' ? `حفظ الفاتورة الشكلية (${ticketItems.length} سلعة)` : `Enregistrer la Pro-forma (${ticketItems.length} article${ticketItems.length > 1 ? 's' : ''})`)
                : (language === 'ar' ? `حفظ التعديلات (${ticketItems.length} سلعة)` : `Enregistrer les modifications (${ticketItems.length} article${ticketItems.length > 1 ? 's' : ''})`)}
            </span>
          </button>
        ) : (
          <button
            type="button"
            disabled={ticketItems.length === 0}
            onClick={onOpenPayment}
            className={`w-full py-3 sm:py-3.5 px-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-98 ${
              ticketItems.length > 0
                ? isReturnMode
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-r from-[#00C853] to-[#00B048] hover:from-[#00B048] hover:to-[#009624] text-white ring-1 ring-white/20'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
            title="Valider la vente et payer (F1)"
          >
            <CreditCard className="w-6 h-6 stroke-[2.2]" />

            <span className="tracking-wide">
              {isReturnMode
                ? t('pos.validate_refund', 'Rembourser')
                : (language === 'ar' ? 'دفع' : 'Payer')}
            </span>

            <span className="bg-black/20 text-white text-xs px-2 py-0.5 rounded-lg font-mono font-black ml-1 border border-white/20">
              F1
            </span>
          </button>
        )}

        {/* 3 BOUTONS DU BAS : PRO-FORMA, BON DE COMMANDE, TICKET (F5) */}
        <div className="grid grid-cols-3 gap-2">
          {/* 1. Facture Pro-forma A4 */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (ticketItems.length === 0) {
                if (showToast) {
                  showToast('Veuillez ajouter au moins un article au panier pour créer une pro-forma.', 'warning');
                }
                return;
              }
              if (editingProforma && onSaveProforma) {
                onSaveProforma();
                return;
              }
              try {
                const today = new Date();
                let list = [];
                try {
                  const saved = localStorage.getItem('novamag_proformas');
                  if (saved) list = JSON.parse(saved);
                  if (!Array.isArray(list)) list = [];
                } catch (errStorage) {
                  list = [];
                }

                // Numérotation séquentielle automatique (#1, #2, #3...)
                const nextIndex = list.length + 1;
                const docNumber = `PRO-${today.getFullYear()}-${String(nextIndex).padStart(4, '0')}`;
                const validUntilDate = new Date();
                validUntilDate.setDate(validUntilDate.getDate() + 15);

                const proformaItems = ticketItems.map((it, idx) => {
                  const priceVal = Number(it.price ?? it.sale_price ?? 0);
                  const qtyVal = Number(it.quantity ?? 1);
                  const lineTotal = typeof it.customTotal === 'number' ? it.customTotal : (priceVal * qtyVal);
                  return {
                    id: it.id || idx + 1,
                    barcode: it.barcode || it.code || `REF-${it.id || idx + 1}`,
                    name: it.name || 'Article',
                    quantity: qtyVal,
                    unit: it.unit || it.unitType || 'Pièce',
                    priceHT: priceVal,
                    totalHT: lineTotal,
                    discount: Number(it.discount || 0)
                  };
                });

                const newDoc = {
                  id: Date.now(),
                  index: nextIndex,
                  documentNumber: docNumber,
                  date: today.toISOString(),
                  clientName: getCustomerDisplayName(selectedCustomer),
                  clientAddress: selectedCustomer?.address || '',
                  clientPhone: selectedCustomer?.phone || '',
                  validityDays: 15,
                  validUntil: validUntilDate.toISOString().slice(0, 10),
                  status: 'pending',
                  items: proformaItems,
                  totalHT: subTotal,
                  totalEstimated: grandTotal,
                  notes: ''
                };

                localStorage.setItem('novamag_proformas', JSON.stringify([newDoc, ...list]));
                window.dispatchEvent(new Event('novamag_proformas_updated'));

                // Impression A4 immédiate
                printProFormaA4({
                  ...newDoc,
                  storeName: 'NovaMag'
                });

                if (typeof onResetTicketSilently === 'function') {
                  onResetTicketSilently();
                }

                if (showToast) {
                  showToast(`✓ Facture Pro-forma ${docNumber} créée et imprimée !`, 'success');
                }
              } catch (err) {
                console.error('Erreur Pro-forma:', err);
              }
            }}
            disabled={ticketItems.length === 0}
            className="flex flex-col items-center justify-center py-2.5 px-1 bg-gradient-to-b from-[#FFA726] to-[#FB8C00] hover:from-[#FB8C00] hover:to-[#F57C00] text-white rounded-2xl transition-all cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Créer et imprimer une Facture Pro-forma (A4)"
          >
            <FileText className="w-5 h-5 mb-0.5 stroke-[2.2]" />
            <div className="flex items-center gap-1 text-xs font-black">
              <span>{language === 'ar' ? 'فاتورة شكلية' : 'Pro-forma'}</span>
            </div>
          </button>

          {/* 2. Bon de Commande */}
          <button
            type="button"
            onClick={() => {
              if (ticketItems.length === 0) {
                if (showToast) {
                  showToast('Veuillez ajouter au moins un article pour enregistrer une commande.', 'warning');
                }
                return;
              }
              if (typeof onOpenSaveOrderModal === 'function') {
                onOpenSaveOrderModal();
              }
            }}
            disabled={ticketItems.length === 0}
            className="flex flex-col items-center justify-center py-2.5 px-1 bg-gradient-to-b from-[#7E57C2] to-[#5E35B1] hover:from-[#5E35B1] hover:to-[#512DA8] text-white rounded-2xl transition-all cursor-pointer shadow-md shadow-purple-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Enregistrer comme Bon de Commande"
          >
            <FileCheck className="w-5 h-5 mb-0.5 stroke-[2.2]" />
            <div className="flex items-center gap-1 text-xs font-black">
              <span>{language === 'ar' ? 'طلبية' : 'Commande'}</span>
            </div>
          </button>

          {/* 3. Ticket (Bleu vif avec Imprimante : Centre d'impression & Aperçu de la dernière vente) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (typeof onOpenLatestSaleReceipt === 'function') {
                onOpenLatestSaleReceipt();
              } else if (typeof onToggleAutoPrint === 'function') {
                onToggleAutoPrint();
              }
            }}
            className="flex flex-col items-center justify-center py-2.5 px-1 bg-gradient-to-b from-[#29B6F6] to-[#0288D1] hover:from-[#0288D1] hover:to-[#0277BD] text-white rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
            title={language === 'ar' ? 'مركز الطباعة — معاينة وطباعة آخر عملية بيع' : "Centre d'impression — Aperçu & impression du ticket de la dernière vente"}
          >
            <Printer className="w-5 h-5 mb-0.5 stroke-[2.2]" />
            <div className="flex items-center gap-1 text-xs font-black">
              <span>{language === 'ar' ? 'تذكرة' : 'Ticket'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Modal d'Application de Remise (Global ou par article) */}
      <RemiseModal
        isOpen={isRemiseModalOpen}
        onClose={() => setIsRemiseModalOpen(false)}
        ticketItems={ticketItems}
        selectedIndex={selectedIndex}
        onApplyDiscount={onApplyDiscount}
        onRemoveDiscount={onRemoveDiscount}
      />
    </div>
  );
}
