const db = require('./database/db');

console.log('🌱 [NovaMag Seed] Mise à jour des données avec les champs commerciaux complets...');

// Clear existing test data
db.exec(`
  DELETE FROM products;
  DELETE FROM categories;
`);

// 1. Seed Categories
const categories = [
  { id: 1, name: 'Produits Laitiers & Fromages' },
  { id: 2, name: 'Boissons & Jus' },
  { id: 3, name: 'Épicerie Générale' },
  { id: 4, name: 'Fruits & Légumes (Balance)' },
  { id: 5, name: 'Boucherie & Fromagerie (Balance)' }
];

const insertCategory = db.prepare(`
  INSERT INTO categories (id, name) VALUES (?, ?)
`);

for (const cat of categories) {
  insertCategory.run(cat.id, cat.name);
}
console.log(`✅ ${categories.length} catégories insérées.`);

// 2. Seed Products with Commercial Fields (prix_achat, marge_benefice, seuil_alerte, date_expiration)
const products = [
  {
    barcode: '6130001000018',
    name: 'Lait Candia Viva Stérilisé 1L',
    price: 135.0,
    prix_achat: 115.0,
    marge_benefice: 17.39,
    stock_quantity: 60,
    seuil_alerte: 15,
    is_weighted: 0,
    category_id: 1,
    date_expiration: '2026-12-15'
  },
  {
    barcode: '6130002000025',
    name: 'Yaourt Soummam aux Fruits 100g',
    price: 35.0,
    prix_achat: 28.0,
    marge_benefice: 25.0,
    stock_quantity: 120,
    seuil_alerte: 25,
    is_weighted: 0,
    category_id: 1,
    date_expiration: '2026-11-20'
  },
  {
    barcode: '6130003000032',
    name: 'Boisson Gazeuse Hamoud Boualem Sélecto 1L',
    price: 110.0,
    prix_achat: 90.0,
    marge_benefice: 22.22,
    stock_quantity: 45,
    seuil_alerte: 10,
    is_weighted: 0,
    category_id: 2,
    date_expiration: '2027-04-10'
  },
  {
    barcode: '6130004000049',
    name: 'Jus Ramy Orange avec Pulpe 1.25L',
    price: 140.0,
    prix_achat: 115.0,
    marge_benefice: 21.74,
    stock_quantity: 50,
    seuil_alerte: 12,
    is_weighted: 0,
    category_id: 2,
    date_expiration: '2027-02-18'
  },
  {
    barcode: '6130005000056',
    name: 'Farine Supérieure Safina 1kg',
    price: 65.0,
    prix_achat: 52.0,
    marge_benefice: 25.0,
    stock_quantity: 80,
    seuil_alerte: 20,
    is_weighted: 0,
    category_id: 3,
    date_expiration: '2027-06-30'
  },
  {
    barcode: '6130006000063',
    name: 'Pâtes Sim Spaghetti n°5 500g',
    price: 75.0,
    prix_achat: 60.0,
    marge_benefice: 25.0,
    stock_quantity: 95,
    seuil_alerte: 20,
    is_weighted: 0,
    category_id: 3,
    date_expiration: '2027-08-25'
  },
  {
    barcode: '6130007000070',
    name: 'Huile de Table Végétale Afia 5L',
    price: 650.0,
    prix_achat: 580.0,
    marge_benefice: 12.07,
    stock_quantity: 25,
    seuil_alerte: 5,
    is_weighted: 0,
    category_id: 3,
    date_expiration: '2027-10-01'
  },
  {
    barcode: '6131234567890',
    name: 'Lait Candia Candilait 1L',
    price: 140.0,
    prix_achat: 118.0,
    marge_benefice: 18.64,
    stock_quantity: 48,
    seuil_alerte: 10,
    is_weighted: 0,
    category_id: 1,
    date_expiration: '2026-12-25'
  },
  {
    barcode: '20001',
    name: 'Fromage Gruyère Local au Poids (kg)',
    price: 1850.0,
    prix_achat: 1500.0,
    marge_benefice: 23.33,
    stock_quantity: 14.5,
    seuil_alerte: 5,
    is_weighted: 1,
    category_id: 5,
    date_expiration: '2026-11-30'
  },
  {
    barcode: '20002',
    name: 'Fromage Cheddar Rouge au Poids (kg)',
    price: 1450.0,
    prix_achat: 1150.0,
    marge_benefice: 26.09,
    stock_quantity: 18.2,
    seuil_alerte: 5,
    is_weighted: 1,
    category_id: 5,
    date_expiration: '2026-12-05'
  },
  {
    barcode: '20003',
    name: 'Viande Bovine Fraîche Hachée (kg)',
    price: 2200.0,
    prix_achat: 1850.0,
    marge_benefice: 18.92,
    stock_quantity: 11.0,
    seuil_alerte: 4,
    is_weighted: 1,
    category_id: 5,
    date_expiration: '2026-10-18'
  },
  {
    barcode: '21001',
    name: 'Bananes Fraîches d’Importation (kg)',
    price: 420.0,
    prix_achat: 350.0,
    marge_benefice: 20.0,
    stock_quantity: 52.0,
    seuil_alerte: 10,
    is_weighted: 1,
    category_id: 4,
    date_expiration: '2026-10-25'
  },
  {
    barcode: '21002',
    name: 'Pommes Rouges Locales Délicieuses (kg)',
    price: 360.0,
    prix_achat: 290.0,
    marge_benefice: 24.14,
    stock_quantity: 38.5,
    seuil_alerte: 8,
    is_weighted: 1,
    category_id: 4,
    date_expiration: '2026-11-10'
  }
];

const insertProduct = db.prepare(`
  INSERT INTO products (
    barcode, name, price, prix_achat, marge_benefice, 
    stock_quantity, seuil_alerte, is_weighted, category_id, date_expiration
  )
  VALUES (
    @barcode, @name, @price, @prix_achat, @marge_benefice, 
    @stock_quantity, @seuil_alerte, @is_weighted, @category_id, @date_expiration
  )
`);

for (const prod of products) {
  insertProduct.run(prod);
}

console.log(`✅ ${products.length} articles commerciaux ajoutés avec succès !`);
