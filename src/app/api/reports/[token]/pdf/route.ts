import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderPdf } from "@/lib/pdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const order = await prisma.serviceOrder.findUnique({
    where: { shareToken: token },
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
      executions: { include: { photos: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });

  const pdfBuffer = await generateOrderPdf(order);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="OS-${order.id.slice(-8).toUpperCase()}.pdf"`,
    },
  });
}
