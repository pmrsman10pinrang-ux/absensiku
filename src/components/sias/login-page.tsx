"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/stores/app-store";
import {
  GraduationCap, Loader2, LogIn, Eye, EyeOff, Mail, Lock,
  Shield, BookOpen, User as UserIcon, Clock, Info,
} from "lucide-react";
import { toast } from "sonner";

export function LoginPage() {
  const { setUser } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d.error || "Login gagal");
      } else {
        setUser(d.user);
        toast.success(`Selamat datang, ${d.user.name}!`);
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
              <p className="text-xs text-slate-500 leading-tight">Sistem Informasi Absensi Siswa</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex">
            v1.0
          </Badge>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-2">
                <GraduationCap className="h-7 w-7" />
              </div>
              <CardTitle className="flex items-center gap-2 justify-center">
                <LogIn className="h-5 w-5 text-emerald-600" />
                Masuk ke Akun
              </CardTitle>
              <CardDescription>
                Gunakan kredensial yang diberikan administrator sekolah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-3 w-3 inline mr-1" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@namasekolah.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">
                      <Lock className="h-3 w-3 inline mr-1" /> Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showPassword ? "Sembunyikan" : "Tampilkan"}
                    </button>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
                  Masuk
                </Button>
              </form>

              <Separator className="my-4" />

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-slate-700 space-y-1">
                    <p className="font-medium text-blue-900">Belum punya akun?</p>
                    <p>
                      Akun dibuat oleh <strong>administrator sekolah</strong>. Hubungi admin
                      sekolah Anda untuk mendapatkan email & password.
                    </p>
                    <p className="text-slate-500">
                      Jika ini instalasi pertama, sistem akan otomatis menampilkan halaman
                      pembuatan akun admin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-slate-50 rounded">
                  <Shield className="h-3 w-3" /> Admin
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-slate-50 rounded">
                  <BookOpen className="h-3 w-3" /> Wali Kelas
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-slate-50 rounded">
                  <UserIcon className="h-3 w-3" /> Guru BK
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-slate-50 rounded">
                  <Clock className="h-3 w-3" /> Guru Piket
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm py-3">
        <div className="container mx-auto px-4 text-center text-xs text-slate-500">
          SIAS-SIS · Absensi via Wajah & Lokasi · Supabase · Vercel · GitHub
        </div>
      </footer>
    </div>
  );
}
