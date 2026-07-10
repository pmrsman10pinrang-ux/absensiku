"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MapPin,
  ScanFace,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type Props = {
  onVerified: (data: {
    faceDescriptor: number[];
    faceConfidence: number;
    faceImage: string;
  }) => void;
  expectedName?: string;
  autoStart?: boolean;
};

/**
 * FaceScan — Komponen scan wajah untuk absensi siswa.
 * Menggunakan webcam browser + canvas untuk capture.
 * Pada produksi, integrasikan face-api.js untuk:
 *  - Load model dari /public/models (face_landmark_68, face_recognition, ssd_mobilenetv1)
 *  - Deteksi wajah real-time di video stream
 *  - Generate face descriptor (128D embedding)
 *  - Bandingkan dengan stored descriptor di database (lihat /api/face/verify)
 *
 * Demo mode: generate pseudo-random descriptor dan confidence simulated.
 */
export function FaceScan({ onVerified, expectedName, autoStart = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState<"idle" | "starting" | "detecting" | "verifying" | "success" | "failed" | "error">("idle");
  const [confidence, setConfidence] = useState(0);
  const [faceImage, setFaceImage] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setStatus("starting");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setStatus("detecting");
    } catch (e: any) {
      console.error("Camera error:", e);
      setErrorMsg(
        e.name === "NotAllowedError"
          ? "Akses kamera ditolak. Izinkan kamera di pengaturan browser."
          : "Tidak dapat mengakses kamera: " + e.message
      );
      setStatus("error");
    }
  }, []);

  const captureAndVerify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setStatus("verifying");
    setProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // mirror capture (karena video di-mirror)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.7);
    setFaceImage(imageData);

    // === Demo: simulate face detection & recognition ===
    // Pada produksi: load face-api.js models dan jalankan:
    //   const detection = await faceapi.detectSingleFace(video, options).withFaceLandmarks().withFaceDescriptor();
    //   if (!detection) throw new Error("Wajah tidak terdeteksi");
    //   const faceDescriptor = Array.from(detection.descriptor);
    //   const faceConfidence = 1 - detection.detection.score;
    //   ...
    await new Promise((r) => setTimeout(r, 400));
    setProgress(30);

    // Generate pseudo descriptor (demo)
    const faceDescriptor = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
    await new Promise((r) => setTimeout(r, 400));
    setProgress(60);

    // Simulate face match confidence
    const simulatedConfidence = 0.78 + Math.random() * 0.2;
    setConfidence(simulatedConfidence);
    await new Promise((r) => setTimeout(r, 400));
    setProgress(100);

    if (simulatedConfidence > 0.6) {
      setStatus("success");
      onVerified({
        faceDescriptor,
        faceConfidence: simulatedConfidence,
        faceImage: imageData,
      });
    } else {
      setStatus("failed");
      setErrorMsg("Verifikasi wajah gagal. Pastikan wajah terlihat jelas dan pencahayaan cukup.");
    }
  }, [onVerified]);

  const reset = useCallback(() => {
    setStatus("detecting");
    setConfidence(0);
    setFaceImage("");
    setProgress(0);
    setErrorMsg("");
  }, []);

  useEffect(() => {
    if (autoStart) startCamera();
    return () => stopCamera();
  }, [autoStart, startCamera, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanFace className="h-5 w-5 text-emerald-600" />
          Verifikasi Wajah
          {expectedName && (
            <Badge variant="outline" className="ml-auto text-xs">
              {expectedName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
          {/* Video preview */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${cameraOn && status !== "success" ? "" : "hidden"}`}
          />

          {/* Captured image */}
          {status === "success" && faceImage && (
            <img src={faceImage} alt="captured" className="w-full h-full object-cover" />
          )}

          {/* Idle / error overlay */}
          {(!cameraOn || status === "error") && (
            <div className="text-center text-white p-4">
              <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Kamera belum aktif</p>
            </div>
          )}

          {/* Face frame overlay */}
          {cameraOn && status !== "success" && status !== "error" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-40 h-52 border-2 border-emerald-400 rounded-2xl opacity-70" />
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <Badge className={status === "verifying" ? "bg-amber-500" : "bg-emerald-500"}>
                  {status === "starting" && "Memulai kamera..."}
                  {status === "detecting" && "Arahkan wajah ke kamera"}
                  {status === "verifying" && "Memverifikasi..."}
                </Badge>
              </div>
            </div>
          )}

          {status === "verifying" && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
              <Progress value={progress} className="h-1.5 bg-white/20" />
              <p className="text-xs text-white mt-1.5 text-center">
                Memproses... {progress}%
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="absolute top-4 right-4">
              <div className="bg-emerald-500 text-white rounded-full p-1.5">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="absolute top-4 right-4">
              <div className="bg-red-500 text-white rounded-full p-1.5">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          )}
        </div>

        {status === "success" && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-700 font-medium">Wajah terverifikasi</span>
              <Badge className="bg-emerald-600">
                {Math.round(confidence * 100)}% match
              </Badge>
            </div>
            <Progress value={confidence * 100} className="h-1.5 mt-2 bg-emerald-100" />
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {!cameraOn && status !== "error" && (
            <Button onClick={startCamera} className="flex-1">
              <Camera className="h-4 w-4 mr-2" /> Aktifkan Kamera
            </Button>
          )}
          {cameraOn && status === "detecting" && (
            <Button onClick={captureAndVerify} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <ScanFace className="h-4 w-4 mr-2" /> Scan Wajah
            </Button>
          )}
          {status === "failed" && (
            <Button onClick={reset} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" /> Coba Lagi
            </Button>
          )}
          {cameraOn && (
            <Button onClick={stopCamera} variant="outline" size="sm">
              Matikan Kamera
            </Button>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <p className="text-xs text-slate-500 leading-relaxed">
          <MapPin className="h-3 w-3 inline mr-1" />
          Foto wajah dipakai hanya untuk verifikasi absensi dan tidak dibagikan.
          Pada produksi, integrasikan <code className="text-xs bg-slate-100 px-1 rounded">face-api.js</code> dengan
          model face recognition untuk pencocokan wajah nyata.
        </p>
      </CardContent>
    </Card>
  );
}
