// ============================================================================
// POST /api/auth/login
// Body: { email, password }
// Returns: { user, token }
// ============================================================================
import { supabase } from '../../lib/supabase.js';
import { comparePassword, signToken } from '../../lib/auth.js';
import { handleCors, getBody } from '../../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = getBody(req);
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const cleanEmail = email.trim().toLowerCase();

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, restaurant_id, password_hash')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurant_id,
  });

  return res.status(200).json({
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
