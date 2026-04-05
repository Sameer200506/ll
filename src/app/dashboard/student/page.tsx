"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getEnrollmentsByUser, getAllCourses, getAllSchedules, getQuizResultsByUser, getProgress } from "@/lib/firestore";
import { BookOpen, Calendar, Trophy, TrendingUp, Video, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function StudentOverview() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [enr, allCourses, scheds, qResults] = await Promise.all([
        getEnrollmentsByUser(user.id),
        getAllCourses(),
        getAllSchedules(),
        getQuizResultsByUser(user.id),
      ]);
      setEnrollments(enr);
      setCourses(allCourses);
      setSchedules(scheds);
      setResults(qResults);
      setLoading(false);
    })();
  }, [user]);

  const myCourseIds = enrollments.map((e: any) => e.courseId);
  const myCourses = courses.filter((c: any) => myCourseIds.includes(c.id));
  const upcomingClasses = schedules
    .filter((s: any) => new Date(s.datetime) > new Date())
    .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .slice(0, 3);

  const avgScore = results.length
    ? Math.round(results.reduce((acc: number, r: any) => acc + (r.score / r.total) * 100, 0) / results.length)
    : 0;

  const stats = [
    { label: "Enrolled Courses", value: myCourses.length, icon: BookOpen, color: "var(--accent)" },
    { label: "Upcoming Classes", value: upcomingClasses.length, icon: Calendar, color: "var(--info)" },
    { label: "Quizzes Taken", value: results.length, icon: Trophy, color: "var(--warning)" },
    { label: "Avg. Quiz Score", value: `${avgScore}%`, icon: TrendingUp, color: "var(--success)" },
  ];

  return (
    <DashboardLayout title={`Welcome back, ${user?.name?.split(" ")[0]} 👋`} description="Here's your learning summary for today.">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <Badge variant="secondary">{typeof value === "number" && value > 0 ? "↑" : "—"}</Badge>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Continue Learning</h2>
            <Link href="/dashboard/student/courses">
              <Button variant="ghost" size="sm" className="gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          ) : myCourses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-secondary)" }} />
                <p className="font-medium">No courses yet</p>
                <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>Browse and enroll in your first course</p>
                <Link href="/dashboard/student/browse">
                  <Button size="sm">Browse Courses</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myCourses.slice(0, 3).map((course: any) => (
                <Link key={course.id} href={`/dashboard/student/courses/${course.id}`}>
                  <Card className="card-hover cursor-pointer">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{course.title}</p>
                          <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>by {course.teacherName}</p>
                          <Progress value={0} className="mt-2 h-1.5" />
                        </div>
                        <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Classes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming Classes</h2>
            <Link href="/dashboard/student/calendar">
              <Button variant="ghost" size="sm" className="gap-1">Calendar <ArrowRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingClasses.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-secondary)" }} />
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No upcoming classes</p>
                </CardContent>
              </Card>
            ) : upcomingClasses.map((s: any) => (
              <Card key={s.id} className="card-hover">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(59,130,246,0.15)" }}>
                      <Video className="w-5 h-5" style={{ color: "var(--info)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.courseName}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>{s.teacherName}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="w-3 h-3" style={{ color: "var(--text-secondary)" }} />
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {s.datetime ? format(new Date(s.datetime), "MMM d, h:mm a") : "TBD"}
                        </span>
                      </div>
                      <a href={s.meetLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                        <Button size="sm" className="h-7 px-3 text-xs gap-1">Join <ArrowRight className="w-3 h-3" /></Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
