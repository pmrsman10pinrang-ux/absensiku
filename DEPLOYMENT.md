# 🌐 Panduan Deploy SIAS-SIS ke Vercel + Supabase + GitHub (Full Online)

Panduan langkah demi langkah untuk meng-online-kan aplikasi SIAS-SIS secara permanent.
Setelah selesai, aplikasi bisa diakses dari mana saja via URL Vercel (https://namaprojek.vercel.app).

---

## 📋 Prasyarat

- Akun **GitHub** (gratis) → https://github.com/signup
- Akun **Vercel** (gratis, login pakai GitHub) → https://vercel.com
- Akun **Supabase** (gratis, login pakai GitHub) → https://supabase.com
- Semua kode proyek SIAS-SIS di komputer Anda

---

## 🚀 Langkah 1: Push Kode ke GitHub

### 1.1 Buat repository baru di GitHub
1. Login ke https://github.com
2. Klik tombol **"+"** di pojok kanan atas → **"New repository"**
3. Isi:
   - **Repository name**: `sias-sis` (atau nama lain)
   - **Description**: `Sistem Informasi Absensi Siswa - Scan Wajah & Lokasi`
   - **Visibility**: Private (disarankan) atau Public
   - **Jangan centang** "Add a README file" (sudah ada)
4. Klik **"Create repository"**
5. Copy URL repo (format: `https://github.com/USERNAME/sias-sis.git`)

### 1.2 Push kode dari komputer
Buka terminal di folder proyek:

```bash
# Inisialisasi git (jika belum)
git init

# Tambahkan semua file
git add .

# Commit pertama
git commit -m "Initial commit: SIAS-SIS - Sistem Absensi Siswa"

# Set branch utama
git branch -M main

# Hubungkan ke GitHub (ganti URL dengan repo Anda)
git remote add origin https://github.com/USERNAME/sias-sis.git

# Push ke GitHub
git push -u origin main
```

Jika diminta login, gunakan Personal Access Token (PAT):
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic) → centang `repo` scope → Generate
3. Copy token, gunakan sebagai password saat git push

---

## 🗄️ Langkah 2: Setup Database Supabase

### 2.1 Buat project Supabase
1. Login ke https://supabase.com
2. Klik **"New project"**
3. Isi:
   - **Name**: `sias-sis-db` (atau nama lain)
   - **Database Password**: Buat password kuat, **catat dan simpan** di tempat aman
   - **Region**: Pilih yang terdekat (Southeast Asia Singapore untuk Indonesia)
   - **Plan**: Free (cukup untuk sekolah)
4. Klik **"Create new project"** → tunggu 2-3 menit

### 2.2 Buat schema database
1. Di dashboard Supabase, klik **"SQL Editor"** di sidebar kiri
2. Klik **"New query"**
3. Buka file `supabase-schema.sql` dari proyek Anda, copy semua isinya
4. Paste di SQL Editor Supabase
5. Klik **"Run"** (tombol hijau) → tunggu sampai "Success. No rows returned"
6. Schema database (11 tabel) berhasil dibuat

### 2.3 Ambil connection string
1. Klik **"Project Settings"** (icon gear) di sidebar kiri bawah
2. Klik **"Database"**
3. Di bagian **"Connection string"**, pilih tab **"Transaction pooler"** (atau "Session pooler")
4. Copy URL connection string (format: `postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres`)
5. Ganti `[YOUR-PASSWORD]` dengan password database yang Anda buat di langkah 2.1

