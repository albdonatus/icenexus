"use client";

import { NavigationGuardProvider } from "@/contexts/NavigationGuardContext";

export default function TechnicianLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <NavigationGuardProvider>{children}</NavigationGuardProvider>;
}
