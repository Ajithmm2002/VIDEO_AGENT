export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && supabasePublicKey());
}

export function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function supabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

export function remoteAiEnabled() {
  const provider = process.env.AI_PROVIDER;
  return Boolean(process.env.AI_API_KEY) && Boolean(provider) && provider !== "local";
}

export function marketplaceAdminEmail() {
  return process.env.MARKETPLACE_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export function isMarketplaceAdmin(email: string | null | undefined) {
  const admin = marketplaceAdminEmail();
  const value = email?.trim().toLowerCase() ?? "";
  return Boolean(admin && value && admin === value);
}