### 2.4 Ambil API keys
1. Di Project Settings, klik **"API"**
2. Copy 3 nilai berikut:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJxxxxx...` (panjang)
   - **service_role key**: `eyJxxxxx...` (panjang, JANGAN share ke publik)

---

## ☁️ Langkah 3: Deploy ke Vercel

### 3.1 Import project ke Vercel
1. Login ke https://vercel.com (pakai akun GitHub)
2. Klik **"Add New..."** → **"Project"**
3. Di bagian "Import Git Repository", cari repo `sias-sis` Anda
4. Klik **"Import"**

### 3.2 Konfigurasi project
Di halaman konfigurasi:
- **Framework Preset**: Next.js (otomatis terdeteksi)
- **Root Directory**: `./` (default)
- **Build Command**: `bun run build` atau biarkan default
- **Install Command**: `bun install` atau biarkan default

### 3.3 Tambah Environment Variables
Scroll ke bawah ke bagian **"Environment Variables"**. Tambahkan **satu per satu**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres` (ganti dengan connection string dari Supabase langkah 2.3) |
| `JWT_SECRET` | Generate string random 32+ karakter (lihat cara di bawah) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` (dari langkah 2.4) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxxxx...` (dari langkah 2.4) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxxxx...` (dari langkah 2.4) |
| `NODE_ENV` | `production` |

**Cara generate JWT_SECRET** (di terminal):
```bash
openssl rand -base64 32
```
Atau gunakan online generator: https://generate-secret.vercel.app/32

### 3.4 Deploy
1. Klik tombol **"Deploy"**
2. Tunggu 2-5 menit sampai build selesai (status: "Ready")
3. Vercel akan kasih URL: `https://sias-sis-xxxxx.vercel.app`
4. Klik URL → aplikasi akan terbuka di browser

---

## ⚙️ Langkah 4: Setup Awal di Produksi

Saat pertama kali buka URL Vercel, **Setup Wizard** akan muncul otomatis (karena database Supabase masih kosong):

### 4.1 Isi form Setup Wizard

**Bagian Akun Admin:**
- Nama Lengkap: `Nama Kepala Sekolah / Operator`
- Email: `admin@namasekolah.sch.id` (gunakan email sekolah asli)
- Password: Buat password kuat (min 6 karakter, disarankan 12+ karakter dengan kombinasi huruf, angka, simbol)
- No. HP: `0812xxxxxxx`

**Bagian Konfigurasi Sekolah:**
- Nama Sekolah: `SMA Negeri 1 Nusantara` (nama sekolah asli)
- Alamat: `Jl. Pendidikan No. 1, Jakarta`
- Koordinat: Lakukan di komputer/laptop di lokasi sekolah, klik **"Deteksi Lokasi Saya"**
  - Browser akan minta izin lokasi → klik **Allow**
  - Koordinat latitude & longitude akan terisi otomatis
  - Atau isi manual dengan koordinat dari Google Maps (klik kanan di Maps → copy koordinat)
- Radius Absensi: `200` meter (sesuaikan, sekolah besar bisa 300-500m)
- Jam Mulai: `06:30`
- Jam Akhir: `07:30`
- Batas Terlambat: `07:15`
- Tahun Ajaran: `2025/2026`
- Semester: `Ganjil` / `Genap`

### 4.2 Klik "Buat Akun Admin & Selesaikan Setup"
- Sistem akan: buat admin + simpan konfigurasi sekolah + seed 10 jenis pelanggaran default + auto-login
- Anda akan langsung masuk ke dashboard admin

### 4.3 Tambah User Lain
Di dashboard admin, klik menu **"Kelola User"** → tombol **"Tambah User"**:

**Tambah Wali Kelas:**
- Nama: `Siti Aminah, S.Pd`
- Email: `siti.aminah@namasekolah.sch.id`
- Password: (buat password sementara, user bisa ubah nanti)
- Role: `Wali Kelas`
- NIP: `198501012010012001`

**Tambah Guru BK:**
- Nama: `Drs. Bambang Sutrisno`
- Email: `bambang.bk@namasekolah.sch.id`
- Password: ...
- Role: `Guru BK`
- NIP: `197501012003121002`

**Tambah Guru Piket:**
- Nama: `Rina Wijaya, S.Pd`
- Email: `rina.piket@namasekolah.sch.id`
- Password: ...
- Role: `Guru Piket`
- NIP: `198801012015022003`

**Tambah Siswa:**
- Pertama buat kelas via menu **"Kelola Kelas"** (contoh: "X IPA 1", tingkat "X", jurusan "IPA", wali kelas: pilih wali kelas)
- Lalu tambah siswa via **"Kelola User"**:
  - Nama: `Budi Santoso`
  - Email: `budi.santoso@siswa.namasekolah.sch.id`
  - Password: ...
  - Role: `Siswa`
  - NIS: `2025001`
  - Kelas: pilih kelas yang sudah dibuat

