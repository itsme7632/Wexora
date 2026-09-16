import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { BackTo } from "@/components/BackTo";
import { Button } from "@/components/ui/button";
import {
  Building2, Home, Briefcase, Hotel, ArrowRight, Shield, Eye,
  Clock, TrendingUp, CheckCircle2, Globe, Lock, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PROPERTY_CATEGORIES = [
  { icon: Home, label: "Residential", desc: "Apartment buildings, condos, and residential developments in prime urban locations.", color: "text-blue-600", bg: "bg-blue-500/10" },
  { icon: Briefcase, label: "Commercial", desc: "Office towers, retail complexes, and business districts with strong tenant demand.", color: "text-purple-600", bg: "bg-purple-500/10" },
  { icon: Hotel, label: "Hospitality", desc: "Hotels, resorts, and vacation properties generating seasonal rental income.", color: "text-rose-600", bg: "bg-rose-500/10" },
  { icon: Building2, label: "Mixed-Use", desc: "Properties combining residential, retail, and commercial spaces in one development.", color: "text-amber-600", bg: "bg-amber-500/10" },
];

const APPROACH_ITEMS = [
  { icon: Eye, label: "Clear Investment Terms", desc: "See minimum investment, projected return range, funding progress and investment duration before committing." },
  { icon: Clock, label: "Defined Investment Duration", desc: "Each property investment has a clear start date, maturity date and configured term." },
  { icon: TrendingUp, label: "Funding Progress", desc: "Track how much capital has been raised toward each property's funding goal." },
  { icon: Wallet, label: "Transparent Account Tracking", desc: "Monitor your portfolio, earnings, wallet balance and transaction history in real time." },
];

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout title="About EstateFund">
      <div className="pb-24">

        {/* ── Back ── */}
        <div className="px-4 lg:px-12 max-w-6xl mx-auto pt-3">
          <BackTo to="/settings" label="Settings" />
        </div>

        {/* ── Hero ── */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />
          <div className="relative px-4 pt-10 pb-12 lg:px-12 lg:pt-16 lg:pb-20 max-w-6xl mx-auto">
            <p className="text-[10px] text-emerald-200/50 font-bold uppercase tracking-[0.2em] mb-3">EstateFund</p>
            <h1 className="text-3xl lg:text-5xl font-black text-white leading-[1.1] mb-4 max-w-2xl">
              Real Estate Investing,<br />Made Clear
            </h1>
            <p className="text-sm lg:text-base text-white/70 font-medium leading-relaxed max-w-xl">
              EstateFund is a real estate investment platform that gives users access to professionally presented property opportunities across residential, commercial and hospitality markets.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button className="bg-white text-emerald-700 hover:bg-white/90 font-bold h-11 px-6 text-sm gap-2" onClick={() => setLocation("/investments")}>
                Explore Properties <ArrowRight size={14} />
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold h-11 px-6 text-sm gap-2" onClick={() => setLocation("/how-it-works")}>
                How It Works
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4">

          {/* ── What EstateFund Is ── */}
          <div className="py-8">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-2">What EstateFund Is</p>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-3">A Platform for Property Investors</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              EstateFund connects individual investors with real estate property opportunities. Each listed property includes clear investment terms, projected return ranges, funding progress and defined investment durations — so you can make informed decisions before committing capital.
            </p>
          </div>

          {/* ── Property Categories ── */}
          <div className="mb-10">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-2">Property Categories</p>
            <h2 className="text-xl font-bold text-foreground mb-5">Diverse Real Estate Opportunities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PROPERTY_CATEGORIES.map(({ icon: Icon, label, desc, color, bg }) => (
                <div key={label} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bg)}>
                    <Icon size={18} className={color} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Our Approach ── */}
          <div className="mb-10">
            <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-2">Our Approach</p>
            <h2 className="text-xl font-bold text-foreground mb-5">Built on Clarity and Transparency</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {APPROACH_ITEMS.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">{label}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Security ── */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 lg:p-8 mb-10">
            <div className="flex flex-col lg:flex-row lg:items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <Shield size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-emerald-600 dark:text-emerald-400 mb-2">Account Security</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  EstateFund protects your account through encrypted connections, optional two-factor authentication (2FA), and identity verification (KYC) for enhanced account security.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Encrypted Connections", "Two-Factor Authentication", "KYC Verification", "Secure Infrastructure"].map((badge) => (
                    <span key={badge} className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-6 lg:p-10 text-center mb-4">
            <h3 className="text-xl lg:text-2xl font-black text-white mb-2">Ready to Explore Properties?</h3>
            <p className="text-sm text-white/60 mb-6 max-w-md mx-auto">Browse available real estate opportunities and review their investment terms.</p>
            <Button className="bg-white text-emerald-700 hover:bg-white/90 font-bold h-12 px-8 text-sm gap-2" onClick={() => setLocation("/investments")}>
              View Properties <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
