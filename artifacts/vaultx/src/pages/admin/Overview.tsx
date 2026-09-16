import { useState } from "react";
import {
  Users, DollarSign, TrendingUp, ArrowUpRight, ArrowDownLeft,
  FileCheck, Zap, RefreshCcw, CheckCircle2, AlertCircle,
  BarChart3, MessageSquare, Clock, ChevronRight, Shield,
  Bell,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  useAdminGetAnalytics, getAdminGetAnalyticsQueryKey,
} from "@workspace/api-client-react";
import { usePlatformMetrics, formatMetricCompact } from "@/hooks/usePlatformMetrics";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatUSDT, formatUSDTCompact } from "@/lib/format";
import { adminApi } from "./utils";
import type { AdminSection } from "./utils";

interface OverviewProps {
  onNavigate: (section: AdminSection) => void;
}

export default function OverviewSection({ onNavigate }: OverviewProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [roiRunning, setRoiRunning] = useState(false);
  const [roiResult, setRoiResult] = useState<{ processed: number; matured: number; skipped: number } | null>(null);

  const { data: analytics, isLoading: analyticsLoading } = useAdminGetAnalytics({
    query: { queryKey: getAdminGetAnalyticsQueryKey(), staleTime: 15000 },
  });
  const { data: metrics, isLoading: metricsLoading } = usePlatformMetrics();

  const pendingDeposits = (analytics as any)?.pendingDeposits ?? 0;
  const pendingWithdrawals = analytics?.pendingWithdrawals ?? 0;
  const pendingKyc = analytics?.pendingKyc ?? 0;
  const totalPending = pendingDeposits + pendingWithdrawals + pendingKyc;

  const triggerRoi = async (force: boolean) => {
    setRoiRunning(true);
    setRoiResult(null);
    try {
      const r = await adminApi("/admin/roi/trigger", "POST", { force });
      setRoiResult(r);
      queryClient.invalidateQueries({ queryKey: getAdminGetAnalyticsQueryKey() });
      if (force) toast({ title: "ROI Triggered", description: `${r.processed} investments credited` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRoiRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          What's happening right now and what needs your attention
        </p>
      </div>

      {/* ── ACTION QUEUE — Priority 1 ── */}
      {totalPending > 0 && (
        <div className="v3-card-elevated p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Needs Your Attention</p>
              <p className="text-[11px] text-muted-foreground">{totalPending} item{totalPending !== 1 ? "s" : ""} waiting for review</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Pending Deposits",
                count: pendingDeposits,
                icon: ArrowDownLeft,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                section: "finance" as AdminSection,
              },
              {
                label: "Pending Withdrawals",
                count: pendingWithdrawals,
                icon: ArrowUpRight,
                color: "text-red-500",
                bg: "bg-red-500/10",
                section: "finance" as AdminSection,
              },
              {
                label: "Pending KYC",
                count: pendingKyc,
                icon: FileCheck,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                section: "verification" as AdminSection,
              },
            ].map(({ label, count, icon: Icon, color, bg, section }) => (
              <button
                key={label}
                onClick={() => onNavigate(section)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md group",
                  count > 0
                    ? "bg-white dark:bg-card border-red-200 dark:border-red-800/30 hover:border-red-300"
                    : "bg-white dark:bg-card border-border hover:border-border/80"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
                  <Icon size={18} className={color} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {count > 0 ? `${count} awaiting review` : "All clear"}
                  </p>
                </div>
                {count > 0 ? (
                  <span className="text-lg font-bold text-red-500">{count}</span>
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                )}
                <ChevronRight size={14} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── KEY METRICS — Priority 2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {analyticsLoading && [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        {!analyticsLoading && analytics && [
          { label: "Total Users", value: analytics.totalUsers?.toLocaleString() ?? "0", icon: Users, color: "text-primary", bg: "bg-primary/10" },
          { label: "Active Investments", value: formatUSDTCompact(analytics.totalInvestments ?? 0), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Total Deposits", value: formatUSDTCompact(analytics.totalDeposits ?? 0), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "New Today", value: String(analytics.newUsersToday ?? 0), icon: Clock, color: "text-blue-600", bg: "bg-blue-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="v3-card p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
                <Icon size={14} className={color} />
              </div>
            </div>
            <p className="text-lg font-bold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── PLATFORM METRICS — Priority 3 ── */}
      {!metricsLoading && metrics && (
        <div className="v3-card-elevated p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-primary" />
            <p className="text-sm font-bold text-foreground">Platform Health</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Capital Raised", value: formatMetricCompact(metrics.totalRaised), sub: `Target: ${formatMetricCompact(metrics.totalTarget)}` },
              { label: "Funding Rate", value: `${metrics.fundingPercentage.toFixed(1)}%`, sub: "Platform-wide average" },
              { label: "Participants", value: metrics.totalParticipants.toLocaleString(), sub: "Unique investors" },
              { label: "Capital Deployed", value: formatMetricCompact(metrics.capitalDeployed), sub: "Active investments" },
              { label: "Distributions Paid", value: formatMetricCompact(metrics.distributionsPaid), sub: "Total paid out" },
              { label: "Active Funds", value: String(metrics.activeOpportunities), sub: "Currently live" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-muted/30 rounded-xl p-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ROI PAYOUT + QUICK ACTIONS — Priority 4 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ROI Payout */}
        <div className="v3-card-elevated p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Zap size={15} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">ROI Payout</p>
              <p className="text-[11px] text-muted-foreground">Process daily distributions</p>
            </div>
          </div>

          {roiResult && (
            <div className={cn(
              "rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-xs mb-3",
              roiResult.processed > 0 ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50 border border-slate-100"
            )}>
              {roiResult.processed > 0 ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> : <AlertCircle size={14} className="text-muted-foreground shrink-0 mt-0.5" />}
              <div>
                <p className={cn("font-semibold", roiResult.processed > 0 ? "text-emerald-700" : "text-foreground")}>
                  {roiResult.processed > 0 ? `${roiResult.processed} credited` : "No investments credited"}
                </p>
                <p className="text-muted-foreground">
                  {roiResult.matured > 0 && `${roiResult.matured} matured · `}
                  {roiResult.skipped > 0 ? `${roiResult.skipped} already paid` : "all processed"}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm" variant="outline"
              className="h-10 text-xs font-semibold gap-1.5"
              disabled={roiRunning}
              onClick={() => triggerRoi(false)}
            >
              <RefreshCcw size={13} className={roiRunning ? "animate-spin" : ""} />
              Normal Run
            </Button>
            <Button
              size="sm"
              className="h-10 text-xs font-semibold gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
              disabled={roiRunning}
              onClick={() => triggerRoi(true)}
            >
              <Zap size={13} className={roiRunning ? "animate-pulse" : ""} />
              Force Payout
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            <span className="font-medium">Normal</span> — unpaid in 24h only.{" "}
            <span className="font-medium">Force</span> — all active investments.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="v3-card-elevated p-5 animate-fade-in">
          <p className="text-sm font-bold text-foreground mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Users", icon: Users, section: "users" as AdminSection, color: "text-primary" },
              { label: "Finance", icon: DollarSign, section: "finance" as AdminSection, color: "text-emerald-600" },
              { label: "Opportunities", icon: TrendingUp, section: "investments" as AdminSection, color: "text-blue-600" },
              { label: "Settings", icon: Shield, section: "settings" as AdminSection, color: "text-purple-600" },
            ].map(({ label, icon: Icon, section, color }) => (
              <button
                key={label}
                onClick={() => onNavigate(section)}
                className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left group"
              >
                <Icon size={16} className={color} />
                <span className="text-sm font-medium text-foreground">{label}</span>
                <ChevronRight size={12} className="text-muted-foreground/50 ml-auto group-hover:text-muted-foreground transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── OPPORTUNITY HIGHLIGHTS ── */}
      {(metrics?.mostPopular || metrics?.topFunded || metrics?.fastestGrowing) && (
        <div className="v3-card-elevated p-5 animate-fade-in">
          <p className="text-sm font-bold text-foreground mb-3">Opportunity Highlights</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "⭐", label: "Most Popular", plan: metrics?.mostPopular, sub: metrics?.mostPopular ? `${(metrics.mostPopular.participants ?? 0).toLocaleString()} participants` : null },
              { icon: "🏆", label: "Top Funded", plan: metrics?.topFunded, sub: metrics?.topFunded ? `${metrics.topFunded.fundingPct ?? 0}% funded` : null },
              { icon: "🚀", label: "Fastest Growing", plan: metrics?.fastestGrowing, sub: null },
            ]
              .filter(({ plan }) => plan != null)
              .map(({ icon, label, plan, sub }) => (
                <div key={label} className="bg-muted/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span>{icon}</span>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{plan?.name}</p>
                  {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
