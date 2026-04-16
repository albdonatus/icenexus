import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string; clientId?: string }> }) {
  const session = await auth();
  const companyId = session!.user.companyId;

  const { period, clientId } = await searchParams;

  // Compute period date range
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date = now;

  switch (period) {
    case "last_month":
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "3_months":
      periodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    case "6_months":
      periodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      break;
    case "this_year":
      periodStart = new Date(now.getFullYear(), 0, 1);
      break;
    default: // this_month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [orders, clients] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        completedAt: { gte: periodStart, lte: periodEnd },
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        equipment: { select: { name: true, type: true } },
        technician: { select: { name: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.client.findMany({
      where: { companyId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized = orders.map((o) => ({
    id: o.id,
    clientId: o.clientId,
    clientName: o.client.name,
    equipmentName: o.equipment.name,
    equipmentType: o.equipment.type,
    technicianName: o.technician.name,
    completedAt: o.completedAt!.toISOString(),
    scheduledDate: o.scheduledDate.toISOString(),
  }));

  return (
    <Suspense fallback={null}>
      <ReportsClient
        orders={serialized}
        clients={clients}
        currentPeriod={period ?? "this_month"}
        currentClientId={clientId ?? ""}
      />
    </Suspense>
  );
}
