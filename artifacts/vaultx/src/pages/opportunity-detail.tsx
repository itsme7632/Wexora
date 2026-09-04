import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowRight, Users, Clock, TrendingUp, CheckCircle, Star, BarChart3,
  Target, Shield, ChevronLeft, MapPin, Calendar, Image as ImageIcon,
  Home, Briefcase, TreePine, Building2, ChevronRight, Info, Zap,
} from "lucide-react";
import { useGetInvestmentPlans, getGetInvestmentPlansQueryKey, useGetUserInvestments, getGetUserInvestmentsQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { SubPageLayout } from "@/components/SubPageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatUSDT } from "@/lib/format";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { useAuth } from "@/lib/auth";

/* ─── Property type config ─────────────────────────────────────────────── */
const PROPERTY_TYPE_CONFIG: Record<string, { label: string; icon: typeof Building2 }> = {
  residential: { label: "Residential", icon: Home },
  commercial:  { label: "Commercial", icon: Briefcase },
  land:        { label: "Land", icon: TreePine },
  apartment:   { label: "Apartment", icon: Building2 },
  villa:       { label: "Villa", icon: Home },
  tower:       { label: "Tower", icon: Building2 },
  office:      { label: "Office", icon: Briefcase },
};

function getPropertyType(type?: string) {
  if (!type) return null;
  return PROPERTY_TYPE_CONFIG[type.toLowerCase()] ?? { label: type, icon: Building2 };
}

/* ─── Countdown ────────────────────────────────────────────────────────── */
function useCountdown(endDate?: string | null) {
  const [msLeft, setMsLeft] = useState(() => endDate ? Math.max(0, new Date(endDate).getTime() - Date.now()) : null);
  useEffect(() => {
    if (!endDate) return;
    const tick = () => setMsLeft(Math.max(0, new Date(endDate).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return msLeft;
}

function formatCountdown(ms: number | null): string {
  if (ms === null) return "—";
  if (ms <= 0) return "Ended";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 30) return `${Math.ceil(d / 30)} months`;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ═══════════════════════════════════════════════════════════════════════════
   OPPORTUNITY DETAIL — WEXORA V4.2
   Premium property listing: hero image gallery + 2-col details + sticky CTA
   ═══════════════════════════════════════════════════════════════════════════ */
export default function OpportunityDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const [, navigate] = useLocation();

  const { data: plans, isLoading } = useGetInvestmentPlans({ query: { queryKey: getGetInvestmentPlansQueryKey(), staleTime: 30000 } });
  const { user } = useAuth();
  const { data: platformMetrics } = usePlatformMetrics();
  const metricsMap = useMemo(() => { const m: Record<number, any> = {}; for (const p of (platformMetrics?.plans ?? [])) m[p.id] = p; return m; }, [platformMetrics]);

  /* User's existing investments in this property */
  const { data: userInvestments } = useGetUserInvestments({
    query: { queryKey: getGetUserInvestmentsQueryKey(), staleTime: 30000, enabled: !!user },
  });
  const myInvestments = (userInvestments as any[])?.filter((inv: any) => String(inv.planId) === planId) ?? [];
  const activeMyInvestment = myInvestments.find((inv: any) => inv.status === "active");

  const plan: any = plans?.find((p: any) => String(p.id) === planId);
  const id = plan?.id ?? 1;
  const minRoi = plan?.minRoiRate ?? 0.013;
  const maxRoi = plan?.maxRoiRate ?? 0.017;
  const avgRoi = (minRoi + maxRoi) / 2;

  const canonical = metricsMap[id];
  const capitalTarget = canonical?.fundingGoal ?? (plan?.fundingGoal != null ? Number(plan.fundingGoal) : 0);
  const capitalRaised = canonical?.capitalRaised ?? (plan?.currentFunding != null ? Number(plan.currentFunding) : 0);
  const raisedPct = canonical != null ? canonical.fundingPct : capitalTarget > 0 ? Math.min(100, (capitalRaised / capitalTarget) * 100) : 0;
  const participants = canonical?.participants ?? 0;

  /* Images */
  const propertyImages: string[] = plan?.images?.filter((img: string) => img?.trim()) ?? [];
  const allImages = [plan?.bannerImageUrl, ...propertyImages].filter(Boolean);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const primaryImage = allImages[selectedIdx] || allImages[0] || null;

  /* Funding deadline */
  /* Funding deadline */
  const fundingDeadline = plan?.fundingDeadline ? new Date(plan.fundingDeadline) : null;
  const fundingMsLeft = useCountdown(fundingDeadline?.toISOString());
  const fundingActive = fundingDeadline && fundingDeadline.getTime() > Date.now();

  /* User investment details */
  const userInvProgress = activeMyInvestment ? (() => {
    const s = new Date(activeMyInvestment.startDate).getTime();
    const e = new Date(activeMyInvestment.endDate).getTime();
    const now = Date.now();
    const total = e - s;
    const elapsed = now - s;
    return { progress: total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 0, remaining: Math.max(0, Math.ceil((e - now) / 86400000)) };
  })() : null;

  /* Property type */
  const propType = getPropertyType(plan?.propertyType);

  /* Blocked status */
  const BLOCKED = ["paused", "expired", "closed", "fully_allocated"];
  const ended = plan?.endDate && new Date(plan.endDate).getTime() < Date.now();
  const blocked = BLOCKED.includes(plan?.status ?? "") || ended;

  if (isLoading) {
    return (
      <SubPageLayout title="Property" onBack={() => navigate("/investments")}>
        <div className="max-w-6xl mx-auto px-4 py-5 space-y-4">
          <Skeleton className="h-72 rounded-2xl" />
          <div className="grid lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>
            <div className="lg:col-span-2"><Skeleton className="h-64 rounded-2xl" /></div>
          </div>
        </div>
      </SubPageLayout>
    );
  }

  if (!plan) {
    return (
      <SubPageLayout title="Property" onBack={() => navigate("/investments")}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-primary/50" />
          </div>
          <p className="font-bold text-foreground text-lg">Property not found</p>
          <p className="text-sm text-muted-foreground mt-1">This property may have been removed or is not available.</p>
          <Button variant="outline" className="mt-5" onClick={() => navigate("/investments")}>Browse Properties</Button>
        </div>
      </SubPageLayout>
    );
  }

  return (
    <SubPageLayout title="Property Details" onBack={() => navigate("/investments")}>
      <div className="max-w-6xl mx-auto px-4 py-5 lg:px-8 pb-32 space-y-5">

        {/* ── Image Gallery ────────────────────────────────────── */}
        {allImages.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[16/7]">
              {primaryImage ? (
                <img src={primaryImage} alt={plan.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="flex items-center justify-center h-full"><ImageIcon size={48} className="text-muted-foreground/20" /></div>
              )}
              {/* Overlay badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {plan.isFeatured && (
                  <span className="flex items-center gap-1 bg-amber-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
                    <Star size={11} className="fill-current" /> Featured
                  </span>
                )}
                {propType && (
                  <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
                    <propType.icon size={11} /> {propType.label}
                  </span>
                )}
              </div>
              {/* Back button */}
              <div className="absolute top-4 right-4">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 h-9 px-3 rounded-xl backdrop-blur-sm" onClick={() => navigate("/investments")}>
                  <ChevronLeft size={14} /> Back
                </Button>
              </div>
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedIdx(i)} className={cn("shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all", selectedIdx === i ? "border-primary shadow-sm" : "border-transparent opacity-60 hover:opacity-100")}>
                    <img src={img} alt={`${plan.name} ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Hero Section (when no images) ────────────────────── */}
        {allImages.length === 0 && (
          <div className="v3-gradient rounded-2xl p-6 md:p-8 text-white animate-fade-in">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 h-8 px-2 rounded-lg" onClick={() => navigate("/investments")}><ChevronLeft size={14} /> Back</Button>
              {plan.isFeatured && <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/20 text-[10px] font-bold"><Star size={10} className="mr-1 fill-current" /> Featured</Badge>}
              {propType && <Badge className="bg-white/15 text-white border-white/20 text-[10px] font-bold"><propType.icon size={10} className="mr-1" /> {propType.label}</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">{plan.name}</h1>
            {plan.location && (
              <div className="flex items-center gap-1.5 mb-3">
                <MapPin size={13} className="text-white/60" />
                <p className="text-white/70 text-sm font-medium">{plan.location}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Title Row (when images exist) ────────────────────── */}
        {allImages.length > 0 && (
          <div className="flex items-start justify-between animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {propType && <Badge variant="outline" className="text-[10px] font-bold capitalize"><propType.icon size={10} className="mr-1" /> {propType.label}</Badge>}
                <Badge variant="outline" className="text-[10px] font-bold">{plan.category}</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{plan.name}</h1>
              {plan.location && (
                <div className="flex items-center gap-1.5 mt-2">
                  <MapPin size={14} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-medium">{plan.location}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Desktop: 2-column layout ─────────────────────────── */}
        <div className="lg:grid lg:grid-cols-5 lg:gap-6 space-y-5 lg:space-y-0">

          {/* ═══ LEFT COLUMN: Property Details ═══ */}
          <div className="lg:col-span-3 space-y-5">

            {/* Property Description */}
            <div className="v3-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">About This Property</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
              {plan.features?.length > 0 && (
                <div className="space-y-2 mt-3">
                  {plan.features.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Funding Progress */}
            <div className="v3-card p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><BarChart3 size={15} className="text-primary" /></div>
                <h3 className="font-semibold text-sm text-foreground">Funding Progress</h3>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Raised</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{formatUSDT(capitalRaised)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Goal</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{formatUSDT(capitalTarget)}</p>
                </div>
              </div>
              <div className="h-3 bg-muted/60 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${raisedPct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(raisedPct)}% of target capital secured</span>
                <span>{participants.toLocaleString()} investor{participants !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Investment Returns */}
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-emerald-600" />
                <p className="text-sm font-bold text-foreground">Investment Returns</p>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { val: `${(minRoi * 100).toFixed(1)}%–${(maxRoi * 100).toFixed(1)}%`, lbl: "Daily Return" },
                  { val: `${plan.durationDays} days`, lbl: "Investment Term" },
                  { val: `${(avgRoi * plan.durationDays * 100).toFixed(0)}%`, lbl: "Est. Total Return" },
                ].map(({ val, lbl }) => (
                  <div key={lbl} className="bg-white/60 dark:bg-white/5 rounded-xl py-3 text-center">
                    <p className="text-lg font-bold text-foreground tabular-nums">{val}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{lbl}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Daily Return Rate", val: `${(minRoi * 100).toFixed(1)}% – ${(maxRoi * 100).toFixed(1)}%` },
                  { label: `Projected Total (${plan.durationDays} days)`, val: `${(minRoi * plan.durationDays * 100).toFixed(0)}% – ${(maxRoi * plan.durationDays * 100).toFixed(0)}%`, bold: true },
                  { label: "Investment Range", val: `${formatUSDT(plan.minAmount)} – ${formatUSDT(plan.maxAmount)}` },
                  { label: "Earnings Start", val: "Within 24 hours of participation" },
                ].map(({ label, val, bold }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cn("font-semibold", bold ? "text-emerald-600" : "text-foreground")}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Details Grid */}
            <div className="v3-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Property Details</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  plan.propertyType && { label: "Property Type", val: propType?.label ?? plan.propertyType },
                  plan.location && { label: "Location", val: plan.location },
                  { label: "Investment Term", val: `${plan.durationDays} days` },
                  { label: "Min. Investment", val: formatUSDT(plan.minAmount) },
                  fundingDeadline && { label: "Funding Closes", val: formatDate(fundingDeadline) },
                  { label: "Return Structure", val: "Daily distributions" },
                  { label: "Risk Level", val: plan.riskLevel ? plan.riskLevel.charAt(0).toUpperCase() + plan.riskLevel.slice(1) : "Medium" },
                  plan.autoCompoundAvailable !== false && { label: "Auto-Compound", val: "Available" },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="bg-muted/30 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Dates — Funding Deadline vs Duration */}
            <div className="v3-card p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><Calendar size={15} className="text-amber-500" /></div>
                <h3 className="font-semibold text-sm text-foreground">Important Dates</h3>
              </div>

              <div className="space-y-0">
                {/* Funding deadline */}
                {fundingDeadline && (
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <div>
                      <p className="text-sm text-foreground font-medium">Funding Deadline</p>
                      <p className="text-[11px] text-muted-foreground">Last date for new investments</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatDate(fundingDeadline)}</p>
                      {fundingActive && <p className="text-[10px] text-emerald-500 font-bold mt-0.5">{formatCountdown(fundingMsLeft)}</p>}
                    </div>
                  </div>
                )}

                {/* Investment duration */}
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <div>
                    <p className="text-sm text-foreground font-medium">Your Investment Term</p>
                    <p className="text-[11px] text-muted-foreground">From your participation date</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{plan.durationDays} days</span>
                </div>

                {/* How it works */}
                {fundingDeadline && (
                  <div className="pt-3">
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                      <div className="flex items-start gap-2.5">
                        <Info size={14} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-foreground mb-1">How Your Investment Duration Works</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            The funding deadline ({formatDate(fundingDeadline)}) controls when new investors can join this property.
                            Your personal <span className="font-semibold text-foreground">{plan.durationDays}-day investment term</span> starts from the day your investment is confirmed — not from the funding deadline.
                            Even if you invest on the final day before funding closes, you still receive the full {plan.durationDays}-day term.
                            Your maturity date is calculated individually based on your participation date.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User's Existing Investment */}
            {activeMyInvestment && (
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <h3 className="text-sm font-bold text-foreground">Your Investment</h3>
                  <span className="ml-auto text-[10px] font-bold bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded-full">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/60 dark:bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Invested</p>
                    <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{formatUSDT(activeMyInvestment.amount)}</p>
                  </div>
                  <div className="bg-white/60 dark:bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Pending Earnings</p>
                    <p className="text-lg font-bold text-emerald-500 tabular-nums mt-0.5">+{formatUSDT(activeMyInvestment.pendingEarnings)}</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="font-semibold text-foreground">{formatDate(activeMyInvestment.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maturity Date</span>
                    <span className="font-semibold text-foreground">{formatDate(activeMyInvestment.endDate)}</span>
                  </div>
                  {userInvProgress && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Days Remaining</span>
                        <span className="font-semibold text-primary">{userInvProgress.remaining} days</span>
                      </div>
                      <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(userInvProgress.progress * 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center">{Math.round(userInvProgress.progress * 100)}% of investment term complete</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="v3-card-sunken p-4">
              <p className="text-xs font-bold text-foreground mb-2">How This Investment Works</p>
              <div className="space-y-2">
                {[
                  "Choose your investment amount within the participation range.",
                  "Your investment is confirmed and your personal term begins immediately.",
                  "Returns are calculated and distributed to your wallet daily.",
                  "Once fully allocated, this property closes to new investors.",
                  "All terms are locked at the time of your participation.",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN: Sticky Investment Sidebar ═══ */}
          <div className="lg:col-span-2 space-y-5">
            <div className="v3-card-elevated p-5 space-y-4 lg:sticky lg:top-20">

              {/* Investment Range */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-bold">Investment Range</p>
                <p className="text-2xl font-bold text-foreground mt-1">{formatUSDT(plan.minAmount)} – {formatUSDT(plan.maxAmount)}</p>
              </div>

              <div className="h-px bg-border/50" />

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Clock, label: "Duration", val: `${plan.durationDays} days` },
                  { icon: TrendingUp, label: "Daily Return", val: `${(minRoi * 100).toFixed(1)}%–${(maxRoi * 100).toFixed(1)}%` },
                  { icon: Target, label: "Min. Investment", val: formatUSDT(plan.minAmount) },
                  { icon: Users, label: "Investors", val: participants.toLocaleString() },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="v3-card-sunken p-2.5 text-center">
                    <Icon size={12} className="text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs font-bold text-foreground">{val}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Funding Progress */}
              {capitalTarget > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{Math.round(raisedPct)}% funded</span>
                    <span className="font-semibold text-foreground tabular-nums">{formatUSDT(capitalRaised)} / {formatUSDT(capitalTarget)}</span>
                  </div>
                  <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${raisedPct}%` }} />
                  </div>
                </div>
              )}

              {/* Funding Deadline */}
              {fundingDeadline && (
                <div className={cn("rounded-xl p-3 flex items-center justify-between", fundingActive ? "bg-emerald-500/5 border border-emerald-500/15" : "bg-muted/40")}>
                  <div className="flex items-center gap-2">
                    <Zap size={12} className={fundingActive ? "text-emerald-500" : "text-muted-foreground"} />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Funding Closes</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(fundingDeadline)}</p>
                    </div>
                  </div>
                  {fundingActive && (
                    <span className="text-xs font-bold text-emerald-600 tabular-nums">{formatCountdown(fundingMsLeft)}</span>
                  )}
                </div>
              )}

              {/* Estimated Return */}
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mb-1">Estimated Return</p>
                <p className="text-lg font-bold text-emerald-600 tabular-nums">{(avgRoi * plan.durationDays * 100).toFixed(0)}% over {plan.durationDays} days</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Based on average daily return rate</p>
              </div>

              <div className="h-px bg-border/50" />

              {/* CTA */}
              {blocked ? (
                <div className="space-y-2">
                  <Button className="w-full h-12 rounded-xl font-bold opacity-50 cursor-not-allowed" disabled>Investment Unavailable</Button>
                  <p className="text-center text-xs text-muted-foreground">
                    {plan.status === "fully_allocated" ? "This property is fully funded" : fundingDeadline && !fundingActive ? "Funding period has ended" : "This property is not accepting investments"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button className="w-full h-12 rounded-xl font-bold text-base" onClick={() => navigate(`/invest/${plan.id}`)}>
                    Invest Now <ArrowRight size={16} className="ml-1.5" />
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">Daily returns begin within 24 hours</p>
                </div>
              )}

              {/* Trust */}
              <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2.5">
                <Shield size={13} className="text-primary shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">All investment terms are fixed at participation. Returns distributed daily.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
