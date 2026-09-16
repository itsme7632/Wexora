import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { mkdirSync, writeFileSync, rmSync, renameSync, existsSync } from "node:fs";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

// Output directly into the hosting platform's function directory:
//   <repo-root>/api/index.mjs
const outDir = path.resolve(artifactDir, "..", "..", "api");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// pino's worker transports must ship alongside the bundle as real files.
await esbuild({
  entryPoints: [path.resolve(artifactDir, "src/serverless.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  target: "node20",
  outdir: outDir,
  outExtension: { ".js": ".mjs" },
  sourcemap: true,
  logLevel: "info",
  alias: {
    // Replit-only storage client — stubbed with explicit errors (see stubs/).
    "@google-cloud/storage": path.resolve(artifactDir, "src/stubs/google-cloud-storage.ts"),
  },
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  banner: {
    js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';
import * as __bannerFs from 'node:fs';
globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);

// Env loading must run BEFORE any bundled module body (e.g. the pg Pool in
// @workspace/db reads DATABASE_URL at import time). process.loadEnvFile does
// NOT override variables that already exist, so real platform env always wins.
try {
  const __envRoot = __bannerPath.resolve(__dirname, '..');
  for (const __p of [
    __bannerPath.join(__envRoot, '.env'),
    __bannerPath.join(__envRoot, '.env.local'),
    __bannerPath.join(process.cwd(), '.env'),
    __bannerPath.join(process.cwd(), '.env.local'),
  ]) {
    try { if (__bannerFs.existsSync(__p)) process.loadEnvFile(__p); } catch {}
  }
} catch {}
`,
  },
});

// Marker the hosting builder can read to know the runtime entry + env handling.
writeFileSync(
  path.join(outDir, "index.txt"),
  "Serverless API function — built from artifacts/api-server (see build-serverless.mjs).\n",
);

// The function runtime expects the entry at api/index.mjs — rename to match.
const builtEntry = path.join(outDir, "serverless.mjs");
if (existsSync(builtEntry)) {
  renameSync(builtEntry, path.join(outDir, "index.mjs"));
  const map = builtEntry + ".map";
  if (existsSync(map)) renameSync(map, path.join(outDir, "index.mjs.map"));
}

console.log("serverless bundle written to api/index.mjs");
