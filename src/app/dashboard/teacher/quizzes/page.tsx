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
import { getCoursesByTeacher, getLessonsByCourse, createQuiz, getAllQuizzes } from "@/lib/firestore";
import { Plus, Trash2, ClipboardList, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Question { question: string; options: string[]; correct: number; }

export default function QuizzesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ courseId: "", lessonId: "none", title: "" });
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", "", ""], correct: 0 }
  ]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [c, allQ] = await Promise.all([getCoursesByTeacher(user.id), getAllQuizzes()]);
      setCourses(c);
      const myCourseIds = new Set(c.map((x: any) => x.id));
      setMyQuizzes(allQ.filter((q: any) => myCourseIds.has(q.courseId)));
      setLoading(false);
    })();
  }, [user]);

  const handleCourseChange = async (courseId: string) => {
    setForm({ ...form, courseId, lessonId: "none" });
    const l = await getLessonsByCourse(courseId);
    setLessons(l);
  };

  const addQuestion = () =>
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: 0 }]);

  const removeQuestion = (idx: number) =>
    setQuestions(questions.filter((_, i) => i !== idx));

  const updateQuestion = (idx: number, field: keyof Question, val: any) =>
    setQuestions(questions.map((q, i) => i === idx ? { ...q, [field]: val } : q));

  const updateOption = (qIdx: number, optIdx: number, val: string) =>
    setQuestions(questions.map((q, i) => i === qIdx
      ? { ...q, options: q.options.map((o, j) => j === optIdx ? val : o) }
      : q
    ));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.title) { toast.error("Fill all required fields"); return; }
    const invalid = questions.some(q => !q.question || q.options.some(o => !o));
    if (invalid) { toast.error("Fill all question fields and options"); return; }
    setSaving(true);
    try {
      await createQuiz({
        courseId: form.courseId,
        lessonId: form.lessonId && form.lessonId !== "none" ? form.lessonId : null,
        title: form.title,
        questions,
      });
      toast.success("Quiz created!");
      setOpen(false);
      setForm({ courseId: "", lessonId: "none", title: "" });
      setQuestions([{ question: "", options: ["", "", "", ""], correct: 0 }]);
      const all = await getAllQuizzes();
      const myCourseIds = new Set(courses.map((c: any) => c.id));
      setMyQuizzes(all.filter((q: any) => myCourseIds.has(q.courseId)));
    } catch {
      toast.error("Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));

  return (
    <DashboardLayout title="Quiz Builder" description="Create MCQ quizzes for your courses.">
      <div className="flex justify-end mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Create Quiz</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-5 mt-2">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Course*</Label>
                  <Select value={form.courseId} onValueChange={handleCourseChange}>
                    <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Lesson (optional)</Label>
                  <Select value={form.lessonId} onValueChange={(v) => setForm({ ...form, lessonId: v })}>
                    <SelectTrigger><SelectValue placeholder="All lessons" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All lessons</SelectItem>
                      {lessons.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Quiz Title*</Label>
                <Input placeholder="e.g. Chapter 1 Quiz" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-xl border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold" style={{ color: "var(--accent-2)" }}>Question {qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(qIdx)}
                          className="text-xs" style={{ color: "var(--danger)" }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Input placeholder="Enter your question..."
                      value={q.question}
                      onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                      className="mb-3"
                    />
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuestion(qIdx, "correct", optIdx)}
                            className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                            style={{
                              borderColor: q.correct === optIdx ? "var(--success)" : "var(--border)",
                              background: q.correct === optIdx ? "var(--success)" : "transparent",
                            }}
                          >
                            {q.correct === optIdx && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </button>
                          <Input
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            value={opt}
                            onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>Click the circle to mark the correct answer</p>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={addQuestion} className="w-full gap-2">
                <Plus className="w-4 h-4" /> Add Question
              </Button>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : `Save Quiz (${questions.length} questions)`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : myQuizzes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <ClipboardList className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Create your first quiz to test students.</p>
            <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Quiz</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myQuizzes.map((quiz: any) => (
            <Card key={quiz.id} className="card-hover">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(108,99,255,0.15)" }}>
                    <ClipboardList className="w-6 h-6" style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{quiz.title}</p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {courseMap[quiz.courseId]?.title} · {quiz.questions?.length ?? 0} questions
                    </p>
                  </div>
                  <Badge variant="secondary">{quiz.questions?.length ?? 0} Qs</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
