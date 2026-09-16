import { useEffect, useState, useRef } from "react";
import {
  TrendingUp, MapPin, Building2, Clock, ArrowRight,
  ArrowUpRight, ArrowDownLeft, Wallet, ChevronRight,
  DollarSign, Home, ArrowLeftRight, Users, Target, Sparkles,
  Shield, Eye, Lock, CircleCheck, ChevronRight as ChevronRightIcon,
} from "lucide-react";
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetInvestmentPlans, getGetInvestmentPlansQueryKey,
  useGetUserInvestments, getGetUserInvestmentsQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUSDT } from "@/lib/format";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";

/* ─── Live earnings counter ──────────────────────────────────────────────── */
function LiveEarnings({ base, rate }: { base: number; rate: number }) {
  const [earnings, setEarnings] = useState(base);
  const lastTick = useRef(Date.now());
  useEffect(() => { setEarnings(base); }, [base]);
  useEffect(() => {
    if (rate <= 0) return;
    const perMs = rate / 24 / 3600 / 1000;
    const interval = setInterval(() => {
      const now = Date.now();
      setEarnings((prev) => prev + (now - lastTick.current) * perMs);
      lastTick.current = now;
    }, 1000);
    return () => clearInterval(interval);
  }, [rate]);
  return <span className="tabular-nums">{formatUSDT(earnings)}</span>;
}

/* ─── Property image helper ──────────────────────────────────────────────── */
function PropertyImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={cn("bg-gradient-to-br from-emerald-900/40 to-graphite-800 flex items-center justify-center", className)}>
        <Building2 size={28} className="text-emerald-500/30" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

