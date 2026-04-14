"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Eye, EyeOff, ArrowRight, GraduationCap, BookOpen } from "lucide-react";

export default function RegisterContent() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "teacher") setRole("teacher");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const newUser = await register(email, password, name, role as "student" | "teacher");
      toast.success("Account created successfully!");
      setTimeout(() => {
        if (newUser && newUser.role === "teacher") {
          router.push("/dashboard/teacher");
        } else {
          router.push("/dashboard/student");
        }
      }, 500);
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
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">CodeKrafters.in</span>
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Join thousands of learners today</p>
        </div>

        <div className="rounded-2xl border p-8" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {/* Role Toggle */}
          <div className="flex gap-3 mb-6">
            {(["student", "teacher"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200"
                style={{
                  background: role === r ? "rgba(37,99,235,0.1)" : "var(--surface-2)",
                  borderColor: role === r ? "var(--accent)" : "var(--border)",
                  color: role === r ? "var(--accent)" : "var(--text-secondary)"
                }}
              >
                {r === "student" ? <GraduationCap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                <span className="text-sm font-medium capitalize">{r}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input
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
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Creating account..." : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--accent-2)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
