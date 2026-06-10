"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCertificatesByStudent, getCourse, getEnrollmentsByUser, getLessonsByCourse, getProgress, createCertificate } from "@/lib/firestore";
import { Award, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Load existing certificates
      const existing = await getCertificatesByStudent(user.id);
      const certsByCourse: Record<string, boolean> = {};
      existing.forEach((c: any) => { certsByCourse[c.courseId] = true; });

      // Check for newly completed courses that don't have a cert yet
      const enrollments = await getEnrollmentsByUser(user.id);
      const approved = enrollments.filter((e: any) => e.status === "approved");

      const newCerts: any[] = [];
      await Promise.all(approved.map(async (enr: any) => {
        if (certsByCourse[enr.courseId]) return; // already has cert
        const [course, lessons, completed] = await Promise.all([
          getCourse(enr.courseId),
          getLessonsByCourse(enr.courseId),
          getProgress(user.id, enr.courseId),
        ]);
        if (!course || lessons.length === 0) return;
        if (completed.length >= lessons.length) {
          // All lessons done — auto-generate certificate
          const { id, certNumber } = await createCertificate({
            studentId: user.id,
            studentName: user.name,
            courseId: enr.courseId,
            courseName: course.title,
            courseDuration: course.duration ?? "",
            completionDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
            issuedBy: course.teacherName ?? "JR Code Crafterz",
          });
          newCerts.push({
            id,
            certNumber,
            studentName: user.name,
            courseId: enr.courseId,
            courseName: course.title,
            courseDuration: course.duration ?? "",
            completionDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
            issuedBy: course.teacherName ?? "JR Code Crafterz",
            issuedAt: new Date().toISOString(),
          });
        }
      }));

      setCerts([...existing, ...newCerts]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardLayout title="My Certificates" description="Download certificates for completed courses.">
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {[1, 2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : certs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: "var(--accent-glow)" }}>
            <Award className="w-10 h-10" style={{ color: "var(--accent)" }} />
          </div>
          <h3 className="text-xl font-bold mb-2">No certificates yet</h3>
          <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
            Complete all lessons in an enrolled course to automatically earn your certificate of completion.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certs.map((cert: any) => (
            <div key={cert.id} className="rounded-2xl border overflow-hidden card-hover" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {/* Navy header */}
              <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2e55 100%)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400">Certificate of Completion</span>
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-white font-bold text-base leading-tight line-clamp-2">{cert.courseName}</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Awarded to</p>
                  <p className="font-semibold text-base mt-0.5">{cert.studentName}</p>
                </div>
                <div className="flex gap-4">
                  {cert.courseDuration && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-secondary)" }}>Duration</p>
                      <p className="text-sm font-medium mt-0.5">{cert.courseDuration}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-secondary)" }}>Completed</p>
                    <p className="text-sm font-medium mt-0.5">{cert.completionDate}</p>
                  </div>
                </div>
                <div>
                  <Badge variant="secondary" className="text-[10px]">{cert.certNumber}</Badge>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href={`/certificates/${cert.id}`} className="flex-1">
                    <Button size="sm" className="w-full gap-2 text-xs">
                      <ExternalLink className="w-3.5 h-3.5" /> View &amp; Download
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
