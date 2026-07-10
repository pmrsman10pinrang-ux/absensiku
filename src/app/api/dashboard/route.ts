import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // === Stats umum ===
  const totalStudents = await db.student.count();
  const totalClasses = await db.class.count();
  const totalTeachers = await db.teacher.count();

  // === Attendance hari ini ===
  const todayAttendance = await db.attendance.findMany({
    where: { date: today },
    include: { student: { include: { user: true, class: true } } },
  });

  const attendanceStats = {
    hadir: todayAttendance.filter((a) => a.status === "HADIR").length,
    terlambat: todayAttendance.filter((a) => a.status === "TERLAMBAT").length,
    izin: todayAttendance.filter((a) => a.status === "IZIN").length,
    sakit: todayAttendance.filter((a) => a.status === "SAKIT").length,
    alpa: todayAttendance.filter((a) => a.status === "ALPA").length,
  };

  // === Pelanggaran ===
  let violationWhere: any = {};
  if (user.role === "SISWA" && user.student) {
    violationWhere.studentId = user.student.id;
  } else if (user.role === "WALI_KELAS") {
    const classes = await db.class.findMany({ where: { waliKelasId: user.id } });
    const classIds = classes.map((c) => c.id);
    const students = await db.student.findMany({ where: { classId: { in: classIds } } });
    violationWhere.studentId = { in: students.map((s) => s.id) };
  }

  const violationStats = {
    total: await db.violation.count({ where: violationWhere }),
    dilaporkan: await db.violation.count({ where: { ...violationWhere, status: "DILAPORKAN" } }),
    diproses: await db.violation.count({ where: { ...violationWhere, status: "DIPROSES" } }),
    konseling: await db.violation.count({ where: { ...violationWhere, status: "KONSELING" } }),
    selesai: await db.violation.count({ where: { ...violationWhere, status: "SELESAI" } }),
  };

  // === Per-role data ===
  let roleData: any = {};

  if (user.role === "SISWA" && user.student) {
    const myAttendance = await db.attendance.findMany({
      where: { studentId: user.student.id },
      orderBy: { date: "desc" },
      take: 30,
    });
    const myGrades = await db.grade.findMany({
      where: { studentId: user.student.id },
      include: { subject: true },
      orderBy: { date: "desc" },
    });
    const myViolations = await db.violation.findMany({
      where: { studentId: user.student.id },
      include: { violationType: true },
      orderBy: { date: "desc" },
    });
    const totalPoints = myViolations.reduce((sum, v) => sum + v.points, 0);

    roleData = {
      myAttendance,
      myGrades,
      myViolations,
      totalPoints,
      attendanceToday: myAttendance.find((a) => a.date.getTime() === today.getTime()),
    };
  } else if (user.role === "WALI_KELAS") {
    const myClasses = await db.class.findMany({
      where: { waliKelasId: user.id },
      include: {
        students: { include: { user: true } },
        _count: { select: { students: true } },
      },
    });

    const classIds = myClasses.map((c) => c.id);
    const studentIds = (await db.student.findMany({ where: { classId: { in: classIds } } })).map((s) => s.id);

    const todayByClass = await db.attendance.findMany({
      where: { date: today, classId: { in: classIds } },
      include: { student: { include: { user: true } } },
    });

    const recentViolations = await db.violation.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: { include: { user: true, class: true } },
        violationType: true,
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    roleData = {
      myClasses,
      todayByClass,
      recentViolations,
      classStudentCount: studentIds.length,
    };
  } else if (user.role === "GURU_BK") {
    const pendingViolations = await db.violation.findMany({
      where: { status: { in: ["DILAPORKAN", "DIPROSES", "KONSELING"] } },
      include: {
        student: { include: { user: true, class: true } },
        violationType: true,
        reportedBy: { select: { name: true, role: true } },
      },
      orderBy: { date: "desc" },
    });

    const topStudents = await db.violation.groupBy({
      by: ["studentId"],
      _sum: { points: true },
      _count: true,
      orderBy: { _sum: { points: "desc" } },
      take: 5,
    });

    const topStudentDetails = await Promise.all(
      topStudents.map(async (ts) => {
        const student = await db.student.findUnique({
          where: { id: ts.studentId },
          include: { user: true, class: true },
        });
        return {
          student,
          totalPoints: ts._sum.points,
          violationCount: ts._count,
        };
      })
    );

    roleData = {
      pendingViolations,
      topStudentDetails,
    };
  } else if (user.role === "PIKET") {
    const allClasses = await db.class.findMany({
      include: {
        _count: { select: { students: true } },
        waliKelas: { select: { name: true } },
      },
    });

    const todayByAllClasses = await Promise.all(
      allClasses.map(async (c) => {
        const att = await db.attendance.findMany({
          where: { date: today, classId: c.id },
        });
        return {
          class: c,
          hadir: att.filter((a) => a.status === "HADIR").length,
          terlambat: att.filter((a) => a.status === "TERLAMBAT").length,
          izin: att.filter((a) => a.status === "IZIN").length,
          sakit: att.filter((a) => a.status === "SAKIT").length,
          alpa: att.filter((a) => a.status === "ALPA").length,
          total: att.length,
        };
      })
    );

    roleData = { todayByAllClasses, allClasses };
  } else if (user.role === "ADMIN") {
    const allUsers = await db.user.count();
    const usersByRole = await db.user.groupBy({ by: ["role"], _count: true });
    const violationTypeCount = await db.violationType.count();
    const subjectCount = await db.subject.count();

    roleData = {
      allUsers,
      usersByRole,
      violationTypeCount,
      subjectCount,
    };
  }

  return NextResponse.json({
    user,
    today: today.toISOString(),
    stats: {
      totalStudents,
      totalClasses,
      totalTeachers,
      attendanceToday: attendanceStats,
      violations: violationStats,
    },
    roleData,
  });
}
