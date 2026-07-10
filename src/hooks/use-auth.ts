"use client";

import { useEffect, useState } from "react";
import { useAppStore, type AuthUser } from "@/stores/app-store";

export function useAuth() {
  const { user, loading, fetchMe, logout, setUser } = useAppStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetchMe().finally(() => setHydrated(true));
  }, [fetchMe]);

  return { user, loading: loading && !hydrated, logout, setUser, fetchMe };
}

export type { AuthUser };
