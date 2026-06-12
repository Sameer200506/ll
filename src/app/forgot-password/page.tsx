"use client";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserByEmail } from "@/lib/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // Check user role before sending the password reset email
      const userDoc = await getUserByEmail(email.trim().toLowerCase());
      if (userDoc && userDoc.role !== "student") {
        toast.error("Password reset is not available for teacher or staff accounts. Please contact an administrator.");
        setLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, email.trim());
      toast.success("Password reset link sent to your email!");
      setSent(true);
      startCooldown();
    } catch (err: any) {
      console.error("Password reset error:", err);
      // Friendly messages for common Firebase auth errors
      if (err.code === "auth/user-not-found") {
        toast.error("No account found with this email address");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email address format");
      } else {
        toast.error(err.message || "Failed to send password reset link");
      }
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "var(--background)" }}>
      {/* BG decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: "var(--accent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: "var(--accent-2)" }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo — click goes to home */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <img src="/assets/mainlogo.png" alt="JRCODE CRAFTERZ Logo" className="w-10 h-10 object-contain rounded-xl shadow-md border border-orange-100 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                JR<span className="text-orange-500 font-extrabold">CODE</span>CRAFTERZ
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold leading-none">EdTech Platform</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            We'll send you a link to reset your password.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending link..." : "Send Password Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-5">
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-600 animate-pulse-glow">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">Check your inbox</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  We have sent a password reset link to <strong className="text-slate-800 break-all">{email}</strong>.
                  Please check your spam or promotions folder if you do not receive it.
                </p>
              </div>

              <div className="pt-2">
                {cooldown > 0 ? (
                  <p className="text-xs text-slate-400">
                    Resend link in <span className="font-semibold text-slate-600">{cooldown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={() => handleSubmit()}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend email
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t flex justify-center" style={{ borderColor: "var(--border)" }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
