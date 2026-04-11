"use client";

import { usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import Link from "next/link";

const pageTitles: Record<string, string> = {
  "/manager": "Home",
  "/manager/service-orders": "Ordens de Serviço",
  "/manager/clients": "Clientes",
  "/manager/technicians": "Equipe",
  "/manager/equipment": "Equipamentos",
  "/manager/checklists": "Checklists",
};

function getTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [key, val] of Object.entries(pageTitles)) {
    if (pathname.startsWith(key + "/")) return val;
  }
  return "Dashboard";
}

export default function TopHeader() {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const isHome = pathname === "/manager";

  return (
    <header className="h-13 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10 flex-shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs">
        <Link href="/manager" className="text-gray-400 hover:text-violet-600 transition-colors">
          <Home className="w-3.5 h-3.5" />
        </Link>
        {!isHome && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-gray-700 font-medium">{title}</span>
          </>
        )}
      </nav>

      {/* Right side: date */}
      <DateDisplay />
    </header>
  );
}

function DateDisplay() {
  const now = new Date();
  const formatted = now.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <span className="text-xs text-gray-400 font-medium capitalize hidden sm:block">
      {formatted}
    </span>
  );
}
