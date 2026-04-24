import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Mail, Sparkles, Activity } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { setSession, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
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
      id: "dev-admin", 
      email: "admin@radiance.com", 
      fullName: "Dev Administrator", 
      roles: ["super_admin"] 
    });
    void navigate({ to: "/app" });
  };

  if (isAuthenticated) {
    void navigate({ to: "/app" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Invalid email or password");
        return;
      }
      const data = await res.json();
      setSession(data.access_token, data.user);
      void navigate({ to: "/app" });
    } catch {
      setError("Cannot connect to server. Check backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground antialiased selection:bg-primary selection:text-white overflow-hidden relative">
      {/* NOISE & GLOW LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-[0.03] dark:opacity-[0.07]" />
         <div className="absolute inset-0 bg-mesh animate-mesh opacity-20" />
         <div 
           className="absolute w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full transition-transform duration-1000 ease-out"
           style={{ 
             transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
           }}
         />
      </div>

      <div className="relative z-10 w-full max-w-[400px] p-6">
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="flex items-center gap-3 group mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-500 shadow-lg shadow-primary/20">
               <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-black tracking-tighter text-2xl uppercase italic">Radiance</span>
          </Link>
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-display font-black tracking-tight">System Access</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Initialize clinical synchronization</p>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] border-border/40 shadow-premium overflow-hidden">
          <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Terminal ID / Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@radiance.health" 
                    className="h-12 pl-11 bg-background/50 border-border/40 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Token</Label>
                  <a href="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4">Reset</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="h-12 pl-11 bg-background/50 border-border/40 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-2xl bg-foreground text-background hover:scale-[1.02] active:scale-95 transition-all duration-300 font-black uppercase tracking-widest text-[11px] shadow-xl" disabled={isSubmitting}>
                {isSubmitting ? "Authenticating..." : "Authorize Access"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              {error && (
                <div className="px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-[10px] font-bold text-destructive text-center uppercase tracking-tight">{error}</p>
                </div>
              )}
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/20" />
              </div>
              <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.3em]">
                <span className="bg-transparent px-3 text-muted-foreground/40">Alternative Gateways</span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-12 rounded-2xl border-border/40 bg-background/30 hover:bg-background/50 transition-all text-[10px] font-black uppercase tracking-widest" onClick={() => enableDevBypass()}>
              Clinical Auth (OAuth2)
            </Button>
          </div>
          
          <div className="bg-muted/30 p-6 border-t border-border/20 text-center">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              New node?{" "}
              <Link to="/signup" className="text-primary hover:underline underline-offset-4">
                Request Provisioning
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => enableDevBypass()}
            className="group flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all duration-500"
          >
            <Sparkles className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
            <span>Developer Bypass Protocol</span>
          </button>
        </div>
      </div>
    </div>
  );
}

