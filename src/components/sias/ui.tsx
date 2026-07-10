"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "emerald",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "emerald" | "rose" | "amber" | "sky" | "violet" | "slate";
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    sky: "bg-sky-50 text-sky-600 border-sky-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", colors[color])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AttendanceBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    HADIR: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Hadir" },
    TERLAMBAT: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Terlambat" },
    IZIN: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "Izin" },
    SAKIT: { color: "bg-violet-100 text-violet-700 border-violet-200", label: "Sakit" },
    ALPA: { color: "bg-rose-100 text-rose-700 border-rose-200", label: "Alpa" },
  };
  const v = map[status] || map.ALPA;
  return (
    <Badge variant="outline" className={v.color}>
      {v.label}
    </Badge>
  );
}

export function ViolationLevelBadge({ level }: { level: string }) {
  const map: Record<string, { color: string; label: string }> = {
    RINGAN: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Ringan" },
    SEDANG: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Sedang" },
    BERAT: { color: "bg-rose-100 text-rose-700 border-rose-200", label: "Berat" },
  };
  const v = map[level] || map.RINGAN;
  return (
    <Badge variant="outline" className={v.color}>
      {v.label}
    </Badge>
  );
}

export function ViolationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    DILAPORKAN: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Dilaporkan" },
    DIPROSES: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "Diproses" },
    KONSELING: { color: "bg-violet-100 text-violet-700 border-violet-200", label: "Konseling" },
    SELESAI: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Selesai" },
    DITOLAK: { color: "bg-rose-100 text-rose-700 border-rose-200", label: "Ditolak" },
  };
  const v = map[status] || map.DILAPORKAN;
  return (
    <Badge variant="outline" className={v.color}>
      {v.label}
    </Badge>
  );
}

export function EmptyState({ title, description, icon: Icon }: { title: string; description?: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="h-10 w-10 text-slate-300 mb-3" />}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}

export function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function formatTime(d: string | Date | null) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
