import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, PauseCircle, Plug, Zap, Activity, Cpu, RefreshCw, Layers } from "lucide-react";
import { pacsService } from "@/lib/services";
import { EndpointStatusPill } from "./StatusPill";
import type { PacsEndpointHealth } from "@/lib/pacs";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function Spark({ values }: { values?: number[] }) {
  if (!values?.length) return <div className="h-10 text-[9px] font-black text-muted-foreground/20 flex items-center">NO METRIC DATA</div>;
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/40 rounded-sm hover:bg-primary transition-colors cursor-help"
          style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
          title={`${v} units`}
        />
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "ok" | "warn" | "muted";
}) {
  const toneClass = tone === "ok"
    ? "text-emerald-400"
    : tone === "warn"
    ? "text-destructive shadow-destructive/20"
    : "text-foreground";
  return (
    <div className="glass rounded-3xl border-border/40 p-6 bg-background/20 group hover:scale-[1.02] transition-all duration-500">
      <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-primary transition-colors">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={`text-4xl font-display font-black mt-3 tracking-tighter drop-shadow-sm ${toneClass}`}>{value}</div>
    </div>
  );
}

export function HealthDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pacs", "health"],
    queryFn: () => pacsService.health(),
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <div className="glass rounded-[3rem] p-32 flex flex-col items-center justify-center gap-6">
       <Activity className="h-12 w-12 text-primary animate-spin" />
       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">Analyzing Node Telemetry...</span>
    </div>
  );

  if (error) return (
    <div className="glass rounded-[2.5rem] border-destructive/20 bg-destructive/5 p-12 text-center">
       <p className="text-sm font-black uppercase tracking-widest text-destructive">Telemetry Stream Fault</p>
       <p className="text-[10px] font-medium text-destructive/60 mt-2">{(error as Error).message}</p>
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Plug} label="Grid Nodes" value={data.totalEndpoints} />
        <StatCard icon={CheckCircle2} label="Online" value={data.active} tone="ok" />
        <StatCard icon={AlertTriangle} label="Faulty" value={data.errored} tone={data.errored > 0 ? "warn" : "muted"} />
        <StatCard icon={PauseCircle} label="Offline" value={data.disabled} tone="muted" />
        <StatCard icon={Layers} label="Ingestion/24h" value={data.ingested24h} tone="ok" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
           <div className="h-1 w-12 bg-primary/20 rounded-full" />
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Interface Node Health Matrix</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {data.endpoints.map((h) => <EndpointHealthCard key={h.endpointId} h={h} />)}
          {data.endpoints.length === 0 && (
            <div className="glass rounded-[3rem] border-dashed border-border/40 p-32 text-center flex flex-col items-center gap-6 md:col-span-2">
               <div className="h-16 w-16 rounded-[2rem] bg-muted/10 flex items-center justify-center">
                  <Cpu className="h-8 w-8 text-muted-foreground/20" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Registry partition is clear — No endpoints detected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EndpointHealthCard({ h }: { h: PacsEndpointHealth }) {
  return (
    <div className="glass rounded-[2.5rem] border-border/40 p-8 bg-background/20 hover:bg-background/30 transition-all duration-700 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
         <Activity className="h-24 w-24" />
      </div>
      
      <div className="flex items-start justify-between gap-6 relative z-10">
        <div className="space-y-1.5">
          <div className="text-xl font-display font-black text-foreground tracking-tight uppercase group-hover:text-primary transition-colors">{h.endpointName}</div>
          <div className="flex items-center gap-2">
             <div className={`h-1.5 w-1.5 rounded-full ${h.reachable ? "bg-emerald-500 animate-pulse" : "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`} />
             <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
               {h.reachable ? "Node Stable" : "Link Lost"}
               {h.latencyMs != null && h.reachable && ` · ${h.latencyMs}ms RTT`}
             </div>
          </div>
        </div>
        <EndpointStatusPill status={h.status} />
      </div>

      <div className="grid grid-cols-2 gap-8 mt-8 relative z-10">
        <div className="space-y-2">
          <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Flux Ingest / 24h</div>
          <div className="text-3xl font-display font-black text-emerald-400 tracking-tighter">{h.ingested24h}</div>
        </div>
        <div className="space-y-2">
          <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Drop Rate / 24h</div>
          <div className={`text-3xl font-display font-black tracking-tighter ${h.rejected24h > 0 ? "text-destructive shadow-destructive/10" : "text-foreground/40"}`}>{h.rejected24h}</div>
        </div>
      </div>

      <div className="mt-8 space-y-3 relative z-10">
        <div className="flex items-center justify-between">
           <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Throughput Pulse</div>
           <div className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-widest italic">Live Telemetry</div>
        </div>
        <Spark values={h.throughput} />
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border/10 pt-6 relative z-10">
        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
          Last Protocol Sync: <span className="text-muted-foreground/60">{formatDate(h.lastSyncAt)}</span>
        </div>
      </div>
      
      {h.lastErrorMessage && (
        <div className="mt-6 rounded-2xl bg-destructive/5 border border-destructive/20 p-5 relative z-10 group-hover:bg-destructive/10 transition-colors">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-destructive mb-2">
             <AlertTriangle className="h-3.5 w-3.5" /> Logical Fault · {formatDate(h.lastErrorAt)}
          </div>
          <div className="text-[10px] font-medium text-destructive/80 leading-relaxed italic">{h.lastErrorMessage}</div>
        </div>
      )}
    </div>
  );
}

