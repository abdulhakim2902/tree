-- =====================================================
-- UPDATE RLS POLICIES — Jalankan di Supabase SQL Editor
-- Membatasi akses hanya untuk user yang sudah login
-- =====================================================

-- Hapus policy lama yang publik
DROP POLICY IF EXISTS "Public read" ON family_members;
DROP POLICY IF EXISTS "Public read relations" ON family_relations;
DROP POLICY IF EXISTS "Public insert" ON family_members;
DROP POLICY IF EXISTS "Public update" ON family_members;
DROP POLICY IF EXISTS "Public delete" ON family_members;
DROP POLICY IF EXISTS "Public insert relations" ON family_relations;
DROP POLICY IF EXISTS "Public delete relations" ON family_relations;

-- Policy baru: hanya user yang sudah login (authenticated)
CREATE POLICY "Auth read members" ON family_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert members" ON family_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth update members" ON family_members
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth delete members" ON family_members
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth read relations" ON family_relations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert relations" ON family_relations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth delete relations" ON family_relations
  FOR DELETE USING (auth.role() = 'authenticated');
