"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { useDocumentField, DocHint } from "@/hooks/useDocumentField";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", document: "", email: "", phone: "", address: "" });

  const { docState, docMessage, handleDocumentChange: handleDoc } = useDocumentField(
    (fields) => setForm((f) => ({
      ...f,
      name: fields.name || f.name,
      email: fields.email || f.email,
      phone: fields.phone || f.phone,
      address: fields.address || f.address,
    }))
  );

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((data) =>
        setForm({
          name: data.name ?? "",
          document: data.document ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
        })
      );
  }, [id]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleDocumentChange(raw: string) {
    handleDoc(raw, (masked) => update("document", masked));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (docState === "invalid") { setError("CPF inválido"); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError("Erro ao salvar"); setLoading(false); return; }
    router.push(`/manager/clients/${id}`);
  }


  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/manager/clients/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-700">Dados do Cliente</h2></CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome *" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            <div>
              <Input
                label="CNPJ / CPF"
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
                value={form.document}
                onChange={(e) => handleDocumentChange(e.target.value)}
              />
              <DocHint state={docState} message={docMessage} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Telefone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <Input label="Endereço" value={form.address} onChange={(e) => update("address", e.target.value)} />
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>Salvar</Button>
              <Link href={`/manager/clients/${id}`}><Button type="button" variant="secondary">Cancelar</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
