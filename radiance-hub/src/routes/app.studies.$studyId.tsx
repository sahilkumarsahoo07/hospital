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
  Info,
  Activity,
  Cpu,
  Fingerprint
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
    uploadAttachment,
    acquireLock,
    releaseLock
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
  }, [study?.status, isAssignee, isLocked]);

  // ---- Draft state
  const [draftHtml, setDraftHtml] = useState<string>("");
  const [draftText, setDraftText] = useState<string>("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (study && !seededRef.current) {
      reportsService.get(studyId).then(res => {
         const seed = res.draft?.contentHtml ?? res.latest?.contentHtml ?? "";
         setDraftHtml(seed);
         seededRef.current = true;
      });
    }
  }, [study, studyId]);

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
  }, [draftHtml, draftText, study, isAssignee]);

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
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-background relative overflow-hidden">
         <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
         <div className="h-16 w-16 rounded-[2rem] bg-primary/10 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-primary/20 rounded-[2rem] animate-ping" />
            <Loader2 className="h-8 w-8 text-primary animate-spin relative z-10" />
         </div>
         <div className="text-center space-y-1">
            <h2 className="text-lg font-display font-black tracking-tight uppercase">Synchronizing Intelligence</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Fetching DICOM series and clinical history...</p>
         </div>
      </div>
    );
  }

  if (!study) return null;

  const editorReadOnly = !isAssignee || study.status === "report_completed" || study.status === "verification_pending";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />
      
      {/* High-Density Workstation Header */}
      <header className="h-14 px-6 border-b border-border/40 bg-background/50 backdrop-blur-xl flex items-center justify-between z-30">
         <div className="flex items-center gap-6">
            <Link to="/app/studies" className="h-8 w-8 rounded-lg bg-muted/20 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all">
               <ArrowLeft className="h-4 w-4" />
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-col">
               <div className="flex items-center gap-3">
                  <h1 className="text-sm font-black tracking-tight uppercase">{study.patientName}</h1>
                  <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest border-primary/20 text-primary py-0 h-4">{study.patientId}</Badge>
               </div>
               <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2 mt-0.5">
                  <span className="text-primary/60">{study.modality}</span>
                  <div className="h-1 w-1 rounded-full bg-border" />
                  <span>{study.bodyPart}</span>
                  <div className="h-1 w-1 rounded-full bg-border" />
                  <span className="font-medium tracking-normal text-[8px]">ACC: {study.accessionNumber}</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted/10 px-3 py-1 rounded-full border border-border/40">
               {isLocked ? (
                  <div className="flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-amber-600/80">Active Protocol Lock</span>
                  </div>
               ) : (
                  <div className="flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Passive Insight Mode</span>
                  </div>
               )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
               <StatusBadge status={study.status} />
               
               {isAssignee && study.status === 'assigned_to_doctor' && (
                  <Button size="sm" className="h-8 rounded-xl bg-foreground text-background hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest px-4 shadow-xl shadow-primary/10" onClick={() => submitReport.mutate()} disabled={submitReport.isPending}>
                     <Send className="h-3.5 w-3.5 mr-2" />
                     Commit Findings
                  </Button>
               )}

               {roles.includes('verifier') && study.status === 'verification_pending' && (
                  <div className="flex items-center gap-2">
                     <Button size="sm" variant="outline" className="h-8 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10 text-[10px] font-black uppercase tracking-widest px-4" onClick={() => rejectReport.mutate({ rejectionReason: "Incorrect findings" })}>
                        <XCircle className="h-3.5 w-3.5 mr-2" /> Reject
                     </Button>
                     <Button size="sm" className="h-8 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 text-[10px] font-black uppercase tracking-widest px-4" onClick={() => verifyReport.mutate()}>
                        <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Authorize
                     </Button>
                  </div>
               )}
               
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted/30">
                  <Share2 className="h-3.5 w-3.5" />
               </Button>
            </div>
         </div>
      </header>

      {/* Main Workspace Split */}
      <div className="flex-1 flex min-h-0">
         {/* Left: Interactive DICOM Viewer */}
         <section className="flex-1 bg-[#050505] overflow-hidden relative">
            <ViewerFrame studyId={study.id} studyInstanceUID={study.studyInstanceUID} />
            
            {/* Viewer HUD */}
            <div className="absolute bottom-6 left-6 p-4 rounded-2xl glass-dark border border-white/5 text-white/80 space-y-1.5 select-none pointer-events-none transition-opacity duration-1000">
               <div className="flex items-center gap-2">
                  <div className="h-1 w-8 bg-primary rounded-full animate-pulse" />
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Intelligence Node 4.0</div>
               </div>
               <div className="flex items-center gap-3">
                  <Cpu className="h-3.5 w-3.5 text-primary/60" />
                  <div className="text-[11px] font-display font-black tracking-tight uppercase">Radiance Engine Alpha</div>
               </div>
               <div className="flex items-center gap-4 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                     <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">W/L:</span>
                     <span className="text-[9px] font-black text-primary">AUTO</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">MAG:</span>
                     <span className="text-[9px] font-black text-primary">1.0x</span>
                  </div>
               </div>
            </div>
         </section>

         {/* Right: Intelligence & Reporting Panels */}
         <aside className="w-[440px] flex flex-col border-l border-border/40 bg-card/30 backdrop-blur-2xl z-20 shadow-2xl">
            <Tabs defaultValue="report" className="flex-1 flex flex-col min-h-0">
               <TabsList className="h-11 bg-muted/20 rounded-none border-b border-border/40 px-2 gap-1">
                  <TabsTrigger value="report" className="flex-1 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest gap-2">
                     <FileCheck2 className="h-3 w-3" /> Findings
                  </TabsTrigger>
                  <TabsTrigger value="intelligence" className="flex-1 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest gap-2">
                     <BookOpen className="h-3 w-3" /> Clinical
                     {notes.length > 0 && <Badge className="h-3.5 px-1 text-[8px] min-w-[14px] flex justify-center bg-primary text-primary-foreground border-none font-black">{notes.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="flex-1 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest gap-2">
                     <History className="h-3 w-3" /> Audit
                  </TabsTrigger>
               </TabsList>

               <TabsContent value="report" className="flex-1 flex flex-col min-h-0 p-0 m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="flex-1">
                     <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Fingerprint className="h-3.5 w-3.5 text-primary/40" />
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Diagnostic Log</h3>
                           </div>
                           <div className="text-[9px] font-black text-muted-foreground italic uppercase tracking-widest opacity-40">
                              {saveDraft.isPending ? "Syncing Registry..." : savedAt ? `Synced ${savedAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : "Autonomous Sync Active"}
                           </div>
                        </div>
                        
                        <div className="glass rounded-[1.5rem] border-border/40 p-4 bg-background/40">
                           <ReportEditor 
                             initialHtml={draftHtml}
                             readOnly={editorReadOnly}
                             onChange={(html, text) => { setDraftHtml(html); setDraftText(text); }}
                           />
                        </div>
                        
                        {/* Summary Block */}
                        <div className="p-5 rounded-[1.5rem] bg-primary/5 border border-primary/10 space-y-3">
                           <div className="flex items-center gap-2 font-black text-[10px] text-primary uppercase tracking-[0.2em]">
                              <Info className="h-3 w-3" /> Protocol Instructions
                           </div>
                           <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                              Standardized {study.modality} protocol in effect. Report must include patient-specific anatomy verification and detailed analysis of incidental findings.
                           </p>
                        </div>
                     </div>
                  </ScrollArea>
               </TabsContent>

               <TabsContent value="intelligence" className="flex-1 flex flex-col min-h-0 p-0 m-0 data-[state=inactive]:hidden">
                  <ScrollArea className="flex-1">
                     <div className="p-6 space-y-8">
                        {/* Clinical Notes Section */}
                        <section className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Clinical Context</h3>
                              <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary/5 hover:bg-primary/10 text-primary"
                                 onClick={() => {
                                    const content = prompt("Enter clinical node insight:");
                                    if (content) addNote(content, "clinical");
                                 }}
                               >
                                 Push Insight
                               </Button>
                           </div>
                           
                           <div className="space-y-3">
                              {notes.map(n => (
                                 <div key={n.id} className="p-4 rounded-[1.25rem] bg-muted/20 border border-border/40 text-xs relative group">
                                    <div className="flex items-center justify-between mb-2">
                                       <span className="font-black text-primary uppercase text-[9px] tracking-widest">{n.authorName}</span>
                                       <span className="text-[8px] text-muted-foreground font-black uppercase opacity-40">{new Date(n.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{n.content}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                       <Badge className="px-2 py-0 h-3.5 text-[8px] font-black uppercase bg-primary/10 text-primary border-none tracking-tighter">{n.noteType}</Badge>
                                    </div>
                                 </div>
                              ))}
                              {notes.length === 0 && (
                                 <div className="py-10 text-center border border-dashed border-border/40 rounded-[1.25rem]">
                                    <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">No Context Recorded</p>
                                 </div>
                              )}
                           </div>
                        </section>

                        <Separator className="bg-border/20" />

                        {/* Attachments Section */}
                        <section className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Documentation Nodes</h3>
                              <Button variant="ghost" size="sm" className="h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest bg-muted/20">Ingest File</Button>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              {attachments.map(a => (
                                 <div key={a.id} className="p-3 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-all flex items-center gap-3 cursor-pointer group">
                                    <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive font-black text-[8px] group-hover:scale-110 transition-transform">PDF</div>
                                    <div className="flex-1 min-w-0">
                                       <div className="font-black text-[9px] truncate uppercase tracking-tighter">{a.fileName}</div>
                                       <div className="text-[8px] text-muted-foreground/40 font-black uppercase">{(a.fileSizeBytes / 1024).toFixed(0)} KB</div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </section>
                     </div>
                  </ScrollArea>
               </TabsContent>

               <TabsContent value="audit" className="flex-1 flex flex-col min-h-0 p-0 m-0 data-[state=inactive]:hidden">
                   <ScrollArea className="flex-1">
                      <div className="p-6 space-y-8">
                         <section>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-6 px-2">Access & Activity Stream</h3>
                            <div className="space-y-8 relative border-l border-border/40 ml-4 pl-8">
                               {timeline.map(log => (
                                  <div key={log.id} className="relative">
                                     <div className="absolute -left-[37px] top-0.5 h-4 w-4 rounded-full bg-background border-2 border-primary shadow-lg flex items-center justify-center">
                                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                     </div>
                                     <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">{log.action.replace(/_/g, ' ')}</div>
                                     <div className="text-[11px] font-medium text-muted-foreground leading-snug">{log.details}</div>
                                     <div className="mt-2 flex items-center gap-3">
                                        <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">{log.userName}</span>
                                        <div className="h-1 w-1 rounded-full bg-border" />
                                        <span className="text-[8px] text-muted-foreground/30 font-black uppercase">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </section>

                         {reportVersions.length > 0 && (
                            <section className="pt-8 border-t border-dashed border-border/40">
                               <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-4 px-2">Diagnostic Iterations</h3>
                               <div className="space-y-2">
                                  {reportVersions.map((v, i) => (
                                     <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/5 group hover:bg-muted/10 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                           <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary">v{reportVersions.length - i}</div>
                                           <div className="text-[9px] font-black uppercase tracking-tighter opacity-60">{new Date(v.createdAt).toLocaleString()}</div>
                                        </div>
                                        <RotateCcw className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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

