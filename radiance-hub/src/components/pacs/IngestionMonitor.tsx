import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pacsService } from "@/lib/services";
import { INGESTION_STATUS_LABELS, type IngestionEventStatus } from "@/lib/pacs";
import { IngestionStatusPill } from "./StatusPill";
import { Search, Loader2, Database, ExternalLink, RefreshCw } from "lucide-react";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export function IngestionMonitor() {
  const [status, setStatus] = useState<IngestionEventStatus | "all">("all");
  const [endpointId, setEndpointId] = useState<string>("all");
  const [q, setQ] = useState("");

  const endpoints = useQuery({
    queryKey: ["pacs", "endpoints"],
    queryFn: () => pacsService.listEndpoints(),
  });

  const events = useQuery({
    queryKey: ["pacs", "ingestion", status, endpointId, q],
    queryFn: () =>
      pacsService.listIngestion({
        status: status === "all" ? undefined : [status],
        endpointId: endpointId === "all" ? undefined : endpointId,
        q: q.trim() || undefined,
        pageSize: 100,
      }),
    refetchInterval: 15000,
  });

  return (
    <div className="max-w-[1600px] mx-auto px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
           <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-primary/20 rounded-full" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Live Ingestion Stream</h2>
           </div>
           <p className="text-[10px] font-medium text-muted-foreground/30 uppercase tracking-widest italic ml-11">Real-time telemetry of incoming clinical imaging protocols. Sync Interval: 15s.</p>
        </div>
      </div>

      <div className="glass rounded-[2rem] border-border/40 p-6 flex items-center gap-4 flex-wrap bg-background/40 backdrop-blur-xl shadow-premium">
        <div className="relative flex-1 min-w-[280px]">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
           <Input
             placeholder="Search by Study Instance UID…"
             value={q}
             onChange={(e) => setQ(e.target.value)}
             className="h-11 pl-10 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest"
           />
        </div>
        <Select value={endpointId} onValueChange={setEndpointId}>
          <SelectTrigger className="h-11 w-56 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest"><SelectValue placeholder="All endpoints" /></SelectTrigger>
          <SelectContent className="glass border-border/40">
            <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">Global Partition</SelectItem>
            {endpoints.data?.map((e) => <SelectItem key={e.id} value={e.id} className="text-[10px] font-black uppercase tracking-widest">{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="h-11 w-48 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent className="glass border-border/40">
            <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Lifecycle States</SelectItem>
            {(Object.keys(INGESTION_STATUS_LABELS) as IngestionEventStatus[]).map((s) => (
              <SelectItem key={s} value={s} className="text-[10px] font-black uppercase tracking-widest">{INGESTION_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-[2.5rem] border-border/40 overflow-hidden shadow-premium bg-background/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Reception Time</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Source Node</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Study UID Cluster</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Modality</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Sync State</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Resolution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {events.isLoading && (
              <tr><td colSpan={6} className="py-24 text-center">
                 <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">Synchronizing Live Stream...</span>
              </td></tr>
            )}
            {events.error && (
              <tr><td colSpan={6} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-destructive italic">
                 Ingestion Fault: {(events.error as Error).message}
              </td></tr>
            )}
            {events.data?.items.length === 0 && !events.isLoading && (
              <tr><td colSpan={6} className="py-24 text-center">
                 <div className="h-16 w-16 rounded-[2rem] bg-muted/10 flex items-center justify-center mx-auto mb-6">
                    <Database className="h-8 w-8 text-muted-foreground/20" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Zero ingestion events match current filter matrix.</p>
              </td></tr>
            )}
            {events.data?.items.map((ev) => (
              <tr key={ev.id} className="group hover:bg-primary/[0.02] transition-colors">
                <td className="px-6 py-5 whitespace-nowrap">
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">{formatDate(ev.receivedAt)}</div>
                </td>
                <td className="px-6 py-5">
                   <div className="text-sm font-black text-foreground uppercase tracking-tight">{ev.endpointName}</div>
                </td>
                <td className="px-6 py-5">
                   <div className="text-[10px] font-mono font-bold text-muted-foreground/40 tracking-tighter truncate max-w-[260px]" title={ev.studyInstanceUID}>
                      {ev.studyInstanceUID}
                   </div>
                </td>
                <td className="px-6 py-5">
                   <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-border/20 text-muted-foreground/60 bg-muted/5">
                      {ev.modality ?? "GENERIC"}
                   </span>
                </td>
                <td className="px-6 py-5">
                   <IngestionStatusPill status={ev.status} />
                </td>
                <td className="px-6 py-5">
                  {ev.studyId ? (
                    <Link 
                      to="/app/studies/$studyId" 
                      params={{ studyId: ev.studyId }} 
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors group/link"
                    >
                      Audit Archive <ExternalLink className="h-3 w-3 opacity-40 group-hover/link:opacity-100 transition-opacity" />
                    </Link>
                  ) : ev.errorMessage ? (
                    <div className="text-destructive text-[9px] font-black uppercase tracking-widest max-w-[200px] truncate" title={ev.errorMessage}>
                       Fault: {ev.errorMessage}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/20 text-[9px] font-black uppercase tracking-widest">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
