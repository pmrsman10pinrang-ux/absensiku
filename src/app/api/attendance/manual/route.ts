import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Manual update / piket manual input
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, status, note, method } = body;

    const allowed = ["PIKET", "ADMIN", "WALI_KELAS"];
    if (!allowed.includes(user.role)) {
      return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
    }

    const updated = await db.attendance.update({
      where: { id },
      data: {
        status,
        note,
        method: method || "MANUAL",
        reportedById: user.id,
      },
    });

    return NextResponse.json({ attendance: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Piket create manual attendance for a student
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ["PIKET", "ADMIN", "WALI_KELAS"];
    if (!allowed.includes(user.role)) {
      return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, classId, date, status, note } = body;

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const existing = await db.attendance.findUnique({
      where: { studentId_date: { studentId, date: d } },
    });

    let attendance;
    if (existing) {
      attendance = await db.attendance.update({
        where: { id: existing.id },
        data: { status, note, reportedById: user.id, method: "MANUAL" },
      });
    } else {
      attendance = await db.attendance.create({
        data: {
          studentId,
          classId,
          date: d,
          status,
          note,
          reportedById: user.id,
          method: "MANUAL",
        },
      });
    }

    return NextResponse.json({ attendance });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
