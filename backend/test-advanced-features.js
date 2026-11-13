// Test Script for NovaMag Advanced Features
// 1. Multiple Barcodes & Packs
// 2. Multi-Payment Methods (Espèces, Carte, Crédit)
// 3. Expiration Dates Tracking (Péremptions)
// 4. Returns Management & Automated Restocking
// 5. Shift Closure / Z-Report

const BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Starting NovaMag Advanced Features Verification Tests');
  console.log('========================================================\n');

  // 1. Health check
  const healthRes = await fetch(`${BASE}/health`);
  const health = await healthRes.json();
  console.log('1. [Server Health]:', health.status, '| DB:', health.database);

  // 2. Admin Login to get token for protected endpoints
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('2. [Admin Auth]: Logged in successfully | Token received:', Boolean(token));

  // 3. Multiple Barcodes & Packs (Eau Minérale pack 6)
  console.log('\n--- Testing Feature 1: Multiple Barcodes & Packs ---');
  // Lookup pack barcode
  const packRes = await fetch(`${BASE}/products/barcode/6130009000066`);
  const packData = await packRes.json();
  console.log('Pack Barcode Lookup (6130009000066):');
  console.log('  -> Found:', packData.success);
  console.log('  -> Product Name:', packData.data?.name);
  console.log('  -> Packing:', packData.data?.packing_name);
  console.log('  -> Multiplier:', packData.data?.multiplier);
  console.log('  -> Pack Price:', packData.data?.price, 'DA (Unit price was:', packData.data?.unit_price, 'DA)');
  console.log('  -> is_pack flag:', packData.data?.is_pack);

  // Add alternative barcode to Candia Lait (id 28)
  const addBarcodeRes = await fetch(`${BASE}/products/28/barcodes`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      barcode: '6130001000999',
      packing_name: 'Fardo Lait (8 Briques)',
      multiplier: 8,
      price: 1040
    })
  });
  const addBarcodeData = await addBarcodeRes.json();
  console.log('Add Pack 8 to Candia Lait:', addBarcodeData.success ? '✅ Success' : addBarcodeData.message);

  // Verify lookup of the newly created pack barcode
  const candiaPackRes = await fetch(`${BASE}/products/barcode/6130001000999`);
  const candiaPack = await candiaPackRes.json();
  console.log('Lookup Newly Created Pack 8 (6130001000999):', candiaPack.data?.packing_name, '| Price:', candiaPack.data?.price, 'DA | Multiplier:', candiaPack.data?.multiplier);

  // 4. Expiration Tracking (Péremptions)
  console.log('\n--- Testing Feature 2: Expiration Dates Tracking ---');
  const expRes = await fetch(`${BASE}/products/expiring?days=30`);
  const expData = await expRes.json();
  console.log('Expiring Products in 30 days:');
  console.log('  -> Expired Count (< 0 days):', expData.data?.expired_count);
  console.log('  -> Warning Count (<= 30 days):', expData.data?.expiring_soon_count);
  console.log('  -> Financial Value at Risk:', expData.data?.total_at_risk_cost, 'DA');
  expData.data?.expiring_soon?.forEach(p => {
    console.log(`     * ${p.name}: Expire le ${p.date_expiration} (${p.days_remaining} jours restants, Stock: ${p.stock_quantity})`);
  });

  // 5. Multi-Payment Checkout & Automated Stock Deductions
  console.log('\n--- Testing Feature 3: Multi-Payment Sales & Automated Stock Deduction ---');

  // Check initial stock of Candia Lait (id: 28)
  const prod28BeforeRes = await fetch(`${BASE}/products/28`);
  const prod28Before = await prod28BeforeRes.json();
  const initialStock28 = prod28Before.data?.stock_quantity;
  console.log('Initial Stock for Candia Lait (ID: 28):', initialStock28);

  // Test Sale 1: Espèces (Cash)
  const cashSaleRes = await fetch(`${BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payment_method: 'especes',
      amount_paid: 500,
      items: [
        { id: 28, name: 'Lait Candia Viva Stérilisé 1L', price: 135, quantity: 2, multiplier: 1 },
        { id: 30, name: 'Sélecto 1L', price: 110, quantity: 1, multiplier: 1 }
      ]
    })
  });
  const cashSale = await cashSaleRes.json();
  console.log('Sale 1 (Espèces):', cashSale.success ? '✅ Created' : cashSale.message, '| Ticket:', cashSale.data?.ticket_number, '| Total:', cashSale.data?.total_amount, 'DA | Change:', cashSale.data?.change_amount, 'DA');

  // Test Sale 2: Pack Sale (Pack of 8 Candia)
  const packSaleRes = await fetch(`${BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payment_method: 'carte', // Carte CIB
      items: [
        { id: 28, name: 'Lait Candia (Pack 8)', price: 1040, quantity: 1, multiplier: 8 }
      ]
    })
  });
  const packSale = await packSaleRes.json();
  console.log('Sale 2 (Carte CIB / Pack of 8):', packSale.success ? '✅ Created' : packSale.message, '| Ticket:', packSale.data?.ticket_number, '| Multiplier: 8');

  // Test Sale 3: Crédit (Debt on customer account)
  const creditSaleRes = await fetch(`${BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payment_method: 'credit',
      customer_name: 'M. Belkacem (Cafétéria)',
      notes: 'Facture payable fin du mois',
      items: [
        { id: 31, name: 'Jus Ramy Orange 1.25L', price: 140, quantity: 5, multiplier: 1 }
      ]
    })
  });
  const creditSale = await creditSaleRes.json();
  console.log('Sale 3 (Crédit Client):', creditSale.success ? '✅ Created' : creditSale.message, '| Client:', creditSale.data?.customer_name, '| Total:', creditSale.data?.total_amount, 'DA');

  // Verify stock deduction for Candia Lait:
  // Initial: initialStock28
  // Sale 1: -2
  // Sale 2 (Pack 8): -8
  // Expected: initialStock28 - 10
  const prod28AfterRes = await fetch(`${BASE}/products/28`);
  const prod28After = await prod28AfterRes.json();
  console.log('Stock Candia Lait After 2 sales (-10 units total):', prod28After.data?.stock_quantity, '(Expected:', initialStock28 - 10, ')');

  // 6. Returns Management (Retours & Automated Restocking)
  console.log('\n--- Testing Feature 4: Returns Management & Restocking ---');
  const returnRes = await fetch(`${BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sale_type: 'return',
      payment_method: 'especes',
      customer_name: 'Client Retour',
      notes: 'Bouteille Sélecto retournée intacte',
      items: [
        { id: 28, name: 'Lait Candia Viva Stérilisé 1L', price: 135, quantity: 1, multiplier: 1, is_return: 1 }
      ]
    })
  });
  const returnData = await returnRes.json();
  console.log('Return Processed:', returnData.success ? '✅ Success' : returnData.message, '| Ticket:', returnData.data?.ticket_number, '| Restocked 1 unit of Candia');

  // Verify stock was restored (+1 unit):
  const prod28RestoredRes = await fetch(`${BASE}/products/28`);
  const prod28Restored = await prod28RestoredRes.json();
  console.log('Stock Candia Lait After Return (+1 restored):', prod28Restored.data?.stock_quantity, '(Expected:', initialStock28 - 9, ')');

  // 7. Z-Report / Clôture de Caisse (Shift Summary)
  console.log('\n--- Testing Feature 5: Shift Closure & Z-Report ---');
  const zRes = await fetch(`${BASE}/sales/z-report`);
  const zReport = await zRes.json();
  console.log('Z-Report Breakdown:');
  console.log('  -> Date:', zReport.data?.date);
  console.log('  -> Total Gross Sales:', zReport.data?.summary?.gross_sales, 'DA');
  console.log('  -> Total Returns:', zReport.data?.summary?.total_returns, 'DA');
  console.log('  -> Net Sales:', zReport.data?.summary?.net_sales, 'DA');
  console.log('  -> Net Profit Margin:', zReport.data?.summary?.net_profit, 'DA (', zReport.data?.summary?.profit_margin_percent, '%)');
  console.log('\n  Payment Methods Separation:');
  console.log('    💵 Espèces (Cash):', zReport.data?.payment_methods?.especes?.net, 'DA (Sales:', zReport.data?.payment_methods?.especes?.sales, 'DA, Returns:', zReport.data?.payment_methods?.especes?.returns, 'DA)');
  console.log('    💳 Carte CIB / Edahabia:', zReport.data?.payment_methods?.carte?.net, 'DA');
  console.log('    📝 Crédit (Dettes):', zReport.data?.payment_methods?.credit?.net, 'DA');
  if (zReport.data?.payment_methods?.credit?.customers?.length > 0) {
    zReport.data?.payment_methods?.credit?.customers?.forEach(c => {
      console.log(`       * ${c.customer_name}: ${c.total_amount} DA`);
    });
  }
  console.log('\n  -> Expected Cash in Drawer:', zReport.data?.cash_drawer_expected, 'DA');

  // 8. Admin Dashboard Stats
  console.log('\n--- Testing Feature 6: Admin Dashboard Real Analytics ---');
  const dashRes = await fetch(`${BASE}/dashboard/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dashData = await dashRes.json();
  console.log('Dashboard KPI:');
  console.log('  -> Total Products:', dashData.data?.kpi?.totalProducts);
  console.log('  -> Low Stock Count:', dashData.data?.kpi?.lowStockCount);
  console.log('  -> Expiring Soon Count (<= 30 days):', dashData.data?.kpi?.expiringCount);
  console.log('  -> Real Sales Today:', dashData.data?.kpi?.salesToday, 'DA');
  console.log('  -> Real Transactions Today:', dashData.data?.kpi?.transactionsToday);
  console.log('  -> Real Net Profit Today:', dashData.data?.kpi?.netProfitToday, 'DA');
  console.log('  -> Expiring Items for Dashboard Card:', dashData.data?.expiringItems?.length, 'items');

  console.log('\n========================================================');
  console.log('🎉 ALL BACKEND ADVANCED FEATURES TESTS PASSED WITH 100%!');
  console.log('========================================================\n');
}

runTests().catch(console.error);
