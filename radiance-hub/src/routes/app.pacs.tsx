import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES } from "@/lib/roles";
import { Cpu, Zap, Activity, Globe, RefreshCw, Layers, ShieldAlert, Terminal, Radio } from "lucide-react";

export const Route = createFileRoute("/app/pacs")({ component: PacsLayout });

function PacsLayout() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const canEdit = roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.PACS);
  const canMonitor = canEdit || roles.includes(ROLES.SUB_ADMIN);
  const path = useLocation({ select: (l) => l.pathname });

  if (!canMonitor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        <div className="glass rounded-[2.5rem] p-12 text-center max-w-lg border-border/40">
           <ShieldAlert className="h-10 w-10 text-muted-foreground/20 mx-auto mb-6" />
           <h1 className="text-xl font-display font-black tracking-tight text-foreground uppercase">Access Restricted</h1>
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-4 leading-relaxed">
             Imaging protocol integration is restricted to PACS administrators and root nodes.
           </p>
        </div>
      </div>
    );
  }

  const tabs: Array<{ to: string; label: string; icon: any; show: boolean }> = [
    { to: "/app/pacs", label: "Health Protocol", icon: Activity, show: true },
    { to: "/app/pacs/endpoints", label: "DICOM Endpoints", icon: Radio, show: canEdit },
    { to: "/app/pacs/ingestion", label: "Ingestion Stream", icon: Layers, show: true },
    { to: "/app/pacs/logs", label: "Sync Diagnostics", icon: Terminal, show: true },
  ];

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
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">DICOM Backbone</span>
                     <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Interface Active</span>
                     </div>
                  </div>
               </div>
               <h1 className="text-5xl font-display font-black tracking-tighter text-foreground leading-[0.9]">
                  PACS <span className="text-primary/40 block mt-2 text-3xl">Imaging Protocol Core</span>
               </h1>
            </div>
            
            <div className="flex flex-col items-start lg:items-end gap-2 max-w-sm">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-relaxed lg:text-right">
                  Monitoring live ingestion pipelines and endpoint state. Server-side PHI anonymization active at edge nodes.
               </p>
            </div>
          </header>

          <div className="flex items-center gap-2 p-1.5 glass rounded-2xl border-border/40 w-fit overflow-x-auto no-scrollbar">
            {tabs.filter((t) => t.show).map((t) => {
              const active = path === t.to;
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                    active 
                      ? "bg-foreground text-background shadow-xl scale-[1.02]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
                  {t.label}
                </Link>
              );
            })}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

