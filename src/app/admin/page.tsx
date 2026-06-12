"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
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
  enrollUser,
  createUserDoc,
  updateSiteSettings,
  getSiteSettings,
  createCourse,
  updateCourse,
  createCertificate,
  getAllCertificates,
  deleteCertificate,
  getAllSchedules,
  getAllQuizzes,
  getAllAttendance,
  getAllLessons,
  getAllProgress,
} from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users, BookOpen, ShoppingBag, BarChart3,
  Trash2, RefreshCw, Shield, GraduationCap,
  Search, LogOut, Activity, FileText, AlertTriangle,
  IndianRupee, ChevronDown, ChevronUp, Eye,
  Mail, Phone, MessageSquare, Calendar, Sparkles, Check, CheckCircle2, Clock, UserPlus,
  Award, Plus, Pencil, Settings, ArrowLeft, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "overview" | "leads" | "students" | "teachers" | "courses" | "enrollments" | "payments" | "cms" | "certificates" | "search";

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
  const [authed, setAuthed] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin_authed") === "true";
    }
    return false;
  });
  const [pw, setPw] = useState("");

  const handleAdminAuth = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem("admin_authed", "true");
    } else {
      toast.error("Wrong password");
    }
  };

  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);

  // CMS / Settings
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("+919347008039");
  const [email, setEmail] = useState("jrcodecrafterz@gmail.com");
  const [phone, setPhone] = useState("+919347008039");
  const [website, setWebsite] = useState("www.jrcodecrafterz.com");
  const [heroTitle, setHeroTitle] = useState("Learn Coding Live From Experts");
  const [heroTagline, setHeroTagline] = useState("Turning Young Minds Into Future-Ready Code Crafters");
  const [classRange, setClassRange] = useState("Classes 1–12");
  const [footerText, setFooterText] = useState("Turning young learners into certified future-ready creators, game developers, and tech innovators.");
  
  // Curriculum site settings
  const [curriculumTitle, setCurriculumTitle] = useState("JRCODECRAFTERZ Syllabus Outline");
  const [curriculumDesc, setCurriculumDesc] = useState("A comprehensive, structured syllabus designed to scale technical competency logically.");
  const [curriculumPdfUrl, setCurriculumPdfUrl] = useState("");
  const [curriculumOverview, setCurriculumOverview] = useState("Structured around project-based milestones to guarantee interactive comprehension.");
  const [curriculumTopics, setCurriculumTopics] = useState("Variables, conditionals, nested loops, visual canvas drawing, DOM controls, responsive HTML layouts, and ChatGPT prompt operations.");
  const [curriculumOutcomes, setCurriculumOutcomes] = useState("Build fully-functional games, deploy custom web apps, receive signed certificate validations.");

  // Certificate template configs
  const [certPrefix, setCertPrefix] = useState("JRCC-");
  const [certSignature, setCertSignature] = useState("Platform Director");

  const [settingsSaving, setSettingsSaving] = useState(false);

  // Manual course assignment
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignCourseId, setAssignCourseId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Create teacher account
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [creatingTeacher, setCreatingTeacher] = useState(false);
  const [createdTeacher, setCreatedTeacher] = useState<{ name: string; email: string; password: string } | null>(null);

  // Course Editor
  const [courseOpen, setCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null); // null = new course
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    price: "0",
    category: "Classes 1–12",
    curriculumPdfUrl: "",
    replayUrl: "",
    published: true,
    teacherId: "",
  });
  const [savingCourse, setSavingCourse] = useState(false);

  // Certificate Issuance
  const [manualCertStudentId, setManualCertStudentId] = useState("");
  const [manualCertCourseId, setManualCertCourseId] = useState("");
  const [issuingCert, setIssuingCert] = useState(false);
  const [showTeacherPw, setShowTeacherPw] = useState(false);

  // User Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRole, setSearchRole] = useState<"all" | "student" | "teacher">("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const students = users.filter((u) => u.role === "student");
  const teachers = users.filter((u) => u.role === "teacher");
  const unreadLeadsCount = leads.filter((l) => l.status === "unread").length;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, c, e, qr, pr, ld, certs, sch, qz, att, les, prog] = await Promise.all([
        getAllUsers(),
        getAllCourses(),
        getAllEnrollments(),
        getAllQuizResults(),
        getAllProjects(),
        getAllLeads(),
        getAllCertificates(),
        getAllSchedules(),
        getAllQuizzes(),
        getAllAttendance(),
        getAllLessons(),
        getAllProgress(),
      ]);
      setUsers(u as any[]);
      setCourses(c as any[]);
      setEnrollments(e as any[]);
      setQuizResults(qr as any[]);
      setProjects(pr as any[]);
      setLeads(ld as any[]);
      setCertificates(certs as any[]);
      setSchedules(sch as any[]);
      setQuizzes(qz as any[]);
      setAttendance(att as any[]);
      setLessons(les as any[]);
      setProgress(prog as any[]);
      // Also load site settings
      const settings = await getSiteSettings();
      if (settings) {
        setLogoUrl(settings.logoUrl || "");
        setWhatsappNumber(settings.whatsappNumber || "+919347008039");
        setEmail(settings.email || "jrcodecrafterz@gmail.com");
        setPhone(settings.phone || "+919347008039");
        setWebsite(settings.website || "www.jrcodecrafterz.com");
        setHeroTitle(settings.heroTitle || "Learn Coding Live From Experts");
        setHeroTagline(settings.heroTagline || "Turning Young Minds Into Future-Ready Code Crafters");
        setClassRange(settings.classRange || "Classes 1–12");
        setFooterText(settings.footerText || "Turning young learners into certified future-ready creators, game developers, and tech innovators.");

        if (settings.curriculum) {
          setCurriculumTitle(settings.curriculum.title || "JRCODECRAFTERZ Syllabus Outline");
          setCurriculumDesc(settings.curriculum.desc || "A comprehensive, structured syllabus designed to scale technical competency logically.");
          setCurriculumPdfUrl(settings.curriculum.pdfUrl || "");
          setCurriculumOverview(settings.curriculum.syllabusOverview || "Structured around project-based milestones to guarantee interactive comprehension.");
          setCurriculumTopics(settings.curriculum.topicsCovered || "Variables, conditionals, nested loops, visual canvas drawing, DOM controls, responsive HTML layouts, and ChatGPT prompt operations.");
          setCurriculumOutcomes(settings.curriculum.learningOutcomes || "Build fully-functional games, deploy custom web apps, receive signed certificate validations.");
        }

        setCertPrefix(settings.certPrefix || "JRCC-");
        setCertSignature(settings.certSignature || "Platform Director");
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

  const handleCreateTeacher = async () => {
    if (!teacherName.trim() || !teacherEmail.trim() || !teacherPassword.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (teacherPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreatingTeacher(true);
    try {
      // Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, teacherEmail.trim(), teacherPassword);
      // Write Firestore doc with teacher role
      await createUserDoc(cred.user.uid, {
        name: teacherName.trim(),
        email: teacherEmail.trim(),
        role: "teacher",
      });
      // Immediately sign out the newly created teacher account
      await firebaseSignOut(auth);
      // Show credentials card
      setCreatedTeacher({ name: teacherName.trim(), email: teacherEmail.trim(), password: teacherPassword });
      toast.success(`Teacher account created for ${teacherName.trim()}!`);
      setTeacherName("");
      setTeacherEmail("");
      setTeacherPassword("");
      fetchAll();
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        toast.error("This email is already registered");
      } else {
        toast.error(err.message || "Failed to create teacher account");
      }
    } finally {
      setCreatingTeacher(false);
    }
  };

  const handleAssignCourse = async () => {
    if (!assignStudentId || !assignCourseId) {
      toast.error("Please select both a student and a course");
      return;
    }
    // Check if already enrolled
    const alreadyEnrolled = enrollments.find(
      (e: any) => e.userId === assignStudentId && e.courseId === assignCourseId
    );
    if (alreadyEnrolled) {
      if (alreadyEnrolled.status === "approved") {
        toast.error("This student is already enrolled in that course");
        return;
      }
      // Pending → promote to approved
      await approveEnrollment(assignStudentId, assignCourseId);
      toast.success("Pending enrollment promoted to Approved!");
    } else {
      setAssigning(true);
      try {
        await enrollUser(assignStudentId, assignCourseId, "approved", assignNote || "admin-assigned");
        toast.success("Course assigned successfully! Student now has full access.");
        setAssignStudentId("");
        setAssignCourseId("");
        setAssignNote("");
        fetchAll();
      } catch {
        toast.error("Failed to assign course. Please try again.");
      } finally {
        setAssigning(false);
      }
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      const teacher = users.find((u) => u.id === courseForm.teacherId);
      const courseData = {
        title: courseForm.title,
        description: courseForm.description,
        thumbnailUrl: courseForm.thumbnailUrl,
        price: parseFloat(courseForm.price) || 0,
        category: courseForm.category || "Classes 1–12",
        curriculumPdfUrl: courseForm.curriculumPdfUrl,
        replayUrl: courseForm.replayUrl,
        published: courseForm.published,
        teacherId: courseForm.teacherId || "admin",
        teacherName: teacher ? teacher.name : "Admin / JRCODECRAFTERZ",
      };

      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData);
        toast.success("Course updated successfully!");
      } else {
        await createCourse(courseData);
        toast.success("Course created successfully!");
      }
      setCourseOpen(false);
      setEditingCourse(null);
      setCourseForm({
        title: "",
        description: "",
        thumbnailUrl: "",
        price: "0",
        category: "Classes 1–12",
        curriculumPdfUrl: "",
        replayUrl: "",
        published: true,
        teacherId: "",
      });
      fetchAll();
    } catch (err) {
      toast.error("Failed to save course. Please try again.");
    } finally {
      setSavingCourse(false);
    }
  };

  const handleManualCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCertStudentId || !manualCertCourseId) {
      toast.error("Select student and course!");
      return;
    }
    setIssuingCert(true);
    try {
      const student = users.find((u) => u.id === manualCertStudentId);
      const course = courses.find((c) => c.id === manualCertCourseId);
      if (!student || !course) throw new Error("Invalid student or course");

      const { certNumber } = await createCertificate({
        studentId: manualCertStudentId,
        studentName: student.name,
        courseId: manualCertCourseId,
        courseName: course.title,
        completionDate: new Date().toISOString().split("T")[0],
      });
      toast.success(`Certificate ${certNumber} generated successfully!`);
      setManualCertStudentId("");
      setManualCertCourseId("");
      fetchAll();
    } catch (err: any) {
      toast.error("Failed to generate certificate: " + err.message);
    } finally {
      setIssuingCert(false);
    }
  };

  const handleDeleteCert = async (certId: string) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    try {
      await deleteCertificate(certId);
      toast.success("Certificate deleted!");
      fetchAll();
    } catch {
      toast.error("Failed to delete certificate");
    }
  };

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
    { id: "certificates", label: "Certificates", icon: Award, count: certificates.length },
    { id: "search", label: "Search Profiles", icon: Search },
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
              onKeyDown={(e) => e.key === "Enter" && handleAdminAuth()}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-orange-500 text-slate-800 font-semibold"
            />
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg"
              onClick={handleAdminAuth}
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
            onClick={() => {
              sessionStorage.removeItem("admin_authed");
              setAuthed(false);
            }}
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
                    <motion.div variants={fadeInUp} className="space-y-6">

                      {/* ── CREATE TEACHER ACCOUNT ── */}
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 text-left flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-blue-500" /> Create Teacher Account
                        </h2>
                        <Card className="border-blue-100 shadow-md bg-white">
                          <CardContent className="p-6 text-left space-y-4">
                            <p className="text-xs text-slate-400 font-semibold">
                              Create a teacher login. Share the email &amp; password with the teacher — they can sign in immediately at <span className="font-mono text-slate-600">/login</span>.
                            </p>

                            <div className="grid sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. John Smith"
                                  value={teacherName}
                                  onChange={(e) => setTeacherName(e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                                <input
                                  type="email"
                                  placeholder="teacher@example.com"
                                  value={teacherEmail}
                                  onChange={(e) => setTeacherEmail(e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Password</label>
                                <div className="relative">
                                  <input
                                    type={showTeacherPw ? "text" : "password"}
                                    placeholder="Min. 6 characters"
                                    value={teacherPassword}
                                    onChange={(e) => setTeacherPassword(e.target.value)}
                                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-semibold"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowTeacherPw(!showTeacherPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <Button
                              disabled={!teacherName || !teacherEmail || !teacherPassword || creatingTeacher}
                              onClick={handleCreateTeacher}
                              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                              {creatingTeacher ? "Creating Account..." : <><UserPlus className="w-4 h-4" /> Create Teacher Account</>}
                            </Button>

                            {/* Success credentials card */}
                            {createdTeacher && (
                              <div className="mt-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left animate-fade-in">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" /> Account Created — Share These Credentials
                                  </p>
                                  <button
                                    onClick={() => setCreatedTeacher(null)}
                                    className="text-emerald-400 hover:text-emerald-600 text-xs font-bold cursor-pointer"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                                <div className="grid sm:grid-cols-3 gap-3">
                                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name</p>
                                    <p className="text-sm font-bold text-slate-800 select-all">{createdTeacher.name}</p>
                                  </div>
                                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                    <p className="text-sm font-bold text-slate-800 select-all">{createdTeacher.email}</p>
                                  </div>
                                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</p>
                                    <p className="text-sm font-bold text-slate-800 select-all font-mono">{createdTeacher.password}</p>
                                  </div>
                                </div>
                                <p className="text-[10px] text-emerald-600 font-semibold mt-3">
                                  ⚠️ Copy and share these credentials now — the password won't be shown again.
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* ── EXISTING TEACHERS LIST ── */}
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 text-left">All Teachers ({teachers.length})</h2>
                        {filterBy(teachers, ["name", "email", "id"]).map((tch: any) => (
                          <Card key={tch.id} className="border-slate-100 card-hover bg-white text-left mb-3">
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
                            <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-400">No teachers yet — create one above</p>
                          </div>
                        )}
                      </div>

                    </motion.div>
                  )}

                  {/* COURSES TAB */}
                  {tab === "courses" && (
                    <motion.div variants={fadeInUp} className="space-y-4 text-left">
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-base font-bold text-slate-900">Course Registry ({courses.length})</h2>
                        <Button
                          onClick={() => {
                            setEditingCourse(null);
                            setCourseForm({
                              title: "",
                              description: "",
                              thumbnailUrl: "",
                              price: "0",
                              category: "Classes 1–12",
                              curriculumPdfUrl: "",
                              replayUrl: "",
                              published: true,
                              teacherId: "",
                            });
                            setCourseOpen(true);
                          }}
                          className="gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                        >
                          <Plus className="w-4 h-4" /> Create Course
                        </Button>
                      </div>

                      {/* Course Dialog */}
                      <Dialog open={courseOpen} onOpenChange={setCourseOpen}>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white p-6 rounded-2xl shadow-xl">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-slate-900">
                              {editingCourse ? "Edit Course Details" : "Create New Course"}
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSaveCourse} className="space-y-4 mt-2">
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Course Title *</label>
                              <input
                                type="text" required
                                placeholder="e.g. Complete Python Bootcamp"
                                value={courseForm.title}
                                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Description</label>
                              <textarea
                                rows={3}
                                placeholder="Syllabus details or course objectives..."
                                value={courseForm.description}
                                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Category *</label>
                                <select
                                  value={courseForm.category}
                                  onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                                >
                                  <option value="Classes 1–12">Classes 1–12</option>
                                  <option value="Computer Basics">Computer Basics</option>
                                  <option value="MS Office">MS Office</option>
                                  <option value="AI Tools">AI Tools</option>
                                  <option value="Math Basics">Math Basics</option>
                                  <option value="Projects">Projects</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Price (₹) *</label>
                                <input
                                  type="number" required min="0"
                                  placeholder="0 for free"
                                  value={courseForm.price}
                                  onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Thumbnail Image URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={courseForm.thumbnailUrl}
                                onChange={(e) => setCourseForm({ ...courseForm, thumbnailUrl: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Curriculum Syllabus PDF URL</label>
                              <input
                                type="url"
                                placeholder="https://example.com/syllabus.pdf"
                                value={courseForm.curriculumPdfUrl}
                                onChange={(e) => setCourseForm({ ...courseForm, curriculumPdfUrl: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Live Class Replay URL</label>
                              <input
                                type="url"
                                placeholder="YouTube/Google Drive Recording link"
                                value={courseForm.replayUrl}
                                onChange={(e) => setCourseForm({ ...courseForm, replayUrl: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-500 uppercase">Assigned Instructor *</label>
                              <select
                                value={courseForm.teacherId}
                                onChange={(e) => setCourseForm({ ...courseForm, teacherId: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                              >
                                <option value="">Admin / JRCODECRAFTERZ</option>
                                {teachers.map((t) => (
                                  <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2 py-1">
                              <input
                                type="checkbox"
                                id="published"
                                checked={courseForm.published}
                                onChange={(e) => setCourseForm({ ...courseForm, published: e.target.checked })}
                                className="rounded text-orange-500 focus:ring-orange-500"
                              />
                              <label htmlFor="published" className="text-xs font-bold text-slate-600 cursor-pointer">
                                Publish course immediately
                              </label>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <Button type="button" variant="outline" onClick={() => setCourseOpen(false)} className="flex-1">
                                Cancel
                              </Button>
                              <Button type="submit" disabled={savingCourse} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold">
                                {savingCourse ? "Saving..." : "Save Course"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <div className="space-y-3">
                        {filterBy(courses, ["title", "teacherName", "id"]).map((c: any) => {
                          const count = enrollments.filter((e) => e.courseId === c.id).length;
                          return (
                            <Card key={c.id} className="border-slate-100 card-hover bg-white text-left">
                              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                                    <BookOpen className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-slate-900 truncate text-sm">{c.title}</p>
                                      <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">
                                        {c.category || "Classes 1–12"}
                                      </Badge>
                                      {!c.published && (
                                        <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold px-1.5 py-0">
                                          Draft
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-400 font-semibold mt-0.5">by {c.teacherName} · {count} Enrolled</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-orange-50 text-orange-600 border border-orange-200/50 hover:bg-orange-50 font-bold px-3 text-xs flex-shrink-0">
                                    {c.price === 0 ? "Free" : `₹${c.price}`}
                                  </Badge>
                                  <Link
                                    href={`/admin/courses/${c.id}`}
                                    className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-100/50 flex items-center justify-center hover:bg-orange-100 transition-colors flex-shrink-0 cursor-pointer"
                                    title="Manage Course Curriculum"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </Link>
                                  <button
                                    onClick={() => {
                                      setEditingCourse(c);
                                      setCourseForm({
                                        title: c.title ?? "",
                                        description: c.description ?? "",
                                        thumbnailUrl: c.thumbnailUrl ?? "",
                                        price: String(c.price ?? 0),
                                        category: c.category ?? "Classes 1–12",
                                        curriculumPdfUrl: c.curriculumPdfUrl ?? "",
                                        replayUrl: c.replayUrl ?? "",
                                        published: c.published !== false,
                                        teacherId: c.teacherId ?? "",
                                      });
                                      setCourseOpen(true);
                                    }}
                                    className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
                                    title="Edit course details"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCourse(c.id, c.title)}
                                    className="w-9 h-9 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0 cursor-pointer"
                                    title="Delete course"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

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

                      {/* ── MANUAL ASSIGN SECTION ── */}
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 text-left flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-orange-500" /> Manually Assign a Course
                        </h2>
                        <Card className="border-orange-100 shadow-md bg-white">
                          <CardContent className="p-6 text-left">
                            <p className="text-xs text-slate-400 font-semibold mb-5">
                              Instantly grant a student access to any course — no payment required. Perfect for scholarships, demo access, or admin-managed registrations.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Student</label>
                                <select
                                  value={assignStudentId}
                                  onChange={(e) => setAssignStudentId(e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white font-semibold text-slate-700"
                                >
                                  <option value="">— Choose a student —</option>
                                  {students.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Course</label>
                                <select
                                  value={assignCourseId}
                                  onChange={(e) => setAssignCourseId(e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white font-semibold text-slate-700"
                                >
                                  <option value="">— Choose a course —</option>
                                  {courses.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.title} {c.price > 0 ? `(₹${c.price})` : "(Free)"}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Preview — show selected student + course + existing enrollment status */}
                            {assignStudentId && assignCourseId && (() => {
                              const student = students.find((s: any) => s.id === assignStudentId);
                              const course = courses.find((c: any) => c.id === assignCourseId);
                              const existing = enrollments.find((e: any) => e.userId === assignStudentId && e.courseId === assignCourseId);
                              return (
                                <div className="mb-4 p-4 rounded-2xl bg-orange-50/50 border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="text-sm">
                                    <p className="font-bold text-slate-900">{student?.name} <span className="font-normal text-slate-400">→</span> {course?.title}</p>
                                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                      {existing
                                        ? existing.status === "approved"
                                          ? "⚠️ Already enrolled in this course"
                                          : "⏳ Has a pending payment request — will be promoted to Approved"
                                        : `✅ No existing enrollment — will grant access immediately`}
                                    </p>
                                  </div>
                                  {course?.price > 0 && (
                                    <Badge className="bg-orange-100 text-orange-600 border border-orange-200 hover:bg-orange-100 font-bold text-xs self-start sm:self-center flex-shrink-0">
                                      ₹{course.price} — Bypassed
                                    </Badge>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="mb-4">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Internal Note (optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. Scholarship, demo access, manual payment..."
                                value={assignNote}
                                onChange={(e) => setAssignNote(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                              />
                            </div>

                            <Button
                              disabled={!assignStudentId || !assignCourseId || assigning ||
                                !!enrollments.find((e: any) => e.userId === assignStudentId && e.courseId === assignCourseId && e.status === "approved")}
                              onClick={handleAssignCourse}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                            >
                              {assigning ? "Assigning..." : <><UserPlus className="w-4 h-4" /> Assign Course & Grant Access</>}
                            </Button>
                          </CardContent>
                        </Card>
                      </div>

                      {/* ── PENDING REQUESTS SECTION ── */}
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


                  {/* CERTIFICATES TAB */}
                  {tab === "certificates" && (
                    <motion.div variants={fadeInUp} className="space-y-8 text-left">
                      
                      {/* Certificate Templates & Signature Settings */}
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-orange-500" /> Certificate Template Settings
                        </h2>
                        <Card className="border-orange-100 shadow-md bg-white">
                          <CardContent className="p-6">
                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              setSettingsSaving(true);
                              try {
                                await updateSiteSettings({ certPrefix, certSignature });
                                toast.success("Certificate template settings saved!");
                              } catch {
                                toast.error("Failed to save template settings");
                              } finally {
                                setSettingsSaving(false);
                              }
                            }} className="grid sm:grid-cols-2 gap-4 items-end">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Serial Number Prefix</label>
                                <input
                                  type="text" required
                                  placeholder="e.g. JRCC-"
                                  value={certPrefix}
                                  onChange={(e) => setCertPrefix(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold animate-fade-in"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Authorized Signature Name / Title</label>
                                <input
                                  type="text" required
                                  placeholder="e.g. CEO, JRCODECRAFTERZ"
                                  value={certSignature}
                                  onChange={(e) => setCertSignature(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold animate-fade-in"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <Button
                                  type="submit"
                                  disabled={settingsSaving}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
                                >
                                  {settingsSaving ? "Saving..." : "Save Template Settings"}
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Manual Certificate Issuance Form */}
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Award className="w-5 h-5 text-orange-500" /> Manually Issue Certificate
                        </h2>
                        <Card className="border-orange-100 shadow-md bg-white">
                          <CardContent className="p-6">
                            <form onSubmit={handleManualCertSubmit} className="grid sm:grid-cols-2 gap-4 items-end">
                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Select Graduate Student</label>
                                <select
                                  value={manualCertStudentId}
                                  onChange={(e) => setManualCertStudentId(e.target.value)}
                                  required
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                                >
                                  <option value="">Choose Student...</option>
                                  {students.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Select Course</label>
                                <select
                                  value={manualCertCourseId}
                                  onChange={(e) => setManualCertCourseId(e.target.value)}
                                  required
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                                >
                                  <option value="">Choose Course...</option>
                                  {courses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <Button
                                  type="submit"
                                  disabled={issuingCert || !manualCertStudentId || !manualCertCourseId}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
                                >
                                  {issuingCert ? "Generating Certificate..." : "Issue & Generate Certificate"}
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Generated Certificate List */}
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Issued Certificates Registry ({certificates.length})</h2>
                        <div className="space-y-3">
                          {certificates.map((cert: any) => (
                            <Card key={cert.id} className="border-slate-100 bg-white shadow-sm">
                              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                                    <Award className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-sm truncate">{cert.studentName}</p>
                                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                      Course: {cert.courseName} · Date: {cert.completionDate}
                                    </p>
                                    <p className="text-[10px] font-mono text-orange-500 mt-1 font-bold">
                                      Serial: {cert.certNumber}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`/certificates/${cert.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-xl text-xs font-bold text-orange-500 transition-colors inline-block"
                                  >
                                    View / Download PDF
                                  </a>
                                  <button
                                    onClick={() => handleDeleteCert(cert.id)}
                                    className="w-9 h-9 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0 cursor-pointer"
                                    title="Delete certificate"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                          {certificates.length === 0 && (
                            <div className="text-center py-12 border border-dashed rounded-3xl bg-white">
                              <Award className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                              <p className="text-sm font-semibold text-slate-400">No certificates generated yet</p>
                            </div>
                          )}
                        </div>
                      </div>
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
                                 placeholder="e.g. Learn Coding Live From Experts"
                                 value={heroTitle}
                                 onChange={(e) => setHeroTitle(e.target.value)}
                                 className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                               />
                             </div>

                             <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Platform Tagline</label>
                               <input
                                 type="text"
                                 placeholder="e.g. Turning Young Minds Into Future-Ready Code Crafters"
                                 value={heroTagline}
                                 onChange={(e) => setHeroTagline(e.target.value)}
                                 className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                               />
                             </div>

                             <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Email Address</label>
                               <input
                                 type="email"
                                 placeholder="info@jrcodecrafterz.com"
                                 value={email}
                                 onChange={(e) => setEmail(e.target.value)}
                                 className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                               />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Phone</label>
                                 <input
                                   type="text"
                                   placeholder="+919347008039"
                                   value={phone}
                                   onChange={(e) => setPhone(e.target.value)}
                                   className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                                 />
                               </div>
                               <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Website URL</label>
                                 <input
                                   type="text"
                                   placeholder="www.jrcodecrafterz.com"
                                   value={website}
                                   onChange={(e) => setWebsite(e.target.value)}
                                   className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                                 />
                               </div>
                             </div>

                             <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Class Range</label>
                               <input
                                 type="text"
                                 placeholder="Classes 1–12"
                                 value={classRange}
                                 onChange={(e) => setClassRange(e.target.value)}
                                 className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                               />
                             </div>

                             <div className="border-t border-slate-100 pt-4 mt-2">
                               <h4 className="text-sm font-bold text-slate-900 mb-3">Landing Page Curriculum Syllabus CMS</h4>
                               <div className="space-y-4">
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Curriculum Headline</label>
                                   <input
                                     type="text"
                                     value={curriculumTitle}
                                     onChange={(e) => setCurriculumTitle(e.target.value)}
                                     className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                                   />
                                 </div>
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Curriculum Brief Subtitle</label>
                                   <textarea
                                     rows={2}
                                     value={curriculumDesc}
                                     onChange={(e) => setCurriculumDesc(e.target.value)}
                                     className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                                   />
                                 </div>
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Curriculum PDF URL</label>
                                   <input
                                     type="url"
                                     placeholder="https://..."
                                     value={curriculumPdfUrl}
                                     onChange={(e) => setCurriculumPdfUrl(e.target.value)}
                                     className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                                   />
                                 </div>
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Curriculum Overview Milestone</label>
                                   <textarea
                                     rows={2}
                                     value={curriculumOverview}
                                     onChange={(e) => setCurriculumOverview(e.target.value)}
                                     className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                                   />
                                 </div>
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Topics Covered List</label>
                                   <textarea
                                     rows={2}
                                     value={curriculumTopics}
                                     onChange={(e) => setCurriculumTopics(e.target.value)}
                                     className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                                   />
                                 </div>
                                 <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Learning Outcomes List</label>
                                   <textarea
                                     rows={2}
                                     value={curriculumOutcomes}
                                     onChange={(e) => setCurriculumOutcomes(e.target.value)}
                                     className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                                   />
                                 </div>
                               </div>
                             </div>

                             <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Footer Description Text</label>
                               <textarea
                                 rows={2}
                                 placeholder="e.g. Turning young learners into certified..."
                                 value={footerText}
                                 onChange={(e) => setFooterText(e.target.value)}
                                 className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                               />
                             </div>

                             <Button
                               disabled={settingsSaving}
                               onClick={async () => {
                                 setSettingsSaving(true);
                                 try {
                                   await updateSiteSettings({
                                     logoUrl,
                                     whatsappNumber,
                                     email,
                                     phone,
                                     website,
                                     heroTitle,
                                     heroTagline,
                                     classRange,
                                     footerText,
                                     curriculum: {
                                       title: curriculumTitle,
                                       desc: curriculumDesc,
                                       pdfUrl: curriculumPdfUrl,
                                       syllabusOverview: curriculumOverview,
                                       topicsCovered: curriculumTopics,
                                       learningOutcomes: curriculumOutcomes,
                                     }
                                   });
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

                  {tab === "search" && (
                    <motion.div variants={fadeInUp} className="space-y-6 text-left">
                      {!selectedUser ? (
                        <div className="space-y-4">
                          <div>
                            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">User Profiles History</h2>
                            <p className="text-xs text-slate-400 font-semibold mt-0.5">Search and inspect any student or teacher account, enrollment, quizzes, projects, and attendance.</p>
                          </div>

                          <Card className="border-slate-100 shadow-sm bg-white">
                            <CardContent className="p-4 flex gap-3 flex-wrap items-center">
                              <div className="flex-1 min-w-[240px] relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Search by name, email, or user ID..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500 text-slate-800"
                                />
                              </div>
                              <select
                                value={searchRole}
                                onChange={(e) => setSearchRole(e.target.value as any)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500 bg-white text-slate-700"
                              >
                                <option value="all">All Roles</option>
                                <option value="student">Students Only</option>
                                <option value="teacher">Teachers Only</option>
                              </select>
                            </CardContent>
                          </Card>

                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {users
                              .filter((u: any) => {
                                const q = searchQuery.toLowerCase().trim();
                                const matchesSearch =
                                  !q ||
                                  u.name?.toLowerCase().includes(q) ||
                                  u.email?.toLowerCase().includes(q) ||
                                  u.id?.toLowerCase().includes(q);
                                const matchesRole =
                                  searchRole === "all" || u.role === searchRole;
                                return matchesSearch && matchesRole;
                              })
                              .slice(0, 48)
                              .map((u: any) => {
                                const isStudent = u.role === "student";
                                return (
                                  <Card
                                    key={u.id}
                                    onClick={() => setSelectedUser(u)}
                                    className="border-slate-100 card-hover bg-white cursor-pointer"
                                  >
                                    <CardContent className="p-4 flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white bg-gradient-to-br from-orange-400 to-orange-600 shadow-md">
                                        {(u.name?.[0] ?? "?").toUpperCase()}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="font-bold text-slate-900 truncate text-sm">{u.name}</p>
                                          <Badge className={`text-[8px] font-black px-1.5 py-0.5 uppercase tracking-wide flex-shrink-0 ${isStudent ? "bg-indigo-50 text-indigo-700 border border-indigo-150" : "bg-emerald-50 text-emerald-700 border border-emerald-150"}`}>
                                            {u.role}
                                          </Badge>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{u.email}</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            {users.length === 0 && (
                              <div className="col-span-full text-center py-16 border rounded-3xl bg-white shadow-sm">
                                <p className="text-sm font-semibold text-slate-400">No matching user profiles found</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Details Header */}
                          <Card className="border-slate-100 shadow-sm bg-white">
                            <CardContent className="p-5 flex items-center gap-4">
                              <button
                                onClick={() => setSelectedUser(null)}
                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 border border-slate-150 flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
                                title="Back to User List"
                              >
                                <ArrowLeft className="w-5 h-5" />
                              </button>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight">{selectedUser.name}</h2>
                                  <Badge className={`text-[9px] font-black px-2 py-0.5 uppercase tracking-wider ${selectedUser.role === "student" ? "bg-indigo-100 text-indigo-800 border-indigo-200" : "bg-emerald-100 text-emerald-800 border-emerald-200"}`}>
                                    {selectedUser.role}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">
                                  Email: <span className="text-slate-650">{selectedUser.email}</span> · User ID: <span className="text-slate-600 font-mono">{selectedUser.id}</span>
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Profile Overview columns */}
                          <div className="grid lg:grid-cols-3 gap-6 items-start">
                            {/* Left Column - Card Summary */}
                            <div className="space-y-4">
                              <Card className="border-slate-100 shadow-sm bg-white">
                                <CardContent className="p-6">
                                  <div className="flex flex-col items-center text-center">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white bg-gradient-to-br from-orange-400 to-orange-600 shadow-md mb-3">
                                      {(selectedUser.name?.[0] ?? "?").toUpperCase()}
                                    </div>
                                    <h3 className="font-extrabold text-slate-900 text-base">{selectedUser.name}</h3>
                                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{selectedUser.email}</p>
                                    <Badge variant="outline" className="mt-2.5 font-bold px-2 py-0.5 text-[10px] text-slate-500 bg-slate-50 border-slate-200">
                                      UID: {selectedUser.id}
                                    </Badge>
                                  </div>

                                  <div className="border-t border-slate-100 mt-6 pt-5 space-y-4 text-xs font-semibold text-slate-600">
                                    {selectedUser.role === "student" ? (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Enrolled Courses:</span>
                                          <span className="text-slate-800 font-extrabold">{enrollments.filter((e) => e.userId === selectedUser.id).length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Quizzes Taken:</span>
                                          <span className="text-slate-800 font-extrabold">{quizResults.filter((r) => r.userId === selectedUser.id).length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Projects Submitted:</span>
                                          <span className="text-slate-800 font-extrabold">{projects.filter((p) => p.studentId === selectedUser.id && p.status !== "assigned").length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Attendance Logged:</span>
                                          <span className="text-slate-800 font-extrabold">{attendance.filter((a) => a.studentId === selectedUser.id).length}</span>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Courses Teaching:</span>
                                          <span className="text-slate-800 font-extrabold">{courses.filter((c) => c.teacherId === selectedUser.id).length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Schedules (Live):</span>
                                          <span className="text-slate-800 font-extrabold">{schedules.filter((s) => s.teacherId === selectedUser.id).length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Quizzes Created:</span>
                                          <span className="text-slate-800 font-extrabold">
                                            {quizzes.filter((q) => {
                                              const c = courses.find((crs) => crs.id === q.courseId);
                                              return c && c.teacherId === selectedUser.id;
                                            }).length}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Right Column - User History details */}
                            <div className="lg:col-span-2">
                              {selectedUser.role === "student" ? (
                                <Tabs defaultValue="courses" className="w-full">
                                  <TabsList className="bg-slate-100 p-1 rounded-xl w-full grid grid-cols-4">
                                    <TabsTrigger value="courses" className="rounded-lg text-xs font-bold py-2">Courses</TabsTrigger>
                                    <TabsTrigger value="quizzes" className="rounded-lg text-xs font-bold py-2">Quizzes</TabsTrigger>
                                    <TabsTrigger value="projects" className="rounded-lg text-xs font-bold py-2">Projects</TabsTrigger>
                                    <TabsTrigger value="attendance" className="rounded-lg text-xs font-bold py-2">Attendance</TabsTrigger>
                                  </TabsList>

                                  {/* Student Courses Tab */}
                                  <TabsContent value="courses" className="space-y-3 mt-4 text-left">
                                    {enrollments.filter((e) => e.userId === selectedUser.id).length === 0 ? (
                                      <p className="text-xs text-slate-400 text-center py-8 font-semibold">No courses enrolled</p>
                                    ) : (
                                      enrollments
                                        .filter((e) => e.userId === selectedUser.id)
                                        .map((e) => {
                                          const c = courses.find((crs) => crs.id === e.courseId);
                                          if (!c) return null;
                                          const courseLessons = lessons.filter((l) => l.courseId === c.id);
                                          const progressDoc = progress.find((p) => p.id === `${selectedUser.id}_${c.id}`);
                                          const completedCount = progressDoc ? (progressDoc.completedLessons || []).length : 0;
                                          const progressPercent = courseLessons.length > 0 ? Math.round((completedCount / courseLessons.length) * 100) : 0;

                                          return (
                                            <Card key={e.id} className="border-slate-100 bg-white">
                                              <CardContent className="p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                  <div>
                                                    <p className="text-sm font-bold text-slate-900">{c.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">by {c.teacherName || "JRCODECRAFTERZ"}</p>
                                                  </div>
                                                  <Badge className={`text-[8px] font-black uppercase ${e.status === "approved" ? "bg-green-50 text-green-700 border border-green-200" : "bg-yellow-50 text-yellow-700 border border-yellow-250 animate-pulse"}`}>
                                                    {e.status}
                                                  </Badge>
                                                </div>
                                                <div className="space-y-1 mt-3">
                                                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                                    <span>Course Progress</span>
                                                    <span>{completedCount} / {courseLessons.length} Lessons ({progressPercent}%)</span>
                                                  </div>
                                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-orange-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          );
                                        })
                                    )}
                                  </TabsContent>

                                  {/* Student Quizzes Tab */}
                                  <TabsContent value="quizzes" className="space-y-3 mt-4 text-left">
                                    {quizResults.filter((r) => r.userId === selectedUser.id).length === 0 ? (
                                      <p className="text-xs text-slate-400 text-center py-8 font-semibold">No quizzes taken yet</p>
                                    ) : (
                                      quizResults
                                        .filter((r) => r.userId === selectedUser.id)
                                        .map((r) => {
                                          const q = quizzes.find((qz) => qz.id === r.quizId);
                                          const c = courses.find((crs) => crs.id === r.courseId);
                                          return (
                                            <Card key={r.id} className="border-slate-100 bg-white">
                                              <CardContent className="p-4 flex items-center justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-sm font-bold text-slate-900 truncate">{q?.title || "Quiz Submission"}</p>
                                                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">Course: {c?.title || "Unknown Course"}</p>
                                                  <p className="text-[9px] text-slate-400 font-semibold mt-1">Submitted: {format(new Date(r.submittedAt), "dd MMM yyyy, hh:mm a")}</p>
                                                </div>
                                                <Badge className="bg-orange-50 text-orange-600 border border-orange-200/50 hover:bg-orange-50 font-black text-xs px-2.5 py-1">
                                                  Score: {r.score} / {r.totalQuestions}
                                                </Badge>
                                              </CardContent>
                                            </Card>
                                          );
                                        })
                                    )}
                                  </TabsContent>

                                  {/* Student Projects Tab */}
                                  <TabsContent value="projects" className="space-y-3 mt-4 text-left">
                                    {projects.filter((p) => p.studentId === selectedUser.id).length === 0 ? (
                                      <p className="text-xs text-slate-400 text-center py-8 font-semibold">No projects assigned</p>
                                    ) : (
                                      projects
                                        .filter((p) => p.studentId === selectedUser.id)
                                        .map((p) => {
                                          const c = courses.find((crs) => crs.id === p.courseId);
                                          return (
                                            <Card key={p.id} className="border-slate-100 bg-white">
                                              <CardContent className="p-4 space-y-3">
                                                <div className="flex items-start justify-between gap-4">
                                                  <div>
                                                    <p className="text-sm font-bold text-slate-900">{p.title}</p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{p.description}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-2">Course: {c?.title || "Unknown Course"}</p>
                                                  </div>
                                                  <Badge className={`text-[8px] font-black uppercase flex-shrink-0 ${p.status === "graded" ? "bg-green-50 text-green-700 border border-green-200" : p.status === "submitted" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                                                    {p.status}
                                                  </Badge>
                                                </div>

                                                {p.submissionLink && (
                                                  <div className="pt-2 border-t flex flex-col gap-1.5 text-[11px] font-semibold text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                      <span className="text-slate-400">Submission URL:</span>
                                                      <a href={p.submissionLink} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline truncate max-w-sm">{p.submissionLink}</a>
                                                    </div>
                                                    {p.status === "graded" && (
                                                      <div className="p-2 rounded-lg bg-slate-50 mt-1 flex flex-col gap-1">
                                                        <div className="flex justify-between">
                                                          <span className="text-[10px] font-bold text-slate-400 uppercase">Grade:</span>
                                                          <Badge variant={p.grade >= 70 ? "success" : p.grade >= 40 ? "warning" : "danger"} className="text-[9px] font-black px-1.5 py-0">{p.grade} / 100</Badge>
                                                        </div>
                                                        {p.feedback && <p className="text-[10px] text-slate-600 italic mt-0.5">"{p.feedback}"</p>}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </CardContent>
                                            </Card>
                                          );
                                        })
                                    )}
                                  </TabsContent>

                                  {/* Student Attendance Tab */}
                                  <TabsContent value="attendance" className="space-y-3 mt-4 text-left">
                                    {attendance.filter((a) => a.studentId === selectedUser.id).length === 0 ? (
                                      <p className="text-xs text-slate-400 text-center py-8 font-semibold">No attendance logged yet</p>
                                    ) : (
                                      attendance
                                        .filter((a) => a.studentId === selectedUser.id)
                                        .map((a) => {
                                          const c = courses.find((crs) => crs.id === a.courseId);
                                          const isPresent = a.status === "present";
                                          return (
                                            <Card key={a.id} className="border-slate-100 bg-white">
                                              <CardContent className="p-4 flex items-center justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-sm font-bold text-slate-900 truncate">Course: {c?.title || "Unknown Course"}</p>
                                                  <p className="text-[9px] text-slate-400 font-bold mt-1">Class Date: {a.date}</p>
                                                </div>
                                                <Badge className={`text-[9px] font-black uppercase px-2 py-0.5 flex-shrink-0 ${isPresent ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                                  {a.status}
                                                </Badge>
                                              </CardContent>
                                            </Card>
                                          );
                                        })
                                    )}
                                  </TabsContent>
                                </Tabs>
                              ) : (
                                <Tabs defaultValue="courses" className="w-full">
                                  <TabsList className="bg-slate-100 p-1 rounded-xl w-full grid grid-cols-4">
                                    <TabsTrigger value="courses" className="rounded-lg text-xs font-bold py-2">Courses</TabsTrigger>
                                    <TabsTrigger value="live-classes" className="rounded-lg text-xs font-bold py-2">Live Classes</TabsTrigger>
                                    <TabsTrigger value="quizzes" className="rounded-lg text-xs font-bold py-2">Quizzes</TabsTrigger>
                                    <TabsTrigger value="projects" className="rounded-lg text-xs font-bold py-2">Projects</TabsTrigger>
                                  </TabsList>

                                  {/* Teacher Courses Tab */}
                                  <TabsContent value="courses" className="space-y-3 mt-4 text-left">
                                    {courses.filter((c) => c.teacherId === selectedUser.id).length === 0 ? (
                                      <p className="text-xs text-slate-400 text-center py-8 font-semibold">No courses created</p>
                                    ) : (
                                      courses
                                        .filter((c) => c.teacherId === selectedUser.id)
                                        .map((c) => {
                                          const enrollCount = enrollments.filter((e) => e.courseId === c.id).length;
                                          return (
                                            <Card key={c.id} className="border-slate-100 bg-white">
                                              <CardContent className="p-4 flex items-center justify-between gap-4">
                                                <div>
                                                  <p className="text-sm font-bold text-slate-900">{c.title}</p>
                                                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Category: {c.category || "Classes 1–12"} · Enrolled: {enrollCount} students</p>
                                                  <p className="text-[9px] text-slate-400 font-semibold mt-1">Price: {c.price === 0 ? "Free" : `₹${c.price}`}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Badge className={`text-[8px] font-black uppercase ${c.published !== false ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                                                    {c.published !== false ? "Published" : "Draft"}
                                                  </Badge>
                                                  <Link
                                                    href={`/admin/courses/${c.id}`}
                                                    className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 border border-orange-100/50 flex items-center justify-center hover:bg-orange-100 transition-colors flex-shrink-0 cursor-pointer"
                                                    title="Manage Content"
                                                  >
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                  </Link>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          );
                                        })
                                    )}
                                  </TabsContent>

                                  {/* Teacher Live Classes (Schedules) Tab */}
                                  <TabsContent value="live-classes" className="space-y-3 mt-4 text-left">
                                    {schedules.filter((s) => s.teacherId === selectedUser.id).length === 0 ? (
                                      <p className="text-xs text-slate-400 text-center py-8 font-semibold">No live classes scheduled</p>
                                    ) : (
                                      schedules
                                        .filter((s) => s.teacherId === selectedUser.id)
                                        .map((s) => {
                                          const c = courses.find((crs) => crs.id === s.courseId);
                                          return (
                                            <Card key={s.id} className="border-slate-100 bg-white">
                                              <CardContent className="p-4 flex items-center justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-sm font-bold text-slate-900 truncate">{s.title}</p>
                                                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate">Course: {c?.title || "Unknown Course"}</p>
                                                  <p className="text-[9px] text-slate-400 font-bold mt-1">Schedule: {s.date} @ {s.time}</p>
                                                </div>
                                                {s.meetLink && (
                                                  <a href={s.meetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200/50 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors flex-shrink-0">
                                                    Join Meet <ExternalLink className="w-3 h-3" />
                                                  </a>
                                                )}
                                              </CardContent>
                                            </Card>
                                          );
                                        })
                                    )}
                                  </TabsContent>

                                  {/* Teacher Quizzes Tab */}
                                  <TabsContent value="quizzes" className="space-y-3 mt-4 text-left">
                                    {quizzes.filter((q) => {
                                      const c = courses.find((crs) => crs.id === q.courseId);
                                      return c && c.teacherId === selectedUser.id;
                                    }).length === 0 ? (
                                      <p className="text-xs text-slate-400 text-center py-8 font-semibold">No quizzes created</p>
                                    ) : (
                                      quizzes
                                        .filter((q) => {
                                          const c = courses.find((crs) => crs.id === q.courseId);
                                          return c && c.teacherId === selectedUser.id;
                                        })
                                        .map((q) => {
                                          const c = courses.find((crs) => crs.id === q.courseId);
                                          return (
                                            <Card key={q.id} className="border-slate-100 bg-white">
                                              <CardContent className="p-4 flex items-center justify-between gap-4">
                                                <div>
                                                  <p className="text-sm font-bold text-slate-900">{q.title}</p>
                                                  <p className="text-[10px] text-slate-405 font-bold mt-0.5">Course: {c?.title || "Unknown Course"}</p>
                                                  <p className="text-[9px] text-slate-400 font-semibold mt-1">Questions: {q.questions?.length ?? 0}</p>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          );
                                        })
                                    )}
                                  </TabsContent>

                                  {/* Teacher Projects Tab */}
                                  <TabsContent value="projects" className="space-y-3 mt-4 text-left">
                                    {projects.filter((p) => {
                                      const c = courses.find((crs) => crs.id === p.courseId);
                                      return c && c.teacherId === selectedUser.id;
                                    }).length === 0 ? (
                                      <p className="text-xs text-slate-400 text-center py-8 font-semibold">No student projects assigned</p>
                                    ) : (
                                      projects
                                        .filter((p) => {
                                          const c = courses.find((crs) => crs.id === p.courseId);
                                          return c && c.teacherId === selectedUser.id;
                                        })
                                        .map((p) => {
                                          const c = courses.find((crs) => crs.id === p.courseId);
                                          const student = users.find((u) => u.id === p.studentId);
                                          return (
                                            <Card key={p.id} className="border-slate-100 bg-white">
                                              <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                  <div>
                                                    <p className="text-sm font-bold text-slate-900">{p.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Student: {student?.name || "Unknown Student"} · Course: {c?.title || "Unknown Course"}</p>
                                                  </div>
                                                  <Badge className={`text-[8px] font-black uppercase ${p.status === "graded" ? "bg-green-50 text-green-700 border border-green-200" : p.status === "submitted" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                                                    {p.status}
                                                  </Badge>
                                                </div>
                                                {p.status === "graded" && (
                                                  <div className="mt-2 p-2 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 flex justify-between">
                                                    <span>Grade: {p.grade}/100</span>
                                                    {p.feedback && <span className="italic">"{p.feedback}"</span>}
                                                  </div>
                                                )}
                                              </CardContent>
                                            </Card>
                                          );
                                        })
                                    )}
                                  </TabsContent>
                                </Tabs>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
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
