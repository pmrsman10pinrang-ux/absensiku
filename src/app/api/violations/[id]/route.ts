import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// PATCH /api/violations/[id] — update status, handler note, follow up
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { status, handlerNote, followUp } = body;

    const allowed = ["GURU_BK", "ADMIN", "WALI_KELAS", "PIKET"];
    if (!allowed.includes(user.role)) {
      return NextResponse.json({ error: "Tidak memiliki izin" }, { status: 403 });
    }

    const violation = await db.violation.update({
      where: { id },
      data: {
        status,
        handlerNote,
        followUp,
        handledById: user.id,
      },
      include: {
        student: { include: { user: true, class: true } },
        violationType: true,
      },
    });

    await db.notification.create({
      data: {
        userId: violation.student.userId,
        title: "Update Status Pelanggaran",
        body: `Pelanggaran "${violation.description}" status: ${status}`,
        type: "VIOLATION",
        refId: violation.id,
      },
    });

    if (violation.student.class.waliKelasId) {
      await db.notification.create({
        data: {
          userId: violation.student.class.waliKelasId,
          title: "Update Pelanggaran Siswa",
          body: `${violation.student.user.name}: pelanggaran "${violation.description}" → ${status}`,
          type: "VIOLATION",
          refId: violation.id,
        },
      });
    }

    return NextResponse.json({ violation });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya admin" }, { status: 403 });
    }
    const { id } = await params;
    await db.violation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
