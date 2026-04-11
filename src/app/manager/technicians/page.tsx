import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, UserCog, Pencil } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DeleteButton from "@/components/ui/DeleteButton";

export default async function TechniciansPage() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const technicians = await prisma.user.findMany({
    where: { role: "TECHNICIAN", companyId },
    include: { _count: { select: { serviceOrders: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Técnicos</h1>
          <p className="text-sm text-gray-500 mt-1">{technicians.length} técnico(s)</p>
        </div>
        <Link href="/manager/technicians/new">
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Novo Técnico
          </Button>
        </Link>
      </div>

      {technicians.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum técnico cadastrado</p>
          <Link href="/manager/technicians/new" className="mt-4 inline-block">
            <Button>Cadastrar Técnico</Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {technicians.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{tech.name}</p>
                  <p className="text-sm text-gray-500">{tech.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-500">{tech._count.serviceOrders} OS atribuídas</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${tech.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {tech.active ? "Ativo" : "Inativo"}
                  </span>
                  <Link href={`/manager/technicians/${tech.id}/edit`} className="p-1.5 text-gray-300 hover:text-violet-500 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <DeleteButton
                    endpoint={`/api/technicians/${tech.id}`}
                    confirmMessage={`Desativar o técnico "${tech.name}"?`}
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
