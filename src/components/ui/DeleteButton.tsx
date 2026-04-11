"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  endpoint: string;
  confirmMessage?: string;
}

export default function DeleteButton({ endpoint, confirmMessage = "Tem certeza que deseja excluir?" }: DeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Excluir"
      className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all duration-150 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
