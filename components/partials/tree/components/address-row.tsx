import { MapPin, Map } from "lucide-react";
import { FC } from "react";

type AddressRowProps = {
  address?: string | null;
};

export const AddressRow: FC<AddressRowProps> = (props) => {
  const { address } = props;

  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="text-batik-gold flex-shrink-0">
        <MapPin size={14} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-batik-copper">Alamat</p>
        <p className="text-sm text-batik-dark font-medium line-clamp-2">
          {address || "-"}
        </p>
      </div>
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka di Google Maps"
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors shadow-sm"
        >
          <Map size={13} />
          <span>Maps</span>
        </a>
      )}
    </div>
  );
};
