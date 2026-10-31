"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { getCourse, getLessonsByCourse, getProgress, markLessonComplete, isEnrolled, getProjectsByStudent, submitProject, getResourcesByCourse, getQuizzesByCourse, getSchedulesByCourse, isScheduleForStudent } from "@/lib/firestore";
import { CheckCircle2, Circle, PlayCircle, ArrowLeft, Lock, FolderOpen, Send, ExternalLink, Award, FileText, Link2, ClipboardList, Video } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|v=)([^&?\s]+)/);
  return match ? match[1] : null;
}

export default function CoursePlayerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { user } = useAuth();
  const [courseId, setCourseId] = useState("");
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [classSchedules, setClassSchedules] = useState<any[]>([]);
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});
  const [links, setLinks] = useState<Record<string, string>>({});
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);

  useEffect(() => {
    params.then((p) => setCourseId(p.courseId));
  }, [params]);

  useEffect(() => {
    if (!courseId || !user) return;
    (async () => {
      const [c, l, enr, prog, projs, res, qzs, scheds] = await Promise.all([
        getCourse(courseId),
        getLessonsByCourse(courseId),
        isEnrolled(user.id, courseId),
        getProgress(user.id, courseId),
        getProjectsByStudent(user.id, courseId),
        getResourcesByCourse(courseId),
        getQuizzesByCourse(courseId),
        getSchedulesByCourse(courseId),
      ]);
      setCourse(c);
      setLessons(l);
      setEnrolled(enr);
      setCompletedLessons(prog);
      setProjects(projs);
      setResources(res);
      setQuizzes(qzs || []);
      setClassSchedules((scheds || []).filter((s: any) => isScheduleForStudent(s, user.id)));
      if (l.length > 0) setActiveLesson(l[0]);
      setLoading(false);
    })();
  }, [courseId, user]);



  const handleMarkComplete = async () => {
    if (!activeLesson || !user || markingComplete) return;
    setMarkingComplete(true);
    try {
      await markLessonComplete(user.id, courseId, activeLesson.id);
      const newCompleted = [...new Set([...completedLessons, activeLesson.id])];
      setCompletedLessons(newCompleted);
      toast.success("Lesson marked complete! ✓");

      // Check if ALL lessons are now done → show link to download demo certificate
      if (newCompleted.length >= lessons.length) {
        toast.success(
          <span>
            🎉 Course complete! Your certificate is ready.{" "}
            <a href="/assets/democertificate.jpg" target="_blank" rel="noopener noreferrer" className="underline font-semibold">View it here →</a>
          </span>,
          { duration: 8000 }
        );
      }

      // Auto-advance to next lesson
      const idx = lessons.findIndex((l) => l.id === activeLesson.id);
      if (idx < lessons.length - 1) setActiveLesson(lessons[idx + 1]);
    } catch (e: any) {
      console.error("Mark complete error:", e);
      toast.error("Failed to save progress: " + (e?.message ?? "Unknown error"));
    } finally {
      setMarkingComplete(false);
    }
  };




  const handleProjectSubmit = async (projectId: string) => {
    if (!links[projectId]) return;
    setSubmittingIds((prev) => ({ ...prev, [projectId]: true }));
    try {
      await submitProject(projectId, links[projectId]);
      toast.success("Project submitted successfully!");
      setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, status: "submitted", submissionLink: links[projectId] } : p));
    } catch {
      toast.error("Failed to submit project.");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  if (loading) return (
    <DashboardLayout title="Course Player" description="Loading…" allowedRoles={["student"]}>
      <div className="skeleton h-96 rounded-2xl" />
    </DashboardLayout>
  );

  if (!enrolled) return (
    <DashboardLayout title={course?.title ?? "Course"} description="" allowedRoles={["student"]}>
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
    <DashboardLayout title={course?.title ?? "Course Player"} description={`by ${course?.teacherName}`} allowedRoles={["student"]}>
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
            <div className="flex items-center gap-2">
              {activeLesson?.pdfUrl && (
                <a
                  href={activeLesson.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-655 border border-orange-200/50 hover:bg-orange-100 transition-colors shadow-sm cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  <span>Download Lesson PDF</span>
                </a>
              )}
              {!completedLessons.includes(activeLesson?.id ?? "") ? (
                <Button onClick={handleMarkComplete} disabled={markingComplete} className="gap-2">
                  {markingComplete ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Mark Complete</>
                  )}
                </Button>
              ) : (
                <Badge variant="success" className="gap-1 px-3 py-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</Badge>
              )}
              {/* Link to view/download demo certificate */}
              <a
                href="/assets/democertificate.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs border border-yellow-400 text-yellow-600 hover:bg-yellow-50 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm"
                title="View/Download Certificate"
              >
                <Award className="w-3.5 h-3.5 text-yellow-500" />
                Get Certificate
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex flex-col flex-shrink-0">
          <Tabs defaultValue="lessons" className="flex-1 flex flex-col">
            <TabsList className="w-full mb-2 grid grid-cols-4 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="lessons" className="text-[11px] py-1.5 px-0.5 rounded-lg font-semibold">Lessons</TabsTrigger>
              <TabsTrigger value="resources" className="text-[11px] py-1.5 px-0.5 rounded-lg font-semibold">Resources</TabsTrigger>
              <TabsTrigger value="replays" className="text-[11px] py-1.5 px-0.5 rounded-lg font-semibold">Replays</TabsTrigger>
              <TabsTrigger value="projects" className="text-[11px] py-1.5 px-0.5 rounded-lg font-semibold relative">
                Projects
                {projects.filter(p => p.status === "assigned").length > 0 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="lessons" className="flex-1 overflow-y-auto mt-0 rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
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

              {/* Quizzes attached to this course are accessible right here */}
              {quizzes.length > 0 && (
                <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Quizzes ({quizzes.length})
                  </h3>
                  <div className="space-y-2">
                    {quizzes.map((quiz: any) => (
                      <Link
                        key={quiz.id}
                        href={`/dashboard/student/tests/${quiz.id}`}
                        className="flex items-center gap-2.5 p-3 rounded-xl border hover:border-orange-300 hover:bg-orange-50/40 transition-colors"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <ClipboardList className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{quiz.title}</p>
                          <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                            {quiz.questions?.length ?? 0} question{(quiz.questions?.length ?? 0) !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="resources" className="flex-1 overflow-y-auto mt-0 rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Learning Resources
              </h3>
              {course?.curriculumPdfUrl && (
                <a
                  href={course.curriculumPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors mb-4 text-xs font-bold"
                >
                  <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span>Download Curriculum PDF</span>
                </a>
              )}
              {resources.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: "var(--text-secondary)" }}>
                  No extra resources posted yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {resources.map((res: any) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border hover:bg-slate-50 transition-colors"
                      style={{ background: "var(--background)", borderColor: "var(--border)" }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600 flex-shrink-0">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-slate-800">{res.name}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">{res.type}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="replays" className="flex-1 overflow-y-auto mt-0 rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Class Replays &amp; Materials
              </h3>
              {classSchedules.filter((s) => s.recordingUrl || (Array.isArray(s.materials) && s.materials.length > 0)).length === 0 && !course?.replayUrl ? (
                <div className="text-center py-10 opacity-60">
                  <PlayCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No live class replays or materials available yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classSchedules
                    .filter((s) => s.recordingUrl || (Array.isArray(s.materials) && s.materials.length > 0))
                    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
                    .map((s) => (
                      <div key={s.id} className="p-3 rounded-xl border" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{s.courseName || course?.title}</p>
                            <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                              {s.datetime ? format(new Date(s.datetime), "MMM d, yyyy · h:mm a") : "Date TBD"}
                            </p>
                          </div>
                          <Badge variant={s.ended ? "secondary" : "default"} className="text-[9px] uppercase flex-shrink-0">
                            {s.ended ? "Finished" : "Class"}
                          </Badge>
                        </div>

                        {s.recordingUrl && (
                          <a
                            href={s.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2.5 flex items-center gap-2 p-2.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors text-xs font-bold"
                          >
                            <Video className="w-4 h-4 flex-shrink-0 text-orange-500" />
                            <span className="flex-1">Watch Class Recording</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        )}

                        {Array.isArray(s.materials) && s.materials.length > 0 && (
                          <div className="mt-2.5 space-y-1.5">
                            <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: "var(--text-secondary)" }}>
                              Documents
                            </p>
                            {s.materials.map((m: any, i: number) => (
                              <a
                                key={`${m.url}-${i}`}
                                href={m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg border hover:bg-slate-50 transition-colors"
                                style={{ borderColor: "var(--border)" }}
                              >
                                <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                                <span className="text-[11px] font-medium truncate flex-1">{m.name}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                  {course?.replayUrl && (
                    <div className="p-3 rounded-xl border" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                      <p className="text-xs font-semibold mb-2">Course Replay</p>
                      {getYouTubeId(course.replayUrl) ? (
                        <div className="rounded-xl overflow-hidden bg-black aspect-video w-full">
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${getYouTubeId(course.replayUrl)}?rel=0`}
                            title="Live Class Replay"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a
                          href={course.replayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors text-xs font-bold"
                        >
                          <PlayCircle className="w-4 h-4 flex-shrink-0 text-orange-500" />
                          <span className="flex-1">Open Replay Link</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="projects" className="flex-1 overflow-y-auto mt-0 rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Your Projects ({projects.length})
              </h3>
              {projects.length === 0 ? (
                <div className="text-center py-10 opacity-60">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No projects assigned yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((proj) => (
                    <div key={proj.id} className="p-4 rounded-xl border flex flex-col gap-3" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{proj.title}</h4>
                          <Badge variant={proj.status === "assigned" ? "secondary" : proj.status === "submitted" ? "default" : "success"} className="text-[10px] uppercase flex-shrink-0">
                            {proj.status}
                          </Badge>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{proj.description}</p>
                      </div>

                      {proj.status === "assigned" && (
                        <div className="pt-3 border-t flex flex-col gap-2 mt-auto" style={{ borderColor: "var(--border)" }}>
                          <Input 
                            placeholder="Link to your work (GitHub, Drive...)" 
                            className="h-8 text-xs" 
                            value={links[proj.id] || ""} 
                            onChange={(e) => setLinks({ ...links, [proj.id]: e.target.value })} 
                          />
                          <Button size="sm" className="w-full text-xs h-8 gap-2" disabled={!links[proj.id] || submittingIds[proj.id]} onClick={() => handleProjectSubmit(proj.id)}>
                            <Send className="w-3 h-3" /> {submittingIds[proj.id] ? "Submitting..." : "Submit Project"}
                          </Button>
                        </div>
                      )}

                      {proj.status === "submitted" && (
                        <div className="pt-3 border-t mt-auto" style={{ borderColor: "var(--border)" }}>
                          <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                            <ExternalLink className="w-3 h-3" /> Submitted Link:
                          </p>
                          <a href={proj.submissionLink} target="_blank" rel="noopener noreferrer" className="text-xs truncate hover:underline block mt-1" style={{ color: "var(--info)" }}>
                            {proj.submissionLink}
                          </a>
                        </div>
                      )}

                      {proj.status === "graded" && (
                        <div className="pt-3 border-t mt-auto space-y-2" style={{ borderColor: "var(--border)" }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Grade:</span>
                            <Badge variant={proj.grade >= 70 ? "success" : proj.grade >= 40 ? "warning" : "danger"}>{proj.grade} / 100</Badge>
                          </div>
                          {proj.feedback && (
                            <div className="p-2 rounded-lg bg-black/5">
                              <p className="text-xs text-secondary-foreground italic">"{proj.feedback}"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
