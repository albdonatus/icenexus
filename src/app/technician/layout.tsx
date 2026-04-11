import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MobileHeader from "@/components/layout/MobileHeader";
import TechnicianLayoutWrapper from "@/components/layout/TechnicianLayoutWrapper";

export default async function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "TECHNICIAN") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });

  return (
    <TechnicianLayoutWrapper>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <MobileHeader userName={user?.name} userImage={user?.image} />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </TechnicianLayoutWrapper>
  );
}
