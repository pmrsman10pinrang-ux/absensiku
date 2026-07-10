import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const where: any = {};
  if (role) where.role = role;

  const users = await db.user.findMany({
    where,
    include: { teacher: true, student: { include: { class: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }

  const body = await req.json();
  const { email, password, name, role, phone, nip, nis, gender, classId } = body;

  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: "Field wajib belum lengkap" }, { status: 400 });
  }

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });

  const newUser = await db.user.create({
    data: {
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      name,
      role,
      phone,
    },
  });

  if ((role === "WALI_KELAS" || role === "GURU_BK" || role === "PIKET") && nip) {
    await db.teacher.create({
      data: { userId: newUser.id, nip, gender: gender || "L" },
    });
  }

  if (role === "SISWA" && nis) {
    if (!classId) {
      return NextResponse.json({ error: "Siswa wajib punya kelas" }, { status: 400 });
    }
    await db.student.create({
      data: {
        userId: newUser.id,
        nis,
        gender: gender || "L",
        classId,
      },
    });
  }

  return NextResponse.json({ user: newUser });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, phone, password, isActive } = body;

  // User bisa update diri sendiri, admin bisa update siapa saja
  if (id !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
  }

  const data: any = { name, phone };
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (password) data.passwordHash = bcrypt.hashSync(password, 10);

  const updated = await db.user.update({ where: { id: id || user.id }, data });
  return NextResponse.json({ user: updated });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
