import { useState } from "react";
import {
  ArrowUpRight, ArrowDownLeft, Check, X, Search, Send,
  MessageSquare, RefreshCw, Clock, ChevronRight, Eye,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAdminGetWithdrawals, getAdminGetWithdrawalsQueryKey,
  useAdminRejectWithdrawal,
  type AdminGetWithdrawalsStatus,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatUSDT, formatDateTime } from "@/lib/format";
import { adminApi } from "./utils";
import type { AdminSection } from "./utils";

interface FinanceProps {
  subTab: "deposits" | "withdrawals" | "tickets" | "broadcast";
  onSubTabChange: (tab: "deposits" | "withdrawals" | "tickets" | "broadcast") => void;
}

const SUB_TABS = [
  { id: "deposits" as const, label: "Deposits", icon: ArrowDownLeft },
  { id: "withdrawals" as const, label: "Withdrawals", icon: ArrowUpRight },
  { id: "tickets" as const, label: "Tickets", icon: MessageSquare },
  { id: "broadcast" as const, label: "Broadcast", icon: Send },
];

export default function FinanceSection({ subTab, onSubTabChange }: FinanceProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectModal, setRejectModal] = useState<{ type: "wd" | "dep"; id: number } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [proofModal, setProofModal] = useState<string | null>(null);
  const [wdTxHash, setWdTxHash] = useState("");
  const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", type: "announcement" as string });

  // ── Withdrawals ──
  const [wdFilter, setWdFilter] = useState<AdminGetWithdrawalsStatus>("pending");
  const { data: wdData, isLoading: wdLoading } = useAdminGetWithdrawals(
    { status: wdFilter },
    { query: { queryKey: getAdminGetWithdrawalsQueryKey({ status: wdFilter }), staleTime: 20000 } }
  );
  const approveWd = useMutation({
    mutationFn: ({ id, txHash }: { id: number; txHash: string }) =>
      adminApi(`/admin/withdrawals/${id}/approve`, "POST", { txHash: txHash || null }),
    onSuccess: () => {
      setWdTxHash("");
      queryClient.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey({ status: wdFilter }) });
      toast({ title: "Withdrawal approved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });
  const rejectWd = useAdminRejectWithdrawal();

  // ── Deposits ──
  const [depFilter, setDepFilter] = useState<"pending" | "completed" | "failed">("pending");
  const { data: depData, isLoading: depLoading } = useQuery({
    queryKey: ["admin-deposits", depFilter],
    queryFn: () => adminApi(`/admin/deposits?status=${depFilter}`),
    staleTime: 20000,
  });
  const approveDep = useMutation({
    mutationFn: (id: number) => adminApi(`/admin/deposits/${id}/approve`, "POST"),
    onSuccess: () => { toast({ title: "Deposit approved" }); queryClient.invalidateQueries({ queryKey: ["admin-deposits"] }); },
    onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });
  const rejectDep = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi(`/admin/deposits/${id}/reject`, "POST", { reason }),
    onSuccess: () => { toast({ title: "Deposit rejected" }); setRejectModal(null); setRejectReason(""); queryClient.invalidateQueries({ queryKey: ["admin-deposits"] }); },
    onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });

  // ── Tickets ──
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "answered" | "closed">("all");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const { data: ticketsData } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: () => adminApi("/support/tickets"),
    staleTime: 15000,
  });
  const { data: ticketDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-ticket-detail", selectedTicketId],
    queryFn: () => adminApi(`/support/tickets/${selectedTicketId}`),
    enabled: selectedTicketId !== null,
    refetchInterval: 15000,
  });
  const sendTicketReply = useMutation({
    mutationFn: (message: string) => adminApi(`/support/tickets/${selectedTicketId}/reply`, "POST", { message }),
    onSuccess: () => { setTicketReply(""); queryClient.invalidateQueries({ queryKey: ["admin-ticket-detail", selectedTicketId] }); queryClient.invalidateQueries({ queryKey: ["admin-tickets"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const closeTicket = useMutation({
    mutationFn: (id: number) => adminApi(`/support/tickets/${id}/close`, "POST"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-ticket-detail", selectedTicketId] }); queryClient.invalidateQueries({ queryKey: ["admin-tickets"] }); toast({ title: "Ticket closed" }); },
  });
  const reopenTicket = useMutation({
    mutationFn: (id: number) => adminApi(`/support/tickets/${id}/reopen`, "POST"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-ticket-detail", selectedTicketId] }); queryClient.invalidateQueries({ queryKey: ["admin-tickets"] }); toast({ title: "Ticket reopened" }); },
  });

  // ── Broadcast ──
  const broadcast = useMutation({
    mutationFn: (data: any) => adminApi("/admin/notifications/broadcast", "POST", data),
    onSuccess: (r: any) => { toast({ title: "Broadcast sent!", description: `Sent to ${r.sentTo} users` }); setBroadcastForm({ title: "", message: "", type: "announcement" }); },
    onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
  });

  const handleReject = () => {
    if (!rejectModal) return;
    if (rejectModal.type === "wd") {
      rejectWd.mutate({ id: rejectModal.id, data: { reason: rejectReason } }, { onSuccess: () => { setRejectModal(null); setRejectReason(""); queryClient.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey({ status: wdFilter }) }); } });
    } else {
      rejectDep.mutate({ id: rejectModal.id, reason: rejectReason });
    }
  };

  // ── Ticket detail view ──
  if (subTab === "tickets" && selectedTicketId !== null) {
    return (
      <div className="space-y-5">
        <button onClick={() => setSelectedTicketId(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">← Back to tickets</button>
        {detailLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : (
          <div className="v3-card-elevated overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{ticketDetail?.subject}</p>
                <p className="text-[10px] text-muted-foreground">#{ticketDetail?.id} · {ticketDetail?.status}</p>
              </div>
              {ticketDetail?.status !== "closed" ? (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => closeTicket.mutate(selectedTicketId)}>Close</Button>
              ) : (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => reopenTicket.mutate(selectedTicketId)}><RefreshCw size={10} className="mr-1" />Reopen</Button>
              )}
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-4 py-3 space-y-3">
              {ticketDetail?.messages?.map((msg: any) => (
                <div key={msg.id} className={cn("flex", msg.isAdmin ? "justify-start" : "justify-end")}>
                  <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-xs", msg.isAdmin ? "bg-primary text-white rounded-tl-sm" : "bg-muted text-foreground rounded-tr-sm border border-border")}>
                    <p className={cn("text-[9px] font-semibold mb-0.5", msg.isAdmin ? "text-white/70" : "text-muted-foreground")}>{msg.isAdmin ? "Support" : "User"}</p>
                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
            {ticketDetail?.status !== "closed" && (
              <div className="px-4 py-3 border-t border-border">
                <div className="flex gap-2">
                  <Input value={ticketReply} onChange={(e) => setTicketReply(e.target.value)} placeholder="Reply..." className="flex-1 h-9 text-sm" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && ticketReply.trim()) sendTicketReply.mutate(ticketReply.trim()); }} />
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => ticketReply.trim() && sendTicketReply.mutate(ticketReply.trim())} disabled={sendTicketReply.isPending || !ticketReply.trim()}><Send size={13} /></Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Finance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Deposits, withdrawals, support tickets, and broadcasts</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4">
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSubTabChange(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0",
              subTab === id ? "bg-primary text-white shadow-sm shadow-primary/25" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {/* ── WITHDRAWALS ── */}
      {subTab === "withdrawals" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["pending", "completed", "failed"] as AdminGetWithdrawalsStatus[]).map((s) => (
              <button key={s} onClick={() => setWdFilter(s)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all", wdFilter === s ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{s}</button>
            ))}
          </div>
          {wdLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
          ) : (
            <div className="space-y-3">
              {wdData?.map((wd: any) => (
                <div key={wd.id} className="v3-card-elevated p-4 animate-fade-in">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">@{wd.username} <span className="text-muted-foreground font-normal text-xs">#{wd.displayId}</span></p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(wd.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatUSDT(wd.amount)}</p>
                      {wd.fee > 0 && <p className="text-[10px] text-muted-foreground">Fee: {formatUSDT(wd.fee)}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">{wd.network}</p>
                  <p className="text-xs font-mono text-foreground break-all bg-muted/50 rounded-lg px-2 py-1 mb-2">{wd.address}</p>
                  {wd.status === "pending" && (
                    <div className="space-y-2">
                      <Input value={wdTxHash} onChange={(e) => setWdTxHash(e.target.value)} placeholder="TX hash (optional)" className="h-8 text-xs font-mono" />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 h-8 bg-emerald-500 hover:bg-emerald-600 text-xs" onClick={() => approveWd.mutate({ id: wd.id, txHash: wdTxHash })}><Check size={13} className="mr-1" />Approve</Button>
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-red-300 text-red-600 hover:bg-red-50" onClick={() => { setRejectModal({ type: "wd", id: wd.id }); setRejectReason(""); }}><X size={13} className="mr-1" />Reject</Button>
                      </div>
                    </div>
                  )}
                  {wd.status !== "pending" && <Badge variant="outline" className={cn("text-xs capitalize", wd.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>{wd.status}</Badge>}
                </div>
              ))}
              {!wdData?.length && <div className="py-8 text-center text-sm text-muted-foreground v3-card">No {wdFilter} withdrawals</div>}
            </div>
          )}
        </div>
      )}

      {/* ── DEPOSITS ── */}
      {subTab === "deposits" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["pending", "completed", "failed"] as const).map((s) => (
              <button key={s} onClick={() => setDepFilter(s)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all", depFilter === s ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{s}</button>
            ))}
          </div>
          {depLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
          ) : (
            <div className="space-y-3">
              {(depData ?? []).map((dep: any) => (
                <div key={dep.id} className="v3-card-elevated p-4 animate-fade-in">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">@{dep.username} <span className="text-muted-foreground font-normal text-xs">#{dep.displayId}</span></p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(dep.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatUSDT(dep.amount)}</p>
                      <Badge variant="outline" className={cn("text-[9px] mt-1", dep.status === "completed" ? "bg-emerald-50 text-emerald-600" : dep.status === "failed" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}>{dep.status}</Badge>
                    </div>
                  </div>
                  {dep.network && <p className="text-xs text-muted-foreground mb-1">Network: <span className="font-medium text-foreground">{dep.network}</span></p>}
                  {dep.txHash && <p className="text-xs font-mono text-muted-foreground break-all bg-muted/50 rounded px-2 py-1 mb-2">TX: {dep.txHash}</p>}
                  {dep.proofImageUrl && (
                    <button onClick={() => setProofModal(dep.proofImageUrl)} className="block mb-2">
                      <img src={dep.proofImageUrl} alt="Proof" className="rounded-xl max-h-28 border border-border object-contain" />
                      <p className="text-[10px] text-primary mt-1">Tap to enlarge</p>
                    </button>
                  )}
                  {!dep.proofImageUrl && <p className="text-[10px] text-muted-foreground mb-2 italic">No proof image</p>}
                  {dep.status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="flex-1 h-8 bg-emerald-500 hover:bg-emerald-600 text-xs" onClick={() => approveDep.mutate(dep.id)} disabled={approveDep.isPending}><Check size={13} className="mr-1" />Approve</Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-red-300 text-red-600 hover:bg-red-50" onClick={() => { setRejectModal({ type: "dep", id: dep.id }); setRejectReason(""); }}><X size={13} className="mr-1" />Reject</Button>
                    </div>
                  )}
                </div>
              ))}
              {!(depData ?? []).length && <div className="py-8 text-center text-sm text-muted-foreground v3-card">No {depFilter} deposits</div>}
            </div>
          )}
        </div>
      )}

      {/* ── TICKETS ── */}
      {subTab === "tickets" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {(["all", "open", "answered", "closed"] as const).map((f) => {
                const tickets: any[] = ticketsData ?? [];
                const counts = { all: tickets.length, open: tickets.filter((t) => t.status === "open").length, answered: tickets.filter((t) => t.status === "answered").length, closed: tickets.filter((t) => t.status === "closed").length };
                return (
                  <button key={f} onClick={() => setTicketFilter(f)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border", ticketFilter === f ? "bg-primary text-white border-primary" : "bg-muted/30 text-muted-foreground border-border")}>
                    {f} {counts[f] > 0 && <span className="ml-0.5 opacity-70">({counts[f]})</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {(() => {
            const tickets: any[] = ticketsData ?? [];
            const filtered = ticketFilter === "all" ? tickets : tickets.filter((t) => t.status === ticketFilter);
            return filtered.length > 0 ? (
              <div className="v3-card-elevated divide-y divide-border/50 overflow-hidden">
                {filtered.map((ticket: any) => (
                  <button key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors text-left">
                    <Badge variant="outline" className={cn("text-[9px] capitalize shrink-0", ticket.status === "open" ? "bg-primary/10 text-primary border-primary/20" : ticket.status === "answered" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border")}>{ticket.status}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                      <p className="text-[10px] text-muted-foreground">@{ticket.username ?? "user"} · #{ticket.id}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground v3-card">No {ticketFilter === "all" ? "" : ticketFilter} tickets</div>
            );
          })()}
        </div>
      )}

      {/* ── BROADCAST ── */}
      {subTab === "broadcast" && (
        <div className="v3-card-elevated p-5 space-y-4 animate-fade-in">
          <p className="text-sm font-bold text-foreground">Send Broadcast Notification</p>
          <div>
            <Label className="text-xs">Type</Label>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {["announcement", "security", "earning", "transaction", "referral"].map((t) => (
                <button key={t} onClick={() => setBroadcastForm((f) => ({ ...f, type: t }))} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all", broadcastForm.type === t ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={broadcastForm.title} onChange={(e) => setBroadcastForm((f) => ({ ...f, title: e.target.value }))} className="mt-1.5 h-10" placeholder="Notification title" />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea value={broadcastForm.message} onChange={(e) => setBroadcastForm((f) => ({ ...f, message: e.target.value }))} className="mt-1.5 min-h-[100px] resize-none" placeholder="Message content..." />
          </div>
          <Button className="w-full h-11 text-sm font-semibold" onClick={() => broadcast.mutate(broadcastForm)} disabled={broadcast.isPending || !broadcastForm.title || !broadcastForm.message}>
            {broadcast.isPending ? "Sending..." : "Send to All Users"}
          </Button>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      <Dialog open={!!rejectModal} onOpenChange={(o) => !o && setRejectModal(null)}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Reject {rejectModal?.type === "wd" ? "Withdrawal" : "Deposit"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-sm">Reason</Label>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why..." className="mt-1.5 resize-none" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleReject} disabled={rejectWd.isPending || rejectDep.isPending}>Confirm Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PROOF MODAL ── */}
      <Dialog open={!!proofModal} onOpenChange={(o) => !o && setProofModal(null)}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Payment Proof</DialogTitle></DialogHeader>
          {proofModal && <img src={proofModal} alt="Proof" className="w-full rounded-xl border border-border" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
