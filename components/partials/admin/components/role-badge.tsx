import { Role } from "@/types";
import { FC } from "react";
import { ROLE_CONFIG } from "..";

type Props = {
  role: Role;
};

export const RoleBadge: FC<Props> = ({ role }) => {
  const cfg = ROLE_CONFIG[role];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
};
