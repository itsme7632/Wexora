import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import {
  usersTable,
  walletsTable,
  walletAddressesTable,
  investmentPlansTable,
  userInvestmentsTable,
  transactionsTable,
  depositNetworksTable,
  platformSettingsTable,
  newsPostsTable,
  notificationsTable,
} from "./schema";
import { eq, count, or } from "drizzle-orm";

const { Pool } = pg;

/**
 * Legacy plans that must NOT appear as current active opportunities.
 * Includes old crypto plans AND the previous generation of property names.
 * Retired by ensureOpportunities: removed if unused, deactivated if referenced.
 */
const LEGACY_PLAN_NAMES = [
  // Old crypto/HYIP plans
  "Starter Plan",
  "Growth Plan",
  "Elite Plan",
  "Digital Asset Allocation",
  "AI Infrastructure",
  "Technology Expansion",
  "Market Liquidity Program",
  "Strategic Growth Allocation",
  // Previous property catalog generation
  "Skyline Residences",
  "Marina Vista Tower",
  "The Meridian Tower",
  "Villa Serenata",
  "Oakwood Promenade",
  "Coastal Retreat",
  "Rivington Quarter",
  "Bayshore Residences",
  "Toronto Heights",
];

async function getDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

function getOpportunities() {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  return [
    {
      name: "Harborview Terrace",
      description: "Contemporary waterfront residential development on Boston's historic waterfront. Studio to three-bedroom residences with harbor views, private terraces, and concierge services. Steps from the North End and financial district, targeting strong professional rental demand in one of America's most supply-constrained housing markets.",
      minAmount: "500.00000000",
      maxAmount: "60000.00000000",
      dailyReturnRate: "0.011000",
      minRoiRate: "0.008000",
      maxRoiRate: "0.014000",
      durationDays: 480,
      riskLevel: "medium",
      features: ["Boston waterfront", "Harbor views", "Concierge services", "Transit accessible"],
      isActive: true,
      isFeatured: true,
      category: "Residential",
      fundingGoal: "4200000.00000000",
      currentFunding: "1850000.00000000",
      status: "featured",
      colorTheme: "emerald",
      autoCompoundAvailable: true,
      startDate: daysAgo(25),
      endDate: daysFromNow(455),
      sortOrder: 1,
      propertyType: "residential",
      location: "Seaport District, Boston, USA",
      images: [
        "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
      ],
      fundingDeadline: daysFromNow(155),
    },
    {
      name: "The Foundry Lofts",
      description: "Adaptive-reuse conversion of a historic warehouse into industrial-chic loft residences in Austin's emerging East Side. Exposed brick, high ceilings, and open floor plans appeal to Austin's growing tech workforce. Ground-floor creative retail spaces complement the residential community.",
      minAmount: "400.00000000",
      maxAmount: "50000.00000000",
      dailyReturnRate: "0.011500",
      minRoiRate: "0.009000",
      maxRoiRate: "0.015000",
      durationDays: 420,
      riskLevel: "medium",
      features: ["Historic conversion", "Industrial lofts", "East Austin location", "Creative retail"],
      isActive: true,
      isFeatured: false,
      category: "Mixed-Use",
      fundingGoal: "2800000.00000000",
      currentFunding: "960000.00000000",
      status: "active",
      colorTheme: "amber",
      autoCompoundAvailable: true,
      startDate: daysAgo(15),
      endDate: daysFromNow(405),
      sortOrder: 2,
      propertyType: "mixed-use",
      location: "East Side, Austin, USA",
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
        "https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=800&q=80",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
      ],
      fundingDeadline: daysFromNow(125),
    },
    {
      name: "Cypress Gate Offices",
      description: "Class A suburban office campus in Atlanta's Central Perimeter submarket, repositioned for the post-pandemic hybrid-work era. Features flexible floor plates, upgraded HVAC systems, and an extensive amenity package. Anchored by a credit tenant with a long-term lease structure.",
      minAmount: "1000.00000000",
      maxAmount: "90000.00000000",
      dailyReturnRate: "0.009000",
      minRoiRate: "0.007000",
      maxRoiRate: "0.011500",
      durationDays: 730,
      riskLevel: "low",
      features: ["Class A offices", "Credit tenant", "Long-term lease", "Amenity-rich campus"],
      isActive: true,
      isFeatured: true,
      category: "Commercial",
      fundingGoal: "7500000.00000000",
      currentFunding: "4100000.00000000",
      status: "featured",
      colorTheme: "purple",
      autoCompoundAvailable: true,
      startDate: daysAgo(40),
      endDate: daysFromNow(690),
      sortOrder: 3,
      propertyType: "commercial",
      location: "Central Perimeter, Atlanta, USA",
      images: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
        "https://images.unsplash.com/photo-1431576901776-e539bd916ba2?w=800&q=80",
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80",
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
        "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
      ],
      fundingDeadline: daysFromNow(210),
    },
    {
      name: "Palm Grove Resort",
      description: "Boutique beachfront resort on Phuket's quiet west coast. 48 keys with pool villas, beach club, and wellness facilities targeting the premium leisure segment. Thailand's tourism recovery and limited west-coast supply underpin the investment case.",
      minAmount: "250.00000000",
      maxAmount: "40000.00000000",
      dailyReturnRate: "0.013000",
      minRoiRate: "0.010000",
      maxRoiRate: "0.017000",
      durationDays: 540,
      riskLevel: "medium",
      features: ["Beachfront location", "Pool villas", "Wellness facilities", "Premium leisure"],
      isActive: true,
      isFeatured: false,
      category: "Hospitality",
      fundingGoal: "3200000.00000000",
      currentFunding: "1180000.00000000",
      status: "active",
      colorTheme: "teal",
      autoCompoundAvailable: true,
      startDate: daysAgo(18),
      endDate: daysFromNow(522),
      sortOrder: 4,
      propertyType: "hospitality",
      location: "Bang Tao, Phuket, Thailand",
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
        "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800&q=80",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80",
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80",
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
        "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
      ],
      fundingDeadline: daysFromNow(140),
    },
    {
      name: "Riverwalk Commons",
      description: "Mixed-use riverfront development in San Antonio's revitalized Pearl District corridor. Ground-floor dining and retail along the river walk, with residential units above. The district's transformation into a cultural and culinary destination has driven sustained tenant demand.",
      minAmount: "750.00000000",
      maxAmount: "70000.00000000",
      dailyReturnRate: "0.010500",
      minRoiRate: "0.008000",
      maxRoiRate: "0.013500",
      durationDays: 600,
      riskLevel: "medium",
      features: ["Riverfront location", "Retail and dining", "Pearl District", "Cultural destination"],
      isActive: true,
      isFeatured: false,
      category: "Mixed-Use",
      fundingGoal: "5200000.00000000",
      currentFunding: "2240000.00000000",
      status: "active",
      colorTheme: "blue",
      autoCompoundAvailable: true,
      startDate: daysAgo(22),
      endDate: daysFromNow(578),
      sortOrder: 5,
      propertyType: "mixed-use",
      location: "Pearl District, San Antonio, USA",
      images: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
        "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80",
        "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
        "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=800&q=80",
        "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80",
      ],
      fundingDeadline: daysFromNow(170),
    },
    {
      name: "Aurelia Residences",
      description: "Mid-rise luxury condominium in Madrid's Chamberí district, one of the city's most desirable residential barrios. Classic Madrid architecture with modernized interiors, targeting both Spanish professionals and international buyers. Limited new supply in the historic center supports long-term value.",
      minAmount: "600.00000000",
      maxAmount: "55000.00000000",
      dailyReturnRate: "0.010000",
      minRoiRate: "0.007500",
      maxRoiRate: "0.013000",
      durationDays: 540,
      riskLevel: "medium",
      features: ["Chamberí district", "Classic architecture", "Modernized interiors", "Historic center"],
      isActive: true,
      isFeatured: false,
      category: "Residential",
      fundingGoal: "3600000.00000000",
      currentFunding: "1330000.00000000",
      status: "active",
      colorTheme: "rose",
      autoCompoundAvailable: true,
      startDate: daysAgo(12),
      endDate: daysFromNow(528),
      sortOrder: 6,
      propertyType: "residential",
      location: "Chamberí, Madrid, Spain",
      images: [
        "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
        "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80",
      ],
      fundingDeadline: daysFromNow(145),
    },
    {
      name: "Kestrel Logistics Hub",
      description: "Modern logistics and light-industrial facility near Rotterdam's port corridor, Europe's largest container gateway. Clear-height warehouses with dock loading, solar-ready roofing, and direct highway access. Institutional demand for European logistics assets remains strong.",
      minAmount: "1000.00000000",
      maxAmount: "100000.00000000",
      dailyReturnRate: "0.008500",
      minRoiRate: "0.006500",
      maxRoiRate: "0.010500",
      durationDays: 730,
      riskLevel: "low",
      features: ["Rotterdam port corridor", "Clear-height warehouses", "Solar-ready", "Highway access"],
      isActive: true,
      isFeatured: true,
      category: "Industrial",
      fundingGoal: "9000000.00000000",
      currentFunding: "3600000.00000000",
      status: "featured",
      colorTheme: "slate",
      autoCompoundAvailable: true,
      startDate: daysAgo(35),
      endDate: daysFromNow(695),
      sortOrder: 7,
      propertyType: "commercial",
      location: "Botlek, Rotterdam, Netherlands",
      images: [
        "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80",
        "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&q=80",
        "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
        "https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?w=800&q=80",
      ],
      fundingDeadline: daysFromNow(195),
    },
    {
      name: "Marbella Sunrise Villas",
      description: "Collection of eight contemporary villas in Marbella's New Golden Mile, targeting the premium Costa del Sol lifestyle market. South-facing orientations, private pools, and open-plan living spaces. The area attracts year-round residents alongside seasonal occupants from across Europe.",
      minAmount: "800.00000000",
      maxAmount: "80000.00000000",
      dailyReturnRate: "0.011000",
      minRoiRate: "0.008500",
      maxRoiRate: "0.014500",
      durationDays: 540,
      riskLevel: "medium",
      features: ["New Golden Mile", "Private pools", "South-facing", "Costa del Sol"],
      isActive: true,
      isFeatured: false,
      category: "Residential",
      fundingGoal: "4400000.00000000",
      currentFunding: "1760000.00000000",
      status: "active",
      colorTheme: "amber",
      autoCompoundAvailable: true,
      startDate: daysAgo(20),
      endDate: daysFromNow(520),
      sortOrder: 8,
      propertyType: "residential",
      location: "New Golden Mile, Marbella, Spain",
      images: [
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
        "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80",
        "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      ],
      fundingDeadline: daysFromNow(150),
    },
    {
      name: "The Loom Hotel",
      description: "Boutique lifestyle hotel in Lisbon's creative Alcântara district, housed in a converted textile factory. 62 rooms with an industrial-luxe design language, rooftop bar, and event spaces. Lisbon's tourism sector continues to outperform Southern European peers.",
      minAmount: "500.00000000",
      maxAmount: "65000.00000000",
      dailyReturnRate: "0.012000",
      minRoiRate: "0.009000",
      maxRoiRate: "0.016000",
      durationDays: 600,
      riskLevel: "medium",
      features: ["Factory conversion", "Rooftop bar", "62 keys", "Alcântara district"],
      isActive: true,
      isFeatured: false,
      category: "Hospitality",
      fundingGoal: "5000000.00000000",
      currentFunding: "2050000.00000000",
      status: "active",
      colorTheme: "violet",
      autoCompoundAvailable: true,
      startDate: daysAgo(16),
      endDate: daysFromNow(584),
      sortOrder: 9,
      propertyType: "hospitality",
      location: "Alcântara, Lisbon, Portugal",
      images: [
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
        "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800&q=80",
        "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&q=80",
      ],
      fundingDeadline: daysFromNow(160),
    },
    {
      name: "Northgate Exchange",
      description: "Neighborhood retail center anchored by a national grocery tenant in Charlotte's high-growth Ballantyne submarket. Daily-needs retail has proven resilient through economic cycles, and the trade area benefits from sustained residential rooftops and rising incomes.",
      minAmount: "750.00000000",
      maxAmount: "75000.00000000",
      dailyReturnRate: "0.009000",
      minRoiRate: "0.007000",
      maxRoiRate: "0.011000",
      durationDays: 660,
      riskLevel: "low",
      features: ["Grocery anchored", "Daily-needs retail", "Ballantyne submarket", "High-growth area"],
      isActive: true,
      isFeatured: false,
      category: "Commercial",
      fundingGoal: "6800000.00000000",
      currentFunding: "2720000.00000000",
      status: "active",
      colorTheme: "emerald",
      autoCompoundAvailable: true,
      startDate: daysAgo(28),
      endDate: daysFromNow(632),
      sortOrder: 10,
      propertyType: "commercial",
      location: "Ballantyne, Charlotte, USA",
      images: [
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
        "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=80",
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80",
        "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
        "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80",
        "https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=800&q=80",
      ],
      fundingDeadline: daysFromNow(180),
    },
  ];
}



