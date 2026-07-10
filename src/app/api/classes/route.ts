import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classes = await db.class.findMany({
    include: {
      waliKelas: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ classes });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }
  const body = await req.json();
  const { name, level, major, waliKelasId } = body;

  const exists = await db.class.findUnique({ where: { name } });
  if (exists) return NextResponse.json({ error: "Nama kelas sudah ada" }, { status: 400 });

  const created = await db.class.create({
    data: { name, level, major, waliKelasId: waliKelasId || null },
  });
  return NextResponse.json({ class: created });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...data } = body;
  const updated = await db.class.update({ where: { id }, data });
  return NextResponse.json({ class: updated });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.class.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
