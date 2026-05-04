// ============================================================================
// CORS HELPER
// Sets headers so the frontend (different origin) can call the API.
// For production, replace '*' with your actual frontend domain.
// ============================================================================

export function setCors(res, origin = '*') {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Handle preflight + set CORS. Returns true if the request was handled (preflight),
 * meaning the route handler should return early.
 */
export function handleCors(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

/**
 * Read JSON body. Vercel auto-parses for req.body, but we make it safe.
 */
export function getBody(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body || {};
}
