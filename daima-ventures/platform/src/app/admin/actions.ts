"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClientServer } from "@/lib/supabase";
import { createAdminClient } from "@/lib/admin";

const ROLES = ["user", "admin", "super_admin"] as const;
const STATUSES = [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "withdrawn",
  "disbursed",
] as const;

export async function setUserRole(userId: string, role: string) {
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return { error: "Invalid role." };
  }

  const supabase = await createClientServer();
  if (!supabase) redirect("/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RPC enforces super_admin internally
  const { error } = await supabase.rpc("set_user_role", {
    target: userId,
    new_role: role,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string
) {
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    return { error: "Invalid status." };
  }

  const supabase = await createClientServer();
  if (!supabase) redirect("/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient() ?? supabase;

  const { error } = await db
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}