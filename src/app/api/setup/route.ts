import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sias-sis-dev-secret-change-in-production"
);

// GET /api/setup — cek apakah setup sudah dilakukan (sudah ada user)
export async function GET() {
  try {
    const userCount = await db.user.count();
    const schoolCount = await db.school.count();
    return NextResponse.json({
      needsSetup: userCount === 0,
      hasUsers: userCount > 0,
      hasSchool: schoolCount > 0,
      userCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/setup — buat admin pertama + konfigurasi sekolah
export async function POST(req: NextRequest) {
  try {
    // Cek apakah sudah ada user — jika ya, tolak
    const existingCount = await db.user.count();
    if (existingCount > 0) {
      return NextResponse.json(
        { error: "Setup sudah dilakukan. Silakan login sebagai admin." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      // Admin
      adminName,
      adminEmail,
      adminPassword,
      adminPhone,
      // School
      schoolName,
      schoolAddress,
      schoolLatitude,
      schoolLongitude,
      schoolRadiusMeters,
      academicYear,
      semester,
      checkInStart,
      checkInEnd,
      lateThreshold,
    } = body;

    // Validasi field wajib
    if (!adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Nama, email, dan password admin wajib diisi" },
        { status: 400 }
      );
    }
    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }
    if (!schoolName || !schoolAddress) {
      return NextResponse.json(
        { error: "Nama dan alamat sekolah wajib diisi" },
        { status: 400 }
      );
    }

    // Cek email unik
    const existingEmail = await db.user.findUnique({
      where: { email: adminEmail.toLowerCase().trim() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Buat admin
    const admin = await db.user.create({
      data: {
        email: adminEmail.toLowerCase().trim(),
        passwordHash: bcrypt.hashSync(adminPassword, 10),
        name: adminName,
        role: "ADMIN",
        phone: adminPhone || null,
      },
    });

    // Buat school config
    const school = await db.school.create({
      data: {
        name: schoolName,
        address: schoolAddress,
        latitude: parseFloat(schoolLatitude) || -6.2088,
        longitude: parseFloat(schoolLongitude) || 106.8456,
        radiusMeters: parseInt(schoolRadiusMeters) || 200,
        checkInStart: checkInStart || "06:30",
        checkInEnd: checkInEnd || "07:30",
        lateThreshold: lateThreshold || "07:15",
        academicYear: academicYear || new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
        semester: semester || "GANJIL",
      },
    });

    // Seed katalog pelanggaran default jika belum ada
    const vtCount = await db.violationType.count();
    if (vtCount === 0) {
      const defaultTypes = [
        { name: "Terlambat masuk sekolah", category: "DISIPLIN", level: "RINGAN", defaultPoints: 5, description: "Terlambat dari jam yang ditetapkan" },
        { name: "Tidak memakai atribut lengkap", category: "KERAPIAN", level: "RINGAN", defaultPoints: 5, description: "Atribut seragam tidak lengkap" },
        { name: "Rambut tidak rapi / tidak sesuai aturan", category: "KERAPIAN", level: "RINGAN", defaultPoints: 5, description: "Rambut tidak sesuai aturan" },
        { name: "Membawa HP saat pelajaran (tanpa izin)", category: "DISIPLIN", level: "SEDANG", defaultPoints: 15, description: "HP aktif saat KBM tanpa izin guru" },
        { name: "Tidak mengerjakan tugas berulang", category: "AKHLAK", level: "SEDANG", defaultPoints: 10, description: "Tugas tidak dikerjakan berulang" },
        { name: "Berkata kasar / tidak sopan", category: "AKHLAK", level: "SEDANG", defaultPoints: 20, description: "Bahasa tidak sopan kepada guru/teman" },
        { name: "Membolos / Alpa tanpa keterangan", category: "DISIPLIN", level: "SEDANG", defaultPoints: 25, description: "Tidak hadir tanpa keterangan" },
        { name: "Merokok di lingkungan sekolah", category: "AKHLAK", level: "BERAT", defaultPoints: 50, description: "Merokok di area sekolah" },
        { name: "Tawuran / kekerasan antar siswa", category: "AKHLAK", level: "BERAT", defaultPoints: 75, description: "Tawuran atau kekerasan" },
        { name: "Mencuri / mengambil barang tanpa izin", category: "AKHLAK", level: "BERAT", defaultPoints: 75, description: "Mengambil barang tanpa izin" },
      ];
      for (const vt of defaultTypes) {
        await db.violationType.create({ data: vt });
      }
    }

    // Auto-login admin
    const token = await new SignJWT({
      uid: admin.id,
      role: admin.role,
      email: admin.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET);

    const c = await cookies();
    c.set("sias_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      ok: true,
      message: "Setup berhasil. Akun admin & konfigurasi sekolah telah dibuat.",
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      school: { id: school.id, name: school.name },
    });
  } catch (e: any) {
    console.error("Setup error:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
