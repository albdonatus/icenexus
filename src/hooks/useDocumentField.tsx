"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { maskDocument, validateCPF, lookupCNPJ } from "@/lib/document";

export type DocState = "idle" | "valid" | "invalid" | "loading" | "found" | "notfound";

type FillFields = { name?: string; email?: string; phone?: string; address?: string };

const HINT_CONFIG: Record<
  Exclude<DocState, "idle">,
  { color: string; Icon: React.ElementType; spin?: boolean }
> = {
  valid:    { color: "text-green-600",  Icon: CheckCircle2 },
  invalid:  { color: "text-red-500",    Icon: XCircle },
  loading:  { color: "text-gray-400",   Icon: Loader2, spin: true },
  found:    { color: "text-violet-600", Icon: Sparkles },
  notfound: { color: "text-amber-500",  Icon: XCircle },
};

export function DocHint({ state, message }: { state: DocState; message: string }) {
  if (state === "idle" || !message) return null;
  const { color, Icon, spin } = HINT_CONFIG[state];
  return (
    <span className={`flex items-center gap-1 text-xs mt-1 ${color}`}>
      <Icon className={`w-3.5 h-3.5${spin ? " animate-spin" : ""}`} />
      {message}
    </span>
  );
}

export function useDocumentField(onFill: (fields: FillFields) => void) {
  const [docState, setDocState] = useState<DocState>("idle");
  const [docMessage, setDocMessage] = useState("");

  async function handleDocumentChange(raw: string, onMasked: (masked: string) => void) {
    const masked = maskDocument(raw);
    onMasked(masked);

    const digits = raw.replace(/\D/g, "");
    setDocState("idle");
    setDocMessage("");

    if (digits.length === 11) {
      if (validateCPF(digits)) {
        setDocState("valid");
        setDocMessage("CPF válido");
      } else {
        setDocState("invalid");
        setDocMessage("CPF inválido");
      }
    } else if (digits.length === 14) {
      setDocState("loading");
      setDocMessage("Buscando dados...");
      try {
        const data = await lookupCNPJ(digits);
        setDocState("found");
        setDocMessage("Dados preenchidos automaticamente");
        onFill(data);
      } catch {
        setDocState("notfound");
        setDocMessage("CNPJ não encontrado na Receita Federal");
      }
    }
  }

  return { docState, docMessage, handleDocumentChange };
}
