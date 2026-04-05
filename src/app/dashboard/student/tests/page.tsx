"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEnrollmentsByUser, getAllCourses, getQuizzesByCourse, getQuizResultsByUser } from "@/lib/firestore";
import { ClipboardList, Trophy, CheckCircle2, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

export default function TestsPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const enr = await getEnrollmentsByUser(user.id);
      const allCourses = await getAllCourses();
      const cMap: Record<string, any> = {};
      allCourses.forEach((c: any) => { cMap[c.id] = c; });
      setCourseMap(cMap);

      const enrolledIds = enr.map((e: any) => e.courseId);
      const allQuizzes: any[] = [];
      await Promise.all(enrolledIds.map(async (cId: string) => {
        const q = await getQuizzesByCourse(cId);
        allQuizzes.push(...q);
      }));

      const userResults = await getQuizResultsByUser(user.id);
      setQuizzes(allQuizzes);
      setResults(userResults);
      setLoading(false);
    })();
  }, [user]);

  const getResult = (quizId: string) => results.find((r: any) => r.quizId === quizId);

  return (
    <DashboardLayout title="Tests & Quizzes" description="Test your knowledge and track your scores.">
      {/* Results summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Quizzes Taken", value: results.length, color: "var(--accent)" },
            { label: "Avg. Score", value: `${Math.round(results.reduce((a: number, r: any) => a + (r.score / r.total) * 100, 0) / results.length)}%`, color: "var(--success)" },
            { label: "Best Score", value: `${Math.round(Math.max(...results.map((r: any) => (r.score / r.total) * 100)))}%`, color: "var(--warning)" },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <ClipboardList className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">No quizzes available</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Your enrolled courses don't have quizzes yet. Check back later!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz: any) => {
            const result = getResult(quiz.id);
            const pct = result ? Math.round((result.score / result.total) * 100) : null;
            return (
              <Card key={quiz.id} className="card-hover">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: result ? "rgba(16,185,129,0.15)" : "rgba(108,99,255,0.15)" }}>
                      {result ? (
                        <Trophy className="w-6 h-6" style={{ color: "var(--success)" }} />
                      ) : (
                        <ClipboardList className="w-6 h-6" style={{ color: "var(--accent)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{quiz.title}</p>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {courseMap[quiz.courseId]?.title ?? quiz.courseId} · {quiz.questions?.length ?? 0} questions
                      </p>
                      {result && (
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />
                          <span className="text-sm font-medium" style={{ color: "var(--success)" }}>
                            Score: {result.score}/{result.total} ({pct}%)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {result ? (
                        <Badge variant={pct! >= 70 ? "success" : "warning"}>{pct}%</Badge>
                      ) : (
                        <Link href={`/dashboard/student/tests/${quiz.id}`}>
                          <Button size="sm" className="gap-1">Take Quiz <ArrowRight className="w-3.5 h-3.5" /></Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
