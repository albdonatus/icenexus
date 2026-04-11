"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { LogOut } from "lucide-react";
import ProfilePanel from "@/components/profile/ProfilePanel";

interface MobileHeaderProps {
  userName?: string | null;
  userImage?: string | null;
}

export default function MobileHeader({ userName, userImage }: MobileHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const initial = userName?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Image src="/LOGO_COR.png" alt="Ice Nexus" width={110} height={33} className="object-contain" priority />
        </div>
        <div className="flex items-center gap-2.5">
          {/* Avatar — abre perfil */}
          <button
            onClick={() => setProfileOpen(true)}
            className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center ring-2 ring-white shadow-sm flex-shrink-0"
          >
            {userImage ? (
              <Image
                src={userImage}
                alt={userName ?? ""}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-xs font-bold text-white">{initial}</span>
            )}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all duration-150 text-gray-400"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
