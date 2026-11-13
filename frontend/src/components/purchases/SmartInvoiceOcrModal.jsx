import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  Barcode,
  Package,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  X,
  Clock,
  Eye,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

// Données factices pré-scannées pour la simulation OCR
const SAMPLE_OCR_INVOICES = [
  {
    id: 'sample-candia',
    supplierName: 'Candia Laiterie Algérie',
    supplierId: 3,
    invoiceNumber: 'FAC-2026-7841',
    date: new Date().toISOString().split('T')[0],
    items: [
      {
        tempId: 'item-1',
        name: 'Lait Candia Silhouette 1L (Pack 6)',
        barcode: '6131112223334',
        quantity: 30,
        buyPrice: 110,
        category: 'frais',
        suggestedSellPrice: 135,
        matchId: 101, // Produit existant dans le catalogue
        isKnown: true
      },
      {
        tempId: 'item-2',
        name: 'Fromage Portion La Vache Qui Rit 16P',
        barcode: '6134445556667',
        quantity: 50,
        buyPrice: 240,
        category: 'frais',
        suggestedSellPrice: 280,
        matchId: 102, // Produit existant
        isKnown: true
      },
      {
        tempId: 'item-3',
        name: 'Yaourt Brassé Danone Fraise 110g',
        barcode: '6139998887771',
        quantity: 120,
        buyPrice: 38,
        category: 'frais',
        suggestedSellPrice: 50,
        matchId: null, // Produit INCONNU au départ
        isKnown: false
      },
      {
        tempId: 'item-4',
        name: 'Beurre Doux Pasteurisé Safina 200g',
        barcode: '6135551112229',
        quantity: 40,
        buyPrice: 290,
        category: 'frais',
        suggestedSellPrice: 340,
        matchId: null, // Produit INCONNU au départ
        isKnown: false
      }
    ]
  },
  {
    id: 'sample-pos',
    supplierName: 'Xprinter Algérie Officiel',
    supplierId: 2,
    invoiceNumber: 'XP-INV-9920',
    date: new Date().toISOString().split('T')[0],
    items: [
      {
        tempId: 'xp-1',
        name: 'Imprimante Thermique Xprinter XP-N160II',
        barcode: '200100100010',
        quantity: 5,
        buyPrice: 12500,
        category: 'periph',
        suggestedSellPrice: 15500,
        matchId: 1,
        isKnown: true
      },
      {
        tempId: 'xp-2',
        name: 'Rouleau Thermique 80x80 Haute Densité (Pack 50)',
        barcode: '200100200020',
        quantity: 20,
        buyPrice: 3200,
        category: 'periph',
        suggestedSellPrice: 4200,
        matchId: null, // Produit INCONNU
        isKnown: false
      }
    ]
  }
];

