import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy, Check, Share2, Users, DollarSign, TrendingUp, Wallet, ChevronDown,
  ChevronUp, ArrowDownCircle, GitBranch, Star, Zap, Banknote, CalendarDays,
  Gift, Award, ArrowRight,
} from "lucide-react";
import {
  useGetReferralStats, getGetReferralStatsQueryKey,
  useGetReferralHistory, getGetReferralHistoryQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatUSDT } from "@/lib/format";

async function claimReferralEarnings() {
  const res = await fetch("/api/referrals/claim", { method: "POST", credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? data.error ?? "Failed to claim");
  return data as { success: boolean; amountClaimed: number };
}

async function fetchSalaryStatus() {
  const res = await fetch("/api/referrals/salary", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load salary status");
  return res.json() as Promise<{
    programEnabled: boolean; currentVolume: number; currentTier: number | null;
    monthlySalary: number; nextPaymentDate: string | null; totalSalaryPaid: number;
    tiers: { tier: number; minVolume: number; salary: number }[];
    qualifies1: boolean; qualifies2: boolean;
  }>;
}

const TIER_CONFIG: Record<string, { color: string; bg: string; icon: string; border: string }> = {
  Diamond: { color: "text-cyan-500", bg: "bg-cyan-500/10", icon: "💎", border: "border-cyan-500/20" },
  Gold: { color: "text-amber-500", bg: "bg-amber-500/10", icon: "🥇", border: "border-amber-500/20" },
  Silver: { color: "text-slate-400", bg: "bg-slate-500/10", icon: "🥈", border: "border-slate-400/20" },
  Bronze: { color: "text-orange-500", bg: "bg-orange-500/10", icon: "🥉", border: "border-orange-500/20" },
};

/* ═══════════════════════════════════════════════════════════════════════════
   REFERRALS — WEXORA V3
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"my" | "history">("my");
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useGetReferralStats({ query: { queryKey: getGetReferralStatsQueryKey(), staleTime: 30000 } });
  const { data: historyData } = useGetReferralHistory({ query: { queryKey: getGetReferralHistoryQueryKey(), staleTime: 30000 } });
  const { data: salary, isLoading: salaryLoading } = useQuery({ queryKey: ["referrals-salary"], queryFn: fetchSalaryStatus, staleTime: 60000 });

  const history = historyData as any;
  const perUser: any[] = history?.perUser ?? [];
  const transactions: any[] = history?.transactions ?? [];

  const { mutate: claimEarnings, isPending: claiming } = useMutation({
    mutationFn: claimReferralEarnings,
    onSuccess: (data) => { setClaimMsg(`✅ ${formatUSDT(data.amountClaimed)} credited to your wallet!`); qc.invalidateQueries({ queryKey: getGetReferralStatsQueryKey() }); setTimeout(() => setClaimMsg(null), 5000); },
    onError: (err: any) => { setClaimMsg(`❌ ${err.message}`); setTimeout(() => setClaimMsg(null), 4000); },
  });

  const referralLink = stats?.code ? `${window.location.origin}/signup?ref=${stats.code}` : null;
  const handleCopy = () => { if (!referralLink) return; navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleShare = () => { if (!referralLink) return; window.open(`https://wa.me/?text=${encodeURIComponent(`Join Wexora and start earning! Sign up with my link:\n${referralLink}`)}`, "_blank"); };

  const pendingEarnings = (stats as any)?.pendingEarnings ?? 0;
  const tierLabel = (stats as any)?.tierLabel ?? "Bronze";
  const tierCfg = TIER_CONFIG[tierLabel] ?? TIER_CONFIG.Bronze;

  return (
    <AppLayout fullBleed>
      <div className="max-w-2xl mx-auto px-4 py-5 lg:px-8 pb-28 space-y-5">

        {/* ── Hero invite card ─────────────────────────────────── */}
        <div className="v3-gradient rounded-2xl p-6 text-white animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold">Your Invite Code</p>
            <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm", tierCfg.bg, tierCfg.color, tierCfg.border)}>
              {tierCfg.icon} {tierLabel}
            </span>
          </div>
          {statsLoading ? <Skeleton className="h-8 w-32 bg-white/15 mb-2" /> : <p className="text-3xl font-bold tracking-widest mb-3">{stats?.code ?? "---"}</p>}
          <div className="bg-white/10 rounded-xl px-3.5 py-2.5 mb-4 backdrop-blur-sm">
            {statsLoading ? <Skeleton className="h-4 w-full bg-white/10" /> : <p className="text-white/60 text-[11px] font-mono break-all">{referralLink ?? "Loading…"}</p>}
          </div>
          <p className="text-white/50 text-xs mb-4">
            Earn up to <span className="text-white font-bold">{((stats?.commissionRate ?? 0.05) * 100).toFixed(0)}%</span> on deposits & investment returns across 3 levels
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border-0 h-10 gap-1.5 rounded-xl flex-1 font-semibold backdrop-blur-sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button size="sm" className="bg-emerald-500/80 hover:bg-emerald-500 text-white border-0 h-10 gap-1.5 rounded-xl flex-1 font-semibold" onClick={handleShare}>
              <Share2 size={14} /> Share
            </Button>
          </div>
        </div>

        {/* ── Pending earnings ─────────────────────────────────── */}
        <div className={cn("v3-card-elevated p-5", pendingEarnings > 0 && "ring-1 ring-emerald-500/20")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", pendingEarnings > 0 ? "bg-emerald-500/10" : "bg-muted")}>
                <Wallet size={18} className={pendingEarnings > 0 ? "text-emerald-500" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.12em]">Pending Earnings</p>
                {statsLoading ? <Skeleton className="h-7 w-28 mt-0.5" /> : <p className={cn("text-2xl font-bold leading-tight tabular-nums", pendingEarnings > 0 ? "text-emerald-500" : "text-foreground")}>{formatUSDT(pendingEarnings)}</p>}
              </div>
            </div>
            <Button size="sm" disabled={pendingEarnings <= 0 || claiming || statsLoading} onClick={() => claimEarnings()} className={cn("h-10 px-5 font-semibold rounded-xl", pendingEarnings > 0 ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-muted text-muted-foreground")}>
              {claiming ? "Claiming…" : "Claim"}
            </Button>
          </div>
          {claimMsg && <p className="mt-3 text-xs font-medium text-center py-2 rounded-xl bg-muted/40">{claimMsg}</p>}
        </div>

        {/* ── Stats strip ──────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "My Referrals", value: statsLoading ? "…" : (stats as any)?.totalReferrals ?? 0, icon: Users, color: "text-primary" },
            { label: "Active", value: statsLoading ? "…" : (stats as any)?.activeReferrals ?? 0, icon: TrendingUp, color: "text-emerald-500" },
            { label: "Earned", value: statsLoading ? "…" : formatUSDT((stats as any)?.totalEarned ?? 0), icon: DollarSign, color: "text-amber-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="v3-card p-3.5 text-center">
              <Icon size={16} className={cn("mx-auto mb-1.5", color)} />
              <p className="font-bold text-foreground text-sm tabular-nums">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── 3-Level commission ───────────────────────────────── */}
        <div className="v3-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><GitBranch size={15} className="text-primary" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">3-Level Commission</p>
              <p className="text-[10px] text-muted-foreground">Earn on your entire network</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {(stats as any)?.levels?.map((lvl: any, i: number) => {
              const cfgs = [{ icon: "👤", label: "Level 1", desc: "Direct", color: "text-primary", bg: "bg-primary/5" }, { icon: "👥", label: "Level 2", desc: "2nd degree", color: "text-violet-500", bg: "bg-violet-500/5" }, { icon: "🌐", label: "Level 3", desc: "3rd degree", color: "text-amber-500", bg: "bg-amber-500/5" }];
              const c = cfgs[i] ?? cfgs[0];
              return (
                <div key={lvl.level} className={cn("rounded-xl p-3.5 flex items-center justify-between", c.bg)}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{c.icon}</span>
                    <div>
                      <p className={cn("font-bold text-sm", c.color)}>{c.label}</p>
                      <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div><p className="text-[9px] text-muted-foreground uppercase">Deposit</p><p className={cn("font-bold text-sm tabular-nums", c.color)}>{lvl.depositRate}%</p></div>
                    <div><p className="text-[9px] text-muted-foreground uppercase">ROI</p><p className={cn("font-bold text-sm tabular-nums", c.color)}>{lvl.roiRate}%</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Salary program ───────────────────────────────────── */}
        {salary?.programEnabled !== false && (() => {
          const tier1 = salary?.tiers?.find(t => t.tier === 1);
          const tier2 = salary?.tiers?.find(t => t.tier === 2);
          const t1Vol = tier1?.minVolume ?? 1500;
          const t2Vol = tier2?.minVolume ?? 3500;
          const vol = salary?.currentVolume ?? 0;
          const pct = Math.min((vol / t2Vol) * 100, 100);
          const t1Pct = (t1Vol / t2Vol) * 100;
          const qualified = (salary?.currentTier ?? 0) > 0;
          const nextPay = salary?.nextPaymentDate ? new Date(salary.nextPaymentDate) : null;
          const daysLeft = nextPay ? Math.max(0, Math.ceil((nextPay.getTime() - Date.now()) / 86400000)) : null;
          return (
            <div className="v3-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", qualified ? "bg-amber-500/10" : "bg-muted")}><Banknote size={15} className={qualified ? "text-amber-500" : "text-muted-foreground"} /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Referral Salary</p>
                    <p className="text-[10px] text-muted-foreground">Monthly income from your network</p>
                  </div>
                </div>
                {qualified && <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", salary?.currentTier === 2 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20")}>Tier {salary?.currentTier}</span>}
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] text-muted-foreground font-medium">Network Volume</p>
                  <p className="text-[11px] font-bold tabular-nums">{salaryLoading ? "…" : `${formatUSDT(vol)} / ${formatUSDT(t2Vol)}`}</p>
                </div>
                <div className="relative h-2.5 bg-muted rounded-full overflow-visible">
                  <div className={cn("h-full rounded-full transition-all duration-700", vol >= t2Vol ? "bg-amber-500" : vol >= t1Vol ? "bg-emerald-500" : "bg-primary")} style={{ width: `${pct}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-400 rounded-full" style={{ left: `${t1Pct}%` }} />
                </div>
                <div className="relative mt-1 h-4">
                  <span className="absolute text-[9px] font-semibold text-amber-600 -translate-x-1/2" style={{ left: `${t1Pct}%` }}>T1 {formatUSDT(t1Vol)}</span>
                  <span className="absolute right-0 text-[9px] font-semibold text-amber-600">T2 {formatUSDT(t2Vol)}</span>
                </div>
              </div>
              {qualified ? (
                <div className="grid grid-cols-3 gap-2">
                  {[{ label: "Monthly", val: formatUSDT(salary?.monthlySalary ?? 0), color: "text-amber-600" }, { label: "Next Pay", val: daysLeft !== null ? `${daysLeft}d` : "—", color: "text-foreground" }, { label: "Total Paid", val: formatUSDT(salary?.totalSalaryPaid ?? 0), color: "text-emerald-600" }].map(({ label, val, color }) => (
                    <div key={label} className="v3-card-sunken p-2.5 text-center"><p className="text-[10px] text-muted-foreground">{label}</p><p className={cn("text-sm font-bold mt-0.5 tabular-nums", color)}>{val}</p></div>
                  ))}
                </div>
              ) : (
                <div className="bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5">
                  <p className="text-[11px] text-primary leading-relaxed">
                    {vol < t1Vol ? <><strong>{formatUSDT(t1Vol - vol)} more</strong> referral volume needed for Tier 1</> : <><strong>Tier 1 reached!</strong> Grow to {formatUSDT(t2Vol)} for Tier 2</>}
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="flex bg-muted/40 rounded-xl p-1">
          {(["my", "history"] as const).map(id => (
            <button key={id} onClick={() => setTab(id)} className={cn("flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all", tab === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
              {id === "my" ? "My Referrals" : "History"}
            </button>
          ))}
        </div>

        {/* ── My Referrals tab ─────────────────────────────────── */}
        {tab === "my" && (
          <div className="space-y-2.5">
            {perUser.length === 0 ? (
              <div className="v3-card p-12 text-center">
                <Users size={28} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-foreground">No referrals yet</p>
                <p className="text-xs text-muted-foreground mt-1">Share your code to start earning</p>
              </div>
            ) : perUser.map((row: any) => {
              const userTxs = transactions.filter((t: any) => t.referredUsername === row.referredUsername);
              const fromDeposits = userTxs.filter((t: any) => t.source === "deposit").reduce((a: number, t: any) => a + t.amount, 0);
              const fromInvestments = userTxs.filter((t: any) => t.source === "investment").reduce((a: number, t: any) => a + t.amount, 0);
              const isExpanded = expandedUser === row.id;
              return (
                <div key={row.id} className="v3-card overflow-hidden">
                  <button className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left" onClick={() => setExpandedUser(isExpanded ? null : row.id)}>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><span className="text-sm font-bold text-primary">{(row.referredUsername?.[0] ?? "?").toUpperCase()}</span></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">@{row.referredUsername}</p>
                      <p className="text-[11px] text-muted-foreground">Joined {new Date(row.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-emerald-500 tabular-nums">{formatUSDT(row.totalEarned)}</p>
                      <p className="text-[10px] text-muted-foreground">earned</p>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border/50 px-4 py-3 bg-muted/20 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="v3-card-sunken p-3 text-center"><p className="text-[10px] text-muted-foreground">From Deposits</p><p className="text-sm font-bold text-primary mt-0.5 tabular-nums">{formatUSDT(fromDeposits)}</p></div>
                        <div className="v3-card-sunken p-3 text-center"><p className="text-[10px] text-muted-foreground">From Investments</p><p className="text-sm font-bold text-emerald-500 mt-0.5 tabular-nums">{formatUSDT(fromInvestments)}</p></div>
                      </div>
                      {userTxs.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Recent payments</p>
                          {userTxs.slice(0, 4).map((t: any) => (
                            <div key={t.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{t.source === "deposit" ? "Deposit" : "ROI"} commission</span>
                              <span className="font-semibold tabular-nums">{formatUSDT(t.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── History tab ──────────────────────────────────────── */}
        {tab === "history" && (
          <div>
            {transactions.length === 0 ? (
              <div className="v3-card p-12 text-center">
                <DollarSign size={28} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-foreground">No commissions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Your referral payments will appear here</p>
              </div>
            ) : (
              <div className="v3-card overflow-hidden divide-y divide-border/40">
                {transactions.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3.5 px-4 py-3.5">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", t.source === "deposit" ? "bg-primary/10" : "bg-emerald-500/10")}>
                      {t.source === "deposit" ? <ArrowDownCircle size={15} className="text-primary" /> : <TrendingUp size={15} className="text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.source === "deposit" ? `Deposit commission${t.referredUsername ? ` from @${t.referredUsername}` : ""}` : "Investment ROI commission"}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-500 shrink-0 tabular-nums">+{formatUSDT(t.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
