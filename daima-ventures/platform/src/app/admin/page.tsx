import { redirect } from "next/navigation";
import Link from "next/link";
import { createClientServer, isSupabaseConfigured } from "@/lib/supabase";
import { createAdminClient } from "@/lib/admin";
import type { Application, EventRow } from "@/lib/types";
import { setUserRole, updateApplicationStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "user" | "admin" | "super_admin";
  last_sign_in_at?: string | null;
  created_at: string;
};

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <p className="text-[#666]">
          Supabase is not configured. Set your environment variables to enable
          the admin console.
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

  const db = createAdminClient() ?? supabase;

  const { data: me } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  if (!isAdmin) {
    return (
      <Shell>
        <div className="py-12 text-center">
          <h1 className="mb-4 text-3xl font-bold text-[#2d4d78]">
            Access Denied
          </h1>
          <p className="mb-6 text-[#666]">
            This console is restricted to administrators. If you believe this is
            an error, contact your platform administrator.
          </p>
          <Link
            href="/dashboard"
            className="rounded-full bg-[#2d4d78] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1f3a5c]"
          >
            Back to Dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  const [usersRpcRes, profilesRes, appsRes, eventsRes] = await Promise.all([
    db.rpc("admin_list_users"),
    db.from("profiles").select("*"),
    db
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  let users: AdminUser[] = (usersRpcRes.data ?? []) as AdminUser[];

  if (users.length === 0 && profilesRes.data) {
    users = profilesRes.data.map((p) => ({
      id: p.id,
      email: p.email ?? null,
      full_name: p.full_name ?? null,
      role: p.role ?? "user",
      created_at: p.created_at ?? new Date().toISOString(),
    }));
  }

  const applications = (appsRes.data ?? []) as Application[];
  const events = (eventsRes.data ?? []) as EventRow[];

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e0e0e0] pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2d4d78]">Admin Console</h1>
          <p className="text-sm text-[#666]">
            Platform-wide view of users, applications, activity, and geo.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-full border border-[#2d4d78] px-4 py-2 text-xs font-semibold text-[#2d4d78] transition hover:bg-[#2d4d78] hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            className="rounded-full border border-[#2d4d78] px-4 py-2 text-xs font-semibold text-[#2d4d78] transition hover:bg-[#2d4d78] hover:text-white"
          >
            Profile
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard label="Users" value={users.length} />
        <StatCard label="Applications" value={applications.length} />
        <StatCard
          label="Pending"
          value={applications.filter((a) => a.status === "pending" || a.status === "under_review").length}
        />
        <StatCard label="Events" value={events.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#2d4d78]">Users</h2>
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] text-[#666]">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-3 font-medium text-[#333]">
                      {u.full_name || "—"}
                    </td>
                    <td className="py-3 pr-3 text-[#666]">{u.email || "—"}</td>
                    <td className="py-3 pr-3">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <RoleForm userId={u.id} role={u.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#2d4d78]">
            Geo &amp; IP Overview
          </h2>
          {applications.filter((a) => a.geo || a.ip_address).length === 0 ? (
            <p className="text-sm text-[#666]">No geo data captured yet.</p>
          ) : (
            <ul className="max-h-[600px] divide-y divide-[#f0f0f0] overflow-auto">
              {applications
                .filter((a) => a.geo || a.ip_address)
                .map((a) => {
                  const applicantObj = (a.applicant ?? {}) as Record<string, unknown>;
                  const firstName = String(applicantObj.firstName ?? "").trim();
                  const lastName = String(applicantObj.lastName ?? "").trim();
                  const name = [firstName, lastName].filter(Boolean).join(" ");

                  return (
                    <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <div className="font-medium text-[#333]">
                          {name || "Unnamed Applicant"}
                        </div>
                        <div className="text-xs text-[#888]">
                          {a.region ?? "?"} · {a.district ?? "?"} · {a.ip_address ?? "no ip"}
                        </div>
                      </div>
                      {a.geo && (
                        <div className="text-right text-xs text-[#888]">
                          {String(a.geo.city ?? "")}{" "}
                          {String(a.geo.country_name ?? "")}
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#2d4d78]">
            Applications
          </h2>
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] text-[#666]">
                  <th className="py-2 pr-3">Applicant</th>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {applications.map((a) => {
                  const applicantObj = (a.applicant ?? {}) as Record<string, unknown>;
                  const firstName = String(applicantObj.firstName ?? "").trim();
                  const lastName = String(applicantObj.lastName ?? "").trim();
                  const email = String(applicantObj.email ?? "").trim();
                  const phone = String(applicantObj.phoneNumber ?? "").trim();

                  const fullName = [firstName, lastName].filter(Boolean).join(" ");
                  const primaryLabel: string = fullName || email || phone || "Unnamed Applicant";
                  const subLabel: string | null = fullName && (email || phone) ? (email || phone) : null;

                  return (
                    <tr key={a.id}>
                      <td className="py-3 pr-3 font-medium text-[#333]">
                        <div>{primaryLabel}</div>
                        {subLabel && (
                          <div className="text-xs font-normal text-[#888]">
                            {subLabel}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-[#333]">
                        {capitalize((a.product || "").replace(/_/g, " "))}
                      </td>
                      <td className="py-3 pr-3 text-[#666]">
                        UGX {Number(a.loan_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-xs text-[#888]">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="py-3">
                        <ApplicationStatusForm applicationId={a.id} status={a.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#2d4d78]">
            Activity Log
          </h2>
          <ul className="max-h-[600px] divide-y divide-[#f0f0f0] overflow-auto">
            {events.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-[#333]">
                    {formatEventType(e.type)}
                  </span>
                  <span className="text-xs text-[#888]">
                    {formatDate(e.created_at)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#888]">
                  actor: {e.actor ?? "anonymous"} · role: {e.actor_role ?? "—"} · ip:{" "}
                  {e.ip_address ?? "—"}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Shell>
  );
}

function RoleForm({ userId, role }: { userId: string; role: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const next = formData.get("role") as string;
        if (next && next !== role) {
          await setUserRole(userId, next);
        }
      }}
      className="flex items-center gap-2"
    >
      <select
        name="role"
        defaultValue={role}
        className="rounded-lg border border-[#e0e0e0] px-2 py-1 text-xs text-[#333]"
      >
        <option value="user">user</option>
        <option value="admin">admin</option>
        <option value="super_admin">super_admin</option>
      </select>
      <button
        type="submit"
        className="rounded-full bg-[#2d4d78] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#1f3a5c]"
      >
        Set
      </button>
    </form>
  );
}

function ApplicationStatusForm({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const nextStatus = formData.get("status") as string;
        if (nextStatus && nextStatus !== status) {
          await updateApplicationStatus(applicationId, nextStatus);
        }
      }}
      className="flex items-center gap-2"
    >
      <select
        name="status"
        defaultValue={status}
        className="rounded-lg border border-[#e0e0e0] px-2 py-1 text-xs text-[#333]"
      >
        <option value="pending">pending</option>
        <option value="under_review">under_review</option>
        <option value="approved">approved</option>
        <option value="rejected">rejected</option>
        <option value="withdrawn">withdrawn</option>
        <option value="disbursed">disbursed</option>
      </select>
      <button
        type="submit"
        className="rounded-full bg-[#2d4d78] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#1f3a5c]"
      >
        Set
      </button>
    </form>
  );
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "approved":
    case "disbursed":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "withdrawn":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function formatEventType(type: string) {
  switch (type) {
    case "application.submitted":
      return "Application Submitted";
    case "application.withdrawn":
      return "Application Withdrawn";
    case "user.login":
      return "User Signed In";
    default:
      return capitalize(type.replace(/[_.]/g, " "));
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e0e0e0] bg-gray-50 p-6 shadow-sm">
      <div className="text-3xl font-bold text-[#2d4d78]">{value}</div>
      <div className="mt-1 text-sm text-[#666]">{label}</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#4a6fa0] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-white/90 hover:text-white hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          {children}
        </div>
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