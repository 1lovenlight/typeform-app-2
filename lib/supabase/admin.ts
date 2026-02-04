import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Admin client for workflow operations using secret key.
 * Bypasses RLS - use only in server-side workflows, not in user-facing routes.
 * Uses Supabase secret key instead of service role key for better security.
 * @see https://supabase.com/docs/guides/api/api-keys#best-practices-for-handling-secret-keys
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
