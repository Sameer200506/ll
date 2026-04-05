"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllCourses, enrollUser, isEnrolled, getEnrollmentsByUser } from "@/lib/firestore";
import { ShoppingBag, PlayCircle, Users, Star, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function BrowsePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [all, enr] = await Promise.all([getAllCourses(), getEnrollmentsByUser(user.id)]);
      setCourses(all);
      setEnrolledIds(new Set(enr.map((e: any) => e.courseId)));
      setLoading(false);
    })();
  }, [user]);

  const handleBuy = async (course: any) => {
    if (!user) return;
    setBuyingId(course.id);
    try {
      await enrollUser(user.id, course.id);
      setEnrolledIds((prev) => new Set([...prev, course.id]));
      toast.success(`Enrolled in "${course.title}" 🎉`);
    } catch {
      toast.error("Purchase failed. Please try again.");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <DashboardLayout title="Browse Courses" description="Find and purchase courses to start learning.">
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <ShoppingBag className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">No courses available yet</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Check back soon — teachers are creating courses.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course: any) => {
            const enrolled = enrolledIds.has(course.id);
            return (
              <Card key={course.id} className="card-hover flex flex-col">
                <div className="h-44 rounded-t-2xl overflow-hidden flex items-center justify-center relative"
                  style={{ background: "linear-gradient(135deg, #1a1e2a, #6c63ff22)" }}>
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <PlayCircle className="w-14 h-14 opacity-30" style={{ color: "var(--accent)" }} />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant={course.price === 0 ? "success" : "default"}>
                      {course.price === 0 ? "Free" : `₹${course.price}`}
                    </Badge>
                  </div>
                </div>
                <CardContent className="pt-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-base mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>by {course.teacherName}</p>
                  <p className="text-xs line-clamp-2 mb-4 flex-1" style={{ color: "var(--text-secondary)" }}>{course.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" style={{ color: "var(--warning)" }} />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                    {enrolled ? (
                      <Badge variant="success" className="gap-1"><Check className="w-3 h-3" /> Enrolled</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleBuy(course)}
                        disabled={buyingId === course.id}
                        className="gap-1"
                      >
                        {buyingId === course.id ? "Enrolling..." : <><ShoppingBag className="w-3.5 h-3.5" /> Buy Now</>}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
