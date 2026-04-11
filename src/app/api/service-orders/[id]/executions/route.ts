import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionStatus } from "@prisma/client";

interface ExecutionInput {
  actionId: string;
  status: ActionStatus | null;
  numberValue: number | null;
  unit: string | null;
  booleanValue: boolean | null;
  observation?: string | null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const body: ExecutionInput[] = await req.json();

  await prisma.$transaction(
    body.map((exec) =>
      prisma.actionExecution.upsert({
        where: { serviceOrderId_actionId: { serviceOrderId: id, actionId: exec.actionId } },
        create: {
          serviceOrderId: id,
          actionId: exec.actionId,
          status: exec.status ?? null,
          numberValue: exec.numberValue ?? null,
          unit: exec.unit ?? null,
          booleanValue: exec.booleanValue ?? null,
          observation: exec.observation ?? null,
        },
        update: {
          status: exec.status ?? null,
          numberValue: exec.numberValue ?? null,
          unit: exec.unit ?? null,
          booleanValue: exec.booleanValue ?? null,
          observation: exec.observation ?? null,
        },
      })
    )
  );

  return NextResponse.json({ success: true });
}
