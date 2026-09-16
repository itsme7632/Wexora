import { useState, useEffect, useMemo } from "react";
import {
  MapPin, Building2, Clock, TrendingUp, ArrowRight, Star, Users,
  Zap, Search, Filter, X, ChevronDown, Calendar, Target, BarChart3,
  Home, Briefcase, TreePine, Eye, Image as ImageIcon,
} from "lucide-react";
import {
  useGetInvestmentPlans, getGetInvestmentPlansQueryKey,
  useGetUserInvestments, getGetUserInvestmentsQueryKey,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatUSDT } from "@/lib/format";
import { usePlatformMetrics, type PlanMetricsItem } from "@/hooks/usePlatformMetrics";

/* ─── Property type config ─────────────────────────────────────────────── */
const PROPERTY_TYPE_CONFIG: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  residential: { label: "Residential", icon: Home, color: "text-blue-500 bg-blue-500/10" },
  commercial:  { label: "Commercial", icon: Briefcase, color: "text-purple-500 bg-purple-500/10" },
  "mixed-use": { label: "Mixed-Use", icon: Building2, color: "text-orange-500 bg-orange-500/10" },
  hospitality: { label: "Hospitality", icon: Home, color: "text-rose-500 bg-rose-500/10" },
  industrial:  { label: "Industrial", icon: Briefcase, color: "text-slate-500 bg-slate-500/10" },
  land:        { label: "Land", icon: TreePine, color: "text-emerald-500 bg-emerald-500/10" },
  apartment:   { label: "Apartment", icon: Building2, color: "text-amber-500 bg-amber-500/10" },
  villa:       { label: "Villa", icon: Home, color: "text-rose-500 bg-rose-500/10" },
  tower:       { label: "Tower", icon: Building2, color: "text-cyan-500 bg-cyan-500/10" },
  office:      { label: "Office", icon: Briefcase, color: "text-indigo-500 bg-indigo-500/10" },
};

function getPropertyTypeConfig(type?: string) {
  if (!type) return null;
  return PROPERTY_TYPE_CONFIG[type.toLowerCase()] ?? { label: type, icon: Building2, color: "text-muted-foreground bg-muted" };
}

