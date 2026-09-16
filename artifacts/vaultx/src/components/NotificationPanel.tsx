import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell, CheckCheck, X, Inbox, TrendingUp, ArrowDownLeft, ArrowUpRight,
  ArrowLeftRight, Users, ShieldAlert, Megaphone, Landmark, Receipt,
  Wrench, PartyPopper, AlertTriangle, MessageSquare,
} from "lucide-react";
import {
  useGetNotifications, getGetNotificationsQueryKey,
  useMarkNotificationRead, useMarkAllNotificationsRead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TypeCfg = { icon: typeof Bell; color: string; bg: string };

const TYPE_CONFIG: Record<string, TypeCfg> = {
  deposit: { icon: ArrowDownLeft, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  withdrawal: { icon: ArrowUpRight, color: "text-blue-500", bg: "bg-blue-500/10" },
  earning: { icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
  referral: { icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
  investment: { icon: Landmark, color: "text-primary", bg: "bg-primary/10" },
  security: { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
  announcement: { icon: Megaphone, color: "text-primary", bg: "bg-primary/10" },
  community_announcement: { icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/10" },
  transfer: { icon: ArrowLeftRight, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  transaction: { icon: Receipt, color: "text-sky-500", bg: "bg-sky-500/10" },
  maintenance: { icon: Wrench, color: "text-orange-500", bg: "bg-orange-500/10" },
  admin_adjustment: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  info: { icon: PartyPopper, color: "text-primary", bg: "bg-primary/10" },
};

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading } = useGetNotifications({
    query: {
      queryKey: getGetNotificationsQueryKey(),
      staleTime: 15000,
      refetchInterval: 30000,
      enabled: open,
    },
  });

  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items: any[] = data?.items ?? [];
  const unreadCount: number = data?.unreadCount ?? 0;
  const displayItems = items.slice(0, 20);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  const handleMarkRead = useCallback((id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }),
    });
  }, [markRead, queryClient]);

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      },
    });
  };

  const handleViewAll = () => {
    onClose();
    navigate("/notifications");
  };

  return (
    <>
      {/* Trigger button ref */}
      <button ref={buttonRef} className="hidden" />

      {open && (
        <div
          ref={panelRef}
          className="fixed top-14 right-2 sm:right-4 z-50 w-[calc(100vw-16px)] sm:w-[380px] max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={markAll.isPending}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-3/4 rounded" />
                      <Skeleton className="h-2.5 w-full rounded" />
                      <Skeleton className="h-2 w-1/3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayItems.length === 0 ? (
              <div className="py-12 text-center">
                <Inbox size={28} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground mt-1">You're all caught up.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {displayItems.map((n: any) => {
                  const cfg = TYPE_CONFIG[n.type] ?? { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
                  const Icon = cfg.icon;
                  const isUnread = !n.isRead;

                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (isUnread) handleMarkRead(n.id);
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors",
                        isUnread && "bg-primary/[0.02]"
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                        <Icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[13px] leading-snug", isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {displayItems.length > 0 && (
            <div className="border-t border-border/50 px-4 py-2.5">
              <button
                onClick={handleViewAll}
                className="w-full text-center text-xs font-semibold text-primary hover:text-primary/80 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
