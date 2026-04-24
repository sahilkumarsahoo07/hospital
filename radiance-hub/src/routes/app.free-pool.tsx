import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studiesService } from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES } from "@/lib/roles";
import { StudyTable } from "@/components/workflow/StudyTable";
import { ModalityFilter } from "@/components/workflow/ModalityFilter";
import { AssignDialog } from "@/components/workflow/AssignDialog";
import { Button } from "@/components/ui/button";
import { Loader2, HandIcon, UserPlus, Zap, Cpu, Activity, Globe, RefreshCw, Layers } from "lucide-react";

export const Route = createFileRoute("/app/free-pool")({ component: FreePoolPage });

function FreePoolPage() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const qc = useQueryClient();
  const isRad = roles.includes(ROLES.RADIOLOGIST);
  const isAdmin = roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.SUB_ADMIN);
  const [modality, setModality] = useState<string[]>([]);

  const queryKey = useMemo(() => ["free-pool", modality], [modality]);
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => studiesService.freePool(modality.length ? modality : undefined),
    refetchInterval: 20_000,
  });

  const claim = useMutation({
    mutationFn: (id: string) => studiesService.claim(id),
    onSuccess: () => { 
      toast.success("Protocol Claimed — Assignment state synchronized"); 
      qc.invalidateQueries({ queryKey: ["free-pool"] }); 
      qc.invalidateQueries({ queryKey: ["studies"] }); 
    },
    onError: (e: Error) => toast.error(e.message),
  });
  
  const assign = useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string }) => studiesService.assign(id, assigneeId),
    onSuccess: () => { 
      toast.success("Manual Assignment Finalized"); 
      qc.invalidateQueries({ queryKey: ["free-pool"] }); 
      qc.invalidateQueries({ queryKey: ["studies"] }); 
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      
      <main className="flex-1 overflow-auto p-8 relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-10">
          
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                     <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Unassigned Ingestion</span>
                     <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Real-time Stream Active</span>
                     </div>
                  </div>
               </div>
               <h1 className="text-5xl font-display font-black tracking-tighter text-foreground leading-[0.9]">
                  Free Pool <span className="text-primary/40 block mt-2 text-3xl">Specialty Harvesting Queue</span>
               </h1>
            </div>
            
            <div className="flex flex-col items-start lg:items-end gap-2 max-w-sm">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-relaxed lg:text-right">
                  {isRad ? "Initialize diagnostic protocol by claiming studies that match your specialty matrix." : "Administrative override for manual study routing and clinical assignment."}
               </p>
            </div>
          </header>

          <div className="glass rounded-[2rem] border-border/40 p-5 flex items-center justify-between gap-6 flex-wrap bg-background/40 backdrop-blur-xl shadow-premium">
            <div className="flex items-center gap-4">
               <div className="h-8 w-1 rounded-full bg-primary/20" />
               <ModalityFilter selected={modality} onChange={setModality} />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()} 
              disabled={isFetching}
              className="h-11 px-6 rounded-xl glass border-border/40 text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Re-Sync Ingestion
            </Button>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {isLoading ? (
               <div className="glass rounded-[3rem] p-32 flex flex-col items-center justify-center gap-6">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 animate-pulse">Initializing Stream Buffer...</span>
               </div>
            ) : error ? (
               <div className="glass rounded-[2.5rem] border-destructive/20 bg-destructive/5 p-12 text-center">
                  <p className="text-sm font-black uppercase tracking-widest text-destructive">Ingestion Protocol Failure</p>
                  <p className="text-[10px] font-medium text-destructive/60 mt-2">{(error as Error).message}</p>
               </div>
            ) : (
              <div className="glass rounded-[2.5rem] border-border/40 overflow-hidden shadow-premium relative bg-background/40">
                <StudyTable
                  studies={data?.items || []}
                  roles={roles}
                  emptyHint="Registry partition is clear for selected modality filters."
                  renderActions={(s) => (
                    <div className="flex justify-end gap-2">
                      {isRad && (
                        <Button 
                          size="sm" 
                          disabled={claim.isPending} 
                          onClick={() => claim.mutate(s.id)}
                          className="h-8 px-4 rounded-lg bg-foreground text-background text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/5"
                        >
                          <HandIcon className="h-3.5 w-3.5 mr-2" /> Claim Protocol
                        </Button>
                      )}
                      {isAdmin && (
                        <AssignDialog
                          trigger={
                             <Button 
                               size="sm" 
                               variant="ghost" 
                               className="h-8 px-4 rounded-lg glass border-border/40 text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
                             >
                                <UserPlus className="h-3.5 w-3.5 mr-2" /> Route Study
                             </Button>
                          }
                          pending={assign.isPending}
                          onAssign={(assigneeId) => assign.mutate({ id: s.id, assigneeId })}
                        />
                      )}
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

