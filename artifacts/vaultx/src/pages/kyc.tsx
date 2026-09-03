import { useState, useRef, useMemo } from "react";
import {
  Shield, Upload, CheckCircle, Clock, AlertTriangle, Camera, Search,
  ChevronDown, X, FileCheck, User, CreditCard, Image, ArrowRight,
  Check, ShieldCheck, AlertCircle,
} from "lucide-react";
import { useGetKycStatus, getGetKycStatusQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

const DOC_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID Card" },
  { value: "driver_license", label: "Driver's License" },
  { value: "residence_permit", label: "Residence Permit" },
];

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium",
  "Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei",
  "Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Chile","China","Colombia",
  "Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Georgia","Germany","Ghana",
  "Greece","Guatemala","Guinea","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya",
  "Kuwait","Laos","Latvia","Lebanon","Libya","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia",
  "Malta","Mauritius","Mexico","Moldova","Mongolia","Morocco","Mozambique","Myanmar","Namibia","Nepal",
  "Netherlands","New Zealand","Nicaragua","Niger","Nigeria","Norway","Oman","Pakistan","Panama","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia",
  "Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea","Spain","Sri Lanka","Sudan",
  "Sweden","Switzerland","Syria","Taiwan","Tanzania","Thailand","Togo","Trinidad and Tobago","Tunisia",
  "Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

