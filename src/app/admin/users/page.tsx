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
      companyName: true,
      document: true,
      phone: true,
      createdAt: true,
    },
  });

  // Build company name map: companyId → manager name (fallback for technicians)
  const managers = users.filter((u) => u.role === "MANAGER");
  const companyMap: Record<string, string> = {};
  for (const m of managers) {
    companyMap[m.companyId ?? m.id] = m.companyName || m.name;
  }

  const enriched = users.map((u) => ({
    ...u,
    // For managers: use stored companyName. For technicians: use their manager's companyName.
    companyName: u.role === "MANAGER"
      ? (u.companyName || "")
      : (companyMap[u.companyId ?? ""] ?? (u.role === "SUPERADMIN" ? "—" : "—")),
    document: u.document || "",
    createdAt: u.createdAt.toISOString(),
  }));

  return <AdminUsersClient users={enriched} />;
}
