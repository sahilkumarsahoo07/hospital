import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building, Mail, User, ShieldCheck } from "lucide-react";
import logo from "@/assets/aspire-logo.png";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { setSession, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enableDevBypass = () => {
    setSession("dev-token", { 
      id: "dev-user", 
      email: "user@radiance.com", 
      fullName: "New Clinician", 
      roles: ["radiologist"] 
    });
    void navigate({ to: "/app" });
  };

  // If already authenticated, redirect to app
  if (isAuthenticated) {
    void navigate({ to: "/app" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock successful signup for now
    setTimeout(() => {
      enableDevBypass();
      void navigate({ to: "/app" });
    }, 1000);
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
            <h1 className="text-3xl font-display font-bold tracking-tight">Join Aspire</h1>
            <p className="text-muted-foreground">Request access to the clinical reporting hub</p>
          </div>
        </div>

        <Card className="border-border/60 shadow-elevated">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Request access</CardTitle>
            <CardDescription>Join our network of elite clinicians</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="first-name" placeholder="Sahil" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" placeholder="Sahoo" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="name@hospital.com" className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization / Hospital</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="organization" placeholder="Radiance Health" className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">Medical License ID (Optional)</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="license" placeholder="MC-123456" className="pl-10" />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting request..." : "Request Access"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col space-y-2 text-xs text-center text-muted-foreground border-t border-border/40 pt-6">
            <p>By requesting access, you agree to our Terms of Service and Privacy Policy.</p>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
