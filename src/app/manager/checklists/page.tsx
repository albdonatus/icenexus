import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, ClipboardList, FileDown } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DeleteButton from "@/components/ui/DeleteButton";

export default async function ChecklistsPage() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const templates = await prisma.checklistTemplate.findMany({
    where: { active: true, companyId },
    include: {
      components: {
        include: { _count: { select: { actions: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modelos de Checklist</h1>
          <p className="text-sm text-gray-500 mt-1">{templates.length} modelo(s)</p>
        </div>
        <Link href="/manager/checklists/new">
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Novo Modelo
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum modelo criado</p>
          <Link href="/manager/checklists/new" className="mt-4 inline-block">
            <Button>Criar Modelo</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => {
            const totalActions = template.components.reduce((sum, c) => sum + c._count.actions, 0);
            return (
              <Card key={template.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>{template.components.length} componente(s)</span>
                      <span>{totalActions} ação(ões)</span>
                      {template.equipmentType && <span>Tipo: {template.equipmentType}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/manager/checklists/${template.id}`}>
                      <Button variant="secondary" size="sm">Ver</Button>
                    </Link>
                    <a href={`/api/checklist-templates/${template.id}/pdf`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" title="Baixar PDF do modelo">
                        <FileDown className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Link href={`/manager/checklists/${template.id}/edit`}>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </Link>
                    <DeleteButton
                      endpoint={`/api/checklist-templates/${template.id}`}
                      confirmMessage={`Excluir o modelo "${template.name}"?`}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
