import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Shield } from "lucide-react";
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

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();

  const token = (() => {
    try { return new URLSearchParams(window.location.search).get("token") ?? ""; } catch { return ""; }
  })();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <AuthLayout title="Invalid reset link" subtitle="This password reset link is missing or invalid">
        <div className="space-y-5">
          <div className="w-14 h-14 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Please request a new password reset link.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold text-sm rounded-xl">Request new link</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Password reset complete" subtitle="Your password has been updated successfully">
        <div className="space-y-5">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            You can now sign in with your new password.
          </p>
          <Button onClick={() => setLocation("/login")} className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold text-sm rounded-xl active:scale-[0.98] transition-all">
            <span className="flex items-center gap-2">Sign in <ArrowRight size={16} /></span>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    try {
      await postJson("/api/auth/reset-password", { token, password, confirmPassword: confirm });
      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? "Reset link is invalid or expired. Please request a new one.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">New password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
              placeholder="Min. 8 characters"
              className="pl-10 pr-10 h-12 bg-muted/30 border-border/60 rounded-xl"
              autoFocus
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Confirm password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); if (error) setError(""); }}
              placeholder="Repeat your password"
              className="pl-10 pr-10 h-12 bg-muted/30 border-border/60 rounded-xl"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-destructive/8 border border-destructive/20 rounded-xl px-3.5 py-2.5">
            <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold text-sm rounded-xl active:scale-[0.98] transition-all"
        >
          {loading ? "Updating…" : (
            <span className="flex items-center gap-2">Reset Password <ArrowRight size={16} /></span>
          )}
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Shield size={11} />
          <span>Passwords are encrypted and stored securely</span>
        </div>

        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border/50">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
