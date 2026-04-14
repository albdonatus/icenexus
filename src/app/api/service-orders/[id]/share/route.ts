import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id, companyId: session.user.companyId },
    select: { id: true, shareToken: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return existing token or generate a new one
  const token = order.shareToken ?? crypto.randomUUID();

  if (!order.shareToken) {
    await prisma.serviceOrder.update({ where: { id }, data: { shareToken: token } });
  }

  return NextResponse.json({ token });
}
