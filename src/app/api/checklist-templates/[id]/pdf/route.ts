import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTemplatePdf } from "@/lib/pdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const template = await prisma.checklistTemplate.findUnique({
    where: { id, companyId: session.user.companyId },
    include: {
      components: {
        include: { actions: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdfBuffer = await generateTemplatePdf(template);

  const slug = template.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="checklist-${slug}.pdf"`,
    },
  });
}
