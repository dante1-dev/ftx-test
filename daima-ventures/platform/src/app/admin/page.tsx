import { redirect } from "next/navigation";
import Link from "next/link";
import { createClientServer, isSupabaseConfigured } from "@/lib/supabase";
import type { Application, EventRow } from "@/lib/types";
import { setUserRole } from "./actions";

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "user" | "admin" | "super_admin";
  last_sign_in_at: string | null;
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

  // Confirm super_admin role (profile select allowed for own row)
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "super_admin") {
    return (
      <Shell>
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold text-[#2d4d78]">
            Access Denied
          </h1>
          <p className="mb-6 text-[#666]">
            This console is restricted to super admins. If you believe this is
            an error, contact your platform administrator.
          </p>
          <Link href="/dashboard" className="btn">
            Back to Dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  const [usersRes, appsRes, eventsRes] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const users = (usersRes.data ?? []) as AdminUser[];
  const applications = (appsRes.data ?? []) as Application[];
  const events = (eventsRes.data ?? []) as EventRow[];

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2d4d78]">Super Admin</h1>
          <p className="text-sm text-[#666]">
            Platform-wide view of users, applications, activity, and geo.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard" className="btn btn-secondary">
            Dashboard
          </Link>
          <Link href="/profile" className="btn btn-secondary">
            Profile
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard label="Users" value={users.length} />
        <StatCard
          label="Applications"
          value={applications.length}
        />
        <StatCard
          label="Pending"
          value={applications.filter((a) => a.status === "pending").length}
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
                      <span className="status-badge available">{u.role}</span>
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
                .map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <div className="font-medium text-[#333]">
                        {String(a.applicant?.firstName ?? "")}{" "}
                        {String(a.applicant?.lastName ?? "")}
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
                ))}
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
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 pr-3 font-medium text-[#333]">
                      {capitalize(a.product.replace(/_/g, " "))}
                    </td>
                    <td className="py-3 pr-3 text-[#666]">
                      UGX {Number(a.loan_amount).toLocaleString()}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`status-badge ${
                          a.status === "pending" ? "coming-soon" : "available"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-[#888]">
                      {formatDate(a.created_at)}
                    </td>
                  </tr>
                ))}
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
                  <span className="font-medium text-[#333]">{e.type}</span>
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
      <div className="mx-auto max-w-6xl">
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
