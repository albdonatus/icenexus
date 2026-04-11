import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "Ordem já iniciada" }, { status: 400 });
  }

  const updated = await prisma.serviceOrder.update({
    where: { id },
    data: { status: "IN_EXECUTION", startedAt: new Date() },
  });

  return NextResponse.json(updated);
}
