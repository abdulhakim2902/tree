-- =====================================================
-- POHON KELUARGA - Supabase Schema
-- Jalankan di Supabase SQL Editor
-- =====================================================

-- Tabel anggota keluarga
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  nickname TEXT,
  birth_date DATE,
  birth_place TEXT,
  phone TEXT,
  photo_url TEXT,
  gender TEXT CHECK (gender IN ('laki-laki', 'perempuan')),
  generation INTEGER DEFAULT 1,
  address TEXT,
  job TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel relasi keluarga
CREATE TABLE family_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  related_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN (
    'ayah', 'ibu', 'anak', 'suami', 'istri',
    'kakek', 'nenek', 'cucu', 'saudara', 'paman', 'bibi', 'sepupu'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, related_member_id, relation_type)
);

-- Enable Row Level Security
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relations ENABLE ROW LEVEL SECURITY;

-- Policy: semua orang bisa baca (untuk demo publik)
CREATE POLICY "Public read" ON family_members FOR SELECT USING (true);
CREATE POLICY "Public read relations" ON family_relations FOR SELECT USING (true);

-- Policy: semua orang bisa insert/update/delete (untuk demo)
-- Ganti dengan auth-based policy untuk produksi
CREATE POLICY "Public insert" ON family_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON family_members FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON family_members FOR DELETE USING (true);

CREATE POLICY "Public insert relations" ON family_relations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete relations" ON family_relations FOR DELETE USING (true);

-- Trigger update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed data contoh keluarga
INSERT INTO family_members (id, full_name, nickname, gender, generation, birth_place, birth_date, job) VALUES
  ('11111111-0000-0000-0000-000000000001', 'H. Ahmad Suharto', 'Mbah Kakung', 'laki-laki', 1, 'Yogyakarta', '1945-03-15', 'Pensiunan'),
  ('11111111-0000-0000-0000-000000000002', 'Hj. Siti Rahayu', 'Mbah Putri', 'perempuan', 1, 'Solo', '1948-07-20', 'Ibu Rumah Tangga'),
  ('11111111-0000-0000-0000-000000000003', 'Budi Santoso', 'Om Budi', 'laki-laki', 2, 'Yogyakarta', '1970-05-10', 'Wiraswasta'),
  ('11111111-0000-0000-0000-000000000004', 'Dewi Kusuma', 'Tante Dewi', 'perempuan', 2, 'Semarang', '1973-11-25', 'Guru'),
  ('11111111-0000-0000-0000-000000000005', 'Sri Wahyuni', 'Tante Sri', 'perempuan', 2, 'Yogyakarta', '1975-02-14', 'Dokter'),
  ('11111111-0000-0000-0000-000000000006', 'Reza Santoso', 'Kak Reza', 'laki-laki', 3, 'Jakarta', '1998-08-17', 'Mahasiswa'),
  ('11111111-0000-0000-0000-000000000007', 'Putri Santoso', 'Putri', 'perempuan', 3, 'Jakarta', '2001-12-03', 'Pelajar');

INSERT INTO family_relations (member_id, related_member_id, relation_type) VALUES
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'istri'),
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'anak'),
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 'anak'),
  ('11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004', 'istri'),
  ('11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000006', 'anak'),
  ('11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000007', 'anak');
