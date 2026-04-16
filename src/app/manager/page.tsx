import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Briefcase, Users, DollarSign, FileText, RefreshCw, AlertCircle, Clock, Calendar, ChevronRight } from "lucide-react";
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

  const [completedThisMonth, newClientsThisMonth, totalOrders, totalClients, recentOrders, calendarOrders, upcomingOrders] =
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
      prisma.serviceOrder.findMany({
        take: 40,
        where: { companyId, status: { in: ["PENDING", "IN_EXECUTION"] } },
        orderBy: { scheduledDate: "asc" },
        include: {
          client: { select: { name: true } },
          technician: { select: { name: true } },
          equipment: { select: { name: true, type: true } },
        },
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

        {/* Próximas OS */}
        {(() => {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfToday = new Date(startOfToday.getTime() + 86400000);
          const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

          const overdue = upcomingOrders.filter((o) => new Date(o.scheduledDate) < startOfToday);
          const today = upcomingOrders.filter((o) => { const d = new Date(o.scheduledDate); return d >= startOfToday && d < endOfToday; });
          const thisWeek = upcomingOrders.filter((o) => { const d = new Date(o.scheduledDate); return d >= endOfToday && d < endOfWeek; });
          const thisMonth = upcomingOrders.filter((o) => { const d = new Date(o.scheduledDate); return d >= endOfWeek && d < endOfMonth; });
          const later = upcomingOrders.filter((o) => new Date(o.scheduledDate) >= endOfMonth);

          const groups = [
            { key: "overdue", label: "Atrasadas", icon: AlertCircle, iconColor: "text-red-500", bg: "bg-red-50", labelColor: "text-red-600", orders: overdue },
            { key: "today", label: "Hoje", icon: Clock, iconColor: "text-violet-500", bg: "bg-violet-50", labelColor: "text-violet-600", orders: today },
            { key: "week", label: "Esta semana", icon: Calendar, iconColor: "text-amber-500", bg: "bg-amber-50", labelColor: "text-amber-600", orders: thisWeek },
            { key: "month", label: "Este mês", icon: Calendar, iconColor: "text-blue-400", bg: "bg-blue-50", labelColor: "text-blue-500", orders: thisMonth },
            { key: "later", label: "Depois", icon: Calendar, iconColor: "text-gray-400", bg: "bg-gray-50", labelColor: "text-gray-500", orders: later },
          ].filter((g) => g.orders.length > 0);

          const countByStatus = {
            overdue: overdue.length,
            inExecution: upcomingOrders.filter((o) => o.status === "IN_EXECUTION").length,
          };

          return (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-violet-500" />
                  <h2 className="text-sm font-semibold text-gray-800">Agenda de OS</h2>
                  <span className="text-xs text-gray-400">({upcomingOrders.length} ativas)</span>
                </div>
                <Link href="/manager/service-orders?status=PENDING" className="text-xs text-violet-600 hover:underline font-medium flex items-center gap-0.5">
                  Ver todas <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Summary pills */}
              {upcomingOrders.length > 0 && (
                <div className="px-5 py-3 border-b border-gray-50 flex flex-wrap gap-2">
                  {countByStatus.overdue > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      {countByStatus.overdue} atrasada{countByStatus.overdue > 1 ? "s" : ""}
                    </span>
                  )}
                  {countByStatus.inExecution > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      {countByStatus.inExecution} em execução
                    </span>
                  )}
                  {today.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-violet-50 text-violet-600 border border-violet-200 px-2.5 py-1 rounded-full">
                      {today.length} hoje
                    </span>
                  )}
                  {thisWeek.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full">
                      {thisWeek.length} esta semana
                    </span>
                  )}
                </div>
              )}

              {upcomingOrders.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-400 text-sm">Nenhuma OS ativa no momento.</div>
              ) : (
                <div>
                  {groups.map((group) => (
                    <div key={group.key}>
                      {/* Group header */}
                      <div className={`px-5 py-2 flex items-center gap-1.5 ${group.bg} border-b border-gray-100`}>
                        <group.icon className={`w-3.5 h-3.5 ${group.iconColor}`} />
                        <span className={`text-xs font-semibold uppercase tracking-wide ${group.labelColor}`}>{group.label}</span>
                        <span className={`text-xs ${group.labelColor} opacity-70 ml-auto`}>{group.orders.length} OS</span>
                      </div>
                      {/* Orders in group */}
                      <div className="divide-y divide-gray-50">
                        {group.orders.map((order) => {
                          const d = new Date(order.scheduledDate);
                          const daysUntil = Math.round((d.getTime() - startOfToday.getTime()) / 86400000);
                          const isOverdue = daysUntil < 0;
                          const isInExecution = order.status === "IN_EXECUTION";
                          return (
                            <Link key={order.id} href={`/manager/service-orders/${order.id}`}
                              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                            >
                              {/* Date block */}
                              <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border ${
                                isOverdue ? "bg-red-50 border-red-200" : isInExecution ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                              }`}>
                                <span className={`text-[9px] font-bold uppercase leading-none ${isOverdue ? "text-red-400" : isInExecution ? "text-blue-400" : "text-gray-400"}`}>
                                  {d.toLocaleDateString("pt-BR", { month: "short" })}
                                </span>
                                <span className={`text-base font-bold leading-tight ${isOverdue ? "text-red-600" : isInExecution ? "text-blue-600" : "text-gray-700"}`}>
                                  {d.getDate()}
                                </span>
                              </div>

                              {/* Main info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{order.client.name}</p>
                                  {isInExecution && (
                                    <span className="flex-shrink-0 text-[10px] font-semibold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Em execução</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                  {order.equipment.name}
                                  <span className="mx-1 text-gray-300">·</span>
                                  {order.equipment.type}
                                  <span className="mx-1 text-gray-300">·</span>
                                  {order.technician.name}
                                </p>
                              </div>

                              {/* Countdown */}
                              <div className="flex-shrink-0 text-right">
                                <span className={`text-xs font-semibold ${
                                  isOverdue ? "text-red-500" : daysUntil === 0 ? "text-violet-600" : daysUntil <= 3 ? "text-amber-500" : "text-gray-400"
                                }`}>
                                  {isOverdue
                                    ? `${Math.abs(daysUntil)}d atraso`
                                    : daysUntil === 0 ? "Hoje"
                                    : daysUntil === 1 ? "Amanhã"
                                    : `em ${daysUntil}d`}
                                </span>
                                <p className="text-[10px] text-gray-300 mt-0.5">
                                  {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                                </p>
                              </div>

                              <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

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
