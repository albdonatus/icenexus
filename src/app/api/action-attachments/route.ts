import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  // JSON mode: restore an existing file record (url already exists in blob storage)
  if (contentType.includes("application/json")) {
    const { actionId, name, url, fileType } = await req.json();
    if (!actionId || !url || !name || !fileType) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }
    const attachment = await prisma.actionAttachment.create({
      data: { actionId, name, url, fileType },
    });
    return NextResponse.json(attachment, { status: 201 });
  }

  // Multipart mode: actual file upload
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const actionId = formData.get("actionId") as string | null;

  if (!file || !actionId) {
    return NextResponse.json({ error: "Arquivo e actionId são obrigatórios" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 20MB." }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG, WebP ou PDF." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `action-attachments/${actionId}-${Date.now()}.${ext}`;
  const blob = await put(filename, file, { access: "public" });

  const fileType = file.type === "application/pdf" ? "PDF" : "IMAGE";
  const attachment = await prisma.actionAttachment.create({
    data: { actionId, name: file.name, url: blob.url, fileType },
  });

  return NextResponse.json(attachment, { status: 201 });
}
