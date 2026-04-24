import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "muted";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneClass =
    tone === "ok" ? "text-accent"
    : tone === "warn" ? "text-rose-500"
    : tone === "muted" ? "text-muted-foreground"
    : "text-foreground";
    
  return (
    <div className="rd-card group !p-4">
      <div className="flex items-center gap-2 rd-label !mb-3">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className={cn("text-2xl rd-display-h leading-none", toneClass)}>{value}</div>
      {hint && <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1.5">{hint}</div>}
    </div>
  );
}

export function Sparkline({ values, height = 48 }: { values: number[]; height?: number }) {
  if (!values.length) return <div className="text-[9px] font-black uppercase tracking-widest opacity-20">Data Stream Interrupted</div>;
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 min-w-[4px] bg-primary/20 rounded-sm group-hover:bg-primary transition-all relative group"
          style={{ height: `${(v / max) * 100}%` }}
        >
           <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-sm shadow-[0_0_15px_oklch(var(--color-primary))] " />
        </div>
      ))}
    </div>
  );
}

export function HBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-2 group">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
        <span className="text-sm font-black italic tabular-nums">{value}</span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden border border-white/5">
        <div className="h-full bg-primary shadow-[0_0_10px_oklch(var(--color-primary))]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
