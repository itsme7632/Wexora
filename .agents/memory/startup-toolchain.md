---
name: Startup toolchain compatibility
description: Replit workflow startup depends on the workspace pnpm pin matching the installed runtime.
---

Keep the root package-manager pin aligned with the pnpm version provided by the current Replit runtime. A mismatched pin can make every managed workflow repeatedly self-install pnpm and exhaust process capacity before the app starts.

**Why:** The artifact workflows previously failed before Vite or the API ran because the project requested an unavailable/different pnpm version.

**How to apply:** When all workflows fail during bootstrap with repeated `pnpm add pnpm@...` messages, check the provided `pnpm --version` and the root `packageManager` field first.