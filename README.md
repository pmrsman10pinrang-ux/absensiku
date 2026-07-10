# SIAS-SIS — Sistem Informasi Absensi Siswa

Aplikasi absensi siswa berbasis **scan wajah** + **lokasi GPS** dengan manajemen penilaian dan pelanggaran terintegrasi ke semua pihak (admin, wali kelas, siswa, guru BK, piket).

## ✨ Fitur Utama

### 🔐 5 Role Pengguna
| Role | Hak Akses |
|------|-----------|
| **Admin** | Kelola user, kelas, mata pelajaran, katalog pelanggaran, setting sekolah & radius absensi |
| **Wali Kelas** | Pantau absensi kelas, input nilai, rekap nilai, lihat pelanggaran kelas |
| **Siswa** | Absensi via scan wajah + verifikasi lokasi, lihat riwayat absen, nilai, pelanggaran |
| **Guru BK** | Antrian pelanggaran, konseling & intervensi, profil siswa lengkap |
| **Guru Piket** | Pantau absensi harian semua kelas, input manual, laporan pelanggaran |

### 📸 Absensi Canggih
- **Scan Wajah** via webcam (siap integrasi `face-api.js` untuk produksi)
- **Verifikasi Lokasi** GPS dengan haversine distance + radius sekolah
- **Auto-detect terlambat** berdasarkan jam lateThreshold sekolah
- **Auto-create pelanggaran** jika siswa terlambat (notifikasi ke wali kelas + guru BK)

### ⚠️ Sistem Pelanggaran Terintegrasi
Saat pelanggaran dicatat (oleh piket/wali kelas/guru BK), notifikasi otomatis dikirim ke:
1. ✅ Siswa yang bersangkutan
2. 👨‍🏫 Wali kelas siswa
3. 🧑‍🏫 Semua Guru BK
4. 👑 Semua Admin
5. ⏰ Semua Guru Piket (info)

### 📊 Dashboard Lengkap
- Statistik real-time per role
- Rekap absensi harian per kelas
- Top siswa dengan poin pelanggaran tertinggi (untuk BK)
- Rekap nilai siswa per mata pelajaran
- Notifikasi in-app dengan badge unread counter

## 🚀 Quick Start (Development)

```bash
# 1. Install dependencies
bun install

# 2. Copy environment
cp .env.example .env.local

# 3. Setup database (hanya skema + katalog pelanggaran, TANPA akun demo)
bun run db:push
bun run scripts/seed.ts

# 4. Run dev server
bun run dev
```

Buka http://localhost:3000. Karena database masih kosong (belum ada user),
sistem akan otomatis menampilkan **Setup Wizard** untuk membuat akun admin
pertama dan konfigurasi sekolah.

### 🎯 Alur Setup Pertama Kali

1. **Setup Wizard** muncul otomatis saat database belum punya user
2. Isi form:
   - **Akun Admin**: nama, email, password (min 6 karakter), no. HP
   - **Sekolah**: nama, alamat, koordinat GPS (klik "Deteksi Lokasi Saya" saat di lokasi sekolah), radius absensi, jam masuk
3. Klik **"Buat Akun Admin & Selesaikan Setup"** — sistem akan:
   - Membuat akun admin pertama
   - Menyimpan konfigurasi sekolah
   - Seed 10 jenis pelanggaran default (katalog)
   - Auto-login sebagai admin
4. Setelah login, admin bisa menambah user lain via menu **Kelola User**:
   - Wali Kelas (dengan NIP)
   - Guru BK (dengan NIP)
   - Guru Piket (dengan NIP)
   - Siswa (dengan NIS + kelas)
5. Tambah kelas via **Kelola Kelas**, mata pelajaran via **Kelola Mapel**
6. Sesuaikan katalog pelanggaran via **Katalog Pelanggaran**

### ⚠️ Catatan Keamanan
- TIDAK ada akun demo di sistem ini. Semua akun harus dibuat oleh admin.
- Setup Wizard hanya muncul sekali (saat database belum punya user).
- Password disimpan sebagai bcrypt hash (aman).
- JWT disimpan di HTTP-only cookie (7 hari expiry).

## 🏗️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Next.js API Routes (App Router) |
| Database | Prisma ORM (SQLite untuk dev, **Supabase PostgreSQL** untuk produksi) |
| Auth | JWT (jose) dengan HTTP-only cookies |
| State | Zustand (client), TanStack Query-ready |
| Webcam | Browser MediaDevices API |
| Geolocation | Browser Geolocation API + haversine distance |
| Notifications | In-app notification system terintegrasi |

