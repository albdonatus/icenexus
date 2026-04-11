"use client";

import { NavigationGuardProvider } from "@/contexts/NavigationGuardContext";

export default function ManagerLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <NavigationGuardProvider>{children}</NavigationGuardProvider>;
}
