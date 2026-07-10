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

  // Siswa hanya bisa lihat diri sendiri
  if (user.role === "SISWA" && user.student) {
    where.id = user.student.id;
  } else if (user.role === "WALI_KELAS") {
    const classes = await db.class.findMany({ where: { waliKelasId: user.id } });
    const classIds = classes.map((c) => c.id);
    where.classId = { in: classIds };
  }

  const students = await db.student.findMany({
    where,
    include: { user: true, class: true },
    orderBy: { nis: "asc" },
  });

  return NextResponse.json({ students });
}

// Update photo / face descriptor
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, photoUrl, faceDescriptor } = body;

  // Siswa hanya bisa update diri sendiri
  const targetId = user.role === "SISWA" && user.student ? user.student.id : id;
  if (!targetId) return NextResponse.json({ error: "ID siswa diperlukan" }, { status: 400 });

  const data: any = {};
  if (photoUrl !== undefined) data.photoUrl = photoUrl;
  if (faceDescriptor !== undefined) data.faceDescriptor = faceDescriptor;

  const updated = await db.student.update({ where: { id: targetId }, data });
  return NextResponse.json({ student: updated });
}
