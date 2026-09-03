import { useState } from "react";
import {
  Edit3, Check, X, Shield, FileCheck, Copy, CheckCircle,
  Mail, Calendar, User, Settings, Lock as LockIcon, Home,
  Phone, Globe, ChevronRight, Building2, Wallet, TrendingUp,
} from "lucide-react";
import { useUpdateUserProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

function kycBadge(status: string) {
  switch (status) {
    case "approved": return { label: "Verified", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle };
    case "pending": return { label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Shield };
    case "rejected": return { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: Shield };
    default: return { label: "Unverified", color: "bg-muted text-muted-foreground border-border", icon: Shield };
  }
}

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateProfile = useUpdateUserProfile();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: publicSettings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => { const res = await fetch("/api/settings/public", { credentials: "include" }); return res.ok ? res.json() : {}; },
    staleTime: 300000,
  });
  const kycEnabled = !publicSettings || publicSettings?.kyc_enabled !== "false";

  const [form, setForm] = useState({ fullName: user?.fullName ?? "" });

  const handleSave = () => {
    updateProfile.mutate({ data: { fullName: form.fullName } }, {
      onSuccess: () => { toast({ title: "Profile updated" }); queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }); setEditing(false); },
      onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
    });
  };

  const handleCopyCode = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = user?.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "W";
  const kyc = kycBadge(user?.kycStatus ?? "none");
  const KycIcon = kyc.icon;

  const completionItems = [
    { label: "Full name", ok: !!user?.fullName, href: undefined },
    { label: "Email verified", ok: !!user?.emailVerified, href: undefined },
    { label: "KYC verified", ok: user?.kycStatus === "approved", href: kycEnabled ? "/kyc" : undefined },
    { label: "2FA enabled", ok: !!user?.twoFaEnabled, href: "/security" },
  ];
  const completionPct = Math.round((completionItems.filter(i => i.ok).length / completionItems.length) * 100);

  return (
    <AppLayout fullBleed>
      <div className="max-w-6xl mx-auto px-4 py-4 lg:px-8 pb-28 space-y-5">

        {/* ══════════════════════════════════════════════════════════
           A. PROFILE IDENTITY HERO — Full-width with 2-col inner layout
           ══════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl animate-fade-in">
          {/* Full-background gradient + pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wOCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />

          <div className="relative px-5 py-6 lg:px-8 lg:py-8">
            {/* Desktop: horizontal layout. Mobile: stacked. */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">

              {/* Left: Avatar + Identity */}
              <div className="flex items-center gap-4 lg:flex-1">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 border-[3px] border-emerald-800/40 flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl lg:text-2xl font-bold">{initials}</span>
                  </div>
                  {user?.isAdmin && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center border-2 border-card shadow-sm">
                      <span className="text-[9px] font-bold text-white">A</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl lg:text-2xl font-bold text-white leading-tight">{user?.fullName || "EstateFund Member"}</h1>
                  <p className="text-xs text-white/60 mt-0.5">@{user?.username}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-white/60">
                    <Mail size={12} className="text-white/40" />
                    <span>{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Right: Badges + Edit + Member Since */}
              <div className="flex flex-col items-start lg:items-end gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {kycEnabled && (
                    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border", kyc.color)}>
                      <KycIcon size={12} /> {kyc.label}
                    </span>
                  )}
                  {user?.twoFaEnabled && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white/15 text-white border border-white/20">
                      <Shield size={12} className="text-emerald-200" /> 2FA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-white/60 flex items-center gap-1">
                    <Calendar size={11} className="text-white/40" />
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                  </span>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm"
                    onClick={() => { setForm({ fullName: user?.fullName ?? "" }); setEditing(true); }}
                  >
                    <Edit3 size={12} /> Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
           B. TWO-COLUMN MAIN CONTENT
           Left: Account Readiness + Security
           Right: Personal Information + Identifiers
           ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 animate-fade-in">

          {/* ── LEFT COLUMN (3/5) ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Account Readiness */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Account Readiness</p>
                </div>
                <span className="text-xs font-bold text-foreground">{completionPct}%</span>
              </div>
              <div className="p-5">
                {/* Progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                {/* Checklist items */}
                <div className="space-y-2">
                  {completionItems.map(({ label, ok, href }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                          ok ? "bg-emerald-500" : "bg-muted"
                        )}>
                          {ok ? <Check size={11} className="text-white" /> : <X size={11} className="text-muted-foreground" />}
                        </div>
                        <span className={cn("text-sm", ok ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                      </div>
                      {!ok && href && (
                        <Link href={href} className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                          Set up <ChevronRight size={11} />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Security & Verification */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Security & Verification</p>
              </div>
              <div className="p-5 space-y-3">
                {/* Password */}
                <Link href="/security" className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <LockIcon size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Password</p>
                      <p className="text-[11px] text-muted-foreground">Change your account password</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
                {/* 2FA */}
                <Link href="/security" className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Shield size={14} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
                      <p className="text-[11px] text-muted-foreground">
                        {user?.twoFaEnabled ? "Enabled — extra layer of security active" : "Not enabled — protect your account"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.twoFaEnabled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">On</span>
                    )}
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
                {/* KYC */}
                {kycEnabled && (
                  <Link href="/kyc" className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <FileCheck size={14} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Identity Verification</p>
                        <p className="text-[11px] text-muted-foreground">
                          {user?.kycStatus === "approved" ? "Identity verified" : user?.kycStatus === "pending" ? "Under review" : "Complete KYC to unlock full access"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", kyc.color)}>
                        {kyc.label}
                      </span>
                      <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (2/5) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal Information */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Personal Information</p>
                </div>
                {!editing ? (
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] text-primary gap-1 px-2" onClick={() => { setForm({ fullName: user?.fullName ?? "" }); setEditing(true); }}>
                    <Edit3 size={10} /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground px-2" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-6 text-[11px] gap-1 px-2" onClick={handleSave} disabled={updateProfile.isPending}>
                      <Check size={10} /> Save
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-5 space-y-3">
                {[
                  { icon: User, label: "Full Name", value: user?.fullName || "—", editable: true },
                  { icon: Mail, label: "Email", value: user?.email || "—" },
                  { icon: Phone, label: "WhatsApp", value: (user as any)?.whatsapp || "Not set" },
                  { icon: Globe, label: "Country", value: (user as any)?.country || "Not set" },
                  { icon: Calendar, label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—" },
                ].map(({ icon: Icon, label, value, editable }) => (
                  <div key={label} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                    <Icon size={14} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                      {editing && editable ? (
                        <Input
                          value={form.fullName}
                          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                          className="h-8 text-sm mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground truncate mt-0.5">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Identifiers */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Account Identifiers</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {/* Member ID */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-muted-foreground font-medium">Member ID</span>
                  </div>
                  <span className="text-sm font-bold text-foreground font-mono tracking-wider">{user?.displayId ? `WX${user.displayId}` : "—"}</span>
                </div>
                {/* Referral Code */}
                <div className="flex items-center justify-between py-2 border-t border-border/30">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-muted-foreground font-medium">Referral Code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground tracking-widest">{user?.referralCode || "—"}</span>
                    <Button variant="ghost" size="sm" onClick={handleCopyCode} className="h-6 text-[11px] text-primary gap-1 px-2">
                      {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}{copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Shortcuts */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Quick Access</p>
                </div>
              </div>
              <div className="p-3">
                {[
                  { icon: Building2, label: "My Properties", href: "/portfolio", color: "text-emerald-600" },
                  { icon: TrendingUp, label: "Explore Properties", href: "/investments", color: "text-primary" },
                  { icon: Wallet, label: "Wallet", href: "/wallet", color: "text-amber-600" },
                ].map(({ icon: Icon, label, href, color }) => (
                  <Link key={label} href={href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors group">
                    <Icon size={15} className={color} />
                    <span className="text-sm font-medium text-foreground flex-1">{label}</span>
                    <ChevronRight size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditing(false)}>
            <div className="bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Edit Profile</h3>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditing(false)}>
                  <X size={14} />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
