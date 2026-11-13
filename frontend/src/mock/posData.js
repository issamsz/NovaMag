export const MOCK_CATEGORIES = [
  { id: 'all', name: 'Tous les rayons' },
  { id: 'packs', name: 'Packs & Lots' },
  { id: 'info', name: 'Matériel Informatique' },
  { id: 'periph', name: 'Périphériques Caisse' },
  { id: 'laitiers', name: 'Produits Laitiers & Fromages' },
  { id: 'boissons', name: 'Boissons & Jus' },
  { id: 'epicerie', name: 'Épicerie Générale' },
  { id: 'fruits', name: 'Fruits & Légumes (Balance)' },
  { id: 'boucherie', name: 'Boucherie & Fromagerie' },
  { id: 'boulangerie', name: 'Boulangerie & Vrac' },
  { id: 'nettoyage', name: 'Kit Nétoyage' }
];

export const MOCK_CUSTOMERS = [
  { id: 1, name: 'Client Comptoir (Passager)', phone: '0550 00 00 00', balance: 0, debt: 0, total: 10000, paid: 10000, openInvoicesCount: 0, status: 'À jour' },
  { id: 2, name: 'Hamid Supérette & Cafétéria', phone: '0661 12 34 56', balance: -4200, debt: 4200, total: 7200, paid: 3000, openInvoicesCount: 1, status: 'Récent' },
  { id: 3, name: 'Sarl IT Solutions Algérie', phone: '023 45 67 89', balance: 0, debt: 0, total: 45000, paid: 45000, openInvoicesCount: 0, status: 'À jour' },
  { id: 4, name: 'Karim Voisin (Crédit)', phone: '0770 98 76 54', balance: -1250, debt: 1250, total: 5200, paid: 3950, openInvoicesCount: 1, status: 'En cours' }
];

export const MOCK_SUPPLIERS = [
  {
    id: 1,
    name: 'Xprinter Algérie Officiel',
    company: 'Xprinter Algérie Officiel',
    phone: '0987 65 43 23',
    address: 'Oran, Es-Sénia',
    totalPurchases: 280000,
    total: 280000,
    paid: 155000,
    debt: 125000,
    openInvoicesCount: 2,
    dueDate: '15/12/2026'
  },
  {
    id: 2,
    name: 'Candia Laiterie Algérie',
    company: 'Candia Laiterie Algérie',
    phone: '025 88 99 00',
    address: 'Blida, Boufarik',
    totalPurchases: 195000,
    total: 195000,
    paid: 148000,
    debt: 47000,
    openInvoicesCount: 1,
    dueDate: '30/11/2026'
  },
  {
    id: 3,
    name: 'Grossiste Matériel & POS Algérie',
    company: 'Grossiste Matériel & POS Algérie',
    phone: '0550 00 00 01',
    address: 'Sétif, Centre Ville',
    totalPurchases: 450000,
    total: 450000,
    paid: 450000,
    debt: 0,
    openInvoicesCount: 0,
    dueDate: '-'
  },
  {
    id: 4,
    name: 'Distributeur Boissons Hamoud Boualem',
    company: 'Distributeur Boissons Hamoud Boualem',
    phone: '021 65 43 21',
    address: 'Alger, Rouïba',
    totalPurchases: 320000,
    total: 320000,
    paid: 320000,
    debt: 0,
    openInvoicesCount: 0,
    dueDate: '-'
  }
];

