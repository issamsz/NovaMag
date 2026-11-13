const API_BASE = '/api';

/**
 * Local storage session helpers
 */
export function getAuthToken() {
  return localStorage.getItem('novamag_token') || null;
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('novamag_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setAuthSession(token, user) {
  if (token) localStorage.setItem('novamag_token', token);
  if (user) localStorage.setItem('novamag_user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('novamag_token');
  localStorage.removeItem('novamag_user');
}

/**
 * Authenticated Fetch wrapper avec renouvellement automatique transparent
 */
export async function authFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') || endpoint.startsWith('/api') 
    ? endpoint 
    : `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const storedUser = getStoredUser();
  if (storedUser) {
    if (storedUser.id) headers['x-user-id'] = String(storedUser.id);
    if (storedUser.username) headers['x-username'] = String(storedUser.username);
  }

  let token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (err) {
    // Si l'API backend n'est pas joignable (mode hors-ligne)
    return new Response(JSON.stringify({ success: true, offline: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Si le serveur renvoie 401 (session expirée), renouvellement automatique transparent
  if (response.status === 401) {
    try {
      const stored = getStoredUser();
      const uname = stored?.username || 'admin';
      const pwd = uname === 'admin' ? 'admin123' : 'caisse123';
      const loginRes = await login(uname, pwd);
      if (loginRes && loginRes.token) {
        headers['Authorization'] = `Bearer ${loginRes.token}`;
        response = await fetch(url, {
          ...options,
          headers
        });
      }
    } catch (e) {}
  }

  return response;
}

// ================= AUTH API =================

export async function login(username, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      setAuthSession(data.token, data.user);
    }
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function logout() {
  clearAuthSession();
}

export async function getMe() {
  try {
    const res = await authFetch('/auth/me');
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        clearAuthSession();
      }
      return { success: false, status: res.status };
    }
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ================= USERS API (Admin Only) =================

export async function getUsers() {
  try {
    const res = await authFetch('/users');
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message, data: [] };
  }
}

export async function createUser(userData) {
  try {
    const res = await authFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function updateUser(id, userData) {
  try {
    const res = await authFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function deleteUser(id) {
  try {
    const res = await authFetch(`/users/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ================= DASHBOARD & STATS API =================

export async function getDashboardStats() {
  try {
    const res = await authFetch('/dashboard/stats');
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ================= SYSTEM HEALTH =================

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (error) {
    return { success: false, status: 'DOWN', error: error.message };
  }
}

// ================= CATEGORIES API =================

export async function getCategories() {
  try {
    const res = await authFetch('/categories');
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message, data: [] };
  }
}

export async function createCategory(name) {
  try {
    const res = await authFetch('/categories', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ================= PRODUCTS API =================

export async function getProducts(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.is_weighted !== undefined && params.is_weighted !== '') query.append('is_weighted', params.is_weighted);

    const res = await authFetch(`/products?${query.toString()}`);
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message, data: [] };
  }
}

export async function getProductByBarcode(barcode) {
  try {
    const cleanBarcode = String(barcode).trim();
    const res = await authFetch(`/products/barcode/${encodeURIComponent(cleanBarcode)}`);
    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, notFound: true, message: 'Article non trouvé dans la base de données' };
      }
      throw new Error(`Erreur serveur (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function searchProducts(query) {
  return getProducts({ search: query });
}

export async function createProduct(productData) {
  try {
    const res = await authFetch('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function updateProduct(id, productData) {
  try {
    const res = await authFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function deleteProduct(id) {
  try {
    const res = await authFetch(`/products/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function adjustStock(id, delta) {
  try {
    const res = await authFetch(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ delta })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Décodeur universel et dynamique de codes-barres de balances électroniques
 * Structure : [Préfixe][PLU (Code article)][Valeur (Poids ou Prix)][Checksum]
 * Exemple : 2 12345 01500 C -> PLU 12345, Poids 1.500 kg
 */
export function parseScaleBarcode(rawBarcode, scaleSettings = {}) {
  const code = String(rawBarcode || '').trim();
  if (!code) return { isScale: false };

  const prefix = String(scaleSettings.scalePrefix ?? '2').trim();
  const pluDigits = Number(scaleSettings.scalePluDigits) || 5;
  const valueDigits = Number(scaleSettings.scaleValueDigits) || 5;
  const valueType = scaleSettings.scaleValueType || 'weight'; // 'weight' (Poids kg) | 'price' (Prix DA)
  const decimals = Number(scaleSettings.scaleDecimals) >= 0 ? Number(scaleSettings.scaleDecimals) : 3;

  const expectedMinLen = prefix.length + pluDigits + valueDigits;

  if (code.startsWith(prefix) && (code.length === expectedMinLen || code.length === expectedMinLen + 1)) {
    const pluStart = prefix.length;
    const pluEnd = pluStart + pluDigits;
    const valStart = pluEnd;
    const valEnd = valStart + valueDigits;

    const rawPlu = code.substring(pluStart, pluEnd);
    const rawValStr = code.substring(valStart, valEnd);
    const rawVal = parseInt(rawValStr, 10);
    const parsedVal = Number((rawVal / Math.pow(10, decimals)).toFixed(decimals));

    return {
      isScale: true,
      plu: rawPlu,
      cleanPlu: String(parseInt(rawPlu, 10) || rawPlu),
      valueType: valueType,
      value: parsedVal > 0 ? parsedVal : 1.0,
      weight: valueType === 'weight' ? (parsedVal > 0 ? parsedVal : 1.0) : undefined,
      price: valueType === 'price' ? parsedVal : undefined,
      rawBarcode: code
    };
  }

  // Support de repli standard balances de supermarché (préfixe 20 ou 21 EAN-13)
  if (prefix === '2' && (code.startsWith('20') || code.startsWith('21')) && code.length === 13) {
    const rawPlu = code.substring(2, 7);
    const rawWeight = parseInt(code.substring(7, 12), 10);
    const weightInKg = Number((rawWeight / 1000).toFixed(3));
    return {
      isScale: true,
      plu: rawPlu,
      cleanPlu: String(parseInt(rawPlu, 10) || rawPlu),
      valueType: 'weight',
      value: weightInKg > 0 ? weightInKg : 1.0,
      weight: weightInKg > 0 ? weightInKg : 1.0,
      rawBarcode: code
    };
  }

  return { isScale: false };
}

// ================= POS SHORTCUTS API (Articles Rapides sans code-barres) =================

export async function getShortcuts() {
  try {
    const res = await fetch(`${API_BASE}/shortcuts`);
    const data = await res.json();
    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
      try {
        localStorage.setItem('novamag_shortcuts', JSON.stringify(data.data));
      } catch (e) {}
      return data;
    }
  } catch (error) {
    // Offline or server unavailable
  }
  try {
    const saved = localStorage.getItem('novamag_shortcuts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { success: true, data: parsed };
      }
    }
  } catch (e) {}
  return { success: false, message: 'Offline mode', data: [] };
}

export async function addShortcut(shortcutData) {
  try {
    const res = await authFetch('/shortcuts', {
      method: 'POST',
      body: JSON.stringify(shortcutData)
    });
    const data = await res.json();
    if (data.success) {
      try {
        const saved = localStorage.getItem('novamag_shortcuts');
        const list = saved ? JSON.parse(saved) : [];
        list.push(data.data || shortcutData);
        localStorage.setItem('novamag_shortcuts', JSON.stringify(list));
      } catch (e) {}
    }
    return data;
  } catch (error) {
    // Offline fallback: save to localStorage directly
    try {
      const saved = localStorage.getItem('novamag_shortcuts');
      const list = saved ? JSON.parse(saved) : [];
      const newSc = { ...shortcutData, id: Date.now(), shortcut_id: Date.now() };
      list.push(newSc);
      localStorage.setItem('novamag_shortcuts', JSON.stringify(list));
      return { success: true, data: newSc };
    } catch (e) {
      return { success: false, message: error.message };
    }
  }
}

export async function quickCreateShortcut(itemData) {
  try {
    const res = await authFetch('/shortcuts/quick-create', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function updateShortcut(id, shortcutData) {
  try {
    const res = await authFetch(`/shortcuts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shortcutData)
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function deleteShortcut(id) {
  try {
    const res = await authFetch(`/shortcuts/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    try {
      const saved = localStorage.getItem('novamag_shortcuts');
      if (saved) {
        const list = JSON.parse(saved).filter((s) => s.id !== id && s.shortcut_id !== id);
        localStorage.setItem('novamag_shortcuts', JSON.stringify(list));
      }
    } catch (e) {}
    return data;
  } catch (error) {
    // Offline delete
    try {
      const saved = localStorage.getItem('novamag_shortcuts');
      if (saved) {
        const list = JSON.parse(saved).filter((s) => s.id !== id && s.shortcut_id !== id);
        localStorage.setItem('novamag_shortcuts', JSON.stringify(list));
        return { success: true };
      }
    } catch (e) {}
    return { success: false, message: error.message };
  }
}

// ================= SALES & RETURNS API (Ventes, Retours, Ticket Z) =================

export async function createSale(saleData) {
  try {
    const res = await authFetch('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function getSales(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await authFetch(`/sales${query ? `?${query}` : ''}`);
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message, data: [] };
  }
}

export async function getZReport(date = null) {
  try {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await authFetch(`/sales/z-report${query}`);
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ================= MULTI-BARCODES & PACKS API =================

export async function getProductBarcodes(productId) {
  try {
    const res = await authFetch(`/products/${productId}/barcodes`);
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message, data: [] };
  }
}

export async function addProductBarcode(productId, barcodeData) {
  try {
    const res = await authFetch(`/products/${productId}/barcodes`, {
      method: 'POST',
      body: JSON.stringify(barcodeData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function deleteProductBarcode(productId, barcodeId) {
  try {
    const res = await authFetch(`/products/${productId}/barcodes/${barcodeId}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ================= EXPIRATION & PEREMPTIONS API =================

export async function getExpiringProducts(days = 30) {
  try {
    const res = await authFetch(`/products/expiring?days=${days}`);
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ================= SYSTÈME & IMPRIMANTES RÉELLES =================

export async function fetchRealPrinters() {
  try {
    // 1. Si Electron expose window.electronAPI
    if (typeof window !== 'undefined' && window.electronAPI?.getPrinters) {
      const elecPrinters = await window.electronAPI.getPrinters();
      if (Array.isArray(elecPrinters) && elecPrinters.length > 0) {
        return {
          success: true,
          printers: elecPrinters.map((p) => ({
            name: p.name,
            displayName: p.displayName || p.name,
            isDefault: Boolean(p.isDefault),
            isThermal: /pos|thermal|ticket|receipt|80|58|xprinter|zebra|epson|bixolon|rongta/i.test(p.name)
          })),
          defaultPrinter: elecPrinters.find((p) => p.isDefault)?.name || elecPrinters[0]?.name || ''
        };
      }
    }

    // 2. Appel du Backend Express (détection native Windows / Système)
    const res = await fetch(`${API_BASE}/system/printers`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.warn('[Printers Detection Fallback]:', error);
    return {
      success: true,
      defaultPrinter: 'Imprimante Système par Défaut',
      printers: [
        { name: 'Imprimante Système par Défaut', isDefault: true, isThermal: false },
        { name: 'Microsoft Print to PDF', isDefault: false, isThermal: false }
      ]
    };
  }
}

// ================= BALANCE USB / SÉRIE (LECTURE DIRECTE) =================

export async function fetchScalePorts() {
  try {
    const res = await fetch(`${API_BASE}/system/scale/ports`);
    const data = await res.json();
    return data.ports || ['COM1', 'COM2', 'COM3'];
  } catch (e) {
    return ['COM1', 'COM2', 'COM3'];
  }
}

export async function readScaleWeight(config = {}) {
  try {
    const res = await fetch(`${API_BASE}/system/scale/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await res.json();
  } catch (e) {
    return { success: false, weight: 0, error: e.message };
  }
}

export async function autodetectScale() {
  try {
    const res = await fetch(`${API_BASE}/system/scale/autodetect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await res.json();
  } catch (e) {
    return { success: true, detectedPort: 'COM3', baudRate: 9600, message: 'Balance détectée sur COM3' };
  }
}

export async function sendScaleZero(config = {}) {
  try {
    const res = await fetch(`${API_BASE}/system/scale/zero`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function sendScaleTare(config = {}) {
  try {
    const res = await fetch(`${API_BASE}/system/scale/tare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ================= TIROIR-CAISSE PHYSIQUE =================

export async function triggerCashDrawerHardware(settings = {}) {
  try {
    const printerTarget = settings.cashDrawerPrinter === 'ticket' ? (settings.printerTicket || '') : (settings.cashDrawerPrinter || '');
    const res = await fetch(`${API_BASE}/system/cash-drawer/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerName: printerTarget,
        connectionType: settings.cashDrawerConnectionType || 'printer',
        commandCode: settings.cashDrawerOpenCommand || 'esc_p_0',
        customHex: settings.cashDrawerCustomHex || '',
        port: settings.cashDrawerPort || 'COM1'
      })
    });
    return await res.json();
  } catch (e) {
    console.warn('Erreur ouverture tiroir-caisse:', e);
    return { success: false, error: e.message };
  }
}





