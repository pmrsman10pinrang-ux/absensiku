"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatCard, ViolationLevelBadge, EmptyState, formatDate } from "../ui";
import { useAppStore, type Role } from "@/stores/app-store";
import { toast } from "sonner";
import {
  Users, School, BookOpen, AlertTriangle, MapPin, Loader2, Plus,
  UserCog, Trash2, Shield, GraduationCap
} from "lucide-react";

type DashboardData = {
  today: string;
  stats: any;
  roleData: {
    allUsers: number;
    usersByRole: { role: string; _count: number }[];
    violationTypeCount: number;
    subjectCount: number;
  };
};

export function AdminDashboard() {
  const { user, currentView } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [violationTypes, setViolationTypes] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [userDialog, setUserDialog] = useState(false);
  const [classDialog, setClassDialog] = useState(false);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [vtDialog, setVtDialog] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    const r = await fetch("/api/dashboard");
    const d = await r.json();
    setData(d);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const r = await fetch("/api/users");
    const d = await r.json();
    setUsers(d.users || []);
  };
  const fetchClasses = async () => {
    const r = await fetch("/api/classes");
    const d = await r.json();
    setClasses(d.classes || []);
  };
  const fetchSubjects = async () => {
    const r = await fetch("/api/subjects");
    const d = await r.json();
    setSubjects(d.subjects || []);
  };
  const fetchViolationTypes = async () => {
    const r = await fetch("/api/violation-types");
    const d = await r.json();
    setViolationTypes(d.types || []);
  };
  const fetchSchool = async () => {
    const r = await fetch("/api/school");
    const d = await r.json();
    setSchool(d.school);
  };

  useEffect(() => {
    fetchDashboard();
    fetchUsers(); fetchClasses(); fetchSubjects(); fetchViolationTypes(); fetchSchool();
  }, []);

  if (loading || !data) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-rose-500" /></div>;
  }

  const { roleData: rd, stats } = data;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl p-5 text-white shadow-md">
        <h2 className="text-xl font-bold">Dashboard Administrator</h2>
        <p className="text-rose-50 text-sm mt-1">{user?.name} · {formatDate(data.today)}</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full" value={currentView === "dashboard" ? "dashboard" : currentView}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="dashboard" onClick={() => useAppStore.getState().setView("dashboard")}>Dashboard</TabsTrigger>
          <TabsTrigger value="kelola-user" onClick={() => useAppStore.getState().setView("kelola-user")}>User</TabsTrigger>
          <TabsTrigger value="kelola-kelas" onClick={() => useAppStore.getState().setView("kelola-kelas")}>Kelas</TabsTrigger>
          <TabsTrigger value="kelola-mapel" onClick={() => useAppStore.getState().setView("kelola-mapel")}>Mapel</TabsTrigger>
          <TabsTrigger value="katalog-pelanggaran" onClick={() => useAppStore.getState().setView("katalog-pelanggaran")}>Pelanggaran</TabsTrigger>
          <TabsTrigger value="setting-sekolah" onClick={() => useAppStore.getState().setView("setting-sekolah")}>Sekolah</TabsTrigger>
        </TabsList>

        {/* === DASHBOARD === */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title="Total User" value={rd.allUsers} icon={Users} color="rose" />
            <StatCard title="Total Siswa" value={stats.totalStudents} icon={GraduationCap} color="emerald" />
            <StatCard title="Total Kelas" value={stats.totalClasses} icon={School} color="sky" />
            <StatCard title="Total Guru" value={stats.totalTeachers} icon={UserCog} color="violet" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User per Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rd.usersByRole.map((u) => (
                    <div key={u.role} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">{u.role}</span>
                      <Badge variant="outline">{u._count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistik Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Hadir</span><Badge className="bg-emerald-100 text-emerald-700">{stats.attendanceToday.hadir}</Badge></div>
                  <div className="flex justify-between"><span>Terlambat</span><Badge className="bg-amber-100 text-amber-700">{stats.attendanceToday.terlambat}</Badge></div>
                  <div className="flex justify-between"><span>Izin/Sakit</span><Badge className="bg-sky-100 text-sky-700">{stats.attendanceToday.izin + stats.attendanceToday.sakit}</Badge></div>
                  <div className="flex justify-between"><span>Alpa</span><Badge className="bg-rose-100 text-rose-700">{stats.attendanceToday.alpa}</Badge></div>
                  <hr className="my-2" />
                  <div className="flex justify-between"><span>Pelanggaran Total</span><Badge variant="outline">{stats.violations.total}</Badge></div>
                  <div className="flex justify-between"><span>Belum Selesai</span><Badge className="bg-amber-100 text-amber-700">{stats.violations.dilaporkan + stats.violations.diproses + stats.violations.konseling}</Badge></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === KELOLA USER === */}
        <TabsContent value="kelola-user" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Kelola User</CardTitle>
              <Button size="sm" onClick={() => setUserDialog(true)}><Plus className="h-4 w-4 mr-1" /> Tambah User</Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto -mx-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-sm font-medium">{u.name}</TableCell>
                        <TableCell className="text-xs">{u.email}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{u.role}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={u.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500"}>
                            {u.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost"
                            onClick={async () => {
                              await fetch("/api/users", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: u.id, isActive: !u.isActive }),
                              });
                              fetchUsers(); toast.success("Status diperbarui");
                            }}>
                            {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-rose-600"
                            onClick={async () => {
                              if (!confirm("Hapus user?")) return;
                              await fetch(`/api/users?id=${u.id}`, { method: "DELETE" });
                              fetchUsers(); toast.success("User dihapus");
                            }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <UserDialog open={userDialog} classes={classes} onClose={() => setUserDialog(false)} onSuccess={() => { fetchUsers(); setUserDialog(false); }} />
        </TabsContent>

        {/* === KELOLA KELAS === */}
        <TabsContent value="kelola-kelas" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Kelola Kelas</CardTitle>
              <Button size="sm" onClick={() => setClassDialog(true)}><Plus className="h-4 w-4 mr-1" /> Tambah Kelas</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {classes.map((c: any) => (
                  <div key={c.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm">{c.name}</div>
                        <div className="text-xs text-slate-500">Wali: {c.waliKelas?.name || "-"}</div>
                        <div className="text-xs text-slate-400 mt-1">{c._count?.students || 0} siswa</div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-rose-600 h-7"
                        onClick={async () => {
                          if (!confirm("Hapus kelas?")) return;
                          await fetch(`/api/classes?id=${c.id}`, { method: "DELETE" });
                          fetchClasses(); toast.success("Kelas dihapus");
                        }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <ClassDialog open={classDialog} users={users} onClose={() => setClassDialog(false)} onSuccess={() => { fetchClasses(); setClassDialog(false); }} />
        </TabsContent>

        {/* === KELOLA MAPEL === */}
        <TabsContent value="kelola-mapel" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Kelola Mata Pelajaran</CardTitle>
              <Button size="sm" onClick={() => setSubjectDialog(true)}><Plus className="h-4 w-4 mr-1" /> Tambah Mapel</Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto -mx-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Guru</TableHead>
                      <TableHead>KKM</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.code}</TableCell>
                        <TableCell className="text-sm font-medium">{s.name}</TableCell>
                        <TableCell className="text-xs">{s.class?.name}</TableCell>
                        <TableCell className="text-xs">{s.teacher?.user?.name || "-"}</TableCell>
                        <TableCell className="text-sm">{s.kkm}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="text-rose-600"
                            onClick={async () => {
                              if (!confirm("Hapus mapel?")) return;
                              await fetch(`/api/subjects?id=${s.id}`, { method: "DELETE" });
                              fetchSubjects(); toast.success("Mapel dihapus");
                            }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <SubjectDialog open={subjectDialog} classes={classes} users={users} onClose={() => setSubjectDialog(false)} onSuccess={() => { fetchSubjects(); setSubjectDialog(false); }} />
        </TabsContent>

        {/* === KATALOG PELANGGARAN === */}
        <TabsContent value="katalog-pelanggaran" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Katalog Jenis Pelanggaran</CardTitle>
              <Button size="sm" onClick={() => setVtDialog(true)}><Plus className="h-4 w-4 mr-1" /> Tambah Jenis</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {violationTypes.map((vt: any) => (
                  <div key={vt.id} className="border rounded-lg p-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{vt.name}</span>
                        <ViolationLevelBadge level={vt.level} />
                        <Badge variant="outline" className="text-xs">{vt.category}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Poin: -{vt.defaultPoints}</div>
                      {vt.description && <div className="text-xs text-slate-400 mt-0.5">{vt.description}</div>}
                    </div>
                    <Button size="sm" variant="ghost" className="text-rose-600"
                      onClick={async () => {
                        if (!confirm("Hapus jenis pelanggaran?")) return;
                        await fetch(`/api/violation-types?id=${vt.id}`, { method: "DELETE" });
                        fetchViolationTypes(); toast.success("Jenis pelanggaran dihapus");
                      }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <ViolationTypeDialog open={vtDialog} onClose={() => setVtDialog(false)} onSuccess={() => { fetchViolationTypes(); setVtDialog(false); }} />
        </TabsContent>

        {/* === SETTING SEKOLAH === */}
        <TabsContent value="setting-sekolah" className="space-y-4">
          <SchoolSettings school={school} onSaved={() => { fetchSchool(); fetchDashboard(); }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserDialog({ open, classes, onClose, onSuccess }: { open: boolean; classes: any[]; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("SISWA");
  const [phone, setPhone] = useState("");
  const [nip, setNip] = useState("");
  const [nis, setNis] = useState("");
  const [gender, setGender] = useState("L");
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !email || !password || !role) {
      toast.error("Lengkapi field wajib");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, phone, nip, nis, gender, classId }),
      });
      const d = await r.json();
      if (!r.ok) toast.error(d.error);
      else {
        toast.success("User baru dibuat");
        setName(""); setEmail(""); setPassword(""); setPhone(""); setNip(""); setNis(""); setClassId("");
        onSuccess();
      }
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Tambah User Baru</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div>
            <Label>Nama Lengkap *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password *</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label>Role *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="WALI_KELAS">Wali Kelas</SelectItem>
                <SelectItem value="GURU_BK">Guru BK</SelectItem>
                <SelectItem value="PIKET">Guru Piket</SelectItem>
                <SelectItem value="SISWA">Siswa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>No. HP</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {["WALI_KELAS", "GURU_BK", "PIKET"].includes(role) && (
            <div>
              <Label>NIP</Label>
              <Input value={nip} onChange={(e) => setNip(e.target.value)} />
            </div>
          )}
          {role === "SISWA" && (
            <>
              <div>
                <Label>NIS *</Label>
                <Input value={nis} onChange={(e) => setNis(e.target.value)} />
              </div>
              <div>
                <Label>Kelas *</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={loading} className="bg-rose-600 hover:bg-rose-700">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClassDialog({ open, users, onClose, onSuccess }: { open: boolean; users: any[]; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("X");
  const [major, setMajor] = useState("");
  const [waliKelasId, setWaliKelasId] = useState("");
  const [loading, setLoading] = useState(false);
  const waliKelasUsers = users.filter((u) => u.role === "WALI_KELAS");

  const submit = async () => {
    if (!name) { toast.error("Nama kelas wajib"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, level, major, waliKelasId }),
      });
      const d = await r.json();
      if (!r.ok) toast.error(d.error);
      else { toast.success("Kelas dibuat"); setName(""); setMajor(""); setWaliKelasId(""); onSuccess(); }
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Tambah Kelas</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nama Kelas *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="X IPA 1" /></div>
          <div>
            <Label>Tingkat</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="X">X</SelectItem><SelectItem value="XI">XI</SelectItem><SelectItem value="XII">XII</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Jurusan</Label><Input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="IPA / IPS / TKJ" /></div>
          <div>
            <Label>Wali Kelas</Label>
            <Select value={waliKelasId} onValueChange={setWaliKelasId}>
              <SelectTrigger><SelectValue placeholder="Pilih wali kelas" /></SelectTrigger>
              <SelectContent>
                {waliKelasUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={loading} className="bg-rose-600 hover:bg-rose-700">Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubjectDialog({ open, classes, users, onClose, onSuccess }: { open: boolean; classes: any[]; users: any[]; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [kkm, setKkm] = useState("75");
  const [loading, setLoading] = useState(false);
  const teachers = users.filter((u) => ["WALI_KELAS", "GURU_BK", "PIKET"].includes(u.role));

  const submit = async () => {
    if (!name || !code || !classId) { toast.error("Lengkapi field"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, classId, teacherId, kkm }),
      });
      const d = await r.json();
      if (!r.ok) toast.error(d.error);
      else { toast.success("Mapel dibuat"); setName(""); setCode(""); setClassId(""); setTeacherId(""); onSuccess(); }
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Tambah Mata Pelajaran</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nama Mapel *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Matematika" /></div>
          <div><Label>Kode Mapel *</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MAT-X-1" /></div>
          <div>
            <Label>Kelas *</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Guru Pengampu</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => <SelectItem key={t.id} value={t.teacher?.id || ""}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>KKM</Label><Input type="number" value={kkm} onChange={(e) => setKkm(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={loading} className="bg-rose-600 hover:bg-rose-700">Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViolationTypeDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("DISIPLIN");
  const [level, setLevel] = useState("RINGAN");
  const [defaultPoints, setDefaultPoints] = useState("5");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name) { toast.error("Nama wajib"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/violation-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, level, defaultPoints: parseInt(defaultPoints), description }),
      });
      const d = await r.json();
      if (!r.ok) toast.error(d.error);
      else { toast.success("Jenis pelanggaran dibuat"); setName(""); setDescription(""); onSuccess(); }
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Tambah Jenis Pelanggaran</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nama Pelanggaran *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Terlambat masuk sekolah" /></div>
          <div>
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DISIPLIN">Disiplin</SelectItem>
                <SelectItem value="KERAPIAN">Kerapian</SelectItem>
                <SelectItem value="AKHLAK">Akhlak</SelectItem>
                <SelectItem value="LAINNYA">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RINGAN">Ringan</SelectItem>
                <SelectItem value="SEDANG">Sedang</SelectItem>
                <SelectItem value="BERAT">Berat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Poin Default</Label><Input type="number" value={defaultPoints} onChange={(e) => setDefaultPoints(e.target.value)} /></div>
          <div><Label>Deskripsi</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={loading} className="bg-rose-600 hover:bg-rose-700">Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SchoolSettings({ school, onSaved }: { school: any; onSaved: () => void }) {
  const [form, setForm] = useState<any>(school || {
    name: "", address: "", latitude: -6.2088, longitude: 106.8456,
    radiusMeters: 200, checkInStart: "06:30", checkInEnd: "07:30", lateThreshold: "07:15",
    academicYear: "2025/2026", semester: "GANJIL",
  });
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => { if (school) setForm(school); }, [school]);

  const save = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/school", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) toast.error(d.error);
      else { toast.success("Setting sekolah disimpan"); onSaved(); }
    } finally { setLoading(false); }
  };

  const detectLocation = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({ ...form, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        toast.success("Lokasi terdeteksi");
        setDetecting(false);
      },
      () => { toast.error("Gagal mendeteksi lokasi"); setDetecting(false); },
      { enableHighAccuracy: true }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-5 w-5 text-rose-600" /> Setting Sekolah & Lokasi Absensi
        </CardTitle>
        <CardDescription>Konfigurasi koordinat sekolah & radius absensi</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div><Label>Nama Sekolah</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Alamat</Label><Textarea rows={2} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Latitude</Label>
            <Input type="number" step="0.000001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })} />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input type="number" step="0.000001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })} />
          </div>
        </div>
        <Button onClick={detectLocation} variant="outline" size="sm" disabled={detecting}>
          {detecting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <MapPin className="h-3 w-3 mr-1" />}
          Deteksi Lokasi Saya (jadikan pusat sekolah)
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Radius Absensi (meter)</Label><Input type="number" value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: parseInt(e.target.value) })} /></div>
          <div><Label>Tahun Ajaran</Label><Input value={form.academicYear || ""} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Jam Mulai</Label><Input type="time" value={form.checkInStart || ""} onChange={(e) => setForm({ ...form, checkInStart: e.target.value })} /></div>
          <div><Label>Jam Akhir</Label><Input type="time" value={form.checkInEnd || ""} onChange={(e) => setForm({ ...form, checkInEnd: e.target.value })} /></div>
          <div><Label>Batas Terlambat</Label><Input type="time" value={form.lateThreshold || ""} onChange={(e) => setForm({ ...form, lateThreshold: e.target.value })} /></div>
        </div>
        <div>
          <Label>Semester</Label>
          <Select value={form.semester || "GANJIL"} onValueChange={(v) => setForm({ ...form, semester: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GANJIL">Ganjil</SelectItem>
              <SelectItem value="GENAP">Genap</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={save} disabled={loading} className="bg-rose-600 hover:bg-rose-700">
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Simpan Pengaturan
        </Button>
      </CardContent>
    </Card>
  );
}
