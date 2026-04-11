import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const equipment = await prisma.equipment.findUnique({
    where: { id, companyId: session.user.companyId },
    select: {
      id: true,
      name: true,
      type: true,
      components: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          order: true,
          items: { orderBy: { order: "asc" }, select: { id: true, name: true, order: true } },
        },
      },
    },
  });

  if (!equipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(equipment);
}
