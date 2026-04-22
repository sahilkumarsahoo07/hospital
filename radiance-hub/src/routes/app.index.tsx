import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/authStore";
import { analyticsService, studiesService } from "@/lib/services";
import { 
  FileImage, 
  Users, 
  Clock, 
  ChevronRight, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/app/")({
  component: Overview,
});

function Overview() {
  const { user } = useAuthStore();
  const userName = user?.fullName || "Clinician";

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
    <div className="flex-1 flex flex-col min-h-0 bg-background/30 p-8 space-y-8">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center">
                 <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Gateway Active: Cloud-01</span>
           </div>
           <h1 className="text-4xl font-display font-black tracking-tight tracking-tighter">Hi, {userName}</h1>
           <p className="text-muted-foreground mt-2 max-w-lg text-sm leading-relaxed">
             The Radiance Intelligence Hub is synchronized. You have {stats?.studies?.pending || 0} studies awaiting your attention today.
           </p>
        </div>
        <div className="flex gap-2">
           <Button size="sm" variant="outline" className="rounded-full px-5 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10">
              <Activity className="h-4 w-4 mr-2" /> System Health
           </Button>
           <Button size="sm" className="rounded-full px-6 shadow-lg shadow-primary/20" asChild>
              <Link to="/app/studies">Open Worklist <ChevronRight className="h-4 w-4 ml-1" /></Link>
           </Button>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending QC", value: stats?.studies?.verification_pending ?? 0, icon: ShieldCheck, color: "text-blue-600 bg-blue-100/50", detail: "Awaiting senior review" },
          { label: "Active Reporting", value: stats?.studies?.in_reporting ?? 0, icon: Clock, color: "text-amber-600 bg-amber-100/50", detail: "Drafts in progress" },
          { label: "New Ingests", value: stats?.studies?.new ?? 0, icon: FileImage, color: "text-emerald-600 bg-emerald-100/50", detail: "Last 24 hours" },
          { label: "Critical Flags", value: stats?.studies?.urgent ?? 0, icon: AlertCircle, color: "text-rose-600 bg-rose-100/50", detail: "Stat/Emergency priority" },
        ].map((c) => (
          <Card key={c.label} className="border-none shadow-elevated bg-card/40 backdrop-blur-md hover:translate-y-[-4px] transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{c.label}</CardTitle>
               <div className={`p-2 rounded-xl border border-white/20 ${c.color}`}>
                  <c.icon className="h-4 w-4" />
               </div>
            </CardHeader>
            <CardContent>
               <div className="text-4xl font-display font-black tracking-tighter">{analyticsQ.isLoading ? "—" : c.value}</div>
               <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 flex items-center gap-1 uppercase tracking-wider">
                  <TrendingUp className="h-3 w-3" /> {c.detail}
               </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid: Recent Activity & System Logs */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
         <section className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Active Worklist Stream
               </h3>
               <Link to="/app/studies" className="text-[10px] font-black uppercase tracking-tighter hover:underline">View All cases →</Link>
            </div>
            
            <div className="bg-card/30 rounded-3xl border border-border/40 overflow-hidden shadow-sm backdrop-blur-sm">
               {studiesQ.isLoading ? (
                  <div className="p-20 flex flex-col items-center justify-center gap-3">
                     <Loader2 className="h-8 w-8 text-primary/40 animate-spin" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Fetching Cases</span>
                  </div>
               ) : (
                  <div className="divide-y divide-border/30">
                     {studiesQ.data?.items.map((s) => (
                        <div key={s.id} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                 <span className="text-xs font-black text-muted-foreground group-hover:text-primary">{s.modality}</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold">{s.patientName}</span>
                                 <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    <span>#{s.patientId}</span>
                                    <span>•</span>
                                    <span>{s.bodyPart || 'General'}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="flex flex-col items-end">
                                 <span className="text-[10px] font-black uppercase text-muted-foreground/40">Status</span>
                                 <span className="text-[10px] font-black uppercase tracking-tighter text-primary">{s.status.replace(/_/g, ' ')}</span>
                              </div>
                              <Button asChild variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                                 <Link to="/app/studies/$studyId" params={{ studyId: s.id }}><ChevronRight className="h-4 w-4" /></Link>
                              </Button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </section>

         <aside className="space-y-6">
            <Card className="border-none bg-primary text-primary-foreground shadow-2xl overflow-hidden relative">
               <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
               <CardHeader>
                  <CardTitle className="text-sm uppercase font-black tracking-widest opacity-80">Enterprise Quota</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="text-3xl font-black">{stats?.studies?.total ?? 0} / 5,000</div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                     <div className="h-full bg-white w-[12%] rounded-full shadow-sm" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                     Usage across all diagnostic centers
                  </p>
               </CardContent>
            </Card>

            <section className="space-y-4">
               <h3 className="text-sm font-black uppercase tracking-widest">Security Log</h3>
               <div className="space-y-3">
                  {[
                     { msg: "Successful verify as Senior Verifier", time: "2m ago" },
                     { msg: "Locked study #CT-8822 for reporting", time: "14m ago" },
                     { msg: "Generated guest share link for referral", time: "1h ago" },
                  ].map((l, i) => (
                     <div key={i} className="flex gap-3 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 flex-shrink-0" />
                        <div className="flex flex-col">
                           <span className="font-medium text-muted-foreground/80 leading-relaxed">{l.msg}</span>
                           <span className="text-[9px] font-black uppercase text-muted-foreground/40">{l.time}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         </aside>
      </div>
    </div>
  );
}
