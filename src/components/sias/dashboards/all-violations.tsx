"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard, ViolationLevelBadge, ViolationStatusBadge, EmptyState, formatDate } from "../ui";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Search, Filter, Plus } from "lucide-react";

export function AllViolationsView() {
  const { user } = useAppStore();
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const fetchViolations = async () => {
    setLoading(true);
    const r = await fetch("/api/violations");
    const d = await r.json();
    setViolations(d.violations || []);
    setLoading(false);
  };

  useEffect(() => { fetchViolations(); }, []);

  const filtered = violations.filter((v) => {
    if (filterStatus !== "ALL" && v.status !== filterStatus) return false;
    if (filterLevel !== "ALL" && v.level !== filterLevel) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!v.student?.user?.name?.toLowerCase().includes(q) && !v.violationType?.name?.toLowerCase().includes(q) && !v.description?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const total = violations.length;
  const totalPoints = violations.reduce((s, v) => s + v.points, 0);
  const pending = violations.filter((v) => ["DILAPORKAN", "DIPROSES", "KONSELING"].includes(v.status)).length;

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Total Pelanggaran" value={total} icon={AlertTriangle} color="rose" />
        <StatCard title="Total Poin" value={totalPoints} icon={AlertTriangle} color="amber" />
        <StatCard title="Belum Selesai" value={pending} icon={Filter} color="violet" />
        <StatCard title="Selesai" value={violations.filter(v => v.status === "SELESAI").length} icon={Filter} color="emerald" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Semua Pelanggaran</CardTitle>
          <CardDescription>Filter & cari semua pelanggaran tercatat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama siswa / jenis pelanggaran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DILAPORKAN">Dilaporkan</SelectItem>
                <SelectItem value="DIPROSES">Diproses</SelectItem>
                <SelectItem value="KONSELING">Konseling</SelectItem>
                <SelectItem value="SELESAI">Selesai</SelectItem>
                <SelectItem value="DITOLAK">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Level</SelectItem>
                <SelectItem value="RINGAN">Ringan</SelectItem>
                <SelectItem value="SEDANG">Sedang</SelectItem>
                <SelectItem value="BERAT">Berat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Tidak ada pelanggaran" icon={AlertTriangle} />
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map((v) => (
                <div key={v.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{v.student?.user?.name}</span>
                        <Badge variant="outline" className="text-xs">{v.student?.class?.name}</Badge>
                        <ViolationLevelBadge level={v.level} />
                        <ViolationStatusBadge status={v.status} />
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{v.violationType?.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{v.description}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(v.date)} · Dilaporkan oleh {v.reportedBy?.name || "-"}
                        {v.handledBy && ` · Ditangani ${v.handledBy.name}`}
                      </p>
                      {v.handlerNote && (
                        <p className="text-xs text-slate-700 mt-2 p-2 bg-amber-50 rounded border border-amber-100">
                          <strong>Tindak lanjut:</strong> {v.handlerNote}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">-{v.points} poin</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
