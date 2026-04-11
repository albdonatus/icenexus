import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0,0,0,0.04),0_1px_2px_-1px_rgb(0,0,0,0.03)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-50", className)}>{children}</div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}