## 🌐 Deploy ke Vercel + Supabase + GitHub

### Langkah 1: Push ke GitHub
```bash
git init
git add .
git commit -m "Initial commit: SIAS-SIS"
git branch -M main
git remote add origin https://github.com/USERNAME/sias-sis.git
git push -u origin main
```

### Langkah 2: Setup Supabase
1. Daftar di https://supabase.com dan buat project baru
2. Buka **SQL Editor** → paste isi `supabase-schema.sql` → Run
3. Buka **Project Settings → Database** → copy **Connection string** (format `postgresql://...`)
4. Buka **Project Settings → API** → copy `URL` & `anon key` & `service_role key`

### Langkah 3: Deploy ke Vercel
1. Buka https://vercel.com → **New Project** → import repo GitHub
2. Framework preset: **Next.js**
3. Tambahkan environment variables:
   ```
   DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
   JWT_SECRET=<random-string-32-char>
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
   NODE_ENV=production
   ```
4. **Deploy** → tunggu sampai selesai
5. Buka URL Vercel → akan muncul **Setup Wizard** (karena database masih kosong)

### Langkah 4: Setup Awal di Produksi
Setelah deploy, buka URL Vercel. Karena database masih kosong, sistem akan otomatis menampilkan **Setup Wizard**:

1. Isi form akun admin pertama (nama, email, password)
2. Isi konfigurasi sekolah (nama, alamat, koordinat GPS, radius absensi)
3. Klik **"Buat Akun Admin & Selesaikan Setup"**
4. Setelah auto-login, tambah user lain (wali kelas, guru BK, piket, siswa) via menu **Kelola User**

Tidak perlu menjalankan seed di produksi — Setup Wizard menangani semuanya.

## 🔒 Keamanan Produksi

Sebelum go-live, pastikan:

1. **Ganti JWT_SECRET** dengan string acak 32+ karakter (`openssl rand -base64 32`)
2. **Enable RLS** di Supabase (Row Level Security) — sudah disiapkan di `supabase-schema.sql`, tinggal tambah policy
3. **HTTPS only** — Vercel sudah otomatis HTTPS
4. **Validasi input** — sudah dilakukan di setiap API route
5. **Rate limiting** — tambahkan untuk endpoint auth di production
6. **Backup database** — aktifkan di Supabase Dashboard
7. **Integrasi face-api.js** dengan model asli untuk pengenalan wajah nyata:
   - Download model dari https://github.com/justadudewhohacks/face-api.js#models
   - Taruh di `public/models/`
   - Modifikasi `src/components/sias/face-scan.tsx` untuk load & gunakan model

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/               # Login, logout, me
│   │   ├── attendance/         # CRUD absensi + check-in
│   │   ├── violations/         # CRUD pelanggaran + notifikasi
│   │   ├── violation-types/    # Katalog pelanggaran
│   │   ├── grades/             # CRUD nilai
│   │   ├── users/              # CRUD user (admin)
│   │   ├── classes/            # CRUD kelas
│   │   ├── subjects/           # CRUD mata pelajaran
│   │   ├── students/           # CRUD siswa
│   │   ├── notifications/      # Notifikasi
│   │   ├── school/             # Setting sekolah
│   │   ├── dashboard/          # Stats per role
│   │   └── face/verify/        # Verifikasi wajah
│   ├── page.tsx                # Main page (SPA)
│   └── layout.tsx
├── components/
│   ├── sias/
│   │   ├── login-page.tsx
│   │   ├── app-shell.tsx       # Layout + sidebar
│   │   ├── face-scan.tsx       # Komponen scan wajah
│   │   ├── geo-location.tsx    # Komponen verifikasi lokasi
│   │   ├── ui.tsx              # Shared UI components
│   │   └── dashboards/
│   │       ├── siswa-dashboard.tsx
│   │       ├── wali-kelas-dashboard.tsx
│   │       ├── piket-dashboard.tsx
│   │       ├── guru-bk-dashboard.tsx
│   │       ├── admin-dashboard.tsx
│   │       └── all-violations.tsx
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── db.ts                   # Prisma client
│   └── auth.ts                 # Auth helpers
├── stores/
│   └── app-store.ts            # Zustand store
└── hooks/
    └── use-auth.ts

prisma/
└── schema.prisma               # Database schema

scripts/
└── seed.ts                     # Seed data

supabase-schema.sql             # SQL untuk setup Supabase
.env.example                    # Template env vars
```

## 📝 Lisensi

MIT — bebas digunakan untuk keperluan pendidikan.
