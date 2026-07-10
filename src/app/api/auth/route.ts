import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sias-sis-dev-secret-change-in-production"
);

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { teacher: true, student: { include: { class: true } } },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const token = await new SignJWT({
      uid: user.id,
      role: user.role,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET);

    const c = await cookies();
    c.set("sias_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        teacher: user.teacher,
        student: user.student
          ? {
              id: user.student.id,
              nis: user.student.nis,
              classId: user.student.classId,
              className: user.student.class.name,
              photoUrl: user.student.photoUrl,
            }
          : null,
      },
    });
  } catch (e: any) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const c = await cookies();
    const token = c.get("sias_session")?.value;
    if (!token) return NextResponse.json({ user: null });

    const { payload } = await jwtVerify(token, SECRET);
    const user = await db.user.findUnique({
      where: { id: payload.uid as string },
      include: { teacher: true, student: { include: { class: true } } },
    });
    if (!user || !user.isActive) return NextResponse.json({ user: null });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        teacher: user.teacher,
        student: user.student
          ? {
              id: user.student.id,
              nis: user.student.nis,
              classId: user.student.classId,
              className: user.student.class.name,
              photoUrl: user.student.photoUrl,
            }
          : null,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function DELETE() {
  const c = await cookies();
  c.delete("sias_session");
  return NextResponse.json({ ok: true });
}
