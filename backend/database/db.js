const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'novamag.db');

let db;

try {
  // Try native node:sqlite DatabaseSync first (Node 22+ built-in, ultra-fast C++ engine)
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(dbPath);
  console.log(`[NovaMag DB] Connected using built-in high-speed node:sqlite engine.`);
} catch (nativeErr) {
  try {
    const BetterSqlite3 = require('better-sqlite3');
    db = new BetterSqlite3(dbPath);
    console.log(`[NovaMag DB] Connected using better-sqlite3 engine.`);
  } catch (betterErr) {
    console.error('[NovaMag DB Error] Failed to initialize SQLite engine:', nativeErr, betterErr);
    throw new Error('No compatible SQLite driver found. Please ensure Node.js 22+ is used or better-sqlite3 is installed.');
  }
}

// Configure SQLite for high performance, POS integrity and concurrent access
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA synchronous = NORMAL;');

// Execute initial schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Non-destructive auto-migration for newly added commercial fields
try {
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const columnNames = tableInfo.map(c => c.name);

  if (!columnNames.includes('prix_achat')) {
    db.exec("ALTER TABLE products ADD COLUMN prix_achat REAL NOT NULL DEFAULT 0;");
    console.log("[NovaMag DB Migration] Added column: prix_achat");
  }
  if (!columnNames.includes('marge_benefice')) {
    db.exec("ALTER TABLE products ADD COLUMN marge_benefice REAL NOT NULL DEFAULT 0;");
    console.log("[NovaMag DB Migration] Added column: marge_benefice");
  }
  if (!columnNames.includes('seuil_alerte')) {
    db.exec("ALTER TABLE products ADD COLUMN seuil_alerte INTEGER NOT NULL DEFAULT 5;");
    console.log("[NovaMag DB Migration] Added column: seuil_alerte");
  }
  if (!columnNames.includes('date_expiration')) {
    db.exec("ALTER TABLE products ADD COLUMN date_expiration TEXT;");
    console.log("[NovaMag DB Migration] Added column: date_expiration");
  }
} catch (migrationErr) {
  console.error('[NovaMag DB Migration Warning]:', migrationErr.message);
}

// Seed default users if users table is empty
try {
  const bcrypt = require('bcryptjs');
  const userCountRow = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  if (!userCountRow || userCountRow.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const caissierHash = bcrypt.hashSync('caisse123', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);

    insertUser.run('admin', adminHash, 'Administrateur Principal', 'admin');
    insertUser.run('caissier', caissierHash, 'Caissier - Caisse 01', 'caissier');
    console.log('[NovaMag DB Seed] Default users created: admin (admin123), caissier (caisse123)');
  }
} catch (userSeedErr) {
  console.error('[NovaMag DB User Seed Warning]:', userSeedErr.message);
}

