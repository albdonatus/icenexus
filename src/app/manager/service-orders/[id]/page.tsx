import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, CheckCircle2, XCircle, MinusCircle, Pencil } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import ShareReportButton from "@/components/service-orders/ShareReportButton";

export default async function ServiceOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const order = await prisma.serviceOrder.findUnique({
    where: { id, companyId: session!.user.companyId },
    include: {
      client: true,
      equipment: true,
      technician: { select: { id: true, name: true, email: true } },
      template: {
        include: {
          components: {
            include: { actions: { orderBy: { order: "asc" } } },
            orderBy: { order: "asc" },
          },
        },
      },
      executions: { include: { photos: true } },
    },
  });

  if (!order) notFound();

  const executionMap = new Map(order.executions.map((e) => [e.actionId, e]));

  const textStatusIcon = (status: string | undefined | null) => {
    if (!status) return <span className="text-gray-300">—</span>;
    if (status === "DONE") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "NOT_DONE") return <XCircle className="w-4 h-4 text-red-500" />;
    return <MinusCircle className="w-4 h-4 text-gray-400" />;
  };

  const textStatusLabel: Record<string, string> = {
    DONE: "Realizado",
    NOT_DONE: "Não Realizado",
    NOT_APPLICABLE: "N/A",
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/manager/service-orders" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{order.client.name}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-gray-500">{order.equipment.name} · {formatDate(order.scheduledDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          {order.status !== "COMPLETED" && (
            <Link href={`/manager/service-orders/${id}/edit`}>
              <Button variant="secondary" size="sm">
                <Pencil className="w-3.5 h-3.5 mr-1" />
                Editar
              </Button>
            </Link>
          )}
          {order.status === "COMPLETED" && (
            <>
              <a href={`/api/service-orders/${id}/pdf`} target="_blank">
                <Button variant="secondary" size="sm">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Baixar PDF
                </Button>
              </a>
              <ShareReportButton orderId={id} />
            </>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-700 text-sm">Cliente</h2></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{order.client.name}</p>
            {order.client.document && <p className="text-gray-500">{order.client.document}</p>}
            {order.client.phone && <p className="text-gray-500">{order.client.phone}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-700 text-sm">Equipamento</h2></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{order.equipment.name}</p>
            <p className="text-gray-500">{order.equipment.type}{order.equipment.brand && ` · ${order.equipment.brand}`}</p>
            {order.equipment.serialNumber && <p className="text-gray-500">SN: {order.equipment.serialNumber}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-700 text-sm">Execução</h2></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><span className="text-gray-500">Técnico:</span> <span className="font-medium">{order.technician.name}</span></p>
            <p><span className="text-gray-500">Agendado:</span> {formatDate(order.scheduledDate)}</p>
            {order.startedAt && <p><span className="text-gray-500">Iniciado:</span> {formatDateTime(order.startedAt)}</p>}
            {order.completedAt && <p><span className="text-gray-500">Concluído:</span> {formatDateTime(order.completedAt)}</p>}
          </CardContent>
        </Card>

        {order.notes && (
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-700 text-sm">Observações</h2></CardHeader>
            <CardContent className="text-sm text-gray-600">{order.notes}</CardContent>
          </Card>
        )}
      </div>

      {/* Checklist Results */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Checklist: {order.template.name}</h2>
        </CardHeader>
        {order.status === "PENDING" ? (
          <CardContent>
            <p className="text-sm text-gray-400 text-center py-4">Aguardando execução pelo técnico.</p>
          </CardContent>
        ) : (
          <div>
            {order.template.components.map((comp) => (
              <div key={comp.id} className="border-b border-gray-100 last:border-0">
                <div className="px-6 py-3 bg-gray-50">
                  <h3 className="font-semibold text-sm text-gray-700">{comp.name}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {comp.actions.map((action) => {
                    const exec = executionMap.get(action.id);

                    let icon = <span className="text-gray-300">—</span>;
                    let valueDisplay: React.ReactNode = <span className="text-xs text-gray-400">Não preenchido</span>;

                    if (action.type === "TEXT" || action.type === "NUMBER_TEXT") {
                      icon = <div className="flex-shrink-0 mt-0.5">{textStatusIcon(exec?.status)}</div>;
                      if (exec?.status) valueDisplay = <span className="text-xs text-gray-400 flex-shrink-0">{textStatusLabel[exec.status]}</span>;
                    }
                    if (action.type === "BOOLEAN" || action.type === "NUMBER_BOOLEAN") {
                      if (exec?.booleanValue === true) { icon = <CheckCircle2 className="w-4 h-4 text-green-500" />; valueDisplay = <span className="text-xs font-semibold text-green-700">Sim</span>; }
                      else if (exec?.booleanValue === false) { icon = <XCircle className="w-4 h-4 text-red-500" />; valueDisplay = <span className="text-xs font-semibold text-red-700">Não</span>; }
                    }
                    if (action.type === "NUMBER" || action.type === "NUMBER_TEXT" || action.type === "NUMBER_BOOLEAN") {
                      if (action.type === "NUMBER") icon = exec?.numberValue != null ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <span className="text-gray-300">—</span>;
                      if (exec?.numberValue != null) {
                        const numBadge = <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{exec.numberValue} {exec.unit ?? ""}</span>;
                        valueDisplay = action.type === "NUMBER" ? numBadge : <div className="flex flex-col items-end gap-1">{numBadge}{valueDisplay}</div>;
                      }
                    }

                    return (
                      <div key={action.id} className="px-6 py-3 flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{icon}</div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{action.description}</p>
                          {exec?.observation && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">{exec.observation}</p>
                          )}
                          {exec?.photos && exec.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {exec.photos.map((photo: { id: string; url: string }) => (
                                <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={photo.url}
                                    alt="Foto de execução"
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        {valueDisplay}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
