import { useState } from "react";
import { TrendingUp, Newspaper, BarChart3, Globe, Zap, ArrowRight, Calendar, Tag, ArrowLeft, Users, DollarSign, Activity, Sparkles, Clock, Filter, LayoutGrid, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { usePlatformMetrics, formatMetricCompact } from "@/hooks/usePlatformMetrics";

const SECTION_TABS = [
  { id: "all", label: "All Insights", icon: Newspaper },
  { id: "market", label: "Market", icon: TrendingUp },
  { id: "investment", label: "Investment", icon: BarChart3 },
  { id: "announcement", label: "Updates", icon: Zap },
];

const CATEGORY_COLORS: Record<string, string> = {
  announcement: "bg-primary/10 text-primary border-primary/20",
  investment: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  security: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  market: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const CATEGORY_LABELS: Record<string, string> = {
  announcement: "Update", investment: "Investment", security: "Security", market: "Market",
};

const GROWTH_SECTORS = [
  { name: "Artificial Intelligence", trend: "+42%", icon: "🤖", color: "from-blue-500 to-indigo-600" },
  { name: "Digital Assets", trend: "+28%", icon: "💎", color: "from-purple-500 to-violet-600" },
  { name: "Clean Energy", trend: "+19%", icon: "⚡", color: "from-emerald-500 to-teal-600" },
  { name: "Fintech", trend: "+35%", icon: "📈", color: "from-amber-500 to-orange-600" },
];

const WEEKLY_SUMMARY = [
  { label: "Global Crypto Market Cap", value: "$2.4T", change: "+3.2%", up: true },
  { label: "DeFi Total Value Locked", value: "$118B", change: "+7.1%", up: true },
  { label: "Institutional Inflows", value: "$4.2B", change: "+12.4%", up: true },
  { label: "Market Volatility Index", value: "42.3", change: "-8.1%", up: false },
];

export default function MarketInsightsPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const { data: metrics, isLoading: metricsLoading } = usePlatformMetrics();

  const { data: allNews, isLoading } = useQuery({
    queryKey: ["news", "insights"],
    queryFn: async () => {
      const res = await fetch("/api/news?limit=50", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  const filtered = (allNews ?? []).filter((post: any) => activeTab === "all" || post.category === activeTab);
  const featured = (allNews ?? []).find((p: any) => p.isFeatured && p.isPublished);

  return (
    <AppLayout title="Market Insights">
      <div className="px-4 pt-5 pb-24 max-w-6xl mx-auto space-y-5">

        <button onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> <span>Back</span>
        </button>

        {/* ── Full-Width Hero ── */}
        <div className="v3-gradient rounded-2xl p-6 lg:p-8 relative overflow-hidden animate-fade-in">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} className="text-emerald-300" />
              <span className="text-[10px] text-emerald-300/60 font-semibold uppercase tracking-[0.2em]">Market Overview</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white mb-2 leading-tight">Market Insights</h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-lg">
              Stay informed with real-time analysis, weekly market updates, and expert insights on emerging investment opportunities.
            </p>
          </div>
        </div>

        {/* ── Metrics Strip ── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: DollarSign, label: "Capital Raised", value: metricsLoading ? "—" : formatMetricCompact(metrics?.totalRaised ?? 0), color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { icon: Users, label: "Participants", value: metricsLoading ? "—" : (metrics?.totalParticipants ?? 0).toLocaleString(), color: "text-primary", bg: "bg-primary/10" },
            { icon: Activity, label: "Active Funds", value: metricsLoading ? "—" : String(metrics?.activeOpportunities ?? 0), color: "text-purple-600", bg: "bg-purple-500/10" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="v3-card-elevated p-3.5 text-center animate-fade-in">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2", bg)}>
                <Icon size={14} className={color} />
              </div>
              <p className={cn("font-bold text-sm", color)}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── 2-Column Desktop: Featured + Growth Sectors ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Featured Insight — larger column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-amber-500" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Opportunity Highlight</p>
            </div>
            {featured ? (
              <button onClick={() => navigate(`/news/${featured.id}`)}
                className="w-full text-left v3-card-elevated p-5 lg:p-6 hover:shadow-lg transition-shadow group animate-fade-in">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Badge className={cn("text-[10px] border", CATEGORY_COLORS[featured.category] ?? "bg-muted text-muted-foreground")}>
                    {CATEGORY_LABELS[featured.category] ?? featured.category}
                  </Badge>
                  <ArrowRight size={16} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
                <h2 className="font-bold text-lg text-foreground leading-tight mb-2 line-clamp-2">{featured.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{featured.excerpt}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock size={11} />
                  {formatDateTime(featured.publishedAt ?? featured.createdAt)}
                </div>
              </button>
            ) : (
              <div className="v3-card p-8 text-center">
                <Sparkles size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No featured insights yet</p>
              </div>
            )}
          </div>

          {/* Growth Sectors */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Growth Sectors</p>
            </div>
            <div className="space-y-2.5">
              {GROWTH_SECTORS.map(({ name, trend, icon, color }) => (
                <div key={name} className={cn("bg-gradient-to-r rounded-xl p-4 text-white shadow-sm hover:shadow-md transition-shadow", color)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{icon}</span>
                      <div>
                        <p className="font-bold text-sm leading-tight">{name}</p>
                        <p className="text-white/70 text-xs mt-0.5">Year-to-date</p>
                      </div>
                    </div>
                    <span className="font-bold text-base">{trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab Filter ── */}
        <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1">
          {SECTION_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                activeTab === id ? "bg-primary text-white shadow-sm shadow-primary/25" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {/* ── 2-Column Desktop: Articles + Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Articles List */}
          <div className="lg:col-span-2 space-y-3">
            {isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
            ) : filtered.length > 0 ? (
              filtered.map((post: any) => (
                <button key={post.id} onClick={() => navigate(`/news/${post.id}`)}
                  className="w-full text-left v3-card-elevated p-4 lg:p-5 hover:shadow-md transition-shadow group animate-fade-in">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge className={cn("text-[9px] border", CATEGORY_COLORS[post.category] ?? "bg-muted text-muted-foreground")}>
                          {CATEGORY_LABELS[post.category] ?? post.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar size={9} /> {formatDateTime(post.publishedAt ?? post.createdAt)}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{post.title}</p>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground shrink-0 mt-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{post.excerpt}</p>
                </button>
              ))
            ) : (
              <div className="v3-card py-16 text-center">
                <Newspaper size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No insights yet</p>
                <p className="text-xs text-muted-foreground mt-1">Market insights will appear here when published</p>
              </div>
            )}
          </div>

          {/* Weekly Summary Sidebar */}
          <div className="space-y-5">
            <div className="v3-card-elevated p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={14} className="text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Weekly Summary</p>
              </div>
              <div className="space-y-0">
                {WEEKLY_SUMMARY.map(({ label, value, change, up }) => (
                  <div key={label} className="py-3 border-b border-border/50 last:border-0">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-foreground">{value}</p>
                      <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", up ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-500 dark:bg-red-900/30")}>
                        {change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="v3-card p-5 animate-fade-in">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Quick Stats</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">Platform uptime</span>
                  <span className="text-xs font-bold text-emerald-600">99.9%</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">Avg processing time</span>
                  <span className="text-xs font-bold text-foreground">{"<"} 24h</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">Support response</span>
                  <span className="text-xs font-bold text-foreground">{"<"} 4h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
