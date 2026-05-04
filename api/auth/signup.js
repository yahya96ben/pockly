// ============================================================================
// POST /api/auth/signup
// Body: { name, email, password, role: 'client' | 'merchant' }
// Returns: { user, token }
// ============================================================================
import { supabase } from '../../lib/supabase.js';
import { hashPassword, signToken } from '../../lib/auth.js';
import { handleCors, getBody } from '../../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password, role } = getBody(req);

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password too short (min 4 chars)' });
  }
  if (!['client', 'merchant'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Check if email exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  // Hash & insert
  const password_hash = await hashPassword(password);
  const { data: user, error } = await supabase
    .from('users')
    .insert({ name: name.trim(), email: cleanEmail, password_hash, role })
    .select('id, name, email, role, restaurant_id')
    .single();

  if (error) {
    console.error('[signup]', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurant_id,
  });

  return res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id,
    },
    token,
  });
}
