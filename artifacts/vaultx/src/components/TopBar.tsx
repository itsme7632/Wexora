import { useState, useCallback } from "react";
import { Bell, Moon, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { HamburgerButton } from "@/components/Sidebar";
import { NotificationPanel } from "@/components/NotificationPanel";

interface TopBarProps {
  onMenuOpen?: () => void;
}

export function TopBar({ onMenuOpen }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () =>
      fetch("/api/notifications?limit=1", { credentials: "include" }).then((r) => r.json()),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const unreadCount: number = notifData?.unreadCount ?? 0;

  const toggleNotif = useCallback(() => setNotifOpen((p) => !p), []);
  const closeNotif = useCallback(() => setNotifOpen(false), []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left: Hamburger (mobile) + Brand (mobile only, desktop brand is in sidebar) */}
          <div className="flex items-center gap-2">
            <HamburgerButton onClick={onMenuOpen ?? (() => {})} />
            <a href="/" className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-[10px] leading-none">EF</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[11px] font-extrabold text-foreground tracking-tight">ESTATEFUND</span>
                <span className="text-[8px] font-semibold text-muted-foreground tracking-[0.12em] uppercase">Invest</span>
              </div>
            </a>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications — floating panel trigger */}
            <button
              onClick={toggleNotif}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-95"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1 shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Floating notification panel */}
      <NotificationPanel open={notifOpen} onClose={closeNotif} />
    </>
  );
}
