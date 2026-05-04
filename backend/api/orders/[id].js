// ============================================================================
// /api/orders/[id]
//   GET   → order detail
//   PATCH → merchant updates order (status, payment_status)
// ============================================================================
import { supabase } from '../../lib/supabase.js';
import { requireMerchant } from '../../lib/auth.js';
import { handleCors, getBody } from '../../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  const { id } = req.query;

  if (req.method === 'GET') {
    const user = requireMerchant(req, res);
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'Order not found' });
    if (data.restaurant_id !== user.restaurantId) {
      return res.status(403).json({ error: 'Not your order' });
    }
    return res.status(200).json({ order: data });
  }

  if (req.method === 'PATCH') {
    const user = requireMerchant(req, res);
    if (!user) return;

    // Confirm ownership
    const { data: existing } = await supabase
      .from('orders')
      .select('restaurant_id')
      .eq('id', id)
      .maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.restaurant_id !== user.restaurantId) {
      return res.status(403).json({ error: 'Not your order' });
    }

    const body = getBody(req);
    const allowed = ['status', 'payment_status', 'remarks'];
    const patch = {};
    for (const k of allowed) if (body[k] !== undefined) patch[k] = body[k];

    if (patch.status && !['pending', 'preparing', 'ready', 'done', 'cancelled'].includes(patch.status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[order PATCH]', error);
      return res.status(500).json({ error: 'Update failed' });
    }
    return res.status(200).json({ order: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
