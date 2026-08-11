export type UserRole = "user" | "admin" | "super_admin";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  last_sign_in_at: string | null;
  ip_address: string | null;
  geo: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  status: string;
  product: string;
  loan_amount: number;
  loan_purpose: string | null;
  applicant: Record<string, unknown>;
  region: string | null;
  district: string | null;
  subcounty: string | null;
  village: string | null;
  ip_address: string | null;
  geo: Record<string, unknown> | null;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  tenant: string;
  type: string;
  actor: string | null;
  actor_role: string | null;
  payload: Record<string, unknown>;
  ip_address: string | null;
  geo: Record<string, unknown> | null;
  created_at: string;
}
