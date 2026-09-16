import { ReactNode, useState, useCallback } from "react";
import { TopBar } from "@/components/TopBar";
import { DesktopSidebar, MobileSidebar } from "@/components/Sidebar";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  noPad?: boolean;
  /** Allow children to break out of the content padding for full-width layouts */
  fullBleed?: boolean;
}

export function AppLayout({ children, fullBleed }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleMenuClose = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <MobileSidebar open={mobileMenuOpen} onClose={handleMenuClose} />

      <div className="lg:pl-[260px] min-h-screen flex flex-col">
        <TopBar onMenuOpen={() => setMobileMenuOpen(true)} />

        <main className="flex-1 w-full">
          {fullBleed ? (
            children
          ) : (
            <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
