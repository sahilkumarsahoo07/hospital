import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES } from "@/lib/roles";
import { SystemAnalyticsView } from "@/components/analytics/SystemAnalyticsView";
import { RadiologistsAnalyticsView } from "@/components/analytics/RadiologistsAnalyticsView";
import { HospitalsAnalyticsView } from "@/components/analytics/HospitalsAnalyticsView";
import { BillingAnalyticsView } from "@/components/analytics/BillingAnalyticsView";
import { Activity, BarChart3, TrendingUp, Layers, PieChart, Database, Sparkles, Network, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/analytics")({ component: AnalyticsPage });

type TabKey = "system" | "radiologists" | "hospitals" | "billing";

function AnalyticsPage() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isSuperAdmin = roles.includes(ROLES.SUPER_ADMIN);
  const isSubAdmin = roles.includes(ROLES.SUB_ADMIN);
  const isRad = roles.includes(ROLES.RADIOLOGIST);
  const isClient = roles.includes(ROLES.HOSPITAL) || roles.includes(ROLES.DIAGNOSTIC_CENTRE);

  const tabs: Array<{ key: TabKey; label: string; icon: any; show: boolean }> = ([
    { key: "system" as TabKey, label: "Network Health", icon: Database, show: isSuperAdmin || isSubAdmin },
    { key: "radiologists" as TabKey, label: "Specialist Performance", icon: TrendingUp, show: isSuperAdmin || isSubAdmin || isRad },
    { key: "hospitals" as TabKey, label: isClient ? "Facility Logs" : "Institutional Nodes", icon: Layers, show: isSuperAdmin || isSubAdmin || isClient },
    { key: "billing" as TabKey, label: "Revenue Flux", icon: PieChart, show: isSuperAdmin },
  ]).filter((t) => t.show);

  const [active, setActive] = useState<TabKey>(tabs[0]?.key ?? "radiologists");

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="rd-card max-w-lg text-center">
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-8 animate-pulse" />
          <h2 className="rd-display-h text-4xl mb-6">Stream Shielded.</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">
             Telemetry Data is Restricted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000">
      
      {/* HEADER SECTION */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="space-y-4">
           <span className="rd-label">Global Intelligence</span>
           <h1 className="rd-display-h text-4xl md:text-5xl leading-[0.9] tracking-tighter">
              Analytical <br/>
              <span className="text-primary">Signals.</span>
           </h1>
        </div>

        <div className="flex flex-wrap gap-4 bg-white/5 p-3 rounded-[3rem] border border-white/5 backdrop-blur-xl">
           {tabs.map((t) => (
             <button
               key={t.key}
               onClick={() => setActive(t.key)}
               className={cn(
                 "flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all",
                 active === t.key ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:bg-white/5"
               )}
             >
               <t.icon className="h-4 w-4" />
               {t.label}
             </button>
           ))}
        </div>
      </section>

      {/* INTELLIGENCE VIEWPORT */}
      <div className="rd-card !p-16 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
         
         <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <header className="mb-16 flex items-center justify-between border-b border-white/5 pb-10">
               <div className="flex items-center gap-6">
                  <div className="h-14 w-14 glass rounded-2xl flex items-center justify-center">
                     <Network className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black italic tracking-tighter uppercase">Live Telemetry Feed</h3>
                     <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em] opacity-40">
                        <Activity className="h-3 w-3" />
                        Partition Alpha-9
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="text-right">
                     <div className="text-[10px] font-black uppercase tracking-widest">Network Load</div>
                     <div className="text-lg font-black italic text-primary">OPTIMAL</div>
                  </div>
                  <div className="h-10 w-1 bg-primary/20 rounded-full">
                     <div className="h-[40%] bg-primary w-full animate-pulse" />
                  </div>
               </div>
            </header>

            <div className="space-y-20">
               {active === "system" && <SystemAnalyticsView />}
               {active === "radiologists" && <RadiologistsAnalyticsView />}
               {active === "hospitals" && <HospitalsAnalyticsView />}
               {active === "billing" && <BillingAnalyticsView />}
            </div>
         </div>

         {/* Backdrop Watermark */}
         <div className="absolute bottom-10 left-10 rd-display-h text-[10rem] opacity-[0.02] pointer-events-none select-none">
            DATA
         </div>
      </div>
    </div>
  );
}
