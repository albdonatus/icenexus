import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const template = await prisma.checklistTemplate.findUnique({
    where: { id, companyId: session.user.companyId },
    include: {
      components: {
        include: {
          actions: {
            include: { attachments: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, description, equipmentType, components } = body;

  // Update metadata + replace full component tree in a transaction
  const template = await prisma.$transaction(async (tx) => {
    await tx.checklistTemplate.update({
      where: { id, companyId: session.user.companyId },
      data: { name, description, equipmentType },
    });

    // Delete existing components (cascade deletes actions)
    await tx.checklistComponent.deleteMany({ where: { templateId: id } });

    // Re-create components + actions
    if (components && components.length > 0) {
      for (const comp of components) {
        await tx.checklistComponent.create({
          data: {
            templateId: id,
            name: comp.name,
            order: comp.order,
            actions: {
              create: (comp.actions || []).map(
                (act: { description: string; type: string; units: string[]; recommendation?: string; order: number }) => ({
                  description: act.description,
                  type: act.type ?? "TEXT",
                  units: act.units ?? [],
                  recommendation: act.recommendation ?? null,
                  order: act.order,
                })
              ),
            },
          },
        });
      }
    }

    return tx.checklistTemplate.findUnique({
      where: { id },
      include: {
        components: {
          include: {
            actions: {
              include: { attachments: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });
  });

  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.checklistTemplate.update({ where: { id, companyId: session.user.companyId }, data: { active: false } });
  return NextResponse.json({ success: true });
}
