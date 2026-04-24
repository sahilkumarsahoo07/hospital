import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BILLING_LINE_STATUS_TONE, type BillingLine } from "@/lib/billing";
import { formatMoney } from "@/lib/format";
import { AlertTriangle, BadgeCheck, ExternalLink, Activity, ShieldAlert, Zap } from "lucide-react";

interface Props {
  lines: BillingLine[];
  /** Show the "Party" column (admins only — radiologists/clients see only their own). */
  showParty?: boolean;
  /** Show "Mark paid" admin action. */
  canMarkPaid?: boolean;
  onMarkPaid?: (line: BillingLine) => void;
  markPaidPendingId?: string;
}

export function BillingLinesTable({ lines, showParty, canMarkPaid, onMarkPaid, markPaidPendingId }: Props) {
  if (lines.length === 0) {
    return (
      <div className="glass rounded-[3rem] border-dashed border-border/40 p-32 text-center flex flex-col items-center gap-6">
         <div className="h-16 w-16 rounded-[2rem] bg-muted/10 flex items-center justify-center">
            <Zap className="h-8 w-8 text-muted-foreground/20" />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Zero billing protocols active in current partition.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/40 bg-muted/20">
            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Clinical Study</th>
            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Diagnostic Class</th>
            {showParty && <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Identity Node</th>}
            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Protocol Ver.</th>
            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Lifecycle Status</th>
            <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-right">Aggregate Amount</th>
            {canMarkPaid && <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-right">Audit Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/10">
          {lines.map((l) => (
            <tr key={l.id} className="group hover:bg-primary/[0.02] transition-colors">
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                   <Link 
                     to="/app/studies/$studyId" 
                     params={{ studyId: l.studyId }} 
                     className="text-sm font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-tight"
                   >
                     Audit Study <ExternalLink className="h-3 w-3 opacity-20" />
                   </Link>
                   <div className="text-[10px] text-muted-foreground/40 font-mono tracking-tighter truncate max-w-[18ch]">{l.studyInstanceUID}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-0.5">
                   <div className="text-[10px] font-black text-foreground uppercase tracking-widest">{l.modality}</div>
                   <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight">{l.bodyPart ?? "GENERIC"}</div>
                </div>
              </td>
              {showParty && (
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                     <div className="text-[10px] font-black text-foreground uppercase tracking-tight">{l.partyName}</div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 bg-muted/10 px-1.5 py-0.5 rounded-md border border-border/20 w-fit">
                        {l.partyRole.replace("_", " ")}
                     </span>
                  </div>
                </td>
              )}
              <td className="px-6 py-4">
                 <span className="text-[10px] font-mono font-bold text-muted-foreground/40">V{l.reportVersion}</span>
              </td>
              <td className="px-6 py-4">
                 <div className="flex flex-col gap-1.5">
                    <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border w-fit ${BILLING_LINE_STATUS_TONE[l.status]}`}>
                      {l.status}
                    </span>
                    {l.warning === "MISSING_RULE" && (
                      <div className="flex items-center gap-1.5 text-[8px] font-black text-warning-foreground uppercase tracking-widest animate-pulse">
                         <ShieldAlert className="h-3 w-3" /> Rule Protocol Fault
                      </div>
                    )}
                 </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="text-sm font-black text-foreground tabular-nums tracking-tighter">
                   {formatMoney(l.amount, l.currency)}
                </div>
              </td>
              {canMarkPaid && (
                <td className="px-6 py-4 text-right">
                  {(l.status === "LOCKED" || l.status === "PENDING") && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      disabled={markPaidPendingId === l.id} 
                      onClick={() => onMarkPaid?.(l)}
                      className="h-8 px-4 rounded-lg glass border-border/40 text-[9px] font-black uppercase tracking-widest hover:bg-success-foreground hover:text-white transition-all"
                    >
                      <BadgeCheck className="h-3.5 w-3.5 mr-2" /> Finalize Payment
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

