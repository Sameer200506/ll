"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getCourse, updateCourse,
  getLessonsByCourse, addLesson, updateLesson, deleteLesson,
  getResourcesByCourse, addResource, deleteResource,
  getEnrollmentsByCourse, getAllUsers,
  getQuizzesByCourse, createQuiz, updateQuiz, deleteQuiz,
} from "@/lib/firestore";
import {
  Plus, Trash2, PlayCircle, ArrowLeft, ExternalLink,
  Pencil, ChevronUp, ChevronDown, Link2, FileText,
  Settings, Users, Save, Check, X,
  Play, File, Globe, Presentation,
  ClipboardList, CheckCircle2, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getYtId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|v=)([^&?\s]+)/);
  return m ? m[1] : null;
}
function getYtThumb(url: string) {
  const id = getYtId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

const RESOURCE_TYPES = [
  { value: "pdf",   label: "PDF",          icon: FileText },
  { value: "video", label: "Video",         icon: Play },
  { value: "slide", label: "Slides",        icon: Presentation },
  { value: "link",  label: "External Link", icon: Globe },
  { value: "file",  label: "File",          icon: File },
];
function ResourceIcon({ type }: { type: string }) {
  const found = RESOURCE_TYPES.find((r) => r.value === type);
  const Icon = found?.icon ?? Link2;
  return <Icon className="w-4 h-4" />;
}

// ─── Quiz Builder (embedded) ──────────────────────────────────────────────────

interface Question { question: string; options: string[]; correct: number; }

const BLANK_QUESTION: Question = { question: "", options: ["", "", "", ""], correct: 0 };

function QuizBuilder({
  courseId,
  targetLessonId,       // the lesson this quiz is placed after
  initial,              // pre-filled data when editing
  onSave,
  onCancel,
  saving,
}: {
  courseId: string;
  targetLessonId: string | null;
  initial?: { id?: string; title: string; questions: Question[] };
  onSave: (title: string, questions: Question[], quizId?: string) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [questions, setQuestions] = useState<Question[]>(
    initial?.questions?.length ? initial.questions : [{ ...BLANK_QUESTION, options: ["", "", "", ""] }]
  );

  const addQ = () => setQuestions((prev) => [...prev, { question: "", options: ["", "", "", ""], correct: 0 }]);
  const removeQ = (i: number) => setQuestions((prev) => prev.filter((_, j) => j !== i));
  const updateQ = (i: number, field: keyof Question, val: any) =>
    setQuestions((prev) => prev.map((q, j) => j === i ? { ...q, [field]: val } : q));
  const updateOpt = (qi: number, oi: number, val: string) =>
    setQuestions((prev) => prev.map((q, j) =>
      j === qi ? { ...q, options: q.options.map((o, k) => k === oi ? val : o) } : q
    ));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Quiz title required"); return; }
    const invalid = questions.some((q) => !q.question || q.options.some((o) => !o));
    if (invalid) { toast.error("Fill all question fields and options"); return; }
    await onSave(title, questions, initial?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Quiz Title *</Label>
        <Input
          placeholder="e.g. Chapter 1 Quiz"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-3">
        {questions.map((q, qi) => (
          <div
            key={qi}
            className="p-4 rounded-xl border"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                Question {qi + 1}
              </span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQ(qi)}
                  className="opacity-60 hover:opacity-100 transition"
                  style={{ color: "var(--danger)" }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <Input
              placeholder="Enter your question…"
              value={q.question}
              onChange={(e) => updateQ(qi, "question", e.target.value)}
              className="mb-3"
            />
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQ(qi, "correct", oi)}
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      borderColor: q.correct === oi ? "var(--success)" : "var(--border)",
                      background: q.correct === oi ? "var(--success)" : "transparent",
                    }}
                  >
                    {q.correct === oi && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </button>
                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    value={opt}
                    onChange={(e) => updateOpt(qi, oi, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
              Click the circle to mark the correct answer
            </p>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addQ} className="w-full gap-2">
        <Plus className="w-4 h-4" /> Add Question
      </Button>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="flex-1 gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : `Save Quiz (${questions.length} Q${questions.length !== 1 ? "s" : ""})`}
        </Button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { user } = useAuth();
  const [courseId, setCourseId] = useState("");

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // lesson dialog
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: "", url: "", description: "" });
  const [addingLesson, setAddingLesson] = useState(false);

  // lesson inline edit
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonForm, setEditLessonForm] = useState({ title: "", url: "", description: "" });
  const [savingLesson, setSavingLesson] = useState(false);

  // quiz dialog state
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizTargetLessonId, setQuizTargetLessonId] = useState<string | null>(null); // lesson AFTER which quiz is placed
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null); // null = new quiz
  const [savingQuiz, setSavingQuiz] = useState(false);

  // resource dialog
  const [resOpen, setResOpen] = useState(false);
  const [resForm, setResForm] = useState({ name: "", url: "", type: "link" });
  const [addingRes, setAddingRes] = useState(false);

  // settings
  const [settingsForm, setSettingsForm] = useState({ title: "", description: "", thumbnailUrl: "", price: "0" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => { params.then((p) => setCourseId(p.courseId)); }, [params]);
  useEffect(() => { if (!courseId) return; loadAll(); }, [courseId]);

  const loadAll = async () => {
    const [c, l, r, q] = await Promise.all([
      getCourse(courseId),
      getLessonsByCourse(courseId),
      getResourcesByCourse(courseId),
      getQuizzesByCourse(courseId),
    ]);
    setCourse(c);
    setLessons(l);
    setResources(r);
    setQuizzes(q);
    setSettingsForm({
      title: c?.title ?? "",
      description: c?.description ?? "",
      thumbnailUrl: c?.thumbnailUrl ?? "",
      price: String(c?.price ?? 0),
    });
    const enrollments = await getEnrollmentsByCourse(courseId);
    if (enrollments.length > 0) {
      const allUsers = await getAllUsers();
      const enrolledIds = new Set(enrollments.map((e: any) => e.userId));
      const enriched = (allUsers as any[])
        .filter((u: any) => enrolledIds.has(u.id))
        .map((u: any) => ({
          ...u,
          purchasedAt: (enrollments as any[]).find((e: any) => e.userId === u.id)?.purchasedAt,
        }));
      setStudents(enriched);
    } else {
      setStudents([]);
    }
    setLoading(false);
  };

  // ── LESSONS ──

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingLesson(true);
    try {
      await addLesson({ courseId, title: lessonForm.title, youtubeUrl: lessonForm.url, description: lessonForm.description, order: lessons.length });
      toast.success("Lesson added!");
      setLessonOpen(false);
      setLessonForm({ title: "", url: "", description: "" });
      setLessons(await getLessonsByCourse(courseId));
    } catch { toast.error("Failed to add lesson"); }
    finally { setAddingLesson(false); }
  };

  const handleSaveLesson = async (lessonId: string) => {
    setSavingLesson(true);
    try {
      await updateLesson(lessonId, { title: editLessonForm.title, youtubeUrl: editLessonForm.url, description: editLessonForm.description });
      toast.success("Lesson updated!");
      setEditingLessonId(null);
      setLessons(await getLessonsByCourse(courseId));
    } catch { toast.error("Failed to save"); }
    finally { setSavingLesson(false); }
  };

  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await deleteLesson(lessonId);
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    toast.success("Lesson deleted");
  };

  const handleMoveLesson = async (idx: number, dir: -1 | 1) => {
    const arr = [...lessons];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    const updated = arr.map((l, i) => ({ ...l, order: i }));
    setLessons(updated);
    await Promise.all(updated.map((l) => updateLesson(l.id, { order: l.order })));
  };

  // ── QUIZZES ──

  const openNewQuiz = (afterLessonId: string | null) => {
    setEditingQuiz(null);
    setQuizTargetLessonId(afterLessonId);
    setQuizDialogOpen(true);
  };

  const openEditQuiz = (quiz: any) => {
    setEditingQuiz(quiz);
    setQuizTargetLessonId(quiz.lessonId ?? null);
    setQuizDialogOpen(true);
  };

  const handleSaveQuiz = async (title: string, questions: Question[], quizId?: string) => {
    setSavingQuiz(true);
    try {
      if (quizId) {
        await updateQuiz(quizId, { title, questions });
        toast.success("Quiz updated!");
      } else {
        await createQuiz({ courseId, lessonId: quizTargetLessonId ?? null, title, questions });
        toast.success("Quiz created!");
      }
      setQuizDialogOpen(false);
      setEditingQuiz(null);
      setQuizzes(await getQuizzesByCourse(courseId));
    } catch { toast.error("Failed to save quiz"); }
    finally { setSavingQuiz(false); }
  };

  const handleDeleteQuiz = async (quizId: string, title: string) => {
    if (!confirm(`Delete quiz "${title}"?`)) return;
    await deleteQuiz(quizId);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    toast.success("Quiz deleted");
  };

  // ── RESOURCES ──

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingRes(true);
    try {
      await addResource({ courseId, name: resForm.name, url: resForm.url, type: resForm.type });
      toast.success("Resource added!");
      setResOpen(false);
      setResForm({ name: "", url: "", type: "link" });
      setResources(await getResourcesByCourse(courseId));
    } catch { toast.error("Failed to add resource"); }
    finally { setAddingRes(false); }
  };

  const handleDeleteResource = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteResource(id);
    setResources((prev) => prev.filter((r) => r.id !== id));
    toast.success("Resource removed");
  };

  // ── SETTINGS ──

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateCourse(courseId, { title: settingsForm.title, description: settingsForm.description, thumbnailUrl: settingsForm.thumbnailUrl, price: parseFloat(settingsForm.price) || 0 });
      setCourse((prev: any) => ({ ...prev, ...settingsForm, price: parseFloat(settingsForm.price) || 0 }));
      toast.success("Course updated!");
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch { toast.error("Failed to save"); }
    finally { setSavingSettings(false); }
  };

  // ── Build interleaved curriculum list ──
  // Each entry is either { type: "lesson", data } or { type: "quiz", data }
  // Quizzes appear AFTER the lesson with lessonId == quiz.lessonId.
  // Quizzes with null/none lessonId appear at the very end (course-level).

  const buildCurriculum = () => {
    const items: { type: "lesson" | "quiz"; data: any }[] = [];
    for (const lesson of lessons) {
      items.push({ type: "lesson", data: lesson });
      // quizzes that belong after this lesson
      const afterThis = quizzes.filter((q) => q.lessonId === lesson.id);
      afterThis.forEach((q) => items.push({ type: "quiz", data: q }));
    }
    // course-level quizzes (no lessonId or lessonId="none"/null) at the end
    const courseLevelQuizzes = quizzes.filter((q) => !q.lessonId || q.lessonId === "none");
    courseLevelQuizzes.forEach((q) => items.push({ type: "quiz", data: q }));
    return items;
  };

  const curriculum = buildCurriculum();
  const totalItems = lessons.length + quizzes.length;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title={course?.title ?? "Course Editor"} description="Manage all aspects of your course.">
      <Link href="/dashboard/teacher/courses" className="inline-flex items-center gap-2 mb-6 text-sm hover:underline" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      {/* Hero banner */}
      {course && (
        <div className="relative rounded-2xl overflow-hidden mb-6 flex items-end" style={{ minHeight: 140, background: course.thumbnailUrl ? undefined : "linear-gradient(135deg, var(--surface-2), var(--accent)22)" }}>
          {course.thumbnailUrl && <img src={course.thumbnailUrl} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="relative z-10 p-5 w-full" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}>
            <h1 className="text-xl font-bold text-white drop-shadow">{course.title}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <Badge variant={course.price === 0 ? "success" : "default"}>{course.price === 0 ? "Free" : `₹${course.price}`}</Badge>
              <span className="text-xs text-white/70">{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
              <span className="text-xs text-white/70">{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}</span>
              <span className="text-xs text-white/70">{students.length} student{students.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quiz builder dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={(v) => { if (!v) { setQuizDialogOpen(false); setEditingQuiz(null); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Edit Quiz" : "Add Quiz"}</DialogTitle>
          </DialogHeader>
          {quizDialogOpen && (
            <QuizBuilder
              courseId={courseId}
              targetLessonId={quizTargetLessonId}
              initial={editingQuiz ? { id: editingQuiz.id, title: editingQuiz.title, questions: editingQuiz.questions } : undefined}
              onSave={handleSaveQuiz}
              onCancel={() => { setQuizDialogOpen(false); setEditingQuiz(null); }}
              saving={savingQuiz}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="curriculum">
        <TabsList className="mb-2">
          <TabsTrigger value="curriculum" className="gap-2">
            <BookOpen className="w-4 h-4" /> Curriculum
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <Link2 className="w-4 h-4" /> Resources
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" /> Settings
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="w-4 h-4" /> Students
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════ CURRICULUM TAB ══════════════════ */}
        <TabsContent value="curriculum">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">
              {totalItems} Item{totalItems !== 1 ? "s" : ""}
              <span className="text-sm font-normal ml-2" style={{ color: "var(--text-secondary)" }}>
                ({lessons.length} lesson{lessons.length !== 1 ? "s" : ""} · {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""})
              </span>
            </h2>
            <Button className="gap-2" onClick={() => setLessonOpen(true)}>
              <Plus className="w-4 h-4" /> Add Lesson
            </Button>
          </div>

          {/* Add lesson dialog */}
          <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add New Lesson</DialogTitle></DialogHeader>
              <form onSubmit={handleAddLesson} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Lesson Title *</Label>
                  <Input placeholder="e.g. Introduction to Variables" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Video / Resource URL *</Label>
                  <Input placeholder="YouTube, Google Drive, or any link…" value={lessonForm.url} onChange={(e) => setLessonForm({ ...lessonForm, url: e.target.value })} required />
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Paste any URL — YouTube, Drive, Vimeo, Loom, etc.</p>
                </div>
                {lessonForm.url && getYtThumb(lessonForm.url) && (
                  <img src={getYtThumb(lessonForm.url)!} alt="preview" className="rounded-xl w-full" />
                )}
                <div className="space-y-1.5">
                  <Label>Notes / Description</Label>
                  <Textarea placeholder="Optional notes for students…" value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} rows={3} />
                </div>
                <Button type="submit" className="w-full" disabled={addingLesson}>{addingLesson ? "Adding…" : "Add Lesson"}</Button>
              </form>
            </DialogContent>
          </Dialog>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
          ) : lessons.length === 0 && quizzes.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-16">
                <PlayCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-secondary)" }} />
                <h3 className="font-semibold mb-2">No content yet</h3>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Add lessons and quizzes to build your curriculum.</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setLessonOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Lesson</Button>
                  <Button variant="outline" onClick={() => openNewQuiz(null)} className="gap-2"><ClipboardList className="w-4 h-4" /> Add Quiz</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* "Add quiz at top" — before any lessons */}
              {lessons.length > 0 && (
                <AddQuizButton label="Add quiz at start" onClick={() => openNewQuiz(null)} />
              )}

              {curriculum.map((item, idx) => {
                if (item.type === "lesson") {
                  const lesson = item.data;
                  const lessonIdx = lessons.findIndex((l) => l.id === lesson.id);
                  const thumb = getYtThumb(lesson.youtubeUrl);
                  const isEditing = editingLessonId === lesson.id;

                  return (
                    <div key={`lesson-${lesson.id}`}>
                      <div
                        className="rounded-2xl border transition-all duration-200"
                        style={{ background: "var(--surface)", borderColor: isEditing ? "var(--accent)" : "var(--border)" }}
                      >
                        {isEditing ? (
                          <div className="p-4 space-y-3">
                            <div className="space-y-1.5">
                              <Label>Title</Label>
                              <Input value={editLessonForm.title} onChange={(e) => setEditLessonForm({ ...editLessonForm, title: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                              <Label>URL</Label>
                              <Input value={editLessonForm.url} onChange={(e) => setEditLessonForm({ ...editLessonForm, url: e.target.value })} />
                            </div>
                            {editLessonForm.url && getYtThumb(editLessonForm.url) && (
                              <img src={getYtThumb(editLessonForm.url)!} alt="preview" className="rounded-xl w-full max-h-40 object-cover" />
                            )}
                            <div className="space-y-1.5">
                              <Label>Notes</Label>
                              <Textarea value={editLessonForm.description} onChange={(e) => setEditLessonForm({ ...editLessonForm, description: e.target.value })} rows={2} />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => setEditingLessonId(null)} className="gap-1.5"><X className="w-3.5 h-3.5" /> Cancel</Button>
                              <Button size="sm" onClick={() => handleSaveLesson(lesson.id)} disabled={savingLesson} className="gap-1.5"><Check className="w-3.5 h-3.5" /> {savingLesson ? "Saving…" : "Save"}</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-4">
                            {/* Reorder */}
                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                              <button onClick={() => handleMoveLesson(lessonIdx, -1)} disabled={lessonIdx === 0} className="p-0.5 rounded opacity-40 hover:opacity-100 transition disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                              <button onClick={() => handleMoveLesson(lessonIdx, 1)} disabled={lessonIdx === lessons.length - 1} className="p-0.5 rounded opacity-40 hover:opacity-100 transition disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
                            </div>
                            {/* Index badge */}
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: "var(--accent)22", color: "var(--accent)" }}>
                              {lessonIdx + 1}
                            </div>
                            {/* Thumbnail */}
                            {thumb ? (
                              <img src={thumb} alt="" className="w-20 h-12 object-cover rounded-lg flex-shrink-0" />
                            ) : (
                              <div className="w-20 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--surface-2)" }}>
                                <Link2 className="w-5 h-5 opacity-40" style={{ color: "var(--accent)" }} />
                              </div>
                            )}
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{lesson.title}</p>
                              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{lesson.youtubeUrl}</p>
                              {lesson.description && <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--text-secondary)" }}>{lesson.description}</p>}
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <a href={lesson.youtubeUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-4 h-4" /></Button>
                              </a>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingLessonId(lesson.id); setEditLessonForm({ title: lesson.title, url: lesson.youtubeUrl ?? "", description: lesson.description ?? "" }); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteLesson(lesson.id, lesson.title)} style={{ color: "var(--danger)" }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ↓ Add quiz AFTER this lesson */}
                      <AddQuizButton label={`Add quiz after "${lesson.title}"`} onClick={() => openNewQuiz(lesson.id)} />
                    </div>
                  );
                }

                // ── Quiz card ──
                const quiz = item.data;
                return (
                  <div
                    key={`quiz-${quiz.id}`}
                    className="flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", borderLeft: "3px solid var(--accent)" }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent)22" }}>
                      <ClipboardList className="w-5 h-5" style={{ color: "var(--accent)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{quiz.title}</p>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">Quiz</Badge>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {quiz.questions?.length ?? 0} question{(quiz.questions?.length ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditQuiz(quiz)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteQuiz(quiz.id, quiz.title)} style={{ color: "var(--danger)" }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════ RESOURCES TAB ══════════════════ */}
        <TabsContent value="resources">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Course Resources</h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Attach PDFs, slides, docs, or any link for students.</p>
            </div>
            <Dialog open={resOpen} onOpenChange={setResOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
                <form onSubmit={handleAddResource} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Resource Name *</Label>
                    <Input placeholder="e.g. Week 1 Slides" value={resForm.name} onChange={(e) => setResForm({ ...resForm, name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>URL *</Label>
                    <Input placeholder="https://…" value={resForm.url} onChange={(e) => setResForm({ ...resForm, url: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={resForm.type} onValueChange={(v) => setResForm({ ...resForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RESOURCE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={addingRes}>{addingRes ? "Adding…" : "Add Resource"}</Button>
                </form>
              </DialogContent>
              <Button className="gap-2" onClick={() => setResOpen(true)}><Plus className="w-4 h-4" /> Add Resource</Button>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
          ) : resources.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-16">
                <Link2 className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-secondary)" }} />
                <h3 className="font-semibold mb-2">No resources yet</h3>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Add PDFs, slide decks, notes, or any useful link.</p>
                <Button onClick={() => setResOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Resource</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {resources.map((res: any) => (
                <div key={res.id} className="flex items-center gap-4 p-4 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent)22" }}>
                    <span style={{ color: "var(--accent)" }}><ResourceIcon type={res.type} /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{res.name}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{res.url}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize flex-shrink-0">{res.type}</Badge>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={res.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-4 h-4" /></Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteResource(res.id, res.name)} style={{ color: "var(--danger)" }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════ SETTINGS TAB ══════════════════ */}
        <TabsContent value="settings">
          <div className="max-w-xl">
            <h2 className="text-base font-semibold mb-1">Course Settings</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Edit your course details — changes are reflected immediately.</p>
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="space-y-1.5">
                <Label>Course Title *</Label>
                <Input placeholder="e.g. Complete Python Bootcamp" value={settingsForm.title} onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea placeholder="What will students learn?" value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} rows={4} />
              </div>
              <div className="space-y-1.5">
                <Label>Thumbnail URL</Label>
                <Input placeholder="https://… (image URL)" value={settingsForm.thumbnailUrl} onChange={(e) => setSettingsForm({ ...settingsForm, thumbnailUrl: e.target.value })} />
                {settingsForm.thumbnailUrl && (
                  <img src={settingsForm.thumbnailUrl} alt="preview" className="mt-2 rounded-xl w-full max-h-44 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Price (₹)</Label>
                <Input type="number" min="0" placeholder="0 for free" value={settingsForm.price} onChange={(e) => setSettingsForm({ ...settingsForm, price: e.target.value })} />
              </div>
              <Button type="submit" className="gap-2" disabled={savingSettings}>
                {settingsSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {savingSettings ? "Saving…" : "Save Changes"}</>}
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* ══════════════════ STUDENTS TAB ══════════════════ */}
        <TabsContent value="students">
          <div className="mb-4">
            <h2 className="text-base font-semibold">{students.length} Enrolled Student{students.length !== 1 ? "s" : ""}</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Students who have enrolled in this course.</p>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-16">
                <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-secondary)" }} />
                <h3 className="font-semibold mb-2">No students enrolled yet</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Share your course to start getting enrollments.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {students.map((s: any) => (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                    {(s.name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.email}</p>
                  </div>
                  {s.purchasedAt && (
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                      Enrolled {new Date(s.purchasedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

// ─── Small helper component ───────────────────────────────────────────────────

function AddQuizButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all hover:opacity-100 opacity-50 hover:opacity-100 border"
        style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent)11" }}
        title={label}
      >
        <ClipboardList className="w-3.5 h-3.5" />
        + Quiz
      </button>
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
    </div>
  );
}
