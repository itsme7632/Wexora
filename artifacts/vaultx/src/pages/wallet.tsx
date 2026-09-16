import { useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Filter, ChevronRight,
  TrendingUp, TrendingDown, Wallet as WalletIcon, Activity, Search,
  Clock, CheckCircle2, XCircle, ArrowRight,
} from "lucide-react";
import {
  useGetWallet, getGetWalletQueryKey,
  useGetTransactions, getGetTransactionsQueryKey,
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  type GetTransactionsType,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatUSDT, formatDateTime } from "@/lib/format";
import { Link } from "wouter";

/* ─── Transaction type configuration ────────────────────────────────────── */
const TX_TYPE_CONFIG: Record<string, { icon: typeof ArrowDownLeft; color: string; bg: string; label: string }> = {
  deposit: { icon: ArrowDownLeft, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Deposit" },
  earning: { icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10", label: "Earnings" },
  referral: { icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-500/10", label: "Referral" },
  reinvest: { icon: ArrowLeftRight, color: "text-primary", bg: "bg-primary/10", label: "Reinvest" },
  investment: { icon: ArrowLeftRight, color: "text-primary", bg: "bg-primary/10", label: "Investment" },
  withdrawal: { icon: ArrowUpRight, color: "text-red-500", bg: "bg-red-500/10", label: "Withdrawal" },
  transfer: { icon: ArrowLeftRight, color: "text-blue-500", bg: "bg-blue-500/10", label: "Transfer" },
  admin_adjustment: { icon: ArrowLeftRight, color: "text-muted-foreground", bg: "bg-muted", label: "Adjustment" },
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Completed" },
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Pending" },
  failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Failed" },
};

/* ═══════════════════════════════════════════════════════════════════════════
   WALLET CENTER — WEXORA V3
   Structural layout: Two-zone hero → Action strip → Stats → Transactions
   ═══════════════════════════════════════════════════════════════════════════ */
export default function WalletPage() {
  const [, navigate] = useLocation();
  const [txFilter, setTxFilter] = useState<GetTransactionsType | "all">("all");
  const [txSearch, setTxSearch] = useState("");

  const { data: wallet, isLoading: walletLoading } = useGetWallet({
    query: { queryKey: getGetWalletQueryKey(), staleTime: 30000 },
  });
  const { data: txData, isLoading: txLoading } = useGetTransactions(
    { type: txFilter === "all" ? undefined : txFilter, limit: 50 },
    { query: { queryKey: getGetTransactionsQueryKey({ type: txFilter === "all" ? undefined : txFilter, limit: 50 }), staleTime: 20000 } },
  );
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey(), staleTime: 30000 },
  });

  const balance = wallet?.balance ?? 0;
  const totalInvested = summary?.activeInvestmentsValue ?? 0;
  const pendingEarnings = summary?.pendingEarnings ?? 0;
  const earned = summary?.totalEarnings ?? wallet?.totalEarnings ?? 0;

  const filteredTx = txData?.items?.filter((tx: any) =>
    !txSearch || tx.txId?.toLowerCase().includes(txSearch.toLowerCase()) ||
    tx.note?.toLowerCase().includes(txSearch.toLowerCase()) ||
    tx.type.toLowerCase().includes(txSearch.toLowerCase())
  ) ?? [];

  return (
    <AppLayout fullBleed>
      <div className="max-w-5xl mx-auto px-4 py-5 lg:px-8 space-y-5 pb-28">

        {/* ── ZONE 1: Hero Balance ─────────────────────────────── */}
        <div className="v3-gradient rounded-2xl p-6 md:p-8 text-white animate-fade-in">
          {/* Top row: label + actions */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold">Available Cash Balance</p>
              {walletLoading ? (
                <Skeleton className="h-12 w-48 bg-white/15 mt-2" />
              ) : (
                <p className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums mt-1">
                  {formatUSDT(balance)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/40 font-medium">Live</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            {[
              { icon: ArrowDownLeft, label: "Deposit", href: "/deposit", color: "bg-white/15 hover:bg-white/25" },
              { icon: ArrowUpRight, label: "Withdraw", href: "/withdraw", color: "bg-white/15 hover:bg-white/25" },
              { icon: ArrowLeftRight, label: "Transfer", href: "/transfer", color: "bg-white/15 hover:bg-white/25" },
            ].map(({ icon: Icon, label, href, color }) => (
              <button
                key={label}
                onClick={() => navigate(href)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold text-white transition-all active:scale-[0.97] backdrop-blur-sm",
                  color
                )}
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ZONE 2: Financial Overview ──────────────────────── */}
        <div className="grid grid-cols-2 gap-3 stagger-children">
          {[
            { icon: ArrowLeftRight, label: "Total Invested", value: totalInvested, color: "text-primary", bg: "bg-primary/10", loading: summaryLoading },
            { icon: TrendingUp, label: "Pending Earnings", value: pendingEarnings, color: "text-amber-500", bg: "bg-amber-500/10", loading: summaryLoading },
          ].map(({ icon: Icon, label, value, color, bg, loading }) => (
            <div key={label} className="v3-card p-4 flex flex-col items-center text-center">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2.5", bg)}>
                <Icon size={16} className={color} />
              </div>
              {loading ? (
                <Skeleton className="h-5 w-16 mt-1" />
              ) : (
                <p className="text-lg font-bold text-foreground tabular-nums">{formatUSDT(value)}</p>
              )}
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</p>
            </div>
          ))}
          {[
            { icon: TrendingUp, label: "Total Earned", value: earned, color: "text-emerald-500", bg: "bg-emerald-500/10", loading: summaryLoading },
            { icon: ArrowDownLeft, label: "Total Deposited", value: wallet?.totalDeposited ?? 0, color: "text-emerald-500", bg: "bg-emerald-500/10", loading: walletLoading },
          ].map(({ icon: Icon, label, value, color, bg, loading }) => (
            <div key={label} className="v3-card p-4 flex flex-col items-center text-center">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2.5", bg)}>
                <Icon size={16} className={color} />
              </div>
              {loading ? (
                <Skeleton className="h-5 w-16 mt-1" />
              ) : (
                <p className="text-lg font-bold text-foreground tabular-nums">{formatUSDT(value)}</p>
              )}
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── ZONE 3: Transaction History ──────────────────────── */}
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity size={14} className="text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Transactions</h3>
              {txData?.items && (
                <span className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full font-medium">
                  {txData.items.length}
                </span>
              )}
            </div>
            <Select value={txFilter} onValueChange={(v) => setTxFilter(v as any)}>
              <SelectTrigger className="h-8 text-xs w-32 rounded-lg border-border/60 bg-card">
                <Filter size={11} className="mr-1 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(["deposit", "withdrawal", "earning", "reinvest", "investment", "transfer", "referral"] as GetTransactionsType[]).map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t === "earning" ? "Earnings" : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Transaction list */}
          {txLoading ? (
            <div className="space-y-2.5">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}</div>
          ) : filteredTx.length > 0 ? (
            <div className="v3-card overflow-hidden">
              <div className="divide-y divide-border/40">
                {filteredTx.map((tx: any) => {
                  const config = TX_TYPE_CONFIG[tx.type] ?? TX_TYPE_CONFIG.admin_adjustment;
                  const status = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
                  const Icon = config.icon;
                  const StatusIcon = status.icon;
                  const isOutgoing = ["withdrawal", "investment", "transfer"].includes(tx.type);

                  return (
                    <button
                      key={tx.id}
                      onClick={() => navigate(`/transaction/${tx.id}`)}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/30 active:bg-muted/50 transition-colors text-left"
                    >
                      {/* Icon */}
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                        <Icon size={16} className={config.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {config.label}
                          </p>
                          <StatusIcon size={11} className={status.color} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {tx.txId && (
                            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">
                              {tx.txId}
                            </span>
                          )}
                          {tx.txId && <span className="text-[10px] text-muted-foreground/40">·</span>}
                          <span className="text-[10px] text-muted-foreground">
                            {formatDateTime(tx.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Amount + Status */}
                      <div className="text-right shrink-0">
                        <p className={cn("text-sm font-bold tabular-nums", isOutgoing ? "text-red-500" : "text-emerald-500")}>
                          {isOutgoing ? "−" : "+"}{formatUSDT(tx.amount)}
                        </p>
                        <span className={cn("text-[10px] font-medium", status.color)}>
                          {status.label}
                        </span>
                      </div>

                      <ChevronRight size={13} className="text-muted-foreground/30 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : txSearch ? (
            <div className="v3-card p-10 text-center">
              <Search size={24} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No matching transactions</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="v3-card p-10 text-center">
              <WalletIcon size={28} className="text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1.5 mb-4">Deposit funds to start investing in properties</p>
              <button
                onClick={() => navigate("/deposit")}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <ArrowDownLeft size={13} />
                Make a Deposit
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
