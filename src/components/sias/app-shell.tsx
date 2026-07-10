"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  GraduationCap,
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  AlertTriangle,
  Users,
  School,
  Settings,
  Bell,
  LogOut,
  Menu,
  ScanFace,
  BookOpen,
  MapPin,
  FileText,
  MessageSquare,
  ChevronRight,
  UserCog,
  User as UserIcon,
} from "lucide-react";
import { useAppStore, ROLE_LABELS, ROLE_COLORS, type Role } from "@/stores/app-store";
import { toast } from "sonner";

type NavItem = {
  key: string;
  label: string;
  icon: any;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "WALI_KELAS", "SISWA", "GURU_BK", "PIKET"] },
  // Siswa
  { key: "absen", label: "Absensi (Scan Wajah)", icon: ScanFace, roles: ["SISWA"] },
  { key: "riwayat-absen", label: "Riwayat Absensi", icon: CalendarCheck, roles: ["SISWA"] },
  { key: "nilai-saya", label: "Nilai Saya", icon: BookOpen, roles: ["SISWA"] },
  // Wali Kelas
  { key: "absensi-kelas", label: "Absensi Kelas", icon: CalendarCheck, roles: ["WALI_KELAS"] },
  { key: "rekap-nilai", label: "Rekap Nilai", icon: BookOpen, roles: ["WALI_KELAS"] },
  { key: "input-nilai", label: "Input Nilai", icon: FileText, roles: ["WALI_KELAS"] },
  { key: "pelanggaran-kelas", label: "Pelanggaran Kelas", icon: AlertTriangle, roles: ["WALI_KELAS"] },
  // Piket
  { key: "pantau-absensi", label: "Pantau Absensi Harian", icon: ClipboardList, roles: ["PIKET"] },
  { key: "input-manual", label: "Input Absensi Manual", icon: CalendarCheck, roles: ["PIKET"] },
  { key: "piket-laporan", label: "Laporan Pelanggaran", icon: AlertTriangle, roles: ["PIKET"] },
  // Guru BK
  { key: "pelanggaran-bk", label: "Antrian Pelanggaran", icon: AlertTriangle, roles: ["GURU_BK"] },
  { key: "konseling", label: "Catatan Konseling", icon: MessageSquare, roles: ["GURU_BK"] },
  { key: "profil-siswa", label: "Profil Siswa", icon: UserIcon, roles: ["GURU_BK"] },
  // Admin
  { key: "kelola-user", label: "Kelola User", icon: UserCog, roles: ["ADMIN"] },
  { key: "kelola-kelas", label: "Kelola Kelas", icon: School, roles: ["ADMIN"] },
  { key: "kelola-mapel", label: "Kelola Mapel", icon: BookOpen, roles: ["ADMIN"] },
  { key: "katalog-pelanggaran", label: "Katalog Pelanggaran", icon: AlertTriangle, roles: ["ADMIN"] },
  { key: "setting-sekolah", label: "Setting Sekolah & Lokasi", icon: MapPin, roles: ["ADMIN"] },
  // Umum
  { key: "pelanggaran-semua", label: "Semua Pelanggaran", icon: AlertTriangle, roles: ["WALI_KELAS", "PIKET", "GURU_BK", "ADMIN"] },
  { key: "notifikasi", label: "Notifikasi", icon: Bell, roles: ["ADMIN", "WALI_KELAS", "SISWA", "GURU_BK", "PIKET"] },
];

type Props = {
  children: React.ReactNode;
};

export function AppShell({ children }: Props) {
  const { user, currentView, setView, logout } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; isRead: boolean; createdAt: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const visibleItems = useMemo(() => {
    if (!user) return [];
    return NAV_ITEMS.filter((i) => i.roles.includes(user.role));
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const r = await fetch("/api/notifications");
      const d = await r.json();
      setNotifications(d.notifications || []);
      setUnreadCount(d.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 30000);
    return () => clearInterval(t);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    fetchNotifications();
  };

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 leading-tight">SIAS-SIS</h2>
            <p className="text-xs text-slate-500 leading-tight">Sistem Absensi Siswa</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setView(item.key);
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2.5 transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-emerald-600" : "text-slate-500"}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {active && <ChevronRight className="h-3 w-3 text-emerald-500" />}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              logout();
              toast.success("Berhasil logout");
            }}
            className="h-8 w-8"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-white flex-col">{SidebarContent}</aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          {SidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b bg-white sticky top-0 z-30">
          <div className="px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <div className="md:hidden">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                  <GraduationCap className="h-4 w-4" />
                </div>
              </div>
              <div className="hidden md:block">
                <h1 className="font-semibold text-slate-900 text-base">
                  {visibleItems.find((i) => i.key === currentView)?.label || "Dashboard"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`hidden sm:inline-flex ${user ? ROLE_COLORS[user.role] : ""}`}
              >
                {user ? ROLE_LABELS[user.role] : ""}
              </Badge>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm font-semibold">Notifikasi</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-emerald-600 hover:underline">
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <ScrollArea className="max-h-80">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">Tidak ada notifikasi</div>
                    ) : (
                      notifications.slice(0, 15).map((n) => (
                        <DropdownMenuItem key={n.id} className="flex-col items-start py-2 px-3">
                          <div className="flex items-center gap-2 w-full">
                            <div className={`w-1.5 h-1.5 rounded-full ${n.isRead ? "bg-slate-300" : "bg-emerald-500"}`} />
                            <span className="text-sm font-medium flex-1">{n.title}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 pl-3.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-slate-400 mt-1 pl-3.5">
                            {new Date(n.createdAt).toLocaleString("id-ID")}
                          </p>
                        </DropdownMenuItem>
                      ))
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{user?.name}</span>
                      <span className="text-xs font-normal text-slate-500">{user?.email}</span>
                      <Badge variant="outline" className={`mt-1 w-fit text-[10px] ${user ? ROLE_COLORS[user.role] : ""}`}>
                        {user ? ROLE_LABELS[user.role] : ""}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      toast.success("Berhasil logout");
                    }}
                    className="text-red-600 focus:text-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