export const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'PC Portable Dell Vostro 15 (Core i5 8Go)',
    category: 'info',
    price: 39800.0,
    costPrice: 36000.0,
    buyPrice: 36000.0,
    stock: 12,
    unit: '1 pièce',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=300&q=80',
    iconText: '💻',
    isFavorite: true,
    barcode: '202611157366'
  },
  {
    id: 2,
    name: 'Souris & Clavier Sans Fil Logitech MK270 Pro',
    category: 'periph',
    price: 2000.0,
    costPrice: 1500.0,
    buyPrice: 1500.0,
    stock: 30,
    unit: '1 kit complet',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80',
    iconText: '⌨️',
    isFavorite: true,
    barcode: '202634359005'
  },
  {
    id: 101,
    name: 'Lecteur Code-barres USB Sans Fil',
    category: 'periph',
    price: 12000.0,
    costPrice: 9000.0,
    buyPrice: 9000.0,
    stock: 15,
    unit: '1 pièce',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80',
    iconText: '📷',
    isFavorite: true,
    barcode: '6130001001',
    batches: [
      {
        id: 'batch-1-old',
        batchNumber: 'LOT-2026-001 (Ancien)',
        buyPrice: 9000,
        sellPrice: 12000,
        quantity: 5,
        barcode: '6130001001-L1',
        receivedAt: '2026-01-10'
      },
      {
        id: 'batch-2-new',
        batchNumber: 'LOT-2026-002 (Nouveau)',
        buyPrice: 10500,
        sellPrice: 13000,
        quantity: 10,
        barcode: '6130001001-L2',
        receivedAt: '2026-02-15'
      }
    ]
  },
  {
    id: 3,
    name: 'Support Col de Cygne pour Lecteur',
    category: 'periph',
    price: 1900.0,
    stock: 3,
    alertStock: 5,
    unit: '1 pièce',
    isLowStock: true,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=300&q=80',
    iconText: '🎙️',
    isFavorite: false,
    barcode: '6130001003'
  },
  {
    id: 17,
    name: 'Tiroir-Caisse Métallique RJ11 Pro',
    category: 'periph',
    price: 8500.0,
    stock: 0,
    alertStock: 3,
    unit: '1 pièce',
    isOutOfStock: true,
    image: 'https://images.unsplash.com/photo-1556742049-0a67e557224b?auto=format&fit=crop&w=300&q=80',
    iconText: '🔒',
    isFavorite: false,
    barcode: '6130001017'
  },
  {
    id: 18,
    name: 'Yaourt Nature Brassé (Pack de 4)',
    category: 'frais',
    price: 180.0,
    stock: 12,
    alertStock: 5,
    expiryDate: '2026-10-28', // Dépassé (🔴 Rouge)
    unit: '1 pack',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80',
    iconText: '🥣',
    isFavorite: true,
    barcode: '6130001018'
  },
  {
    id: 19,
    name: 'Fromage Frais Fondu 16 Portions',
    category: 'frais',
    price: 320.0,
    stock: 4,
    alertStock: 6,
    expiryDate: '2026-11-06', // Proche dans 4 jours (🟠 Orange)
    unit: '1 boîte',
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=300&q=80',
    iconText: '🧀',
    isFavorite: true,
    barcode: '6130001019'
  },
  {
    id: 20,
    name: 'Pommes Golden d\'Algérie (au Poids)',
    category: 'frais',
    price: 300.0,
    stock: 85,
    alertStock: 15,
    unit: '1 kg',
    unitType: 'kg',
    isWeighted: true,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80',
    iconText: '🍏',
    isFavorite: true,
    barcode: '6130001020'
  },
  {
    id: 21,
    name: 'Bananes Douces Importées (au Poids)',
    category: 'frais',
    price: 450.0,
    stock: 120,
    alertStock: 20,
    unit: '1 kg',
    unitType: 'kg',
    isWeighted: true,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=300&q=80',
    iconText: '🍌',
    isFavorite: true,
    barcode: '6130001021'
  },
  {
    id: 4,
    name: 'Mini PC Caisse i3 4Go 128Go SSD',
    category: 'info',
    price: 26000.0,
    stock: 8,
    unit: '1 unité',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=300&q=80',
    iconText: '🖥️',
    isFavorite: true,
    barcode: '6130001004'
  },
  {
    id: 5,
    name: 'Unité Caisse 4Gen 8Go 128Go SSD',
    category: 'info',
    price: 25000.0,
    stock: 12,
    unit: '1 unité',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=300&q=80',
    iconText: '💻',
    isFavorite: false,
    barcode: '6130001005'
  },
  {
    id: 6,
    name: 'Station POS Pro 4Gen 8Go 128Go',
    category: 'info',
    price: 29000.0,
    stock: 19,
    unit: '1 unité',
    image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=300&q=80',
    iconText: '🖳',
    isFavorite: false,
    barcode: '6130001006'
  },
  {
    id: 7,
    name: 'Abonnement Cloud NovaMag Pro (1 An)',
    category: 'logiciel',
    price: 7500.0,
    stock: 96,
    unit: 'Licence 1 an',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=80',
    iconText: '☁️',
    isFavorite: true,
    barcode: '6130001007'
  },
  {
    id: 8,
    name: 'Licence Logiciel NovaMag POS Standard',
    category: 'logiciel',
    price: 12000.0,
    stock: 95,
    unit: 'Licence à vie',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80',
    iconText: '💿',
    isFavorite: false,
    barcode: '6130001008'
  },
  {
    id: 9,
    name: 'Écran Client Tactile 15.6" LED',
    category: 'periph',
    price: 11000.0,
    stock: 99,
    unit: '1 écran',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=300&q=80',
    iconText: '📺',
    isFavorite: false,
    barcode: '6130001009'
  },
  {
    id: 10,
    name: 'Imprimante Ticket Thermique 80mm USB',
    category: 'periph',
    price: 15500.0,
    stock: 17,
    unit: '1 imprimante',
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=300&q=80',
    iconText: '🧾',
    isFavorite: true,
    barcode: '6130001010'
  },
  {
    id: 11,
    name: 'Scanner Fixe Encastrable Omnidirectionnel',
    category: 'periph',
    price: 12000.0,
    stock: 14,
    unit: '1 pièce',
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=300&q=80',
    iconText: '⚡',
    isFavorite: false,
    barcode: '6130001011'
  },
  {
    id: 12,
    name: 'Pain Baguette Traditionnelle',
    category: 'frais',
    price: 15.0,
    stock: 150,
    unit: '1 pièce',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
    iconText: '🥖',
    isFavorite: true,
    barcode: 'NB-PAIN'
  },
  {
    id: 13,
    name: 'Lait Pasteurisé en Sachet 1L',
    category: 'frais',
    price: 25.0,
    stock: 80,
    unit: '1 sachet',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80',
    iconText: '🥛',
    isFavorite: true,
    barcode: 'NB-LAIT'
  },
  {
    id: 14,
    name: 'Plateau d\'Œufs Frais (30 pièces)',
    category: 'frais',
    price: 650.0,
    stock: 40,
    unit: '1 plateau',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=300&q=80',
    iconText: '🥚',
    isFavorite: true,
    barcode: 'NB-OEUF'
  },
  {
    id: 15,
    name: 'Bouteille d\'Eau Minérale 1.5L',
    category: 'frais',
    price: 35.0,
    stock: 220,
    unit: '1 bouteille',
    image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=300&q=80',
    iconText: '💧',
    isFavorite: true,
    barcode: 'NB-EAU'
  },
  {
    id: 16,
    name: 'Sachet Plastique Caisse Renforcé',
    category: 'frais',
    price: 10.0,
    stock: 500,
    unit: '1 pièce',
    image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=300&q=80',
    iconText: '🛍️',
    isFavorite: true,
    barcode: 'NB-SACHET'
  }
];

