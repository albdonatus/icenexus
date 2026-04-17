"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CalendarOrder {
  id: string;
  scheduledDate: string;
  clientName: string;
  technicianName: string;
  status: string;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DashboardCalendar({ orders }: { orders: CalendarOrder[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  function parseScheduledDate(iso: string): Date {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const ordersOnDate = (date: Date) =>
    orders.filter((o) => isSameDay(parseScheduledDate(o.scheduledDate), date));

  const selectedOrders = ordersOnDate(selectedDate);

  // Build grid cells
  const cells: { date: Date; current: boolean }[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, next++), current: false });
  }

  const selectedLabel = selectedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 h-fit">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Próximos Agendamentos</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide w-28 text-center">
            {MONTHS[month].toUpperCase()}/{year}
          </span>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          const hasOrders = ordersOnDate(cell.date).length > 0;
          const isToday = isSameDay(cell.date, today);
          const isSelected = isSameDay(cell.date, selectedDate);

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(cell.date)}
              className={cn(
                "relative text-[11px] py-1.5 rounded-lg font-medium transition-colors leading-none",
                !cell.current && "text-gray-300",
                cell.current && !isSelected && !isToday && "text-gray-700 hover:bg-gray-50",
                isToday && !isSelected && "bg-violet-600 text-white",
                isSelected && !isToday && "bg-violet-100 text-violet-700",
                isSelected && isToday && "bg-violet-600 text-white"
              )}
            >
              {String(cell.date.getDate()).padStart(2, "0")}
              {hasOrders && cell.current && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Orders for selected day */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-[10px] font-semibold text-violet-700 uppercase tracking-wide">
            {selectedOrders.length} visita(s) para {selectedLabel}:
          </span>
        </div>
        {selectedOrders.length === 0 ? (
          <p className="text-[11px] text-gray-400 pl-5">Nenhuma visita agendada.</p>
        ) : (
          <div className="space-y-1.5 pl-5">
            {selectedOrders.map((o) => (
              <Link
                key={o.id}
                href={`/manager/service-orders/${o.id}`}
                className="block text-[11px] text-gray-600 hover:text-violet-600 transition-colors"
              >
                {o.clientName} — {o.technicianName}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
