import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create manager — companyId = own id (self as tenant root)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      role: "MANAGER",
    },
  });

  // Set companyId = user.id now that we have the id
  await prisma.user.update({
    where: { id: user.id },
    data: { companyId: user.id },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
