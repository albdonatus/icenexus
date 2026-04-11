"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default function EditServiceOrderPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ scheduledDate: "", technicianId: "", notes: "" });

  useEffect(() => {
    Promise.all([
      fetch(`/api/service-orders/${id}`).then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([order, techs]) => {
      const date = order.scheduledDate ? new Date(order.scheduledDate).toISOString().slice(0, 10) : "";
      setForm({ scheduledDate: date, technicianId: order.technician?.id ?? "", notes: order.notes ?? "" });
      setTechnicians(techs);
      setFetching(false);
    });
  }, [id]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.scheduledDate || !form.technicianId) { setError("Data e técnico são obrigatórios"); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/service-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao salvar");
      setLoading(false);
      return;
    }
    router.push(`/manager/service-orders/${id}`);
  }

  if (fetching) return <div className="text-sm text-gray-400 p-6">Carregando...</div>;

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/manager/service-orders/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Ordem de Serviço</h1>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-700">Dados da OS</h2></CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Data Agendada *"
              type="date"
              value={form.scheduledDate}
              onChange={(e) => update("scheduledDate", e.target.value)}
              required
            />
            <Select
              label="Técnico Responsável *"
              value={form.technicianId}
              onChange={(e) => update("technicianId", e.target.value)}
              required
            >
              <option value="">Selecione o técnico</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Observações para o técnico..."
                rows={3}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>Salvar Alterações</Button>
              <Link href={`/manager/service-orders/${id}`}>
                <Button type="button" variant="secondary">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
