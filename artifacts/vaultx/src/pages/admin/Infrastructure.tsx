import { useState, useEffect } from "react";
import {
  Network, Plus, Edit2, Trash2, Info, BarChart3, Activity,
  Zap, Tag, DollarSign, FileText, ChevronRight, RefreshCw,
  Check, X, Users, AlertTriangle, Calendar, Pin, Megaphone,
  Settings, Search, Eye, EyeOff, ToggleLeft, ToggleRight,
  Smartphone, Database, Clock, Hash,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatUSDT, formatDateTime, formatDate } from "@/lib/format";
import { adminApi } from "./utils";
import type { AdminSection } from "./utils";

/* ─── Shared tab type for Infrastructure sub-sections ──────────────────────── */
type InfraTab = "networks" | "about" | "statistics" | "salary" | "logs";

const INFRA_TABS: { id: InfraTab; label: string; icon: React.ElementType }[] = [
  { id: "networks", label: "Networks", icon: Network },
  { id: "about", label: "About Us", icon: Info },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "salary", label: "Referral Salary", icon: DollarSign },
  { id: "logs", label: "Reset Logs", icon: Clock },
];

export default function InfrastructureSection() {
  const [tab, setTab] = useState<InfraTab>("networks");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Infrastructure</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Networks, content, statistics, salary program, and system logs
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4">
        {INFRA_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0",
              tab === id ? "bg-primary text-white shadow-sm shadow-primary/25" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {tab === "networks" && <NetworksSection />}
      {tab === "about" && <AboutSection />}
      {tab === "statistics" && <StatisticsSection />}
      {tab === "salary" && <ReferralSalarySection />}
      {tab === "logs" && <ResetLogsSection />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   NETWORKS
   ═══════════════════════════════════════════════════════════════════════════════ */
function NetworksSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<any>(null);

  const { data: networks, isLoading } = useQuery({
    queryKey: ["admin-networks"],
    queryFn: () => adminApi("/admin/deposit-networks"),
    staleTime: 30000,
  });

  const save = useMutation({
    mutationFn: (data: any) =>
      modal?.id
        ? adminApi(`/admin/deposit-networks/${modal.id}`, "PUT", data)
        : adminApi("/admin/deposit-networks", "POST", data),
    onSuccess: () => { toast({ title: "Network saved" }); setModal(null); queryClient.invalidateQueries({ queryKey: ["admin-networks"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi(`/admin/deposit-networks/${id}`, "DELETE"),
    onSuccess: () => { toast({ title: "Network deleted" }); queryClient.invalidateQueries({ queryKey: ["admin-networks"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Deposit Networks</p>
          <p className="text-[11px] text-muted-foreground">Manage accepted payment networks and wallet addresses</p>
        </div>
        <Button size="sm" className="h-9 text-xs gap-1.5" onClick={() => setModal({ network: "", label: "", walletAddress: "", minDeposit: 10, networkFee: 1, confirmationTime: "10-30 minutes", isActive: true })}>
          <Plus size={13} />Add Network
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {(networks ?? []).map((net: any) => (
            <div key={net.id} className="v3-card-elevated p-4 animate-fade-in">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm">{net.label || net.network}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Min: {formatUSDT(net.minDeposit)} · Fee: {formatUSDT(net.networkFee)} · {net.confirmationTime}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className={cn("text-[9px]", net.isActive ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground")}>
                    {net.isActive ? "Active" : "Disabled"}
                  </Badge>
                  <button onClick={() => setModal({ ...net })} className="p-1.5 rounded-lg hover:bg-muted"><Edit2 size={13} /></button>
                  <button onClick={() => { if (confirm(`Delete "${net.label}"?`)) remove.mutate(net.id); }} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={13} className="text-red-500" /></button>
                </div>
              </div>
              <p className="text-xs font-mono text-foreground bg-muted/50 rounded-lg px-2 py-1 break-all">{net.walletAddress}</p>
            </div>
          ))}
          {!(networks ?? []).length && (
            <div className="py-12 text-center v3-card">
              <Network size={28} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No deposit networks configured</p>
            </div>
          )}
        </div>
      )}

      {/* Network Modal */}
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modal?.id ? "Edit Network" : "Add Network"}</DialogTitle></DialogHeader>
          {modal && (
            <div className="space-y-3 pt-2">
              {[
                { label: "Network Key", field: "network", placeholder: "e.g. trc20" },
                { label: "Display Label", field: "label", placeholder: "e.g. USDT (TRC20)" },
                { label: "Wallet Address", field: "walletAddress", placeholder: "TX address" },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <Label className="text-xs">{label}</Label>
                  <Input value={modal[field] ?? ""} onChange={(e) => setModal((m: any) => ({ ...m, [field]: e.target.value }))} placeholder={placeholder} className="mt-1 h-9 text-sm" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Min Deposit (USDT)</Label><Input type="number" value={modal.minDeposit ?? ""} onChange={(e) => setModal((m: any) => ({ ...m, minDeposit: parseFloat(e.target.value) || 0 }))} className="mt-1 h-9 text-sm" /></div>
                <div><Label className="text-xs">Network Fee (USDT)</Label><Input type="number" value={modal.networkFee ?? ""} onChange={(e) => setModal((m: any) => ({ ...m, networkFee: parseFloat(e.target.value) || 0 }))} className="mt-1 h-9 text-sm" /></div>
              </div>
              <div><Label className="text-xs">Confirmation Time</Label><Input value={modal.confirmationTime ?? ""} onChange={(e) => setModal((m: any) => ({ ...m, confirmationTime: e.target.value }))} placeholder="10-30 minutes" className="mt-1 h-9 text-sm" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={modal.isActive ?? true} onChange={(e) => setModal((m: any) => ({ ...m, isActive: e.target.checked }))} />Active</label>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
                <Button className="flex-1" onClick={() => save.mutate(modal)} disabled={save.isPending}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ABOUT US
   ═══════════════════════════════════════════════════════════════════════════════ */
function AboutSection() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: aboutData, isLoading } = useQuery({
    queryKey: ["admin-about"],
    queryFn: () => adminApi("/admin/about"),
    staleTime: 30000,
  });

  useEffect(() => {
    if (aboutData && typeof aboutData === "object" && !Array.isArray(aboutData)) {
      setForm(aboutData as Record<string, string>);
    } else if (Array.isArray(aboutData)) {
      const obj: Record<string, string> = {};
      for (const s of aboutData) obj[s.key] = s.value;
      setForm(obj);
    }
  }, [aboutData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi("/admin/about", "PUT", form);
      toast({ title: "About page saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-foreground">About Us Content</p>
        <p className="text-[11px] text-muted-foreground">Edit the content shown on the public About page</p>
      </div>

      {[
        { label: "Page Title", field: "about_title", placeholder: "About Wexora Global" },
        { label: "Hero Subtitle", field: "about_subtitle", placeholder: "Trusted by thousands worldwide" },
        { label: "Mission Statement", field: "about_mission", placeholder: "Our mission is...", multiline: true },
        { label: "Company Story", field: "about_story", placeholder: "Founded in...", multiline: true },
        { label: "Vision", field: "about_vision", placeholder: "Our vision is...", multiline: true },
        { label: "Contact Email", field: "about_email", placeholder: "info@wexoraglobal.com" },
        { label: "Headquarters", field: "about_headquarters", placeholder: "Dubai, UAE" },
        { label: "Founded Year", field: "about_founded", placeholder: "2024" },
      ].map(({ label, field, placeholder, multiline }) => (
        <div key={field}>
          <Label className="text-xs text-muted-foreground">{label}</Label>
          {multiline ? (
            <Textarea value={form[field] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="mt-1 text-sm min-h-[80px] resize-none" />
          ) : (
            <Input value={form[field] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="mt-1 h-9 text-sm" />
          )}
        </div>
      ))}

      <Button className="w-full h-10 text-sm font-semibold" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save About Content"}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STATISTICS
   ═══════════════════════════════════════════════════════════════════════════════ */
function StatisticsSection() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["admin-statistics"],
    queryFn: () => adminApi("/admin/statistics"),
    staleTime: 30000,
  });

  useEffect(() => {
    if (statsData && typeof statsData === "object" && !Array.isArray(statsData)) {
      setForm(statsData as Record<string, string>);
    } else if (Array.isArray(statsData)) {
      const obj: Record<string, string> = {};
      for (const s of statsData) obj[s.key] = s.value;
      setForm(obj);
    }
  }, [statsData]);

  const mode = form.stats_mode ?? "real";

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi("/admin/statistics", "PUT", form);
      toast({ title: "Statistics settings saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const STAT_FIELDS = [
    { key: "members", label: "Members", placeholder: "50000" },
    { key: "investments", label: "Active Investments", placeholder: "2500" },
    { key: "deposits", label: "Total Deposits", placeholder: "12000000" },
    { key: "withdrawals", label: "Total Withdrawals", placeholder: "8500000" },
    { key: "countries", label: "Countries", placeholder: "45" },
    { key: "completed", label: "Completed", placeholder: "15000" },
  ];

  if (isLoading) return <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-foreground">Platform Statistics Display</p>
        <p className="text-[11px] text-muted-foreground">Choose how platform statistics appear on the About page</p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: "real", label: "Real Data", desc: "Live database values", icon: Activity },
          { id: "custom", label: "Custom", desc: "Manually set values", icon: Tag },
          { id: "animated", label: "Animated", desc: "Randomised ranges", icon: Zap },
        ].map(({ id, label, desc, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setForm((f) => ({ ...f, stats_mode: id }))}
            className={cn(
              "rounded-xl p-3 text-left border transition-all",
              mode === id ? "bg-primary/10 border-primary text-primary" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            <Icon size={14} className="mb-1.5" />
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-[10px] opacity-70">{desc}</p>
          </button>
        ))}
      </div>

      {mode === "real" && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-xs text-emerald-600 font-medium">Live database values will be shown on the About page.</p>
        </div>
      )}

      {mode === "custom" && (
        <div className="v3-card p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground">Custom Values</p>
          <div className="grid grid-cols-2 gap-3">
            {STAT_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input type="number" value={form[`stats_${key}`] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [`stats_${key}`]: e.target.value }))} placeholder={placeholder} className="mt-1 h-9 text-sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "animated" && (
        <div className="v3-card p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground">Animated Ranges</p>
          <p className="text-[10px] text-muted-foreground">Values will smoothly randomise within these ranges every few seconds.</p>
          {STAT_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <p className="text-xs font-medium text-foreground mb-1.5">{label}</p>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-[10px] text-muted-foreground">Min</Label><Input type="number" value={form[`stats_anim_${key}_min`] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [`stats_anim_${key}_min`]: e.target.value }))} className="mt-0.5 h-8 text-xs" /></div>
                <div><Label className="text-[10px] text-muted-foreground">Max</Label><Input type="number" value={form[`stats_anim_${key}_max`] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [`stats_anim_${key}_max`]: e.target.value }))} className="mt-0.5 h-8 text-xs" /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button className="w-full h-10 text-sm font-semibold" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Statistics Settings"}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   REFERRAL SALARY
   ═══════════════════════════════════════════════════════════════════════════════ */
function ReferralSalarySection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [overrideModal, setOverrideModal] = useState<any | null>(null);
  const [overrideTier, setOverrideTier] = useState("");
  const [overrideSalary, setOverrideSalary] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");

  const { data: salaryData } = useQuery({
    queryKey: ["admin-salary"],
    queryFn: () => adminApi("/admin/referral-salary"),
    staleTime: 30000,
  });

  const { data: settingsData } = useQuery({
    queryKey: ["admin-salary-settings"],
    queryFn: () => adminApi("/admin/settings"),
    staleTime: 30000,
  });

  const [settingsForm, setSettingsForm] = useState({
    enabled: true,
    tier1Volume: "1500",
    tier1Amount: "100",
    tier2Volume: "3500",
    tier2Amount: "300",
  });

  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData as Record<string, string>;
    setSettingsForm({
      enabled: s.salary_program_enabled !== "false",
      tier1Volume: s.salary_tier1_volume ?? "1500",
      tier1Amount: s.salary_tier1_amount ?? "100",
      tier2Volume: s.salary_tier2_volume ?? "3500",
      tier2Amount: s.salary_tier2_amount ?? "300",
    });
  }, [settingsData]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await adminApi("/admin/referral-salary/settings", "PUT", {
        enabled: settingsForm.enabled,
        tier1Volume: settingsForm.tier1Volume,
        tier1Amount: settingsForm.tier1Amount,
        tier2Volume: settingsForm.tier2Volume,
        tier2Amount: settingsForm.tier2Amount,
      });
      toast({ title: "Salary settings saved" });
      queryClient.invalidateQueries({ queryKey: ["admin-salary"] });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const recalculate = async () => {
    setRecalculating(true);
    try {
      const r = await adminApi("/admin/referral-salary/recalculate", "POST");
      toast({ title: "Recalculation complete", description: `Updated: ${r.updated} · Paid: ${r.paid}` });
      queryClient.invalidateQueries({ queryKey: ["admin-salary"] });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message, variant: "destructive" });
    } finally {
      setRecalculating(false);
    }
  };

  const saveOverride = async () => {
    if (!overrideModal) return;
    try {
      await adminApi(`/admin/referral-salary/${overrideModal.userId}/override`, "PUT", {
        tier: overrideTier ? parseInt(overrideTier) : null,
        salary: overrideSalary || null,
        notes: overrideNotes || null,
      });
      toast({ title: "Override saved" });
      setOverrideModal(null);
      queryClient.invalidateQueries({ queryKey: ["admin-salary"] });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message, variant: "destructive" });
    }
  };

  const records: any[] = salaryData ?? [];
  const activeCount = records.filter((r) => r.isActive).length;
  const totalMonthly = records.filter((r) => r.isActive).reduce((s: number, r: any) => s + r.monthlySalary, 0);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-foreground">Referral Salary Program</p>
        <p className="text-[11px] text-muted-foreground">Manage monthly salary tiers for top referrers</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", val: activeCount, color: "text-emerald-600" },
          { label: "Monthly", val: formatUSDT(totalMonthly), color: "text-amber-600" },
          { label: "Total", val: records.length, color: "text-primary" },
        ].map(({ label, val, color }) => (
          <div key={label} className="v3-card p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={cn("font-bold text-base mt-1", color)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="v3-card-elevated p-4 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">Salary Program</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{settingsForm.enabled ? "Enabled" : "Disabled"}</span>
            <Switch checked={settingsForm.enabled} onCheckedChange={(v) => setSettingsForm((f) => ({ ...f, enabled: v }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs font-medium mb-1">Tier 1 Volume (USDT)</p><Input value={settingsForm.tier1Volume} onChange={(e) => setSettingsForm((f) => ({ ...f, tier1Volume: e.target.value }))} className="h-9 text-sm" /></div>
          <div><p className="text-xs font-medium mb-1">Tier 1 Monthly Salary</p><Input value={settingsForm.tier1Amount} onChange={(e) => setSettingsForm((f) => ({ ...f, tier1Amount: e.target.value }))} className="h-9 text-sm" /></div>
          <div><p className="text-xs font-medium mb-1">Tier 2 Volume (USDT)</p><Input value={settingsForm.tier2Volume} onChange={(e) => setSettingsForm((f) => ({ ...f, tier2Volume: e.target.value }))} className="h-9 text-sm" /></div>
          <div><p className="text-xs font-medium mb-1">Tier 2 Monthly Salary</p><Input value={settingsForm.tier2Amount} onChange={(e) => setSettingsForm((f) => ({ ...f, tier2Amount: e.target.value }))} className="h-9 text-sm" /></div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 h-9 text-xs" onClick={saveSettings} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
          <Button size="sm" variant="outline" className="flex-1 h-9 text-xs gap-1.5" onClick={recalculate} disabled={recalculating}>
            <RefreshCw size={12} className={recalculating ? "animate-spin" : ""} />
            {recalculating ? "Recalculating..." : "Recalculate All"}
          </Button>
        </div>
      </div>

      {/* Records */}
      <div className="v3-card-elevated overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-bold text-foreground">Salary Recipients</p>
        </div>
        {records.length === 0 ? (
          <div className="py-10 text-center">
            <DollarSign size={24} className="text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No salary records yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {records.map((r: any) => (
              <div key={r.userId} className="px-4 py-3 flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold", r.isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                  {r.isActive ? `T${r.currentTier}` : "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">@{r.username}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatUSDT(r.currentVolume)} vol · {r.isActive ? `${formatUSDT(r.monthlySalary)}/mo` : "Not qualified"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold">{formatUSDT(r.totalSalaryPaid)}</p>
                  <p className="text-[10px] text-muted-foreground">paid</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => { setOverrideModal(r); setOverrideTier(r.currentTier ? String(r.currentTier) : ""); setOverrideSalary(r.monthlySalary ? String(r.monthlySalary) : ""); setOverrideNotes(r.notes ?? ""); }}>Edit</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Override Modal */}
      <Dialog open={overrideModal !== null} onOpenChange={(o) => { if (!o) setOverrideModal(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Override: @{overrideModal?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Tier (1 or 2, blank to remove)</Label><Input value={overrideTier} onChange={(e) => setOverrideTier(e.target.value)} className="h-9 mt-1 text-sm" /></div>
            <div><Label className="text-xs">Monthly Salary (USDT)</Label><Input value={overrideSalary} onChange={(e) => setOverrideSalary(e.target.value)} className="h-9 mt-1 text-sm" /></div>
            <div><Label className="text-xs">Notes</Label><Input value={overrideNotes} onChange={(e) => setOverrideNotes(e.target.value)} className="h-9 mt-1 text-sm" /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setOverrideModal(null)}>Cancel</Button>
            <Button className="flex-1 h-9 text-sm" onClick={saveOverride}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PASSWORD RESET LOGS
   ═══════════════════════════════════════════════════════════════════════════════ */
function ResetLogsSection() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-reset-logs"],
    queryFn: () => adminApi("/admin/password-reset-logs"),
    staleTime: 30000,
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-foreground">Password Reset Logs</p>
        <p className="text-[11px] text-muted-foreground">Track all password reset actions on the platform</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="v3-card-elevated divide-y divide-border overflow-hidden">
          {(logs ?? []).length > 0 ? (logs as any[]).map((log: any, i: number) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">@{log.username ?? log.email ?? "Unknown"}</p>
                  <p className="text-[10px] text-muted-foreground">{log.method ?? "Admin reset"} · {formatDateTime(log.createdAt ?? log.timestamp)}</p>
                </div>
                <Badge variant="outline" className={cn("text-[9px]", log.success !== false ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50")}>
                  {log.success !== false ? "Success" : "Failed"}
                </Badge>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center">
              <Clock size={28} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No password reset logs</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
