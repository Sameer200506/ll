"use client";
import { useEffect, useRef, useState } from "react";
import { getCertificate } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

async function downloadCertificate(el: HTMLElement, fileName: string) {
  const html2canvas = (await import("html2canvas")).default;
  const jsPDF = (await import("jspdf")).jsPDF;
  const canvas = await html2canvas(el, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#0b0f1a",
    logging: false,
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
  pdf.save(fileName);
}

export default function CertificateViewPage({ params }: { params: Promise<{ certId: string }> }) {
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then(async (p) => {
      const data = await getCertificate(p.certId);
      setCert(data);
      setLoading(false);
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL("https://www.jrcodecrafterz.com", {
          width: 100,
          margin: 1,
          color: { dark: "#ffffff", light: "#0b0f1a" },
        });
        setQrDataUrl(url);
      } catch (e) {
        console.error("QR gen error", e);
      }
    });
  }, [params]);

  const handleDownload = async () => {
    if (cert && cert.certificateUrl) {
      const link = document.createElement("a");
      link.href = cert.certificateUrl;
      link.target = "_blank";
      link.download = `JRCC-${cert.studentName.replace(/\s+/g, "_")}-${cert.courseName.replace(/\s+/g, "_")}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    if (!certRef.current || !cert) return;
    setDownloading(true);
    try {
      await downloadCertificate(
        certRef.current,
        `JRCC-${cert.studentName.replace(/\s+/g, "_")}-${cert.courseName.replace(/\s+/g, "_")}.pdf`
      );
      toast.success("Certificate downloaded!");
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0b0f1a" }}>
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#0b0f1a" }}>
        <h1 className="text-2xl font-bold text-white">Certificate not found</h1>
        <Link href="/certificates"><Button>Back to Certificates</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "#0b0f1a" }}>
      {/* Action bar */}
      <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <Link href="/certificates">
          <Button variant="outline" size="sm" className="gap-2 border-white/10 text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="gap-2 px-6"
          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {cert.certificateUrl ? "Download File" : downloading ? "Generating PDF…" : "Download Certificate"}
        </Button>
      </div>

      {/* ─────────────────── CERTIFICATE ─────────────────── */}
      {cert.certificateUrl ? (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl">
          <img 
            src={cert.certificateUrl} 
            alt={`Certificate for ${cert.studentName}`} 
            className="w-full max-h-[70vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
          />
          <div className="mt-8 flex flex-col items-center text-center">
            <h2 className="text-white font-extrabold text-2xl tracking-tight">{cert.courseName}</h2>
            <p className="text-slate-400 text-sm mt-2 font-semibold">Awarded to <span className="text-orange-400">{cert.studentName}</span> on {cert.completionDate}</p>
            <p className="text-slate-500 text-xs mt-3 font-mono border border-white/5 bg-white/5 px-3 py-1.5 rounded-lg">Verification ID: {cert.certNumber}</p>
          </div>
        </div>
      ) : (
        <div
        ref={certRef}
        style={{
          width: "1122px",
          height: "794px",
          margin: "0 auto",
          background: "#0b0f1a",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        }}
      >

        {/* ── Ambient glow blobs ── */}
        <div style={{
          position: "absolute", top: "-120px", left: "-80px",
          width: "520px", height: "520px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(234,88,12,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-160px", right: "-100px",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "700px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(255,255,255,0.018) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* ── Grid dot pattern ── */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }} />

        {/* ── Left accent bar ── */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: "5px", height: "100%",
          background: "linear-gradient(180deg, #f97316 0%, #ea580c 40%, #6366f1 100%)",
        }} />

        {/* ── Top-right geometric lines ── */}
        <svg style={{ position: "absolute", top: 0, right: 0, width: "240px", height: "240px" }} viewBox="0 0 240 240" fill="none">
          <circle cx="240" cy="0" r="200" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none"/>
          <circle cx="240" cy="0" r="150" stroke="rgba(249,115,22,0.08)" strokeWidth="1" fill="none"/>
          <circle cx="240" cy="0" r="100" stroke="rgba(99,102,241,0.08)" strokeWidth="1" fill="none"/>
          <line x1="40" y1="0" x2="240" y2="200" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          <line x1="100" y1="0" x2="240" y2="140" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
        </svg>

        {/* ── Bottom-left geometric lines ── */}
        <svg style={{ position: "absolute", bottom: 0, left: "20px", width: "200px", height: "200px" }} viewBox="0 0 200 200" fill="none">
          <circle cx="0" cy="200" r="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none"/>
          <circle cx="0" cy="200" r="120" stroke="rgba(249,115,22,0.06)" strokeWidth="1" fill="none"/>
        </svg>

        {/* ── Main content ── */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex",
          paddingLeft: "72px",
          paddingRight: "56px",
          paddingTop: "52px",
          paddingBottom: "48px",
          gap: "0",
        }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>

            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
                <div style={{
                  width: "38px", height: "38px",
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: "900", color: "#fff", letterSpacing: "-0.5px",
                  boxShadow: "0 4px 16px rgba(249,115,22,0.4)",
                }}>
                  JR
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "3px", color: "#fff", lineHeight: 1 }}>
                    JRCODE<span style={{ color: "#f97316" }}>CRAFTERZ</span>
                  </div>
                  <div style={{ fontSize: "7px", letterSpacing: "2px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                    CODE · CREATE · ELEVATE
                  </div>
                </div>
              </div>

              {/* Certificate label */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "4px 12px", borderRadius: "100px",
                  background: "rgba(249,115,22,0.12)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  marginBottom: "14px",
                }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f97316" }} />
                  <span style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "3px", color: "#f97316" }}>
                    CERTIFICATE OF COMPLETION
                  </span>
                </div>

                <div style={{ fontSize: "44px", fontWeight: "800", color: "#fff", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: "6px" }}>
                  Certificate
                </div>
                <div style={{
                  fontSize: "13px", fontWeight: "400", letterSpacing: "0.5px",
                  color: "rgba(255,255,255,0.4)",
                }}>
                  This is to certify that
                </div>
              </div>

              {/* Student name */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  fontSize: "34px",
                  fontWeight: "700",
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                  lineHeight: 1.15,
                  background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {cert.studentName}
                </div>
                <div style={{
                  width: "180px", height: "2px", marginTop: "8px",
                  background: "linear-gradient(90deg, #f97316, rgba(99,102,241,0.5), transparent)",
                  borderRadius: "2px",
                }} />
              </div>

              {/* Course info */}
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", letterSpacing: "2px", marginBottom: "6px", fontWeight: "600" }}>
                  HAS SUCCESSFULLY COMPLETED
                </div>
                <div style={{
                  fontSize: "18px", fontWeight: "700", color: "#fff",
                  lineHeight: 1.3, maxWidth: "480px",
                }}>
                  {cert.courseName}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: "0", marginBottom: "0" }}>
                {cert.courseDuration && (
                  <div style={{
                    paddingRight: "28px", borderRight: "1px solid rgba(255,255,255,0.08)",
                    marginRight: "28px",
                  }}>
                    <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", letterSpacing: "2px", fontWeight: "600", marginBottom: "4px" }}>
                      DURATION
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>
                      {cert.courseDuration}
                    </div>
                  </div>
                )}
                <div style={{
                  paddingRight: "28px", borderRight: "1px solid rgba(255,255,255,0.08)",
                  marginRight: "28px",
                }}>
                  <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", letterSpacing: "2px", fontWeight: "600", marginBottom: "4px" }}>
                    COMPLETED ON
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>
                    {cert.completionDate}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", letterSpacing: "2px", fontWeight: "600", marginBottom: "4px" }}>
                    CERTIFICATE ID
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#f97316", fontFamily: "monospace" }}>
                    {cert.certNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div style={{ display: "flex", gap: "40px", alignItems: "flex-end" }}>
              <div>
                <div style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.7)",
                  fontStyle: "italic",
                  fontFamily: "Georgia, serif",
                  marginBottom: "6px",
                }}>
                  {cert.issuedBy || "JR Code Crafterz"}
                </div>
                <div style={{ width: "120px", height: "1px", background: "rgba(255,255,255,0.15)", marginBottom: "5px" }} />
                <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", letterSpacing: "2px", fontWeight: "600" }}>
                  INSTRUCTOR / AUTHORIZED
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{
            width: "240px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingLeft: "40px",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
          }}>

            {/* Award medallion */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
              <div style={{ position: "relative", width: "130px", height: "130px" }}>
                {/* Outer ring */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "conic-gradient(from 0deg, #f97316, #fbbf24, #6366f1, #f97316)",
                  padding: "3px",
                }}>
                  <div style={{
                    width: "100%", height: "100%", borderRadius: "50%",
                    background: "#0f1624",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: "2px",
                  }}>
                    {/* Star icon */}
                    <div style={{ fontSize: "28px", lineHeight: 1 }}>⭐</div>
                    <div style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "1px", color: "#f97316", lineHeight: 1 }}>
                      JRCODE
                    </div>
                    <div style={{ fontSize: "7px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>
                      CRAFTERZ
                    </div>
                  </div>
                </div>
                {/* Glow */}
                <div style={{
                  position: "absolute", inset: "-8px", borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(249,115,22,0.15), transparent 70%)",
                  zIndex: -1,
                }} />
              </div>

              {/* Issued text */}
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.25)", letterSpacing: "2px", fontWeight: "600" }}>
                  ISSUED BY
                </div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.6)", marginTop: "3px" }}>
                  JR Code Crafterz
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{
                padding: "10px", borderRadius: "12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Scan to verify" style={{ width: "70px", height: "70px", display: "block" }} />
                ) : (
                  <div style={{ width: "70px", height: "70px", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }} />
                )}
              </div>
              <div style={{ fontSize: "7px", letterSpacing: "1.5px", color: "rgba(255,255,255,0.25)", fontWeight: "600", textAlign: "center" }}>
                SCAN TO VERIFY
              </div>
              <div style={{ fontSize: "8px", color: "rgba(249,115,22,0.6)", textAlign: "center", fontWeight: "500" }}>
                jrcodecrafterz.com
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{
          position: "absolute", bottom: 0, left: "5px", right: 0,
          height: "42px",
          background: "rgba(255,255,255,0.03)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center",
          paddingLeft: "68px", paddingRight: "56px",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)", letterSpacing: "1px" }}>
              📍 Hyderabad, Telangana, India
            </span>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)", letterSpacing: "1px" }}>
              🌐 www.jrcodecrafterz.com
            </span>
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)", letterSpacing: "1px" }}>
              ✉ info@jrcodecrafterz.com
            </span>
          </div>
          <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.15)", letterSpacing: "1px" }}>
            An MSME Registered Organization
          </div>
        </div>

      </div>
      )}
      {/* ─────────────────────────────────── */}

      <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.25)" }}>
        Certificate ID: <span className="font-mono" style={{ color: "#f97316" }}>{cert?.certNumber}</span> — Scan the QR code to verify at jrcodecrafterz.com
      </p>
    </div>
  );
}
