"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default function AdminNewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [managers, setManagers] = useState<{ id: string; name: string; companyId: string | null }[]>([]);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "TECHNICIAN", phone: "", companyId: "",
  });

  useEffect(() => {
    fetch("/api/admin/users?role=MANAGER").then((r) => r.json()).then(setManagers);
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Nome, email e senha são obrigatórios");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao criar usuário");
      setLoading(false);
      return;
    }
    router.push("/admin/users");
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo Usuário</h1>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-700">Dados do Usuário</h2></CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome *" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            <Input label="Email *" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            <Input label="Senha *" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
            <Input label="Telefone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            <Select label="Papel *" value={form.role} onChange={(e) => update("role", e.target.value)} required>
              <option value="TECHNICIAN">Técnico</option>
              <option value="MANAGER">Gestor</option>
              <option value="SUPERADMIN">Super Admin</option>
            </Select>
            {form.role === "TECHNICIAN" && (
              <Select label="Empresa (Gestor)" value={form.companyId} onChange={(e) => update("companyId", e.target.value)}>
                <option value="">Selecione a empresa</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.companyId ?? m.id}>{m.name}</option>
                ))}
              </Select>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>Criar Usuário</Button>
              <Button type="button" variant="secondary" onClick={() => router.push("/admin/users")}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
