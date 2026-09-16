import { useState } from "react";
import {
  Check, X, ShieldCheck, Shield, ShieldAlert, Clock, Search,
  ChevronLeft, FileText, Eye, User, Mail, Hash, Calendar,
  AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAdminGetKycSubmissions, getAdminGetKycSubmissionsQueryKey,
  useAdminApproveKyc, useAdminRejectKyc,
  type AdminGetKycSubmissionsStatus,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/format";

type FilterTab = "pending" | "approved" | "rejected" | "all";

const FILTERS: { value: FilterTab; label: string; icon: React.ElementType }[] = [
  { value: "pending", label: "Pending", icon: Clock },
  { value: "approved", label: "Approved", icon: CheckCircle2 },
  { value: "rejected", label: "Rejected", icon: AlertTriangle },
  { value: "all", label: "All", icon: Shield },
];

function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 size={10} />Approved</Badge>;
    case "pending":
      return <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock size={10} />Pending</Badge>;
    case "rejected":
      return <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 gap-1"><ShieldAlert size={10} />Rejected</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

export default function VerificationSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [proofModal, setProofModal] = useState<string | null>(null);
  const [reviewItem, setReviewItem] = useState<any>(null);

  /* ── Data ─────────────────────────────────────────────────────────────── */
  const apiFilter = filter === "all" ? undefined : filter as AdminGetKycSubmissionsStatus;
  const { data: submissions, isLoading } = useAdminGetKycSubmissions(
    { status: apiFilter },
    { query: { queryKey: getAdminGetKycSubmissionsQueryKey({ status: apiFilter }), staleTime: 20000 } }
  );

  const allSubmissions = submissions ?? [];
  const counts = {
    pending: allSubmissions.filter((s: any) => s.status === "pending").length,
    approved: allSubmissions.filter((s: any) => s.status === "approved").length,
    rejected: allSubmissions.filter((s: any) => s.status === "rejected").length,
  };

  const approveKyc = useAdminApproveKyc();
  const rejectKyc = useAdminRejectKyc();

  const handleApprove = (id: number) => {
    approveKyc.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminGetKycSubmissionsQueryKey({}) });
        toast({ title: "KYC approved" });
        setReviewItem(null);
      },
      onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
    });
  };

  const handleReject = () => {
    if (!rejectModal) return;
    rejectKyc.mutate({ id: rejectModal, data: { reason: rejectReason } }, {
      onSuccess: () => {
        setRejectModal(null);
        setRejectReason("");
        setReviewItem(null);
        queryClient.invalidateQueries({ queryKey: getAdminGetKycSubmissionsQueryKey({}) });
        toast({ title: "KYC rejected" });
      },
      onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
    });
  };

  /* ════════════════════════════════════════════════════════════════════════
     REVIEW WORKSPACE (inline when reviewing a submission)
     ════════════════════════════════════════════════════════════════════════ */

  if (reviewItem) {
    const sub = reviewItem;
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setReviewItem(null)} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground">Verification Review</h1>
            <p className="text-xs text-muted-foreground">Submitted {formatDateTime(sub.submittedAt)}</p>
          </div>
          {statusBadge(sub.status)}
        </div>

        {/* User Identity Card */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {sub.fullName?.charAt(0) ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground">{sub.fullName}</h2>
              <p className="text-sm text-muted-foreground">@{sub.username}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Hash size={11} />ID #{sub.id}</span>
                {sub.documentType && <span className="flex items-center gap-1"><FileText size={11} />{sub.documentType.replace("_", " ")}</span>}
                {sub.country && <span className="flex items-center gap-1">{sub.country}</span>}
                <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(sub.submittedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Submitted Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { url: sub.frontImageUrl, label: "Front of Document" },
              { url: sub.backImageUrl, label: "Back of Document" },
              { url: sub.selfieUrl, label: "Selfie / Photo" },
            ].filter(d => d.url).map(({ url, label }) => (
              <button
                key={url}
                onClick={() => setProofModal(url)}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img src={url} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </div>
                <div className="px-3 py-2.5 text-left">
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Click to view full size</p>
                </div>
              </button>
            ))}
          </div>
          {!sub.frontImageUrl && !sub.backImageUrl && !sub.selfieUrl && (
            <div className="py-8 text-center bg-card border border-border rounded-xl">
              <FileText size={24} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No documents uploaded</p>
            </div>
          )}
        </div>

        {/* Rejection Reason (if already rejected) */}
        {sub.rejectionReason && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle size={13} className="text-red-500" />
              <p className="text-xs font-semibold text-red-600">Rejection Reason</p>
            </div>
            <p className="text-sm text-red-600/80">{sub.rejectionReason}</p>
          </div>
        )}

        {/* Admin Decision */}
        {sub.status === "pending" && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Admin Decision</h3>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground mb-4">
                Review the submitted documents carefully before making a decision. This action will be logged.
              </p>
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 gap-2 text-sm font-semibold"
                  onClick={() => handleApprove(sub.id)}
                  disabled={approveKyc.isPending}
                >
                  <CheckCircle2 size={16} />
                  {approveKyc.isPending ? "Approving..." : "Approve Verification"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-11 gap-2 text-sm font-semibold border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => { setRejectModal(sub.id); setRejectReason(""); }}
                >
                  <X size={16} />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     LIST VIEW
     ════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Verification Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review identity verification submissions and manage account status
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Pending", value: counts.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/5" },
          { label: "Approved", value: counts.approved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/5" },
          { label: "Rejected", value: counts.rejected, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/5" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn("border border-border rounded-xl p-3.5", bg)}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={14} className={color} />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
            </div>
            <p className={cn("text-lg font-bold", color)}>{isLoading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0",
              filter === value
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Icon size={12} />
            {label}
            {value === "pending" && !isLoading && counts.pending > 0 && (
              <span className={cn("text-[10px] font-bold", filter === value ? "text-white/80" : "text-muted-foreground")}>
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Submissions Queue */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : allSubmissions.length === 0 ? (
        <div className="py-16 text-center">
          <ShieldCheck size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">
            {filter === "pending" ? "All caught up!" : `No ${filter} submissions`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === "pending" ? "No pending verifications to review" : "Try a different filter"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop List */}
          <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden divide-y divide-border/50">
            {allSubmissions.map((sub: any) => (
              <button
                key={sub.id}
                onClick={() => setReviewItem(sub)}
                className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {sub.fullName?.charAt(0) ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{sub.fullName}</p>
                    <span className="text-[11px] text-muted-foreground">@{sub.username}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                    <span className="capitalize">{sub.documentType?.replace("_", " ")}</span>
                    {sub.country && <span>{sub.country}</span>}
                    <span>{formatDate(sub.submittedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {statusBadge(sub.status)}
                  <ChevronLeft size={14} className="text-muted-foreground/40 rotate-180" />
                </div>
              </button>
            ))}
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2">
            {allSubmissions.map((sub: any) => (
              <button
                key={sub.id}
                onClick={() => setReviewItem(sub)}
                className="w-full bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {sub.fullName?.charAt(0) ?? "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground truncate">{sub.fullName}</p>
                      {statusBadge(sub.status)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">@{sub.username}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="capitalize">{sub.documentType?.replace("_", " ")}</span>
                      <span>{formatDate(sub.submittedAt)}</span>
                    </div>
                    {/* Document thumbnails */}
                    <div className="flex gap-1.5 mt-2.5">
                      {sub.frontImageUrl && <div className="w-12 h-9 rounded-md overflow-hidden border border-border"><img src={sub.frontImageUrl} alt="Front" className="w-full h-full object-cover" /></div>}
                      {sub.backImageUrl && <div className="w-12 h-9 rounded-md overflow-hidden border border-border"><img src={sub.backImageUrl} alt="Back" className="w-full h-full object-cover" /></div>}
                      {sub.selfieUrl && <div className="w-12 h-9 rounded-md overflow-hidden border border-border"><img src={sub.selfieUrl} alt="Selfie" className="w-full h-full object-cover" /></div>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── REJECT MODAL ── */}
      <Dialog open={rejectModal !== null} onOpenChange={(o) => !o && setRejectModal(null)}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Reject KYC Submission</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-sm">Reason</Label>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this submission was rejected..." className="mt-1.5 resize-none" rows={4} />
            </div>
            <p className="text-xs text-muted-foreground">The user will be notified of the rejection reason.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleReject} disabled={rejectKyc.isPending || !rejectReason}>
                {rejectKyc.isPending ? "Rejecting..." : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── IMAGE MODAL ── */}
      <Dialog open={!!proofModal} onOpenChange={(o) => !o && setProofModal(null)}>
        <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Document Preview</DialogTitle></DialogHeader>
          {proofModal && (
            <div className="mt-2">
              <img src={proofModal} alt="Document" className="w-full rounded-xl border border-border" />
              <div className="flex justify-end mt-3">
                <a href={proofModal} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium">
                  <Eye size={12} />Open in new tab
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
