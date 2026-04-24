import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/authStore";
import { analyticsService, studiesService } from "@/lib/services";
import {
   Activity,
   ShieldCheck,
   AlertCircle,
   Clock,
   ChevronRight,
   TrendingUp,
   ArrowUpRight,
   Database,
   Layers,
   Sparkles,
   ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/")({
   component: Overview,
});

function Overview() {
   const { user } = useAuthStore();
   const userName = user?.fullName || "Operator";

   const analyticsQ = useQuery({
      queryKey: ["analytics", "system"],
      queryFn: () => analyticsService.system(),
   });

   const studiesQ = useQuery({
      queryKey: ["studies", "recent"],
      queryFn: () => studiesService.list({ pageSize: 5 }),
   });

   const stats = analyticsQ.data;

   return (
      <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700">
         {/* HERO SECTION */}
         <section className="relative pt-4">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
               <div className="space-y-2">
                  <span className="rd-label">Operational Hub v4.0</span>
                  <h1 className="rd-display-h text-3xl md:text-4xl leading-[0.9] tracking-tighter">
                     System <br />
                     <span className="text-primary">Overview.</span>
                  </h1>
               </div>
            </div>
         </section>

         {/* METRICS BENTO */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rd-card group">
               <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                  <ShieldCheck className="h-4 w-4" />
               </div>
               <span className="rd-label">Auth Queue</span>
               <div className="text-3xl font-black italic tracking-tighter rd-display-h">
                  {stats?.studies?.verification_pending ?? 0}
               </div>
            </div>

            <div className="rd-card group">
               <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-all">
                  <Activity className="h-4 w-4" />
               </div>
               <span className="rd-label">Active Flux</span>
               <div className="text-3xl font-black italic tracking-tighter rd-display-h">
                  {stats?.studies?.in_reporting ?? 0}
               </div>
            </div>

            <div className="rd-card !bg-primary !text-white shadow-xl shadow-primary/20">
               <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center mb-4">
                  <AlertCircle className="h-4 w-4" />
               </div>
               <span className="rd-label !text-white/70">Priority Case</span>
               <div className="text-3xl font-black italic tracking-tighter rd-display-h">
                  {stats?.studies?.urgent ?? 0}
               </div>
            </div>

            <div className="rd-card group overflow-hidden relative">
               <div className="absolute inset-0 bg-mesh opacity-10 animate-mesh" />
               <div className="relative z-10">
                  <div className="h-8 w-8 rounded-lg bg-foreground/10 flex items-center justify-center mb-4 group-hover:bg-foreground group-hover:text-background transition-all">
                     <Database className="h-4 w-4" />
                  </div>
                  <span className="rd-label">Global Registry</span>
                  <div className="text-3xl font-black italic tracking-tighter rd-display-h">
                     {stats?.studies?.total ?? 0}
                  </div>
               </div>
            </div>
         </div>

         {/* RECENT STREAM & ACTIVITY */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
               <h2 className="rd-display-h text-2xl">Diagnostic Stream</h2>

               <div className="space-y-3">
                  {studiesQ.isLoading ? (
                     <div className="h-40 rd-card flex items-center justify-center opacity-30 italic font-black uppercase tracking-widest text-[9px]">
                        Connecting to global node stream...
                     </div>
                  ) : (
                     studiesQ.data?.items.map((s) => (
                        <div key={s.id} className="rd-card group !p-4 flex items-center justify-between border-transparent hover:border-primary/20">
                           <div className="flex items-center gap-6">
                              <div className="h-10 w-10 glass rounded-xl flex items-center justify-center text-xs font-black italic text-primary group-hover:scale-105 transition-transform">
                                 {s.modality}
                              </div>
                              <div>
                                 <div className="text-sm font-black italic tracking-tight uppercase leading-none">{s.patientName}</div>
                                 <div className="flex items-center gap-3 mt-1 opacity-40 text-[9px] font-black uppercase tracking-widest">
                                    <span>{s.patientId}</span>
                                    <div className="w-1 h-1 bg-current rounded-full" />
                                    <span>{s.bodyPart || "GEN"}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="rd-badge rd-badge-primary scale-90">{s.status}</div>
                              <Button asChild size="icon" className="h-10 w-10 rounded-xl bg-foreground text-background hover:scale-105 transition-all">
                                 <Link to="/app/studies/$studyId" params={{ studyId: s.id }}>
                                    <ArrowRight className="h-4 w-4" />
                                 </Link>
                              </Button>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>

            <div className="space-y-6">
               <h2 className="rd-display-h text-2xl">System Signal</h2>

               <div className="rd-card !p-5 space-y-6">
                  <div className="space-y-3">
                     {[
                        "Global Proxy-88 Node Ingested",
                        "Security Level 4 Authorization",
                        "New Specialist Record Cluster",
                        "Database Optimization Sync"
                     ].map((msg, i) => (
                        <div key={i} className="flex gap-4">
                           <div className="h-8 w-1.5 bg-primary/20 rounded-full group-hover:bg-primary" />
                           <div>
                              <div className="text-xs font-black uppercase tracking-tight">{msg}</div>
                              <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1 italic">{i + 1}m ago</div>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="pt-6 border-t border-white/5">
                     <div className="flex items-end justify-between mb-3">
                        <span className="rd-label !mb-0">Uptime Protocol</span>
                        <span className="text-2xl font-black italic">99.9%</span>
                     </div>
                     <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-[99.9%]" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
