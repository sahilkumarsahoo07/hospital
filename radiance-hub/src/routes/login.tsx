import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import logo from "@/assets/aspire-logo.png";

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

  const enableDevBypass = () => {
    setSession("dev-token", { 
      id: "dev-admin", 
      email: "admin@radiance.com", 
      fullName: "Dev Administrator", 
      roles: ["super_admin"] 
    });
    void navigate({ to: "/app" });
  };

  const login = () => {
      // Keycloak mock
      enableDevBypass();
  }

  // If already authenticated, redirect to app
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
      setError("Cannot connect to server. Make sure the backend is running on port 8000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--primary)_0%,_transparent_50%)] opacity-10" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--accent)_0%,_transparent_50%)] opacity-10" />
      
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="Aspire" width={48} height={48} className="h-12 w-12 transition-transform group-hover:scale-105" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your reporting workspace</p>
          </div>
        </div>

        <Card className="border-border/60 shadow-elevated">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@hospital.com" 
                    className="pl-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              {error && (
                <p className="text-sm text-destructive text-center mt-1">{error}</p>
              )}
            </CardContent>
          </form>
          <div className="px-6 pb-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button variant="outline" className="w-full rounded-full" onClick={() => login()}>
              Clinical Auth (Keycloak)
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Request access
          </Link>
        </p>

        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => enableDevBypass()}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dev Preview Bypass</span>
          </button>
        </div>
      </div>
    </div>
  );
}
