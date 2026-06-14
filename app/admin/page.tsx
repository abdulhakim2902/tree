import AuthGuard from "@/components/auth-guard";
import { AdminMainContent } from "@/components/partials/admin";

// ── Main page ─────────────────────────────────────────────────────────────────
export default async function AdminPage() {
  return (
    <AuthGuard>
      <AdminMainContent />
    </AuthGuard>
  );
}
