import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — only reveals if an email has a pending-approval account
export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ pending: false });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { active: true, pendingApproval: true },
  });

  const pending = !!user && !user.active && user.pendingApproval;
  return NextResponse.json({ pending });
}
