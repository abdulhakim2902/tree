import {
  X,
  Briefcase,
  Calendar,
  Pencil,
  Trash2,
  Building2,
} from "lucide-react";
import type { FamilyMember, FamilyRelation } from "@/types";
import { FC } from "react";
import { InfoRow } from "./info-row";
import { PhoneRow } from "./phone-row";
import { AddressRow } from "./address-row";

interface MemberDetailProps {
  member: FamilyMember;
  relations: FamilyRelation[];
  allMembers: FamilyMember[];
  onClose: () => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  canEdit?: boolean;
}

const RELATION_LABEL: Record<string, string> = {
  ayah: "Ayah",
  ibu: "Ibu",
  anak: "Anak",
  suami: "Suami",
  istri: "Istri",
  kakek: "Kakek",
  nenek: "Nenek",
  cucu: "Cucu",
  saudara: "Saudara",
  paman: "Paman",
  bibi: "Bibi",
  sepupu: "Sepupu",
};

export const MemberDetail: FC<MemberDetailProps> = (props) => {
  const { member, relations, allMembers, onClose, onDelete, onEdit, canEdit } =
    props;

  const initial = member.nickname?.[0] ?? member.full_name[0];
  const isMale = member.gender === "laki-laki";

  const age = member.birth_date
    ? new Date().getFullYear() - new Date(member.birth_date).getFullYear()
    : null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const memberRelations = relations.filter(
    (r) => r.member_id === member.id || r.related_member_id === member.id,
  );

  const getRelatedMember = (rel: FamilyRelation) => {
    const relatedId =
      rel.member_id === member.id ? rel.related_member_id : rel.member_id;
    return allMembers.find((m) => m.id === relatedId);
  };

  return (
    <div className="h-full flex flex-col bg-batik-cream fade-in">
      {/* Header */}
      <div
        className={`
          relative p-5 text-white
          ${
            isMale
              ? "bg-gradient-to-br from-amber-800 to-amber-900"
              : "bg-gradient-to-br from-rose-700 to-rose-900"
          }
        `}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-4">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.full_name}
              className="w-20 h-20 rounded-full object-cover border-3 border-white/50 shadow-lg"
            />
          ) : (
            <div
              className={`
              w-20 h-20 rounded-full flex items-center justify-center
              text-3xl font-bold border-2 border-white/40 shadow-lg
              ${isMale ? "bg-amber-600" : "bg-rose-600"}
            `}
            >
              {initial.toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs opacity-70 mb-0.5">
              {isMale ? "♂ Laki-laki" : "♀ Perempuan"} · Generasi{" "}
              {member.generation}
            </p>
            <h2 className="text-lg font-bold leading-tight">
              {member.full_name}
            </h2>
            {member.nickname && (
              <p className="text-sm opacity-80 italic">"{member.nickname}"</p>
            )}
            {age !== null && (
              <p className="text-sm opacity-70 mt-1">{age} tahun</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {canEdit && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onEdit(member)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-xs font-semibold"
            >
              <Pencil size={13} /> Edit Data
            </button>
            <button
              onClick={() => onDelete(member)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/35 transition-colors text-xs font-semibold text-red-100"
            >
              <Trash2 size={13} /> Hapus
            </button>
          </div>
        )}

        {/* Gold ornament */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Info Cards */}
        <section>
          <h3 className="text-xs font-bold text-batik-gold uppercase tracking-wider mb-2">
            Informasi Pribadi
          </h3>
          <div className="bg-white rounded-xl border border-batik-light divide-y divide-batik-light shadow-sm">
            <InfoRow
              icon={<Calendar size={14} />}
              label="Lahir"
              value={formatDate(member.birth_date)}
            />
            <InfoRow
              icon={<Building2 size={14} />}
              label="Tempat Lahir"
              value={member.birth_place}
            />
            <InfoRow
              icon={<Briefcase size={14} />}
              label="Pekerjaan"
              value={member.job}
            />
            <PhoneRow phone={member.phone} />
            <AddressRow address={member.address} />
          </div>
        </section>

        {/* Relations */}
        {memberRelations.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-batik-gold uppercase tracking-wider mb-2">
              Hubungan Keluarga
            </h3>
            <div className="space-y-2">
              {memberRelations.map((rel) => {
                const related = getRelatedMember(rel);
                if (!related) return null;
                return (
                  <div
                    key={rel.id}
                    className="flex items-center gap-3 bg-white rounded-lg border border-batik-light p-2.5 shadow-sm"
                  >
                    <div
                      className={`
                      w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                      ${
                        related.gender === "laki-laki"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }
                    `}
                    >
                      {(
                        related.nickname?.[0] ?? related.full_name[0]
                      ).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-batik-dark truncate">
                        {related.nickname || related.full_name.split(" ")[0]}
                      </p>
                      <p className="text-xs text-batik-copper">
                        {related.full_name}
                      </p>
                    </div>
                    <span className="text-xs bg-batik-light text-batik-brown px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      {RELATION_LABEL[rel.relation_type] ?? rel.relation_type}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Notes */}
        {member.notes && (
          <section>
            <h3 className="text-xs font-bold text-batik-gold uppercase tracking-wider mb-2">
              Catatan
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 shadow-sm">
              <p className="text-sm text-batik-dark italic">{member.notes}</p>
            </div>
          </section>
        )}

        {/* Greeting */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-amber-800 text-sm">🌙 Selamat Lebaran!</p>
          <p className="text-amber-700 text-xs mt-0.5">
            Mohon maaf lahir dan batin dari keluarga besar
          </p>
        </div>
      </div>
    </div>
  );
};
