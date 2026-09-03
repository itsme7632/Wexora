import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download, Smartphone, RefreshCw, Calendar, HardDrive, Tag,
  CheckCircle2, XCircle, ArrowUpCircle, Bell, Shield, Info,
  AlertTriangle, Zap, Globe, Star, Lock, ArrowLeft,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const VERSION_KEY = "wexora-installed-version";

interface AppInfo {
  appName: string; version: string; size: string; lastUpdated: string;
  releaseNotes: string; changelog: string; forceUpdateEnabled: boolean;
  primaryUrl: string; mirrorUrl: string; backupUrl: string;
  githubUrl: string; mediafireUrl: string; gdriveUrl: string; telegramUrl: string;
  primaryCount: number; mirrorCount: number; backupCount: number;
  githubCount: number; mediafireCount: number; gdriveCount: number; telegramCount: number;
}

type SourceKey = "primary" | "mirror" | "backup" | "github" | "mediafire" | "gdrive" | "telegram";

interface SourceConfig {
  key: SourceKey; label: string; sub: string; urlKey: keyof AppInfo; countKey: keyof AppInfo;
  gradient: string; accentColor: string; letter: string;
}

const SOURCES: SourceConfig[] = [
  { key: "primary", label: "Download APK", sub: "Primary server", urlKey: "primaryUrl", countKey: "primaryCount", gradient: "from-blue-600 to-indigo-700", accentColor: "#2563eb", letter: "P" },
  { key: "mirror", label: "Mirror Download", sub: "Mirror server", urlKey: "mirrorUrl", countKey: "mirrorCount", gradient: "from-violet-500 to-purple-700", accentColor: "#8b5cf6", letter: "M" },
  { key: "backup", label: "Backup Download", sub: "Backup server", urlKey: "backupUrl", countKey: "backupCount", gradient: "from-emerald-500 to-teal-600", accentColor: "#10b981", letter: "B" },
  { key: "github", label: "GitHub Releases", sub: "github.com", urlKey: "githubUrl", countKey: "githubCount", gradient: "from-gray-600 to-gray-800", accentColor: "#6b7280", letter: "G" },
  { key: "mediafire", label: "MediaFire", sub: "mediafire.com", urlKey: "mediafireUrl", countKey: "mediafireCount", gradient: "from-rose-500 to-red-600", accentColor: "#ef4444", letter: "M" },
  { key: "gdrive", label: "Google Drive", sub: "drive.google.com", urlKey: "gdriveUrl", countKey: "gdriveCount", gradient: "from-blue-500 to-cyan-600", accentColor: "#0ea5e9", letter: "D" },
  { key: "telegram", label: "Telegram Channel", sub: "t.me", urlKey: "telegramUrl", countKey: "telegramCount", gradient: "from-[#0088cc] to-[#006ba3]", accentColor: "#0088cc", letter: "T" },
];

