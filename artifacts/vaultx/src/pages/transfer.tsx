import { useState } from "react";
import {
  Search, X, AlertCircle, User, Check, Lock, ArrowLeftRight,
  ChevronRight, ChevronLeft, Send, CheckCircle2,
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

type Step = "input" | "confirm" | "security" | "success";

/* ─── Step indicator ────────────────────────────────────────────────────── */
function StepBar({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "input", label: "Details" },
    { key: "confirm", label: "Review" },
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
   TRANSFER — WEXORA V3
   Multi-step guided workflow: Input → Confirm → Security → Success
   ═══════════════════════════════════════════════════════════════════════════ */
export default function TransferPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("input");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [resolvedUser, setResolvedUser] = useState<any>(null);
  const [resolving, setResolving] = useState(false);
  const [wdPassword, setWdPassword] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: wallet } = useGetWallet({ query: { queryKey: getGetWalletQueryKey(), staleTime: 30000 } });
  const { data: secStatus } = useQuery({
    queryKey: ["security-status"],
    queryFn: () => apiFetch("/security/status"),
    staleTime: 30000,
  });

  const balance = wallet?.balance ?? 0;
  const amountNum = parseFloat(amount) || 0;
  const hasError = amountNum > 0 && amountNum > balance;
  const belowMin = amountNum > 0 && amountNum < 1;

  const needsWdPassword = secStatus?.hasWithdrawalPassword ?? false;
  const needs2FA = secStatus?.twoFaEnabled ?? false;
  const needsSecurity = needsWdPassword || needs2FA;

  const handleResolve = async () => {
    if (!recipient.trim()) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/wallet/resolve-user?query=${encodeURIComponent(recipient)}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).message ?? "User not found");
      const user = await res.json();
      setResolvedUser(user);
      setStep("confirm");
    } catch (e: any) {
      toast({ title: "User Not Found", description: e.message, variant: "destructive" });
    } finally {
      setResolving(false);
    }
  };

  const handleProceedFromConfirm = () => {
    if (needsSecurity) setStep("security");
    else handleTransfer();
  };

  const handleTransfer = async () => {
    setSubmitting(true);
    try {
      await apiFetch("/wallet/transfer", {
        method: "POST",
        body: JSON.stringify({
          recipientQuery: recipient,
          amount: amountNum,
          note: note || undefined,
          withdrawalPassword: needsWdPassword ? wdPassword : undefined,
          twoFaCode: needs2FA ? twoFaCode : undefined,
        }),
      });
      toast({ title: "Transfer Sent!", description: `${formatUSDT(amountNum)} sent to ${resolvedUser?.fullName}` });
      queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey({}) });
      setStep("success");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setStep(needsSecurity ? "security" : "input");
    } finally {
      setSubmitting(false);
    }
  };

  const securityValid = (!needsWdPassword || wdPassword.length > 0) && (!needs2FA || twoFaCode.length === 6);

  /* ─── Success screen ───────────────────────────────────────────────────── */
  if (step === "success") {
    return (
      <SubPageLayout title="Transfer Sent" onBack={() => navigate("/wallet")}>
        <div className="max-w-lg mx-auto text-center py-8 space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Transfer Complete</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              <span className="font-semibold text-foreground">{formatUSDT(amountNum)}</span> has been sent to <span className="font-semibold text-foreground">{resolvedUser?.fullName}</span>
            </p>
          </div>
          <div className="v3-card p-5 text-left space-y-3">
            <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
              {[
                { label: "Recipient", val: `@${resolvedUser?.username}` },
                { label: "Amount", val: formatUSDT(amountNum), color: "text-primary" },
                { label: "Fee", val: "Free", color: "text-emerald-500" },
                ...(note ? [{ label: "Note", val: note }] : []),
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
    <SubPageLayout title="Transfer USDT" onBack={() => navigate("/wallet")}>
      <div className="max-w-lg mx-auto pb-32 space-y-5">

        <StepBar current={step} />

        {/* ──────────── STEP 1: Input ────────────────────────── */}
        {step === "input" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ArrowLeftRight size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">Internal Transfer</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Send USDT to another Wexora user instantly</p>
              </div>
            </div>

            {/* Balance */}
            <div className="v3-gradient rounded-2xl p-5">
              <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold">Available Balance</p>
              <p className="text-white font-bold text-2xl mt-1 tabular-nums">{formatUSDT(balance)}</p>
            </div>

            {/* Recipient */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Recipient</Label>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={recipient}
                  onChange={(e) => { setRecipient(e.target.value); setResolvedUser(null); if (step !== "input") setStep("input"); }}
                  placeholder="Username, email, or display ID"
                  className="h-12 pl-10 rounded-xl text-sm"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5 px-1">Enter the recipient's username (e.g. @john), email, or 6-digit ID</p>
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Amount (USDT)</Label>
                <button onClick={() => setAmount(String(parseFloat(String(balance)).toFixed(2)))} className="text-xs text-primary font-bold">MAX</button>
              </div>
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={cn("h-12 text-base rounded-xl", hasError && "border-destructive")}
              />
              {hasError && <p className="text-xs text-destructive mt-1.5 px-1">Insufficient balance</p>}
              {belowMin && <p className="text-xs text-destructive mt-1.5 px-1">Minimum transfer is 1.00 USDT</p>}
            </div>

            {/* Note */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's this for?"
                className="h-12 rounded-xl text-sm"
              />
            </div>

            {/* Info */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-primary mb-1.5">Transfer Information</p>
              {[
                "Transfers between Wexora users are instant",
                "No fee is charged for internal transfers",
                needsWdPassword || needs2FA ? "Security verification required before transfer" : "The recipient must have a verified Wexora account",
              ].map((info) => (
                <div key={info} className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-primary/50 mt-2 shrink-0" />
                  <p className="text-[12px] text-primary/80">{info}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={handleResolve}
              disabled={resolving || !recipient.trim() || !amount || hasError || belowMin}
              className="w-full rounded-xl font-bold h-12"
            >
              {resolving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Finding user…
                </span>
              ) : (
                <>Find Recipient <ChevronRight size={15} className="ml-1" /></>
              )}
            </Button>
          </div>
        )}

        {/* ──────────── STEP 2: Confirm ──────────────────────── */}
        {step === "confirm" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <User size={18} className="text-amber-500" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">Confirm Transfer</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Verify the recipient and amount</p>
              </div>
            </div>

            {/* Recipient card */}
            <div className="v3-card p-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <User size={26} className="text-primary" />
              </div>
              <p className="font-bold text-foreground text-base">{resolvedUser?.fullName}</p>
              <p className="text-sm text-muted-foreground mt-0.5">@{resolvedUser?.username}</p>
              {resolvedUser?.displayId && <p className="text-xs text-muted-foreground mt-1">ID: #{resolvedUser.displayId}</p>}
              <div className="flex items-center justify-center gap-1.5 mt-2.5 bg-emerald-500/10 rounded-xl py-1.5">
                <Check size={12} className="text-emerald-500" />
                <p className="text-xs text-emerald-600 font-medium">Verified recipient</p>
              </div>
            </div>

            {/* Details */}
            <div className="v3-card overflow-hidden divide-y divide-border/40">
              {[
                { label: "To", val: `${resolvedUser?.fullName} (@${resolvedUser?.username})` },
                { label: "Amount", val: formatUSDT(amountNum), color: "text-primary text-base font-bold" },
                { label: "Fee", val: "Free", color: "text-emerald-500" },
                ...(note ? [{ label: "Note", val: note }] : []),
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between items-center px-5 py-3.5 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={cn("font-semibold max-w-[55%] text-right truncate", color)}>{val}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-700 dark:text-amber-300 leading-snug">
                Please confirm the recipient details. This transfer cannot be reversed once sent.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("input")} className="flex-1 rounded-xl font-semibold h-12">
                <ChevronLeft size={15} className="mr-1" /> Edit
              </Button>
              <Button onClick={handleProceedFromConfirm} className="flex-1 rounded-xl font-bold h-12">
                {needsSecurity ? <>Verify Identity <ChevronRight size={15} className="ml-1" /></> : <>Send Transfer <Check size={14} className="ml-1" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ──────────── STEP 3: Security ─────────────────────── */}
        {step === "security" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base">Security Verification</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Enter your credentials to authorize this transfer</p>
              </div>
            </div>

            {needsWdPassword && (
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
            )}

            {needs2FA && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">Authenticator Code</Label>
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
                <p className="text-xs text-muted-foreground mt-1.5 px-1 text-center">6-digit code from your authenticator app</p>
              </div>
            )}

            {/* Summary */}
            <div className="v3-card-sunken p-4 space-y-2">
              <p className="text-xs font-bold text-foreground mb-2">Transfer Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-semibold">{resolvedUser?.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-primary tabular-nums">{formatUSDT(amountNum)}</span>
              </div>
              {note && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Note</span>
                  <span className="font-medium text-foreground">{note}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("confirm")} className="flex-1 rounded-xl font-semibold h-12">
                <ChevronLeft size={15} className="mr-1" /> Back
              </Button>
              <Button onClick={handleTransfer} disabled={submitting || !securityValid} className="flex-1 rounded-xl font-bold h-12">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : (
                  <>Send Transfer <Check size={14} className="ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </SubPageLayout>
  );
}
