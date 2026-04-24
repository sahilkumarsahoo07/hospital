import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Clock, FileImage, Inbox } from "lucide-react";
import { analyticsService } from "@/lib/services";
import { WORKFLOW_LABELS } from "@/lib/workflow";
import { HBar, Sparkline, StatCard } from "./Primitives";

export function SystemAnalyticsView() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", "system"],
    queryFn: () => analyticsService.system(),
    refetchInterval: 60000,
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading system analytics…</div>;
  if (error) return <div className="text-sm text-destructive">{(error as Error).message}</div>;
  if (!data) return null;

  const tat = data.avgTatHours;
  const tatLabel = tat < 1 ? `${Math.round(tat * 60)} min` : `${tat.toFixed(1)} h`;
  const maxStatus = Math.max(...data.byStatus.map((s) => s.count), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Registry Node Ingest" value={data.totalStudies} icon={FileImage} />
        <StatCard label="Unassigned Flux" value={data.freePool} icon={Inbox} tone="muted" />
        <StatCard label="Active Synthesis" value={data.inReporting} icon={Activity} />
        <StatCard label="Finalized Signal" value={data.submitted} icon={CheckCircle2} tone="ok" />
        <StatCard label="System Latency" value={tatLabel} icon={Clock} hint="Creation → Finalized" />
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="rd-card !p-8 group">
          <div className="flex items-baseline justify-between mb-8">
            <div>
               <h3 className="rd-display-h text-xl">Transmission Volume</h3>
               <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">Global Node Activity</div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Last {data.dailyVolume.length} days</span>
          </div>
          <div className="relative">
             <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
             <Sparkline values={data.dailyVolume.map((d) => d.count)} height={160} />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-30 mt-6 border-t border-white/5 pt-4">
            {data.dailyVolume.length > 0 && <span>{data.dailyVolume[0].date}</span>}
            {data.dailyVolume.length > 0 && <span>{data.dailyVolume[data.dailyVolume.length - 1].date}</span>}
          </div>
        </div>

        <div className="rd-card !p-8">
          <h3 className="rd-display-h text-xl mb-8">Partition Status</h3>
          <div className="space-y-5">
            {data.byStatus.map((s) => (
              <HBar key={s.status} label={WORKFLOW_LABELS[s.status]} value={s.count} max={maxStatus} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
