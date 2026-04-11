"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default function EditTechnicianPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", active: true });

  useEffect(() => {
    fetch(`/api/technicians/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({ name: data.name ?? "", email: data.email ?? "", phone: data.phone ?? "", active: data.active ?? true });
        setFetching(false);
      });
  }, [id]);

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) { setError("Nome e email são obrigatórios"); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/technicians/${id}`, {
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
    router.push("/manager/technicians");
  }

  if (fetching) return <div className="text-sm text-gray-400 p-6">Carregando...</div>;

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/manager/technicians" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Técnico</h1>
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-700">Dados do Técnico</h2></CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome *" placeholder="João da Silva" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            <Input label="Email *" type="email" placeholder="joao@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            <Input label="Telefone" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => update("active", e.target.checked)}
                className="w-4 h-4 accent-violet-600"
              />
              <label htmlFor="active" className="text-sm text-gray-700">Técnico ativo</label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>Salvar Alterações</Button>
              <Link href="/manager/technicians"><Button type="button" variant="secondary">Cancelar</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
