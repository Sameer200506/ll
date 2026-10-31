"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getCoursesByTeacher,
  createSchedule,
  getSchedulesByTeacher,
  deleteSchedule,
  getEnrollmentsByCourse,
  getAllUsers,
  updateSchedule,
} from "@/lib/firestore";
import {
  Plus, Calendar, Clock, ExternalLink, Trash2, Video, Users,
  FileText, Paperclip, X, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";

interface ScheduleMaterial {
  name: string;
  url: string;
  type?: string;
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ courseId: "", datetime: "", meetLink: "", studentIds: [] as string[] });
  const dateRef = useRef<HTMLInputElement>(null);

  // Class materials (documents / links / recording)
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [materialSchedule, setMaterialSchedule] = useState<any>(null);
  const [materialDraft, setMaterialDraft] = useState<ScheduleMaterial[]>([]);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [materialForm, setMaterialForm] = useState({ name: "", url: "" });
  const [savingMaterials, setSavingMaterials] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  useEffect(() => {
    if (!form.courseId) {
      setCourseStudents([]);
      return;
    }
    loadCourseStudents(form.courseId);
  }, [form.courseId]);

  const loadData = async () => {
    const [c, s, users] = await Promise.all([
      getCoursesByTeacher(user!.id),
      getSchedulesByTeacher(user!.id),
      getAllUsers(),
    ]);
    setCourses(c);
    setSchedules(s.sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()));
    setAllUsers(users as any[]);
    setLoading(false);
  };

  const loadCourseStudents = async (courseId: string) => {
    try {
      const [enrollments, users] = await Promise.all([
        getEnrollmentsByCourse(courseId),
        allUsers.length ? Promise.resolve(allUsers) : getAllUsers(),
      ]);
      const approvedIds = new Set(
        (enrollments as any[]).filter((e: any) => e.status === "approved").map((e: any) => e.userId)
      );
      const students = (users as any[]).filter((u: any) => approvedIds.has(u.id));
      setCourseStudents(students);
      // Default to every enrolled student
      setForm((prev) => ({ ...prev, studentIds: students.map((s: any) => s.id) }));
    } catch {
      setCourseStudents([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCourse = courses.find((c) => c.id === form.courseId);
    if (!selectedCourse) { toast.error("Select a course"); return; }
    const selectedStudents = courseStudents.filter((s) => form.studentIds.includes(s.id));
    setCreating(true);
    try {
      await createSchedule({
        courseId: form.courseId,
        courseName: selectedCourse.title,
        teacherId: user!.id,
        teacherName: user!.name,
        datetime: form.datetime,
        meetLink: form.meetLink,
        studentIds: selectedStudents.map((s) => s.id),
        studentNames: selectedStudents.map((s) => s.name),
      });
      toast.success(
        selectedStudents.length > 0
          ? `Class scheduled for ${selectedStudents.length} student${selectedStudents.length !== 1 ? "s" : ""}!`
          : "Class scheduled!"
      );
      setOpen(false);
      setForm({ courseId: "", datetime: "", meetLink: "", studentIds: [] });
      await loadData();
    } catch {
      toast.error("Failed to schedule class");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    await deleteSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success("Schedule deleted");
  };

  const toggleStudent = (studentId: string) => {
    setForm((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const openMaterials = (schedule: any) => {
    setMaterialSchedule(schedule);
    setMaterialDraft(Array.isArray(schedule.materials) ? schedule.materials : []);
    setRecordingUrl(schedule.recordingUrl || "");
    setMaterialForm({ name: "", url: "" });
    setMaterialsOpen(true);
  };

  const addMaterial = () => {
    if (!materialForm.name.trim() || !materialForm.url.trim()) {
      toast.error("Add a document name and link");
      return;
    }
    setMaterialDraft((prev) => [
      ...prev,
      { name: materialForm.name.trim(), url: materialForm.url.trim(), type: "link" },
    ]);
    setMaterialForm({ name: "", url: "" });
  };

  const saveMaterials = async () => {
    if (!materialSchedule) return;
    setSavingMaterials(true);
    try {
      const payload = { materials: materialDraft, recordingUrl: recordingUrl.trim() };
      await updateSchedule(materialSchedule.id, payload);
      setSchedules((prev) =>
        prev.map((s) => (s.id === materialSchedule.id ? { ...s, ...payload } : s))
      );
      toast.success("Class materials saved — students can now access them.");
      setMaterialsOpen(false);
      setMaterialSchedule(null);
    } catch {
      toast.error("Failed to save class materials");
    } finally {
      setSavingMaterials(false);
    }
  };

  const studentNamesFor = (schedule: any) => {
    if (Array.isArray(schedule.studentNames) && schedule.studentNames.length > 0) {
      return schedule.studentNames.join(", ");
    }
    if (Array.isArray(schedule.studentIds) && schedule.studentIds.length > 0) {
      return schedule.studentIds
        .map((id: string) => allUsers.find((u) => u.id === id)?.name || id)
        .join(", ");
    }
    return "All enrolled students";
  };

  const active = schedules.filter((s) => s.ended !== true);
  const past = schedules.filter((s) => s.ended === true);

  return (
    <DashboardLayout title="Schedule Classes" description="Schedule live Google Meet sessions and choose exactly which students can see them." allowedRoles={["teacher", "admin"]}>
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Schedule Class</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Class</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Course*</Label>
                <Select
                  value={form.courseId}
                  onValueChange={(v) => setForm({ ...form, courseId: v, studentIds: [] })}
                >
                  <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Students*</Label>
                  {courseStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        studentIds: form.studentIds.length === courseStudents.length ? [] : courseStudents.map((s) => s.id),
                      })}
                      className="text-xs font-semibold text-orange-500 hover:underline"
                    >
                      {form.studentIds.length === courseStudents.length ? "Clear all" : "Select all"}
                    </button>
                  )}
                </div>
                {courseStudents.length === 0 ? (
                  <p className="text-xs rounded-xl border border-dashed p-3" style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                    No approved students in this course yet. The class will be visible to future enrolled students.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-xl border p-2 space-y-1" style={{ borderColor: "var(--border)" }}>
                    {courseStudents.map((student) => (
                      <label key={student.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.studentIds.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <span className="text-sm font-medium">{student.name}</span>
                        <span className="text-xs ml-auto" style={{ color: "var(--text-secondary)" }}>{student.email}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  Only the selected students will see this class on their dashboard, calendar and live-classes page.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Date &amp; Time*</Label>
                <div className="relative flex items-center">
                  <Input
                    ref={dateRef}
                    type="datetime-local"
                    value={form.datetime}
                    onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      try { dateRef.current?.showPicker(); } catch (err) { console.error(err); }
                    }}
                    className="absolute right-3 text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
                    title="Open calendar picker"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Google Meet Link*</Label>
                <Input placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={form.meetLink} onChange={(e) => setForm({ ...form, meetLink: e.target.value })} required />
              </div>

              <Button type="submit" className="w-full" disabled={creating || form.studentIds.length === 0 && courseStudents.length > 0}>
                {creating ? "Scheduling..." : "Schedule Class"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class materials dialog */}
      <Dialog open={materialsOpen} onOpenChange={setMaterialsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Class Materials &amp; Recording</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {materialSchedule?.courseName} · {materialSchedule?.datetime ? format(new Date(materialSchedule.datetime), "MMM d, yyyy · h:mm a") : "TBD"}
            </p>

            <div className="space-y-1.5">
              <Label>Class Recording / Replay URL</Label>
              <Input
                placeholder="https://youtu.be/... or Google Drive link"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Documents &amp; Links</Label>
              {materialDraft.length === 0 ? (
                <p className="text-xs rounded-xl border border-dashed p-3" style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                  No materials added yet. Add notes, PDFs or links students should see after this class.
                </p>
              ) : (
                <div className="space-y-2">
                  {materialDraft.map((material, idx) => (
                    <div key={`${material.url}-${idx}`} className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                      <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{material.name}</p>
                        <p className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>{material.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMaterialDraft((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <Input
                placeholder="Document name (e.g. Week 3 Notes)"
                value={materialForm.name}
                onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
              />
              <Input
                placeholder="https://drive.google.com/..."
                value={materialForm.url}
                onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
              />
              <Button type="button" variant="outline" className="gap-2" onClick={addMaterial}>
                <Plus className="w-4 h-4" /> Add Document
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setMaterialsOpen(false)}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={saveMaterials} disabled={savingMaterials}>
                <CheckCircle2 className="w-4 h-4" /> {savingMaterials ? "Saving…" : "Save Materials"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <Calendar className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">No classes scheduled</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Schedule your first live Google Meet session.</p>
            <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Schedule Class</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--success)" }} />
                Upcoming &amp; Active ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map((s) => (
                  <ScheduleCard
                    key={s.id}
                    schedule={s}
                    targetNames={studentNamesFor(s)}
                    onDelete={handleDelete}
                    onManageMaterials={openMaterials}
                  />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--text-secondary)" }} />
                Finished Classes ({past.length})
              </h2>
              <div className="space-y-3 opacity-80">
                {past.map((s) => (
                  <ScheduleCard
                    key={s.id}
                    schedule={s}
                    targetNames={studentNamesFor(s)}
                    onDelete={handleDelete}
                    onManageMaterials={openMaterials}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function ScheduleCard({
  schedule,
  targetNames,
  onDelete,
  onManageMaterials,
}: {
  schedule: any;
  targetNames: string;
  onDelete: (id: string) => void;
  onManageMaterials: (schedule: any) => void;
}) {
  const ended = schedule.ended === true;
  const started = schedule.datetime ? isPast(new Date(schedule.datetime)) : false;
  const materialCount = Array.isArray(schedule.materials) ? schedule.materials.length : 0;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: ended ? "rgba(100,116,139,0.15)" : started ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)" }}>
            <Video className="w-6 h-6" style={{ color: ended ? "var(--text-secondary)" : started ? "var(--danger)" : "var(--info)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{schedule.courseName}</p>
            <p className="text-xs mt-0.5 flex items-center gap-1 truncate" style={{ color: "var(--text-secondary)" }}>
              <Users className="w-3 h-3 flex-shrink-0" /> For: <strong className="font-semibold">{targetNames}</strong>
            </p>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                <Clock className="w-3 h-3" />
                {schedule.datetime ? format(new Date(schedule.datetime), "MMM d, yyyy · h:mm a") : "TBD"}
              </div>
              <a href={schedule.meetLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs hover:underline" style={{ color: "var(--accent-2)" }}>
                <ExternalLink className="w-3 h-3" /> Meet Link
              </a>
              {materialCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--success)" }}>
                  <Paperclip className="w-3 h-3" /> {materialCount} material{materialCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={ended ? "secondary" : started ? "danger" : "success"}>
              {ended ? "Finished" : started ? "Live now" : "Upcoming"}
            </Badge>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onManageMaterials(schedule)}>
              <FileText className="w-3.5 h-3.5" /> Materials
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(schedule.id)}
              style={{ color: "var(--danger)" }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
