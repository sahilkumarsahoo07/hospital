import { create } from "zustand";
import type { StudyListQuery, WorkflowStatus } from "@/lib/types";

interface StudiesState {
  query: StudyListQuery;
  
  // Actions
  setQuery: (query: Partial<StudyListQuery>) => void;
  resetQuery: () => void;
  setStatus: (status: WorkflowStatus[]) => void;
  setModality: (modality: string[]) => void;
  setSearch: (q: string) => void;
}

const initialQuery: StudyListQuery = {
  page: 1,
  pageSize: 50,
  status: [],
  modality: [],
  q: "",
};

export const useStudiesStore = create<StudiesState>((set) => ({
  query: initialQuery,

  setQuery: (patch) =>
    set((state) => ({
      query: { ...state.query, ...patch, page: patch.page || 1 },
    })),

  resetQuery: () => set({ query: initialQuery }),

  setStatus: (status) =>
    set((state) => ({
      query: { ...state.query, status, page: 1 },
    })),

  setModality: (modality) =>
    set((state) => ({
      query: { ...state.query, modality, page: 1 },
    })),

  setSearch: (q) =>
    set((state) => ({
      query: { ...state.query, q, page: 1 },
    })),
}));
