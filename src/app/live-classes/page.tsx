"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAllSchedules, getSchedulesForStudent, getSchedulesByTeacher,
  createSchedule, updateSchedule, deleteSchedule, endSchedule,
  getAllCourses, getCoursesByTeacher,
  getEnrollmentsByCourse, getAllUsers, getSiteSettings
} from "@/lib/firestore";
import {
  Radio, Calendar, Clock, Plus, ExternalLink, Pencil, Trash2,
  Video, X, Check, Monitor, StopCircle, MessageCircle, Users,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

interface LiveClass {
  id: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  datetime: string;
  meetLink: string;
  description?: string;
  createdAt?: string;
  ended?: boolean;
  studentIds?: string[];
  studentNames?: string[];
  materials?: { name: string; url: string; type?: string }[];
  recordingUrl?: string;
}

export default function LiveClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("+919347008039");
  // Re-render once a minute so a session automatically leaves "Live Now"
  // when its two-hour window passes, without needing a page refresh.
  const [now, setNow] = useState(() => new Date());

  // Form state
  const [formCourseId, setFormCourseId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStudentIds, setFormStudentIds] = useState<string[]>([]);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const liveClassDateRef = useRef<HTMLInputElement>(null);

  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allClasses, allCourses, settings] = await Promise.all([
        user?.role === "student"
          ? getSchedulesForStudent(user.id)
          : user?.role === "teacher"
            ? getSchedulesByTeacher(user.id)
            : getAllSchedules(),
        isTeacherOrAdmin && user?.role === "teacher"
          ? getCoursesByTeacher(user.id)
          : getAllCourses(),
        getSiteSettings()
      ]);

      if (settings?.whatsappNumber) setWhatsappNumber(settings.whatsappNumber);

      setClasses(allClasses as LiveClass[]);
      setCourses(allCourses as any[]);
      if (allCourses.length > 0 && !formCourseId) {
        setFormCourseId((allCourses as any[])[0].id);
      }
    } catch {
      toast.error("Failed to load live classes");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Load the approved students for the selected course so the teacher can
  // choose exactly who the class is for.
  useEffect(() => {
    if (!showForm || !formCourseId || !isTeacherOrAdmin) {
      setCourseStudents([]);
      return;
    }
    (async () => {
      try {
        const [enrollments, allUsers] = await Promise.all([
          getEnrollmentsByCourse(formCourseId),
          getAllUsers(),
        ]);
        const usersMap: Record<string, any> = {};
        (allUsers as any[]).forEach((u: any) => { usersMap[u.id] = u; });
        const students = (enrollments as any[])
          .filter((e: any) => e.status === "approved")
          .map((e: any) => usersMap[(e as any).userId])
          .filter(Boolean);
        setCourseStudents(students);
        setFormStudentIds((prev) => (prev.length > 0 ? prev : students.map((s: any) => s.id)));
      } catch {
        setCourseStudents([]);
      }
    })();
  }, [showForm, formCourseId, isTeacherOrAdmin]);

  const resetForm = () => {
    setFormDate("");
    setFormLink("");
    setFormDesc("");
    setFormStudentIds([]);
    setEditingClass(null);
    setShowForm(false);
    if (courses.length > 0) setFormCourseId(courses[0].id);
  };

  const handleOpenEdit = (cls: any) => {
    setEditingClass(cls);
    setFormCourseId(cls.courseId);
    setFormDate(cls.datetime ? cls.datetime.slice(0, 16) : "");
    setFormLink(cls.meetLink || "");
    setFormDesc(cls.description || "");
    setFormStudentIds(Array.isArray(cls.studentIds) ? cls.studentIds : []);
    setShowForm(true);
  };

  // Build a WhatsApp link to notify the selected students when a class is scheduled
  const buildWhatsAppLinks = async (courseId: string, courseName: string, datetime: string, studentIds: string[]) => {
    try {
      const [enrollments, allUsers] = await Promise.all([
        getEnrollmentsByCourse(courseId),
        getAllUsers()
      ]);
      const usersMap: Record<string, any> = {};
      (allUsers as any[]).forEach((u: any) => { usersMap[u.id] = u; });
      const selectedIds = new Set(studentIds);

      const approvedEnr = (enrollments as any[]).filter(
        (e: any) => e.status === "approved" && (selectedIds.size === 0 || selectedIds.has(e.userId))
      );
      const formattedDate = datetime ? format(new Date(datetime), "EEEE, MMM d 'at' h:mm a") : "";

      // Open WhatsApp for each enrolled student who has a phone number
      let opened = 0;
      for (const enr of approvedEnr) {
        const student = usersMap[(enr as any).userId];
        if (student?.phone) {
          const phone = student.phone.replace(/\D/g, "");
          const teacherName = user?.name || "Your Instructor";
          const msg = encodeURIComponent(
            `Dear ${student.name},\n\nThis is ${teacherName}, your Instructor at Jrcodecrafterz.\nYour class on "${courseName}" is scheduled for ${formattedDate}.\n\nPlease be ready to join on time. You can join via your dashboard at www.jrcodecrafterz.com.\n\nRegards,\n${teacherName}\nJrcodecrafterz.`
          );
          // ponytail: opens one tab per student; for large classes, bulk SMS preferred
          window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
          opened++;
        }
      }

      if (opened === 0) {
        toast.info("No enrolled students with phone numbers found. Share manually.");
      } else {
        toast.success(`WhatsApp opened for ${opened} student(s)`);
      }
    } catch {
      toast.error("Could not load student contacts");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formLink) {
      toast.error("Date/time and meet link are required");
      return;
    }
    if (courseStudents.length === 0) {
      toast.error("This course has no approved students to invite");
      return;
    }
    if (formStudentIds.length === 0) {
      toast.error("Select at least one student for this class");
      return;
    }
    setSubmitting(true);
    try {
      const course = courses.find((c) => c.id === formCourseId);
      const selectedStudents = courseStudents.filter((s) => formStudentIds.includes(s.id));
      const payload = {
        courseId: formCourseId,
        courseName: course?.title || "Live Class",
        teacherId: user?.id,
        teacherName: user?.name,
        datetime: formDate,
        meetLink: formLink,
        description: formDesc,
        studentIds: selectedStudents.map((s) => s.id),
        studentNames: selectedStudents.map((s) => s.name),
      };

      if (editingClass) {
        await updateSchedule(editingClass.id, payload);
        toast.success("Live class updated!");
      } else {
        await createSchedule(payload);
        toast.success("Live class scheduled!");
        // Prompt teacher to send WhatsApp notifications
        if (course) {
          await buildWhatsAppLinks(formCourseId, course.title, formDate, payload.studentIds);
        }
      }
      resetForm();
      fetchData();
    } catch {
      toast.error("Failed to save live class");
    }
    setSubmitting(false);
  };

  const handleEndClass = async (cls: LiveClass) => {
    if (!confirm(`End "${cls.courseName}"? This will mark it as completed and add earnings.`)) return;
    try {
      await endSchedule(cls.id);
      toast.success("Class ended — earnings updated!");
      fetchData();
    } catch {
      toast.error("Failed to end class");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this live class? This cannot be undone.")) return;
    try {
      await deleteSchedule(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      toast.success("Live class removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // A session stays "live" for two hours after its start time. After that
  // window it belongs to Past Sessions even if the teacher never clicked
  // "End class", so yesterday's class can no longer show a stale Live badge.
  const CLASS_LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;
  const classStart = (cls: LiveClass) => new Date(cls.datetime).getTime();
  const isExpired = (cls: LiveClass) => {
    const start = classStart(cls);
    return !cls.ended && Number.isFinite(start) && now.getTime() >= start + CLASS_LIVE_WINDOW_MS;
  };
  const upcoming = classes
    .filter((c) => !c.ended && !isExpired(c))
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  const past = classes
    .filter((c) => c.ended === true || isExpired(c))
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  // For display: only a session inside its live window shows as "Live Now".
  const isLiveNow = (cls: LiveClass) => {
    const start = classStart(cls);
    return (
      !cls.ended &&
      Number.isFinite(start) &&
      start <= now.getTime() &&
      now.getTime() < start + CLASS_LIVE_WINDOW_MS
    );
  };

  const targetNamesFor = (cls: any) => {
    if (Array.isArray(cls.studentNames) && cls.studentNames.length > 0) {
      return cls.studentNames.join(", ");
    }
    if (Array.isArray(cls.studentIds) && cls.studentIds.length > 0) {
      return cls.studentIds.join(", ");
    }
    return "All enrolled students";
  };

  return (
    <DashboardLayout
      title="Live Classes"
      description={isTeacherOrAdmin ? "Manage and schedule live coding sessions" : "Join your live coding sessions"}
    >
      <motion.div className="space-y-8" initial="hidden" animate="visible" variants={staggerContainer}>

        {/* Header row */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600 border border-orange-200/50 mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Coding Sessions
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {isTeacherOrAdmin ? "Manage Live Classes" : "Your Live Classes"}
            </h2>
          </div>
          {isTeacherOrAdmin && (
            <Button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 gap-2 rounded-2xl"
            >
              <Plus className="w-4 h-4" /> Schedule New Class
            </Button>
          )}
        </motion.div>

        {/* Create / Edit Form */}
        <AnimatePresence>
          {showForm && isTeacherOrAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-orange-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      {editingClass ? "Edit Live Class" : "Schedule a New Live Class"}
                    </h3>
                    <button onClick={resetForm} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Course</label>
                      <select
                        value={formCourseId}
                        onChange={(e) => { setFormCourseId(e.target.value); setFormStudentIds([]); }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white font-semibold"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Visible To</label>
                        {courseStudents.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormStudentIds(
                              formStudentIds.length === courseStudents.length ? [] : courseStudents.map((s: any) => s.id)
                            )}
                            className="text-[11px] font-bold text-orange-500 hover:underline"
                          >
                            {formStudentIds.length === courseStudents.length ? "Clear all" : "Select all"}
                          </button>
                        )}
                      </div>
                      {courseStudents.length === 0 ? (
                        <p className="text-xs text-slate-400 font-semibold p-3 rounded-xl border border-dashed border-slate-200">
                          No approved students in this course yet.
                        </p>
                      ) : (
                        <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 p-2 space-y-1">
                          {courseStudents.map((student: any) => (
                            <label key={student.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formStudentIds.includes(student.id)}
                                onChange={() => setFormStudentIds((prev) =>
                                  prev.includes(student.id)
                                    ? prev.filter((id) => id !== student.id)
                                    : [...prev, student.id]
                                )}
                                className="w-4 h-4 accent-orange-500"
                              />
                              <span className="text-sm font-semibold text-slate-700">{student.name}</span>
                              <span className="text-[11px] text-slate-400 ml-auto">{student.email}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 font-semibold mt-1">
                        Only selected students will see this class and its documents.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date & Start Time</label>
                      <div className="relative flex items-center">
                        <input
                          ref={liveClassDateRef}
                          type="datetime-local"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          required
                          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            try { liveClassDateRef.current?.showPicker(); } catch (err) { console.error(err); }
                          }}
                          className="absolute right-3 text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
                          title="Open calendar picker"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Google Meet Link</label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                        value={formLink}
                        onChange={(e) => setFormLink(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (optional)</label>
                      <textarea
                        rows={2}
                        placeholder="What will be covered in this session..."
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold resize-none"
                      />
                    </div>

                    <div className="sm:col-span-2 flex gap-3">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20"
                      >
                        {submitting ? "Saving..." : editingClass ? <><Check className="w-4 h-4" /> Update Class</> : <><Plus className="w-4 h-4" /> Publish & Notify via WhatsApp</>}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm} className="px-6 rounded-xl border-slate-200">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Upcoming Sessions", value: upcoming.length, color: "#ea580c", bg: "bg-orange-50 border-orange-100" },
            { label: "Past Sessions", value: past.length, color: "#64748b", bg: "bg-slate-50 border-slate-100" },
            { label: "Total Classes", value: classes.length, color: "#3b82f6", bg: "bg-blue-50 border-blue-100" },
          ].map((s) => (
            <Card key={s.label} className={`border ${s.bg} overflow-hidden`}>
              <CardContent className="py-4 px-5 text-left">
                <p className="text-2xl font-black" style={{ color: s.color }}>{loading ? "–" : s.value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Upcoming / Live classes */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-orange-500 animate-pulse" /> Upcoming & Active Sessions
          </h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <Card className="border-slate-100">
              <CardContent className="py-12 text-center">
                <Monitor className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="font-bold text-slate-400">No upcoming live classes scheduled</p>
                {isTeacherOrAdmin && (
                  <Button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Schedule First Class
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {upcoming.map((cls) => (
                <motion.div key={cls.id} whileHover={{ y: -4 }} className="group">
                  <Card className="border-slate-100 overflow-hidden relative card-hover h-full">
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${isLiveNow(cls) ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-orange-400 to-amber-500"}`} />
                    <CardContent className="p-5 text-left flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${isLiveNow(cls) ? "bg-red-50 border-red-100 text-red-500" : "bg-orange-50 border-orange-100 text-orange-500"}`}>
                          <Video className="w-5 h-5" />
                        </div>
                        {isLiveNow(cls) ? (
                          <Badge className="bg-red-100 text-red-600 border border-red-200/50 hover:bg-red-100 text-[9px] font-bold uppercase animate-pulse">
                            🔴 Live Now
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-600 border border-green-200/50 hover:bg-green-100 text-[9px] font-bold uppercase">
                            Upcoming
                          </Badge>
                        )}
                      </div>

                      <p className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{cls.courseName}</p>
                      <p className="text-xs text-slate-400 font-semibold mb-2">by {cls.teacherName}</p>
                      <p className="text-[11px] text-slate-500 font-semibold mb-2 flex items-center gap-1 line-clamp-2">
                        <Users className="w-3 h-3 flex-shrink-0" /> For: {targetNamesFor(cls)}
                      </p>
                      {cls.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{cls.description}</p>
                      )}

                      <div className="flex items-center gap-1.5 text-slate-400 mb-4 mt-auto">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold">
                          {cls.datetime ? format(new Date(cls.datetime), "MMM d, yyyy · h:mm a") : "TBD"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={cls.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/15"
                        >
                          Join Meet <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {isTeacherOrAdmin && (
                          <>
                            {/* WhatsApp notify button */}
                            <button
                              onClick={() => buildWhatsAppLinks(cls.courseId, cls.courseName, cls.datetime, Array.isArray(cls.studentIds) ? cls.studentIds : [])}
                              className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors"
                              title="Notify students via WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            {isLiveNow(cls) && (
                              <button
                                onClick={() => handleEndClass(cls)}
                                className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                                title="End class"
                              >
                                <StopCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEdit(cls)}
                              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-orange-500 hover:border-orange-300 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(cls.id)}
                              className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Past classes */}
        {past.length > 0 && (
          <motion.div variants={fadeInUp}>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Past Sessions
            </h2>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {past.map((cls) => (
                <Card key={cls.id} className="border-slate-100 overflow-hidden opacity-75">
                  <CardContent className="p-5 text-left">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                      <Badge className={`text-[9px] font-bold uppercase ${cls.ended ? "bg-slate-100 text-slate-500 border border-slate-200/50 hover:bg-slate-100" : "bg-amber-100 text-amber-700 border border-amber-200/50 hover:bg-amber-100"}`}>
                        {cls.ended ? "Completed" : "Not ended"}
                      </Badge>
                    </div>
                    <p className="font-bold text-slate-700 text-sm mb-1 line-clamp-2">{cls.courseName}</p>
                    <p className="text-xs text-slate-400 font-semibold mb-1">by {cls.teacherName}</p>
                    <p className="text-[11px] text-slate-500 font-semibold mb-3 flex items-center gap-1 line-clamp-1">
                      <Users className="w-3 h-3 flex-shrink-0" /> For: {targetNamesFor(cls)}
                    </p>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {cls.datetime ? format(new Date(cls.datetime), "MMM d, yyyy · h:mm a") : "TBD"}
                      </span>
                    </div>

                    {/* Documents and recordings stay available after the class ends */}
                    {((cls as any).materials?.length > 0 || (cls as any).recordingUrl) && (
                      <div className="mt-3 space-y-1.5">
                        {(cls as any).recordingUrl && (
                          <a
                            href={(cls as any).recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            <Video className="w-3.5 h-3.5" /> Watch class recording
                          </a>
                        )}
                        {((cls as any).materials || []).map((material: any, idx: number) => (
                          <a
                            key={`${material.url}-${idx}`}
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" /> {material.name}
                          </a>
                        ))}
                      </div>
                    )}
                    {isTeacherOrAdmin && (
                      <div className="flex gap-2 mt-3">
                        {!cls.ended && (
                          <button
                            onClick={() => handleEndClass(cls)}
                            className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                            title="End class and record earnings"
                          >
                            <StopCircle className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(cls)}
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-orange-500 hover:border-orange-300 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(cls.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
