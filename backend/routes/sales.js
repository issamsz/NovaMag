const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * POST /api/sales - Process a complete POS checkout sale or return
 * Supports:
 * 1. Multiple payment methods: 'especes', 'carte', 'credit'
 * 2. Sale & Return modes: 'sale', 'return'
 * 3. Pack multipliers (e.g. Pack 6 deductions from base stock)
 * 4. Automatic transaction-safe inventory stock updates
 */
router.post('/', (req, res) => {
  try {
    const {
      items = [],
      payment_method = 'especes',
      amount_paid = 0,
      customer_name = null,
      sale_type = 'sale', // 'sale' | 'return'
      notes = null,
      user_id = null
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Le ticket doit contenir au moins un article' });
    }

    const validPaymentMethods = ['especes', 'carte', 'credit'];
    if (!validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: `Mode de paiement invalide (${payment_method}). Choix: especes, carte, credit`
      });
    }

    const validSaleTypes = ['sale', 'return'];
    if (!validSaleTypes.includes(sale_type)) {
      return res.status(400).json({
        success: false,
        message: `Type d'opération invalide (${sale_type}). Choix: sale, return`
      });
    }

    // Generate unique readable ticket number e.g. TK-20261022-8492
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = sale_type === 'return' ? 'RET' : 'TK';
    const ticketNumber = `${prefix}-${dateStr}-${randSuffix}`;

    // Compute grand total and prepare items data
    let grandTotal = 0;
    const preparedItems = [];

    for (const item of items) {
      const prodId = Number(item.id || item.product_id);
      const qty = parseFloat(item.quantity) || 1;
      const unitPrice = parseFloat(item.price) || 0;
      const multiplier = Math.max(1, parseFloat(item.multiplier) || 1);
      const isItemReturn = item.is_return || sale_type === 'return' ? 1 : 0;
      const lineTotal = Number((qty * unitPrice).toFixed(2));

      // Fetch current cost price (prix_achat) and product info from DB
      const prodInDb = db.prepare('SELECT id, name, prix_achat, stock_quantity FROM products WHERE id = ?').get(prodId);
      const costPrice = prodInDb ? Number(prodInDb.prix_achat || 0) : 0;
      const prodName = prodInDb ? prodInDb.name : (item.name || 'Article');

      grandTotal += lineTotal;

      preparedItems.push({
        product_id: prodId,
        product_name: prodName,
        barcode_used: item.barcode || item.barcode_scanned || null,
        quantity: qty,
        multiplier: multiplier,
        unit_price: unitPrice,
        total_price: lineTotal,
        cost_price: costPrice,
        is_return: isItemReturn
      });
    }

    const finalTotal = Number(grandTotal.toFixed(2));
    const paid = parseFloat(amount_paid) || (payment_method === 'especes' ? finalTotal : finalTotal);
    const change = payment_method === 'especes' && paid > finalTotal ? Number((paid - finalTotal).toFixed(2)) : 0;

    // Execute atomic SQLite transaction
    db.exec('BEGIN TRANSACTION;');
    let createdSaleId;
    try {
      // 1. Insert into sales table
      const insertSaleStmt = db.prepare(`
        INSERT INTO sales (
          ticket_number, user_id, total_amount, amount_paid, change_amount,
          payment_method, customer_name, sale_type, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
      `);

      const saleInfo = insertSaleStmt.run(
        ticketNumber,
        user_id ? Number(user_id) : null,
        finalTotal,
        paid,
        change,
        payment_method,
        customer_name ? String(customer_name).trim() : null,
        sale_type,
        notes ? String(notes).trim() : null
      );

      createdSaleId = Number(saleInfo.lastInsertRowid);

      // 2. Insert each sale item and adjust product inventory stock
      const insertItemStmt = db.prepare(`
        INSERT INTO sale_items (
          sale_id, product_id, barcode_used, product_name,
          quantity, multiplier, unit_price, total_price, cost_price, is_return
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const deductStockStmt = db.prepare(`
        UPDATE products 
        SET stock_quantity = stock_quantity - ? 
        WHERE id = ?
      `);

      const restoreStockStmt = db.prepare(`
        UPDATE products 
        SET stock_quantity = stock_quantity + ? 
        WHERE id = ?
      `);

      for (const it of preparedItems) {
        insertItemStmt.run(
          createdSaleId,
          it.product_id,
          it.barcode_used,
          it.product_name,
          it.quantity,
          it.multiplier,
          it.unit_price,
          it.total_price,
          it.cost_price,
          it.is_return
        );

        // Stock calculation: quantity * multiplier (e.g. 1 pack of 6 bottles deductions 6 units)
        const totalUnits = Math.abs(it.quantity) * it.multiplier;

        if (it.is_return === 1 || sale_type === 'return') {
          // Return: Restock units into warehouse inventory
          restoreStockStmt.run(totalUnits, it.product_id);
        } else {
          // Sale: Deduct units from inventory
          deductStockStmt.run(totalUnits, it.product_id);
        }
      }

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    // Fetch complete created sale for POS response
    const fullSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(createdSaleId);
    const fullItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(createdSaleId);

    res.status(201).json({
      success: true,
      data: {
        ...fullSale,
        items: fullItems
      },
      message: sale_type === 'return' 
        ? `Retour ${ticketNumber} enregistré avec succès (articles réintégrés au stock)` 
        : `Vente ${ticketNumber} enregistrée avec succès`
    });
  } catch (error) {
    console.error('[NovaMag Sales Transaction Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/sales - List sales history with filters
 */
router.get('/', (req, res) => {
  try {
    const { 
      date, 
      payment_method, 
      sale_type, 
      customer_name, 
      limit = 50, 
      offset = 0 
    } = req.query;

    let query = `
      SELECT 
        s.*,
        u.username,
        u.full_name AS cashier_name,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) AS items_count
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ` AND DATE(s.created_at) = DATE(?)`;
      params.push(date);
    }

    if (payment_method) {
      query += ` AND s.payment_method = ?`;
      params.push(payment_method);
    }

    if (sale_type) {
      query += ` AND s.sale_type = ?`;
      params.push(sale_type);
    }

    if (customer_name) {
      query += ` AND s.customer_name LIKE ?`;
      params.push(`%${customer_name}%`);
    }

    query += ` ORDER BY s.id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const sales = db.prepare(query).all(...params);

    // Get total count
    const countRow = db.prepare('SELECT COUNT(*) AS total FROM sales').get();

    res.json({ success: true, count: sales.length, total: countRow?.total || 0, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/sales/z-report - Ticket Z / Clôture de Caisse (Shift Closure Report)
 * Breaks down revenues by:
 * - Espèces (Cash)
 * - Carte CIB / Edahabia
 * - Crédit (Dettes)
 * - Retours / Remboursements
 */
router.get('/z-report', (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    const userId = req.query.user_id ? Number(req.query.user_id) : null;

    let userFilter = '';
    const baseParams = [targetDate];
    if (userId) {
      userFilter = ' AND s.user_id = ?';
      baseParams.push(userId);
    }

    // 1. Overall Sales and Returns Totals
    const totalsRow = db.prepare(`
      SELECT 
        COUNT(CASE WHEN s.sale_type = 'sale' THEN 1 END) AS sales_count,
        COUNT(CASE WHEN s.sale_type = 'return' THEN 1 END) AS returns_count,
        COALESCE(SUM(CASE WHEN s.sale_type = 'sale' THEN s.total_amount ELSE 0 END), 0) AS gross_sales,
        COALESCE(SUM(CASE WHEN s.sale_type = 'return' THEN ABS(s.total_amount) ELSE 0 END), 0) AS total_returns
      FROM sales s
      WHERE DATE(s.created_at) = DATE(?) ${userFilter}
    `).get(...baseParams);

    const grossSales = Number(totalsRow?.gross_sales || 0);
    const totalReturns = Number(totalsRow?.total_returns || 0);
    const netSales = Number((grossSales - totalReturns).toFixed(2));
    const totalTransactions = Number((totalsRow?.sales_count || 0) + (totalsRow?.returns_count || 0));

    // 2. Breakdown By Payment Method (Espèces, Carte, Crédit)
    const methodsBreakdown = db.prepare(`
      SELECT 
        s.payment_method,
        s.sale_type,
        COUNT(s.id) AS count,
        COALESCE(SUM(s.total_amount), 0) AS amount
      FROM sales s
      WHERE DATE(s.created_at) = DATE(?) ${userFilter}
      GROUP BY s.payment_method, s.sale_type
    `).all(...baseParams);

    const paymentSummary = {
      especes: { sales: 0, returns: 0, net: 0, count: 0 },
      carte: { sales: 0, returns: 0, net: 0, count: 0 },
      credit: { sales: 0, returns: 0, net: 0, count: 0 }
    };

    methodsBreakdown.forEach((row) => {
      const m = row.payment_method;
      if (paymentSummary[m]) {
        if (row.sale_type === 'sale') {
          paymentSummary[m].sales += Number(row.amount);
          paymentSummary[m].count += Number(row.count);
        } else if (row.sale_type === 'return') {
          paymentSummary[m].returns += Math.abs(Number(row.amount));
          paymentSummary[m].count += Number(row.count);
        }
      }
    });

    // Compute net for each payment method
    Object.keys(paymentSummary).forEach((k) => {
      paymentSummary[k].net = Number((paymentSummary[k].sales - paymentSummary[k].returns).toFixed(2));
    });

    // 3. Outstanding / Newly Registered Credit Debts Today
    const creditsList = db.prepare(`
      SELECT 
        s.id,
        s.ticket_number,
        COALESCE(s.customer_name, 'Client Anonyme') AS customer_name,
        s.total_amount,
        s.created_at,
        s.notes
      FROM sales s
      WHERE DATE(s.created_at) = DATE(?) AND s.payment_method = 'credit' ${userFilter}
      ORDER BY s.id DESC
    `).all(...baseParams);

    // 4. Profit Margin Analysis (Ventes - Coût d'achat)
    const profitRow = db.prepare(`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN si.is_return = 0 THEN (si.total_price - (si.cost_price * si.quantity * si.multiplier))
            ELSE - (si.total_price - (si.cost_price * ABS(si.quantity) * si.multiplier))
          END
        ), 0) AS total_profit,
        COALESCE(SUM(
          CASE WHEN si.is_return = 0 THEN si.quantity * si.multiplier ELSE 0 END
        ), 0) AS total_units_sold
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE DATE(s.created_at) = DATE(?) ${userFilter}
    `).get(...baseParams);

    const netProfit = Number(profitRow?.total_profit || 0);
    const profitMarginPercent = netSales > 0 ? Number(((netProfit / netSales) * 100).toFixed(1)) : 0;
    const totalUnitsSold = Number(profitRow?.total_units_sold || 0);

    res.json({
      success: true,
      data: {
        date: targetDate,
        generated_at: new Date().toISOString(),
        summary: {
          gross_sales: grossSales,
          total_returns: totalReturns,
          net_sales: netSales,
          net_profit: netProfit,
          profit_margin_percent: profitMarginPercent,
          total_transactions: totalTransactions,
          sales_count: totalsRow?.sales_count || 0,
          returns_count: totalsRow?.returns_count || 0,
          total_units_sold: totalUnitsSold
        },
        payment_methods: {
          especes: {
            label: 'Espèces (Cash)',
            ...paymentSummary.especes
          },
          carte: {
            label: 'Carte CIB / Edahabia',
            ...paymentSummary.carte
          },
          credit: {
            label: 'Crédit (Dettes)',
            ...paymentSummary.credit,
            customers: creditsList
          }
        },
        cash_drawer_expected: paymentSummary.especes.net
      }
    });
  } catch (error) {
    console.error('[NovaMag Z-Report Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/sales/:id - Get details of a single sale ticket
 */
router.get('/:id', (req, res) => {
  try {
    const saleId = Number(req.params.id);
    const sale = db.prepare(`
      SELECT s.*, u.username, u.full_name AS cashier_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(saleId);

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Ticket de vente non trouvé' });
    }

    const items = db.prepare(`
      SELECT 
        si.*,
        p.barcode AS current_product_barcode
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(saleId);

    res.json({ success: true, data: { ...sale, items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
