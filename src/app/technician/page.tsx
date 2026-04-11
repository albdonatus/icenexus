import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, ChevronRight, Plus } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default async function TechnicianHomePage() {
  const session = await auth();
  const technicianId = session!.user.id;

  const orders = await prisma.serviceOrder.findMany({
    where: { technicianId },
    include: {
      client: { select: { name: true } },
      equipment: { select: { name: true, type: true } },
    },
    orderBy: [{ status: "asc" }, { scheduledDate: "asc" }],
  });

  // Sort: pending/in_execution first, completed last
  const sorted = [
    ...orders.filter((o) => o.status !== "COMPLETED"),
    ...orders.filter((o) => o.status === "COMPLETED"),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Minhas Ordens</h1>
          <p className="text-sm text-gray-500">{orders.length} ordem(ns) atribuída(s)</p>
        </div>
        <Link
          href="/technician/orders/new"
          className="flex items-center gap-1.5 bg-violet-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova OS
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma ordem atribuída</p>
          <p className="text-sm text-gray-400 mt-1">Aguarde novas atribuições do gestor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((order) => (
            <Link
              key={order.id}
              href={`/technician/orders/${order.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors active:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="font-semibold text-gray-900">{order.client.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {order.equipment.name} · {order.equipment.type}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(order.scheduledDate)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
