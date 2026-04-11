import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import ManagerLayoutWrapper from "@/components/layout/ManagerLayoutWrapper";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });

  return (
    <ManagerLayoutWrapper>
      <div className="flex h-screen bg-[#f8f8fb]">
        <Sidebar user={user ?? undefined} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopHeader />
          <main className="flex-1 overflow-auto">
            <div className="p-6 max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </ManagerLayoutWrapper>
  );
}
