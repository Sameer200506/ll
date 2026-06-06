"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Bell, Menu, X, Lock } from "lucide-react";
import { getApprovedEnrollmentsByUser } from "@/lib/firestore";
import Link from "next/link";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  /** Roles allowed to view this page. If undefined, any authenticated user can view. */
  allowedRoles?: Array<"student" | "teacher" | "admin">;
}

export function DashboardLayout({ children, title, description, allowedRoles }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState<boolean | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Role-based access check
  useEffect(() => {
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push("/access-denied");
    }
  }, [user, loading, allowedRoles, router]);

  // Payment gate for students
  useEffect(() => {
    if (!user || user.role !== "student") return;
    setPaymentLoading(true);
    getApprovedEnrollmentsByUser(user.id).then((enrollments) => {
      setPaymentVerified(enrollments.length > 0);
      setPaymentLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Loading JRCODE CRAFTERZ...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Role guard — redirect handled by useEffect above, show loading meantime
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Payment gate for students
  if (user.role === "student" && (paymentLoading || paymentVerified === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Verifying enrollment...</p>
        </div>
      </div>
    );
  }

  if (user.role === "student" && paymentVerified === false) {
    return (
      <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
        <Sidebar />
        <main className="flex-1 md:ml-64 min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-orange-50 border-2 border-orange-200 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Lock className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Payment Pending</h1>
            <p className="text-slate-500 font-medium mb-2 leading-relaxed">
              Your dashboard access is locked until your enrollment payment is verified by our team.
            </p>
            <p className="text-slate-400 text-sm mb-8">
              Once your payment is approved, you'll get full access to all courses, live classes, and resources.
            </p>
            <div className="space-y-3">
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl font-bold text-white shadow-lg transition-all hover:opacity-90"
                style={{ background: "#25D366" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contact Us on WhatsApp
              </a>
              <Link
                href="/"
                className="flex items-center justify-center w-full py-3 px-6 rounded-2xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="flex-1 md:ml-64 min-h-screen">
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4 border-b"
          style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:opacity-80"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h1>
              {description && <p className="text-sm mt-0.5 hidden sm:block" style={{ color: "var(--text-secondary)" }}>{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:opacity-80"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="p-4 md:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
