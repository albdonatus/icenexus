"use client";

import { useState } from "react";
import { Share2, Check, Loader2 } from "lucide-react";

export default function ShareReportButton({ orderId }: { orderId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");

  async function handleShare() {
    setState("loading");
    try {
      const res = await fetch(`/api/service-orders/${orderId}/share`, { method: "POST" });
      const { token } = await res.json();
      const url = `${window.location.origin}/api/reports/${token}/pdf`;
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={state === "loading"}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-all font-medium disabled:opacity-50"
    >
      {state === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {state === "copied" && <Check className="w-3.5 h-3.5 text-green-500" />}
      {state === "idle" && <Share2 className="w-3.5 h-3.5" />}
      {state === "copied" ? "Link copiado!" : "Compartilhar relatório"}
    </button>
  );
}
