import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-600",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
  info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
};

export default function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    PENDING: { label: "Pendente", variant: "warning" },
    IN_EXECUTION: { label: "Em Execução", variant: "info" },
    COMPLETED: { label: "Concluída", variant: "success" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}
