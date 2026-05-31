import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";

function safeRedirect(value: string | undefined): string {
  if (!value) return "/today";
  try {
    // Decode in case of double-encoding, then take only the path/search.
    let decoded = value;
    for (let i = 0; i < 5 && decoded.includes("%2F"); i++) {
      decoded = decodeURIComponent(decoded);
    }
    if (!decoded.startsWith("/")) return "/today";
    if (decoded.startsWith("/login")) return "/today";
    return decoded;
  } catch {
    return "/today";
  }
}

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Sign in — VVCLab" }] }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  // If the session is already valid when the user hits /login, send them on.
  // This breaks any stale ?redirect=... loop they may have landed in.
  useEffect(() => {
    if (!auth.isAppReady || !auth.userId) return;
    const dest = safeRedirect(search.redirect);
    navigate({ to: dest, replace: true });
  }, [auth.isAppReady, auth.userId, search.redirect, navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let stored: string | null = null;
    let lastEmail: string | null = null;
    try {
      stored = localStorage.getItem("auth.remember");
      lastEmail = localStorage.getItem("auth.lastEmail");
    } catch {
      /* ignore */
    }
    if (stored === "0") setRemember(false);
    if (lastEmail) setEmail(lastEmail);
  }, []);

  function persistRememberPrefs(currentEmail: string) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("auth.remember", remember ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (remember && currentEmail) {
      try {
        localStorage.setItem("auth.lastEmail", currentEmail);
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.removeItem("auth.lastEmail");
      } catch {
        /* ignore */
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    persistRememberPrefs(email);
    await router.invalidate();
    navigate({ to: safeRedirect(search.redirect), replace: true });
  }



  async function handleGoogle() {
    setGoogleLoading(true);
    // Stash the preference now; OAuth round-trip leaves the page so we can't
    // wait for success. The email will be filled in by Supabase's user record
    // on the next visit only if the user signs in successfully.
    persistRememberPrefs(email);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/today" },
    });
    if (error) {
      setGoogleLoading(false);
      toast.error(error.message);
    }
  }


  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your VVCLab account.">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
      >
        {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Continue with Google
      </Button>
      <Divider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
          />
          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
            Remember me
          </Label>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-foreground hover:underline">
          Get started
        </Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            VVCLab
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      <span>or</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
