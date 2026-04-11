"use client";

import { useNavigationGuard } from "@/contexts/NavigationGuardContext";

export function useUnsavedWarning() {
  return useNavigationGuard();
}
