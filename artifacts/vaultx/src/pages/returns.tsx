import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Clock, DollarSign, AlertCircle, ArrowRight,
  CheckCircle2, BarChart3, Calendar, Info,
} from "lucide-react";

export default function ReturnsPage() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout title="How Returns Work — EstateFund">
      <div className="pb-24">

        {/* ── Hero ── */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden">
          <div className="relative px-4 pt-10 pb-12 lg:px-12 lg:pt-16 lg:pb-20 max-w-6xl mx-auto">
            <p className="text-[10px] text-emerald-200/50 font-bold uppercase tracking-[0.2em] mb-3">EstateFund</p>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-[1.1] mb-4 max-w-2xl">
              How Returns Work
            </h1>
            <p className="text-sm lg:text-base text-white/70 font-medium leading-relaxed max-w-xl">
              Understand how projected returns, earnings and investment timelines work on EstateFund.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4">

          {/* ── Disclaimer ── */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mt-6 mb-8 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Important Disclaimer</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Projected returns are estimates based on the terms configured for each investment opportunity and are not a guarantee of future performance. Actual returns may differ. Past performance is not indicative of future results.
              </p>
            </div>
          </div>

          {/* ── What Projected Return Means ── */}
          <div className="mb-8">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-2">Understanding Returns</p>
            <h2 className="text-xl font-bold text-foreground mb-4">What Projected Return Means</h2>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Each property on EstateFund displays a <strong>projected return range</strong> (e.g., 0.8%–1.4% daily). This range represents the configured minimum and maximum daily return rates for that specific investment opportunity.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-emerald-600" />
                    <h4 className="text-sm font-semibold text-foreground">Min Return Rate</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The lower bound of the projected return range. This is the minimum configured daily rate for the investment.
                  </p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-emerald-600" />
                    <h4 className="text-sm font-semibold text-foreground">Max Return Rate</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The upper bound of the projected return range. This is the maximum configured daily rate for the investment.
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                The actual daily return applied to your investment is determined by the platform's configured calculation logic and may fall within or at the boundaries of this range.
              </p>
            </div>
          </div>

          {/* ── How Earnings Are Calculated ── */}
          <div className="mb-8">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-2">Earnings Calculation</p>
            <h2 className="text-xl font-bold text-foreground mb-4">How Earnings Work</h2>

            <div className="space-y-3">
              {[
                { icon: Clock, title: "Investment Duration", desc: "Each property has a configured investment term (e.g., 180 days, 365 days). Your investment runs for this duration from its start date." },
                { icon: TrendingUp, title: "Daily Earnings Accrual", desc: "Earnings are calculated daily based on your invested amount and the configured return rate. These appear as pending earnings in your account." },
                { icon: DollarSign, title: "Pending Earnings", desc: "Pending earnings accumulate while your investment is active. You can view your pending earnings on your portfolio page in real time." },
                { icon: BarChart3, title: "Total Earned", desc: "Total earned reflects the cumulative earnings from all your investments — both pending and previously credited." },
                { icon: Calendar, title: "Maturity / End Date", desc: "When your investment reaches its maturity date (start date + configured duration), the investment term ends." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 bg-card border border-border rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Example ── */}
          <div className="mb-8">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-2">Illustrative Example</p>
            <h2 className="text-xl font-bold text-foreground mb-4">How Returns Might Work</h2>

            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="bg-muted/30 rounded-xl p-4 mb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Example (for illustration only):</strong> If you invest $1,000 in a property with a 0.8%–1.4% daily projected return range and a 365-day duration, and the platform applies a 1.0% daily rate, your investment would earn approximately $10 per day. Over 365 days, this would total approximately $3,650 in projected earnings — though actual returns depend on the configured rate applied by the platform.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This is an illustrative example only. Actual returns depend on the specific property, the rate configured by the platform, and are not guaranteed.
                </p>
              </div>
            </div>
          </div>

          {/* ── Key Terms ── */}
          <div className="mb-8">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-2">Key Terms</p>
            <h2 className="text-xl font-bold text-foreground mb-4">Important Definitions</h2>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              {[
                { term: "Projected Return", definition: "The estimated return range configured for a property investment opportunity." },
                { term: "Investment Term / Duration", definition: "The configured length of time an investment runs from its start date to maturity." },
                { term: "Pending Earnings", definition: "Earnings that have accrued but have not yet been credited or claimed." },
                { term: "Total Earned", definition: "The cumulative earnings from all investments, including pending and credited amounts." },
                { term: "Maturity Date", definition: "The date when an investment's configured term ends (start date + duration)." },
                { term: "Funding Deadline", definition: "The date by which new investments can be accepted for a property. Does not affect existing investors' maturity dates." },
              ].map(({ term, definition }) => (
                <div key={term} className="flex items-start gap-3">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{term}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{definition}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-6 lg:p-10 text-center mb-4">
            <h3 className="text-xl lg:text-2xl font-black text-white mb-2">View Investment Opportunities</h3>
            <p className="text-sm text-white/60 mb-6 max-w-md mx-auto">Browse properties and review their projected return terms before investing.</p>
            <Button className="bg-white text-emerald-700 hover:bg-white/90 font-bold h-12 px-8 text-sm gap-2" onClick={() => setLocation("/investments")}>
              View Properties <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
