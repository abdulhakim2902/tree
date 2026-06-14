export type Role = "admin" | "editor" | "viewer";

export type UserRole = {
  id: string;
  email: string;
  role: Role;
  invited_by: string | null;
  created_at: string;
};
