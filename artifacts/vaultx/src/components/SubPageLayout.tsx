import { ReactNode, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { DesktopSidebar, MobileSidebar } from "@/components/Sidebar";

interface SubPageLayoutProps {
  children: ReactNode;
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
  noPadding?: boolean;
}

export function SubPageLayout({ children, title, onBack, actions, noPadding }: SubPageLayoutProps) {
  const handleBack = onBack ?? (() => window.history.back());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleMenuClose = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (shared with AppLayout) */}
      <DesktopSidebar />
      <MobileSidebar open={mobileMenuOpen} onClose={handleMenuClose} />

      <div className="lg:pl-[260px] min-h-screen flex flex-col">
        {/* Custom sub-page header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/60 shrink-0">
          <div className="h-14 flex items-center gap-3 max-w-5xl mx-auto px-4 lg:px-8">
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center shrink-0 active:scale-95 transition-all duration-150"
              aria-label="Go back"
            >
              <ArrowLeft size={16} strokeWidth={2} className="text-foreground/80" />
            </button>
            <h1 className="font-semibold text-[15px] text-foreground flex-1 truncate">{title}</h1>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        </div>

        <main className="flex-1 w-full">
          {noPadding ? (
            children
          ) : (
            <div className="max-w-5xl mx-auto px-4 py-5 lg:px-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
