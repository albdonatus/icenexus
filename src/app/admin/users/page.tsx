import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { UserPlus, Pencil } from "lucide-react";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || (session.user.role as string) !== "SUPERADMIN") redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      pendingApproval: true,
      companyId: true,
      phone: true,
      createdAt: true,
    },
  });

  // Build company name map: companyId → manager name
  const managers = users.filter((u) => u.role === "MANAGER");
  const companyMap: Record<string, string> = {};
  for (const m of managers) {
    companyMap[m.companyId ?? m.id] = m.name;
  }

  const enriched = users.map((u) => ({
    ...u,
    companyName: companyMap[u.companyId ?? ""] ?? (u.role === "SUPERADMIN" ? "—" : u.companyId ?? "—"),
    createdAt: u.createdAt.toISOString(),
  }));

  return <AdminUsersClient users={enriched} />;
}
