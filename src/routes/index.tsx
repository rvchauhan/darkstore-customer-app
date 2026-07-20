import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { signIn, signUp, useSession } from "@/lib/session";
import { ApiError } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (session) navigate({ to: "/home" });
  }, [session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp({ name, email, password });
      }
      navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleDemoLogin() {
    setBusy(true);
    try {
      await signIn("customer@qcommerce.io", "abcd123");
      navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Demo login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-zinc-200 blur-[120px]" />
      </div>

      <main className="relative z-10 w-full max-w-[440px] px-6 py-12">
        <div className="rounded-xl border border-outline-variant/30 bg-surface p-8 shadow-lg md:p-10">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[32px] text-white">bolt</span>
            </div>
            <h1 className="text-2xl font-bold text-primary">Velocity Commerce</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              {mode === "login" ? "Sign in to your account" : "Create your account"}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  className="mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                className="mt-1.5"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                className="mt-1.5"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "register" ? 8 : undefined}
              />
            </div>
            <Button className="w-full" size="lg" type="submit" disabled={busy}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 w-full cursor-pointer text-center text-xs font-semibold text-primary hover:underline"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>

          <div className="relative my-6 flex items-center justify-center">
            <div className="flex-grow border-t border-outline-variant/30" />
            <span className="mx-4 text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
              or
            </span>
            <div className="flex-grow border-t border-outline-variant/30" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleDemoLogin} disabled={busy}>
            Continue with demo account
          </Button>
        </div>
      </main>

      <footer className="relative z-10 mt-auto w-full border-t border-outline-variant/30 bg-surface-container-low/50 px-6 py-8 text-center">
        <p className="text-sm text-on-surface-variant">
          © 2026 Velocity Commerce. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
