"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning";
import { Plus, Trash2, ArrowLeft, GripVertical, ChevronDown, X, Download, FileText, ImageIcon, Paperclip } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { UNIT_GROUPS } from "@/lib/units";

type ActionType = "TEXT" | "NUMBER" | "BOOLEAN";

interface ExistingAttachment {
  id: string;
  name: string;
  url: string;
  fileType: string;
}

interface Action {
  id: string;
  description: string;
  type: ActionType;
  units: string[];
  recommendation: string;
  attachments: ExistingAttachment[];
  pendingFiles: File[];
  removedAttachmentIds: string[];
}

interface Component {
  id: string;
  name: string;
  actions: Action[];
}

interface ChecklistTemplateBuilderProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    equipmentType: string;
    components: {
      id?: string;
      name: string;
      actions: {
        id?: string;
        description: string;
        type: "TEXT" | "NUMBER" | "BOOLEAN";
        units: string[];
        recommendation?: string;
        attachments?: ExistingAttachment[];
      }[];
    }[];
  };
  mode: "create" | "edit";
}

function genId() {
  return Math.random().toString(36).slice(2);
}

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  TEXT: "Verificação",
  NUMBER: "Medição",
  BOOLEAN: "Troca / Confirmação",
};

const ACTION_TYPE_COLORS: Record<ActionType, string> = {
  TEXT: "bg-gray-100 text-gray-700",
  NUMBER: "bg-blue-100 text-blue-700",
  BOOLEAN: "bg-green-100 text-green-700",
};

type EquipmentOption = { id: string; name: string; type: string; client: { name: string }; _count: { components: number } };
type EquipmentComponentData = {
  id: string; name: string; order: number;
  items: { id: string; name: string; order: number }[];
};

function emptyAction(): Action {
  return { id: genId(), description: "", type: "TEXT", units: [], recommendation: "", attachments: [], pendingFiles: [], removedAttachmentIds: [] };
}

