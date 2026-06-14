"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers, updateUserRole, removeUser } from "@/lib/api/roles";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Loader,
  X,
  ArrowLeft,
  ChevronDown,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useRole } from "@/hooks/use-role";
import { ROLE_CONFIG, RoleBadge } from ".";
import { Role, UserRole } from "@/types";
import { InviteForm } from "./components/invite-form";

export const AdminMainContent = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const router = useRouter();

  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<UserRole | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) {
      router.replace("/");
      return;
    }
    getAllUsers()
      .then(setUsers)
      .catch(() => showToast("Gagal memuat data pengguna", "error"))
      .finally(() => setLoading(false));
  }, [isAdmin, roleLoading, router]);

  const handleUpdateRole = async (id: string, role: Role) => {
    setUpdatingId(id);
    try {
      await updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      showToast("Role berhasil diperbarui");
    } catch {
      showToast("Gagal memperbarui role", "error");
    } finally {
      setUpdatingId(null);
      setEditingRole(null);
    }
  };

  const handleRemove = async (record: UserRole) => {
    setRemovingId(record.id);
    try {
      await removeUser(record.id);
      setUsers((prev) => prev.filter((u) => u.id !== record.id));
      showToast(`${record.email} berhasil dihapus`);
    } catch {
      showToast("Gagal menghapus pengguna", "error");
    } finally {
      setRemovingId(null);
      setConfirmRemove(null);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-batik-cream">
        <div className="text-center">
          <div className="text-5xl mb-4">👑</div>
          <Loader size={28} className="animate-spin text-batik-gold mx-auto" />
        </div>
      </div>
    );
  }

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="min-h-screen bg-batik-cream bg-batik-pattern">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push("/")}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <Shield size={20} className="text-yellow-300" />
          <div className="flex-1">
            <h1 className="font-bold text-base font-display">Halaman Admin</h1>
            <p className="text-xs text-yellow-200/70">
              Kelola akses pengguna pohon keluarga
            </p>
          </div>
          <span className="text-xs text-yellow-200/60">{user?.email}</span>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-60" />
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {(["admin", "editor", "viewer"] as Role[]).map((r) => {
            const count = users.filter((u) => u.role === r).length;
            const cfg = ROLE_CONFIG[r];
            return (
              <div
                key={r}
                className={`rounded-xl border p-3 text-center ${cfg.color}`}
              >
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-semibold capitalize">{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* User list */}
        <div className="bg-white rounded-2xl shadow-sm border border-batik-light overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-batik-light">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-batik-gold" />
              <h2 className="font-bold text-batik-dark text-sm">
                Daftar Pengguna
              </h2>
              <span className="text-xs bg-batik-light text-batik-copper px-2 py-0.5 rounded-full">
                {users.length}
              </span>
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-700 to-amber-800 text-white text-xs font-semibold hover:from-amber-800 hover:to-amber-900 transition-all shadow"
            >
              <UserPlus size={13} /> Undang Pengguna
            </button>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center">
              <Users size={32} className="text-batik-muted mx-auto mb-2" />
              <p className="text-batik-brown text-sm">
                Belum ada pengguna terdaftar
              </p>
            </div>
          ) : (
            <div className="divide-y divide-batik-light">
              {users.map((u) => {
                const isSelf = u.email === user?.email;
                const isUpdating = updatingId === u.id;
                const isRemoving = removingId === u.id;
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/30 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center font-bold text-amber-800 text-sm flex-shrink-0">
                      {u.email[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-batik-dark truncate">
                          {u.email}
                        </p>
                        {isSelf && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-batik-copper mt-0.5">
                        Ditambahkan{" "}
                        {new Date(u.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Role selector */}
                    <div className="relative flex-shrink-0">
                      {editingRole === u.id ? (
                        <div className="flex gap-1">
                          {(["admin", "editor", "viewer"] as Role[]).map(
                            (r) => (
                              <button
                                key={r}
                                onClick={() => handleUpdateRole(u.id, r)}
                                disabled={isUpdating}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors border
                                ${u.role === r ? ROLE_CONFIG[r].color : "bg-white border-batik-light text-batik-dark hover:bg-batik-light"}`}
                              >
                                {isUpdating && u.role === r ? (
                                  <Loader size={10} className="animate-spin" />
                                ) : (
                                  ROLE_CONFIG[r].label
                                )}
                              </button>
                            ),
                          )}
                          <button
                            onClick={() => setEditingRole(null)}
                            className="p-1 rounded-lg hover:bg-batik-light text-batik-muted transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => !isSelf && setEditingRole(u.id)}
                          disabled={isSelf}
                          className={`flex items-center gap-1 ${isSelf ? "cursor-default" : "hover:opacity-70 cursor-pointer"} transition-opacity`}
                          title={
                            isSelf
                              ? "Tidak bisa mengubah role diri sendiri"
                              : "Klik untuk ubah role"
                          }
                        >
                          <RoleBadge role={u.role} />
                          {!isSelf && (
                            <ChevronDown
                              size={11}
                              className="text-batik-muted"
                            />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Delete */}
                    {!isSelf && editingRole !== u.id && (
                      <button
                        onClick={() => setConfirmRemove(u)}
                        disabled={
                          isRemoving || (u.role === "admin" && adminCount <= 1)
                        }
                        title={
                          u.role === "admin" && adminCount <= 1
                            ? "Harus ada minimal 1 admin"
                            : "Hapus akses pengguna"
                        }
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {isRemoving ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1.5">
          <p className="font-semibold">📋 Keterangan Role:</p>
          <p>
            👑 <strong>Admin</strong> — akses penuh: kelola user,
            tambah/edit/hapus anggota & relasi
          </p>
          <p>
            ✏️ <strong>Editor</strong> — tambah dan edit anggota & relasi, tidak
            bisa kelola user
          </p>
          <p>
            👁️ <strong>Viewer</strong> — hanya bisa melihat pohon keluarga,
            tidak bisa edit
          </p>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-batik-cream rounded-2xl shadow-2xl w-full max-w-md fade-in border border-batik-gold/30">
            <div className="flex items-center justify-between px-5 py-4 border-b border-batik-light rounded-t-2xl bg-gradient-to-r from-amber-800 to-amber-900">
              <div>
                <h2 className="text-base font-bold text-white font-display">
                  👤 Undang Pengguna
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Kirim magic link ke anggota keluarga
                </p>
              </div>
              <button
                onClick={() => setShowInvite(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <InviteForm
                currentUserId={user!.id}
                onInvited={(record) => {
                  setUsers((prev) => {
                    const exists = prev.find((u) => u.email === record.email);
                    return exists
                      ? prev.map((u) => (u.email === record.email ? record : u))
                      : [record, ...prev];
                  });
                }}
                onClose={() => setShowInvite(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-batik-cream rounded-2xl shadow-2xl w-full max-w-xs border border-batik-gold/30 fade-in p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-bold text-batik-dark mb-1">Hapus Akses?</h3>
            <p className="text-sm text-batik-copper mb-1">
              <strong>{confirmRemove.email}</strong>
            </p>
            <p className="text-xs text-batik-copper/70 mb-5">
              Pengguna tidak bisa lagi mengakses pohon keluarga. Bisa diundang
              kembali kapan saja.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 px-3 py-2 rounded-xl border border-batik-light text-batik-brown text-sm font-semibold hover:bg-batik-light transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleRemove(confirmRemove)}
                disabled={!!removingId}
                className="flex-1 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {removingId ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}{" "}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold fade-in
          ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
};
