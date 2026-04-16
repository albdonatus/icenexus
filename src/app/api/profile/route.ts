import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, image: true, companyLogo: true },
  });

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, currentPassword, newPassword } = body;

  const updateData: Record<string, string | null> = {};
  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone || null;

  if (newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const match = await bcrypt.compare(currentPassword ?? "", user.passwordHash);
    if (!match) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });

    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, phone: true, image: true, companyLogo: true },
  });

  return NextResponse.json(updated);
}
