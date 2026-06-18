"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCertificatesByStudent } from "@/lib/firestore";
import { Award, Download } from "lucide-react";
import { toast } from "sonner";

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const certs = await getCertificatesByStudent(user.id);
        setCertificates(certs);
      } catch (err) {
        console.error("Failed to load certificates:", err);
        toast.error("Failed to load certificates.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleDownload = (url: string, certNumber: string) => {
    if (!url) {
      toast.error("Certificate file URL not found.");
      return;
    }
    window.open(url, "_blank");
    toast.success(`Opening certificate ${certNumber}`);
  };

  return (
    <DashboardLayout title="My Certificates" description="View and download certificates issued to you.">
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {[1, 2].map(i => <div key={i} className="skeleton h-48 rounded-2xl animate-pulse bg-slate-100" />)}
        </div>
      ) : certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-orange-50 border border-orange-100">
            <Award className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">No certificates yet</h3>
          <p className="text-sm max-w-sm text-slate-400 font-semibold">
            Once issued by the administration, your verified certificates of completion will appear here.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map((cert: any) => (
            <div key={cert.id} className="rounded-2xl border overflow-hidden card-hover bg-white shadow-sm border-slate-100">
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-left">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400">Verified Certificate</span>
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-white font-bold text-base leading-tight line-clamp-2">{cert.courseName}</h3>
              </div>
              <div className="px-6 py-4 space-y-3 text-left">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Awarded to</p>
                  <p className="font-semibold text-base mt-0.5">{cert.studentName}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400">Duration</p>
                    <p className="text-sm font-medium mt-0.5">{cert.courseDuration || "Self-Paced"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400">Date Issued</p>
                    <p className="text-sm font-medium mt-0.5">{cert.completionDate}</p>
                  </div>
                </div>
                <div>
                  <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 font-bold">
                    {cert.certNumber}
                  </Badge>
                </div>
                <div className="pt-1">
                  <Button
                    onClick={() => handleDownload(cert.certificateUrl, cert.certNumber)}
                    size="sm"
                    className="w-full gap-2 text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold"
                  >
                    <Download className="w-3.5 h-3.5" /> View / Download Certificate
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
