import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.checklistTemplate.findMany({
    where: { active: true, companyId: session.user.companyId },
    include: {
      _count: { select: { components: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, equipmentType, components } = body;

  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const template = await prisma.checklistTemplate.create({
    data: {
      name,
      description,
      equipmentType,
      companyId: session.user.companyId,
      components: {
        create: (components || []).map(
          (comp: { name: string; order: number; actions: { description: string; type: string; units: string[]; order: number }[] }) => ({
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
          })
        ),
      },
    },
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

  return NextResponse.json(template, { status: 201 });
}
