import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || (session.user.role as string) !== "SUPERADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role ? { role: role as "MANAGER" | "TECHNICIAN" | "SUPERADMIN" } : undefined,
    select: { id: true, name: true, email: true, role: true, active: true, companyId: true, phone: true, createdAt: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, password, role, phone, companyId } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, phone: phone || null, companyId: companyId || null },
  });

  return NextResponse.json(user, { status: 201 });
}
