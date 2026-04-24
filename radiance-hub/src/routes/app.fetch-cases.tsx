import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studiesService } from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES } from "@/lib/roles";
import { StudyTable } from "@/components/workflow/StudyTable";
import { ModalityFilter } from "@/components/workflow/ModalityFilter";
import { Button } from "@/components/ui/button";
import { Loader2, HandIcon, ShieldAlert, Cpu, Zap, Activity, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/app/fetch-cases")({ component: FetchCasesPage });

function FetchCasesPage() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const qc = useQueryClient();
  const isRad = roles.includes(ROLES.RADIOLOGIST);
  const [modality, setModality] = useState<string[]>([]);

  const queryKey = useMemo(() => ["fetch-cases", modality], [modality]);
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => studiesService.freePool(modality.length ? modality : undefined),
    enabled: isRad && modality.length > 0,
    refetchInterval: modality.length > 0 ? 20_000 : false,
  });

  const claim = useMutation({
    mutationFn: (id: string) => studiesService.claim(id),
    onSuccess: () => {
      toast.success("Case Protocol Claimed — Synchronized to worklist");
      qc.invalidateQueries({ queryKey: ["fetch-cases"] });
      qc.invalidateQueries({ queryKey: ["studies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isRad) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        <div className="glass rounded-[2.5rem] p-12 text-center max-w-lg border-border/40">
           <ShieldAlert className="h-10 w-10 text-muted-foreground/20 mx-auto mb-6" />
           <h1 className="text-xl font-display font-black tracking-tight text-foreground uppercase">Authorization Conflict</h1>
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-4 leading-relaxed">
             Diagnostic Case Fetching is restricted to verified clinical nodes. Protocol bypass detected. Authorization required.
           </p>
           <Link to="/app" className="mt-8 inline-block text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-0.5 hover:text-foreground transition-all">
              Return to Control Center
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      
      <main className="flex-1 overflow-auto p-8 relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-10">
          
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                     <Cpu className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Case Ingestion Hub</span>
                     <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Global Protocol Stream Active</span>
                     </div>
                  </div>
               </div>
               <h1 className="text-5xl font-display font-black tracking-tighter text-foreground leading-[0.9]">
                  Fetch Cases <span className="text-primary/40 block mt-2 text-3xl">Registry Harvesting</span>
               </h1>
            </div>
            
            <div className="flex items-center gap-4 p-2 glass rounded-2xl border-border/40 bg-background/40 backdrop-blur-xl">
               <ModalityFilter selected={modality} onChange={setModality} />
               <div className="h-8 w-px bg-border/40 mx-1" />
               <Button
                 variant="ghost"
                 size="sm"
                 className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
                 onClick={() => refetch()}
                 disabled={isFetching || modality.length === 0}
               >
                 {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
                 {isFetching ? "Syncing..." : "Refresh"}
               </Button>
            </div>
          </header>

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             {modality.length === 0 ? (
                <div className="glass rounded-[3rem] border-dashed border-border/40 p-32 text-center flex flex-col items-center gap-6">
                   <div className="h-16 w-16 rounded-[2rem] bg-muted/10 flex items-center justify-center">
                      <Zap className="h-8 w-8 text-muted-foreground/20" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Select specialty protocols above to initialize global case harvesting</p>
                </div>
             ) : (
                <div className="space-y-6">
                   {isLoading && (
                      <div className="glass rounded-[2.5rem] p-12 flex items-center justify-center gap-4">
                         <Loader2 className="h-6 w-6 text-primary animate-spin" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Aggregating protocol matching studies...</span>
                      </div>
                   )}
                   
                   {error && (
                      <div className="glass rounded-[2.5rem] border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
                         <p className="text-sm font-black uppercase tracking-widest">Global Synchronization Error</p>
                         <p className="text-[10px] font-medium mt-1">{(error as Error).message}</p>
                      </div>
                   )}

                   {data && (
                      <StudyTable
                        studies={data.items}
                        roles={roles}
                        emptyHint="No matching case protocols available in global registry. Stand by for stream updates."
                        renderActions={(s) => (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              className="h-8 px-4 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/5"
                              disabled={claim.isPending} 
                              onClick={() => claim.mutate(s.id)}
                            >
                              <HandIcon className="h-3.5 w-3.5 mr-2" /> Claim Protocol
                            </Button>
                          </div>
                        )}
                      />
                   )}
                </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}

