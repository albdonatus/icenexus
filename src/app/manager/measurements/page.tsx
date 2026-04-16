"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import Link from "next/link";

type Equipment = { id: string; name: string; type: string; client: { name: string } };
type Measurement = { description: string; units: string[] };
type DataPoint = { date: string; value: number; unit: string; orderId: string; technician: string; checklist: string };

const WINDOWS = [
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "1 ano" },
  { value: "2a", label: "2 anos" },
  { value: "all", label: "Tudo" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatDateAxis(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function avg(pts: DataPoint[]) {
  if (!pts.length) return 0;
  return pts.reduce((s, p) => s + p.value, 0) / pts.length;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: DataPoint; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[180px]">
      <p className="font-bold text-gray-900 text-sm mb-1">{p.value} {p.unit}</p>
      <p className="text-gray-500">{formatDate(p.date)}</p>
      <p className="text-gray-400 mt-1">{p.technician}</p>
      <p className="text-gray-400 truncate max-w-[200px]">{p.checklist}</p>
      <Link href={`/manager/service-orders/${p.orderId}`} className="text-violet-600 hover:underline mt-1 block">
        Ver OS →
      </Link>
    </div>
  );
}

export default function MeasurementsPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquip, setSelectedEquip] = useState("");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedDesc, setSelectedDesc] = useState("");
  const [window, setWindow] = useState("12m");
  const [points, setPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  useEffect(() => {
    fetch("/api/equipment").then((r) => r.json()).then(setEquipment);
  }, []);

  useEffect(() => {
    if (!selectedEquip) { setMeasurements([]); setSelectedDesc(""); return; }
    setLoadingMeasurements(true);
    setSelectedDesc("");
    setPoints([]);
    fetch(`/api/measurements?equipmentId=${selectedEquip}`)
      .then((r) => r.json())
      .then((data) => { setMeasurements(data); setLoadingMeasurements(false); });
  }, [selectedEquip]);

  useEffect(() => {
    if (!selectedEquip || !selectedDesc) { setPoints([]); return; }
    setLoading(true);
    fetch(`/api/measurements/series?equipmentId=${selectedEquip}&description=${encodeURIComponent(selectedDesc)}&window=${window}`)
      .then((r) => r.json())
      .then((data) => { setPoints(data); setLoading(false); });
  }, [selectedEquip, selectedDesc, window]);

  const equip = equipment.find((e) => e.id === selectedEquip);
  const mean = avg(points);
  const minVal = points.length ? Math.min(...points.map((p) => p.value)) : 0;
  const maxVal = points.length ? Math.max(...points.map((p) => p.value)) : 0;
  const unit = points[0]?.unit ?? measurements.find((m) => m.description === selectedDesc)?.units[0] ?? "";
  const trend = points.length >= 2 ? points[points.length - 1].value - points[0].value : 0;

  // Y axis domain with 10% padding
  const yMin = points.length ? Math.floor(minVal * 0.9) : 0;
  const yMax = points.length ? Math.ceil(maxVal * 1.1) : 100;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Medições</h1>
        <p className="text-sm text-gray-500 mt-1">Série temporal de valores numéricos registrados nos checklists</p>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Equipment */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Equipamento</label>
            <select
              value={selectedEquip}
              onChange={(e) => setSelectedEquip(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 bg-white"
            >
              <option value="">Selecione o equipamento...</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} — {eq.client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Measurement */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Parâmetro medido</label>
            <select
              value={selectedDesc}
              onChange={(e) => setSelectedDesc(e.target.value)}
              disabled={!selectedEquip || loadingMeasurements}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 bg-white disabled:opacity-50"
            >
              <option value="">
                {!selectedEquip ? "Selecione o equipamento primeiro" : loadingMeasurements ? "Carregando..." : measurements.length === 0 ? "Nenhuma medição registrada" : "Selecione o parâmetro..."}
              </option>
              {measurements.map((m) => (
                <option key={m.description} value={m.description}>
                  {m.description}{m.units.length > 0 ? ` (${m.units.join(", ")})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time window */}
        {selectedDesc && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Janela</span>
            {WINDOWS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setWindow(w.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  window === w.value
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white text-gray-500 border-gray-200 hover:border-violet-300"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart area */}
      {selectedDesc && (
        <>
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-sm text-gray-400">
              Carregando dados...
            </div>
          ) : points.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-sm text-gray-400">
              Nenhuma medição encontrada nesse período.
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Medições", value: points.length.toString(), unit: "registros" },
                  { label: "Média", value: mean.toFixed(2), unit },
                  { label: "Mínimo", value: minVal.toFixed(2), unit },
                  { label: "Máximo", value: maxVal.toFixed(2), unit },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.unit}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedDesc}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{equip?.name} · {equip?.client.name}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${trend > 0 ? "text-red-500" : trend < 0 ? "text-green-500" : "text-gray-400"}`}>
                    {trend > 0 ? <TrendingUp className="w-4 h-4" /> : trend < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    {trend > 0 ? "+" : ""}{trend.toFixed(2)} {unit}
                    <span className="text-xs font-normal text-gray-400 ml-1">vs início</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateAxis}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[yMin, yMax]}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v} ${unit}`}
                      width={72}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={mean} stroke="#c4b5fd" strokeDasharray="4 4" label={{ value: `Média: ${mean.toFixed(1)}`, position: "insideTopRight", fontSize: 10, fill: "#7c3aed" }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#7c3aed", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#7c3aed" }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <p className="text-[10px] text-gray-300 mt-3 text-right">
                  {points.length} pontos · {formatDate(points[0].date)} → {formatDate(points[points.length - 1].date)}
                </p>
              </div>

              {/* Data table */}
              <div className="bg-white rounded-xl border border-gray-100 mt-4 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-700">Registros individuais</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-50">
                        <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Valor</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Técnico</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Checklist</th>
                        <th className="px-5 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...points].reverse().map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-gray-600">{formatDate(p.date)}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{p.value} {p.unit}</td>
                          <td className="px-4 py-3 text-gray-500">{p.technician}</td>
                          <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">{p.checklist}</td>
                          <td className="px-5 py-3 text-right">
                            <Link href={`/manager/service-orders/${p.orderId}`} className="text-violet-600 hover:underline">
                              Ver OS →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!selectedDesc && !selectedEquip && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-gray-500 font-medium">Selecione um equipamento e parâmetro</p>
          <p className="text-sm text-gray-400 mt-1">para visualizar o histórico de medições</p>
        </div>
      )}
    </div>
  );
}
