"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllProjectsByStudent, getAllCourses, submitProject } from "@/lib/firestore";
import { FolderOpen, Send, ExternalLink, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function StudentProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "assigned" | "submitted" | "graded">("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [projs, allCourses] = await Promise.all([
        getAllProjectsByStudent(user.id),
        getAllCourses(),
      ]);
      setProjects(projs);
      setCourses(allCourses);
      setLoading(false);
    })();
  }, [user]);

  const handleSubmit = async (projectId: string) => {
    if (!links[projectId]) return;
    setSubmittingIds((prev) => ({ ...prev, [projectId]: true }));
    try {
      await submitProject(projectId, links[projectId]);
      toast.success("Project submitted successfully!");
      setProjects((prev) =>
        prev.map((p) => p.id === projectId ? { ...p, status: "submitted", submissionLink: links[projectId] } : p)
      );
    } catch {
      toast.error("Failed to submit project.");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const getCourseName = (courseId: string) => courses.find((c: any) => c.id === courseId)?.title || "Unknown Course";

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  const assignedCount = projects.filter((p) => p.status === "assigned").length;
  const submittedCount = projects.filter((p) => p.status === "submitted").length;
  const gradedCount = projects.filter((p) => p.status === "graded").length;

  const statusColors: Record<string, string> = {
    assigned: "var(--warning)",
    submitted: "var(--info)",
    graded: "var(--success)",
  };

  return (
    <DashboardLayout title="My Projects" description="View and submit all your assigned projects across courses.">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "All", count: projects.length },
          { key: "assigned", label: "Pending", count: assignedCount },
          { key: "submitted", label: "Submitted", count: submittedCount },
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

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <FolderOpen className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">
              {projects.length === 0 ? "No projects yet" : "No matching projects"}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {projects.length === 0 ? "Projects assigned by your teachers will appear here." : "Try a different filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((proj: any) => (
            <Card key={proj.id} className="card-hover flex flex-col">
              <CardContent className="pt-5 pb-4 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${statusColors[proj.status] || "var(--accent)"}22` }}>
                      {proj.status === "assigned" && <AlertCircle className="w-4 h-4" style={{ color: statusColors.assigned }} />}
                      {proj.status === "submitted" && <Clock className="w-4 h-4" style={{ color: statusColors.submitted }} />}
                      {proj.status === "graded" && <CheckCircle2 className="w-4 h-4" style={{ color: statusColors.graded }} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{proj.title}</h3>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{getCourseName(proj.courseId)}</p>
                    </div>
                  </div>
                  <Badge
                    variant={proj.status === "assigned" ? "warning" : proj.status === "submitted" ? "default" : "success"}
                    className="text-[10px] uppercase flex-shrink-0"
                  >
                    {proj.status}
                  </Badge>
                </div>

                {proj.description && (
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{proj.description}</p>
                )}

                {/* Action areas */}
                <div className="mt-auto">
                  {proj.status === "assigned" && (
                    <div className="pt-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
                      <Input
                        placeholder="Link to your work (GitHub, Drive...)"
                        className="h-8 text-xs"
                        value={links[proj.id] || ""}
                        onChange={(e) => setLinks({ ...links, [proj.id]: e.target.value })}
                      />
                      <Button
                        size="sm"
                        className="w-full text-xs h-8 gap-2"
                        disabled={!links[proj.id] || submittingIds[proj.id]}
                        onClick={() => handleSubmit(proj.id)}
                      >
                        <Send className="w-3 h-3" /> {submittingIds[proj.id] ? "Submitting..." : "Submit Project"}
                      </Button>
                    </div>
                  )}

                  {proj.status === "submitted" && (
                    <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                      <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                        <ExternalLink className="w-3 h-3" /> Submitted Link:
                      </p>
                      <a href={proj.submissionLink} target="_blank" rel="noopener noreferrer"
                        className="text-xs truncate hover:underline block mt-1" style={{ color: "var(--info)" }}>
                        {proj.submissionLink}
                      </a>
                    </div>
                  )}

                  {proj.status === "graded" && (
                    <div className="pt-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Grade:</span>
                        <Badge variant={proj.grade >= 70 ? "success" : proj.grade >= 40 ? "warning" : "danger"}>
                          {proj.grade} / 100
                        </Badge>
                      </div>
                      {proj.feedback && (
                        <div className="p-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
                          <p className="text-xs italic" style={{ color: "var(--text-secondary)" }}>"{proj.feedback}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