async function seedInvestmentPlans(db: ReturnType<typeof drizzle<typeof schema>>) {
  const existing = await db.select({ c: count() }).from(investmentPlansTable);
  if ((existing[0]?.c ?? 0) > 0) {
    console.log("[seed] Investment plans already seeded, skipping");
    return;
  }

  await db.insert(investmentPlansTable).values(getOpportunities() as any[]);
  console.log("[seed] Investment plans seeded ✓");
}

/**
 * Always runs. Migrates old crypto plans to new real-estate property names
 * and inserts any missing new plans.
 */
async function ensureOpportunities(db: ReturnType<typeof drizzle<typeof schema>>) {
  const opportunities = getOpportunities();

  // Insert any missing current-catalog plans
  const refreshedPlans = await db.select({ id: investmentPlansTable.id, name: investmentPlansTable.name }).from(investmentPlansTable);
  const existingNames = new Set(refreshedPlans.map((p) => p.name));

  for (const plan of opportunities) {
    if (!existingNames.has(plan.name)) {
      await db.insert(investmentPlansTable).values(plan as any);
      console.log(`[seed] Inserted missing plan "${plan.name}" ✓`);
    }
  }

  // Retire legacy plans: delete if unused, deactivate/close if referenced by investments
  const allPlans = await db.select({ id: investmentPlansTable.id, name: investmentPlansTable.name }).from(investmentPlansTable);
  const legacyIds = allPlans.filter((p) => LEGACY_PLAN_NAMES.includes(p.name));

  for (const plan of legacyIds) {
    const [refs] = await db
      .select({ c: count() })
      .from(userInvestmentsTable)
      .where(eq(userInvestmentsTable.planId, plan.id));

    if ((refs?.c ?? 0) > 0) {
      // Financial references exist — archive, never delete or rename
      await db
        .update(investmentPlansTable)
        .set({ isActive: false, status: "closed" } as any)
        .where(eq(investmentPlansTable.id, plan.id));
      console.log(`[seed] Archived legacy plan "${plan.name}" (has investments) ✓`);
    } else {
      // Unused — safe to remove from catalog
      await db.delete(investmentPlansTable).where(eq(investmentPlansTable.id, plan.id));
      console.log(`[seed] Removed unused legacy plan "${plan.name}" ✓`);
    }
  }

  console.log("[seed] Opportunities verified ✓");
}

