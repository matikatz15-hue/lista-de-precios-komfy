import { createClient } from "@supabase/supabase-js";

// Admin client that uses the service role key. Server-only. Bypasses RLS.
// Use only in server actions where we explicitly need to create users etc.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
