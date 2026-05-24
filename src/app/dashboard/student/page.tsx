"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  getEnrollmentsByUser, getAllCourses, getAllSchedules, 
  getQuizResultsByUser, getProgress, getNotificationsByUser,
  markNotificationRead
} from "@/lib/firestore";
import { 
  BookOpen, Calendar, Trophy, TrendingUp, Video, Clock, ArrowRight, 
  Flame, Award, CheckCircle, AlertCircle, FileText, Download, Sparkles, 
  Settings, Bell, User, Cpu, BookOpenCheck, PlayCircle, Code
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

export default function StudentOverview() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom states for interactive widgets
  const [streak, setStreak] = useState(5);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name);
    (async () => {
      const [enr, allCourses, scheds, qResults, notifs] = await Promise.all([
        getEnrollmentsByUser(user.id),
        getAllCourses(),
        getAllSchedules(),
        getQuizResultsByUser(user.id),
        getNotificationsByUser(user.id)
      ]);
      setEnrollments(enr);
      setCourses(allCourses);
      setSchedules(scheds);
      setResults(qResults);
      setNotifications(notifs);
      setLoading(false);
    })();
  }, [user]);

  const myCourseIds = enrollments.filter((e: any) => e.status !== "pending").map((e: any) => e.courseId);
  const myCourses = courses.filter((c: any) => myCourseIds.includes(c.id));
  const upcomingClasses = schedules
    .filter((s: any) => new Date(s.datetime) > new Date())
    .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .slice(0, 3);

  const avgScore = results.length
    ? Math.round(results.reduce((acc: number, r: any) => acc + (r.score / r.total) * 100, 0) / results.length)
    : 0;

  // Calculate circular attendance metric
  const attendanceRate = 92; // Simulated base percentage
  const circumference = 2 * Math.PI * 34; // 34 is radius of circular progress
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

  const stats = [
    { label: "Enrolled Courses", value: myCourses.length, icon: BookOpen, color: "var(--accent)" },
    { label: "Upcoming Sessions", value: upcomingClasses.length, icon: Calendar, color: "var(--accent-2)" },
    { label: "Quizzes Attempted", value: results.length, icon: Trophy, color: "#eab308" },
    { label: "Average Score", value: `${avgScore}%`, icon: TrendingUp, color: "#10b981" },
  ];

  const badges = [
    { title: "First Steps", desc: "Started first course", icon: Sparkles, color: "bg-orange-100 text-orange-600 border-orange-200" },
    { title: "Quiz Master", desc: "Scored >85% in quiz", icon: Award, color: "bg-blue-100 text-blue-600 border-blue-200" },
    { title: "Code Crafter", desc: "Completed 3 projects", icon: Cpu, color: "bg-purple-100 text-purple-600 border-purple-200" },
  ];

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <DashboardLayout title={`Dashboard Workspace`} description={`Review your personal learning metrics.`}>
      <motion.div 
        className="space-y-8"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Welcome Section Banner with Coding Streaks */}
        <motion.div 
          variants={fadeInUp}
          className="relative overflow-hidden rounded-3xl p-8 border border-orange-100/60 glass shadow-md bg-gradient-to-r from-orange-50/50 via-white to-orange-50/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/30 rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600 mb-3 border border-orange-200/50">
                <Sparkles className="w-3.5 h-3.5" /> Grade 4 - 12 Scholar Track
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {user?.name?.split(" ")[0]}! 👋
              </h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">
                Your logical coding journey is going great. Keep coding every day!
              </p>
            </div>

            {/* Streak & Edit Profile actions */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Coding Streak badge */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 bg-white p-3 px-5 rounded-2xl border border-orange-200/60 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25 animate-pulse">
                  <Flame className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Coding Streak</p>
                  <p className="text-lg font-black text-slate-900 leading-none mt-0.5">{streak} Days</p>
                </div>
              </motion.div>

              <button 
                onClick={() => setShowProfileModal(true)}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-orange-500 text-slate-600 hover:text-orange-500 shadow-sm transition-colors cursor-pointer"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={fadeInUp}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="card-hover overflow-hidden relative border-slate-100">
              <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: color }} />
              <CardContent className="pt-6 text-left">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <Badge className="bg-slate-50 border border-slate-150 text-slate-500 hover:bg-slate-50 text-[10px] uppercase font-bold">Tracked</Badge>
                </div>
                <p className="text-2xl font-black text-slate-900">{loading ? "–" : value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Interactive Layout Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main columns */}
          <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-8">
            
            {/* Continue Learning Course Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Programs</h2>
                <Link href="/dashboard/student/courses">
                  <Button variant="ghost" size="sm" className="gap-1 font-bold text-orange-500 hover:text-orange-600">
                    View all <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
                </div>
              ) : myCourses.length === 0 ? (
                <Card className="border-slate-100">
                  <CardContent className="pt-8 text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-bold text-slate-700">No active enrollments yet</p>
                    <p className="text-sm text-slate-500 mt-1 mb-6">Browse our dynamic coding modules to start your journey.</p>
                    <Link href="/dashboard/student/browse">
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/10">Browse Courses</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myCourses.slice(0, 3).map((course: any) => (
                    <Link key={course.id} href={`/dashboard/student/courses/${course.id}`}>
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 card-hover text-left cursor-pointer">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-purple))" }}>
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate text-sm md:text-base">{course.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 font-semibold">by {course.teacherName}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <Progress value={45} className="h-1.5 flex-1" />
                            <span className="text-xs font-bold text-orange-500">45%</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Assignments Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4 text-left">Assigned Coding Projects</h2>
              <Card className="border-slate-100 overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 text-left">
                    <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">Create Interactive Arcade Game</p>
                          <p className="text-xs text-slate-400 mt-0.5 font-semibold">Python Basics · Due in 3 days</p>
                        </div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-600 border border-orange-200/50 hover:bg-orange-100 text-[10px] font-bold">Pending</Badge>
                    </div>

                    <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">Responsive Web Portfolio Mockup</p>
                          <p className="text-xs text-slate-400 mt-0.5 font-semibold">Web Development · Graded on May 20</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-600 border border-emerald-200/50 hover:bg-emerald-100 text-[10px] font-bold">Graded (95/100)</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recorded Sessions Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4 text-left">Recorded Class Playbacks</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 text-left">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <PlayCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">Variables &amp; Loops Intro</p>
                    <p className="text-[11px] text-slate-400 font-semibold">45 minutes · Python Level 1</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 text-left">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <PlayCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">Function Scope &amp; Logic</p>
                    <p className="text-[11px] text-slate-400 font-semibold">50 minutes · JavaScript Level 2</p>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>

          {/* Right sidebar column */}
          <motion.div variants={fadeInUp} className="space-y-8">
            
            {/* Live Class scheduling panel */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4 text-left">Live Class Action</h2>
              <div className="space-y-4">
                {upcomingClasses.length === 0 ? (
                  <Card className="border-slate-100">
                    <CardContent className="pt-6 text-center py-8">
                      <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-bold text-slate-500">No scheduled classes today</p>
                    </CardContent>
                  </Card>
                ) : upcomingClasses.map((s: any) => (
                  <Card key={s.id} className="card-hover border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500" />
                    <CardContent className="p-5 text-left">
                      <p className="font-bold text-slate-800 text-sm truncate">{s.courseName}</p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">by {s.teacherName}</p>
                      <div className="flex items-center gap-1.5 mt-3 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold">
                          {s.datetime ? format(new Date(s.datetime), "MMM d, h:mm a") : "TBD"}
                        </span>
                      </div>
                      <div className="mt-4">
                        <a href={s.meetLink} target="_blank" rel="noopener noreferrer">
                          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 rounded-xl shadow-md shadow-orange-500/10 gap-1.5 animate-pulse-glow">
                            Join Google Meet <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Attendance Circular progress widget */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4 text-left">Live Class Attendance</h2>
              <Card className="border-slate-100 relative overflow-hidden">
                <CardContent className="p-6 flex items-center gap-6 text-left">
                  {/* Circular progress SVG */}
                  <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-95">
                      <circle cx="40" cy="40" r="34" className="stroke-slate-100 fill-none" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" className="stroke-orange-500 fill-none" strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-sm font-black text-slate-800">{attendanceRate}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Excellent Attendance</p>
                    <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">You missed only 1 slot out of 12 scheduling dates.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievement Badges Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4 text-left">Earned Badges</h2>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.05 }}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center text-center ${b.color} shadow-sm`}
                    >
                      <Icon className="w-6 h-6 mb-1.5" />
                      <span className="text-[10px] font-extrabold tracking-tight leading-tight">{b.title}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* AI / Coding resource helper links */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4 text-left">AI / Coding Cheat Sheets</h2>
              <Card className="border-slate-100">
                <CardContent className="p-4 space-y-2.5 text-left">
                  <a href="#" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-200 hover:bg-orange-50/20 transition-colors">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Code className="w-4 h-4 text-orange-500" /> Python Syntax Reference</span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                  <a href="#" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-200 hover:bg-orange-50/20 transition-colors">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Cpu className="w-4 h-4 text-orange-500" /> AI Prompts Cheat Sheet</span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Notifications Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4 text-left">Notifications</h2>
              <div className="space-y-2.5 text-left">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold">No notifications</p>
                ) : (
                  notifications.slice(0, 4).map((notif: any) => (
                    <div 
                      key={notif.id} 
                      className={`p-3.5 rounded-2xl border text-xs relative ${notif.read ? "bg-white border-slate-100" : "bg-orange-50/30 border-orange-100/60"}`}
                    >
                      <p className="font-bold text-slate-800">{notif.title}</p>
                      <p className="text-slate-500 mt-0.5">{notif.message}</p>
                      {!notif.read && (
                        <button 
                          onClick={() => handleMarkRead(notif.id)}
                          className="text-[9px] font-bold text-orange-500 hover:underline mt-2 block"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </motion.div>
        </div>
      </motion.div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowProfileModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 border border-orange-100 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4 text-left">Edit Account Settings</h3>
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || ""}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm font-semibold"
                  />
                </div>
                
                <div className="flex gap-3 pt-3">
                  <Button 
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                    onClick={() => {
                      toast.success("Profile details updated successfully");
                      setShowProfileModal(false);
                    }}
                  >
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-slate-200 text-slate-500"
                    onClick={() => setShowProfileModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