async function seedDepositNetworks(db: ReturnType<typeof drizzle<typeof schema>>) {
  const existing = await db.select({ c: count() }).from(depositNetworksTable);
  if ((existing[0]?.c ?? 0) > 0) {
    console.log("[seed] Deposit networks already seeded, skipping");
    return;
  }

  await db.insert(depositNetworksTable).values([
    {
      network: "TRC20",
      label: "USDT (TRC20)",
      walletAddress: "TN3W4H6rK2ce4vX9YnFQHwKx7X8rHBdFW",
      minDeposit: "10.00000000",
      networkFee: "1.00000000",
      confirmationTime: "5–15 minutes",
      isActive: true,
    },
    {
      network: "ERC20",
      label: "USDT (ERC20)",
      walletAddress: "0x742d35Cc6634C0532925a3b8D4C9F7f4b62Ee8E",
      minDeposit: "50.00000000",
      networkFee: "5.00000000",
      confirmationTime: "10–30 minutes",
      isActive: true,
    },
    {
      network: "BTC",
      label: "Bitcoin (BTC)",
      walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      minDeposit: "0.00100000",
      networkFee: "0.00005000",
      confirmationTime: "30–60 minutes",
      isActive: true,
    },
    {
      network: "ETH",
      label: "Ethereum (ETH)",
      walletAddress: "0x742d35Cc6634C0532925a3b8D4C9F7f4b62Ee8E",
      minDeposit: "0.02000000",
      networkFee: "0.00500000",
      confirmationTime: "10–20 minutes",
      isActive: true,
    },
    {
      network: "BSC",
      label: "BNB Smart Chain (BEP20)",
      walletAddress: "0x742d35Cc6634C0532925a3b8D4C9F7f4b62Ee8E",
      minDeposit: "20.00000000",
      networkFee: "0.50000000",
      confirmationTime: "5–10 minutes",
      isActive: true,
    },
  ]);

  console.log("[seed] Deposit networks seeded ✓");
}

