"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import UnsavedWarningModal from "@/components/ui/UnsavedWarningModal";

interface NavigationGuardValue {
  isDirty: boolean;
  markDirty: () => void;
  markClean: () => void;
  navigate: (href: string) => void;
  showModal: boolean;
  confirmLeave: () => void;
  cancelLeave: () => void;
}

const NavigationGuardContext = createContext<NavigationGuardValue | null>(null);

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const pendingHref = useRef("");

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const navigate = useCallback((href: string) => {
    if (isDirty) {
      pendingHref.current = href;
      setShowModal(true);
    } else {
      router.push(href);
    }
  }, [isDirty, router]);

  const confirmLeave = useCallback(() => {
    setIsDirty(false);
    setShowModal(false);
    router.push(pendingHref.current);
  }, [router]);

  const cancelLeave = useCallback(() => {
    setShowModal(false);
    pendingHref.current = "";
  }, []);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  return (
    <NavigationGuardContext.Provider value={{ isDirty, markDirty, markClean, navigate, showModal, confirmLeave, cancelLeave }}>
      {showModal && <UnsavedWarningModal onConfirm={confirmLeave} onCancel={cancelLeave} />}
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) throw new Error("useNavigationGuard must be used within NavigationGuardProvider");
  return ctx;
}
