// ============================================================================
// /api/restaurants
//   GET  → public list of open restaurants
//   POST → merchant creates their own restaurant (during onboarding)
//          then atomically links it to their user account
// ============================================================================
import { supabase } from '../../lib/supabase.js';
import { requireMerchant, signToken } from '../../lib/auth.js';
import { handleCors, getBody } from '../../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // ─── GET: public list ────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('open', true)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('[restaurants GET]', error);
      return res.status(500).json({ error: 'Failed to fetch restaurants' });
    }
    return res.status(200).json({ restaurants: data || [] });
  }

  // ─── POST: merchant creates their restaurant ─────────────────────────
  if (req.method === 'POST') {
    const user = requireMerchant(req, res);
    if (!user) return;

    const { name, address, phone, prepTime, category, emoji } = getBody(req);
    if (!name || !address || !phone) {
      return res.status(400).json({ error: 'Missing required fields (name, address, phone)' });
    }

    // 1. Insert restaurant
    const { data: restaurant, error: rErr } = await supabase
      .from('restaurants')
      .insert({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        prep_time: parseInt(prepTime) || 15,
        category: category || '',
        emoji: emoji || '🍽️',
        open: true,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (rErr) {
      console.error('[restaurants POST]', rErr);
      return res.status(500).json({ error: 'Failed to create restaurant' });
    }

    // 2. Link user → restaurant
    const { error: uErr } = await supabase
      .from('users')
      .update({ restaurant_id: restaurant.id })
      .eq('id', user.id);

    if (uErr) {
      console.error('[restaurants POST link]', uErr);
      return res.status(500).json({ error: 'Failed to link restaurant' });
    }

    // 3. Issue a fresh token with restaurantId set
    const newToken = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: restaurant.id,
    });

    return res.status(201).json({ restaurant, token: newToken });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