export const INITIAL_TICKET_ITEMS = [];

export const MOCK_INVOICES = [
  {
    id: 105,
    invoiceNumber: 'FAC-2026-0045',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    dateStr: '04/11/2026 à 14:52:10',
    customer: 'Client Comptoir (Passager)',
    customerPhone: '0550 00 00 00',
    cashier: 'Admin (Caisse 1)',
    paymentMethod: 'especes',
    amountPaid: 10000.0,
    change: 2000.0,
    total: 8000.0,
    subtotal: 8000.0,
    items: [
      { id: 1, name: 'Lecteur Code-barres USB Sans Fil', quantity: 1, price: 6000.0, barcode: '6130001001' },
      { id: 2, name: 'Pack Clavier + Souris Sans Fil', quantity: 1, price: 2000.0, barcode: '6130001002' }
    ]
  },
  {
    id: 104,
    invoiceNumber: 'FAC-2026-0044',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    dateStr: '04/11/2026 à 14:30:15',
    customer: 'Hamid Supérette & Cafétéria',
    customerPhone: '0661 12 34 56',
    cashier: 'Admin (Caisse 1)',
    paymentMethod: 'especes',
    amountPaid: 1000.0,
    change: 140.0,
    total: 860.0,
    subtotal: 860.0,
    items: [
      { id: 18, name: 'Yaourt Nature Brassé (Pack de 4)', quantity: 3, price: 180.0, barcode: '6130001018' },
      { id: 19, name: 'Fromage Frais Traditionnel 500g', quantity: 1, price: 320.0, barcode: '6130001019' }
    ]
  },
  {
    id: 103,
    invoiceNumber: 'FAC-2026-0043',
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    dateStr: '04/11/2026 à 13:40:02',
    customer: 'Client Comptoir (Passager)',
    customerPhone: '0550 00 00 00',
    cashier: 'Admin (Caisse 1)',
    paymentMethod: 'carte',
    amountPaid: 8500.0,
    change: 0.0,
    total: 8500.0,
    subtotal: 8500.0,
    items: [
      { id: 17, name: 'Tiroir-Caisse Métallique RJ11 Pro', quantity: 1, price: 8500.0, barcode: '6130001017' }
    ]
  },
  {
    id: 102,
    invoiceNumber: 'FAC-2026-0042',
    timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    dateStr: '04/11/2026 à 12:25:40',
    customer: 'Sarl IT Solutions Algérie',
    customerPhone: '023 45 67 89',
    cashier: 'Admin (Caisse 1)',
    paymentMethod: 'especes',
    amountPaid: 20000.0,
    change: 2200.0,
    total: 17800.0,
    subtotal: 17800.0,
    items: [
      { id: 1, name: 'Lecteur Code-barres USB Sans Fil', quantity: 2, price: 6000.0, barcode: '6130001001' },
      { id: 3, name: 'Support Col de Cygne pour Lecteur', quantity: 2, price: 1900.0, barcode: '6130001003' },
      { id: 2, name: 'Pack Clavier + Souris Sans Fil', quantity: 1, price: 2000.0, barcode: '6130001002' }
    ]
  }
];

