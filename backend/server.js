const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize database
const db = require('./database/db');

// Import routes
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const categoriesRouter = require('./routes/categories');
const productsRouter = require('./routes/products');
const dashboardRouter = require('./routes/dashboard');
const shortcutsRouter = require('./routes/shortcuts');
const salesRouter = require('./routes/sales');
const systemPrintersRouter = require('./routes/systemPrinters');
const scaleRouter = require('./routes/scale');
const weatherRouter = require('./routes/weather');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger for POS/Local API monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[NovaMag API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const result = db.prepare('SELECT 1 AS alive').get();
    res.json({
      success: true,
      service: 'NovaMag API Server',
      status: 'UP',
      database: result.alive === 1 ? 'Connected (SQLite)' : 'Error',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'NovaMag API Server',
      status: 'DOWN',
      error: error.message
    });
  }
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/shortcuts', shortcutsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/system/printers', systemPrintersRouter);
app.use('/api/system/cash-drawer', systemPrintersRouter);
app.use('/api/system/scale', scaleRouter);
app.use('/api/weather', weatherRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'NovaMag POS & Inventory Management API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      categories: '/api/categories',
      products: '/api/products'
    }
  });
});

// Serve Frontend static assets in production if dist exists
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `المسار ${req.originalUrl} غير موجود على السيرفر`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[NovaMag API Error]:', err);
  res.status(500).json({
    success: false,
    message: 'حدث خطأ داخلي في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server only when executed directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 NovaMag Server is running on port ${PORT}`);
    console.log(`📍 Local:   http://localhost:${PORT}`);
    console.log(`🔗 Health:  http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

module.exports = app;
