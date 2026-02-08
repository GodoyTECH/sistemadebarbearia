import { cn } from "@/lib/utils";

type Status = "pending" | "confirmed" | "rejected";

const styles = {
  pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  rejected: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
};

const labels = {
  pending: "Pendente",
  confirmed: "Aprovado",
  rejected: "Rejeitado",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5",
      styles[status]
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {labels[status]}
    </span>
  );
}
