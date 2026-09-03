import { useState, useEffect, useCallback } from "react";
import {
  useAdminGetAnalytics, getAdminGetAnalyticsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminNav, AdminMobileNav } from "./Navigation";
import OverviewSection from "./Overview";
import UsersSection from "./Users";
import FinanceSection from "./Finance";
import InvestmentsSection from "./Investments";
import VerificationSection from "./Verification";
import ContentSection from "./Content";
import SettingsSection from "./Settings";
import InfrastructureSection from "./Infrastructure";
import type { AdminSection } from "./utils";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<AdminSection>("overview");
  const [financeTab, setFinanceTab] = useState<"deposits" | "withdrawals" | "tickets" | "broadcast">("deposits");
  const [contentTab, setContentTab] = useState<"news" | "faq" | "announcements">("news");

  // Fetch analytics for pending counts in sidebar badges
  const { data: analytics } = useAdminGetAnalytics({
    query: { queryKey: getAdminGetAnalyticsQueryKey(), staleTime: 15000 },
  });

  const pendingCounts = {
    deposits: (analytics as any)?.pendingDeposits ?? 0,
    withdrawals: analytics?.pendingWithdrawals ?? 0,
    kyc: analytics?.pendingKyc ?? 0,
    tickets: 0, // Will be populated if needed
  };

  const handleNavigate = useCallback((s: AdminSection) => {
    setSection(s);
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <AdminNav
        active={section}
        onNavigate={handleNavigate}
        pendingCounts={pendingCounts}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 lg:ml-0 pb-20 lg:pb-6">
        <div className="px-4 pt-4 lg:px-6 lg:pt-6 max-w-5xl">
          {section === "overview" && <OverviewSection onNavigate={handleNavigate} />}
          {section === "users" && <UsersSection />}
          {section === "finance" && <FinanceSection subTab={financeTab} onSubTabChange={setFinanceTab} />}
          {section === "investments" && <InvestmentsSection />}
          {section === "verification" && <VerificationSection />}
          {section === "content" && <ContentSection subTab={contentTab} onSubTabChange={setContentTab} />}
          {section === "settings" && <SettingsSection />}
          {section === "infrastructure" && <InfrastructureSection />}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <AdminMobileNav
        active={section}
        onNavigate={handleNavigate}
        pendingCounts={pendingCounts}
      />
    </div>
  );
}
