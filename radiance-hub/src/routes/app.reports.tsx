import { createFileRoute } from "@tanstack/react-router";
import { FileText, Cpu, Zap, Activity } from "lucide-react";

export const Route = createFileRoute("/app/reports")({ component: () => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
    <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
    
    <div className="glass rounded-[3rem] p-24 text-center max-w-2xl border-border/40 relative z-10 animate-in fade-in zoom-in duration-1000">
       <div className="h-20 w-20 rounded-[2.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-10 group hover:scale-110 transition-transform duration-500">
          <FileText className="h-10 w-10 text-primary" />
       </div>
       
       <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
             <div className="h-px w-12 bg-primary/20" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Intelligence Node 04</span>
             <div className="h-px w-12 bg-primary/20" />
          </div>
          
          <h1 className="text-5xl font-display font-black tracking-tighter text-foreground leading-tight uppercase">
             Clinical Reports <span className="text-primary/40 block">Archive Protocol</span>
          </h1>
          
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 max-w-md mx-auto leading-relaxed italic">
             Versioned reports, signature-bound, audit-logged. Implementation of the secure reporting slice is currently in progress.
          </p>
       </div>

       <div className="mt-12 flex items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
             <div className="h-1 w-12 bg-muted/20 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-primary animate-pulse" />
             </div>
             <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">Development Logic</span>
          </div>
          <div className="h-8 w-px bg-border/20" />
          <div className="flex flex-col items-center gap-2">
             <Activity className="h-4 w-4 text-muted-foreground/20 animate-pulse" />
             <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">Awaiting Signal</span>
          </div>
       </div>
    </div>
  </div>
)});