/**
 * Normalise et remplace automatiquement les noms temporaires ou génériques (ex: 'produit1', 'produit2')
 * par de véritables produits commerciaux réels et professionnels.
 */
export function sanitizeProductsWithRealNames(productsList) {
  if (!Array.isArray(productsList)) return productsList;
  return productsList.map((p, idx) => {
    const rawName = (p.name || '').trim();
    const lower = rawName.toLowerCase();
    const rawCat = (p.category || '').toLowerCase();
    const rawFamily = (p.family || p.famille || '').toLowerCase();

    // Remplacement spécifique pour produit1
    if (lower === 'produit1' || lower === 'produit 1') {
      return {
        ...p,
        name: 'PC Portable Dell Vostro 15 (Core i5 8Go 512Go SSD)',
        category: 'Matériel Informatique',
        family: 'Ordinateurs & Portables',
        supplier: 'IT Distribution Algérie'
      };
    }

    // Remplacement spécifique pour produit2
    if (lower === 'produit2' || lower === 'produit 2') {
      return {
        ...p,
        name: 'Souris & Clavier Sans Fil Logitech MK270 Pro',
        category: 'Périphériques Caisse',
        family: 'Accessoires & Périphériques',
        supplier: 'Tech Import Algérie'
      };
    }

    // Remplacement spécifique pour produit3
    if (lower === 'produit3' || lower === 'produit 3') {
      return {
        ...p,
        name: 'Écran LED 24" Full HD Dell UltraSharp',
        category: 'Matériel Informatique',
        family: 'Moniteurs & Affichage',
        supplier: 'IT Distribution Algérie'
      };
    }

    // Autres noms génériques 'produit X'
    if (/^produit\s*\d+$/i.test(lower)) {
      const realCatalog = [
        { name: 'Lecteur Code-barres USB Sans Fil', cat: 'Périphériques Caisse', fam: 'Lecteurs & Scanners' },
        { name: 'Imprimante Laser Monochrome HP LaserJet Pro', cat: 'Périphériques Caisse', fam: 'Imprimantes Tickets' },
        { name: 'Disque Dur Externe 1To SSD Samsung T7', cat: 'Matériel Informatique', fam: 'Accessoires & Stockage' },
        { name: 'Onduleur APC Back-UPS 650VA / 230V', cat: 'Périphériques Caisse', fam: 'Onduleurs & Alimentation' },
        { name: 'Routeur Wi-Fi 6 TP-Link Gigabit Dual-Band', cat: 'Matériel Informatique', fam: 'Réseau & Câblage' }
      ];
      const selected = realCatalog[idx % realCatalog.length];
      return {
        ...p,
        name: selected.name,
        category: selected.cat,
        family: selected.fam,
        supplier: 'Fournisseur Général'
      };
    }

    // Nettoyage des catégories génériques categorie1 / categorie2
    let cleanCategory = p.category;
    if (['categorie1', 'catégorie1', 'info'].includes(rawCat)) {
      cleanCategory = 'Matériel Informatique';
    } else if (['categorie2', 'catégorie2', 'periph'].includes(rawCat)) {
      cleanCategory = 'Périphériques Caisse';
    } else if (['categorie3', 'catégorie3', 'logiciel'].includes(rawCat)) {
      cleanCategory = 'Logiciels & Cloud';
    }

    // Nettoyage de Famille1
    let cleanFamily = p.family || p.famille;
    if (!cleanFamily || ['famille1', 'famille 1'].includes(rawFamily)) {
      cleanFamily = rawName.includes('Dell') || rawName.includes('PC') ? 'Ordinateurs & Portables' : 'Accessoires & Périphériques';
    }

    // Attribution d'un fournisseur réel et cohérent selon la catégorie
    let cleanSupplier = (p.supplier || p.fournisseur || '').trim();
    if (!cleanSupplier || ['fournisseur1', 'fournisseur 1', 'fournisseur', 'null', 'undefined', 'général', 'fournisseur général'].includes(cleanSupplier.toLowerCase())) {
      const catLower = (cleanCategory || '').toLowerCase();
      if (catLower.includes('periph') || catLower.includes('périphérique')) {
        cleanSupplier = 'Xprinter Algérie Officiel';
      } else if (catLower.includes('frais') || catLower.includes('aliment')) {
        cleanSupplier = 'Candia Laiterie Algérie';
      } else if (catLower.includes('logiciel') || catLower.includes('cloud')) {
        cleanSupplier = 'NovaMag Cloud Solutions';
      } else {
        cleanSupplier = 'Grossiste Matériel & POS Algérie';
      }
    }

    return {
      ...p,
      category: cleanCategory,
      family: cleanFamily,
      supplier: cleanSupplier
    };
  });
}