/* ─── Days remaining helper ──────────────────────────────────────────────── */
function daysRemaining(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD — ESTATEFUND REAL ESTATE INVESTMENT PLATFORM
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey(), staleTime: 30000 },
  });
  const { data: plans } = useGetInvestmentPlans({
    query: { queryKey: getGetInvestmentPlansQueryKey(), staleTime: 60000 },
  });
  const { data: investments } = useGetUserInvestments({
    query: { queryKey: getGetUserInvestmentsQueryKey(), staleTime: 30000 },
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeInvestments = (investments as any[])?.filter((i: any) => i.status === "active") ?? [];
  const featuredPlans = (plans as any[])?.filter((p: any) => p.isFeatured && p.isActive).slice(0, 3) ?? [];

  return (
    <AppLayout>
      <div className="pt-4 pb-28 space-y-4 md:space-y-6">

        {/* ═══════════════════════════════════════════════════════════════
           A. PERSONAL PORTFOLIO HERO
           ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-3 animate-fade-in">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{greeting}</p>
            {user ? (
              <h1 className="text-xl md:text-2xl font-bold text-foreground mt-0.5">
                {user.fullName || `@${user.username}`}
              </h1>
            ) : (
              <Skeleton className="h-6 w-40 mt-1.5" />
            )}
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Your property portfolio at a glance.</p>
          </div>

          {/* Hero financial card */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-4 md:p-6 text-white shadow-xl shadow-emerald-900/25">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] md:text-[11px] text-white/50 uppercase tracking-wider font-medium">Total Invested</p>
              <Link href="/wallet" className="text-[10px] md:text-[11px] text-white/40 hover:text-white/80 flex items-center gap-0.5 transition-colors">
                Wallet <ChevronRight size={10} />
              </Link>
            </div>
            {summaryLoading ? (
              <Skeleton className="h-9 md:h-11 w-44 md:w-52 bg-white/15 mb-2" />
            ) : (
              <p className="text-2xl md:text-4xl font-bold tracking-tight tabular-nums">
                {formatUSDT(summary?.activeInvestmentsValue ?? 0)}
              </p>
            )}

            {/* KPI row — 2 cols mobile, 4 cols desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 md:mt-4">
              <div className="bg-white/10 rounded-xl px-2.5 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <TrendingUp size={10} className="text-emerald-200" />
                  <p className="text-[8px] md:text-[9px] text-white/45 uppercase tracking-wider font-medium">Daily Earnings</p>
                </div>
                <p className="text-xs md:text-sm font-bold text-white tabular-nums">
                  {summaryLoading ? "—" : formatUSDT(summary?.dailyEarnings ?? 0)}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl px-2.5 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <Target size={10} className="text-emerald-200" />
                  <p className="text-[8px] md:text-[9px] text-white/45 uppercase tracking-wider font-medium">Total Earned</p>
                </div>
                <p className="text-xs md:text-sm font-bold text-white tabular-nums">
                  {summaryLoading ? "—" : formatUSDT(summary?.totalEarnings ?? 0)}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl px-2.5 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <Home size={10} className="text-emerald-200" />
                  <p className="text-[8px] md:text-[9px] text-white/45 uppercase tracking-wider font-medium">Properties</p>
                </div>
                <p className="text-xs md:text-sm font-bold text-white tabular-nums">
                  {summaryLoading ? "—" : summary?.activeInvestmentsCount ?? 0}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl px-2.5 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <Clock size={10} className="text-amber-200" />
                  <p className="text-[8px] md:text-[9px] text-white/45 uppercase tracking-wider font-medium">Pending</p>
                </div>
                <p className="text-xs md:text-sm font-bold text-white tabular-nums">
                  {summaryLoading ? "—" : summary && summary.pendingEarnings > 0 ? (
                    <LiveEarnings base={summary.pendingEarnings} rate={summary.dailyEarnings} />
                  ) : "0.00 USDT"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           B. BUSINESS PROMOTIONAL BANNER — Compact on mobile
           ═══════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl animate-fade-in">
          <div className="absolute inset-0">
            <PropertyImage
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80"
              alt="Modern commercial architecture"
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-emerald-800/80 to-emerald-700/60" />
          </div>
          {/* Mobile: compact. Desktop: full. */}
          <div className="relative px-4 py-4 md:px-10 md:py-10">
            <p className="text-[9px] md:text-[10px] text-emerald-200/60 uppercase tracking-[0.2em] font-bold">EstateFund</p>
            <h2 className="text-lg md:text-2xl font-bold text-white mt-1 md:mt-2 leading-tight max-w-lg">
              Invest in Real Estate, Built for the Future
            </h2>
            <p className="text-xs md:text-sm text-white/60 mt-1.5 md:mt-2 max-w-md leading-relaxed hidden md:block">
              Explore professionally presented property opportunities across residential, commercial and hospitality markets.
            </p>
            <div className="flex items-center gap-3 mt-3 md:mt-5">
              <Link href="/investments">
                <Button className="bg-white text-emerald-800 hover:bg-white/90 font-semibold rounded-xl px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm shadow-lg">
                  Explore Properties <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           C. MY ACTIVE PROPERTIES
           ═══════════════════════════════════════════════════════════════ */}
        {activeInvestments.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Home size={15} className="text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">My Active Properties</h2>
                  <p className="text-[11px] text-muted-foreground">{activeInvestments.length} currently running</p>
                </div>
              </div>
              <Link href="/portfolio" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
                View all <ChevronRight size={11} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeInvestments.slice(0, 2).map((inv: any) => {
                const endDate = new Date(inv.endDate);
                const now = new Date();
                const totalMs = endDate.getTime() - new Date(inv.startDate).getTime();
                const elapsedMs = now.getTime() - new Date(inv.startDate).getTime();
                const progress = totalMs > 0 ? Math.min(1, Math.max(0, elapsedMs / totalMs)) : 0;
                const remaining = daysRemaining(inv.endDate);

                return (
                  <Link key={inv.id} href="/portfolio">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                      <div className="relative h-24 md:h-32 overflow-hidden">
                        <PropertyImage
                          src={inv.bannerImageUrl || inv.images?.[0]}
                          alt={inv.planName}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {inv.location && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-lg">
                            <MapPin size={10} />
                            {inv.location}
                          </div>
                        )}
                        {inv.propertyType && (
                          <div className="absolute top-3 right-3 bg-emerald-500/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-lg capitalize">
                            {inv.propertyType}
                          </div>
                        )}
                      </div>

                      <div className="p-3 md:p-4">
                        <h3 className="font-semibold text-foreground text-sm mb-2 truncate">{inv.planName}</h3>

                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">Invested</span>
                          <span className="font-semibold text-foreground tabular-nums">{formatUSDT(inv.amount)}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs mb-2.5">
                          <span className="text-muted-foreground">Pending Earnings</span>
                          <span className="font-semibold text-emerald-500 tabular-nums">+{formatUSDT(inv.pendingEarnings)}</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{Math.round(progress * 100)}% complete</span>
                            <span>{remaining}d remaining</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state when no active properties */}
        {investments && activeInvestments.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Home size={24} className="text-emerald-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No Active Properties</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Start building your real estate portfolio by exploring available investment opportunities.
            </p>
            <Link href="/investments">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                Explore Properties <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
           D. FEATURED PROPERTIES — MARKETPLACE PROMOTION
           ═══════════════════════════════════════════════════════════════ */}
        {featuredPlans.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles size={15} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Featured Properties</h2>
                  <p className="text-[11px] text-muted-foreground">Explore selected real estate investment opportunities</p>
                </div>
              </div>
              <Link href="/investments" className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
                View All Properties <ChevronRight size={11} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featuredPlans.slice(0, 2).map((plan: any) => {
                const fundingGoal = plan.fundingGoal ? parseFloat(plan.fundingGoal) : null;
                const currentFunding = parseFloat(plan.currentFunding ?? "0");
                const fundingProgress = fundingGoal && fundingGoal > 0 ? Math.min(1, currentFunding / fundingGoal) : 0;
                const minAmt = parseFloat(plan.minAmount);
                const deadlineLeft = plan.fundingDeadline ? daysRemaining(plan.fundingDeadline) : null;

                return (
                  <Link key={plan.id} href={`/opportunity/${plan.id}`}>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group h-full flex flex-col">
                      <div className="relative h-28 md:h-40 overflow-hidden">
                        <PropertyImage
                          src={plan.bannerImageUrl || plan.images?.[0]}
                          alt={plan.name}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {plan.location && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-lg">
                            <MapPin size={10} />
                            {plan.location}
                          </div>
                        )}
                        {plan.propertyType && (
                          <div className="absolute top-3 right-3 bg-emerald-500/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-lg capitalize">
                            {plan.propertyType}
                          </div>
                        )}
                        {deadlineLeft !== null && (
                          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-lg">
                            <Clock size={10} className="inline mr-1" />
                            {deadlineLeft > 0 ? `${deadlineLeft}d to fund` : "Funding closed"}
                          </div>
                        )}
                      </div>

                      <div className="p-3 md:p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-foreground text-sm mb-1 truncate">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{plan.description}</p>
                        )}

                        {fundingGoal && (
                          <div className="mb-3">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.round(fundingProgress * 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                              <span>{formatUSDT(currentFunding)} raised</span>
                              <span>{formatUSDT(fundingGoal)} goal</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-auto grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted/40 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Min</p>
                            <p className="font-semibold text-foreground tabular-nums">{formatUSDT(minAmt)}</p>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Duration</p>
                            <p className="font-semibold text-foreground">{plan.durationDays}d</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
           E. WHY ESTATEFUND — Compact on mobile, full on desktop
           ═══════════════════════════════════════════════════════════════ */}
        <div className="animate-fade-in">
          {/* Desktop: full section. Mobile: compact link. */}
          <div className="hidden md:block">
            <div className="text-center mb-5">
              <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold">Why EstateFund</p>
              <h2 className="text-lg font-bold text-foreground mt-1.5">A Platform Built for Property Investors</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Everything you need to explore, invest and track real estate opportunities.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Building2, title: "Property-Focused", desc: "Explore real estate opportunities across residential, commercial and hospitality categories." },
                { icon: Eye, title: "Transparent Terms", desc: "See minimum investment, projected return, funding progress and duration before investing." },
                { icon: CircleCheck, title: "Structured Investments", desc: "Each investment has its own start date, maturity date and projected return rate." },
                { icon: Shield, title: "Secure Account", desc: "Manage your wallet, investments and account verification from one platform." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Icon size={18} className="text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile: compact summary with link */}
          <Link href="/about" className="block md:hidden bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Why EstateFund</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Property-focused · Transparent terms · Structured returns · Secure</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           F. HOW ESTATEFUND WORKS — Compact on mobile, full on desktop
           ═══════════════════════════════════════════════════════════════ */}
        <div className="animate-fade-in">
          {/* Desktop: full section */}
          <div className="hidden md:block">
            <div className="text-center mb-5">
              <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold">How It Works</p>
              <h2 className="text-lg font-bold text-foreground mt-1.5">Start Investing in Minutes</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { step: "01", title: "Fund Your Wallet", desc: "Add funds to your EstateFund wallet to get started." },
                { step: "02", title: "Choose a Property", desc: "Explore available opportunities and review the investment terms." },
                { step: "03", title: "Invest", desc: "Choose your investment amount and confirm your commitment." },
                { step: "04", title: "Track Your Investment", desc: "Monitor your property investment, earnings and maturity date." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="bg-card border border-border rounded-2xl p-4 relative">
                  <span className="text-[10px] font-bold text-primary/30 uppercase tracking-widest">{step}</span>
                  <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile: compact summary with link */}
          <Link href="/how-it-works" className="block md:hidden bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">01→04</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">How It Works</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Fund · Choose · Invest · Track — start in minutes</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           G. EARNINGS & QUICK ACTIONS
           ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">

          {/* Earnings Section */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign size={15} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Earnings Overview</h3>
                <p className="text-[11px] text-muted-foreground">Your investment returns</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Total Earned</span>
                <span className="text-sm font-bold text-emerald-500 tabular-nums">{formatUSDT(summary?.totalEarnings ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Pending Earnings</span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {summary && summary.pendingEarnings > 0 ? (
                    <LiveEarnings base={summary.pendingEarnings} rate={summary.dailyEarnings} />
                  ) : formatUSDT(0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Daily Earning Rate</span>
                <span className="text-sm font-bold text-foreground tabular-nums">{formatUSDT(summary?.dailyEarnings ?? 0)}/day</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-muted-foreground">Referral Earnings</span>
                <span className="text-sm font-bold text-foreground tabular-nums">{formatUSDT(summary?.referralEarnings ?? 0)}</span>
              </div>
            </div>

            {summary && summary.pendingEarnings > 0 && (
              <Link href="/portfolio" className="mt-4">
                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-50">
                  View Earnings Details <ArrowRight size={12} className="ml-1" />
                </Button>
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <ArrowLeftRight size={15} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
                <p className="text-[11px] text-muted-foreground">Manage your account</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link href="/deposit">
                <div className="bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-[0.97]">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <ArrowDownLeft size={18} className="text-emerald-500" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Deposit</span>
                </div>
              </Link>
              <Link href="/withdraw">
                <div className="bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-[0.97]">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <ArrowUpRight size={18} className="text-red-500" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Withdraw</span>
                </div>
              </Link>
              <Link href="/investments">
                <div className="bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-[0.97]">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Building2 size={18} className="text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Properties</span>
                </div>
              </Link>
              <Link href="/referrals">
                <div className="bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all cursor-pointer active:scale-[0.97]">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Users size={18} className="text-violet-500" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Refer</span>
                </div>
              </Link>
            </div>

            {/* Wallet balance summary */}
            <div className="mt-4 bg-muted/30 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wallet size={15} className="text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Wallet Balance</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {summaryLoading ? "—" : formatUSDT(summary?.totalBalance ?? 0)}
                  </p>
                </div>
              </div>
              <Link href="/wallet">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs gap-1 rounded-xl">
                  Manage <ChevronRight size={11} />
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