export default function SmartInvoiceOcrModal({
  isOpen,
  onClose,
  onSaveInvoice,
  catalogProducts = [],
  suppliersList = []
}) {
  const { language } = useLanguage();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  // Étape : 'upload' -> 'scanning' -> 'validation'
  const [step, setStep] = useState('upload');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepMessage, setScanStepMessage] = useState('');
  
  // Facture détectée
  const [detectedSupplier, setDetectedSupplier] = useState('');
  const [detectedInvoiceNumber, setDetectedInvoiceNumber] = useState('');
  const [detectedDate, setDetectedDate] = useState('');
  const [detectedItems, setDetectedItems] = useState([]);
  
  // Modal de création rapide du produit inconnu
  const [editingItem, setEditingItem] = useState(null);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    barcode: '',
    category: 'frais',
    buyPrice: 0,
    sellPrice: 0,
    quantity: 1,
    alertStock: 5
  });

  // Réinitialiser à l'ouverture pour être prêt à déposer un fichier
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setScanProgress(0);
      setEditingItem(null);
      setSelectedFileName('');
    }
  }, [isOpen]);

  // Lancement du scan lorsqu'une facture est déposée ou sélectionnée
  const handleStartScan = (fileName) => {
    if (fileName) {
      setSelectedFileName(fileName);
    }
    setStep('scanning');
    setScanProgress(25);
    setScanStepMessage('Numérisation et lecture optique du document...');
    setEditingItem(null);

    const sample = SAMPLE_OCR_INVOICES[0];

    // Vérifier les correspondances avec le catalogue actuel de NovaMag
    const enrichedItems = sample.items.map((item) => {
      const match = (catalogProducts || []).find(
        (p) => (p.barcode && p.barcode === item.barcode) ||
               (p.name && p.name.toLowerCase() === item.name.toLowerCase())
      );
      if (match) {
        return {
          ...item,
          isKnown: true,
          matchId: match.id,
          name: match.name,
          currentStock: match.stock || 0
        };
      }
      return {
        ...item,
        isKnown: Boolean(item.isKnown),
        currentStock: 0
      };
    });

    setTimeout(() => {
      setScanProgress(65);
      setScanStepMessage('Extraction optique des articles, codes-barres & montants...');
    }, 400);

    setTimeout(() => {
      setScanProgress(95);
      setScanStepMessage('Croisement automatique avec la base de stock NovaMag...');
    }, 800);

    setTimeout(() => {
      setScanProgress(100);
      setDetectedSupplier(sample.supplierName);
      setDetectedInvoiceNumber(sample.invoiceNumber);
      setDetectedDate(sample.date);
      setDetectedItems(enrichedItems);
      setStep('validation');
    }, 1100);
  };

  // Ouvrir le formulaire de création de produit pour un article inconnu
  const handleOpenCreateProduct = (item) => {
    setEditingItem(item);
    setNewItemForm({
      name: item.name || '',
      barcode: item.barcode || `INV-${Date.now().toString().slice(-6)}`,
      category: item.category || 'frais',
      buyPrice: Number(item.buyPrice) || 0,
      sellPrice: Number(item.suggestedSellPrice) || Math.round((Number(item.buyPrice) || 0) * 1.3),
      quantity: Number(item.quantity) || 1,
      alertStock: 5
    });
  };

  // Enregistrer le produit nouvellement créé
  const handleSaveNewProduct = (e) => {
    e?.preventDefault();
    if (!editingItem) return;

    // Créer le produit dans localStorage novamag_products
    try {
      const savedProducts = localStorage.getItem('novamag_products');
      const currentList = savedProducts ? JSON.parse(savedProducts) : catalogProducts;
      
      const newProd = {
        id: Date.now(),
        name: newItemForm.name.trim(),
        barcode: newItemForm.barcode.trim(),
        category: newItemForm.category,
        buy_price: Number(newItemForm.buyPrice),
        buyPrice: Number(newItemForm.buyPrice),
        price: Number(newItemForm.sellPrice),
        sale_price: Number(newItemForm.sellPrice),
        stock: 0, // Sera incrémenté lors de la validation finale de la facture
        alert_stock: Number(newItemForm.alertStock),
        alertStock: Number(newItemForm.alertStock),
        isFavorite: false
      };

      const updatedCatalog = [newProd, ...currentList];
      localStorage.setItem('novamag_products', JSON.stringify(updatedCatalog));
      try {
        window.dispatchEvent(new Event('novamag_products_updated'));
      } catch {}

      // Mettre à jour l'article dans la liste scannée pour le marquer comme connu ✅
      setDetectedItems((prev) =>
        prev.map((it) => {
          if (it.tempId === editingItem.tempId) {
            return {
              ...it,
              name: newProd.name,
              barcode: newProd.barcode,
              buyPrice: newProd.buyPrice,
              suggestedSellPrice: newProd.price,
              isKnown: true,
              matchId: newProd.id,
              currentStock: 0
            };
          }
          return it;
        })
      );

      setEditingItem(null);
    } catch (err) {
      console.error('Erreur lors de la création du produit :', err);
    }
  };

  // Nombre d'articles inconnus restants
  const unknownCount = detectedItems.filter((it) => !it.isKnown).length;
  const isAllKnown = detectedItems.length > 0 && unknownCount === 0;

  // Calculs totaux
  const subtotalHT = detectedItems.reduce(
    (acc, it) => acc + (Number(it.buyPrice) || 0) * (Number(it.quantity) || 0),
    0
  );
  const taxAmount = Math.round(subtotalHT * 0.19); // TVA standard 19%
  const totalTTC = subtotalHT + taxAmount;

  // Validation finale de la facture d'achat
  const handleFinalValidate = () => {
    if (!isAllKnown) return;

    // Trouver le fournisseur correspondant
    const matchedSup = (suppliersList || []).find(
      (s) => s.name && s.name.toLowerCase() === detectedSupplier.toLowerCase()
    ) || { id: 99, name: detectedSupplier };

    // Structure facture d'achat
    const newInvoice = {
      id: Date.now(),
      invoiceNumber: detectedInvoiceNumber,
      supplierId: matchedSup.id,
      supplierName: detectedSupplier,
      date: detectedDate || new Date().toISOString().split('T')[0],
      totalAmount: totalTTC,
      subtotalHT: subtotalHT,
      taxAmount: taxAmount,
      shippingCost: 0,
      amountPaid: totalTTC,
      paymentMethod: 'Espèces',
      status: 'Payée',
      notes: 'Généré automatiquement par Nova OCR ✨',
      items: detectedItems.map((it) => ({
        productId: it.matchId || Date.now(),
        productName: it.name,
        barcode: it.barcode,
        quantity: Number(it.quantity),
        buyPrice: Number(it.buyPrice),
        total: Number(it.buyPrice) * Number(it.quantity)
      }))
    };

    if (onSaveInvoice) {
      onSaveInvoice(newInvoice);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111C35] w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ── EN-TÊTE DU MODAL ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-violet-50/50 via-purple-50/20 to-transparent dark:from-violet-950/20 dark:via-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Scan Intelligent des Factures
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  Nova OCR IA ✨
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Extraction optique automatique & Réconciliation intelligente du stock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── CONTENU DU MODAL ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* ÉTAPE 1 : ZONE DE DÉPÔT / UPLOAD DE FACTURE */}
          {step === 'upload' && (
            <div className="space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleStartScan(file.name);
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer?.files?.[0];
                  if (file) handleStartScan(file.name);
                  else handleStartScan();
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed ${
                  isDragging
                    ? 'border-violet-600 bg-violet-100/60 dark:bg-violet-900/40 scale-[1.01]'
                    : 'border-violet-300 dark:border-violet-700/60 hover:border-violet-500 bg-violet-50/40 dark:bg-violet-950/10'
                } rounded-2xl p-8 sm:p-10 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer`}
              >
                <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-inner">
                  <Camera className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Déposez une photo ou un fichier de facture d'achat
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                    Glissez-déposez ici votre facture (JPG, PNG, PDF) ou cliquez pour parcourir vos fichiers. L'IA extraira automatiquement tous les articles et montants.
                  </p>
                </div>

                {/* Bouton unique pour parcourir */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/20 active:scale-95 transition-all cursor-pointer mt-2"
                >
                  <UploadCloud className="w-4 h-4 text-amber-300" />
                  <span>Choisir un fichier ou Scanner la Facture ✨</span>
                </button>
              </div>

              {/* Guide des fonctionnalités IA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Articles Connus</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Reconnus automatiquement via code-barres ou libellé et prêts à être incrémentés en stock.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Articles Inconnus</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Détection des nouveaux articles avec fiche pré-remplie en 1 clic pour éviter la double saisie.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <Zap className="w-4 h-4" />
                    <span>Zéro Erreur</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Validation bloquée tant qu'un article n'est pas répertorié pour garantir un stock parfait.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : SCANNING EN COURS (ANIMATION) */}
          {step === 'scanning' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-5">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 opacity-20 animate-ping" />
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
                  <Camera className="w-10 h-10 animate-pulse text-amber-300" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                  <span>Analyse IA en cours</span>
                  <span className="text-violet-600 dark:text-violet-400">{scanProgress}%</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {scanStepMessage}
                </p>
              </div>

              {/* Barre de progression */}
              <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : TABLEAU DE VALIDATION & RÉCONCILIATION */}
          {step === 'validation' && (
            <div className="space-y-5">
              
              {/* Bandeau d'informations détectées */}
              <div className="bg-slate-50 dark:bg-[#0B1120] rounded-xl p-4 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Fournisseur Détecté</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <span className="truncate">{detectedSupplier}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">N° Facture</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{detectedInvoiceNumber}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Date de Facture</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{detectedDate}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Statut Réconciliation</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isAllKnown ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        <Check className="w-3 h-3 stroke-[3]" /> 100% Vérifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="w-3 h-3" /> {unknownCount} Inconnu(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message d'avertissement si des articles inconnus restent */}
              {!isAllKnown && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      Articles non répertoriés détectés sur la facture ({unknownCount})
                    </span>
                    <p className="text-amber-700 dark:text-amber-300/90 mt-0.5">
                      Veuillez cliquer sur <strong className="underline">[+ Créer le produit]</strong> sur chaque ligne surlignée pour pré-remplir et enregistrer l'article dans votre catalogue. La validation de la facture sera ensuite débloquée.
                    </p>
                  </div>
                </div>
              )}

              {/* Tableau des Articles Détectés */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold">
                        <th className="py-2.5 px-3">Statut IA</th>
                        <th className="py-2.5 px-3">Désignation Détectée</th>
                        <th className="py-2.5 px-3">Code-barres</th>
                        <th className="py-2.5 px-3 text-center">Quantité</th>
                        <th className="py-2.5 px-3 text-right">P. Achat HT</th>
                        <th className="py-2.5 px-3 text-right">Total HT</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {detectedItems.map((item) => (
                        <tr
                          key={item.tempId}
                          className={`transition-colors ${
                            item.isKnown
                              ? 'bg-white dark:bg-[#111C35] hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                              : 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          }`}
                        >
                          {/* Statut Badge */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {item.isKnown ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Prêt à être ajouté</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Article Inconnu ⚠️</span>
                              </span>
                            )}
                          </td>

                          {/* Nom de l'article */}
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100 max-w-[220px] truncate">
                            {item.name}
                          </td>

                          {/* Code-barres */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {item.barcode || '—'}
                          </td>

                          {/* Quantité */}
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                            {item.quantity}
                          </td>

                          {/* Prix d'Achat unitaire */}
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-200">
                            {Number(item.buyPrice).toLocaleString()} DA
                          </td>

                          {/* Total HT */}
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                            {(Number(item.buyPrice) * Number(item.quantity)).toLocaleString()} DA
                          </td>

                          {/* Action : Bouton Créer ou Statut OK */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {item.isKnown ? (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> En stock
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenCreateProduct(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xs active:scale-95 transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Créer le produit</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux & Résumé financier */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total articles : <strong>{detectedItems.length}</strong> • Reconnus : <strong className="text-emerald-600">{detectedItems.filter((i) => i.isKnown).length}</strong>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="text-slate-600 dark:text-slate-300">
                    Sous-total HT : <span className="font-mono">{subtotalHT.toLocaleString()} DA</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    TVA (19%) : <span className="font-mono">{taxAmount.toLocaleString()} DA</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                    Total TTC : <span className="text-emerald-600 dark:text-emerald-400 font-mono">{totalTTC.toLocaleString()} DA</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ── PIED DU MODAL / ACTIONS ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E172B] flex items-center justify-between gap-3">
          {step === 'validation' && (
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Déposer une autre facture</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>

            {step === 'validation' && (
              <button
                type="button"
                disabled={!isAllKnown}
                onClick={handleFinalValidate}
                title={!isAllKnown ? 'Veuillez d\'abord créer tous les articles inconnus' : 'Enregistrer la facture et mettre à jour le stock'}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black shadow-md transition-all ${
                  isAllKnown
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/25 cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-70'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isAllKnown
                    ? 'Valider la Facture d\'Achat ✨'
                    : `Bloqué (${unknownCount} article(s) à créer)`}
                </span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── SOUS-MODAL : CRÉATION RAPIDE DU PRODUIT INCONNU (AUTO-FILL) ── */}
      {editingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111C35] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">
                    Création Rapide de Produit (Auto-fill IA)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Données pré-remplies d'après la facture scannée
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                  Nom du Produit
                </label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                    Code-barres
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemForm.barcode}
                    onChange={(e) => setNewItemForm({ ...newItemForm, barcode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                    Rayon / Catégorie
                  </label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="frais">Alimentation & Frais</option>
                    <option value="periph">Périphériques & Matériel</option>
                    <option value="info">Informatique & Électronique</option>
                    <option value="epicerie">Épicerie & Boissons</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                    Prix d'Achat HT (DA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newItemForm.buyPrice}
                    onChange={(e) => {
                      const bp = Number(e.target.value);
                      setNewItemForm({
                        ...newItemForm,
                        buyPrice: bp,
                        sellPrice: Math.round(bp * 1.3)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                    Prix de Vente Conseillé (DA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newItemForm.sellPrice}
                    onChange={(e) => setNewItemForm({ ...newItemForm, sellPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 flex items-center gap-2 text-[11px] text-violet-700 dark:text-violet-300">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Quantité facturée : <strong>{editingItem.quantity} unité(s)</strong> (sera ajoutée au stock à la validation finale).
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  Valider & Enregistrer le Produit
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