async function seedPlatformSettings(db: ReturnType<typeof drizzle<typeof schema>>) {
  const existing = await db.select({ c: count() }).from(platformSettingsTable);
  if ((existing[0]?.c ?? 0) > 0) {
    console.log("[seed] Platform settings already seeded, skipping");

    await db
      .insert(platformSettingsTable)
      .values({ key: "kyc_enabled", value: "true" })
      .onConflictDoNothing();

    return;
  }

  const settings: Array<{ key: string; value: string }> = [
    { key: "platform_name", value: "EstateFund" },
    { key: "platform_tagline", value: "Real Estate Investment Platform" },
    { key: "platform_description", value: "EstateFund is a secure real estate investment platform providing access to premium property investment opportunities. Join thousands of investors building their portfolios worldwide." },
    { key: "support_email", value: "support@estatefund.com" },
    { key: "support_whatsapp", value: "+1 (800) 555-0100" },
    { key: "support_telegram", value: "@EstateFund" },
    { key: "support_response_time", value: "Within 24 hours" },
    { key: "min_withdrawal", value: "10" },
    { key: "withdrawal_fee_percent", value: "1.5" },
    { key: "min_deposit", value: "10" },
    { key: "referral_commission_rate", value: "5" },
    { key: "referral_l1_deposit_rate", value: "5" },
    { key: "referral_l2_deposit_rate", value: "3" },
    { key: "referral_l3_deposit_rate", value: "1" },
    { key: "referral_l1_roi_rate", value: "5" },
    { key: "referral_l2_roi_rate", value: "3" },
    { key: "referral_l3_roi_rate", value: "1" },
    { key: "maintenance_mode", value: "false" },
    { key: "registration_enabled", value: "true" },
    { key: "kyc_required_for_withdrawal", value: "false" },
    { key: "kyc_enabled", value: "true" },
    { key: "max_withdrawal_per_day", value: "50000" },
    { key: "admin_email", value: "admin@estatefund.com" },
    { key: "site_url", value: "https://estatefund.com" },
    { key: "withdrawal_processing_time", value: "24–48 hours" },
    { key: "deposit_confirmation_blocks", value: "6" },
    { key: "roi_distribution_time", value: "Daily at 00:00 UTC" },
  ];

  await db.insert(platformSettingsTable).values(settings);
  console.log("[seed] Platform settings seeded ✓");
}

