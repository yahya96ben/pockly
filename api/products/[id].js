// ============================================================================
// /api/products/[id]
//   GET    → product detail (public)
//   PATCH  → merchant updates their own product
//   DELETE → merchant deletes their own product (soft delete via active=false)
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
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'Product not found' });
    if (authUser?.restaurantId !== data.restaurant_id) {
      if (data.active === false) {
        return res.status(404).json({ error: 'Product not found' });
      }
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('open')
        .eq('id', data.restaurant_id)
        .maybeSingle();
      if (!restaurant?.open) {
        return res.status(404).json({ error: 'Product not found' });
      }
    }
    return res.status(200).json({ product: data });
  }

  // ─── PATCH ───────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const user = requireMerchant(req, res);
    if (!user) return;

    // Confirm ownership
    const { data: existing } = await supabase
      .from('products')
      .select('restaurant_id')
      .eq('id', id)
      .maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (existing.restaurant_id !== user.restaurantId) {
      return res.status(403).json({ error: 'Not your product' });
    }

    const body = getBody(req);
    const allowed = ['name', 'description', 'photo', 'category', 'price', 'stock', 'base_price', 'options', 'active'];
    const patch = {};
    for (const k of allowed) if (body[k] !== undefined) patch[k] = body[k];
    if (body.basePrice !== undefined) patch.base_price = parseFloat(body.basePrice) || 0;

    const { data, error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[product PATCH]', error);
      return res.status(500).json({ error: 'Update failed' });
    }
    return res.status(200).json({ product: data });
  }

  // ─── DELETE (soft) ───────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const user = requireMerchant(req, res);
    if (!user) return;

    const { data: existing } = await supabase
      .from('products')
      .select('restaurant_id')
      .eq('id', id)
      .maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (existing.restaurant_id !== user.restaurantId) {
      return res.status(403).json({ error: 'Not your product' });
    }

    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id);
    if (error) return res.status(500).json({ error: 'Delete failed' });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
