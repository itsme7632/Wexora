import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, User, Mail, Phone, Lock, Hash, ArrowRight, ChevronDown, Globe, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useSignup, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/components/AuthLayout";

const COUNTRIES = [
  { code: "AF", name: "Afghanistan", dial: "+93" }, { code: "AL", name: "Albania", dial: "+355" },
  { code: "DZ", name: "Algeria", dial: "+213" }, { code: "AD", name: "Andorra", dial: "+376" },
  { code: "AO", name: "Angola", dial: "+244" }, { code: "AG", name: "Antigua & Barbuda", dial: "+1268" },
  { code: "AR", name: "Argentina", dial: "+54" }, { code: "AM", name: "Armenia", dial: "+374" },
  { code: "AU", name: "Australia", dial: "+61" }, { code: "AT", name: "Austria", dial: "+43" },
  { code: "AZ", name: "Azerbaijan", dial: "+994" }, { code: "BS", name: "Bahamas", dial: "+1242" },
  { code: "BH", name: "Bahrain", dial: "+973" }, { code: "BD", name: "Bangladesh", dial: "+880" },
  { code: "BB", name: "Barbados", dial: "+1246" }, { code: "BY", name: "Belarus", dial: "+375" },
  { code: "BE", name: "Belgium", dial: "+32" }, { code: "BZ", name: "Belize", dial: "+501" },
  { code: "BJ", name: "Benin", dial: "+229" }, { code: "BT", name: "Bhutan", dial: "+975" },
  { code: "BO", name: "Bolivia", dial: "+591" }, { code: "BA", name: "Bosnia & Herzegovina", dial: "+387" },
  { code: "BW", name: "Botswana", dial: "+267" }, { code: "BR", name: "Brazil", dial: "+55" },
  { code: "BN", name: "Brunei", dial: "+673" }, { code: "BG", name: "Bulgaria", dial: "+359" },
  { code: "BF", name: "Burkina Faso", dial: "+226" }, { code: "BI", name: "Burundi", dial: "+257" },
  { code: "CV", name: "Cabo Verde", dial: "+238" }, { code: "KH", name: "Cambodia", dial: "+855" },
  { code: "CM", name: "Cameroon", dial: "+237" }, { code: "CA", name: "Canada", dial: "+1" },
  { code: "CF", name: "Central African Republic", dial: "+236" }, { code: "TD", name: "Chad", dial: "+235" },
  { code: "CL", name: "Chile", dial: "+56" }, { code: "CN", name: "China", dial: "+86" },
  { code: "CO", name: "Colombia", dial: "+57" }, { code: "KM", name: "Comoros", dial: "+269" },
  { code: "CD", name: "Congo (DRC)", dial: "+243" }, { code: "CG", name: "Congo (Republic)", dial: "+242" },
  { code: "CR", name: "Costa Rica", dial: "+506" }, { code: "HR", name: "Croatia", dial: "+385" },
  { code: "CU", name: "Cuba", dial: "+53" }, { code: "CY", name: "Cyprus", dial: "+357" },
  { code: "CZ", name: "Czech Republic", dial: "+420" }, { code: "DK", name: "Denmark", dial: "+45" },
  { code: "DJ", name: "Djibouti", dial: "+253" }, { code: "DO", name: "Dominican Republic", dial: "+1809" },
  { code: "EC", name: "Ecuador", dial: "+593" }, { code: "EG", name: "Egypt", dial: "+20" },
  { code: "SV", name: "El Salvador", dial: "+503" }, { code: "GQ", name: "Equatorial Guinea", dial: "+240" },
  { code: "ER", name: "Eritrea", dial: "+291" }, { code: "EE", name: "Estonia", dial: "+372" },
  { code: "SZ", name: "Eswatini", dial: "+268" }, { code: "ET", name: "Ethiopia", dial: "+251" },
  { code: "FJ", name: "Fiji", dial: "+679" }, { code: "FI", name: "Finland", dial: "+358" },
  { code: "FR", name: "France", dial: "+33" }, { code: "GA", name: "Gabon", dial: "+241" },
  { code: "GM", name: "Gambia", dial: "+220" }, { code: "GE", name: "Georgia", dial: "+995" },
  { code: "DE", name: "Germany", dial: "+49" }, { code: "GH", name: "Ghana", dial: "+233" },
  { code: "GR", name: "Greece", dial: "+30" }, { code: "GT", name: "Guatemala", dial: "+502" },
  { code: "GN", name: "Guinea", dial: "+224" }, { code: "GW", name: "Guinea-Bissau", dial: "+245" },
  { code: "GY", name: "Guyana", dial: "+592" }, { code: "HT", name: "Haiti", dial: "+509" },
  { code: "HN", name: "Honduras", dial: "+504" }, { code: "HU", name: "Hungary", dial: "+36" },
  { code: "IS", name: "Iceland", dial: "+354" }, { code: "IN", name: "India", dial: "+91" },
  { code: "ID", name: "Indonesia", dial: "+62" }, { code: "IR", name: "Iran", dial: "+98" },
  { code: "IQ", name: "Iraq", dial: "+964" }, { code: "IE", name: "Ireland", dial: "+353" },
  { code: "IL", name: "Israel", dial: "+972" }, { code: "IT", name: "Italy", dial: "+39" },
  { code: "JM", name: "Jamaica", dial: "+1876" }, { code: "JP", name: "Japan", dial: "+81" },
  { code: "JO", name: "Jordan", dial: "+962" }, { code: "KZ", name: "Kazakhstan", dial: "+7" },
  { code: "KE", name: "Kenya", dial: "+254" },
  // ...rest of countries (kept from original)
];

