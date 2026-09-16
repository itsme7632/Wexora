import { useState } from "react";
import {
  Newspaper, MessageSquare, Megaphone, Plus, Edit2, Trash2,
  Search, Check, X, Eye, EyeOff, Pin, Calendar, Settings,
  ChevronRight,
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
import { adminApi } from "./utils";

const FAQ_CATEGORIES = ["General", "Account", "Deposits", "Withdrawals", "Opportunities", "Referrals", "Security", "Other"];

interface ContentProps {
  subTab: "news" | "faq" | "announcements";
  onSubTabChange: (tab: "news" | "faq" | "announcements") => void;
}

export default function ContentSection({ subTab, onSubTabChange }: ContentProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Content</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage news posts, FAQs, and announcement popups</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4">
        {[
          { id: "news" as const, label: "News", icon: Newspaper },
          { id: "faq" as const, label: "FAQ", icon: MessageSquare },
          { id: "announcements" as const, label: "Announcements", icon: Megaphone },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onSubTabChange(id)} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0", subTab === id ? "bg-primary text-white shadow-sm shadow-primary/25" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {subTab === "news" && <NewsSection />}
      {subTab === "faq" && <FaqSection />}
      {subTab === "announcements" && <AnnouncementsSection />}
    </div>
  );
}

/* ── NEWS ── */
function NewsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<any>(null);

  const { data: posts, isLoading } = useQuery({ queryKey: ["admin-news"], queryFn: () => adminApi("/admin/news"), staleTime: 30000 });

  const save = useMutation({
    mutationFn: (data: any) => modal?.id ? adminApi(`/admin/news/${modal.id}`, "PUT", data) : adminApi("/admin/news", "POST", data),
    onSuccess: () => { toast({ title: "Post saved" }); setModal(null); queryClient.invalidateQueries({ queryKey: ["admin-news"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => adminApi(`/admin/news/${id}`, "DELETE"),
    onSuccess: () => { toast({ title: "Post deleted" }); queryClient.invalidateQueries({ queryKey: ["admin-news"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button className="h-9 text-xs gap-1.5" onClick={() => setModal({ title: "", content: "", excerpt: "", category: "announcement", isPublished: false, isFeatured: false })}><Plus size={13} />New Post</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <div className="v3-card-elevated divide-y divide-border/50 overflow-hidden">
          {posts?.length ? posts.map((post: any) => (
            <div key={post.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{post.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.excerpt}</p>
                <div className="flex gap-1.5 mt-1.5">
                  <Badge variant="outline" className="text-[9px] capitalize">{post.category}</Badge>
                  <Badge variant="outline" className={cn("text-[9px]", post.isPublished ? "text-emerald-600 bg-emerald-50" : "")}>{post.isPublished ? "Published" : "Draft"}</Badge>
                  {post.isFeatured && <Badge variant="outline" className="text-[9px] text-amber-600 bg-amber-50">Featured</Badge>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setModal({ ...post })} className="p-2 rounded-lg hover:bg-muted"><Edit2 size={14} /></button>
                <button onClick={() => { if (confirm("Delete this post?")) remove.mutate(post.id); }} className="p-2 rounded-lg hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
              </div>
            </div>
          )) : <div className="py-8 text-center text-sm text-muted-foreground">No news posts yet</div>}
        </div>
      )}

      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{modal?.id ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
          {modal && (
            <div className="space-y-3 pt-2">
              <div><Label className="text-xs">Title</Label><Input value={modal.title} onChange={(e) => setModal((n: any) => ({ ...n, title: e.target.value }))} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Excerpt</Label><Input value={modal.excerpt} onChange={(e) => setModal((n: any) => ({ ...n, excerpt: e.target.value }))} className="mt-1 h-9 text-sm" placeholder="Short summary" /></div>
              <div><Label className="text-xs">Content</Label><Textarea value={modal.content} onChange={(e) => setModal((n: any) => ({ ...n, content: e.target.value }))} className="mt-1 text-sm min-h-[120px] resize-none" /></div>
              <div><Label className="text-xs">Category</Label>
                <Select value={modal.category} onValueChange={(v) => setModal((n: any) => ({ ...n, category: v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{["announcement", "investment", "security", "market"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={modal.isPublished} onChange={(e) => setModal((n: any) => ({ ...n, isPublished: e.target.checked }))} />Published</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={modal.isFeatured} onChange={(e) => setModal((n: any) => ({ ...n, isFeatured: e.target.checked }))} />Featured</label>
              <div className="flex gap-2">
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

/* ── FAQ ── */
function FaqSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "General", isActive: true, sortOrder: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: faqs = [], isLoading } = useQuery<any[]>({ queryKey: ["admin-faqs"], queryFn: () => adminApi("/admin/faqs"), staleTime: 15000 });

  const save = useMutation({
    mutationFn: (data: typeof form) => editing ? adminApi(`/admin/faqs/${editing.id}`, "PUT", data) : adminApi("/admin/faqs", "POST", data),
    onSuccess: () => { toast({ title: editing ? "FAQ updated" : "FAQ created" }); setDialogOpen(false); setEditing(null); setForm({ question: "", answer: "", category: "General", isActive: true, sortOrder: faqs.length }); queryClient.invalidateQueries({ queryKey: ["admin-faqs"] }); },
    onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });
  const toggle = useMutation({ mutationFn: (id: number) => adminApi(`/admin/faqs/${id}/toggle`, "PATCH"), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-faqs"] }) });
  const remove = useMutation({ mutationFn: (id: number) => adminApi(`/admin/faqs/${id}`, "DELETE"), onSuccess: () => { toast({ title: "FAQ deleted" }); setDeleteId(null); queryClient.invalidateQueries({ queryKey: ["admin-faqs"] }); } });

  const filtered = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id).filter((f) => {
    if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
    if (search && !f.question.toLowerCase().includes(search.toLowerCase()) && !f.answer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{faqs.length} total · {faqs.filter((f) => f.isActive).length} active</p>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => { setEditing(null); setForm({ question: "", answer: "", category: "General", isActive: true, sortOrder: faqs.length }); setDialogOpen(true); }}><Plus size={13} />Add FAQ</Button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search FAQs..." className="pl-7 h-8 text-xs" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{FAQ_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {isLoading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div> : filtered.length > 0 ? (
        <div className="v3-card-elevated divide-y divide-border/50 overflow-hidden">
          {filtered.map((faq) => (
            <div key={faq.id} className="px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <Badge variant="outline" className={cn("text-[9px]", faq.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-zinc-100 text-zinc-500 border-zinc-200")}>{faq.isActive ? "Active" : "Inactive"}</Badge>
                    <Badge variant="outline" className="text-[9px] text-primary bg-primary/10 border-primary/20">{faq.category}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-1">{faq.question}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggle.mutate(faq.id)} className={cn("p-1.5 rounded-lg hover:bg-muted", faq.isActive ? "text-emerald-500" : "text-zinc-400")} title={faq.isActive ? "Disable" : "Enable"}>{faq.isActive ? <Check size={12} /> : <X size={12} />}</button>
                  <button onClick={() => { setEditing(faq); setForm({ question: faq.question, answer: faq.answer, category: faq.category, isActive: faq.isActive, sortOrder: faq.sortOrder }); setDialogOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={12} /></button>
                  <button onClick={() => setDeleteId(faq.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="py-10 text-center text-sm text-muted-foreground v3-card">No FAQs found</div>}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); setForm({ question: "", answer: "", category: "General", isActive: true, sortOrder: 0 }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div><Label className="text-xs">Question *</Label><Input value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} className="mt-1 h-9 text-sm" /></div>
            <div><Label className="text-xs">Answer *</Label><Textarea value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} className="mt-1 text-sm min-h-[100px] resize-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label><Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}><SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{FAQ_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Sort Order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))} className="mt-1 h-9 text-sm" /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} /><Label className="text-xs cursor-pointer">{form.isActive ? "Active" : "Inactive"}</Label></div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 h-9 text-sm" onClick={() => save.mutate(form)} disabled={save.isPending || !form.question.trim() || !form.answer.trim()}>{save.isPending ? "Saving..." : editing ? "Save" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Delete FAQ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 h-9 text-sm" onClick={() => deleteId !== null && remove.mutate(deleteId)} disabled={remove.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── ANNOUNCEMENTS ── */
function AnnouncementsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "", isActive: false, priority: 0, showToNewUsers: true, showToExistingUsers: true, isPinned: false, scheduledAt: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["admin-announcements"], queryFn: () => adminApi("/admin/announcements"), staleTime: 10000 });

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => editing ? adminApi(`/admin/announcements/${editing.id}`, "PUT", data) : adminApi("/admin/announcements", "POST", data),
    onSuccess: () => { toast({ title: editing ? "Updated" : "Created" }); setDialogOpen(false); setEditing(null); setForm({ title: "", content: "", isActive: false, priority: 0, showToNewUsers: true, showToExistingUsers: true, isPinned: false, scheduledAt: "" }); queryClient.invalidateQueries({ queryKey: ["admin-announcements"] }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });
  const toggleMutation = useMutation({ mutationFn: (id: number) => adminApi(`/admin/announcements/${id}/toggle`, "PATCH"), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-announcements"] }) });
  const deleteMutation = useMutation({ mutationFn: (id: number) => adminApi(`/admin/announcements/${id}`, "DELETE"), onSuccess: () => { toast({ title: "Deleted" }); setDeleteId(null); queryClient.invalidateQueries({ queryKey: ["admin-announcements"] }); } });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => { setEditing(null); setForm({ title: "", content: "", isActive: false, priority: 0, showToNewUsers: true, showToExistingUsers: true, isPinned: false, scheduledAt: "" }); setDialogOpen(true); }}><Plus size={12} />New</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className={cn("v3-card-elevated p-4 animate-fade-in", item.isActive ? "border-emerald-200" : "", item.isPinned && "ring-1 ring-primary/30")}>
              <div className="flex items-start gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", item.isActive ? "bg-emerald-50" : "bg-muted")}>
                  <Megaphone size={15} className={item.isActive ? "text-emerald-600" : "text-muted-foreground"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-foreground">{item.title}</span>
                    {item.isPinned && <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20"><Pin size={8} className="mr-0.5" />Pinned</Badge>}
                    <Badge variant="outline" className={cn("text-[10px]", item.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border")}>{item.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                    <span>{item.showToNewUsers && item.showToExistingUsers ? "All users" : item.showToNewUsers ? "New only" : item.showToExistingUsers ? "Existing only" : "Hidden"}</span>
                    <span>Priority: {item.priority}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditing(item); setForm({ title: item.title, content: item.content, isActive: item.isActive, priority: item.priority, showToNewUsers: item.showToNewUsers, showToExistingUsers: item.showToExistingUsers, isPinned: item.isPinned, scheduledAt: item.scheduledAt ? item.scheduledAt.slice(0, 16) : "" }); setDialogOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={13} /></button>
                  <button onClick={() => toggleMutation.mutate(item.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">{item.isActive ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                  <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center v3-card">
          <Megaphone size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">No announcements yet</p>
          <Button size="sm" className="mt-3 h-8 text-xs" onClick={() => setDialogOpen(true)}>Create First</Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Announcement" : "Create Announcement"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div><Label className="text-xs font-semibold mb-1.5 block">Title *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-9 text-sm" /></div>
            <div><Label className="text-xs font-semibold mb-1.5 block">Content *</Label><Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="text-sm min-h-[160px] resize-y" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Priority</Label><Input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))} className="mt-1 h-9 text-sm" /></div>
              <div><Label className="text-xs">Schedule</Label><Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} className="mt-1 h-9 text-sm" /></div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 space-y-2.5">
              {([
                { key: "isActive" as const, label: "Active (show to users)" },
                { key: "isPinned" as const, label: "Pinned (highest priority)" },
                { key: "showToNewUsers" as const, label: "Show to new users" },
                { key: "showToExistingUsers" as const, label: "Show to existing users" },
              ]).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <Switch checked={Boolean(form[key])} onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: v }))} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 h-9 text-sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.title.trim() || !form.content.trim()}>{saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Delete?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 h-9 text-sm" onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
