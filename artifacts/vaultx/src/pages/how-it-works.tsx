import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  UserPlus, ShieldCheck, Wallet, Building2, TrendingUp, BarChart3,
  ArrowRight, Clock, Calendar, AlertCircle, CheckCircle2,
} from "lucide-react";

const STEPS = [
  { icon: UserPlus, step: "01", title: "Create Your Account", desc: "Sign up with your email and personal details. Your account is ready immediately." },
  { icon: ShieldCheck, step: "02", title: "Complete Verification", desc: "Complete KYC identity verification to unlock full platform features and withdrawals." },
  { icon: Wallet, step: "03", title: "Fund Your Wallet", desc: "Deposit USDT to your EstateFund wallet using the supported BNB Smart Chain network." },
  { icon: Building2, step: "04", title: "Explore Properties", desc: "Browse available real estate opportunities and review their investment terms." },
  { icon: TrendingUp, step: "05", title: "Choose Your Investment", desc: "Select your investment amount and confirm. Your investment begins on the configured start date." },
  { icon: BarChart3, step: "06", title: "Track Earnings & Maturity", desc: "Monitor your investment progress, pending earnings, and maturity date from your dashboard." },
];

const TIMELINE = [
  { icon: CheckCircle2, title: "Investment Confirmed", desc: "Your investment is recorded and linked to the property." },
  { icon: Clock, title: "Investment Becomes Active", desc: "Your investment starts on its configured start date and begins its term." },
  { icon: TrendingUp, title: "Earnings Accrue", desc: "Projected returns are calculated based on the property's configured rate and your investment amount." },
  { icon: BarChart3, title: "Track Your Progress", desc: "View pending earnings, total earned and remaining time from your portfolio." },
  { icon: Calendar, title: "Investment Reaches Maturity", desc: "When the investment term ends, the investment is settled according to the platform's configured process." },
];

export default function HowItWorksPage() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout title="How EstateFund Works">
      <div className="pb-24">

        {/* ── Hero ── */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80"
              alt=""
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 to-emerald-800/70" />
          </div>
          <div className="relative px-4 pt-10 pb-12 lg:px-12 lg:pt-16 lg:pb-20 max-w-6xl mx-auto">
            <p className="text-[10px] text-emerald-200/50 font-bold uppercase tracking-[0.2em] mb-3">EstateFund</p>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-[1.1] mb-4 max-w-2xl">
              How EstateFund Works
            </h1>
            <p className="text-sm lg:text-base text-white/70 font-medium leading-relaxed max-w-xl">
              Explore property opportunities, review investment terms, fund your wallet, invest and track your portfolio — all from one platform.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4">

          {/* ── Step-by-Step ── */}
          <div className="py-8">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-2">Step by Step</p>
            <h2 className="text-xl font-bold text-foreground mb-6">Getting Started</h2>

            <div className="space-y-4">
              {STEPS.map(({ icon: Icon, step, title, desc }, i) => (
                <div key={step} className="bg-card border border-border rounded-2xl p-5 relative">
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-[29px] top-[56px] w-px h-[calc(100%-56px)] bg-border" />
                  )}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Icon size={20} className="text-white" />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-background border-2 border-emerald-500 flex items-center justify-center text-[9px] font-bold text-emerald-600">
                        {step}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Understand Before You Invest ── */}
          <div className="mb-10">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-2">Key Information</p>
            <h2 className="text-xl font-bold text-foreground mb-5">Understand Before You Invest</h2>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              {[
                { label: "Minimum Investment", desc: "Each property has a minimum investment amount. You must invest at least this amount to participate." },
                { label: "Investment Duration", desc: "Each property has a configured investment term (e.g., 180 days, 365 days). This is how long your investment runs from its start date to maturity." },
                { label: "Projected Return Range", desc: "Properties display a projected return range (e.g., 0.8%–1.4% daily). This is the configured rate range for the investment, not a guaranteed outcome." },
                { label: "Funding Progress", desc: "Shows how much capital has been raised toward the property's funding goal. This indicates overall investor interest." },
                { label: "Funding Deadline", desc: "The deadline by which new investments can be accepted for a property. This does NOT affect your personal investment duration — your investment continues for its full configured term regardless of when the funding deadline passes." },
                { label: "Your Individual Start Date", desc: "Your personal investment begins on its configured start date, which is set when you confirm your investment." },
                { label: "Your Maturity / End Date", desc: "Your personal investment matures on its configured end date (start date + investment duration). This is your individual maturity date." },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mt-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Important Distinction</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  A property's <strong>funding deadline</strong> only determines when new investments can be accepted. Your personal investment runs for its full configured <strong>investment duration</strong> from your individual start date — the funding deadline does not end your investment.
                </p>
              </div>
            </div>
          </div>

          {/* ── What Happens After You Invest ── */}
          <div className="mb-10">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-2">Investment Timeline</p>
            <h2 className="text-xl font-bold text-foreground mb-5">What Happens After You Invest</h2>

            <div className="space-y-3">
              {TIMELINE.map(({ icon: Icon, title, desc }, i) => (
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

          {/* ── CTA ── */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-6 lg:p-10 text-center mb-4">
            <h3 className="text-xl lg:text-2xl font-black text-white mb-2">Ready to Start?</h3>
            <p className="text-sm text-white/60 mb-6 max-w-md mx-auto">Explore available property opportunities and review their investment terms.</p>
            <Button className="bg-white text-emerald-700 hover:bg-white/90 font-bold h-12 px-8 text-sm gap-2" onClick={() => setLocation("/investments")}>
              Explore Properties <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
