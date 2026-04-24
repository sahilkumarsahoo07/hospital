import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studiesService } from "@/lib/services";
import { useAuthStore } from "@/lib/stores/authStore";
import { ROLES } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload as UploadIcon, FileArchive, X, ShieldAlert, CheckCircle2, Cpu, Zap, Activity, HardDrive } from "lucide-react";

export const Route = createFileRoute("/app/upload")({ component: UploadCasesPage });

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function UploadCasesPage() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const qc = useQueryClient();
  const isHospital = roles.includes(ROLES.HOSPITAL);
  const isCentre = roles.includes(ROLES.DIAGNOSTIC_CENTRE);
  const allowed = isHospital || isCentre;

  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [referring, setReferring] = useState("");
  const [notes, setNotes] = useState("");

  const upload = useMutation({
    mutationFn: () =>
      studiesService.upload(files, {
        ...(isHospital ? { referringHospital: referring || undefined } : {}),
        ...(isCentre ? { referringCentre: referring || undefined } : {}),
        notes: notes || undefined,
      }),
    onSuccess: (res) => {
      toast.success(`Ingested ${res.uploaded} file(s) — Registry entry created`);
      setFiles([]);
      setReferring("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["studies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!allowed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        <div className="glass rounded-[2.5rem] p-12 text-center max-w-lg border-border/40">
           <ShieldAlert className="h-10 w-10 text-muted-foreground/20 mx-auto mb-6" />
           <h1 className="text-xl font-display font-black tracking-tight text-foreground uppercase">Ingestion Restricted</h1>
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-4 leading-relaxed">
             Direct DICOM ingestion is restricted to verified referring institutions and diagnostic facilities. Protocol bypass detected.
           </p>
           <Link to="/app" className="mt-8 inline-block text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-0.5 hover:text-foreground transition-all">
              Return to Control Center
           </Link>
        </div>
      </div>
    );
  }

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      return [...prev, ...arr.filter((f) => !seen.has(`${f.name}:${f.size}`))];
    });
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const referringLabel = isHospital ? "Referring Hospital" : "Diagnostic Centre";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      
      <main className="flex-1 overflow-auto p-8 relative z-10">
        <div className="max-w-[1200px] mx-auto space-y-10">
          
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                     <HardDrive className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Ingestion Terminal</span>
                     <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">PACS Bridge Ready</span>
                     </div>
                  </div>
               </div>
               <h1 className="text-5xl font-display font-black tracking-tighter text-foreground leading-[0.9]">
                  Upload Cases <span className="text-primary/40 block mt-2 text-3xl">DICOM Ingestion Protocol</span>
               </h1>
            </div>
            
            <div className="flex flex-col items-start lg:items-end gap-2 max-w-sm">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-relaxed lg:text-right">
                  Ingest verified DICOM studies or zipped archives into the global PAC registry. 
                  Automated routing to diagnostic workstreams initialized upon commit.
               </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-8">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                  className={`relative group rounded-[3rem] border-2 border-dashed p-16 text-center transition-all duration-500 overflow-hidden ${
                    dragOver ? "border-primary bg-primary/[0.03] scale-[0.98]" : "border-border/40 bg-background/40 backdrop-blur-xl"
                  }`}
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative z-10 space-y-6">
                    <div className="h-20 w-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-primary/20">
                       <UploadIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-sm font-black uppercase tracking-widest text-foreground">Deploy DICOM Payload</p>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Drag & drop .dcm or .zip archives into this coordinate</p>
                    </div>
                    <div className="h-px w-20 bg-border/40 mx-auto" />
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept=".dcm,.zip,application/dicom,application/zip"
                      className="hidden"
                      onChange={(e) => addFiles(e.target.files)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-6 rounded-xl border-border/40 bg-background/50 text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
                      onClick={() => inputRef.current?.click()}
                    >
                      Browse Protocol Files
                    </Button>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="glass rounded-[2.5rem] border-border/40 overflow-hidden shadow-premium animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between p-6 border-b border-border/40 bg-muted/20">
                      <div className="flex items-center gap-3">
                         <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">
                           {files.length} Payload Items Discovered <span className="opacity-30 mx-2">/</span> {formatBytes(totalSize)}
                         </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        onClick={() => setFiles([])}
                        disabled={upload.isPending}
                      >
                        Purge Queue
                      </Button>
                    </div>
                    <ul className="divide-y divide-border/10 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {files.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center justify-between px-6 py-4 hover:bg-primary/[0.02] transition-colors group">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-muted/20 border border-border/40 flex items-center justify-center shrink-0">
                               <FileArchive className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                               <span className="text-xs font-bold text-foreground truncate max-w-[300px]">{f.name}</span>
                               <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/30">{formatBytes(f.size)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            disabled={upload.isPending}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
             </div>

             <aside className="space-y-8">
                <div className="glass rounded-[2.5rem] border-border/40 p-8 space-y-8 bg-background/40 backdrop-blur-xl">
                   <div className="flex items-center gap-3">
                      <Zap className="h-3.5 w-3.5 text-primary/60" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Protocol Metadata</h3>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="referring" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{referringLabel}</Label>
                        <Input
                          id="referring"
                          value={referring}
                          onChange={(e) => setReferring(e.target.value)}
                          placeholder={`IDENTIFY ${referringLabel.toUpperCase()}`}
                          className="h-11 rounded-xl bg-background/50 border-border/40 text-xs font-bold placeholder:text-muted-foreground/20"
                          disabled={upload.isPending}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Clinical Intelligence</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Clinical history, urgency parameters, prior registry links..."
                          rows={5}
                          className="rounded-xl bg-background/50 border-border/40 text-xs font-bold placeholder:text-muted-foreground/20 resize-none"
                          disabled={upload.isPending}
                        />
                      </div>
                   </div>

                   <div className="pt-4 space-y-4">
                      <Button
                        className="w-full h-14 rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/20"
                        onClick={() => upload.mutate()}
                        disabled={files.length === 0 || upload.isPending}
                      >
                        {upload.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-3 animate-spin" /> Ingesting Payload...</>
                        ) : (
                          <><Zap className="h-4 w-4 mr-3" /> Commit to PACS</>
                        )}
                      </Button>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 text-center leading-relaxed">
                         Ingestion queue synchronized with global PACS bridge. Large study archives may require extended residency time.
                      </p>
                   </div>
                </div>

                {upload.isSuccess && (
                  <div className="glass rounded-[2rem] border-primary/20 bg-primary/5 p-6 animate-in zoom-in-95 duration-500">
                    <div className="flex items-start gap-4">
                       <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Protocol Committed</p>
                          <p className="text-[9px] font-bold text-primary/60 leading-relaxed uppercase">Studies successfully synchronized with the global worklist partition.</p>
                       </div>
                    </div>
                  </div>
                )}
             </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

