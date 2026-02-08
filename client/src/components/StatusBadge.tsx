import { cn } from "@/lib/utils";

type Status = "pending" | "confirmed" | "rejected";

const styles = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/30",
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