### 4.4 Bagikan URL & Kredensial ke User
- Bagikan URL Vercel (`https://sias-sis-xxxxx.vercel.app`) ke semua user
- Beri tahu masing-masing email & password yang sudah dibuat
- User bisa login dari HP/laptop dimana saja yang punya internet

---

## 📱 Cara Pakai Aplikasi (untuk Siswa)

1. Buka URL Vercel di HP/laptop browser (Chrome/Safari recommended)
2. Login dengan email & password yang diberikan admin
3. Klik menu **"Absensi (Scan Wajah)"**
4. Tab Absensi:
   - Klik **"Aktifkan Kamera"** → browser minta izin kamera → Allow
   - Arahkan wajah ke kamera → klik **"Scan Wajah"**
   - Sistem verifikasi wajah (lihat progress bar)
   - Lokasi GPS otomatis terdeteksi
   - Jika valid → klik **"Konfirmasi Absensi"**
5. Selesai! Absensi tercatat dengan timestamp

**Syarat teknis di sisi siswa:**
- HP/laptop dengan kamera
- GPS aktif
- Browser modern (Chrome 80+, Safari 14+, Firefox 80+)
- Izinkan akses kamera & lokasi saat diminta
- Lakukan absensi di lokasi sekolah (dalam radius yang ditentukan admin)

---

## 🔒 Keamanan & Maintenance

### Backup Database
- Supabase free plan: backup harian otomatis (7 hari retention)
- Untuk backup manual: Dashboard Supabase → Database → Backups → Create backup

### Monitoring
- Vercel Dashboard → Analytics (lihat traffic & errors)
- Supabase Dashboard → Logs (lihat query database)

### Update Kode
Setiap kali Anda update kode di GitHub:
1. `git add . && git commit -m "deskripsi perubahan" && git push`
2. Vercel akan **auto-redeploy** (2-3 menit)
3. Aplikasi online ter-update otomatis

### Reset Password User
Jika user lupa password:
1. Login sebagai admin
2. Menu **Kelola User** → klik user → ubah password
3. Beri tahu user password barunya

### Tambah Kapasitas (jika sekolah besar)
- Supabase free: 500MB database, 50k monthly active users
- Vercel free: 100GB bandwidth/bulan
- Untuk sekolah >1000 siswa, upgrade Supabase ke Pro ($25/bulan) & Vercel Pro ($20/bulan)

---

## ❓ Troubleshooting

### Error: "Connection refused" / database error
- Cek `DATABASE_URL` di Vercel — pastikan password benar, format URL benar
- Cek Supabase project tidak paused (free plan pause setelah 1 minggu tidak aktif)

### Kamera tidak muncul
- Pastikan buka via **HTTPS** (Vercel sudah HTTPS otomatis)
- Cek permission browser: Settings → Site Settings → Camera → Allow
- Jika di HP, pastikan tidak ada app lain yang pakai kamera

### Lokasi tidak terdeteksi
- Pastikan GPS HP aktif
- Browser permission: Settings → Site Settings → Location → Allow
- Jika di dalam ruangan, coba dekat jendela untuk sinyal GPS lebih baik

### Absensi ditolak "di luar radius"
- Cek koordinat sekolah di menu Admin → Setting Sekolah
- Pastikan radius cukup (200-300m untuk sekolah besar)
- Siswa harus absen dari dalam area sekolah

### Setup Wizard tidak muncul
- Berarti database sudah punya user (setup sudah dilakukan)
- Untuk reset: hapus semua user di Supabase SQL Editor:
  ```sql
  DELETE FROM "User";
  DELETE FROM "School";
  ```
- Refresh halaman → Setup Wizard akan muncul lagi

---

## 📞 Dukungan

Jika ada masalah, cek:
1. **Vercel logs**: Dashboard → project → Logs (lihat error server)
2. **Browser console**: F12 → Console tab (lihat error client)
3. **Supabase logs**: Dashboard → Logs → Database

Selamat! Aplikasi SIAS-SIS Anda sekarang **sudah online 24/7** dan bisa diakses dari mana saja. 🎉
