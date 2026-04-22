import type { Role } from "./roles";

/* -------- Core Auth & Users -------- */

export type UserStatus = "pending" | "approved" | "rejected" | "suspended";

export interface AppUser {
  id: string;
  organizationId?: string | null;
  email: string;
  fullName: string;
  organization?: string | null; // Legacy text field
  roles: Role[];
  status: UserStatus;
  createdAt: string;
  certificatesStatus?: "pending" | "verified" | "rejected" | "expired" | "none";
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: "hospital" | "diagnostic_centre" | "teleradiology";
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  isActive: boolean;
  reportVerificationEnabled: boolean;
  compressionEnabled: boolean;
  headerImageUrl?: string | null;
  footerImageUrl?: string | null;
}

/* -------- Patients & Portfolio -------- */

export interface Patient {
  id: string;
  organizationId?: string | null;
  patientUid: string; // MRN
  name?: string | null;
  age?: number | null;
  gender?: "M" | "F" | "O" | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  clinicalHistory?: string | null;
  createdAt: string;
  updatedAt: string;
}

/* -------- Extended PACS Workflow -------- */

export type WorkflowStatus = 
  | "new_study_received"
  | "pending_assignment"
  | "assigned_to_doctor"
  | "doctor_opened_report"
  | "report_in_progress"
  | "report_drafted"
  | "report_finalized"
  | "verification_pending"
  | "report_verified"
  | "report_rejected"
  | "revert_to_radiologist"
  | "report_completed"
  | "final_report_downloaded"
  | "archived"
  | "FREE_POOL" | "ASSIGNED" | "IN_REPORTING" | "SUBMITTED" | "FINALIZED"; // Legacy

export type PriorityLevel = "NORMAL" | "STAT" | "PRIORITY" | "MLC" | "EMERGENCY";

export interface Study {
  id: string;
  organizationId?: string | null;
  studyInstanceUID: string;
  accessionNumber?: string | null;
  modality: string;
  bodyPart?: string | null;
  studyDate: string;
  description?: string | null;
  
  // Patient Context
  patientId: string;
  patientName?: string | null;
  patientSex?: "M" | "F" | "O" | null;
  patientBirthDate?: string | null;
  patientRecordId?: string | null;

  // Workflow & Assignment
  status: WorkflowStatus;
  priority: PriorityLevel;
  dueDate?: string | null;
  assigneeId?: string | null;
  verifierId?: string | null;
  typistId?: string | null;
  assignorId?: string | null;
  assignee?: { id: string; fullName: string } | null;

  // Counters & Flags
  noteCount: number;
  attachmentCount: number;
  printCount: number;
  revertCount: number;
  hasFollowUp: boolean;
  isUrgent: boolean;

  // Referral Info (anonymized for rads)
  referringHospital?: string | null;
  referringCentre?: string | null;
  pacsSourceName?: string | null;

  updatedAt: string;
  createdAt: string;
}

/* -------- Collaboration & Audit -------- */

export interface StudyNote {
  id: string;
  studyId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  parentId?: string | null;
  noteType: "general" | "clinical" | "urgent";
  content: string;
  isPublic: boolean;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export interface StudyAttachment {
  id: string;
  studyId: string;
  uploaderId: string;
  uploaderName: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  storageUrl: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  studyId?: string | null;
  userId?: string | null;
  userName: string;
  action: string;
  details?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  createdAt: string;
}

/* -------- Verification & Reporting -------- */

export interface VerificationRecord {
  id: string;
  studyId: string;
  verifierId: string;
  verifierName: string;
  status: "verified" | "rejected" | "reverted";
  notes?: string | null;
  rejectionReason?: string | null;
  correctionInstructions?: string | null;
  createdAt: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  modality: string;
  contentHtml: string;
  isGlobal: boolean;
  authorId?: string | null;
  createdAt: string;
}

export interface ReportBranding {
  id: string;
  organizationId: string;
  headerImageUrl?: string | null;
  footerImageUrl?: string | null;
  headerHeightPx: number;
  footerHeightPx: number;
  watermarkImageUrl?: string | null;
  watermarkOpacity: number;
  isActive: boolean;
}

/* -------- Sharing & Follow-up -------- */

export interface StudyShare {
  id: string;
  studyId: string;
  creatorId: string;
  token: string;
  hasPassword: boolean;
  expiresAt?: string | null;
  maxUses?: number | null;
  currentUses: number;
  isRevoked: boolean;
  url: string;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  studyId: string;
  creatorId: string;
  creatorName: string;
  reason: string;
  dueDate?: string | null;
  isResolved: boolean;
  resolutionNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

/* -------- Legacy / Mixed -------- */

export interface LandingCms {
  brand: { name: string; tagline: string };
  hero: { headline: string; subheadline: string; ctaLabel: string; ctaHref: string };
  nav: Array<{ label: string; href: string }>;
  contact: { email: string; phone?: string; address?: string };
  footer: { copyright: string; links: Array<{ label: string; href: string }> };
  theme?: { primary?: string };
  version: number;
  updatedAt: string;
}

export interface Report {
  id: string;
  studyId: string;
  status: "DRAFT" | "SUBMITTED" | "FINALIZED";
  contentHtml: string;
  contentText: string;
  version: number;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportBundle {
  draft?: Report;
  latest?: Report;
}

export interface ViewerUrl {
  url: string;
  expiresAt: string;
}