/**
 * Normalise l'historique des ventes pour remplacer tout produit ou catégorie fictifs
 */
export function sanitizeSalesWithRealNames(salesList) {
  if (!Array.isArray(salesList)) return salesList;
  return salesList.map((sale) => {
    const rawItems = sale.items || sale.articles || sale.cart || [];
    const items = rawItems.map((it, idx) => {
      const lower = (it.name || '').toLowerCase().trim();
      let realName = it.name;
      let realCat = it.category;
      let realFamily = it.family || 'Accessoires & Périphériques';

      if (lower === 'produit1' || lower === 'produit 1') {
        realName = 'PC Portable Dell Vostro 15 (Core i5 8Go 512Go SSD)';
        realCat = 'Matériel Informatique';
        realFamily = 'Ordinateurs & Portables';
      } else if (lower === 'produit2' || lower === 'produit 2') {
        realName = 'Souris & Clavier Sans Fil Logitech MK270 Pro';
        realCat = 'Périphériques Caisse';
        realFamily = 'Accessoires & Périphériques';
      } else if (lower === 'produit3' || lower === 'produit 3') {
        realName = 'Écran LED 24" Full HD Dell UltraSharp';
        realCat = 'Matériel Informatique';
        realFamily = 'Moniteurs & Affichage';
      } else if (lower === 'produit' || /^produit\s*\d+$/i.test(lower)) {
        realName = 'Lecteur Code-barres USB Sans Fil';
        realCat = 'Périphériques Caisse';
        realFamily = 'Lecteurs & Scanners';
      }

      const lowerCat = (realCat || '').toLowerCase().trim();
      if (['categorie1', 'catégorie1', 'info'].includes(lowerCat)) {
        realCat = 'Matériel Informatique';
      } else if (['categorie2', 'catégorie2', 'periph'].includes(lowerCat)) {
        realCat = 'Périphériques Caisse';
      }

      if (!realFamily || ['famille1', 'famille 1'].includes((realFamily || '').toLowerCase())) {
        realFamily = (realName || '').includes('Dell') || (realName || '').includes('PC')
          ? 'Ordinateurs & Portables'
          : 'Accessoires & Périphériques';
      }

      return {
        ...it,
        name: realName,
        category: realCat,
        family: realFamily
      };
    });

    return {
      ...sale,
      items
    };
  });
}

