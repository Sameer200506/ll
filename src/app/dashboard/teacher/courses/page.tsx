"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCoursesByTeacher, getEnrollmentsByCourse } from "@/lib/firestore";
import { BookOpen, Users, PlayCircle } from "lucide-react";

export default function TeacherCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    const my = await getCoursesByTeacher(user!.id);
    setCourses(my);
    const counts: Record<string, number> = {};
    await Promise.all(my.map(async (c: any) => {
      const enr = await getEnrollmentsByCourse(c.id);
      counts[c.id] = enr.length;
    }));
    setEnrollCounts(counts);
    setLoading(false);
  };

  return (
    <DashboardLayout title="My Courses" description="View your assigned courses." allowedRoles={["teacher", "admin"]}>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <BookOpen className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">No courses assigned</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>You don't have any courses assigned yet. Contact the administrator to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course: any) => (
            <div key={course.id} className="relative">
              <Card className="h-full flex flex-col">
                <div
                  className="h-40 rounded-t-2xl overflow-hidden flex items-center justify-center relative"
                  style={{ background: "linear-gradient(135deg, var(--surface-2), var(--accent)22)" }}
                >
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <PlayCircle className="w-12 h-12 opacity-30" style={{ color: "var(--accent)" }} />
                  )}
                  <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2 py-1 rounded-md bg-black/60 text-white backdrop-blur-sm">
                    {course.category || "Classes 1–12"}
                  </span>
                </div>
                <CardContent className="pt-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-base mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-sm line-clamp-2 flex-1" style={{ color: "var(--text-secondary)" }}>{course.description}</p>
                  <div
                    className="flex items-center justify-between mt-3 pt-3 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Users className="w-4 h-4" />
                      <span>{enrollCounts[course.id] ?? 0} students</span>
                    </div>
                    <Badge variant={course.price === 0 ? "success" : "default"}>
                      {course.price === 0 ? "Free" : `₹${course.price}`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
