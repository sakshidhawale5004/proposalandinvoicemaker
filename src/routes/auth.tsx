import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useBrand } from "@/lib/brand";
import { Mail, Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Vinshare" },
      { name: "description", content: "Sign in to Vinshare to manage invoices, proposals, and clients across all your devices." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { brand } = useBrand();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    apiFetch<{ user: any }>("auth.php?action=session")
      .then(({ user }) => {
        if (user) navigate({ to: "/dashboard", replace: true });
      })
      .catch(() => { /* not logged in */ });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await apiFetch("auth.php?action=register", {
          method: "POST",
          body: JSON.stringify({ email, password: pw, name })
        });
        navigate({ to: "/dashboard", replace: true });
      } else {
        await apiFetch("auth.php?action=login", {
          method: "POST",
          body: JSON.stringify({ email, password: pw })
        });
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setErr("Google login requires manual PHP setup. Please use Email/Password for now.");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 opacity-60" style={{ background: `radial-gradient(60% 50% at 20% 20%, ${brand.primary}33, transparent), radial-gradient(60% 50% at 80% 80%, ${brand.accent}33, transparent)` }} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl"
      >
        <Link to="/" className="flex items-center gap-2.5 mb-6">
          <div className="size-10 rounded-xl grid place-items-center shadow-lg" style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}>
            <span className="text-white font-black text-lg">V</span>
          </div>
          <div>
            <div className="font-black tracking-tight text-lg">Vinshare</div>
            <div className="text-[10px] font-mono text-muted-foreground -mt-0.5">PROPOSAL · INVOICE · PAID</div>
          </div>
        </Link>
        <h1 className="text-3xl font-black tracking-tight">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {mode === "signin" ? "Sign in to sync your brand, templates and history." : "Save proposals, invoices and clients across devices."}
        </p>

        <button onClick={google} className="w-full flex items-center justify-center gap-2 bg-background border border-border rounded-xl py-2.5 font-semibold text-sm hover:bg-muted transition-colors">
          <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.12A6.98 6.98 0 015.5 12c0-.74.13-1.46.34-2.12V7.04H2.18A11 11 0 001 12c0 1.77.43 3.45 1.18 4.96l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <label className="block">
              <div className="text-xs font-medium text-muted-foreground mb-1.5">Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
          )}
          <label className="block">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Email</div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </label>
          <label className="block">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Password</div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input required type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </label>
          {err && <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{err}</div>}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-2.5 font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent})` }}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-6">
          {mode === "signin" ? "New to Vinshare?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-foreground hover:underline">
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
