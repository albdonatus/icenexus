"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Paperclip, X, FileText, Loader2, Copy } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning";
import { Suspense } from "react";

type PendingFile = { id: string; file: File };
type CompItem = { id: string; name: string };
type EquipComp = { id: string; name: string; items: CompItem[]; open: boolean; pendingFiles: PendingFile[] };

function genId() {
  return Math.random().toString(36).slice(2);
}

function NewEquipmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { markDirty, markClean, navigate } = useUnsavedWarning();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    clientId: preselectedClientId,
    name: "",
    type: "",
    brand: "",
    model: "",
    serialNumber: "",
    installDate: "",
    notes: "",
  });
  const [components, setComponents] = useState<EquipComp[]>([]);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { markDirty(); }, []);

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients);
  }, []);

  function update(field: string, value: string) {
    markDirty();
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addComponent() {
    markDirty();
    setComponents((prev) => [...prev, { id: genId(), name: "", items: [], open: true, pendingFiles: [] }]);
  }

  function removeComponent(id: string) {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }

  function duplicateComponent(id: string) {
    setComponents((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const source = prev[idx];
      const copy: EquipComp = {
        id: genId(),
        name: `${source.name} (cópia)`,
        items: source.items.map((item) => ({ ...item, id: genId() })),
        open: true,
        pendingFiles: [],
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function toggleComponent(id: string) {
    setComponents((prev) => prev.map((c) => c.id === id ? { ...c, open: !c.open } : c));
  }

  function updateComponentName(id: string, name: string) {
    setComponents((prev) => prev.map((c) => c.id === id ? { ...c, name } : c));
  }

  function addItem(compId: string) {
    setComponents((prev) =>
      prev.map((c) => c.id === compId ? { ...c, items: [...c.items, { id: genId(), name: "" }] } : c)
    );
  }

  function removeItem(compId: string, itemId: string) {
    setComponents((prev) =>
      prev.map((c) => c.id === compId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c)
    );
  }

  function updateItemName(compId: string, itemId: string, name: string) {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === compId ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, name } : i) } : c
      )
    );
  }

  function addFiles(compId: string, files: FileList) {
    const newFiles: PendingFile[] = Array.from(files).map((f) => ({ id: genId(), file: f }));
    setComponents((prev) =>
      prev.map((c) => c.id === compId ? { ...c, pendingFiles: [...c.pendingFiles, ...newFiles] } : c)
    );
  }

  function removeFile(compId: string, fileId: string) {
    setComponents((prev) =>
      prev.map((c) => c.id === compId ? { ...c, pendingFiles: c.pendingFiles.filter((f) => f.id !== fileId) } : c)
    );
  }

  async function uploadComponentFiles(
    savedComponents: { id: string; order: number }[]
  ) {
    // Match saved components by order index
    const sorted = [...savedComponents].sort((a, b) => a.order - b.order);
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      const savedComp = sorted[i];
      if (!savedComp || comp.pendingFiles.length === 0) continue;

      for (const pf of comp.pendingFiles) {
        const fd = new FormData();
        fd.append("file", pf.file);
        fd.append("componentId", savedComp.id);
        await fetch("/api/equipment-component-attachments", { method: "POST", body: fd });
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.name || !form.type) {
      setError("Cliente, nome e tipo são obrigatórios");
      return;
    }
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      components: components.map((comp, ci) => ({
        name: comp.name,
        order: ci,
        items: comp.items.map((item, ii) => ({ name: item.name, order: ii })),
      })),
    };

    const res = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) { setError("Erro ao salvar"); setLoading(false); return; }

    const saved = await res.json();
    if (saved.components?.length > 0) {
      await uploadComponentFiles(saved.components);
    }

    markClean();
    router.push("/manager/equipment");
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/manager/equipment")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Equipamento</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-700">Dados do Equipamento</h2></CardHeader>
          <CardContent>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
            <div className="space-y-4">
              <Select label="Cliente *" value={form.clientId} onChange={(e) => update("clientId", e.target.value)} required>
                <option value="">Selecione o cliente</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Input label="Nome *" placeholder="Chiller #1, Split Sala Reuniões..." value={form.name} onChange={(e) => update("name", e.target.value)} required />
              <Input label="Tipo *" placeholder="Split, Chiller, VRF, Condensador..." value={form.type} onChange={(e) => update("type", e.target.value)} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Marca" placeholder="Carrier, Trane..." value={form.brand} onChange={(e) => update("brand", e.target.value)} />
                <Input label="Modelo" placeholder="30XA, 38HXC..." value={form.model} onChange={(e) => update("model", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Número de Série" value={form.serialNumber} onChange={(e) => update("serialNumber", e.target.value)} />
                <Input label="Data de Instalação" type="date" value={form.installDate} onChange={(e) => update("installDate", e.target.value)} />
              </div>
              <Input label="Observações" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Components Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-700">Componentes do Equipamento</h2>
                <p className="text-xs text-gray-400 mt-0.5">Defina os grupos, peças e anexe arquivos por componente</p>
              </div>
              <button
                type="button"
                onClick={addComponent}
                className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Adicionar Grupo
              </button>
            </div>
          </CardHeader>

          {components.length === 0 ? (
            <CardContent>
              <button
                type="button"
                onClick={addComponent}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 text-sm text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors flex flex-col items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adicionar primeiro componente
                <span className="text-xs text-gray-300">Ex: Evaporadora, Condensadora, Sistema Elétrico...</span>
              </button>
            </CardContent>
          ) : (
            <div className="divide-y divide-gray-100">
              {components.map((comp, ci) => (
                <div key={comp.id} className="px-5 py-3">
                  {/* Component header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-center font-mono">{ci + 1}</span>
                    <input
                      type="text"
                      placeholder="Nome do grupo (ex: Evaporadora, Condensadora...)"
                      value={comp.name}
                      onChange={(e) => updateComponentName(comp.id, e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-400 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => toggleComponent(comp.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {comp.open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateComponent(comp.id)}
                      className="p-1 text-gray-300 hover:text-violet-500"
                      title="Duplicar grupo"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeComponent(comp.id)}
                      className="p-1 text-gray-300 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {comp.open && (
                    <div className="ml-7 mt-2 space-y-1.5">
                      {/* Items */}
                      {comp.items.map((item, ii) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <span className="text-xs text-gray-300 w-4 text-right">{ii + 1}.</span>
                          <input
                            type="text"
                            placeholder="Nome da peça (ex: Filtro de ar, Compressor...)"
                            value={item.name}
                            onChange={(e) => updateItemName(comp.id, item.id, e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-violet-400"
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(comp.id, item.id)}
                            className="p-1 text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addItem(comp.id)}
                        className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 ml-6 mt-1"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar peça
                      </button>

                      {/* Attachments */}
                      <div className="ml-6 mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          Anexos do componente
                          <span className="text-gray-300 font-normal">(manuais, fichas técnicas...)</span>
                        </p>

                        {comp.pendingFiles.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {comp.pendingFiles.map((pf) => {
                              const isPdf = pf.file.type === "application/pdf";
                              return (
                                <span key={pf.id} className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 text-xs px-2 py-1 rounded-full">
                                  {isPdf ? <FileText className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                                  <span className="max-w-[120px] truncate">{pf.file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(comp.id, pf.id)}
                                    className="text-violet-400 hover:text-violet-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        <input
                          ref={(el) => { fileRefs.current[comp.id] = el; }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.length) addFiles(comp.id, e.target.files);
                            e.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileRefs.current[comp.id]?.click()}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 transition-colors"
                        >
                          <Paperclip className="w-3 h-3" />
                          Anexar arquivo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="px-5 py-3">
                <button
                  type="button"
                  onClick={addComponent}
                  className="flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-700"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar grupo
                </button>
              </div>
            </div>
          )}
        </Card>

        {loading && components.some((c) => c.pendingFiles.length > 0) && (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            Salvando equipamento e enviando arquivos...
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>Salvar Equipamento</Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/manager/equipment")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}

export default function NewEquipmentPage() {
  return (
    <Suspense>
      <NewEquipmentForm />
    </Suspense>
  );
}
