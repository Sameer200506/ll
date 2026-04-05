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
import { getCourse, getLessonsByCourse, addLesson, deleteLesson } from "@/lib/firestore";
import { Plus, Trash2, PlayCircle, ArrowLeft, GripVertical, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function getYtThumb(url: string) {
  const match = url?.match(/(?:youtu\.be\/|v=)([^&?\s]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { user } = useAuth();
  const [courseId, setCourseId] = useState("");
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", youtubeUrl: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { params.then((p) => setCourseId(p.courseId)); }, [params]);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      const [c, l] = await Promise.all([getCourse(courseId), getLessonsByCourse(courseId)]);
      setCourse(c);
      setLessons(l);
      setLoading(false);
    })();
  }, [courseId]);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addLesson({ courseId, title: form.title, youtubeUrl: form.youtubeUrl, order: lessons.length });
      toast.success("Lesson added!");
      setOpen(false);
      setForm({ title: "", youtubeUrl: "" });
      const l = await getLessonsByCourse(courseId);
      setLessons(l);
    } catch {
      toast.error("Failed to add lesson");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (lessonId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteLesson(lessonId);
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    toast.success("Lesson deleted");
  };

  return (
    <DashboardLayout title={course?.title ?? "Course"} description="Manage lessons for this course.">
      <Link href="/dashboard/teacher/courses" className="inline-flex items-center gap-2 mb-6 text-sm hover:underline" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">{lessons.length} Lessons</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>by {course?.teacherName} · ₹{course?.price ?? 0}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Lesson</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Lesson</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLesson} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Lesson Title*</Label>
                <Input placeholder="e.g. Introduction to Variables"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>YouTube URL*</Label>
                <Input placeholder="https://youtube.com/watch?v=..."
                  value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} required />
              </div>
              {form.youtubeUrl && getYtThumb(form.youtubeUrl) && (
                <img src={getYtThumb(form.youtubeUrl)!} alt="preview" className="rounded-xl w-full" />
              )}
              <Button type="submit" className="w-full" disabled={adding}>
                {adding ? "Adding..." : "Add Lesson"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : lessons.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-16">
            <PlayCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-secondary)" }} />
            <h3 className="font-semibold mb-2">No lessons yet</h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Add your first lesson with a YouTube video.</p>
            <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Lesson</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson: any, idx: number) => {
            const thumb = getYtThumb(lesson.youtubeUrl);
            return (
              <div key={lesson.id} className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:border-opacity-60"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <GripVertical className="w-5 h-5 flex-shrink-0 opacity-30 cursor-grab" />
                <span className="text-sm font-bold w-6 text-center" style={{ color: "var(--text-secondary)" }}>{idx + 1}</span>
                {thumb ? (
                  <img src={thumb} alt="" className="w-20 h-12 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-20 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--surface-2)" }}>
                    <PlayCircle className="w-6 h-6 opacity-40" style={{ color: "var(--accent)" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{lesson.title}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{lesson.youtubeUrl}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={lesson.youtubeUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-4 h-4" /></Button>
                  </a>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(lesson.id, lesson.title)}
                    style={{ color: "var(--danger)" }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
