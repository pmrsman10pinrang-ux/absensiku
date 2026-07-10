import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const where: any = {};
  if (classId) where.classId = classId;

  const subjects = await db.subject.findMany({
    where,
    include: {
      teacher: { include: { user: true } },
      class: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ subjects });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "WALI_KELAS"].includes(user.role)) {
    return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
  }
  const body = await req.json();
  const { name, code, classId, teacherId, kkm } = body;

  const exists = await db.subject.findUnique({ where: { code } });
  if (exists) return NextResponse.json({ error: "Kode mapel sudah ada" }, { status: 400 });

  const created = await db.subject.create({
    data: { name, code, classId, teacherId: teacherId || null, kkm: parseFloat(kkm) || 75 },
  });
  return NextResponse.json({ subject: created });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