/* ─── Status config ────────────────────────────────────────────────────── */
function getStatusBadge(plan: any) {
  switch (plan.status) {
    case "featured":    return { label: "Featured", cls: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" };
    case "trending":    return { label: "Trending", cls: "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800" };
    case "fully_allocated": return { label: "Fully Funded", cls: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800" };
    case "paused":      return { label: "Paused", cls: "bg-muted text-muted-foreground" };
    default:            return null;
  }
}

/* ─── Animated funding bar ─────────────────────────────────────────────── */
function FundingBar({ pct, className }: { pct: number; className?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 80); return () => clearTimeout(t); }, [pct]);
  return (
    <div className={cn("rounded-full overflow-hidden bg-muted/60", className ?? "h-2")}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-1000 ease-out",
          pct >= 90 ? "bg-amber-500" : pct >= 50 ? "bg-emerald-500" : "bg-primary"
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/* ─── Countdown ────────────────────────────────────────────────────────── */
function useCountdown(deadline?: string | null) {
  const [ms, setMs] = useState(() => deadline ? Math.max(0, new Date(deadline).getTime() - Date.now()) : null);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setMs(Math.max(0, new Date(deadline).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  if (ms === null) return null;
  if (ms <= 0) return "Ended";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  if (d > 30) return `${Math.ceil(d / 30)}mo left`;
  if (d > 0) return `${d}d ${h}h left`;
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m left`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROPERTY MARKETPLACE — ESTATEFUND
   ═══════════════════════════════════════════════════════════════════════════ */
export default function InvestmentsPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"marketplace" | "active">("marketplace");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: plans, isLoading: plansLoading } = useGetInvestmentPlans({
    query: { queryKey: getGetInvestmentPlansQueryKey(), staleTime: 30000, refetchInterval: 60000 },
  });
  const { data: userInvestments, isLoading: uiLoading } = useGetUserInvestments({
    query: { queryKey: getGetUserInvestmentsQueryKey(), staleTime: 15000, refetchInterval: 30000 },
  });
  const { data: metrics } = usePlatformMetrics();
  const metricsMap = useMemo<Record<number, PlanMetricsItem>>(() => {
    const m: Record<number, PlanMetricsItem> = {};
    for (const p of (metrics?.plans ?? [])) m[p.id] = p;
    return m;
  }, [metrics]);

  const activeCount = userInvestments?.filter((i: any) => i.status === "active").length ?? 0;
  const activePlans = (plans ?? []).filter((p: any) => p.isActive);

  /* Derived property types from data */
  const propertyTypes = useMemo(() => {
    const types = new Set<string>();
    activePlans.forEach((p: any) => { if (p.propertyType) types.add(p.propertyType); });
    return Array.from(types);
  }, [activePlans]);

  /* Filter & search */
  const filteredPlans = useMemo(() => {
    return activePlans.filter((plan: any) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!plan.name?.toLowerCase().includes(q) && !plan.location?.toLowerCase().includes(q) && !plan.description?.toLowerCase().includes(q)) return false;
      }
      if (filterType !== "all" && plan.propertyType?.toLowerCase() !== filterType) return false;
      if (filterStatus !== "all" && plan.status !== filterStatus) return false;
      return true;
    });
  }, [activePlans, searchQuery, filterType, filterStatus]);

  /* Featured plans */
  const featuredPlans = useMemo(() =>
    filteredPlans.filter((p: any) => p.isFeatured || p.status === "featured").slice(0, 3),
    [filteredPlans]
  );

  /* Non-featured plans */
  const regularPlans = useMemo(() =>
    filteredPlans.filter((p: any) => !p.isFeatured && p.status !== "featured"),
    [filteredPlans]
  );

  const getPlanStats = (plan: any) => {
    const canonical = metricsMap[plan.id];
    if (canonical) {
      return {
        participants: canonical.participants,
        raisedPct: canonical.fundingPct,
        capitalRaised: canonical.capitalRaised,
        capitalTarget: canonical.fundingGoal,
        capitalRemaining: canonical.capitalRemaining,
      };
    }
    const target = plan.fundingGoal != null ? Number(plan.fundingGoal) : 0;
    const raised = plan.currentFunding != null ? Number(plan.currentFunding) : 0;
    const pctRaw = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
    return {
      participants: plan.displayParticipantCount ?? 0,
      raisedPct: pctRaw,
      capitalRaised: raised,
      capitalTarget: target,
      capitalRemaining: Math.max(0, target - raised),
    };
  };

  return (
    <AppLayout fullBleed>
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-5 lg:px-8 space-y-4 md:space-y-5 pb-28">

        {/* ── Hero ────────────────────────────────────────────── */}
        <div className="v3-gradient rounded-2xl p-4 md:p-8 text-white animate-fade-in">
          <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-[0.15em] font-bold">Real Estate Investments</p>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight mt-1.5 md:mt-2">Property Marketplace</h1>
          <p className="text-white/50 text-xs md:text-sm mt-1 max-w-lg hidden md:block">Browse curated real estate investment opportunities. Invest in premium properties and earn returns.</p>
          <div className="grid grid-cols-3 gap-2 md:gap-3 mt-3 md:mt-5 max-w-md">
            {[
              { val: String(metrics?.activeOpportunities ?? activePlans.length), lbl: "Properties" },
              { val: (metrics?.totalParticipants ?? 0).toLocaleString(), lbl: "Investors" },
              { val: `${Math.round(metrics?.fundingPercentage ?? 0)}%`, lbl: "Avg. Funded" },
            ].map(({ val, lbl }) => (
              <div key={lbl} className="bg-white/10 rounded-xl py-2 md:py-3 text-center backdrop-blur-sm">
                <p className="font-bold text-sm md:text-lg tabular-nums">{val}</p>
                <p className="text-[8px] md:text-[9px] text-white/45 mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Switcher ─────────────────────────────────────── */}
        <div className="flex bg-muted/40 rounded-xl p-1">
          <button
            onClick={() => setTab("marketplace")}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5", tab === "marketplace" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
          >
            <Building2 size={14} /> Properties
          </button>
          <button
            onClick={() => setTab("active")}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5", tab === "active" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}
          >
            My Investments
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">{activeCount}</span>
            )}
          </button>
        </div>

        {/* ── Marketplace Tab ─────────────────────────────────── */}
        {tab === "marketplace" && (
          <div className="space-y-5">

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search properties by name or location..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                  showFilters || filterType !== "all" || filterStatus !== "all"
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <Filter size={14} /> Filters {(filterType !== "all" || filterStatus !== "all") && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="v3-card p-4 animate-fade-in">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mb-2">Property Type</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["all", ...propertyTypes].map(type => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            filterType === type ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mb-2">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["all", "active", "featured", "trending"].map(status => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            filterStatus === status ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {(filterType !== "all" || filterStatus !== "all") && (
                  <button onClick={() => { setFilterType("all"); setFilterStatus("all"); }} className="mt-3 text-xs text-primary font-semibold hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Featured Properties */}
            {featuredPlans.length > 0 && !searchQuery && filterType === "all" && filterStatus === "all" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <h3 className="text-sm font-bold text-foreground">Featured Properties</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredPlans.map((plan: any) => (
                    <PropertyCard key={plan.id} plan={plan} stats={getPlanStats(plan)} onClick={() => navigate(`/opportunity/${plan.id}`)} featured />
                  ))}
                </div>
              </div>
            )}

            {/* All Properties Grid */}
            <div className="space-y-3">
              {!searchQuery && filterType === "all" && filterStatus === "all" && (
                <h3 className="text-sm font-bold text-foreground">All Properties</h3>
              )}
              {plansLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="v3-card-elevated overflow-hidden">
                      <Skeleton className="h-44 w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(searchQuery || filterType !== "all" || filterStatus !== "all" ? filteredPlans : regularPlans).map((plan: any) => (
                    <PropertyCard key={plan.id} plan={plan} stats={getPlanStats(plan)} onClick={() => navigate(`/opportunity/${plan.id}`)} />
                  ))}
                </div>
              ) : (
                <div className="v3-card p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 size={28} className="text-primary/50" />
                  </div>
                  <p className="font-semibold text-foreground text-lg">No properties found</p>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {searchQuery ? "Try adjusting your search" : "Check back soon for new opportunities"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Active Investments Tab ─────────────────────────── */}
        {tab === "active" && (
          <div className="space-y-3">
            {uiLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
            ) : userInvestments?.filter((i: any) => i.status === "active").length ? (
              userInvestments
                .filter((i: any) => i.status === "active")
                .map((inv: any) => {
                  const minRoi = inv.minRoiRate ?? 0.013;
                  const maxRoi = inv.maxRoiRate ?? 0.017;
                  const currentValue = inv.currentValue ?? (inv.amount + inv.pendingEarnings);
                  const profitGrowth = inv.amount > 0 ? ((currentValue - inv.amount) / inv.amount) * 100 : 0;

                  return (
                    <div key={inv.id} className="v3-card-elevated overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/portfolio")}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-sm text-foreground">{inv.planName}</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{(minRoi * 100).toFixed(1)}%–{(maxRoi * 100).toFixed(1)}% daily · {inv.daysTotal}d term</p>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />Active
                          </Badge>
                        </div>
                <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-3">
                  {[
                    { label: "Invested", val: formatUSDT(inv.amount), cls: "text-foreground" },
                    { label: "Current Value", val: formatUSDT(currentValue), cls: "text-primary" },
                    { label: "Earnings", val: formatUSDT(inv.pendingEarnings), cls: "text-emerald-500" },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="v3-card-sunken p-1.5 md:p-2 text-center">
                      <p className="text-[8px] md:text-[9px] text-muted-foreground">{label}</p>
                      <p className={cn("text-[11px] md:text-xs font-bold tabular-nums mt-0.5", cls)}>{val}</p>
                    </div>
                  ))}
                </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Calendar size={11} />
                            <span>Day {Math.max(0, inv.daysTotal - inv.daysRemaining)} / {inv.daysTotal}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {profitGrowth > 0 && <span className="text-[11px] font-semibold text-emerald-500">+{profitGrowth.toFixed(1)}%</span>}
                            <ArrowRight size={12} className="text-primary" />
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(2, inv.progressPercent)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="v3-card p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp size={24} className="text-primary" />
                </div>
                <p className="font-semibold text-foreground">No active investments</p>
                <p className="text-xs text-muted-foreground mt-1">Browse properties to start investing</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROPERTY CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
function PropertyCard({ plan, stats, onClick, featured }: { plan: any; stats: any; onClick: () => void; featured?: boolean }) {
  const minRoi = plan.minRoiRate ?? 0.013;
  const maxRoi = plan.maxRoiRate ?? 0.017;
  const propertyType = getPropertyTypeConfig(plan.propertyType);
  const statusBadge = getStatusBadge(plan);
  const fundingDeadline = plan.fundingDeadline;
  const countdown = useCountdown(fundingDeadline);
  const primaryImage = plan.bannerImageUrl || plan.images?.[0] || null;
  const fundingPct = stats.raisedPct ?? 0;

  return (
    <div
      className={cn(
        "v3-card-elevated overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group",
        featured && "ring-2 ring-amber-200 dark:ring-amber-800"
      )}
      onClick={onClick}
    >
      {/* Property Image */}
      <div className="relative h-40 md:h-48 overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={plan.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted/50">
            <ImageIcon size={40} className="text-muted-foreground/20" />
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {featured && (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
              <Star size={10} className="fill-current" /> Featured
            </span>
          )}
          {statusBadge && (
            <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg border", statusBadge.cls)}>
              {statusBadge.label}
            </span>
          )}
        </div>
        {countdown && countdown !== "Ended" && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg">
              <Clock size={10} /> {countdown}
            </span>
          </div>
        )}
        {/* Property type badge */}
        {propertyType && (
          <div className="absolute bottom-3 left-3">
            <span className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg", propertyType.color)}>
              <propertyType.icon size={10} /> {propertyType.label}
            </span>
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="p-4 space-y-3">
        {/* Name & Location */}
        <div>
          <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight">{plan.name}</h3>
          {plan.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">{plan.location}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{plan.description}</p>
        )}

        {/* Return & Duration */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10">
            <TrendingUp size={12} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600 tabular-nums">{(minRoi * 100).toFixed(1)}%–{(maxRoi * 100).toFixed(1)}%</span>
            <span className="text-[10px] text-emerald-600/60">daily</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/60">
            <Clock size={11} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">{plan.durationDays}d</span>
          </div>
        </div>

        {/* Funding Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">{Math.round(fundingPct)}% funded</span>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{formatUSDT(stats.capitalRaised)} / {formatUSDT(stats.capitalTarget)}</span>
          </div>
          <FundingBar pct={fundingPct} />
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users size={11} />
              <span className="font-medium">{stats.participants.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Target size={11} />
              <span className="font-medium">Min {formatUSDT(plan.minAmount)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary text-xs font-semibold group-hover:gap-2 transition-all">
            View <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
