import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const technicianId = searchParams.get("technicianId");

  const validStatuses = ["PENDING", "IN_EXECUTION", "COMPLETED"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const orders = await prisma.serviceOrder.findMany({
    where: {
      companyId: session.user.companyId,
      ...(status ? { status: status as "PENDING" | "IN_EXECUTION" | "COMPLETED" } : {}),
      ...(clientId ? { clientId } : {}),
      ...(technicianId ? { technicianId } : {}),
    },
    include: {
      client: { select: { id: true, name: true } },
      equipment: { select: { id: true, name: true, type: true } },
      technician: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
    },
    orderBy: { scheduledDate: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clientId, equipmentId, templateId, scheduledDate, notes, recurrence } = body;
  // Manager can assign any technician; technician is auto-assigned to themselves
  const technicianId = session.user.role === "MANAGER" ? body.technicianId : session.user.id;

  if (!clientId || !equipmentId || !technicianId || !templateId || !scheduledDate) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const validRecurrences = ["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"];
  const recurrenceValue = recurrence && validRecurrences.includes(recurrence) ? recurrence : null;
  // New recurring OS gets a fresh group id; non-recurring has none
  const recurrenceGroupId = recurrenceValue ? crypto.randomUUID() : null;

  const order = await prisma.serviceOrder.create({
    data: {
      clientId,
      equipmentId,
      technicianId,
      templateId,
      scheduledDate: new Date(scheduledDate),
      notes,
      companyId: session.user.companyId,
      recurrence: recurrenceValue,
      recurrenceGroupId,
    },
    include: {
      client: { select: { id: true, name: true } },
      equipment: { select: { id: true, name: true, type: true } },
      technician: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
