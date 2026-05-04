// ============================================================================
// /api/products
//   GET  ?restaurantId=xxx → list active products of a restaurant (public)
//   POST                   → merchant creates a product for their restaurant
// ============================================================================
import { supabase } from '../../lib/supabase.js';
import { getAuthUser, requireMerchant } from '../../lib/auth.js';
import { handleCors, getBody } from '../../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // ─── GET ─────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { restaurantId } = req.query;
    if (!restaurantId) return res.status(400).json({ error: 'restaurantId required' });
    const authUser = getAuthUser(req);

    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('id, open')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    if (!restaurant.open && authUser?.restaurantId !== restaurantId) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[products GET]', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    return res.status(200).json({ products: data || [] });
  }

  // ─── POST ────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const user = requireMerchant(req, res);
    if (!user) return;
    if (!user.restaurantId) {
      return res.status(400).json({ error: 'No restaurant linked to this account' });
    }

    const body = getBody(req);
    const { type, name, description, photo, category } = body;
    if (!['unit', 'composable'].includes(type)) {
      return res.status(400).json({ error: 'Invalid product type' });
    }
    if (!name) return res.status(400).json({ error: 'Name required' });

    const insert = {
      restaurant_id: user.restaurantId,
      type,
      name: name.trim(),
      description: description || '',
      photo: photo || '📦',
      category: category || '',
    };
    if (type === 'unit') {
      insert.price = parseFloat(body.price) || 0;
      insert.stock = parseInt(body.stock) || 0;
    } else {
      insert.base_price = parseFloat(body.basePrice ?? body.base_price) || 0;
      insert.options = body.options || [];
    }

    const { data, error } = await supabase
      .from('products')
      .insert(insert)
      .select('*')
      .single();

    if (error) {
      console.error('[products POST]', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }
    return res.status(201).json({ product: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
