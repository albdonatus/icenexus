import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const equipment = await prisma.equipment.findMany({
    where: { active: true, companyId: session.user.companyId, ...(clientId ? { clientId } : {}) },
    include: { client: { select: { id: true, name: true } }, _count: { select: { components: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(equipment);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { clientId, name, type, brand, model, serialNumber, installDate, notes, components } = body;

  if (!clientId || !name || !type) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const equipment = await prisma.equipment.create({
    data: {
      clientId,
      name,
      type,
      brand,
      model,
      serialNumber,
      installDate: installDate ? new Date(installDate) : null,
      notes,
      companyId: session.user.companyId,
      components: {
        create: (components || []).map((comp: { name: string; order: number; items: { name: string; order: number }[] }) => ({
          name: comp.name,
          order: comp.order,
          items: {
            create: (comp.items || []).map((item: { name: string; order: number }) => ({
              name: item.name,
              order: item.order,
            })),
          },
        })),
      },
    },
    include: {
      client: { select: { id: true, name: true } },
      components: { include: { items: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(equipment, { status: 201 });
}
