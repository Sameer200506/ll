"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getEnrollmentsByUser, getAllCourses, getLessonsByCourse, getProgress } from "@/lib/firestore";
import { BookOpen, Video, ArrowRight, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, { completed: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const enr = await getEnrollmentsByUser(user.id);
      const allCourses = await getAllCourses();
      const enrolled = allCourses.filter((c: any) => enr.some((e: any) => e.courseId === c.id));
      setCourses(enrolled);

      // Load progress for each course
      const prog: Record<string, { completed: number; total: number }> = {};
      await Promise.all(
        enrolled.map(async (c: any) => {
          const [lessons, completed] = await Promise.all([
            getLessonsByCourse(c.id),
            getProgress(user.id, c.id),
          ]);
          prog[c.id] = { completed: completed.length, total: lessons.length };
        })
      );
      setProgress(prog);
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardLayout title="My Courses" description="Continue where you left off.">
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <BookOpen className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">No enrolled courses</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Browse our catalog and buy a course to get started.</p>
            <Link href="/dashboard/student/browse">
              <Button>Browse Courses <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course: any) => {
            const p = progress[course.id];
            const pct = p && p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
            return (
              <Link key={course.id} href={`/dashboard/student/courses/${course.id}`}>
                <Card className="card-hover cursor-pointer h-full flex flex-col">
                  {/* Thumbnail */}
                  <div className="relative h-40 rounded-t-2xl overflow-hidden flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, var(--surface-2), var(--accent)22)" }}>
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <PlayCircle className="w-14 h-14 opacity-40" style={{ color: "var(--accent)" }} />
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary">{pct}%</Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-base mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>by {course.teacherName}</p>
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        <span>Progress</span>
                        <span>{p?.completed ?? 0}/{p?.total ?? 0} lessons</span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
