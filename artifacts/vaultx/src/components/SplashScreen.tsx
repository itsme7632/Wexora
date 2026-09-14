import { useState, useEffect, useCallback } from "react";

interface SplashScreenProps {
  onFadeStart: () => void;
  onComplete: () => void;
}

export function SplashScreen({ onFadeStart, onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "fade">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => { setPhase("fade"); onFadeStart(); }, 1400);
    const t3 = setTimeout(onComplete, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFadeStart, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0f2042 50%, #0a1628 100%)",
        opacity: phase === "fade" ? 0 : 1,
        transition: "opacity 0.4s ease-out",
      }}
    >
      {/* Logo mark */}
      <div
        className="mb-4"
        style={{
          transform: phase === "enter" ? "scale(0.8)" : "scale(1)",
          opacity: phase === "enter" ? 0 : 1,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20" style={{ background: "linear-gradient(135deg, #34d399 0%, #10b981 55%, #047857 100%)" }}>
          <span className="text-white font-black text-2xl">EF</span>
        </div>
      </div>

      {/* Brand name */}
      <h1
        className="text-white text-xl font-bold tracking-tight"
        style={{
          transform: phase === "enter" ? "translateY(8px)" : "translateY(0)",
          opacity: phase === "enter" ? 0 : 1,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s",
        }}
      >
        EstateFund
      </h1>

      {/* Subtitle */}
      <p
        className="text-blue-300/60 text-xs font-medium tracking-widest uppercase mt-1.5"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transition: "opacity 0.4s ease 0.3s",
        }}
      >
        Real Estate Investments
      </p>
    </div>
  );
}
