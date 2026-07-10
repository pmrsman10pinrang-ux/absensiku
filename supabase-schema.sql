-- ============================================================
-- SIAS-SIS — Supabase Schema (PostgreSQL)
-- ============================================================
-- Jalankan di Supabase SQL Editor untuk setup database produksi.
-- Setelah ini, generate Prisma client dengan DATABASE_URL Supabase
-- dan jalankan: bun run db:push
-- ============================================================

-- ENUM TYPES
CREATE TYPE role AS ENUM ('ADMIN', 'WALI_KELAS', 'SISWA', 'GURU_BK', 'PIKET');
CREATE TYPE attendance_status AS ENUM ('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA');
CREATE TYPE violation_level AS ENUM ('RINGAN', 'SEDANG', 'BERAT');
CREATE TYPE violation_status AS ENUM ('DILAPORKAN', 'DIPROSES', 'KONSELING', 'SELESAI', 'DITOLAK');

-- USERS
CREATE TABLE "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role role NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SCHOOL
CREATE TABLE "School" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER DEFAULT 150,
  check_in_start TEXT DEFAULT '06:30',
  check_in_end TEXT DEFAULT '07:30',
  late_threshold TEXT DEFAULT '07:15',
  academic_year TEXT NOT NULL,
  semester TEXT DEFAULT 'GANJIL',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CLASS
CREATE TABLE "Class" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  level TEXT NOT NULL,
  major TEXT DEFAULT '-',
  wali_kelas_id TEXT UNIQUE REFERENCES "User"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TEACHER
CREATE TABLE "Teacher" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  nip TEXT UNIQUE NOT NULL,
  gender TEXT DEFAULT 'L',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- STUDENT
CREATE TABLE "Student" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  nis TEXT UNIQUE NOT NULL,
  nisn TEXT,
  gender TEXT DEFAULT 'L',
  birth_place TEXT,
  birth_date TIMESTAMPTZ,
  address TEXT,
  parent_id TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  class_id TEXT NOT NULL REFERENCES "Class"(id),
  photo_url TEXT,
  face_descriptor TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SUBJECT
CREATE TABLE "Subject" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  teacher_id TEXT REFERENCES "Teacher"(id) ON DELETE SET NULL,
  class_id TEXT NOT NULL REFERENCES "Class"(id) ON DELETE CASCADE,
  kkm DOUBLE PRECISION DEFAULT 75,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ATTENDANCE
CREATE TABLE "Attendance" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES "Class"(id),
  date TIMESTAMPTZ NOT NULL,
  status attendance_status NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  face_verified BOOLEAN DEFAULT false,
  face_confidence DOUBLE PRECISION DEFAULT 0,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_valid BOOLEAN DEFAULT false,
  distance_meters DOUBLE PRECISION,
  note TEXT,
  reported_by_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  method TEXT DEFAULT 'FACE_SCAN',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date)
);
CREATE INDEX idx_attendance_student_date ON "Attendance"(student_id, date);
CREATE INDEX idx_attendance_class_date ON "Attendance"(class_id, date);

-- GRADE
CREATE TABLE "Grade" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES "Subject"(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  score DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- VIOLATION TYPE
CREATE TABLE "ViolationType" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  level violation_level DEFAULT 'RINGAN',
  default_points INTEGER NOT NULL DEFAULT 5,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- VIOLATION
CREATE TABLE "Violation" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  violation_type_id TEXT NOT NULL REFERENCES "ViolationType"(id),
  level violation_level NOT NULL,
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  date TIMESTAMPTZ NOT NULL,
  status violation_status DEFAULT 'DILAPORKAN',
  reported_by_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  handled_by_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  handler_note TEXT,
  follow_up TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_violation_student ON "Violation"(student_id, date);
CREATE INDEX idx_violation_status ON "Violation"(status);

-- NOTIFICATION
CREATE TABLE "Notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  ref_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notification_user ON "Notification"(user_id, is_read);

-- SESSION
CREATE TABLE "Session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS) — disesuaikan kebutuhan
-- ============================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Grade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Violation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Contoh policy: user hanya bisa melihat data dirinya
-- (sesuaikan dengan kebutuhan role-based access)
-- CREATE POLICY "Users can view own data" ON "User"
--   FOR SELECT USING (auth.uid()::text = id);

-- ============================================================
-- SEED DATA — Eksekusi setelah tabel dibuat
-- ============================================================
-- Password hash untuk "admin123" (bcrypt) — generate ulang dengan bcrypt saat produksi
-- Atau gunakan API /api/users (POST) untuk membuat user setelah deploy

-- Sample violation types
INSERT INTO "ViolationType" (name, category, level, default_points, description) VALUES
  ('Terlambat masuk sekolah', 'DISIPLIN', 'RINGAN', 5, 'Terlambat dari jam yang ditetapkan'),
  ('Tidak memakai atribut lengkap', 'KERAPIAN', 'RINGAN', 5, 'Atribut tidak lengkap'),
  ('Rambut tidak rapi', 'KERAPIAN', 'RINGAN', 5, 'Rambut tidak sesuai aturan'),
  ('Membawa HP saat pelajaran', 'DISIPLIN', 'SEDANG', 15, 'HP aktif tanpa izin'),
  ('Tidak mengerjakan tugas berulang', 'AKHLAK', 'SEDANG', 10, 'Tugas tidak dikerjakan >3x'),
  ('Berkata kasar', 'AKHLAK', 'SEDANG', 20, 'Bahasa tidak sopan'),
  ('Membolos', 'DISIPLIN', 'SEDANG', 25, 'Alpa tanpa keterangan'),
  ('Merokok', 'AKHLAK', 'BERAT', 50, 'Merokok di lingkungan sekolah'),
  ('Tawuran', 'AKHLAK', 'BERAT', 75, 'Tawuran / kekerasan'),
  ('Mencuri', 'AKHLAK', 'BERAT', 75, 'Mengambil barang tanpa izin');

-- Sample school
INSERT INTO "School" (name, address, latitude, longitude, radius_meters, academic_year, semester) VALUES
  ('SMK Negeri 1 Nusantara', 'Jl. Pendidikan No. 1, Jakarta', -6.2088, 106.8456, 200, '2025/2026', 'GANJIL');
