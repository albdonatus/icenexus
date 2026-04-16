"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Order {
  id: string;
  clientId: string;
  clientName: string;
  equipmentName: string;
  equipmentType: string;
  technicianName: string;
  completedAt: string;
  scheduledDate: string;
}

interface Props {
  orders: Order[];
  clients: { id: string; name: string }[];
  currentPeriod: string;
  currentClientId: string;
}

const PERIODS = [
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês passado" },
  { value: "3_months", label: "3 meses" },
  { value: "6_months", label: "6 meses" },
  { value: "this_year", label: "Este ano" },
];

export default function ReportsClient({ orders, clients, currentPeriod, currentClientId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [downloading, setDownloading] = useState(false);

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/manager/reports?${params.toString()}`);
  }

  async function downloadAll() {
    setDownloading(true);
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const link = document.createElement("a");
      link.href = `/api/service-orders/${order.id}/pdf`;
      link.download = `OS-${order.id.slice(-8).toUpperCase()}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Small delay to avoid overwhelming the browser
      if (i < orders.length - 1) await new Promise((r) => setTimeout(r, 600));
    }
    setDownloading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} OS concluída(s) no período</p>
        </div>
        {orders.length > 0 && (
          <button
            onClick={downloadAll}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? "Baixando..." : `Baixar todos (${orders.length})`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => applyFilter("period", p.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                currentPeriod === p.value
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-violet-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <select
          value={currentClientId}
          onChange={(e) => applyFilter("clientId", e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-violet-400 bg-gray-50 w-full sm:w-auto"
        >
          <option value="">Todos os clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma OS concluída no período selecionado</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_4px_0_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-gray-900 text-sm">{order.clientName}</p>
                    <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Concluída</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {order.equipmentName} ({order.equipmentType}) · {order.technicianName} · concluída em {formatDate(order.completedAt)}
                  </p>
                </div>
                <a
                  href={`/api/service-orders/${order.id}/pdf`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-all font-medium ml-4 flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
