import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser } from "@/lib/types";
import type { Role } from "@/lib/roles";

interface AuthState {
  token: string | null;
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  
  // Actions
  setSession: (token: string, user: AppUser) => void;
  setHasHydrated: (h: boolean) => void;
  logout: () => void;
  updateUser: (user: Partial<AppUser>) => void;
}

// Low-level sync read for Zero-Flicker
const getInitialSession = () => {
  try {
    const raw = localStorage.getItem("aspire-auth-storage");
    if (!raw) return { token: null, user: null, isAuthenticated: false };
    const parsed = JSON.parse(raw);
    const { token, user, isAuthenticated } = parsed.state || {};
    return { token: token || null, user: user || null, isAuthenticated: !!isAuthenticated };
  } catch {
    return { token: null, user: null, isAuthenticated: false };
  }
};

const initial = getInitialSession();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initial,
      isLoading: false,
      hasHydrated: false,

      setSession: (token, user) => {
        set({ token, user, isAuthenticated: true, isLoading: false });
      },

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      },

      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : null,
        })),
    }),
    {
      name: "aspire-auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/** Helper to get current roles from the store */
export const getActiveRoles = () => useAuthStore.getState().user?.roles || [];
