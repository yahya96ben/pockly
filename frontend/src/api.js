// ============================================================================
// API CLIENT — single source of truth for all backend calls
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Token persistence
const TOKEN_KEY = 'pk:token';
export const auth = {
  getToken: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  setToken: (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} },
  clearToken: () => { try { localStorage.removeItem(TOKEN_KEY); } catch {} },
};

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch (err) {
    throw new Error('Network error: ' + err.message);
  }

  if (res.status === 204) return null;

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const msg = (data && data.error) || `HTTP ${res.status}`;
    const e = new Error(msg);
    e.status = res.status;
    e.data = data;
    throw e;
  }
  return data;
}

// ─── Auth ──────────────────────────────────────────────────────────────
export const authApi = {
  signup: (payload) => request('POST', '/auth/signup', payload),
  login:  (payload) => request('POST', '/auth/login', payload),
  me:     () => request('GET', '/auth/me'),
};

// ─── Restaurants ───────────────────────────────────────────────────────
export const restaurantsApi = {
  list:   () => request('GET', '/restaurants'),
  get:    (id) => request('GET', `/restaurants/${id}`),
  create: (data) => request('POST', '/restaurants', data),
  update: (id, data) => request('PATCH', `/restaurants/${id}`, data),
};

// ─── Products ──────────────────────────────────────────────────────────
export const productsApi = {
  list:   (restaurantId) => request('GET', `/products?restaurantId=${encodeURIComponent(restaurantId)}`),
  create: (data) => request('POST', '/products', data),
  update: (id, data) => request('PATCH', `/products/${id}`, data),
  remove: (id) => request('DELETE', `/products/${id}`),
};

// ─── Orders ────────────────────────────────────────────────────────────
export const ordersApi = {
  // Public — no auth needed. The body must include restaurantId.
  create: (data) => request('POST', '/orders', data),
  // Merchant-only
  list:   () => request('GET', '/orders'),
  update: (id, data) => request('PATCH', `/orders/${id}`, data),
};

// ─── Health ────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => request('GET', '/health'),
};
