import { Link } from "@tanstack/react-router";
import { StatusBadge } from "./StatusBadge";
import { ANON_LABEL, isAnonymizedAudience } from "@/lib/workflow";
import type { Study } from "@/lib/types";
import type { Role } from "@/lib/roles";
import { Clock, MessageSquare, Paperclip, AlertCircle, TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  studies: Study[];
  roles: Role[];
  emptyHint?: string;
  /** Optional row-level action slot (e.g. Claim button). */
  renderActions?: (s: Study) => React.ReactNode;
}

const PRIORITY_STYLES: Record<string, string> = {
  STAT: "text-red-600 bg-red-50 border-red-200",
  EMERGENCY: "text-red-700 bg-red-100 border-red-300 animate-pulse",
  PRIORITY: "text-amber-600 bg-amber-50 border-amber-200",
  MLC: "text-purple-600 bg-purple-50 border-purple-200",
  NORMAL: "text-muted-foreground bg-muted/30 border-border",
};

export function StudyTable({ studies, roles, emptyHint, renderActions }: Props) {
  const anon = isAnonymizedAudience(roles);

  if (studies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
         <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Info className="h-8 w-8 text-muted-foreground/50" />
         </div>
         <h3 className="font-bold text-lg">No cases found</h3>
         <p className="text-muted-foreground text-sm max-w-xs mt-1">
            {emptyHint ?? "Adjust your filters or search terms to find the studies you're looking for."}
         </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <TooltipProvider>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/30 text-muted-foreground/70 border-b">
              <th className="text-left px-6 py-4 font-bold text-[10px] uppercase tracking-widest min-w-[200px]">Patient Identity</th>
              <th className="text-left px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Modality</th>
              <th className="text-left px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Priority</th>
              <th className="text-left px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Timeline</th>
              <th className="text-left px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Entity / Source</th>
              <th className="text-left px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Status / Intelligence</th>
              <th className="text-right px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {studies.map((s) => {
              const source = anon
                ? ANON_LABEL
                : s.referringHospital || s.referringCentre || s.pacsSourceName || "—";
              const patientLabel = anon ? ANON_LABEL : s.patientName || s.patientId;
              
              return (
                <tr key={s.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <Link to="/app/studies/$studyId" params={{ studyId: s.id }} className="font-bold text-primary hover:underline decoration-2">
                        {patientLabel}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                         <span>{s.patientId}</span>
                         <span>•</span>
                         <span>{s.patientSex} / {s.studyInstanceUID.slice(-6)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                         <span className="font-black text-sm">{s.modality}</span>
                         <Badge variant="secondary" className="px-1 text-[9px] h-4 rounded capitalize">{s.bodyPart?.toLowerCase() || 'global'}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[15ch]">{s.description || 'Routine Study'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-tighter ${PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.NORMAL}`}>
                        {s.priority === 'EMERGENCY' && <AlertCircle className="h-3 w-3" />}
                        {s.priority}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                       <div className="flex items-center gap-1 text-[11px] font-bold">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {new Date(s.studyDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                       </div>
                       {s.dueDate && (
                          <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter animate-pulse">TAT {new Date(s.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 min-w-[180px]">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-xs font-bold truncate max-w-[20ch]">{source}</span>
                       <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{s.pacsSourceName || 'PACS-01'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                       <StatusBadge status={s.status} />
                       <div className="flex items-center gap-3 text-muted-foreground/60">
                          {s.noteCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                   <MessageSquare className="h-3 w-3" /> {s.noteCount}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Clinical Observations available</TooltipContent>
                            </Tooltip>
                          )}
                          {s.attachmentCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                   <Paperclip className="h-3 w-3" /> {s.attachmentCount}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Study Attachments linked</TooltipContent>
                            </Tooltip>
                          )}
                          {s.revertCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                   <TrendingUp className="h-3 w-3 mirror-y" /> {s.revertCount}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Rejection/Revert History</TooltipContent>
                            </Tooltip>
                          )}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                       {renderActions?.(s)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TooltipProvider>
    </div>
  );
}

function Badge({ children, className, variant = "outline" }: { children: React.ReactNode; className?: string; variant?: "outline" | "secondary" }) {
    const base = "inline-flex items-center border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    const variants = {
        outline: "text-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
    };
    return <div className={`${base} ${variants[variant]} ${className}`}>{children}</div>;
}