function ForceUpdateScreen({ appInfo, activeSources, onDownload, downloading }: {
  appInfo: AppInfo; activeSources: SourceConfig[];
  onDownload: (key: SourceKey, url: string) => void; downloading: SourceKey | null;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mb-5">
        <AlertTriangle size={36} className="text-amber-500" />
      </div>
      <h1 className="text-2xl font-black text-foreground mb-2">Update Required</h1>
      <p className="text-muted-foreground text-sm mb-1">Wexora <span className="font-bold text-amber-500">v{appInfo.version}</span> is now available.</p>
      <p className="text-muted-foreground text-xs mb-8">Please update the app to continue using Wexora.</p>
      <div className="w-full max-w-sm space-y-3">
        {activeSources.map(({ key, label, urlKey, gradient }) => {
          const url = appInfo[urlKey] as string;
          return (
            <button key={key} onClick={() => onDownload(key, url)} disabled={!!downloading}
              className={cn("w-full h-13 px-4 py-3.5 rounded-2xl bg-gradient-to-r text-white font-semibold text-sm flex items-center justify-center gap-2", gradient, "hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60")}>
              {downloading === key ? <><RefreshCw size={15} className="animate-spin" /> Opening…</> : <><Download size={15} /> {label}</>}
            </button>
          );
        })}
        {activeSources.length === 0 && (
          <div className="bg-muted/50 rounded-2xl p-6 text-center">
            <Smartphone size={28} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No download links configured. Please contact support.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DownloadAppPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState<SourceKey | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);

  useEffect(() => { try { setInstalledVersion(localStorage.getItem(VERSION_KEY)); } catch {} }, []);

  const { data: appInfo, isLoading } = useQuery<AppInfo>({
    queryKey: ["app-info"],
    queryFn: () => fetch("/api/app-info", { credentials: "include" }).then((r) => r.json()),
    staleTime: 30000, retry: 1,
  });

  const activeSources = SOURCES.filter((s) => !!(appInfo?.[s.urlKey] as string));
  const latestVersion = appInfo?.version ?? "";
  const hasInstalledBefore = !!installedVersion;
  const isUpdateAvailable = hasInstalledBefore && latestVersion && installedVersion !== latestVersion;
  const isUpToDate = hasInstalledBefore && latestVersion && installedVersion === latestVersion;
  const isForceUpdate = !!(appInfo?.forceUpdateEnabled) && isUpdateAvailable;

  const handleDownload = async (key: SourceKey, url: string) => {
    if (downloading || !url) return;
    setDownloading(key);
    try { await fetch(`/api/app-info/download/${key}`, { method: "POST", credentials: "include" }); queryClient.invalidateQueries({ queryKey: ["app-info"] }); } catch {}
    if (latestVersion) { try { localStorage.setItem(VERSION_KEY, latestVersion); } catch {} setInstalledVersion(latestVersion); }
    window.open(url, "_blank", "noopener,noreferrer");
    toast({ title: "Download Started", description: "Your download has opened. Enable 'Install from Unknown Sources' before installing." });
    setTimeout(() => setDownloading(null), 2000);
  };

  if (isLoading) {
    return (<AppLayout title="Download App"><div className="px-4 pt-5 pb-24 space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />)}</div></AppLayout>);
  }

  if (isForceUpdate) {
    return <ForceUpdateScreen appInfo={appInfo!} activeSources={activeSources} onDownload={handleDownload} downloading={downloading} />;
  }

  return (
    <AppLayout title="Download App">
      <div className="pb-24">

        {/* ── Full-Width App Hero ── */}
        <div className="v3-gradient relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative px-4 pt-8 pb-10 lg:px-12 lg:pt-14 lg:pb-16 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-5">
              <img src="/wx-logo.png" alt="Wexora" className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl shadow-xl object-cover border border-white/20" />
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-white">{appInfo?.appName ?? "Wexora"}</h1>
                <p className="text-emerald-300/60 text-sm mt-0.5">Crypto Investment Platform</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {appInfo?.version && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                  <Tag size={11} className="text-white/50" />
                  <span className="text-xs font-semibold text-white">v{appInfo.version}</span>
                </div>
              )}
              {appInfo?.size && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                  <HardDrive size={11} className="text-white/50" />
                  <span className="text-xs font-semibold text-white">{appInfo.size}</span>
                </div>
              )}
              {appInfo?.lastUpdated && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                  <Calendar size={11} className="text-white/50" />
                  <span className="text-xs font-semibold text-white">{new Date(appInfo.lastUpdated).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 max-w-6xl mx-auto pt-6 space-y-6">

          {/* ── Version Status ── */}
          {latestVersion && (
            isUpdateAvailable ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex gap-4 items-start animate-fade-in">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <ArrowUpCircle size={22} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-foreground">New Update Available</p>
                    <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">NEW</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Current: <span className="font-semibold text-foreground">v{installedVersion}</span></span>
                    <span>Latest: <span className="font-semibold text-amber-500">v{latestVersion}</span></span>
                  </div>
                </div>
              </div>
            ) : isUpToDate ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex gap-4 items-center animate-fade-in">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0"><CheckCircle2 size={22} className="text-emerald-500" /></div>
                <div><p className="text-sm font-bold text-foreground">You are using the latest version</p><p className="text-xs text-muted-foreground mt-0.5">Wexora v{installedVersion} is up to date.</p></div>
              </div>
            ) : (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 flex gap-4 items-center animate-fade-in">
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0"><Zap size={22} className="text-primary" /></div>
                <div><p className="text-sm font-bold text-foreground">Latest Version: v{latestVersion}</p><p className="text-xs text-muted-foreground mt-0.5">Download now to get the latest features.</p></div>
              </div>
            )
          )}

          {/* ── 2-Column Desktop: Downloads + Info ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Download Sources */}
            <div className="lg:col-span-3 space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Download Options</p>
              {activeSources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeSources.map(({ key, label, sub, urlKey, countKey, gradient, letter }) => {
                    const url = appInfo![urlKey] as string;
                    const count = appInfo![countKey] as number;
                    return (
                      <div key={key} className="v3-card-elevated p-4 hover:shadow-md transition-shadow animate-fade-in">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm shrink-0", gradient)}>
                            <span className="text-white font-black text-base">{letter}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground">{label}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground">· {sub}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                            <Download size={9} className="inline mr-0.5" />{(count ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <Button className={cn("w-full h-11 font-semibold gap-2 text-sm bg-gradient-to-r border-0 text-white", gradient, "hover:opacity-90")}
                          onClick={() => handleDownload(key, url)} disabled={!!downloading}>
                          {downloading === key ? <><RefreshCw size={15} className="animate-spin" /> Opening…</> : <><Download size={15} /> {label}</>}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="v3-card p-8 text-center">
                  <Smartphone size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-semibold text-foreground">No Download Source Available</p>
                  <p className="text-xs text-muted-foreground mt-1">No download links have been configured yet.</p>
                </div>
              )}
            </div>

            {/* App Info Sidebar */}
            <div className="lg:col-span-2 space-y-4">

              {/* App Information */}
              {(appInfo?.version || appInfo?.size || appInfo?.lastUpdated) && (
                <div className="v3-card-elevated overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">App Information</p>
                  </div>
                  {[
                    appInfo?.appName && ["App Name", appInfo.appName],
                    appInfo?.version && ["Latest Version", `v${appInfo.version}`],
                    appInfo?.size && ["File Size", appInfo.size],
                    appInfo?.lastUpdated && ["Release Date", new Date(appInfo.lastUpdated).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
                    installedVersion && ["Installed Version", `v${installedVersion}`],
                  ].filter((x): x is [string, string] => Boolean(x)).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* What's New */}
              {appInfo?.releaseNotes && (
                <div className="v3-card p-5 animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell size={14} className="text-primary" />
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide">What's New</p>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{appInfo.releaseNotes}</p>
                </div>
              )}

              {/* Changelog */}
              {appInfo?.changelog && (
                <div className="v3-card p-5 animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={14} className="text-muted-foreground" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Changelog</p>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{appInfo.changelog}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Features Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: "Bank-Grade Security", desc: "256-bit encryption, biometric login, and secure session management.", color: "text-emerald-600", bg: "bg-emerald-500/10" },
              { icon: Zap, title: "Instant Updates", desc: "Real-time portfolio tracking, live market data, and instant notifications.", color: "text-amber-600", bg: "bg-amber-500/10" },
              { icon: Star, title: "Premium Experience", desc: "Intuitive design, smooth animations, and professional-grade interface.", color: "text-primary", bg: "bg-primary/10" },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="v3-card p-5 hover:shadow-md transition-shadow animate-fade-in">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bg)}>
                  <Icon size={18} className={color} />
                </div>
                <p className="text-sm font-bold text-foreground mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* ── Installation Guide ── */}
          <div className="v3-card-elevated p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-amber-500" />
              <p className="text-sm font-bold text-foreground">Installation Guide</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                "Download the APK file from any source above.",
                "Open your device Settings → Security.",
                'Enable "Install from Unknown Sources" or "Allow from this source".',
                "Open the downloaded APK file and tap Install.",
                "Launch Wexora and sign in to your account.",
              ].map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/50 mt-4">Android only · iOS not supported</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
