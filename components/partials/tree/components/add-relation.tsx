import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Link, Loader, ArrowRight } from "lucide-react";
import type { FamilyMember, FamilyRelation, RelationType } from "@/types";
import { createRelation } from "@/lib/api/family";
import { FC } from "react";

// ── Zod Schema ────────────────────────────────────────────────────────────────
const relationSchema = z
  .object({
    member_id: z.string().min(1, "Pilih anggota A"),
    related_id: z.string().min(1, "Pilih anggota B"),
    relation_type: z.enum([
      "ayah",
      "ibu",
      "anak",
      "suami",
      "istri",
      "kakek",
      "nenek",
      "cucu",
      "saudara",
      "paman",
      "bibi",
      "sepupu",
    ] as const),
  })
  .refine((d) => d.member_id !== d.related_id, {
    message: "Tidak boleh memilih anggota yang sama",
    path: ["related_id"],
  });

type RelationFormValues = z.infer<typeof relationSchema>;

interface AddRelationProps {
  members: FamilyMember[];
  relations: FamilyRelation[];
  onSave: () => void;
  onClose: () => void;
}

const RELATION_OPTIONS: {
  value: RelationType;
  label: string;
  emoji: string;
}[] = [
  { value: "anak", label: "Anak", emoji: "👶" },
  { value: "ayah", label: "Ayah", emoji: "👨" },
  { value: "ibu", label: "Ibu", emoji: "👩" },
  { value: "suami", label: "Suami", emoji: "💑" },
  { value: "istri", label: "Istri", emoji: "💑" },
  { value: "kakek", label: "Kakek", emoji: "👴" },
  { value: "nenek", label: "Nenek", emoji: "👵" },
  { value: "cucu", label: "Cucu", emoji: "🧒" },
  { value: "saudara", label: "Saudara", emoji: "🤝" },
  { value: "paman", label: "Paman", emoji: "🧑" },
  { value: "bibi", label: "Bibi", emoji: "👩" },
  { value: "sepupu", label: "Sepupu", emoji: "👫" },
];

// Relasi yang berarti "memiliki orang tua"
// Ketika A → [ayah|ibu|kakek|nenek] → B, artinya A punya orang tua/kakek B
const PARENT_OF_A: RelationType[] = ["ayah", "ibu", "kakek", "nenek"];
// Ketika A → [anak|cucu] → B, artinya B punya orang tua/kakek A (B is child of A)
const CHILD_OF_A: RelationType[] = ["anak", "cucu"];

const SPOUSE_TYPES: RelationType[] = ["suami", "istri"];

// ── Helper: cek apakah member sudah punya orang tua ─────────────────────────
function hasParent(memberId: string, relations: FamilyRelation[]): boolean {
  return relations.some((r) => {
    // A → ayah/ibu/kakek/nenek → B  berarti A punya orang tua
    if (r.member_id === memberId && PARENT_OF_A.includes(r.relation_type))
      return true;
    // A → anak/cucu → B  berarti B punya orang tua (A adalah parent B)
    if (
      r.related_member_id === memberId &&
      CHILD_OF_A.includes(r.relation_type)
    )
      return true;
    return false;
  });
}

// ── Helper: cek apakah member sudah punya pasangan ──────────────────────────
function hasSpouse(memberId: string, relations: FamilyRelation[]): boolean {
  return relations.some(
    (r) =>
      SPOUSE_TYPES.includes(r.relation_type) &&
      (r.member_id === memberId || r.related_member_id === memberId),
  );
}

// ── Helper: dapatkan id pasangan ─────────────────────────────────────────────
function getSpouseId(
  memberId: string,
  relations: FamilyRelation[],
): string | null {
  const rel = relations.find(
    (r) =>
      SPOUSE_TYPES.includes(r.relation_type) &&
      (r.member_id === memberId || r.related_member_id === memberId),
  );
  if (!rel) return null;
  return rel.member_id === memberId ? rel.related_member_id : rel.member_id;
}

