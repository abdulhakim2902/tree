import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Save,
  Loader,
  User,
  Calendar,
  MapPin,
  Briefcase,
  Phone,
  Hash,
  StickyNote,
  Image,
} from "lucide-react";
import type { FamilyMember } from "@/types";
import { createMember, updateMember } from "@/lib/family";

// ── Zod Schema ────────────────────────────────────────────────────────────────
const memberSchema = z.object({
  full_name: z
    .string()
    .min(1, "Nama lengkap wajib diisi")
    .max(100, "Maksimal 100 karakter"),
  nickname: z
    .string()
    .max(50, "Maksimal 50 karakter")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["laki-laki", "perempuan"]),
  birth_date: z.string().optional().or(z.literal("")),
  birth_place: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  job: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  generation: z.number().transform((val, ctx) => {
    const n = Number(val);
    if (isNaN(n)) {
      ctx.addIssue({
        code: "custom",
        message: "Generasi harus berupa angka",
      });
      return z.NEVER;
    }
    if (!Number.isInteger(n)) {
      ctx.addIssue({
        code: "custom",
        message: "Generasi harus bilangan bulat",
      });
      return z.NEVER;
    }
    if (n < 1) {
      ctx.addIssue({ code: "custom", message: "Generasi minimal 1" });
      return z.NEVER;
    }
    if (n > 10) {
      ctx.addIssue({ code: "custom", message: "Generasi maksimal 10" });
      return z.NEVER;
    }
    return n;
  }),
  photo_url: z.url("URL foto tidak valid").optional().or(z.literal("")),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface MemberFormProps {
  member?: FamilyMember | null;
  defaultGeneration?: number;
  onSave: (member: FamilyMember) => void;
  onClose: () => void;
}

// ── Reusable field wrapper ────────────────────────────────────────────────────
function FieldWrapper({
  label,
  icon,
  error,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-batik-copper mb-1">
        {icon && <span className="opacity-60">{icon}</span>}
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  `w-full px-3 py-2 rounded-lg border text-sm text-batik-dark bg-white
   focus:outline-none focus:ring-2 transition-colors
   ${
     hasError
       ? "border-red-300 focus:border-red-400 focus:ring-red-100"
       : "border-batik-light focus:border-batik-gold focus:ring-amber-50"
   }`;

// ── Component ─────────────────────────────────────────────────────────────────
export const MemberForm: FC<MemberFormProps> = (props) => {
  const { member, defaultGeneration, onSave, onClose } = props;

  const isEdit = !!member;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: "",
      nickname: "",
      gender: "laki-laki",
      birth_date: "",
      birth_place: "",
      phone: "",
      job: "",
      address: "",
      notes: "",
      generation: defaultGeneration ?? 1,
      photo_url: "",
    },
  });

  // Pre-fill saat edit
  useEffect(() => {
    if (member) {
      reset({
        full_name: member.full_name ?? "",
        nickname: member.nickname ?? "",
        gender: member.gender ?? "laki-laki",
        birth_date: member.birth_date ?? "",
        birth_place: member.birth_place ?? "",
        phone: member.phone ?? "",
        job: member.job ?? "",
        address: member.address ?? "",
        notes: member.notes ?? "",
        generation: member.generation ?? 1,
        photo_url: member.photo_url ?? "",
      });
    }
  }, [member, reset]);

  const onSubmit = async (values: MemberFormValues) => {
    try {
      const payload = {
        ...values,
        nickname: values.nickname || undefined,
        birth_date: values.birth_date || undefined,
        birth_place: values.birth_place || undefined,
        phone: values.phone || undefined,
        job: values.job || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
        photo_url: values.photo_url || undefined,
      };
      const saved = isEdit
        ? await updateMember(member!.id, payload)
        : await createMember(payload);
      onSave(saved);
    } catch (err: any) {
      setError("root", {
        message: err.message || "Terjadi kesalahan, coba lagi",
      });
    }
  };

  const gender = watch("gender");
  const notes = watch("notes") ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-batik-cream rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col fade-in border border-batik-gold/30">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b border-batik-light
          rounded-t-2xl bg-gradient-to-r
          ${gender === "laki-laki" ? "from-amber-800 to-amber-900" : "from-rose-700 to-rose-900"}
        `}
        >
          <div>
            <h2 className="text-base font-bold text-white font-display">
              {isEdit ? "✏️ Edit Anggota" : "➕ Tambah Anggota Baru"}
            </h2>
            <p className="text-xs text-white/60 mt-0.5">
              {isEdit
                ? `Mengubah data ${member!.full_name}`
                : "Lengkapi informasi anggota keluarga"}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {/* Root error */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 flex items-center gap-2">
                <span>⚠️</span> {errors.root.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Nama Lengkap */}
              <div className="col-span-2">
                <FieldWrapper
                  label="Nama Lengkap"
                  icon={<User size={12} />}
                  error={errors.full_name?.message}
                  required
                >
                  <input
                    {...register("full_name")}
                    placeholder="cth: H. Ahmad Suharto"
                    className={inputClass(!!errors.full_name)}
                  />
                </FieldWrapper>
              </div>

              {/* Nama Panggilan */}
              <FieldWrapper
                label="Nama Panggilan"
                icon={<User size={12} />}
                error={errors.nickname?.message}
              >
                <input
                  {...register("nickname")}
                  placeholder="cth: Mbah Kakung"
                  className={inputClass(!!errors.nickname)}
                />
              </FieldWrapper>

              {/* Generasi */}
              <FieldWrapper
                label="Generasi"
                icon={<Hash size={12} />}
                error={errors.generation?.message}
                required
              >
                <input
                  {...register("generation")}
                  type="number"
                  min={1}
                  max={10}
                  className={inputClass(!!errors.generation)}
                />
              </FieldWrapper>

              {/* Jenis Kelamin */}
              <div className="col-span-2">
                <FieldWrapper
                  label="Jenis Kelamin"
                  error={errors.gender?.message}
                  required
                >
                  <div className="grid grid-cols-2 gap-2">
                    {(["laki-laki", "perempuan"] as const).map((g) => (
                      <label
                        key={g}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium
                          ${
                            gender === g
                              ? g === "laki-laki"
                                ? "border-amber-600 bg-amber-50 text-amber-800"
                                : "border-rose-500 bg-rose-50 text-rose-800"
                              : "border-batik-light bg-white text-batik-dark hover:border-batik-muted"
                          }`}
                      >
                        <input
                          type="radio"
                          value={g}
                          {...register("gender")}
                          className="sr-only"
                        />
                        <span>{g === "laki-laki" ? "♂" : "♀"}</span>
                        <span className="capitalize">
                          {g === "laki-laki" ? "Laki-laki" : "Perempuan"}
                        </span>
                      </label>
                    ))}
                  </div>
                </FieldWrapper>
              </div>

              {/* Tanggal Lahir */}
              <FieldWrapper
                label="Tanggal Lahir"
                icon={<Calendar size={12} />}
                error={errors.birth_date?.message}
              >
                <input
                  {...register("birth_date")}
                  type="date"
                  className={inputClass(!!errors.birth_date)}
                />
              </FieldWrapper>

              {/* Tempat Lahir */}
              <FieldWrapper
                label="Tempat Lahir"
                icon={<MapPin size={12} />}
                error={errors.birth_place?.message}
              >
                <input
                  {...register("birth_place")}
                  placeholder="cth: Yogyakarta"
                  className={inputClass(!!errors.birth_place)}
                />
              </FieldWrapper>

              {/* Pekerjaan */}
              <FieldWrapper
                label="Pekerjaan"
                icon={<Briefcase size={12} />}
                error={errors.job?.message}
              >
                <input
                  {...register("job")}
                  placeholder="cth: Guru, Dokter..."
                  className={inputClass(!!errors.job)}
                />
              </FieldWrapper>

              {/* Telepon */}
              <FieldWrapper
                label="No. Telepon"
                icon={<Phone size={12} />}
                error={errors.phone?.message}
              >
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="cth: 0812-3456-7890"
                  className={inputClass(!!errors.phone)}
                />
              </FieldWrapper>

              {/* Alamat */}
              <div className="col-span-2">
                <FieldWrapper
                  label="Alamat"
                  icon={<MapPin size={12} />}
                  error={errors.address?.message}
                >
                  <input
                    {...register("address")}
                    placeholder="Jalan, kota, provinsi..."
                    className={inputClass(!!errors.address)}
                  />
                </FieldWrapper>
              </div>

              {/* URL Foto */}
              <div className="col-span-2">
                <FieldWrapper
                  label="URL Foto"
                  icon={<Image size={12} />}
                  error={errors.photo_url?.message}
                >
                  <input
                    {...register("photo_url")}
                    type="url"
                    placeholder="https://..."
                    className={inputClass(!!errors.photo_url)}
                  />
                </FieldWrapper>
              </div>

              {/* Catatan */}
              <div className="col-span-2">
                <FieldWrapper
                  label="Catatan"
                  icon={<StickyNote size={12} />}
                  error={errors.notes?.message}
                >
                  <textarea
                    {...register("notes")}
                    rows={2}
                    placeholder="Cerita atau informasi tambahan..."
                    className={`${inputClass(!!errors.notes)} resize-none`}
                  />
                  <p className="text-right text-xs text-batik-copper/60 mt-0.5">
                    {notes.length}/500
                  </p>
                </FieldWrapper>
              </div>
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
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 text-white text-sm font-semibold hover:from-amber-800 hover:to-amber-900 transition-all flex items-center justify-center gap-2 shadow disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader size={15} className="animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save size={15} />{" "}
                  {isEdit ? "Simpan Perubahan" : "Tambah Anggota"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
