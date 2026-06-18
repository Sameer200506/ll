"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  BookOpen, Calendar, LayoutDashboard,
  Users, ClipboardList, Video, ShoppingBag,
  LogOut, FolderOpen, Radio, MessageCircle, Shield, Award, Download
} from "lucide-react";
import { getSiteSettings, getApprovedEnrollmentsByUser } from "@/lib/firestore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// WhatsApp SVG icon component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const studentLinks = [
  { href: "/dashboard/student", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/student/courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/student/browse", label: "Browse & Buy", icon: ShoppingBag },
  { href: "/dashboard/student/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/student/tests", label: "Tests & Quizzes", icon: ClipboardList },
  { href: "/dashboard/student/projects", label: "Projects", icon: FolderOpen },
  { href: "/live-classes", label: "Live Classes", icon: Radio },
  { href: "/certificates", label: "My Certificates", icon: Award },
];

const teacherLinks = [
  { href: "/dashboard/teacher", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/teacher/courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/teacher/students", label: "Students", icon: Users },
  { href: "/dashboard/teacher/schedule", label: "Schedule", icon: Calendar },
  { href: "/dashboard/teacher/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/teacher/quizzes", label: "Quiz Builder", icon: ClipboardList },
  { href: "/dashboard/teacher/projects", label: "Projects", icon: FolderOpen },
  { href: "/live-classes", label: "Live Classes", icon: Radio },
];

const adminLinks = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
  { href: "/live-classes", label: "Live Classes", icon: Radio },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [whatsappNumber, setWhatsappNumber] = useState("+919347008039");
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).deferredPrompt) {
        setInstallPrompt((window as any).deferredPrompt);
      }

      const handlePrompt = () => {
        setInstallPrompt((window as any).deferredPrompt);
      };

      const handleInstalled = () => {
        setInstallPrompt(null);
      };

      window.addEventListener("pwa-install-prompt-available", handlePrompt);
      window.addEventListener("pwa-app-installed", handleInstalled);

      return () => {
        window.removeEventListener("pwa-install-prompt-available", handlePrompt);
        window.removeEventListener("pwa-app-installed", handleInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = installPrompt || (typeof window !== "undefined" ? (window as any).deferredPrompt : null);
    if (!promptEvent) return;

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`User choice: ${outcome}`);

    if (typeof window !== "undefined") {
      (window as any).deferredPrompt = null;
    }
    setInstallPrompt(null);
  };

  useEffect(() => {
    getSiteSettings().then((settings) => {
      if (settings?.whatsappNumber) {
        setWhatsappNumber(settings.whatsappNumber);
      }
    });
  }, []);

  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "student") {
      setHasPaid(true);
      return;
    }
    getApprovedEnrollmentsByUser(user.id).then((enrollments) => {
      setHasPaid(enrollments.length > 0);
    });
  }, [user]);

  const links =
    user?.role === "teacher"
      ? teacherLinks
      : user?.role === "admin"
      ? adminLinks
      : studentLinks;

  const filteredLinks = links.filter((link) => {
    if (user?.role === "student" && !hasPaid) {
      return link.href === "/dashboard/student" || link.href === "/dashboard/student/browse";
    }
    return true;
  });

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const sidebarContent = (
    <>
      {/* Logo — clicking goes to Home */}
      <div className="flex items-center gap-3 px-5 py-6 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/" onClick={onClose} className="flex items-center gap-3 group">
          <img
            src="/assets/mainlogo.png"
            alt="JRCODE CRAFTERZ Logo"
            className="w-8 h-8 object-contain rounded-lg shadow-sm border border-orange-100 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
              JR<span className="text-orange-500 font-extrabold">CODE</span>CRAFTERZ
            </span>
            <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">EdTech Platform</span>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 mx-3 mt-3 rounded-xl border border-orange-100/60" style={{ background: "var(--surface-2)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-orange))" }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5"
              style={{
                background: user?.role === "teacher" ? "rgba(234,88,12,0.1)" : user?.role === "admin" ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)",
                color: user?.role === "teacher" ? "var(--accent)" : user?.role === "admin" ? "var(--accent-purple)" : "var(--accent-2)"
              }}>
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
          {user?.role === "teacher" ? "Teaching" : user?.role === "admin" ? "Administration" : "Learning"}
        </p>
        {filteredLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard/student" && href !== "/dashboard/teacher" && href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive ? "active" : "hover:opacity-80"
              )}
              style={!isActive ? { color: "var(--text-secondary)" } : {}}
            >
              <Icon className={cn("w-4 h-4 nav-icon flex-shrink-0")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-3 pb-6 space-y-1 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        {/* Install PWA Button */}
        {installPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full transition-all duration-250 hover:opacity-90 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/10 mb-2 cursor-pointer"
          >
            <Download className="w-4 h-4 animate-bounce" />
            Install App
          </button>
        )}

        {/* WhatsApp Contact */}
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200 hover:opacity-80"
          style={{ color: "#25D366" }}
        >
          <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
          WhatsApp Us
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200 hover:opacity-80"
          style={{ color: "var(--danger)" }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="w-64 h-screen flex-col fixed left-0 top-0 z-40 border-r hidden md:flex"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside
            className="absolute left-0 top-0 w-72 h-full flex flex-col border-r shadow-2xl"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
