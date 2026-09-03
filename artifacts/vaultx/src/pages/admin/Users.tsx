import { useState, useMemo } from "react";
import {
  Search, ChevronLeft, ChevronRight, ArrowUpDown, Users,
  CheckCircle2, AlertCircle, Clock, Shield, ShieldCheck,
  ShieldAlert, KeyRound, Wallet, TrendingUp, ArrowDownLeft,
  ArrowUpRight, Eye, DollarSign, Ban, UserCheck, Mail,
  Phone, Globe, Calendar, Hash, FileText,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAdminGetUsers, getAdminGetUsersQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatUSDT, formatDate, formatDateTime } from "@/lib/format";
import { adminApi } from "./utils";

/* ─── Status helpers ────────────────────────────────────────────────────── */

type FilterStatus = "all" | "verified" | "pending_kyc" | "unverified" | "suspended";

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "verified", label: "Verified" },
  { value: "pending_kyc", label: "Pending KYC" },
  { value: "unverified", label: "Unverified" },
  { value: "suspended", label: "Suspended" },
];

function matchFilter(u: any, f: FilterStatus): boolean {
  if (f === "all") return true;
  if (f === "verified") return u.kycStatus === "approved";
  if (f === "pending_kyc") return u.kycStatus === "pending";
  if (f === "unverified") return u.kycStatus === "none" || !u.emailVerified;
  if (f === "suspended") return u.isActive === false;
  return true;
}

function kycBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 gap-1"><CheckCircle2 size={10} />Approved</Badge>;
    case "pending":
      return <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 gap-1"><Clock size={10} />Pending</Badge>;
    case "rejected":
      return <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400 gap-1"><ShieldAlert size={10} />Rejected</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] text-muted-foreground">None</Badge>;
  }
}

/* ─── Main component ────────────────────────────────────────────────────── */

