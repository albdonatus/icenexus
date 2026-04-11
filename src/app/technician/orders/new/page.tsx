"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Textarea from "@/components/ui/Textarea";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning";

export default function TechnicianNewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { markDirty, markClean, navigate } = useUnsavedWarning();

  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [equipment, setEquipment] = useState<{ id: string; name: string; type: string }[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    clientId: "",
    equipmentId: "",
    templateId: "",
    scheduledDate: "",
    notes: "",
  });

  useEffect(() => { markDirty(); }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/checklist-templates").then((r) => r.json()),
    ]).then(([cls, tmpls]) => {
      setClients(cls);
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
    if (!form.clientId || !form.equipmentId || !form.templateId || !form.scheduledDate) {
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

    if (!res.ok) {
      setError("Erro ao criar ordem de serviço");
      setLoading(false);
      return;
    }

    markClean();
    const order = await res.json();
    router.push(`/technician/orders/${order.id}`);
  }

  return (
    <div className="max-w-2xl">
<div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/technician")} className="text-gray-400 hover:text-gray-600">
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

            <Select label="Modelo de Checklist *" value={form.templateId} onChange={(e) => update("templateId", e.target.value)} required>
              <option value="">Selecione o checklist</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>

            <Input label="Data de Agendamento *" type="date" value={form.scheduledDate} onChange={(e) => update("scheduledDate", e.target.value)} required />

            <Textarea label="Observações" placeholder="Observações adicionais..." value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>Criar Ordem de Serviço</Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/technician")}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
