import type { ReactNode } from "react";
import type { Role } from "@/lib/roles";
import { useAuthStore } from "@/lib/stores/authStore";

export function RoleGate({ allow, children, fallback = null }: { allow: Role[]; children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const ok = roles.some((r) => allow.includes(r));
  return <>{ok ? children : fallback}</>;
}
