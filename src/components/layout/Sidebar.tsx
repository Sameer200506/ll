"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  BookOpen, Calendar, LayoutDashboard, GraduationCap,
  Users, PlayCircle, ClipboardList, Video, ShoppingBag,
  LogOut, Settings, Zap, Trophy
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const studentLinks = [
  { href: "/dashboard/student", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/student/courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/student/browse", label: "Browse & Buy", icon: ShoppingBag },
  { href: "/dashboard/student/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/student/tests", label: "Tests & Quizzes", icon: ClipboardList },
];

const teacherLinks = [
  { href: "/dashboard/teacher", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/teacher/courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/teacher/students", label: "Students", icon: Users },
  { href: "/dashboard/teacher/schedule", label: "Schedule", icon: Calendar },
  { href: "/dashboard/teacher/quizzes", label: "Quiz Builder", icon: ClipboardList },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = user?.role === "teacher" ? teacherLinks : studentLinks;

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <aside
      className="w-64 h-screen flex flex-col fixed left-0 top-0 z-40 border-r"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold gradient-text">EduFlow</span>
      </div>

      {/* User info */}
      <div className="px-4 py-4 mx-3 mt-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
            <p className="text-xs capitalize px-1.5 py-0.5 rounded-full inline-block mt-0.5"
              style={{ background: user?.role === "teacher" ? "rgba(108,99,255,0.2)" : "rgba(16,185,129,0.2)", color: user?.role === "teacher" ? "var(--accent-2)" : "var(--success)" }}>
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
          {user?.role === "teacher" ? "Teaching" : "Learning"}
        </p>
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard/student" && href !== "/dashboard/teacher" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive ? "active" : "hover:opacity-80"
              )}
              style={!isActive ? { color: "var(--text-secondary)" } : {}}
            >
              <Icon className={cn("w-4 h-4 nav-icon flex-shrink-0", isActive ? "" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-3 pb-6 space-y-1 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200 hover:opacity-80"
          style={{ color: "var(--danger)" }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
