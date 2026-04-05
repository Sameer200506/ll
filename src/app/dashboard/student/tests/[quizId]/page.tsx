"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllQuizzes, getCourse, saveQuizResult } from "@/lib/firestore";
import { CheckCircle2, XCircle, ArrowRight, Trophy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function QuizPlayerPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { user } = useAuth();
  const [quizId, setQuizId] = useState("");
  const [quiz, setQuiz] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { params.then((p) => setQuizId(p.quizId)); }, [params]);

  useEffect(() => {
    if (!quizId) return;
    (async () => {
      const all = await getAllQuizzes();
      const found = all.find((q: any) => q.id === quizId);
      setQuiz(found);
      if (found) {
        const c = await getCourse(found.courseId);
        setCourse(c);
      }
      setLoading(false);
    })();
  }, [quizId]);

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = async () => {
    if (!quiz || !user) return;
    const questions = quiz.questions || [];
    let correct = 0;
    questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correct) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    await saveQuizResult({ userId: user.id, courseId: quiz.courseId, quizId, score: correct, total: questions.length });
    toast.success(`Quiz submitted! Score: ${correct}/${questions.length}`);
  };

  if (loading) return <DashboardLayout title="Quiz"><div className="skeleton h-64 rounded-2xl" /></DashboardLayout>;
  if (!quiz) return <DashboardLayout title="Quiz Not Found"><p style={{ color: "var(--text-secondary)" }}>This quiz could not be found.</p></DashboardLayout>;

  const questions = quiz.questions || [];
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  return (
    <DashboardLayout title={quiz.title} description={`${course?.title ?? ""} · ${questions.length} questions`}>
      {submitted ? (
        // Results screen
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-8">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: pct >= 70 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)" }}>
              <Trophy className="w-12 h-12" style={{ color: pct >= 70 ? "var(--success)" : "var(--danger)" }} />
            </div>
            <h2 className="text-3xl font-bold mb-2">{pct >= 70 ? "Well Done! 🎉" : "Keep Practicing 💪"}</h2>
            <p style={{ color: "var(--text-secondary)" }}>You scored</p>
            <p className="text-5xl font-extrabold my-3 gradient-text">{score}/{questions.length}</p>
            <p className="text-lg font-semibold" style={{ color: pct >= 70 ? "var(--success)" : "var(--danger)" }}>{pct}%</p>
          </div>

          {/* Answer review */}
          <div className="space-y-4 text-left mb-8">
            {questions.map((q: any, i: number) => {
              const correct = answers[i] === q.correct;
              return (
                <Card key={i}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      {correct ? (
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--success)" }} />
                      ) : (
                        <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--danger)" }} />
                      )}
                      <div>
                        <p className="font-medium text-sm">{q.question}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                          Correct: <span style={{ color: "var(--success)" }}>{q.options[q.correct]}</span>
                          {!correct && <> · Your answer: <span style={{ color: "var(--danger)" }}>{q.options[answers[i]] ?? "Not answered"}</span></>}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/student/tests">
              <Button variant="outline" className="gap-2"><ArrowRight className="w-4 h-4 rotate-180" /> Back to Tests</Button>
            </Link>
          </div>
        </div>
      ) : (
        // Quiz questions
        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {Object.keys(answers).length}/{questions.length} answered
            </span>
            <div className="flex-1 h-2 rounded-full" style={{ background: "var(--surface-2)" }}>
              <div className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q: any, i: number) => (
              <Card key={i} className="card-hover">
                <CardContent className="pt-6 pb-5">
                  <p className="font-semibold mb-4">
                    <span className="mr-2 text-sm px-2 py-0.5 rounded-md" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>Q{i+1}</span>
                    {q.question}
                  </p>
                  <div className="space-y-2.5">
                    {q.options.map((opt: string, j: number) => (
                      <button
                        key={j}
                        onClick={() => handleSelect(i, j)}
                        className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200"
                        style={{
                          background: answers[i] === j ? "rgba(108,99,255,0.2)" : "var(--surface-2)",
                          borderColor: answers[i] === j ? "var(--accent)" : "var(--border)",
                          color: answers[i] === j ? "var(--accent-2)" : "var(--text-primary)",
                        }}
                      >
                        <span className="inline-block w-6 h-6 rounded-full mr-3 text-center text-xs leading-6 font-bold"
                          style={{ background: answers[i] === j ? "var(--accent)" : "var(--border)", color: answers[i] === j ? "white" : "var(--text-secondary)" }}>
                          {String.fromCharCode(65 + j)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
              size="lg"
              className="gap-2"
            >
              Submit Quiz <Trophy className="w-5 h-5" />
            </Button>
          </div>
          {Object.keys(answers).length < questions.length && (
            <p className="text-center text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
              Answer all questions to submit
            </p>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
