import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we have definitely finished hydration and the user is NOT authenticated
    if (hasHydrated && !isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, hasHydrated, navigate]);

  // If we are NOT authenticated AND we haven't finished hydration yet, 
  // we don't show anything (or a tiny progress bar) to avoid flickering 
  // the "Verifying" screen if the user is actually logged in.
  if (!isAuthenticated && !hasHydrated) {
    return null; 
  }

  // If hydration finished and we are NOT authenticated, we are about to redirect
  if (hasHydrated && !isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
