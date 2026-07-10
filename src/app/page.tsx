"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { useAuth } from "@/hooks/use-auth";
import { LoginPage } from "@/components/sias/login-page";
import { SetupWizard } from "@/components/sias/setup-wizard";
import { AppShell } from "@/components/sias/app-shell";
import { SiswaDashboard } from "@/components/sias/dashboards/siswa-dashboard";
import { WaliKelasDashboard } from "@/components/sias/dashboards/wali-kelas-dashboard";
import { PiketDashboard } from "@/components/sias/dashboards/piket-dashboard";
import { GuruBKDashboard } from "@/components/sias/dashboards/guru-bk-dashboard";
import { AdminDashboard } from "@/components/sias/dashboards/admin-dashboard";
import { AllViolationsView } from "@/components/sias/dashboards/all-violations";
import { Loader2 } from "lucide-react";

type AppState = "loading" | "needs-setup" | "login" | "dashboard";

export default function Home() {
  const { user, loading } = useAuth();
  const { currentView, setView } = useAppStore();
  const [setupStatus, setSetupStatus] = useState<"loading" | "needs-setup" | "ready">("loading");

  // Cek apakah perlu setup (database belum punya user)
  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((d) => {
        setSetupStatus(d.needsSetup ? "needs-setup" : "ready");
      })
      .catch(() => setSetupStatus("ready"));
  }, []);

  // Reset view when user changes
  useEffect(() => {
    setView("dashboard");
  }, [user?.id]);

  // Tentukan state aplikasi
  let state: AppState = "loading";
  if (loading || setupStatus === "loading") {
    state = "loading";
  } else if (setupStatus === "needs-setup" && !user) {
    state = "needs-setup";
  } else if (!user) {
    state = "login";
  } else {
    state = "dashboard";
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Memuat...</p>
        </div>
      </div>
    );
  }

  if (state === "needs-setup") {
    return (
      <>
        <SetupWizard />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  if (state === "login") {
    return (
      <>
        <LoginPage />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  // Route to dashboard content based on role + currentView
  const renderContent = () => {
    // All roles can view "All Violations"
    if (currentView === "pelanggaran-semua" && user.role !== "SISWA") {
      return <AllViolationsView />;
    }

    switch (user.role) {
      case "SISWA":
        return <SiswaDashboard />;
      case "WALI_KELAS":
        return <WaliKelasDashboard />;
      case "PIKET":
        return <PiketDashboard />;
      case "GURU_BK":
        return <GuruBKDashboard />;
      case "ADMIN":
        return <AdminDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <>
      <AppShell>{renderContent()}</AppShell>
      <Toaster richColors position="top-right" />
    </>
  );
}
