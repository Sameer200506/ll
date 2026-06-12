"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAllCertificates } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, Search, XCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

function VerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const numParam = searchParams?.get("num") || "";

  const [searchQuery, setSearchQuery] = useState(numParam);
  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (numParam) {
      handleVerify(numParam);
    }
  }, [numParam]);

  const handleVerify = async (queryStr: string) => {
    const cleanQuery = queryStr.trim().toUpperCase();
    if (!cleanQuery) return;
    setLoading(true);
    setSearched(true);
    try {
      const allCerts = await getAllCertificates();
      const found = allCerts.find(
        (c: any) => c.certNumber?.toUpperCase() === cleanQuery || c.id === queryStr
      );
      setCert(found || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/certificates/verify?num=${searchQuery.trim()}`);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 transition-opacity hover:opacity-80">
          <img src="/assets/mainlogo.png" alt="JRCODECRAFTERZ Logo" className="w-9 h-9 object-contain rounded-lg" />
          <span className="text-xl font-bold tracking-tight text-slate-900">
            JR<span className="text-orange-500 font-extrabold">CODE</span>CRAFTERZ
          </span>
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
          <ShieldCheck className="w-6 h-6 text-orange-500" /> Certificate Verification
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Validate the authenticity of JRCODECRAFTERZ graduation credentials.
        </p>
      </div>

      {/* Search Input Box */}
      <Card className="border-slate-100 shadow-xl bg-white mb-6">
        <CardContent className="p-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Certificate Serial Number (e.g. JRCC-2026-X)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold"
              />
            </div>
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl">
              {loading ? "Searching..." : "Verify"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Verification Result Card */}
      {loading ? (
        <div className="skeleton h-64 rounded-3xl" />
      ) : searched ? (
        cert ? (
          <Card className="border-green-150 shadow-2xl bg-white overflow-hidden animate-fade-in">
            {/* Top Verified Banner */}
            <div className="bg-green-600 text-white py-3.5 px-6 flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wider">
              <CheckCircle2 className="w-5 h-5 animate-bounce" /> Verified Graduate Credential
            </div>
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto shadow-md">
                <Award className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Graduate Student</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{cert.studentName}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-50 py-5 my-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Course Program</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{cert.courseName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Completion Date</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{cert.completionDate}</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 px-4 py-3.5 rounded-2xl border border-slate-100 flex-wrap gap-2 text-left">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Serial Number</span>
                  <span className="font-mono text-xs font-bold text-orange-500">{cert.certNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Issued By</span>
                  <span className="text-xs font-bold text-slate-700">{cert.issuedBy || "JR Code Crafterz"}</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`/certificates/${cert.id}`}
                  className="inline-flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline"
                >
                  View full printable certificate page <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </a>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-100 shadow-xl bg-white overflow-hidden animate-fade-in">
            <div className="bg-red-500 text-white py-3.5 px-6 flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wider">
              <XCircle className="w-5 h-5" /> Invalid Certificate Code
            </div>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                We couldn't locate any graduate credentials matching serial number: <strong>{searchQuery}</strong>.
              </p>
              <p className="text-xs text-slate-400">
                Please double-check the spelling, check for hyphens, and verify the digits. If you believe this is an error, contact platform support.
              </p>
            </CardContent>
          </Card>
        )
      ) : null}
    </div>
  );
}

export default function CertificateVerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Suspense fallback={<div className="skeleton h-96 w-96 rounded-3xl" />}>
        <VerificationContent />
      </Suspense>
    </div>
  );
}
