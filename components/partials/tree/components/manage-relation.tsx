import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Trash2,
  Plus,
  Search,
  Loader,
  Link,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { FamilyMember, FamilyRelation, RelationType } from "@/types";
import { createRelation, deleteRelation } from "@/lib/api/family";

// ── Types & constants ─────────────────────────────────────────────────────────
const RELATION_LABEL: Record<RelationType, string> = {
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

const PARENT_OF_A: RelationType[] = ["ayah", "ibu", "kakek", "nenek"];
const CHILD_OF_A: RelationType[] = ["anak", "cucu"];
const SPOUSE_TYPES: RelationType[] = ["suami", "istri"];

function hasParent(memberId: string, relations: FamilyRelation[]) {
  return relations.some(
    (r) =>
      (r.member_id === memberId && PARENT_OF_A.includes(r.relation_type)) ||
      (r.related_member_id === memberId &&
        CHILD_OF_A.includes(r.relation_type)),
  );
}
function hasSpouse(memberId: string, relations: FamilyRelation[]) {
  return relations.some(
    (r) =>
      SPOUSE_TYPES.includes(r.relation_type) &&
      (r.member_id === memberId || r.related_member_id === memberId),
  );
}
function getSpouseName(
  memberId: string,
  relations: FamilyRelation[],
  members: FamilyMember[],
) {
  const rel = relations.find(
    (r) =>
      SPOUSE_TYPES.includes(r.relation_type) &&
      (r.member_id === memberId || r.related_member_id === memberId),
  );
  if (!rel) return null;
  const spouseId =
    rel.member_id === memberId ? rel.related_member_id : rel.member_id;
  const spouse = members.find((m) => m.id === spouseId);
  return spouse?.nickname || spouse?.full_name.split(" ")[0] || null;
}

function validateRelation(
  memberId: string,
  relatedId: string,
  relationType: RelationType,
  relations: FamilyRelation[],
  members: FamilyMember[],
): string | null {
  const nameA = members.find((m) => m.id === memberId);
  const nameB = members.find((m) => m.id === relatedId);
  const a = nameA?.nickname || nameA?.full_name.split(" ")[0] || "A";
  const b = nameB?.nickname || nameB?.full_name.split(" ")[0] || "B";

  if (PARENT_OF_A.includes(relationType) && hasParent(memberId, relations))
    return `${a} sudah memiliki orang tua.`;
  if (CHILD_OF_A.includes(relationType) && hasParent(relatedId, relations))
    return `${b} sudah memiliki orang tua.`;
  if (PARENT_OF_A.includes(relationType) && hasSpouse(memberId, relations))
    return `${a} sudah menikah, tidak bisa ditambah orang tua.`;
  if (CHILD_OF_A.includes(relationType) && hasSpouse(relatedId, relations))
    return `${b} sudah menikah, tidak bisa ditambah orang tua.`;
  if (SPOUSE_TYPES.includes(relationType) && hasSpouse(memberId, relations))
    return `${a} sudah memiliki pasangan (${getSpouseName(memberId, relations, members)}).`;
  if (SPOUSE_TYPES.includes(relationType) && hasSpouse(relatedId, relations))
    return `${b} sudah memiliki pasangan (${getSpouseName(relatedId, relations, members)}).`;
  return null;
}

// ── Zod schema ────────────────────────────────────────────────────────────────
const addSchema = z
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
    message: "Tidak boleh anggota yang sama",
    path: ["related_id"],
  });

type AddFormValues = z.infer<typeof addSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface ManageRelationsProps {
  members: FamilyMember[];
  relations: FamilyRelation[];
  onClose: () => void;
  onRefresh: () => void;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({
  member,
  size = "sm",
}: {
  member?: FamilyMember;
  size?: "sm" | "xs";
}) {
  if (!member) return <div className="w-7 h-7 rounded-full bg-batik-light" />;
  const initial = (member.nickname?.[0] ?? member.full_name[0]).toUpperCase();
  const sz = size === "xs" ? "w-6 h-6 text-xs" : "w-7 h-7 text-xs";
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold flex-shrink-0
      ${member.gender === "laki-laki" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}
    >
      {initial}
    </div>
  );
}

