"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { getCourse, getLessonsByCourse, getProgress, markLessonComplete, isEnrolled } from "@/lib/firestore";
import { CheckCircle2, Circle, PlayCircle, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|v=)([^&?\s]+)/);
  return match ? match[1] : null;
}

export default function CoursePlayerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setCourseId(p.courseId));
  }, [params]);

  useEffect(() => {
    if (!courseId || !user) return;
    (async () => {
      const [c, l, enr, prog] = await Promise.all([
        getCourse(courseId),
        getLessonsByCourse(courseId),
        isEnrolled(user.id, courseId),
        getProgress(user.id, courseId),
      ]);
      setCourse(c);
      setLessons(l);
      setEnrolled(enr);
      setCompletedLessons(prog);
      if (l.length > 0) setActiveLesson(l[0]);
      setLoading(false);
    })();
  }, [courseId, user]);

  const handleMarkComplete = async () => {
    if (!activeLesson || !user) return;
    await markLessonComplete(user.id, courseId, activeLesson.id);
    setCompletedLessons((prev) => [...new Set([...prev, activeLesson.id])]);
    toast.success("Lesson marked complete! ✓");
    // Auto-advance
    const idx = lessons.findIndex((l) => l.id === activeLesson.id);
    if (idx < lessons.length - 1) setActiveLesson(lessons[idx + 1]);
  };

  if (loading) return (
    <DashboardLayout title="Course Player" description="Loading…">
      <div className="skeleton h-96 rounded-2xl" />
    </DashboardLayout>
  );

  if (!enrolled) return (
    <DashboardLayout title={course?.title ?? "Course"} description="">
      <Card>
        <CardContent className="pt-6 text-center py-20">
          <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
          <h3 className="text-lg font-semibold mb-2">You're not enrolled</h3>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Purchase this course to access all lessons.</p>
          <Link href="/dashboard/student/browse">
            <Button>Browse Courses</Button>
          </Link>
        </CardContent>
      </Card>
    </DashboardLayout>
  );

  const pct = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;
  const videoId = activeLesson ? getYouTubeId(activeLesson.youtubeUrl || "") : null;

  return (
    <DashboardLayout title={course?.title ?? "Course Player"} description={`by ${course?.teacherName}`}>
      <Link href="/dashboard/student/courses" className="inline-flex items-center gap-2 mb-6 text-sm hover:underline" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to My Courses
      </Link>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Video Player */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="rounded-2xl overflow-hidden bg-black aspect-video w-full">
            {videoId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title={activeLesson?.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <PlayCircle className="w-16 h-16 opacity-30 text-white" />
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{activeLesson?.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <Progress value={pct} className="w-48" />
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{pct}% complete</span>
              </div>
            </div>
            {!completedLessons.includes(activeLesson?.id ?? "") ? (
              <Button onClick={handleMarkComplete} className="gap-2">
                <CheckCircle2 className="w-4 h-4" /> Mark Complete
              </Button>
            ) : (
              <Badge variant="success" className="gap-1 px-3 py-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</Badge>
            )}
          </div>
        </div>

        {/* Lesson List Sidebar */}
        <div className="w-72 flex flex-col flex-shrink-0">
          <div className="p-4 rounded-2xl border flex-1 overflow-y-auto" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Lessons ({lessons.length})
            </h3>
            <div className="space-y-1">
              {lessons.map((lesson: any, idx: number) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                    style={{
                      background: isActive ? "rgba(108,99,255,0.15)" : "transparent",
                      borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--success)" }} />
                    ) : (
                      <Circle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? "" : "opacity-70"}`}>{idx + 1}. {lesson.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
