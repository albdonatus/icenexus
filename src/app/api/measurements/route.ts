import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/measurements?equipmentId=X
// Returns unique numeric action descriptions measured for this equipment
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const equipmentId = searchParams.get("equipmentId");
  if (!equipmentId) return NextResponse.json({ error: "equipmentId required" }, { status: 400 });

  // Find all completed service orders for this equipment
  const executions = await prisma.actionExecution.findMany({
    where: {
      numberValue: { not: null },
      serviceOrder: { equipmentId, companyId: session.user.companyId, status: "COMPLETED" },
    },
    select: {
      unit: true,
      action: { select: { description: true } },
    },
    distinct: ["actionId"],
  });

  // Group by description, collect unique units
  const map = new Map<string, Set<string>>();
  for (const e of executions) {
    const desc = e.action.description;
    if (!map.has(desc)) map.set(desc, new Set());
    if (e.unit) map.get(desc)!.add(e.unit);
  }

  const result = Array.from(map.entries()).map(([description, units]) => ({
    description,
    units: Array.from(units),
  })).sort((a, b) => a.description.localeCompare(b.description));

  return NextResponse.json(result);
}
