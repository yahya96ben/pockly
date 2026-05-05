// ============================================================================
// SUPABASE CLIENT WRAPPER
// Uses the service_role key (full DB access). Never expose this in frontend.
// ============================================================================
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let client = null;
let warned = false;

function getClient() {
  if (!url || !serviceKey) {
    if (!warned) {
      console.error('[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env');
      warned = true;
    }
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env');
  }

  if (!client) {
    client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}

const client = createClient( url, serviceKey, {
    realtime: { enabled: false }
  }
)

export const supabase = client.
