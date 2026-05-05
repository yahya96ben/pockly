// ============================================================================
// AUTH HELPERS — JWT + bcrypt
// ============================================================================
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '30d';

if (!JWT_SECRET) {
  console.error('[auth] Missing JWT_SECRET env');
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * Extract & verify the user from the Authorization header.
 * Returns null if invalid/missing. Returns { id, email, role, restaurantId } on success.
 */
export function getAuthUser(req) {
  const auth = req.headers?.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return payload;
}

/**
 * Convenience guard: respond 401 if no auth.
 * Returns the user, or null after sending 401.
 */
export function requireAuth(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}

/**
 * Convenience guard: respond 403 if user is not a merchant.
 */
export function requireMerchant(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'merchant') {
    res.status(403).json({ error: 'Merchant role required' });
    return null;
  }
  return user;
}
