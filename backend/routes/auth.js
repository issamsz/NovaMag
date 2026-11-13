const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { generateToken, authenticateToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * User login with username and password
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez saisir votre nom d\'utilisateur et votre mot de passe.'
      });
    }

    const trimmedUsername = String(username).trim();
    const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(trimmedUsername);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nom d\'utilisateur ou mot de passe incorrect.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Nom d\'utilisateur ou mot de passe incorrect.'
      });
    }

    if (user.is_active !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Ce compte utilisateur a été désactivé par l\'administrateur.'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[NovaMag Auth Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la tentative de connexion.',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Retrieve currently logged in user info
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
