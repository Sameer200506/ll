import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEnrollmentsByUser, getAllCourses, getLessonsByCourse, getProgress } from "@/lib/firestore";
import { Award, Download } from "lucide-react";
import { toast } from "sonner";

export default function CertificatesPage() {
  const { user } = useAuth();
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const enrollments = await getEnrollmentsByUser(user.id);
        const approved = enrollments.filter((e: any) => e.status === "approved");
        
        const completed: any[] = [];
        await Promise.all(approved.map(async (enr: any) => {
          const course = await getAllCourses().then(all => all.find(c => c.id === enr.courseId));
          if (!course) return;

          const [lessons, progress] = await Promise.all([
            getLessonsByCourse(enr.courseId),
            getProgress(user.id, enr.courseId)
          ]);

          if (lessons.length > 0 && progress.length >= lessons.length) {
            completed.push({
              id: enr.courseId,
              title: course.title,
              duration: course.duration || "Self-Paced",
              teacherName: course.teacherName || "JR Code Crafterz",
              completedDate: new Date(enr.purchasedAt || Date.now()).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric"
              })
            });
          }
        }));

        setCompletedCourses(completed);
      } catch (err) {
        console.error("Failed to load certificates:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/assets/democertificate.jpg";
    link.download = "jrcodecrafterz-certificate.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Certificate downloaded successfully!");
  };

  return (
    <DashboardLayout title="My Certificates" description="Download certificates for completed courses.">
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {[1, 2].map(i => <div key={i} className="skeleton h-48 rounded-2xl animate-pulse bg-slate-100" />)}
        </div>
      ) : completedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-orange-50 border border-orange-100">
            <Award className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">No certificates yet</h3>
          <p className="text-sm max-w-sm text-slate-400 font-semibold">
            Complete all lessons in an enrolled course to automatically earn your certificate of completion.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {completedCourses.map((course: any) => (
            <div key={course.id} className="rounded-2xl border overflow-hidden card-hover bg-white shadow-sm border-slate-100">
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-left">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400">Certificate of Completion</span>
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-white font-bold text-base leading-tight line-clamp-2">{course.title}</h3>
              </div>
              <div className="px-6 py-4 space-y-3 text-left">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Awarded to</p>
                  <p className="font-semibold text-base mt-0.5">{user?.name}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400">Duration</p>
                    <p className="text-sm font-medium mt-0.5">{course.duration}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400">Completed</p>
                    <p className="text-sm font-medium mt-0.5">{course.completedDate}</p>
                  </div>
                </div>
                <div>
                  <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 font-bold">JRCC-VERIFIED-DEMO</Badge>
                </div>
                <div className="pt-1">
                  <Button onClick={handleDownload} size="sm" className="w-full gap-2 text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold">
                    <Download className="w-3.5 h-3.5" /> Download Certificate
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
