import { apiFetch } from "./api";
import type {
  AppUser,
  AuditLog,
  FollowUp,
  LandingCms,
  Organization,
  Patient,
  Report,
  ReportBranding,
  ReportBundle,
  ReportTemplate,
  Study,
  StudyAttachment,
  StudyListQuery,
  StudyListResponse,
  StudyNote,
  StudyShare,
  UserStatus,
  VerificationRecord,
  ViewerUrl,
} from "./types";
import type { WorkflowStatus } from "./workflow";
import type {
  BillingLine,
  BillingLinesQuery,
  BillingLinesResponse,
  RateCard,
  RateCardInput,
} from "./billing";
import type {
  IngestionListResponse,
  IngestionQuery,
  PacsEndpoint,
  PacsEndpointInput,
  PacsHealthSummary,
  PacsTestResult,
  SyncLogListResponse,
  SyncLogQuery,
} from "./pacs";
import type {
  BillingAnalytics,
  HospitalAnalytics,
  RadiologistAnalytics,
  SearchQuery,
  SearchResponse,
  SystemAnalytics,
} from "./analytics";
import { env } from "./env";

/* -------- Core Users & Auth -------- */

export const usersService = {
  list: (params?: { status?: UserStatus }) => {
    const q = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
    return apiFetch<AppUser[]>(`/users${q}`);
  },
  approve: (id: string) => apiFetch<AppUser>(`/users/${id}/approve`, { method: "POST" }),
  reject: (id: string, reason: string) =>
    apiFetch<AppUser>(`/users/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  suspend: (id: string) => apiFetch<AppUser>(`/users/${id}/suspend`, { method: "POST" }),
  listRadiologists: () => apiFetch<AppUser[]>(`/users?status=approved&role=radiologist`),
};

/* -------- Organizations & Branding -------- */

export const organizationsService = {
  list: () => apiFetch<Organization[]>("/organizations"),
  get: (id: string) => apiFetch<Organization>(`/organizations/${id}`),
  create: (body: Partial<Organization>) => apiFetch<Organization>("/organizations", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Organization>) => apiFetch<Organization>(`/organizations/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  getBranding: (orgId: string) => apiFetch<ReportBranding>(`/organizations/${orgId}/branding`),
  updateBranding: (orgId: string, body: Partial<ReportBranding>) => 
    apiFetch<ReportBranding>(`/organizations/${orgId}/branding`, { method: "PUT", body: JSON.stringify(body) }),
};

/* -------- Patients -------- */

export const patientsService = {
  list: (params?: { q?: string; orgId?: string; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.orgId) sp.set("orgId", params.orgId);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
    return apiFetch<{ items: Patient[]; total: number }>("/patients?" + sp.toString());
  },
  get: (id: string) => apiFetch<Patient>(`/patients/${id}`),
  update: (id: string, body: Partial<Patient>) => apiFetch<Patient>(`/patients/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

/* -------- Studies & Workflow -------- */

function buildStudyQuery(q?: StudyListQuery): string {
  if (!q) return "";
  const sp = new URLSearchParams();
  if (q.status?.length) sp.set("status", q.status.join(","));
  if (q.modality?.length) sp.set("modality", q.modality.join(","));
  if (q.bodyPart) sp.set("bodyPart", q.bodyPart);
  if (q.assigneeId) sp.set("assigneeId", q.assigneeId);
  if (q.mine) sp.set("mine", "true");
  if (q.from) sp.set("from", q.from);
  if (q.to) sp.set("to", q.to);
  if (q.q) sp.set("q", q.q);
  if (q.page) sp.set("page", String(q.page));
  if (q.pageSize) sp.set("pageSize", String(q.pageSize));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const studiesService = {
  list: (q?: StudyListQuery) => apiFetch<StudyListResponse>(`/studies${buildStudyQuery(q)}`),
  get: (id: string) => apiFetch<Study>(`/studies/${id}`),
  claim: (id: string) => apiFetch<Study>(`/studies/${id}/claim`, { method: "POST" }),
  assign: (id: string, assigneeId: string) =>
    apiFetch<Study>(`/studies/${id}/assign`, { method: "POST", body: JSON.stringify({ assigneeId }) }),
  open: (id: string) => apiFetch<Study>(`/studies/${id}/open`, { method: "POST" }),
  transition: (id: string, to: WorkflowStatus, extra?: any) =>
    apiFetch<Study>(`/studies/${id}/transition`, { method: "POST", body: JSON.stringify({ to, ...extra }) }),
  freePool: (modality?: string[]) => {
    const q = modality?.length ? `?modality=${modality.join(",")}` : "";
    return apiFetch<StudyListResponse>(`/studies/free-pool${q}`);
  },
  viewerUrl: (id: string) => apiFetch<ViewerUrl>(`/studies/${id}/viewer-url`),
};

/* -------- Notes & Attachments -------- */

export const notesService = {
  list: (studyId: string) => apiFetch<StudyNote[]>(`/studies/${studyId}/notes`),
  create: (studyId: string, body: { content: string; noteType?: string; parentId?: string; isPublic?: boolean }) =>
    apiFetch<StudyNote>(`/studies/${studyId}/notes`, { method: "POST", body: JSON.stringify(body) }),
  resolve: (studyId: string, noteId: string) => 
    apiFetch<StudyNote>(`/studies/${studyId}/notes/${noteId}/resolve`, { method: "PUT" }),
};

export const attachmentsService = {
  list: (studyId: string) => apiFetch<StudyAttachment[]>(`/studies/${studyId}/attachments`),
  upload: (studyId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch<StudyAttachment>(`/studies/${studyId}/attachments`, { method: "POST", body: fd });
  },
  delete: (studyId: string, id: string) => apiFetch<void>(`/studies/${studyId}/attachments/${id}`, { method: "DELETE" }),
};

/* -------- Audit & Timeline -------- */

export const auditService = {
  getTimeline: (studyId: string) => apiFetch<AuditLog[]>(`/studies/${studyId}/timeline`),
};

/* -------- Concurrency & Locks -------- */

export const locksService = {
  acquire: (studyId: string) => apiFetch<{ status: string; expiresAt: string }>(`/studies/${studyId}/lock`, { method: "POST" }),
  release: (studyId: string) => apiFetch<{ status: string }>(`/studies/${studyId}/lock/unlock`, { method: "POST" }),
};

/* -------- Verification & Review -------- */

export const verificationService = {
  list: (studyId: string) => apiFetch<VerificationRecord[]>(`/studies/${studyId}/verification`),
  verify: (studyId: string, notes?: string) => 
    apiFetch<VerificationRecord>(`/studies/${studyId}/verification/verify`, { method: "POST", body: JSON.stringify({ notes }) }),
  reject: (studyId: string, data: { rejectionReason: string; notes?: string; correctionInstructions?: string }) => 
    apiFetch<VerificationRecord>(`/studies/${studyId}/verification/reject`, { method: "POST", body: JSON.stringify(data) }),
};

/* -------- Sharing & Exports -------- */

export const sharingService = {
  list: (studyId: string) => apiFetch<StudyShare[]>(`/studies/${studyId}/shares`),
  create: (studyId: string, body: { expiresInDays?: number; password?: string; maxUses?: number }) => 
    apiFetch<StudyShare>(`/studies/${studyId}/shares`, { method: "POST", body: JSON.stringify(body) }),
  revoke: (studyId: string, shareId: string) => apiFetch<void>(`/studies/${studyId}/shares/${shareId}`, { method: "DELETE" }),
};

export const printService = {
  getHistory: (studyId: string) => apiFetch<any[]>(`/studies/${studyId}/print-history`),
  record: (studyId: string, reportId: string, printType: string) => 
    apiFetch<any>(`/studies/${studyId}/print-history`, { method: "POST", body: JSON.stringify({ reportId, printType }) }),
};

/* -------- Templates -------- */

export const templatesService = {
  list: (modality?: string) => apiFetch<ReportTemplate[]>(`/templates${modality ? `?modality=${modality}` : ""}`),
  create: (body: Partial<ReportTemplate>) => apiFetch<ReportTemplate>("/templates", { method: "POST", body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<void>(`/templates/${id}`, { method: "DELETE" }),
};

/* -------- Analytics & CMS -------- */

export const analyticsService = {
  system: () => apiFetch<SystemAnalytics>(`/analytics/system`),
  radiologists: () => apiFetch<RadiologistAnalytics[]>(`/analytics/radiologists`),
  hospitals: () => apiFetch<HospitalAnalytics[]>(`/analytics/hospitals`),
  billing: () => apiFetch<BillingAnalytics>(`/analytics/billing`),
};

export const cmsService = {
  getLanding: () => apiFetch<LandingCms>("/cms/landing"),
  saveLanding: (cms: Partial<LandingCms>) =>
    apiFetch<LandingCms>("/cms/landing", { method: "PUT", body: JSON.stringify(cms) }),
};

/* -------- Billing (Legacy name) -------- */

function buildBillingQuery(q?: BillingLinesQuery): string {
  if (!q) return "";
  const sp = new URLSearchParams();
  if (q.kind) sp.set("kind", q.kind);
  if (q.partyId) sp.set("partyId", q.partyId);
  if (q.studyId) sp.set("studyId", q.studyId);
  if (q.status?.length) sp.set("status", q.status.join(","));
  if (q.from) sp.set("from", q.from);
  if (q.to) sp.set("to", q.to);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const billingService = {
  listRateCards: (params?: { ownerRole?: string; ownerId?: string; active?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.ownerRole) sp.set("ownerRole", params.ownerRole);
    if (params?.ownerId) sp.set("ownerId", params.ownerId);
    if (typeof params?.active === "boolean") sp.set("active", String(params.active));
    const s = sp.toString();
    return apiFetch<RateCard[]>(`/billing/rate-cards${s ? `?${s}` : ""}`);
  },
  getRateCard: (id: string) => apiFetch<RateCard>(`/billing/rate-cards/${id}`),
  myRateCard: () => apiFetch<RateCard>(`/billing/my-rate-card`),
  createRateCard: (input: RateCardInput) =>
    apiFetch<RateCard>(`/billing/rate-cards`, { method: "POST", body: JSON.stringify(input) }),
  updateRateCard: (id: string, patch: Partial<RateCardInput>) =>
    apiFetch<RateCard>(`/billing/rate-cards/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteRateCard: (id: string) => apiFetch<void>(`/billing/rate-cards/${id}`, { method: "DELETE" }),

  listLines: (q?: BillingLinesQuery) =>
    apiFetch<BillingLinesResponse>(`/billing/lines${buildBillingQuery(q)}`),
  recalculate: (studyId: string) =>
    apiFetch<BillingLine[]>(`/billing/recalculate/${studyId}`, { method: "POST" }),
  markPaid: (id: string) =>
    apiFetch<BillingLine>(`/billing/lines/${id}/mark-paid`, { method: "POST" }),

  exportCsvUrl: (q: BillingLinesQuery & { kind: "PAYOUT" | "INVOICE" }) =>
    `${env.api.baseUrl}/billing/export${buildBillingQuery(q).replace(/^\?/, "?format=csv&")}`,
};

/* -------- PACS (Legacy name) -------- */

function buildIngestionQuery(q?: IngestionQuery): string {
  if (!q) return "";
  const sp = new URLSearchParams();
  if (q.endpointId) sp.set("endpointId", q.endpointId);
  if (q.status?.length) sp.set("status", q.status.join(","));
  if (q.from) sp.set("from", q.from);
  if (q.to) sp.set("to", q.to);
  if (q.q) sp.set("q", q.q);
  if (q.page) sp.set("page", String(q.page));
  if (q.pageSize) sp.set("pageSize", String(q.pageSize));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function buildLogsQuery(q?: SyncLogQuery): string {
  if (!q) return "";
  const sp = new URLSearchParams();
  if (q.endpointId) sp.set("endpointId", q.endpointId);
  if (q.level?.length) sp.set("level", q.level.join(","));
  if (q.from) sp.set("from", q.from);
  if (q.to) sp.set("to", q.to);
  if (q.page) sp.set("page", String(q.page));
  if (q.pageSize) sp.set("pageSize", String(q.pageSize));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const pacsService = {
  listEndpoints: () => apiFetch<PacsEndpoint[]>(`/pacs/endpoints`),
  getEndpoint: (id: string) => apiFetch<PacsEndpoint>(`/pacs/endpoints/${id}`),
  createEndpoint: (input: PacsEndpointInput) =>
    apiFetch<PacsEndpoint>(`/pacs/endpoints`, { method: "POST", body: JSON.stringify(input) }),
  updateEndpoint: (id: string, patch: Partial<PacsEndpointInput>) =>
    apiFetch<PacsEndpoint>(`/pacs/endpoints/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteEndpoint: (id: string) => apiFetch<void>(`/pacs/endpoints/${id}`, { method: "DELETE" }),
  testEndpoint: (id: string) =>
    apiFetch<PacsTestResult>(`/pacs/endpoints/${id}/test`, { method: "POST" }),
  syncEndpoint: (id: string) =>
    apiFetch<{ queued: true }>(`/pacs/endpoints/${id}/sync`, { method: "POST" }),
  enableEndpoint: (id: string) =>
    apiFetch<PacsEndpoint>(`/pacs/endpoints/${id}/enable`, { method: "POST" }),
  disableEndpoint: (id: string) =>
    apiFetch<PacsEndpoint>(`/pacs/endpoints/${id}/disable`, { method: "POST" }),

  listIngestion: (q?: IngestionQuery) =>
    apiFetch<IngestionListResponse>(`/pacs/ingestion${buildIngestionQuery(q)}`),
  listLogs: (q?: SyncLogQuery) =>
    apiFetch<SyncLogListResponse>(`/pacs/logs${buildLogsQuery(q)}`),
  health: () => apiFetch<PacsHealthSummary>(`/pacs/health`),
};

/* -------- Search (Legacy name) -------- */

function buildSearchQuery(q: SearchQuery): string {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  if (q.modality?.length) sp.set("modality", q.modality.join(","));
  if (q.status?.length) sp.set("status", q.status.join(","));
  if (q.from) sp.set("from", q.from);
  if (q.to) sp.set("to", q.to);
  if (q.page) sp.set("page", String(q.page));
  if (q.pageSize) sp.set("pageSize", String(q.pageSize));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const searchService = {
  search: (q: SearchQuery) => apiFetch<SearchResponse>(`/search${buildSearchQuery(q)}`),
};

/* -------- Legacy / Fallbacks -------- */

export const reportsService = {
  get: (studyId: string) => apiFetch<ReportBundle>(`/studies/${studyId}/report`),
  saveDraft: (studyId: string, contentHtml: string, contentText: string) =>
    apiFetch<Report>(`/studies/${studyId}/report`, {
      method: "PUT",
      body: JSON.stringify({ contentHtml, contentText }),
    }),
  submit: (studyId: string) =>
    apiFetch<Report>(`/studies/${studyId}/report/submit`, { method: "POST" }),
  versions: (studyId: string) => apiFetch<Report[]>(`/studies/${studyId}/report/versions`),
};

