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
    <div className="flex-1 p-8 space-y-10">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
           <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Online: Cloud-01</span>
           </div>
           <h1 className="text-5xl font-display font-black tracking-tight text-foreground">Welcome back, {userName.split(' ')[0]}</h1>
           <p className="text-muted-foreground max-w-lg text-sm font-medium">
             Your workspace is synchronized. There are <span className="text-foreground font-bold">{stats?.studies?.pending || 0} studies</span> awaiting review.
           </p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-2xl px-5 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all">
              <Activity className="h-4 w-4 mr-2 text-primary" /> Health
           </Button>
           <Button className="rounded-2xl px-6 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95" asChild>
              <Link to="/app/studies">Launch Worklist <ChevronRight className="h-4 w-4 ml-1" /></Link>
           </Button>
        </div>
      </header>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Pending QC (Large Bento Tile) */}
        <div className="lg:col-span-2 glass rounded-[2.5rem] p-8 border-primary/10 relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
           <div className="absolute top-0 right-0 p-8">
              <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                 <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
           </div>
           <div className="relative z-10 space-y-4">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Verification Queue</span>
              <div className="text-7xl font-display font-black tracking-tighter text-foreground">
                 {analyticsQ.isLoading ? "—" : stats?.studies?.verification_pending ?? 0}
              </div>
              <p className="text-sm font-semibold text-muted-foreground max-w-[200px] leading-relaxed">
                 High-priority cases requiring senior clinical verification.
              </p>
              <div className="flex items-center gap-2 pt-2">
                 <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none">
                    <TrendingUp className="h-3 w-3 mr-1" /> +12% from yesterday
                 </Badge>
              </div>
           </div>
           {/* Decorative elements */}
           <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />
        </div>

        {/* KPI: Active Reporting */}
        <div className="glass rounded-[2.5rem] p-8 border-amber-500/10 group hover:border-amber-500/30 transition-all duration-500">
           <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
              <Clock className="h-6 w-6 text-amber-600" />
           </div>
           <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">In Reporting</span>
           <div className="text-5xl font-display font-black tracking-tighter text-foreground mt-2">
              {analyticsQ.isLoading ? "—" : stats?.studies?.in_reporting ?? 0}
           </div>
           <p className="text-xs font-bold text-amber-600/60 mt-4 uppercase tracking-tighter">Drafts in progress</p>
        </div>

        {/* KPI: Critical Flags */}
        <div className="glass rounded-[2.5rem] p-8 border-rose-500/10 group hover:border-rose-500/30 transition-all duration-500">
           <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <AlertCircle className="h-6 w-6 text-rose-600 animate-pulse" />
           </div>
           <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Critical</span>
           <div className="text-5xl font-display font-black tracking-tighter text-foreground mt-2 text-rose-600">
              {analyticsQ.isLoading ? "—" : stats?.studies?.urgent ?? 0}
           </div>
           <p className="text-xs font-bold text-rose-600/60 mt-4 uppercase tracking-tighter">Immediate action required</p>
        </div>

        {/* Worklist Stream (Wide Bento Tile) */}
        <section className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground flex items-center gap-2">
                 <Activity className="h-4 w-4 text-primary" /> Active Stream
              </h3>
              <Link to="/app/studies" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4">Full Worklist →</Link>
           </div>
           
           <div className="glass rounded-[2.5rem] border-border/40 overflow-hidden shadow-premium">
              {studiesQ.isLoading ? (
                 <div className="p-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Synchronizing Cases...</span>
                 </div>
              ) : (
                 <div className="divide-y divide-border/10">
                    {studiesQ.data?.items.map((s) => (
                       <div key={s.id} className="p-6 flex items-center justify-between hover:bg-primary/[0.03] transition-all duration-300 group">
                          <div className="flex items-center gap-5">
                             <div className="h-12 w-12 rounded-2xl bg-background/50 border border-border/50 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                                <span className="text-[10px] font-black text-muted-foreground group-hover:text-primary">{s.modality}</span>
                             </div>
                             <div className="flex flex-col gap-0.5">
                                <span className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{s.patientName}</span>
                                <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                   <span className="bg-muted/50 px-1.5 py-0.5 rounded-md">ID: {s.patientId}</span>
                                   <span>•</span>
                                   <span className="text-foreground/40">{s.bodyPart || 'General'}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <div className="hidden sm:flex flex-col items-end">
                                <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/40">Case Status</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">{s.status.replace(/_/g, ' ')}</span>
                             </div>
                             <Button asChild variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors">
                                <Link to="/app/studies/$studyId" params={{ studyId: s.id }}><ChevronRight className="h-5 w-5" /></Link>
                             </Button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </section>

        {/* Side Metrics (Bento Column) */}
        <aside className="space-y-6">
           <div className="glass rounded-[2.5rem] bg-primary p-8 text-primary-foreground shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Enterprise Quota</span>
                    <Activity className="h-4 w-4 opacity-50" />
                 </div>
                 <div className="space-y-1">
                    <div className="text-4xl font-black tracking-tighter">{stats?.studies?.total ?? 0} <span className="text-lg opacity-40">/ 5k</span></div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-2">
                       <div className="h-full bg-white w-[12%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>
                 </div>
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                    Volume across all centers
                 </p>
              </div>
           </div>

           <div className="glass rounded-[2.5rem] p-8 border-border/40 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Security Log</h3>
              <div className="space-y-4">
                 {[
                    { msg: "Verified by Senior Dr. Miller", time: "2m ago", type: "success" },
                    { msg: "Locked study #CT-8822", time: "14m ago", type: "info" },
                    { msg: "Guest share generated", time: "1h ago", type: "info" },
                 ].map((l, i) => (
                    <div key={i} className="flex gap-4 group">
                       <div className={`h-1.5 w-1.5 rounded-full mt-2 flex-shrink-0 ${l.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary/40'}`} />
                       <div className="flex flex-col">
                          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">{l.msg}</span>
                          <span className="text-[9px] font-black uppercase text-muted-foreground/30 tracking-tighter mt-0.5">{l.time}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </aside>

      </div>
    </div>
  );
}
