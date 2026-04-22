import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { DevRoleSwitcher } from "@/components/DevRoleSwitcher";
import { TokenClaimsInspector } from "@/components/TokenClaimsInspector";
import { LogOut, LayoutDashboard, Users, FileImage, FileText, Wallet, Plug, Settings, Activity, Search, BarChart3, Inbox, Upload } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allow: Role[];
}

const NAV: NavItem[] = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, allow: Object.values(ROLES) },
  { to: "/app/search", label: "Search", icon: Search, allow: Object.values(ROLES) },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.RADIOLOGIST, ROLES.HOSPITAL, ROLES.DIAGNOSTIC_CENTRE] },
  { to: "/app/approvals", label: "User Approvals", icon: Users, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN] },
  { to: "/app/studies", label: "Studies", icon: FileImage, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.RADIOLOGIST, ROLES.VERIFIER, ROLES.TYPIST, ROLES.HOSPITAL, ROLES.DIAGNOSTIC_CENTRE] },
  { to: "/app/fetch-cases", label: "Fetch Cases", icon: Inbox, allow: [ROLES.RADIOLOGIST] },
  { to: "/app/upload", label: "Upload Cases", icon: Upload, allow: [ROLES.HOSPITAL, ROLES.DIAGNOSTIC_CENTRE] },
  { to: "/app/free-pool", label: "Free Pool", icon: Activity, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN] },
  { to: "/app/reports", label: "Reports", icon: FileText, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.RADIOLOGIST] },
  { to: "/app/billing", label: "Billing", icon: Wallet, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.RADIOLOGIST, ROLES.HOSPITAL, ROLES.DIAGNOSTIC_CENTRE] },
  { to: "/app/pacs", label: "PACS", icon: Plug, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.PACS] },
  { to: "/app/cms", label: "Landing CMS", icon: Settings, allow: [ROLES.SUPER_ADMIN] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const roles = user?.roles || [];
  const navigate = useNavigate();

  const items = NAV.filter((n) => n.allow.some((r) => roles.includes(r)));
  const displayRole = roles[0] ? ROLE_LABELS[roles[0]] || roles[0] : "No Role";

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-background">
      <aside className="flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="font-display text-lg font-semibold tracking-tight uppercase tracking-tighter">Radiance</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50 font-bold -mt-0.5">PACS Enterprise</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/app" }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 data-[status=active]:bg-primary data-[status=active]:text-primary-foreground data-[status=active]:shadow-sm"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4 bg-sidebar-accent/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              {user?.fullName?.split(' ').map(n=>n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
               <div className="text-sm font-semibold truncate leading-none mb-1">{user?.fullName ?? "User"}</div>
               <div className="text-[10px] uppercase font-bold text-sidebar-foreground/40">{displayRole}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex flex-col min-h-screen bg-muted/20">{children}</main>
    </div>
  );
}
