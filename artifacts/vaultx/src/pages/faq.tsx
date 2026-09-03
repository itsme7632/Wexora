import { useState } from "react";
import { ChevronDown, HelpCircle, Search, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FaqItem[] = [
  // General
  { id: "what", question: "What is EstateFund?", answer: "EstateFund is a real estate investment platform that provides access to professionally presented property opportunities across residential, commercial, hospitality and mixed-use categories.", category: "General" },
  { id: "how-start", question: "How do I start investing?", answer: "Create an account, complete KYC verification, fund your wallet with USDT, then browse available properties and choose your investment. You can track your investment and earnings from your portfolio dashboard.", category: "General" },
  { id: "min-invest", question: "What is the minimum investment?", answer: "Each property has its own minimum investment amount, displayed on the property listing and detail page. You must invest at least the minimum amount to participate in that property.", category: "General" },

  // Investments
  { id: "funding-deadline", question: "What does the funding deadline mean?", answer: "The funding deadline is the date by which new investments can be accepted for a property. It indicates the window for new investor participation — it does not affect the duration of existing investments.", category: "Investments" },
  { id: "deadline-vs-maturity", question: "Does my investment end when the funding deadline expires?", answer: "No. Your personal investment runs for its full configured investment duration from your individual start date. The funding deadline only determines when new investments can be accepted for that property.", category: "Investments" },
  { id: "how-long", question: "How long does an investment run?", answer: "Each property has a configured investment duration (e.g., 180 days, 365 days). This duration determines how long your investment runs from its start date to maturity.", category: "Investments" },
  { id: "start-date", question: "When does my personal investment start?", answer: "Your personal investment starts on its configured start date, which is set when you confirm your investment. This may differ from the property's listing date or funding deadline.", category: "Investments" },
  { id: "maturity", question: "When does my investment mature?", answer: "Your investment matures on its configured end date, which is your individual start date plus the property's investment duration. You can view this date on your portfolio page.", category: "Investments" },
  { id: "returns", question: "How are earnings calculated?", answer: "Earnings are calculated daily based on your invested amount and the configured return rate for the property. Each property displays a projected return range (e.g., 0.8%–1.4% daily). The actual rate is determined by the platform's configured calculation logic.", category: "Investments" },
  { id: "pending", question: "What are pending earnings?", answer: "Pending earnings are returns that have accrued on your active investment but have not yet been credited or claimed. You can view your pending earnings in real time on your portfolio page.", category: "Investments" },
  { id: "after-maturity", question: "What happens when my investment reaches maturity?", answer: "When your investment reaches its maturity date, the investment term ends. The handling of matured investments depends on the platform's configured settlement process for each property.", category: "Investments" },

  // Account
  { id: "withdraw", question: "Can I withdraw my available wallet balance?", answer: "Yes. You can withdraw your available wallet balance at any time, subject to KYC verification requirements and any applicable withdrawal terms. Navigate to the Withdraw section to initiate a withdrawal.", category: "Account" },
  { id: "kyc", question: "Why is KYC verification required?", answer: "KYC (Know Your Customer) verification helps EstateFund comply with identity verification requirements and protects your account. Some features, such as withdrawals, may require completed KYC verification.", category: "Account" },
  { id: "2fa", question: "How do I enable two-factor authentication (2FA)?", answer: "Navigate to Security in your profile settings and follow the steps to set up 2FA using an authenticator app. This adds an extra layer of security to your account.", category: "Account" },

  // Funding
  { id: "fund-wallet", question: "How do I fund my wallet?", answer: "Navigate to the Deposit section, select the supported network (USDT on BNB Smart Chain), copy the wallet address, and send your USDT deposit. Your wallet will be credited after network confirmation.", category: "Funding" },
  { id: "network", question: "Which network is supported for USDT deposits?", answer: "EstateFund currently supports USDT deposits on the BNB Smart Chain (BSC) network. Ensure you send USDT via the correct network to avoid loss of funds.", category: "Funding" },
  { id: "compatible-wallet", question: "Can I use a compatible exchange or wallet to send USDT?", answer: "Yes. You can send USDT from any compatible crypto wallet or exchange that supports USDT on the BNB Smart Chain (BSC) network. Always verify the network before sending.", category: "Funding" },
  { id: "deposit-time", question: "How long do deposits take?", answer: "Deposits are credited after sufficient network confirmations on the BNB Smart Chain. This typically takes a few minutes, depending on network conditions.", category: "Funding" },
];

const CATEGORIES = ["General", "Investments", "Account", "Funding"];

function AccordionItem({ faq, isOpen, onToggle }: { faq: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl overflow-hidden transition-all", isOpen && "ring-1 ring-primary/20")}>
      <button onClick={onToggle} className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-muted/20 transition-colors">
        <span className="text-sm font-medium text-foreground leading-snug flex-1">{faq.question}</span>
        <ChevronDown size={16} className={cn("text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200", isOpen && "rotate-180 text-primary")} />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [, setLocation] = useLocation();

  const filtered = FAQ_DATA.filter(f => {
    const matchesSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const grouped: Record<string, FaqItem[]> = {};
  for (const faq of filtered) {
    if (!grouped[faq.category]) grouped[faq.category] = [];
    grouped[faq.category].push(faq);
  }

  return (
    <AppLayout title="FAQ — EstateFund">
      <div className="max-w-2xl mx-auto px-4 py-5 lg:px-8 pb-24 space-y-5">

        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <HelpCircle size={18} />
            </div>
            <div>
              <h1 className="font-bold text-base">Help Center</h1>
              <p className="text-[11px] text-white/40 mt-0.5">Find answers to common questions about EstateFund</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Content */}
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <HelpCircle size={28} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-foreground">No matching questions</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search term or category</p>
          </div>
        ) : (
          <div className="space-y-6">
            {CATEGORIES.filter(c => grouped[c]?.length > 0).map(category => (
              <div key={category} className="space-y-2.5">
                <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] px-1">{category}</h2>
                <div className="space-y-2">
                  {grouped[category].map(faq => (
                    <AccordionItem
                      key={faq.id}
                      faq={faq}
                      isOpen={openId === faq.id}
                      onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-foreground mb-1">Still have questions?</p>
          <p className="text-xs text-muted-foreground mb-3">Contact our support team for personalized assistance.</p>
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5" onClick={() => setLocation("/support")}>
            Contact Support <ArrowRight size={12} />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
