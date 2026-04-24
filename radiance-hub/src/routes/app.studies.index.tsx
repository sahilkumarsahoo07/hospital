import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { studiesService } from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { useStudiesStore } from "@/lib/stores/studiesStore";
import { StudyTable } from "@/components/workflow/StudyTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WORKFLOW_LABELS, WORKFLOW_STATUS } from "@/lib/workflow";
import { Loader2, Search, Filter, RotateCcw, Plus, Activity, Layers, Database, ChevronRight, Zap, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/studies/")({ 
  component: StudiesPage 
});

function StudiesPage() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const { query, setSearch, setStatus, resetQuery } = useStudiesStore();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["studies", query],
    queryFn: () => studiesService.list(query),
    refetchInterval: 30_000,
  });

  const activeStatusCount = query.status?.length || 0;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-2">
           <span className="rd-label">Global Worklist</span>
           <h1 className="rd-display-h text-3xl md:text-4xl leading-[0.9] tracking-tighter">
              Diagnostic <br/>
              <span className="text-primary">Registry.</span>
           </h1>
        </div>

        <div className="flex items-center gap-4">
           <button className="h-12 px-6 rounded-xl bg-white/5 border border-white/5 backdrop-blur-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all" onClick={() => refetch()} disabled={isFetching}>
             <RotateCcw className={cn("h-3 w-3", isFetching && "animate-spin")} />
             Sync
           </button>
           <button className="h-12 px-8 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-[0.1em] flex items-center gap-3 shadow-lg hover:scale-105 transition-all">
             <Plus className="h-3.5 w-3.5" />
             Ingest Case
           </button>
        </div>
      </section>

      {/* MAIN REGISTRY INTERFACE */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT PARTITION SIDEBAR */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-6 lg:sticky lg:top-8">
           <div className="rd-card !p-4 space-y-4">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Partitions</span>
                 </div>
                 {activeStatusCount > 0 && (
                   <button onClick={() => setStatus([])} className="text-[8px] font-black text-rose-500 uppercase hover:underline">Reset</button>
                 )}
              </div>

              <div className="space-y-1 max-h-[600px] overflow-y-auto no-scrollbar">
                {Object.values(WORKFLOW_STATUS).map((s) => {
                  const isActive = query.status?.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        const current = query.status || [];
                        const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
                        setStatus(next);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all text-left",
                        isActive
                          ? "bg-primary text-white shadow-lg"
                          : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      <span className="truncate">{WORKFLOW_LABELS[s]}</span>
                      {isActive && <div className="h-1 w-1 bg-white rounded-full" />}
                    </button>
                  );
                })}
              </div>
           </div>

           <div className="rd-card !p-4 bg-primary/5 border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                 <Zap className="h-3 w-3 text-primary animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Analytics Pulse</span>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-[8px] font-black uppercase opacity-40">
                    <span>Active Ingest</span>
                    <span>{data?.total || 0}</span>
                 </div>
                 <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[65%] shadow-[0_0_8px_oklch(var(--color-primary))]" />
                 </div>
              </div>
           </div>
        </aside>

        {/* RIGHT DATA AREA */}
        <div className="flex-1 min-w-0 space-y-6">
           <section className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors" />
              <input 
                 type="text" 
                 placeholder="SEARCH REGISTRY..." 
                 className="w-full h-14 pl-14 pr-8 rounded-xl bg-white/5 border border-white/5 backdrop-blur-xl text-lg font-black italic tracking-tighter focus:border-primary/30 outline-none transition-all placeholder:text-muted-foreground/20 uppercase"
                 value={query.q || ""}
                 onChange={(e) => setSearch(e.target.value)}
              />
           </section>

           <div className="rd-card !p-0 !rounded-2xl overflow-hidden">
             {isLoading ? (
               <div className="h-[500px] flex flex-col items-center justify-center gap-6 opacity-30 italic">
                 <Loader2 className="h-10 w-10 animate-spin text-primary" />
                 <div className="text-[9px] font-black uppercase tracking-[0.4em]">Synchronizing Partition...</div>
               </div>
             ) : error ? (
               <div className="p-20 text-center bg-rose-500/5">
                 <Activity className="h-12 w-12 text-rose-500 mx-auto mb-6 shadow-xl" />
                 <h3 className="rd-display-h text-3xl text-foreground mb-4">Link Severed.</h3>
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Registry Offline.</p>
               </div>
             ) : (
               <StudyTable 
                 studies={data?.items || []} 
                 roles={roles} 
                 renderActions={(s) => (
                   <Button asChild className="h-9 px-5 rounded-lg bg-foreground text-background text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                     <Link to="/app/studies/$studyId" params={{ studyId: s.id }} className="flex items-center gap-2">
                       Access <ArrowRight className="h-3 w-3" />
                     </Link>
                   </Button>
                 )} 
               />
             )}
           </div>
        </div>
      </div>

      {/* FOOTER STATS */}
      <footer className="flex items-center justify-between px-6 opacity-20">
         <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
            <Database className="h-3 w-3" />
            {data?.total ?? 0} Global Records
         </div>
         <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            Protocol v4.2 Active
         </div>
      </footer>
    </div>
  );
}
