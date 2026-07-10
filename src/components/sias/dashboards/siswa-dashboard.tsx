"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FaceScan } from "../face-scan";
import { GeoLocation } from "../geo-location";
import { StatCard, AttendanceBadge, ViolationLevelBadge, ViolationStatusBadge, EmptyState, formatDate, formatTime } from "../ui";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import {
  CalendarCheck, AlertTriangle, BookOpen, Award, CheckCircle2, XCircle,
  Clock, MapPin, ScanFace, Loader2, TrendingUp, Calendar, FileText
} from "lucide-react";

type DashboardData = {
  today: string;
  stats: any;
  roleData: {
    myAttendance: any[];
    myGrades: any[];
    myViolations: any[];
    totalPoints: number;
    attendanceToday: any;
  };
};

export function SiswaDashboard() {
  const { user } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);
  const [faceData, setFaceData] = useState<{ faceDescriptor: number[]; faceConfidence: number; faceImage: string } | null>(null);
  const [locData, setLocData] = useState<{ latitude: number; longitude: number; valid: boolean; distance: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    const r = await fetch("/api/dashboard");
    const d = await r.json();
    setData(d);
    setLoading(false);
  };

  const fetchSchool = async () => {
    const r = await fetch("/api/school");
    const d = await r.json();
    setSchool(d.school);
  };

  useEffect(() => {
    fetchDashboard();
    fetchSchool();
  }, []);

  const handleCheckIn = async () => {
    if (!faceData || !locData) {
      toast.error("Selesaikan verifikasi wajah dan lokasi terlebih dahulu");
      return;
    }
    if (!locData.valid) {
      toast.error("Anda berada di luar radius sekolah");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faceDescriptor: faceData.faceDescriptor,
          faceConfidence: faceData.faceConfidence,
          latitude: locData.latitude,
          longitude: locData.longitude,
          faceImage: faceData.faceImage,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error || "Gagal absensi");
      } else {
        toast.success(
          d.isLate
            ? `Absensi tercatat: TERLAMBAT pukul ${new Date(d.checkInTime).toLocaleTimeString("id-ID")}`
            : `Absensi berhasil! HADIR pukul ${new Date(d.checkInTime).toLocaleTimeString("id-ID")}`,
          { duration: 5000 }
        );
        fetchDashboard();
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>;
  }

  const { roleData: rd, stats } = data;
  const alreadyCheckedIn = !!rd.attendanceToday;

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold">Halo, {user?.name}! 👋</h2>
            <p className="text-emerald-50 text-sm mt-1">
              {user?.student?.className} · NIS {user?.student?.nis}
            </p>
          </div>
          <div className="text-right">
            <p className="text-emerald-50 text-xs">{formatDate(data.today)}</p>
            {alreadyCheckedIn ? (
              <Badge className="mt-1 bg-white text-emerald-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Sudah absen: {rd.attendanceToday.status}
              </Badge>
            ) : (
              <Badge className="mt-1 bg-amber-400 text-amber-900">Belum absen hari ini</Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="absen" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="absen">Absensi</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
          <TabsTrigger value="nilai">Nilai</TabsTrigger>
          <TabsTrigger value="pelanggaran">Pelanggaran</TabsTrigger>
        </TabsList>

        {/* === TAB ABSENSI === */}
        <TabsContent value="absen" className="space-y-4">
          {alreadyCheckedIn ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg">Anda sudah absen hari ini</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Status: <AttendanceBadge status={rd.attendanceToday.status} /> · Pukul {formatTime(rd.attendanceToday.checkInTime)}
                </p>
                <div className="mt-4 inline-flex items-center gap-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
                  <span className="flex items-center gap-1"><ScanFace className="h-3 w-3" /> Wajah terverifikasi</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {rd.attendanceToday.distanceMeters}m dari sekolah</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid lg:grid-cols-2 gap-4">
                <FaceScan
                  expectedName={user?.name}
                  onVerified={(d) => {
                    setFaceData(d);
                    toast.success("Wajah terverifikasi");
                  }}
                />
                <GeoLocation school={school} onLocation={setLocData} />
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-1.5">
                        <ScanFace className={`h-4 w-4 ${faceData ? "text-emerald-600" : "text-slate-400"}`} />
                        <span className={`text-sm ${faceData ? "text-emerald-700" : "text-slate-500"}`}>
                          {faceData ? "Wajah terverifikasi" : "Verifikasi wajah belum selesai"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-4 w-4 ${locData ? (locData.valid ? "text-emerald-600" : "text-rose-600") : "text-slate-400"}`} />
                        <span className={`text-sm ${locData ? (locData.valid ? "text-emerald-700" : "text-rose-700") : "text-slate-500"}`}>
                          {locData ? (locData.valid ? `Lokasi valid (${locData.distance}m)` : `Di luar radius (${locData.distance}m)`) : "Lokasi belum dideteksi"}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleCheckIn}
                      disabled={!faceData || !locData || !locData.valid || submitting}
                      className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                      size="lg"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
                      Konfirmasi Absensi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* === TAB RIWAYAT ABSENSI === */}
        <TabsContent value="riwayat" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard title="Hadir" value={rd.myAttendance.filter((a: any) => a.status === "HADIR").length} icon={CheckCircle2} color="emerald" />
            <StatCard title="Terlambat" value={rd.myAttendance.filter((a: any) => a.status === "TERLAMBAT").length} icon={Clock} color="amber" />
            <StatCard title="Izin" value={rd.myAttendance.filter((a: any) => a.status === "IZIN").length} icon={FileText} color="sky" />
            <StatCard title="Sakit" value={rd.myAttendance.filter((a: any) => a.status === "SAKIT").length} icon={FileText} color="violet" />
            <StatCard title="Alpa" value={rd.myAttendance.filter((a: any) => a.status === "ALPA").length} icon={XCircle} color="rose" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Absensi (30 hari terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              {rd.myAttendance.length === 0 ? (
                <EmptyState title="Belum ada riwayat absensi" icon={Calendar} />
              ) : (
                <div className="max-h-96 overflow-y-auto -mx-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Metode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rd.myAttendance.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm">{formatDate(a.date)}</TableCell>
                          <TableCell><AttendanceBadge status={a.status} /></TableCell>
                          <TableCell className="text-sm font-mono">{formatTime(a.checkInTime)}</TableCell>
                          <TableCell className="text-sm">{a.distanceMeters ?? "-"}m</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {a.faceVerified ? <ScanFace className="h-3 w-3 mr-1" /> : null}
                              {a.method === "FACE_SCAN" ? "Face Scan" : "Manual"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB NILAI === */}
        <TabsContent value="nilai" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard title="Mata Pelajaran" value={new Set(rd.myGrades.map((g: any) => g.subjectId)).size} icon={BookOpen} color="emerald" />
            <StatCard title="Total Nilai Tercatat" value={rd.myGrades.length} icon={FileText} color="sky" />
            <StatCard title="Rata-rata" value={rd.myGrades.length ? (rd.myGrades.reduce((s: number, g: any) => s + g.score, 0) / rd.myGrades.length).toFixed(1) : "-"} icon={TrendingUp} color="amber" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daftar Nilai</CardTitle>
              <CardDescription>Nilai per mata pelajaran dan jenis penilaian</CardDescription>
            </CardHeader>
            <CardContent>
              {rd.myGrades.length === 0 ? (
                <EmptyState title="Belum ada nilai" icon={Award} />
              ) : (
                <div className="max-h-96 overflow-y-auto -mx-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Nilai</TableHead>
                        <TableHead>KKM</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rd.myGrades.map((g: any) => {
                        const tuntas = g.score >= (g.subject?.kkm ?? 75);
                        return (
                          <TableRow key={g.id}>
                            <TableCell className="text-sm font-medium">{g.subject?.name}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{g.type}</Badge></TableCell>
                            <TableCell className={`text-sm font-bold ${tuntas ? "text-emerald-700" : "text-rose-700"}`}>{g.score}</TableCell>
                            <TableCell className="text-sm text-slate-500">{g.subject?.kkm ?? 75}</TableCell>
                            <TableCell>
                              {tuntas ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">Tuntas</Badge>
                              ) : (
                                <Badge className="bg-rose-100 text-rose-700 border-rose-200" variant="outline">Belum Tuntas</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">{formatDate(g.date)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB PELANGGARAN === */}
        <TabsContent value="pelanggaran" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard title="Total Pelanggaran" value={rd.myViolations.length} icon={AlertTriangle} color="rose" />
            <StatCard title="Total Poin" value={rd.totalPoints} icon={AlertTriangle} color="amber" subtitle="Akumulasi poin pelanggaran" />
            <StatCard title="Belum Selesai" value={rd.myViolations.filter((v: any) => v.status !== "SELESAI" && v.status !== "DITOLAK").length} icon={Clock} color="violet" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Pelanggaran</CardTitle>
              <CardDescription>Semua pelanggaran yang pernah dicatat</CardDescription>
            </CardHeader>
            <CardContent>
              {rd.myViolations.length === 0 ? (
                <EmptyState title="Tidak ada pelanggaran" description="Pertahankan perilaku baik Anda!" icon={CheckCircle2} />
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {rd.myViolations.map((v: any) => (
                    <div key={v.id} className="border rounded-lg p-3 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{v.violationType?.name}</span>
                            <ViolationLevelBadge level={v.level} />
                            <ViolationStatusBadge status={v.status} />
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{v.description}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatDate(v.date)} {v.location ? `· ${v.location}` : ""}</p>
                          {v.handlerNote && (
                            <p className="text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded">
                              <strong>Catatan BK:</strong> {v.handlerNote}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">
                          -{v.points} poin
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
