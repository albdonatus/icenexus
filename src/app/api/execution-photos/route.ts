import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "TECHNICIAN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const serviceOrderId = formData.get("serviceOrderId") as string | null;
  const actionId = formData.get("actionId") as string | null;

  if (!file || !serviceOrderId || !actionId) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Foto muito grande. Máximo 20MB." }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WebP." }, { status: 400 });
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId, technicianId: session.user.id },
  });
  if (!order) return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });

  const execution = await prisma.actionExecution.upsert({
    where: { serviceOrderId_actionId: { serviceOrderId, actionId } },
    create: { serviceOrderId, actionId, observation: null },
    update: {},
  });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `execution-photos/exec-${execution.id}-${Date.now()}.${ext}`;
  const blob = await put(filename, file, { access: "public", token: process.env.blob_READ_WRITE_TOKEN });

  const photo = await prisma.executionPhoto.create({
    data: { executionId: execution.id, url: blob.url },
  });

  return NextResponse.json(photo, { status: 201 });
}
