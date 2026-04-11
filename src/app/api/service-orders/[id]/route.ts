import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const companyId = session.user.companyId;
  const order = await prisma.serviceOrder.findUnique({
    where: { id, companyId },
    include: {
      client: true,
      equipment: true,
      technician: { select: { id: true, name: true, email: true } },
      template: {
        include: {
          components: {
            include: { actions: { orderBy: { order: "asc" } } },
            orderBy: { order: "asc" },
          },
        },
      },
      executions: {
        include: { action: true, photos: true },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Technician can only see their own orders
  if (session.user.role === "TECHNICIAN" && order.technicianId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { scheduledDate, technicianId, notes } = body;

  const order = await prisma.serviceOrder.update({
    where: { id, companyId: session.user.companyId },
    data: {
      ...(scheduledDate ? { scheduledDate: new Date(scheduledDate) } : {}),
      ...(technicianId ? { technicianId } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
    include: {
      client: { select: { id: true, name: true } },
      equipment: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(order);
}
