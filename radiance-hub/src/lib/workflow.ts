import { ROLES, type Role } from "./roles";

export const ANON_LABEL = "— (RESTRICTED) —";

/** 
 * Returns true if the user's role set should see anonymized/restricted 
 * patient data (e.g. PACS integration, Billing only roles). 
 */
export function isAnonymizedAudience(roles: Role[]): boolean {
  if (roles.includes(ROLES.SUPER_ADMIN)) return false;
  if (roles.includes(ROLES.RADIOLOGIST)) return false;
  if (roles.includes(ROLES.SUB_ADMIN)) return false;
  if (roles.includes(ROLES.TYPIST)) return false;
  if (roles.includes(ROLES.VERIFIER)) return false;
  return true; 
}


export const WORKFLOW_STATUS = {
  // New 14-state Workflow
  NEW_STUDY_RECEIVED: "new_study_received",
  PENDING_ASSIGNMENT: "pending_assignment",
  ASSIGNED_TO_DOCTOR: "assigned_to_doctor",
  DOCTOR_OPENED_REPORT: "doctor_opened_report",
  REPORT_IN_PROGRESS: "report_in_progress",
  REPORT_DRAFTED: "report_drafted",
  REPORT_FINALIZED: "report_finalized",
  VERIFICATION_PENDING: "verification_pending",
  REPORT_VERIFIED: "report_verified",
  REPORT_REJECTED: "report_rejected",
  REVERT_TO_RADIOLOGIST: "revert_to_radiologist",
  REPORT_COMPLETED: "report_completed",
  FINAL_REPORT_DOWNLOADED: "final_report_downloaded",
  ARCHIVED: "archived",

  // Legacy (Keep for compatibility mapping if needed)
  FREE_POOL: "FREE_POOL",
  ASSIGNED: "ASSIGNED",
  IN_REPORTING: "IN_REPORTING",
  SUBMITTED: "SUBMITTED",
  FINALIZED: "FINALIZED",
} as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS];

export const WORKFLOW_LABELS: Record<string, string> = {
  new_study_received: "New Study",
  pending_assignment: "Awaiting Assignment",
  assigned_to_doctor: "Case Assigned",
  doctor_opened_report: "Doctor Opened",
  report_in_progress: "In Progress",
  report_drafted: "Drafted",
  report_finalized: "Awaiting Review",
  verification_pending: "QC Pending",
  report_verified: "Verified",
  report_rejected: "Rejected",
  revert_to_radiologist: "Reverted",
  report_completed: "Completed",
  final_report_downloaded: "Downloaded",
  archived: "Archived",
  
  FREE_POOL: "Free Pool",
  ASSIGNED: "Assigned",
  IN_REPORTING: "Reporting",
  SUBMITTED: "Submitted",
  FINALIZED: "Finalized",
};

export const WORKFLOW_TONE: Record<string, string> = {
  new_study_received: "bg-blue-100 text-blue-700 border-blue-200",
  pending_assignment: "bg-orange-100 text-orange-700 border-orange-200",
  assigned_to_doctor: "bg-indigo-100 text-indigo-700 border-indigo-200",
  doctor_opened_report: "bg-cyan-100 text-cyan-700 border-cyan-200",
  report_in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
  report_drafted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  report_finalized: "bg-purple-100 text-purple-700 border-purple-200",
  verification_pending: "bg-pink-100 text-pink-700 border-pink-200",
  report_verified: "bg-green-100 text-green-700 border-green-200 shadow-sm",
  report_rejected: "bg-red-100 text-red-700 border-red-200",
  revert_to_radiologist: "bg-amber-100 text-amber-700 border-amber-200",
  report_completed: "bg-slate-200 text-slate-700 border-slate-300",
  final_report_downloaded: "bg-primary/10 text-primary border-primary/20",
  archived: "bg-muted text-muted-foreground grayscale",
  
  FREE_POOL: "bg-muted text-muted-foreground",
  ASSIGNED: "bg-indigo-50 text-indigo-700 border-indigo-100",
  IN_REPORTING: "bg-yellow-50 text-yellow-700 border-yellow-100",
  SUBMITTED: "bg-primary/10 text-primary border-primary/20",
  FINALIZED: "bg-green-50 text-green-700 border-green-100",
};

/** All statuses that a radiologist can see in their worklist. */
export const RADIOLOGIST_WORKLIST_STATES: WorkflowStatus[] = [
  "assigned_to_doctor",
  "doctor_opened_report",
  "report_in_progress",
  "report_drafted",
  "revert_to_radiologist"
];

/** All statuses that require verification/QC. */
export const VERIFICATION_WORKLIST_STATES: WorkflowStatus[] = [
  "verification_pending",
  "report_finalized"
];

/** Permission logic... (simplified for now, usually managed on backend) */
export function canTransition(from: string, to: string): boolean {
    return true; // Rely on backend for enforcement
}
