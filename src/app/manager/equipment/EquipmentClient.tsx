"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Copy, Trash2, Loader2, Wrench, X } from "lucide-react";

type EquipmentRow = {
  id: string;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  client: { id: string; name: string };
};

export default function EquipmentClient({ equipment }: { equipment: EquipmentRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Unique clients and types for filter dropdowns
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    equipment.forEach((eq) => map.set(eq.client.id, eq.client.name));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [equipment]);

  const types = useMemo(() => {
    const set = new Set(equipment.map((eq) => eq.type));
    return Array.from(set).sort();
  }, [equipment]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return equipment.filter((eq) => {
      const matchSearch =
        !q ||
        eq.name.toLowerCase().includes(q) ||
        eq.type.toLowerCase().includes(q) ||
        (eq.brand ?? "").toLowerCase().includes(q) ||
        (eq.model ?? "").toLowerCase().includes(q) ||
        (eq.serialNumber ?? "").toLowerCase().includes(q) ||
        eq.client.name.toLowerCase().includes(q);
      const matchClient = !clientFilter || eq.client.id === clientFilter;
      const matchType = !typeFilter || eq.type === typeFilter;
      return matchSearch && matchClient && matchType;
    });
  }, [equipment, search, clientFilter, typeFilter]);

  const hasFilters = search || clientFilter || typeFilter;

  async function duplicate(eq: EquipmentRow) {
    setDuplicating(eq.id);
    const res = await fetch(`/api/equipment/${eq.id}/duplicate`, { method: "POST" });
    setDuplicating(null);
    if (res.ok) {
      const data = await res.json();
      router.refresh();
      router.push(`/manager/equipment/${data.id}`);
    }
  }

  async function deleteEquipment(eq: EquipmentRow) {
    if (!window.confirm(`Excluir o equipamento "${eq.name}"?\n\nEsta ação não pode ser desfeita.`)) return;
    setDeleting(eq.id);
    await fetch(`/api/equipment/${eq.id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, tipo, marca, modelo, NS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Client filter */}
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400"
        >
          <option value="">Todos os clientes</option>
          {clients.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400"
        >
          <option value="">Todos os tipos</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setClientFilter(""); setTypeFilter(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2"
          >
            <X className="w-3.5 h-3.5" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Results count */}
      {hasFilters && (
        <p className="text-xs text-gray-400 mb-3">
          {filtered.length} de {equipment.length} equipamento(s)
        </p>
      )}

      {/* List */}
      {equipment.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum equipamento cadastrado</p>
          <Link
            href="/manager/equipment/new"
            className="mt-4 inline-block text-sm bg-violet-600 text-white px-4 py-2 rounded-xl hover:bg-violet-700 transition-colors"
          >
            Cadastrar Equipamento
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400 text-sm">Nenhum equipamento encontrado com os filtros aplicados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((eq) => (
              <div key={eq.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors group">
                {/* Main info — clickable */}
                <Link href={`/manager/equipment/${eq.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{eq.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {eq.type}
                    {eq.brand && ` · ${eq.brand}`}
                    {eq.model && ` ${eq.model}`}
                  </p>
                </Link>

                {/* Client */}
                <div className="hidden sm:block text-right shrink-0">
                  <p className="text-xs font-medium text-violet-600">{eq.client.name}</p>
                  {eq.serialNumber && (
                    <p className="text-[11px] text-gray-400">NS: {eq.serialNumber}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Duplicate */}
                  <button
                    onClick={() => duplicate(eq)}
                    disabled={duplicating === eq.id}
                    title="Duplicar equipamento"
                    className="p-1.5 rounded-lg text-gray-300 hover:bg-violet-50 hover:text-violet-500 transition-all disabled:opacity-50"
                  >
                    {duplicating === eq.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteEquipment(eq)}
                    disabled={deleting === eq.id}
                    title="Excluir equipamento"
                    className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                  >
                    {deleting === eq.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
