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
  getAllLeads,
  deleteLead,
  markLeadRead,
  approveEnrollment,
  declineEnrollment,
  updateSiteSettings,
  getSiteSettings,
} from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, BookOpen, ShoppingBag, BarChart3,
  Trash2, RefreshCw, Shield, GraduationCap,
  Search, LogOut, Activity, FileText, AlertTriangle,
  IndianRupee, ChevronDown, ChevronUp, Eye,
  Mail, Phone, MessageSquare, Calendar, Sparkles, Check, CheckCircle2, Clock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "overview" | "leads" | "students" | "teachers" | "courses" | "enrollments" | "payments" | "cms";

const ADMIN_PASSWORD = "admin123";

// Animation settings
const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

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
  const [leads, setLeads] = useState<any[]>([]);

  // CMS / Settings
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("919999999999");
  const [settingsSaving, setSettingsSaving] = useState(false);

  const students = users.filter((u) => u.role === "student");
  const teachers = users.filter((u) => u.role === "teacher");
  const unreadLeadsCount = leads.filter((l) => l.status === "unread").length;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, c, e, qr, pr, ld] = await Promise.all([
        getAllUsers(),
        getAllCourses(),
        getAllEnrollments(),
        getAllQuizResults(),
        getAllProjects(),
        getAllLeads(),
      ]);
      setUsers(u as any[]);
      setCourses(c as any[]);
      setEnrollments(e as any[]);
      setQuizResults(qr as any[]);
      setProjects(pr as any[]);
      setLeads(ld as any[]);
      // Also load site settings
      const settings = await getSiteSettings();
      if (settings) {
        setLogoUrl(settings.logoUrl || "");
        setWhatsappNumber(settings.whatsappNumber || "919999999999");
      }
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchAll();
  }, [authed]);

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

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message lead?")) return;
    try {
      await deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead removed");
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  const handleToggleLeadRead = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "unread" ? true : false;
    try {
      await markLeadRead(id, nextStatus);
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: nextStatus ? "read" : "unread" } : l));
      toast.success(`Marked lead as ${nextStatus ? "read" : "unread"}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleApproveEnrollment = async (userId: string, courseId: string) => {
    try {
      await approveEnrollment(userId, courseId);
      setEnrollments((prev) =>
        prev.map((e) =>
          e.userId === userId && e.courseId === courseId
            ? { ...e, status: "approved", approvedAt: new Date().toISOString() }
            : e
        )
      );
      toast.success("Enrollment approved! Student can now access the course.");
    } catch {
      toast.error("Failed to approve enrollment.");
    }
  };

  const handleDeclineEnrollment = async (userId: string, courseId: string) => {
    if (!confirm("Are you sure you want to decline this enrollment? The request will be deleted.")) return;
    try {
      await declineEnrollment(userId, courseId);
      setEnrollments((prev) => prev.filter((e) => !(e.userId === userId && e.courseId === courseId)));
      toast.success("Enrollment request declined.");
    } catch {
      toast.error("Failed to decline enrollment.");
    }
  };

  const filterBy = (arr: any[], keys: string[]) =>
    arr.filter((item) =>
      keys.some((k) => String(item[k] ?? "").toLowerCase().includes(search.toLowerCase()))
    );

  const pendingEnrollments = enrollments.filter((e: any) => e.status === "pending");
  const approvedEnrollments = enrollments.filter((e: any) => e.status !== "pending");

  const totalRevenue = approvedEnrollments.reduce((sum: number, e: any) => {
    const course = courses.find((c: any) => c.id === e.courseId);
    return sum + (course?.price || 0);
  }, 0);

  const navItems: { id: Tab; label: string; icon: any; count?: number | string; highlight?: boolean }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "leads", label: "Leads / Messages", icon: MessageSquare, count: unreadLeadsCount, highlight: unreadLeadsCount > 0 },
    { id: "students", label: "Students", icon: GraduationCap, count: students.length },
    { id: "teachers", label: "Teachers", icon: Users, count: teachers.length },
    { id: "courses", label: "Courses", icon: BookOpen, count: courses.length },
    { id: "enrollments", label: "Enrollments", icon: ShoppingBag, count: pendingEnrollments.length > 0 ? `Req: ${pendingEnrollments.length}` : approvedEnrollments.length, highlight: pendingEnrollments.length > 0 },
    { id: "payments", label: "Payments Logs", icon: IndianRupee },
    { id: "cms", label: "CMS & Settings", icon: Activity },
  ];

  const statCards = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "#10b981" },
    { label: "Total Students", value: students.length, icon: GraduationCap, color: "var(--accent-2)" },
    { label: "Total Teachers", value: teachers.length, icon: Users, color: "var(--accent)" },
    { label: "Total Courses", value: courses.length, icon: BookOpen, color: "#a855f7" },
    { label: "Leads / Inquiries", value: leads.length, icon: MessageSquare, color: "#eab308" },
    { label: "Paid Enrollment", value: approvedEnrollments.filter((e: any) => { const c = courses.find((c2: any) => c2.id === e.courseId); return (c?.price || 0) > 0; }).length, icon: ShoppingBag, color: "#f43f5e" },
  ];

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        {/* Blob decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[20%] left-[-5%] w-[400px] h-[400px] rounded-full bg-orange-100/40 blur-3xl" />
          <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-100/40 blur-3xl" />
        </div>

        <div className="w-full max-w-md p-8 rounded-3xl border border-orange-100 shadow-2xl relative z-10 bg-white">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-orange-500 text-white shadow-lg shadow-orange-500/25">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">JRCODECRAFTERZ</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">SaaS Control Center</p>
          </div>
          
          <div className="space-y-4">
            <input
              id="admin-password"
              type="password"
              placeholder="Enter admin password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (pw === ADMIN_PASSWORD ? setAuthed(true) : toast.error("Wrong password"))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-500 text-slate-800 font-semibold"
            />
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg"
              onClick={() => pw === ADMIN_PASSWORD ? setAuthed(true) : toast.error("Wrong password")}
            >
              Access Admin Panel
            </Button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-6 font-bold uppercase tracking-wider">
            Only authorized administrators may access this gate.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white text-slate-800">
      
      {/* Sidebar */}
      <aside className="w-64 h-screen fixed left-0 top-0 z-40 flex flex-col border-r border-slate-100 bg-white">
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
              JR<span className="text-orange-500 font-extrabold">CODE</span>CRAFTERZ
            </span>
            <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Control Center</p>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">
            Admin Tab Panels
          </p>
          
          {navItems.map(({ id, label, icon: Icon, count, highlight }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSearch(""); }}
              className={`nav-item flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${tab === id ? "active" : "hover:opacity-80"}`}
              style={tab !== id ? { color: "var(--text-secondary)" } : {}}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 nav-icon flex-shrink-0" />
                {label}
              </span>
              {count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${highlight ? "bg-orange-500 text-white animate-pulse" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-6 border-t border-slate-100 pt-4 space-y-1">
          <button
            onClick={fetchAll}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold w-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Firestore Data
          </button>
          <button
            onClick={() => setAuthed(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold w-full text-red-500 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Exit Admin Gate
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 ml-64 min-h-screen bg-slate-50/50">
        
        {/* Topbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md">
          <div className="text-left">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {navItems.find((n) => n.id === tab)?.label}
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Control and view platform metrics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {tab !== "overview" && tab !== "cms" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search list..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50/40 focus:bg-white focus:outline-none focus:border-orange-500 transition-all w-52"
                />
              </div>
            )}
            <button
              onClick={fetchAll}
              disabled={loading}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Content View */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-8"
            >
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-28 rounded-3xl" />)}
                </div>
              ) : (
                <>
                  {/* OVERVIEW TAB */}
                  {tab === "overview" && (
                    <motion.div variants={fadeInUp} className="space-y-8">
                      {/* Metric widgets */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {statCards.map(({ label, value, icon: Icon, color }) => (
                          <Card key={label} className="border-slate-100 card-hover relative overflow-hidden bg-white">
                            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: color }} />
                            <CardContent className="pt-6 text-left">
                              <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                                  <Icon className="w-5 h-5" style={{ color }} />
                                </div>
                                <span className="text-2xl font-black text-slate-900">{value}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Recent registrations */}
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 text-left">Recent Enrollments Log</h2>
                        <Card className="border-slate-150 overflow-hidden">
                          <CardContent className="p-4 overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead>
                                <tr className="text-slate-400 font-bold border-b border-slate-100">
                                  <th className="pb-3 pr-4 font-bold text-xs uppercase">Enrollment ID</th>
                                  <th className="pb-3 pr-4 font-bold text-xs uppercase">User ID</th>
                                  <th className="pb-3 pr-4 font-bold text-xs uppercase">Course ID</th>
                                  <th className="pb-3 font-bold text-xs uppercase">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {enrollments.slice(0, 6).map((e: any) => (
                                  <tr key={e.id} className="border-t border-slate-50 text-slate-600 font-medium">
                                    <td className="py-3 pr-4 font-mono text-xs text-orange-500">{e.id}</td>
                                    <td className="py-3 pr-4 font-mono text-xs">{e.userId}</td>
                                    <td className="py-3 pr-4 font-mono text-xs">{e.courseId}</td>
                                    <td className="py-3 text-xs text-slate-400 font-semibold">
                                      {e.purchasedAt ? format(new Date(e.purchasedAt), "MMM d, yyyy · h:mm a") : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  )}

                  {/* LEADS & CONTACT MESSAGES TAB */}
                  {tab === "leads" && (
                    <motion.div variants={fadeInUp} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Landing Page Contact Messages</h2>
                        <Badge className="bg-orange-100 text-orange-600 border border-orange-200/50 text-[10px] font-black uppercase tracking-wider">
                          {unreadLeadsCount} Unread Message{unreadLeadsCount !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      <div className="grid gap-4">
                        {filterBy(leads, ["name", "phone", "grade", "plan", "message"]).map((lead: any) => (
                          <Card key={lead.id} className={`border-slate-100 overflow-hidden relative text-left bg-white ${lead.status === "unread" ? "border-l-4 border-l-orange-500" : ""}`}>
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-bold text-slate-950 text-base">{lead.name}</h3>
                                    <Badge className="bg-slate-100 text-slate-600 border border-slate-200/40 text-[9px] font-bold uppercase">{lead.grade || "Grade 4 - 6"}</Badge>
                                    <Badge className="bg-orange-50 text-orange-600 border border-orange-200/40 text-[9px] font-bold uppercase">{lead.plan || "Basic Setup"}</Badge>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
                                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}</span>
                                    {lead.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email}</span>}
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, h:mm a") : "—"}</span>
                                  </div>

                                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mt-2 text-xs font-medium text-slate-600 leading-relaxed max-w-2xl">
                                    &quot;{lead.message}&quot;
                                  </div>
                                </div>

                                <div className="flex md:flex-col items-center gap-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => handleToggleLeadRead(lead.id, lead.status)}
                                    className={`text-xs font-bold py-1.5 px-3 rounded-lg border w-full justify-center ${lead.status === "unread" ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-emerald-500" : "bg-white border-slate-200 text-slate-500 hover:text-slate-700"}`}
                                  >
                                    {lead.status === "unread" ? "Mark Read" : "Mark Unread"}
                                  </Button>

                                  <button
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {filterBy(leads, ["name", "phone", "grade", "plan", "message"]).length === 0 && (
                          <div className="text-center py-16 border rounded-3xl bg-white border-slate-100">
                            <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-400">No leads or messages found</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* STUDENTS TAB */}
                  {tab === "students" && (
                    <motion.div variants={fadeInUp} className="space-y-4">
                      {filterBy(students, ["name", "email", "id"]).map((std: any) => (
                        <Card key={std.id} className="border-slate-100 card-hover bg-white text-left">
                          <CardContent className="py-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 border border-orange-200 flex items-center justify-center font-bold">
                              {std.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm leading-snug">{std.name}</p>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">{std.email}</p>
                              <p className="text-[10px] font-mono opacity-50 mt-0.5">UID: {std.id}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteUser(std.id, std.name)}
                              className="w-9 h-9 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </CardContent>
                        </Card>
                      ))}

                      {students.length === 0 && (
                        <div className="text-center py-16 border rounded-3xl bg-white">
                          <p className="text-sm font-semibold text-slate-400">No students registered yet</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TEACHERS TAB */}
                  {tab === "teachers" && (
                    <motion.div variants={fadeInUp} className="space-y-4">
                      {filterBy(teachers, ["name", "email", "id"]).map((tch: any) => (
                        <Card key={tch.id} className="border-slate-100 card-hover bg-white text-left">
                          <CardContent className="py-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                              {tch.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm leading-snug">{tch.name}</p>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">{tch.email}</p>
                              <p className="text-[10px] font-mono opacity-50 mt-0.5">UID: {tch.id}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteUser(tch.id, tch.name)}
                              className="w-9 h-9 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </CardContent>
                        </Card>
                      ))}

                      {teachers.length === 0 && (
                        <div className="text-center py-16 border rounded-3xl bg-white">
                          <p className="text-sm font-semibold text-slate-400">No teachers registered yet</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* COURSES TAB */}
                  {tab === "courses" && (
                    <motion.div variants={fadeInUp} className="space-y-4">
                      {filterBy(courses, ["title", "teacherName", "id"]).map((c: any) => {
                        const count = enrollments.filter((e) => e.courseId === c.id).length;
                        return (
                          <Card key={c.id} className="border-slate-100 card-hover bg-white text-left">
                            <CardContent className="py-4 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate text-sm">{c.title}</p>
                                  <p className="text-xs text-slate-400 font-semibold mt-0.5">by {c.teacherName} · {count} Enrolled</p>
                                </div>
                              </div>
                              <Badge className="bg-orange-50 text-orange-600 border border-orange-200/50 hover:bg-orange-50 font-bold px-3 text-xs flex-shrink-0">
                                {c.price === 0 ? "Free Program" : `₹${c.price}`}
                              </Badge>
                              <button
                                onClick={() => handleDeleteCourse(c.id, c.title)}
                                className="w-9 h-9 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {courses.length === 0 && (
                        <div className="text-center py-16 border rounded-3xl bg-white">
                          <p className="text-sm font-semibold text-slate-400">No courses in registry</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ENROLLMENTS TAB */}
                  {tab === "enrollments" && (
                    <motion.div variants={fadeInUp} className="space-y-8">
                      {/* Section 1: Pending Enrollment Requests */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold text-slate-900">Pending Enrollment Requests</h2>
                          <Badge className="bg-orange-100 text-orange-600 border border-orange-200/50 text-[10px] font-black uppercase tracking-wider">
                            {pendingEnrollments.length} Awaiting Verification
                          </Badge>
                        </div>

                        {pendingEnrollments.length > 0 ? (
                          <div className="grid gap-4">
                            {filterBy(pendingEnrollments.map((e: any) => {
                              const st = users.find((u) => u.id === e.userId);
                              const crs = courses.find((c) => c.id === e.courseId);
                              return {
                                ...e,
                                studentName: st?.name || "Unknown Student",
                                studentEmail: st?.email || "—",
                                courseName: crs?.title || "Unknown Course",
                                teacherName: crs?.teacherName || "—",
                                price: crs?.price ?? 0
                              };
                            }), ["studentName", "studentEmail", "courseName", "transactionId"]).map((e: any) => (
                              <Card key={e.id} className="border-slate-100 relative overflow-hidden text-left bg-white border-l-4 border-l-orange-500 shadow-sm animate-fade-in">
                                <CardContent className="p-6">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-3 flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-slate-950 text-base">{e.studentName}</h3>
                                        <span className="text-xs text-slate-400 font-semibold">({e.studentEmail})</span>
                                        <Badge className="bg-orange-50 text-orange-600 border border-orange-200/40 text-[9px] font-bold uppercase ml-auto md:ml-0">
                                          ₹{e.price} Course Fee
                                        </Badge>
                                      </div>

                                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-500 font-semibold">
                                        <p className="truncate"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Course Requested</span> {e.courseName}</p>
                                        <p className="truncate"><span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Student UID</span> <span className="font-mono bg-slate-50 border border-slate-100 rounded px-1">{e.userId}</span></p>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-4 pt-1">
                                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center gap-2 select-all select-text">
                                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Transaction ID:</span>
                                          {e.transactionId || "N/A"}
                                        </div>
                                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5 text-slate-450" />
                                          {e.purchasedAt ? format(new Date(e.purchasedAt), "MMM d, yyyy · h:mm a") : "—"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0 md:self-center">
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveEnrollment(e.userId, e.courseId)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
                                      >
                                        <CheckCircle2 className="w-4 h-4" /> Approve Course
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeclineEnrollment(e.userId, e.courseId)}
                                        className="border-red-200 hover:bg-red-50 text-red-500 font-bold py-2 px-3 rounded-xl flex items-center justify-center cursor-pointer"
                                      >
                                        Decline
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 border rounded-3xl bg-white border-slate-100">
                            <CheckCircle2 className="w-10 h-10 text-emerald-555 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-400">All payment verifications cleared!</p>
                          </div>
                        )}
                      </div>

                      {/* Section 2: Active Enrollments */}
                      <div className="space-y-4 pt-4">
                        <h2 className="text-lg font-bold text-slate-900 text-left">Active Enrollments Ledger</h2>
                        <Card className="border-slate-100 overflow-hidden bg-white text-left">
                          <CardContent className="p-4 overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-slate-400 font-bold border-b border-slate-150">
                                  <th className="pb-3 text-xs uppercase font-bold">Student</th>
                                  <th className="pb-3 text-xs uppercase font-bold">Course</th>
                                  <th className="pb-3 text-xs uppercase font-bold">Instructor</th>
                                  <th className="pb-3 text-xs uppercase font-bold">Course Fee</th>
                                  <th className="pb-3 text-xs uppercase font-bold">Enrollment Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filterBy(approvedEnrollments.map((e: any) => {
                                  const st = users.find((u) => u.id === e.userId);
                                  const crs = courses.find((c) => c.id === e.courseId);
                                  return { ...e, studentName: st?.name || "ID: " + e.userId, courseName: crs?.title || "ID: " + e.courseId, teacherName: crs?.teacherName || "—", price: crs?.price ?? 0 };
                                }), ["studentName", "courseName", "teacherName"]).map((e: any) => (
                                  <tr key={e.id} className="border-t border-slate-50 font-medium text-slate-700">
                                    <td className="py-3 text-sm font-bold text-slate-900">{e.studentName}</td>
                                    <td className="py-3 text-sm">{e.courseName}</td>
                                    <td className="py-3 text-sm text-slate-400">{e.teacherName}</td>
                                    <td className="py-3">
                                      <Badge className={e.price > 0 ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-600 hover:bg-emerald-100 font-semibold"}>
                                        {e.price > 0 ? `₹${e.price}` : "Free"}
                                      </Badge>
                                    </td>
                                    <td className="py-3 text-xs text-slate-400 font-semibold">
                                      {e.purchasedAt ? format(new Date(e.purchasedAt), "MMM d, yyyy") : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {approvedEnrollments.length === 0 && (
                              <p className="text-xs text-slate-400 font-bold text-center py-8">No active enrollments recorded</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  )}

                  {/* PAYMENTS LOG TAB */}
                  {tab === "payments" && (
                    <motion.div variants={fadeInUp} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="bg-emerald-50 border border-emerald-150 p-6 rounded-3xl">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Gross Income Pipeline</p>
                          <h4 className="text-3xl font-black text-emerald-600 mt-1">₹{totalRevenue.toLocaleString()}</h4>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-150 p-6 rounded-3xl">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Paid Student Registrations</p>
                          <h4 className="text-3xl font-black text-indigo-600 mt-1">
                            {approvedEnrollments.filter((e: any) => { const c = courses.find((c2: any) => c2.id === e.courseId); return (c?.price || 0) > 0; }).length} Purchases
                          </h4>
                        </div>
                      </div>

                      <Card className="border-slate-100 bg-white overflow-hidden text-left">
                        <CardContent className="p-4">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Transaction Receipts Ledger</p>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-slate-400 font-bold border-b border-slate-150">
                                <th className="pb-3 text-xs uppercase font-bold">Transaction Reference</th>
                                <th className="pb-3 text-xs uppercase font-bold">Student Name</th>
                                <th className="pb-3 text-xs uppercase font-bold">Assigned Course</th>
                                <th className="pb-3 text-xs uppercase font-bold">Recorded Date</th>
                                <th className="pb-3 text-xs uppercase font-bold">Receipt Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {approvedEnrollments.map((e: any) => {
                                const st = users.find((u) => u.id === e.userId);
                                const crs = courses.find((c) => c.id === e.courseId);
                                return { ...e, studentName: st?.name || e.userId, courseName: crs?.title || e.courseId, price: crs?.price ?? 0 };
                              }).filter(e => e.price > 0).map((e: any) => (
                                <tr key={e.id} className="border-t border-slate-50 font-medium text-slate-650">
                                  <td className="py-3 font-mono text-xs text-orange-500">{e.id}</td>
                                  <td className="py-3 text-sm font-bold text-slate-900">{e.studentName}</td>
                                  <td className="py-3 text-sm">{e.courseName}</td>
                                  <td className="py-3 text-xs text-slate-400 font-semibold">{e.purchasedAt ? format(new Date(e.purchasedAt), "MMM d, yyyy") : "—"}</td>
                                  <td className="py-3 font-bold text-emerald-600 text-sm">₹{e.price}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {approvedEnrollments.filter((e: any) => { const c = courses.find((c2: any) => c2.id === e.courseId); return (c?.price || 0) > 0; }).length === 0 && (
                            <p className="text-xs text-slate-400 font-bold text-center py-8">No paid transactions recorded</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}


                  {/* CMS & SETTINGS TAB */}
                  {tab === "cms" && (
                    <motion.div variants={fadeInUp} className="max-w-xl mx-auto text-left space-y-6">
                      <Card className="border-orange-100 shadow-md bg-white">
                        <CardContent className="p-6 space-y-6">
                          <h3 className="text-lg font-bold text-slate-950 flex items-center gap-1.5"><Sparkles className="w-5 h-5 text-orange-500" /> CMS & Site-Wide Settings</h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Platform Logo URL</label>
                              <p className="text-[10px] text-slate-400 mb-1.5">Paste an image URL to update the logo across the platform.</p>
                              <input
                                type="url"
                                placeholder="https://example.com/logo.png"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                              />
                              {logoUrl && (
                                <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <img src={logoUrl} alt="Logo preview" className="w-10 h-10 object-contain rounded-lg border border-orange-100" />
                                  <span className="text-xs text-slate-500 font-semibold">Logo preview</span>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp Contact Number</label>
                              <p className="text-[10px] text-slate-400 mb-1.5">Include country code without +. E.g. 919876543210</p>
                              <input
                                type="text"
                                placeholder="919876543210"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Landing Page Hero Title</label>
                              <input
                                type="text"
                                defaultValue="Learn Coding Live From Experts"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Platform Tagline</label>
                              <input
                                type="text"
                                defaultValue="Turning Young Minds Into Future-Ready Code Crafters"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Email Address</label>
                              <input
                                type="email"
                                defaultValue="jrcodecrafterz@gmail.com"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                              />
                            </div>

                            <Button
                              disabled={settingsSaving}
                              onClick={async () => {
                                setSettingsSaving(true);
                                try {
                                  await updateSiteSettings({ logoUrl, whatsappNumber });
                                  toast.success("Site settings saved successfully!");
                                } catch { toast.error("Failed to save settings"); }
                                setSettingsSaving(false);
                              }}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20"
                            >
                              {settingsSaving ? "Saving..." : "Save Site Settings"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
