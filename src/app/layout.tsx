import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIAS-SIS — Sistem Informasi Absensi Siswa",
  description: "Aplikasi absensi siswa berbasis scan wajah & lokasi GPS dengan manajemen penilaian dan pelanggaran terintegrasi. Mendukung 5 role: Admin, Wali Kelas, Siswa, Guru BK, dan Piket.",
  keywords: ["absensi siswa", "scan wajah", "geolocation", "supabase", "vercel", "sekolah", "pelanggaran", "penilaian"],
  authors: [{ name: "SIAS-SIS" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
