"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  getCoursesByTeacher, getEnrollmentsByCourse, getSchedulesByTeacher, 
  getAllUsers, createSchedule, createAssignment, recordAttendance, 
  createNotification, getSiteSettings 
} from "@/lib/firestore";
import { 
  BookOpen, Users, Calendar, IndianRupee, ArrowRight, Clock, Plus, 
  FileText, Megaphone, CheckCircle2, ChevronDown, Check, X, Sparkles, Monitor
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

export default function TeacherOverview() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState("+919347008039");

  useEffect(() => {
    getSiteSettings().then((settings) => {
      if (settings?.whatsappNumber) {
        setWhatsappNumber(settings.whatsappNumber);
      }
    });
  }, []);

  const [allStudentsList, setAllStudentsList] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [courseEarnings, setCourseEarnings] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab controllers for teacher tools
  const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "attendance" | "assignments" | "announcements">("overview");

  // Scheduling Form state
  const [schedCourseId, setSchedCourseId] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedLink, setSchedLink] = useState("");

  // Assignment Form state
  const [assignCourseId, setAssignCourseId] = useState("");
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignDue, setAssignDue] = useState("");

  // Announcement Form state
  const [annCourseId, setAnnCourseId] = useState("");
  const [annMessage, setAnnMessage] = useState("");

  // Attendance Form state
  const [attCourseId, setAttCourseId] = useState("");
  const [attStudents, setAttStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: boolean }>({});

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [myCourses, scheds, allUsers] = await Promise.all([
      getCoursesByTeacher(user.id),
      getSchedulesByTeacher(user.id),
      getAllUsers()
    ]);
    setCourses(myCourses);
    setSchedules(scheds);

    if (myCourses.length > 0) {
      setSchedCourseId(myCourses[0].id);
      setAssignCourseId(myCourses[0].id);
      setAnnCourseId(myCourses[0].id);
      setAttCourseId(myCourses[0].id);
    }

    // Map all student roles
    const studentsMap = allUsers.filter((u: any) => u.role === "student");
    setAllStudentsList(studentsMap);

    let studentSet = new Set<string>();
    let earnings = 0;
    const perCourse: any[] = [];

    await Promise.all(myCourses.map(async (c: any) => {
      const enr = await getEnrollmentsByCourse(c.id);
      enr.forEach((e: any) => studentSet.add(e.userId));
      const courseRevenue = enr.length * (c.price || 0);
      earnings += courseRevenue;
      perCourse.push({
        id: c.id,
        title: c.title,
        price: c.price || 0,
        enrolled: enr.length,
        revenue: courseRevenue,
        studentIds: enr.map((e: any) => e.userId)
      });
    }));

    setTotalStudents(studentSet.size);
    setTotalEarnings(earnings);
    setCourseEarnings(perCourse.sort((a, b) => b.revenue - a.revenue));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Load students when attendance course changes
  useEffect(() => {
    if (!attCourseId || courseEarnings.length === 0) return;
    const currentCourse = courseEarnings.find(ce => ce.id === attCourseId);
    if (currentCourse) {
      const enrolledStudentIds = currentCourse.studentIds || [];
      const studentsInCourse = allStudentsList.filter(s => enrolledStudentIds.includes(s.id));
      setAttStudents(studentsInCourse);
      // Initialize attendance state to all present (true)
      const initialMap: { [id: string]: boolean } = {};
      studentsInCourse.forEach(s => {
        initialMap[s.id] = true;
      });
      setAttendanceRecords(initialMap);
    } else {
      setAttStudents([]);
    }
  }, [attCourseId, courseEarnings, allStudentsList]);

  const upcoming = schedules
    .filter((s: any) => s.datetime && new Date(s.datetime) > new Date())
    .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .slice(0, 3);

  const stats = [
    { label: "Courses Created", value: courses.length, icon: BookOpen, color: "var(--accent)" },
    { label: "Active Students", value: totalStudents, icon: Users, color: "var(--accent-2)" },
    { label: "Upcoming Classes", value: upcoming.length, icon: Calendar, color: "#eab308" },
    { label: "Earnings", value: `₹${totalEarnings.toLocaleString()}`, icon: IndianRupee, color: "#10b981" },
  ];

  // Forms Submissions Handlers
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedDate || !schedLink) {
      toast.error("Please fill in date and meet link");
      return;
    }
    try {
      const course = courses.find(c => c.id === schedCourseId);
      await createSchedule({
        courseId: schedCourseId,
        courseName: course?.title || "Coding Class",
        teacherId: user?.id,
        teacherName: user?.name,
        datetime: schedDate,
        meetLink: schedLink
      });
      toast.success("Live class scheduled successfully!");
      setSchedDate("");
      setSchedLink("");
      fetchData(); // Refresh list
      setActiveTab("overview");
    } catch {
      toast.error("Failed to schedule class");
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle || !assignDesc || !assignDue) {
      toast.error("Please fill in all assignment details");
      return;
    }
    try {
      await createAssignment({
        courseId: assignCourseId,
        title: assignTitle,
        description: assignDesc,
        dueDate: assignDue,
        teacherId: user?.id,
        createdAt: new Date().toISOString()
      });

      // Notify students in the course
      const currentCourse = courseEarnings.find(ce => ce.id === assignCourseId);
      const studentIds = currentCourse?.studentIds || [];
      await Promise.all(studentIds.map((sid: any) => 
        createNotification({
          userId: sid,
          title: "New Assignment Published",
          message: `New assignment "${assignTitle}" due on ${assignDue}. Check your dashboard.`
        })
      ));

      toast.success("Assignment assigned successfully!");
      setAssignTitle("");
      setAssignDesc("");
      setAssignDue("");
      setActiveTab("overview");
    } catch {
      toast.error("Failed to assign homework");
    }
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annMessage) {
      toast.error("Announcement message cannot be empty");
      return;
    }
    try {
      const currentCourse = courseEarnings.find(ce => ce.id === annCourseId);
      const studentIds = currentCourse?.studentIds || [];
      
      await Promise.all(studentIds.map((sid: any) => 
        createNotification({
          userId: sid,
          title: "Class Announcement",
          message: annMessage
        })
      ));

      toast.success("Announcement published and notifications sent!");
      setAnnMessage("");
      setActiveTab("overview");
    } catch {
      toast.error("Failed to post announcement");
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attStudents.length === 0) {
      toast.error("No students registered in this course");
      return;
    }
    try {
      const dateString = format(new Date(), "yyyy-MM-dd");
      await Promise.all(
        attStudents.map(student => 
          recordAttendance({
            courseId: attCourseId,
            studentId: student.id,
            studentName: student.name,
            date: dateString,
            status: attendanceRecords[student.id] ? "present" : "absent"
          })
        )
      );
      toast.success("Attendance sheet recorded successfully!");
      setActiveTab("overview");
    } catch {
      toast.error("Failed to save attendance logs");
    }
  };

  return (
    <DashboardLayout title={`Teacher Workspace`} description={`Manage live sessions, earnings, and coding challenges.`} allowedRoles={["teacher", "admin"]}>
      <motion.div 
        className="space-y-8"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Navigation Tabs */}
        <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 border-b border-slate-100 pb-3 text-left">
          <Button 
            onClick={() => setActiveTab("overview")}
            className={`rounded-xl font-bold text-xs px-4 py-2 ${activeTab === "overview" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"}`}
          >
            Overview &amp; Revenue
          </Button>
          <Button 
            onClick={() => setActiveTab("schedule")}
            className={`rounded-xl font-bold text-xs px-4 py-2 ${activeTab === "schedule" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"}`}
          >
            Schedule Live Class
          </Button>
          <Button 
            onClick={() => setActiveTab("attendance")}
            className={`rounded-xl font-bold text-xs px-4 py-2 ${activeTab === "attendance" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"}`}
          >
            Mark Attendance
          </Button>
          <Button 
            onClick={() => setActiveTab("assignments")}
            className={`rounded-xl font-bold text-xs px-4 py-2 ${activeTab === "assignments" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"}`}
          >
            Assign Project
          </Button>
          <Button 
            onClick={() => setActiveTab("announcements")}
            className={`rounded-xl font-bold text-xs px-4 py-2 ${activeTab === "announcements" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"}`}
          >
            Send Announcement
          </Button>
        </motion.div>

        {/* Dynamic Panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="border-slate-100 card-hover relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: color }} />
                      <CardContent className="pt-6 text-left">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                          <Badge className="bg-slate-50 text-slate-400 border border-slate-150 text-[9px] font-bold">Metrics</Badge>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{loading ? "–" : value}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* My Courses */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
                      <Link href="/dashboard/teacher/courses">
                        <Button variant="ghost" size="sm" className="gap-1 text-orange-500 font-bold hover:text-orange-600">
                          Manage Catalog <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>

                    {loading ? (
                      <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
                    ) : courses.length === 0 ? (
                      <Card className="border-slate-100">
                        <CardContent className="pt-6 text-center py-10">
                          <p className="text-sm font-semibold text-slate-400 mb-4">No courses published yet</p>
                          <Link href="/dashboard/teacher/courses">
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg">Create Course</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {courses.slice(0, 4).map((c: any) => (
                          <Link key={c.id} href={`/dashboard/teacher/courses/${c.id}`}>
                            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-100 bg-white card-hover text-left cursor-pointer">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-orange))" }}>
                                <BookOpen className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 truncate text-sm">{c.title}</p>
                                <p className="text-xs text-slate-500 font-semibold mt-0.5">₹{c.price ?? 0} · Course ID: {c.id}</p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Schedule */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900">Upcoming Live Sessions</h2>
                      <button onClick={() => setActiveTab("schedule")} className="text-xs text-orange-500 font-bold hover:underline cursor-pointer">
                        Add Slots +
                      </button>
                    </div>

                    {loading ? (
                      <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
                    ) : upcoming.length === 0 ? (
                      <Card className="border-slate-100">
                        <CardContent className="pt-6 text-center py-10">
                          <p className="text-sm font-semibold text-slate-400 mb-4">No scheduled live classrooms</p>
                          <Button onClick={() => setActiveTab("schedule")} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg">Schedule Class</Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {upcoming.map((s: any) => (
                          <Card key={s.id} className="border-slate-100 card-hover relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500" />
                            <CardContent className="p-4 text-left flex justify-between items-center gap-4">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500">
                                  <Monitor className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 text-sm truncate">{s.courseName}</p>
                                  <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-semibold">
                                      {s.datetime ? format(new Date(s.datetime), "MMM d, h:mm a") : "TBD"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border border-orange-200/40 text-[9px] font-bold">Active Meet</Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Course-wise Earnings breakdown */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-4 text-left">Course Earnings breakdown</h2>
                  {loading ? (
                    <div className="space-y-2">{[1, 2].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
                  ) : courseEarnings.length === 0 ? (
                    <Card className="border-slate-100">
                      <CardContent className="pt-6 text-center py-10">
                        <IndianRupee className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-400">No course payments found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-slate-100 overflow-hidden">
                      <CardContent className="p-4 space-y-2 text-left">
                        {courseEarnings.map((ce: any) => (
                          <div key={ce.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <IndianRupee className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{ce.title}</p>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                  {ce.enrolled} student{ce.enrolled !== 1 ? "s" : ""} · {ce.price > 0 ? `₹${ce.price}/student` : "Free Program"}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-black text-emerald-600 ml-3">
                              ₹{ce.revenue.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* SCHEDULE LIVE CLASS TAB */}
            {activeTab === "schedule" && (
              <Card className="border-orange-100 max-w-xl mx-auto shadow-md">
                <CardContent className="p-6 text-left space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5"><Calendar className="w-5 h-5 text-orange-500" /> Schedule Google Meet Session</h3>
                  <form onSubmit={handleScheduleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Program Course</label>
                      <select 
                        value={schedCourseId}
                        onChange={(e) => setSchedCourseId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white font-semibold"
                      >
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date &amp; Start Time</label>
                      <input 
                        type="datetime-local" 
                        value={schedDate}
                        onChange={(e) => setSchedDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Google Meet Link</label>
                      <input 
                        type="url" 
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                        value={schedLink}
                        onChange={(e) => setSchedLink(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20">
                      Publish Schedule Class
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ATTENDANCE MARK TAB */}
            {activeTab === "attendance" && (
              <Card className="border-orange-100 max-w-2xl mx-auto shadow-md">
                <CardContent className="p-6 text-left space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5"><Users className="w-5 h-5 text-orange-500" /> Record Student Attendance</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Program Course</label>
                    <select 
                      value={attCourseId}
                      onChange={(e) => setAttCourseId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white font-semibold"
                    >
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>

                  <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student Enrollment List</p>
                    
                    {attStudents.length === 0 ? (
                      <p className="text-sm font-semibold text-slate-400 text-center py-6 border rounded-2xl bg-slate-50 border-dashed">No students currently enrolled in this course.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {attStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                            <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                            <div className="flex gap-2">
                              <button 
                                type="button"
                                onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: true }))}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${attendanceRecords[student.id] ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"}`}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: false }))}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${!attendanceRecords[student.id] ? "bg-red-500 text-white border-red-500" : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button type="submit" disabled={attStudents.length === 0} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 mt-4">
                      Save Attendance Sheet
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ASSIGN PROJECT TAB */}
            {activeTab === "assignments" && (
              <Card className="border-orange-100 max-w-xl mx-auto shadow-md">
                <CardContent className="p-6 text-left space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5"><FileText className="w-5 h-5 text-orange-500" /> Assign Coding Project</h3>
                  <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Program Course</label>
                      <select 
                        value={assignCourseId}
                        onChange={(e) => setAssignCourseId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white font-semibold"
                      >
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Assignment Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Build Python Weather App"
                        value={assignTitle}
                        onChange={(e) => setAssignTitle(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instructions / Description</label>
                      <textarea 
                        rows={4}
                        placeholder="Write detailed homework rules..."
                        value={assignDesc}
                        onChange={(e) => setAssignDesc(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                      <input 
                        type="date" 
                        value={assignDue}
                        onChange={(e) => setAssignDue(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20">
                      Assign Homework Project
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* SEND ANNOUNCEMENT TAB */}
            {activeTab === "announcements" && (
              <Card className="border-orange-100 max-w-xl mx-auto shadow-md">
                <CardContent className="p-6 text-left space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5"><Megaphone className="w-5 h-5 text-orange-500" /> Send Class Announcement</h3>
                  <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Program Course</label>
                      <select 
                        value={annCourseId}
                        onChange={(e) => setAnnCourseId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white font-semibold"
                      >
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Announcement Message</label>
                      <textarea 
                        rows={5}
                        placeholder="Type class announcements here (e.g. Schedule delay, next week homework checks)..."
                        value={annMessage}
                        onChange={(e) => setAnnMessage(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20">
                      Publish Announcement Notification
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      {/* Floating WhatsApp support */}
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
        title="Contact Support on WhatsApp"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </DashboardLayout>
  );
}
