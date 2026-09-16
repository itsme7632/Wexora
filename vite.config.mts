import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Root-level build config for static hosting (Freebuff managed hosting).
//
// Hosting detectors read the ROOT package.json, and static hosts expect
// build output in <repo-root>/dist. The real application lives in
// artifacts/vaultx (its own vite.config.ts + dev server are unchanged —
// that config still builds to artifacts/vaultx/dist/public for the
// API server's production static serving and handles the dev /api proxy).
//
// This config simply builds the SAME app to ./dist for static deploys:
//   pnpm run build:web   →   vite build   →   ./dist
//
// It never starts a server and does not affect local development.

const appRoot = path.resolve(import.meta.dirname, "artifacts/vaultx");

export default defineConfig({
  root: appRoot,
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(appRoot, "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
