"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff, ArrowRight, BookOpen, ShoppingBag } from "lucide-react";

export default function RegisterContent() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      // Students only — teachers are created manually by admin
      await register(email, password, name, "student");
      toast.success("Account created! Please select a course to get started.");
      setTimeout(() => {
        // Redirect to browse so student can pick and pay for a course immediately
        router.push("/dashboard/student/browse");
      }, 600);
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--background)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: "var(--accent)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: "var(--accent-2)" }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
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
          <h1 className="text-2xl font-bold">Create Student Account</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Sign up, then choose a course &amp; complete payment to get started
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { num: "1", label: "Register", icon: GraduationCap, active: true },
            { num: "2", label: "Pick Course", icon: BookOpen, active: false },
            { num: "3", label: "Pay & Get Access", icon: ShoppingBag, active: false },
          ].map((step, i) => (
            <div key={step.num} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all"
                style={{
                  background: step.active ? "var(--accent)" : "var(--surface-2)",
                  borderColor: step.active ? "var(--accent)" : "var(--border)",
                  color: step.active ? "#fff" : "var(--text-secondary)"
                }}
              >
                {step.num}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-center" style={{ color: step.active ? "var(--accent)" : "var(--text-secondary)" }}>{step.label}</span>
              {i < 2 && <div className="absolute mt-4 w-full h-px" />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border p-8" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20" disabled={loading}>
              {loading ? "Creating account..." : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--accent-2)" }}>
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs mt-3 text-slate-400">
            Are you a teacher?{" "}
            <Link href="/login" className="font-semibold text-orange-500 hover:underline">
              Sign in here
            </Link>
            {" "}using your provided credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