// ── Validasi bisnis ──────────────────────────────────────────────────────────
function validateRelation(
  memberId: string,
  relatedId: string,
  relationType: RelationType,
  relations: FamilyRelation[],
  members: FamilyMember[],
): string | null {
  const memberA = members.find((m) => m.id === memberId);
  const memberB = members.find((m) => m.id === relatedId);
  if (!memberA || !memberB) return null;

  const nameA = memberA.nickname || memberA.full_name.split(" ")[0];
  const nameB = memberB.nickname || memberB.full_name.split(" ")[0];

  // ── Aturan 1: Satu root ───────────────────────────────────────────────────
  // Jika relasi berarti "A mendapat orang tua baru" → cek A sudah punya parent
  if (PARENT_OF_A.includes(relationType)) {
    if (hasParent(memberId, relations)) {
      return `${nameA} sudah memiliki orang tua. Setiap anggota hanya boleh memiliki satu orang tua dalam pohon.`;
    }
  }

  // Jika relasi "A → anak → B" berarti B mendapat orang tua baru (A jadi parent B)
  if (CHILD_OF_A.includes(relationType)) {
    if (hasParent(relatedId, relations)) {
      return `${nameB} sudah memiliki orang tua. Setiap anggota hanya boleh memiliki satu orang tua dalam pohon.`;
    }
  }

  // ── Aturan 2: Pasangan tidak bisa menambah orang tua ─────────────────────
  // Jika A ingin memberi orang tua ke B, tapi B sudah punya pasangan
  if (PARENT_OF_A.includes(relationType) && hasSpouse(memberId, relations)) {
    return `${nameA} sudah memiliki pasangan. Anggota yang sudah menikah tidak dapat ditambahkan orang tua baru.`;
  }

  // Jika A → anak → B (B jadi anak A), tapi B sudah punya pasangan
  if (CHILD_OF_A.includes(relationType) && hasSpouse(relatedId, relations)) {
    return `${nameB} sudah memiliki pasangan. Anggota yang sudah menikah tidak dapat ditambahkan orang tua baru.`;
  }

  // ── Aturan 3: Tidak boleh punya pasangan lebih dari satu ─────────────────
  if (SPOUSE_TYPES.includes(relationType)) {
    if (hasSpouse(memberId, relations)) {
      const spouseId = getSpouseId(memberId, relations);
      const spouse = members.find((m) => m.id === spouseId);
      return `${nameA} sudah memiliki pasangan (${spouse?.nickname || spouse?.full_name.split(" ")[0] || "seseorang"}).`;
    }
    if (hasSpouse(relatedId, relations)) {
      const spouseId = getSpouseId(relatedId, relations);
      const spouse = members.find((m) => m.id === spouseId);
      return `${nameB} sudah memiliki pasangan (${spouse?.nickname || spouse?.full_name.split(" ")[0] || "seseorang"}).`;
    }
  }

  return null;
}