/**
 * Normalise les packs pour remplacer les références à 'produit1' et 'produit2' par de véritables noms réels.
 */
export function sanitizePacksWithRealNames(packsList) {
  if (!Array.isArray(packsList)) return packsList;
  return packsList.map((pk) => {
    const updatedItems = (pk.items || []).map((it) => {
      const lower = (it.productName || it.name || '').trim().toLowerCase();
      if (lower === 'produit1' || lower === 'produit 1') {
        return {
          ...it,
          productName: 'PC Portable Dell Vostro 15 (Core i5 8Go)',
          name: 'PC Portable Dell Vostro 15 (Core i5 8Go)'
        };
      }
      if (lower === 'produit2' || lower === 'produit 2') {
        return {
          ...it,
          productName: 'Souris & Clavier Sans Fil Logitech MK270 Pro',
          name: 'Souris & Clavier Sans Fil Logitech MK270 Pro'
        };
      }
      return it;
    });

    let packName = pk.name || '';
    let description = pk.description || '';
    if (['pack pc', 'pack 1', 'pack pc laptop'].includes(packName.trim().toLowerCase())) {
      packName = 'Pack Informatique PC Portable + Accessoires';
      description = 'Pack complet : PC Portable Dell Vostro 15 avec ensemble Clavier & Souris sans fil Logitech';
    }

    return {
      ...pk,
      name: packName,
      description,
      items: updatedItems
    };
  });
}

/**
 * Normalise les clients pour remplacer les libellés de test ('client 1', etc.) par de vrais clients commerciaux
 */
export function sanitizeCustomersWithRealNames(customersList) {
  if (!Array.isArray(customersList)) return customersList;
  return customersList.map((c) => {
    const rawName = (c.name || '').trim();
    const lower = rawName.toLowerCase();
    let realName = c.name;
    let realPhone = c.phone;

    if (lower === 'client 1' || lower === 'client1') {
      realName = 'Hamid Supérette & Cafétéria';
      realPhone = '0661 12 34 56';
    } else if (lower === 'client 2' || lower === 'client2') {
      realName = 'Karim Voisin (Crédit)';
      realPhone = '0770 98 76 54';
    } else if (lower === 'client 3' || lower === 'client3') {
      realName = 'Sarl IT Solutions Algérie';
      realPhone = '023 45 67 89';
    }

    return {
      ...c,
      name: realName,
      phone: realPhone
    };
  });
}