export default function UsersSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adjustModal, setAdjustModal] = useState<{ userId: number; username: string } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [resetPwModal, setResetPwModal] = useState<{ userId: number; username: string } | null>(null);
  const [resetNewPw, setResetNewPw] = useState("");

  /* ── Data ─────────────────────────────────────────────────────────────── */
  const { data: usersData, isLoading } = useAdminGetUsers(
    { search: search || undefined, limit: 50 },
    { query: { queryKey: getAdminGetUsersQueryKey({ search: search || undefined, limit: 50 }), staleTime: 20000 } }
  );

  const filteredUsers = useMemo(() => {
    if (!usersData?.items) return [];
    if (filter === "all") return usersData.items;
    return usersData.items.filter((u: any) => matchFilter(u, filter));
  }, [usersData, filter]);

  const stats = useMemo(() => {
    const items = usersData?.items ?? [];
    return {
      total: usersData?.total ?? items.length,
      verified: items.filter((u: any) => u.kycStatus === "approved").length,
      pendingKyc: items.filter((u: any) => u.kycStatus === "pending").length,
      suspended: items.filter((u: any) => u.isActive === false).length,
    };
  }, [usersData]);

  /* ── Mutations ────────────────────────────────────────────────────────── */
  const updateUser = useMutation({
    mutationFn: ({ id, ...data }: any) => adminApi(`/admin/users/${id}`, "PUT", data),
    onSuccess: () => {
      toast({ title: "User updated" });
      setSelectedUser(null);
      setDetail(null);
      queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey({}) });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const adjustBalance = useMutation({
    mutationFn: ({ id, data }: any) => adminApi(`/admin/users/${id}/adjust-balance`, "POST", data),
    onSuccess: () => {
      toast({ title: "Balance adjusted" });
      setAdjustModal(null);
      setAdjustAmount("");
      setAdjustReason("");
      queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey({}) });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });

  const reset2fa = useMutation({
    mutationFn: (userId: number) => adminApi(`/admin/users/${userId}/reset-2fa`, "POST"),
    onSuccess: () => toast({ title: "2FA reset" }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetUserPw = useMutation({
    mutationFn: ({ userId, password }: { userId: number; password: string }) =>
      adminApi(`/admin/users/${userId}/reset-password`, "POST", { password }),
    onSuccess: () => {
      setResetPwModal(null);
      setResetNewPw("");
      toast({ title: "Password reset" });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });

  /* ── Detail loader ────────────────────────────────────────────────────── */
  const openDetail = async (u: any) => {
    setSelectedUser(u);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await adminApi(`/admin/users/${u.id}`);
      setDetail(d);
    } catch { /* empty */ }
    finally { setDetailLoading(false); }
  };

  const closeDetail = () => { setSelectedUser(null); setDetail(null); };

  /* ════════════════════════════════════════════════════════════════════════
     DETAIL WORKSPACE (full-screen inline when user is selected)
     ════════════════════════════════════════════════════════════════════════ */

  if (selectedUser) {
    const u = selectedUser;
    const d = detail;
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={closeDetail} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{u.fullName}</h1>
            <p className="text-xs text-muted-foreground">@{u.username} · #{u.displayId}</p>
          </div>
          {kycBadge(u.kycStatus)}
        </div>

        {/* User Header Card */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
              {u.fullName?.charAt(0) ?? "U"}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h2 className="text-base font-bold text-foreground">{u.fullName}</h2>
                <p className="text-sm text-muted-foreground">@{u.username}</p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Mail size={12} />{u.email}</span>
                {u.whatsapp && <span className="flex items-center gap-1"><Phone size={12} />{u.whatsapp}</span>}
                {u.country && <span className="flex items-center gap-1"><Globe size={12} />{u.country}</span>}
                <span className="flex items-center gap-1"><Calendar size={12} />Joined {formatDate(u.createdAt)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {kycBadge(u.kycStatus)}
                <Badge variant="outline" className={cn("text-[10px]", u.emailVerified ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-amber-600 bg-amber-50 border-amber-200")}>
                  {u.emailVerified ? "Email Verified" : "Email Unverified"}
                </Badge>
                <Badge variant="outline" className={cn("text-[10px]", u.twoFaEnabled ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-slate-400")}>
                  2FA {u.twoFaEnabled ? "On" : "Off"}
                </Badge>
                <Badge variant="outline" className={cn("text-[10px]", u.isActive ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-red-600 bg-red-50 border-red-200")}>
                  {u.isActive ? "Active" : "Suspended"}
                </Badge>
                {u.isAdmin && <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50 border-amber-200">Admin</Badge>}
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex sm:flex-col gap-2 shrink-0">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={() => { setAdjustModal({ userId: u.id, username: u.username }); }}>
                <DollarSign size={12} />Adjust
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={() => reset2fa.mutate(u.id)}>
                <KeyRound size={12} />2FA
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1 text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => { setResetPwModal({ userId: u.id, username: u.username }); }}>
                <KeyRound size={12} />Pw
              </Button>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account Overview</h3>
          {detailLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : d ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: "Available Balance", value: formatUSDT(d.balance), icon: Wallet, color: "text-primary", bg: "bg-primary/5" },
                { label: "Total Deposited", value: formatUSDT(d.totalDeposited), icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-500/5" },
                { label: "Total Withdrawn", value: formatUSDT(d.totalWithdrawn), icon: ArrowUpRight, color: "text-red-500", bg: "bg-red-500/5" },
                { label: "Total Invested", value: formatUSDT(d.activeInvestmentsValue ?? 0), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-500/5" },
                { label: "Total Earned", value: formatUSDT(d.totalEarnings ?? 0), icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/5" },
                { label: "Referrals", value: String(d.referralCount ?? 0), icon: UserCheck, color: "text-purple-500", bg: "bg-purple-500/5" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={cn("border border-border rounded-xl p-3.5", bg)}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className={color} />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
                  </div>
                  <p className={cn("text-base font-bold", color)}>{value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Active Investments */}
        {d?.investments?.filter((i: any) => i.status === "active").length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Property Investments</h3>
            <div className="space-y-2">
              {d.investments.filter((i: any) => i.status === "active").map((inv: any) => (
                <div key={inv.id} className="bg-card border border-emerald-500/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp size={16} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{inv.planName}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                      {inv.startDate && <span>Started {formatDate(inv.startDate)}</span>}
                      {inv.endDate && <span>Matures {formatDate(inv.endDate)}</span>}
                      {inv.durationDays && <span>{inv.durationDays} days</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase">Invested</p>
                      <p className="text-sm font-bold text-foreground">{formatUSDT(inv.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase">Earned</p>
                      <p className="text-sm font-bold text-emerald-600">{formatUSDT(inv.totalEarned)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Controls */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account Controls</h3>
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50">
            {[
              { label: "Account Active", desc: "Allow login and platform access", key: "isActive" },
              { label: "Admin Access", desc: "Administrative privileges", key: "isAdmin" },
              { label: "Lock Withdrawals", desc: "Prevent withdrawal requests", key: "withdrawalLocked" },
              { label: "Lock Transfers", desc: "Prevent wallet transfers", key: "transferLocked" },
              { label: "Lock WhatsApp", desc: "Prevent WhatsApp changes", key: "whatsappLocked" },
            ].map(({ label, desc, key }) => (
              <label key={key} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedUser[key] ?? false}
                    onChange={(e) => setSelectedUser({ ...selectedUser, [key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 rounded-full bg-muted peer-checked:bg-primary/80 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" className="flex-1" onClick={closeDetail}>Cancel</Button>
            <Button className="flex-1" onClick={() => updateUser.mutate(selectedUser)} disabled={updateUser.isPending}>Save Changes</Button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     LIST VIEW
     ════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage EstateFund accounts, verification status, and investment activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-primary" },
          { label: "Verified", value: stats.verified, icon: ShieldCheck, color: "text-emerald-600" },
          { label: "Pending KYC", value: stats.pendingKyc, icon: Clock, color: "text-amber-500" },
          { label: "Suspended", value: stats.suspended, icon: Ban, color: "text-red-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={14} className={color} />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
            </div>
            <p className={cn("text-lg font-bold", color)}>{isLoading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or member ID..."
            className="pl-10 h-11"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0",
                filter === opt.value
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No users found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5">User</th>
                  <th className="text-left px-4 py-2.5 hidden md:table-cell">Member ID</th>
                  <th className="text-left px-4 py-2.5 hidden lg:table-cell">Balance</th>
                  <th className="text-left px-4 py-2.5">KYC</th>
                  <th className="text-right px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} onClick={() => openDetail(u)} className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {u.fullName?.charAt(0) ?? "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{u.fullName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">@{u.username} · {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-mono text-muted-foreground">#{u.displayId}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-medium">{formatUSDT(u.balance)}</span>
                    </td>
                    <td className="px-4 py-3">{kycBadge(u.kycStatus)}</td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight size={14} className="text-muted-foreground/40" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2">
            {filteredUsers.map((u: any) => (
              <button
                key={u.id}
                onClick={() => openDetail(u)}
                className="w-full bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {u.fullName?.charAt(0) ?? "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground truncate">{u.fullName}</p>
                      {kycBadge(u.kycStatus)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">@{u.username} · #{u.displayId}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                      <span className="text-xs font-medium">{formatUSDT(u.balance)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── ADJUST BALANCE MODAL ── */}
      <Dialog open={!!adjustModal} onOpenChange={(o) => !o && setAdjustModal(null)}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Adjust Balance — @{adjustModal?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-sm">Amount (positive = credit, negative = deduct)</Label>
              <Input value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} type="number" placeholder="e.g. 100 or -50" className="mt-1.5 h-10" />
            </div>
            <div>
              <Label className="text-sm">Reason</Label>
              <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Admin bonus, correction..." className="mt-1.5 h-10" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAdjustModal(null)}>Cancel</Button>
              <Button className="flex-1" onClick={() => {
                if (!adjustModal) return;
                adjustBalance.mutate({ id: adjustModal.userId, data: { amount: parseFloat(adjustAmount), reason: adjustReason } });
              }} disabled={adjustBalance.isPending || !adjustAmount || !adjustReason}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── RESET PASSWORD MODAL ── */}
      <Dialog open={!!resetPwModal} onOpenChange={(o) => { if (!o) { setResetPwModal(null); setResetNewPw(""); } }}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Reset Password — @{resetPwModal?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-sm">New Password</Label>
              <Input type="password" value={resetNewPw} onChange={(e) => setResetNewPw(e.target.value)} placeholder="Min. 6 characters" className="mt-1.5 h-10" />
            </div>
            <p className="text-xs text-muted-foreground">The user will be notified. This action is logged.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setResetPwModal(null); setResetNewPw(""); }}>Cancel</Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600" onClick={() => resetPwModal && resetUserPw.mutate({ userId: resetPwModal.userId, password: resetNewPw })} disabled={resetUserPw.isPending || resetNewPw.length < 6}>
                {resetUserPw.isPending ? "Resetting..." : "Set New Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
