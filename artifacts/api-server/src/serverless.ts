/**
 * Serverless entry — adapts the existing Express app for the hosting
 * platform's Node function runtime (the `api/` directory convention).
 *
 * This is NOT a rewrite: it wraps the SAME `app` object used by the
 * long-running server (src/index.ts), adding one-time boot work
 * (migrations, seed, transaction-ID backfill) that index.ts performs
 * before listening. index.ts remains the entry for VPS/self-hosted runs.
 */
import type { Request, Response } from "express";
import { config as dotenvConfig } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "@workspace/db";
import app from "./app";

// Load repo .env/.env.local WITHOUT overriding real platform env vars
// (override:false) — production config comes from the hosting environment;
// this only covers local/self-hosted runs of the serverless bundle.
const here = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(here, "..", ".env"), override: false });
dotenvConfig({ path: resolve(here, "..", ".env.local"), override: false });
dotenvConfig({ path: resolve(process.cwd(), ".env"), override: false });
dotenvConfig({ path: resolve(process.cwd(), ".env.local"), override: false });

let bootPromise: Promise<void> | null = null;

async function ensureBoot(): Promise<void> {
  if (!bootPromise) {
    bootPromise = (async () => {
      const { runMigrations, runSeed, backfillTransactionIds } = await import(
        "@workspace/db"
      );
      await runMigrations();
      await runSeed();
      await backfillTransactionIds();
    })();
  }
  return bootPromise;
}

// A stuck request must never wedge a warm function instance forever:
// if the response hasn't finished within the window, destroy the socket so
// the platform returns 503/timeout and the instance stays reusable.
const REQUEST_WATCHDOG_MS = 55_000;

function armWatchdog(req: Request, res: Response): void {
  const timer = setTimeout(() => {
    if (!res.writableEnded) {
      res.destroy();
    }
  }, REQUEST_WATCHDOG_MS);
  timer.unref?.();
  res.on("finish", () => clearTimeout(timer));
  res.on("close", () => clearTimeout(timer));
}

export default async function handler(req: Request, res: Response) {
  armWatchdog(req, res);

  try {
    await ensureBoot();
  } catch (err) {
    // Reset so the next request retries boot (e.g. transient DB blip).
    bootPromise = null;
    throw err;
  }
  return app(req, res);
}

// Serverless containers freeze between invocations; keep the PG pool alive
// so warm instances don't pay a reconnect on every cold DB query.
setInterval(() => {
  pool.query("SELECT 1").catch(() => {
    /* pool recovers on next use */
  });
}, 60_000).unref?.();

// Unhandled rejections must not take down a warm function instance.
process.on("unhandledRejection", (err) => {
  console.error("[serverless] unhandledRejection", err);
});
process.on("uncaughtException", (err) => {
  console.error("[serverless] uncaughtException", err);
});

// Hint for runtimes that read a maxDuration export (ignored elsewhere).
export const maxDuration = 60;
