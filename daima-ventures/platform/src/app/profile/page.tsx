import { redirect } from "next/navigation";
import Link from "next/link";
import { createClientServer, isSupabaseConfigured } from "@/lib/supabase";
import { getUserProfile } from "@/lib/admin";
import SignOutButton from "@/components/SignOutButton";

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <p className="text-[#666]">
          Supabase is not configured. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable accounts.
        </p>
      </Shell>
    );
  }

  const supabase = await createClientServer();
  if (!supabase) redirect("/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.id);

  return (
    <Shell>
      <h1 className="mb-6 text-3xl font-bold text-[#2d4d78]">Profile</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#2d4d78]">
            Account
          </h2>
          <dl className="space-y-3 text-sm">
            <Row label="Name" value={profile?.full_name ?? user.user_metadata?.full_name ?? "—"} />
            <Row label="Email" value={user.email ?? "—"} />
            <Row label="Role" value={profile?.role ?? "user"} />
            <Row
              label="Last sign in"
              value={
                user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString()
                  : "—"
              }
            />
          </dl>
        </div>
        <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#2d4d78]">
            Quick Links
          </h2>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="btn text-center">
              View Dashboard
            </Link>
            <Link href="/apply" className="btn text-center">
              New Application
            </Link>
            {profile?.role === "super_admin" && (
              <Link href="/admin" className="btn btn-secondary text-center">
                Super Admin Console
              </Link>
            )}
          </div>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#f0f0f0] pb-2">
      <dt className="font-medium text-[#666]">{label}</dt>
      <dd className="text-right text-[#333]">{value}</dd>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-[#2d4d78] hover:underline">
            ← Daima Ventures
          </Link>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-[0_15px_40px_rgba(0,0,0,0.1)] md:p-10">
          {children}
        </div>
      </div>
    </main>
  );
}
