"use client";

import { useState, useEffect } from "react";
import { getMyRole, type UserRole } from "@/lib/roles";
import { useAuth } from "@/providers/auth-provider";
interface UseRoleReturn {
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canEdit: boolean; // admin or editor
}

export function useRole(): UseRoleReturn {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    getMyRole()
      .then((r) => setRole(r))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return {
    role,
    loading,
    isAdmin: role === "admin",
    isEditor: role === "editor",
    isViewer: role === "viewer",
    canEdit: role === "admin" || role === "editor",
  };
}
