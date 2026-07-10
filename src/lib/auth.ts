import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { db } from "@/lib/db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sias-sis-dev-secret-change-in-production"
);

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "WALI_KELAS" | "SISWA" | "GURU_BK" | "PIKET";
  phone: string | null;
  avatarUrl: string | null;
  teacher: { id: string; nip: string } | null;
  student: {
    id: string;
    nis: string;
    classId: string;
    className: string;
    photoUrl: string | null;
  } | null;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const c = await cookies();
    const token = c.get("sias_session")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    const user = await db.user.findUnique({
      where: { id: payload.uid as string },
      include: { teacher: true, student: { include: { class: true } } },
    });
    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as AuthUser["role"],
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      teacher: user.teacher ? { id: user.teacher.id, nip: user.teacher.nip } : null,
      student: user.student
        ? {
            id: user.student.id,
            nis: user.student.nis,
            classId: user.student.classId,
            className: user.student.class.name,
            photoUrl: user.student.photoUrl,
          }
        : null,
    };
  } catch {
    return null;
  }
}

export function requireRole(user: AuthUser | null, roles: AuthUser["role"][]) {
  if (!user || !roles.includes(user.role)) {
    return false;
  }
  return true;
}

// Haversine distance (meters)
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius (m)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
