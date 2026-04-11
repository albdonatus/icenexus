import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tech = await prisma.user.findUnique({
    where: { id, companyId: session.user.companyId },
    select: { id: true, name: true, email: true, phone: true, active: true },
  });

  if (!tech) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tech);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, email, phone, active } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { email, companyId: session.user.companyId, NOT: { id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Email já cadastrado por outro usuário" }, { status: 400 });
  }

  const tech = await prisma.user.update({
    where: { id, companyId: session.user.companyId },
    data: {
      name,
      email,
      ...(phone !== undefined ? { phone } : {}),
      ...(active !== undefined ? { active } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, active: true },
  });

  return NextResponse.json(tech);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.user.update({ where: { id, companyId: session.user.companyId }, data: { active: false } });
  return NextResponse.json({ success: true });
}
