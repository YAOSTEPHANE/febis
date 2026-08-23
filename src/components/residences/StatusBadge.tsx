import { cn } from "@/lib/cn";
import { statusLabel } from "@/lib/residences";
import type { DayStatus, LodgingStatus } from "@/lib/types";

export function StatusBadge({
  status,
  className,
}: {
  status: DayStatus | LodgingStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]",
        status === "disponible" && "bg-emerald-500/15 text-emerald-800",
        status === "reserve" && "bg-febis-red/12 text-febis-red-deep",
        status === "maintenance" && "bg-amber-500/15 text-amber-900",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "disponible" && "bg-emerald-600",
          status === "reserve" && "bg-febis-red",
          status === "maintenance" && "bg-amber-600",
        )}
      />
      {statusLabel(status)}
    </span>
  );
}
