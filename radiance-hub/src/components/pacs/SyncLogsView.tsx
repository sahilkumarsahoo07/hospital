import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pacsService } from "@/lib/services";
import type { SyncLogLevel } from "@/lib/pacs";
import { LogLevelPill } from "./StatusPill";
import { Terminal, Database, Loader2, RefreshCw, Activity, Search, Filter } from "lucide-react";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export function SyncLogsView() {
  const [level, setLevel] = useState<SyncLogLevel | "all">("all");
  const [endpointId, setEndpointId] = useState<string>("all");

  const endpoints = useQuery({
    queryKey: ["pacs", "endpoints"],
    queryFn: () => pacsService.listEndpoints(),
  });

  const logs = useQuery({
    queryKey: ["pacs", "logs", level, endpointId],
    queryFn: () =>
      pacsService.listLogs({
        level: level === "all" ? undefined : [level],
        endpointId: endpointId === "all" ? undefined : endpointId,
        pageSize: 200,
      }),
    refetchInterval: 20000,
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
           <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-primary/20 rounded-full" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Sync Diagnostics Terminal</h2>
           </div>
           <p className="text-[10px] font-medium text-muted-foreground/30 uppercase tracking-widest italic ml-11">Protocol-level events from the PACS workers (C-FIND, QIDO, polling, auth). Sync Interval: 20s.</p>
        </div>
      </div>

      <div className="glass rounded-[2rem] border-border/40 p-6 flex items-center gap-4 flex-wrap bg-background/40 backdrop-blur-xl shadow-premium">
        <Select value={endpointId} onValueChange={setEndpointId}>
          <SelectTrigger className="h-11 w-64 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest"><SelectValue placeholder="All endpoints" /></SelectTrigger>
          <SelectContent className="glass border-border/40">
            <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">Global Partition</SelectItem>
            {endpoints.data?.map((e) => <SelectItem key={e.id} value={e.id} className="text-[10px] font-black uppercase tracking-widest">{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
          <SelectTrigger className="h-11 w-48 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest"><SelectValue placeholder="All levels" /></SelectTrigger>
          <SelectContent className="glass border-border/40">
            <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Log Levels</SelectItem>
            <SelectItem value="info" className="text-[10px] font-black uppercase tracking-widest">Information</SelectItem>
            <SelectItem value="warn" className="text-[10px] font-black uppercase tracking-widest">Warning Alerts</SelectItem>
            <SelectItem value="error" className="text-[10px] font-black uppercase tracking-widest">Critical Faults</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-[2.5rem] border-border/40 overflow-hidden shadow-premium bg-background/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 w-48">Execution Time</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 w-32">Severity</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Node</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 w-32">Operation</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Log Protocol Message</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-right w-32">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {logs.isLoading && (
              <tr><td colSpan={6} className="py-24 text-center">
                 <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">Synchronizing Logs Registry...</span>
              </td></tr>
            )}
            {logs.error && (
              <tr><td colSpan={6} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-destructive italic">
                 Log Stream Fault: {(logs.error as Error).message}
              </td></tr>
            )}
            {logs.data?.items.length === 0 && !logs.isLoading && (
              <tr><td colSpan={6} className="py-24 text-center">
                 <div className="h-16 w-16 rounded-[2rem] bg-muted/10 flex items-center justify-center mx-auto mb-6">
                    <Terminal className="h-8 w-8 text-muted-foreground/20" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Zero log entries match current filter matrix.</p>
              </td></tr>
            )}
            {logs.data?.items.map((l) => (
              <tr key={l.id} className="group hover:bg-primary/[0.02] transition-colors">
                <td className="px-6 py-5 whitespace-nowrap">
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">{formatDate(l.createdAt)}</div>
                </td>
                <td className="px-6 py-5">
                   <LogLevelPill level={l.level} />
                </td>
                <td className="px-6 py-5">
                   <div className="text-sm font-black text-foreground uppercase tracking-tight">{l.endpointName}</div>
                </td>
                <td className="px-6 py-5">
                   <span className="text-[9px] font-mono font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                      {l.op ?? "SYSTEM"}
                   </span>
                </td>
                <td className="px-6 py-5">
                   <div className="text-sm font-medium text-foreground/80 leading-relaxed max-w-2xl">{l.message}</div>
                </td>
                <td className="px-6 py-5 text-right whitespace-nowrap">
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                      {l.durationMs ? `${l.durationMs}ms RTT` : "—"}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

