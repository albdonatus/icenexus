import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function nextDate(date: Date, recurrence: string): Date {
  const d = new Date(date);
  if (recurrence === "DAILY")      { d.setDate(d.getDate() + 1); }
  if (recurrence === "MONTHLY")    { d.setMonth(d.getMonth() + 1); }
  if (recurrence === "QUARTERLY")  { d.setMonth(d.getMonth() + 3); }
  if (recurrence === "SEMIANNUAL") { d.setMonth(d.getMonth() + 6); }
  if (recurrence === "ANNUAL")     { d.setFullYear(d.getFullYear() + 1); }
  return d;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "TECHNICIAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.serviceOrder.findUnique({ where: { id, companyId: session.user.companyId } });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.technicianId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.status === "COMPLETED") {
    return NextResponse.json({ error: "Ordem já concluída" }, { status: 400 });
  }

  const updated = await prisma.serviceOrder.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  // Auto-create next occurrence only for infinite recurrences (finite ones are pre-created)
  const isInfinite = order.recurrence && order.recurrenceGroupId && order.recurrencesLeft === null;

  if (isInfinite) {
    const next = nextDate(order.scheduledDate, order.recurrence!);
    const nextExists = await prisma.serviceOrder.count({
      where: {
        recurrenceGroupId: order.recurrenceGroupId!,
        status: { in: ["PENDING", "IN_EXECUTION"] },
        scheduledDate: { gt: order.scheduledDate },
      },
    });
    if (!nextExists) {
      await prisma.serviceOrder.create({
        data: {
          companyId: order.companyId,
          clientId: order.clientId,
          equipmentId: order.equipmentId,
          technicianId: order.technicianId,
          templateId: order.templateId,
          notes: order.notes,
          scheduledDate: next,
          recurrence: order.recurrence,
          recurrenceGroupId: order.recurrenceGroupId,
          recurrencesLeft: null,
        },
      });
    }
  }

  return NextResponse.json(updated);
}
