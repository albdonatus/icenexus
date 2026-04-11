"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Usuários", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#f8f8fb]">
      {/* Sidebar */}
      <aside className="w-56 min-h-screen bg-gray-950 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center justify-center px-5 py-[18px] border-b border-gray-800">
          <Image src="/LOGO_COR.png" alt="Ice Nexus" width={110} height={33} className="object-contain brightness-0 invert opacity-80" priority />
        </div>

        {/* Admin badge */}
        <div className="mx-3 mt-4 mb-2 flex items-center gap-2 bg-violet-600/20 border border-violet-500/30 rounded-xl px-3 py-2">
          <Shield className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-violet-300">Super Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all",
                  active
                    ? "bg-violet-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-gray-800 pt-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
