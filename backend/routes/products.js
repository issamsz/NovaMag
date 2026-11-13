const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/products - List products with optional search and category filter
router.get('/', (req, res) => {
  try {
    const { search, category_id, is_weighted } = req.query;
    let query = `
      SELECT 
        p.*, 
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.barcode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(Number(category_id));
    }

    if (is_weighted !== undefined && is_weighted !== '') {
      query += ` AND p.is_weighted = ?`;
      params.push(Number(is_weighted));
    }

    query += ` ORDER BY p.id DESC`;

    const stmt = db.prepare(query);
    const products = stmt.all(...params);

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/expiring - Track products near expiration (Péremptions)
router.get('/expiring', (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;

    // Get all products with expiration date set
    const products = db.prepare(`
      SELECT 
        p.*, 
        c.name AS category_name,
        CAST((julianday(p.date_expiration) - julianday('now', 'localtime')) AS INTEGER) AS days_remaining
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.date_expiration IS NOT NULL AND TRIM(p.date_expiration) != ''
      ORDER BY p.date_expiration ASC
    `).all();

    const expired = [];
    const expiringSoon = [];
    const safe = [];

    let totalAtRiskCost = 0;
    let totalAtRiskSelling = 0;

    products.forEach((p) => {
      const daysLeft = Number(p.days_remaining);
      const stock = Math.max(0, Number(p.stock_quantity));
      const costVal = stock * Number(p.prix_achat);
      const sellVal = stock * Number(p.price);

      if (daysLeft < 0) {
        expired.push({ ...p, status: 'expired', days_remaining: daysLeft });
        totalAtRiskCost += costVal;
        totalAtRiskSelling += sellVal;
      } else if (daysLeft <= days) {
        expiringSoon.push({ ...p, status: 'warning', days_remaining: daysLeft });
        totalAtRiskCost += costVal;
        totalAtRiskSelling += sellVal;
      } else {
        safe.push({ ...p, status: 'ok', days_remaining: daysLeft });
      }
    });

    res.json({
      success: true,
      data: {
        days_window: days,
        expired_count: expired.length,
        expiring_soon_count: expiringSoon.length,
        total_at_risk_cost: Number(totalAtRiskCost.toFixed(2)),
        total_at_risk_selling: Number(totalAtRiskSelling.toFixed(2)),
        expired,
        expiring_soon: expiringSoon,
        all_expiring_products: [...expired, ...expiringSoon]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/barcode/:barcode - Fast barcode lookup for POS scanner (Supports Packs & Multi-Barcodes)
router.get('/barcode/:barcode', (req, res) => {
  try {
    const barcode = req.params.barcode.trim();

    // 1. First check if it is registered in product_barcodes (as a pack or alternative barcode)
    const packStmt = db.prepare(`
      SELECT 
        p.*, 
        c.name AS category_name,
        pb.id AS pack_id,
        pb.barcode AS pack_barcode,
        pb.packing_name,
        pb.multiplier,
        pb.price AS custom_pack_price
      FROM product_barcodes pb
      JOIN products p ON pb.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pb.barcode = ?
    `);
    const packMatch = packStmt.get(barcode);

    if (packMatch) {
      const isPack = packMatch.multiplier > 1 || Boolean(packMatch.custom_pack_price);
      const effectivePrice = packMatch.custom_pack_price !== null && packMatch.custom_pack_price !== undefined
        ? Number(packMatch.custom_pack_price)
        : Number((packMatch.price * packMatch.multiplier).toFixed(2));

      return res.json({
        success: true,
        data: {
          ...packMatch,
          price: effectivePrice,
          unit_price: packMatch.price,
          is_pack: isPack,
          packing_name: packMatch.packing_name || (isPack ? `Pack (${packMatch.multiplier}x)` : 'Pièce'),
          multiplier: packMatch.multiplier,
          barcode_scanned: barcode,
          base_barcode: packMatch.barcode
        }
      });
    }

    // 2. Otherwise check standard primary products table
    const stmt = db.prepare(`
      SELECT 
        p.*, 
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = ?
    `);
    const product = stmt.get(barcode);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Article non trouvé pour ce code-barres' });
    }

    // Attach any extra packs / barcodes available for this product
    const extraBarcodes = db.prepare(`
      SELECT id, barcode, packing_name, multiplier, price 
      FROM product_barcodes 
      WHERE product_id = ?
      ORDER BY multiplier ASC
    `).all(product.id);

    res.json({ 
      success: true, 
      data: {
        ...product,
        is_pack: false,
        multiplier: 1,
        packing_name: 'Pièce',
        barcode_scanned: barcode,
        extra_barcodes: extraBarcodes
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id - Get product by ID (including all packs & secondary barcodes)
router.get('/:id', (req, res) => {
  try {
    const productId = Number(req.params.id);
    const stmt = db.prepare(`
      SELECT 
        p.*, 
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `);
    const product = stmt.get(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }

    const barcodes = db.prepare(`
      SELECT * FROM product_barcodes 
      WHERE product_id = ? 
      ORDER BY multiplier ASC, id ASC
    `).all(productId);

    res.json({ success: true, data: { ...product, barcodes } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id/barcodes - List all barcodes and packs for a product
router.get('/:id/barcodes', (req, res) => {
  try {
    const productId = Number(req.params.id);
    const barcodes = db.prepare(`
      SELECT * FROM product_barcodes 
      WHERE product_id = ? 
      ORDER BY multiplier ASC, id ASC
    `).all(productId);
    res.json({ success: true, count: barcodes.length, data: barcodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products/:id/barcodes - Add a new barcode/pack
router.post('/:id/barcodes', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { barcode, packing_name = 'Pièce', multiplier = 1, price = null } = req.body;

    if (!barcode || !String(barcode).trim()) {
      return res.status(400).json({ success: false, message: 'Code-barres requis' });
    }

    const cleanBarcode = String(barcode).trim();
    const cleanMultiplier = Math.max(1, Number(multiplier) || 1);
    const cleanPrice = price !== null && price !== undefined && !isNaN(price) && Number(price) >= 0 ? Number(price) : null;
    const cleanPacking = packing_name ? String(packing_name).trim() : (cleanMultiplier > 1 ? `Pack (${cleanMultiplier}x)` : 'Pièce');

    // Check if barcode already exists anywhere (in products or product_barcodes)
    const existingMain = db.prepare("SELECT id, name FROM products WHERE barcode = ?").get(cleanBarcode);
    if (existingMain) {
      return res.status(409).json({ 
        success: false, 
        message: `Ce code-barres est déjà utilisé comme code principal pour l'article "${existingMain.name}"` 
      });
    }

    const existingPack = db.prepare(`
      SELECT pb.id, p.name 
      FROM product_barcodes pb 
      JOIN products p ON pb.product_id = p.id 
      WHERE pb.barcode = ?
    `).get(cleanBarcode);

    if (existingPack) {
      return res.status(409).json({ 
        success: false, 
        message: `Ce code-barres est déjà assigné comme pack pour l'article "${existingPack.name}"` 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO product_barcodes (product_id, barcode, packing_name, multiplier, price)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(productId, cleanBarcode, cleanPacking, cleanMultiplier, cleanPrice);

    const created = db.prepare("SELECT * FROM product_barcodes WHERE id = ?").get(Number(info.lastInsertRowid));

    res.status(201).json({ success: true, data: created, message: 'Code-barres / Pack ajouté avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id/barcodes/:barcodeId - Update barcode/pack
router.put('/:id/barcodes/:barcodeId', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const productId = Number(req.params.id);
    const barcodeId = Number(req.params.barcodeId);
    const { barcode, packing_name, multiplier, price } = req.body;

    const existing = db.prepare("SELECT * FROM product_barcodes WHERE id = ? AND product_id = ?").get(barcodeId, productId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pack / Code-barres non trouvé' });
    }

    const cleanBarcode = barcode ? String(barcode).trim() : existing.barcode;
    const cleanMultiplier = multiplier !== undefined ? Math.max(1, Number(multiplier) || 1) : existing.multiplier;
    const cleanPacking = packing_name !== undefined ? String(packing_name).trim() : existing.packing_name;
    const cleanPrice = price !== undefined ? (price !== null && !isNaN(price) && Number(price) >= 0 ? Number(price) : null) : existing.price;

    db.prepare(`
      UPDATE product_barcodes 
      SET barcode = ?, packing_name = ?, multiplier = ?, price = ?
      WHERE id = ?
    `).run(cleanBarcode, cleanPacking, cleanMultiplier, cleanPrice, barcodeId);

    const updated = db.prepare("SELECT * FROM product_barcodes WHERE id = ?").get(barcodeId);
    res.json({ success: true, data: updated, message: 'Pack mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id/barcodes/:barcodeId - Delete barcode/pack
router.delete('/:id/barcodes/:barcodeId', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const productId = Number(req.params.id);
    const barcodeId = Number(req.params.barcodeId);
    db.prepare("DELETE FROM product_barcodes WHERE id = ? AND product_id = ?").run(barcodeId, productId);
    res.json({ success: true, message: 'Code-barres / Pack supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products - Create new product (Admin only)
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { 
      barcode, 
      name, 
      price, 
      prix_achat = 0, 
      marge_benefice = 0, 
      stock_quantity = 0, 
      seuil_alerte = 5, 
      is_weighted = 0, 
      category_id = null,
      date_expiration = null
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom du produit est requis' });
    }

    if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Prix de vente invalide' });
    }

    const cleanBarcode = barcode && String(barcode).trim() !== '' ? String(barcode).trim() : null;
    const cleanName = name.trim();
    const numericSellingPrice = Number(price);
    const numericCostPrice = Number(prix_achat) >= 0 ? Number(prix_achat) : 0;
    
    // Auto-calculate margin if cost price exists and margin is 0
    let numericMargin = Number(marge_benefice);
    if ((numericMargin === 0 || isNaN(numericMargin)) && numericCostPrice > 0) {
      numericMargin = Number((((numericSellingPrice - numericCostPrice) / numericCostPrice) * 100).toFixed(2));
    }

    const numericStock = Number(stock_quantity) || 0;
    const numericAlert = Number(seuil_alerte) >= 0 ? Number(seuil_alerte) : 5;
    const weightedFlag = is_weighted ? 1 : 0;
    const catId = category_id ? Number(category_id) : null;
    const cleanExpiry = date_expiration && String(date_expiration).trim() !== '' ? String(date_expiration).trim() : null;

    const stmt = db.prepare(`
      INSERT INTO products (
        barcode, name, price, prix_achat, marge_benefice, 
        stock_quantity, seuil_alerte, is_weighted, category_id, date_expiration
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      cleanBarcode, cleanName, numericSellingPrice, numericCostPrice, numericMargin,
      numericStock, numericAlert, weightedFlag, catId, cleanExpiry
    );
    const newId = Number(info.lastInsertRowid);

    const newProduct = db.prepare(`
      SELECT p.*, c.name AS category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(newId);

    res.status(201).json({ success: true, data: newProduct, message: 'Article créé avec succès' });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed: products.barcode')) {
      return res.status(409).json({ success: false, message: 'Ce code-barres est déjà assigné à un autre produit' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { 
      barcode, 
      name, 
      price, 
      prix_achat, 
      marge_benefice, 
      stock_quantity, 
      seuil_alerte, 
      is_weighted, 
      category_id,
      date_expiration
    } = req.body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }

    const cleanBarcode = barcode !== undefined 
      ? (barcode && String(barcode).trim() !== '' ? String(barcode).trim() : null) 
      : existing.barcode;
    const cleanName = name !== undefined ? name.trim() : existing.name;
    const numericSellingPrice = price !== undefined ? Number(price) : existing.price;
    const numericCostPrice = prix_achat !== undefined ? Number(prix_achat) : (existing.prix_achat || 0);
    const numericMargin = marge_benefice !== undefined ? Number(marge_benefice) : (existing.marge_benefice || 0);
    const numericStock = stock_quantity !== undefined ? Number(stock_quantity) : existing.stock_quantity;
    const numericAlert = seuil_alerte !== undefined ? Number(seuil_alerte) : (existing.seuil_alerte || 5);
    const weightedFlag = is_weighted !== undefined ? (is_weighted ? 1 : 0) : existing.is_weighted;
    const catId = category_id !== undefined ? (category_id ? Number(category_id) : null) : existing.category_id;
    const cleanExpiry = date_expiration !== undefined ? (date_expiration ? String(date_expiration).trim() : null) : existing.date_expiration;

    const stmt = db.prepare(`
      UPDATE products 
      SET 
        barcode = ?, 
        name = ?, 
        price = ?, 
        prix_achat = ?, 
        marge_benefice = ?, 
        stock_quantity = ?, 
        seuil_alerte = ?, 
        is_weighted = ?, 
        category_id = ?, 
        date_expiration = ?, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      cleanBarcode, cleanName, numericSellingPrice, numericCostPrice, numericMargin,
      numericStock, numericAlert, weightedFlag, catId, cleanExpiry, productId
    );

    const updatedProduct = db.prepare(`
      SELECT p.*, c.name AS category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(productId);

    res.json({ success: true, data: updatedProduct, message: 'Article mis à jour avec succès' });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed: products.barcode')) {
      return res.status(409).json({ success: false, message: 'Ce code-barres est déjà assigné à un autre produit' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/products/:id/stock - Quick stock increment/decrement (Admin or Caissier)
router.patch('/:id/stock', authenticateToken, requireRole('admin', 'caissier'), (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { delta } = req.body;
    if (delta === undefined || isNaN(delta)) {
      return res.status(400).json({ success: false, message: 'Valeur delta requise' });
    }

    const stmt = db.prepare(`
      UPDATE products 
      SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const info = stmt.run(Number(delta), productId);

    if (info.changes === 0) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }

    const updated = db.prepare('SELECT id, name, stock_quantity, seuil_alerte FROM products WHERE id = ?').get(productId);
    res.json({ success: true, data: updated, message: 'Stock mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const productId = Number(req.params.id);
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const info = stmt.run(productId);

    if (info.changes === 0) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }

    res.json({ success: true, message: 'Article supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
