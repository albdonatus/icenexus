import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.equipment.findMany({
    where: { active: true, companyId: session.user.companyId },
    select: { type: true },
    distinct: ["type"],
    orderBy: { type: "asc" },
  });

  return NextResponse.json(rows.map((r) => r.type));
}
