import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Building2, Users, Wrench, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/Badge";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session || (session.user.role as string) !== "SUPERADMIN") redirect("/login");

  // Global counts
  const [totalManagers, totalTechnicians, totalEquipment, totalClients, totalOrders, recentOrders, companiesRaw] =
    await Promise.all([
      prisma.user.count({ where: { role: "MANAGER", active: true } }),
      prisma.user.count({ where: { role: "TECHNICIAN", active: true } }),
      prisma.equipment.count({ where: { active: true } }),
      prisma.client.count({ where: { active: true } }),
      prisma.serviceOrder.count(),
      prisma.serviceOrder.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true } },
          equipment: { select: { name: true, type: true } },
          technician: { select: { name: true } },
        },
      }),
      // Group companies by companyId — each MANAGER represents a tenant
      prisma.user.findMany({
        where: { role: "MANAGER", active: true },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          companyId: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  // Per-company stats
  const companyIds = companiesRaw.map((m) => m.companyId ?? m.id);
  const [equipCounts, clientCounts, orderCounts, techCounts] = await Promise.all([
    prisma.equipment.groupBy({ by: ["companyId"], where: { active: true }, _count: true }),
    prisma.client.groupBy({ by: ["companyId"], where: { active: true }, _count: true }),
    prisma.serviceOrder.groupBy({ by: ["companyId"], _count: true }),
    prisma.user.groupBy({ by: ["companyId"], where: { role: "TECHNICIAN", active: true }, _count: true }),
  ]);

  const byCompany = (arr: { companyId: string | null; _count: number }[], id: string) =>
    arr.find((x) => x.companyId === id)?._count ?? 0;

  const completedOrders = await prisma.serviceOrder.count({ where: { status: "COMPLETED" } });
  const pendingOrders = await prisma.serviceOrder.count({ where: { status: "PENDING" } });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Global</h1>
        <p className="text-sm text-gray-500">Visão consolidada de todas as empresas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={<Building2 className="w-5 h-5 text-violet-600" />} label="Empresas" value={totalManagers} bg="bg-violet-50" />
        <KpiCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Técnicos" value={totalTechnicians} bg="bg-blue-50" />
        <KpiCard icon={<Wrench className="w-5 h-5 text-orange-500" />} label="Equipamentos" value={totalEquipment} bg="bg-orange-50" />
        <KpiCard icon={<ClipboardList className="w-5 h-5 text-green-600" />} label="Ordens de Serviço" value={totalOrders} bg="bg-green-50" />
      </div>

      {/* OS Status row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Pendentes</p>
            <p className="text-xl font-bold text-gray-900">{pendingOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Em Execução</p>
            <p className="text-xl font-bold text-gray-900">{totalOrders - completedOrders - pendingOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Concluídas</p>
            <p className="text-xl font-bold text-gray-900">{completedOrders}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Companies table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Empresas cadastradas</h2>
            <span className="text-xs text-gray-400">{companiesRaw.length} empresa(s)</span>
          </div>
          <div className="divide-y divide-gray-50">
            {companiesRaw.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">Nenhuma empresa cadastrada</p>
            )}
            {companiesRaw.map((manager) => {
              const cid = manager.companyId ?? manager.id;
              return (
                <div key={manager.id} className="px-5 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{manager.name}</p>
                      <p className="text-xs text-gray-400 truncate">{manager.email}</p>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatDate(manager.createdAt)}</p>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Chip label={`${byCompany(techCounts, cid)} técnicos`} />
                    <Chip label={`${byCompany(clientCounts, cid)} clientes`} />
                    <Chip label={`${byCompany(equipCounts, cid)} equip.`} />
                    <Chip label={`${byCompany(orderCounts, cid)} OS`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Últimas ordens de serviço</h2>
            <span className="text-xs text-gray-400">todas as empresas</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-xs text-gray-400">{formatDate(order.scheduledDate)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{order.client.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {order.equipment.name} · {order.technician?.name ?? "Sem técnico"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{label}</span>
  );
}
