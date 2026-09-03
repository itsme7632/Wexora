export type AdminSection =
  | "overview"
  | "users"
  | "finance"
  | "investments"
  | "verification"
  | "content"
  | "settings"
  | "infrastructure";

export async function adminApi(path: string, method = "GET", body?: any) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message ?? `Request failed (${res.status})`);
    }
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
}

export function opportunityStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return {
        label: "Draft",
        cls: "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400",
      };
    case "active":
      return {
        label: "Active",
        cls: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
      };
    case "funding":
      return {
        label: "Funding",
        cls: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
      };
    case "featured":
      return {
        label: "⭐ Featured",
        cls: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
      };
    case "trending":
      return {
        label: "🔥 Trending",
        cls: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400",
      };
    case "paused":
      return {
        label: "Paused",
        cls: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
      };
    case "fully_allocated":
      return {
        label: "Fully Allocated",
        cls: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400",
      };
    case "expired":
      return {
        label: "Expired",
        cls: "bg-red-50 text-red-500 border-red-200 dark:bg-red-950/30 dark:text-red-400",
      };
    case "closed":
      return {
        label: "Closed",
        cls: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
      };
    default:
      return {
        label: status || "Active",
        cls: "bg-emerald-50 text-emerald-600 border-emerald-200",
      };
  }
}
