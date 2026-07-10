import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const school = await db.school.findFirst();
  return NextResponse.json({ school });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...data } = body;

  let school = await db.school.findFirst();
  if (!school) {
    school = await db.school.create({ data });
  } else {
    school = await db.school.update({ where: { id: id || school.id }, data });
  }

  return NextResponse.json({ school });
}
