// ============================================================================
// GET /api/auth/me
// Returns the current user from the token. Used on app boot to restore session.
// ============================================================================
import { supabase } from '../../lib/supabase.js';
import { requireAuth } from '../../lib/auth.js';
import { handleCors } from '../../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const tokenUser = requireAuth(req, res);
  if (!tokenUser) return;

  // Re-fetch fresh user from DB (in case role/restaurantId changed)
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, restaurant_id')
    .eq('id', tokenUser.id)
    .maybeSingle();

  if (error || !user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id,
    },
  });
}
