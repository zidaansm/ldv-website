import { createClient } from '@supabase/supabase-js';

// WARNING: This client bypasses RLS policies! Only use in secure server environments.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
);
