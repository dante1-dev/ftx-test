import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon);
}

export function createClientBrowser() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(url, anon);
}
