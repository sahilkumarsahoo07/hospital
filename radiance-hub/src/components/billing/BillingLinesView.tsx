import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { billingService } from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES } from "@/lib/roles";
import type { BillingLine, BillingLineKind, BillingLineStatus } from "@/lib/billing";
import { BillingLinesTable } from "./BillingLinesTable";
import { formatMoney, downloadBlob } from "@/lib/format";
import { apiFetch } from "@/lib/api";
import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2, RefreshCw, Filter, Calendar, Activity, Zap } from "lucide-react";

const STATUS_OPTIONS: BillingLineStatus[] = ["PENDING", "LOCKED", "PAID", "VOID", "SUPERSEDED"];

export function BillingLinesView({ kind }: { kind: BillingLineKind }) {
  const { user, token } = useAuthStore();
  const roles = user?.roles || [];
  const isAdmin = roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.SUB_ADMIN);
  const qc = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<BillingLineStatus[]>([]);

  const query = useMemo(
    () => ({
      kind,
      from: from || undefined,
      to: to || undefined,
      status: status.length ? status : undefined,
    }),
    [kind, from, to, status],
  );

  const linesQ = useQuery({
    queryKey: ["billing", "lines", query],
    queryFn: () => billingService.listLines(query),
    refetchInterval: 30_000,
  });

  const markPaid = useMutation({
    mutationFn: (line: BillingLine) => billingService.markPaid(line.id),
    onSuccess: () => { 
      toast.success("Transaction State Finalized — PAID"); 
      qc.invalidateQueries({ queryKey: ["billing", "lines"] }); 
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [exporting, setExporting] = useState(false);
  const exportCsv = async () => {
    setExporting(true);
    try {
      const sp = new URLSearchParams({ kind, format: "csv" });
      if (from) sp.set("from", from);
      if (to) sp.set("to", to);
      if (status.length) sp.set("status", status.join(","));
      const headers: Record<string, string> = { Accept: "text/csv" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${env.api.baseUrl}/billing/export?${sp.toString()}`, { headers });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const today = new Date().toISOString().slice(0, 10);
      await downloadBlob(`${kind.toLowerCase()}-${today}.csv`, blob);
      toast.success("Data Ingestion Complete — CSV Exported");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass rounded-[2.5rem] border-border/40 p-6 flex flex-wrap items-center gap-6 bg-background/40 backdrop-blur-xl">
        <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
          <div className="flex flex-col gap-1.5 min-w-[140px]">
             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Range Start</label>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 pl-9 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest" />
             </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Range End</label>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 pl-9 rounded-xl bg-background/50 border-border/20 text-[10px] font-black uppercase tracking-widest" />
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[300px]">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Protocol Status Filters</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))}
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                  status.includes(s) 
                    ? "border-primary bg-primary/10 text-primary scale-105" 
                    : "border-border/20 text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => linesQ.refetch()} 
            disabled={linesQ.isFetching}
            className="h-10 px-4 rounded-xl glass border-border/40 text-[10px] font-black uppercase tracking-widest"
          >
            {linesQ.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
            Sync
          </Button>
          <Button 
            size="sm" 
            onClick={exportCsv} 
            disabled={exporting || !linesQ.data?.items.length}
            className="h-10 px-6 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/5"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Download className="h-3.5 w-3.5 mr-2" />}
            Extract CSV
          </Button>
        </div>
      </div>

      {linesQ.isLoading && (
        <div className="glass rounded-[2.5rem] p-20 flex flex-col items-center justify-center gap-4">
           <Loader2 className="h-10 w-10 text-primary animate-spin" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 animate-pulse">Initializing Financial Audit...</span>
        </div>
      )}
      
      {linesQ.error && (
        <div className="glass rounded-[2.5rem] border-destructive/20 bg-destructive/5 p-12 text-center text-destructive">
           <p className="text-sm font-black uppercase tracking-widest text-destructive">Data Retrieval Fault</p>
           <p className="text-[10px] font-medium mt-1">{(linesQ.error as Error).message}</p>
        </div>
      )}

      {linesQ.data && (
        <div className="space-y-8 animate-in fade-in duration-1000">
          <div className="flex flex-wrap gap-12 px-8">
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Audit Count</div>
              <div className="text-3xl font-display font-black text-foreground tracking-tighter">{linesQ.data.total}</div>
            </div>
            {Object.entries(linesQ.data.subtotalsByCurrency).map(([cur, total]) => (
              <div key={cur} className="space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Aggregate · {cur}</div>
                <div className="text-3xl font-display font-black text-primary tracking-tighter shadow-primary/20 drop-shadow-sm">{formatMoney(total, cur)}</div>
              </div>
            ))}
          </div>

          <div className="glass rounded-[2.5rem] border-border/40 overflow-hidden shadow-premium relative">
            <BillingLinesTable
              lines={linesQ.data.items}
              showParty={isAdmin}
              canMarkPaid={isAdmin}
              onMarkPaid={(l) => markPaid.mutate(l)}
              markPaidPendingId={markPaid.isPending ? markPaid.variables?.id : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export type _ApiFetchKeepAlive = typeof apiFetch;

