import { redirect } from "next/navigation";
import Link from "next/link";
import { createClientServer, isSupabaseConfigured } from "@/lib/supabase";
import type { Application, EventRow } from "@/lib/types";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <p className="text-[#666]">
          Supabase is not configured. Set your environment variables to connect
          your dashboard.
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

  const [appsRes, eventsRes, profileRes] = await Promise.all([
    supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  const applications = (appsRes.data ?? []) as Application[];
  const events = (eventsRes.data ?? []) as EventRow[];
  const profile = profileRes.data as { role: string } | null;

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2d4d78]">Dashboard</h1>
          <p className="text-sm text-[#666]">
            Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}. Here&apos;s your activity.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/apply" className="btn">
            New Application
          </Link>
          <Link href="/profile" className="btn btn-secondary">
            Profile
          </Link>
          {profile?.role === "super_admin" && (
            <Link href="/admin" className="btn btn-secondary">
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Applications" value={applications.length} />
        <StatCard
          label="Pending"
          value={applications.filter((a) => a.status === "pending").length}
        />
        <StatCard label="Activity events" value={events.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#2d4d78]">
            Your Applications
          </h2>
          {applications.length === 0 ? (
            <p className="text-sm text-[#666]">
              No applications yet.{" "}
              <Link href="/apply" className="font-medium text-[#2d4d78] hover:underline">
                Start one now
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-[#f0f0f0]">
              {applications.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="font-medium text-[#333]">
                      {capitalize(a.product.replace(/_/g, " "))}
                    </div>
                    <div className="text-xs text-[#888]">
                      UGX {Number(a.loan_amount).toLocaleString()} · {formatDate(a.created_at)}
                    </div>
                  </div>
                  <span
                    className={`status-badge ${
                      a.status === "pending" ? "coming-soon" : "available"
                    }`}
                  >
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#2d4d78]">
            Recent Activity
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-[#666]">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-[#f0f0f0]">
              {events.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="font-medium text-[#333]">{e.type}</div>
                  <div className="text-xs text-[#888]">{formatDate(e.created_at)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Shell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
      <div className="text-3xl font-bold text-[#2d4d78]">{value}</div>
      <div className="mt-1 text-sm text-[#666]">{label}</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/" className="text-sm font-medium text-[#2d4d78] hover:underline">
            ← Daima Ventures
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}

function capitalize(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}
