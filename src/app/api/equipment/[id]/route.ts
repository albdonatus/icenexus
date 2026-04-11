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
    include: {
      client: { select: { id: true, name: true } },
      components: {
        include: { items: { orderBy: { order: "asc" } }, attachments: { orderBy: { createdAt: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!equipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(equipment);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, type, brand, model, serialNumber, installDate, notes, components } = body;

  const equipment = await prisma.$transaction(async (tx) => {
    await tx.equipment.update({
      where: { id, companyId: session.user.companyId },
      data: {
        name,
        type,
        brand,
        model,
        serialNumber,
        installDate: installDate ? new Date(installDate) : null,
        notes,
      },
    });

    // Upsert components — preserve attachments on existing components
    const incomingIds = (components || []).filter((c: { id?: string }) => c.id).map((c: { id: string }) => c.id);

    // Delete components removed by the user (cascade deletes their attachments)
    await tx.equipmentComponent.deleteMany({
      where: { equipmentId: id, id: { notIn: incomingIds } },
    });

    if (components && components.length > 0) {
      for (const comp of components) {
        if (comp.id) {
          // Existing component — update name/order, replace items only
          await tx.equipmentComponent.update({
            where: { id: comp.id },
            data: { name: comp.name, order: comp.order },
          });
          await tx.equipmentComponentItem.deleteMany({ where: { componentId: comp.id } });
          for (const item of comp.items || []) {
            await tx.equipmentComponentItem.create({
              data: { componentId: comp.id, name: item.name, order: item.order },
            });
          }
        } else {
          // New component
          await tx.equipmentComponent.create({
            data: {
              equipmentId: id,
              name: comp.name,
              order: comp.order,
              items: {
                create: (comp.items || []).map((item: { name: string; order: number }) => ({
                  name: item.name,
                  order: item.order,
                })),
              },
            },
          });
        }
      }
    }

    return tx.equipment.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        components: {
          include: { items: { orderBy: { order: "asc" } }, attachments: { orderBy: { createdAt: "asc" } } },
          orderBy: { order: "asc" },
        },
      },
    });
  });

  return NextResponse.json(equipment);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.equipment.update({ where: { id, companyId: session.user.companyId }, data: { active: false } });
  return NextResponse.json({ success: true });
}
