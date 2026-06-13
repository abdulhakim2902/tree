import { FC } from "react";

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
};

export const InfoRow: FC<InfoRowProps> = (props) => {
  const { icon, label, value } = props;

  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <span className="text-batik-gold mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-batik-copper">{label}</p>
        <p className="text-sm text-batik-dark font-medium truncate">
          {value || "-"}
        </p>
      </div>
    </div>
  );
};
