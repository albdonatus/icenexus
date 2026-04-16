import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.serviceOrder.findUnique({
    where: { id, companyId: session.user.companyId },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const duplicate = await prisma.serviceOrder.create({
    data: {
      companyId: order.companyId,
      clientId: order.clientId,
      equipmentId: order.equipmentId,
      technicianId: order.technicianId,
      templateId: order.templateId,
      scheduledDate: order.scheduledDate,
      notes: order.notes,
      // No recurrence — user can configure separately
    },
  });

  return NextResponse.json({ id: duplicate.id }, { status: 201 });
}
