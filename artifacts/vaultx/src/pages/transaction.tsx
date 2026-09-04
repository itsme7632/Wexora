import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Copy, Check, Clock, CheckCircle,
  XCircle, AlertCircle, Share2, ImageDown, FileText, X,
  ArrowLeft, ExternalLink, Receipt, Shield, HelpCircle,
} from "lucide-react";
import { SubPageLayout } from "@/components/SubPageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatUSDT, formatDateTime } from "@/lib/format";
import { useState } from "react";
import {
  downloadReceiptImage,
  downloadReceiptPDF,
  shareReceiptImage,
  type ReceiptTx,
  type ReceiptSettings,
} from "@/lib/receiptGenerator";

const INCOMING_TYPES = ["deposit", "earning", "referral", "reinvest", "admin_adjustment"];

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string; bg: string; ringBg: string }> = {
  completed: { icon: CheckCircle, color: "text-emerald-500", label: "Completed", bg: "bg-emerald-500/10 border-emerald-500/20", ringBg: "bg-emerald-500/15" },
  pending:   { icon: Clock,        color: "text-amber-500",  label: "Pending",   bg: "bg-amber-500/10 border-amber-500/20",   ringBg: "bg-amber-500/15" },
  failed:    { icon: XCircle,      color: "text-red-500",    label: "Rejected",  bg: "bg-red-500/10 border-red-500/20",       ringBg: "bg-red-500/15" },
};

const TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit", withdrawal: "Withdrawal", transfer: "Transfer",
  earning: "Investment Earnings", referral: "Referral Bonus", reinvest: "Reinvestment",
  investment: "Property Investment", admin_adjustment: "Adjustment",
};

interface ShareSheetProps {
  txId?: string | null;
  txDbId: number;
  onClose: () => void;
  onShare: () => void;
  onSaveImage: () => void;
  onDownloadPdf: () => void;
  loading: boolean;
}

function ShareSheet({ txId, txDbId, onClose, onShare, onSaveImage, onDownloadPdf, loading }: ShareSheetProps) {
  const displayId = txId ?? txDbId;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-screen-sm bg-card border-t border-border rounded-t-3xl px-4 pt-4 pb-10 space-y-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-foreground">Export Receipt</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X size={15} />
          </button>
        </div>
        <button onClick={onShare} disabled={loading}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Share2 size={18} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">Share Receipt</p>
            <p className="text-[11px] text-muted-foreground">Send via WhatsApp, Telegram, Gmail…</p>
          </div>
        </button>
        <button onClick={onSaveImage} disabled={loading}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ImageDown size={18} className="text-emerald-500" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">Save as Image</p>
            <p className="text-[11px] text-muted-foreground">EstateFund-Receipt-{displayId}.png</p>
          </div>
        </button>
        <button onClick={onDownloadPdf} disabled={loading}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors active:scale-[0.98]">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">Download PDF</p>
            <p className="text-[11px] text-muted-foreground">EstateFund-Receipt-{displayId}.pdf</p>
          </div>
        </button>
        {loading && (
          <p className="text-center text-xs text-muted-foreground py-2 animate-pulse">Generating receipt…</p>
        )}
      </div>
    </div>
  );
}

function TimelineStep({ icon: Icon, label, time, color, connector, active }: {
  icon: React.ElementType; label: string; time?: string; color: string;
  connector?: "active" | "inactive" | "none"; active: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all",
          active ? `${color} border-current` : "bg-muted border-border text-muted-foreground"
        )}>
          <Icon size={14} />
        </div>
        {connector !== "none" && (
          <div className={cn("w-0.5 flex-1 min-h-[20px] mt-1", connector === "active" ? "bg-emerald-500/50" : "bg-border")} />
        )}
      </div>
      <div className="pb-5">
        <p className={cn("text-sm font-semibold", active ? "text-foreground" : "text-muted-foreground")}>{label}</p>
        {time ? (
          <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
        ) : (
          <p className="text-xs text-muted-foreground/60 mt-0.5 italic">Awaiting admin review</p>
        )}
      </div>
    </div>
  );
}

