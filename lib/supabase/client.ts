import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabasePublicKey, supabaseUrl } from "@/lib/env";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createBrowserClient(supabaseUrl(), supabasePublicKey());
}
