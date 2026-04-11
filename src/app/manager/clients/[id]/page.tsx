import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Wrench } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id, companyId: session!.user.companyId },
    include: {
      equipment: { where: { active: true }, orderBy: { name: "asc" } },
      _count: { select: { serviceOrders: true } },
    },
  });

  if (!client) notFound();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/manager/clients" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-500">{client._count.serviceOrders} ordem(ns) de serviço</p>
        </div>
        <Link href={`/manager/clients/${id}/edit`}>
          <Button variant="secondary" size="sm">
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Client Info */}
      <Card className="mb-6">
        <CardHeader><h2 className="font-semibold text-gray-700">Informações</h2></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {client.document && (
              <div>
                <dt className="text-gray-500">CNPJ / CPF</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{client.document}</dd>
              </div>
            )}
            {client.phone && (
              <div>
                <dt className="text-gray-500">Telefone</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{client.phone}</dd>
              </div>
            )}
            {client.email && (
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{client.email}</dd>
              </div>
            )}
            {client.address && (
              <div className="col-span-2">
                <dt className="text-gray-500">Endereço</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{client.address}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Equipamentos</h2>
            <Link href={`/manager/equipment/new?clientId=${id}`}>
              <Button size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Novo Equipamento
              </Button>
            </Link>
          </div>
        </CardHeader>
        {client.equipment.length === 0 ? (
          <CardContent>
            <div className="text-center py-6">
              <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nenhum equipamento cadastrado.</p>
            </div>
          </CardContent>
        ) : (
          <div className="divide-y divide-gray-100">
            {client.equipment.map((eq) => (
              <Link
                key={eq.id}
                href={`/manager/equipment/${eq.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{eq.name}</p>
                  <p className="text-xs text-gray-500">
                    {eq.type}
                    {eq.brand && ` · ${eq.brand}`}
                    {eq.model && ` ${eq.model}`}
                  </p>
                </div>
                {eq.serialNumber && (
                  <p className="text-xs text-gray-400">SN: {eq.serialNumber}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