async function seedNews(db: ReturnType<typeof drizzle<typeof schema>>) {
  const existing = await db.select({ c: count() }).from(newsPostsTable);
  if ((existing[0]?.c ?? 0) > 0) {
    console.log("[seed] News posts already seeded, skipping");
    return;
  }

  const now = new Date();

  await db.insert(newsPostsTable).values([
    {
      title: "Welcome to EstateFund — Your Real Estate Investment Platform",
      content: `We're thrilled to welcome you to EstateFund, a real estate investment platform designed to help you build wealth through carefully curated property opportunities.

**What is EstateFund?**
EstateFund connects individual investors with real estate property opportunities across residential, commercial, hospitality and mixed-use markets. Each property includes clear investment terms, projected return ranges, and defined durations.

**Why choose EstateFund?**
- **Curated Properties**: Access premium real estate opportunities worldwide
- **Clear Investment Terms**: Minimum investment, projected returns, and durations are transparent
- **Real-Time Portfolio Tracking**: Monitor your investments, earnings, and progress from your dashboard
- **Secure Platform**: Account protection, encrypted connections, and continuous monitoring

**Getting Started**
1. Create your free account
2. Complete identity verification (KYC)
3. Fund your wallet
4. Explore available properties
5. Invest and track your portfolio!

Start your real estate investment journey with EstateFund today.`,
      excerpt: "Welcome to EstateFund - the real estate investment platform connecting you with curated property opportunities worldwide.",
      category: "announcement",
      isFeatured: true,
      isPublished: true,
      publishedAt: now,
    },
    {
      title: "New Properties Added - Residential and Commercial Opportunities Now Live",
      content: `We've expanded our property catalog with exciting new real estate investment opportunities.

**Newly Added Properties:**

**Harborview Terrace** - Boston Seaport, USA
Type: Residential | Min: $500 | Duration: 365 days
Waterfront residential community with harbor views.

**Cypress Gate Offices** - Austin Domain District, USA
Type: Commercial | Min: $1,000 | Duration: 730 days
Class A office campus in a tech hub.

**Palm Grove Resort** - Nusa Dua, Bali, Indonesia
Type: Hospitality | Min: $250 | Duration: 180 days
Beachfront resort generating luxury vacation rental income.

**Riverwalk Commons** - San Antonio Pearl District, USA
Type: Mixed-Use | Min: $1,000 | Duration: 540 days
Ground-floor retail with luxury residential units.

Each property includes a funding progress tracker, projected return range, and clear investment duration. Review all terms before investing.`,
      excerpt: "EstateFund expands its property catalog with new residential, commercial, and hospitality real estate investment opportunities.",
      category: "investment",
      isFeatured: false,
      isPublished: true,
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Real Estate Market Update - Global Property Investment Trends",
      content: `The global real estate market continues to present compelling investment opportunities across multiple sectors.

**Market Highlights:**
- Residential property demand remains strong in major urban centers worldwide
- Commercial office space in prime financial districts shows renewed investor interest
- Hospitality and vacation rental properties are benefiting from increased global travel
- Mixed-use developments in established neighborhoods continue to attract institutional capital

**What This Means for EstateFund Investors**
Our property catalog is carefully curated to reflect current market conditions. Whether you prefer the stability of residential properties or the growth potential of commercial real estate, our platform provides the transparency you need to make informed investment decisions.

Stay informed, stay invested. The EstateFund team monitors market trends to ensure our property offerings reflect current opportunities.`,
      excerpt: "Global real estate market trends and what they mean for EstateFund investors.",
      category: "market",
      isFeatured: false,
      isPublished: true,
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Security Update: Enhanced 2FA and Account Protection",
      content: `Your security is our top priority. We've implemented several new security features to better protect your EstateFund account and funds.

**New Security Features:**

🔐 **Enhanced Two-Factor Authentication**
We now support TOTP-based 2FA via Google Authenticator, Authy, and other compatible apps. Enable it in your Security settings.

🔒 **Withdrawal Lock**
An additional verification step for large withdrawals to prevent unauthorized access.

🌐 **IP Monitoring**
We track and log all login attempts and flag suspicious activity automatically.

**Best Practices to Keep Your Account Safe:**
1. Enable 2FA immediately
2. Use a strong, unique password (12+ characters)
3. Never share your login credentials
4. Always log out on shared devices

If you notice any suspicious activity, contact our support team immediately at support@estatefund.com.`,
      excerpt: "EstateFund launches enhanced security features including improved 2FA, withdrawal locks, IP monitoring, and real-time email alerts.",
      category: "security",
      isFeatured: false,
      isPublished: true,
      publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log("[seed] News posts seeded ✓");
}

async function ensureAdminAccount(db: ReturnType<typeof drizzle<typeof schema>>) {
  const ADMIN_EMAIL = "admin@estatefund.com";
  const ADMIN_PASSWORD = "Admin123@";

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL))
    .limit(1);

  if (existing) {
    await db
      .update(usersTable)
      .set({
        passwordHash,
        isAdmin: true,
        isActive: true,
        isVerified: true,
        kycStatus: "approved",
      })
      .where(eq(usersTable.email, ADMIN_EMAIL));

    await db
      .insert(walletsTable)
      .values({ userId: existing.id })
      .onConflictDoNothing();

    console.log("[seed] Admin account verified/updated ✓ (admin@estatefund.com / Admin123@)");
    return;
  }

  const candidateUsernames = ["admin", "efadmin", "superadmin", "admin_ef"];
  let chosenUsername = "admin_wx";
  for (const candidate of candidateUsernames) {
    const [taken] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, candidate))
      .limit(1);
    if (!taken) {
      chosenUsername = candidate;
      break;
    }
  }

  let displayId = "000100";
  for (let n = 100; n < 200; n++) {
    const candidate = String(n).padStart(6, "0");
    const [taken] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.displayId, candidate))
      .limit(1);
    if (!taken) { displayId = candidate; break; }
  }

  let referralCode = "EFADMIN01";
  const [refTaken] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.referralCode, referralCode))
    .limit(1);
  if (refTaken) referralCode = "EFADMIN" + Date.now().toString().slice(-4);

  const [admin] = await db
    .insert(usersTable)
    .values({
      displayId,
      fullName: "EstateFund Admin",
      username: chosenUsername,
      email: ADMIN_EMAIL,
      passwordHash,
      referralCode,
      kycStatus: "approved",
      isAdmin: true,
      isVerified: true,
      isActive: true,
      country: "US",
    })
    .returning();

  await db
    .insert(walletsTable)
    .values({ userId: admin.id })
    .onConflictDoNothing();

  console.log(`[seed] Admin account created ✓  email: ${ADMIN_EMAIL}  username: ${chosenUsername}  password: ${ADMIN_PASSWORD}`);
}

