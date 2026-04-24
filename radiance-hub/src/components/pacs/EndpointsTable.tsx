import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, Pencil, Plug, Power, RefreshCw, Trash2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pacsService } from "@/lib/services";
import { PACS_PROTOCOL_LABELS, type PacsEndpoint } from "@/lib/pacs";
import { EndpointStatusPill } from "./StatusPill";
import { EndpointEditor } from "./EndpointEditor";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export function EndpointsTable() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PacsEndpoint | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pacs", "endpoints"],
    queryFn: () => pacsService.listEndpoints(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["pacs", "endpoints"] });
    qc.invalidateQueries({ queryKey: ["pacs", "health"] });
  };

  const test = useMutation({
    mutationFn: (id: string) => pacsService.testEndpoint(id),
    onSuccess: (r) => {
      if (r.ok) toast.success(`Node Reachable${r.latencyMs ? ` — RTT: ${r.latencyMs}ms` : ""}`);
      else toast.error(r.message ?? "Node unreachable at network layer");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sync = useMutation({
    mutationFn: (id: string) => pacsService.syncEndpoint(id),
    onSuccess: () => { toast.success("Protocol Synchronization Initialized"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (e: PacsEndpoint) =>
      e.status === "disabled" ? pacsService.enableEndpoint(e.id) : pacsService.disableEndpoint(e.id),
    onSuccess: () => { invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => pacsService.deleteEndpoint(id),
    onSuccess: () => { toast.success("Endpoint Purged from Registry"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-[1600px] mx-auto px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
           <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-primary/20 rounded-full" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Imaging Resource Registry</h2>
           </div>
           <p className="text-[10px] font-medium text-muted-foreground/30 uppercase tracking-widest italic ml-11">Managing external imaging nodes and push/pull lifecycle protocols.</p>
        </div>
        <Button 
          onClick={() => setCreating(true)}
          className="h-11 px-8 rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/5"
        >
           <Plug className="h-4 w-4 mr-2" /> Initialize New Node
        </Button>
      </div>

      <div className="rounded-[2.5rem] border border-border/40 overflow-hidden shadow-premium bg-background/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Identity Node</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Interface Protocol</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Network Link</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Lifecycle State</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Registry Sync</th>
              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-right">Commit Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {isLoading && (
              <tr><td colSpan={6} className="py-24 text-center">
                 <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">Syncing Node Registry...</span>
              </td></tr>
            )}
            {error && (
              <tr><td colSpan={6} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-destructive italic">
                 Registry Connection Error: {(error as Error).message}
              </td></tr>
            )}
            {data?.length === 0 && (
              <tr><td colSpan={6} className="py-24 text-center">
                 <div className="h-16 w-16 rounded-[2rem] bg-muted/10 flex items-center justify-center mx-auto mb-6">
                    <Terminal className="h-8 w-8 text-muted-foreground/20" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Registry partition is clear — No imaging nodes registered.</p>
              </td></tr>
            )}
            {data?.map((ep) => (
              <tr key={ep.id} className="group hover:bg-primary/[0.02] transition-colors">
                <td className="px-6 py-5">
                  <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{ep.name}</div>
                  {ep.sourceLabel && <div className="text-[10px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-tighter italic">{ep.sourceLabel}</div>}
                </td>
                <td className="px-6 py-5">
                   <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border border-primary/20 text-primary/60 bg-primary/5">
                      {PACS_PROTOCOL_LABELS[ep.protocol]}
                   </span>
                </td>
                <td className="px-6 py-5 font-mono text-[10px] tracking-tighter">
                  <div className="flex flex-col gap-0.5">
                     <div className="text-foreground/60 font-bold">{ep.host}{ep.port ? `:${ep.port}` : ""}</div>
                     {ep.aeTitle && <div className="text-[9px] text-muted-foreground/30 uppercase font-black">AE Title: {ep.aeTitle}</div>}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1.5">
                    <EndpointStatusPill status={ep.status} />
                    {ep.lastErrorMessage && (
                      <div className="text-[8px] font-black text-destructive uppercase tracking-widest italic max-w-[180px] truncate" title={ep.lastErrorMessage}>
                        {ep.lastErrorMessage}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">{formatDate(ep.lastSyncAt)}</div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="inline-flex gap-1.5 bg-background/40 p-1 rounded-xl border border-border/20">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5" title="Diagnostic Test" onClick={() => test.mutate(ep.id)} disabled={test.isPending}>
                      <Activity className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5" title="Protocol Sync" onClick={() => sync.mutate(ep.id)} disabled={sync.isPending || ep.status === "disabled"}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className={`h-8 w-8 rounded-lg ${ep.status === "disabled" ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"}`} title={ep.status === "disabled" ? "Enable Node" : "Disable Node"} onClick={() => toggle.mutate(ep)}>
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5" title="Edit Properties" onClick={() => setEditing(ep)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5" title="Purge Node" onClick={() => {
                      if (confirm(`Delete imaging node "${ep.name}" from registry?`)) remove.mutate(ep.id);
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EndpointEditor open={creating} onOpenChange={setCreating} />
      <EndpointEditor open={!!editing} onOpenChange={(v) => !v && setEditing(null)} endpoint={editing} />
    </div>
  );
}
