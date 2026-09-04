import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Wallet, TrendingUp, PieChart,
  User, Bell, Settings, Shield,
  Sun, Moon, LogOut, X, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/* ─── Navigation items ──────────────────────────────────────────────────── */

const MAIN_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/investments", icon: TrendingUp, label: "Investments" },
  { href: "/portfolio", icon: PieChart, label: "My Investments" },
];

const ACCOUNT_ITEMS = [
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

/* ─── Sidebar content (shared between desktop and mobile) ───────────────── */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const handleNav = () => onNavigate?.();

  return (
    <div className="flex flex-col h-full">
      {/* ── Brand ─────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 shrink-0">
        <Link href="/" className="flex items-center gap-3" onClick={handleNav}>
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg shadow-sidebar-primary/25">
            <span className="text-sidebar-primary-foreground font-bold text-sm tracking-tight">EF</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight leading-none">
              ESTATEFUND
            </span>
            <span className="text-[9px] font-medium text-sidebar-accent-foreground/60 tracking-[0.25em] leading-none mt-1">
              INVEST
            </span>
          </div>
        </Link>
      </div>

      {/* ── Scrollable Navigation ─────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 scrollbar-thin sidebar-scroll">
        {/* Main Menu */}
        <p className="text-[10px] font-semibold text-sidebar-accent-foreground/50 uppercase tracking-[0.15em] px-3 mb-2">
          Main Menu
        </p>

        <div className="space-y-0.5">
          {MAIN_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={handleNav}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2 : 1.5}
                  className={cn(
                    "shrink-0 transition-colors",
                    active ? "text-sidebar-primary" : "text-sidebar-accent-foreground/40 group-hover:text-sidebar-accent-foreground/70"
                  )}
                />
                <span className="flex-1">{label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary" />}
              </Link>
            );
          })}
        </div>

        {/* Account Section */}
        <p className="text-[10px] font-semibold text-sidebar-accent-foreground/50 uppercase tracking-[0.15em] px-3 mb-2 mt-6">
          Account
        </p>

        <div className="space-y-0.5">
          {ACCOUNT_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={handleNav}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2 : 1.5}
                  className={cn(
                    "shrink-0 transition-colors",
                    active ? "text-sidebar-primary" : "text-sidebar-accent-foreground/40 group-hover:text-sidebar-accent-foreground/70"
                  )}
                />
                <span className="flex-1">{label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary" />}
              </Link>
            );
          })}
        </div>

        {/* Admin link */}
        {user?.isAdmin && (
          <div className="mt-2">
            <Link
              href="/admin"
              onClick={handleNav}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group",
                isActive("/admin")
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                  : "text-amber-600/60 dark:text-amber-400/40 hover:text-amber-600 dark:hover:text-amber-300/80 hover:bg-amber-500/5"
              )}
            >
              <Shield size={18} strokeWidth={1.5} className="shrink-0" />
              <span className="flex-1">Admin Panel</span>
            </Link>
          </div>
        )}
      </div>

      {/* ── Bottom Section (always accessible) ────────────────── */}
      <div className="shrink-0 px-3 pb-4 space-y-1.5 border-t border-sidebar-border pt-3">
        {/* User Profile Card */}
        <Link
          href="/profile"
          onClick={handleNav}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent/50 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/15 flex items-center justify-center shrink-0">
            <span className="text-sidebar-primary font-bold text-xs">
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-sidebar-foreground truncate leading-tight">
              {user?.fullName || user?.username || "User"}
            </p>
            <p className="text-[11px] text-sidebar-accent-foreground/50 truncate">
              {user?.email || ""}
            </p>
          </div>
          <ChevronRight size={14} className="text-sidebar-foreground/20 shrink-0" />
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50 transition-all"
        >
          {theme === "dark" ? (
            <Sun size={18} strokeWidth={1.5} className="shrink-0 text-sidebar-accent-foreground/40" />
          ) : (
            <Moon size={18} strokeWidth={1.5} className="shrink-0 text-sidebar-accent-foreground/40" />
          )}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500/60 dark:text-red-400/50 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut size={18} strokeWidth={1.5} className="shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Desktop Sidebar (permanent) ───────────────────────────────────────── */

export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 lg:left-0 lg:h-full bg-sidebar border-r border-sidebar-border z-40 overflow-hidden">
      <SidebarContent />
    </aside>
  );
}

/* ─── Mobile Sidebar (drawer) ───────────────────────────────────────────── */

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-sidebar shadow-2xl lg:hidden transition-transform duration-300 ease-out flex flex-col overflow-hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all z-10"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>

        <SidebarContent onNavigate={onClose} />
      </div>
    </>
  );
}

/* ─── Mobile Hamburger Button ───────────────────────────────────────────── */

export function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-95"
      aria-label="Open menu"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="3" y1="5.5" x2="17" y2="5.5" />
        <line x1="3" y1="10" x2="17" y2="10" />
        <line x1="3" y1="14.5" x2="17" y2="14.5" />
      </svg>
    </button>
  );
}
