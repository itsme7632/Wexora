import { useState, useRef } from "react";
import {
  Copy, Check, QrCode, AlertCircle, Upload, X, ImageIcon, ChevronRight,
  ArrowDownLeft, ChevronLeft, Wallet, ShieldCheck, Clock, CheckCircle2,
} from "lucide-react";
import { useGetWallet, getGetWalletQueryKey, getGetTransactionsQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SubPageLayout } from "@/components/SubPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatUSDT } from "@/lib/format";

type Step = "network" | "details" | "review" | "instructions";

const STEPS: { key: Step; label: string }[] = [
  { key: "network", label: "Network" },
  { key: "details", label: "Details" },
  { key: "review", label: "Review" },
];

/* ─── Step indicator ────────────────────────────────────────────────────── */
function StepBar({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 flex-1">
            <div
              className={cn(
                "v3-step-dot shrink-0",
                i < idx ? "completed" : i === idx ? "active" : "pending"
              )}
            />
            <span className={cn(
              "text-[11px] font-medium transition-colors",
              i === idx ? "text-foreground" : i < idx ? "text-primary" : "text-muted-foreground"
            )}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("h-px flex-1 max-w-6", i < idx ? "bg-primary/40" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEPOSIT — WEXORA V3
   Multi-step guided workflow: Network → Details → Review → Confirmation
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DepositPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("network");
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: wallet } = useGetWallet({ query: { queryKey: getGetWalletQueryKey(), staleTime: 30000 } });
  const { data: platformSettings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => fetch("/api/settings/public", { credentials: "include" }).then((r) => r.json()),
    staleTime: 60000,
  });

  const networks = wallet?.addresses ?? [];
  const net = selectedNetwork ?? networks[0] ?? null;
  const amountNum = parseFloat(amount) || 0;
  const belowMin = net && amountNum > 0 && amountNum < net.minDeposit;

  const customInstructions: string[] = (() => {
    const raw = platformSettings?.deposit_instructions?.trim();
    if (!raw) return [];
    return raw.split("\n").map((s: string) => s.trim()).filter(Boolean);
  })();

  const defaultInstructions = net
    ? [
        "Open your crypto wallet or exchange",
        `Select ${net.network} as the send network`,
        "Copy the deposit address below and send the exact amount",
        "Paste the transaction hash in the form",
        "Upload your payment screenshot",
        "Tap \"Submit Deposit\"",
      ]
    : [];

  const instructions = customInstructions.length > 0 ? customInstructions : defaultInstructions;

  const canProceedToDetails = !!net;
  const canSubmit = !!net && !!txHash.trim() && !!proofImage && !belowMin && amountNum > 0;

  const handleCopy = () => {
    if (!net?.address) return;
    navigator.clipboard.writeText(net.address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 900;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
          else { width = Math.round(width * maxSize / height); height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        setProofImage(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!net) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum || net.minDeposit,
          network: net.network,
          txHash: txHash.trim(),
          proofImageUrl: proofImage,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed");
      toast({ title: "Deposit Submitted", description: "We'll credit your account once verified." });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      setStep("instructions");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Success / Instructions screen ───────────────────────────────────── */
  if (step === "instructions") {
    return (
      <SubPageLayout title="Deposit Submitted">
        <div className="max-w-lg mx-auto text-center py-8 space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Deposit Request Received</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Your deposit of <span className="font-semibold text-foreground">{formatUSDT(amountNum || net?.minDeposit || 0)}</span> on <span className="font-semibold text-foreground">{net?.network}</span> is being reviewed.
            </p>
          </div>
          <div className="v3-card p-5 text-left space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-500" />
              <span className="text-sm font-medium text-foreground">Pending Verification</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our team will verify your transaction and credit your account. This usually takes 15 minutes to 2 hours.
            </p>
            <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
              {[
                { label: "Network", val: net?.network },
                { label: "Amount", val: formatUSDT(amountNum || net?.minDeposit || 0) },
                { label: "TX Hash", val: txHash.slice(0, 24) + (txHash.length > 24 ? "..." : "") },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={() => navigate("/wallet")} className="w-full rounded-xl font-semibold h-12">
            Back to Wallet
          </Button>
        </div>
      </SubPageLayout>
    );
  }

  /* ─── Main multi-step flow ────────────────────────────────────────────── */
  return (
    <SubPageLayout title="Deposit USDT">
      <div className="max-w-lg mx-auto pb-32 space-y-5">

        {/* Step indicator */}
        <StepBar current={step} />

        {/* ──────────── STEP 1: Choose Network ────────────────── */}
        {step === "network" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">Choose Network</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select the blockchain network for your deposit</p>
              </div>
            </div>

            {networks.length === 0 ? (
              <div className="v3-card p-8 text-center">
                <Wallet size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading available networks...</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {networks.map((n: any) => {
                  const isSelected = net?.network === n.network;
                  return (
                    <button
                      key={n.network}
                      onClick={() => { setSelectedNetwork(n); }}
                      className={cn(
                        "w-full border rounded-xl p-4 text-left transition-all active:scale-[0.98]",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold", isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                            {n.network.slice(0, 4)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{n.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Network: {n.network}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-medium">Min deposit</p>
                            <p className="text-xs font-bold text-primary">{formatUSDT(n.minDeposit)}</p>
                          </div>
                          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", isSelected ? "border-primary bg-primary" : "border-border")}>
                            {isSelected && <Check size={11} className="text-white" />}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {net && (
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
                  Only send <span className="font-bold">{net.network} USDT</span> to this address. Sending other assets will result in permanent loss.
                </p>
              </div>
            )}

            <Button
              onClick={() => setStep("details")}
              disabled={!canProceedToDetails}
              className="w-full rounded-xl font-bold h-12"
            >
              Continue <ChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        )}

        {/* ──────────── STEP 2: Enter Details ─────────────────── */}
        {step === "details" && net && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ArrowDownLeft size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">Deposit Details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{net.label} — send USDT to the address below</p>
              </div>
            </div>

            {/* Address card */}
            <div className="v3-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Deposit Address</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowQr((s) => !s)}
                      className="flex items-center gap-1 text-primary text-[11px] font-semibold bg-primary/8 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-primary/12"
                    >
                      <QrCode size={11} />
                      QR
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-primary text-[11px] font-semibold bg-primary/8 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-primary/12"
                    >
                      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 select-all">
                  <p className="text-xs font-mono text-foreground break-all leading-relaxed">{net.address}</p>
                </div>
              </div>

              {showQr && (
                <div className="border-t border-border/50 bg-muted/10 flex justify-center py-5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&format=png&data=${encodeURIComponent(net.address)}`}
                    alt="QR Code"
                    className="w-44 h-44 rounded-xl"
                  />
                </div>
              )}

              <div className="border-t border-border/50 px-5 py-3 grid grid-cols-3 text-center gap-2">
                {[
                  { label: "Min Deposit", val: formatUSDT(net.minDeposit) },
                  { label: "Network Fee", val: formatUSDT(net.networkFee) },
                  { label: "Confirm Time", val: net.confirmationTime },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.12em]">{label}</p>
                    <p className="text-xs font-bold text-foreground mt-1">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Amount (USDT)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min. ${formatUSDT(net.minDeposit)}`}
                className="h-12 text-base rounded-xl"
              />
              {belowMin && (
                <p className="text-xs text-destructive mt-1.5 px-1">Minimum deposit is {formatUSDT(net.minDeposit)}</p>
              )}
            </div>

            {/* TX Hash */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Transaction Hash <span className="text-destructive text-xs font-normal">*required</span>
              </Label>
              <Input
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste your TX hash here"
                className={cn("h-12 rounded-xl font-mono text-xs", !txHash.trim() && "border-amber-300/50")}
              />
              <p className="text-[11px] text-muted-foreground mt-1.5 px-1">Find it in your wallet's transaction history after sending.</p>
            </div>

            {/* Screenshot */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Payment Screenshot <span className="text-destructive text-xs font-normal">*required</span>
              </Label>
              {proofImage ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={proofImage} alt="Proof" className="w-full max-h-48 object-contain bg-muted/20" />
                  <button
                    onClick={() => setProofImage(null)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X size={13} className="text-white" />
                  </button>
                  <div className="px-4 py-2.5 bg-emerald-500/10 flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-500" />
                    <p className="text-xs text-emerald-600 font-medium">Screenshot attached</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-5 flex items-center gap-4 hover:bg-primary/3 transition-colors active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Upload size={18} className="text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-foreground">Upload screenshot</p>
                    <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, or WEBP · Max 5MB</p>
                  </div>
                  <div className="flex items-center gap-1 bg-primary/10 rounded-lg px-3 py-1.5 shrink-0">
                    <ImageIcon size={11} className="text-primary" />
                    <span className="text-xs text-primary font-semibold">Choose</span>
                  </div>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("network")} className="flex-1 rounded-xl font-semibold h-12">
                <ChevronLeft size={15} className="mr-1" /> Back
              </Button>
              <Button onClick={() => setStep("review")} disabled={!txHash.trim() || !proofImage || belowMin || amountNum <= 0} className="flex-1 rounded-xl font-bold h-12">
                Review <ChevronRight size={15} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ──────────── STEP 3: Review & Submit ───────────────── */}
        {step === "review" && net && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">Review Deposit</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Verify all details before submitting</p>
              </div>
            </div>

            {/* Review card */}
            <div className="v3-card overflow-hidden">
              <div className="v3-gradient p-4 text-white text-center">
                <p className="text-[10px] text-white/50 uppercase tracking-[0.15em] font-semibold">Deposit Amount</p>
                <p className="text-3xl font-bold tabular-nums mt-1">{formatUSDT(amountNum || net.minDeposit)}</p>
              </div>
              <div className="divide-y divide-border/40">
                {[
                  { label: "Network", val: net.network },
                  { label: "To Address", val: net.address.slice(0, 20) + "...", mono: true },
                  { label: "TX Hash", val: txHash.slice(0, 30) + (txHash.length > 30 ? "..." : ""), mono: true },
                  { label: "Screenshot", val: "Attached" },
                ].map(({ label, val, mono }) => (
                  <div key={label} className="flex justify-between items-center px-5 py-3.5 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cn("font-medium text-foreground text-right max-w-[55%] truncate", mono && "font-mono text-[11px]")}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {instructions.length > 0 && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                <p className="text-xs font-bold text-primary mb-2.5">How deposits work</p>
                <div className="space-y-2">
                  {instructions.map((inst: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-[12px] text-primary/80 leading-snug">{inst}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 px-1">
              <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-600 leading-snug">
                Ensure all details are correct. Incorrect information may delay your deposit.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("details")} className="flex-1 rounded-xl font-semibold h-12">
                <ChevronLeft size={15} className="mr-1" /> Edit
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-xl font-bold h-12">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <>Submit Deposit <Check size={14} className="ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom button for step 2 */}
      {step === "details" && net && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent lg:pl-[264px]">
          {(!txHash.trim() || !proofImage) && (
            <p className="text-center text-xs text-amber-600 mb-2 font-medium">
              {!txHash.trim() && !proofImage ? "TX hash & screenshot required" : !txHash.trim() ? "TX hash required" : "Screenshot required"}
            </p>
          )}
          <Button onClick={() => setStep("review")} disabled={!txHash.trim() || !proofImage || belowMin || amountNum <= 0} className="w-full rounded-xl font-bold h-12 shadow-lg">
            Review Deposit <ChevronRight size={15} className="ml-1" />
          </Button>
        </div>
      )}
    </SubPageLayout>
  );
}
