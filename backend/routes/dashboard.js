const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All dashboard endpoints require admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

/**
 * GET /api/dashboard/stats
 * Real-time supermarket inventory and sales analytics
 */
router.get('/stats', (req, res) => {
  try {
    // 1. Total products count
    const totalRow = db.prepare('SELECT COUNT(*) AS total FROM products').get();
    const totalProducts = totalRow ? totalRow.total : 0;

    // 2. Low stock count (stock_quantity <= seuil_alerte)
    const alertRow = db.prepare('SELECT COUNT(*) AS low_count FROM products WHERE stock_quantity <= seuil_alerte').get();
    const lowStockCount = alertRow ? alertRow.low_count : 0;

    // 3. Inventory valuation (cost price vs selling price)
    const valRow = db.prepare(`
      SELECT 
        COALESCE(SUM(prix_achat * stock_quantity), 0) AS total_cost_value,
        COALESCE(SUM(price * stock_quantity), 0) AS total_selling_value
      FROM products
    `).get();

    const totalCostValue = Number(valRow?.total_cost_value || 0);
    const totalSellingValue = Number(valRow?.total_selling_value || 0);
    const potentialProfit = Math.max(0, totalSellingValue - totalCostValue);
    const averageMargin = totalCostValue > 0 ? Number(((potentialProfit / totalCostValue) * 100).toFixed(1)) : 0;

    // 4. Critical low stock items list
    const lowStockItems = db.prepare(`
      SELECT 
        p.id, 
        p.barcode, 
        p.name, 
        p.price, 
        p.prix_achat, 
        p.stock_quantity, 
        p.seuil_alerte, 
        p.is_weighted,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock_quantity <= p.seuil_alerte
      ORDER BY (p.stock_quantity - p.seuil_alerte) ASC, p.stock_quantity ASC
      LIMIT 8
    `).all();

    // 5. Category breakdown
    const categoryDistribution = db.prepare(`
      SELECT 
        c.id, 
        c.name, 
        COUNT(p.id) AS product_count,
        COALESCE(SUM(p.price * p.stock_quantity), 0) AS total_value
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY product_count DESC
    `).all();

    // 6. Expiration Tracking (Péremptions dans les 30 jours & Déjà périmés)
    const expiringItems = db.prepare(`
      SELECT 
        p.id,
        p.barcode,
        p.name,
        p.price,
        p.prix_achat,
        p.stock_quantity,
        p.date_expiration,
        c.name AS category_name,
        CAST((julianday(p.date_expiration) - julianday('now', 'localtime')) AS INTEGER) AS days_remaining
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.date_expiration IS NOT NULL AND TRIM(p.date_expiration) != ''
        AND julianday(p.date_expiration) - julianday('now', 'localtime') <= 30
      ORDER BY p.date_expiration ASC
      LIMIT 10
    `).all();

    const expiredCount = expiringItems.filter(i => Number(i.days_remaining) < 0).length;
    const expiringCount = expiringItems.filter(i => Number(i.days_remaining) >= 0 && Number(i.days_remaining) <= 30).length;

    // 7. Real Sales Today from sales table
    const todaySalesRow = db.prepare(`
      SELECT 
        COUNT(CASE WHEN sale_type = 'sale' THEN 1 END) AS sales_count,
        COUNT(CASE WHEN sale_type = 'return' THEN 1 END) AS returns_count,
        COALESCE(SUM(CASE WHEN sale_type = 'sale' THEN total_amount ELSE 0 END), 0) AS gross_sales,
        COALESCE(SUM(CASE WHEN sale_type = 'return' THEN ABS(total_amount) ELSE 0 END), 0) AS total_returns
      FROM sales
      WHERE DATE(created_at) = DATE('now', 'localtime')
    `).get();

    const realGross = Number(todaySalesRow?.gross_sales || 0);
    const realReturns = Number(todaySalesRow?.total_returns || 0);
    const salesToday = Number((realGross - realReturns).toFixed(2));
    const transactionsToday = Number((todaySalesRow?.sales_count || 0) + (todaySalesRow?.returns_count || 0));

    // Real net profit today
    const profitTodayRow = db.prepare(`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN si.is_return = 0 THEN (si.total_price - (si.cost_price * si.quantity * si.multiplier))
            ELSE - (si.total_price - (si.cost_price * ABS(si.quantity) * si.multiplier))
          END
        ), 0) AS net_profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) = DATE('now', 'localtime')
    `).get();

    const netProfitToday = Number(profitTodayRow?.net_profit || 0);

    res.json({
      success: true,
      data: {
        kpi: {
          totalProducts,
          lowStockCount,
          totalCostValue,
          totalSellingValue,
          potentialProfit,
          averageMargin,
          salesToday,
          netProfitToday,
          transactionsToday,
          expiringCount,
          expiredCount
        },
        lowStockItems,
        categoryDistribution,
        expiringItems
      }
    });
  } catch (error) {
    console.error('[NovaMag Dashboard Stats Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
