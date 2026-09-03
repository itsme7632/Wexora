import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, ArrowRight, MailWarning, RefreshCw, Shield } from "lucide-react";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/AuthLayout";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

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

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const login = useLogin();

  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  function startCooldown() {
    setResendCooldown(60);
    const iv = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(iv); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  const onSubmit = (data: FormData) => {
    setUnverifiedEmail(null);
    login.mutate(
      { data },
      {
        onSuccess: (authResponse: any) => {
          if (authResponse?.user) {
            queryClient.setQueryData(getGetMeQueryKey(), authResponse.user);
          }
          setLocation("/");
        },
        onError: (err: any) => {
          if (err?.error === "email_not_verified" && err?.email) {
            setUnverifiedEmail(err.email);
          } else {
            toast({
              title: "Login failed",
              description: err?.message || "Invalid email or password",
              variant: "destructive",
            });
          }
        },
      }
    );
  };

  async function handleResendVerification() {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await postJson("/api/auth/resend-verification", { email: unverifiedEmail });
      toast({ title: "Verification email sent", description: "Check your inbox for the 6-digit code." });
      setLocation(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
      startCooldown();
    } catch (err: any) {
      if (err?.status === 429) {
        toast({ title: "Please wait", description: "You can only request a new code once per minute.", variant: "destructive" });
        startCooldown();
      } else {
        toast({ title: "Failed to send", description: err?.message ?? "Something went wrong.", variant: "destructive" });
      }
    } finally {
      setResending(false);
    }
  }

  // ── Unverified email state ──────────────────────────────────────────────
  if (unverifiedEmail) {
    return (
      <AuthLayout title="Verify your email" subtitle="Your account needs email verification before you can sign in.">
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
            <MailWarning className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-0.5">Email not verified</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We sent a verification code to <span className="font-medium text-foreground">{unverifiedEmail}</span>.
                Check your inbox or resend the code below.
              </p>
            </div>
          </div>

          <Button
            className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold text-sm rounded-xl"
            disabled={resending || resendCooldown > 0}
            onClick={handleResendVerification}
          >
            {resending ? (
              <span className="flex items-center gap-2"><RefreshCw size={15} className="animate-spin" /> Sending…</span>
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              <span className="flex items-center gap-2">
                <Mail size={15} /> Send verification email
              </span>
            )}
          </Button>

          <button
            onClick={() => setUnverifiedEmail(null)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  // ── Sign In form ────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter your credentials to access your EstateFund portfolio"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-12 bg-muted/30 border-border/60 rounded-xl"
                      data-testid="input-email"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
                  <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-12 bg-muted/30 border-border/60 rounded-xl"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold text-sm rounded-xl active:scale-[0.98] transition-all"
            disabled={login.isPending}
            data-testid="button-submit"
          >
            {login.isPending ? (
              "Signing in…"
            ) : (
              <span className="flex items-center gap-2">
                Sign in <ArrowRight size={16} />
              </span>
            )}
          </Button>
        </form>
      </Form>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-muted-foreground">
        <Shield size={11} />
        <span>Secured with 256-bit encryption</span>
      </div>

      {/* Sign up CTA */}
      <p className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border/50">
        Don't have an account?{" "}
        <Link href="/signup" className="text-primary font-semibold hover:text-primary/80 transition-colors">
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}
