// ============================================================================
// /api/restaurants/[id]
//   GET   → public restaurant details
//   PATCH → merchant updates their own restaurant
// ============================================================================
import { supabase } from '../../lib/supabase.js';
import { getAuthUser, requireMerchant } from '../../lib/auth.js';
import { handleCors, getBody } from '../../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  const { id } = req.query;

  // ─── GET ─────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const authUser = getAuthUser(req);
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'Restaurant not found' });
    if (!data.open && authUser?.restaurantId !== id) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    return res.status(200).json({ restaurant: data });
  }

  // ─── PATCH ───────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const user = requireMerchant(req, res);
    if (!user) return;
    if (user.restaurantId !== id) {
      return res.status(403).json({ error: 'Cannot edit another merchant\'s restaurant' });
    }

    const body = getBody(req);
    const allowed = ['name', 'address', 'phone', 'prep_time', 'open', 'category', 'emoji', 'loyalty_target', 'loyalty_reward'];
    const patch = {};
    for (const k of allowed) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    if (body.prepTime !== undefined) patch.prep_time = parseInt(body.prepTime) || 15;
    if (body.loyaltyTarget !== undefined) patch.loyalty_target = parseInt(body.loyaltyTarget) || 6;
    if (body.loyaltyReward !== undefined) patch.loyalty_reward = body.loyaltyReward;

    const { data, error } = await supabase
      .from('restaurants')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[restaurant PATCH]', error);
      return res.status(500).json({ error: 'Update failed' });
    }
    return res.status(200).json({ restaurant: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
