"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default function AdminEditUserPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [managers, setManagers] = useState<{ id: string; name: string; companyId: string | null }[]>([]);
  const [form, setForm] = useState({
    name: "", companyName: "", document: "", email: "", phone: "", role: "", companyId: "", active: true, password: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/users/${id}`).then((r) => r.json()),
      fetch("/api/admin/users?role=MANAGER").then((r) => r.json()),
    ]).then(([user, mgrs]) => {
      setForm({
        name: user.name ?? "",
        companyName: user.companyName ?? "",
        document: user.document ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: user.role ?? "TECHNICIAN",
        companyId: user.companyId ?? "",
        active: user.active ?? true,
        password: "",
      });
      setManagers(mgrs);
    });
  }, [id]);

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body: Record<string, unknown> = {
      name: form.name,
      companyName: form.companyName || null,
      document: form.document || null,
      email: form.email,
      phone: form.phone,
      role: form.role,
      companyId: form.companyId || null,
      active: form.active,
    };
    if (form.password) body.password = form.password;

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao salvar");
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
        <h1 className="text-2xl font-bold text-gray-900">Editar Usuário</h1>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-700">Dados do Usuário</h2></CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome do responsável *" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            <Input label="Nome da empresa" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Razão social ou nome fantasia" />
            <Input label="CPF / CNPJ" value={form.document} onChange={(e) => update("document", e.target.value)} placeholder="00.000.000/0000-00" />
            <Input label="Email *" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            <Input label="Nova Senha" type="password" placeholder="Deixe em branco para manter" value={form.password} onChange={(e) => update("password", e.target.value)} />
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
            <div className="flex items-center gap-3 py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => update("active", e.target.checked)}
                  className="w-4 h-4 accent-violet-600"
                />
                <span className="text-sm text-gray-700">Usuário ativo</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>Salvar</Button>
              <Button type="button" variant="secondary" onClick={() => router.push("/admin/users")}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
