import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendPendingApprovalToAdmins } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, companyName, document, email, phone, password } = body;

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

  // Create manager — inactive until approved by SUPERADMIN
  // companyId must equal user.id (self as tenant root), so we use a transaction
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        name,
        companyName: companyName || null,
        document: document || null,
        email,
        phone: phone || null,
        passwordHash,
        role: "MANAGER",
        active: false,
        pendingApproval: true,
      },
    });
    return tx.user.update({ where: { id: u.id }, data: { companyId: u.id } });
  });

  // Notify all SUPERADMIN users by email
  const admins = await prisma.user.findMany({
    where: { role: "SUPERADMIN", active: true },
    select: { email: true },
  });

  await sendPendingApprovalToAdmins(
    admins.map((a) => a.email),
    { name, email }
  ).catch((err) => console.error("[register] Failed to send admin email:", err));

  return NextResponse.json({ pending: true }, { status: 201 });
}
