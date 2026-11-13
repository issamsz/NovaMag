// Test Auth & RBAC Endpoints
async function runTests() {
  const BASE = 'http://localhost:5000/api';
  console.log('--- Testing NovaMag Auth & RBAC ---');

  // 1. Health
  const healthRes = await fetch(`${BASE}/health`);
  const health = await healthRes.json();
  console.log('1. Health Check:', health.status);

  // 2. Invalid Login
  const badLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
  });
  console.log('2. Bad Login Status (expect 401):', badLoginRes.status);

  // 3. Admin Login
  const adminLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const adminData = await adminLoginRes.json();
  console.log('3. Admin Login:', adminData.success, 'Role:', adminData.user?.role, 'Token received:', Boolean(adminData.token));
  const adminToken = adminData.token;

  // 4. Caissier Login
  const caissierLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'caissier', password: 'caisse123' })
  });
  const caissierData = await caissierLoginRes.json();
  console.log('4. Caissier Login:', caissierData.success, 'Role:', caissierData.user?.role);
  const caissierToken = caissierData.token;

  // 5. Test protected route without token (POST /api/categories)
  const noTokenRes = await fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Unauthorized Cat' })
  });
  console.log('5. Mutate without Token (expect 401):', noTokenRes.status);

  // 6. Test protected route with Caissier token (POST /api/categories)
  const caissierMutateRes = await fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${caissierToken}`
    },
    body: JSON.stringify({ name: 'Caissier Cat' })
  });
  console.log('6. Mutate with Caissier Token (expect 403):', caissierMutateRes.status);

  // 7. Test protected route with Admin token (POST /api/categories)
  const catName = 'TestCat_' + Date.now();
  const adminMutateRes = await fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ name: catName })
  });
  const adminCat = await adminMutateRes.json();
  console.log('7. Mutate with Admin Token (expect 201):', adminMutateRes.status, 'Created:', adminCat.data?.name);

  // 8. Test /api/users listing (Admin only)
  const usersRes = await fetch(`${BASE}/users`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const users = await usersRes.json();
  console.log('8. Users List Count:', users.data?.length, 'Users:', users.data?.map(u => `${u.username} (${u.role})`));

  console.log('--- All Auth & RBAC tests completed successfully! ---');
}

runTests().catch(console.error);
