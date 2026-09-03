import { useState, useRef, useCallback } from "react";
import { MessageCircle, Plus, ChevronRight, Send, Clock, CheckCircle, XCircle,
  RefreshCw, Users, Headphones, ImageIcon, Download, X, TicketIcon,
  HelpCircle, Search, ArrowLeft, FileText, ShieldCheck, Zap, Wallet } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { SubPageLayout } from "@/components/SubPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { Link, useParams } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-primary/10 text-primary border-primary/20",
  answered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};
const STATUS_ICONS: Record<string, React.ElementType> = {
  open: Clock, answered: CheckCircle, closed: XCircle,
};

async function apiCall(url: string, method = "GET", body?: any) {
  const res = await fetch(url, {
    method, credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).message ?? "Request failed");
  return res.json();
}

async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) { reject(new Error("Image must be under 5MB")); return; }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { reject(new Error("Only JPG, PNG, WEBP allowed")); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        const res = await fetch("/api/support/upload-image", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mimeType: file.type }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
        const { url } = await res.json();
        resolve(url);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

// ─── Ticket Chat Page ──────────────────────────────────────────────────────────
export function SupportTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["support-ticket", id],
    queryFn: () => apiCall(`/api/support/tickets/${id}`),
    enabled: !!id,
    refetchInterval: 15000,
  });

  const sendReply = useMutation({
    mutationFn: ({ message, imageUrl }: { message: string; imageUrl?: string }) =>
      apiCall(`/api/support/tickets/${id}/reply`, "POST", { message, imageUrl }),
    onSuccess: () => {
      setReply(""); setPendingImage(null);
      queryClient.invalidateQueries({ queryKey: ["support-ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeTicket = useMutation({
    mutationFn: () => apiCall(`/api/support/tickets/${id}/close`, "POST"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["support-ticket", id] }); queryClient.invalidateQueries({ queryKey: ["support-tickets"] }); toast({ title: "Ticket closed" }); },
  });

  const reopenTicket = useMutation({
    mutationFn: () => apiCall(`/api/support/tickets/${id}/reopen`, "POST"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["support-ticket", id] }); queryClient.invalidateQueries({ queryKey: ["support-tickets"] }); toast({ title: "Ticket reopened" }); },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: "Max 5MB", variant: "destructive" }); return; }
    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [toast]);

  const handleSend = async () => {
    if (sendReply.isPending || uploading) return;
    if (!reply.trim() && !pendingImage) return;
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (pendingImage) { imageUrl = await uploadImage(pendingImage.file); }
      sendReply.mutate({ message: reply.trim(), imageUrl });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  if (isLoading) {
    return (
      <SubPageLayout title="Support Ticket">
        <div className="px-4 pt-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </SubPageLayout>
    );
  }

  return (
    <SubPageLayout title={ticket?.subject ?? "Support Ticket"}>
      <div className="flex flex-col" style={{ height: "calc(100dvh - 56px)" }}>
        {/* Ticket header */}
        <div className="px-4 pt-3 pb-2.5 border-b border-border bg-card/80">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground flex-1 truncate">{ticket?.subject}</p>
            <Badge className={cn("text-[10px] border capitalize shrink-0", STATUS_COLORS[ticket?.status ?? "open"])}>{ticket?.status}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Ticket #{ticket?.id} · {formatDateTime(ticket?.createdAt)}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {ticket?.messages?.map((msg: any) => (
            <div key={msg.id} className={cn("flex", msg.isAdmin ? "justify-start" : "justify-end")}>
              <div className={cn("max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm",
                msg.isAdmin ? "bg-card border border-border text-foreground rounded-tl-sm" : "bg-primary text-white rounded-tr-sm")}>
                {msg.isAdmin && <p className="text-[10px] font-bold text-primary mb-1">Support Team</p>}
                {msg.imageUrl && (
                  <div className="mb-1.5 rounded-xl overflow-hidden border border-white/20">
                    <img src={msg.imageUrl} alt="Attachment" className="max-w-full max-h-60 object-contain cursor-pointer" onClick={() => window.open(msg.imageUrl, "_blank")} />
                    <a href={msg.imageUrl} download className={cn("flex items-center gap-1 text-[10px] px-2 py-1.5", msg.isAdmin ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white")}>
                      <Download size={10} /> Download
                    </a>
                  </div>
                )}
                {msg.message && <p className="leading-relaxed break-words">{msg.message}</p>}
                <p className={cn("text-[10px] mt-1", msg.isAdmin ? "text-muted-foreground" : "text-white/60")}>{formatDateTime(msg.createdAt)}</p>
              </div>
            </div>
          ))}
          {!ticket?.messages?.length && <div className="text-center py-8 text-sm text-muted-foreground">No messages yet</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply bar */}
        {ticket?.status !== "closed" ? (
          <div className="px-4 py-3 border-t border-border bg-card">
            {pendingImage && (
              <div className="mb-2 relative inline-block">
                <img src={pendingImage.previewUrl} alt="preview" className="h-16 w-16 object-cover rounded-xl border border-border" />
                <button onClick={() => setPendingImage(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                  <X size={10} className="text-white" />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center shrink-0 hover:bg-muted transition-colors">
                <ImageIcon size={15} className="text-muted-foreground" />
              </button>
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a message…" className="flex-1 h-9"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend}
                disabled={sendReply.isPending || uploading || (!reply.trim() && !pendingImage)}>
                {uploading || sendReply.isPending
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Send size={14} />}
              </Button>
            </div>
            <button onClick={() => closeTicket.mutate()} className="text-[10px] text-muted-foreground mt-2 hover:text-foreground transition-colors">
              Close this ticket
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-border bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground mb-2">This ticket is closed</p>
            <button onClick={() => reopenTicket.mutate()} className="text-xs font-semibold text-primary flex items-center gap-1 mx-auto hover:underline">
              <RefreshCw size={11} /> Reopen ticket
            </button>
          </div>
        )}
      </div>
    </SubPageLayout>
  );
}

// ─── Support Main Page ─────────────────────────────────────────────────────────
export default function SupportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => apiCall("/api/support/tickets"),
    staleTime: 30000,
  });

  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => fetch("/api/settings/public", { credentials: "include" }).then(r => r.json()),
    staleTime: 60000,
  });

  const createTicket = useMutation({
    mutationFn: (data: { subject: string; message: string }) => apiCall("/api/support/tickets", "POST", data),
    onSuccess: (t: any) => {
      toast({ title: "Ticket Created", description: `Ticket #${t.id} submitted. We'll respond within 24 hours.` });
      setShowNew(false); setSubject(""); setMessage("");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const tgSupport = settings?.support_telegram?.trim() || null;
  const waNumber = settings?.support_whatsapp?.trim()?.replace(/\D/g, "") || null;
  const waCommunity = settings?.support_whatsapp_community?.trim() || null;
  const tgGroup = settings?.support_telegram_group?.trim() || null;

  const contactActions = [
    { icon: TicketIcon, label: "Open Ticket", sub: "Submit a request", onClick: () => setShowNew(true), color: "bg-primary/10 text-primary border-primary/20" },
    ...(tgSupport ? [{ icon: Headphones, label: "Live Chat", sub: "Telegram support", href: tgSupport, color: "bg-[#0088cc]/10 text-[#0088cc] border-[#0088cc]/20" }] : []),
    ...(waNumber ? [{ icon: MessageCircle, label: "WhatsApp", sub: "Direct support", href: `https://wa.me/${waNumber}`, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" }] : []),
    ...(tgSupport ? [{ icon: MessageCircle, label: "Telegram", sub: "Support channel", href: tgSupport, color: "bg-[#0088cc]/10 text-[#0088cc] border-[#0088cc]/20" }] : []),
    ...(waCommunity ? [{ icon: Users, label: "WA Community", sub: "Join group", href: waCommunity, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" }] : []),
    ...(tgGroup ? [{ icon: Users, label: "TG Community", sub: "Join group", href: tgGroup, color: "bg-[#0088cc]/10 text-[#0088cc] border-[#0088cc]/20" }] : []),
  ];

  const FAQ = [
    { q: "How long do withdrawals take?", a: "Processed within 24 hours after admin approval." },
    { q: "What is the minimum deposit?", a: "Minimum deposit varies by network. TRC20 minimum is 10 USDT." },
    { q: "How are ROI distributions calculated?", a: "Daily distributions are based on your invested amount and the opportunity's daily ROI rate." },
    { q: "How do I enable 2FA?", a: "Go to Settings → Security → Enable 2FA and scan the QR code with Google Authenticator." },
  ];

  const filteredTickets = (tickets ?? []).filter((t: any) =>
    !searchQuery || t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || String(t.id).includes(searchQuery)
  );

  return (
    <AppLayout title="Support Center">
      <div className="px-4 pt-5 pb-24 max-w-6xl mx-auto space-y-5">

        <button onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> <span>Back</span>
        </button>

        {/* ── Support Hero ── */}
        <div className="v3-gradient rounded-2xl p-6 lg:p-8 relative overflow-hidden animate-fade-in">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Headphones size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg lg:text-xl text-white leading-tight">Support Center</h2>
                <p className="text-white/50 text-xs">We're here to help you</p>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-lg">
              Browse our quick help section, open a support ticket, or reach us directly through your preferred channel.
            </p>
          </div>
        </div>

        {/* ── Quick Help Categories ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Wallet, label: "Deposits", desc: "Fund your account", color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { icon: FileText, label: "Withdrawals", desc: "Cash out funds", color: "text-blue-600", bg: "bg-blue-500/10" },
            { icon: ShieldCheck, label: "Security", desc: "Account protection", color: "text-purple-600", bg: "bg-purple-500/10" },
            { icon: Zap, label: "Investments", desc: "Plans & returns", color: "text-amber-600", bg: "bg-amber-500/10" },
          ].map(({ icon: Icon, label, desc, color, bg }) => (
            <div key={label} className="v3-card-elevated p-4 text-center hover:shadow-md transition-shadow animate-fade-in cursor-default">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2", bg)}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-sm font-bold text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* ── 2-Column Desktop Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: Tickets + New Ticket Form */}
          <div className="lg:col-span-3 space-y-4">

            {/* Contact Grid */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Contact Us</p>
              <div className="grid grid-cols-3 gap-2.5">
                {contactActions.map((action, i) => {
                  const Icon = action.icon;
                  const inner = (
                    <div className={cn("flex flex-col items-center gap-2 rounded-2xl border p-4 text-center active:scale-[0.96] transition-transform cursor-pointer", action.color)}>
                      <div className="w-9 h-9 rounded-xl bg-white/20 dark:bg-black/10 flex items-center justify-center">
                        <Icon size={17} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold leading-tight">{action.label}</p>
                        <p className="text-[10px] opacity-70 leading-tight mt-0.5">{action.sub}</p>
                      </div>
                    </div>
                  );
                  if (action.onClick) return <button key={i} onClick={action.onClick} className="text-left">{inner}</button>;
                  return <a key={i} href={action.href} target="_blank" rel="noopener noreferrer">{inner}</a>;
                })}
              </div>
            </div>

            {/* Search Tickets */}
            {(tickets?.length ?? 0) > 0 && (
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets…" className="pl-10 h-10" />
              </div>
            )}

            {/* New Ticket Form */}
            {showNew ? (
              <div className="v3-card-elevated p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus size={15} className="text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">New Support Ticket</h3>
                  </div>
                  <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Describe your issue briefly" className="mt-1.5 h-10" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Provide details about your issue…" className="mt-1.5 min-h-[100px] resize-none" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-10" onClick={() => setShowNew(false)}>Cancel</Button>
                  <Button className="flex-1 h-10" onClick={() => createTicket.mutate({ subject, message })} disabled={createTicket.isPending || !subject || !message}>
                    {createTicket.isPending ? "Sending…" : "Submit Ticket"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="w-full h-12 text-sm font-semibold gap-2" onClick={() => setShowNew(true)}>
                <Plus size={16} /> New Support Ticket
              </Button>
            )}

            {/* Tickets List */}
            {isLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : filteredTickets.length > 0 ? (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                  My Tickets {filteredTickets.length > 0 && <span className="text-primary">({filteredTickets.length})</span>}
                </p>
                <div className="v3-card-elevated divide-y divide-border/50 overflow-hidden animate-fade-in">
                  {filteredTickets.map((ticket: any) => {
                    const StatusIcon = STATUS_ICONS[ticket.status] ?? Clock;
                    return (
                      <Link key={ticket.id} href={`/support/${ticket.id}`}>
                        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors cursor-pointer">
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 border", STATUS_COLORS[ticket.status])}>
                            <StatusIcon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                            <p className="text-[10px] text-muted-foreground">#{ticket.id} · {formatDateTime(ticket.updatedAt)}</p>
                          </div>
                          <Badge className={cn("text-[9px] border capitalize shrink-0", STATUS_COLORS[ticket.status])}>{ticket.status}</Badge>
                          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="v3-card py-12 text-center">
                <TicketIcon size={28} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No tickets yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create a support ticket to get help</p>
              </div>
            )}
          </div>

          {/* Right: FAQ Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <div className="v3-card-elevated p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={14} className="text-primary" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Quick FAQ</p>
              </div>
              <div className="space-y-0">
                {FAQ.map((faq, i) => (
                  <div key={i} className="py-3.5 border-b border-border/50 last:border-0">
                    <p className="text-sm font-medium text-foreground mb-1.5">{faq.q}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-emerald-600" />
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Response Time</p>
              </div>
              <p className="text-sm text-foreground font-bold">{"<"} 24 hours</p>
              <p className="text-xs text-muted-foreground mt-1">Our team typically responds within one business day.</p>
            </div>

            {/* Security Notice */}
            <div className="v3-card p-4 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={14} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground mb-0.5">Support Policy</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Our team will never ask for your password, private keys, or 2FA codes. Always verify you're communicating through official Wexora channels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
