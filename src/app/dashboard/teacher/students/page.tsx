"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCoursesByTeacher, getEnrollmentsByCourse, getAllUsers, getAllQuizResults, getAllProgress, getLessonsByCourse } from "@/lib/firestore";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface StudentData {
  uid: string;
  name: string;
  email: string;
  courses: string[];
  progress: number;
  quizAvg: number | null;
}

export default function StudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Load everything in a few batched reads instead of one query per
        // student per course. Teachers can read progress for their students
        // once the Firestore rules allow staff reads.
        const [myCourses, allUsers, allProgress, allQuizResults] = await Promise.all([
          getCoursesByTeacher(user.id),
          getAllUsers(),
          getAllProgress(),
          getAllQuizResults(),
        ]);

        const userMap: Record<string, any> = {};
        allUsers.forEach((u: any) => { userMap[u.id] = u; });

        // Get all enrollments per course
        const studentMap: Record<string, { courseIds: string[]; courseNames: string[] }> = {};
        await Promise.all(myCourses.map(async (c: any) => {
          const enr = await getEnrollmentsByCourse(c.id);
          enr.forEach((e: any) => {
            if (!studentMap[e.userId]) studentMap[e.userId] = { courseIds: [], courseNames: [] };
            studentMap[e.userId].courseIds.push(c.id);
            studentMap[e.userId].courseNames.push(c.title);
          });
        }));

        // Lessons per course, used to turn completed lesson counts into a %.
        const lessonsByCourse: Record<string, Set<string>> = {};
        await Promise.all(myCourses.map(async (c: any) => {
          const lessons = await getLessonsByCourse(c.id);
          lessonsByCourse[c.id] = new Set(lessons.map((l: any) => l.id));
        }));

        const progressMap: Record<string, string[]> = {};
        allProgress.forEach((p: any) => {
          if (p.userId && p.courseId) {
            progressMap[`${p.userId}|${p.courseId}`] = Array.isArray(p.completedLessons)
              ? p.completedLessons
              : [];
          }
        });

        const quizResultsByUser: Record<string, any[]> = {};
        allQuizResults.forEach((r: any) => {
          if (!r.userId) return;
          (quizResultsByUser[r.userId] ||= []).push(r);
        });

        // Build student data
        const data = Object.entries(studentMap).map(([uid, { courseIds, courseNames }]) => {
          const u = userMap[uid];
          if (!u) return null;

          let totalLessons = 0;
          let totalDone = 0;
          courseIds.forEach((cId) => {
            const lessonIds = lessonsByCourse[cId] || new Set<string>();
            const completed = progressMap[`${uid}|${cId}`] || [];
            totalLessons += lessonIds.size;
            totalDone += completed.filter((id) => lessonIds.has(id)).length;
          });
          const progress = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;

          const results = (quizResultsByUser[uid] || []).filter((r: any) =>
            courseIds.includes(r.courseId)
          );
          const scored = results.filter((r: any) => Number(r.total) > 0);
          const quizAvg = scored.length > 0
            ? Math.round(scored.reduce((a: number, r: any) => a + (Number(r.score) / Number(r.total)) * 100, 0) / scored.length)
            : null;

          return { uid, name: u.name || "Student", email: u.email || "", courses: courseNames, progress, quizAvg };
        });

        if (!cancelled) {
          setStudents(
            (data.filter(Boolean) as StudentData[]).sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          );
        }
      } catch (error) {
        console.error("Failed to load teacher students", error);
        if (!cancelled) {
          setStudents([]);
          toast.error("Could not load your students. Please refresh and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Students" description="View all students enrolled in your courses." allowedRoles={["teacher", "admin"]}>
      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        <Input className="pl-9" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <Users className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">{students.length === 0 ? "No students yet" : "No results"}</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {students.length === 0 ? "Students will appear here once they enroll in your courses." : "Try a different search term."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Enrolled In</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Quiz Avg.</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.courses.map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={s.progress} className="w-20 h-1.5" />
                        <span className="text-sm">{s.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.quizAvg !== null ? (
                        <Badge variant={s.quizAvg >= 70 ? "success" : "warning"}>{s.quizAvg}%</Badge>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>No quizzes</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.progress === 100 ? "success" : s.progress > 0 ? "default" : "secondary"}>
                        {s.progress === 100 ? "Completed" : s.progress > 0 ? "In Progress" : "Not Started"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
