import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, haversineDistance } from "@/lib/auth";

// POST /api/attendance/checkin — siswa melakukan absensi (face + location)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SISWA" || !user.student) {
      return NextResponse.json({ error: "Hanya siswa yang dapat check-in" }, { status: 403 });
    }

    const body = await req.json();
    const { faceDescriptor, faceConfidence, latitude, longitude, faceImage } = body;

    if (faceConfidence < 0.6) {
      return NextResponse.json(
        { error: "Verifikasi wajah gagal. Pastikan wajah terlihat jelas di kamera." },
        { status: 400 }
      );
    }

    // Cek jarak lokasi
    const school = await db.school.findFirst();
    if (!school) {
      return NextResponse.json({ error: "Konfigurasi sekolah belum tersedia" }, { status: 500 });
    }

    if (latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "Lokasi GPS tidak tersedia. Aktifkan izin lokasi." },
        { status: 400 }
      );
    }

    const distance = haversineDistance(
      latitude,
      longitude,
      school.latitude,
      school.longitude
    );

    if (distance > school.radiusMeters) {
      return NextResponse.json(
        {
          error: `Anda berada ${distance}m dari sekolah. Radius absensi: ${school.radiusMeters}m.`,
          distance,
          allowed: false,
        },
        { status: 400 }
      );
    }

    // Cek waktu — tentukan status HADIR / TERLAMBAT
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const existing = await db.attendance.findUnique({
      where: { studentId_date: { studentId: user.student.id, date: today } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Anda sudah melakukan absensi hari ini", attendance: existing },
        { status: 400 }
      );
    }

    // Parse jam lateThreshold (e.g. "07:15")
    const [lh, lm] = school.lateThreshold.split(":").map(Number);
    const lateTime = new Date(today);
    lateTime.setHours(lh, lm, 0, 0);

    const isLate = now > lateTime;

    const attendance = await db.attendance.create({
      data: {
        studentId: user.student.id,
        classId: user.student.classId,
        date: today,
        status: isLate ? "TERLAMBAT" : "HADIR",
        checkInTime: now,
        faceVerified: true,
        faceConfidence,
        locationLat: latitude,
        locationLng: longitude,
        locationValid: true,
        distanceMeters: distance,
        method: "FACE_SCAN",
      },
    });

    // Notifikasi ke wali kelas jika terlambat
    if (isLate) {
      const cls = await db.class.findUnique({
        where: { id: user.student.classId },
      });
      if (cls?.waliKelasId) {
        await db.notification.create({
          data: {
            userId: cls.waliKelasId,
            title: "Siswa Terlambat",
            body: `${user.name} tercatat terlambat pukul ${now.toLocaleTimeString("id-ID")}`,
            type: "ATTENDANCE",
            refId: attendance.id,
          },
        });
      }
    }

    // Buat pelanggaran otomatis jika terlambat
    if (isLate) {
      const vt = await db.violationType.findFirst({
        where: { name: { contains: "Terlambat" } },
      });
      if (vt) {
        await db.violation.create({
          data: {
            studentId: user.student.id,
            violationTypeId: vt.id,
            level: vt.level,
            points: vt.defaultPoints,
            description: `Terlambat masuk sekolah — check-in pukul ${now.toLocaleTimeString("id-ID")}`,
            location: "Gerbang Sekolah",
            date: today,
            status: "DILAPORKAN",
            reportedById: user.id,
          },
        });
        // Notifikasi ke wali kelas & guru BK
        const cls = await db.class.findUnique({
          where: { id: user.student.classId },
        });
        if (cls?.waliKelasId) {
          await db.notification.create({
            data: {
              userId: cls.waliKelasId,
              title: "Pelanggaran Otomatis: Terlambat",
              body: `${user.name} terlambat dan otomatis tercatat pelanggaran (-${vt.defaultPoints} poin)`,
              type: "VIOLATION",
              refId: attendance.id,
            },
          });
        }
        const guruBK = await db.user.findFirst({ where: { role: "GURU_BK" } });
        if (guruBK) {
          await db.notification.create({
            data: {
              userId: guruBK.id,
              title: "Pelanggaran Otomatis: Terlambat",
              body: `${user.name} (${user.student.className}) terlambat`,
              type: "VIOLATION",
              refId: attendance.id,
            },
          });
        }
      }
    }

    return NextResponse.json({
      attendance,
      distance,
      isLate,
      checkInTime: now,
    });
  } catch (e: any) {
    console.error("Check-in error:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// GET /api/attendance?date=YYYY-MM-DD&classId=xxx — list attendance
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = dateStr ? new Date(dateStr) : today;
    date.setHours(0, 0, 0, 0);

    let where: any = { date };

    if (user.role === "SISWA" && user.student) {
      where.studentId = user.student.id;
    } else if (user.role === "WALI_KELAS" && user.teacher) {
      const classes = await db.class.findMany({ where: { waliKelasId: user.id } });
      const classIds = classes.map((c) => c.id);
      where.classId = { in: classIds };
      if (classId) where.classId = classId;
    } else if (user.role === "PIKET") {
      if (classId) where.classId = classId;
    }

    if (studentId) where.studentId = studentId;

    const records = await db.attendance.findMany({
      where,
      include: {
        student: { include: { user: true, class: true } },
        class: true,
      },
      orderBy: { checkInTime: "asc" },
    });

    return NextResponse.json({ records });
  } catch (e: any) {
    console.error("Get attendance error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
