"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, FileText, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface SubComponent {
  id: string;
  name: string;
}

interface Component {
  id: string;
  name: string;
  items: SubComponent[];
}

interface Order {
  id: string;
  status: string;
  scheduledDate: string;
  client: { id: string; name: string };
  equipment: { id: string; name: string; type: string; components: Component[] };
  technician: { name: string };
}

interface Props {
  orders: Order[];
}

export default function ServiceOrdersClient({ orders }: Props) {
  const [clientId, setClientId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [componentId, setComponentId] = useState("");
  const [subComponentId, setSubComponentId] = useState("");
  const [status, setStatus] = useState("");

  // Unique clients from orders
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => map.set(o.client.id, o.client.name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  // Equipment filtered by selected client
  const equipments = useMemo(() => {
    const map = new Map<string, { id: string; name: string; components: Component[] }>();
    orders
      .filter((o) => !clientId || o.client.id === clientId)
      .forEach((o) => {
        if (!map.has(o.equipment.id)) map.set(o.equipment.id, o.equipment);
      });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders, clientId]);

  // Components filtered by selected equipment
  const components = useMemo(() => {
    if (!equipmentId) return [];
    const eq = orders.find((o) => o.equipment.id === equipmentId);
    return eq?.equipment.components ?? [];
  }, [orders, equipmentId]);

  // Sub-components filtered by selected component
  const subComponents = useMemo(() => {
    if (!componentId) return [];
    const comp = components.find((c) => c.id === componentId);
    return comp?.items ?? [];
  }, [components, componentId]);

  // Filtered orders
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (clientId && o.client.id !== clientId) return false;
      if (equipmentId && o.equipment.id !== equipmentId) return false;
      if (componentId && !o.equipment.components.some((c) => c.id === componentId)) return false;
      if (subComponentId && !o.equipment.components.some((c) =>
        c.items.some((i) => i.id === subComponentId)
      )) return false;
      if (status && o.status !== status) return false;
      return true;
    });
  }, [orders, clientId, equipmentId, componentId, status]);

  const hasFilters = clientId || equipmentId || componentId || subComponentId || status;

  function clearFilters() {
    setClientId("");
    setEquipmentId("");
    setComponentId("");
    setSubComponentId("");
    setStatus("");
  }

  function handleClientChange(val: string) {
    setClientId(val);
    setEquipmentId("");
    setComponentId("");
    setSubComponentId("");
  }

  function handleEquipmentChange(val: string) {
    setEquipmentId(val);
    setComponentId("");
    setSubComponentId("");
  }

  function handleComponentChange(val: string) {
    setComponentId(val);
    setSubComponentId("");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} de {orders.length} ordem(ns)
          </p>
        </div>
        <Link href="/manager/service-orders/new">
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Nova OS
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-violet-400 bg-gray-50"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="IN_EXECUTION">Em Execução</option>
            <option value="COMPLETED">Concluída</option>
          </select>

          {/* Client */}
          <select
            value={clientId}
            onChange={(e) => handleClientChange(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-violet-400 bg-gray-50"
          >
            <option value="">Todos os clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Equipment */}
          <select
            value={equipmentId}
            onChange={(e) => handleEquipmentChange(e.target.value)}
            disabled={equipments.length === 0}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-violet-400 bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">Todos os equipamentos</option>
            {equipments.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          {/* Component */}
          <select
            value={componentId}
            onChange={(e) => handleComponentChange(e.target.value)}
            disabled={components.length === 0}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-violet-400 bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">Todos os componentes</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Sub-component */}
          <select
            value={subComponentId}
            onChange={(e) => setSubComponentId(e.target.value)}
            disabled={subComponents.length === 0}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-violet-400 bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">Todos os subcomponentes</option>
            {subComponents.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
            Limpar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {hasFilters ? "Nenhuma OS encontrada para os filtros selecionados" : "Nenhuma ordem de serviço criada"}
          </p>
          {!hasFilters && (
            <Link href="/manager/service-orders/new" className="mt-4 inline-block">
              <Button>Criar OS</Button>
            </Link>
          )}
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-gray-100">
            {filtered.map((order) => (
              <Link
                key={order.id}
                href={`/manager/service-orders/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-gray-900 text-sm">{order.client.name}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-gray-500">
                    {order.equipment.name} ({order.equipment.type}) · {order.technician.name}
                  </p>
                </div>
                <p className="text-sm text-gray-500 ml-4 flex-shrink-0">
                  {formatDate(order.scheduledDate)}
                </p>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
