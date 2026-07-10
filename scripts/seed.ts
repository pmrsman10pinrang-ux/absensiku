/**
 * Seed script — SIAS-SIS (versi tanpa akun demo)
 *
 * Skrip ini HANYA digunakan untuk testing/development lokal.
 * Pada produksi, JANGAN jalankan ini — gunakan halaman Setup Wizard
 * yang otomatis muncul saat pertama kali aplikasi dibuka.
 *
 * Untuk reset database development:
 *   bun run db:push --force-reset
 *   bun run scripts/seed.ts
 *
 * Skrip ini hanya membuat:
 *   - 1 kelas contoh (X IPA 1) tanpa siswa
 *   - 3 mata pelajaran contoh tanpa guru
 *   - 10 jenis pelanggaran katalog
 *
 * TIDAK membuat akun user apapun.
 */
async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();

  console.log("🧹 Cleaning database (DEV ONLY)...");
  const tablenames = await db.$queryRaw<
    Array<{ name: string; sql: string }>
  >`SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'`;

  for (const { name } of tablenames) {
    await db.$executeRawUnsafe(`DELETE FROM "${name}";`);
  }
  try {
    await db.$executeRawUnsafe(`DELETE FROM sqlite_sequence;`);
  } catch {}

  console.log("📚 Creating katalog pelanggaran default...");
  const violationTypesData = [
    { name: "Terlambat masuk sekolah", category: "DISIPLIN", level: "RINGAN" as const, defaultPoints: 5, description: "Terlambat dari jam yang ditetapkan" },
    { name: "Tidak memakai atribut lengkap", category: "KERAPIAN", level: "RINGAN" as const, defaultPoints: 5, description: "Atribut seragam tidak lengkap" },
    { name: "Rambut tidak rapi / tidak sesuai aturan", category: "KERAPIAN", level: "RINGAN" as const, defaultPoints: 5, description: "Rambut tidak sesuai aturan" },
    { name: "Membawa HP saat pelajaran (tanpa izin)", category: "DISIPLIN", level: "SEDANG" as const, defaultPoints: 15, description: "HP aktif saat KBM tanpa izin guru" },
    { name: "Tidak mengerjakan tugas berulang", category: "AKHLAK", level: "SEDANG" as const, defaultPoints: 10, description: "Tugas tidak dikerjakan berulang" },
    { name: "Berkata kasar / tidak sopan", category: "AKHLAK", level: "SEDANG" as const, defaultPoints: 20, description: "Bahasa tidak sopan kepada guru/teman" },
    { name: "Membolos / Alpa tanpa keterangan", category: "DISIPLIN", level: "SEDANG" as const, defaultPoints: 25, description: "Tidak hadir tanpa keterangan" },
    { name: "Merokok di lingkungan sekolah", category: "AKHLAK", level: "BERAT" as const, defaultPoints: 50, description: "Merokok di area sekolah" },
    { name: "Tawuran / kekerasan antar siswa", category: "AKHLAK", level: "BERAT" as const, defaultPoints: 75, description: "Tawuran atau kekerasan" },
    { name: "Mencuri / mengambil barang tanpa izin", category: "AKHLAK", level: "BERAT" as const, defaultPoints: 75, description: "Mengambil barang tanpa izin" },
  ];

  for (const vt of violationTypesData) {
    await db.violationType.create({ data: vt });
  }

  console.log("✅ Seed complete (DEV ONLY — no users created).");
  console.log("");
  console.log("📌 PENTING:");
  console.log("   1. Buka aplikasi di browser");
  console.log("   2. Akan otomatis muncul halaman Setup Wizard");
  console.log("   3. Buat akun admin pertama + konfigurasi sekolah");
  console.log("   4. Setelah login sebagai admin, tambah user lain via menu Kelola User");
  console.log("");

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
