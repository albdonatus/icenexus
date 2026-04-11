import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, FileDown } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default async function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const template = await prisma.checklistTemplate.findUnique({
    where: { id, companyId: session!.user.companyId },
    include: {
      components: {
        include: { actions: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!template) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/manager/checklists" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
          {template.description && <p className="text-sm text-gray-500">{template.description}</p>}
        </div>
        <a href={`/api/checklist-templates/${id}/pdf`} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm">
            <FileDown className="w-3.5 h-3.5 mr-1" />
            PDF
          </Button>
        </a>
        <Link href={`/manager/checklists/${id}/edit`}>
          <Button variant="secondary" size="sm">
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Editar
          </Button>
        </Link>
      </div>

      {template.equipmentType && (
        <div className="mb-4 text-sm text-gray-500">
          Tipo de equipamento: <span className="font-medium text-gray-700">{template.equipmentType}</span>
        </div>
      )}

      <div className="space-y-3">
        {template.components.map((comp) => (
          <Card key={comp.id}>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">{comp.name}</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {comp.actions.map((action, i) => (
                  <li key={action.id} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 flex-shrink-0 w-5 text-right">{i + 1}.</span>
                    {action.description}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
