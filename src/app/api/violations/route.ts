import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/violations?status=&studentId=&classId=
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");

    let where: any = {};

    if (user.role === "SISWA" && user.student) {
      where.studentId = user.student.id;
    } else if (user.role === "WALI_KELAS") {
      const classes = await db.class.findMany({ where: { waliKelasId: user.id } });
      const classIds = classes.map((c) => c.id);
      const students = await db.student.findMany({
        where: { classId: { in: classIds } },
      });
      where.studentId = { in: students.map((s) => s.id) };
      if (classId) {
        const classStudents = await db.student.findMany({ where: { classId } });
        where.studentId = { in: classStudents.map((s) => s.id) };
      }
    } else if (user.role === "GURU_BK") {
      // guru BK lihat semua
    } else if (user.role === "PIKET") {
      // piket lihat semua
    }

    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    const violations = await db.violation.findMany({
      where,
      include: {
        student: { include: { user: true, class: true } },
        violationType: true,
        reportedBy: { select: { id: true, name: true, role: true } },
        handledBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ violations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — buat pelanggaran baru (piket, wali kelas, guru BK, admin)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["PIKET", "WALI_KELAS", "GURU_BK", "ADMIN"];
    if (!allowed.includes(user.role)) {
      return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, violationTypeId, description, location, date, points: customPoints } = body;

    const vt = await db.violationType.findUnique({ where: { id: violationTypeId } });
    if (!vt) return NextResponse.json({ error: "Jenis pelanggaran tidak ditemukan" }, { status: 404 });

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { user: true, class: true },
    });
    if (!student) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });

    const d = new Date(date || Date.now());
    d.setHours(0, 0, 0, 0);

    const violation = await db.violation.create({
      data: {
        studentId,
        violationTypeId,
        level: vt.level,
        points: customPoints ?? vt.defaultPoints,
        description: description || vt.name,
        location,
        date: d,
        status: "DILAPORKAN",
        reportedById: user.id,
      },
      include: {
        student: { include: { user: true, class: true } },
        violationType: true,
      },
    });

    // === NOTIFIKASI TERINTEGRASI KE SEMUA PIHAK ===
    const notifBody = `${student.user.name} (${student.class.name}): ${vt.name} — level ${vt.level} (-${violation.points} poin)`;

    // 1. Siswa yang bersangkutan
    await db.notification.create({
      data: {
        userId: student.userId,
        title: "Anda Tercatat Pelanggaran",
        body: notifBody,
        type: "VIOLATION",
        refId: violation.id,
      },
    });

    // 2. Wali kelas
    if (student.class.waliKelasId) {
      await db.notification.create({
        data: {
          userId: student.class.waliKelasId,
          title: "Pelanggaran Baru di Kelas Anda",
          body: notifBody,
          type: "VIOLATION",
          refId: violation.id,
        },
      });
    }

    // 3. Guru BK (semua)
    const guruBKs = await db.user.findMany({ where: { role: "GURU_BK", isActive: true } });
    for (const gbk of guruBKs) {
      await db.notification.create({
        data: {
          userId: gbk.id,
          title: "Pelanggaran Perlu Tindak Lanjut",
          body: notifBody,
          type: "VIOLATION",
          refId: violation.id,
        },
      });
    }

    // 4. Admin (semua)
    const admins = await db.user.findMany({ where: { role: "ADMIN", isActive: true } });
    for (const a of admins) {
      await db.notification.create({
        data: {
          userId: a.id,
          title: "Pelanggaran Baru Tercatat",
          body: notifBody,
          type: "VIOLATION",
          refId: violation.id,
        },
      });
    }

    // 5. Guru Piket (semua) — info saja
    const pikets = await db.user.findMany({ where: { role: "PIKET", isActive: true } });
    for (const p of pikets) {
      await db.notification.create({
        data: {
          userId: p.id,
          title: "Info: Pelanggaran Baru",
          body: notifBody,
          type: "VIOLATION",
          refId: violation.id,
        },
      });
    }

    return NextResponse.json({ violation });
  } catch (e: any) {
    console.error("Create violation error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
