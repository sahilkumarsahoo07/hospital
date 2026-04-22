import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { studiesService } from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { useStudiesStore } from "@/lib/stores/studiesStore";
import { StudyTable } from "@/components/workflow/StudyTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WORKFLOW_LABELS, WORKFLOW_STATUS } from "@/lib/workflow";
import { Loader2, Search, Filter, RotateCcw, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/studies/")({ 
  component: StudiesPage 
});

function StudiesPage() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const { query, setQuery, setSearch, setStatus, resetQuery } = useStudiesStore();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["studies", query],
    queryFn: () => studiesService.list(query),
    refetchInterval: 30_000,
  });

  const activeStatusCount = query.status?.length || 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
      <header className="px-8 py-6 border-b bg-card/30 backdrop-blur-md sticky top-0 z-10">
         <div className="max-w-7xl mx-auto flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0">PACS Node: 01</Badge>
                 <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Live Sync Alpha</span>
              </div>
              <h1 className="text-3xl font-display font-bold tracking-tight">Diagnostic Worklist</h1>
              <p className="text-muted-foreground text-sm mt-1 max-w-md">
                Enterprise imaging workflow. Manage assignments and track study progression in real-time.
              </p>
            </div>
            <div className="flex items-center gap-3">
               <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                  <RotateCcw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
               </Button>
               <Button size="sm" className="rounded-full shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Direct Ingest
               </Button>
            </div>
         </div>
      </header>

      <div className="px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Advanced Filter Bar */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
           <div className="flex items-center gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search Patient MRN, Accession, or Study Description..." 
                   className="pl-10 h-11 bg-muted/30 border-none ring-offset-background focus-visible:ring-1"
                   value={query.q || ""}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl" onClick={resetQuery}>
                 <Filter className="h-5 w-5" />
              </Button>
           </div>

           <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-2">Workflow Filters:</span>
              {[
                WORKFLOW_STATUS.NEW_STUDY_RECEIVED,
                WORKFLOW_STATUS.PENDING_ASSIGNMENT,
                WORKFLOW_STATUS.REPORT_IN_PROGRESS,
                WORKFLOW_STATUS.VERIFICATION_PENDING,
                WORKFLOW_STATUS.REPORT_COMPLETED
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    const current = query.status || [];
                    const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
                    setStatus(next);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    query.status?.includes(s)
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {WORKFLOW_LABELS[s]}
                </button>
              ))}
              {activeStatusCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={() => setStatus([])}>
                   Clear All ({activeStatusCount})
                </Button>
              )}
           </div>
        </div>

        {/* Worklist Table Content */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                 {data?.total ?? 0} Studies Found
              </div>
              {isFetching && (
                 <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" /> Fetching latest updates...
                 </div>
              )}
           </div>

           {isLoading ? (
             <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-card/20 rounded-3xl border border-dashed">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                   <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-ping" />
                   <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse" />
                   <Loader2 className="h-6 w-6 text-primary animate-spin relative z-10" />
                </div>
                <div className="text-center">
                   <p className="text-sm font-bold tracking-tight">Syncing Diagnostic Worklist</p>
                   <p className="text-xs text-muted-foreground mt-1">Connecting to Radiance PACS gateway...</p>
                </div>
             </div>
           ) : error ? (
             <div className="bg-destructive/10 border border-destructive/20 text-destructive p-8 rounded-3xl text-center">
                <p className="font-bold">Gateway Connection Failed</p>
                <p className="text-sm mt-1 opacity-80">{(error as any).message || "Check your network or contact a system administrator."}</p>
                <Button variant="outline" size="sm" className="mt-4 border-destructive/30 hover:bg-destructive/10" onClick={() => refetch()}>Retry Connection</Button>
             </div>
           ) : (
             <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                <StudyTable 
                  studies={data?.items || []} 
                  roles={roles} 
                  renderActions={(s) => (
                    <Button asChild size="sm" className="h-8 rounded-lg shadow-sm hover:shadow-md transition-all">
                       <Link to="/app/studies/$studyId" params={{ studyId: s.id }}>
                          View Intelligence →
                       </Link>
                    </Button>
                  )} 
                />
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
