import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function advanceDate(date: Date, recurrence: string): Date {
  const d = new Date(date);
  if (recurrence === "DAILY")      { d.setDate(d.getDate() + 1); }
  if (recurrence === "MONTHLY")    { d.setMonth(d.getMonth() + 1); }
  if (recurrence === "QUARTERLY")  { d.setMonth(d.getMonth() + 3); }
  if (recurrence === "SEMIANNUAL") { d.setMonth(d.getMonth() + 6); }
  if (recurrence === "ANNUAL")     { d.setFullYear(d.getFullYear() + 1); }
  return d;
}

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
  const { clientId, equipmentId, templateId, scheduledDate, notes, recurrence, recurrencesLeft } = body;
  // Manager can assign any technician; technician is auto-assigned to themselves
  const technicianId = session.user.role === "MANAGER" ? body.technicianId : session.user.id;

  if (!clientId || !equipmentId || !technicianId || !templateId || !scheduledDate) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const validRecurrences = ["DAILY", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"];
  const recurrenceValue = recurrence && validRecurrences.includes(recurrence) ? recurrence : null;
  const recurrenceGroupId = recurrenceValue ? crypto.randomUUID() : null;
  // recurrencesLeft: null = infinite; N = N total OS (this one + N-1 future)
  const recurrencesLeftValue = recurrenceValue && recurrencesLeft && parseInt(recurrencesLeft) > 0
    ? parseInt(recurrencesLeft)
    : null;

  const baseData = {
    clientId,
    equipmentId,
    technicianId,
    templateId,
    notes,
    companyId: session.user.companyId,
    recurrence: recurrenceValue,
    recurrenceGroupId,
  };

  const order = await prisma.serviceOrder.create({
    data: {
      ...baseData,
      scheduledDate: new Date(scheduledDate),
      recurrencesLeft: recurrencesLeftValue,
    },
    include: {
      client: { select: { id: true, name: true } },
      equipment: { select: { id: true, name: true, type: true } },
      technician: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
    },
  });

  // Pre-create all future finite occurrences so they're visible in the dashboard
  if (recurrenceValue && recurrencesLeftValue && recurrencesLeftValue > 1) {
    const futures = [];
    let date = new Date(scheduledDate);
    for (let i = 1; i < recurrencesLeftValue; i++) {
      date = advanceDate(date, recurrenceValue);
      futures.push({ ...baseData, recurrenceGroupId: recurrenceGroupId!, scheduledDate: new Date(date), recurrencesLeft: recurrencesLeftValue - i });
    }
    await prisma.serviceOrder.createMany({ data: futures });
  }

  return NextResponse.json(order, { status: 201 });
}
