import {
  LayoutDashboard, Users, DollarSign, TrendingUp, ShieldCheck,
  MessageSquare, Settings, Server, ArrowLeft, ChevronRight,
  LogOut, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { AdminSection } from "./utils";

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  badge?: number;
  group?: string;
}

interface AdminNavProps {
  active: AdminSection;
  onNavigate: (section: AdminSection) => void;
  pendingCounts: {
    deposits: number;
    withdrawals: number;
    kyc: number;
    tickets: number;
  };
}

const NAV_ITEMS: Omit<NavItem, "badge">[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "finance", label: "Finance", icon: DollarSign },
  { id: "investments", label: "Properties", icon: TrendingUp },
  { id: "verification", label: "Verification", icon: ShieldCheck },
  { id: "content", label: "Content", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "infrastructure", label: "Infrastructure", icon: Server },
];

function getBadge(id: AdminSection, pendingCounts: AdminNavProps["pendingCounts"]) {
  switch (id) {
    case "finance":
      return pendingCounts.deposits + pendingCounts.withdrawals;
    case "verification":
      return pendingCounts.kyc;
    case "content":
      return pendingCounts.tickets;
    default:
      return 0;
  }
}

export function AdminNav({ active, onNavigate, pendingCounts }: AdminNavProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="w-full lg:w-56 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 shrink-0">
        <a href="/" className="flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white transition-colors">
          <ArrowLeft size={14} className="text-white/50" />
          Back to App
        </a>
        <div className="flex items-center gap-2 mt-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="text-white font-bold text-xs">EF</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Admin Panel</p>
            <p className="text-[9px] text-emerald-400/40 tracking-widest mt-0.5">ESTATEFUND</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 sidebar-scroll">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const badge = getBadge(item.id, pendingCounts);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group mb-0.5",
                isActive
                  ? "bg-primary/15 text-white"
                  : "text-white/40 hover:text-white/75 hover:bg-white/5"
              )}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2 : 1.5}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-emerald-400/30 group-hover:text-emerald-400/60"
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center leading-none">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="shrink-0 px-3 pb-4 space-y-1 border-t border-white/5 pt-3">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[13px] font-medium text-white/40 hover:text-white/75 hover:bg-white/5 transition-all"
        >
          {theme === "dark" ? <Sun size={16} className="text-emerald-400/30" /> : <Moon size={16} className="text-emerald-400/30" />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[13px] font-medium text-red-400/50 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut size={16} className="shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
}

/** Mobile bottom tabs for admin */
export function AdminMobileNav({ active, onNavigate, pendingCounts }: AdminNavProps) {
  const mobileItems = NAV_ITEMS.slice(0, 5);
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar border-t border-sidebar-border px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const badge = getBadge(item.id, pendingCounts);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all relative",
                isActive ? "text-primary" : "text-white/40"
              )}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 text-[8px] font-bold px-1 py-0 rounded-full bg-red-500 text-white min-w-[14px] text-center leading-[14px]">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
