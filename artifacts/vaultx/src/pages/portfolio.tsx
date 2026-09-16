import { useState } from "react";
import {
  TrendingUp, Clock, ArrowDownLeft, MapPin, Building2, ChevronDown, ChevronUp,
  ArrowDownRight, BarChart2, CheckCircle, RotateCcw, Zap, ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import {
  useGetUserInvestments, getGetUserInvestmentsQueryKey,
  useClaimEarnings,
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveCounter, PayoutCountdown } from "@/components/LiveCounter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatUSDT, formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth";

/* ─── Earnings History Accordion ─────────────────────────────────────────── */
function EarningsHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: history, isLoading } = useQuery({
    queryKey: ["earnings-history"],
    queryFn: () => fetch("/api/investments/earnings-history?limit=90", { credentials: "include" }).then(r => r.json()),
    enabled: isOpen,
    staleTime: 60000,
  });
  const rows: { id: number; type: string; amount: number; note: string; createdAt: string }[] = history ?? [];
  const totalClaimed = rows.reduce((s, r) => s + r.amount, 0);
  const grouped: Record<string, typeof rows> = {};
  rows.forEach(r => {
    const day = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(r);
  });

  return (
    <div className="v3-card-elevated overflow-hidden">
      <button type="button" onClick={() => setIsOpen(p => !p)} className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/20 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart2 size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Profit History</p>
            <p className="text-[10px] text-muted-foreground">Claimed profit records</p>
          </div>
        </div>
        {isOpen ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="border-t border-border/50">
          <div className="bg-emerald-500/5 px-4 py-3">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total Profits Claimed</p>
            <p className="font-bold text-emerald-500 text-sm mt-0.5 tabular-nums">{formatUSDT(totalClaimed)}</p>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <RotateCcw size={18} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No profit history yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
              {Object.entries(grouped).map(([day, dayRows]) => {
                const dayTotal = dayRows.reduce((s, r) => s + r.amount, 0);
                return (
                  <div key={day} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-semibold text-foreground">{day}</p>
                      <p className="text-[11px] font-bold text-emerald-500 tabular-nums">+{formatUSDT(dayTotal)}</p>
                    </div>
                    <div className="space-y-1.5">
                      {dayRows.map(r => (
                        <div key={r.id} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <ArrowDownRight size={10} className="text-emerald-500" />
                          </div>
                          <p className="text-[11px] text-muted-foreground flex-1 min-w-0 truncate">
                            Profit Claimed{r.note ? ` · ${r.note.replace(/Earnings claimed from investment |Earnings claimed from /i, "opp ")}` : ""}
                          </p>
                          <p className="text-[11px] font-semibold shrink-0 text-emerald-500 tabular-nums">+{formatUSDT(r.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Property Investment Card ──────────────────────────────────────────── */
function PropertyCard({ inv, onClaim, isClaiming }: {
  inv: any;
  onClaim: (id: number, amount: number) => void;
  isClaiming: boolean;
}) {
  const minRoi = inv.minRoiRate ?? 0.013;
  const maxRoi = inv.maxRoiRate ?? 0.017;
  const currentValue = inv.currentValue ?? (inv.amount + inv.pendingEarnings);
  const avgDailyEst = currentValue * ((minRoi + maxRoi) / 2);
  const hasPending = inv.pendingEarnings > 0;
  const profitGrowth = inv.amount > 0 ? ((currentValue - inv.amount) / inv.amount) * 100 : 0;
  const dayNum = Math.max(0, inv.daysTotal - inv.daysRemaining);
  const propertyImage = inv.bannerImageUrl || (Array.isArray(inv.images) && inv.images.length > 0 ? inv.images[0] : null);
  const daysLabel = inv.daysRemaining > 0 ? `${inv.daysRemaining}d left` : "Completed";

  return (
    <div className="v3-card-elevated overflow-hidden group">
      {/* Property Image + Overlays */}
      <div className="relative h-44 md:h-52 overflow-hidden bg-muted">
        {propertyImage ? (
          <img src={propertyImage} alt={inv.planName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600/20 to-graphite-800/40 flex items-center justify-center">
            <Building2 size={48} className="text-emerald-500/30" />
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-emerald-600/90 text-white border-0 text-[10px] font-semibold backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 inline-block animate-pulse" />Active
          </Badge>
        </div>
        {/* Days remaining */}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-black/50 text-white border-white/20 text-[10px] font-semibold backdrop-blur-sm">
            <Clock size={10} className="mr-1" />{daysLabel}
          </Badge>
        </div>
        {/* Property type + location overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-8">
          <Link href={`/opportunity/${inv.planId}`} onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-bold text-lg leading-tight hover:underline">{inv.planName}</p>
          </Link>
          <div className="flex items-center gap-3 mt-1">
            {inv.location && (
              <span className="flex items-center gap-1 text-white/80 text-xs">
                <MapPin size={11} />{inv.location}
              </span>
            )}
            {inv.propertyType && (
              <Badge variant="outline" className="bg-white/15 text-white border-white/20 text-[9px] capitalize">
                {inv.propertyType}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Investment Details */}
      <div className="p-4 space-y-3">
        {/* Rate + Duration */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {(minRoi * 100).toFixed(1)}%–{(maxRoi * 100).toFixed(1)}% daily · {inv.durationDays ?? inv.daysTotal} days
          </p>
        </div>

        {/* Financial Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="v3-card-sunken p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground font-medium uppercase">Invested</p>
            <p className="text-xs font-bold text-foreground mt-1 tabular-nums">{formatUSDT(inv.amount)}</p>
          </div>
          <div className="v3-card-sunken p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground font-medium uppercase">Current</p>
            <p className="text-xs font-bold text-primary mt-1 tabular-nums">{formatUSDT(currentValue)}</p>
          </div>
          <div className="v3-card-sunken p-2.5 text-center">
            <p className="text-[9px] text-muted-foreground font-medium uppercase">Available</p>
            <div className="mt-1">
              <LiveCounter pendingEarnings={inv.pendingEarnings} dailyRate={inv.dailyReturnRate} principal={currentValue} lastEarningAt={inv.lastEarningAt ?? null} startDate={inv.startDate} />
            </div>
          </div>
        </div>

        {/* Growth indicator */}
        {profitGrowth > 0 && (
          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2">
            <Zap size={12} className="text-emerald-500 shrink-0" />
            <p className="text-[11px] text-emerald-600 font-medium">+{profitGrowth.toFixed(2)}% growth · Compounding</p>
          </div>
        )}

        {/* Earnings row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="v3-card-sunken p-2.5">
            <p className="text-[9px] text-muted-foreground font-medium uppercase">Total Earned</p>
            <p className="text-sm font-bold text-primary mt-1 tabular-nums">{formatUSDT(inv.totalEarned)}</p>
          </div>
          <div className="v3-card-sunken p-2.5">
            <p className="text-[9px] text-muted-foreground font-medium uppercase">Est. Daily</p>
            <p className="text-sm font-bold text-amber-500 mt-1 tabular-nums">{formatUSDT(avgDailyEst)}</p>
          </div>
        </div>

        {/* Next payout */}
        <div className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-primary" />
            <p className="text-[11px] text-muted-foreground">Next Profit Credit</p>
          </div>
          <PayoutCountdown nextPayoutAt={inv.nextPayoutAt} />
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-muted-foreground">Day {dayNum} of {inv.daysTotal}</span>
            <span className="text-[11px] font-semibold text-foreground">{inv.progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(2, inv.progressPercent)}%` }} />
          </div>
        </div>

        {/* Projected return */}
        <div className="flex items-center justify-between bg-muted/40 rounded-xl px-3.5 py-2.5">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Projected Total Return</p>
            <p className="text-sm font-bold text-foreground mt-0.5 tabular-nums">{formatUSDT(inv.projectedTotalMin)} – {formatUSDT(inv.projectedTotalMax)}</p>
          </div>
          <TrendingUp size={14} className="text-emerald-500/40" />
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Started {formatDate(inv.startDate)}</span>
          <span>Matures {formatDate(inv.endDate)}</span>
        </div>

        {/* Claim button */}
        <Button
          className={cn(
            "w-full h-11 text-sm font-semibold gap-2 rounded-xl",
            hasPending ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white" : "bg-muted text-muted-foreground opacity-60"
          )}
          onClick={(e) => { e.stopPropagation(); onClaim(inv.id, inv.pendingEarnings); }}
          disabled={isClaiming || !hasPending}
        >
          <ArrowDownLeft size={15} />
          {isClaiming ? "Claiming…" : hasPending ? `Claim ${formatUSDT(inv.pendingEarnings)} Profit` : "Awaiting Next Credit"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Completed Property Card ───────────────────────────────────────────── */
function CompletedCard({ inv }: { inv: any }) {
  const propertyImage = inv.bannerImageUrl || (Array.isArray(inv.images) && inv.images.length > 0 ? inv.images[0] : null);

  return (
    <div className="v3-card-elevated overflow-hidden">
      <div className="flex gap-3 p-3.5">
        {propertyImage ? (
          <img src={propertyImage} alt={inv.planName} className="w-16 h-16 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-muted-foreground/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{inv.planName}</p>
            <Badge variant="outline" className="text-[9px] capitalize shrink-0 font-medium border-border/60">{inv.status}</Badge>
          </div>
          {inv.location && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin size={9} />{inv.location}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{formatUSDT(inv.amount)} invested · {formatUSDT(inv.totalEarned)} earned</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(inv.startDate)} – {formatDate(inv.endDate)}</p>
        </div>
        <div className="flex items-center shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MY PROPERTIES — Real Estate Investment Portfolio
   Desktop: hero summary + 2-col active/history. Mobile: stacked.
   ═══════════════════════════════════════════════════════════════════════════ */
export default function PortfolioPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: investments, isLoading } = useGetUserInvestments({
    query: { queryKey: getGetUserInvestmentsQueryKey(), staleTime: 15000, refetchInterval: 30000 },
  });
  const { data: summary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey(), staleTime: 30000 },
  });
  const claim = useClaimEarnings();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetUserInvestmentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: ["earnings-history"] });
  };

  const handleClaim = (id: number, amount: number) => {
    if (amount <= 0) {
      toast({ title: "No profit yet", description: "Profits are credited every 24 hours", variant: "destructive" });
      return;
    }
    claim.mutate({ id }, {
      onSuccess: () => { toast({ title: "Profit Claimed!", description: `${formatUSDT(amount)} added to your wallet` }); invalidate(); },
      onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
    });
  };

  const activeInvestments = (investments ?? []).filter((i: any) => i.status === "active");
  const completedInvestments = (investments ?? []).filter((i: any) => i.status !== "active");
  const totalOriginal = activeInvestments.reduce((acc: number, i: any) => acc + i.amount, 0);
  const totalCurrentValue = activeInvestments.reduce((acc: number, i: any) => acc + (i.currentValue ?? i.amount + i.pendingEarnings), 0);
  const totalPending = activeInvestments.reduce((acc: number, i: any) => acc + i.pendingEarnings, 0);
  const totalEarned = (investments ?? []).reduce((acc: number, i: any) => acc + i.totalEarned, 0);

  const { user } = useAuth();

  return (
    <AppLayout fullBleed>
      <div className="max-w-6xl mx-auto px-4 py-5 lg:px-8 space-y-5 pb-28">

        {/* ── Portfolio Hero ──────────────────────────────────── */}
        <div className="v3-gradient rounded-2xl p-6 md:p-8 text-white animate-fade-in">
          <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold">My Properties</p>
          {user && <p className="text-xs text-white/50 mt-0.5">{user.fullName || `@${user.username}`}'s portfolio</p>}
          <p className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums mt-1">
            {isLoading ? "—" : formatUSDT(totalCurrentValue)}
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            {activeInvestments.length} active propert{activeInvestments.length !== 1 ? "ies" : "y"} · incl. compounded profits
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4">
            {[
              { label: "Available Profit", val: totalPending, color: "text-emerald-200" },
              { label: "Total Earned", val: totalEarned, color: "text-white" },
              { label: "Total Invested", val: totalOriginal, color: "text-white/70" },
              { label: "Properties", val: activeInvestments.length, color: "text-white/70", isCount: true },
            ].map(({ label, val, color, isCount }) => (
              <div key={label} className="bg-white/10 rounded-xl px-3 py-2.5 backdrop-blur-sm">
                <p className="text-[9px] text-white/45 font-medium">{label}</p>
                <p className={cn("text-sm font-bold tabular-nums mt-0.5", color)}>
                  {isCount ? val : formatUSDT(val)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Desktop: 2-column layout for active + history ───── */}
        <div className="lg:grid lg:grid-cols-5 lg:gap-5 space-y-5 lg:space-y-0">

          {/* Active property investments — wider column */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Active Properties</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : activeInvestments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeInvestments.map((inv: any) => (
                  <PropertyCard
                    key={inv.id}
                    inv={inv}
                    onClaim={handleClaim}
                    isClaiming={claim.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="v3-card p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Building2 size={24} className="text-primary" />
                </div>
                <p className="font-semibold text-foreground">No active properties</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Start building your real estate portfolio by exploring available investment opportunities.</p>
                <Link href="/investments">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                    Explore Properties <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* History + completed — narrower column */}
          <div className="lg:col-span-2 space-y-5">
            <EarningsHistory />

            {completedInvestments.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-3">Completed Properties</h3>
                <div className="space-y-3">
                  {completedInvestments.map((inv: any) => (
                    <CompletedCard key={inv.id} inv={inv} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {!isLoading && investments?.length === 0 && !activeInvestments.length && (
          <div className="v3-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} className="text-emerald-500" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">No Properties Yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Start building your real estate portfolio by exploring available investment opportunities.
            </p>
            <Link href="/investments" className="inline-block mt-5">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                Explore Properties <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
