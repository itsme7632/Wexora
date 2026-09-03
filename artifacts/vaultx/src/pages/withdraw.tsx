import { useState } from "react";
import {
  Shield, AlertCircle, Clock, Copy, Check, X, Lock, MapPin, ChevronRight,
  ChevronLeft, ArrowUpRight, CheckCircle2, Wallet,
} from "lucide-react";
import { useGetWallet, getGetWalletQueryKey, getGetTransactionsQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SubPageLayout } from "@/components/SubPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatUSDT } from "@/lib/format";

type Step = "form" | "review" | "security" | "success";

/* ─── Step indicator ────────────────────────────────────────────────────── */
function StepBar({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "form", label: "Details" },
    { key: "review", label: "Review" },
    { key: "security", label: "Verify" },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  if (current === "success") return null;
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 flex-1">
            <div className={cn("v3-step-dot shrink-0", i < idx ? "completed" : i === idx ? "active" : "pending")} />
            <span className={cn("text-[11px] font-medium transition-colors", i === idx ? "text-foreground" : i < idx ? "text-primary" : "text-muted-foreground")}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <div className={cn("h-px flex-1 max-w-6", i < idx ? "bg-primary/40" : "bg-border")} />}
        </div>
      ))}
    </div>
  );
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? data.error ?? "Request failed");
  return data;
}

/* ═══════════════════════════════════════════════════════════════════════════
   WITHDRAW — WEXORA V3
   Multi-step guided workflow: Form → Review → Security → Success
   ═══════════════════════════════════════════════════════════════════════════ */