export default function TransactionPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const { data: tx, isLoading, error } = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const res = await fetch(`/api/wallet/transactions/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message ?? "Transaction not found");
      return res.json();
    },
    staleTime: 60000,
  });

  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => fetch("/api/settings/public", { credentials: "include" }).then((r) => r.json()),
    staleTime: 120000,
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied!" });
  };

  const receiptSettings: ReceiptSettings = {
    platformName: settings?.platform_name ?? "Wexora",
    platformLogoUrl: settings?.platform_logo_url ?? undefined,
    platformUrl: settings?.platform_url ?? undefined,
  };

  const receiptTx: ReceiptTx | undefined = tx
    ? {
        txId: tx.txId, id: tx.id, type: tx.type, amount: tx.amount, fee: tx.fee,
        network: tx.network, address: tx.address, txHash: tx.txHash,
        status: tx.status, createdAt: tx.createdAt, updatedAt: tx.updatedAt,
      }
    : undefined;

  const handleShare = async () => {
    if (!receiptTx) return;
    setShareLoading(true);
    try {
      const shared = await shareReceiptImage(receiptTx, receiptSettings);
      if (shared) { toast({ title: "Receipt shared!" }); }
      else { await downloadReceiptImage(receiptTx, receiptSettings); toast({ title: "Receipt downloaded", description: "Native sharing not available on this browser." }); }
    } catch (e: any) { toast({ title: "Could not share", description: e.message, variant: "destructive" }); }
    finally { setShareLoading(false); setShowShare(false); }
  };

  const handleSaveImage = async () => {
    if (!receiptTx) return;
    setShareLoading(true);
    try { await downloadReceiptImage(receiptTx, receiptSettings); toast({ title: "Receipt downloaded!" }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setShareLoading(false); setShowShare(false); }
  };

  const handleDownloadPdf = async () => {
    if (!receiptTx) return;
    setShareLoading(true);
    try { await downloadReceiptPDF(receiptTx, receiptSettings); toast({ title: "PDF downloaded!" }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setShareLoading(false); setShowShare(false); }
  };

  const isIncoming = tx && INCOMING_TYPES.includes(tx.type);
  const statusCfg = tx ? (STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending) : null;
  const StatusIcon = statusCfg?.icon ?? Clock;
  const hasProcessingTime = tx?.updatedAt && tx?.createdAt && new Date(tx.updatedAt).getTime() - new Date(tx.createdAt).getTime() > 30000;
  const processedAt = hasProcessingTime ? tx.updatedAt : undefined;

  return (
    <>
      <SubPageLayout title="Transaction Receipt"
        onBack={() => navigate("/wallet")}
        actions={
          <button onClick={() => setShowShare(true)}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform">
            <Share2 size={15} className="text-foreground" />
          </button>
        }>
        {isLoading ? (
          <div className="px-4 pt-6 space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
              <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
            </div>
          </div>
        ) : error || !tx ? (
          <div className="px-4 pt-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground text-lg">Transaction not found</p>
            <p className="text-sm text-muted-foreground mt-1.5">This transaction may have been removed or you don't have access.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
              <ArrowLeft size={14} className="mr-2" /> Go Back
            </Button>
          </div>
        ) : (
          <div className="px-4 pt-5 pb-12 max-w-6xl mx-auto space-y-5">

            {/* ── Status Hero ── */}
            <div className={cn("rounded-2xl border p-6 text-center animate-fade-in", statusCfg?.bg)}>
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ring-4", statusCfg?.ringBg)}>
                <StatusIcon size={28} className={statusCfg?.color} />
              </div>
              <p className={cn("text-sm font-bold uppercase tracking-widest mb-1", statusCfg?.color)}>{statusCfg?.label}</p>
              <p className={cn("text-4xl font-black tracking-tight", isIncoming ? "text-emerald-500" : "text-red-500")}>
                {isIncoming ? "+" : "−"}{formatUSDT(tx.amount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 font-semibold uppercase tracking-wider">
                {TYPE_LABEL[tx.type] ?? tx.type.replace(/_/g, " ")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">{formatDateTime(tx.createdAt)}</p>
            </div>

            {/* ── 2-Column Desktop Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* Left: Details + Proof + Timeline */}
              <div className="lg:col-span-3 space-y-5">

                {/* Transaction Details */}
                <div className="v3-card-elevated overflow-hidden animate-fade-in">
                  <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                    <Receipt size={14} className="text-primary" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Transaction Details</p>
                  </div>
                  {[
                    ...(tx.txId ? [{ label: "Transaction ID", val: tx.txId, copyKey: "txid", mono: true, highlight: true }] : []),
                    { label: "Type", val: tx.type.replace(/_/g, " "), capitalize: true },
                    { label: "Amount", val: formatUSDT(tx.amount) },
                    ...(tx.fee > 0 ? [{ label: "Fee", val: formatUSDT(tx.fee) }] : []),
                    {
                      label: "Status", val: statusCfg?.label ?? tx.status,
                      color: tx.status === "completed" ? "text-emerald-500" : tx.status === "failed" ? "text-red-500" : "text-amber-500",
                    },
                    { label: "Submitted", val: formatDateTime(tx.createdAt) },
                    ...(processedAt ? [{ label: "Processed", val: formatDateTime(processedAt) }] : []),
                    ...(tx.network ? [{ label: "Network", val: tx.network }] : []),
                    ...(tx.address ? [{ label: "Address", val: tx.address, copyKey: "address", mono: true, truncate: true }] : []),
                    ...(tx.txHash ? [{ label: "TX Hash", val: tx.txHash, copyKey: "txhash", mono: true, truncate: true }] : []),
                    ...(tx.note ? [{ label: "Note", val: tx.note }] : []),
                  ].map(({ label, val, copyKey, mono, capitalize, truncate, color, highlight }: any) => (
                    <div key={label} className="flex items-start justify-between px-5 py-3 border-b border-border/50 last:border-0 gap-3">
                      <span className="text-sm text-muted-foreground shrink-0 w-24 leading-relaxed">{label}</span>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                        <span className={cn(
                          "text-sm font-semibold text-right leading-relaxed",
                          mono && "font-mono text-xs", capitalize && "capitalize",
                          truncate && "truncate max-w-[180px]", color, highlight && "text-primary",
                        )}>{val}</span>
                        {copyKey && (
                          <button onClick={() => handleCopy(val, copyKey)} className="shrink-0 p-1 rounded hover:bg-muted transition-colors active:scale-90">
                            {copied === copyKey ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-muted-foreground" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Proof image */}
                {tx.type === "deposit" && tx.metadata?.proofImageUrl && (
                  <div className="v3-card-elevated overflow-hidden animate-fade-in">
                    <div className="px-5 py-3.5 border-b border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Payment Proof</p>
                    </div>
                    <div className="p-3">
                      <img src={tx.metadata.proofImageUrl} alt="Payment proof" className="w-full object-contain max-h-72 rounded-xl" />
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="v3-card-elevated p-5 animate-fade-in">
                  <p className="text-xs font-bold text-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
                    <Clock size={13} className="text-primary" /> Status Timeline
                  </p>
                  <div>
                    <TimelineStep
                      icon={CheckCircle} label="Submitted" time={formatDateTime(tx.createdAt)}
                      color="bg-emerald-500/15 text-emerald-500 border-emerald-500"
                      connector={tx.status !== "pending" ? "active" : "inactive"} active={true}
                    />
                    {tx.status === "pending" ? (
                      <TimelineStep icon={Clock} label="Awaiting Review" color="bg-amber-500/15 text-amber-500 border-amber-500" connector="none" active={true} />
                    ) : (
                      <>
                        {processedAt && (
                          <TimelineStep icon={Clock} label="Processing" time={formatDateTime(processedAt)} color="bg-primary/15 text-primary border-primary" connector="active" active={true} />
                        )}
                        <TimelineStep
                          icon={tx.status === "completed" ? CheckCircle : XCircle}
                          label={tx.status === "completed" ? "Completed" : "Rejected"}
                          time={processedAt ? formatDateTime(processedAt) : formatDateTime(tx.updatedAt ?? tx.createdAt)}
                          color={tx.status === "completed" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500" : "bg-red-500/15 text-red-500 border-red-500"}
                          connector="none" active={true}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Sidebar — Quick Info + Actions */}
              <div className="lg:col-span-2 space-y-5">

                {/* Quick Info Card */}
                <div className="v3-card-elevated p-5 space-y-4 animate-fade-in">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Quick Info</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Transaction ID</span>
                      {tx.txId && (
                        <button onClick={() => handleCopy(tx.txId, "txid-quick")}
                          className="font-mono text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                          {tx.txId}
                          {copied === "txid-quick" ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="text-sm font-semibold text-foreground">{TYPE_LABEL[tx.type] ?? tx.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className={cn("text-sm font-bold", isIncoming ? "text-emerald-500" : "text-red-500")}>
                        {isIncoming ? "+" : "−"}{formatUSDT(tx.amount)}
                      </span>
                    </div>
                    {tx.fee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Fee</span>
                        <span className="text-sm font-semibold text-foreground">{formatUSDT(tx.fee)}</span>
                      </div>
                    )}
                    {tx.network && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Network</span>
                        <span className="text-sm font-semibold text-foreground">{tx.network}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Export Actions */}
                <div className="v3-card-elevated p-5 space-y-3 animate-fade-in">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Export Receipt</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => setShowShare(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors active:scale-[0.98]">
                      <Share2 size={16} className="text-primary shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">Share Receipt</p>
                        <p className="text-[10px] text-muted-foreground">Send via messaging apps</p>
                      </div>
                    </button>
                    <button onClick={handleSaveImage} disabled={shareLoading}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors active:scale-[0.98] disabled:opacity-50">
                      <ImageDown size={16} className="text-emerald-500 shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">Save as Image</p>
                        <p className="text-[10px] text-muted-foreground">PNG receipt file</p>
                      </div>
                    </button>
                    <button onClick={handleDownloadPdf} disabled={shareLoading}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-border hover:bg-primary/10 transition-colors active:scale-[0.98] disabled:opacity-50">
                      <FileText size={16} className="text-primary shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">Download PDF</p>
                        <p className="text-[10px] text-muted-foreground">PDF receipt file</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Support */}
                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <HelpCircle size={15} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Need Help?</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        For assistance regarding this transaction, contact support and provide your Transaction ID.
                      </p>
                      {tx.txId && (
                        <button onClick={() => handleCopy(tx.txId, "support-txid")}
                          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/15 transition-colors">
                          <span className="font-mono">{tx.txId}</span>
                          {copied === "support-txid" ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="opacity-70" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SubPageLayout>

      {showShare && receiptTx && (
        <ShareSheet txId={tx?.txId} txDbId={tx?.id} onClose={() => setShowShare(false)}
          onShare={handleShare} onSaveImage={handleSaveImage} onDownloadPdf={handleDownloadPdf} loading={shareLoading} />
      )}
    </>
  );
}