/**
 * Normalise les fournisseurs pour remplacer les libellés de test ('Fournisseur 1', etc.) par de vrais fournisseurs
 */
export function sanitizeSuppliersWithRealNames(suppliersList) {
  if (!Array.isArray(suppliersList)) return suppliersList;
  return suppliersList.map((s) => {
    const rawName = (s.name || s.company || '').trim();
    const lower = rawName.toLowerCase();
    let realName = s.name;

    if (lower === 'fournisseur 1' || lower === 'fournisseur1') {
      realName = 'Grossiste Matériel & POS Algérie';
    } else if (lower === 'fournisseur 2' || lower === 'fournisseur2') {
      realName = 'Xprinter Algérie Officiel';
    } else if (lower === 'fournisseur 3' || lower === 'fournisseur3') {
      realName = 'Candia Laiterie Algérie';
    }

    return {
      ...s,
      name: realName,
      company: realName
    };
  });
}

/**
 * Vérifie de manière robuste si un produit correspond à la catégorie sélectionnée,
 * qu'il s'agisse d'un identifiant (ex: 'periph') ou d'un libellé complet (ex: 'Périphériques Caisse').
 */
export function matchesCategory(productCategory, selectedCategory, isPack = false) {
  if (!selectedCategory || selectedCategory === 'all') return true;
  if (selectedCategory === 'packs') return Boolean(isPack || productCategory === 'packs');

  const prodCat = String(productCategory || '').trim().toLowerCase();
  const selCat = String(selectedCategory || '').trim().toLowerCase();

  if (prodCat === selCat) return true;

  const CATEGORY_ALIASES = {
    periph: [
      'periph',
      'périphériques caisse',
      'peripheriques caisse',
      'périphériques',
      'peripheriques',
      'accessoires & périphériques',
      'accessoires',
      'lecteurs & scanners',
      'imprimantes',
      'tiroirs'
    ],
    info: [
      'info',
      'matériel informatique',
      'materiel informatique',
      'ordinateurs & portables',
      'ordinateurs',
      'moniteurs & affichage',
      'informatique',
      'pc'
    ],
    logiciel: [
      'logiciel',
      'logiciels & cloud',
      'logiciels',
      'cloud',
      'abonnements',
      'licences'
    ],
    frais: [
      'frais',
      'alimentation & frais',
      'alimentation',
      'nourriture',
      'épicerie',
      'epicerie',
      'boissons',
      'laiterie',
      'fruits & légumes'
    ],
    packs: [
      'packs',
      'pack',
      'lot',
      'lots'
    ],
    laitiers: [
      'laitiers',
      'produits laitiers & fromages',
      'produits laitiers',
      'fromages',
      'laiterie',
      'lait',
      'fromage',
      'yaourt'
    ],
    boissons: [
      'boissons',
      'boissons & jus',
      'jus',
      'eau',
      'soda'
    ],
    epicerie: [
      'epicerie',
      'épicerie',
      'épicerie générale',
      'epicerie generale'
    ],
    fruits: [
      'fruits',
      'fruits & légumes (balance)',
      'fruits & légumes',
      'fruits & legumes'
    ],
    boucherie: [
      'boucherie',
      'boucherie & fromagerie (balance)',
      'boucherie & fromagerie',
      'viande'
    ],
    boulangerie: [
      'boulangerie',
      'boulangerie & vrac',
      'pain',
      'viennoiserie'
    ],
    nettoyage: [
      'nettoyage',
      'kit nétoyage',
      'kit nettoyage',
      'entretien',
      'hygiène'
    ]
  };

  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES)) {
    const selMatches = key === selCat || aliases.includes(selCat);
    const prodMatches = key === prodCat || aliases.includes(prodCat);
    if (selMatches && prodMatches) {
      return true;
    }
  }

  return false;
}
