import React, { useState, useMemo } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES, ROLE_LABELS, type Role } from "../lib/roles";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  FileImage, 
  FileText, 
  Wallet, 
  Plug, 
  Settings, 
  Activity, 
  Search, 
  BarChart3, 
  Inbox, 
  Upload,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allow: Role[];
}

import { ThemeToggle } from "./theme-toggle";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const roles = user?.roles || [];
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = useMemo(() => [
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
  ], []);

  const items = useMemo(() => navItems.filter((n) => n.allow.some((r) => roles.includes(r))), [navItems, roles]);
  const displayRole = roles[0] ? ROLE_LABELS[roles[0]] || roles[0] : "No Role";

  return (
    <div className="flex h-screen bg-background p-4 gap-4 transition-all duration-500 overflow-hidden">
      <aside 
        className={cn(
          "flex flex-col h-full glass rounded-3xl border border-border/50 shadow-premium overflow-hidden transition-all duration-500 ease-in-out relative group/sidebar",
          isCollapsed ? "w-[80px]" : "w-[280px]"
        )}
      >
        <div className={cn("px-6 py-8 flex items-center justify-between flex-shrink-0", isCollapsed && "px-4")}>
          <div className={cn("flex items-center gap-3 transition-all duration-500", isCollapsed && "gap-0")}>
             <div className="h-8 w-8 rounded-xl bg-primary flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/30">
                <Activity className="h-4 w-4 text-primary-foreground" />
             </div>
             {!isCollapsed && (
               <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
                  <span className="font-display text-xl font-black tracking-tighter uppercase text-foreground">Radiance</span>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 font-black pl-1">PACS</div>
               </div>
             )}
          </div>
          <div className="flex items-center gap-1">
            {!isCollapsed && <ThemeToggle />}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "h-8 w-8 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all",
                isCollapsed && "mx-auto"
              )}
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar pb-6">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/app" }}
              className={cn(
                "group flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all duration-300 data-[status=active]:bg-primary data-[status=active]:text-primary-foreground data-[status=active]:shadow-lg data-[status=active]:shadow-primary/20",
                isCollapsed && "px-0 justify-center"
              )}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isCollapsed && "h-5 w-5")} />
              {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-500">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto flex-shrink-0">
          <div className={cn("glass-dark rounded-2xl p-4 border border-white/5 transition-all", isCollapsed && "p-2")}>
            <div className={cn("flex items-center gap-3 mb-4", isCollapsed && "mb-0 justify-center")}>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex-shrink-0 flex items-center justify-center text-primary-foreground font-black text-sm shadow-inner">
                {user?.fullName?.split(' ').map(n=>n[0]).join('')}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-500">
                   <div className="text-sm font-bold truncate text-foreground">{user?.fullName ?? "User"}</div>
                   <div className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-wider">{displayRole}</div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500"
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </Button>
            )}
            {isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 mt-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col glass rounded-3xl border border-border/50 shadow-premium overflow-hidden relative h-full">
         <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
         <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-4">
            {children}
         </div>
      </main>
    </div>
  );
}
