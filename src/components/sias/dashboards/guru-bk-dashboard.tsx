"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatCard, ViolationLevelBadge, ViolationStatusBadge, EmptyState, formatDate } from "../ui";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import {
  AlertTriangle, Clock, Loader2, CheckCircle2, Users, Award,
  MessageSquare, UserIcon
} from "lucide-react";

type DashboardData = {
  today: string;
  stats: any;
  roleData: {
    pendingViolations: any[];
    topStudentDetails: any[];
  };
};

export function GuruBKDashboard() {
  const { user, currentView } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [allViolations, setAllViolations] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [handleDialog, setHandleDialog] = useState<{ open: boolean; violation?: any }>({ open: false });
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentDialog, setStudentDialog] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    const r = await fetch("/api/dashboard");
    const d = await r.json();
    setData(d);
    setLoading(false);
  };

  const fetchAllViolations = async () => {
    const r = await fetch("/api/violations");
    const d = await r.json();
    setAllViolations(d.violations || []);
  };

  const fetchAllStudents = async () => {
    const r = await fetch("/api/students");
    const d = await r.json();
    setAllStudents(d.students || []);
  };

  useEffect(() => { fetchDashboard(); fetchAllViolations(); fetchAllStudents(); }, []);
  useEffect(() => {
    if (currentView === "pelanggaran-bk") fetchAllViolations();
  }, [currentView]);

  if (loading || !data) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>;
  }

  const { roleData: rd, stats } = data;
  const pending = rd.pendingViolations;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-5 text-white shadow-md">
        <h2 className="text-xl font-bold">Selamat datang, {user?.name}!</h2>
        <p className="text-amber-50 text-sm mt-1">Guru Bimbingan Konseling · {pending.length} pelanggaran menunggu tindak lanjut</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full" value={currentView === "dashboard" ? "dashboard" : currentView}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="dashboard" onClick={() => useAppStore.getState().setView("dashboard")}>Dashboard</TabsTrigger>
          <TabsTrigger value="pelanggaran-bk" onClick={() => useAppStore.getState().setView("pelanggaran-bk")}>Antrian</TabsTrigger>
          <TabsTrigger value="profil-siswa" onClick={() => useAppStore.getState().setView("profil-siswa")}>Profil Siswa</TabsTrigger>
        </TabsList>

        {/* === DASHBOARD === */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title="Antrian Pelanggaran" value={pending.length} icon={Clock} color="amber" subtitle="Perlu tindak lanjut" />
            <StatCard title="Dilaporkan" value={pending.filter(v => v.status === "DILAPORKAN").length} icon={AlertTriangle} color="rose" />
            <StatCard title="Diproses" value={pending.filter(v => v.status === "DIPROSES").length} icon={Clock} color="sky" />
            <StatCard title="Konseling Aktif" value={pending.filter(v => v.status === "KONSELING").length} icon={MessageSquare} color="violet" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Antrian Tindak Lanjut</CardTitle>
              <CardDescription>Pelanggaran yang memerlukan penanganan BK</CardDescription>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <EmptyState title="Tidak ada antrian" description="Semua pelanggaran sudah ditangani" icon={CheckCircle2} />
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {pending.slice(0, 10).map((v: any) => (
                    <div key={v.id} className="border rounded-lg p-3 hover:bg-amber-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{v.student?.user?.name}</span>
                            <Badge variant="outline" className="text-xs">{v.student?.class?.name}</Badge>
                            <ViolationLevelBadge level={v.level} />
                            <ViolationStatusBadge status={v.status} />
                          </div>
                          <p className="text-sm text-slate-700 mt-1">{v.violationType?.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{v.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(v.date)} · Dilaporkan oleh {v.reportedBy?.name || "-"}
                          </p>
                          {v.handlerNote && (
                            <p className="text-xs text-slate-700 mt-2 p-2 bg-slate-50 rounded">
                              <strong>Catatan sebelumnya:</strong> {v.handlerNote}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">-{v.points} poin</Badge>
                          <Button size="sm" onClick={() => setHandleDialog({ open: true, violation: v })}>
                            <MessageSquare className="h-3 w-3 mr-1" /> Proses
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 5 Siswa Poin Pelanggaran Tertinggi</CardTitle>
              <CardDescription>Perlu perhatian khusus & intervensi</CardDescription>
            </CardHeader>
            <CardContent>
              {rd.topStudentDetails.length === 0 ? (
                <EmptyState title="Belum ada data" icon={Award} />
              ) : (
                <div className="space-y-2">
                  {rd.topStudentDetails.map((ts: any, i: number) => (
                    <button
                      key={ts.student?.id}
                      onClick={() => { setSelectedStudent(ts.student); setStudentDialog(true); }}
                      className="w-full text-left border rounded-lg p-3 hover:bg-amber-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${i === 0 ? "bg-rose-500" : i === 1 ? "bg-amber-500" : i === 2 ? "bg-yellow-500" : "bg-slate-400"}`}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{ts.student?.user?.name}</div>
                          <div className="text-xs text-slate-500">{ts.student?.class?.name} · {ts.violationCount} pelanggaran</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">-{ts.totalPoints} poin</Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ANTRIAN PELANGGARAN === */}
        <TabsContent value="pelanggaran-bk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Semua Pelanggaran</CardTitle>
              <CardDescription>Kelola tindak lanjut semua pelanggaran</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {allViolations.length === 0 ? (
                  <EmptyState title="Tidak ada pelanggaran" icon={CheckCircle2} />
                ) : (
                  allViolations.map((v: any) => (
                    <div key={v.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{v.student?.user?.name}</span>
                            <Badge variant="outline" className="text-xs">{v.student?.class?.name}</Badge>
                            <ViolationLevelBadge level={v.level} />
                            <ViolationStatusBadge status={v.status} />
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{v.violationType?.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{v.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(v.date)} · Dilaporkan oleh {v.reportedBy?.name || "-"}
                          </p>
                          {v.handlerNote && (
                            <p className="text-xs text-slate-700 mt-2 p-2 bg-slate-50 rounded">
                              <strong>Catatan BK:</strong> {v.handlerNote}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">-{v.points} poin</Badge>
                          {v.status !== "SELESAI" && v.status !== "DITOLAK" && (
                            <Button size="sm" variant="outline" onClick={() => setHandleDialog({ open: true, violation: v })}>
                              Update Status
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === PROFIL SISWA === */}
        <TabsContent value="profil-siswa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profil & Riwayat Siswa</CardTitle>
              <CardDescription>Pilih siswa untuk melihat riwayat lengkap (pelanggaran, absensi, nilai)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {allStudents.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStudent(s); setStudentDialog(true); }}
                    className="w-full text-left border rounded-lg p-3 hover:bg-amber-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{s.user?.name}</div>
                        <div className="text-xs text-slate-500">NIS {s.nis} · {s.class?.name}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">Lihat →</Button>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <HandleViolationDialog
        open={handleDialog.open}
        violation={handleDialog.violation}
        onClose={() => setHandleDialog({ open: false })}
        onSuccess={() => { fetchDashboard(); fetchAllViolations(); setHandleDialog({ open: false }); }}
      />

      <StudentProfileDialog
        open={studentDialog}
        student={selectedStudent}
        onClose={() => setStudentDialog(false)}
      />
    </div>
  );
}

function HandleViolationDialog({ open, violation, onClose, onSuccess }: {
  open: boolean;
  violation?: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [handlerNote, setHandlerNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (violation) {
      setStatus(violation.status);
      setFollowUp(violation.followUp || "");
      setHandlerNote(violation.handlerNote || "");
    }
  }, [violation]);

  const submit = async () => {
    if (!violation) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/violations/${violation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, followUp, handlerNote }),
      });
      const d = await r.json();
      if (!r.ok) toast.error(d.error);
      else {
        toast.success("Status pelanggaran diupdate & notifikasi dikirim ke siswa & wali kelas");
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Proses Pelanggaran</DialogTitle>
        </DialogHeader>
        {violation && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <div className="font-medium">{violation.student?.user?.name} ({violation.student?.class?.name})</div>
              <div className="text-slate-600">{violation.violationType?.name}</div>
              <div className="text-xs text-slate-500">{violation.description}</div>
              <div className="flex items-center gap-2 mt-1">
                <ViolationLevelBadge level={violation.level} />
                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">-{violation.points} poin</Badge>
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DILAPORKAN">Dilaporkan</SelectItem>
                  <SelectItem value="DIPROSES">Diproses</SelectItem>
                  <SelectItem value="KONSELING">Konseling</SelectItem>
                  <SelectItem value="SELESAI">Selesai</SelectItem>
                  <SelectItem value="DITOLAK">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tindak Lanjut</Label>
              <Select value={followUp} onValueChange={setFollowUp}>
                <SelectTrigger><SelectValue placeholder="Pilih tindak lanjut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TINDAKAN">Tindakan</SelectItem>
                  <SelectItem value="KONSELING">Konseling</SelectItem>
                  <SelectItem value="PANGGILAN ORTU">Panggilan Orang Tua</SelectItem>
                  <SelectItem value="SELESAI">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Catatan BK</Label>
              <Textarea rows={3} value={handlerNote} onChange={(e) => setHandlerNote(e.target.value)} placeholder="Catatan konseling / tindakan yang dilakukan..." />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Update & Kirim Notifikasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudentProfileDialog({ open, student, onClose }: {
  open: boolean;
  student: any;
  onClose: () => void;
}) {
  const [violations, setViolations] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/violations?studentId=${student.id}`).then(r => r.json()),
      fetch(`/api/grades?studentId=${student.id}`).then(r => r.json()),
      fetch(`/api/attendance?studentId=${student.id}`).then(r => r.json()),
    ]).then(([v, g, a]) => {
      setViolations(v.violations || []);
      setGrades(g.grades || []);
      setAttendance(a.records || []);
      setLoading(false);
    });
  }, [student]);

  if (!student) return null;

  const totalPoints = violations.reduce((s, v) => s + v.points, 0);
  const avgGrade = grades.length ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1) : "-";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Profil Siswa — {student.user?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <StatCard title="Total Pelanggaran" value={violations.length} icon={AlertTriangle} color="rose" />
            <StatCard title="Total Poin" value={totalPoints} icon={AlertTriangle} color="amber" />
            <StatCard title="Rata-rata Nilai" value={avgGrade} icon={Award} color="emerald" />
          </div>

          <div className="text-xs text-slate-500 grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg">
            <div><strong>NIS:</strong> {student.nis}</div>
            <div><strong>Kelas:</strong> {student.class?.name}</div>
            <div><strong>JK:</strong> {student.gender === "L" ? "Laki-laki" : "Perempuan"}</div>
            <div><strong>Orang Tua:</strong> {student.parentName || "-"}</div>
            <div><strong>Telp Ortu:</strong> {student.parentPhone || "-"}</div>
            <div><strong>Alamat:</strong> {student.address || "-"}</div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Riwayat Pelanggaran ({violations.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {violations.length === 0 ? <p className="text-xs text-slate-400">Tidak ada</p> : violations.map((v) => (
                <div key={v.id} className="border rounded p-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">{v.violationType?.name}</span>
                    <ViolationStatusBadge status={v.status} />
                  </div>
                  <div className="text-slate-500 mt-0.5">{formatDate(v.date)} · -{v.points} poin</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Riwayat Nilai ({grades.length})</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {grades.length === 0 ? <p className="text-xs text-slate-400">Tidak ada</p> : grades.map((g) => (
                <div key={g.id} className="flex justify-between text-xs border-b pb-1">
                  <span>{g.subject?.name} ({g.type})</span>
                  <span className="font-bold">{g.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
