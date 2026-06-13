import type { Metadata } from "next";
import "./globals.css";
import TanstackQueryProvider from "@/providers/tanstack-query-provider";
import { AuthProvider } from "@/providers/auth-provider";

export const metadata: Metadata = {
  title: "Pohon Keluarga | Silaturahmi Lebaran",
  description: "Telusuri dan kenali anggota keluarga besar saat lebaran",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-batik-cream batik-pattern">
        <AuthProvider>
          <TanstackQueryProvider>{children}</TanstackQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
