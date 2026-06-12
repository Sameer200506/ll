"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Bell, Menu, ShoppingBag, ArrowRight } from "lucide-react";
import { getApprovedEnrollmentsByUser, getEnrollmentsByUser, getSiteSettings } from "@/lib/firestore";
import Link from "next/link";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  /** Roles allowed to view this page. If undefined, any authenticated user can view. */
  allowedRoles?: Array<"student" | "teacher" | "admin">;
  /** Set true on pages that should bypass the payment gate (e.g. Browse Courses) */
  bypassPaymentGate?: boolean;
}

export function DashboardLayout({ children, title, description, allowedRoles, bypassPaymentGate }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<"loading" | "none" | "pending" | "approved">("loading");
  const [whatsappNumber, setWhatsappNumber] = useState("+919347008039");
  const [pendingCourseTitle, setPendingCourseTitle] = useState("");

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

  // Enrollment gate for students — check if they have any enrollment (pending or approved)
  useEffect(() => {
    if (!user || user.role !== "student") return;
    getEnrollmentsByUser(user.id).then(async (enrollments) => {
      if (enrollments.length === 0) {
        setEnrollmentStatus("none");
      } else {
        const approved = enrollments.some((e: any) => e.status === "approved");
        setEnrollmentStatus(approved ? "approved" : "pending");
        
        // Find if there is a pending enrollment to display its course title in the banner
        const pending = enrollments.find((e: any) => e.status === "pending") as any;
        if (pending) {
          const { getCourse } = await import("@/lib/firestore");
          const c = await getCourse(pending.courseId);
          if (c) setPendingCourseTitle(c.title);
        } else {
          setPendingCourseTitle("");
        }
      }
    });
  }, [user]);

  // Load WhatsApp settings
  useEffect(() => {
    getSiteSettings().then((settings) => {
      if (settings?.whatsappNumber) {
        setWhatsappNumber(settings.whatsappNumber);
      }
    });
  }, []);

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

  // Role guard — redirect handled by useEffect above, show spinner meantime
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

  // Student enrollment gate — runs on all student pages except browse
  const isStudentBrowsePage = pathname?.includes("/browse");
  const shouldGate = user.role === "student" && !bypassPaymentGate && !isStudentBrowsePage;

  if (shouldGate && enrollmentStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Verifying enrollment...</p>
        </div>
      </div>
    );
  }

  // No enrollment at all → push to browse with prompt to enroll
  if (shouldGate && enrollmentStatus === "none") {
    return (
      <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="flex-1 md:ml-64 min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ShoppingBag className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Choose a Course First</h1>
            <p className="text-slate-500 font-medium mb-2 leading-relaxed">
              You haven't enrolled in any course yet. Browse our available courses, complete the payment, and get full dashboard access!
            </p>
            <p className="text-slate-400 text-sm mb-8">
              One payment unlocks your course content and full student dashboard.
            </p>
            <Link
              href="/dashboard/student/browse"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #ff5a00, #ff8a00)" }}
            >
              Browse & Enroll in a Course <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all mt-3"
            >
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Need help? Contact us on WhatsApp
            </a>
          </div>
        </main>
      </div>
    );
  }

  // Payment submitted but pending approval
  if (shouldGate && enrollmentStatus === "pending") {
    return (
      <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="flex-1 md:ml-64 min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200/60 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Awaiting Admin Approval</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Payment Under Review</h1>
            <p className="text-slate-500 font-medium mb-2 leading-relaxed">
              Your payment details have been submitted successfully! Our team is reviewing your transaction.
            </p>
            <p className="text-slate-400 text-sm mb-8">
              You'll get full access to your course and dashboard once the admin approves your payment. This usually takes a few hours.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl font-bold text-white shadow-lg transition-all hover:opacity-90 mb-3"
              style={{ background: "#25D366" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Message us on WhatsApp
            </a>
            <Link
              href="/dashboard/student/browse"
              className="flex items-center justify-center w-full py-3 px-6 rounded-2xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
            >
              View Course Catalog
            </Link>
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
        {/* Payment Warning Banner */}
        {user.role === "student" && pendingCourseTitle && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800 flex items-center justify-between font-medium animate-fade-in text-left">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              <span>
                Your payment for course <strong>{pendingCourseTitle}</strong> is currently pending review. Access will be unlocked automatically upon approval.
              </span>
            </span>
            <a 
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-amber-600 text-white font-bold px-3.5 py-1.5 rounded-xl hover:bg-amber-700 transition-colors flex-shrink-0 ml-4 inline-block"
            >
              Contact Support
            </a>
          </div>
        )}
        {/* Content */}
        <div className="p-4 md:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
