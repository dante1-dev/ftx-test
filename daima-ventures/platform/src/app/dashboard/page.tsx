import { redirect } from "next/navigation";
import Link from "next/link";
import { createClientServer, isSupabaseConfigured } from "@/lib/supabase";
import { createAdminClient } from "@/lib/admin";
import WithdrawButton from "@/components/WithdrawButton";
import SignOutButton from "@/components/SignOutButton";
import type { Application, EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-[#4a6fa0] px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-[#666]">
            Supabase is not configured. Set your environment variables to connect
            your dashboard.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClientServer();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const db = createAdminClient() ?? supabase;

  const appConditions = [
    `user_id.eq.${user.id}`,
    `submitted_by.eq.${user.id}`,
  ];
  if (user.email) {
    appConditions.push(`applicant->>email.eq.${user.email}`);
  }
  if (user.phone) {
    appConditions.push(`applicant->>phoneNumber.eq.${user.phone}`);
  }

  const [appsRes, eventsRes, profileRes] = await Promise.all([
    db
      .from("applications")
      .select("*")
      .or(appConditions.join(","))
      .order("created_at", { ascending: false }),
    db
      .from("events")
      .select("*")
      .or(`user_id.eq.${user.id},actor.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    db.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  const applications = (appsRes.data ?? []) as Application[];
  const events = (eventsRes.data ?? []) as EventRow[];
  const profile = profileRes.data as { role: string } | null;
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  const lastLogin = user.last_sign_in_at
    ? formatDate(user.last_sign_in_at)
    : "First session";

  return (
    <div className="min-h-screen bg-[#4a6fa0]">
      {/* Header Navbar */}
      <header className="border-b border-white/10 bg-[#2d4d78] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white transition hover:opacity-90"
          >
            Daima Ventures
          </Link>

          <nav className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-full bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-200 border border-amber-400/40 transition hover:bg-amber-500/30"
              >
                Admin Console
              </Link>
            )}
            <Link
              href="/apply"
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              + New Application
            </Link>
            <Link
              href="/profile"
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              Profile
            </Link>
            <div className="w-28">
              <SignOutButton className="w-full rounded-full border border-red-300/40 bg-red-500/10 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500 hover:text-white" />
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-blue-100">
              Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.
            </p>
            <p className="mt-1 text-xs text-blue-200/90 font-medium">
              🔒 <span className="font-semibold text-white">Security Notice:</span> Last successful sign-in: <span className="underline">{lastLogin}</span>.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <StatCard label="Applications" value={applications.length} />
          <StatCard
            label="Pending"
            value={
              applications.filter(
                (a) => a.status === "pending" || a.status === "under_review"
              ).length
            }
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
                <Link
                  href="/apply"
                  className="font-medium text-[#2d4d78] hover:underline"
                >
                  Start one now
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-[#f0f0f0]">
                {applications.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div>
                      <div className="font-medium text-[#333]">
                        {capitalize(
                          (a.product || "Application").replace(/_/g, " ")
                        )}
                      </div>
                      <div className="text-xs text-[#888]">
                        UGX {Number(a.loan_amount || 0).toLocaleString()} ·{" "}
                        {formatDate(a.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          a.status === "approved" ||
                          a.status === "active" ||
                          a.status === "disbursed"
                            ? "bg-green-100 text-green-800"
                            : a.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : a.status === "withdrawn"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {capitalize(a.status.replace(/_/g, " "))}
                      </span>
                      <WithdrawButton
                        applicationId={a.id}
                        status={a.status}
                        userIdentifier={user.id}
                      />
                    </div>
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
                    <div className="font-medium text-[#333]">
                      {formatEventType(e.type)}
                    </div>
                    <div className="text-xs text-[#888]">
                      {formatDate(e.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
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

function capitalize(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEventType(type: string) {
  switch (type) {
    case "application.submitted":
      return "Application Submitted";
    case "application.withdrawn":
      return "Application Withdrawn";
    case "user.login":
      return "Successful Sign In";
    default:
      return capitalize(type.replace(/[_.]/g, " "));
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}