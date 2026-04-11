import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

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
  const filename = `component-attachments/comp-${componentId}-${Date.now()}.${ext}`;

  let blob;
  try {
    blob = await put(filename, file, { access: "public", token: process.env.blob_READ_WRITE_TOKEN });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[equipment-component-attachments] blob error:", msg);
    return NextResponse.json({ error: `Blob error: ${msg}` }, { status: 500 });
  }

  const attachment = await prisma.equipmentComponentAttachment.create({
    data: { componentId, name: file.name, url: blob.url, fileType: file.type },
  });

  return NextResponse.json(attachment, { status: 201 });
}
