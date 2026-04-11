"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Plus, Trash2, ChevronDown, ChevronUp,
  Check, X, QrCode, Paperclip, FileText, Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import QRCodeModal from "@/components/equipment/QRCodeModal";

type CompItem = { id: string; name: string; order: number };
type Attachment = { id: string; name: string; url: string; fileType: string };
type PendingFile = { id: string; file: File };
type EquipComp = {
  id: string;
  name: string;
  order: number;
  items: CompItem[];
  open: boolean;
  attachments: Attachment[];
  pendingFiles: PendingFile[];
};

function genId() {
  return Math.random().toString(36).slice(2);
}

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [clientName, setClientName] = useState("");
  const [form, setForm] = useState({
    name: "", type: "", brand: "", model: "", serialNumber: "", installDate: "", notes: "",
  });
  const [components, setComponents] = useState<EquipComp[]>([]);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch(`/api/equipment/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          type: data.type ?? "",
          brand: data.brand ?? "",
          model: data.model ?? "",
          serialNumber: data.serialNumber ?? "",
          installDate: data.installDate ? data.installDate.slice(0, 10) : "",
          notes: data.notes ?? "",
        });
        setClientName(data.client?.name ?? "");
        setComponents(
          (data.components || []).map((c: EquipComp) => ({
            ...c,
            open: true,
            attachments: c.attachments || [],
            pendingFiles: [],
          }))
        );
      });
  }, [id]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addComponent() {
    setComponents((prev) => [
      ...prev,
      { id: genId(), name: "", order: prev.length, items: [], open: true, attachments: [], pendingFiles: [] },
    ]);
  }

  function removeComponent(cid: string) {
    setComponents((prev) => prev.filter((c) => c.id !== cid));
  }

  function toggleComponent(cid: string) {
    setComponents((prev) => prev.map((c) => c.id === cid ? { ...c, open: !c.open } : c));
  }

  function updateComponentName(cid: string, name: string) {
    setComponents((prev) => prev.map((c) => c.id === cid ? { ...c, name } : c));
  }

  function addItem(compId: string) {
    setComponents((prev) =>
      prev.map((c) => c.id === compId ? { ...c, items: [...c.items, { id: genId(), name: "", order: c.items.length }] } : c)
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

  function addPendingFiles(compId: string, files: FileList) {
    const newFiles: PendingFile[] = Array.from(files).map((f) => ({ id: genId(), file: f }));
    setComponents((prev) =>
      prev.map((c) => c.id === compId ? { ...c, pendingFiles: [...c.pendingFiles, ...newFiles] } : c)
    );
  }

  function removePendingFile(compId: string, fileId: string) {
    setComponents((prev) =>
      prev.map((c) => c.id === compId ? { ...c, pendingFiles: c.pendingFiles.filter((f) => f.id !== fileId) } : c)
    );
  }

  async function deleteAttachment(compId: string, attId: string) {
    setDeletingAttachment(attId);
    await fetch(`/api/equipment-component-attachments/${attId}`, { method: "DELETE" });
    setComponents((prev) =>
      prev.map((c) => c.id === compId ? { ...c, attachments: c.attachments.filter((a) => a.id !== attId) } : c)
    );
    setDeletingAttachment(null);
  }

  async function uploadPendingFiles(savedComponents: { id: string; order: number }[]) {
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/equipment/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        components: components.map((comp, ci) => ({
          // Send id only for existing DB components (CUIDs are longer than genId strings)
          id: comp.id.length > 10 ? comp.id : undefined,
          name: comp.name,
          order: ci,
          items: comp.items.map((item, ii) => ({ name: item.name, order: ii })),
        })),
      }),
    });

    if (res.ok) {
      const saved = await res.json();
      if (saved.components?.length > 0) {
        await uploadPendingFiles(saved.components);
      }
      // Reload to get fresh attachment data
      const fresh = await fetch(`/api/equipment/${id}`).then((r) => r.json());
      setComponents(
        (fresh.components || []).map((c: EquipComp) => ({
          ...c,
          open: true,
          attachments: c.attachments || [],
          pendingFiles: [],
        }))
      );
    }

    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      {showQR && (
        <QRCodeModal
          equipmentId={id}
          equipmentName={form.name}
          clientName={clientName}
          onClose={() => setShowQR(false)}
        />
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link href="/manager/equipment" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{form.name || "Equipamento"}</h1>
          <p className="text-sm text-gray-500">{clientName}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowQR(true)}>
          <QrCode className="w-3.5 h-3.5 mr-1" />
          QR Code
        </Button>
        {!editing ? (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} loading={loading}>
              <Check className="w-3.5 h-3.5 mr-1" />
              Salvar
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
              <X className="w-3.5 h-3.5 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Basic info */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-700">Dados do Equipamento</h2></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input label="Nome" value={form.name} onChange={(e) => update("name", e.target.value)} disabled={!editing} required />
              <Input label="Tipo" value={form.type} onChange={(e) => update("type", e.target.value)} disabled={!editing} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Marca" value={form.brand} onChange={(e) => update("brand", e.target.value)} disabled={!editing} />
                <Input label="Modelo" value={form.model} onChange={(e) => update("model", e.target.value)} disabled={!editing} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Número de Série" value={form.serialNumber} onChange={(e) => update("serialNumber", e.target.value)} disabled={!editing} />
                <Input label="Data de Instalação" type="date" value={form.installDate} onChange={(e) => update("installDate", e.target.value)} disabled={!editing} />
              </div>
              <Input label="Observações" value={form.notes} onChange={(e) => update("notes", e.target.value)} disabled={!editing} />
            </div>
          </CardContent>
        </Card>

        {/* Components */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-700">Componentes</h2>
                <p className="text-xs text-gray-400 mt-0.5">{components.length} grupo(s) cadastrado(s)</p>
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={addComponent}
                  className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Grupo
                </button>
              )}
            </div>
          </CardHeader>

          {components.length === 0 ? (
            <CardContent>
              {editing ? (
                <button
                  type="button"
                  onClick={addComponent}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 text-sm text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors flex flex-col items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar primeiro componente
                </button>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum componente cadastrado.</p>
              )}
            </CardContent>
          ) : (
            <div className="divide-y divide-gray-100">
              {components.map((comp, ci) => (
                <div key={comp.id} className="px-5 py-3">
                  {/* Component header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-center font-mono">{ci + 1}</span>
                    {editing ? (
                      <input
                        type="text"
                        placeholder="Nome do grupo"
                        value={comp.name}
                        onChange={(e) => updateComponentName(comp.id, e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-400 bg-gray-50"
                      />
                    ) : (
                      <span className="flex-1 text-sm font-medium text-gray-800">{comp.name}</span>
                    )}
                    {/* Attachment count badge (read mode) */}
                    {!editing && comp.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full">
                        <Paperclip className="w-3 h-3" />
                        {comp.attachments.length}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleComponent(comp.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {comp.open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {editing && (
                      <button
                        type="button"
                        onClick={() => removeComponent(comp.id)}
                        className="p-1 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {comp.open && (
                    <div className="ml-7 mt-2 space-y-1.5">
                      {/* Items */}
                      {comp.items.map((item, ii) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <span className="text-xs text-gray-300 w-4 text-right">{ii + 1}.</span>
                          {editing ? (
                            <input
                              type="text"
                              placeholder="Nome da peça"
                              value={item.name}
                              onChange={(e) => updateItemName(comp.id, item.id, e.target.value)}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-violet-400"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">{item.name}</span>
                          )}
                          {editing && (
                            <button
                              type="button"
                              onClick={() => removeItem(comp.id, item.id)}
                              className="p-1 text-gray-300 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {editing && (
                        <button
                          type="button"
                          onClick={() => addItem(comp.id)}
                          className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 ml-6 mt-1"
                        >
                          <Plus className="w-3 h-3" />
                          Adicionar peça
                        </button>
                      )}

                      {/* Attachments section */}
                      <div className="ml-6 mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          Anexos
                        </p>

                        {/* Existing attachments */}
                        {(comp.attachments.length > 0 || comp.pendingFiles.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {comp.attachments.map((att) => {
                              const isPdf = att.fileType === "application/pdf";
                              return (
                                <span key={att.id} className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 text-xs px-2 py-1 rounded-full">
                                  {isPdf ? <FileText className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="max-w-[120px] truncate hover:underline"
                                  >
                                    {att.name}
                                  </a>
                                  {editing && (
                                    <button
                                      type="button"
                                      onClick={() => deleteAttachment(comp.id, att.id)}
                                      className="text-violet-400 hover:text-red-500 ml-0.5"
                                      disabled={deletingAttachment === att.id}
                                    >
                                      {deletingAttachment === att.id
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <X className="w-3 h-3" />}
                                    </button>
                                  )}
                                </span>
                              );
                            })}

                            {/* Pending (not yet uploaded) files */}
                            {editing && comp.pendingFiles.map((pf) => {
                              const isPdf = pf.file.type === "application/pdf";
                              return (
                                <span key={pf.id} className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 border border-gray-200 text-xs px-2 py-1 rounded-full">
                                  {isPdf ? <FileText className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                                  <span className="max-w-[120px] truncate">{pf.file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removePendingFile(comp.id, pf.id)}
                                    className="text-gray-400 hover:text-red-500 ml-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {comp.attachments.length === 0 && comp.pendingFiles.length === 0 && !editing && (
                          <p className="text-xs text-gray-300">Nenhum arquivo anexado.</p>
                        )}

                        {editing && (
                          <>
                            <input
                              ref={(el) => { fileRefs.current[comp.id] = el; }}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.length) addPendingFiles(comp.id, e.target.files);
                                e.target.value = "";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => fileRefs.current[comp.id]?.click()}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 transition-colors mt-1"
                            >
                              <Paperclip className="w-3 h-3" />
                              Anexar arquivo
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {editing && (
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
              )}
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
