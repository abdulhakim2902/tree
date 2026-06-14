import { Role } from "@/types";
import { Eye, Pencil, Crown } from "lucide-react";

export * from "./admin-main-content";
export * from "./components";

export const ROLE_CONFIG: Record<
  Role,
  { label: string; color: string; icon: React.ReactNode }
> = {
  admin: {
    label: "Admin",
    color: "bg-amber-100 text-amber-800 border-amber-300",
    icon: <Crown size={11} />,
  },
  editor: {
    label: "Editor",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: <Pencil size={11} />,
  },
  viewer: {
    label: "Viewer",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: <Eye size={11} />,
  },
};
