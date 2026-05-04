// ============================================================================
// GET /api/health — sanity check that the API is alive + DB reachable
// ============================================================================
import { supabase } from '../lib/supabase.js';
import { handleCors } from '../lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    const { error } = await supabase.from('restaurants').select('id', { head: true, count: 'exact' }).limit(1);
    if (error) throw error;
    return res.status(200).json({ status: 'ok', db: 'reachable', time: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