export default function ChecklistTemplateBuilder({ initialData, mode }: ChecklistTemplateBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { markDirty, markClean, navigate } = useUnsavedWarning();
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [equipmentType, setEquipmentType] = useState(initialData?.equipmentType ?? "");
  const [components, setComponents] = useState<Component[]>(
    initialData?.components.map((c) => ({
      id: c.id ?? genId(),
      name: c.name,
      actions: c.actions.map((a) => ({
        id: a.id ?? genId(),
        description: a.description,
        type: a.type,
        units: a.units,
        recommendation: a.recommendation ?? "",
        attachments: a.attachments ?? [],
        pendingFiles: [],
        removedAttachmentIds: [],
      })),
    })) ?? []
  );
  const [openUnits, setOpenUnits] = useState<string | null>(null);
  const [openRec, setOpenRec] = useState<string | null>(null);

  // Equipment types dropdown
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [newEquip, setNewEquip] = useState({ clientId: "", name: "", type: "" });
  const [savingEquip, setSavingEquip] = useState(false);
  const [equipError, setEquipError] = useState("");

  // Import from equipment
  const [showImportModal, setShowImportModal] = useState(false);
  const [equipmentList, setEquipmentList] = useState<EquipmentOption[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { markDirty(); }, []);

  useEffect(() => {
    fetch("/api/equipment/types").then((r) => r.json()).then(setEquipmentTypes);
  }, []);

  function openEquipModal() {
    setNewEquip({ clientId: "", name: "", type: "" });
    setEquipError("");
    if (clients.length === 0) fetch("/api/clients").then((r) => r.json()).then(setClients);
    setShowEquipModal(true);
  }

  function openImportModal() {
    setShowImportModal(true);
    if (equipmentList.length === 0) {
      setLoadingEquipments(true);
      fetch("/api/equipment")
        .then((r) => r.json())
        .then((data: EquipmentOption[]) => {
          setEquipmentList(data.filter((e) => e._count.components > 0));
          setLoadingEquipments(false);
        });
    }
  }

  async function handleImportEquipment(equipId: string) {
    setImportingId(equipId);
    const res = await fetch(`/api/equipment/${equipId}/components`);
    const data = await res.json();
    const imported: Component[] = (data.components as EquipmentComponentData[]).map((comp) => ({
      id: genId(),
      name: comp.name,
      actions: comp.items.map((item) => ({
        id: genId(),
        description: item.name,
        type: "TEXT" as ActionType,
        units: [],
        recommendation: "",
        attachments: [],
        pendingFiles: [],
        removedAttachmentIds: [],
      })),
    }));

    const equip = equipmentList.find((e) => e.id === equipId);
    if (equip && !equipmentType) setEquipmentType(equip.type);

    if (components.length > 0) {
      const confirmed = window.confirm(
        `Substituir os ${components.length} componente(s) existentes pelos ${imported.length} componente(s) do equipamento "${equip?.name}"?`
      );
      if (!confirmed) { setImportingId(null); return; }
    }

    setComponents(imported);
    if (!name && equip) setName(`Manutenção Preventiva - ${equip.type}`);
    setImportingId(null);
    setShowImportModal(false);
  }

  async function handleCreateEquipment() {
    if (!newEquip.clientId || !newEquip.name || !newEquip.type) { setEquipError("Preencha cliente, nome e tipo"); return; }
    setSavingEquip(true);
    const res = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEquip),
    });
    setSavingEquip(false);
    if (!res.ok) { setEquipError("Erro ao cadastrar"); return; }
    const created = await res.json();
    const newType: string = created.type;
    setEquipmentTypes((prev) => prev.includes(newType) ? prev : [...prev, newType].sort());
    setEquipmentType(newType);
    setShowEquipModal(false);
  }

  function addComponent() {
    markDirty();
    setComponents((prev) => [...prev, { id: genId(), name: "", actions: [emptyAction()] }]);
  }

  function removeComponent(compId: string) {
    markDirty();
    setComponents((prev) => prev.filter((c) => c.id !== compId));
  }

  function updateComponentName(compId: string, value: string) {
    markDirty();
    setComponents((prev) => prev.map((c) => c.id === compId ? { ...c, name: value } : c));
  }

  function addAction(compId: string) {
    markDirty();
    setComponents((prev) =>
      prev.map((c) => c.id === compId ? { ...c, actions: [...c.actions, emptyAction()] } : c)
    );
  }

  function removeAction(compId: string, actionId: string) {
    markDirty();
    setComponents((prev) =>
      prev.map((c) => c.id === compId ? { ...c, actions: c.actions.filter((a) => a.id !== actionId) } : c)
    );
  }

  function updateAction(compId: string, actionId: string, field: keyof Action, value: unknown) {
    markDirty();
    setComponents((prev) =>
      prev.map((c) =>
        c.id === compId
          ? {
              ...c,
              actions: c.actions.map((a) =>
                a.id === actionId
                  ? { ...a, [field]: value, ...(field === "type" && value !== "NUMBER" ? { units: [] } : {}) }
                  : a
              ),
            }
          : c
      )
    );
  }

  function toggleUnit(compId: string, actionId: string, unit: string) {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === compId
          ? {
              ...c,
              actions: c.actions.map((a) =>
                a.id === actionId
                  ? { ...a, units: a.units.includes(unit) ? a.units.filter((u) => u !== unit) : [...a.units, unit] }
                  : a
              ),
            }
          : c
      )
    );
  }

  function addPendingFile(compId: string, actionId: string, files: FileList) {
    const newFiles = Array.from(files);
    setComponents((prev) =>
      prev.map((c) =>
        c.id === compId
          ? { ...c, actions: c.actions.map((a) => a.id === actionId ? { ...a, pendingFiles: [...a.pendingFiles, ...newFiles] } : a) }
          : c
      )
    );
  }

  function removePendingFile(compId: string, actionId: string, index: number) {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === compId
          ? { ...c, actions: c.actions.map((a) => a.id === actionId ? { ...a, pendingFiles: a.pendingFiles.filter((_, i) => i !== index) } : a) }
          : c
      )
    );
  }

  function removeExistingAttachment(compId: string, actionId: string, attId: string) {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === compId
          ? {
              ...c,
              actions: c.actions.map((a) =>
                a.id === actionId
                  ? {
                      ...a,
                      attachments: a.attachments.filter((att) => att.id !== attId),
                      removedAttachmentIds: [...a.removedAttachmentIds, attId],
                    }
                  : a
              ),
            }
          : c
      )
    );
  }

  async function uploadAttachmentsForTemplate(
    templateComponents: { actions: { id: string }[] }[],
  ) {
    for (let ci = 0; ci < components.length; ci++) {
      const localComp = components[ci];
      const savedComp = templateComponents[ci];
      if (!savedComp) continue;

      for (let ai = 0; ai < localComp.actions.length; ai++) {
        const localAction = localComp.actions[ai];
        const savedAction = savedComp.actions[ai];
        if (!savedAction) continue;

        const realActionId = savedAction.id;

        // Delete removed attachments from DB
        for (const removedId of localAction.removedAttachmentIds) {
          await fetch(`/api/action-attachments/${removedId}`, { method: "DELETE" });
        }

        // Restore surviving existing attachments (needed in edit mode since actions are recreated)
        if (mode === "edit") {
          for (const att of localAction.attachments) {
            await fetch("/api/action-attachments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ actionId: realActionId, name: att.name, url: att.url, fileType: att.fileType }),
            });
          }
        }

        // Upload new files
        for (const file of localAction.pendingFiles) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("actionId", realActionId);
          await fetch("/api/action-attachments", { method: "POST", body: fd });
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) { setError("Nome é obrigatório"); return; }
    if (components.length === 0) { setError("Adicione pelo menos um componente"); return; }

    const payload = {
      name,
      description,
      equipmentType,
      components: components.map((comp, ci) => ({
        name: comp.name,
        order: ci,
        actions: comp.actions.map((act, ai) => ({
          description: act.description,
          type: act.type,
          units: act.units,
          recommendation: act.recommendation || null,
          order: ai,
        })),
      })),
    };

    setLoading(true);
    setError("");

    const url = mode === "create" ? "/api/checklist-templates" : `/api/checklist-templates/${initialData?.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { setError("Erro ao salvar"); setLoading(false); return; }

    const saved = await res.json();

    // Upload attachments using the real action IDs from the response
    const hasAttachments = components.some((c) =>
      c.actions.some((a) => a.pendingFiles.length > 0 || a.removedAttachmentIds.length > 0 || (mode === "edit" && a.attachments.length > 0))
    );
    if (hasAttachments) {
      await uploadAttachmentsForTemplate(saved.components);
    }

    markClean();
    router.push("/manager/checklists");
  }

  return (
    <div className="max-w-3xl">
<div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/manager/checklists")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "create" ? "Novo Modelo de Checklist" : "Editar Modelo"}
        </h1>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-4 text-xs">
        {(Object.entries(ACTION_TYPE_LABELS) as [ActionType, string][]).map(([type, label]) => (
          <span key={type} className={`px-2 py-1 rounded-full font-medium ${ACTION_TYPE_COLORS[type]}`}>
            {label}
          </span>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Template Info */}
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-700">Informações do Modelo</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Nome do Modelo *" placeholder="Manutenção Preventiva - Split" value={name} onChange={(e) => { markDirty(); setName(e.target.value); }} required />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipamento</label>
                <div className="flex gap-2">
                  <select
                    value={equipmentType}
                    onChange={(e) => { markDirty(); setEquipmentType(e.target.value); }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 bg-white"
                  >
                    <option value="">Selecione...</option>
                    {equipmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={openEquipModal}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Input label="Descrição" placeholder="Manutenção trimestral..." value={description} onChange={(e) => { markDirty(); setDescription(e.target.value); }} />
            </div>
          </CardContent>
        </Card>

        {/* Components */}
        <div className="space-y-3">
          {components.map((comp, ci) => (
            <Card key={comp.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <Input
                    placeholder={`Componente ${ci + 1} (ex: Filtro, Compressor...)`}
                    value={comp.name}
                    onChange={(e) => updateComponentName(comp.id, e.target.value)}
                    className="flex-1"
                  />
                  <button type="button" onClick={() => removeComponent(comp.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {comp.actions.map((action, ai) => (
                  <div key={action.id} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50">
                    {/* Action row */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{ai + 1}.</span>
                      <Input
                        placeholder="Descrição da ação"
                        value={action.description}
                        onChange={(e) => updateAction(comp.id, action.id, "description", e.target.value)}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeAction(comp.id, action.id)}
                        className="text-gray-300 hover:text-red-500 p-1 flex-shrink-0"
                        disabled={comp.actions.length === 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Type selector */}
                    <div className="flex gap-2 ml-7">
                      {(["TEXT", "NUMBER", "BOOLEAN"] as ActionType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateAction(comp.id, action.id, "type", type)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all border ${
                            action.type === type
                              ? `${ACTION_TYPE_COLORS[type]} border-transparent`
                              : "bg-white text-gray-400 border-gray-200"
                          }`}
                        >
                          {ACTION_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>

                    {/* Units (NUMBER only) */}
                    {action.type === "NUMBER" && (
                      <div className="ml-7">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenUnits(openUnits === action.id ? null : action.id)}
                            className="flex items-center gap-2 text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-blue-300 w-full bg-white"
                          >
                            <span className="flex-1 text-left">
                              {action.units.length === 0 ? "Selecionar unidades de medida..." : action.units.join(", ")}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                          </button>
                          {openUnits === action.id && (
                            <div className="absolute z-10 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-72">
                              {UNIT_GROUPS.map((group) => (
                                <div key={group.label} className="mb-3 last:mb-0">
                                  <p className="text-xs font-semibold text-gray-500 mb-1.5">{group.label}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {group.units.map((unit) => (
                                      <button
                                        key={unit}
                                        type="button"
                                        onClick={() => toggleUnit(comp.id, action.id, unit)}
                                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                          action.units.includes(unit)
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                                        }`}
                                      >
                                        {unit}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              <button type="button" onClick={() => setOpenUnits(null)} className="mt-2 text-xs text-blue-600 w-full text-right">
                                Fechar
                              </button>
                            </div>
                          )}
                        </div>
                        {action.units.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">O técnico escolherá entre: {action.units.join(", ")}</p>
                        )}
                      </div>
                    )}

                    {/* Recommendation */}
                    <div className="ml-7">
                      <button
                        type="button"
                        onClick={() => setOpenRec(openRec === action.id ? null : action.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 transition-colors"
                      >
                        <span>{openRec === action.id ? "▾" : "▸"}</span>
                        <span className="font-medium">Recomendação para o técnico</span>
                        {action.recommendation && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />}
                      </button>
                      {openRec === action.id && (
                        <textarea
                          value={action.recommendation}
                          onChange={(e) => updateAction(comp.id, action.id, "recommendation", e.target.value)}
                          placeholder="Descreva como o técnico deve realizar esta verificação, valores esperados, procedimentos de segurança..."
                          rows={3}
                          className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 resize-none bg-white"
                        />
                      )}
                    </div>

                    {/* Attachments */}
                    <div className="ml-7">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          Anexos
                          {(action.attachments.length + action.pendingFiles.length) > 0 && (
                            <span className="ml-1 bg-violet-100 text-violet-600 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                              {action.attachments.length + action.pendingFiles.length}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[action.id]?.click()}
                          className="text-xs text-violet-500 hover:text-violet-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Adicionar
                        </button>
                        <input
                          ref={(el) => { fileInputRefs.current[action.id] = el; }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => e.target.files && addPendingFile(comp.id, action.id, e.target.files)}
                        />
                      </div>

                      {/* Existing attachments */}
                      {action.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1.5">
                          {action.attachments.map((att) => (
                            <div key={att.id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600">
                              {att.fileType === "PDF"
                                ? <FileText className="w-3 h-3 text-red-400 flex-shrink-0" />
                                : <ImageIcon className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                              <span className="max-w-[120px] truncate">{att.name}</span>
                              <button
                                type="button"
                                onClick={() => removeExistingAttachment(comp.id, action.id, att.id)}
                                className="text-gray-300 hover:text-red-500 ml-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pending files */}
                      {action.pendingFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {action.pendingFiles.map((file, fi) => (
                            <div key={fi} className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-lg px-2 py-1 text-xs text-violet-700">
                              {file.type === "application/pdf"
                                ? <FileText className="w-3 h-3 flex-shrink-0" />
                                : <ImageIcon className="w-3 h-3 flex-shrink-0" />}
                              <span className="max-w-[120px] truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removePendingFile(comp.id, action.id, fi)}
                                className="text-violet-300 hover:text-red-500 ml-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {action.attachments.length === 0 && action.pendingFiles.length === 0 && (
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[action.id]?.click()}
                          className="w-full border border-dashed border-gray-200 rounded-lg py-2 text-xs text-gray-300 hover:border-violet-300 hover:text-violet-400 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Paperclip className="w-3 h-3" />
                          Imagem ou PDF do manual
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addAction(comp.id)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 ml-7"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar ação
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={addComponent}
            className="flex-1 border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Componente
          </button>
          <button
            type="button"
            onClick={openImportModal}
            className="flex items-center gap-2 border-2 border-dashed border-violet-200 rounded-xl px-5 py-4 text-sm text-violet-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Importar do Equipamento
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            {mode === "create" ? "Criar Modelo" : "Salvar Alterações"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/manager/checklists")}>Cancelar</Button>
        </div>
      </form>

      {/* New Equipment Modal */}
      {showEquipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Cadastrar Equipamento</h2>
              <button type="button" onClick={() => setShowEquipModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {equipError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">{equipError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cliente *</label>
                <select
                  value={newEquip.clientId}
                  onChange={(e) => setNewEquip((p) => ({ ...p, clientId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 bg-white"
                >
                  <option value="">Selecione o cliente</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                <input type="text" placeholder="Ex: Split Sala 01" value={newEquip.name} onChange={(e) => setNewEquip((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
                <input type="text" placeholder="Ex: Split, Chiller, VRF..." value={newEquip.type} onChange={(e) => setNewEquip((p) => ({ ...p, type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button className="flex-1" onClick={handleCreateEquipment} loading={savingEquip}>Cadastrar</Button>
              <Button variant="secondary" onClick={() => setShowEquipModal(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Import from equipment modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Importar Componentes</h2>
                <p className="text-xs text-gray-400 mt-0.5">Selecione um equipamento para importar seus componentes</p>
              </div>
              <button type="button" onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {loadingEquipments ? (
              <p className="text-sm text-gray-400 text-center py-8">Carregando equipamentos...</p>
            ) : equipmentList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 font-medium">Nenhum equipamento com componentes encontrado</p>
                <p className="text-xs text-gray-400 mt-1">Cadastre os componentes do equipamento primeiro</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {equipmentList.map((equip) => (
                  <button
                    key={equip.id}
                    type="button"
                    onClick={() => handleImportEquipment(equip.id)}
                    disabled={importingId === equip.id}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-violet-300 hover:bg-violet-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{equip.name}</p>
                      <p className="text-xs text-gray-400">{equip.type} · {equip.client?.name}</p>
                    </div>
                    {importingId === equip.id ? (
                      <span className="text-xs text-violet-500">Importando...</span>
                    ) : (
                      <Download className="w-4 h-4 text-violet-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
