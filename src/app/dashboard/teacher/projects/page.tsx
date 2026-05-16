"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCoursesByTeacher, getProjectsByCourse, gradeProject, getAllUsers } from "@/lib/firestore";
import { FolderOpen, CheckCircle2, Clock, AlertCircle, ExternalLink, Star, Search } from "lucide-react";
import { toast } from "sonner";

export default function TeacherProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "assigned" | "submitted" | "graded">("all");
  const [search, setSearch] = useState("");
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ grade: "", feedback: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const [myCourses, allUsers] = await Promise.all([
      getCoursesByTeacher(user!.id),
      getAllUsers(),
    ]);
    setCourses(myCourses);
    setUsers(allUsers as any[]);

    // Get all projects across teacher's courses
    const allProjects: any[] = [];
    await Promise.all(myCourses.map(async (c: any) => {
      const projs = await getProjectsByCourse(c.id);
      projs.forEach((p: any) => allProjects.push({ ...p, courseName: c.title }));
    }));
    setProjects(allProjects);
    setLoading(false);
  };

  const getStudentName = (studentId: string) => {
    const u = users.find((u: any) => u.id === studentId);
    return u?.name || studentId;
  };

  const handleGrade = async (projectId: string) => {
    const grade = parseInt(gradeForm.grade);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error("Grade must be between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      await gradeProject(projectId, { grade, feedback: gradeForm.feedback });
      toast.success("Project graded!");
      setProjects((prev) =>
        prev.map((p) => p.id === projectId ? { ...p, status: "graded", grade, feedback: gradeForm.feedback } : p)
      );
      setGradingId(null);
      setGradeForm({ grade: "", feedback: "" });
    } catch {
      toast.error("Failed to grade project");
    } finally {
      setSaving(false);
    }
  };

  const filtered = (filter === "all" ? projects : projects.filter((p) => p.status === filter))
    .filter((p) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        p.title?.toLowerCase().includes(s) ||
        p.courseName?.toLowerCase().includes(s) ||
        getStudentName(p.studentId).toLowerCase().includes(s)
      );
    });

  const assignedCount = projects.filter((p) => p.status === "assigned").length;
  const submittedCount = projects.filter((p) => p.status === "submitted").length;
  const gradedCount = projects.filter((p) => p.status === "graded").length;

  const statusColors: Record<string, string> = {
    assigned: "var(--warning)",
    submitted: "var(--info)",
    graded: "var(--success)",
  };

  return (
    <DashboardLayout title="Projects" description="View and grade all student project submissions.">
      {/* Filter + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All", count: projects.length },
            { key: "assigned", label: "Assigned", count: assignedCount },
            { key: "submitted", label: "Awaiting Grade", count: submittedCount },
            { key: "graded", label: "Graded", count: gradedCount },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: filter === key ? "var(--accent)" : "var(--surface-2)",
                color: filter === key ? "white" : "var(--text-secondary)",
              }}
            >
              {label} ({count})
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <Input
            className="pl-9 w-56"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <FolderOpen className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">
              {projects.length === 0 ? "No projects assigned yet" : "No matching projects"}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {projects.length === 0
                ? "Assign projects from your course editor to get started."
                : "Try a different filter or search term."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((proj: any) => (
            <Card key={proj.id} className="card-hover">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  {/* Status icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${statusColors[proj.status] || "var(--accent)"}22` }}>
                    {proj.status === "assigned" && <AlertCircle className="w-5 h-5" style={{ color: statusColors.assigned }} />}
                    {proj.status === "submitted" && <Clock className="w-5 h-5" style={{ color: statusColors.submitted }} />}
                    {proj.status === "graded" && <CheckCircle2 className="w-5 h-5" style={{ color: statusColors.graded }} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{proj.title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {proj.courseName} · Student: <strong>{getStudentName(proj.studentId)}</strong>
                        </p>
                      </div>
                      <Badge
                        variant={proj.status === "assigned" ? "warning" : proj.status === "submitted" ? "default" : "success"}
                        className="text-[10px] uppercase flex-shrink-0"
                      >
                        {proj.status}
                      </Badge>
                    </div>

                    {proj.description && (
                      <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--text-secondary)" }}>{proj.description}</p>
                    )}

                    {/* Submission link */}
                    {proj.submissionLink && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <ExternalLink className="w-3 h-3" style={{ color: "var(--info)" }} />
                        <a href={proj.submissionLink} target="_blank" rel="noopener noreferrer"
                          className="text-xs hover:underline truncate" style={{ color: "var(--info)" }}>
                          {proj.submissionLink}
                        </a>
                      </div>
                    )}

                    {/* Graded info */}
                    {proj.status === "graded" && (
                      <div className="mt-2 flex items-center gap-3">
                        <Badge variant={proj.grade >= 70 ? "success" : proj.grade >= 40 ? "warning" : "danger"}>
                          {proj.grade} / 100
                        </Badge>
                        {proj.feedback && (
                          <span className="text-xs italic truncate" style={{ color: "var(--text-secondary)" }}>"{proj.feedback}"</span>
                        )}
                      </div>
                    )}

                    {/* Grade action for submitted projects */}
                    {proj.status === "submitted" && gradingId !== proj.id && (
                      <Button
                        size="sm"
                        className="mt-3 h-7 px-3 text-xs gap-1"
                        onClick={() => { setGradingId(proj.id); setGradeForm({ grade: "", feedback: "" }); }}
                      >
                        <Star className="w-3 h-3" /> Grade Now
                      </Button>
                    )}

                    {/* Inline grading form */}
                    {gradingId === proj.id && (
                      <div className="mt-3 p-3 rounded-xl border space-y-3" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Grade (0-100)*</Label>
                            <Input
                              type="number" min="0" max="100"
                              placeholder="85"
                              className="h-8 text-xs"
                              value={gradeForm.grade}
                              onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Feedback</Label>
                            <Input
                              placeholder="Good work!"
                              className="h-8 text-xs"
                              value={gradeForm.feedback}
                              onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 px-3 text-xs" disabled={saving} onClick={() => handleGrade(proj.id)}>
                            {saving ? "Saving..." : "Submit Grade"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-3 text-xs" onClick={() => setGradingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
