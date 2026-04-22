import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/roles";
import {
  buildFixSuggestions,
  buildRoleMappingReport,
  decodeJwt,
  logRoleMismatches,
} from "@/lib/tokenClaims";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, AlertTriangle, KeyRound } from "lucide-react";

const ALL_ROLES = Object.values(ROLES) as Role[];

export function TokenClaimsInspector() {
  const { user, token } = useAuthStore();
  const [open, setOpen] = useState(false);

  const decoded = useMemo(() => decodeJwt(token ?? undefined), [token]);
  const payload = decoded?.payload || (user as any);
  const report = useMemo(() => buildRoleMappingReport(payload), [payload]);
  const fixes = useMemo(() => buildFixSuggestions(report), [report]);

  useEffect(() => {
    if (!token) return;
    logRoleMismatches(report, decoded?.signature ?? "manual-entry");
  }, [token, report, decoded?.signature]);

  const hasMismatch = report.unmapped.length > 0 || report.mapped.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start mb-2 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
        >
          {hasMismatch ? (
            <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
          ) : (
            <ShieldCheck className="h-4 w-4 mr-2" />
          )}
          Token claims
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Token claims inspector
          </DialogTitle>
          <DialogDescription>
            JWT claim → app role mapping. Verify that your backend/Keycloak roles match the application's RBAC system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Token type" value={decoded ? "JWT" : "Local Mock"} />
            <Stat label="Issuer" value={String(payload?.iss ?? "—")} />
            <Stat label="Subject" value={String(payload?.sub ?? "—")} />
            <Stat
              label="Expires"
              value={
                roleExp(payload?.exp)
              }
            />
          </div>

          <Section title="Mapped app roles">
            {report.mapped.length === 0 ? (
              <p className="text-sm text-destructive">
                No app roles could be mapped from this token.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {report.mapped.map((r) => (
                  <Badge key={r} variant="default">
                    {ROLE_LABELS[r]}
                  </Badge>
                ))}
              </div>
            )}
          </Section>

          <Section title={`Unmapped role claims (${report.unmapped.length})`}>
            {report.unmapped.length === 0 ? (
              <p className="text-sm text-muted-foreground">All claims mapped cleanly.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {report.unmapped.map((r) => (
                  <Badge key={r} variant="destructive">
                    {r}
                  </Badge>
                ))}
              </div>
            )}
          </Section>

          <Section title="Raw payload">
            <ScrollArea className="h-48 rounded-md border bg-muted/30 p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(payload ?? {}, null, 2)}
              </pre>
            </ScrollArea>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function roleExp(exp: any) {
    if (typeof exp === "number") return new Date(exp * 1000).toLocaleString();
    return "—";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-xs font-mono truncate" title={value}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}