const inputClass = (err?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm text-batik-dark bg-white focus:outline-none focus:ring-2 transition-colors
   ${err ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-batik-light focus:border-batik-gold focus:ring-amber-50"}`;

// ── Main component ────────────────────────────────────────────────────────────
export default function ManageRelations({
  members,
  relations: initialRelations,
  onClose,
  onRefresh,
}: ManageRelationsProps) {
  const [relations, setRelations] =
    useState<FamilyRelation[]>(initialRelations);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FamilyRelation | null>(
    null,
  );
  const [tab, setTab] = useState<"list" | "add">("list");

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { member_id: "", related_id: "", relation_type: "anak" },
  });

  const memberId = watch("member_id");
  const relatedId = watch("related_id");
  const relationType = watch("relation_type");

  const memberA = members.find((m) => m.id === memberId);
  const memberB = members.find((m) => m.id === relatedId);
  const relLabel = RELATION_OPTIONS.find((o) => o.value === relationType);
  const liveWarn =
    memberId && relatedId && memberId !== relatedId
      ? validateRelation(memberId, relatedId, relationType, relations, members)
      : null;

  // Filtered relations
  const filtered = useMemo(() => {
    if (!search.trim()) return relations;
    const q = search.toLowerCase();
    return relations.filter((r) => {
      const a = members.find((m) => m.id === r.member_id);
      const b = members.find((m) => m.id === r.related_member_id);
      return (
        a?.full_name.toLowerCase().includes(q) ||
        a?.nickname?.toLowerCase().includes(q) ||
        b?.full_name.toLowerCase().includes(q) ||
        b?.nickname?.toLowerCase().includes(q) ||
        RELATION_LABEL[r.relation_type]?.toLowerCase().includes(q)
      );
    });
  }, [relations, search, members]);

  const handleDelete = async (rel: FamilyRelation) => {
    setDeletingId(rel.id);
    try {
      await deleteRelation(rel.id);
      setRelations((prev) => prev.filter((r) => r.id !== rel.id));
      onRefresh();
    } catch (e: any) {
      alert("Gagal menghapus: " + e.message);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const onSubmit = async (values: AddFormValues) => {
    const err = validateRelation(
      values.member_id,
      values.related_id,
      values.relation_type,
      relations,
      members,
    );
    if (err) {
      setError("root", { message: err });
      return;
    }
    try {
      const saved = await createRelation(
        values.member_id,
        values.related_id,
        values.relation_type,
      );
      setRelations((prev) => [...prev, saved]);
      onRefresh();
      reset();
      setTab("list");
    } catch (e: any) {
      setError("root", {
        message: e.message?.includes("unique")
          ? "Relasi ini sudah ada"
          : e.message || "Terjadi kesalahan",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-batik-cream rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col fade-in border border-batik-gold/30">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 rounded-t-2xl bg-gradient-to-r from-amber-800 to-amber-900 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              🔗 Kelola Relasi
            </h2>
            <p className="text-xs text-white/60 mt-0.5">
              {relations.length} relasi terdaftar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-batik-light flex-shrink-0">
          {(["list", "add"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors
                ${
                  tab === t
                    ? "text-amber-800 border-b-2 border-amber-700 bg-amber-50/50"
                    : "text-batik-copper hover:text-batik-dark hover:bg-batik-light/40"
                }`}
            >
              {t === "list"
                ? `📋 Daftar Relasi (${relations.length})`
                : "➕ Tambah Relasi"}
            </button>
          ))}
        </div>

        {/* ── TAB LIST ── */}
        {tab === "list" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search */}
            <div className="px-4 py-3 border-b border-batik-light flex-shrink-0">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-batik-muted"
                />
                <input
                  type="text"
                  placeholder="Cari nama atau jenis relasi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-batik-light bg-white text-sm focus:outline-none focus:border-batik-gold"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">🔗</div>
                  <p className="text-batik-brown text-sm font-semibold">
                    {search ? "Tidak ditemukan" : "Belum ada relasi"}
                  </p>
                  {!search && (
                    <button
                      onClick={() => setTab("add")}
                      className="mt-3 text-xs text-amber-700 underline"
                    >
                      Tambah relasi pertama
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((rel) => {
                  const a = members.find((m) => m.id === rel.member_id);
                  const b = members.find((m) => m.id === rel.related_member_id);
                  const isDeleting = deletingId === rel.id;
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-batik-light/50 hover:bg-amber-50/40 transition-colors"
                    >
                      <Avatar member={a} />
                      <span className="text-xs text-batik-copper flex-shrink-0 hidden sm:block truncate max-w-[70px]">
                        {a?.nickname || a?.full_name.split(" ")[0]}
                      </span>
                      <div className="flex flex-col items-center flex-shrink-0">
                        <ArrowRight size={12} className="text-batik-gold" />
                        <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium mt-0.5 whitespace-nowrap">
                          {RELATION_LABEL[rel.relation_type]}
                        </span>
                      </div>
                      <Avatar member={b} />
                      <span className="text-xs text-batik-copper flex-1 truncate hidden sm:block max-w-[70px]">
                        {b?.nickname || b?.full_name.split(" ")[0]}
                      </span>

                      {/* Mobile: show names */}
                      <div className="flex-1 min-w-0 sm:hidden">
                        <p className="text-xs text-batik-dark font-medium truncate">
                          {a?.nickname || a?.full_name.split(" ")[0]} →{" "}
                          {b?.nickname || b?.full_name.split(" ")[0]}
                        </p>
                      </div>

                      <button
                        onClick={() => setConfirmDelete(rel)}
                        disabled={isDeleting}
                        className="flex-shrink-0 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Hapus relasi"
                      >
                        {isDeleting ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── TAB ADD ── */}
        {tab === "add" && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  {errors.root.message}
                </div>
              )}

              {/* Live preview */}
              <div
                className={`flex items-center justify-center gap-3 p-3 rounded-xl border transition-all
                ${memberA && memberB ? "bg-amber-50 border-amber-200" : "bg-batik-light/40 border-batik-light"}`}
              >
                {memberA ? (
                  <div className="text-center">
                    <Avatar member={memberA} size="sm" />
                    <p className="text-xs mt-1 text-batik-dark font-medium truncate max-w-[70px]">
                      {memberA.nickname || memberA.full_name.split(" ")[0]}
                    </p>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-batik-light border-2 border-dashed border-batik-muted" />
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
                  <div className="text-center">
                    <Avatar member={memberB} size="sm" />
                    <p className="text-xs mt-1 text-batik-dark font-medium truncate max-w-[70px]">
                      {memberB.nickname || memberB.full_name.split(" ")[0]}
                    </p>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-batik-light border-2 border-dashed border-batik-muted" />
                )}
              </div>

              {liveWarn && !errors.root && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{" "}
                  {liveWarn}
                </div>
              )}

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

              {/* Relasi */}
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

            <div className="px-4 py-3 border-t border-batik-light flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setTab("list");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-batik-light text-batik-brown text-sm font-semibold hover:bg-batik-light transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!liveWarn}
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
        )}
      </div>

      {/* Konfirmasi hapus */}
      {confirmDelete &&
        (() => {
          const a = members.find((m) => m.id === confirmDelete.member_id);
          const b = members.find(
            (m) => m.id === confirmDelete.related_member_id,
          );
          return (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
              <div className="bg-batik-cream rounded-2xl shadow-2xl w-full max-w-xs border border-batik-gold/30 fade-in p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={20} className="text-red-500" />
                </div>
                <h3 className="font-bold text-batik-dark mb-1">
                  Hapus Relasi?
                </h3>
                <p className="text-sm text-batik-copper mb-4">
                  <strong>{a?.nickname || a?.full_name.split(" ")[0]}</strong>
                  {" → "}
                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                    {RELATION_LABEL[confirmDelete.relation_type]}
                  </span>
                  {" → "}
                  <strong>{b?.nickname || b?.full_name.split(" ")[0]}</strong>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 px-3 py-2 rounded-xl border border-batik-light text-batik-brown text-sm font-semibold hover:bg-batik-light transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDelete(confirmDelete)}
                    disabled={!!deletingId}
                    className="flex-1 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {deletingId ? (
                      <Loader size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
