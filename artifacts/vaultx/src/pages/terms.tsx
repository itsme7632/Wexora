import { useQuery } from "@tanstack/react-query";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { SubPageLayout } from "@/components/SubPageLayout";

export default function TermsPage() {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: () => fetch("/api/settings/public", { credentials: "include" }).then(r => r.json()), staleTime: 120000 });
  const termsText = settings?.terms_of_service ?? "";

  const sections = termsText.split("\n\n").filter((s: string) => s.trim()).map((section: string) => {
    const lines = section.split("\n");
    const title = lines[0].replace(/^#+\s*/, "").replace(/^\*?\*?/, "").replace(/\*?\*?$/, "");
    const body = lines.slice(1).join("\n").trim();
    return { title, body };
  }).filter((s: { title: string; body: string }) => s.title && s.body);

  return (
    <SubPageLayout title="Terms of Service">
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
        {/* Header */}
        <div className="v3-gradient rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm"><FileText size={18} /></div>
            <div>
              <h2 className="font-bold text-base">Terms of Service</h2>
              <p className="text-[11px] text-white/40 mt-0.5">Please read carefully before using Wexora</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {sections.length > 0 ? (
          <div className="space-y-2.5">
            {sections.map((section: { title: string; body: string }, i: number) => {
              const isExpanded = expandedSection === i;
              return (
                <div key={i} className="v3-card overflow-hidden">
                  <button onClick={() => setExpandedSection(isExpanded ? null : i)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/20 transition-colors">
                    <p className="text-sm font-semibold text-foreground">{section.title}</p>
                    {isExpanded ? <ChevronUp size={15} className="text-muted-foreground shrink-0" /> : <ChevronDown size={15} className="text-muted-foreground shrink-0" />}
                  </button>
                  {isExpanded && <div className="border-t border-border/50 px-5 py-4"><p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p></div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="v3-card p-10 text-center">
            <FileText size={24} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Terms of service not yet configured.</p>
          </div>
        )}
      </div>
    </SubPageLayout>
  );
}
