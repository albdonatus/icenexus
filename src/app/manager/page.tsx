import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Briefcase, Users, DollarSign, FileText } from "lucide-react";
import DashboardCalendar, { type CalendarOrder } from "@/components/dashboard/DashboardCalendar";
import OrderTableRow from "@/components/dashboard/OrderTableRow";

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  IN_EXECUTION: "Em Execução",
  COMPLETED: "Concluída",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_EXECUTION: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const avatarColors = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-orange-100 text-orange-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
];

function avatarColor(name: string): string {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

export default async function DashboardPage() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();
  const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  const threeMonthsBack = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [completedThisMonth, newClientsThisMonth, totalOrders, totalClients, recentOrders, calendarOrders] =
    await Promise.all([
      prisma.serviceOrder.count({ where: { companyId, status: "COMPLETED", completedAt: { gte: startOfMonth } } }),
      prisma.client.count({ where: { companyId, active: true, createdAt: { gte: startOfMonth } } }),
      prisma.serviceOrder.count({ where: { companyId } }),
      prisma.client.count({ where: { companyId, active: true } }),
      prisma.serviceOrder.findMany({
        take: 6,
        where: { companyId },
        orderBy: { scheduledDate: "desc" },
        include: {
          client: { select: { name: true } },
          technician: { select: { name: true } },
        },
      }),
      prisma.serviceOrder.findMany({
        where: { companyId, scheduledDate: { gte: threeMonthsBack, lte: threeMonthsAhead } },
        select: { id: true, scheduledDate: true, status: true, client: { select: { name: true } }, technician: { select: { name: true } } },
      }),
    ]);

  const calendarData: CalendarOrder[] = calendarOrders.map((o) => ({
    id: o.id,
    scheduledDate: o.scheduledDate.toISOString(),
    clientName: o.client.name,
    technicianName: o.technician.name,
    status: o.status,
  }));

  const topStats = [
    { label: "Ordens de Serviço Concluídas", value: completedThisMonth, icon: Briefcase, iconBg: "bg-violet-100", iconColor: "text-violet-600" },
    { label: "Novos Clientes", value: newClientsThisMonth, icon: Users, iconBg: "bg-orange-100", iconColor: "text-orange-500" },
    { label: `Faturamento em ${monthName}`, value: "—", icon: DollarSign, iconBg: "bg-teal-100", iconColor: "text-teal-600" },
  ];

  return (
    <div className="flex gap-5">
      <div className="flex-1 min-w-0 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topStats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Indicadores de Desempenho</h2>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              <p className="text-xs text-gray-400 mt-1">Total de Ordens de Serviço</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
              <p className="text-xs text-gray-400 mt-1">Total de Clientes</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-gray-400">—</p>
              <p className="text-xs text-gray-400 mt-1">Receita no período</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Acompanhamento das Ordens de Serviço</h2>
            </div>
            <Link href="/manager/service-orders" className="text-xs text-violet-600 hover:underline font-medium">Veja mais</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">Nenhuma ordem de serviço criada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-16">#OS</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Técnico Responsável</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Horário</th>
                    <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order, idx) => (
                    <OrderTableRow key={order.id} href={`/manager/service-orders/${order.id}`}>
                      <td className="px-5 py-3 text-xs font-semibold text-gray-500">#{idx + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarColor(order.technician.name)}`}>
                            {initials(order.technician.name)}
                          </div>
                          <span className="text-xs text-gray-700">{order.technician.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarColor(order.client.name)}`}>
                            {initials(order.client.name)}
                          </div>
                          <span className="text-xs text-gray-700">{order.client.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor[order.status]}`}>
                          {statusLabel[order.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-gray-500">{formatTime(order.scheduledDate)}</td>
                      <td className="px-5 py-3 text-right text-xs text-gray-500">{formatDateShort(order.scheduledDate)}</td>
                    </OrderTableRow>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="w-72 flex-shrink-0">
        <DashboardCalendar orders={calendarData} />
      </div>
    </div>
  );
}
