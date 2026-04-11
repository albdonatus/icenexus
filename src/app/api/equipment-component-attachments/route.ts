import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const componentId = formData.get("componentId") as string | null;

  if (!file || !componentId) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  // Verify component belongs to this company
  const component = await prisma.equipmentComponent.findFirst({
    where: { id: componentId, equipment: { companyId: session.user.companyId } },
  });
  if (!component) return NextResponse.json({ error: "Componente não encontrado" }, { status: 404 });

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 20MB." }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG, WebP ou PDF." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `comp-${componentId}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "component-attachments");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  const url = `/uploads/component-attachments/${filename}`;
  const attachment = await prisma.equipmentComponentAttachment.create({
    data: { componentId, name: file.name, url, fileType: file.type },
  });

  return NextResponse.json(attachment, { status: 201 });
}
