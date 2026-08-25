import { redirect } from "next/navigation";
import Link from "next/link";
import { createClientServer, isSupabaseConfigured } from "@/lib/supabase";
import { createAdminClient } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClientServer();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const db = createAdminClient() ?? supabase;

  // Fetch profile details
  const { data: profile } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const fullName = profile?.full_name || user.user_metadata?.full_name || "—";
  const role = profile?.role || "user";
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString()
    : "—";

  return (
    <main className="min-h-screen bg-[#4a6fa0] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Visible Back Link */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-white/90 hover:text-white hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Profile Card */}
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="mb-8 text-3xl font-bold text-[#2d4d78]">Profile</h1>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Account Details */}
            <div className="rounded-2xl border border-[#e0e0e0] p-6">
              <h2 className="mb-4 text-lg font-semibold text-[#2d4d78]">
                Account
              </h2>
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-[#f0f0f0] pb-2">
                  <dt className="text-[#666]">Name</dt>
                  <dd className="font-medium text-[#333]">{fullName}</dd>
                </div>
                <div className="flex justify-between border-b border-[#f0f0f0] pb-2">
                  <dt className="text-[#666]">Email</dt>
                  <dd className="font-medium text-[#333]">{user.email}</dd>
                </div>
                <div className="flex justify-between border-b border-[#f0f0f0] pb-2">
                  <dt className="text-[#666]">Role</dt>
                  <dd className="font-medium text-[#333]">{role}</dd>
                </div>
                <div className="flex justify-between pb-2">
                  <dt className="text-[#666]">Last sign in</dt>
                  <dd className="font-medium text-[#333]">{lastSignIn}</dd>
                </div>
              </dl>
            </div>

            {/* Quick Links & Actions */}
            <div className="rounded-2xl border border-[#e0e0e0] p-6">
              <h2 className="mb-4 text-lg font-semibold text-[#2d4d78]">
                Quick Links
              </h2>
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="block w-full rounded-full bg-[#2d4d78] py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1f3a5c]"
                >
                  View Dashboard
                </Link>
                <Link
                  href="/apply"
                  className="block w-full rounded-full bg-[#2d4d78] py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1f3a5c]"
                >
                  New Application
                </Link>

                {/* Working Sign Out */}
                <form
                  action={async () => {
                    "use server";
                    const sb = await createClientServer();
                    if (sb) {
                      await sb.auth.signOut();
                    }
                    redirect("/login");
                  }}
                >
                  <button
                    type="submit"
                    className="w-full rounded-full border border-red-400 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}