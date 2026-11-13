const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const ALLOWED_ROLES = ['admin', 'vendeur', 'caissier', 'comptable', 'assistant'];
router.use(authenticateToken);
router.use(requireRole('admin'));

/**
 * GET /api/users
 * List all users
 */
router.get('/', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, full_name, role, is_active, created_at, updated_at
      FROM users
      ORDER BY id ASC
    `).all();

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', (req, res) => {
  try {
    const { username, password, full_name, role, is_active = 1 } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires manquants : nom d\'utilisateur, mot de passe, nom complet et rôle.'
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Les rôles autorisés sont : ' + ALLOWED_ROLES.join(', ')
      });
    }

    const trimmedUsername = String(username).trim();

    // Check duplicate username
    const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(trimmedUsername);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ce nom d\'utilisateur est déjà utilisé.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(trimmedUsername, password_hash, full_name.trim(), role, is_active ? 1 : 0);

    const newUser = db.prepare(`
      SELECT id, username, full_name, role, is_active, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès.',
      data: newUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/users/:id
 * Update user profile, role, password or status
 */
router.put('/:id', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { full_name, role, is_active, password } = req.body;

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable.'
      });
    }

    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Les rôles autorisés sont : ' + ALLOWED_ROLES.join(', ')
      });
    }

    // Do not allow deactivating or changing role of the last active admin
    if (existing.role === 'admin' && (role !== 'admin' || is_active === 0)) {
      const activeAdmins = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1").get();
      if (activeAdmins.count <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de désactiver ou modifier le dernier administrateur actif.'
        });
      }
    }

    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (full_name !== undefined) {
      query += ', full_name = ?';
      params.push(full_name.trim());
    }

    if (role !== undefined) {
      query += ', role = ?';
      params.push(role);
    }

    if (is_active !== undefined) {
      query += ', is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    if (password && String(password).trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(String(password).trim(), salt);
      query += ', password_hash = ?';
      params.push(password_hash);
    }

    query += ' WHERE id = ?';
    params.push(userId);

    db.prepare(query).run(...params);

    const updatedUser = db.prepare(`
      SELECT id, username, full_name, role, is_active, updated_at
      FROM users WHERE id = ?
    `).get(userId);

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès.',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (cannot delete self)
 */
router.delete('/:id', (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte administrateur en cours d\'utilisation.'
      });
    }

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable.'
      });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