export default function WithdrawPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("form");
  const [wdAmount, setWdAmount] = useState("");
  const [wdNetwork, setWdNetwork] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [wdPassword, setWdPassword] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: wallet } = useGetWallet({ query: { queryKey: getGetWalletQueryKey(), staleTime: 30000 } });
  const { data: platformSettings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => fetch("/api/settings/public", { credentials: "include" }).then((r) => r.json()),
    staleTime: 60000,
  });
  const { data: secStatus } = useQuery({
    queryKey: ["security-status"],
    queryFn: () => apiFetch("/security/status"),
    staleTime: 30000,
  });

  const savedAddresses: any[] = secStatus?.withdrawalAddresses ?? [];
  const allConfigured = secStatus?.allConfigured ?? false;
  const twoFaMode: string = platformSettings?.withdrawal_2fa_mode ?? "optional";
  const twoFaRequired = twoFaMode === "always" && secStatus?.twoFaEnabled;
  const show2Fa = twoFaMode !== "disabled" && secStatus?.twoFaEnabled;

  const customRules: string[] = (() => {
    const raw = platformSettings?.withdrawal_instructions?.trim();
    if (!raw) return [];
    return raw.split("\n").map((s: string) => s.trim()).filter(Boolean);
  })();

  const networks = wallet?.addresses ?? [];
  const feePercent = parseFloat(platformSettings?.withdrawal_fee_percent ?? "1.5");
  const minWithdrawal = parseFloat(platformSettings?.min_withdrawal ?? "10");
  const wdAmountNum = parseFloat(wdAmount) || 0;
  const wdFee = wdAmountNum * feePercent / 100;
  const wdNet = Math.max(0, wdAmountNum - wdFee);
  const balance = wallet?.balance ?? 0;

  const selectedAddress = savedAddresses.find((a: any) => a.id === selectedAddressId);
  const hasError = wdAmountNum > 0 && wdAmountNum > balance;
  const belowMin = wdAmountNum > 0 && wdAmountNum < minWithdrawal;
  const canProceed = wdAmount && wdNetwork && selectedAddressId && !hasError && !belowMin && wdAmountNum > 0;

  const handleSetMax = () => setWdAmount(String(parseFloat(String(balance)).toFixed(2)));

  const handleSubmit = async () => {
    if (!selectedAddress) return;
    setSubmitting(true);
    try {
      await apiFetch("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: wdAmountNum,
          network: wdNetwork,
          address: selectedAddress.address,
          withdrawalPassword: wdPassword,
          twoFaCode,
        }),
      });
      toast({ title: "Withdrawal Requested", description: "Your request is being reviewed (within 24h)" });
      queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey({}) });
      setStep("success");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setStep("security");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Security setup required screen ──────────────────────────────────── */
  if (secStatus && !allConfigured) {
    return (
      <SubPageLayout title="Withdraw USDT">
        <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield size={18} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">Security Setup Required</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Complete these steps to enable withdrawals</p>
            </div>
          </div>
          <div className="v3-card overflow-hidden divide-y divide-border/40">
            {[
              { label: "Withdrawal Password", ok: secStatus.hasWithdrawalPassword },
              { label: "Withdrawal Address", ok: savedAddresses.length > 0 },
            ].map(({ label, ok }) => (
              <button
                key={label}
                onClick={() => navigate("/security")}
                className="w-full flex items-center justify-between px-5 py-4 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-full", ok ? "bg-emerald-500" : "bg-red-400")} />
                  <span className={cn("font-medium", ok ? "text-emerald-600 line-through opacity-60" : "text-foreground")}>{label}</span>
                </div>
                <span className={cn("text-xs font-semibold", ok ? "text-emerald-500" : "text-primary")}>
                  {ok ? "Done" : "Set up →"}
                </span>
              </button>
            ))}
          </div>
          <Button className="w-full rounded-xl font-bold h-12" onClick={() => navigate("/security")}>
            Go to Security Settings →
          </Button>
        </div>
      </SubPageLayout>
    );
  }

  /* ─── Success screen ───────────────────────────────────────────────────── */
  if (step === "success") {
    return (
      <SubPageLayout title="Withdrawal Submitted">
        <div className="max-w-lg mx-auto text-center py-8 space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <Clock size={32} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Withdrawal Requested</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Your withdrawal of <span className="font-semibold text-foreground">{formatUSDT(wdAmountNum)}</span> is being reviewed. Processing takes up to 24 hours.
            </p>
          </div>
          <div className="v3-card p-5 text-left space-y-3">
            <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
              {[
                { label: "Network", val: wdNetwork },
                { label: "Amount Sent", val: formatUSDT(wdAmountNum) },
                { label: "Fee", val: `−${formatUSDT(wdFee)}` },
                { label: "You Receive", val: formatUSDT(wdNet), color: "text-emerald-500" },
                { label: "To", val: selectedAddress?.maskedAddress ?? "—" },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={cn("font-medium text-foreground", color)}>{val}</span>
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
    <SubPageLayout title="Withdraw USDT">
      <div className="max-w-lg mx-auto pb-32 space-y-5">

        <StepBar current={step} />

        {/* ──────────── STEP 1: Form ─────────────────────────── */}
        {step === "form" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ArrowUpRight size={18} className="text-red-500" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">Withdraw Funds</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Send USDT to your external wallet</p>
              </div>
            </div>

            {/* Balance card */}
            <div className="v3-gradient rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold">Available Balance</p>
                <p className="text-white font-bold text-2xl mt-1 tabular-nums">{formatUSDT(balance)}</p>
              </div>
              <button
                onClick={handleSetMax}
                className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors active:scale-95 border border-white/10 backdrop-blur-sm"
              >
                MAX
              </button>
            </div>

            {/* Network */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Network</Label>
              <Select value={wdNetwork} onValueChange={setWdNetwork}>
                <SelectTrigger className="h-12 rounded-xl text-sm">
                  <SelectValue placeholder="Select withdrawal network" />
                </SelectTrigger>
                <SelectContent>
                  {networks.map((n: any) => (
                    <SelectItem key={n.network} value={n.network}>
                      {n.label} ({n.network})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Amount (USDT)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={wdAmount}
                onChange={(e) => setWdAmount(e.target.value)}
                placeholder="0.00"
                className={cn("h-12 text-base rounded-xl", hasError && "border-destructive")}
              />
              {hasError && <p className="text-xs text-destructive mt-1.5 px-1">Insufficient balance</p>}
              {belowMin && <p className="text-xs text-destructive mt-1.5 px-1">Minimum withdrawal is {formatUSDT(minWithdrawal)}</p>}
            </div>

            {/* Fee breakdown */}
            {wdAmountNum > 0 && (
              <div className="v3-card-sunken p-4 space-y-2.5">
                <p className="text-xs font-bold text-foreground">Fee Breakdown</p>
                {[
                  { label: "Withdrawal Amount", val: formatUSDT(wdAmountNum), color: "" },
                  { label: `Processing Fee (${feePercent}%)`, val: `−${formatUSDT(wdFee)}`, color: "text-red-500" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cn("font-semibold tabular-nums", color)}>{val}</span>
                  </div>
                ))}
                <div className="border-t border-border/60 pt-2.5 flex justify-between text-sm">
                  <span className="font-bold text-foreground">You Receive</span>
                  <span className="font-bold text-emerald-500 tabular-nums">{formatUSDT(wdNet)}</span>
                </div>
              </div>
            )}

            {/* Saved addresses */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Withdrawal Address</Label>
              {savedAddresses.length === 0 ? (
                <button onClick={() => navigate("/security")} className="w-full border border-dashed border-border rounded-xl p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors">
                  <MapPin size={16} className="text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">No addresses saved</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Go to Security Settings to add one</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </button>
              ) : (
                <div className="space-y-2">
                  {savedAddresses.map((addr: any) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id === selectedAddressId ? null : addr.id)}
                      className={cn(
                        "w-full border rounded-xl p-4 text-left transition-all active:scale-[0.98]",
                        selectedAddressId === addr.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{addr.network}</span>
                        {addr.label && <span className="text-xs text-muted-foreground">{addr.label}</span>}
                        {selectedAddressId === addr.id && <Check size={12} className="ml-auto text-primary" />}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">{addr.maskedAddress}</p>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-2 px-1">Address must be pre-saved in Security Settings.</p>
            </div>

            {/* Processing info */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 mb-0.5">
                <Clock size={13} className="text-amber-500 shrink-0" />
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Processing Information</p>
              </div>
              {(customRules.length > 0
                ? customRules
                : [
                    "Withdrawals are reviewed within 24 hours",
                    `A ${feePercent}% processing fee applies`,
                    `Minimum withdrawal is ${formatUSDT(minWithdrawal)}`,
                    "Processing takes up to 2 business days",
                  ]
              ).map((info: string) => (
                <div key={info} className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <p className="text-[12px] text-amber-700 dark:text-amber-300">{info}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep("review")}
              disabled={!canProceed}
              className="w-full bg-red-500 hover:bg-red-600 font-bold rounded-xl h-12 shadow-lg"
            >
              Review Withdrawal <ChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        )}

        {/* ──────────── STEP 2: Review ────────────────────────── */}
        {step === "review" && selectedAddress && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Shield size={18} className="text-amber-500" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">Review Withdrawal</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Verify all details before confirming</p>
              </div>
            </div>

            <div className="v3-card overflow-hidden">
              <div className="v3-gradient p-4 text-white text-center">
                <p className="text-[10px] text-white/50 uppercase tracking-[0.15em] font-semibold">You Will Receive</p>
                <p className="text-3xl font-bold tabular-nums mt-1">{formatUSDT(wdNet)}</p>
              </div>
              <div className="divide-y divide-border/40">
                {[
                  { label: "Network", val: wdNetwork },
                  { label: "Amount Sent", val: formatUSDT(wdAmountNum) },
                  { label: `Fee (${feePercent}%)`, val: `−${formatUSDT(wdFee)}`, color: "text-red-500" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex justify-between items-center px-5 py-3.5 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cn("font-semibold tabular-nums", color)}>{val}</span>
                  </div>
                ))}
                <div className="px-5 py-3.5">
                  <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Destination Address</p>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{selectedAddress.network}</span>
                      {selectedAddress.label && <span className="ml-2 text-xs text-muted-foreground">{selectedAddress.label}</span>}
                      <p className="font-mono text-xs text-foreground break-all mt-1.5">{selectedAddress.maskedAddress}</p>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(selectedAddress.address); setCopiedAddr(true); setTimeout(() => setCopiedAddr(false), 2000); }}
                      className="p-1.5 rounded-lg hover:bg-muted shrink-0"
                    >
                      {copiedAddr ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} className="text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-700 dark:text-amber-300 leading-snug">
                This action cannot be undone. Ensure the network and address are correct before confirming.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("form")} className="flex-1 rounded-xl font-semibold h-12">
                <ChevronLeft size={15} className="mr-1" /> Edit
              </Button>
              <Button onClick={() => setStep("security")} className="flex-1 bg-red-500 hover:bg-red-600 font-bold rounded-xl h-12 shadow-lg">
                Verify Identity <ChevronRight size={15} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ──────────── STEP 3: Security ──────────────────────── */}
        {step === "security" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">Security Verification</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Enter your credentials to authorize this withdrawal</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">Withdrawal Password</Label>
              <Input
                type="password"
                value={wdPassword}
                onChange={(e) => setWdPassword(e.target.value)}
                placeholder="Your withdrawal password"
                className="h-12 rounded-xl text-sm"
                autoComplete="current-password"
              />
            </div>

            {show2Fa && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Authenticator Code
                  {!twoFaRequired && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>}
                </Label>
                <Input
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000 000"
                  className="h-14 text-center text-2xl tracking-[0.4em] font-bold font-mono rounded-xl border-2 focus:border-primary"
                  maxLength={6}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground mt-1.5 px-1 text-center">
                  {twoFaRequired ? "Required: 6-digit code from your authenticator app" : "Optional: add extra security with your 6-digit authenticator code"}
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="v3-card-sunken p-4 space-y-2">
              <p className="text-xs font-bold text-foreground mb-2">Withdrawal Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You Send</span>
                <span className="font-semibold tabular-nums">{formatUSDT(wdAmountNum)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You Receive</span>
                <span className="font-bold text-emerald-500 tabular-nums">{formatUSDT(wdNet)}</span>
              </div>
              {selectedAddress && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-mono text-xs">{selectedAddress.maskedAddress}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("review")} className="flex-1 rounded-xl font-semibold h-12">
                <ChevronLeft size={15} className="mr-1" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !wdPassword || (twoFaRequired && twoFaCode.length !== 6)}
                className="flex-1 bg-red-500 hover:bg-red-600 font-bold rounded-xl h-12 shadow-lg"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : "Confirm Withdrawal"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </SubPageLayout>
  );
}