// Ensure pos_shortcuts table exists & auto-seed default supermarket shortcuts (Pain, Oeufs, Sacs...)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pos_shortcuts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL UNIQUE,
      label TEXT,
      icon TEXT DEFAULT '🥖',
      color TEXT DEFAULT 'amber',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
  `);

  const shortcutCount = db.prepare("SELECT COUNT(*) AS count FROM pos_shortcuts").get();
  if (!shortcutCount || shortcutCount.count === 0) {
    let catRow = db.prepare("SELECT id FROM categories WHERE name = 'Boulangerie & Vrac'").get();
    let catId = catRow ? catRow.id : null;
    if (!catId) {
      const catInsert = db.prepare("INSERT INTO categories (name) VALUES ('Boulangerie & Vrac')").run();
      catId = Number(catInsert.lastInsertRowid);
    }

    const defaultItems = [
      { name: 'Pain Baguette Ordinaire', label: 'Pain Baguette', price: 10, prix_achat: 8, icon: '🥖', color: 'amber', barcode: 'NB-PAIN' },
      { name: 'Pain Traditionnel Amélioré', label: 'Pain Amélioré', price: 15, prix_achat: 12, icon: '🥖', color: 'amber', barcode: 'NB-AMEL' },
      { name: 'Œuf Frais Fermier (Unité)', label: 'Œuf (1 pièce)', price: 25, prix_achat: 20, icon: '🥚', color: 'yellow', barcode: 'NB-OEUF-1' },
      { name: 'Plateau d\'Œufs (30 pièces)', label: 'Plateau Œufs (30)', price: 650, prix_achat: 580, icon: '🥚', color: 'yellow', barcode: 'NB-OEUF-30' },
      { name: 'Sachet Plastique de Caisse', label: 'Sachet Caisse', price: 10, prix_achat: 5, icon: '🛍️', color: 'slate', barcode: 'NB-SACHET' },
      { name: 'Lait Pasteurisé en Sachet 1L', label: 'Lait Sachet', price: 25, prix_achat: 23, icon: '🥛', color: 'sky', barcode: 'NB-LAIT' },
      { name: 'Bouteille Eau Minérale 0.5L', label: 'Eau 0.5L', price: 35, prix_achat: 25, icon: '💧', color: 'blue', barcode: 'NB-EAU' },
      { name: 'Croissant / Brioche au Beurre', label: 'Croissant', price: 30, prix_achat: 22, icon: '🥐', color: 'orange', barcode: 'NB-CROISSANT' }
    ];

    defaultItems.forEach((item, idx) => {
      let prod = db.prepare("SELECT id FROM products WHERE barcode = ? OR name = ?").get(item.barcode, item.name);
      let prodId = prod ? prod.id : null;

      if (!prodId) {
        const prodInsert = db.prepare(`
          INSERT INTO products (
            barcode, name, price, prix_achat, stock_quantity, seuil_alerte, is_weighted, category_id
          ) VALUES (?, ?, ?, ?, 999, 10, 0, ?)
        `).run(item.barcode, item.name, item.price, item.prix_achat, catId);
        prodId = Number(prodInsert.lastInsertRowid);
      }

      db.prepare(`
        INSERT OR IGNORE INTO pos_shortcuts (product_id, label, icon, color, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `).run(prodId, item.label, item.icon, item.color, idx + 1);
    });

    console.log('[NovaMag DB Seed] Default quick shortcuts created (Pain, Oeufs, Sacs, Lait...)');
  }
} catch (shortcutSeedErr) {
  console.error('[NovaMag DB Shortcut Seed Warning]:', shortcutSeedErr.message);
}

// Ensure product_barcodes table exists (Multi-barcodes & Packs)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_barcodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      barcode TEXT NOT NULL UNIQUE,
      packing_name TEXT DEFAULT 'Pièce',
      multiplier REAL NOT NULL DEFAULT 1 CHECK(multiplier > 0),
      price REAL CHECK(price >= 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_product_barcodes_barcode ON product_barcodes(barcode);
    CREATE INDEX IF NOT EXISTS idx_product_barcodes_product ON product_barcodes(product_id);
  `);

  // Seed sample pack if table is empty (e.g. Pack 6 for Eau Minérale 0.5L)
  const pbCount = db.prepare("SELECT COUNT(*) AS count FROM product_barcodes").get();
  if (!pbCount || pbCount.count === 0) {
    const eauProd = db.prepare("SELECT id, price FROM products WHERE barcode = 'NB-EAU' OR name LIKE '%Eau Minérale%'").get();
    if (eauProd) {
      db.prepare(`
        INSERT OR IGNORE INTO product_barcodes (product_id, barcode, packing_name, multiplier, price)
        VALUES (?, '6130009000066', 'Pack (6 Bouteilles)', 6, 180)
      `).run(eauProd.id);
      console.log('[NovaMag DB Seed] Pack 6 for Eau Minérale initialized (Barcode: 6130009000066, Multiplier: 6, Price: 180 DA)');
    }
  }
} catch (pbErr) {
  console.error('[NovaMag DB product_barcodes Migration Warning]:', pbErr.message);
}

// Ensure sales and sale_items tables exist (Multi-payment & Returns)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      total_amount REAL NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      change_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('especes', 'carte', 'credit')),
      customer_name TEXT,
      sale_type TEXT NOT NULL DEFAULT 'sale' CHECK(sale_type IN ('sale', 'return')),
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sales_ticket ON sales(ticket_number);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
    CREATE INDEX IF NOT EXISTS idx_sales_type ON sales(sale_type);

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER,
      barcode_used TEXT,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      multiplier REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      is_return INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
  `);
} catch (salesErr) {
  console.error('[NovaMag DB sales Migration Warning]:', salesErr.message);
}

// Non-destructive auto-seed of some expiration dates if not set yet for testing
try {
  const expiringSample = db.prepare("SELECT id FROM products WHERE date_expiration IS NOT NULL").get();
  if (!expiringSample) {
    // Set some sample items with near expiration dates (e.g. Yaourt in 12 days, Lait in 5 days)
    const d5 = new Date();
    d5.setDate(d5.getDate() + 5);
    const date5Str = d5.toISOString().split('T')[0];

    const d18 = new Date();
    d18.setDate(d18.getDate() + 18);
    const date18Str = d18.toISOString().split('T')[0];

    db.prepare("UPDATE products SET date_expiration = ? WHERE barcode = '6130001000018'").run(date5Str); // Lait Candia
    db.prepare("UPDATE products SET date_expiration = ? WHERE barcode = '6130002000025'").run(date18Str); // Yaourt Soummam
    console.log('[NovaMag DB Seed] Sample expiration dates added for testing alerts (5 days & 18 days)');
  }
} catch (expSeedErr) {
  console.error('[NovaMag DB Expiration Seed Warning]:', expSeedErr.message);
}

console.log(`[NovaMag DB] Database successfully initialized at: ${dbPath}`);

module.exports = db;
