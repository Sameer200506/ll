"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCoursesByTeacher, getEnrollmentsByCourse, getSchedulesByTeacher, getAllUsers } from "@/lib/firestore";
import { BookOpen, Users, Calendar, TrendingUp, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function TeacherOverview() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [myCourses, scheds] = await Promise.all([
        getCoursesByTeacher(user.id),
        getSchedulesByTeacher(user.id),
      ]);
      setCourses(myCourses);
      setSchedules(scheds);

      // Count total unique students enrolled in teacher's courses
      let studentSet = new Set<string>();
      await Promise.all(myCourses.map(async (c: any) => {
        const enr = await getEnrollmentsByCourse(c.id);
        enr.forEach((e: any) => studentSet.add(e.userId));
      }));
      setTotalStudents(studentSet.size);
      setLoading(false);
    })();
  }, [user]);

  const upcoming = schedules
    .filter((s: any) => s.datetime && new Date(s.datetime) > new Date())
    .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .slice(0, 3);

  const stats = [
    { label: "Courses Created", value: courses.length, icon: BookOpen, color: "var(--accent)", href: "/dashboard/teacher/courses" },
    { label: "Total Students", value: totalStudents, icon: Users, color: "var(--info)", href: "/dashboard/teacher/students" },
    { label: "Upcoming Classes", value: upcoming.length, icon: Calendar, color: "var(--warning)", href: "/dashboard/teacher/schedule" },
    { label: "Avg. Completion", value: "–", icon: TrendingUp, color: "var(--success)", href: "/dashboard/teacher/students" },
  ];

  return (
    <DashboardLayout title={`Teacher Dashboard`} description={`Hello, ${user?.name} 👋  — Here's your overview.`}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}>
            <Card className="card-hover cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                </div>
                <p className="text-2xl font-bold">{loading ? "–" : value}</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Courses</h2>
            <Link href="/dashboard/teacher/courses">
              <Button variant="ghost" size="sm" className="gap-1">Manage <ArrowRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-10">
                <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>No courses yet</p>
                <Link href="/dashboard/teacher/courses">
                  <Button size="sm">Create Your First Course</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {courses.slice(0, 4).map((c: any) => (
                <Link key={c.id} href={`/dashboard/teacher/courses/${c.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:opacity-80"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{c.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>₹{c.price ?? 0}</p>
                    </div>
                    <ArrowRight className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming classes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming Classes</h2>
            <Link href="/dashboard/teacher/schedule">
              <Button variant="ghost" size="sm" className="gap-1">Schedule <ArrowRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
          ) : upcoming.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-10">
                <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>No upcoming classes</p>
                <Link href="/dashboard/teacher/schedule">
                  <Button size="sm">Schedule a Class</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((s: any) => (
                <Card key={s.id} className="card-hover">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(59,130,246,0.15)" }}>
                        <Calendar className="w-5 h-5" style={{ color: "var(--info)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{s.courseName}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" style={{ color: "var(--text-secondary)" }} />
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {s.datetime ? format(new Date(s.datetime), "MMM d, h:mm a") : "TBD"}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">Live</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
