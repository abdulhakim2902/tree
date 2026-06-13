"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Loader } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-batik-cream">
        <div className="text-center">
          <div className="text-5xl mb-4">🌳</div>
          <Loader
            size={28}
            className="animate-spin text-batik-gold mx-auto mb-2"
          />
          <p className="text-batik-brown text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
