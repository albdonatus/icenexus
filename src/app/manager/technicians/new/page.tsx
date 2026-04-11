"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default function NewTechnicianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError("Todos os campos são obrigatórios"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
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

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/manager/technicians" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo Técnico</h1>
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-700">Dados de Acesso</h2></CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome *" placeholder="João da Silva" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            <Input label="Email *" type="email" placeholder="joao@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            <Input label="Senha *" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} />
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>Criar Técnico</Button>
              <Link href="/manager/technicians"><Button type="button" variant="secondary">Cancelar</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
