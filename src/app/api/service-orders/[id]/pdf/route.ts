import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderPdf } from "@/lib/pdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      client: true,
      equipment: true,
      technician: { select: { id: true, name: true } },
      template: {
        include: {
          components: {
            include: { actions: { orderBy: { order: "asc" } } },
            orderBy: { order: "asc" },
          },
        },
      },
      executions: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdfBuffer = await generateOrderPdf(order);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="OS-${id.slice(-8).toUpperCase()}.pdf"`,
    },
  });
}
