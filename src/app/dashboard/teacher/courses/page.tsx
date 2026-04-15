"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getCoursesByTeacher, createCourse, updateCourse, getEnrollmentsByCourse } from "@/lib/firestore";
import { Plus, BookOpen, Users, PlayCircle, Pencil, ArrowRight, Settings2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const EMPTY_FORM = { title: "", description: "", thumbnailUrl: "", price: "0" };

export default function TeacherCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // create
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  // edit
  const [editOpen, setEditOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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

  // ── Create ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createCourse({
        title: createForm.title,
        description: createForm.description,
        thumbnailUrl: createForm.thumbnailUrl,
        price: parseFloat(createForm.price) || 0,
        teacherId: user!.id,
        teacherName: user!.name,
      });
      toast.success("Course created!");
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      await loadCourses();
    } catch {
      toast.error("Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──
  const openEdit = (course: any, e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate to course detail
    e.stopPropagation();
    setEditingCourse(course);
    setEditForm({
      title: course.title ?? "",
      description: course.description ?? "",
      thumbnailUrl: course.thumbnailUrl ?? "",
      price: String(course.price ?? 0),
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setSaving(true);
    try {
      await updateCourse(editingCourse.id, {
        title: editForm.title,
        description: editForm.description,
        thumbnailUrl: editForm.thumbnailUrl,
        price: parseFloat(editForm.price) || 0,
      });
      toast.success("Course updated!");
      setEditOpen(false);
      setEditingCourse(null);
      await loadCourses();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  // ── Shared form fields renderer ──
  const CourseFormFields = ({
    form,
    setForm,
    submitting,
    label,
  }: {
    form: typeof EMPTY_FORM;
    setForm: (f: typeof EMPTY_FORM) => void;
    submitting: boolean;
    label: string;
  }) => (
    <>
      <div className="space-y-1.5">
        <Label>Course Title *</Label>
        <Input
          placeholder="e.g. Complete Python Bootcamp"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          placeholder="What will students learn?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Thumbnail URL</Label>
        <Input
          placeholder="https://… (image URL)"
          value={form.thumbnailUrl}
          onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
        />
        {form.thumbnailUrl && (
          <img
            src={form.thumbnailUrl}
            alt="preview"
            className="mt-2 rounded-xl w-full max-h-36 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Price (₹)</Label>
        <Input
          type="number" min="0" placeholder="0 for free"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? `${label}…` : label}
      </Button>
    </>
  );

  return (
    <DashboardLayout title="My Courses" description="Create and manage your courses.">
      <div className="flex justify-end mb-6">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Create Course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <CourseFormFields form={createForm} setForm={setCreateForm} submitting={creating} label="Create Course" />
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <CourseFormFields form={editForm} setForm={setEditForm} submitting={saving} label="Save Changes" />
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <BookOpen className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Create your first course and start teaching!</p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Course</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course: any) => (
            <div key={course.id} className="relative group">
              <Link href={`/dashboard/teacher/courses/${course.id}`}>
                <Card className="card-hover cursor-pointer h-full flex flex-col">
                  <div
                    className="h-40 rounded-t-2xl overflow-hidden flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, var(--surface-2), var(--accent)22)" }}
                  >
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <PlayCircle className="w-12 h-12 opacity-30" style={{ color: "var(--accent)" }} />
                    )}
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
              </Link>

              {/* Quick action buttons — appear on hover */}
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => openEdit(course, e)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-lg transition-all"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  title="Quick edit"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <Link
                  href={`/dashboard/teacher/courses/${course.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-lg transition-all"
                  style={{ background: "var(--accent)", color: "white" }}
                  title="Open editor"
                >
                  <Settings2 className="w-3.5 h-3.5" /> Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
