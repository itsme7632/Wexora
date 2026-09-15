#!/usr/bin/env node
// Smoke-test the generated serverless API bundle (api/index.mjs) over real
// HTTP, exactly as a serverless runtime would invoke it:
//   node --env-file-if-exists=.env.local scripts/smoke-api-bundle.mjs
// Requires: DATABASE_URL reachable. SESSION_SECRET is optional (falls back).
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const PORT = Number(process.env.SMOKE_PORT ?? 8899);
const BASE = `http://127.0.0.1:${PORT}`;

const { default: handler } = await import(new URL("../api/index.mjs", import.meta.url));

const server = http.createServer((req, res) => handler(req, res));
await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
console.log(`[smoke] bundle listening on ${BASE}`);

const results = [];
async function call(name, path, init) {
  try {
    const res = await fetch(`${BASE}${path}`, init);
    const type = res.headers.get("content-type") ?? "";
    const body = type.includes("json") ? JSON.stringify(await res.json()).slice(0, 120) : (await res.text()).slice(0, 80);
    const ok = type.includes("application/json") || res.status >= 500;
    results.push(`${ok ? "PASS" : "FAIL"} ${name}: ${res.status} ${type} ${body}`);
    return res;
  } catch (err) {
    results.push(`FAIL ${name}: threw ${err?.message ?? err}`);
    return null;
  }
}

await call("GET /api/healthz", "/api/healthz");
await call("POST /api/auth/login (bad creds)", "/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ usernameOrEmail: "smoke_probe_user", password: "wrong-password" }),
});
await call("GET /api/investments/plans", "/api/investments/plans");
await call("GET /api/investments (no session)", "/api/investments");
await call("GET /api/does-not-exist (404)", "/api/does-not-exist");

console.log(results.join("\n"));
const failed = results.some((r) => r.startsWith("FAIL"));
server.close();
await delay(100);
process.exit(failed ? 1 : 0);
