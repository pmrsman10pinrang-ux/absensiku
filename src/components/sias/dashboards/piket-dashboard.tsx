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
import { StatCard, AttendanceBadge, ViolationLevelBadge, ViolationStatusBadge, EmptyState, formatDate, formatTime } from "../ui";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import {
  CalendarCheck, AlertTriangle, Users, Clock, Loader2, CheckCircle2,
  ClipboardList, Plus, ScanFace
} from "lucide-react";

type DashboardData = {
  today: string;
  stats: any;
  roleData: {
    todayByAllClasses: any[];
    allClasses: any[];
  };
};

export function PiketDashboard() {
  const { user, currentView } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [violationTypes, setViolationTypes] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [violationDialog, setViolationDialog] = useState<{ open: boolean; student?: any }>({ open: false });
  const [manualDialog, setManualDialog] = useState<{ open: boolean; student?: any; attendance?: any }>({ open: false });

  const fetchDashboard = async () => {
    setLoading(true);
    const r = await fetch("/api/dashboard");
    const d = await r.json();
    setData(d);
    setLoading(false);
  };

  const fetchClasses = async () => {
    const r = await fetch("/api/classes");
    const d = await r.json();
    setClasses(d.classes || []);
    if (d.classes?.length && !selectedClass) setSelectedClass(d.classes[0].id);
  };

  const fetchStudents = async () => {
    if (!selectedClass) return;
    const r = await fetch(`/api/students?classId=${selectedClass}`);
    const d = await r.json();
    setStudents(d.students || []);
  };

  const fetchViolations = async () => {
    const r = await fetch("/api/violations");
    const d = await r.json();
    setViolations(d.violations || []);
  };

  const fetchViolationTypes = async () => {
    const r = await fetch("/api/violation-types");
    const d = await r.json();
    setViolationTypes(d.types || []);
  };

  useEffect(() => { fetchDashboard(); fetchClasses(); fetchViolationTypes(); }, []);
  useEffect(() => { fetchStudents(); }, [selectedClass]);
  useEffect(() => {
    if (currentView === "piket-laporan") fetchViolations();
  }, [currentView]);

  if (loading || !data) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>;
  }

  const { roleData: rd, stats } = data;
  const todayAtt = rd.todayByAllClasses;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-5 text-white shadow-md">
        <h2 className="text-xl font-bold">Selamat datang, {user?.name}!</h2>
        <p className="text-violet-50 text-sm mt-1">Guru Piket · {formatDate(data.today)}</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full" value={currentView === "dashboard" ? "dashboard" : currentView}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="dashboard" onClick={() => useAppStore.getState().setView("dashboard")}>Dashboard</TabsTrigger>
          <TabsTrigger value="input-manual" onClick={() => useAppStore.getState().setView("input-manual")}>Input Manual</TabsTrigger>
          <TabsTrigger value="piket-laporan" onClick={() => useAppStore.getState().setView("piket-laporan")}>Pelanggaran</TabsTrigger>
        </TabsList>

        {/* === DASHBOARD === */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard title="Total Kelas" value={rd.allClasses.length} icon={ClipboardList} color="violet" />
            <StatCard title="Total Hadir" value={todayAtt.reduce((s, c) => s + c.hadir, 0)} icon={CheckCircle2} color="emerald" />
            <StatCard title="Terlambat" value={todayAtt.reduce((s, c) => s + c.terlambat, 0)} icon={Clock} color="amber" />
            <StatCard title="Izin/Sakit" value={todayAtt.reduce((s, c) => s + c.izin + c.sakit, 0)} icon={Users} color="sky" />
            <StatCard title="Alpa" value={todayAtt.reduce((s, c) => s + c.alpa, 0)} icon={AlertTriangle} color="rose" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rekap Absensi Hari Ini per Kelas</CardTitle>
              <CardDescription>Klik kelas untuk detail input manual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayAtt.map((c: any) => {
                  const total = c.hadir + c.terlambat + c.izin + c.sakit + c.alpa;
                  const present = c.hadir + c.terlambat;
                  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                  return (
                    <button
                      key={c.class.id}
                      onClick={() => { setSelectedClass(c.class.id); useAppStore.getState().setView("input-manual"); }}
                      className="text-left border rounded-lg p-3 hover:bg-violet-50 hover:border-violet-300 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-sm">{c.class.name}</div>
                          <div className="text-xs text-slate-500">Wali: {c.class.waliKelas?.name || "-"}</div>
                        </div>
                        <Badge variant="outline" className={pct >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                          {pct}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-center text-xs">
                        <div><div className="font-bold text-emerald-600">{c.hadir}</div><div className="text-slate-400">H</div></div>
                        <div><div className="font-bold text-amber-600">{c.terlambat}</div><div className="text-slate-400">T</div></div>
                        <div><div className="font-bold text-sky-600">{c.izin}</div><div className="text-slate-400">I</div></div>
                        <div><div className="font-bold text-violet-600">{c.sakit}</div><div className="text-slate-400">S</div></div>
                        <div><div className="font-bold text-rose-600">{c.alpa}</div><div className="text-slate-400">A</div></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === INPUT MANUAL === */}
        <TabsContent value="input-manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Input Absensi Manual</CardTitle>
              <CardDescription>Pilih kelas untuk input/ubah absensi siswa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <Label>Pilih Kelas</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-[500px] overflow-y-auto -mx-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Status Hari Ini</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s: any) => {
                      const att = (data.stats.attendanceToday ? null : null);
                      // Find attendance from all today's records
                      const classAtt = rd.todayByAllClasses.find(c => c.class.id === selectedClass);
                      return <PiketStudentRow key={s.id} student={s} classId={selectedClass} onChange={() => fetchDashboard()} />;
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === PELANGGARAN === */}
        <TabsContent value="piket-laporan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Laporan Pelanggaran</CardTitle>
              <CardDescription>Semua pelanggaran yang Anda atau pihak lain laporkan</CardDescription>
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
                            <Badge variant="outline" className="text-xs">{v.student?.class?.name}</Badge>
                            <ViolationLevelBadge level={v.level} />
                            <ViolationStatusBadge status={v.status} />
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{v.violationType?.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{v.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(v.date)} · Dilaporkan oleh {v.reportedBy?.name || "-"}
                          </p>
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

      <ViolationReportDialog
        open={violationDialog.open}
        student={violationDialog.student}
        violationTypes={violationTypes}
        onClose={() => setViolationDialog({ open: false })}
        onSuccess={() => { fetchViolations(); setViolationDialog({ open: false }); }}
      />
    </div>
  );
}

function PiketStudentRow({ student, classId, onChange }: { student: any; classId: string; onChange: () => void }) {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAtt = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const r = await fetch(`/api/attendance?studentId=${student.id}&date=${today.toISOString()}`);
    const d = await r.json();
    setAttendance(d.records?.[0] || null);
    setLoading(false);
  };

  useEffect(() => { fetchAtt(); }, [student.id]);

  const setManualStatus = async (status: string, note?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const r = await fetch("/api/attendance/manual", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        classId,
        date: today.toISOString(),
        status,
        note,
      }),
    });
    const d = await r.json();
    if (r.ok) {
      toast.success(`Status ${student.user?.name} → ${status}`);
      fetchAtt();
      onChange();
    } else {
      toast.error(d.error);
    }
  };

  return (
    <TableRow>
      <TableCell className="text-sm font-mono">{student.nis}</TableCell>
      <TableCell className="text-sm font-medium">{student.user?.name}</TableCell>
      <TableCell>
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : attendance ? <AttendanceBadge status={attendance.status} /> : <Badge variant="outline" className="text-slate-400">Belum absen</Badge>}
      </TableCell>
      <TableCell className="text-sm font-mono">{attendance?.checkInTime ? formatTime(attendance.checkInTime) : "-"}</TableCell>
      <TableCell className="text-right">
        <Select onValueChange={(v) => setManualStatus(v)}>
          <SelectTrigger className="h-7 w-32 ml-auto text-xs"><SelectValue placeholder="Set Manual" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="HADIR">Hadir</SelectItem>
            <SelectItem value="TERLAMBAT">Terlambat</SelectItem>
            <SelectItem value="IZIN">Izin</SelectItem>
            <SelectItem value="SAKIT">Sakit</SelectItem>
            <SelectItem value="ALPA">Alpa</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

