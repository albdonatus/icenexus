import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || (session.user.role as string) !== "SUPERADMIN") return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, active: true, companyId: true, companyName: true, document: true, phone: true },
  });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { name, companyName, document, email, role, phone, companyId, active, password } = body;

  const existing = await prisma.user.findFirst({ where: { email, NOT: { id } } });
  if (existing) return NextResponse.json({ error: "Email já em uso" }, { status: 409 });

  const data: Record<string, unknown> = {
    name, email, role,
    companyName: companyName || null,
    document: document || null,
    phone: phone || null,
    companyId: companyId || null,
    active,
  };
  if (password) data.passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const user = await prisma.user.update({ where: { id }, data: { active: body.active } });
  return NextResponse.json(user);
}
