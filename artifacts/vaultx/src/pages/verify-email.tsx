import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Mail, RefreshCw, ArrowRight, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/components/AuthLayout";

async function postJson(url: string, body: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const email = (() => {
    try { return new URLSearchParams(window.location.search).get("email") ?? ""; } catch { return ""; }
  })();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  function startCooldown() {
    setCooldown(60);
    timerRef.current = setInterval(() => {
      setCooldown((c) => { if (c <= 1) { clearInterval(timerRef.current!); return 0; } return c - 1; });
    }, 1000);
  }

  async function handleVerify() {
    if (!code.trim() || code.length < 6) { setError("Please enter the 6-digit code"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await postJson("/api/auth/verify-email", { email, code: code.trim() });
      setSuccess(true);
      if (data?.user) queryClient.setQueryData(getGetMeQueryKey(), data.user);
      setTimeout(() => setLocation("/"), 1500);
    } catch (err: any) {
      setError(err?.message ?? "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    try {
      await postJson("/api/auth/resend-verification", { email });
      toast({ title: "Code sent", description: "A new verification code has been sent to your email." });
      startCooldown();
    } catch (err: any) {
      if (err?.status === 429) {
        toast({ title: "Please wait", description: "You can only request a new code once per minute.", variant: "destructive" });
        startCooldown();
      } else {
        toast({ title: "Failed to resend", description: err?.message ?? "Something went wrong.", variant: "destructive" });
      }
    } finally {
      setResending(false);
    }
  }

  if (success) {
    return (
      <AuthLayout title="Email verified!" subtitle="Redirecting you to your dashboard…">
        <div className="space-y-5">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Welcome to Wexora Global</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email ? email : "your email address"}`}
    >
      <div className="space-y-5">
        {/* Mail icon */}
        <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7 text-primary" />
        </div>

        {/* Code input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Verification code</label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); if (error) setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
            placeholder="000000"
            className="h-14 text-center text-2xl font-bold tracking-[0.3em] bg-muted/30 border-border/60 rounded-xl"
            autoFocus
          />
          {error && (
            <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Verify button */}
        <Button
          onClick={handleVerify}
          disabled={loading || code.length < 6}
          className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold text-sm rounded-xl active:scale-[0.98] transition-all"
        >
          {loading ? "Verifying…" : (
            <span className="flex items-center gap-2">Verify Email <ArrowRight size={16} /></span>
          )}
        </Button>

        {/* Resend */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <p className="text-xs text-muted-foreground">Didn't receive it? Check spam or</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={cooldown > 0 || resending}
            onClick={handleResend}
            className="h-8 text-xs text-primary hover:text-primary gap-1.5"
          >
            <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
            {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? "Sending…" : "Resend code"}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Shield size={11} />
          <span>Secure verification</span>
        </div>

        <p className="text-center text-xs text-muted-foreground pt-2 border-t border-border/50">
          Wrong email?{" "}
          <a href="/signup" className="text-primary font-medium hover:text-primary/80">Sign up again</a>
        </p>
      </div>
    </AuthLayout>
  );
}
