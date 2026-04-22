import { create } from "zustand";
import { 
  notesService, 
  attachmentsService, 
  auditService, 
  locksService, 
  studiesService,
  verificationService,
  sharingService,
  printService,
  reportsService
} from "@/lib/services";
import type { 
  Study, 
  StudyNote, 
  StudyAttachment, 
  AuditLog,
  VerificationRecord,
  StudyShare
} from "@/lib/types";

interface StudioState {
  activeStudyId: string | null;
  study: Study | null;
  notes: StudyNote[];
  attachments: StudyAttachment[];
  timeline: AuditLog[];
  verificationRecords: VerificationRecord[];
  shares: StudyShare[];
  printHistory: any[];
  reportVersions: any[];
  isLocked: boolean;
  lockExpiresAt: string | null;
  isLoading: boolean;
  
  // Actions
  loadStudy: (studyId: string) => Promise<void>;
  clearStudy: () => void;
  refreshNotes: () => Promise<void>;
  refreshAttachments: () => Promise<void>;
  refreshTimeline: () => Promise<void>;
  acquireLock: () => Promise<void>;
  releaseLock: () => Promise<void>;
  addNote: (content: string, type?: "general" | "clinical" | "urgent") => Promise<void>;
  uploadAttachment: (file: File) => Promise<void>;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  activeStudyId: null,
  study: null,
  notes: [],
  attachments: [],
  timeline: [],
  verificationRecords: [],
  shares: [],
  printHistory: [],
  reportVersions: [],
  isLocked: false,
  lockExpiresAt: null,
  isLoading: false,

  loadStudy: async (studyId: string) => {
    set({ activeStudyId: studyId, isLoading: true });
    try {
      const [study, notes, attachments, timeline, verificationRecords, shares, printHistory, reportVersions] = await Promise.all([
        studiesService.get(studyId),
        notesService.list(studyId),
        attachmentsService.list(studyId),
        auditService.getTimeline(studyId),
        verificationService.list(studyId),
        sharingService.list(studyId),
        printService.getHistory(studyId),
        reportsService.versions(studyId),
      ]);
      set({ 
        study, notes, attachments, timeline, verificationRecords, shares, 
        printHistory, reportVersions,
        isLoading: false 
      });
    } catch (error) {
      console.error("Failed to load study details", error);
      set({ isLoading: false });
    }
  },

  clearStudy: () => set({ 
    activeStudyId: null, study: null, notes: [], attachments: [], timeline: [], 
    verificationRecords: [], shares: [], printHistory: [], reportVersions: [],
    isLocked: false, lockExpiresAt: null 
  }),

  refreshNotes: async () => {
    const { activeStudyId } = get();
    if (!activeStudyId) return;
    const notes = await notesService.list(activeStudyId);
    set({ notes });
  },

  refreshAttachments: async () => {
    const { activeStudyId } = get();
    if (!activeStudyId) return;
    const attachments = await attachmentsService.list(activeStudyId);
    set({ attachments });
  },

  refreshTimeline: async () => {
    const { activeStudyId } = get();
    if (!activeStudyId) return;
    const timeline = await auditService.getTimeline(activeStudyId);
    set({ timeline });
  },

  acquireLock: async () => {
    const { activeStudyId } = get();
    if (!activeStudyId) return;
    try {
      const res = await locksService.acquire(activeStudyId);
      set({ isLocked: true, lockExpiresAt: res.expiresAt });
    } catch (err) {
      set({ isLocked: false, lockExpiresAt: null });
      throw err;
    }
  },

  releaseLock: async () => {
    const { activeStudyId } = get();
    if (!activeStudyId) return;
    await locksService.release(activeStudyId);
    set({ isLocked: false, lockExpiresAt: null });
  },

  addNote: async (content, noteType = "general") => {
    const { activeStudyId } = get();
    if (!activeStudyId) return;
    await notesService.create(activeStudyId, { content, noteType });
    await get().refreshNotes();
  },

  uploadAttachment: async (file: File) => {
    const { activeStudyId } = get();
    if (!activeStudyId) return;
    await attachmentsService.upload(activeStudyId, file);
    await get().refreshAttachments();
  },
}));
