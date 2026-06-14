"use client";

import { Role, UserRole } from "@/types";
import { FC } from "react";
import { useState } from "react";
import { inviteUser } from "@/lib/api/roles";
import { Loader, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { ROLE_CONFIG } from "..";

type Props = {
  currentUserId: string;
  onInvited: (u: UserRole) => void;
  onClose: () => void;
};

export const InviteForm: FC<Props> = (props) => {
  const { currentUserId, onInvited, onClose } = props;

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Masukkan email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format email tidak valid");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const record = await inviteUser(
        email.trim().toLowerCase(),
        role,
        currentUserId,
      );
      onInvited(record);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Gagal mengundang pengguna");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <CheckCircle size={44} className="text-green-500 mx-auto mb-3" />
        <h3 className="font-bold text-batik-dark mb-1">Undangan Terkirim!</h3>
        <p className="text-sm text-batik-copper mb-4">
          Magic link dikirim ke <strong>{email}</strong>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSuccess(false);
              setEmail("");
              setRole("viewer");
            }}
            className="flex-1 px-3 py-2 rounded-xl border border-batik-light text-batik-brown text-sm font-semibold hover:bg-batik-light transition-colors"
          >
            Undang Lagi
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded-xl bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-batik-copper mb-1">
          Alamat Email <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Mail
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-batik-muted"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="email@contoh.com"
            className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-batik-light bg-white text-sm text-batik-dark focus:outline-none focus:border-batik-gold focus:ring-2 focus:ring-amber-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-batik-copper mb-2">
          Role <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            Object.entries(ROLE_CONFIG) as [Role, (typeof ROLE_CONFIG)[Role]][]
          ).map(([r, cfg]) => (
            <label
              key={r}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all text-xs font-semibold
                ${role === r ? `border-current ${cfg.color}` : "border-batik-light bg-white text-batik-dark hover:border-batik-muted"}`}
            >
              <input
                type="radio"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="sr-only"
              />
              <span className="text-lg">
                {r === "admin" ? "👑" : r === "editor" ? "✏️" : "👁️"}
              </span>
              <span>{cfg.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-2 bg-batik-light/60 rounded-lg p-2.5 text-xs text-batik-copper space-y-1">
          {role === "admin" && (
            <p>
              👑 <strong>Admin</strong> — kelola user, tambah/edit anggota
              keluarga
            </p>
          )}
          {role === "editor" && (
            <p>
              ✏️ <strong>Editor</strong> — tambah dan edit anggota keluarga
            </p>
          )}
          {role === "viewer" && (
            <p>
              👁️ <strong>Viewer</strong> — hanya lihat pohon keluarga
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-xl border border-batik-light text-batik-brown text-sm font-semibold hover:bg-batik-light transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 text-white text-sm font-semibold hover:from-amber-800 hover:to-amber-900 transition-all flex items-center justify-center gap-2 shadow disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader size={14} className="animate-spin" /> Mengirim...
            </>
          ) : (
            <>
              <Mail size={14} /> Kirim Undangan
            </>
          )}
        </button>
      </div>
    </form>
  );
};
