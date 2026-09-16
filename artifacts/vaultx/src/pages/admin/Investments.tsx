import { useState, useEffect, useRef } from "react";
import {
  Search, Plus, Edit2, Trash2, Copy, ChevronUp, ChevronDown,
  BarChart3, Save, X, Upload, Image as ImageIcon, Loader2, Trash2 as TrashIcon,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatUSDT } from "@/lib/format";
import { adminApi, opportunityStatusBadge } from "./utils";

export default function InvestmentsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [planSearch, setPlanSearch] = useState("");
  const [planStatusFilter, setPlanStatusFilter] = useState("all");
  const [planCategoryFilter, setPlanCategoryFilter] = useState("all");
  const [planSortBy, setPlanSortBy] = useState("minAmount");
  const [planModal, setPlanModal] = useState<any>(null);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<number>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Analytics settings
  const [analyticsMode, setAnalyticsMode] = useState<"auto" | "real">("auto");
  const [savingAnalytics, setSavingAnalytics] = useState(false);

  // Image upload state
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/admin/property-images/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data.url;
    } catch {
      toast({ title: "Upload failed", description: "Could not upload image", variant: "destructive" });
      return null;
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const url = await uploadImage(file);
    if (url) setPlanModal((p: any) => ({ ...p, bannerImageUrl: url }));
    setCoverUploading(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) newUrls.push(url);
    }
    if (newUrls.length > 0) {
      setPlanModal((p: any) => ({ ...p, images: [...(Array.isArray(p.images) ? p.images : []), ...newUrls] }));
    }
    setGalleryUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => adminApi("/admin/plans"),
    staleTime: 30000,
  });

  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminApi("/admin/settings"),
    staleTime: 30000,
    enabled: showAnalytics,
  });

  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData as Record<string, string>;
    setAnalyticsMode(s.opportunity_analytics_mode === "real" ? "real" : "auto");
  }, [settingsData]);

  const savePlan = useMutation({
    mutationFn: (data: any) => planModal?.id ? adminApi(`/admin/plans/${planModal.id}`, "PUT", data) : adminApi("/admin/plans", "POST", data),
    onSuccess: (updatedPlan: any) => {
      toast({ title: "Property saved" });
      setPlanModal(null);
      queryClient.setQueryData(["admin-plans"], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((p: any) => p.id === updatedPlan?.id ? updatedPlan : p);
      });
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePlan = useMutation({
    mutationFn: (id: number) => adminApi(`/admin/plans/${id}`, "DELETE"),
    onSuccess: () => { toast({ title: "Property deleted" }); queryClient.invalidateQueries({ queryKey: ["admin-plans"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const duplicatePlan = useMutation({
    mutationFn: (id: number) => adminApi(`/admin/plans/${id}/duplicate`, "POST"),
    onSuccess: () => { toast({ title: "Property duplicated" }); queryClient.invalidateQueries({ queryKey: ["admin-plans"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const quickStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi(`/admin/plans/${id}`, "PUT", { status, isActive: status === "active" }),
    onSuccess: () => { toast({ title: "Status updated" }); queryClient.invalidateQueries({ queryKey: ["admin-plans"] }); },
    onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });

  const reorderPlans = useMutation({
    mutationFn: (ids: number[]) => adminApi("/admin/plans/reorder", "PUT", { ids }),
    onMutate: async (ids: number[]) => {
      await queryClient.cancelQueries({ queryKey: ["admin-plans"] });
      const prev = queryClient.getQueryData(["admin-plans"]);
      const current: any[] = queryClient.getQueryData(["admin-plans"]) ?? [];
      queryClient.setQueryData(["admin-plans"], [...current].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)));
      return { prev };
    },
    onError: (_e: any, _v: any, ctx: any) => { queryClient.setQueryData(["admin-plans"], ctx?.prev); toast({ title: "Reorder failed", variant: "destructive" }); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-plans"] }),
  });

  const saveAnalytics = async () => {
    setSavingAnalytics(true);
    try {
      await adminApi("/admin/settings", "PUT", { opportunity_analytics_mode: analyticsMode });
      toast({ title: "Analytics settings saved" });
      refetchSettings();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message, variant: "destructive" });
    } finally {
      setSavingAnalytics(false);
    }
  };

  // Filter & sort
  const filtered = ((): any[] => {
    let result: any[] = plans ?? [];
    if (planSearch.trim()) {
      const q = planSearch.toLowerCase();
      result = result.filter((p: any) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    if (planStatusFilter !== "all") result = result.filter((p: any) => (p.status ?? "active") === planStatusFilter);
    if (planCategoryFilter !== "all") result = result.filter((p: any) => p.category === planCategoryFilter);
    return [...result].sort((a: any, b: any) => {
      switch (planSortBy) {
        case "minAmount": return parseFloat(a.minAmount ?? 0) - parseFloat(b.minAmount ?? 0);
        case "name": return (a.name ?? "").localeCompare(b.name ?? "");
        case "capitalRaised": return (b.capitalRaised ?? 0) - (a.capitalRaised ?? 0);
        case "participants": return (b.totalParticipants ?? 0) - (a.totalParticipants ?? 0);
        default: return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      }
    });
  })();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Properties</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage property listings, funding, and display settings</p>
        </div>
        <Button className="h-10 text-sm gap-1.5" onClick={() => setPlanModal({ name: "", description: "", category: "", minAmount: "", maxAmount: "", minRoiRate: 0.013, maxRoiRate: 0.017, durationDays: 30, features: [], isActive: true, isFeatured: false, isPopular: false, status: "active", colorTheme: "blue", sortOrder: 0, autoCompoundAvailable: false, fundingGoal: null, currentFunding: 0, totalParticipantLimit: null, propertyType: "", location: "", images: [], fundingDeadline: null })}>
          <Plus size={15} className="mr-1" />Add
        </Button>
      </div>

      {/* Analytics Controls (collapsed) */}
      <div className="v3-card overflow-hidden">
        <button type="button" className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors" onClick={() => setShowAnalytics(!showAnalytics)}>
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-primary" />
            <p className="text-sm font-semibold text-foreground">Display Analytics Mode</p>
          </div>
          <span className="text-[10px] text-muted-foreground">{showAnalytics ? "▲ collapse" : "▼ expand"}</span>
        </button>
        {showAnalytics && (
          <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Use Real Platform Statistics</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {analyticsMode === "real" ? "Showing actual database values." : "Showing intelligent demo statistics."}
                </p>
              </div>
              <Switch checked={analyticsMode === "real"} onCheckedChange={(v) => setAnalyticsMode(v ? "real" : "auto")} />
            </div>
            <Button className="w-full h-9 text-sm" onClick={saveAnalytics} disabled={savingAnalytics}>
              {savingAnalytics ? "Saving..." : "Save Analytics Settings"}
            </Button>
          </div>
        )}
      </div>

      {/* Search / Filter */}
      <div className="v3-card p-3 space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} placeholder="Search properties..." className="w-full pl-8 pr-3 h-9 text-sm rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Select value={planStatusFilter} onValueChange={setPlanStatusFilter}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {["all", "draft", "active", "funding", "featured", "trending", "paused", "fully_allocated", "expired", "closed"].map((s) => (
                <SelectItem key={s} value={s} className="text-xs capitalize">{s === "all" ? "All Statuses" : s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={planCategoryFilter} onValueChange={setPlanCategoryFilter}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              {[...new Set((plans ?? []).map((p: any) => p.category).filter(Boolean))].map((cat: any) => (
                <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={planSortBy} onValueChange={setPlanSortBy}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="minAmount" className="text-xs">Min Amount ↑</SelectItem>
              <SelectItem value="sortOrder" className="text-xs">Sort Order</SelectItem>
              <SelectItem value="name" className="text-xs">Name A→Z</SelectItem>
              <SelectItem value="capitalRaised" className="text-xs">Capital ↓</SelectItem>
              <SelectItem value="participants" className="text-xs">Participants ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedPlanIds.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-primary mr-1">{selectedPlanIds.size} selected</span>
          {(["active", "paused", "closed"] as const).map((s) => (
            <button key={s} onClick={async () => {
              for (const id of selectedPlanIds) await adminApi(`/admin/plans/${id}`, "PUT", { status: s, isActive: s === "active" });
              queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
              setSelectedPlanIds(new Set());
              toast({ title: `${selectedPlanIds.size} set to ${s}` });
            }} className="px-2.5 py-1 rounded-lg bg-white border border-border text-[10px] font-semibold hover:bg-muted capitalize">{s === "active" ? "▶ Reopen" : s === "paused" ? "⏸ Pause" : "✕ Close"}</button>
          ))}
          <button onClick={() => setSelectedPlanIds(new Set())} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground">✕ Clear</button>
        </div>
      )}

      {/* Plan list */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((plan: any) => {
            const sb = opportunityStatusBadge(plan.status ?? (plan.isActive ? "active" : "paused"));
            const isSelected = selectedPlanIds.has(plan.id);
            const allIds: number[] = (plans ?? []).map((p: any) => p.id);
            const idx = allIds.indexOf(plan.id);
            return (
              <div key={plan.id} className={cn("v3-card-elevated p-4 animate-fade-in transition-colors", isSelected && "border-primary bg-primary/5")}>
                <div className="flex items-start gap-2">
                  <button onClick={() => { const next = new Set(selectedPlanIds); if (next.has(plan.id)) next.delete(plan.id); else next.add(plan.id); setSelectedPlanIds(next); }} className={cn("w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center", isSelected ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary")}>
                    {isSelected && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{plan.name}</p>
                      <Badge variant="outline" className={cn("text-[9px]", sb.cls)}>{sb.label}</Badge>
                      {plan.location && <Badge variant="outline" className="text-[9px] text-emerald-600 bg-emerald-50">📍 {plan.location}</Badge>}
                      {plan.propertyType && <Badge variant="outline" className="text-[9px] text-blue-600 bg-blue-50 capitalize">{plan.propertyType}</Badge>}
                      {plan.category && <Badge variant="outline" className="text-[9px] text-purple-600 bg-purple-50">{plan.category}</Badge>}
                    </div>
                    <p className="text-xs text-primary font-semibold mt-1">
                      {(plan.minRoiRate * 100).toFixed(1)}%–{(plan.maxRoiRate * 100).toFixed(1)}% daily · {plan.durationDays}d · {formatUSDT(plan.minAmount)}–{formatUSDT(plan.maxAmount)}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      {(plan.totalParticipants ?? 0) > 0 && <span>👥 {Number(plan.totalParticipants).toLocaleString()}</span>}
                      {(plan.capitalRaised ?? 0) > 0 && <span>💰 {plan.capitalRaised >= 1000 ? `$${(plan.capitalRaised / 1000).toFixed(0)}K` : `$${Number(plan.capitalRaised).toFixed(0)}`}</span>}
                      {plan.fundingPercent !== null && <span>📊 {plan.fundingPercent}%</span>}
                      {plan.fundingDeadline && <span>📅 Funding closes {new Date(plan.fundingDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 ml-2 shrink-0">
                    <button onClick={() => { const ids = [...allIds]; [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]; reorderPlans.mutate(ids); }} disabled={idx === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Move up"><ChevronUp size={14} /></button>
                    <button onClick={() => { const ids = [...allIds]; [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]; reorderPlans.mutate(ids); }} disabled={idx === allIds.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Move down"><ChevronDown size={14} /></button>
                    <button onClick={() => duplicatePlan.mutate(plan.id)} className="p-1 rounded hover:bg-muted" title="Duplicate"><Copy size={13} className="text-blue-500" /></button>
                    <button onClick={() => setPlanModal({ ...plan })} className="p-1 rounded hover:bg-muted" title="Edit"><Edit2 size={13} className="text-muted-foreground" /></button>
                    <button onClick={() => { if (confirm(`Delete "${plan.name}"?`)) deletePlan.mutate(plan.id); }} className="p-1 rounded hover:bg-red-50" title="Delete"><Trash2 size={13} className="text-red-500" /></button>
                  </div>
                </div>
                {/* Quick status */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border flex-wrap">
                  {plan.status !== "active" && <button onClick={() => quickStatus.mutate({ id: plan.id, status: "active" })} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-semibold hover:bg-emerald-100">▶ Reopen</button>}
                  {plan.status !== "paused" && <button onClick={() => quickStatus.mutate({ id: plan.id, status: "paused" })} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-semibold hover:bg-gray-200">⏸ Pause</button>}
                  {plan.status !== "closed" && <button onClick={() => { if (confirm(`Close "${plan.name}"?`)) quickStatus.mutate({ id: plan.id, status: "closed" }); }} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-semibold hover:bg-red-100">✕ Close</button>}
                  <span className="ml-auto text-[9px] text-muted-foreground">Sort: {plan.sortOrder ?? 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-muted-foreground v3-card">No properties match your filters</div>
      )}

      {/* ── PLAN EDIT MODAL ── */}
      <Dialog open={!!planModal} onOpenChange={(o) => !o && setPlanModal(null)}>
        <DialogContent className="max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{planModal?.id ? "Edit Property" : "New Property"}</DialogTitle></DialogHeader>
          {planModal && (
            <div className="space-y-3 pt-2">
              {/* ── Property Information ─────────────────── */}
              <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Property Information</p>
                <div>
                  <Label className="text-xs">Property Name *</Label>
                  <Input value={planModal.name ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, name: e.target.value }))} placeholder="e.g. Skyline Residences" className="mt-1 h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Description *</Label>
                  <Textarea value={planModal.description ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, description: e.target.value }))} className="mt-1 text-xs min-h-[60px] resize-none" placeholder="Describe the property..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Location</Label>
                    <Input value={planModal.location ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, location: e.target.value }))} placeholder="e.g. Dubai, UAE" className="mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Input value={planModal.category ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, category: e.target.value }))} placeholder="e.g. Residential" className="mt-1 h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Property Type</Label>
                  <Select value={planModal.propertyType ?? ""} onValueChange={(v) => setPlanModal((p: any) => ({ ...p, propertyType: v }))}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ── Images ──────────────────────────────────── */}
              <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Property Images</p>

                {/* Cover / Banner Image */}
                <div>
                  <Label className="text-xs mb-1.5 block">Cover Photo</Label>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  {planModal.bannerImageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-border">
                      <img src={planModal.bannerImageUrl} alt="Cover" className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" onClick={() => coverInputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-white/90 text-xs font-semibold hover:bg-white">Replace</button>
                        <button type="button" onClick={() => setPlanModal((p: any) => ({ ...p, bannerImageUrl: "" }))} className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-semibold hover:bg-red-600">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => coverInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors" disabled={coverUploading}>
                      {coverUploading ? (
                        <><Loader2 size={20} className="text-primary animate-spin" /><p className="text-xs text-muted-foreground">Uploading…</p></>
                      ) : (
                        <><Upload size={20} className="text-muted-foreground" /><p className="text-xs text-muted-foreground">Click to upload cover photo</p><p className="text-[10px] text-muted-foreground/60">JPEG, PNG, WebP · Max 10MB</p></>
                      )}
                    </button>
                  )}
                </div>

                {/* Gallery Images */}
                <div>
                  <Label className="text-xs mb-1.5 block">Gallery Images</Label>
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                  {Array.isArray(planModal.images) && planModal.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {planModal.images.map((url: string, idx: number) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                          <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setPlanModal((p: any) => ({ ...p, images: p.images.filter((_: any, i: number) => i !== idx) }))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => galleryInputRef.current?.click()} className="w-full h-16 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors" disabled={galleryUploading}>
                    {galleryUploading ? (
                      <><Loader2 size={14} className="text-primary animate-spin" /><p className="text-xs text-muted-foreground">Uploading…</p></>
                    ) : (
                      <><ImageIcon size={14} className="text-muted-foreground" /><p className="text-xs text-muted-foreground">Add gallery images</p></>
                    )}
                  </button>
                </div>

                {/* Manual URL fallback */}
                <details className="group">
                  <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">Enter URLs manually</summary>
                  <div className="mt-2 space-y-2">
                    <Input value={planModal.bannerImageUrl ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, bannerImageUrl: e.target.value }))} placeholder="Cover image URL" className="h-8 text-xs" />
                    <Textarea value={Array.isArray(planModal.images) ? planModal.images.join("\n") : ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, images: e.target.value.split("\n").filter(Boolean) }))} className="text-xs min-h-[40px] resize-none" placeholder="Gallery URLs, one per line" />
                  </div>
                </details>
              </div>

              {/* ── Funding & Investment ────────────────────── */}
              <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Funding & Investment</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Min Amount (USDT) *</Label><Input type="number" value={planModal.minAmount ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, minAmount: e.target.value === "" ? "" : parseFloat(e.target.value) }))} placeholder="100" className="mt-1 h-9 text-sm" /></div>
                  <div><Label className="text-xs">Max Amount (USDT) *</Label><Input type="number" value={planModal.maxAmount ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, maxAmount: e.target.value === "" ? "" : parseFloat(e.target.value) }))} placeholder="10000" className="mt-1 h-9 text-sm" /></div>
                </div>
                <div><Label className="text-xs">Funding Goal (USDT)</Label><Input type="number" value={planModal.fundingGoal ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, fundingGoal: e.target.value === "" ? "" : parseFloat(e.target.value) }))} placeholder="1000000" className="mt-1 h-9 text-sm" /></div>
                <div><Label className="text-xs">Funding Deadline (when new investments close)</Label><Input type="date" value={planModal.fundingDeadline ? String(planModal.fundingDeadline).slice(0, 10) : ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, fundingDeadline: e.target.value || null }))} className="mt-1 h-9 text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Duration (days) *</Label><Input type="number" value={planModal.durationDays ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, durationDays: e.target.value === "" ? "" : parseInt(e.target.value) }))} placeholder="30" className="mt-1 h-9 text-sm" /></div>
                  <div><Label className="text-xs">Max Participants</Label><Input type="number" value={planModal.totalParticipantLimit ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, totalParticipantLimit: e.target.value === "" ? "" : parseInt(e.target.value) }))} placeholder="Unlimited" className="mt-1 h-9 text-sm" /></div>
                </div>
              </div>

              {/* ── Returns ─────────────────────────────────── */}
              <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Return Configuration</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Min Daily ROI</Label><Input type="number" step="0.001" value={planModal.minRoiRate ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, minRoiRate: e.target.value === "" ? "" : parseFloat(e.target.value) }))} placeholder="0.013" className="mt-1 h-9 text-sm" /></div>
                  <div><Label className="text-xs">Max Daily ROI</Label><Input type="number" step="0.001" value={planModal.maxRoiRate ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, maxRoiRate: e.target.value === "" ? "" : parseFloat(e.target.value) }))} placeholder="0.017" className="mt-1 h-9 text-sm" /></div>
                </div>
                <div>
                  <Label className="text-xs">Features / Amenities (one per line)</Label>
                  <Textarea value={Array.isArray(planModal.features) ? planModal.features.join("\n") : ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, features: e.target.value.split("\n").filter(Boolean) }))} className="mt-1 text-xs min-h-[60px] resize-none" placeholder="Swimming pool&#10;24/7 security&#10;Parking" />
                </div>
              </div>

              {/* ── Status & Display ────────────────────────── */}
              <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status & Display</p>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={planModal.status ?? "active"} onValueChange={(v) => setPlanModal((p: any) => ({ ...p, status: v }))}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[{ val: "draft", label: "Draft" }, { val: "active", label: "Active" }, { val: "funding", label: "Funding" }, { val: "featured", label: "Featured" }, { val: "trending", label: "Trending" }, { val: "paused", label: "Paused" }, { val: "fully_allocated", label: "Fully Allocated" }, { val: "closed", label: "Closed" }].map(({ val, label }) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Sort Order</Label><Input type="number" value={planModal.sortOrder ?? ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, sortOrder: e.target.value === "" ? "" : parseInt(e.target.value) }))} placeholder="0" className="mt-1 h-9 text-sm" /></div>
                  <div className="flex flex-col justify-end">
                    <div className="space-y-2">
                      {[
                        { label: "Active", field: "isActive" },
                        { label: "Featured", field: "isFeatured" },
                        { label: "Popular", field: "isPopular" },
                      ].map(({ label, field }) => (
                        <label key={field} className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" checked={!!planModal[field]} onChange={(e) => setPlanModal((p: any) => ({ ...p, [field]: e.target.checked }))} className="w-3.5 h-3.5" />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Start Date</Label><Input type="date" value={planModal.startDate ? String(planModal.startDate).slice(0, 10) : ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, startDate: e.target.value || null }))} className="mt-1 h-9 text-sm" /></div>
                <div><Label className="text-xs">End Date</Label><Input type="date" value={planModal.endDate ? String(planModal.endDate).slice(0, 10) : ""} onChange={(e) => setPlanModal((p: any) => ({ ...p, endDate: e.target.value || null }))} className="mt-1 h-9 text-sm" /></div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setPlanModal(null)}>Cancel</Button>
                <Button className="flex-1" onClick={() => savePlan.mutate(planModal)} disabled={savePlan.isPending}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
