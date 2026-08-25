import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Profile } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isAdminConfigured(): boolean {
  return Boolean(url && serviceKey);
}

export function createAdminClient() {
  if (!isAdminConfigured()) return null;
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function logEvent(input: {
  type: string;
  actor?: string | null;
  actorRole?: string | null;
  payload?: Record<string, unknown>;
  ip?: string | null;
  geo?: Record<string, unknown> | null;
}) {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("events").insert({
    tenant: "daima-ventures",
    type: input.type,
    actor: input.actor ?? null,
    user_id: input.actor ?? null,
    actor_role: input.actorRole ?? null,
    payload: input.payload ?? {},
    ip_address: input.ip ?? null,
    geo: input.geo ?? null,
  });
}