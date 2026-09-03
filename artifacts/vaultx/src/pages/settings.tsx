import { useState } from "react";
import { useLocation } from "wouter";
import {
  Shield, FileCheck, User, Bell, BellOff,
  Moon, Sun, Info, BookOpen, HelpCircle,
  LogOut, Settings as SettingsIcon, Palette, TrendingUp, KeyRound,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} className="relative inline-flex shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-full" style={{ width: 44, height: 24 }}>
      <span className="absolute inset-0 rounded-full transition-colors duration-200" style={{ backgroundColor: checked ? "hsl(var(--primary))" : "hsl(220 13% 69% / 0.35)" }} />
      <span className="absolute rounded-full bg-white shadow-md transition-all duration-200" style={{ top: 2, left: checked ? 22 : 2, width: 20, height: 20 }} />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">{children}</p>;
}

function SettingsRow({ icon: Icon, iconColor, label, description, action, onClick }: { icon: React.ComponentType<{ size?: number; className?: string }>; iconColor?: string; label: string; description: string; action?: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/40 transition-all text-left group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor || "bg-muted/60"}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      {action || (
        <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors shrink-0">→</span>
      )}
    </button>
  );
}

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const logout = useLogout();
  const [notifMuted, setNotifMuted] = useState(() => isNotificationMuted());

  const { data: publicSettings } = useQuery({ queryKey: ["public-settings"], queryFn: async () => { const res = await fetch("/api/settings/public", { credentials: "include" }); return res.ok ? res.json() : {}; }, staleTime: 300000 });
  const kycEnabled = !publicSettings || publicSettings?.kyc_enabled !== "false";

  const handleLogout = () => { logout.mutate(undefined, { onSuccess: () => { queryClient.clear(); setLocation("/login"); }, onError: () => toast({ title: "Error", description: "Failed to logout", variant: "destructive" }) }); };
  const handleToggleMute = () => { const next = !notifMuted; setNotifMuted(next); setNotificationMuted(next); if (!next) setTimeout(() => playNotificationSound("preview"), 80); toast({ title: next ? "Notification sound muted" : "Notification sound enabled" }); };

  return (
    <AppLayout fullBleed>
      <div className="max-w-3xl mx-auto px-4 py-4 md:py-6 lg:px-8 pb-28 space-y-4 md:space-y-6">

        {/* ══════════════════════════════════════════════════════════
           SETTINGS HEADER
           ══════════════════════════════════════════════════════════ */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <SettingsIcon size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">Manage your EstateFund account, security, notifications, and preferences.</p>
        </div>

        {/* ══════════════════════════════════════════════════════════
           ACCOUNT — Profile + KYC
           Two wide row cards stacked
           ══════════════════════════════════════════════════════════ */}
        <div className="animate-fade-in space-y-1">
          <SectionLabel>Account</SectionLabel>
          <div className="v3-card divide-y divide-border/40">
            <SettingsRow
              icon={User}
              iconColor="bg-gradient-to-br from-emerald-500 to-teal-500"
              label="Profile"
              description={`${user?.fullName || "Your name"} · ${user?.email || "No email"}`}
              onClick={() => setLocation("/profile")}
            />
            {kycEnabled && (
              <SettingsRow
                icon={FileCheck}
                iconColor="bg-gradient-to-br from-amber-500 to-orange-500"
                label="Identity Verification (KYC)"
                description={
                  user?.kycStatus === "approved"
                    ? "Identity verified"
                    : user?.kycStatus === "pending"
                      ? "Under review"
                      : "Verify your identity to unlock full access"
                }
                action={
                  <div className="flex items-center gap-2 shrink-0">
                    {user?.kycStatus === "pending" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">Pending</span>
                    )}
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">→</span>
                  </div>
                }
                onClick={() => setLocation("/kyc")}
              />
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
           SECURITY — Dedicated section
           Password, 2FA, sessions
           ══════════════════════════════════════════════════════════ */}
        <div className="animate-fade-in space-y-1">
          <SectionLabel>Security</SectionLabel>
          <div className="v3-card divide-y divide-border/40">
            <SettingsRow
              icon={KeyRound}
              iconColor="bg-gradient-to-br from-blue-500 to-indigo-500"
              label="Password & 2FA"
              description="Manage your password, two-factor authentication, and active sessions"
              onClick={() => setLocation("/security")}
            />
            <SettingsRow
              icon={Shield}
              iconColor="bg-gradient-to-br from-violet-500 to-purple-500"
              label="Account Security"
              description="Review security settings and session activity"
              onClick={() => setLocation("/security")}
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
           NOTIFICATIONS + APPEARANCE
           Two side-by-side panels
           ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
          {/* Notifications */}
          <div className="v3-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center gap-2">
              <Bell size={13} className="text-amber-500" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Notifications</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => setLocation("/notifications")}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">Notification Center</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">View all account alerts</p>
                </div>
                <span className="text-[11px] font-medium text-primary">→</span>
              </button>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 mt-1">
                <div>
                  <p className="text-sm font-medium text-foreground">Sound</p>
                  <p className="text-[11px] text-muted-foreground">{notifMuted ? "Muted" : "Enabled"}</p>
                </div>
                <Toggle checked={!notifMuted} onChange={handleToggleMute} />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="v3-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center gap-2">
              <Palette size={13} className="text-slate-500" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Appearance</p>
            </div>
            <div className="p-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                    {theme === "dark" ? <Moon size={14} className="text-primary" /> : <Sun size={14} className="text-amber-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Theme</p>
                    <p className="text-[11px] text-muted-foreground">
                      {theme === "dark" ? "Dark mode" : "Light mode"}
                    </p>
                  </div>
                </div>
                <Toggle checked={theme === "dark"} onChange={toggleTheme} />
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
           HELP & INFORMATION
           Full-width row links
           ══════════════════════════════════════════════════════════ */}
        <div className="animate-fade-in space-y-1">
          <SectionLabel>Help & Information</SectionLabel>
          <div className="v3-card divide-y divide-border/40">
            <SettingsRow
              icon={Info}
              iconColor="bg-gradient-to-br from-emerald-500 to-green-600"
              label="About EstateFund"
              description="Learn about our real-estate investment platform"
              onClick={() => setLocation("/about")}
            />
            <SettingsRow
              icon={BookOpen}
              iconColor="bg-gradient-to-br from-sky-500 to-blue-500"
              label="How It Works"
              description="Step-by-step guide to investing with EstateFund"
              onClick={() => setLocation("/how-it-works")}
            />
            <SettingsRow
              icon={TrendingUp}
              iconColor="bg-gradient-to-br from-violet-500 to-purple-500"
              label="How Returns Work"
              description="Understand projected returns, earnings, and maturity"
              onClick={() => setLocation("/returns")}
            />
            <SettingsRow
              icon={HelpCircle}
              iconColor="bg-gradient-to-br from-amber-500 to-orange-500"
              label="FAQ / Help Center"
              description="Answers to common questions about the platform"
              onClick={() => setLocation("/faq")}
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
           SIGN OUT — Account Actions
           ══════════════════════════════════════════════════════════ */}
        <div className="animate-fade-in">
          <div className="border border-red-500/15 rounded-2xl overflow-hidden bg-red-500/3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-red-500/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <LogOut size={16} className="text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-500">Sign Out</p>
                <p className="text-[11px] text-muted-foreground">Sign out of your EstateFund account</p>
              </div>
              <span className="text-xs font-medium text-red-500/60">→</span>
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

import { isNotificationMuted, setNotificationMuted, playNotificationSound } from "@/lib/notificationSound";
