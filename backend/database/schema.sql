-- NovaMag Database Schema
-- Optimized for SQLite with better-sqlite3 / node:sqlite

PRAGMA foreign_keys = ON;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    price REAL NOT NULL CHECK(price >= 0),
    prix_achat REAL NOT NULL DEFAULT 0 CHECK(prix_achat >= 0),
    marge_benefice REAL NOT NULL DEFAULT 0,
    stock_quantity REAL NOT NULL DEFAULT 0,
    seuil_alerte INTEGER NOT NULL DEFAULT 5 CHECK(seuil_alerte >= 0),
    is_weighted INTEGER NOT NULL DEFAULT 0 CHECK(is_weighted IN (0, 1)),
    category_id INTEGER,
    date_expiration TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
);

-- Indexes for lightning fast POS lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Users table for RBAC (Admin, Caissier)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'caissier')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- POS Shortcuts table for fast access to products without barcode (Pain, Oeufs, Sacs, etc.)
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

CREATE INDEX IF NOT EXISTS idx_shortcuts_product ON pos_shortcuts(product_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_order ON pos_shortcuts(sort_order);

-- Expiration dates index
CREATE INDEX IF NOT EXISTS idx_products_date_expiration ON products(date_expiration);

-- Multiple Barcodes & Packs Table (Codes-barres multiples & Packs/Fardo/Carton)
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

-- Sales / Tickets Table with Multi-Payment and Returns Support
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

-- Sale Items Table with Pack Multiplier and Profit Margin Tracking
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


