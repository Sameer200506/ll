"use client";
import { useEffect, useState } from "react";
import {
  getAllUsers,
  getAllCourses,
  getAllEnrollments,
  getAllQuizResults,
  getAllProjects,
  deleteUser,
  deleteCourse,
} from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, BookOpen, ShoppingBag, BarChart3,
  Trash2, RefreshCw, Shield, GraduationCap,
  Search, LogOut, Activity, FileText, AlertTriangle,
  IndianRupee, ChevronDown, ChevronUp, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Tab = "overview" | "students" | "teachers" | "courses" | "enrollments" | "earnings" | "transactions";

const ADMIN_PASSWORD = "admin123"; // simple client-side gate

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const students = users.filter((u) => u.role === "student");
  const teachers = users.filter((u) => u.role === "teacher");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, c, e, qr, pr] = await Promise.all([
        getAllUsers(),
        getAllCourses(),
        getAllEnrollments(),
        getAllQuizResults(),
        getAllProjects(),
      ]);
      setUsers(u as any[]);
      setCourses(c as any[]);
      setEnrollments(e as any[]);
      setQuizResults(qr as any[]);
      setProjects(pr as any[]);
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchAll();
  }, [authed]);

  // ── Login gate ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-md p-8 rounded-3xl border shadow-2xl animate-fade-in"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>CodeKrafters.in — Restricted Access</p>
          </div>
          <div className="space-y-4">
            <input
              id="admin-password"
              type="password"
              placeholder="Enter admin password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (pw === ADMIN_PASSWORD ? setAuthed(true) : toast.error("Wrong password"))}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:border-blue-500 transition-colors"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            <Button
              className="w-full"
              onClick={() => pw === ADMIN_PASSWORD ? setAuthed(true) : toast.error("Wrong password")}
            >
              Access Admin Panel
            </Button>
          </div>
          <p className="text-xs text-center mt-6" style={{ color: "var(--text-secondary)" }}>
            Only authorised administrators may access this panel.
          </p>
        </div>
      </div>
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const handleDeleteUser = async (uid: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await deleteUser(uid);
      setUsers((prev) => prev.filter((u) => u.id !== uid));
      toast.success("User removed");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!confirm(`Delete course "${title}"? This cannot be undone.`)) return;
    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast.success("Course removed");
    } catch {
      toast.error("Failed to delete course");
    }
  };

  const filterBy = (arr: any[], keys: string[]) =>
    arr.filter((item) =>
      keys.some((k) => String(item[k] ?? "").toLowerCase().includes(search.toLowerCase()))
    );

  // ── Computed earnings data ──
  const totalRevenue = enrollments.reduce((sum: number, e: any) => {
    const course = courses.find((c: any) => c.id === e.courseId);
    return sum + (course?.price || 0);
  }, 0);

  const teacherEarningsData = teachers.map((t: any) => {
    const tCourses = courses.filter((c: any) => c.teacherId === t.id);
    const tEnrollments = enrollments.filter((e: any) =>
      tCourses.some((c: any) => c.id === e.courseId)
    );
    const tRevenue = tEnrollments.reduce((sum: number, e: any) => {
      const course = courses.find((c: any) => c.id === e.courseId);
      return sum + (course?.price || 0);
    }, 0);
    const uniqueStudents = new Set(tEnrollments.map((e: any) => e.userId)).size;
    const paidEnrollments = tEnrollments.filter((e: any) => {
      const course = courses.find((c: any) => c.id === e.courseId);
      return (course?.price || 0) > 0;
    });
    return {
      teacher: t,
      courses: tCourses,
      enrollments: tEnrollments,
      revenue: tRevenue,
      studentCount: uniqueStudents,
      paymentCount: paidEnrollments.length,
      paidEnrollments,
    };
  });

  const navItems: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "earnings", label: "Teacher Earnings", icon: IndianRupee, count: teachers.length },
    { id: "students", label: "Students", icon: GraduationCap, count: students.length },
    { id: "teachers", label: "Teachers", icon: Users, count: teachers.length },
    { id: "courses", label: "Courses", icon: BookOpen, count: courses.length },
    { id: "enrollments", label: "Enrollments", icon: ShoppingBag, count: enrollments.length },
    { id: "transactions", label: "Transactions", icon: Activity, count: quizResults.length + projects.length },
  ];

  const statCards = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "#10b981" },
    { label: "Total Students", value: students.length, icon: GraduationCap, color: "var(--success)" },
    { label: "Total Teachers", value: teachers.length, icon: Users, color: "var(--accent)" },
    { label: "Total Courses", value: courses.length, icon: BookOpen, color: "var(--accent-2)" },
    { label: "Enrollments", value: enrollments.length, icon: ShoppingBag, color: "var(--warning)" },
    { label: "Paid Payments", value: enrollments.filter((e: any) => { const c = courses.find((c2: any) => c2.id === e.courseId); return (c?.price || 0) > 0; }).length, icon: IndianRupee, color: "#8b5cf6" },
  ];

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <aside className="w-64 h-screen fixed left-0 top-0 z-40 flex flex-col border-r"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 px-6 py-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold gradient-text">Admin Panel</span>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>CodeKrafters.in</p>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Management
          </p>
          {navItems.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSearch(""); }}
              className={`nav-item flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${tab === id ? "active" : "hover:opacity-80"}`}
              style={tab !== id ? { color: "var(--text-secondary)" } : {}}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 nav-icon flex-shrink-0" />
                {label}
              </span>
              {count !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-6 border-t pt-4 space-y-1" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={fetchAll}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full hover:opacity-80 transition-all"
            style={{ color: "var(--text-secondary)" }}
          >
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
          <button
            onClick={() => setAuthed(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full hover:opacity-80 transition-all"
            style={{ color: "var(--danger)" }}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Topbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b"
          style={{ background: "rgba(248,249,255,0.88)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {navItems.find((n) => n.id === tab)?.label}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Full visibility & control over the platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            {tab !== "overview" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border text-sm outline-none focus:border-blue-500 transition-colors"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)", width: 220 }}
                />
              </div>
            )}
            <button
              onClick={fetchAll}
              disabled={loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="p-8 animate-fade-in">
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {tab === "overview" && (
                <div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {statCards.map(({ label, value, icon: Icon, color }) => (
                      <Card key={label} className="card-hover">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ background: `${color}22` }}>
                              <Icon className="w-5 h-5" style={{ color }} />
                            </div>
                            <span className="text-2xl font-bold">{value}</span>
                          </div>
                          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Recent enrollments */}
                  <h2 className="text-lg font-semibold mb-4">Recent Enrollments</h2>
                  <Card>
                    <CardContent className="pt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>
                            <th className="text-left pb-3 pr-4">Enrollment ID</th>
                            <th className="text-left pb-3 pr-4">User ID</th>
                            <th className="text-left pb-3 pr-4">Course ID</th>
                            <th className="text-left pb-3">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.slice(0, 8).map((e: any) => (
                            <tr key={e.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                              <td className="py-2.5 pr-4 font-mono text-xs opacity-60">{e.id}</td>
                              <td className="py-2.5 pr-4 font-mono text-xs">{e.userId}</td>
                              <td className="py-2.5 pr-4 font-mono text-xs">{e.courseId}</td>
                              <td className="py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                                {e.purchasedAt ? format(new Date(e.purchasedAt), "MMM d, yyyy") : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── TEACHER EARNINGS ── */}
              {tab === "earnings" && (
                <TeacherEarningsTab
                  data={filterBy(teacherEarningsData.map(d => ({...d, name: d.teacher.name, email: d.teacher.email})), ["name", "email"])}
                  courses={courses}
                  users={users}
                  enrollments={enrollments}
                />
              )}

              {/* ── STUDENTS ── */}
              {tab === "students" && (
                <UserTable
                  users={filterBy(students, ["name", "email", "id"])}
                  onDelete={handleDeleteUser}
                  role="student"
                />
              )}

              {/* ── TEACHERS ── */}
              {tab === "teachers" && (
                <UserTable
                  users={filterBy(teachers, ["name", "email", "id"])}
                  onDelete={handleDeleteUser}
                  role="teacher"
                />
              )}

              {/* ── COURSES ── */}
              {tab === "courses" && (
                <div>
                  <div className="grid gap-3">
                    {filterBy(courses, ["title", "teacherName", "id"]).map((c: any) => {
                      const enrolled = enrollments.filter((e: any) => e.courseId === c.id).length;
                      return (
                        <Card key={c.id} className="card-hover">
                          <CardContent className="py-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{c.title}</p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                by {c.teacherName} &nbsp;·&nbsp; {enrolled} enrolled
                              </p>
                              <p className="text-xs font-mono opacity-50 mt-0.5">{c.id}</p>
                            </div>
                            <Badge variant={c.price === 0 ? "success" : "default"}>
                              {c.price === 0 ? "Free" : `₹${c.price}`}
                            </Badge>
                            <p className="text-xs hidden md:block" style={{ color: "var(--text-secondary)" }}>
                              {c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy") : "—"}
                            </p>
                            <button
                              onClick={() => handleDeleteCourse(c.id, c.title)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-all flex-shrink-0"
                              style={{ background: "rgba(220,38,38,0.1)", color: "var(--danger)" }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {filterBy(courses, ["title", "teacherName", "id"]).length === 0 && (
                      <EmptyState label="No courses found" />
                    )}
                  </div>
                </div>
              )}

              {/* ── ENROLLMENTS (enhanced) ── */}
              {tab === "enrollments" && (
                <Card>
                  <CardContent className="pt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>
                          <th className="text-left pb-3 pr-4">Student</th>
                          <th className="text-left pb-3 pr-4">Course</th>
                          <th className="text-left pb-3 pr-4">Teacher</th>
                          <th className="text-left pb-3 pr-4">Amount</th>
                          <th className="text-left pb-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterBy(enrollments.map((e: any) => {
                          const student = users.find((u: any) => u.id === e.userId);
                          const course = courses.find((c: any) => c.id === e.courseId);
                          return { ...e, studentName: student?.name || e.userId, courseName: course?.title || e.courseId, teacherName: course?.teacherName || "—", price: course?.price ?? 0 };
                        }), ["studentName", "courseName", "teacherName"]).map((e: any) => (
                          <tr key={e.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                            <td className="py-2.5 pr-4 text-sm font-medium">{e.studentName}</td>
                            <td className="py-2.5 pr-4 text-sm">{e.courseName}</td>
                            <td className="py-2.5 pr-4 text-sm" style={{ color: "var(--text-secondary)" }}>{e.teacherName}</td>
                            <td className="py-2.5 pr-4">
                              <Badge variant={e.price > 0 ? "default" : "success"}>
                                {e.price > 0 ? `₹${e.price}` : "Free"}
                              </Badge>
                            </td>
                            <td className="py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                              {e.purchasedAt ? format(new Date(e.purchasedAt), "MMM d, yyyy · h:mm a") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {enrollments.length === 0 && (
                      <EmptyState label="No enrollments found" />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── TRANSACTIONS (quiz results + projects) ── */}
              {tab === "transactions" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Quiz Results</h2>
                    <Card>
                      <CardContent className="pt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>
                              <th className="text-left pb-3 pr-4">User ID</th>
                              <th className="text-left pb-3 pr-4">Course ID</th>
                              <th className="text-left pb-3 pr-4">Score</th>
                              <th className="text-left pb-3">Submitted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterBy(quizResults, ["userId", "courseId", "id"]).map((qr: any) => (
                              <tr key={qr.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                                <td className="py-2.5 pr-4 font-mono text-xs">{qr.userId}</td>
                                <td className="py-2.5 pr-4 font-mono text-xs">{qr.courseId}</td>
                                <td className="py-2.5 pr-4">
                                  <Badge variant={qr.score >= 70 ? "success" : "warning"}>
                                    {qr.score ?? "—"}%
                                  </Badge>
                                </td>
                                <td className="py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {qr.submittedAt ? format(new Date(qr.submittedAt), "MMM d, yyyy · h:mm a") : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filterBy(quizResults, ["userId", "courseId", "id"]).length === 0 && (
                          <EmptyState label="No quiz results" />
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold mb-4">Project Submissions</h2>
                    <Card>
                      <CardContent className="pt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>
                              <th className="text-left pb-3 pr-4">Student ID</th>
                              <th className="text-left pb-3 pr-4">Course ID</th>
                              <th className="text-left pb-3 pr-4">Status</th>
                              <th className="text-left pb-3 pr-4">Grade</th>
                              <th className="text-left pb-3">Submitted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterBy(projects, ["studentId", "courseId", "id"]).map((p: any) => (
                              <tr key={p.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                                <td className="py-2.5 pr-4 font-mono text-xs">{p.studentId}</td>
                                <td className="py-2.5 pr-4 font-mono text-xs">{p.courseId}</td>
                                <td className="py-2.5 pr-4">
                                  <Badge
                                    variant={
                                      p.status === "graded" ? "success" :
                                      p.status === "submitted" ? "warning" : "secondary"
                                    }
                                  >
                                    {p.status}
                                  </Badge>
                                </td>
                                <td className="py-2.5 pr-4 text-xs font-semibold">
                                  {p.grade != null ? `${p.grade}/100` : "—"}
                                </td>
                                <td className="py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {p.submittedAt ? format(new Date(p.submittedAt), "MMM d, yyyy") : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filterBy(projects, ["studentId", "courseId", "id"]).length === 0 && (
                          <EmptyState label="No project submissions" />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function UserTable({ users, onDelete, role }: { users: any[]; onDelete: (id: string, name: string) => void; role: string }) {
  return (
    <div className="grid gap-3">
      {users.map((u: any) => (
        <Card key={u.id} className="card-hover">
          <CardContent className="py-4 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              {u.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{u.name}</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{u.email}</p>
              <p className="text-xs font-mono opacity-50 mt-0.5">{u.id}</p>
            </div>
            <Badge variant={role === "teacher" ? "default" : "success"} className="capitalize">
              {role}
            </Badge>
            <button
              onClick={() => onDelete(u.id, u.name)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-all flex-shrink-0"
              style={{ background: "rgba(220,38,38,0.1)", color: "var(--danger)" }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      ))}
      {users.length === 0 && <EmptyState label={`No ${role}s found`} />}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <AlertTriangle className="w-8 h-8 opacity-30" style={{ color: "var(--text-secondary)" }} />
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</p>
    </div>
  );
}

// ── Teacher Earnings Tab ──────────────────────────────────────────────────────

function TeacherEarningsTab({ data, courses, users, enrollments }: { data: any[]; courses: any[]; users: any[]; enrollments: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {data.sort((a, b) => b.revenue - a.revenue).map((d: any) => {
          const isOpen = expandedId === d.teacher.id;
          return (
            <div key={d.teacher.id}>
              <Card className="card-hover cursor-pointer" onClick={() => setExpandedId(isOpen ? null : d.teacher.id)}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                      {d.teacher.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{d.teacher.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{d.teacher.email}</p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.08)" }}>
                      <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Total Earnings</p>
                      <p className="text-lg font-bold" style={{ color: "#10b981" }}>₹{d.revenue.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.08)" }}>
                      <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Students</p>
                      <p className="text-lg font-bold" style={{ color: "#6366f1" }}>{d.studentCount}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)" }}>
                      <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Paid Payments</p>
                      <p className="text-lg font-bold" style={{ color: "#f59e0b" }}>{d.paymentCount}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.08)" }}>
                      <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Courses</p>
                      <p className="text-lg font-bold" style={{ color: "#8b5cf6" }}>{d.courses.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expanded detail */}
              {isOpen && (
                <div className="mt-2 animate-fade-in">
                  {/* Per-course breakdown */}
                  <Card className="mb-2">
                    <CardContent className="pt-4">
                      <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Course-wise Breakdown</p>
                      <div className="space-y-2">
                        {d.courses.map((c: any) => {
                          const cEnrolls = d.enrollments.filter((e: any) => e.courseId === c.id);
                          const cRevenue = cEnrolls.length * (c.price || 0);
                          return (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{c.title}</p>
                                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {cEnrolls.length} student{cEnrolls.length !== 1 ? "s" : ""} · {c.price > 0 ? `₹${c.price}/student` : "Free"}
                                </p>
                              </div>
                              <span className="text-sm font-bold ml-3" style={{ color: cRevenue > 0 ? "#10b981" : "var(--text-secondary)" }}>
                                ₹{cRevenue.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Students who purchased */}
                  <Card>
                    <CardContent className="pt-4 overflow-x-auto">
                      <p className="text-sm font-semibold mb-3">Students &amp; Payments</p>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>
                            <th className="text-left pb-2 pr-3">Student</th>
                            <th className="text-left pb-2 pr-3">Course</th>
                            <th className="text-left pb-2 pr-3">Amount</th>
                            <th className="text-left pb-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.enrollments.map((e: any) => {
                            const student = users.find((u: any) => u.id === e.userId);
                            const course = courses.find((c: any) => c.id === e.courseId);
                            return (
                              <tr key={e.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                                <td className="py-2 pr-3 text-xs font-medium">{student?.name || e.userId}</td>
                                <td className="py-2 pr-3 text-xs">{course?.title || e.courseId}</td>
                                <td className="py-2 pr-3">
                                  <Badge variant={(course?.price || 0) > 0 ? "default" : "success"}>
                                    {(course?.price || 0) > 0 ? `₹${course.price}` : "Free"}
                                  </Badge>
                                </td>
                                <td className="py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {e.purchasedAt ? format(new Date(e.purchasedAt), "MMM d, yyyy") : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {d.enrollments.length === 0 && <p className="text-xs py-4 text-center" style={{ color: "var(--text-secondary)" }}>No enrollments yet</p>}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {data.length === 0 && <EmptyState label="No teachers found" />}
    </div>
  );
}
