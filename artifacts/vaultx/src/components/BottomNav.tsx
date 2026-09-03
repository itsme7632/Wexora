import { LayoutDashboard, Wallet, TrendingUp, PieChart, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/investments", icon: TrendingUp, label: "Invest" },
  { href: "/portfolio", icon: PieChart, label: "My Investments" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href === "/profile") return location === "/profile" || location === "/settings" || location === "/security";
    return location.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/50 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all duration-200 min-w-[52px]",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200",
                active && "bg-primary/10"
              )}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} className={cn("transition-all duration-200", active && "scale-110")} />
              </div>
              <span className={cn("text-[10px] font-medium transition-all duration-200 leading-none", active && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </nav>
  );
}
