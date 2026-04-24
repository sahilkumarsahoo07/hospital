import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { billingService } from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES } from "@/lib/roles";
import type { BillingPartyRole, RateCard } from "@/lib/billing";
import { formatMoney } from "@/lib/format";
import { RateCardEditor } from "@/components/billing/RateCardEditor";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Plus, Trash2, Cpu, ShieldAlert, Zap, Activity, Filter, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/billing/rate-cards")({ component: RateCardsPage });

const ROLE_TABS: { key: BillingPartyRole | "all"; label: string }[] = [
  { key: "all", label: "Global Registry" },
  { key: "radiologist", label: "Clinical Specialists" },
  { key: "hospital", label: "Referring Institutions" },
  { key: "diagnostic_centre", label: "Imaging Facilities" },
];

function RateCardsPage() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isAdmin = roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.SUB_ADMIN);
  const qc = useQueryClient();
  const [tab, setTab] = useState<BillingPartyRole | "all">("all");
  const [editing, setEditing] = useState<RateCard | undefined>();
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["billing", "rate-cards", tab],
    queryFn: () => billingService.listRateCards(tab === "all" ? undefined : { ownerRole: tab }),
    enabled: isAdmin,
  });

  const remove = useMutation({
    mutationFn: (id: string) => billingService.deleteRateCard(id),
    onSuccess: () => { 
      toast.success("Rate Protocol Terminated"); 
      qc.invalidateQueries({ queryKey: ["billing", "rate-cards"] }); 
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sorted = useMemo(() => (data ? [...data].sort((a, b) => a.ownerName.localeCompare(b.ownerName)) : []), [data]);

  if (!isAdmin) {
    return (
      <div className="glass rounded-[2.5rem] p-12 text-center max-w-lg mx-auto border-border/40 mt-12">
         <ShieldAlert className="h-10 w-10 text-muted-foreground/20 mx-auto mb-6" />
         <h1 className="text-xl font-display font-black tracking-tight text-foreground uppercase">Privileged Protocol</h1>
         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-4 leading-relaxed">
           Financial matrix modification is restricted to root administrative nodes. Authorization required for Rate Card access.
         </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-2 p-1 glass rounded-2xl border-border/40 bg-background/40">
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                tab === t.key 
                  ? "bg-foreground text-background shadow-lg scale-[1.02]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button 
          size="sm" 
          onClick={() => setCreating(true)}
          className="h-10 px-6 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/5"
        >
          <Plus className="h-4 w-4 mr-2" /> Initialize Matrix
        </Button>
      </div>

      <div className="space-y-6">
        {isLoading && (
          <div className="glass rounded-[2.5rem] p-20 flex flex-col items-center justify-center gap-4">
             <Loader2 className="h-10 w-10 text-primary animate-spin" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 animate-pulse">Synchronizing Rate Registry...</span>
          </div>
        )}
        
        {error && (
          <div className="glass rounded-[2.5rem] border-destructive/20 bg-destructive/5 p-12 text-center text-destructive">
             <p className="text-sm font-black uppercase tracking-widest text-destructive">Registry Synchronization Failure</p>
             <p className="text-[10px] font-medium mt-1">{(error as Error).message}</p>
          </div>
        )}

        {sorted.length === 0 && data && (
          <div className="glass rounded-[3rem] border-dashed border-border/40 p-32 text-center flex flex-col items-center gap-6">
             <div className="h-16 w-16 rounded-[2rem] bg-muted/10 flex items-center justify-center">
                <Zap className="h-8 w-8 text-muted-foreground/20" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Zero rate protocols active in current partition.</p>
          </div>
        )}

        {sorted.length > 0 && (
          <div className="glass rounded-[2.5rem] border-border/40 overflow-hidden shadow-premium relative">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Entity Owner</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Class Node</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">ISO Currency</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-center">Protocol Rules</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Base Quota</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Lifespan Lifecycle</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Status</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-right">Synchronization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {sorted.map((c) => (
                  <tr key={c.id} className="group hover:bg-primary/[0.02] transition-colors">
                    <td className="px-6 py-4">
                       <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate max-w-[200px] uppercase tracking-tight">{c.ownerName}</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 bg-muted/10 px-2 py-0.5 rounded-md border border-border/20">
                          {c.ownerRole.replace("_", " ")}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-muted-foreground/60">{c.currency}</td>
                    <td className="px-6 py-4 text-center">
                       <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10">
                          <Activity className="h-3 w-3 text-primary/60" />
                          <span className="text-[10px] font-black text-primary/60">{c.rules.length}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-foreground uppercase tracking-tighter">
                       {c.defaultAmount != null ? formatMoney(c.defaultAmount, c.currency) : <span className="opacity-20">—</span>}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">
                         <span>{new Date(c.effectiveFrom).toLocaleDateString()}</span>
                         <ArrowRight className="h-3 w-3 opacity-20" />
                         <span>{c.effectiveTo ? new Date(c.effectiveTo).toLocaleDateString() : "ETERNITY"}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       {c.active ? (
                          <div className="flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-success-foreground animate-pulse" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-success-foreground">Synchronized</span>
                          </div>
                       ) : (
                          <div className="flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Deactivated</span>
                          </div>
                       )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-muted-foreground/20 hover:text-primary hover:bg-primary/5 transition-all"
                          onClick={() => setEditing(c)}
                        >
                           <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 transition-all"
                          disabled={remove.isPending}
                          onClick={() => { if (confirm(`Terminate rate protocol for ${c.ownerName}?`)) remove.mutate(c.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RateCardEditor open={!!editing} card={editing} onOpenChange={(o) => !o && setEditing(undefined)} />
      <RateCardEditor open={creating} onOpenChange={setCreating} />
    </div>
  );
}

