import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  reportsService, 
  studiesService, 
  verificationService, 
  sharingService 
} from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { useStudioStore } from "@/lib/stores/studioStore";
import {
  WORKFLOW_STATUS,
  WORKFLOW_LABELS,
  WORKFLOW_TONE
} from "@/lib/workflow";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import { ViewerFrame } from "@/components/workflow/ViewerFrame";
import { ReportEditor } from "@/components/workflow/ReportEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CheckCircle2, 
  FileCheck2, 
  History, 
  Loader2, 
  RotateCcw, 
  Send, 
  UserPlus, 
  MessageSquare, 
  Paperclip, 
  Clock, 
  ShieldCheck, 
  XCircle,
  Share2,
  Lock as LockIcon,
  Unlock,
  BookOpen,
  Info
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/app/studies/$studyId")({ component: StudyWorkspace });

function StudyWorkspace() {
  const { studyId } = Route.useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  
  const { 
    loadStudy, 
    clearStudy, 
    study, 
    notes, 
    attachments, 
    timeline, 
    isLoading,
    isLocked,
    verificationRecords,
    shares,
    reportVersions,
    printHistory,
    addNote,
    uploadAttachment
  } = useStudioStore();

  const userId = user?.id ?? "";
  const roles = user?.roles || [];
  
  // Load data on mount
  useEffect(() => {
    loadStudy(studyId);
    return () => clearStudy();
  }, [studyId]);

  const isAssignee = !!study?.assigneeId && study.assigneeId === userId;
  
  // ---- Auto-lock for assignee
  useEffect(() => {
    if (study && isAssignee && !isLocked && study.status !== 'report_completed') {
       acquireLock().catch(() => toast.error("Study is locked by another user."));
    }
    return () => { if (isLocked) releaseLock(); };
  }, [study?.status, isAssignee]);

  // ---- Draft state
  const [draftHtml, setDraftHtml] = useState<string>("");
  const [draftText, setDraftText] = useState<string>("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (study && !seededRef.current) {
      // Fetch report draft if exists
      reportsService.get(studyId).then(res => {
         const seed = res.draft?.contentHtml ?? res.latest?.contentHtml ?? "";
         setDraftHtml(seed);
         seededRef.current = true;
      });
    }
  }, [study]);

  const saveDraft = useMutation({
    mutationFn: ({ html, text }: { html: string; text: string }) =>
      reportsService.saveDraft(studyId, html, text),
    onSuccess: () => setSavedAt(new Date()),
  });

  useEffect(() => {
    if (!seededRef.current || !study || study.status === "report_completed") return;
    if (!isAssignee) return;
    const t = setTimeout(() => {
      if (draftHtml) saveDraft.mutate({ html: draftHtml, text: draftText });
    }, 2000);
    return () => clearTimeout(t);
  }, [draftHtml, draftText]);

  // ---- Actions
  const submitReport = useMutation({
    mutationFn: () => reportsService.submit(studyId),
    onSuccess: () => {
      toast.success("Report submitted for verification");
      loadStudy(studyId);
    },
  });

  const verifyReport = useMutation({
    mutationFn: (notes?: string) => verificationService.verify(studyId, notes),
    onSuccess: () => {
      toast.success("Report verified and finalized");
      loadStudy(studyId);
    },
  });

  const rejectReport = useMutation({
    mutationFn: (data: { rejectionReason: string }) => verificationService.reject(studyId, data),
    onSuccess: () => {
      toast.success("Report rejected and returned to radiologist");
      loadStudy(studyId);
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
         <Loader2 className="h-10 w-10 text-primary animate-spin" />
         <div className="text-center">
            <h2 className="text-xl font-bold">Synchronizing Intelligence</h2>
            <p className="text-muted-foreground">Fetching DICOM series and clinical history...</p>
         </div>
      </div>
    );
  }

  if (!study) return null;

  const editorReadOnly = !isAssignee || study.status === "report_completed" || study.status === "verification_pending";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* High-Density Workstation Header */}
      <header className="h-16 px-6 border-b bg-card/80 backdrop-blur-xl flex items-center justify-between z-20">
         <div className="flex items-center gap-6">
            <Link to="/app/studies" className="text-muted-foreground hover:text-foreground transition-colors">
               <ArrowLeft className="h-5 w-5" />
            </Link>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex flex-col">
               <div className="flex items-center gap-3">
                  <h1 className="text-lg font-black tracking-tight">{study.patientName}</h1>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary">{study.patientId}</Badge>
               </div>
               <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                  <span>{study.modality}</span>
                  <span>/</span>
                  <span>{study.bodyPart}</span>
                  <span>/</span>
                  <span>{study.accessionNumber}</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
               {isLocked ? (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5 py-1 px-3 rounded-full">
                     <LockIcon className="h-3 w-3" /> Locked for editing
                  </Badge>
               ) : (
                  <Badge variant="outline" className="text-muted-foreground/50 gap-1.5 py-1 px-3 rounded-full border-dashed">
                     <Unlock className="h-3 w-3" /> Read-only mode
                  </Badge>
               )}
            </div>
            
            <div className="flex items-center gap-2">
               <StatusBadge status={study.status} />
               
               {isAssignee && study.status === 'assigned_to_doctor' && (
                  <Button size="sm" className="rounded-full shadow-lg shadow-primary/20" onClick={() => submitReport.mutate()} disabled={submitReport.isPending}>
                     <Send className="h-4 w-4 mr-2" />
                     Submit Findings
                  </Button>
               )}

               {roles.includes('verifier') && study.status === 'verification_pending' && (
                  <>
                     <Button size="sm" variant="outline" className="rounded-full text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => rejectReport.mutate({ rejectionReason: "Incorrect findings" })}>
                        <XCircle className="h-4 w-4 mr-2" /> Reject
                     </Button>
                     <Button size="sm" className="rounded-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20" onClick={() => verifyReport.mutate()}>
                        <ShieldCheck className="h-4 w-4 mr-2" /> Verify & Authorize
                     </Button>
                  </>
               )}
               
               <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <Share2 className="h-4 w-4" />
               </Button>
            </div>
         </div>
      </header>

      {/* Main Workspace Split */}
      <div className="flex-1 flex min-h-0">
         {/* Left: Interactive DICOM Viewer */}
         <section className="flex-1 bg-black overflow-hidden relative">
            <ViewerFrame studyId={study.id} studyInstanceUID={study.studyInstanceUID} />
            
            {/* Viewer HUD */}
            <div className="absolute bottom-6 left-6 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white space-y-1 select-none pointer-events-none">
               <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Intelligence Node</div>
               <div className="text-xs font-bold">Orthanc v1.12-Alpha Integration</div>
               <div className="text-[10px] text-primary font-bold">W/L: Auto • Zoom: 100%</div>
            </div>
         </section>

         {/* Right: Intelligence & Reporting Panels */}
         <aside className="w-[480px] flex flex-col border-l bg-card shadow-2xl z-10">
            <Tabs defaultValue="report" className="flex-1 flex flex-col min-h-0">
               <TabsList className="h-12 bg-muted/30 rounded-none border-b px-2 gap-1">
                  <TabsTrigger value="report" className="flex-1 gap-2 text-xs font-bold uppercase tracking-tighter">
                     <FileCheck2 className="h-3.5 w-3.5" /> Findings
                  </TabsTrigger>
                  <TabsTrigger value="intelligence" className="flex-1 gap-2 text-xs font-bold uppercase tracking-tighter">
                     <BookOpen className="h-3.5 w-3.5" /> Intelligence
                     {notes.length > 0 && <Badge className="h-4 px-1 text-[9px] min-w-[16px] flex justify-center">{notes.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="flex-1 gap-2 text-xs font-bold uppercase tracking-tighter">
                     <History className="h-3.5 w-3.5" /> Audit
                  </TabsTrigger>
               </TabsList>

               <TabsContent value="report" className="flex-1 flex flex-col min-h-0 p-0 m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="flex-1 p-6">
                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Radiological Findings</h3>
                           <div className="text-[10px] font-bold text-muted-foreground italic">
                              {saveDraft.isPending ? "Syncing..." : savedAt ? `Last Sync: ${savedAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : "Auto-save active"}
                           </div>
                        </div>
                        
                        <ReportEditor 
                          initialHtml={draftHtml}
                          readOnly={editorReadOnly}
                          onChange={(html, text) => { setDraftHtml(html); setDraftText(text); }}
                        />
                        
                        {/* Summary Block */}
                        <div className="p-4 rounded-xl bg-muted/30 border border-dashed text-xs space-y-2">
                           <div className="flex items-center gap-2 font-bold text-muted-foreground uppercase tracking-widest">
                              <Info className="h-3 w-3" /> Protocol Instructions
                           </div>
                           <p className="text-muted-foreground leading-relaxed">
                              Standard {study.modality} protocol applied. Ensure mention of all secondary findings and incidentalomas. Confirm Patient MRN matches DICOM header.
                           </p>
                        </div>
                     </div>
                  </ScrollArea>
               </TabsContent>

               <TabsContent value="intelligence" className="flex-1 flex flex-col min-h-0 p-0 m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="flex-1 p-6">
                     <div className="space-y-8">
                        {/* Clinical Notes Section */}
                        <section className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-sm font-black uppercase tracking-widest">Clinical Observations</h3>
                              <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-7 text-[10px] font-black uppercase"
                                 onClick={() => {
                                    const content = prompt("Enter clinical note:");
                                    if (content) addNote(content, "clinical");
                                 }}
                               >
                                 Add Note
                               </Button>
                           </div>
                           
                           <div className="space-y-3">
                              {notes.map(n => (
                                 <div key={n.id} className="p-3 rounded-2xl bg-muted/30 border text-xs relative group">
                                    <div className="flex items-center justify-between mb-1.5">
                                       <span className="font-black text-primary uppercase text-[10px]">{n.authorName}</span>
                                       <span className="text-[9px] text-muted-foreground font-bold">{new Date(n.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed font-medium">{n.content}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                       <Badge variant="secondary" className="px-1 py-0 text-[8px] font-black uppercase">{n.noteType}</Badge>
                                    </div>
                                 </div>
                              ))}
                              {notes.length === 0 && (
                                 <div className="py-8 text-center border border-dashed rounded-2xl">
                                    <p className="text-xs text-muted-foreground font-bold">No clinical notes recorded</p>
                                 </div>
                              )}
                           </div>
                        </section>

                        <Separator className="bg-border/40" />

                        {/* Attachments Section */}
                        <section className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-sm font-black uppercase tracking-widest">Linked Attachments</h3>
                              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase">Upload PDF</Button>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              {attachments.map(a => (
                                 <div key={a.id} className="p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex items-center gap-3 cursor-pointer">
                                    <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-[10px]">PDF</div>
                                    <div className="flex-1 min-w-0">
                                       <div className="font-bold text-[10px] truncate uppercase tracking-tighter">{a.fileName}</div>
                                       <div className="text-[9px] text-muted-foreground font-bold">{(a.fileSizeBytes / 1024).toFixed(1)} KB</div>
                                    </div>
                                 </div>
                              ))}
                              {attachments.length === 0 && (
                                 <div className="col-span-2 py-4 text-center border border-dashed rounded-xl">
                                    <p className="text-[10px] text-muted-foreground font-bold">No documentation attached</p>
                                 </div>
                              )}
                           </div>
                        </section>

                        <Separator className="bg-border/40" />

                        {/* Verification History Section */}
                        <section className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-sm font-black uppercase tracking-widest">Verification Trail</h3>
                              <ShieldCheck className="h-4 w-4 text-success-foreground" />
                           </div>
                           <div className="space-y-3">
                              {verificationRecords.map(v => (
                                 <div key={v.id} className="p-3 rounded-2xl bg-success/5 border border-success/20 text-xs">
                                    <div className="flex items-center justify-between mb-1.5">
                                       <span className="font-bold text-success-foreground uppercase text-[10px]">{v.verifierName}</span>
                                       <span className="text-[9px] text-muted-foreground font-bold">{new Date(v.verifiedAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed font-medium capitalize">Action: {v.decision}</p>
                                    {v.notes && <p className="mt-1 text-muted-foreground italic">"{v.notes}"</p>}
                                 </div>
                              ))}
                              {verificationRecords.length === 0 && (
                                 <div className="py-4 text-center border border-dashed rounded-2xl">
                                    <p className="text-[10px] text-muted-foreground font-bold italic">Awaiting clinical authorization</p>
                                 </div>
                              )}
                           </div>
                        </section>

                        <Separator className="bg-border/40" />

                        {/* Shares Section */}
                        <section className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-sm font-black uppercase tracking-widest text-[#B388FF]">Active Shares</h3>
                              <Share2 className="h-4 w-4 text-[#B388FF]" />
                           </div>
                           <div className="space-y-2">
                              {shares.map(s => (
                                 <div key={s.id} className="p-2.5 rounded-xl border bg-muted/10 flex items-center justify-between gap-3 italic">
                                    <div className="flex-1 min-w-0">
                                       <div className="text-[10px] font-bold text-muted-foreground truncate uppercase">Token: {s.shareToken.slice(0, 8)}...</div>
                                       <div className="text-[9px] text-muted-foreground opacity-60 font-bold">Expires: {new Date(s.expiresAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-[10px] font-black text-[#B388FF] uppercase">{s.maxUses ? `${s.maxUses} Uses` : 'Infinite'}</div>
                                 </div>
                              ))}
                              {shares.length === 0 && <p className="text-[10px] text-muted-foreground font-bold italic text-center py-2">No active external links</p>}
                           </div>
                        </section>
                     </div>
                  </ScrollArea>
               </TabsContent>

               <TabsContent value="audit" className="flex-1 flex flex-col min-h-0 p-0 m-0 data-[state=inactive]:hidden">
                   <ScrollArea className="flex-1 p-6">
                      <div className="space-y-8">
                         <section>
                            <h3 className="text-sm font-black uppercase tracking-widest mb-4">Activity Timeline</h3>
                            <div className="space-y-6 relative border-l-2 border-primary/10 ml-3 pl-6 font-display">
                               {timeline.map(log => (
                                  <div key={log.id} className="relative">
                                     <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-background border-2 border-primary shadow-sm" />
                                     <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">{log.action.replace(/_/g, ' ')}</div>
                                     <div className="text-xs font-medium text-muted-foreground leading-tight">{log.details}</div>
                                     <div className="mt-1 flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">{log.userName}</span>
                                        <span className="text-[9px] text-muted-foreground/40">•</span>
                                        <span className="text-[9px] text-muted-foreground/40">{new Date(log.createdAt).toLocaleString()}</span>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </section>

                         {reportVersions.length > 0 && (
                            <section className="pt-6 border-t border-dashed">
                               <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-4">Report Versions</h3>
                               <div className="space-y-2">
                                  {reportVersions.map((v, i) => (
                                     <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/5 group hover:bg-muted/10 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                           <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">v{reportVersions.length - i}</div>
                                           <div className="text-[10px] font-bold uppercase tracking-tight">{new Date(v.createdAt).toLocaleString()}</div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                           <RotateCcw className="h-3 w-3" />
                                        </Button>
                                     </div>
                                  ))}
                               </div>
                            </section>
                         )}

                         {printHistory.length > 0 && (
                            <section className="pt-6 border-t border-dashed">
                               <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-4">Distribution & Print</h3>
                               <div className="space-y-2">
                                  {printHistory.map(p => (
                                     <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-primary/20 bg-primary/5 italic">
                                        <Clock className="h-3.5 w-3.5 text-primary/40" />
                                        <div className="text-[10px] font-medium text-muted-foreground">
                                           <span className="font-bold text-primary uppercase">{p.printType}</span> distributed by <span className="font-bold opacity-80">{p.userName}</span> at {new Date(p.createdAt).toLocaleTimeString()}
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </section>
                         )}
                      </div>
                   </ScrollArea>
                </TabsContent>
            </Tabs>
         </aside>
      </div>
    </div>
  );
}