async function seedDemoUser(db: ReturnType<typeof drizzle<typeof schema>>) {
  const existing = await db
    .select({ c: count() })
    .from(usersTable)
    .where(
      or(
        eq(usersTable.email, "demo@estatefund.com"),
        eq(usersTable.username, "alexj"),
        eq(usersTable.displayId, "100042"),
        eq(usersTable.referralCode, "ALEXJ42"),
      )
    );

  if ((existing[0]?.c ?? 0) > 0) {
    console.log("[seed] Demo user already exists, skipping");
    return;
  }

  const passwordHash = await bcrypt.hash("Demo@12345", 12);

  const inserted = await db
    .insert(usersTable)
    .values({
      displayId: "100042",
      fullName: "Alex Johnson",
      username: "alexj",
      email: "demo@estatefund.com",
      passwordHash,
      referralCode: "ALEXJ42",
      kycStatus: "approved",
      isAdmin: false,
      isVerified: true,
      isActive: true,
      country: "US",
      whatsapp: "+1 555 010 0000",
      whatsappLocked: true,
    })
    .onConflictDoNothing()
    .returning();

  const demo = inserted[0];
  if (!demo) {
    console.log("[seed] Demo user already exists (conflict), skipping");
    return;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  await db.insert(walletsTable).values({
    userId: demo.id,
    balance: "4823.45000000",
    totalDeposited: "10000.00000000",
    totalWithdrawn: "1250.00000000",
    totalEarnings: "3567.89000000",
  });

  await db.insert(walletAddressesTable).values([
    { userId: demo.id, network: "TRC20", address: "TN3W4H6rK2ce4vX9YnFQHwKx7X8rHBdFW" },
    { userId: demo.id, network: "ERC20", address: "0x742d35Cc6634C0532925a3b8D4C9F7f4b62Ee8E" },
    { userId: demo.id, network: "BTC", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
    { userId: demo.id, network: "ETH", address: "0x742d35Cc6634C0532925a3b8D4C9F7f4b62Ee8E" },
    { userId: demo.id, network: "BSC", address: "0x742d35Cc6634C0532925a3b8D4C9F7f4b62Ee8E" },
  ]);

  // Look up current real-estate property names (new catalog)
  const [plan1] = await db
    .select()
    .from(investmentPlansTable)
    .where(eq(investmentPlansTable.name, "Harborview Terrace"))
    .limit(1);

  const [plan2] = await db
    .select()
    .from(investmentPlansTable)
    .where(eq(investmentPlansTable.name, "Cypress Gate Offices"))
    .limit(1);

  if (plan1 && plan2) {
    const end1 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const end2 = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

    await db.insert(userInvestmentsTable).values([
      {
        userId: demo.id,
        planId: plan1.id,
        amount: "2000.00000000",
        pendingEarnings: "142.50000000",
        totalEarned: "1350.00000000",
        dailyReturnRate: "0.027500",
        autoCompound: false,
        status: "active",
        startDate: thirtyDaysAgo,
        endDate: end1,
        lastEarningAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      {
        userId: demo.id,
        planId: plan2.id,
        amount: "5000.00000000",
        pendingEarnings: "390.00000000",
        totalEarned: "2217.89000000",
        dailyReturnRate: "0.028500",
        autoCompound: true,
        status: "active",
        startDate: thirtyDaysAgo,
        endDate: end2,
        lastEarningAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ]);
  }

  await db.insert(transactionsTable).values([
    {
      userId: demo.id,
      type: "deposit",
      amount: "5000.00000000",
      status: "completed",
      network: "TRC20",
      txHash: "abc123def456abc123def456abc123def456abc123def456abc123def456abc1",
      note: "Initial deposit via USDT TRC20",
      createdAt: new Date(thirtyDaysAgo.getTime() + 1 * 60 * 60 * 1000),
    } as any,
    {
      userId: demo.id,
      type: "deposit",
      amount: "5000.00000000",
      status: "completed",
      network: "ERC20",
      txHash: "def789ghi012def789ghi012def789ghi012def789ghi012def789ghi012def7",
      note: "Second deposit via USDT ERC20",
      createdAt: new Date(thirtyDaysAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
    } as any,
    {
      userId: demo.id,
      type: "investment",
      amount: "2000.00000000",
      status: "completed",
      note: `Invested 2000 USDT in Harborview Terrace`,
      createdAt: new Date(thirtyDaysAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
    } as any,
    {
      userId: demo.id,
      type: "investment",
      amount: "5000.00000000",
      status: "completed",
      note: `Invested 5000 USDT in Cypress Gate Offices`,
      createdAt: new Date(thirtyDaysAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
    } as any,
    {
      userId: demo.id,
      type: "earning",
      amount: "55.00000000",
      status: "completed",
      note: "Daily ROI from Harborview Terrace",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    } as any,
    {
      userId: demo.id,
      type: "earning",
      amount: "142.50000000",
      status: "completed",
      note: "Daily ROI from Cypress Gate Offices",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    } as any,
    {
      userId: demo.id,
      type: "withdrawal",
      amount: "1250.00000000",
      fee: "18.75000000",
      status: "completed",
      network: "TRC20",
      address: "TEgkfW7Y8abc123def456",
      note: "Withdrawal via USDT TRC20 (fee: 18.75 USDT)",
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    } as any,
  ]);

  await db.insert(notificationsTable).values([
    {
      userId: demo.id,
      type: "transaction",
      title: "Deposit Confirmed",
      message: "Your deposit of 5000 USDT via TRC20 has been confirmed and credited to your wallet.",
      isRead: true,
    },
    {
      userId: demo.id,
      type: "investment",
      title: "Investment Started",
      message: "Your 2000 USDT investment in Skyline Residences is now active.",
      isRead: true,
    },
    {
      userId: demo.id,
      type: "earning",
      title: "Daily Earnings Credited",
      message: "Daily earnings credited to your Skyline Residences investment.",
      isRead: false,
    },
    {
      userId: demo.id,
      type: "announcement",
      title: "Welcome to EstateFund",
      message: "Thank you for joining EstateFund. Your account is fully verified. Start investing in premium real estate properties today.",
      isRead: false,
    },
  ]);

  console.log("[seed] Demo user seeded ✓ (demo@estatefund.com / Demo@12345)");
}

async function ensureSalarySettings(db: ReturnType<typeof drizzle<typeof schema>>) {
  const defaults = [
    { key: "salary_program_enabled", value: "true" },
    { key: "salary_tier1_volume", value: "1500" },
    { key: "salary_tier1_amount", value: "100" },
    { key: "salary_tier2_volume", value: "3500" },
    { key: "salary_tier2_amount", value: "300" },
    { key: "community_notifications_enabled", value: "true" },
  ];
  for (const s of defaults) {
    await db.insert(platformSettingsTable).values(s).onConflictDoNothing();
  }
  console.log("[seed] Salary settings verified ✓");
}

export async function runSeed(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const { db, pool } = await getDb();

  try {
    await seedInvestmentPlans(db);
    await ensureOpportunities(db);
    await seedDepositNetworks(db);
    await seedPlatformSettings(db);
    await ensureSalarySettings(db);
    await seedNews(db);
    await ensureAdminAccount(db);
    await seedDemoUser(db);
    console.log("[seed] Database seeding complete ✓");
  } finally {
    await pool.end();
  }
}
