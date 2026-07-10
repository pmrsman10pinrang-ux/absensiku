import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const types = await db.violationType.findMany({
    orderBy: [{ category: "asc" }, { level: "asc" }],
  });
  return NextResponse.json({ types });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }
  const body = await req.json();
  const created = await db.violationType.create({ data: body });
  return NextResponse.json({ type: created });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...data } = body;
  const updated = await db.violationType.update({ where: { id }, data });
  return NextResponse.json({ type: updated });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.violationType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
