"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  Loader,
  CheckCircle,
  ArrowRight,
  ShieldOff,
  AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<
  string,
  { title: string; desc: string; icon: React.ReactNode }
> = {
  no_access: {
    title: "Akses Ditolak",
    desc: "Email Anda belum terdaftar. Hubungi admin untuk mendapatkan akses.",
    icon: <ShieldOff size={18} className="text-red-500" />,
  },
  invalid_link: {
    title: "Link Tidak Valid",
    desc: "Link sudah kedaluwarsa atau tidak valid. Silakan minta link baru.",
    icon: <AlertCircle size={18} className="text-amber-500" />,
  },
};

function ErrorBanner() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const errorInfo = errorParam ? ERROR_MESSAGES[errorParam] : null;

  if (!errorInfo) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl p-3 mb-4 text-sm border ${
        errorParam === "no_access"
          ? "bg-red-50 border-red-200 text-red-800"
          : "bg-amber-50 border-amber-200 text-amber-800"
      }`}
    >
      <span className="flex-shrink-0 mt-0.5">{errorInfo.icon}</span>
      <div>
        <p className="font-semibold">{errorInfo.title}</p>
        <p className="text-xs mt-0.5 opacity-80">{errorInfo.desc}</p>
      </div>
    </div>
  );
}

function LoginErrorDisplay() {
  return (
    <Suspense>
      <ErrorBanner />
    </Suspense>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Masukkan alamat email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format email tidak valid");
      return;
    }

    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (err) {
      setError(err.message || "Gagal mengirim link. Coba lagi.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-batik-cream">
        <div className="text-center">
          <div className="text-5xl mb-4">🌳</div>
          <Loader size={28} className="animate-spin text-batik-gold mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-batik-pattern bg-batik-cream p-4">
      {/* Ornamen atas */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-900 via-yellow-500 to-amber-900" />

      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌳</div>
          <h1 className="text-2xl font-bold text-batik-dark font-display">
            Pohon Keluarga
          </h1>
          <p className="text-batik-copper text-sm mt-1">Silaturahmi Lebaran</p>
          <div className="flex items-center justify-center gap-2 mt-3 text-amber-700 text-xs">
            <span>🌙</span>
            <span>Minal Aidin Wal Faizin</span>
            <span>🌙</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-batik-light overflow-hidden">
          {/* Card header */}
          <div className="bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-4">
            <h2 className="text-white font-bold text-base">
              Masuk ke Pohon Keluarga
            </h2>
            <p className="text-white/60 text-xs mt-0.5">
              Kami akan kirim link masuk ke email Anda
            </p>
          </div>

          {/* Error banner dari callback */}
          <LoginErrorDisplay />

          <div className="p-6">
            {sent ? (
              /* Success state */
              <div className="text-center py-4">
                <CheckCircle
                  size={48}
                  className="text-green-500 mx-auto mb-4"
                />
                <h3 className="font-bold text-batik-dark text-lg mb-2">
                  Link Terkirim!
                </h3>
                <p className="text-batik-copper text-sm mb-4">
                  Cek email <strong>{email}</strong> dan klik link yang kami
                  kirimkan untuk masuk.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                  <p className="text-xs text-amber-800 font-semibold mb-1">
                    💡 Tips:
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• Link berlaku selama 1 jam</li>
                    <li>• Cek folder Spam jika tidak ada</li>
                    <li>• Klik link dari perangkat yang sama</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="mt-4 text-xs text-batik-copper hover:text-batik-dark underline"
                >
                  Kirim ulang ke email lain
                </button>
              </div>
            ) : (
              /* Form state */
              <form onSubmit={handleSendLink} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-batik-copper mb-1.5">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-batik-muted"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="nama@email.com"
                      autoComplete="email"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm text-batik-dark bg-white
                        focus:outline-none focus:ring-2 transition-colors
                        ${
                          error
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-batik-light focus:border-batik-gold focus:ring-amber-50"
                        }`}
                    />
                  </div>
                  {error && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <span>⚠</span> {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 text-white font-semibold text-sm hover:from-amber-800 hover:to-amber-900 transition-all shadow disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" /> Mengirim...
                    </>
                  ) : (
                    <>
                      <Mail size={16} /> Kirim Magic Link{" "}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-batik-copper/70">
                  Tidak perlu password — cukup klik link di email Anda 🔐
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-batik-copper/50 mt-6">
          Pohon Keluarga · Dibuat dengan ❤️ untuk keluarga Indonesia
        </p>
      </div>

      {/* Ornamen bawah */}
      <div className="fixed bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-900 via-yellow-500 to-amber-900" />
    </div>
  );
}
