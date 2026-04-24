import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { billingService } from "@/lib/services";
import { billingRoleForUser } from "@/lib/billing";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES } from "@/lib/roles";
import { formatMoney } from "@/lib/format";
import { AlertTriangle, CreditCard, Receipt, Wallet, Loader2, Cpu, Zap, Activity, Globe, ArrowRight } from "lucide-react";

function BillingOverview() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isAdmin = roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.SUB_ADMIN);
  const billRole = billingRoleForUser(roles);
  const isRad = billRole === "radiologist";
  const isClient = billRole === "hospital" || billRole === "diagnostic_centre";

  const myCardQ = useQuery({
    queryKey: ["billing", "my-rate-card"],
    queryFn: () => billingService.myRateCard(),
    enabled: !!billRole,
    retry: 0,
  });

  const myKind = isRad ? "PAYOUT" : isClient ? "INVOICE" : undefined;
  const myLinesQ = useQuery({
    queryKey: ["billing", "lines", { kind: myKind, mine: true }],
    queryFn: () => billingService.listLines({ kind: myKind }),
    enabled: !!myKind,
  });

  const adminPayoutsQ = useQuery({
    queryKey: ["billing", "lines", { kind: "PAYOUT", admin: true }],
    queryFn: () => billingService.listLines({ kind: "PAYOUT" }),
    enabled: isAdmin,
  });
  const adminInvoicesQ = useQuery({
    queryKey: ["billing", "lines", { kind: "INVOICE", admin: true }],
    queryFn: () => billingService.listLines({ kind: "INVOICE" }),
    enabled: isAdmin,
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-20">
      {/* LEFT COLUMN: Identity Financial Health (4 cols) */}
      <aside className="xl:col-span-4 space-y-8">
        <div className="glass rounded-[3rem] p-1.5 border-primary/10 overflow-hidden bg-background/20 relative group">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
           <div className="bg-background/40 backdrop-blur-3xl rounded-[2.8rem] p-10 border border-border/20 relative z-10 space-y-10">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Activity className="h-6 w-6 text-primary" />
                 </div>
                 <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">System Pulse</span>
                    <h2 className="text-2xl font-display font-black text-foreground uppercase tracking-tight">Identity Health</h2>
                 </div>
              </div>

              {billRole && (
                <div className="space-y-10">
                   <div className="space-y-4">
                      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40 leading-relaxed">
                         Active rate configuration matrix detected. Historical clearing house synchronization synchronized at node level.
                      </p>
                      <div className="h-px w-full bg-gradient-to-r from-border/20 to-transparent" />
                   </div>

                   {myCardQ.isLoading ? (
                      <div className="flex items-center gap-3">
                         <Loader2 className="h-4 w-4 text-primary animate-spin" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Syncing Matrix...</span>
                      </div>
                   ) : myCardQ.data ? (
                      <div className="grid grid-cols-1 gap-8">
                         <Stat label="Primary Currency" value={myCardQ.data.currency} large />
                         <div className="grid grid-cols-2 gap-8">
                            <Stat label="Protocol Rules" value={String(myCardQ.data.rules.length)} />
                            <Stat label="Base Rate" value={myCardQ.data.defaultAmount != null ? formatMoney(myCardQ.data.defaultAmount, myCardQ.data.currency) : "—"} />
                         </div>
                         <Stat label="Effective Date" value={new Date(myCardQ.data.effectiveFrom).toLocaleDateString()} />
                      </div>
                   ) : (
                      <div className="p-6 glass rounded-3xl border-warning/20 bg-warning/5 flex items-start gap-4">
                         <AlertTriangle className="h-5 w-5 text-warning/60 mt-0.5" />
                         <p className="text-[9px] font-black uppercase tracking-widest text-warning/60 leading-relaxed">No rate protocol discovered. Clearance level required for financial participation.</p>
                      </div>
                   )}
                </div>
              )}

              {!billRole && isAdmin && (
                <div className="space-y-8">
                   <div className="p-8 glass rounded-[2rem] border-primary/20 bg-primary/5 space-y-4">
                      <div className="h-1 w-12 bg-primary rounded-full" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-relaxed">
                         ROOT ADMINISTRATIVE ACCESS: GLOBAL FINANCIAL OVERRIDE ACTIVE.
                      </p>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <Stat label="Cluster State" value="Stable" />
                      <Stat label="Latency" value="14ms" />
                   </div>
                </div>
              )}
           </div>
        </div>

        <div className="glass rounded-[2.5rem] p-8 border-border/40 bg-background/20 relative group overflow-hidden">
           <div className="absolute right-0 top-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
              <Zap className="h-24 w-24" />
           </div>
           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 block mb-3">Diagnostic Partition</span>
           <h3 className="text-xs font-black uppercase tracking-widest text-foreground">v4.0 Reconciliation Engine</h3>
           <p className="text-[10px] font-medium text-muted-foreground/40 mt-2 leading-relaxed italic">
              Line items are immutable once report state is finalized by verifier nodes.
           </p>
        </div>
      </aside>

      {/* CENTER COLUMN: Actionable Ledger (8 cols) */}
      <main className="xl:col-span-8 space-y-8">
        <div className="grid grid-cols-1 gap-8">
           {myKind && (
             <div className="glass rounded-[3rem] p-1.5 border-border/20 overflow-hidden bg-background/20 group">
                <div className="bg-background/40 backdrop-blur-3xl rounded-[2.8rem] p-12 border border-border/20 relative">
                   <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-4">
                         <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-2xl">
                            {myKind === "PAYOUT" ? <Wallet className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
                         </div>
                         <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Ledger Summary</span>
                            <h2 className="text-3xl font-display font-black text-foreground uppercase tracking-tight leading-none mt-1">
                               {myKind === "PAYOUT" ? "Clinical Disbursement" : "Institutional Invoicing"}
                            </h2>
                         </div>
                      </div>
                      <Link 
                        to={myKind === "PAYOUT" ? "/app/billing/payouts" : "/app/billing/invoices"} 
                        className="h-12 px-8 rounded-2xl bg-muted/50 border border-border/40 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
                      >
                         Global Log Registry <ArrowRight className="h-4 w-4" />
                      </Link>
                   </div>
                   
                   {myLinesQ.isLoading ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-4">
                         <Loader2 className="h-8 w-8 text-primary animate-spin" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20">Aggregating Ledger...</span>
                      </div>
                   ) : myLinesQ.data ? (
                      <SubtotalRow subs={myLinesQ.data.subtotalsByCurrency} count={myLinesQ.data.total} />
                   ) : (
                      <p className="text-[10px] font-black text-destructive uppercase tracking-widest">Initialization Fault: {(myLinesQ.error as Error)?.message || "Protocol Interrupted"}</p>
                   )}
                </div>
             </div>
           )}

           {isAdmin && (
              <div className="grid grid-cols-1 gap-8">
                 <div className="glass rounded-[3.5rem] p-1.5 border-primary/10 overflow-hidden bg-background/20 relative">
                    <div className="absolute top-0 right-0 p-12 pointer-events-none opacity-[0.03]">
                       <Globe className="h-40 w-40" />
                    </div>
                    <div className="bg-background/40 backdrop-blur-3xl rounded-[3.3rem] p-12 border border-border/20 space-y-12">
                       <div className="flex items-center gap-4">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">Root Institutional Aggregates</h2>
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div className="space-y-8">
                             <div className="flex items-center justify-between border-b border-border/10 pb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Global Payouts</span>
                                <Link to="/app/billing/payouts" className="text-primary hover:underline text-[9px] font-black uppercase tracking-widest">Registry View</Link>
                             </div>
                             {adminPayoutsQ.isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/20" />
                             ) : adminPayoutsQ.data && (
                                <SubtotalRow subs={adminPayoutsQ.data.subtotalsByCurrency} count={adminPayoutsQ.data.total} compact />
                             )}
                          </div>

                          <div className="space-y-8">
                             <div className="flex items-center justify-between border-b border-border/10 pb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Global Invoices</span>
                                <Link to="/app/billing/invoices" className="text-primary hover:underline text-[9px] font-black uppercase tracking-widest">Registry View</Link>
                             </div>
                             {adminInvoicesQ.isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/20" />
                             ) : adminInvoicesQ.data && (
                                <SubtotalRow subs={adminInvoicesQ.data.subtotalsByCurrency} count={adminInvoicesQ.data.total} compact />
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {!billRole && !isAdmin && (
             <div className="glass rounded-[3rem] border-dashed border-border/40 p-40 text-center flex flex-col items-center gap-8 bg-background/10">
                <div className="h-24 w-24 rounded-[3rem] bg-muted/5 flex items-center justify-center">
                   <ShieldAlert className="h-10 w-10 text-muted-foreground/10" />
                </div>
                <div className="space-y-2">
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">Protocol Clearance Denied</p>
                   <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/10 italic">Financial ledger visibility restricted to root admin or clinical nodes.</p>
                </div>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">{label}</div>
      <div className={`${large ? "text-4xl" : "text-lg"} font-display font-black text-foreground uppercase tracking-tight leading-none`}>
         {value}
      </div>
    </div>
  );
}

function SubtotalRow({ subs, count, compact }: { subs: Record<string, number>; count: number; compact?: boolean }) {
  const entries = Object.entries(subs);
  return (
    <div className={`grid grid-cols-1 ${compact ? "gap-6" : "md:grid-cols-2 lg:grid-cols-3 gap-12"}`}>
      <div className="space-y-3">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">Registry Nodes</div>
        <div className={`${compact ? "text-3xl" : "text-6xl"} font-display font-black text-foreground tracking-tighter leading-none`}>{count}</div>
      </div>
      {entries.map(([cur, total]) => (
        <div key={cur} className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">Aggregate · {cur}</div>
          <div className={`${compact ? "text-3xl" : "text-6xl"} font-display font-black text-primary tracking-tighter leading-none drop-shadow-2xl shadow-primary/40`}>
             {formatMoney(total, cur)}
          </div>
        </div>
      ))}
      {entries.length === 0 && !compact && (
         <div className="col-span-full py-20 border-2 border-dashed border-border/10 rounded-[2rem] flex items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/10">Zero financial aggregates discovered.</span>
         </div>
      )}
    </div>
  );
}


