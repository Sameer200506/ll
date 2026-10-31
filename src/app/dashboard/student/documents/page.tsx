"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getApprovedEnrollmentsByUser,
  getAllCourses,
  getLessonsByCourse,
  getResourcesByCourse,
  getSchedulesByCourse,
  isScheduleForStudent,
} from "@/lib/firestore";
import { FileText, ExternalLink, FolderOpen, Link2, Video, BookOpen } from "lucide-react";
import { format } from "date-fns";

interface DocumentItem {
  id: string;
  name: string;
  url: string;
  type: string;
  source: "lesson" | "resource" | "class" | "curriculum";
  date?: string;
}

interface CourseDocuments {
  courseId: string;
  courseTitle: string;
  items: DocumentItem[];
}

export default function StudentDocumentsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDocuments[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [enrollments, allCourses] = await Promise.all([
          getApprovedEnrollmentsByUser(user.id),
          getAllCourses(),
        ]);

        const courseMap: Record<string, any> = {};
        (allCourses as any[]).forEach((c: any) => { courseMap[c.id] = c; });

        const grouped = await Promise.all(
          (enrollments as any[]).map(async (enrollment: any) => {
            const course = courseMap[enrollment.courseId];
            if (!course) return null;

            const [lessons, resources, schedules] = await Promise.all([
              getLessonsByCourse(enrollment.courseId),
              getResourcesByCourse(enrollment.courseId),
              getSchedulesByCourse(enrollment.courseId),
            ]);

            const items: DocumentItem[] = [];

            if (course.curriculumPdfUrl) {
              items.push({
                id: `${course.id}-curriculum`,
                name: "Course Curriculum PDF",
                url: course.curriculumPdfUrl,
                type: "PDF",
                source: "curriculum",
              });
            }

            (lessons as any[]).forEach((lesson: any) => {
              if (lesson.pdfUrl) {
                items.push({
                  id: `lesson-${lesson.id}`,
                  name: lesson.title || "Lesson PDF",
                  url: lesson.pdfUrl,
                  type: "Lesson PDF",
                  source: "lesson",
                });
              }
            });

            (resources as any[]).forEach((resource: any) => {
              if (resource.url) {
                items.push({
                  id: `resource-${resource.id}`,
                  name: resource.name || "Learning Resource",
                  url: resource.url,
                  type: resource.type || "Resource",
                  source: "resource",
                });
              }
            });

            (schedules as any[])
              .filter((schedule: any) => isScheduleForStudent(schedule, user.id))
              .forEach((schedule: any) => {
                const className = schedule.courseName || course.title || "Live Class";
                const dateLabel = schedule.datetime || "";
                if (schedule.recordingUrl) {
                  items.push({
                    id: `recording-${schedule.id}`,
                    name: `${className} — Recording`,
                    url: schedule.recordingUrl,
                    type: "Recording",
                    source: "class",
                    date: dateLabel,
                  });
                }
                if (Array.isArray(schedule.materials)) {
                  schedule.materials.forEach((material: any, idx: number) => {
                    if (material?.url) {
                      items.push({
                        id: `material-${schedule.id}-${idx}`,
                        name: material.name || "Class Document",
                        url: material.url,
                        type: material.type || "Document",
                        source: "class",
                        date: dateLabel,
                      });
                    }
                  });
                }
              });

            if (items.length === 0) return null;

            return {
              courseId: course.id,
              courseTitle: course.title || "Course",
              items,
            } as CourseDocuments;
          })
        );

        setCourses(grouped.filter(Boolean) as CourseDocuments[]);
      } catch (error) {
        console.error("Failed to load documents:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const totalDocuments = courses.reduce((sum, course) => sum + course.items.length, 0);

  const sourceLabel = (source: DocumentItem["source"]) => {
    if (source === "lesson") return "Lesson";
    if (source === "resource") return "Resource";
    if (source === "class") return "Live Class";
    return "Curriculum";
  };

  const sourceColor = (source: DocumentItem["source"]) => {
    if (source === "lesson") return "var(--accent)";
    if (source === "resource") return "var(--accent-2)";
    if (source === "class") return "var(--success)";
    return "var(--warning)";
  };

  return (
    <DashboardLayout
      title="Documents"
      description="Every lesson PDF, resource, class document and recording in one place."
      allowedRoles={["student"]}
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : totalDocuments === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <FolderOpen className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Documents shared by your teachers will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {totalDocuments} document{totalDocuments !== 1 ? "s" : ""}
            </Badge>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Includes lesson PDFs, course resources, class documents and recordings.
            </p>
          </div>

          {courses.map((course) => (
            <div key={course.courseId}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <h2 className="text-base font-semibold">{course.courseTitle}</h2>
                <Badge variant="secondary" className="text-[10px]">{course.items.length}</Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {course.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 p-3.5 rounded-xl border transition-colors hover:bg-slate-50"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${sourceColor(item.source)}18` }}
                    >
                      {item.type?.toLowerCase().includes("recording") ? (
                        <Video className="w-5 h-5" style={{ color: sourceColor(item.source) }} />
                      ) : item.source === "resource" ? (
                        <Link2 className="w-5 h-5" style={{ color: sourceColor(item.source) }} />
                      ) : (
                        <FileText className="w-5 h-5" style={{ color: sourceColor(item.source) }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: sourceColor(item.source) }}>
                          {sourceLabel(item.source)}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{item.type}</span>
                        {item.date && (
                          <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                            · {format(new Date(item.date), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
