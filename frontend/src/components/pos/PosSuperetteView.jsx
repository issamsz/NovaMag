import React, { useState } from 'react';
import { 
  Zap, Settings, Plus, Scale, CheckCircle2, 
  Search, ArrowRight, ShoppingCart, Tag
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import VirtualKeyboard from './VirtualKeyboard';
import ProductVisual from './ProductVisual';

// Couleurs pastel douces et lumineuses conformes à la maquette
const getPastelCardStyle = (name = '', color = '') => {
  const n = (name || '').toLowerCase();
  if (n.includes('baguette') || n.includes('pain') || n.includes('jus')) {
    return 'bg-gradient-to-b from-[#FFF7ED] to-[#FFEDD5] border-[#FED7AA] hover:border-amber-400 shadow-sm hover:shadow-md';
  }
  if (n.includes('œuf') || n.includes('oeuf') || n.includes('plateau')) {
    return 'bg-gradient-to-b from-[#FEFCE8] to-[#FEF08A]/60 border-[#FDE047] hover:border-yellow-400 shadow-sm hover:shadow-md';
  }
  if (n.includes('lait') || n.includes('eau') || n.includes('soummam') || n.includes('yaourt')) {
    return 'bg-gradient-to-b from-[#F0F9FF] to-[#E0F2FE] border-[#BAE6FD] hover:border-sky-400 shadow-sm hover:shadow-md';
  }
  if (n.includes('vert') || n.includes('zitoune vert')) {
    return 'bg-gradient-to-b from-[#ECFDF5] to-[#D1FAE5] border-[#A7F3D0] hover:border-emerald-400 shadow-sm hover:shadow-md';
  }
  if (n.includes('croissant')) {
    return 'bg-gradient-to-b from-[#FFF1F2] to-[#FFE4E6] border-[#FECDD3] hover:border-rose-400 shadow-sm hover:shadow-md';
  }
  return 'bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] border-[#CBD5E1] hover:border-slate-400 shadow-sm hover:shadow-md';
};

export default function PosSuperetteView({
  products = [],
  shortcuts = [],
  customization = {},
  lastScannedItem = null,
  onSelectProduct,
  onBarcodeScan,
  onOpenShortcutManager,
  searchQuery = '',
  setSearchQuery = null,
  onClearTicket,
  onSuspendTicket,
  onOpenHistory,
  onOpenDrafts,
  onToggleAutoPrint,
  isAutoPrintEnabled = true,
  onOpenPayment,
  onToggleFavorites,
  favoritesOnly = false,
  onOpenCustomerModal = null,
  suspendedTicketsCount = 0,
  isReturnMode = false,
  onToggleReturnMode = null
}) {
  const { language } = useLanguage();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastClickedId, setLastClickedId] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const cleanQ = (searchQuery || '').trim().toLowerCase();
  const searchResults = cleanQ
    ? (products || []).filter((p) => {
        const matchName = (p.name || '').toLowerCase().includes(cleanQ);
        const matchBarcode = p.barcode ? String(p.barcode).toLowerCase().includes(cleanQ) : false;
        return matchName || matchBarcode;
      })
    : [];

  const zoomLevel = customization?.zoomLevel || 100;
  const shortcutMinHeight = zoomLevel >= 120 ? 'min-h-[116px]' : zoomLevel <= 85 ? 'min-h-[84px]' : 'min-h-[96px]';
  const visualSize = zoomLevel >= 120 ? 'w-14 h-12' : zoomLevel <= 85 ? 'w-10 h-8' : 'w-12 h-10';
  const titleTextSize = zoomLevel >= 120 ? 'text-xs' : zoomLevel <= 85 ? 'text-[10px]' : 'text-[11px]';
  const priceTextSize = zoomLevel >= 120 ? 'text-[11.5px]' : zoomLevel <= 85 ? 'text-[9.5px]' : 'text-[10.5px]';

  const handleShortcutClick = (shortcut) => {
    setLastClickedId(shortcut.shortcut_id || shortcut.id);
    setTimeout(() => setLastClickedId(null), 250);

    const matchedProd = (products || []).find(p => String(p.id) === String(shortcut.product_id || shortcut.id)) || {};

    const product = {
      id: shortcut.product_id || shortcut.id,
      name: shortcut.name || shortcut.display_name || shortcut.label || matchedProd.name,
      price: shortcut.price || matchedProd.price,
      barcode: shortcut.barcode || matchedProd.barcode,
      stock: shortcut.stock_quantity ?? shortcut.stock ?? matchedProd.stock ?? matchedProd.stock_quantity ?? 999,
      is_weighted: Boolean(shortcut.is_weighted || matchedProd.is_weighted)
    };

    onSelectProduct(product);
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden select-none bg-transparent min-h-0 relative">
      
      {/* ══ HAUT : ARTICLES RAPIDES & RECHERCHE EN DIRECT (Aligné parfaitement avec PosHeader px-4) ══ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scrollbar-thin relative z-10">
        
        {/* ══ BLOC RECHERCHE EN DIRECT (Si du texte est saisi sur le clavier ou en haut) ══ */}
        {cleanQ.length > 0 && (
          <div className="shrink-0 bg-white rounded-xl p-2.5 border-2 border-blue-400 shadow-md">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-slate-800">
                  Résultats pour <span className="text-blue-600">"{searchQuery}"</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  {searchResults.length} article{searchResults.length > 1 ? 's' : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery && setSearchQuery('')}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Effacer
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                {searchResults.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      onSelectProduct(prod);
                      if (typeof setSearchQuery === 'function') setSearchQuery('');
                    }}
                    className="flex flex-col justify-between p-2 bg-white hover:bg-blue-50/70 rounded-xl border border-blue-200 transition-all cursor-pointer text-left rtl:text-right group active:scale-95 shadow-2xs"
                  >
                    <div className="w-full flex items-center justify-center py-0.5">
                      <ProductVisual id={prod.id} name={prod.name} className="w-10 h-10 object-contain" />
                    </div>
                    <div className="text-[11px] font-black text-slate-900 truncate w-full" title={prod.name}>
                      {prod.name}
                    </div>
                    <div className="mt-0.5 text-[11px] font-mono font-black text-emerald-600">
                      {Number(prod.price).toFixed(2)} {language === 'ar' ? 'د.ج' : 'DA'}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-slate-400">
                Aucun produit trouvé pour "{searchQuery}".
              </div>
            )}
          </div>
        )}

        {/* ══ 2. GRAND TABLEAU DES ARTICLES RAPIDES (TAILLE NATURELLE : RÉVÈLE LE FOND BLEU DÉGRADÉ ET SES VAGUES) ══ */}
        <div className="shrink-0 bg-white/95 rounded-2xl overflow-hidden shadow-sm border border-blue-200/60 relative z-10 w-full">

          {/* Bandeau d'en-tête bleu nuit royal */}
          <div className="shrink-0 bg-gradient-to-r from-[#071B48] via-[#0B2A70] to-[#0D388E] text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-cyan-300">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-xs sm:text-sm font-black tracking-wide text-white">
                {language === 'ar' ? 'السلع السريعة بدون باركود' : 'Articles Rapides (Sans Code-Barres)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-200 bg-[#132B66] px-2.5 py-0.5 rounded-lg border border-blue-400/30">
                {shortcuts.length} articles
              </span>

              <button
                type="button"
                onClick={() => setShowKeyboard(!showKeyboard)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#132B66] hover:bg-[#1C3E8A] text-white border border-blue-400/30 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <span>⌨️</span>
                <span>{showKeyboard ? (language === 'ar' ? 'إخفاء لوحة المفاتيح' : 'Masquer le clavier') : (language === 'ar' ? 'إظهار لوحة المفاتيح' : 'Afficher le clavier')}</span>
              </button>
            </div>
          </div>

          {/* Grille 6 colonnes × 2 lignes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 p-2.5 bg-slate-50/50">
            {shortcuts.map((sc, index) => {
              const pastelStyle = getPastelCardStyle(sc.label || sc.name, sc.color);
              const isClicked = lastClickedId === (sc.shortcut_id || sc.id);
              const matchedProd = (products || []).find(p => String(p.id) === String(sc.product_id || sc.id)) || sc;
              const costVal = matchedProd.buyPrice ?? matchedProd.purchasePrice ?? matchedProd.prix_achat ?? Math.round(Number(sc.price || 0) * 0.72);

              return (
                <button
                  key={sc.shortcut_id || sc.id || index}
                  type="button"
                  onClick={() => handleShortcutClick(sc)}
                  className={`relative flex flex-col justify-between p-2 rounded-xl border text-left rtl:text-right transition-all duration-150 cursor-pointer select-none group ${shortcutMinHeight} ${pastelStyle} ${
                    isClicked ? 'scale-95 ring-2 ring-blue-500 shadow-md' : 'hover:-translate-y-0.5 hover:shadow-md active:scale-95'
                  }`}
                >
                  {/* Badge Raccourci Clavier Alt+1..9 */}
                  {index < 9 && (
                    <span className="absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 text-[8.5px] font-mono font-black text-slate-600 bg-white/80 px-1 py-0.2 rounded-md border border-black/5 shadow-2xs">
                      Alt+{index + 1}
                    </span>
                  )}

                  {/* Visuel 3D Réaliste du Produit (Taille compacte optimisée) */}
                  <div className="w-full flex items-center justify-center py-0.5">
                    <ProductVisual
                      id={sc.id}
                      name={sc.label || sc.name}
                      className={`${visualSize} object-contain mx-auto transition-transform group-hover:scale-105`}
                    />
                  </div>

                  {/* Nom du produit */}
                  <div className={`${titleTextSize} font-black text-slate-900 text-center truncate w-full px-0.5 mb-0.5 leading-tight`} title={sc.label || sc.name}>
                    {sc.label || sc.name}
                  </div>

                  {/* Détails optionnels selon la personnalisation */}
                  {customization?.showCategory && matchedProd.category && (
                    <span className="text-[8px] font-bold text-slate-600 bg-white/70 px-1 py-0.2 rounded mx-auto truncate max-w-full">
                      {matchedProd.category}
                    </span>
                  )}

                  {customization?.showStorageLocation && (
                    <span className="text-[8px] font-mono text-slate-500 truncate text-center">
                      📍 {matchedProd.shelfLocation || matchedProd.location || 'Rayon Rapide'}
                    </span>
                  )}

                  {customization?.showDescription && (matchedProd.description || sc.name) && (
                    <span className="text-[8px] italic text-slate-500 line-clamp-1 text-center">
                      {matchedProd.description || sc.name}
                    </span>
                  )}

                  {/* Ligne inférieure : Prix DA à gauche & Bouton '+' bleu à droite */}
                  <div className="flex items-center justify-between w-full mt-auto pt-1 border-t border-black/5">
                    <div className="flex flex-col">
                      <span className={`${priceTextSize} font-mono font-black text-slate-950 bg-white/90 px-1.5 py-0.5 rounded-md border border-black/5 shadow-2xs leading-none`}>
                        {Number(sc.price || 0).toFixed(2)}{' '}
                        <span className="text-[7.5px] font-sans font-bold text-slate-600">{language === 'ar' ? 'د.ج' : 'DA'}</span>
                      </span>
                      {customization?.showCostPrice && (
                        <span className="text-[8px] font-mono font-bold text-emerald-700 mt-0.5">
                          P.A: {Number(costVal).toFixed(0)}
                        </span>
                      )}
                    </div>

                    <span className="w-5 h-5 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center font-black text-xs shadow-xs transition-transform active:scale-90">
                      +
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ MILIEU : CLAVIER VIRTUEL TACTILE PLEINE LARGEUR (SI OUVERT) ══ */}
      {showKeyboard && (
        <div className="shrink-0 px-2.5 pb-2 pt-1 relative z-20 w-full">
          <VirtualKeyboard
            activeText={searchQuery}
            matchCount={cleanQ.length > 0 ? searchResults.length : null}
            onClose={() => setShowKeyboard(false)}
            onKeyPress={(char) => {
              if (typeof setSearchQuery === 'function') {
                setSearchQuery((prev) => (prev || '') + char);
              }
            }}
            onDelete={() => {
              if (typeof setSearchQuery === 'function') {
                setSearchQuery((prev) => (prev ? prev.slice(0, -1) : ''));
              }
            }}
            onClear={() => {
              if (typeof setSearchQuery === 'function') {
                setSearchQuery('');
              }
            }}
            onEnter={() => {
              if (searchResults.length > 0) {
                onSelectProduct(searchResults[0]);
                if (typeof setSearchQuery === 'function') setSearchQuery('');
              } else if (searchQuery && typeof onBarcodeScan === 'function') {
                onBarcodeScan(searchQuery);
              }
            }}
          />
        </div>
      )}

      {/* ══ FOND VAGUES BLEUES DÉGRADÉ COMPLET (LE BLEU DÉGRADÉ DEMANDÉ QUI CONTIENT TOUTE LA PARTIE SANS COUPURE) ══ */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#EBF3FE] via-[#E2EEFD] to-[#CDE0FC]"
      >
        <div 
          className="absolute inset-x-0 bottom-0 h-80 sm:h-96 pointer-events-none bg-bottom bg-no-repeat opacity-95"
          style={{
            backgroundImage: "url('/img/bg_articles_rapides.png')",
            backgroundPosition: 'bottom center',
            backgroundSize: '100% 100%'
          }}
        />
      </div>

      {/* ══ BAS : BARRE D'ACTIONS AVEC FOND DÉGRADÉ VAGUES & RACCOURCIS (EXACTEMENT CONFORME À LA PHOTO DU CLIENT) ══ */}
      <div className="shrink-0 w-full relative z-20 select-none overflow-hidden px-4 py-2 border-t-2 border-cyan-400/80 shadow-[0_-4px_20px_rgba(6,182,212,0.4)] bg-gradient-to-r from-[#020B22] via-[#081F58] to-[#020B20]">
        
        {/* Vagues abstraites en arrière-plan du bandeau */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <svg className="w-full h-full object-cover opacity-60" viewBox="0 0 1000 100" preserveAspectRatio="none" fill="none">
            <path d="M0,100 C200,20 450,85 700,25 C850,-10 950,40 1000,10 L1000,100 Z" fill="url(#darkWaveGrad1)" />
            <path d="M0,100 C300,50 550,15 800,60 C900,80 970,30 1000,45 L1000,100 Z" fill="url(#darkWaveGrad2)" opacity="0.7" />
            <path d="M0,100 C150,70 380,30 600,65 C820,100 920,20 1000,30 L1000,100 Z" fill="url(#darkWaveGrad3)" opacity="0.4" />
            <defs>
              <linearGradient id="darkWaveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0D2E7A" />
                <stop offset="50%" stopColor="#1E4CB8" />
                <stop offset="100%" stopColor="#0B2668" />
              </linearGradient>
              <linearGradient id="darkWaveGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#1D4ED8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0C2B72" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="darkWaveGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#1E40AF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
          {/* Lueur néon cyan sous la bordure supérieure */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/90 to-transparent blur-[1px]" />
        </div>

        {/* LIGNE 1 : Pilules d'actions avec Pastilles Colorées Conformes à la Photo */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1.5 relative z-10">
          {/* ● Annuler F4 */}
          <button
            type="button"
            onClick={onClearTicket}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all text-xs font-black cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap hover:text-white"
            title="Annuler la vente en cours (F4)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
            <span>Annuler <span className="font-mono text-[10px] text-rose-300 font-bold ml-0.5">F4</span></span>
          </button>

          {/* ● Attente F2 */}
          <button
            type="button"
            onClick={onSuspendTicket}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-black cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap hover:text-white"
            title="Mettre le ticket en attente (F2)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
            <span>Attente <span className="font-mono text-[10px] text-amber-300 font-bold ml-0.5">F2</span></span>
          </button>

          {/* ● Historique F3 */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-300 hover:bg-blue-500/25 transition-all text-xs font-black cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap hover:text-white"
            title="Historique des ventes"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-2xs" />
            <span>Historique <span className="font-mono text-[10px] text-blue-300 font-bold ml-0.5">F3</span></span>
          </button>

          {/* ● Brouillon F3 avec BADGE ROUGE SI EN ATTENTE */}
          <button
            type="button"
            onClick={onOpenDrafts}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-all text-xs font-black cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap hover:text-white"
            title="Tickets suspendus / Brouillons (F3)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-2xs" />
            <span>Brouillon <span className="font-mono text-[10px] text-emerald-300 font-bold ml-0.5">F3</span></span>
            {Number(suspendedTicketsCount) > 0 && (
              <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {suspendedTicketsCount}
              </span>
            )}
          </button>

          {/* ● Mode Retour Vente */}
          {onToggleReturnMode && (
            <button
              type="button"
              onClick={onToggleReturnMode}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all text-xs font-black cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap ${
                isReturnMode
                  ? 'bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-600/40 ring-2 ring-rose-300 animate-pulse'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25 hover:text-white'
              }`}
              title="Basculer en Mode Retour marchandise / Remboursement client"
            >
              <span className={`w-2.5 h-2.5 rounded-full shadow-2xs ${isReturnMode ? 'bg-white' : 'bg-rose-500'}`} />
              <span>{isReturnMode ? 'MODE RETOUR ACTIF ⚠️' : 'Retour Vente'}</span>
            </button>
          )}

          {/* Séparateur vertical */}
          <span className="text-white/25 select-none font-light">|</span>

          {/* ● Ticket ON/OFF F5 */}
          <button
            type="button"
            onClick={onToggleAutoPrint}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all text-xs font-black cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap ${
              isAutoPrintEnabled
                ? 'bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/30 hover:text-white'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
            title="Impression automatique du ticket (F5)"
          >
            <span className={`w-2.5 h-2.5 rounded-full shadow-2xs ${isAutoPrintEnabled ? 'bg-blue-400' : 'bg-slate-500'}`} />
            <span>Ticket {isAutoPrintEnabled ? 'ON' : 'OFF'} <span className="font-mono text-[10px] opacity-80 ml-0.5">F5</span></span>
          </button>
        </div>

        {/* LIGNE 2 : Boutons Raccourcis Clavier Demandés (F7 Recherche, F1 Valider, F4 Vider, F5 Ticket, F6 Favoris, F11 Client) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1.5 border-t border-white/10 relative z-10">
          <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 text-xs shrink-0 shadow-2xs">
            ⌨️
          </div>

          {/* F7 Recherche de produit par nom */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('novamag_focus_search'));
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-sky-400/40 text-sky-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Recherche de produit par nom (F7)"
          >
            <kbd className="px-1.5 py-0.2 bg-sky-500/30 text-sky-300 font-mono font-black text-[10px] rounded border border-sky-400/40 shadow-3xs">
              F7
            </kbd>
            <span className="text-white font-black">Recherche produit</span>
          </button>

          {/* F1 Règlement / Valider la vente */}
          <button
            type="button"
            onClick={onOpenPayment}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-blue-400/40 text-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Règlement / Valider la vente (F1)"
          >
            <kbd className="px-1.5 py-0.2 bg-blue-500/30 text-cyan-300 font-mono font-black text-[10px] rounded border border-blue-400/40 shadow-3xs">
              F1
            </kbd>
            <span className="text-white font-black">Valider la vente</span>
          </button>

          {/* F4 Vider le panier / la caisse */}
          <button
            type="button"
            onClick={onClearTicket}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-rose-400/40 text-rose-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Vider le panier / la caisse (F4)"
          >
            <kbd className="px-1.5 py-0.2 bg-rose-500/30 text-rose-300 font-mono font-black text-[10px] rounded border border-rose-400/40 shadow-3xs">
              F4
            </kbd>
            <span className="text-white font-black">Vider le panier</span>
          </button>

          {/* F11 Sélectionner un client (Remplace F5 Ticket OFF dans la 2ème ligne) */}
          <button
            type="button"
            onClick={() => {
              if (typeof onOpenCustomerModal === 'function') {
                onOpenCustomerModal();
              } else {
                window.dispatchEvent(new CustomEvent('novamag_open_customer'));
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-purple-400/40 text-purple-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Sélectionner un client (F11)"
          >
            <kbd className="px-1.5 py-0.2 bg-purple-500/30 text-purple-300 font-mono font-black text-[10px] rounded border border-purple-400/40 shadow-3xs">
              F11
            </kbd>
            <span className="text-white font-black">Sélectionner client</span>
          </button>

          {/* Mode Retour Vente */}
          {onToggleReturnMode && (
            <button
              type="button"
              onClick={onToggleReturnMode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 ${
                isReturnMode
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 border-rose-400/40 text-rose-200'
              }`}
              title="Basculer Mode Retour Vente"
            >
              <span className="text-xs">🔄</span>
              <span className="text-white font-black">{isReturnMode ? 'Mode Retour Actif' : 'Retour Vente'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

