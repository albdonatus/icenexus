"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronUp,
  Camera, Trash2, Loader2, Info, Paperclip, FileText, Package, AlertTriangle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ActionStatus, ActionType } from "@prisma/client";
import Image from "next/image";

interface ActionAttachment {
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
  recommendation?: string | null;
  attachments?: ActionAttachment[];
}

interface ChecklistComponent {
  id: string;
  name: string;
  actions: Action[];
}

interface EquipmentAttachment {
  id: string;
  name: string;
  url: string;
  fileType: string;
}

interface EquipmentItem {
  id: string;
  name: string;
}

interface EquipmentComponent {
  id: string;
  name: string;
  items: EquipmentItem[];
  attachments: EquipmentAttachment[];
}

interface ExecutionState {
  status?: ActionStatus;
  numberValue?: string;
  unit?: string;
  booleanValue?: boolean;
  observation: string;
  outOfSpec?: boolean;
}

interface Photo {
  id: string;
  url: string;
}

interface ExecutionScreenProps {
  orderId: string;
  status: string;
  components: ChecklistComponent[];
  equipmentComponents?: EquipmentComponent[];
  initialExecutions: Record<string, ExecutionState>;
  initialPhotos?: Record<string, Photo[]>;
}

export default function ExecutionScreen({
  orderId,
  status,
  components,
  equipmentComponents = [],
  initialExecutions,
  initialPhotos = {},
}: ExecutionScreenProps) {
  const router = useRouter();
  const [executions, setExecutions] = useState<Record<string, ExecutionState>>(initialExecutions);
  const [photos, setPhotos] = useState<Record<string, Photo[]>>(initialPhotos);
  const [expandedObs, setExpandedObs] = useState<Set<string>>(new Set());
  const [expandedComps, setExpandedComps] = useState<Set<string>>(new Set(components.map((c) => c.id)));
  const relevantEquipComps = equipmentComponents.filter((c) => c.items.length > 0 || c.attachments.length > 0);
  const [expandedEquipComps, setExpandedEquipComps] = useState<Set<string>>(
    new Set(relevantEquipComps.length === 1 ? [relevantEquipComps[0].id] : [])
  );
  const [expandedRec, setExpandedRec] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [uploadingAction, setUploadingAction] = useState<string | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isReadOnly = status === "COMPLETED";
  const hasEquipmentInfo = relevantEquipComps.length > 0;

  function updateExec(actionId: string, patch: Partial<ExecutionState>) {
    setExecutions((prev) => ({
      ...prev,
      [actionId]: { ...{ observation: "" }, ...prev[actionId], ...patch },
    }));
  }

  function toggleObs(actionId: string) {
    setExpandedObs((prev) => { const n = new Set(prev); n.has(actionId) ? n.delete(actionId) : n.add(actionId); return n; });
  }
  function toggleComp(compId: string) {
    setExpandedComps((prev) => { const n = new Set(prev); n.has(compId) ? n.delete(compId) : n.add(compId); return n; });
  }
  function toggleEquipComp(compId: string) {
    setExpandedEquipComps((prev) => { const n = new Set(prev); n.has(compId) ? n.delete(compId) : n.add(compId); return n; });
  }
  function toggleRec(actionId: string) {
    setExpandedRec((prev) => { const n = new Set(prev); n.has(actionId) ? n.delete(actionId) : n.add(actionId); return n; });
  }

  function isActionFilled(action: Action): boolean {
    const exec = executions[action.id];
    if (!exec) return false;
    if (action.type === "TEXT") return !!exec.status;
    if (action.type === "NUMBER") return exec.numberValue !== undefined && exec.numberValue !== "" && !!exec.unit;
    if (action.type === "BOOLEAN") return exec.booleanValue !== undefined;
    if (action.type === "NUMBER_TEXT") return exec.numberValue !== undefined && exec.numberValue !== "" && !!exec.unit && !!exec.status;
    if (action.type === "NUMBER_BOOLEAN") return exec.numberValue !== undefined && exec.numberValue !== "" && !!exec.unit && exec.booleanValue !== undefined;
    if (action.type === "TEXT_BOOLEAN") return !!exec.status && exec.booleanValue !== undefined;
    if (action.type === "NUMBER_TEXT_BOOLEAN") return exec.numberValue !== undefined && exec.numberValue !== "" && !!exec.unit && !!exec.status && exec.booleanValue !== undefined;
    return false;
  }

  function buildPayload() {
    return Object.entries(executions).map(([actionId, exec]) => ({
      actionId,
      status: exec.status ?? null,
      numberValue: exec.numberValue !== undefined && exec.numberValue !== "" ? parseFloat(exec.numberValue) : null,
      unit: exec.unit ?? null,
      booleanValue: exec.booleanValue ?? null,
      observation: exec.observation || null,
      outOfSpec: exec.outOfSpec ?? false,
    }));
  }

  async function handlePhotoUpload(actionId: string, file: File) {
    setUploadingAction(actionId);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("serviceOrderId", orderId);
    fd.append("actionId", actionId);
    const res = await fetch("/api/execution-photos", { method: "POST", body: fd });
    if (res.ok) {
      const photo = await res.json() as Photo;
      setPhotos((prev) => ({ ...prev, [actionId]: [...(prev[actionId] ?? []), photo] }));
    }
    setUploadingAction(null);
  }

  async function handleDeletePhoto(actionId: string, photoId: string) {
    setDeletingPhoto(photoId);
    await fetch(`/api/execution-photos/${photoId}`, { method: "DELETE" });
    setPhotos((prev) => ({ ...prev, [actionId]: (prev[actionId] ?? []).filter((p) => p.id !== photoId) }));
    setDeletingPhoto(null);
  }

  async function handleStart() {
    setStarting(true);
    await fetch(`/api/service-orders/${orderId}/start`, { method: "POST" });
    setStarting(false);
    router.refresh();
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/service-orders/${orderId}/executions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    setSaving(false);
  }

  async function handleComplete() {
    setCompleting(true);
    await fetch(`/api/service-orders/${orderId}/executions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    await fetch(`/api/service-orders/${orderId}/complete`, { method: "POST" });
    setCompleting(false);
    router.refresh();
  }

  const allActions = components.flatMap((c) => c.actions);
  const filled = allActions.filter((a) => isActionFilled(a)).length;
  const total = allActions.length;
  const progressPct = total > 0 ? Math.round((filled / total) * 100) : 0;

  if (status === "PENDING") {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <h2 className="font-bold text-gray-900 mb-2">Ordem Pendente</h2>
        <p className="text-sm text-gray-500 mb-6">Toque em iniciar para começar a execução.</p>
        <Button onClick={handleStart} loading={starting} size="lg">
          Iniciar Ordem de Serviço
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      {!isReadOnly && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progresso</span>
            <span>{filled}/{total} ações preenchidas</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Equipment reference info */}
      {hasEquipmentInfo && (
        <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Referência do Equipamento</h2>
            <span className="text-xs text-gray-400">peças e arquivos técnicos</span>
          </div>
          <div className="divide-y divide-gray-50">
            {equipmentComponents.map((ec) => {
              if (ec.items.length === 0 && ec.attachments.length === 0) return null;
              const isOpen = expandedEquipComps.has(ec.id);
              return (
                <div key={ec.id}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50"
                    onClick={() => toggleEquipComp(ec.id)}
                  >
                    <span className="text-sm font-medium text-gray-700">{ec.name}</span>
                    <div className="flex items-center gap-2">
                      {ec.attachments.length > 0 && (
                        <span className="text-xs text-violet-500 flex items-center gap-0.5">
                          <Paperclip className="w-3 h-3" />{ec.attachments.length}
                        </span>
                      )}
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-3">
                      {ec.items.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1.5">Peças / sub-componentes</p>
                          <ul className="space-y-0.5">
                            {ec.items.map((item) => (
                              <li key={item.id} className="text-xs text-gray-600 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {ec.attachments.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1.5">Arquivos</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ec.attachments.map((att) => {
                              const isPdf = att.fileType === "application/pdf";
                              return (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-xs px-2.5 py-1 rounded-full hover:bg-violet-100 transition-colors"
                                >
                                  {isPdf ? <FileText className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                                  <span className="max-w-[140px] truncate">{att.name}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Checklist components */}
      <div className="space-y-3 mb-6">
        {components.map((comp) => {
          const compFilled = comp.actions.filter((a) => isActionFilled(a)).length;
          const isOpen = expandedComps.has(comp.id);
          const compHasRec = comp.actions.some((a) => !!a.recommendation);
          const compHasAttachments = comp.actions.some((a) => (a.attachments?.length ?? 0) > 0);

          return (
            <div key={comp.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => toggleComp(comp.id)}
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-sm">{comp.name}</h3>
                  {!isReadOnly && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      compFilled === comp.actions.length ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {compFilled}/{comp.actions.length}
                    </span>
                  )}
                  {compHasRec && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Contém orientações" />
                  )}
                  {compHasAttachments && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" title="Contém arquivos" />
                  )}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {comp.actions.map((action) => {
                    const exec = executions[action.id];
                    const obsOpen = expandedObs.has(action.id);
                    const recOpen = expandedRec.has(action.id);
                    const isFilled = isActionFilled(action);
                    const actionPhotos = photos[action.id] ?? [];
                    const isUploading = uploadingAction === action.id;
                    const hasRec = !!action.recommendation;
                    const hasAttachments = (action.attachments?.length ?? 0) > 0;

                    return (
                      <div key={action.id} className="px-4 py-3">
                        {/* Description + type badge */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <p className="text-sm text-gray-800 font-medium">{action.description}</p>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
                            (action.type === "TEXT" || action.type === "TEXT_BOOLEAN") && "bg-gray-100 text-gray-500",
                            (action.type === "NUMBER" || action.type === "NUMBER_TEXT" || action.type === "NUMBER_BOOLEAN" || action.type === "NUMBER_TEXT_BOOLEAN") && "bg-blue-100 text-blue-600",
                            (action.type === "BOOLEAN") && "bg-green-100 text-green-600",
                          )}>
                            {action.type === "TEXT" && "Verificação"}
                            {action.type === "NUMBER" && "Medição"}
                            {action.type === "BOOLEAN" && "Confirmação"}
                            {action.type === "NUMBER_TEXT" && "Medição + Verificação"}
                            {action.type === "NUMBER_BOOLEAN" && "Medição + Troca"}
                            {action.type === "TEXT_BOOLEAN" && "Verificação + Troca"}
                            {action.type === "NUMBER_TEXT_BOOLEAN" && "Medição + Verificação + Troca"}
                          </span>
                        </div>

                        {/* Recommendation + attachments row */}
                        {(hasRec || hasAttachments) && (
                          <div className="mb-2.5 flex flex-wrap gap-1.5">
                            {hasRec && (
                              <button
                                type="button"
                                onClick={() => toggleRec(action.id)}
                                className={cn(
                                  "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors",
                                  recOpen
                                    ? "bg-amber-50 border-amber-300 text-amber-700"
                                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600"
                                )}
                              >
                                <Info className="w-3 h-3" />
                                Orientação
                              </button>
                            )}
                            {action.attachments?.map((att) => {
                              const isPdf = att.fileType === "application/pdf";
                              return (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 transition-colors"
                                >
                                  {isPdf ? <FileText className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                                  <span className="max-w-[120px] truncate">{att.name}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Recommendation text */}
                        {hasRec && recOpen && (
                          <div className="mb-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 leading-relaxed">
                            {action.recommendation}
                          </div>
                        )}

                        {/* TEXT action */}
                        {action.type === "TEXT" && (
                          !isReadOnly ? (
                            <div className="flex gap-2">
                              {([
                                { value: "DONE", label: "Realizado", icon: <CheckCircle2 className="w-4 h-4" />, active: "border-green-500 bg-green-50 text-green-700" },
                                { value: "NOT_DONE", label: "Não Realizado", icon: <XCircle className="w-4 h-4" />, active: "border-red-500 bg-red-50 text-red-700" },
                              ] as { value: ActionStatus; label: string; icon: React.ReactNode; active: string }[]).map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => updateExec(action.id, { status: opt.value })}
                                  className={cn(
                                    "flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                                    exec?.status === opt.value ? opt.active : "border-gray-200 text-gray-400 bg-white"
                                  )}
                                >
                                  {opt.icon}
                                  <span className="hidden sm:inline">{opt.label}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <ReadOnlyStatus status={exec?.status} />
                          )
                        )}

                        {/* NUMBER action */}
                        {action.type === "NUMBER" && (
                          !isReadOnly ? (
                            <div className="flex gap-2 items-center">
                              <input
                                type="number"
                                step="any"
                                placeholder="Valor"
                                value={exec?.numberValue ?? ""}
                                onChange={(e) => updateExec(action.id, { numberValue: e.target.value })}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                              />
                              <select
                                value={exec?.unit ?? ""}
                                onChange={(e) => updateExec(action.id, { unit: e.target.value })}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                              >
                                <option value="">Unidade</option>
                                {action.units.map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                              {exec?.numberValue !== undefined ? `${exec.numberValue} ${exec.unit ?? ""}` : "Não preenchido"}
                            </div>
                          )
                        )}

                        {/* BOOLEAN action */}
                        {action.type === "BOOLEAN" && (
                          !isReadOnly ? (
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => updateExec(action.id, { booleanValue: true })}
                                className={cn(
                                  "flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all",
                                  exec?.booleanValue === true ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-400 bg-white"
                                )}
                              >✓ Sim</button>
                              <button
                                type="button"
                                onClick={() => updateExec(action.id, { booleanValue: false })}
                                className={cn(
                                  "flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all",
                                  exec?.booleanValue === false ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-400 bg-white"
                                )}
                              >✗ Não</button>
                            </div>
                          ) : (
                            <div className={cn(
                              "text-sm font-semibold px-3 py-2 rounded-lg inline-block",
                              exec?.booleanValue === true && "bg-green-50 text-green-700",
                              exec?.booleanValue === false && "bg-red-50 text-red-700",
                              exec?.booleanValue === undefined && "bg-gray-50 text-gray-400",
                            )}>
                              {exec?.booleanValue === true ? "✓ Sim" : exec?.booleanValue === false ? "✗ Não" : "Não preenchido"}
                            </div>
                          )
                        )}

                        {/* TEXT_BOOLEAN — verificação + troca */}
                        {action.type === "TEXT_BOOLEAN" && (
                          <div className="space-y-2">
                            {!isReadOnly ? (
                              <>
                                <div className="flex gap-2">
                                  {([
                                    { value: "DONE", label: "Realizado", icon: <CheckCircle2 className="w-4 h-4" />, active: "border-green-500 bg-green-50 text-green-700" },
                                    { value: "NOT_DONE", label: "Não Realizado", icon: <XCircle className="w-4 h-4" />, active: "border-red-500 bg-red-50 text-red-700" },
                                  ] as { value: ActionStatus; label: string; icon: React.ReactNode; active: string }[]).map((opt) => (
                                    <button key={opt.value} type="button" onClick={() => updateExec(action.id, { status: opt.value })}
                                      className={cn("flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border-2 text-xs font-medium transition-all", exec?.status === opt.value ? opt.active : "border-gray-200 text-gray-400 bg-white")}
                                    >{opt.icon}<span className="hidden sm:inline">{opt.label}</span></button>
                                  ))}
                                </div>
                                <div className="flex gap-3">
                                  <button type="button" onClick={() => updateExec(action.id, { booleanValue: true })}
                                    className={cn("flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all", exec?.booleanValue === true ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-400 bg-white")}
                                  >✓ Sim</button>
                                  <button type="button" onClick={() => updateExec(action.id, { booleanValue: false })}
                                    className={cn("flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all", exec?.booleanValue === false ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-400 bg-white")}
                                  >✗ Não</button>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <ReadOnlyStatus status={exec?.status} />
                                <div className={cn("text-sm font-semibold px-3 py-2 rounded-lg inline-block", exec?.booleanValue === true && "bg-green-50 text-green-700", exec?.booleanValue === false && "bg-red-50 text-red-700", exec?.booleanValue === undefined && "bg-gray-50 text-gray-400")}>
                                  {exec?.booleanValue === true ? "✓ Sim" : exec?.booleanValue === false ? "✗ Não" : "Não preenchido"}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* NUMBER_TEXT — medição + verificação */}
                        {(action.type === "NUMBER_TEXT" || action.type === "NUMBER_BOOLEAN") && (
                          <div className="space-y-2">
                            {/* Measurement field */}
                            {!isReadOnly ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="Valor medido"
                                  value={exec?.numberValue ?? ""}
                                  onChange={(e) => updateExec(action.id, { numberValue: e.target.value })}
                                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                                <select
                                  value={exec?.unit ?? ""}
                                  onChange={(e) => updateExec(action.id, { unit: e.target.value })}
                                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                >
                                  <option value="">Unidade</option>
                                  {action.units.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </div>
                            ) : (
                              <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                                {exec?.numberValue !== undefined ? `${exec.numberValue} ${exec.unit ?? ""}` : "Não preenchido"}
                              </div>
                            )}
                            {/* Status/Boolean field */}
                            {action.type === "NUMBER_TEXT" && (
                              !isReadOnly ? (
                                <div className="flex gap-2">
                                  {([
                                    { value: "DONE", label: "Realizado", icon: <CheckCircle2 className="w-4 h-4" />, active: "border-green-500 bg-green-50 text-green-700" },
                                    { value: "NOT_DONE", label: "Não Realizado", icon: <XCircle className="w-4 h-4" />, active: "border-red-500 bg-red-50 text-red-700" },
                                  ] as { value: ActionStatus; label: string; icon: React.ReactNode; active: string }[]).map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => updateExec(action.id, { status: opt.value })}
                                      className={cn(
                                        "flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                                        exec?.status === opt.value ? opt.active : "border-gray-200 text-gray-400 bg-white"
                                      )}
                                    >
                                      {opt.icon}
                                      <span className="hidden sm:inline">{opt.label}</span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <ReadOnlyStatus status={exec?.status} />
                              )
                            )}
                            {action.type === "NUMBER_BOOLEAN" && (
                              !isReadOnly ? (
                                <div className="flex gap-3">
                                  <button type="button" onClick={() => updateExec(action.id, { booleanValue: true })}
                                    className={cn("flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all", exec?.booleanValue === true ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-400 bg-white")}
                                  >✓ Sim</button>
                                  <button type="button" onClick={() => updateExec(action.id, { booleanValue: false })}
                                    className={cn("flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all", exec?.booleanValue === false ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-400 bg-white")}
                                  >✗ Não</button>
                                </div>
                              ) : (
                                <div className={cn("text-sm font-semibold px-3 py-2 rounded-lg inline-block", exec?.booleanValue === true && "bg-green-50 text-green-700", exec?.booleanValue === false && "bg-red-50 text-red-700", exec?.booleanValue === undefined && "bg-gray-50 text-gray-400")}>
                                  {exec?.booleanValue === true ? "✓ Sim" : exec?.booleanValue === false ? "✗ Não" : "Não preenchido"}
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {/* NUMBER_TEXT_BOOLEAN — medição + verificação + troca */}
                        {action.type === "NUMBER_TEXT_BOOLEAN" && (
                          <div className="space-y-2">
                            {!isReadOnly ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="Valor medido"
                                  value={exec?.numberValue ?? ""}
                                  onChange={(e) => updateExec(action.id, { numberValue: e.target.value })}
                                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                />
                                <select
                                  value={exec?.unit ?? ""}
                                  onChange={(e) => updateExec(action.id, { unit: e.target.value })}
                                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                >
                                  <option value="">Unidade</option>
                                  {action.units.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </div>
                            ) : (
                              <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                                {exec?.numberValue !== undefined ? `${exec.numberValue} ${exec.unit ?? ""}` : "Não preenchido"}
                              </div>
                            )}
                            {!isReadOnly ? (
                              <div className="flex gap-2">
                                {([
                                  { value: "DONE", label: "Realizado", icon: <CheckCircle2 className="w-4 h-4" />, active: "border-green-500 bg-green-50 text-green-700" },
                                  { value: "NOT_DONE", label: "Não Realizado", icon: <XCircle className="w-4 h-4" />, active: "border-red-500 bg-red-50 text-red-700" },
                                ] as { value: ActionStatus; label: string; icon: React.ReactNode; active: string }[]).map((opt) => (
                                  <button key={opt.value} type="button" onClick={() => updateExec(action.id, { status: opt.value })}
                                    className={cn("flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border-2 text-xs font-medium transition-all", exec?.status === opt.value ? opt.active : "border-gray-200 text-gray-400 bg-white")}
                                  >{opt.icon}<span className="hidden sm:inline">{opt.label}</span></button>
                                ))}
                              </div>
                            ) : (
                              <ReadOnlyStatus status={exec?.status} />
                            )}
                            {!isReadOnly ? (
                              <div className="flex gap-3">
                                <button type="button" onClick={() => updateExec(action.id, { booleanValue: true })}
                                  className={cn("flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all", exec?.booleanValue === true ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-400 bg-white")}
                                >✓ Sim</button>
                                <button type="button" onClick={() => updateExec(action.id, { booleanValue: false })}
                                  className={cn("flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all", exec?.booleanValue === false ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-400 bg-white")}
                                >✗ Não</button>
                              </div>
                            ) : (
                              <div className={cn("text-sm font-semibold px-3 py-2 rounded-lg inline-block", exec?.booleanValue === true && "bg-green-50 text-green-700", exec?.booleanValue === false && "bg-red-50 text-red-700", exec?.booleanValue === undefined && "bg-gray-50 text-gray-400")}>
                                {exec?.booleanValue === true ? "✓ Sim" : exec?.booleanValue === false ? "✗ Não" : "Não preenchido"}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Photos */}
                        {(actionPhotos.length > 0 || !isReadOnly) && (
                          <div className="mt-3">
                            {actionPhotos.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {actionPhotos.map((photo) => (
                                  <div key={photo.id} className="relative group">
                                    <a href={photo.url} target="_blank" rel="noopener noreferrer">
                                      <Image
                                        src={photo.url}
                                        alt="Foto da execução"
                                        width={72}
                                        height={72}
                                        className="w-18 h-18 object-cover rounded-lg border border-gray-200"
                                      />
                                    </a>
                                    {!isReadOnly && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePhoto(action.id, photo.id)}
                                        disabled={deletingPhoto === photo.id}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        {deletingPhoto === photo.id
                                          ? <Loader2 className="w-3 h-3 animate-spin" />
                                          : <Trash2 className="w-3 h-3" />}
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {!isReadOnly && (
                              <>
                                <input
                                  ref={(el) => { fileRefs.current[action.id] = el; }}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handlePhotoUpload(action.id, file);
                                    e.target.value = "";
                                  }}
                                />
                                <button
                                  type="button"
                                  disabled={isUploading}
                                  onClick={() => fileRefs.current[action.id]?.click()}
                                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                >
                                  {isUploading
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                                    : <><Camera className="w-3.5 h-3.5" /> Adicionar foto</>}
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Out of spec + Observation */}
                        {!isReadOnly && (
                          <div className="mt-2 space-y-2">
                            {/* Out of spec toggle */}
                            <button
                              type="button"
                              onClick={() => updateExec(action.id, { outOfSpec: !exec?.outOfSpec })}
                              className={cn(
                                "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all",
                                exec?.outOfSpec
                                  ? "bg-orange-500 text-white border-orange-500"
                                  : "bg-white text-gray-400 border-gray-200 hover:border-orange-400 hover:text-orange-500"
                              )}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Fora de especificação
                            </button>

                            {/* Observation */}
                            {obsOpen ? (
                              <textarea
                                className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none"
                                placeholder="Observação (opcional)"
                                rows={2}
                                value={exec?.observation ?? ""}
                                onChange={(e) => updateExec(action.id, { observation: e.target.value })}
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleObs(action.id)}
                                className="text-xs text-gray-400 hover:text-blue-500 block"
                              >
                                {exec?.observation ? `Obs: ${exec.observation}` : "+ Adicionar observação"}
                              </button>
                            )}
                          </div>
                        )}

                        {isReadOnly && (
                          <div className="mt-1.5 space-y-1">
                            {exec?.outOfSpec && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                Fora de especificação
                              </span>
                            )}
                            {exec?.observation && (
                              <p className="text-xs text-gray-400 italic">{exec.observation}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {!isReadOnly && (
        <div className="space-y-2 pb-8">
          <Button className="w-full" variant="secondary" onClick={handleSave} loading={saving}>
            Salvar Progresso
          </Button>
          <Button className="w-full" onClick={handleComplete} loading={completing}>
            Concluir Ordem de Serviço
          </Button>
        </div>
      )}

      {isReadOnly && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-8">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-semibold text-green-700">Ordem Concluída</p>
        </div>
      )}
    </div>
  );
}

function ReadOnlyStatus({ status }: { status?: ActionStatus }) {
  if (!status) return <span className="text-xs text-gray-400">Não preenchido</span>;
  const map = {
    DONE: { label: "Realizado", cls: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    NOT_DONE: { label: "Não Realizado", cls: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
    NOT_APPLICABLE: { label: "N/A", cls: "bg-gray-100 text-gray-500", icon: <MinusCircle className="w-3.5 h-3.5" /> },
  };
  const { label, cls, icon } = map[status];
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium", cls)}>
      {icon} {label}
    </div>
  );
}
