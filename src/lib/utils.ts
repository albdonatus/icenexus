import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABELS = {
  PENDING: "Pendente",
  IN_EXECUTION: "Em Execução",
  COMPLETED: "Concluída",
} as const;

export const ACTION_STATUS_LABELS = {
  DONE: "Realizado",
  NOT_DONE: "Não Realizado",
  NOT_APPLICABLE: "Não Aplicável",
} as const;

export const ROLE_LABELS = {
  MANAGER: "Gestor",
  TECHNICIAN: "Técnico",
} as const;
