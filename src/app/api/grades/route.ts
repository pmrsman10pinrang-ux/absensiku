import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const subjectId = searchParams.get("subjectId");

  let where: any = {};
  if (studentId) where.studentId = studentId;
  if (subjectId) where.subjectId = subjectId;

  // Siswa hanya bisa lihat nilai sendiri
  if (user.role === "SISWA" && user.student) {
    where.studentId = user.student.id;
  } else if (user.role === "WALI_KELAS") {
    const classes = await db.class.findMany({ where: { waliKelasId: user.id } });
    const classIds = classes.map((c) => c.id);
    const students = await db.student.findMany({ where: { classId: { in: classIds } } });
    where.studentId = { in: students.map((s) => s.id) };
  }

  const grades = await db.grade.findMany({
    where,
    include: {
      student: { include: { user: true, class: true } },
      subject: true,
      teacher: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ grades });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["WALI_KELAS", "ADMIN", "PIKET"];
  if (!allowed.includes(user.role)) {
    return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
  }

  const body = await req.json();
  const { studentId, subjectId, score, type, date, note } = body;

  const grade = await db.grade.create({
    data: {
      studentId,
      subjectId,
      teacherId: user.id,
      score: parseFloat(score),
      type,
      date: new Date(date || Date.now()),
      note,
    },
  });

  // Notifikasi siswa
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (student) {
    await db.notification.create({
      data: {
        userId: student.userId,
        title: "Nilai Baru Diterima",
        body: `Nilai ${type} ${score} telah diinput`,
        type: "GRADE",
        refId: grade.id,
      },
    });
  }

  return NextResponse.json({ grade });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "WALI_KELAS"].includes(user.role)) {
    return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.grade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
