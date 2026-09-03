import { ReactNode } from "react";
import { Link } from "wouter";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Wexora V2 Authentication Layout
 *
 * Desktop: Two-panel layout — left branding panel with Wexora identity, right form panel
 * Mobile: Full-width with compact brand header + form below
 */
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left Branding Panel (desktop only) ─────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] wexora-gradient relative overflow-hidden">
        <div className="flex flex-col justify-between p-10 xl:p-14 w-full relative z-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <span className="text-white font-bold text-base">EF</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">EstateFund</span>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <h2 className="text-white text-3xl xl:text-4xl font-bold tracking-tight leading-tight mb-4">
              Your wealth,
              <br />
              managed with
              <br />
              precision.
            </h2>
            <p className="text-blue-100/70 text-sm leading-relaxed max-w-sm">
              Access premium real estate investment opportunities, track your portfolio in real-time, 
              and grow your wealth with EstateFund's institutional-grade platform.
            </p>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 mt-8">
              {[
                { value: "256-bit", label: "Encryption" },
                { value: "24/7", label: "Monitoring" },
                { value: "Licensed", label: "Platform" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-white font-bold text-sm">{value}</p>
                  <p className="text-blue-100/50 text-[11px]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-blue-100/30 text-[11px]">
            © {new Date().getFullYear()} EstateFund. All rights reserved.
          </p>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-white/3 rounded-full" />
      </div>

      {/* ── Right Form Panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile brand header */}
        <div className="lg:hidden px-5 pt-6 pb-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">EF</span>
            </div>
            <span className="text-foreground font-bold text-base">EstateFund</span>
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-md mx-auto">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{subtitle}</p>
              )}
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
