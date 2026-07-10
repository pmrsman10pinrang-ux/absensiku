"use client";

import { create } from "zustand";

export type Role = "ADMIN" | "WALI_KELAS" | "SISWA" | "GURU_BK" | "PIKET";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  avatarUrl: string | null;
  teacher: { id: string; nip: string } | null;
  student: {
    id: string;
    nis: string;
    classId: string;
    className: string;
    photoUrl: string | null;
  } | null;
};

type AppState = {
  user: AuthUser | null;
  loading: boolean;
  currentView: string;
  setUser: (u: AuthUser | null) => void;
  setLoading: (b: boolean) => void;
  setView: (v: string) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

export const useAppStore = create<AppState>((set) => ({
  user: null,
  loading: true,
  currentView: "dashboard",
  setUser: (u) => set({ user: u }),
  setLoading: (b) => set({ loading: b }),
  setView: (v) => set({ currentView: v }),
  logout: async () => {
    await fetch("/api/auth", { method: "DELETE" });
    set({ user: null, currentView: "dashboard" });
  },
  fetchMe: async () => {
    try {
      const r = await fetch("/api/auth");
      const d = await r.json();
      set({ user: d.user || null, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  WALI_KELAS: "Wali Kelas",
  SISWA: "Siswa",
  GURU_BK: "Guru BK",
  PIKET: "Guru Piket",
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-rose-100 text-rose-700 border-rose-200",
  WALI_KELAS: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SISWA: "bg-sky-100 text-sky-700 border-sky-200",
  GURU_BK: "bg-amber-100 text-amber-700 border-amber-200",
  PIKET: "bg-violet-100 text-violet-700 border-violet-200",
};
