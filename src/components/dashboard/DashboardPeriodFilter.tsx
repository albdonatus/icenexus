"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PERIODS = [
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês passado" },
  { value: "3_months", label: "3 meses" },
  { value: "6_months", label: "6 meses" },
  { value: "this_year", label: "Este ano" },
];

export default function DashboardPeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("period") ?? "this_month";

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`/manager?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => select(p.value)}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
            current === p.value
              ? "bg-violet-600 text-white border-violet-600"
              : "bg-white text-gray-500 border-gray-200 hover:border-violet-300"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
