"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClientServer } from "@/lib/supabase";

const ROLES = ["user", "admin", "super_admin"] as const;

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

  // RPC enforces super_admin internally (raises 'Forbidden' otherwise)
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
