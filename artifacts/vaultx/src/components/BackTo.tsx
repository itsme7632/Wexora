import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface BackToProps {
  /** Explicit parent route the button navigates to (not history.back()). */
  to: string;
  label?: string;
  className?: string;
}

/**
 * Consistent top-of-page back navigation for child pages.
 * Uses an explicit parent route so it works even when the page is opened directly.
 */
export function BackTo({ to, label = "Back", className }: BackToProps) {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation(to)}
      className={cn(
        "inline-flex items-center gap-1.5 min-h-[36px] px-2.5 -ml-2.5 rounded-lg",
        "text-xs font-semibold text-muted-foreground hover:text-foreground",
        "hover:bg-muted/60 active:scale-[0.98] transition-all duration-150",
        className,
      )}
      aria-label={`Back to ${label}`}
    >
      <ArrowLeft size={14} strokeWidth={2.2} />
      <span>{label}</span>
    </button>
  );
}
