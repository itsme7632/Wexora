import { useState } from "react";
import { BarChart3, TrendingUp, Users, DollarSign, Activity, Zap, ChevronDown, ChevronUp, ArrowLeft, ArrowUpRight, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useGetInvestmentPlans, getGetInvestmentPlansQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatUSDT, formatUSDTCompact } from "@/lib/format";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";

const MONTHLY_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MiniBarChart({ values, color, height = 56 }: { values: number[]; color: string; height?: number }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1" style={{ height: `${height}px` }}>
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className={cn("w-full rounded-t-sm transition-all duration-500", color)}
            style={{ height: `${(v / max) * (height - 8)}px`, minHeight: v > 0 ? 2 : 0 }} />
        </div>
      ))}
    </div>
  );
}

export default function PerformancePage() {
  const [, navigate] = useLocation();
  const [showMonthly, setShowMonthly] = useState(false);
  const { data: metrics, isLoading: metricsLoading } = usePlatformMetrics();

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["platform-performance"],
    queryFn: async () => {
      const res = await fetch("/api/platform/performance", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30000,
  });

  const currentMonth = new Date().getMonth();
  const monthlyDeposits: number[] = chartData?.monthlyDeposits ?? new Array(currentMonth + 1).fill(0);
  const monthlyEarnings: number[] = chartData?.monthlyEarnings ?? new Array(currentMonth + 1).fill(0);
  const monthlyNewUsers: number[] = chartData?.monthlyNewUsers ?? new Array(currentMonth + 1).fill(0);

  const monthlyDepositsSlice = monthlyDeposits.slice(0, currentMonth + 1);
  const monthlyEarningsSlice = monthlyEarnings.slice(0, currentMonth + 1);
  const monthlyNewUsersSlice = monthlyNewUsers.slice(0, currentMonth + 1);

  const ytdInflow = monthlyDepositsSlice.reduce((a, v) => a + v, 0);
  const ytdEarnings = monthlyEarningsSlice.reduce((a, v) => a + v, 0);
  const ytdNewUsers = monthlyNewUsersSlice.reduce((a, v) => a + v, 0);

  const isLoading = metricsLoading;

  return (
    <AppLayout title="Performance Center">
      <div className="px-4 pt-5 pb-24 max-w-6xl mx-auto space-y-5">

        <button onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> <span>Back</span>
        </button>

        {/* ── Hero KPI Bar ── */}
        <div className="v3-gradient rounded-2xl p-6 lg:p-8 relative overflow-hidden animate-fade-in">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg lg:text-xl text-white leading-tight">Performance Center</h2>
                <p className="text-white/50 text-xs">Real-time platform metrics</p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl py-3 px-4 border border-white/10">
                {isLoading ? <Skeleton className="h-6 w-20 bg-white/20 mb-1" /> : <p className="text-xl font-black text-white">{formatUSDTCompact(metrics?.totalRaised ?? 0)}</p>}
                <p className="text-[10px] text-white/50 mt-0.5">Platform Capital</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl py-3 px-4 border border-white/10">
                {isLoading ? <Skeleton className="h-6 w-16 bg-white/20 mb-1" /> : <p className="text-xl font-black text-white">{metrics?.activeOpportunities ?? 0}</p>}
                <p className="text-[10px] text-white/50 mt-0.5">Active Opportunities</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl py-3 px-4 border border-white/10">
                {isLoading ? <Skeleton className="h-6 w-20 bg-white/20 mb-1" /> : <p className="text-xl font-black text-white">{(metrics?.totalParticipants ?? 0).toLocaleString()}</p>}
                <p className="text-[10px] text-white/50 mt-0.5">Total Participants</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl py-3 px-4 border border-white/10">
                {isLoading ? <Skeleton className="h-6 w-20 bg-white/20 mb-1" /> : <p className="text-xl font-black text-white">{formatUSDTCompact(metrics?.capitalDeployed ?? 0)}</p>}
                <p className="text-[10px] text-white/50 mt-0.5">Capital Deployed</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Key Metrics Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Participants", value: isLoading ? null : (metrics?.totalParticipants ?? 0).toLocaleString(), icon: Users, color: "text-primary", bg: "bg-primary/10", trend: "+12%" },
            { label: "Capital Deployed", value: isLoading ? null : formatUSDTCompact(metrics?.capitalDeployed ?? 0), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-500/10", trend: "+8%" },
            { label: "Distributions Paid", value: isLoading ? null : formatUSDTCompact(metrics?.distributionsPaid ?? 0), icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-500/10", trend: "+15%" },
            { label: "Active Investments", value: isLoading ? null : formatUSDTCompact(metrics?.activeInvestments ?? 0), icon: Activity, color: "text-amber-600", bg: "bg-amber-500/10", trend: "+5%" },
          ].map(({ label, value, icon: Icon, color, bg, trend }) => (
            <div key={label} className="v3-card-elevated p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
                  <Icon size={16} className={color} />
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight size={10} /> {trend}
                </span>
              </div>
              {value === null ? <Skeleton className="h-6 w-24 mb-1" /> : <p className="font-black text-foreground text-lg leading-tight">{value}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Side-by-Side Charts (desktop) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Capital Deployment Chart */}
          <div className="v3-card-elevated p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-sm text-foreground">Capital Deployment</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Monthly investment inflow ({new Date().getFullYear()})</p>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 font-bold">Live</span>
              </div>
            </div>
            {chartLoading ? <Skeleton className="h-16 rounded-lg" /> : <MiniBarChart values={monthlyDepositsSlice} color="bg-primary" />}
            <div className="flex justify-between mt-2">
              {MONTHLY_LABELS.slice(0, currentMonth + 1).map((m) => (
                <span key={m} className="text-[9px] text-muted-foreground flex-1 text-center">{m}</span>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">YTD Total</span>
              <span className="text-sm font-bold text-foreground">{ytdInflow > 0 ? formatUSDTCompact(ytdInflow) : "—"}</span>
            </div>
          </div>

          {/* Distributions Chart */}
          <div className="v3-card-elevated p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-sm text-foreground">Distributions Paid</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Monthly distributions paid out</p>
              </div>
              <Zap size={16} className="text-amber-500" />
            </div>
            {chartLoading ? <Skeleton className="h-16 rounded-lg" /> : <MiniBarChart values={monthlyEarningsSlice} color="bg-emerald-500" />}
            <div className="flex justify-between mt-2">
              {MONTHLY_LABELS.slice(0, currentMonth + 1).map((m) => (
                <span key={m} className="text-[9px] text-muted-foreground flex-1 text-center">{m}</span>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">YTD Total</span>
              <span className="text-sm font-bold text-emerald-600">{ytdEarnings > 0 ? formatUSDTCompact(ytdEarnings) : "—"}</span>
            </div>
          </div>
        </div>

        {/* ── Monthly Statistics Table ── */}
        <div className="v3-card-elevated overflow-hidden animate-fade-in">
          <button type="button" onClick={() => setShowMonthly((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Monthly Statistics</p>
                <p className="text-[11px] text-muted-foreground">Detailed breakdown — {new Date().getFullYear()}</p>
              </div>
            </div>
            {showMonthly ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>

          {showMonthly && (
            <div className="border-t border-border">
              <div className="grid grid-cols-4 bg-muted/40 px-5 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                <span>Month</span>
                <span className="text-right">Inflow</span>
                <span className="text-right">Distributions</span>
                <span className="text-right">New Users</span>
              </div>
              {chartLoading ? (
                <div className="p-5 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
              ) : (
                <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
                  {MONTHLY_LABELS.slice(0, currentMonth + 1).map((month, i) => {
                    const inflow = monthlyDeposits[i] ?? 0;
                    const distrib = monthlyEarnings[i] ?? 0;
                    const newUsers = monthlyNewUsers[i] ?? 0;
                    return (
                      <div key={month} className="grid grid-cols-4 px-5 py-3.5 text-sm hover:bg-muted/20 transition-colors">
                        <span className="text-foreground font-medium">{month}</span>
                        <span className="text-right text-foreground font-semibold">{inflow > 0 ? formatUSDTCompact(inflow) : "—"}</span>
                        <span className="text-right text-emerald-600 font-semibold">{distrib > 0 ? formatUSDTCompact(distrib) : "—"}</span>
                        <span className="text-right text-muted-foreground">{newUsers > 0 ? `+${newUsers}` : "—"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {!chartLoading && (
                <div className="grid grid-cols-4 px-5 py-3.5 bg-muted/30 border-t border-border text-sm font-bold">
                  <span className="text-foreground">YTD Total</span>
                  <span className="text-right text-foreground">{ytdInflow > 0 ? formatUSDTCompact(ytdInflow) : "—"}</span>
                  <span className="text-right text-emerald-600">{ytdEarnings > 0 ? formatUSDTCompact(ytdEarnings) : "—"}</span>
                  <span className="text-right text-muted-foreground">{ytdNewUsers > 0 ? `+${ytdNewUsers.toLocaleString()}` : "—"}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Opportunity Highlights ── */}
        {(metrics?.mostPopular || metrics?.topFunded || metrics?.fastestGrowing) && (
          <div className="v3-card-elevated p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Opportunity Highlights</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "⭐", label: "Most Popular", plan: metrics?.mostPopular, sub: metrics?.mostPopular ? `${(metrics.mostPopular.participants ?? 0).toLocaleString()} participants` : null },
                { icon: "🏆", label: "Top Funded", plan: metrics?.topFunded, sub: metrics?.topFunded ? `${metrics.topFunded.fundingPct ?? 0}% funded` : null },
                { icon: "🚀", label: "Fastest Growing", plan: metrics?.fastestGrowing, sub: null },
              ].filter(({ plan }) => plan != null).map(({ icon, label, plan, sub }) => (
                <div key={label} className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{icon}</span>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{plan?.name}</p>
                  {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">Rankings update automatically from live platform data.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
