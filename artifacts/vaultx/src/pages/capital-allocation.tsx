import { useState } from "react";
import { PieChart, Edit2, Save, X, ArrowLeft, DollarSign, Users, Activity, TrendingUp, Layers, Target, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { usePlatformMetrics, formatMetricCompact } from "@/hooks/usePlatformMetrics";

const DEFAULT_ALLOCATIONS = [
  { label: "Digital Assets", pct: 35, color: "from-blue-500 to-indigo-600", bg: "bg-blue-500", track: "bg-blue-100 dark:bg-blue-900/30" },
  { label: "Technology Infrastructure", pct: 25, color: "from-purple-500 to-violet-600", bg: "bg-purple-500", track: "bg-purple-100 dark:bg-purple-900/30" },
  { label: "AI Development", pct: 20, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-500", track: "bg-emerald-100 dark:bg-emerald-900/30" },
  { label: "Strategic Growth", pct: 15, color: "from-amber-500 to-orange-600", bg: "bg-amber-500", track: "bg-amber-100 dark:bg-amber-900/30" },
  { label: "Reserve Fund", pct: 5, color: "from-slate-500 to-gray-600", bg: "bg-slate-500", track: "bg-slate-100 dark:bg-slate-800" },
];

async function loadAllocation() {
  const res = await fetch("/api/settings/public", { credentials: "include" });
  const data = await res.json();
  if (data?.capital_allocation) {
    try { return JSON.parse(data.capital_allocation); } catch {}
  }
  return DEFAULT_ALLOCATIONS;
}

async function saveAllocation(allocations: typeof DEFAULT_ALLOCATIONS) {
  const res = await fetch("/api/admin/settings", {
    method: "PUT", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ capital_allocation: JSON.stringify(allocations) }),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

/* ── SVG Donut Chart ── */
function DonutChart({ allocations }: { allocations: any[] }) {
  const total = allocations.reduce((s: number, a: any) => s + (parseFloat(String(a.pct)) || 0), 0);
  let accumulated = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;

  const COLOR_MAP: Record<string, string> = {
    "from-blue-500 to-indigo-600": "#6366f1",
    "from-purple-500 to-violet-600": "#8b5cf6",
    "from-emerald-500 to-teal-600": "#10b981",
    "from-amber-500 to-orange-600": "#f59e0b",
    "from-slate-500 to-gray-600": "#64748b",
  };

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {total > 0 && allocations.map((alloc: any, i: number) => {
          const pct = parseFloat(String(alloc.pct)) || 0;
          const dashLen = (pct / total) * circumference;
          const offset = (accumulated / total) * circumference;
          accumulated += pct;
          return (
            <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
              stroke={COLOR_MAP[alloc.color] ?? "#10b981"} strokeWidth="18"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={-offset}
              className="transition-all duration-700"
            />
          );
        })}
        <circle cx={cx} cy={cy} r="38" fill="hsl(var(--card))" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground text-sm font-bold">{total}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground text-[8px]">TOTAL</text>
      </svg>
    </div>
  );
}

export default function CapitalAllocationPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = (user as any)?.isAdmin;
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<typeof DEFAULT_ALLOCATIONS>([]);
  const { data: metrics, isLoading: metricsLoading } = usePlatformMetrics();

  const { data: allocations = DEFAULT_ALLOCATIONS, isLoading } = useQuery({
    queryKey: ["capital-allocation"],
    queryFn: loadAllocation,
    staleTime: 60000,
  });

  const save = useMutation({
    mutationFn: saveAllocation,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["capital-allocation"] }); qc.invalidateQueries({ queryKey: ["public-settings"] }); setEditing(false); },
  });

  const startEdit = () => { setDraft(allocations.map((a: any) => ({ ...a }))); setEditing(true); };
  const total = draft.reduce((s: number, a: any) => s + (parseFloat(String(a.pct)) || 0), 0);
  const current = editing ? draft : allocations;

  return (
    <AppLayout title="Capital Allocation">
      <div className="px-4 pt-5 pb-24 max-w-6xl mx-auto space-y-5">

        <button onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> <span>Back</span>
        </button>

        {/* ── Hero Header ── */}
        <div className="v3-gradient rounded-2xl p-6 lg:p-8 relative overflow-hidden animate-fade-in">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <PieChart size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg lg:text-xl text-white leading-tight">Capital Allocation</h2>
                  <p className="text-white/50 text-xs">Platform portfolio composition</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-lg">
                Our capital is strategically deployed across multiple sectors to optimize returns while managing risk exposure across diverse asset classes.
              </p>
            </div>
            {isAdmin && !editing && (
              <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-1.5 text-xs shrink-0" onClick={startEdit}>
                <Edit2 size={12} /> Edit
              </Button>
            )}
          </div>
        </div>

        {/* ── 2-Column Desktop Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: Allocation Breakdown + Donut */}
          <div className="lg:col-span-3 space-y-5">

            {/* Donut + Legend */}
            <div className="v3-card-elevated p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-5">
                <Target size={14} className="text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Portfolio Breakdown</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <DonutChart allocations={current} />

                <div className="flex-1 space-y-2.5 w-full">
                  {current.map((alloc: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full shrink-0", alloc.bg ?? "bg-primary")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground truncate">{alloc.label}</span>
                          {editing ? (
                            <div className="flex items-center gap-1">
                              <Input type="number" min={0} max={100} value={draft[i]?.pct ?? ""}
                                onChange={(e) => setDraft((d) => d.map((x, j) => j === i ? { ...x, pct: parseFloat(e.target.value) || 0 } : x))}
                                className="w-14 h-7 text-xs text-center px-1" />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-foreground">{alloc.pct}%</span>
                          )}
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", alloc.color ?? "from-primary to-blue-600")}
                            style={{ width: `${alloc.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {editing && (
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">Total allocation</p>
                    <p className={cn("text-sm font-bold", total === 100 ? "text-emerald-600" : "text-destructive")}>{total}%</p>
                  </div>
                  {total !== 100 && <p className="text-xs text-destructive mb-3">Allocations must sum to 100%</p>}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-9 text-sm gap-1.5" onClick={() => setEditing(false)}>
                      <X size={13} /> Cancel
                    </Button>
                    <Button className="flex-1 h-9 text-sm gap-1.5" disabled={total !== 100 || save.isPending} onClick={() => save.mutate(draft)}>
                      <Save size={13} /> {save.isPending ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Strategy Explanation */}
            <div className="v3-card p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Investment Strategy</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our diversified allocation strategy balances growth potential across high-growth sectors like digital assets and AI development with stable reserves and infrastructure investments, ensuring both capital appreciation and downside protection.
              </p>
            </div>
          </div>

          {/* Right: Sector Cards + Platform Metrics */}
          <div className="lg:col-span-2 space-y-5">

            {/* Sector Overview */}
            <div className="v3-card-elevated overflow-hidden animate-fade-in">
              <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                <Layers size={14} className="text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Sector Overview</p>
              </div>
              <div className="divide-y divide-border/50">
                {(isLoading ? DEFAULT_ALLOCATIONS : allocations).map((alloc: any, i: number) => (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-muted/20 transition-colors">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0 shadow-sm", alloc.color ?? "from-primary to-blue-600")}>
                      <span className="text-white font-bold text-sm">{alloc.pct}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{alloc.label}</p>
                      <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full bg-gradient-to-r", alloc.color ?? "from-primary to-blue-600")} style={{ width: `${alloc.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Overview Metrics */}
            <div className="v3-card-elevated p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Platform Overview</p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: DollarSign, label: "Total Capital Raised", value: metricsLoading ? "—" : formatMetricCompact(metrics?.totalRaised ?? 0), color: "text-emerald-600", bg: "bg-emerald-500/10" },
                  { icon: Users, label: "Total Participants", value: metricsLoading ? "—" : (metrics?.totalParticipants ?? 0).toLocaleString(), color: "text-primary", bg: "bg-primary/10" },
                  { icon: Activity, label: "Active Opportunities", value: metricsLoading ? "—" : String(metrics?.activeOpportunities ?? 0), color: "text-purple-600", bg: "bg-purple-500/10" },
                  { icon: TrendingUp, label: "Avg Funding", value: metricsLoading ? "—" : `${Math.round(metrics?.fundingPercentage ?? 0)}%`, color: "text-amber-600", bg: "bg-amber-500/10" },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", bg)}>
                      <Icon size={15} className={color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={cn("font-bold text-sm", color)}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-muted/30 border border-border/50 rounded-2xl p-4">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Capital allocation percentages represent target portfolio weights and may vary slightly due to market conditions. Rebalancing occurs periodically to maintain optimal exposure across sectors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
