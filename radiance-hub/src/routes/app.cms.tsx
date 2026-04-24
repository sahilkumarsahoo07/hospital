import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cmsService } from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES } from "@/lib/roles";
import type { LandingCms } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Cpu, Zap, Activity, Globe, ShieldAlert, Terminal } from "lucide-react";

export const Route = createFileRoute("/app/cms")({
  component: CmsEditor,
});

function CmsEditor() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const allowed = roles.includes(ROLES.SUPER_ADMIN);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["cms", "landing"],
    queryFn: () => cmsService.getLanding(),
    enabled: allowed,
  });
  const [draft, setDraft] = useState<LandingCms | null>(null);

  useEffect(() => { if (data) setDraft(data); }, [data]);

  const save = useMutation({
    mutationFn: (d: LandingCms) => cmsService.saveLanding(d),
    onSuccess: () => { 
      toast.success("Protocol Delta Synchronized — Production environment updated"); 
      qc.invalidateQueries({ queryKey: ["cms"] }); 
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!allowed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        <div className="glass rounded-[2.5rem] p-12 text-center max-w-lg border-border/40">
           <ShieldAlert className="h-10 w-10 text-muted-foreground/20 mx-auto mb-6" />
           <h1 className="text-xl font-display font-black tracking-tight text-foreground uppercase">Access Violation</h1>
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-4 leading-relaxed">
             Direct content modification is restricted to root super-administrators. Protocol modification unauthorized.
           </p>
           <Link to="/app" className="mt-8 inline-block text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-0.5 hover:text-foreground transition-all">
              Return to Control Center
           </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 animate-pulse">Initializing CMS Registry...</span>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        <div className="glass rounded-[2.5rem] p-12 text-center max-w-lg border-destructive/20 bg-destructive/5">
           <ShieldAlert className="h-10 w-10 text-destructive/40 mx-auto mb-6" />
           <h1 className="text-xl font-display font-black tracking-tight text-destructive uppercase">Registry Fault</h1>
           <p className="text-[10px] font-black uppercase tracking-widest text-destructive/60 mt-4 leading-relaxed">
             Failed to synchronize with content registry. Verify <code>GET/PUT /cms/landing</code> endpoint availability.
           </p>
           {error && <p className="text-[9px] font-mono mt-4 text-destructive/40">{(error as Error).message}</p>}
        </div>
      </div>
    );
  }

  const update = (patch: Partial<LandingCms>) => setDraft({ ...draft, ...patch });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      
      <main className="flex-1 overflow-auto p-8 relative z-10">
        <div className="max-w-[1200px] mx-auto space-y-10">
          
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                     <Terminal className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Content Control Node</span>
                     <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Protocol Version {draft.version} Active</span>
                     </div>
                  </div>
               </div>
               <h1 className="text-5xl font-display font-black tracking-tighter text-foreground leading-[0.9]">
                  Landing CMS <span className="text-primary/40 block mt-2 text-3xl">Production Content Override</span>
               </h1>
            </div>
            
            <div className="flex items-center gap-4">
               <Button 
                 onClick={() => save.mutate(draft)} 
                 disabled={save.isPending}
                 className="h-14 px-8 rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl shadow-primary/10"
               >
                 {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Save className="h-4 w-4 mr-3" />}
                 Synchronize Changes
               </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Section title="Brand Protocol">
               <Field label="System Identifier">
                 <Input 
                   value={draft.brand.name} 
                   onChange={(e) => update({ brand: { ...draft.brand, name: e.target.value } })} 
                   className="h-11 rounded-xl bg-background/50 border-border/40 font-bold"
                 />
               </Field>
               <Field label="Global Tagline">
                 <Input 
                   value={draft.brand.tagline} 
                   onChange={(e) => update({ brand: { ...draft.brand, tagline: e.target.value } })} 
                   className="h-11 rounded-xl bg-background/50 border-border/40 font-bold"
                 />
               </Field>
             </Section>

             <Section title="Hero Module">
               <Field label="Primary Headline">
                 <Input 
                   value={draft.hero.headline} 
                   onChange={(e) => update({ hero: { ...draft.hero, headline: e.target.value } })} 
                   className="h-11 rounded-xl bg-background/50 border-border/40 font-bold"
                 />
               </Field>
               <Field label="Explanatory Subheadline">
                 <Textarea 
                   rows={3} 
                   value={draft.hero.subheadline} 
                   onChange={(e) => update({ hero: { ...draft.hero, subheadline: e.target.value } })} 
                   className="rounded-xl bg-background/50 border-border/40 font-bold resize-none"
                 />
               </Field>
               <div className="grid grid-cols-2 gap-4">
                 <Field label="CTA Trigger Label">
                   <Input 
                     value={draft.hero.ctaLabel} 
                     onChange={(e) => update({ hero: { ...draft.hero, ctaLabel: e.target.value } })} 
                     className="h-11 rounded-xl bg-background/50 border-border/40 font-bold"
                   />
                 </Field>
                 <Field label="CTA Destination Href">
                   <Input 
                     value={draft.hero.ctaHref} 
                     onChange={(e) => update({ hero: { ...draft.hero, ctaHref: e.target.value } })} 
                     className="h-11 rounded-xl bg-background/50 border-border/40 font-bold"
                   />
                 </Field>
               </div>
             </Section>

             <Section title="Communication Node">
               <Field label="Institutional Email">
                 <Input 
                   value={draft.contact.email} 
                   onChange={(e) => update({ contact: { ...draft.contact, email: e.target.value } })} 
                   className="h-11 rounded-xl bg-background/50 border-border/40 font-bold"
                 />
               </Field>
               <Field label="Telephony Protocol">
                 <Input 
                   value={draft.contact.phone ?? ""} 
                   onChange={(e) => update({ contact: { ...draft.contact, phone: e.target.value } })} 
                   className="h-11 rounded-xl bg-background/50 border-border/40 font-bold"
                 />
               </Field>
             </Section>

             <Section title="Institutional Footer">
               <Field label="Copyright Attribution">
                 <Input 
                   value={draft.footer.copyright} 
                   onChange={(e) => update({ footer: { ...draft.footer, copyright: e.target.value } })} 
                   className="h-11 rounded-xl bg-background/50 border-border/40 font-bold"
                 />
               </Field>
             </Section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-[2.5rem] border-border/40 p-8 space-y-8 bg-background/40 backdrop-blur-xl group hover:border-primary/40 transition-all duration-500">
      <div className="flex items-center gap-3">
         <div className="h-1.5 w-1.5 rounded-full bg-primary" />
         <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground group-hover:text-primary transition-colors">{title}</h2>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
       <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">{label}</Label>
       {children}
    </div>
  );
}
