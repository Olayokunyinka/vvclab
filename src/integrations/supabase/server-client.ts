import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Server-only Supabase client using the managed publishable key.
 * Respects RLS and is safe for shared app data access from createServerFn handlers.
 */
export function createSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    const missing = [
      ...(!supabaseUrl ? ['SUPABASE_URL'] : []),
      ...(!publishableKey ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(', ')}`);
  }

  return createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
