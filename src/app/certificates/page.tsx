"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCertificatesByStudent } from "@/lib/firestore";
import { Award, Download, ExternalLink, BookOpen, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import Link from "next/link";

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getCertificatesByStudent(user.id).then((certs) => {
      setCertificates(certs.sort((a: any, b: any) =>
        new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
      ));
      setLoading(false);
    });
  }, [user]);

  return (
    <DashboardLayout
      title="My Certificates"
      description="Your earned course completion certificates"
      allowedRoles={["student"]}
    >
      <motion.div className="space-y-8" initial="hidden" animate="visible" variants={staggerContainer}>

        {/* Header */}
        <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-3xl p-8 border border-orange-100/60 bg-gradient-to-r from-orange-50/60 via-white to-amber-50/30 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/30 rounded-bl-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600 border border-orange-200/50 mb-3">
                <Award className="w-3.5 h-3.5" /> Certificates of Achievement
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {loading ? "Loading..." : `${certificates.length} Certificate${certificates.length !== 1 ? "s" : ""} Earned`}
              </h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">
                Each certificate includes a unique ID verifiable by JRCODE CRAFTERZ
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Award className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Certificate grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-52 rounded-3xl" />)}
          </div>
        ) : certificates.length === 0 ? (
          <motion.div variants={fadeInUp}>
            <Card className="border-slate-100">
              <CardContent className="py-16 text-center">
                <Award className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-lg font-bold text-slate-500 mb-2">No certificates yet</p>
                <p className="text-sm text-slate-400 mb-6">
                  Complete your enrolled courses to earn certificates of achievement.
                </p>
                <Link href="/dashboard/student/courses">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
                    <BookOpen className="w-4 h-4 mr-2" /> View My Courses
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <motion.div key={cert.id} variants={fadeInUp} whileHover={{ y: -6 }}>
                <Card className="border-slate-100 overflow-hidden card-hover relative group h-full">
                  {/* Gold gradient top bar */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500" />

                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Icon + badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200/60 hover:bg-amber-50 text-[9px] font-bold uppercase tracking-wider">
                        Verified
                      </Badge>
                    </div>

                    {/* Course name */}
                    <h3 className="font-extrabold text-slate-900 text-base mb-1 line-clamp-2">{cert.courseName}</h3>
                    <p className="text-xs text-slate-400 font-semibold mb-4">Awarded to {cert.studentName}</p>

                    {/* Details */}
                    <div className="space-y-2 mb-5 mt-auto">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                        Completed: {cert.completionDate ? format(new Date(cert.completionDate), "MMMM d, yyyy") : "—"}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Hash className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                        <span className="font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                          {cert.certNumber}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/certificates/${cert.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/15"
                      >
                        View <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/certificates/${cert.id}?print=1`}
                        target="_blank"
                        className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-orange-500 hover:border-orange-300 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
