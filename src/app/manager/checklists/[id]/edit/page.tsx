import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChecklistTemplateBuilder from "@/components/forms/ChecklistTemplateBuilder";

export default async function EditChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const template = await prisma.checklistTemplate.findUnique({
    where: { id, companyId: session!.user.companyId },
    include: {
      components: {
        include: {
          actions: {
            include: { attachments: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!template) notFound();

  const initialData = {
    id: template.id,
    name: template.name,
    description: template.description ?? "",
    equipmentType: template.equipmentType ?? "",
    components: template.components.map((c) => ({
      id: c.id,
      name: c.name,
      actions: c.actions.map((a) => ({
        id: a.id,
        description: a.description,
        type: a.type as "TEXT" | "NUMBER" | "BOOLEAN",
        units: a.units ?? [],
        recommendation: a.recommendation ?? "",
        attachments: a.attachments.map((att) => ({
          id: att.id,
          name: att.name,
          url: att.url,
          fileType: att.fileType,
        })),
      })),
    })),
  };

  return <ChecklistTemplateBuilder mode="edit" initialData={initialData} />;
}
