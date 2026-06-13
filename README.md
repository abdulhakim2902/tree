# 🌳 Pohon Keluarga Lebaran

Aplikasi pohon keluarga interaktif untuk mengenal anggota keluarga besar saat lebaran, dibangun dengan **Next.js 14** dan **Supabase**.

---

## ✨ Fitur

- 🌳 **Visualisasi Pohon Interaktif** — zoom, pan, drag dengan React Flow
- 👨‍👩‍👧‍👦 **Manajemen Anggota** — tambah, edit, lihat detail lengkap
- 🔗 **Relasi Keluarga** — ayah, ibu, anak, suami, istri, paman, bibi, dst.
- 🔍 **Pencarian** — cari anggota berdasarkan nama, panggilan, atau pekerjaan
- 📱 **Responsif** — bisa dipakai di HP saat kumpul lebaran
- 🎨 **Tema Batik** — desain hangat bertema lebaran Indonesia
- ⚡ **Real-time** — data tersinkron via Supabase

---

## 🚀 Setup

### 1. Clone & Install

```bash
git clone <repo>
cd family-tree-lebaran
npm install
```

### 2. Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Pergi ke **SQL Editor** dan jalankan file `supabase-schema.sql`
4. Dari **Project Settings > API**, copy URL dan anon key

### 3. Konfigurasi Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📖 Cara Penggunaan

1. **Tambah Anggota** — Klik tombol "Tambah Anggota" di sidebar, isi form
2. **Tambah Relasi** — Klik "Tambah Relasi", pilih dua anggota dan jenis hubungan
3. **Lihat Detail** — Klik node di pohon atau nama di sidebar untuk melihat info lengkap
4. **Navigasi Pohon** — Gunakan scroll/pinch untuk zoom, drag untuk pan

---

## 🏗️ Struktur Project

```
family-tree-lebaran/
├── app/
│   ├── globals.css       # Tema batik & React Flow overrides
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Halaman utama pohon keluarga
├── components/
│   ├── MemberNode.tsx    # Node kartu anggota di React Flow
│   ├── MemberDetail.tsx  # Panel detail anggota (kanan)
│   ├── MemberForm.tsx    # Modal tambah/edit anggota
│   └── AddRelation.tsx   # Modal tambah relasi
├── lib/
│   ├── supabase.ts       # Supabase client
│   └── family.ts         # Fungsi CRUD keluarga
├── types/
│   └── index.ts          # TypeScript types
└── supabase-schema.sql   # Database schema + seed data
```

---

## 🗄️ Database Schema

### `family_members`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| full_name | TEXT | Nama lengkap |
| nickname | TEXT | Nama panggilan |
| gender | TEXT | laki-laki / perempuan |
| generation | INT | Nomor generasi |
| birth_date | DATE | Tanggal lahir |
| birth_place | TEXT | Tempat lahir |
| phone | TEXT | Nomor telepon |
| job | TEXT | Pekerjaan |
| address | TEXT | Alamat |
| notes | TEXT | Catatan |
| photo_url | TEXT | URL foto profil |

### `family_relations`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| member_id | UUID | FK ke family_members |
| related_member_id | UUID | FK ke family_members |
| relation_type | TEXT | Jenis relasi |

---

## 🔒 Keamanan (Produksi)

Schema ini menggunakan RLS policy terbuka untuk kemudahan demo. Untuk produksi:
1. Aktifkan Supabase Auth
2. Ganti policy dengan user-based access
3. Tambahkan kolom `created_by` untuk multi-keluarga

---

*Selamat Lebaran! Mohon Maaf Lahir dan Batin 🌙*
