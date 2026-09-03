import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon, Lock, Activity, Network, Users, Bell,
  FileText, Info, MessageCircle, Phone, Globe,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { adminApi } from "./utils";

export default function SettingsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminApi("/admin/settings"),
    staleTime: 30000,
  });

  useEffect(() => {
    if (settingsData && typeof settingsData === "object" && !Array.isArray(settingsData)) {
      setForm(settingsData as Record<string, string>);
    } else if (Array.isArray(settingsData)) {
      const obj: Record<string, string> = {};
      for (const s of settingsData) obj[s.key] = s.value;
      setForm(obj);
    }
  }, [settingsData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi("/admin/settings", "PUT", form);
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({ title: "Settings saved!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (isLoading) return <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Branding, support, finance, security, and display settings</p>
      </div>

      {/* ── Branding ── */}
      <Section icon={Globe} title="Branding" color="text-primary">
        <Field label="Platform Name" value={form.platform_name} onChange={set("platform_name")} placeholder="Wexora" />
        <Field label="Platform Logo URL" value={form.platform_logo_url} onChange={set("platform_logo_url")} placeholder="https://..." />
        <Field label="Platform Website URL" value={form.platform_url} onChange={set("platform_url")} placeholder="https://wexoraglobal.com" />
      </Section>

      {/* ── Support ── */}
      <Section icon={MessageCircle} title="Support Contacts" color="text-blue-600">
        <Field label="Support Email" value={form.support_email} onChange={set("support_email")} placeholder="support@wexora.com" />
        <Field label="Telegram Support Link" value={form.support_telegram} onChange={set("support_telegram")} placeholder="https://t.me/..." />
        <Field label="Telegram Community" value={form.support_telegram_group} onChange={set("support_telegram_group")} placeholder="https://t.me/..." />
        <Field label="WhatsApp Number" value={form.support_whatsapp} onChange={set("support_whatsapp")} placeholder="+1234567890" />
        <Field label="WhatsApp Community" value={form.support_whatsapp_community} onChange={set("support_whatsapp_community")} placeholder="https://chat.whatsapp.com/..." />
      </Section>

      {/* ── Financial ── */}
      <Section icon={SettingsIcon} title="Financial Settings" color="text-emerald-600">
        <Field label="Min Deposit (USDT)" value={form.min_deposit} onChange={set("min_deposit")} placeholder="10" type="number" />
        <Field label="Min Withdrawal (USDT)" value={form.min_withdrawal} onChange={set("min_withdrawal")} placeholder="10" type="number" />
        <Field label="Withdrawal Fee (%)" value={form.withdrawal_fee_percent} onChange={set("withdrawal_fee_percent")} placeholder="1.5" type="number" />
        <Field label="Signup Bonus (USDT)" value={form.signup_bonus_amount} onChange={set("signup_bonus_amount")} placeholder="10" type="number" />
        <Field label="First Deposit Bonus (%)" value={form.first_deposit_bonus_percent} onChange={set("first_deposit_bonus_percent")} placeholder="10" type="number" />
        <Field label="App Download Link" value={form.app_download_url} onChange={set("app_download_url")} placeholder="https://..." />
        <Field label="Announcement Banner Text" value={form.announcement_text} onChange={set("announcement_text")} placeholder="" />
      </Section>

      {/* ── Security Toggles ── */}
      <Section icon={Lock} title="Security & Toggles" color="text-red-600">
        <ToggleField label="KYC Verification" description="Enable identity verification for users" checked={form.kyc_enabled === "true"} onChange={(v) => setForm((f) => ({ ...f, kyc_enabled: v ? "true" : "false" }))} />
        <ToggleField label="KYC Required for Withdrawal" description="Block withdrawals until KYC approved" checked={form.kyc_required_for_withdrawal === "true"} onChange={(v) => setForm((f) => ({ ...f, kyc_required_for_withdrawal: v ? "true" : "false" }))} />
        <ToggleField label="Maintenance Mode" description="Disable access for all non-admin users" checked={form.maintenance_mode === "true"} onChange={(v) => setForm((f) => ({ ...f, maintenance_mode: v ? "true" : "false" }))} />
        <ToggleField label="Signup Bonus" description="Credit welcome bonus on registration" checked={form.signup_bonus_enabled === "true"} onChange={(v) => setForm((f) => ({ ...f, signup_bonus_enabled: v ? "true" : "false" }))} />
        <ToggleField label="First Deposit Bonus" description="Credit bonus on first deposit" checked={form.first_deposit_bonus_enabled === "true"} onChange={(v) => setForm((f) => ({ ...f, first_deposit_bonus_enabled: v ? "true" : "false" }))} />
        {form.maintenance_mode === "true" && (
          <div className="space-y-3 pt-2 border-t border-border">
            <Field label="Maintenance Message" value={form.maintenance_message} onChange={set("maintenance_message")} placeholder="Custom message..." multiline />
            <div>
              <Label className="text-xs text-muted-foreground">Return Date & Time</Label>
              <Input type="datetime-local" value={form.maintenance_eta ? new Date(form.maintenance_eta).toISOString().slice(0, 16) : ""} onChange={(e) => setForm((f) => ({ ...f, maintenance_eta: e.target.value ? new Date(e.target.value).toISOString() : "" }))} className="mt-1 h-9 text-sm" />
            </div>
          </div>
        )}
      </Section>

      {/* ── Withdrawal 2FA ── */}
      <Section icon={Lock} title="Withdrawal Security" color="text-amber-600">
        <div>
          <Label className="text-xs text-muted-foreground">2FA Mode for Withdrawals</Label>
          <Select value={form.withdrawal_2fa_mode ?? "optional"} onValueChange={(v) => setForm((f) => ({ ...f, withdrawal_2fa_mode: v }))}>
            <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="optional">Optional — password only; 2FA verified if provided</SelectItem>
              <SelectItem value="always">Always — both withdrawal password AND 2FA required</SelectItem>
              <SelectItem value="disabled">Disabled — password only; 2FA hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* ── Referral Rates ── */}
      <Section icon={Users} title="Referral Commissions" color="text-purple-600">
        <div className="grid grid-cols-2 gap-3">
          <Field label="L1 Deposit Commission (%)" value={form.referral_l1_deposit_rate} onChange={set("referral_l1_deposit_rate")} placeholder="5" type="number" />
          <Field label="L2 Deposit Commission (%)" value={form.referral_l2_deposit_rate} onChange={set("referral_l2_deposit_rate")} placeholder="3" type="number" />
          <Field label="L3 Deposit Commission (%)" value={form.referral_l3_deposit_rate} onChange={set("referral_l3_deposit_rate")} placeholder="1" type="number" />
          <Field label="L1 ROI Commission (%)" value={form.referral_l1_roi_rate} onChange={set("referral_l1_roi_rate")} placeholder="5" type="number" />
          <Field label="L2 ROI Commission (%)" value={form.referral_l2_roi_rate} onChange={set("referral_l2_roi_rate")} placeholder="3" type="number" />
          <Field label="L3 ROI Commission (%)" value={form.referral_l3_roi_rate} onChange={set("referral_l3_roi_rate")} placeholder="1" type="number" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Community Stats Mode</Label>
          <Select value={form.referral_hybrid_mode ?? "auto"} onValueChange={(v) => setForm((f) => ({ ...f, referral_hybrid_mode: v }))}>
            <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto — hybrid demo + real</SelectItem>
              <SelectItem value="full_demo">Full Demo — always demo community data</SelectItem>
              <SelectItem value="disabled">Disabled — real data only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* ── Activity Feed ── */}
      <Section icon={Activity} title="Activity Feed" color="text-green-600">
        <ToggleField label="Real Activity Mode" description="Show real platform actions instead of simulated" checked={form.activity_feed_mode === "real"} onChange={(v) => setForm((f) => ({ ...f, activity_feed_mode: v ? "real" : "demo" }))} />
        <div className="grid grid-cols-2 gap-3">
          {["feed_enable_deposits", "feed_enable_investments", "feed_enable_withdrawals", "feed_enable_earnings", "feed_enable_referrals"].map((key) => (
            <ToggleField key={key} label={key.replace("feed_enable_", "Show ").replace(/^\w/, (c) => c.toUpperCase())} checked={form[key] !== "false"} onChange={(v) => setForm((f) => ({ ...f, [key]: v ? "true" : "false" }))} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min Amount" value={form.feed_min_amount} onChange={set("feed_min_amount")} placeholder="50" type="number" />
          <Field label="Max Amount" value={form.feed_max_amount} onChange={set("feed_max_amount")} placeholder="5000" type="number" />
          <Field label="Update Frequency (sec)" value={form.feed_frequency_seconds} onChange={set("feed_frequency_seconds")} placeholder="14" type="number" />
          <div>
            <Label className="text-xs text-muted-foreground">Username Style</Label>
            <Select value={form.feed_username_style ?? "partial"} onValueChange={(v) => setForm((f) => ({ ...f, feed_username_style: v }))}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="partial">Partial (john***)</SelectItem>
                <SelectItem value="full">Full names</SelectItem>
                <SelectItem value="anonymous">Anonymous</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* ── Instructions ── */}
      <Section icon={FileText} title="Instructions & Rules" color="text-slate-600">
        <div>
          <Label className="text-xs text-muted-foreground">Deposit Instructions (one per line)</Label>
          <Textarea value={form.deposit_instructions} onChange={set("deposit_instructions")} placeholder={"Open your wallet\nSend USDT to address\nPaste TX hash\nUpload screenshot"} className="mt-1 text-sm min-h-[80px] resize-none" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Withdrawal Rules (one per line)</Label>
          <Textarea value={form.withdrawal_instructions} onChange={set("withdrawal_instructions")} placeholder={"Reviewed within 24h\nFee applies\nProcessing takes up to 2 days"} className="mt-1 text-sm min-h-[80px] resize-none" />
        </div>
      </Section>

      {/* Save */}
      <Button className="w-full h-12 font-semibold text-sm" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
}

/* ── Helper components ── */
function Section({ icon: Icon, title, color, children }: { icon: React.ElementType; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="v3-card-elevated p-5 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50")}>
          <Icon size={15} className={color} />
        </div>
        <p className="text-sm font-bold text-foreground">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", multiline }: { label: string; value?: string; onChange: any; placeholder?: string; type?: string; multiline?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea value={value ?? ""} onChange={onChange} placeholder={placeholder} className="mt-1 text-sm min-h-[80px] resize-none" />
      ) : (
        <Input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder} className="mt-1 h-9 text-sm" />
      )}
    </div>
  );
}

function ToggleField({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