const inputClass = (hasError?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm text-batik-dark bg-white
   focus:outline-none focus:ring-2 transition-colors
   ${
     hasError
       ? "border-red-300 focus:border-red-400 focus:ring-red-100"
       : "border-batik-light focus:border-batik-gold focus:ring-amber-50"
   }`;

function MemberAvatar({ member }: { member: FamilyMember }) {
  const initial = (member.nickname?.[0] ?? member.full_name[0]).toUpperCase();
  return (
    <div className="text-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-1
        ${member.gender === "laki-laki" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}
      >
        {initial}
      </div>
      <p className="text-xs font-semibold text-batik-dark truncate max-w-[80px]">
        {member.nickname || member.full_name.split(" ")[0]}
      </p>
    </div>
  );
}

export const AddRelation: FC<AddRelationProps> = (props) => {
  const { members, relations, onSave, onClose } = props;
  const {
    register,
    handleSubmit,
    watch,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RelationFormValues>({
    resolver: zodResolver(relationSchema),
    defaultValues: {
      member_id: "",
      related_id: "",
      relation_type: "anak",
    },
  });

  const memberId = watch("member_id");
  const relatedId = watch("related_id");
  const relationType = watch("relation_type");

  const memberA = members.find((m) => m.id === memberId);
  const memberB = members.find((m) => m.id === relatedId);
  const relLabel = RELATION_OPTIONS.find((o) => o.value === relationType);

  // Validasi live — tampilkan warning sebelum submit
  const liveWarning =
    memberId && relatedId && memberId !== relatedId
      ? validateRelation(memberId, relatedId, relationType, relations, members)
      : null;

  const onSubmit = async (values: RelationFormValues) => {
    // Validasi bisnis
    const validationError = validateRelation(
      values.member_id,
      values.related_id,
      values.relation_type,
      relations,
      members,
    );
    if (validationError) {
      setError("root", { message: validationError });
      return;
    }

    try {
      await createRelation(
        values.member_id,
        values.related_id,
        values.relation_type,
      );
      onSave();
    } catch (err: any) {
      setError("root", {
        message: err.message?.includes("unique")
          ? "Relasi ini sudah ada"
          : err.message || "Terjadi kesalahan",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-batik-cream rounded-2xl shadow-2xl w-full max-w-md fade-in border border-batik-gold/30">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-batik-light rounded-t-2xl bg-gradient-to-r from-amber-800 to-amber-900">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              🔗 Tambah Relasi
            </h2>
            <p className="text-xs text-white/60 mt-0.5">
              Hubungkan dua anggota keluarga
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="p-5 space-y-4">
            {/* Error */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">⚠️</span>
                <span>{errors.root.message}</span>
              </div>
            )}

            {/* Live warning (sebelum submit) */}
            {!errors.root && liveWarning && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                <span>{liveWarning}</span>
              </div>
            )}

            {/* Live preview */}
            <div
              className={`flex items-center justify-center gap-3 p-3 rounded-xl border transition-all
              ${memberA && memberB ? "bg-amber-50 border-amber-200" : "bg-batik-light/40 border-batik-light"}`}
            >
              {memberA ? (
                <MemberAvatar member={memberA} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-batik-light border-2 border-dashed border-batik-muted mx-auto" />
              )}
              <div className="flex flex-col items-center gap-0.5 flex-1">
                <ArrowRight size={16} className="text-batik-gold" />
                {relLabel && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                    {relLabel.emoji} {relLabel.label}
                  </span>
                )}
              </div>
              {memberB ? (
                <MemberAvatar member={memberB} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-batik-light border-2 border-dashed border-batik-muted mx-auto" />
              )}
            </div>

            {/* Anggota A */}
            <div>
              <label className="block text-xs font-semibold text-batik-copper mb-1">
                Anggota A <span className="text-red-400">*</span>
              </label>
              <select
                {...register("member_id")}
                className={inputClass(!!errors.member_id)}
              >
                <option value="">-- Pilih anggota --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                    {m.nickname ? ` (${m.nickname})` : ""}
                  </option>
                ))}
              </select>
              {errors.member_id && (
                <p className="mt-1 text-xs text-red-500">
                  ⚠ {errors.member_id.message}
                </p>
              )}
            </div>

            {/* Jenis Relasi — radio grid */}
            <div>
              <label className="block text-xs font-semibold text-batik-copper mb-2">
                Relasi A terhadap B <span className="text-red-400">*</span>
              </label>
              <Controller
                name="relation_type"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-4 gap-1.5">
                    {RELATION_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border cursor-pointer text-xs font-medium transition-all
                          ${
                            field.value === opt.value
                              ? "border-amber-500 bg-amber-50 text-amber-800"
                              : "border-batik-light bg-white text-batik-dark hover:border-batik-muted"
                          }`}
                      >
                        <input
                          type="radio"
                          value={opt.value}
                          checked={field.value === opt.value}
                          onChange={() => field.onChange(opt.value)}
                          className="sr-only"
                        />
                        <span className="text-base">{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Anggota B */}
            <div>
              <label className="block text-xs font-semibold text-batik-copper mb-1">
                Anggota B <span className="text-red-400">*</span>
              </label>
              <select
                {...register("related_id")}
                className={inputClass(!!errors.related_id)}
              >
                <option value="">-- Pilih anggota --</option>
                {members
                  .filter((m) => m.id !== memberId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                      {m.nickname ? ` (${m.nickname})` : ""}
                    </option>
                  ))}
              </select>
              {errors.related_id && (
                <p className="mt-1 text-xs text-red-500">
                  ⚠ {errors.related_id.message}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-batik-light flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-batik-light text-batik-brown text-sm font-semibold hover:bg-batik-light transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!liveWarning}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 text-white text-sm font-semibold hover:from-amber-800 hover:to-amber-900 transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader size={15} className="animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Link size={15} /> Hubungkan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
