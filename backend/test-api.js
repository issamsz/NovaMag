const http = require('http');
const app = require('./server');

const PORT = 5055;
const server = http.createServer(app);

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: encodeURI(path),
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  server.listen(PORT, async () => {
    console.log(`\n🧪 [NovaMag Test Suite] Starting API verification tests on port ${PORT}...`);
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
      if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
      }
    }

    try {
      // 1. Health check
      const health = await request('GET', '/api/health');
      assert(health.status === 200 && health.body.status === 'UP', 'Health check endpoint returns UP');

      // 2. Create Category
      const catRes = await request('POST', '/api/categories', { name: 'منتجات الألبان' });
      assert(catRes.status === 201 || (catRes.status === 409), 'Create or verify category "منتجات الألبان"');
      
      // Get category ID
      const catList = await request('GET', '/api/categories');
      assert(catList.status === 200 && catList.body.data.length >= 1, 'Get categories list');
      const catId = catList.body.data[0].id;

      // 3. Create or Update Standard Product
      const testBarcode = '6131234567890';
      const existingProduct = await request('GET', `/api/products/barcode/${testBarcode}`);
      let prod1Id;

      if (existingProduct.status === 200) {
        prod1Id = existingProduct.body.data.id;
        assert(true, 'Found existing test product with barcode');
      } else {
        const prod1Res = await request('POST', '/api/products', {
          name: 'حليب كانديا كانديلا 1 لتر',
          barcode: testBarcode,
          price: 135.0,
          stock_quantity: 48,
          is_weighted: 0,
          category_id: catId
        });
        assert(prod1Res.status === 201 && prod1Res.body.data.barcode === testBarcode, 'Create barcode product');
        prod1Id = prod1Res.body.data.id;
      }

      // 4. Barcode Lookup (POS Fast Route)
      const lookupRes = await request('GET', `/api/products/barcode/${testBarcode}`);
      assert(lookupRes.status === 200 && lookupRes.body.data.barcode === testBarcode, 'POS fast barcode lookup');

      // 5. Update Product (Price & Name)
      const updateRes = await request('PUT', `/api/products/${prod1Id}`, {
        price: 140.0,
        name: 'حليب كانديا كانديلا 1 لتر (معدل)'
      });
      assert(updateRes.status === 200 && updateRes.body.data.price === 140, 'Update product price');

      // 6. Stock Adjustment
      const stockRes = await request('PATCH', `/api/products/${prod1Id}/stock`, { delta: 5 });
      assert(stockRes.status === 200 && typeof stockRes.body.data.stock_quantity === 'number', 'Quick stock adjustment (+5)');

      // 7. Search Products by keyword
      const searchRes = await request('GET', '/api/products?search=كانديا');
      assert(searchRes.status === 200 && searchRes.body.data.length >= 1, 'Search products by text query');

      // 8. Filter Products by category
      const filteredRes = await request('GET', `/api/products?category_id=${catId}`);
      assert(filteredRes.status === 200 && filteredRes.body.data.length >= 1, 'Filter products by category_id');

      console.log(`\n========================================`);
      console.log(`🎯 Test Summary: ${passed} Passed, ${failed} Failed`);
      console.log(`========================================\n`);

      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    } catch (err) {
      console.error('Test execution error:', err);
      server.close(() => process.exit(1));
    }
  });
}

runTests();
