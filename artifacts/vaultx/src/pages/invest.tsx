import React, { useState } from "react";
import {
  CheckCircle, Info, Wallet, Clock, ArrowRight, ChevronLeft, Shield,
  MapPin, Calendar, TrendingUp, Building2, Image as ImageIcon,
} from "lucide-react";
import {
  useGetInvestmentPlans, getGetInvestmentPlansQueryKey,
  useGetWallet, getGetWalletQueryKey,
  useCreateInvestment, getGetUserInvestmentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { SubPageLayout } from "@/components/SubPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatUSDT } from "@/lib/format";

/* ─── Step indicator ───────────────────────────────────────────────────── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
            i + 1 <= current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {i + 1 < current ? <CheckCircle size={14} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={cn("flex-1 h-0.5 rounded-full transition-all", i + 1 < current ? "bg-primary" : "bg-muted")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ═══════════════════════════════════════════════════════════════════════════
   INVEST — WEXORA V4.2
   Guided real estate investment: Property Summary → Amount → Review → Confirm
   ═══════════════════════════════════════════════════════════════════════════ */
export default function InvestPage() {
  const { planId } = useParams<{ planId: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: plans, isLoading: plansLoading } = useGetInvestmentPlans({ query: { queryKey: getGetInvestmentPlansQueryKey(), staleTime: 300000 } });
  const { data: wallet } = useGetWallet({ query: { queryKey: getGetWalletQueryKey(), staleTime: 30000 } });
  const createInvestment = useCreateInvestment();

  const plan: any = plans?.find((p: any) => String(p.id) === planId);
  const balance = wallet?.balance ?? 0;
  const amountNum = parseFloat(amount) || 0;

  const minRoi = (plan?.minRoiRate as number) ?? 0.013;
  const maxRoi = (plan?.maxRoiRate as number) ?? 0.017;
  const avgRoi = (minRoi + maxRoi) / 2;
  const dailyMin = amountNum * minRoi;
  const dailyMax = amountNum * maxRoi;
  const dailyAvg = amountNum * avgRoi;
  const totalMin = dailyMin * (plan?.durationDays ?? 0);
  const totalMax = dailyMax * (plan?.durationDays ?? 0);

  const BLOCKED_STATUSES = ["paused", "expired", "closed", "fully_allocated"];
  const isBlocked = plan && (BLOCKED_STATUSES.includes(plan.status ?? "") || (plan.endDate && new Date(plan.endDate).getTime() < Date.now()));
  const fundingDeadline = plan?.fundingDeadline ? new Date(plan.fundingDeadline) : null;
  const fundingActive = fundingDeadline && fundingDeadline.getTime() > Date.now();

  const hasError = amountNum > balance && amountNum > 0;
  const belowMin = plan && amountNum > 0 && amountNum < plan.minAmount;
  const aboveMax = plan && amountNum > plan.maxAmount;
  const canProceed = !isBlocked && plan && amountNum >= plan.minAmount && amountNum <= plan.maxAmount && !hasError && amountNum > 0;

  const now = new Date();
  const startDate = now;
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + (plan?.durationDays ?? 0));

  const [serverError, setServerError] = useState<string | null>(null);

  const handleInvest = () => {
    if (!plan) return;
    setServerError(null);
    createInvestment.mutate({ data: { planId: plan.id, amount: amountNum } }, {
      onSuccess: () => {
        toast({
          title: "Investment Confirmed!",
          description: `${formatUSDT(amountNum)} invested in ${plan.name}.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetUserInvestmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
        setStep(3);
      },
      onError: (e: any) => {
        const msg = e?.message || "Investment failed. Please try again.";
        setServerError(msg);
        toast({ title: "Investment Failed", description: msg, variant: "destructive" });
      },
    });
  };

  const quickAmounts = plan ? [
    Math.min(plan.minAmount * 2, balance),
    Math.min(plan.minAmount * 5, balance),
    Math.min(plan.maxAmount * 0.5, balance),
    Math.min(plan.maxAmount, balance),
  ].filter(v => v >= plan.minAmount && v <= plan.maxAmount) : [];

  if (plansLoading) return <SubPageLayout title="Invest"><div className="max-w-lg mx-auto px-4 py-5 space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div></SubPageLayout>;
  if (!plan) return <SubPageLayout title="Invest"><div className="max-w-lg mx-auto px-4 py-12 text-center"><p className="font-semibold text-foreground">Property not found</p><Button variant="outline" className="mt-4" onClick={() => navigate("/investments")}>Go Back</Button></div></SubPageLayout>;

  const primaryImage = plan.bannerImageUrl || plan.images?.[0] || null;

  /* ═══ STEP 3: SUCCESS ═══ */
  if (step === 3) {
    return (
      <SubPageLayout title="Investment Confirmed">
        <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Investment Confirmed</h1>
            <p className="text-muted-foreground mt-2 text-sm">Your real estate investment has been successfully placed.</p>
          </div>
          <div className="v3-card overflow-hidden text-left">
            {primaryImage && (
              <div className="h-40 bg-muted">
                <img src={primaryImage} alt={plan.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Property</p>
                  <p className="text-lg font-bold text-foreground">{plan.name}</p>
                  {plan.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin size={11} /> {plan.location}</p>}
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-600">Active</span>
              </div>
              <div className="h-px bg-border/50" />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Amount Invested</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{formatUSDT(amountNum)}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Duration</p>
                  <p className="text-lg font-bold text-primary mt-0.5">{plan.durationDays} days</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Start Date</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{formatDate(startDate)}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Maturity Date</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{formatDate(endDate)}</p>
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Est. Total Return</span>
                  <span className="text-sm font-bold text-emerald-600">{formatUSDT(totalMin)} – {formatUSDT(totalMax)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Based on configured return rate. Returns distributed daily.</p>
              </div>
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <Shield size={13} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your {plan.durationDays}-day investment term begins from {formatDate(startDate)} and ends on {formatDate(endDate)}. This is independent of the property's funding deadline.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Button className="w-full h-12 rounded-xl font-bold" onClick={() => navigate("/portfolio")}>
              View My Investments <ArrowRight size={15} className="ml-1" />
            </Button>
            <Button variant="outline" className="w-full h-11 rounded-xl font-medium" onClick={() => navigate("/investments")}>
              Browse More Properties
            </Button>
          </div>
        </div>
      </SubPageLayout>
    );
  }

  return (
    <SubPageLayout title={step === 1 ? "Invest in Property" : "Review Investment"}>
      <div className="max-w-5xl mx-auto px-4 py-5 lg:px-8 pb-32 space-y-5">

        {/* ── Step Indicator ───────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-9 px-2 rounded-lg shrink-0" onClick={() => step === 2 ? setStep(1) : navigate(`/opportunity/${plan.id}`)}>
            <ChevronLeft size={14} /> Back
          </Button>
          <div className="flex-1">
            <StepIndicator current={step} total={2} />
          </div>
        </div>

        {/* ── Property Summary Card ──────────────────────────── */}
        <div className="v3-card overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            {primaryImage && (
              <div className="sm:w-40 h-32 sm:h-auto shrink-0 bg-muted">
                <img src={primaryImage} alt={plan.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-base text-foreground">{plan.name}</h2>
                  {plan.location && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{plan.location}</p>
                    </div>
                  )}
                </div>
                {plan.propertyType && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-primary/10 text-primary capitalize">{plan.propertyType}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg">{(minRoi * 100).toFixed(1)}%–{(maxRoi * 100).toFixed(1)}% daily</span>
                <span className="text-xs font-semibold text-foreground bg-muted px-2 py-1 rounded-lg">{plan.durationDays}d term</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop: 2-column ───────────────────────────────── */}
        <div className="lg:grid lg:grid-cols-5 lg:gap-5 space-y-5 lg:space-y-0">

          {/* ═══ LEFT: Main Content ═══ */}
          <div className="lg:col-span-3 space-y-5">

            {/* STEP 1: Amount Entry */}
            {step === 1 && (
              <>
                {/* Balance + Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="v3-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Wallet size={16} className="text-primary" /></div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Available Balance</p>
                      <p className="font-bold text-primary text-sm tabular-nums">{formatUSDT(balance)}</p>
                    </div>
                  </div>
                  <div className="v3-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0"><TrendingUp size={16} className="text-emerald-500" /></div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Investment Range</p>
                      <p className="font-bold text-foreground text-sm tabular-nums">{formatUSDT(plan.minAmount)}–{formatUSDT(plan.maxAmount)}</p>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="v3-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-foreground">Investment Amount</p>
                    <button
                      onClick={() => setAmount(String(Math.min(balance, plan.maxAmount).toFixed(2)))}
                      className="text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/15 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className={cn(
                        "h-14 text-xl font-bold text-center rounded-xl tracking-wide pl-8",
                        (hasError || belowMin || aboveMax) && "border-destructive ring-destructive"
                      )}
                    />
                  </div>
                  {hasError && <p className="text-xs text-destructive mt-2 text-center">Insufficient balance. Available: {formatUSDT(balance)}</p>}
                  {belowMin && <p className="text-xs text-destructive mt-2 text-center">Minimum investment is {formatUSDT(plan.minAmount)}</p>}
                  {aboveMax && <p className="text-xs text-destructive mt-2 text-center">Maximum investment is {formatUSDT(plan.maxAmount)}</p>}

                  {/* Quick amounts */}
                  {quickAmounts.length > 0 && (
                    <div className="flex gap-2 mt-4">
                      {quickAmounts.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => setAmount(v.toFixed(2))}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                            amountNum === v ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {formatUSDT(v)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Projections */}
                {canProceed && (
                  <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-emerald-600" />
                      <p className="text-sm font-bold text-foreground">Projected Returns</p>
                    </div>
                    {[
                      { label: "Daily Distribution", val: `${formatUSDT(dailyMin)} – ${formatUSDT(dailyMax)}` },
                      { label: `Total Return (${plan.durationDays} days)`, val: `${formatUSDT(totalMin)} – ${formatUSDT(totalMax)}`, bold: true },
                      { label: "Est. Final Value", val: `~${formatUSDT(amountNum + dailyAvg * plan.durationDays)}`, bold: true, color: "text-emerald-600" },
                    ].map(({ label, val, bold, color }) => (
                      <div key={label} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={cn("font-semibold", bold ? "text-foreground" : "", color)}>{val}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                      Expected earnings are calculated based on the investment terms and return rate. Returns are distributed daily.
                    </p>
                  </div>
                )}

                {/* Funding Deadline Explanation */}
                {fundingActive && (
                  <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-start gap-3">
                    <Info size={15} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">About Your Investment Timing</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The funding deadline ({formatDate(fundingDeadline!)}) only controls when new investors can join.
                        Your personal <span className="font-semibold text-foreground">{plan.durationDays}-day investment term</span> starts from the day you participate.
                        Even if you invest on the final day before funding closes, you receive the full duration.
                      </p>
                    </div>
                  </div>
                )}

                {/* Blocked */}
                {isBlocked && (
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex items-center gap-3">
                    <Info size={14} className="text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-600 font-medium">
                      {plan.status === "paused" ? "This property is currently paused." :
                       plan.status === "fully_allocated" ? "This property is fully funded." :
                       "This property is no longer accepting investments."}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: Review */}
            {step === 2 && (
              <div className="v3-card p-5 space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold text-foreground">Review Your Investment</h3>
                <div className="space-y-3">
                  {[
                    { label: "Property", val: plan.name },
                    plan.location && { label: "Location", val: plan.location },
                    { label: "Investment Amount", val: formatUSDT(amountNum), bold: true },
                    { label: "Daily Return Rate", val: `${(minRoi * 100).toFixed(1)}%–${(maxRoi * 100).toFixed(1)}%` },
                    { label: "Investment Term", val: `${plan.durationDays} days` },
                    { label: "Start Date", val: formatDate(startDate) },
                    { label: "Maturity Date", val: formatDate(endDate), bold: true },
                    { label: "Est. Daily Return", val: `${formatUSDT(dailyMin)}–${formatUSDT(dailyMax)}` },
                    { label: "Est. Total Return", val: `${formatUSDT(totalMin)}–${formatUSDT(totalMax)}`, bold: true },
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className={cn("text-sm font-semibold", item.bold ? "text-foreground" : "text-foreground/80")}>{item.val}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 mt-3">
                  <div className="flex items-start gap-2">
                    <Shield size={13} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Your {plan.durationDays}-day investment term begins from today ({formatDate(startDate)}) and ends on {formatDate(endDate)}.
                        This is independent of the property's funding deadline. Returns are distributed daily according to the investment terms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT: Summary Sidebar ═══ */}
          <div className="lg:col-span-2 space-y-5">
            <div className="v3-card-elevated p-5 space-y-4 lg:sticky lg:top-20">
              <p className="text-sm font-bold text-foreground">{step === 1 ? "Investment Summary" : "Confirm Investment"}</p>
              <div className="h-px bg-border/50" />
              <div className="space-y-3">
                {[
                  { label: "Property", val: plan.name },
                  { label: "Duration", val: `${plan.durationDays} days` },
                  { label: "Daily Return", val: `${(minRoi * 100).toFixed(1)}%–${(maxRoi * 100).toFixed(1)}%` },
                  { label: "Your Balance", val: formatUSDT(balance) },
                  ...(amountNum >= plan.minAmount ? [
                    { label: "Investment", val: formatUSDT(amountNum), bold: true },
                    { label: "Est. Daily", val: `${formatUSDT(dailyMin)}–${formatUSDT(dailyMax)}` },
                    { label: "Est. Total", val: `${formatUSDT(totalMin)}–${formatUSDT(totalMax)}`, bold: true },
                    step === 2 && { label: "Maturity", val: formatDate(endDate), bold: true },
                  ] : []),
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={cn("font-semibold", item.bold ? "text-foreground" : "text-foreground/80")}>{item.val}</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-border/50" />

              {/* Server error */}
              {serverError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  <p className="text-xs text-destructive font-medium">{serverError}</p>
                </div>
              )}

              {/* Action */}
              {step === 1 ? (
                <Button
                  className="w-full h-12 rounded-xl font-bold"
                  onClick={() => canProceed && setStep(2)}
                  disabled={!canProceed}
                >
                  Continue to Review <ArrowRight size={15} className="ml-1" />
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    className="w-full h-12 rounded-xl font-bold text-base"
                    onClick={handleInvest}
                    disabled={createInvestment.isPending}
                  >
                    {createInvestment.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">Confirm Investment <ArrowRight size={15} /></span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-9 rounded-xl text-xs text-muted-foreground"
                    onClick={() => setStep(1)}
                    disabled={createInvestment.isPending}
                  >
                    Back to Amount
                  </Button>
                </div>
              )}

              {/* Trust */}
              <div className="bg-muted/30 rounded-xl p-3 flex items-start gap-2">
                <Shield size={13} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your capital is allocated for the full {plan.durationDays}-day term. All terms are fixed at participation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
