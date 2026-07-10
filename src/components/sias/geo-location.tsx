"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type School = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

type Props = {
  school: School | null;
  onLocation: (data: { latitude: number; longitude: number; valid: boolean; distance: number }) => void;
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function GeoLocation({ school, onLocation }: Props) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "denied">("idle");
  const [distance, setDistance] = useState<number | null>(null);
  const [valid, setValid] = useState<boolean>(false);
  const [error, setError] = useState("");

  const detect = () => {
    setStatus("loading");
    setError("");
    if (!navigator.geolocation) {
      setStatus("error");
      setError("Browser tidak mendukung GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        if (school) {
          const dist = haversine(latitude, longitude, school.latitude, school.longitude);
          setDistance(dist);
          const isValid = dist <= school.radiusMeters;
          setValid(isValid);
          setStatus("success");
          onLocation({ latitude, longitude, valid: isValid, distance: dist });
        } else {
          setStatus("error");
          setError("Konfigurasi sekolah belum tersedia");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setError("Izin lokasi ditolak. Aktifkan di pengaturan browser.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus("error");
          setError("Posisi tidak tersedia. Coba lagi di luar ruangan.");
        } else if (err.code === err.TIMEOUT) {
          setStatus("error");
          setError("Timeout. Coba lagi.");
        } else {
          setStatus("error");
          setError("Gagal mendapatkan lokasi");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    // auto-detect on mount
    detect();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Navigation className="h-5 w-5 text-emerald-600" />
          Verifikasi Lokasi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {school && (
          <div className="rounded-lg bg-slate-50 border p-3 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-medium text-slate-700">{school.name}</span>
            </div>
            <div className="text-xs text-slate-500 pl-5">{school.address}</div>
            <div className="text-xs text-slate-500 pl-5">
              Radius absensi: <span className="font-mono">{school.radiusMeters}m</span>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Mendeteksi lokasi GPS...
          </div>
        )}

        {status === "success" && location && (
          <div
            className={`rounded-lg border p-3 space-y-2 ${
              valid ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                {valid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                {valid ? "Lokasi valid" : "Di luar radius sekolah"}
              </span>
              <Badge variant={valid ? "default" : "destructive"} className={valid ? "bg-emerald-600" : ""}>
                {distance}m dari sekolah
              </Badge>
            </div>
            <div className="text-xs text-slate-600 font-mono">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          </div>
        )}

        {(status === "error" || status === "denied") && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {status === "idle" && (
          <div className="text-sm text-slate-500">
            Klik tombol di bawah untuk mendeteksi lokasi Anda.
          </div>
        )}

        <Button
          onClick={detect}
          variant={status === "success" && valid ? "outline" : "default"}
          size="sm"
          disabled={status === "loading"}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${status === "loading" ? "animate-spin" : ""}`} />
          {status === "success" ? "Deteksi Ulang" : "Deteksi Lokasi"}
        </Button>
      </CardContent>
    </Card>
  );
}
