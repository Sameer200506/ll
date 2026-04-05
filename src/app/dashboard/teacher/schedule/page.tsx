"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCoursesByTeacher, createSchedule, getSchedulesByTeacher, deleteSchedule } from "@/lib/firestore";
import { Plus, Calendar, Clock, ExternalLink, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";

export default function SchedulePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ courseId: "", datetime: "", meetLink: "" });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const [c, s] = await Promise.all([getCoursesByTeacher(user!.id), getSchedulesByTeacher(user!.id)]);
    setCourses(c);
    setSchedules(s.sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()));
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCourse = courses.find((c) => c.id === form.courseId);
    if (!selectedCourse) { toast.error("Select a course"); return; }
    setCreating(true);
    try {
      await createSchedule({
        courseId: form.courseId,
        courseName: selectedCourse.title,
        teacherId: user!.id,
        teacherName: user!.name,
        datetime: form.datetime,
        meetLink: form.meetLink,
      });
      toast.success("Class scheduled!");
      setOpen(false);
      setForm({ courseId: "", datetime: "", meetLink: "" });
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

  const upcoming = schedules.filter((s) => !isPast(new Date(s.datetime)));
  const past = schedules.filter((s) => isPast(new Date(s.datetime)));

  return (
    <DashboardLayout title="Schedule Classes" description="Schedule live Google Meet sessions for your students.">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Schedule Class</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Class</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Course*</Label>
                <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date & Time*</Label>
                <Input type="datetime-local" value={form.datetime} onChange={(e) => setForm({ ...form, datetime: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Google Meet Link*</Label>
                <Input placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={form.meetLink} onChange={(e) => setForm({ ...form, meetLink: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Scheduling..." : "Schedule Class"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--success)" }} />
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((s) => <ScheduleCard key={s.id} schedule={s} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--text-secondary)" }} />
                Past ({past.length})
              </h2>
              <div className="space-y-3 opacity-60">
                {past.map((s) => <ScheduleCard key={s.id} schedule={s} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function ScheduleCard({ schedule, onDelete }: { schedule: any; onDelete: (id: string) => void }) {
  const past = isPast(new Date(schedule.datetime));
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: past ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)" }}>
            <Video className="w-6 h-6" style={{ color: past ? "var(--danger)" : "var(--info)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{schedule.courseName}</p>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                <Clock className="w-3 h-3" />
                {schedule.datetime ? format(new Date(schedule.datetime), "MMM d, yyyy · h:mm a") : "TBD"}
              </div>
              <a href={schedule.meetLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs hover:underline" style={{ color: "var(--accent-2)" }}>
                <ExternalLink className="w-3 h-3" /> Meet Link
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={past ? "secondary" : "success"}>{past ? "Ended" : "Upcoming"}</Badge>
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
