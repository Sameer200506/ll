"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Bell } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Loading CodeKrafters.in...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b"
          style={{ background: "rgba(248,249,255,0.88)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}
        >
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h1>
            {description && <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{description}</p>}
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
        <div className="p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
