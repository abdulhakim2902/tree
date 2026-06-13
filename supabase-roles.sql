-- =====================================================
-- ROLE PERMISSIONS — Jalankan di Supabase SQL Editor
-- =====================================================

-- Tabel user roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS user_roles_updated_at ON user_roles;
CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Helper function: ambil email dari auth.uid() ──────────────────────────
-- Lebih reliable daripada auth.jwt()->>'email'
CREATE OR REPLACE FUNCTION get_my_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- ── Helper function: ambil role user yang sedang login ────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM user_roles
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
$$;

-- ── Enable RLS ────────────────────────────────────────────────────────────
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Admin read roles" ON user_roles;
DROP POLICY IF EXISTS "Admin insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admin update roles" ON user_roles;
DROP POLICY IF EXISTS "Admin delete roles" ON user_roles;
DROP POLICY IF EXISTS "Self read role" ON user_roles;

-- User bisa baca role diri sendiri
CREATE POLICY "Self read role" ON user_roles
  FOR SELECT USING (email = get_my_email());

-- Anon bisa cek apakah email terdaftar (validasi sebelum kirim magic link)
DROP POLICY IF EXISTS "Anon check email" ON user_roles;
CREATE POLICY "Anon check email" ON user_roles
  FOR SELECT USING (auth.role() = 'anon');

-- Admin bisa baca semua
CREATE POLICY "Admin read roles" ON user_roles
  FOR SELECT USING (get_my_role() = 'admin');

-- Admin bisa insert
CREATE POLICY "Admin insert roles" ON user_roles
  FOR INSERT WITH CHECK (get_my_role() = 'admin');

-- Admin bisa update
CREATE POLICY "Admin update roles" ON user_roles
  FOR UPDATE USING (get_my_role() = 'admin');

-- Admin bisa delete (tidak bisa hapus diri sendiri)
CREATE POLICY "Admin delete roles" ON user_roles
  FOR DELETE USING (
    get_my_role() = 'admin'
    AND email != get_my_email()
  );

-- ── Update RLS family_members ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth read members" ON family_members;
DROP POLICY IF EXISTS "Auth insert members" ON family_members;
DROP POLICY IF EXISTS "Auth update members" ON family_members;
DROP POLICY IF EXISTS "Auth delete members" ON family_members;
DROP POLICY IF EXISTS "Role read members" ON family_members;
DROP POLICY IF EXISTS "Editor insert members" ON family_members;
DROP POLICY IF EXISTS "Editor update members" ON family_members;
DROP POLICY IF EXISTS "Editor delete members" ON family_members;
DROP POLICY IF EXISTS "Public read" ON family_members;
DROP POLICY IF EXISTS "Public insert" ON family_members;
DROP POLICY IF EXISTS "Public update" ON family_members;
DROP POLICY IF EXISTS "Public delete" ON family_members;

-- Semua role terdaftar bisa baca
CREATE POLICY "Role read members" ON family_members
  FOR SELECT USING (get_my_role() IS NOT NULL);

-- Admin & editor bisa insert/update/delete
CREATE POLICY "Editor insert members" ON family_members
  FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'editor'));

CREATE POLICY "Editor update members" ON family_members
  FOR UPDATE USING (get_my_role() IN ('admin', 'editor'));

CREATE POLICY "Editor delete members" ON family_members
  FOR DELETE USING (get_my_role() IN ('admin', 'editor'));

-- ── Update RLS family_relations ───────────────────────────────────────────
DROP POLICY IF EXISTS "Auth read relations" ON family_relations;
DROP POLICY IF EXISTS "Auth insert relations" ON family_relations;
DROP POLICY IF EXISTS "Auth delete relations" ON family_relations;
DROP POLICY IF EXISTS "Role read relations" ON family_relations;
DROP POLICY IF EXISTS "Editor insert relations" ON family_relations;
DROP POLICY IF EXISTS "Editor delete relations" ON family_relations;
DROP POLICY IF EXISTS "Public read relations" ON family_relations;
DROP POLICY IF EXISTS "Public insert relations" ON family_relations;
DROP POLICY IF EXISTS "Public delete relations" ON family_relations;

-- Semua role terdaftar bisa baca
CREATE POLICY "Role read relations" ON family_relations
  FOR SELECT USING (get_my_role() IS NOT NULL);

-- Admin & editor bisa insert/delete
CREATE POLICY "Editor insert relations" ON family_relations
  FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'editor'));

CREATE POLICY "Editor delete relations" ON family_relations
  FOR DELETE USING (get_my_role() IN ('admin', 'editor'));

-- ── Seed: daftarkan admin pertama ─────────────────────────────────────────
-- !! GANTI email di bawah dengan email admin Anda !!
INSERT INTO user_roles (email, role)
VALUES ('abdulhakim2902@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
