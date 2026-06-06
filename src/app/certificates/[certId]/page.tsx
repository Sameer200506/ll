"use client";

import { useEffect, useState } from "react";
import { getCertificate } from "@/lib/firestore";
import { useParams, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Award, Shield, CheckCircle2, Hash, Calendar, BookOpen, Printer } from "lucide-react";
import Link from "next/link";

export default function CertificatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const certId = params?.certId as string;
  const isPrint = searchParams?.get("print") === "1";

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!certId) return;
    getCertificate(certId).then((data) => {
      if (!data) setNotFound(true);
      else setCert(data);
      setLoading(false);
    });
  }, [certId]);

  useEffect(() => {
    if (isPrint && cert) {
      setTimeout(() => window.print(), 600);
    }
  }, [isPrint, cert]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent border-orange-500 animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-sm">
          <Award className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Certificate Not Found</h1>
          <p className="text-slate-400 mb-6">This certificate ID is invalid or has been revoked.</p>
          <Link href="/" className="px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const completionDate = cert.completionDate
    ? format(new Date(cert.completionDate), "MMMM d, yyyy")
    : "—";
  const issuedDate = cert.issuedAt
    ? format(new Date(cert.issuedAt), "MMMM d, yyyy")
    : "—";

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Page wrapper */}
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-white flex flex-col items-center justify-center px-4 py-10 font-sans">

        {/* Action bar */}
        <div className="no-print mb-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
          <Link
            href="/certificates"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-slate-200 hover:border-orange-500 text-slate-600 hover:text-orange-600 font-bold text-sm transition-all"
          >
            ← My Certificates
          </Link>
        </div>

        {/* Certificate card */}
        <div
          className="w-full max-w-3xl relative bg-white rounded-3xl shadow-2xl overflow-hidden"
          style={{ border: "3px solid #fed7aa" }}
        >
          {/* Decorative corner ornaments */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-transparent" style={{ borderBottomRightRadius: "100%" }} />
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/20 to-transparent" style={{ borderBottomLeftRadius: "100%" }} />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-400/20 to-transparent" style={{ borderTopRightRadius: "100%" }} />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-amber-400/20 to-transparent" style={{ borderTopLeftRadius: "100%" }} />

          {/* Top gold strip */}
          <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400" />

          <div className="px-8 md:px-14 py-10 text-center relative z-10">
            {/* Brand header */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <img src="/assets/mainlogo.png" alt="JRCODE CRAFTERZ" className="w-12 h-12 object-contain rounded-xl border border-orange-200 shadow-md" />
              <div className="text-left">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  JR<span className="text-orange-500">CODE</span>CRAFTERZ
                </span>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none mt-0.5">EdTech Platform</p>
              </div>
            </div>

            {/* Title */}
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500 mb-2">
              Certificate of Completion
            </p>
            <p className="text-slate-400 text-sm font-semibold mb-6">This certifies that</p>

            {/* Student name */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6 relative">
              {cert.studentName}
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
            </h1>

            <p className="text-slate-500 font-medium mb-2 mt-6">has successfully completed the course</p>

            {/* Course name */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-50 border border-orange-200 mt-2 mb-8">
              <BookOpen className="w-5 h-5 text-orange-500" />
              <span className="text-xl font-bold text-slate-900">{cert.courseName}</span>
            </div>

            {/* Date */}
            <p className="text-slate-500 font-semibold text-sm mb-8">
              <Calendar className="w-4 h-4 text-orange-400 inline-block mr-1.5 mb-0.5" />
              Completed on <strong className="text-slate-800">{completionDate}</strong>
            </p>

            {/* Divider */}
            <div className="border-t border-dashed border-orange-200 mb-8" />

            {/* Signature area */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-left mb-8">
              <div className="text-center">
                <div className="h-12 flex items-end justify-center mb-1">
                  <span className="font-bold text-xl text-slate-700" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                    JRCODE CRAFTERZ
                  </span>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authorized Signature</p>
                  <p className="text-xs text-slate-400 font-semibold">{cert.issuedBy || "JRCODE CRAFTERZ Academy"}</p>
                </div>
              </div>

              {/* Award medal */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
                <Award className="w-9 h-9 text-white" />
              </div>

              <div className="text-center">
                <div className="h-12 flex items-end justify-center mb-1">
                  <span className="text-slate-600 font-bold text-base">{issuedDate}</span>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Date</p>
                  <p className="text-xs text-slate-400 font-semibold">JRCODE CRAFTERZ</p>
                </div>
              </div>
            </div>

            {/* Verification footer */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Verified Certificate</span>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Hash className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-mono text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                  {cert.certNumber}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-1.5">
                Certificate ID: {cert.id} · Verify at jrcodecrafterz.in
              </p>
            </div>
          </div>

          {/* Bottom gold strip */}
          <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-400" />
        </div>
      </div>
    </>
  );
}
