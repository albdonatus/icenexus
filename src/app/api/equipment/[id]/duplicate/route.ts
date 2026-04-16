import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const source = await prisma.equipment.findUnique({
    where: { id, companyId: session.user.companyId },
    include: {
      components: {
        include: { items: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copy = await prisma.equipment.create({
    data: {
      companyId: source.companyId,
      clientId: source.clientId,
      name: `${source.name} (cópia)`,
      type: source.type,
      brand: source.brand,
      model: source.model,
      // serialNumber intentionally omitted — must be unique
      installDate: source.installDate,
      notes: source.notes,
      components: {
        create: source.components.map((comp) => ({
          name: comp.name,
          order: comp.order,
          items: {
            create: comp.items.map((item) => ({
              name: item.name,
              order: item.order,
            })),
          },
        })),
      },
    },
  });

  return NextResponse.json({ id: copy.id }, { status: 201 });
}
