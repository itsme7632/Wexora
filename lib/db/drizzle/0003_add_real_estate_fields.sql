-- V4.1: Add real estate investment fields to investment_plans
-- This is a non-destructive migration: all new columns are nullable,
-- so existing plans remain fully functional without any data changes.

ALTER TABLE "investment_plans"
  ADD COLUMN IF NOT EXISTS "property_type" text,
  ADD COLUMN IF NOT EXISTS "location" text,
  ADD COLUMN IF NOT EXISTS "images" text[],
  ADD COLUMN IF NOT EXISTS "funding_deadline" timestamp with time zone;
