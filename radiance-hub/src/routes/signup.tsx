import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building, Mail, User, ShieldCheck, Activity } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { setSession, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const enableDevBypass = () => {
    setSession("dev-token", { 
      id: "dev-user", 
      email: "user@radiance.com", 
      fullName: "New Clinician", 
      roles: ["radiologist"] 
    });
    void navigate({ to: "/app" });
  };

  if (isAuthenticated) {
    void navigate({ to: "/app" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      enableDevBypass();
      void navigate({ to: "/app" });
    }, 1000);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground antialiased selection:bg-primary selection:text-white overflow-hidden relative py-20">
      {/* NOISE & GLOW LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-[0.03] dark:opacity-[0.07]" />
         <div className="absolute inset-0 bg-mesh animate-mesh opacity-20" />
         <div 
           className="absolute w-[600px] h-[600px] bg-accent/10 blur-[120px] rounded-full transition-transform duration-1000 ease-out"
           style={{ 
             transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
           }}
         />
      </div>

      <div className="relative z-10 w-full max-w-[480px] p-6">
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="flex items-center gap-3 group mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-500 shadow-lg shadow-primary/20">
               <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-black tracking-tighter text-2xl uppercase italic">Radiance</span>
          </Link>
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-display font-black tracking-tight">Node Provisioning</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Register new clinical diagnostic node</p>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] border-border/40 shadow-premium overflow-hidden">
          <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Given Name</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input id="first-name" placeholder="Sahil" className="h-11 pl-11 bg-background/50 border-border/40 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Surname</Label>
                  <Input id="last-name" placeholder="Sahoo" className="h-11 bg-background/50 border-border/40 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Clinical Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input id="email" type="email" placeholder="name@hospital.com" className="h-11 pl-11 bg-background/50 border-border/40 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Organization / Entity</Label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input id="organization" placeholder="Radiance Health" className="h-11 pl-11 bg-background/50 border-border/40 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Medical License Identifier</Label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input id="license" placeholder="MC-123456" className="h-11 pl-11 bg-background/50 border-border/40 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all" />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-2xl bg-foreground text-background hover:scale-[1.02] active:scale-95 transition-all duration-300 font-black uppercase tracking-widest text-[11px] shadow-xl" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Submit Access Request"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </div>
          
          <div className="bg-muted/30 p-6 border-t border-border/20 text-center">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Existing node?{" "}
              <Link to="/login" className="text-primary hover:underline underline-offset-4">
                Initialize Login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center px-10">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-relaxed">
            By submitting, you agree to the Radiance Protocol Data Governance and Security Standards.
          </p>
        </div>
      </div>
    </div>
  );
}

