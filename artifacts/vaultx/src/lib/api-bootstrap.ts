// API bootstrap — runs BEFORE the app renders (imported first in main.tsx).
//
// Cross-origin mode for static deployments:
// When VITE_API_URL is provided at build time (e.g. a static hosting deploy
// where the Express API lives on a different origin), every relative
// root-scoped request ("/api/...", "/uploads/...") is transparently routed
// to that origin. This covers:
//   1. The generated API client (via @workspace/api-client-react setBaseUrl)
//   2. Plain window.fetch calls used across pages/components (wrapped here,
//      synchronously, so no async import race can ever miss the base URL)
//
// Relative app-asset URLs ("assets/...", "./...", "/wx-..." legacy assets)
// and non-HTTP URLs are left untouched.

const API_BASE: string | null = (import.meta as any).env?.VITE_API_URL || null;

export function getApiBaseUrl(): string | null {
  return API_BASE;
}

function shouldProxyUrl(url: string): boolean {
  if (url.startsWith("/api/") || url === "/api") return true;
  if (url.startsWith("/uploads/")) return true;
  return false;
}

if (API_BASE) {
  void import("@workspace/api-client-react").then(({ setBaseUrl }) => {
    setBaseUrl(API_BASE);
  });

  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && shouldProxyUrl(input)) {
      return originalFetch(`${API_BASE}${input}`, init);
    }
    if (input instanceof URL) {
      const url = input.toString();
      if (url.startsWith("/") && shouldProxyUrl(url)) {
        return originalFetch(new URL(`${API_BASE}${url}`), init);
      }
    }
    if (typeof Request !== "undefined" && input instanceof Request) {
      const url = input.url;
      try {
        const parsed = new URL(url);
        // Route relative Request objects (same-origin /api calls) to the API origin
        if (shouldProxyUrl(parsed.pathname)) {
          return originalFetch(new Request(`${API_BASE}${parsed.pathname}${parsed.search}`, input), init);
        }
      } catch {
        /* fall through to original fetch */
      }
    }
    return originalFetch(input, init);
  }) as typeof window.fetch;
}
