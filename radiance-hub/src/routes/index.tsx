import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { cmsService } from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Layers, Workflow, Sparkles, Brain } from "lucide-react";
import logo from "@/assets/aspire-logo.png";
import heroBg from "@/assets/hero-bg.jpg";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const FALLBACK = {
  brand: { name: "Aspire Reporting Hub", tagline: "Reporting, refined." },
  hero: {
    headline: "Quality\nin every read.",
    subheadline: "A modern reporting hub built for clinicians who value clarity, speed, and craft.",
    ctaLabel: "Sign in",
    ctaHref: "/login",
  },
  nav: [
    { label: "Platform", href: "#platform" },
    { label: "Studio", href: "#studio" },
    { label: "Contact", href: "#contact" },
  ],
  contact: { email: "hello@aspirereporting.health", phone: "", address: "" },
  footer: {
    copyright: `© ${new Date().getFullYear()} Aspire Reporting Hub`,
    links: [],
  },
};
function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const { data } = useQuery({
    queryKey: ["cms", "landing"],
    queryFn: () => cmsService.getLanding().catch(() => null),
  });
  const cms = data ?? FALLBACK;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden selection:bg-primary selection:text-white transition-colors duration-700">
      {/* NOISE & GLOW LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-[0.03] dark:opacity-[0.07]" />
         <div className="absolute inset-0 bg-mesh animate-mesh opacity-30" />
         
         {/* MOUSE GLOW */}
         <div 
           className="absolute w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full transition-transform duration-1000 ease-out"
           style={{ 
             transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
           }}
         />
      </div>

      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-24 flex items-center justify-between border-b border-border/50 backdrop-blur-xl bg-background/30">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-500 shadow-lg shadow-primary/20">
               <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-black tracking-tighter text-2xl uppercase italic">Radiance</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {cms.nav.map((n) => (
              <a key={n.href} href={n.href} className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-all">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <ThemeToggle />
            {mounted && isAuthenticated ? (
              <Button asChild className="h-14 rounded-2xl px-10 bg-foreground text-background hover:scale-105 active:scale-95 transition-all duration-500 shadow-2xl">
                <Link to="/app" className="flex items-center gap-2">
                   Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="h-14 rounded-2xl px-10 bg-primary hover:bg-accent text-primary-foreground hover:scale-105 active:scale-95 transition-all duration-500 shadow-xl shadow-primary/20">
                <Link to="/signup">Start Free</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-64 pb-32 mx-auto max-w-7xl px-6">
          <div className="relative">
             <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent/20 blur-[100px] animate-pulse" />
             
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-black uppercase tracking-widest text-primary mb-12 animate-in fade-in slide-in-from-top-4">
                <Sparkles className="h-3.5 w-3.5" />
                <span>v4.0 Protocol Active</span>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-12">
                   <h1 className="font-display text-7xl md:text-8xl xl:text-[9rem] font-black leading-[0.8] tracking-tight">
                      <span className="block text-foreground animate-in fade-in slide-in-from-left-8 duration-700">Clinical.</span>
                      <span className="block text-primary animate-in fade-in slide-in-from-left-12 duration-700 delay-100">Speed.</span>
                      <span className="block bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent animate-gradient-x animate-in fade-in slide-in-from-left-16 duration-700 delay-200">Reimagined.</span>
                   </h1>
                   
                   <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl font-medium animate-in fade-in slide-in-from-left-20 duration-700 delay-300">
                      The world's fastest teleradiology engine. Sync global diagnostic nodes in under 200ms. High-fidelity imaging, zero-latency reporting.
                   </p>

                   <div className="flex flex-col sm:flex-row items-center gap-6 pt-8 animate-in fade-in slide-in-from-left-24 duration-700 delay-400">
                      <Button size="lg" asChild className="h-20 rounded-3xl px-14 text-xl font-black bg-foreground text-background hover:scale-105 transition-all shadow-2xl">
                         <Link to="/signup">Deploy Now</Link>
                      </Button>
                      <div className="flex -space-x-4">
                         {[1,2,3,4].map(i => (
                            <div key={i} className="h-12 w-12 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden">
                               <div className={`h-full w-full bg-gradient-to-br from-primary/${i*20} to-accent/${i*20}`} />
                            </div>
                         ))}
                         <div className="h-12 px-4 rounded-full border-4 border-background bg-muted flex items-center justify-center text-[10px] font-black uppercase">
                            500+ Nodes
                         </div>
                      </div>
                   </div>
                </div>

                <div className="relative group animate-in zoom-in-90 fade-in duration-1000 delay-500">
                   {/* Abstract Floating Shapes */}
                   <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-[3rem] animate-float rotate-12" />
                   <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-accent/20 rounded-full animate-glow" />
                   
                   <div className="relative glass rounded-[4rem] p-4 border-border/50 shadow-premium group-hover:scale-[1.02] transition-transform duration-700">
                      <div className="aspect-square rounded-[3rem] bg-background/50 overflow-hidden relative border border-border/50">
                         <div className="absolute inset-0 bg-mesh opacity-20 animate-mesh" />
                         
                         {/* Live Logic Representation */}
                         <div className="absolute inset-0 flex flex-col p-12">
                            <div className="flex items-center justify-between mb-20">
                               <div className="h-3 w-32 bg-primary/20 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary w-[60%] animate-pulse" />
                               </div>
                               <div className="h-8 w-8 rounded-full border-2 border-primary animate-ping" />
                            </div>
                            
                            <div className="space-y-4">
                               {[1,2,3].map(i => (
                                  <div key={i} className="h-16 w-full glass rounded-2xl border-border/50 p-4 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-500" style={{ delay: `${i * 100}ms` }}>
                                     <div className="flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-lg bg-accent/10" />
                                        <div className="h-2 w-24 bg-muted rounded-full" />
                                     </div>
                                     <div className="h-4 w-4 rounded-full bg-primary/20" />
                                  </div>
                               ))}
                            </div>

                            <div className="mt-auto flex items-end justify-between">
                               <div className="text-6xl font-black text-foreground italic">99.9<span className="text-primary">%</span></div>
                               <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Uptime</div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* METRICS STRIP */}
        <section className="py-20 bg-foreground text-background overflow-hidden relative">
           <div className="absolute inset-0 bg-noise opacity-20" />
           <div className="flex whitespace-nowrap animate-marquee">
              {Array.from({ length: 10 }).map((_, i) => (
                 <div key={i} className="flex items-center gap-12 px-6">
                    <span className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Radiance Protocol v4.0</span>
                    <Activity className="h-10 w-10 text-primary" />
                    <span className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter opacity-30">Zero Latency Sync</span>
                    <Sparkles className="h-10 w-10 text-accent" />
                 </div>
              ))}
           </div>
        </section>

        {/* FEATURE BENTO */}
        <section id="platform" className="py-64">
           <div className="mx-auto max-w-7xl px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-32">
                 <div className="max-w-2xl">
                    <div className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6">The Infrastructure</div>
                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none italic">
                       Built for <br/>
                       <span className="text-muted-foreground/30">Extreme</span> Ops.
                    </h2>
                 </div>
                 <p className="text-xl text-muted-foreground max-w-md font-medium">
                    Scaling clinical workflows across multiple continents without dropping a single packet.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {/* Feature 1 */}
                 <div className="md:col-span-2 group relative overflow-hidden glass rounded-[4rem] p-16 border-border/50 hover:border-primary/50 transition-all duration-700">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-all" />
                    <div className="relative z-10">
                       <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-12">
                          <Layers className="h-8 w-8 text-primary" />
                       </div>
                       <h3 className="text-5xl font-black tracking-tighter italic mb-8">Hyper-Grid Storage</h3>
                       <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                          Distributed DICOM nodes that sync imagery in parallel, delivering case loads 4x faster than traditional PACS.
                       </p>
                    </div>
                 </div>

                 {/* Feature 2 */}
                 <div className="group relative overflow-hidden bg-primary rounded-[4rem] p-16 text-primary-foreground hover:scale-[1.02] transition-all duration-700 shadow-2xl">
                    <div className="absolute inset-0 bg-noise opacity-10" />
                    <div className="relative z-10 flex flex-col h-full">
                       <Workflow className="h-12 w-12 mb-auto opacity-50" />
                       <h3 className="text-4xl font-black tracking-tighter italic mb-6">Live <br/>Orchestration</h3>
                       <p className="text-lg opacity-80 font-medium">
                          Real-time AI-assisted routing for critical emergency cases.
                       </p>
                    </div>
                 </div>

                 {/* Feature 3 */}
                 <div className="group relative overflow-hidden glass rounded-[4rem] p-12 border-border/50 hover:border-accent/50 transition-all duration-700">
                    <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mb-8">
                       <Brain className="h-7 w-7 text-accent" />
                    </div>
                    <h3 className="text-3xl font-black tracking-tighter italic mb-4">Neural Signal</h3>
                    <p className="text-muted-foreground font-medium">
                       Smart alerts for turnaround time bottlenecks.
                    </p>
                 </div>

                 {/* Feature 4 */}
                 <div className="md:col-span-2 group relative overflow-hidden glass rounded-[4rem] p-12 border-border/50 flex items-center justify-between gap-12 hover:border-primary/30 transition-all duration-700">
                    <div className="max-w-md">
                       <h3 className="text-4xl font-black tracking-tighter italic mb-4">Global Security</h3>
                       <p className="text-lg text-muted-foreground font-medium">
                          End-to-end encryption with military-grade diagnostic audit trails.
                       </p>
                    </div>
                    <div className="h-32 w-32 rounded-full border-8 border-primary/20 border-t-primary animate-spin" />
                 </div>
              </div>
           </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-64 relative overflow-hidden">
           <div className="absolute inset-0 bg-primary -z-10">
              <div className="absolute inset-0 bg-noise opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
           </div>

           <div className="mx-auto max-w-5xl px-6 text-center">
              <h2 className="text-7xl md:text-[10rem] font-black tracking-tighter italic text-white mb-16 leading-[0.8]">
                 READY <br/>
                 FOR THE <br/>
                 <span className="bg-gradient-to-r from-white via-white/50 to-white bg-clip-text text-transparent">FUTURE?</span>
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
                 <Button size="lg" className="h-24 rounded-[3rem] px-20 text-3xl font-black bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-2xl">
                    <Link to="/signup">Deploy Now</Link>
                 </Button>
                 <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50 mb-1">Status</div>
                    <div className="flex items-center gap-2">
                       <div className="h-3 w-3 rounded-full bg-accent animate-ping" />
                       <span className="text-white font-black italic">Network Optimal</span>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* FOOTER */}
        <footer className="py-24 border-t border-border/50 bg-background relative overflow-hidden">
           <div className="absolute inset-0 bg-noise opacity-[0.03]" />
           <div className="mx-auto max-w-7xl px-6">
              <div className="flex flex-col md:flex-row items-start justify-between gap-20">
                 <div className="space-y-8 max-w-sm">
                    <Link to="/" className="flex items-center gap-4 group">
                       <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center italic font-black text-white">R</div>
                       <span className="font-display font-black tracking-tighter text-2xl uppercase italic">Radiance</span>
                    </Link>
                    <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                       Building the core infrastructure for the next generation of clinical intelligence.
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-20">
                    <div className="space-y-6">
                       <div className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground">Protocol</div>
                       <nav className="flex flex-col gap-4 text-sm font-bold text-muted-foreground">
                          <a href="#" className="hover:text-primary transition-colors">Core</a>
                          <a href="#" className="hover:text-primary transition-colors">Nodes</a>
                          <a href="#" className="hover:text-primary transition-colors">Security</a>
                       </nav>
                    </div>
                    <div className="space-y-6">
                       <div className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground">Network</div>
                       <nav className="flex flex-col gap-4 text-sm font-bold text-muted-foreground">
                          <a href="#" className="hover:text-primary transition-colors">Status</a>
                          <a href="#" className="hover:text-primary transition-colors">Edge</a>
                          <a href="#" className="hover:text-primary transition-colors">Global</a>
                       </nav>
                    </div>
                 </div>
              </div>
              
              <div className="mt-32 pt-16 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-10">
                 <div className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">© 2024 RADIANCE LABS</div>
                 <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/50">
                    <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                    <a href="#" className="hover:text-primary transition-colors">Security</a>
                    <a href="#" className="hover:text-primary transition-colors">Terms</a>
                 </div>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}

