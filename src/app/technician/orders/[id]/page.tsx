import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ExecutionScreen from "@/components/service-orders/ExecutionScreen";
import { formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TechnicianOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      equipment: {
        select: {
          name: true,
          type: true,
          components: {
            include: {
              items: { orderBy: { order: "asc" } },
              attachments: true,
            },
            orderBy: { order: "asc" },
          },
        },
      },
      template: {
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
      },
      executions: { include: { photos: true } },
    },
  });

  if (!order) notFound();
  if (order.technicianId !== session.user.id) redirect("/technician");

  const initialExecutions = Object.fromEntries(
    order.executions.map((e) => [
      e.actionId,
      {
        status: e.status ?? undefined,
        numberValue: e.numberValue != null ? String(e.numberValue) : undefined,
        unit: e.unit ?? undefined,
        booleanValue: e.booleanValue ?? undefined,
        observation: e.observation ?? "",
      },
    ])
  );

  const initialPhotos = Object.fromEntries(
    order.executions.map((e) => [
      e.actionId,
      e.photos.map((p) => ({ id: p.id, url: p.url })),
    ])
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/technician" className="text-gray-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-gray-900 truncate">{order.client.name}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-500 truncate">
            {order.equipment.name} · {formatDate(order.scheduledDate)}
          </p>
        </div>
      </div>

      {order.notes && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3 mb-4">
          <span className="font-medium">Obs do gestor:</span> {order.notes}
        </div>
      )}

      <ExecutionScreen
        orderId={order.id}
        status={order.status}
        components={order.template.components}
        equipmentComponents={order.equipment.components}
        initialExecutions={initialExecutions}
        initialPhotos={initialPhotos}
      />
    </div>
  );
}
