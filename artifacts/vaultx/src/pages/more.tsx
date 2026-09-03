import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Info, Lock, FileText, Download, Headphones, ChevronRight, Shield,
  Smartphone, PieChart, TrendingUp, BarChart3, HelpCircle, Users,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";

export default function MorePage() {
  const [, setLocation] = useLocation();
  const { data: appInfo } = useQuery({ queryKey: ["app-info"], queryFn: () => fetch("/api/app-info", { credentials: "include" }).then(r => r.json()), staleTime: 60000 });
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: () => fetch("/api/settings/public", { credentials: "include" }).then(r => r.json()), staleTime: 60000 });
  const platformName = settings?.platform_name || "Wexora";
  const appVersion = appInfo?.version ? `v${appInfo.version}` : "v3.0";

  const sections = [
    { title: "Community & Referrals", items: [{ icon: Users, label: "Referral Program", description: "Invite friends and earn commission", href: "/referrals" }] },
    { title: "Platform Tools", items: [
      { icon: PieChart, label: "Capital Allocation", description: "Portfolio composition and sector weights", href: "/capital-allocation" },
      { icon: TrendingUp, label: "Market Insights", description: "Weekly analysis and opportunity highlights", href: "/market-insights" },
      { icon: BarChart3, label: "Performance Center", description: "Platform stats and historical data", href: "/performance" },
    ]},
    { title: "Information & Legal", items: [
      { icon: HelpCircle, label: "FAQ", description: "Frequently asked questions", href: "/faq" },
      { icon: Info, label: "About Wexora", description: "Mission, features and platform stats", href: "/about" },
      { icon: Lock, label: "Privacy Policy", description: "How we protect your data", href: "/privacy" },
      { icon: FileText, label: "Terms & Conditions", description: "Platform usage rules", href: "/terms" },
      { icon: Download, label: "Download App", description: "Get the latest Android APK", href: "/download-app" },
      { icon: Headphones, label: "Contact Support", description: "Open a ticket or get help", href: "/support" },
    ]},
  ];

  return (
    <AppLayout fullBleed>
      <div className="max-w-2xl mx-auto px-4 py-5 lg:px-8 pb-24 space-y-5">

        {/* Header */}
        <div className="v3-gradient rounded-2xl p-6 text-white animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm"><Shield size={24} /></div>
            <div>
              <h1 className="font-bold text-lg">{platformName}</h1>
              <p className="text-[11px] text-white/40 mt-0.5">Professional investment platform</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        {sections.map(({ title, items }) => (
          <div key={title}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2.5 px-1">{title}</p>
            <div className="v3-card overflow-hidden divide-y divide-border/40">
              {items.map(({ icon: Icon, label, description, href }) => (
                <button key={href} onClick={() => setLocation(href)} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Icon size={16} className="text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{description}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Version */}
        <div className="v3-card-sunken flex items-center gap-3.5 px-4 py-3.5">
          <Smartphone size={16} className="text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">App Version</p>
            <p className="text-[11px] text-muted-foreground">{platformName} · Investment Platform</p>
          </div>
          <span className="text-sm font-bold font-mono text-primary">{appVersion}</span>
        </div>
      </div>
    </AppLayout>
  );
}
