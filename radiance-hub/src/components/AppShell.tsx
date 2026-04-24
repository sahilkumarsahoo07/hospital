import React, { useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES, type Role } from "../lib/roles";
import { ThemeToggle } from "./theme-toggle";
import {
  LogOut,
  LayoutDashboard,
  Users,
  FileImage,
  BarChart3,
  Plug,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allow: Role[];
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const roles = user?.roles || [];
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const shell = document.querySelector(".rd-shell") as HTMLElement;
    if (!shell) return;
    
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        shell.style.setProperty("--x", `${e.clientX}px`);
        shell.style.setProperty("--y", `${e.clientY}px`);
      });
    };
    
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const navItems: NavItem[] = useMemo(() => [
    { to: "/app", label: "Overview", icon: LayoutDashboard, allow: Object.values(ROLES) },
    { to: "/app/studies", label: "Worklist", icon: FileImage, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.RADIOLOGIST, ROLES.VERIFIER, ROLES.TYPIST, ROLES.HOSPITAL, ROLES.DIAGNOSTIC_CENTRE] },
    { to: "/app/analytics", label: "Analytics", icon: BarChart3, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.RADIOLOGIST, ROLES.HOSPITAL, ROLES.DIAGNOSTIC_CENTRE] },
    { to: "/app/approvals", label: "Users", icon: Users, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN] },
    { to: "/app/pacs", label: "Infrastructure", icon: Plug, allow: [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.PACS] },
    { to: "/app/cms", label: "Management", icon: Settings, allow: [ROLES.SUPER_ADMIN] },
  ], []);

  const items = useMemo(() => navItems.filter((n) => n.allow.some((r) => roles.includes(r))), [navItems, roles]);

  const isActive = (to: string) => {
    if (to === "/app") return currentPath === "/app" || currentPath === "/app/";
    return currentPath.startsWith(to);
  };

  return (
    <div className="rd-shell">
      {/* BACKGROUND LAYERS */}
      <div className="rd-effects">
         <div className="rd-noise" />
         <div className="rd-mesh" />
         <div 
           className="rd-glow" 
           style={{ 
             transform: `translate(calc(var(--x, 0px) - 300px), calc(var(--y, 0px) - 300px))` 
           }} 
         />
      </div>

      {/* SIDEBAR */}
      <aside className={cn("rd-sidebar", isCollapsed && "rd-sidebar--collapsed")}>
        <div className="rd-sidebar-header">
          <div className="rd-logo-box">
            <Activity className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && <span className="rd-logo-text">Radiance</span>}
          <button 
            className={cn("p-2 hover:bg-muted rounded-xl transition-colors", !isCollapsed && "ml-auto")}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="rd-nav">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn("rd-nav-item", isActive(item.to) && "rd-nav-item--active")}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-8">
           <button 
             className="rd-nav-item w-full !bg-rose-500/10 text-rose-500 hover:!bg-rose-500 hover:!text-white"
             onClick={() => { logout(); navigate({ to: "/login" }); }}
           >
             <LogOut className="h-5 w-5 flex-shrink-0" />
             {!isCollapsed && <span>Sign Out</span>}
           </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="rd-container">
        <header className="rd-header">
          <div className="flex-1 max-w-xl">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-black uppercase tracking-widest text-primary mb-0">
                <Sparkles className="h-3.5 w-3.5" />
                <span>v4.0 Protocol Active</span>
             </div>
          </div>

          <div className="flex items-center gap-8">
            <ThemeToggle />
            <div className="flex items-center gap-4 pl-8 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-black uppercase tracking-tight">{user?.fullName ?? "Operator"}</div>
                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest italic opacity-50">Authorized Hub</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center text-xs font-black italic">
                {user?.fullName?.slice(0, 1) || "R"}
              </div>
            </div>
          </div>
        </header>

        <main className="rd-main">
          {children}
        </main>
      </div>
    </div>
  );
}
