import { useState } from "react";
import { Newspaper, Search, Calendar, Tag, ChevronRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { Link, useParams } from "wouter";

const CATEGORIES = ["all", "announcement", "investment", "security", "market"];
const CATEGORY_COLORS: Record<string, string> = {
  announcement: "bg-primary/10 text-primary", investment: "bg-emerald-500/10 text-emerald-600",
  security: "bg-amber-500/10 text-amber-600", market: "bg-violet-500/10 text-violet-600",
};

async function fetchNews(category?: string, search?: string) {
  const params = new URLSearchParams({ limit: "50" });
  if (category && category !== "all") params.set("category", category);
  const res = await fetch(`/api/news?${params}`, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  if (search) return data.filter((p: any) => p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase()));
  return data;
}

export function NewsArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading } = useQuery({ queryKey: ["news", id], queryFn: async () => { const res = await fetch(`/api/news/${id}`, { credentials: "include" }); if (!res.ok) throw new Error("Not found"); return res.json(); }, enabled: !!id });

  if (isLoading) return <AppLayout fullBleed><div className="max-w-2xl mx-auto px-4 py-5 space-y-4"><Skeleton className="h-7 w-3/4" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-40 rounded-xl" /></div></AppLayout>;
  if (!post) return <AppLayout fullBleed><div className="max-w-2xl mx-auto px-4 py-12 text-center"><p className="text-muted-foreground">Article not found</p><Link href="/news" className="text-primary text-sm mt-2 inline-block">← Back to News</Link></div></AppLayout>;

  return (
    <AppLayout fullBleed>
      <div className="max-w-2xl mx-auto px-4 py-5 lg:px-8 pb-24">
        <Link href="/news" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 hover:text-foreground transition-colors"><ArrowLeft size={14} /> Back to News</Link>
        <div className="space-y-4 animate-fade-in">
          <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", CATEGORY_COLORS[post.category] ?? "bg-muted text-muted-foreground")}>{post.category}</span>
          <h1 className="text-xl font-bold text-foreground leading-tight">{post.title}</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar size={12} /> {formatDateTime(post.publishedAt ?? post.createdAt)}</div>
          {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="w-full rounded-xl aspect-video object-cover" />}
          <div className="pt-2">{post.content.split("\n").map((para: string, i: number) => <p key={i} className="text-sm text-foreground/90 leading-relaxed mb-3">{para}</p>)}</div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function NewsPage() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const { data: posts, isLoading } = useQuery({ queryKey: ["news", category, search], queryFn: () => fetchNews(category, search), staleTime: 60000 });

  return (
    <AppLayout fullBleed>
      <div className="max-w-2xl mx-auto px-4 py-5 lg:px-8 pb-24 space-y-5">
        {/* Header */}
        <div className="v3-gradient rounded-2xl p-6 text-white animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm"><Newspaper size={18} /></div>
            <div><h1 className="font-bold text-base">News & Updates</h1><p className="text-[11px] text-white/40 mt-0.5">Platform announcements and market insights</p></div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search news..." className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={cn("px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all", category === c ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60")}>
              {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? <div className="space-y-2.5">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          : posts?.length ? (
            <div className="space-y-2.5">
              {posts.map((post: any) => (
                <Link key={post.id} href={`/news/${post.id}`}>
                  <div className="v3-card-elevated p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]">
                    {post.isFeatured && <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full mb-2 inline-block">Featured</span>}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground leading-tight">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", CATEGORY_COLORS[post.category] ?? "bg-muted text-muted-foreground")}>{post.category}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar size={9} /> {formatDateTime(post.publishedAt ?? post.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground/40 shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="v3-card p-12 text-center">
              <Newspaper size={28} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-foreground">No news found</p>
              <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
            </div>
          )}
      </div>
    </AppLayout>
  );
}
