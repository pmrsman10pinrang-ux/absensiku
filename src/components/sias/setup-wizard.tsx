"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import {
  GraduationCap, Loader2, Shield, MapPin, UserPlus, CheckCircle2,
  Eye, EyeOff, Building2, Globe, Lock, User as UserIcon, Phone, Mail,
} from "lucide-react";

export function SetupWizard() {
  const { setUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Admin fields
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  // School fields
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolLatitude, setSchoolLatitude] = useState("");
  const [schoolLongitude, setSchoolLongitude] = useState("");
  const [schoolRadius, setSchoolRadius] = useState("200");
  const [academicYear, setAcademicYear] = useState(
    `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`
  );
  const [semester, setSemester] = useState("GANJIL");
  const [checkInStart, setCheckInStart] = useState("06:30");
  const [checkInEnd, setCheckInEnd] = useState("07:30");
  const [lateThreshold, setLateThreshold] = useState("07:15");
  const [detecting, setDetecting] = useState(false);

  const detectLocation = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung GPS");
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSchoolLatitude(pos.coords.latitude.toFixed(6));
        setSchoolLongitude(pos.coords.longitude.toFixed(6));
        toast.success("Lokasi sekolah terdeteksi");
        setDetecting(false);
      },
      (err) => {
        toast.error("Gagal mendeteksi lokasi: " + err.message);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminName || !adminEmail || !adminPassword) {
      toast.error("Nama, email, dan password admin wajib diisi");
      return;
    }
    if (adminPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    if (!schoolName || !schoolAddress) {
      toast.error("Nama dan alamat sekolah wajib diisi");
      return;
    }
    if (!schoolLatitude || !schoolLongitude) {
      toast.error("Koordinat sekolah wajib diisi (klik deteksi lokasi atau isi manual)");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminName, adminEmail, adminPassword, adminPhone,
          schoolName, schoolAddress,
          schoolLatitude, schoolLongitude,
          schoolRadiusMeters: schoolRadius,
          academicYear, semester,
          checkInStart, checkInEnd, lateThreshold,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error || "Setup gagal");
      } else {
        toast.success("Setup berhasil! Mengarahkan ke dashboard...");
        // Fetch user data dari /api/auth (sudah di-set cookie)
        const me = await fetch("/api/auth");
        const meData = await me.json();
        if (meData.user) {
          setUser(meData.user);
        }
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">SIAS-SIS</h1>
              <p className="text-xs text-slate-500 leading-tight">Setup Awal Sistem</p>
            </div>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Shield className="h-3 w-3 mr-1" /> Setup Pertama Kali
          </Badge>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Selamat Datang di SIAS-SIS</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
              Sistem belum memiliki akun admin. Lengkapi form di bawah untuk membuat akun
              administrator pertama dan konfigurasi sekolah. Setelah ini, admin dapat menambahkan
              user lain (wali kelas, guru BK, piket, siswa) melalui dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-5">
            {/* === KARTU ADMIN === */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-rose-600" />
                  Akun Administrator
                </CardTitle>
                <CardDescription>
                  Akun ini akan memiliki akses penuh ke seluruh sistem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="adminName">
                    <UserIcon className="h-3 w-3 inline mr-1" /> Nama Lengkap Admin *
                  </Label>
                  <Input
                    id="adminName"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Contoh: Ahmad Fauzi, S.Kom"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adminEmail">
                    <Mail className="h-3 w-3 inline mr-1" /> Email *
                  </Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@namasekolah.sch.id"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adminPassword">
                    <Lock className="h-3 w-3 inline mr-1" /> Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Gunakan password yang kuat & mudah diingat.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adminPhone">
                    <Phone className="h-3 w-3 inline mr-1" /> No. HP (opsional)
                  </Label>
                  <Input
                    id="adminPhone"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="0812xxxxxxx"
                  />
                </div>
              </CardContent>
            </Card>

            {/* === KARTU SEKOLAH === */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Konfigurasi Sekolah
                </CardTitle>
                <CardDescription>
                  Data sekolah & zona absensi (GPS)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nama Sekolah *</Label>
                  <Input
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="SMK Negeri 1 Nusantara"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Alamat Sekolah *</Label>
                  <Input
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    placeholder="Jl. Pendidikan No. 1, Jakarta"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    <MapPin className="h-3 w-3 inline mr-1" /> Koordinat Lokasi Sekolah *
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      step="0.000001"
                      value={schoolLatitude}
                      onChange={(e) => setSchoolLatitude(e.target.value)}
                      placeholder="Latitude (-6.2088)"
                    />
                    <Input
                      type="number"
                      step="0.000001"
                      value={schoolLongitude}
                      onChange={(e) => setSchoolLongitude(e.target.value)}
                      placeholder="Longitude (106.8456)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={detectLocation}
                    disabled={detecting}
                    className="mt-1"
                  >
                    {detecting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <MapPin className="h-3 w-3 mr-1" />}
                    Deteksi Lokasi Saya (lokasi sekolah saat ini)
                  </Button>
                  <p className="text-xs text-slate-500">
                    Lakukan deteksi saat berada di lokasi sekolah agar koordinat akurat.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Radius Absensi (meter)</Label>
                  <Input
                    type="number"
                    value={schoolRadius}
                    onChange={(e) => setSchoolRadius(e.target.value)}
                    placeholder="200"
                  />
                  <p className="text-xs text-slate-500">
                    Siswa hanya bisa absen dalam radius ini dari lokasi sekolah.
                  </p>
                </div>

                <Separator className="my-2" />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Jam Mulai</Label>
                    <Input type="time" value={checkInStart} onChange={(e) => setCheckInStart(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Jam Akhir</Label>
                    <Input type="time" value={checkInEnd} onChange={(e) => setCheckInEnd(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Batas Terlambat</Label>
                    <Input type="time" value={lateThreshold} onChange={(e) => setLateThreshold(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Tahun Ajaran</Label>
                    <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025/2026" />
                  </div>
                  <div>
                    <Label className="text-xs">Semester</Label>
                    <select
                      className="w-full px-3 py-2 border rounded text-sm"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                    >
                      <option value="GANJIL">Ganjil</option>
                      <option value="GENAP">Genap</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit button spanning both columns */}
            <div className="lg:col-span-2">
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        Siap menyelesaikan setup?
                      </p>
                      <p className="text-xs text-slate-600 mb-3">
                        Setelah setup selesai, Anda akan otomatis login sebagai admin dan dapat:
                      </p>
                      <ul className="text-xs text-slate-600 space-y-0.5 mb-3 list-disc list-inside">
                        <li>Menambah akun wali kelas, guru BK, guru piket, dan siswa</li>
                        <li>Membuat kelas dan mata pelajaran</li>
                        <li>Mengelola katalog jenis pelanggaran</li>
                        <li>Mengubah konfigurasi sekolah kapan saja</li>
                      </ul>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan Setup...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" /> Buat Akun Admin & Selesaikan Setup
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm py-3">
        <div className="container mx-auto px-4 text-center text-xs text-slate-500">
          SIAS-SIS · Sistem Informasi Absensi Siswa · Setup Pertama Kali
        </div>
      </footer>
    </div>
  );
}