function ViolationReportDialog({ open, student, violationTypes, onClose, onSuccess }: {
  open: boolean;
  student?: any;
  violationTypes: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [violationTypeId, setViolationTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!violationTypeId || !student) {
      toast.error("Lengkapi data");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          violationTypeId,
          description,
          location,
          date: new Date().toISOString(),
        }),
      });
      const d = await r.json();
      if (!r.ok) toast.error(d.error);
      else {
        toast.success("Pelanggaran dicatat & notifikasi terkirim ke wali kelas, guru BK, dan admin");
        setViolationTypeId(""); setDescription(""); setLocation("");
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
          <DialogTitle>Laporkan Pelanggaran — {student?.user?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Jenis Pelanggaran</Label>
            <Select value={violationTypeId} onValueChange={setViolationTypeId}>
              <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
              <SelectContent>
                {violationTypes.map((vt) => (
                  <SelectItem key={vt.id} value={vt.id}>
                    {vt.name} ({vt.level}, -{vt.defaultPoints} poin)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Deskripsi (opsional)</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detail kejadian..." />
          </div>
          <div>
            <Label>Lokasi</Label>
            <input className="w-full px-3 py-2 border rounded" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Gerbang, Kelas, Kantin, dll." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={loading} className="bg-violet-600 hover:bg-violet-700">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Laporkan & Kirim Notifikasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
