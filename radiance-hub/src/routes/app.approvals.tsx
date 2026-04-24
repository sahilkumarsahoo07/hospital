import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { usersService } from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES, ROLE_LABELS } from "@/lib/roles";
import type { AppUser, UserStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, 
  Loader2, 
  Users, 
  ShieldCheck, 
  XCircle, 
  CheckCircle2, 
  Lock, 
  ArrowUpRight,
  UserCheck,
  Fingerprint,
  Activity,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/approvals")({
  component: ApprovalsPage,
});

const STATUS_TABS: { key: UserStatus; label: string; icon: any }[] = [
  { key: "pending", label: "Registry Queue", icon: UserCheck },
  { key: "approved", label: "Authorized Nodes", icon: CheckCircle2 },
  { key: "rejected", label: "Denied Protocols", icon: XCircle },
  { key: "suspended", label: "Locked Accounts", icon: Lock },
];

function ApprovalsPage() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const allowed = roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.SUB_ADMIN);
  const [status, setStatus] = useState<UserStatus>("pending");
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["users", status],
    queryFn: () => usersService.list({ status }),
    enabled: allowed,
    refetchInterval: 15_000,
  });

  const approve = useMutation({
    mutationFn: (id: string) => usersService.approve(id),
    onSuccess: () => { toast.success("Access Protocol Authorized"); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => usersService.reject(id, reason),
    onSuccess: () => { toast.success("Access Denied"); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  
  const suspend = useMutation({
    mutationFn: (id: string) => usersService.suspend(id),
    onSuccess: () => { toast.success("Identity Suspended"); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="rd-card max-w-lg text-center border-rose-500/20 bg-rose-500/5">
          <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto mb-8 animate-pulse" />
          <h2 className="rd-display-h text-4xl mb-6">Unauthorized.</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">
            Identity Authorization is Restricted to Root Nodes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
           <span className="rd-label">Node Management</span>
           <h1 className="rd-display-h text-3xl md:text-4xl leading-[0.9] tracking-tighter">
              Personnel <br/>
              <span className="text-primary">Registry.</span>
           </h1>
        </div>

        <div className="flex flex-wrap gap-2 bg-white/5 p-2 rounded-[2rem] border border-white/5 backdrop-blur-xl">
           {STATUS_TABS.map((t) => (
             <button
               key={t.key}
               onClick={() => setStatus(t.key)}
               className={cn(
                 "flex items-center gap-2 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                 status === t.key ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
               )}
             >
               <t.icon className="h-3.5 w-3.5" />
               {t.label}
             </button>
           ))}
        </div>
      </section>

      {/* REGISTRY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 opacity-30 italic">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-[9px] font-black uppercase tracking-[0.4em]">Syncing Personnel Nodes...</div>
          </div>
        ) : error ? (
          <div className="col-span-full rd-card !bg-rose-500/5 text-center py-10 border-rose-500/20">
            <ShieldAlert className="h-8 w-8 text-rose-500 mx-auto mb-4" />
            <div className="rd-display-h text-xl text-rose-500">Registry Failure</div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-2">{(error as Error).message}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="relative mb-8">
               <Users className="h-16 w-16 text-primary/20" />
               <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-accent animate-pulse" />
            </div>
            <h3 className="rd-display-h text-2xl mb-2">Registry Clear.</h3>
            <p className="max-w-xs text-[10px] font-black uppercase tracking-[0.2em] opacity-40 leading-relaxed">
               No pending nodes discovered in the current partition. All authorization protocols are up to date.
            </p>
          </div>
        ) : (
          data.map((u: AppUser) => (
            <div key={u.id} className="rd-card group !p-5">
               <div className="flex justify-between items-start mb-6">
                  <div className="h-14 w-14 glass rounded-2xl flex items-center justify-center text-xl font-black italic text-primary group-hover:scale-105 transition-transform">
                    {u.fullName.slice(0, 1)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <div className="rd-badge rd-badge-primary scale-75 origin-right">ID: {u.id.slice(0, 8)}</div>
                     <div className="flex items-center gap-1 text-[7px] font-black uppercase tracking-widest opacity-30">
                        <Activity className="h-2 w-2" />
                        {u.status}
                     </div>
                  </div>
               </div>

               <div className="space-y-1 mb-6">
                  <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">
                     {u.fullName}
                  </h3>
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                     {u.organization || "Independent Specialist"}
                  </div>
               </div>

               <div className="flex flex-wrap gap-1.5 mb-6 pb-6 border-b border-white/5">
                  {u.roles.map(r => (
                    <span key={r} className="rd-badge !bg-foreground !text-background border-none scale-75 origin-left">
                       {ROLE_LABELS[r]}
                    </span>
                  ))}
               </div>

               <div className="grid grid-cols-1 gap-2">
                 {status === "pending" && (
                   <>
                     <Button className="h-10 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-[0.1em] hover:scale-105 transition-all" onClick={() => approve.mutate(u.id)} disabled={approve.isPending}>
                        Authorize
                     </Button>
                     <Button variant="ghost" className="h-10 rounded-xl text-rose-500 font-black text-[9px] uppercase tracking-[0.1em] hover:bg-rose-500/10" onClick={() => {
                       const reason = prompt("Enter denial reason:");
                       if (reason) reject.mutate({ id: u.id, reason });
                     }}>
                        Deny
                     </Button>
                   </>
                 )}
                 {status === "approved" && (
                   <Button variant="ghost" className="h-10 rounded-xl text-rose-500 font-black text-[9px] uppercase tracking-[0.1em] hover:bg-rose-500/10 border border-rose-500/20" onClick={() => suspend.mutate(u.id)}>
                      Suspend
                   </Button>
                 )}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
