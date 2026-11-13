const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/categories - List all categories with product count
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        c.id, 
        c.name, 
        c.created_at,
        COUNT(p.id) AS products_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    const categories = stmt.all();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const category = stmt.get(Number(req.params.id));

    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/categories - Create new category (Admin only)
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom de la catégorie est requis' });
    }

    const trimmedName = name.trim();
    const insertStmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const info = insertStmt.run(trimmedName);

    const insertedId = Number(info.lastInsertRowid);
    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(insertedId);
    res.status(201).json({ success: true, data: newCategory, message: 'Catégorie créée avec succès' });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'Cette catégorie existe déjà' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/categories/:id - Update category (Admin only)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom de la catégorie est requis' });
    }

    const categoryId = Number(req.params.id);
    const trimmedName = name.trim();
    const stmt = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
    const info = stmt.run(trimmedName, categoryId);

    if (info.changes === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }

    const updatedCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
    res.json({ success: true, data: updatedCategory, message: 'Catégorie mise à jour avec succès' });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'Ce nom de catégorie existe déjà' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const info = stmt.run(categoryId);

    if (info.changes === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }

    res.json({ success: true, message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