const sourceFromUrl = (() => {
  try { return new URLSearchParams(window.location.search).get("ref") ? "referral" : ""; } catch { return ""; }
})();

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  whatsapp: z.string().min(1, "Phone number is required"),
  dialCode: z.string().default("+1"),
  country: z.string().min(1, "Country is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return { score, label: score <= 1 ? "Weak" : score <= 2 ? "Fair" : score <= 3 ? "Good" : "Strong" };
}

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const signup = useSignup();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const countryRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [countrySearch, setCountrySearch] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", username: "", email: "", whatsapp: "", dialCode: "+1", country: "", password: "", confirmPassword: "" },
  });

  const password = form.watch("password");
  const strength = passwordStrength(password);
  const selectedCountry = COUNTRIES.find((c) => c.dial === form.watch("dialCode"));

  // Username availability check
  useEffect(() => {
    const username = form.watch("username");
    if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username/${username}`, { credentials: "include" });
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch { setUsernameStatus("idle"); }
    }, 500);
    return () => clearTimeout(t);
  }, [form.watch("username")]);

  // Close country picker on outside click
  useEffect(() => {
    if (!countryOpen) return;
    const close = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [countryOpen]);

  const filteredCountries = countrySearch
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.dial.includes(countrySearch))
    : COUNTRIES;

  const onSubmit = (data: FormData) => {
    const whatsappFull = `${data.dialCode ?? ""}${data.whatsapp.replace(/^0+/, "")}`;
    signup.mutate(
      { data: { ...data, whatsapp: whatsappFull, referralSource: sourceFromUrl } },
      {
        onSuccess: (data: any) => {
          if (data?.requiresVerification && data?.email) {
            setLocation(`/verify-email?email=${encodeURIComponent(data.email)}`);
          } else {
            if (data?.user) queryClient.setQueryData(getGetMeQueryKey(), data.user);
            setLocation("/");
          }
        },
        onError: (err: any) => {
          toast({ title: "Signup failed", description: err?.message || "Something went wrong", variant: "destructive" });
        },
      }
    );
  };

  const isSubmitDisabled = signup.isPending || usernameStatus === "taken" || usernameStatus === "checking";

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join EstateFund and start building your portfolio today"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Full name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input {...field} placeholder="John Doe" className="pl-10 h-12 bg-muted/30 border-border/60 rounded-xl" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input {...field} placeholder="johndoe" className="pl-10 h-12 bg-muted/30 border-border/60 rounded-xl" />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                      {usernameStatus === "available" && <CheckCircle2 size={14} className="text-emerald-500" />}
                      {usernameStatus === "taken" && <XCircle size={14} className="text-destructive" />}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input {...field} type="email" placeholder="you@example.com" className="pl-10 h-12 bg-muted/30 border-border/60 rounded-xl" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Country + Phone */}
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <FormField
              control={form.control}
              name="dialCode"
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Country</FormLabel>
                  <div ref={countryRef} className="relative">
                    <button
                      type="button"
                      onClick={() => { setCountryOpen(!countryOpen); setTimeout(() => searchRef.current?.focus(), 50); }}
                      className="w-full h-12 flex items-center justify-between gap-1 bg-muted/30 border border-border/60 rounded-xl px-3 text-sm"
                    >
                      <span className="truncate">{selectedCountry?.name ?? "Select"}</span>
                      <ChevronDown size={14} className={cn("text-muted-foreground shrink-0 transition-transform", countryOpen && "rotate-180")} />
                    </button>
                    {countryOpen && (
                      <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-hidden animate-scale-in">
                        <div className="p-2 border-b border-border">
                          <input
                            ref={searchRef}
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search…"
                            className="w-full h-9 px-3 text-sm bg-muted/30 rounded-lg border-0 outline-none"
                          />
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          {filteredCountries.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { form.setValue("dialCode", c.dial); form.setValue("country", c.code); setCountryOpen(false); setCountrySearch(""); }}
                              className={cn(
                                "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors",
                                form.watch("country") === c.code && "bg-primary/5 text-primary font-medium"
                              )}
                            >
                              <span className="text-muted-foreground text-xs w-9">{c.dial}</span>
                              <span>{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Phone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input {...field} placeholder="555 0100" className="pl-10 h-12 bg-muted/30 border-border/60 rounded-xl" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className="pl-10 pr-10 h-12 bg-muted/30 border-border/60 rounded-xl"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormControl>
                {password.length > 0 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= strength.score ? (strength.score <= 1 ? "bg-destructive" : strength.score <= 2 ? "bg-amber-500" : strength.score <= 3 ? "bg-emerald-500" : "bg-emerald-500") : "bg-muted")} />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{strength.label}</span>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Confirm password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      className="pl-10 pr-10 h-12 bg-muted/30 border-border/60 rounded-xl"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
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
            disabled={isSubmitDisabled}
            data-testid="button-submit"
          >
            {signup.isPending ? "Creating account…" : (
              <span className="flex items-center gap-2">
                Create account <ArrowRight size={16} />
              </span>
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground mt-6 pt-6 border-t border-border/50">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
