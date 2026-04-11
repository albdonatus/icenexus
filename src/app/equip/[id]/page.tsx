import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { Wrench, Calendar, Tag, Hash, Building2, Package, ClipboardList, User } from "lucide-react";
import Link from "next/link";

export default async function EquipmentPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const equipment = await prisma.equipment.findFirst({
    where: { id, companyId: session.user.companyId, active: true },
    include: {
      client: { select: { name: true } },
      components: {
        include: { items: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!equipment) notFound();

  const orders = await prisma.serviceOrder.findMany({
    where: { equipmentId: id, companyId: session.user.companyId },
    include: {
      technician: { select: { name: true } },
      template: { select: { name: true } },
    },
    orderBy: { scheduledDate: "desc" },
  });

  const backHref = session.user.role === "MANAGER"
    ? `/manager/equipment/${id}`
    : "/technician";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <Link href={backHref} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
            ← Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{equipment.name}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {equipment.client.name}
              </p>
            </div>
          </div>
        </div>

        {/* Equipment Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-gray-400" />
            Dados do Equipamento
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Tipo" value={equipment.type} />
            {equipment.brand && <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Marca" value={equipment.brand} />}
            {equipment.model && <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="Modelo" value={equipment.model} />}
            {equipment.serialNumber && <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="Série" value={equipment.serialNumber} />}
            {equipment.installDate && (
              <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Instalação" value={formatDate(equipment.installDate)} />
            )}
          </div>
          {equipment.notes && (
            <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{equipment.notes}</p>
          )}
        </div>

        {/* Components */}
        {equipment.components.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-gray-400" />
              Componentes
            </h2>
            <div className="space-y-2">
              {equipment.components.map((comp) => (
                <div key={comp.id}>
                  <p className="text-sm font-medium text-gray-700">{comp.name}</p>
                  {comp.items.length > 0 && (
                    <ul className="ml-3 mt-1 space-y-0.5">
                      {comp.items.map((item) => (
                        <li key={item.id} className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          {item.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service Order History */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Histórico de Ordens de Serviço</h2>
            <span className="ml-auto text-xs text-gray-400">{orders.length} registro(s)</span>
          </div>

          {orders.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Nenhuma ordem de serviço registrada
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map((order) => (
                <div key={order.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-xs text-gray-400">{formatDate(order.scheduledDate)}</span>
                      </div>
                      <p className="text-sm text-gray-700 truncate">
                        {order.template?.name ?? "Sem checklist"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {order.technician?.name ?? "Técnico não atribuído"}
                      </p>
                      {order.notes && (
                        <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">{order.notes}</p>
                      )}
                    </div>
                    {session.user.role === "MANAGER" && (
                      <Link
                        href={`/manager/service-orders/${order.id}`}
                        className="text-xs text-violet-600 hover:underline flex-shrink-0"
                      >
                        Ver
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 flex items-center gap-1">{icon} {label}</span>
      <span className="text-sm font-medium text-gray-800 truncate">{value}</span>
    </div>
  );
}
