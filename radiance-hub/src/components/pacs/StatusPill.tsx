import { cn } from "@/lib/utils";
import type { PacsEndpointStatus, IngestionEventStatus, SyncLogLevel } from "@/lib/pacs";

const ENDPOINT_TONE: Record<PacsEndpointStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.1)]",
  disabled: "bg-muted/30 text-muted-foreground/40 border-border/40",
  error: "bg-destructive/10 text-destructive border-destructive/30 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
};

const INGESTION_TONE: Record<IngestionEventStatus, string> = {
  received: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  processing: "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse",
  ingested: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.1)]",
  rejected: "bg-destructive/10 text-destructive border-destructive/30 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
  duplicate: "bg-muted/30 text-muted-foreground/40 border-border/40",
};

const LOG_TONE: Record<SyncLogLevel, string> = {
  info: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  warn: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  error: "bg-destructive/10 text-destructive border-destructive/30 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
};

function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] transition-all", tone)}>
      {children}
    </span>
  );
}

export function EndpointStatusPill({ status }: { status: PacsEndpointStatus }) {
  return <Pill tone={ENDPOINT_TONE[status]}>{status}</Pill>;
}

export function IngestionStatusPill({ status }: { status: IngestionEventStatus }) {
  return <Pill tone={INGESTION_TONE[status]}>{status}</Pill>;
}

export function LogLevelPill({ level }: { level: SyncLogLevel }) {
  return <Pill tone={LOG_TONE[level]}>{level}</Pill>;
}

