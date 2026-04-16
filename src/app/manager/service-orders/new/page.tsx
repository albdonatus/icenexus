"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Textarea from "@/components/ui/Textarea";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning";

export default function NewServiceOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { markDirty, markClean, navigate } = useUnsavedWarning();

  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [equipment, setEquipment] = useState<{ id: string; name: string; type: string }[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    clientId: "",
    equipmentId: "",
    technicianId: "",
    templateId: "",
    scheduledDate: "",
    notes: "",
    recurrence: "",
    recurrencesLeft: "",
  });

  useEffect(() => { markDirty(); }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/checklist-templates").then((r) => r.json()),
    ]).then(([cls, techs, tmpls]) => {
      setClients(cls);
      setTechnicians(techs);
      setTemplates(tmpls);
    });
  }, []);

  useEffect(() => {
    if (form.clientId) {
      fetch(`/api/equipment?clientId=${form.clientId}`)
        .then((r) => r.json())
        .then(setEquipment);
    } else {
      setEquipment([]);
    }
    setForm((f) => ({ ...f, equipmentId: "" }));
  }, [form.clientId]);

  function update(field: string, value: string) {
    markDirty();
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.equipmentId || !form.technicianId || !form.templateId || !form.scheduledDate) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/service-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) { setError("Erro ao criar ordem"); setLoading(false); return; }
    markClean();
    router.push("/manager/service-orders");
  }

  return (
    <div className="max-w-2xl">
<div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/manager/service-orders")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Ordem de Serviço</h1>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-700">Dados da OS</h2></CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Cliente *" value={form.clientId} onChange={(e) => update("clientId", e.target.value)} required>
              <option value="">Selecione o cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>

            <Select label="Equipamento *" value={form.equipmentId} onChange={(e) => update("equipmentId", e.target.value)} disabled={!form.clientId} required>
              <option value="">{form.clientId ? "Selecione o equipamento" : "Selecione o cliente primeiro"}</option>
              {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} ({eq.type})</option>)}
            </Select>

            <Select label="Técnico Responsável *" value={form.technicianId} onChange={(e) => update("technicianId", e.target.value)} required>
              <option value="">Selecione o técnico</option>
              {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>

            <Select label="Modelo de Checklist *" value={form.templateId} onChange={(e) => update("templateId", e.target.value)} required>
              <option value="">Selecione o checklist</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>

            <Input label="Data de Agendamento *" type="date" value={form.scheduledDate} onChange={(e) => update("scheduledDate", e.target.value)} required />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recorrência</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "", label: "Sem recorrência" },
                  { value: "MONTHLY", label: "Mensal" },
                  { value: "QUARTERLY", label: "Trimestral" },
                  { value: "SEMIANNUAL", label: "Semestral" },
                  { value: "ANNUAL", label: "Anual" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("recurrence", opt.value)}
                    className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-all ${
                      form.recurrence === opt.value
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-gray-500 border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {form.recurrence && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Número de recorrências</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ilimitado"
                      value={form.recurrencesLeft}
                      onChange={(e) => update("recurrencesLeft", e.target.value)}
                      className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-400"
                    />
                  </div>
                  <p className="text-xs text-violet-600">
                    {form.recurrencesLeft
                      ? `✓ Serão criadas ${form.recurrencesLeft} OS no total (incluindo esta).`
                      : "✓ A próxima OS será criada automaticamente ao concluir — sem limite."}
                  </p>
                </div>
              )}
            </div>

            <Textarea label="Observações" placeholder="Instruções adicionais para o técnico..." value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>Criar Ordem de Serviço</Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/manager/service-orders")}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
