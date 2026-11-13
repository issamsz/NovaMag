const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/shortcuts - List all POS shortcuts joined with products
router.get('/', (req, res) => {
  try {
    const query = `
      SELECT 
        s.id AS shortcut_id,
        s.product_id,
        COALESCE(s.label, p.name) AS display_name,
        s.label,
        s.icon,
        s.color,
        s.sort_order,
        p.id,
        p.barcode,
        p.name,
        p.price,
        p.prix_achat,
        p.marge_benefice,
        p.stock_quantity,
        p.seuil_alerte,
        p.is_weighted,
        p.category_id,
        c.name AS category_name
      FROM pos_shortcuts s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY s.sort_order ASC, s.id ASC
    `;
    const shortcuts = db.prepare(query).all();
    res.json({ success: true, count: shortcuts.length, data: shortcuts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/shortcuts - Assign an existing product to shortcuts
router.post('/', (req, res) => {
  try {
    const { product_id, label, icon = '⚡', color = 'indigo', sort_order = 0 } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'ID du produit requis' });
    }

    // Verify product exists
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(product_id));
    if (!product) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }

    // Insert or update shortcut
    const stmt = db.prepare(`
      INSERT INTO pos_shortcuts (product_id, label, icon, color, sort_order)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(product_id) DO UPDATE SET
        label = excluded.label,
        icon = excluded.icon,
        color = excluded.color,
        sort_order = excluded.sort_order
    `);
    
    stmt.run(Number(product_id), label ? label.trim() : null, icon.trim(), color.trim(), Number(sort_order));

    const newShortcut = db.prepare(`
      SELECT 
        s.id AS shortcut_id,
        s.product_id,
        COALESCE(s.label, p.name) AS display_name,
        s.label,
        s.icon,
        s.color,
        s.sort_order,
        p.id,
        p.barcode,
        p.name,
        p.price,
        p.stock_quantity,
        p.is_weighted
      FROM pos_shortcuts s
      JOIN products p ON s.product_id = p.id
      WHERE s.product_id = ?
    `).get(Number(product_id));

    res.status(201).json({ success: true, data: newShortcut, message: 'Raccourci ajouté avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/shortcuts/quick-create - Create product without barcode AND add it directly to shortcuts
router.post('/quick-create', (req, res) => {
  try {
    const { 
      name, 
      price, 
      prix_achat = 0, 
      label, 
      icon = '🥖', 
      color = 'amber',
      category_id = null 
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nom du produit requis' });
    }
    if (price === undefined || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Prix invalide' });
    }

    const cleanName = name.trim();
    const cleanPrice = Number(price);
    const cleanCost = Number(prix_achat) >= 0 ? Number(prix_achat) : 0;
    const catId = category_id ? Number(category_id) : null;

    // Generate unique short barcode tag for POS reference e.g. "SHORT-XXXX"
    const randomTag = 'NB-' + Math.floor(1000 + Math.random() * 9000);

    const insertProd = db.prepare(`
      INSERT INTO products (
        barcode, name, price, prix_achat, stock_quantity, seuil_alerte, is_weighted, category_id
      ) VALUES (?, ?, ?, ?, 999, 10, 0, ?)
    `);

    const info = insertProd.run(randomTag, cleanName, cleanPrice, cleanCost, catId);
    const newProdId = Number(info.lastInsertRowid);

    // Add to shortcuts
    const maxOrderRow = db.prepare('SELECT MAX(sort_order) AS max_order FROM pos_shortcuts').get();
    const nextOrder = (maxOrderRow?.max_order || 0) + 1;

    db.prepare(`
      INSERT INTO pos_shortcuts (product_id, label, icon, color, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(newProdId, label ? label.trim() : cleanName, icon.trim(), color.trim(), nextOrder);

    const fullItem = db.prepare(`
      SELECT 
        s.id AS shortcut_id,
        s.product_id,
        COALESCE(s.label, p.name) AS display_name,
        s.label,
        s.icon,
        s.color,
        s.sort_order,
        p.id,
        p.barcode,
        p.name,
        p.price,
        p.stock_quantity,
        p.is_weighted
      FROM pos_shortcuts s
      JOIN products p ON s.product_id = p.id
      WHERE s.product_id = ?
    `).get(newProdId);

    res.status(201).json({ success: true, data: fullItem, message: 'Article et raccourci créés avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/shortcuts/:id - Update shortcut presentation (label, icon, color, sort_order)
router.put('/:id', (req, res) => {
  try {
    const shortcutId = Number(req.params.id);
    const { label, icon, color, sort_order } = req.body;

    const existing = db.prepare('SELECT * FROM pos_shortcuts WHERE id = ?').get(shortcutId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Raccourci non trouvé' });
    }

    const newLabel = label !== undefined ? (label ? label.trim() : null) : existing.label;
    const newIcon = icon !== undefined ? icon.trim() : existing.icon;
    const newColor = color !== undefined ? color.trim() : existing.color;
    const newOrder = sort_order !== undefined ? Number(sort_order) : existing.sort_order;

    db.prepare(`
      UPDATE pos_shortcuts 
      SET label = ?, icon = ?, color = ?, sort_order = ?
      WHERE id = ?
    `).run(newLabel, newIcon, newColor, newOrder, shortcutId);

    res.json({ success: true, message: 'Raccourci mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/shortcuts/:id - Remove a shortcut from POS (does NOT delete the product)
router.delete('/:id', (req, res) => {
  try {
    const shortcutId = Number(req.params.id);
    db.prepare('DELETE FROM pos_shortcuts WHERE id = ?').run(shortcutId);
    res.json({ success: true, message: 'Raccourci retiré du tableau POS' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
