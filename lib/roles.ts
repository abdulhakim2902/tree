import { supabase } from "./supabase";

export type UserRole = "admin" | "editor" | "viewer";

export interface UserRoleRecord {
  id: string;
  email: string;
  role: UserRole;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Get current user's role ───────────────────────────────────────────────────
export async function getMyRole(): Promise<UserRole | null> {
  const { data, error } = await supabase.rpc("get_my_role");
  if (error || !data) return null;
  return data as UserRole;
}

// ── Get all users (admin only) ────────────────────────────────────────────────
export async function getAllUsers(): Promise<UserRoleRecord[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ── Invite user (admin only) ──────────────────────────────────────────────────
export async function inviteUser(
  email: string,
  role: UserRole,
  invitedBy: string,
): Promise<UserRoleRecord> {
  // 1. Simpan role di tabel
  const { data, error } = await supabase
    .from("user_roles")
    .upsert({ email, role, invited_by: invitedBy }, { onConflict: "email" })
    .select()
    .single();

  if (error) throw error;

  // 2. Kirim magic link invite via Supabase Auth
  const { error: inviteError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (inviteError) throw inviteError;
  return data;
}

// ── Update role (admin only) ──────────────────────────────────────────────────
export async function updateUserRole(
  id: string,
  role: UserRole,
): Promise<void> {
  const { error } = await supabase
    .from("user_roles")
    .update({ role })
    .eq("id", id);

  if (error) throw error;
}

// ── Remove user (admin only) ──────────────────────────────────────────────────
export async function removeUser(id: string): Promise<void> {
  const { error } = await supabase.from("user_roles").delete().eq("id", id);

  if (error) throw error;
}
