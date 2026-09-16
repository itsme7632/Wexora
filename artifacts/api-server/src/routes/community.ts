import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, desc, sql, count, sum, lt, isNull, or, inArray } from "drizzle-orm";
import {
  db,
  usersTable,
  // community table imports removed — tables don't exist in DB schema
  referralsTable,
  userInvestmentsTable,
  referralSalaryTable,
  notificationsTable,
  platformSettingsTable,
} from "@workspace/db";

const router: IRouter = Router();

// Community feature disabled — tables not present in schema
export default router;
