import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DeleteButton from "@/components/ui/DeleteButton";

export default async function ClientsPage() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const clients = await prisma.client.findMany({
    where: { active: true, companyId },
    include: { _count: { select: { equipment: { where: { active: true } } } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} cliente(s) cadastrado(s)</p>
        </div>
        <Link href="/manager/clients/new">
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum cliente cadastrado</p>
          <p className="text-sm text-gray-400 mt-1">Cadastre o primeiro cliente para começar.</p>
          <Link href="/manager/clients/new" className="mt-4 inline-block">
            <Button>Cadastrar Cliente</Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <Link href={`/manager/clients/${client.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-500">
                    {client.document && <span>{client.document} · </span>}
                    {client.phone && <span>{client.phone} · </span>}
                    {client.email}
                  </p>
                </Link>
                <div className="flex items-center gap-3 ml-4">
                  <p className="text-sm font-medium text-gray-700">
                    {client._count.equipment} equipamento(s)
                  </p>
                  <DeleteButton
                    endpoint={`/api/clients/${client.id}`}
                    confirmMessage={`Excluir o cliente "${client.name}"?`}
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