/* ─── Country Selector ──────────────────────────────────────────────────── */
function CountrySelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase())), [search]);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className={cn("w-full h-11 px-3 flex items-center justify-between rounded-xl border text-sm transition-colors", open ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40", value ? "text-foreground" : "text-muted-foreground")}>
        <span className="truncate">{value || "Select your country"}</span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {value && <button type="button" onClick={e => { e.stopPropagation(); onChange(""); }} className="p-0.5 rounded hover:bg-muted"><X size={12} className="text-muted-foreground" /></button>}
          <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search countries…" className="w-full h-9 pl-8 pr-3 text-sm bg-muted/50 border border-transparent rounded-lg focus:outline-none focus:border-primary/40" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No countries found</p> : filtered.map(c => (
              <button key={c} type="button" onClick={() => { onChange(c); setOpen(false); setSearch(""); }} className={cn("w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors", value === c && "bg-primary/8 font-medium text-primary")}>{c}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Image Upload Box ──────────────────────────────────────────────────── */
function ImageUploadBox({ label, hint, badge, value, onChange }: { label: string; hint: string; badge?: string; value: string | null; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        {badge && <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", badge === "Required" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{badge}</span>}
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">{hint}</p>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-border aspect-[3/2]">
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button onClick={() => onChange(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"><X size={12} /></button>
          <div className="absolute bottom-2 left-2 bg-emerald-500 rounded-full p-1 shadow"><CheckCircle size={12} className="text-white" /></div>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} className="w-full aspect-[3/2] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2.5 hover:border-primary/50 hover:bg-primary/3 transition-all active:scale-[0.99]">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center"><Camera size={20} className="text-muted-foreground" /></div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Tap to upload</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">JPG or PNG · Max 5 MB</p>
          </div>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
    </div>
  );
}

/* ─── Step progress bar ─────────────────────────────────────────────────── */
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div className={cn("v3-step-dot shrink-0", i < current ? "completed" : i === current ? "active" : "pending")} />
          {i < total - 1 && <div className={cn("h-px flex-1", i < current ? "bg-primary/40" : "bg-border")} />}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   KYC — WEXORA V3
   Guided verification journey with step progress
   ═══════════════════════════════════════════════════════════════════════════ */
export default function KycPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [fullLegalName, setFullLegalName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [country, setCountry] = useState("");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const { data: kycStatus, isLoading } = useGetKycStatus({ query: { queryKey: getGetKycStatusQueryKey(), staleTime: 30000 } });

  const handleSubmit = async () => {
    if (!documentType || !fullLegalName || !documentNumber || !country || !frontImage || !selfieImage) {
      toast({ title: "Missing fields", description: "Please fill all required fields and upload your ID front + selfie", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/kyc/submit", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentType, fullLegalName, documentNumber, country, frontImageUrl: frontImage, backImageUrl: backImage || undefined, selfieUrl: selfieImage }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message ?? "Submission failed"); }
      toast({ title: "KYC Submitted!", description: "We'll review your documents within 24–48 hours" });
      queryClient.invalidateQueries({ queryKey: getGetKycStatusQueryKey() });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  if (isLoading) return (
    <AppLayout fullBleed>
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </AppLayout>
  );

  const status = (kycStatus as any)?.status ?? "none";

  /* ─── Approved state ──────────────────────────────────────────────────── */
  if (status === "approved") return (
    <AppLayout fullBleed>
      <div className="max-w-lg mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={36} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Identity Verified</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Your identity has been successfully verified. Your account has full access.</p>
        <div className="v3-card p-5 mt-6 text-left space-y-3 max-w-sm mx-auto">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Document</span><span className="font-semibold capitalize">{(kycStatus as any)?.documentType?.replace(/_/g, " ")}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Verified on</span><span className="font-semibold">{(kycStatus as any)?.reviewedAt ? formatDate((kycStatus as any).reviewedAt) : "—"}</span></div>
        </div>
      </div>
    </AppLayout>
  );

  /* ─── Pending state ───────────────────────────────────────────────────── */
  if (status === "pending") return (
    <AppLayout fullBleed>
      <div className="max-w-lg mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Clock size={36} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Under Review</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Your documents are being reviewed. This typically takes 24–48 hours.</p>
        <div className="v3-card p-5 mt-6 text-left space-y-3 max-w-sm mx-auto">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Submitted</span><span className="font-semibold">{(kycStatus as any)?.submittedAt ? formatDate((kycStatus as any).submittedAt) : "—"}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Document</span><span className="font-semibold capitalize">{(kycStatus as any)?.documentType?.replace(/_/g, " ")}</span></div>
        </div>
      </div>
    </AppLayout>
  );

  const canSubmit = !submitting && documentType && fullLegalName && documentNumber && country && frontImage && selfieImage;

  return (
    <AppLayout fullBleed>
      <div className="max-w-lg mx-auto px-4 py-5 pb-28 space-y-5">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="v3-gradient rounded-2xl p-5 text-white animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base">Identity Verification</h2>
              <p className="text-[11px] text-white/50 mt-0.5">Complete KYC to unlock full account features</p>
            </div>
          </div>
        </div>

        {/* ── Step progress ────────────────────────────────────── */}
        <div>
          <StepProgress current={step} total={3} />
          <div className="flex justify-between mt-2">
            {["Personal", "Document", "Upload"].map((label, i) => (
              <span key={label} className={cn("text-[10px] font-medium", i <= step ? "text-primary" : "text-muted-foreground")}>{label}</span>
            ))}
          </div>
        </div>

        {/* ── Rejection notice ─────────────────────────────────── */}
        {status === "rejected" && (
          <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 flex gap-2.5">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-600">Previous submission rejected</p>
              <p className="text-xs text-red-500 mt-0.5">{(kycStatus as any)?.rejectionReason ?? "Please resubmit with clearer, well-lit images."}</p>
            </div>
          </div>
        )}

        {/* ── Step 0: Personal Info ────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="v3-card p-5 space-y-4">
              <div className="flex items-center gap-2.5 mb-1">
                <User size={16} className="text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Personal Information</h3>
              </div>
              <div>
                <Label className="text-sm font-medium">Full Legal Name <span className="text-destructive">*</span></Label>
                <Input value={fullLegalName} onChange={e => setFullLegalName(e.target.value)} placeholder="As it appears on your ID" className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label className="text-sm font-medium">Country <span className="text-destructive">*</span></Label>
                <div className="mt-1.5"><CountrySelector value={country} onChange={setCountry} /></div>
              </div>
            </div>
            <Button onClick={() => setStep(1)} disabled={!fullLegalName || !country} className="w-full h-12 rounded-xl font-bold">
              Continue <ArrowRight size={15} className="ml-1" />
            </Button>
          </div>
        )}

        {/* ── Step 1: Document Details ─────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="v3-card p-5 space-y-4">
              <div className="flex items-center gap-2.5 mb-1">
                <CreditCard size={16} className="text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Document Details</h3>
              </div>
              <div>
                <Label className="text-sm font-medium">Document Type <span className="text-destructive">*</span></Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Select document type" /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Document Number <span className="text-destructive">*</span></Label>
                <Input value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} placeholder="Enter your document number" className="mt-1.5 h-11 rounded-xl" />
              </div>
            </div>
            <div className="v3-card-sunken p-4">
              <p className="text-xs font-bold text-foreground mb-2">Photo Guidelines</p>
              <div className="space-y-1.5">
                {["Ensure all four corners of the document are visible", "Use good lighting — avoid shadows and glare", "Images must be sharp and in focus", "Do not use screenshots or photocopies"].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-[9px] font-bold text-primary">{i + 1}</span></div>
                    <p className="text-[11px] text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-12 rounded-xl font-semibold"><ArrowRight size={15} className="mr-1 rotate-180" /> Back</Button>
              <Button onClick={() => setStep(2)} disabled={!documentType || !documentNumber} className="flex-1 h-12 rounded-xl font-bold">Continue <ArrowRight size={15} className="ml-1" /></Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Upload Documents ─────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="v3-card p-5 space-y-5">
              <div className="flex items-center gap-2.5 mb-1">
                <Image size={16} className="text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Document Images</h3>
              </div>
              <ImageUploadBox label="Front of Document" hint="Clear photo of the front side of your ID" badge="Required" value={frontImage} onChange={setFrontImage} />
              <ImageUploadBox label="Back of Document" hint="Clear photo of the back side (required for ID cards)" badge="Optional" value={backImage} onChange={setBackImage} />
              <ImageUploadBox label="Selfie with Document" hint="Hold your ID next to your face — both must be visible" badge="Required" value={selfieImage} onChange={setSelfieImage} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl font-semibold"><ArrowRight size={15} className="mr-1 rotate-180" /> Back</Button>
              <Button onClick={handleSubmit} disabled={!canSubmit} className="flex-1 h-12 rounded-xl font-bold">
                {submitting ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</span> : <><Upload size={15} className="mr-1" /> Submit</>}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Your documents are encrypted and processed securely.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
