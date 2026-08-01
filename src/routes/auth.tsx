import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CampusOS" },
      {
        name: "description",
        content: "Sign in to CampusOS to manage admissions, academics and campus operations.",
      },
      { property: "og:title", content: "Sign in — CampusOS" },
      {
        property: "og:description",
        content: "Secure access to your college workspace on CampusOS.",
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

function GoogleButton({ disabled }: { disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled}
      onClick={() =>
        void supabase.auth
          .signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin },
          })
          .then(({ error }) => {
            if (error) toast.error(error.message);
          })
      }
    >
      Continue with Google
    </Button>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [session, loading, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) return setError(parsedEmail.error.issues[0]!.message);

    if (mode !== "forgot") {
      const parsedPassword = passwordSchema.safeParse(password);
      if (!parsedPassword.success) return setError(parsedPassword.error.issues[0]!.message);
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsedEmail.data,
          password,
        });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsedEmail.data,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() || undefined },
          },
        });
        if (error) throw error;
        if (!data.session) setSent("confirm");
        else navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
      }
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r bg-muted/30 p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <span className="text-lg font-semibold">CampusOS</span>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight">
            One workspace for the whole institution
          </h2>
          <p className="text-sm text-muted-foreground">
            Admissions, student records, academics, documents, approvals and analytics — with
            multi-campus support, granular permissions and a complete audit trail.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Row level security protects every record in your college workspace.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-4" />
              </div>
              <span className="font-semibold">CampusOS</span>
            </div>
          </div>

          {sent ? (
            <div className="space-y-4 rounded-xl border bg-card p-6 text-center">
              <h1 className="text-lg font-semibold">
                {sent === "confirm" ? "Confirm your email" : "Check your inbox"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {sent === "confirm"
                  ? `We sent a confirmation link to ${email}. Click it to activate your account.`
                  : `We sent a password reset link to ${email}.`}
              </p>
              <Button variant="outline" className="w-full" onClick={() => setSent(null)}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <Tabs
                value={mode === "forgot" ? "signin" : mode}
                onValueChange={(value) => setMode(value as "signin" | "signup")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="pt-6">
                  <h1 className="text-xl font-semibold tracking-tight">
                    {mode === "forgot" ? "Reset your password" : "Welcome back"}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode === "forgot"
                      ? "We'll email you a secure link to choose a new password."
                      : "Sign in to your college workspace."}
                  </p>
                </TabsContent>

                <TabsContent value="signup" className="pt-6">
                  <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started with the CampusOS demo college workspace.
                  </p>
                </TabsContent>
              </Tabs>

              <form className="space-y-4" onSubmit={submit}>
                {mode === "signup" ? (
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Asha Menon"
                      autoComplete="name"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@college.edu"
                    autoComplete="email"
                    required
                  />
                </div>

                {mode !== "forgot" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "signin" ? (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => setMode("forgot")}
                        >
                          Forgot password?
                        </button>
                      ) : null}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                    />
                  </div>
                ) : null}

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  {mode === "signin"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Create account"
                      : "Send reset link"}
                </Button>

                {mode === "forgot" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setMode("signin")}
                  >
                    Back to sign in
                  </Button>
                ) : (
                  <>
                    <div className="relative py-1 text-center">
                      <span className="relative z-10 bg-background px-2 text-xs text-muted-foreground">
                        or
                      </span>
                      <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
                    </div>
                    <GoogleButton disabled={busy} />
                  </>
                )}
              </form>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">
              Back to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
