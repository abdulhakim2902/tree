import { Phone, MessageCircle } from "lucide-react";
import { FC } from "react";

type PhoneRowProps = {
  phone?: string | null;
};

export const PhoneRow: FC<PhoneRowProps> = (props) => {
  const { phone } = props;

  // Normalisasi nomor ke format WhatsApp (62xxx)
  const toWaNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) return "62" + digits.slice(1);
    if (digits.startsWith("62")) return digits;
    return "62" + digits;
  };

  const waUrl = phone
    ? `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent("Halo! Selamat Lebaran 🌙 Mohon Maaf Lahir dan Batin 🙏")}`
    : null;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="text-batik-gold flex-shrink-0">
        <Phone size={14} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-batik-copper">Telepon</p>
        <p className="text-sm text-batik-dark font-medium truncate">
          {phone || "-"}
        </p>
      </div>
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Kirim pesan WhatsApp"
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors shadow-sm"
        >
          <MessageCircle size={13} />
          <span>Kirim Pesan</span>
        </a>
      )}
    </div>
  );
};
