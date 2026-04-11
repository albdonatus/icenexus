import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Wrench } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DeleteButton from "@/components/ui/DeleteButton";

export default async function EquipmentPage() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const equipment = await prisma.equipment.findMany({
    where: { active: true, companyId },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipamentos</h1>
          <p className="text-sm text-gray-500 mt-1">{equipment.length} equipamento(s) cadastrado(s)</p>
        </div>
        <Link href="/manager/equipment/new">
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Novo Equipamento
          </Button>
        </Link>
      </div>

      {equipment.length === 0 ? (
        <Card className="p-12 text-center">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum equipamento cadastrado</p>
          <Link href="/manager/equipment/new" className="mt-4 inline-block">
            <Button>Cadastrar Equipamento</Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {equipment.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <Link href={`/manager/equipment/${eq.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{eq.name}</p>
                  <p className="text-sm text-gray-500">
                    {eq.type}
                    {eq.brand && ` · ${eq.brand}`}
                    {eq.model && ` ${eq.model}`}
                  </p>
                </Link>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <p className="text-sm text-blue-600">{eq.client.name}</p>
                    {eq.serialNumber && (
                      <p className="text-xs text-gray-400">SN: {eq.serialNumber}</p>
                    )}
                  </div>
                  <DeleteButton
                    endpoint={`/api/equipment/${eq.id}`}
                    confirmMessage={`Excluir o equipamento "${eq.name}"?`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
