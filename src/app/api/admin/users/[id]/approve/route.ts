import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountApproved } from "@/lib/email";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user.role as string) !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, active: true, pendingApproval: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (user.active) return NextResponse.json({ error: "Usuário já está ativo" }, { status: 400 });

  await prisma.user.update({
    where: { id },
    data: { active: true, pendingApproval: false },
  });

  await sendAccountApproved(user.email, user.name).catch((err) =>
    console.error("[approve] Failed to send approval email:", err)
  );

  return NextResponse.json({ ok: true });
}
