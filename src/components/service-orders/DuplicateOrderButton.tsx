"use client";

import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DuplicateOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDuplicate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/service-orders/${orderId}/duplicate`, { method: "POST" });
      if (!res.ok) return;
      const { id } = await res.json();
      router.push(`/manager/service-orders/${id}/edit`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-all font-medium disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
      Duplicar OS
    </button>
  );
}
