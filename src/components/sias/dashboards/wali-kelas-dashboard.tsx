"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StatCard, AttendanceBadge, ViolationLevelBadge, ViolationStatusBadge, EmptyState, formatDate, formatTime } from "../ui";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import {
  CalendarCheck, AlertTriangle, BookOpen, Users, Clock, Loader2, FileText,
  CheckCircle2, Plus, GraduationCap, MessageSquare
} from "lucide-react";

type DashboardData = {
  today: string;
  stats: any;
  roleData: {
    myClasses: any[];
    todayByClass: any[];
    recentViolations: any[];
    classStudentCount: number;
  };
};

export function WaliKelasDashboard() {
  const { user, currentView } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [gradeDialog, setGradeDialog] = useState<{ open: boolean; student?: any }>({ open: false });
  const [violations, setViolations] = useState<any[]>([]);
  const [violationTypes, setViolationTypes] = useState<any[]>([]);
  const [violationDialog, setViolationDialog] = useState<{ open: boolean; student?: any }>({ open: false });
  const [attendanceFilter, setAttendanceFilter] = useState<string>("");

  const fetchDashboard = async () => {
    setLoading(true);
    const r = await fetch("/api/dashboard");
    const d = await r.json();
    setData(d);
    setLoading(false);
  };

  const fetchStudents = async () => {
    if (!data?.roleData.myClasses?.length) return;
    const classId = data.roleData.myClasses[0].id;
    const r = await fetch(`/api/students?classId=${classId}`);
    const d = await r.json();
    setStudents(d.students || []);
  };

  const fetchSubjects = async () => {
    if (!data?.roleData.myClasses?.length) return;
    const classId = data.roleData.myClasses[0].id;
    const r = await fetch(`/api/subjects?classId=${classId}`);
    const d = await r.json();
    setSubjects(d.subjects || []);
  };

  const fetchViolations = async () => {
    if (!data?.roleData.myClasses?.length) return;
    const r = await fetch("/api/violations");
    const d = await r.json();
    setViolations(d.violations || []);
  };

  const fetchViolationTypes = async () => {
    const r = await fetch("/api/violation-types");
    const d = await r.json();
    setViolationTypes(d.types || []);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (data) {
      fetchStudents();
      fetchSubjects();
      fetchViolations();
      fetchViolationTypes();
    }
  }, [data]);

  if (loading || !data) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>;
  }

  const { roleData: rd, stats } = data;
  const myClass = rd.myClasses[0];
  const todayAtt = rd.todayByClass;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white shadow-md">
        <h2 className="text-xl font-bold">Selamat datang, {user?.name}!</h2>
        <p className="text-emerald-50 text-sm mt-1">
          Wali Kelas {myClass?.name} · {rd.classStudentCount} siswa
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full" value={currentView === "dashboard" ? "dashboard" : currentView}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="dashboard" onClick={() => useAppStore.getState().setView("dashboard")}>Dashboard</TabsTrigger>
          <TabsTrigger value="absensi-kelas" onClick={() => useAppStore.getState().setView("absensi-kelas")}>Absensi</TabsTrigger>
          <TabsTrigger value="input-nilai" onClick={() => useAppStore.getState().setView("input-nilai")}>Input Nilai</TabsTrigger>
          <TabsTrigger value="rekap-nilai" onClick={() => useAppStore.getState().setView("rekap-nilai")}>Rekap Nilai</TabsTrigger>
          <TabsTrigger value="pelanggaran-kelas" onClick={() => useAppStore.getState().setView("pelanggaran-kelas")}>Pelanggaran</TabsTrigger>
        </TabsList>

        {/* === DASHBOARD === */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title="Total Siswa" value={rd.classStudentCount} icon={Users} color="emerald" />
            <StatCard title="Hadir Hari Ini" value={todayAtt.filter(a => a.status === "HADIR").length} icon={CheckCircle2} color="emerald" />
            <StatCard title="Terlambat" value={todayAtt.filter(a => a.status === "TERLAMBAT").length} icon={Clock} color="amber" />
            <StatCard title="Tidak Hadir" value={todayAtt.filter(a => ["ALPA", "IZIN", "SAKIT"].includes(a.status)).length} icon={AlertTriangle} color="rose" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Absensi Hari Ini — {myClass?.name}</CardTitle>
              <CardDescription>{formatDate(data.today)}</CardDescription>
            </CardHeader>
            <CardContent>
              {todayAtt.length === 0 ? (
                <EmptyState title="Belum ada absensi hari ini" icon={CalendarCheck} />
              ) : (
                <div className="max-h-96 overflow-y-auto -mx-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Siswa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Verifikasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayAtt.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm font-medium">{a.student?.user?.name}</TableCell>
                          <TableCell><AttendanceBadge status={a.status} /></TableCell>
                          <TableCell className="text-sm font-mono">{formatTime(a.checkInTime)}</TableCell>
                          <TableCell>
                            {a.faceVerified ? (
                              <Badge className="bg-emerald-100 text-emerald-700" variant="outline">Wajah OK</Badge>
                            ) : (
                              <Badge variant="outline">Manual</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pelanggaran Terbaru di Kelas</CardTitle>
            </CardHeader>
            <CardContent>
              {rd.recentViolations.length === 0 ? (
                <EmptyState title="Tidak ada pelanggaran" icon={CheckCircle2} />
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {rd.recentViolations.slice(0, 5).map((v: any) => (
                    <div key={v.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{v.student?.user?.name}</span>
                            <ViolationLevelBadge level={v.level} />
                            <ViolationStatusBadge status={v.status} />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{v.violationType?.name}</p>
                          <p className="text-xs text-slate-400">{formatDate(v.date)}</p>
                        </div>
                        <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">-{v.points} poin</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ABSENSI KELAS === */}
        <TabsContent value="absensi-kelas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rekap Absensi — {myClass?.name}</CardTitle>
              <CardDescription>Daftar absensi siswa kelas Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto -mx-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Status Hari Ini</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Verifikasi Wajah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s: any) => {
                      const att = todayAtt.find(a => a.studentId === s.id);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="text-sm font-mono">{s.nis}</TableCell>
                          <TableCell className="text-sm font-medium">{s.user?.name}</TableCell>
                          <TableCell>
                            {att ? <AttendanceBadge status={att.status} /> : <Badge variant="outline" className="text-slate-400">Belum absen</Badge>}
                          </TableCell>
                          <TableCell className="text-sm font-mono">{att ? formatTime(att.checkInTime) : "-"}</TableCell>
                          <TableCell>
                            {att?.faceVerified ? <Badge className="bg-emerald-100 text-emerald-700" variant="outline">✓</Badge> : att ? <Badge variant="outline">Manual</Badge> : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === INPUT NILAI === */}
        <TabsContent value="input-nilai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" /> Input Nilai Siswa
              </CardTitle>
              <CardDescription>Pilih siswa untuk menginput nilai baru</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {students.map((s: any) => (
                  <div key={s.id} className="border rounded-lg p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-medium text-sm">{s.user?.name}</div>
                      <div className="text-xs text-slate-500">NIS {s.nis}</div>
                    </div>
                    <Button size="sm" onClick={() => setGradeDialog({ open: true, student: s })}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Input Nilai
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <GradeInputDialog
            open={gradeDialog.open}
            student={gradeDialog.student}
            subjects={subjects}
            onClose={() => setGradeDialog({ open: false })}
            onSuccess={() => { fetchDashboard(); setGradeDialog({ open: false }); }}
          />
        </TabsContent>

        {/* === REKAP NILAI === */}
        <TabsContent value="rekap-nilai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rekap Nilai Siswa</CardTitle>
              <CardDescription>Nilai per siswa per mata pelajaran</CardDescription>
            </CardHeader>
            <CardContent>
              <RekapNilaiTable students={students} subjects={subjects} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* === PELANGGARAN KELAS === */}
        <TabsContent value="pelanggaran-kelas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Pelanggaran Siswa Kelas {myClass?.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {violations.length === 0 ? (
                  <EmptyState title="Belum ada pelanggaran" icon={CheckCircle2} />
                ) : (
                  violations.map((v: any) => (
                    <div key={v.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{v.student?.user?.name}</span>
                            <ViolationLevelBadge level={v.level} />
                            <ViolationStatusBadge status={v.status} />
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{v.violationType?.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{v.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(v.date)} · Dilaporkan oleh {v.reportedBy?.name}
                          </p>
                          {v.handlerNote && (
                            <p className="text-xs text-slate-700 mt-2 p-2 bg-amber-50 rounded border border-amber-100">
                              <strong>Tindak lanjut BK:</strong> {v.handlerNote}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">-{v.points} poin</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GradeInputDialog({ open, student, subjects, onClose, onSuccess }: {
  open: boolean;
  student?: any;
  subjects: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [subjectId, setSubjectId] = useState("");
  const [score, setScore] = useState("");
  const [type, setType] = useState("TUGAS");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!subjectId || !score || !student) {
      toast.error("Lengkapi semua field");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, subjectId, score, type, note }),
      });
      const d = await r.json();
      if (!r.ok) toast.error(d.error);
      else {
        toast.success(`Nilai ${type} ${score} untuk ${student.user?.name} berhasil diinput`);
        setSubjectId(""); setScore(""); setNote("");
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Input Nilai — {student?.user?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Mata Pelajaran</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue placeholder="Pilih mapel" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} (KKM {s.kkm})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Jenis Nilai</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HARIAN">Harian</SelectItem>
                <SelectItem value="TUGAS">Tugas</SelectItem>
                <SelectItem value="QUIZ">Quiz</SelectItem>
                <SelectItem value="UTS">UTS</SelectItem>
                <SelectItem value="UAS">UAS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nilai (0-100)</Label>
            <Input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} placeholder="80" />
          </div>
          <div>
            <Label>Catatan (opsional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan tambahan..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Simpan Nilai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RekapNilaiTable({ students, subjects }: { students: any[]; subjects: any[] }) {
  const [grades, setGrades] = useState<Record<string, any[]>>({});

  useEffect(() => {
    (async () => {
      const all: Record<string, any[]> = {};
      for (const s of students) {
        const r = await fetch(`/api/grades?studentId=${s.id}`);
        const d = await r.json();
        all[s.id] = d.grades || [];
      }
      setGrades(all);
    })();
  }, [students]);

  const avgFor = (studentId: string, subjectId: string) => {
    const g = (grades[studentId] || []).filter(x => x.subjectId === subjectId);
    if (!g.length) return null;
    return (g.reduce((s, x) => s + x.score, 0) / g.length).toFixed(1);
  };

  return (
    <div className="max-h-[500px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-white">NIS</TableHead>
            <TableHead className="sticky bg-white" style={{ left: 80 }}>Nama</TableHead>
            {subjects.map((s) => (
              <TableHead key={s.id} className="text-center min-w-[100px]">{s.name}<br/><span className="text-[10px] font-normal text-slate-400">KKM {s.kkm}</span></TableHead>
            ))}
            <TableHead className="text-center">Rata-rata</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s: any) => {
            const allGrades = grades[s.id] || [];
            const avg = allGrades.length ? (allGrades.reduce((sum, g) => sum + g.score, 0) / allGrades.length).toFixed(1) : "-";
            return (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs sticky left-0 bg-white">{s.nis}</TableCell>
                <TableCell className="font-medium text-sm sticky bg-white" style={{ left: 80 }}>{s.user?.name}</TableCell>
                {subjects.map((subj) => {
                  const v = avgFor(s.id, subj.id);
                  return (
                    <TableCell key={subj.id} className="text-center">
                      {v === null ? <span className="text-slate-300">-</span> : (
                        <span className={parseFloat(v) >= subj.kkm ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>{v}</span>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center font-bold">{avg}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
