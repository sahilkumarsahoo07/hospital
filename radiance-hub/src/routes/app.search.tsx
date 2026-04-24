import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Cpu, Zap, Activity, Globe, Filter, Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { searchService } from "@/lib/services";
import { SEARCH_KIND_LABELS, type SearchHitKind } from "@/lib/analytics";
import { WORKFLOW_LABELS, type WorkflowStatus } from "@/lib/workflow";
import { StatusBadge } from "@/components/workflow/StatusBadge";

export const Route = createFileRoute("/app/search")({ component: SearchPage });

const MODALITIES = ["CT", "MR", "CR", "DX", "US", "MG", "NM", "PT", "XA", "OT"] as const;
const STATUSES: WorkflowStatus[] = ["FREE_POOL", "ASSIGNED", "IN_REPORTING", "SUBMITTED", "FINALIZED"];

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
}

function SearchPage() {
  const [draftQ, setDraftQ] = useState("");
  const [q, setQ] = useState("");
  const [modality, setModality] = useState<string>("all");
  const [status, setStatus] = useState<WorkflowStatus | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = {
    q: q.trim() || undefined,
    modality: modality === "all" ? undefined : [modality],
    status: status === "all" ? undefined : [status],
    from: from || undefined,
    to: to || undefined,
    pageSize: 50,
  };

  const enabled = Boolean(params.q || params.modality || params.status || params.from || params.to);

  const { data, isFetching, error } = useQuery({
    queryKey: ["search", params],
    queryFn: () => searchService.search(params),
    enabled,
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      
      <div className="flex h-full relative z-10">
        {/* LEFT TERMINAL: Registry Protocol Control */}
        <aside className="w-80 border-r border-border/40 bg-background/30 backdrop-blur-3xl p-8 hidden lg:flex flex-col gap-10 overflow-y-auto custom-scrollbar">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Filter className="h-3 w-3 text-primary" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Protocol Filters</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-relaxed">
                 Configure search parameters to isolate clinical registry partitions.
              </p>
           </div>

           <form 
             onSubmit={(e) => { e.preventDefault(); setQ(draftQ); }}
             className="space-y-8"
           >
              <div className="space-y-6">
                <div className="space-y-2.5">
                   <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Modality Protocol</label>
                   <Select value={modality} onValueChange={setModality}>
                      <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest">
                         <SelectValue placeholder="All Modalities" />
                      </SelectTrigger>
                      <SelectContent className="glass border-border/40">
                         <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">Global Partition</SelectItem>
                         {MODALITIES.map((m) => <SelectItem key={m} value={m} className="text-[10px] font-black uppercase tracking-widest">{m}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2.5">
                   <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Workflow State</label>
                   <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                      <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest">
                         <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent className="glass border-border/40">
                         <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Cycles</SelectItem>
                         {STATUSES.map((s) => <SelectItem key={s} value={s} className="text-[10px] font-black uppercase tracking-widest">{WORKFLOW_LABELS[s]}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2.5">
                   <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Ingestion Timeline</label>
                   <div className="grid gap-2">
                      <div className="relative">
                         <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 px-4 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest" />
                         <span className="absolute -top-1.5 left-3 px-1 bg-background text-[7px] font-black text-muted-foreground/40 uppercase">Range Start</span>
                      </div>
                      <div className="relative">
                         <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 px-4 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest" />
                         <span className="absolute -top-1.5 left-3 px-1 bg-background text-[7px] font-black text-muted-foreground/40 uppercase">Range End</span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/10 space-y-3">
                 <Button type="submit" className="w-full h-11 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Execute Discovery
                 </Button>
                 <Button 
                   type="button" 
                   variant="ghost" 
                   className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground"
                   onClick={() => {
                     setDraftQ(""); setQ(""); setModality("all"); setStatus("all"); setFrom(""); setTo("");
                   }}
                 >
                    Reset Registry
                 </Button>
              </div>
           </form>

           <div className="mt-auto p-5 glass rounded-2xl border-border/40 space-y-3">
              <div className="flex items-center gap-2">
                 <Activity className="h-3 w-3 text-primary animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Index Synchronization</span>
              </div>
              <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                 <div className="h-full w-[85%] bg-primary/40 rounded-full" />
              </div>
              <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/20 leading-relaxed italic">
                 v2.1 Clinical Index Cluster Stable • Latency 14ms
              </p>
           </div>
        </aside>

        {/* RIGHT FEED: Global Index Results */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
          <div className="max-w-[1000px] mx-auto space-y-12">
            <header className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                     <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                     <h1 className="text-4xl font-display font-black tracking-tighter text-foreground uppercase">Discovery</h1>
                     <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Global Protocol Registry Access</span>
                     </div>
                  </div>
               </div>

               <div className="relative group">
                  <SearchIcon className="h-5 w-5 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    autoFocus
                    value={draftQ}
                    onChange={(e) => setDraftQ(e.target.value)}
                    placeholder="QUERY PATIENT IDENTITY, ACCESSION, OR STUDY INSTANCE UID..."
                    className="h-16 pl-14 pr-6 rounded-2xl bg-background/40 backdrop-blur-xl border-border/40 focus:border-primary/40 focus:ring-primary/5 text-sm font-medium placeholder:text-muted-foreground/10 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.2em]"
                    onKeyDown={(e) => e.key === "Enter" && setQ(draftQ)}
                  />
               </div>
            </header>

            <section className="space-y-8">
              {!enabled && (
                <div className="glass rounded-[3rem] border-dashed border-border/40 p-32 text-center flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                   <div className="h-20 w-20 rounded-[2.5rem] bg-muted/5 flex items-center justify-center group">
                      <Zap className="h-10 w-10 text-muted-foreground/10 group-hover:text-primary/20 transition-colors" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Registry Inactive</p>
                      <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/10 italic">Initialize search query to bridge global diagnostic nodes.</p>
                   </div>
                </div>
              )}
              
              {enabled && isFetching && (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                   <div className="relative">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">Synchronizing Cluster Results...</span>
                </div>
              )}
              
              {enabled && error && (
                <div className="glass rounded-[2.5rem] border-destructive/20 bg-destructive/5 p-12 text-center">
                   <ShieldAlert className="h-10 w-10 text-destructive/40 mx-auto mb-6" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-destructive">Index Access Fault</p>
                   <p className="text-[10px] font-medium text-destructive/60 mt-2 italic">{(error as Error).message}</p>
                </div>
              )}
              
              {enabled && data && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                       <div className="h-px w-8 bg-primary/20" />
                       <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">{data.total} Matched Registry Nodes</h2>
                    </div>
                    {data.tookMs != null && (
                      <div className="px-3 py-1 glass rounded-full border-border/20">
                         <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">Protocol Time: {data.tookMs}ms</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {data.items.map((h) => <SearchCard key={`${h.kind}:${h.id}`} hit={h} />)}
                    {data.items.length === 0 && (
                      <div className="glass rounded-[3rem] p-32 text-center border-dashed border-border/40">
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">Zero matches discovered in current registry slice.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function SearchCard({ hit }: { hit: { id: string; kind: SearchHitKind; title: string; subtitle?: string | null; modality?: string | null; bodyPart?: string | null; status?: WorkflowStatus | null; studyId?: string | null; studyInstanceUID?: string | null; studyDate?: string | null; matchedField?: string | null } }) {
  const linkable = hit.studyId;
  const Body = (
    <div className="glass rounded-[2.5rem] p-8 border-border/40 hover:border-primary/40 hover:bg-primary/[0.03] transition-all duration-700 group relative overflow-hidden">
      <div className="absolute right-0 top-0 p-8 opacity-0 group-hover:opacity-[0.03] transition-all duration-700 pointer-events-none group-hover:rotate-12 group-hover:scale-150">
         <Globe className="h-32 w-32" />
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="flex items-start gap-8 flex-1 min-w-0">
           <div className="h-16 w-16 rounded-[1.5rem] bg-muted/10 border border-border/40 flex flex-col items-center justify-center shrink-0 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-500">
              <span className="text-[10px] font-black text-muted-foreground/40 group-hover:text-primary transition-colors tracking-widest uppercase">Node</span>
              <span className="text-lg font-black text-foreground group-hover:text-primary transition-colors tracking-tighter uppercase leading-tight">{hit.modality || "—"}</span>
           </div>
           <div className="min-w-0 flex-1 space-y-2">
             <div className="flex items-center gap-3">
               <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-lg border border-primary/20 text-primary/60 bg-primary/5">{SEARCH_KIND_LABELS[hit.kind]}</span>
               {hit.matchedField && <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">• Registry Hit: {hit.matchedField}</span>}
             </div>
             <div className="text-2xl font-display font-black text-foreground group-hover:text-primary transition-colors truncate uppercase tracking-tight leading-none">{hit.title}</div>
             <div className="text-[11px] font-medium text-muted-foreground/60 truncate tracking-tight uppercase opacity-60">{hit.subtitle || "Patient record verified"}</div>
             {hit.studyInstanceUID && (
               <div className="font-mono text-[9px] text-muted-foreground/20 mt-3 truncate bg-background/30 inline-block px-3 py-1 rounded-xl border border-border/10">
                  UID Cluster: {hit.studyInstanceUID}
               </div>
             )}
           </div>
        </div>
        
        <div className="flex items-center gap-8 shrink-0 md:border-l md:border-border/10 md:pl-8">
          <div className="flex flex-col items-end gap-3">
             {hit.status && <StatusBadge status={hit.status} />}
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20">{hit.bodyPart || "General"}</span>
                <div className="h-1 w-1 rounded-full bg-border/20" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40">{hit.studyDate ? formatDate(hit.studyDate) : "Historical Registry"}</span>
             </div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl group-hover:shadow-primary/20">
             <ArrowRight className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-in slide-in-from-bottom-2 duration-500">
      {linkable ? (
        <Link to="/app/studies/$studyId" params={{ studyId: linkable }}>{Body}</Link>
      ) : Body}
    </div>
  );
}


