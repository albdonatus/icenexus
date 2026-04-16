import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/measurements/series?equipmentId=X&description=Y&window=6m
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const equipmentId = searchParams.get("equipmentId");
  const description = searchParams.get("description");
  const window = searchParams.get("window") ?? "12m";

  if (!equipmentId || !description) {
    return NextResponse.json({ error: "equipmentId and description required" }, { status: 400 });
  }

  const now = new Date();
  let since: Date | undefined;
  if (window === "3m")  since = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  if (window === "6m")  since = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  if (window === "12m") since = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
  if (window === "2a")  since = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
  // window === "all" → no since filter

  const executions = await prisma.actionExecution.findMany({
    where: {
      numberValue: { not: null },
      action: { description },
      serviceOrder: {
        equipmentId,
        companyId: session.user.companyId,
        status: "COMPLETED",
        ...(since ? { completedAt: { gte: since } } : {}),
      },
    },
    select: {
      numberValue: true,
      unit: true,
      serviceOrder: {
        select: {
          id: true,
          scheduledDate: true,
          completedAt: true,
          technician: { select: { name: true } },
          template: { select: { name: true } },
        },
      },
    },
    orderBy: { serviceOrder: { completedAt: "asc" } },
  });

  const points = executions.map((e) => ({
    date: (e.serviceOrder.completedAt ?? e.serviceOrder.scheduledDate).toISOString(),
    value: e.numberValue!,
    unit: e.unit ?? "",
    orderId: e.serviceOrder.id,
    technician: e.serviceOrder.technician.name,
    checklist: e.serviceOrder.template.name,
  }));

  return NextResponse.json(points);
}
