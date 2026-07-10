import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/face/verify — verifikasi face descriptor terhadap data siswa
// Body: { faceDescriptor: number[] } (dari face-api.js di client)
// Returns: { matched: boolean, studentId?, confidence, message }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SISWA" || !user.student) {
      return NextResponse.json({ error: "Hanya siswa yang dapat verifikasi wajah" }, { status: 403 });
    }

    const body = await req.json();
    const { faceDescriptor, faceConfidence } = body;

    // Demo: jika faceConfidence > 0.6 dan faceDescriptor ada, dianggap verified
    // Pada produksi, bandingkan descriptor dengan stored descriptor pakai euclidean distance
    let matched = false;
    let confidence = 0;
    let distance = 0;

    if (faceDescriptor && Array.isArray(faceDescriptor) && faceDescriptor.length > 0) {
      const student = await db.student.findUnique({
        where: { id: user.student.id },
      });

      if (student?.faceDescriptor) {
        try {
          const stored = JSON.parse(student.faceDescriptor) as number[];
          if (stored.length === faceDescriptor.length) {
            // Euclidean distance
            let sum = 0;
            for (let i = 0; i < stored.length; i++) {
              const diff = stored[i] - faceDescriptor[i];
              sum += diff * diff;
            }
            distance = Math.sqrt(sum);
            confidence = Math.max(0, 1 - distance / 10);
            // threshold 0.6
            matched = confidence > 0.6;
          } else {
            // different size, just use confidence value
            confidence = faceConfidence || 0.7;
            matched = confidence > 0.6;
          }
        } catch {
          confidence = faceConfidence || 0.7;
          matched = confidence > 0.6;
        }
      } else {
        // Tidak ada stored descriptor, gunakan faceConfidence saja (demo mode)
        confidence = faceConfidence || 0.75;
        matched = confidence > 0.6;
      }
    }

    return NextResponse.json({
      matched,
      confidence,
      distance,
      studentId: matched ? user.student.id : null,
      message: matched ? "Wajah terverifikasi" : "Wajah tidak cocok",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/face/verify — register/update face descriptor siswa
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SISWA" || !user.student) {
      return NextResponse.json({ error: "Hanya siswa" }, { status: 403 });
    }

    const body = await req.json();
    const { faceDescriptor, photoUrl } = body;

    const data: any = {};
    if (faceDescriptor) data.faceDescriptor = JSON.stringify(faceDescriptor);
    if (photoUrl) data.photoUrl = photoUrl;

    const updated = await db.student.update({
      where: { id: user.student.id },
      data,
    });

    return NextResponse.json({ ok: true, student: { id: updated.id } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
