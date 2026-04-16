"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigationGuard } from "@/contexts/NavigationGuardContext";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCog,
  Wrench,
  Snowflake,
  HelpCircle,
  LogOut,
  UserCircle,
  FileText,
  Radio,
  LineChart,
} from "lucide-react";
import ProfilePanel from "@/components/profile/ProfilePanel";

const navItems = [
  { href: "/manager", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/manager/service-orders", label: "Ordens de Serviço", icon: ClipboardList },
  { href: "/manager/clients", label: "Clientes", icon: Users },
  { href: "/manager/technicians", label: "Equipe", icon: UserCog },
  { href: "/manager/equipment", label: "Equipamentos", icon: Wrench },
  { href: "/manager/checklists", label: "Checklists", icon: Snowflake },
  { href: "/manager/measurements", label: "Medições", icon: LineChart },
];

interface SidebarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const { navigate } = useNavigationGuard();

  const firstName = user?.name?.split(" ")[0] ?? "Usuário";
  const initial = firstName[0]?.toUpperCase() ?? "U";

  return (
    <>
      <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center justify-center px-5 py-[18px] border-b border-gray-50">
          <Image
            src="/LOGO_COR.png"
            alt="Ice Nexus"
            width={128}
            height={38}
            className="object-contain"
            priority
          />
        </div>

        {/* User section */}
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50/60 transition-colors text-left w-full group"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm">
            {user?.image ? (
              <Image
                src={user.image}
                alt={firstName}
                width={36}
                height={36}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-xs font-bold text-white">{initial}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">Olá, {firstName}!</p>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">{user?.email}</p>
          </div>
          <UserCircle className="w-3.5 h-3.5 text-gray-300 group-hover:text-violet-400 transition-colors flex-shrink-0" />
        </button>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2.5">
            Menu
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 text-left",
                    active
                      ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-[15px] h-[15px] flex-shrink-0 transition-colors",
                      active ? "text-white" : "text-gray-400"
                    )}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Em breve */}
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-3 mt-5 mb-2.5">
            Em breve
          </p>
          <div className="space-y-0.5">
            {[
              { label: "PMOC", icon: FileText },
              { label: "Telemetria Avançada", icon: Radio },
            ].map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-300 cursor-not-allowed select-none"
              >
                <Icon className="w-[15px] h-[15px] flex-shrink-0 text-gray-300" />
                {label}
                <span className="ml-auto text-[9px] font-semibold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                  Em breve
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-3 border-t border-gray-50 space-y-0.5">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-violet-50 hover:text-violet-700 transition-all w-full"
          >
            <UserCircle className="w-[15px] h-[15px] text-gray-400" />
            Meu Perfil
          </button>
          <button className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all w-full">
            <HelpCircle className="w-[15px] h-[15px] text-gray-400" />
            Suporte
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
          >
            <LogOut className="w-[15px] h-[15px] text-gray-400" />
            Sair
          </button>
        </div>
      </aside>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
