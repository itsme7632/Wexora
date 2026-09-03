import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Mail, ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    setLoading(true);
    setError("");
    try {
      await postJson("/api/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={sent ? "We've sent a reset link to your email address" : "Enter your email and we'll send you a password reset link"}
    >
      {sent ? (
        <div className="space-y-5">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              If an account exists for <span className="font-medium text-foreground">{email}</span>, you'll
              receive a password reset link shortly. The link expires in 30 minutes.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setSent(false)}
              className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold text-sm rounded-xl"
            >
              <span className="flex items-center gap-2">Send another link <ArrowRight size={16} /></span>
            </Button>

            <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                placeholder="you@example.com"
                className="pl-10 h-12 bg-muted/30 border-border/60 rounded-xl"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold text-sm rounded-xl active:scale-[0.98] transition-all"
          >
            {loading ? "Sending…" : (
              <span className="flex items-center gap-2">Send reset link <ArrowRight size={16} /></span>
            )}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Shield size={11} />
            <span>Secure password reset</span>
          </div>

          <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border/50">
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
