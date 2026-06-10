"use client";
import { useEffect, useRef, useState } from "react";
import { getCertificate } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

/** Renders the certificate and triggers PDF download using html2canvas + jsPDF */
async function downloadCertificate(el: HTMLElement, fileName: string) {
  const html2canvas = (await import("html2canvas")).default;
  const jsPDF = (await import("jspdf")).jsPDF;

  const canvas = await html2canvas(el, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  // A4 landscape in mm
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
      // Generate QR code pointing to JR Code Crafterz website
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL("https://www.jrcodecrafterz.com", {
          width: 120,
          margin: 1,
          color: { dark: "#0a1628", light: "#ffffff" },
        });
        setQrDataUrl(url);
      } catch (e) {
        console.error("QR gen error", e);
      }
    });
  }, [params]);

  const handleDownload = async () => {
    if (!certRef.current || !cert) return;
    setDownloading(true);
    try {
      await downloadCertificate(
        certRef.current,
        `JRCC-Certificate-${cert.studentName.replace(/\s+/g, "_")}-${cert.courseName.replace(/\s+/g, "_")}.pdf`
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--background)" }}>
        <h1 className="text-2xl font-bold">Certificate not found</h1>
        <Link href="/certificates"><Button>Back to Certificates</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "#f0f4f8" }}>
      {/* Action bar */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
        <Link href="/certificates">
          <Button variant="outline" size="sm">← Back</Button>
        </Link>
        <Button onClick={handleDownload} disabled={downloading} className="gap-2">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? "Generating PDF…" : "Download Certificate"}
        </Button>
      </div>

      {/* ───────────────────────────  CERTIFICATE  ─────────────────────────── */}
      <div
        ref={certRef}
        style={{
          width: "1122px",
          height: "794px",
          margin: "0 auto",
          background: "#ffffff",
          position: "relative",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          overflow: "hidden",
        }}
      >
        {/* Navy border frame */}
        <div style={{
          position: "absolute", inset: 0,
          border: "18px solid #0a1628",
          zIndex: 2, pointerEvents: "none",
        }} />
        {/* Gold inner line */}
        <div style={{
          position: "absolute", inset: "18px",
          border: "3px solid #c9a84c",
          zIndex: 2, pointerEvents: "none",
        }} />

        {/* Corner gold decorations */}
        {[
          { top: "18px", left: "18px" },
          { top: "18px", right: "18px" },
          { bottom: "18px", left: "18px" },
          { bottom: "18px", right: "18px" },
        ].map((style, i) => (
          <div key={i} style={{
            position: "absolute", width: "80px", height: "80px",
            zIndex: 3, ...style,
          }}>
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              {i === 0 && <><path d="M0 0 L40 0 L40 5 L5 5 L5 40 L0 40 Z" fill="#c9a84c"/><path d="M0 0 L60 0 L60 3 L3 3 L3 60 L0 60 Z" fill="#e8c96a" opacity="0.5"/></>}
              {i === 1 && <><path d="M80 0 L40 0 L40 5 L75 5 L75 40 L80 40 Z" fill="#c9a84c"/><path d="M80 0 L20 0 L20 3 L77 3 L77 60 L80 60 Z" fill="#e8c96a" opacity="0.5"/></>}
              {i === 2 && <><path d="M0 80 L40 80 L40 75 L5 75 L5 40 L0 40 Z" fill="#c9a84c"/><path d="M0 80 L60 80 L60 77 L3 77 L3 20 L0 20 Z" fill="#e8c96a" opacity="0.5"/></>}
              {i === 3 && <><path d="M80 80 L40 80 L40 75 L75 75 L75 40 L80 40 Z" fill="#c9a84c"/><path d="M80 80 L20 80 L20 77 L77 77 L77 20 L80 20 Z" fill="#e8c96a" opacity="0.5"/></>}
            </svg>
          </div>
        ))}

        {/* Main content area */}
        <div style={{
          position: "absolute", inset: "40px",
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", zIndex: 1,
        }}>

          {/* ── Top: Logo + MSME badge ── */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-start", position: "relative", marginBottom: "8px" }}>
            {/* Logo block */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
              {/* JR Logo icon */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <div style={{
                  width: "52px", height: "52px",
                  background: "linear-gradient(135deg, #0a1628 0%, #1a2e55 100%)",
                  borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#c9a84c", fontWeight: "900", fontSize: "18px", letterSpacing: "-1px",
                  border: "2px solid #c9a84c",
                }}>
                  JR&lt;/&gt;
                </div>
              </div>
              <div style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "4px", color: "#0a1628", fontFamily: "Arial, sans-serif", lineHeight: 1 }}>
                JR CODE CRAFTERZ
              </div>
              <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#7a6020", fontFamily: "Arial, sans-serif", marginTop: "2px" }}>
                ─── CODE | CREATE | ELEVATE ───
              </div>
              <div style={{ fontSize: "9px", color: "#555", fontFamily: "Arial, sans-serif", marginTop: "2px" }}>
                (An MSME Registered Organization)
              </div>
              <div style={{ fontSize: "9px", fontFamily: "Arial, sans-serif", marginTop: "1px" }}>
                <span style={{ color: "#555" }}>UDYAM REGISTRATION NO: </span>
                <span style={{ color: "#c9a84c", fontWeight: "bold" }}>UDYAM-AP-12-1234567</span>
              </div>
            </div>

            {/* MSME badge — top right */}
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: "80px", height: "80px",
              background: "radial-gradient(circle at 40% 35%, #f5d76e, #c9a84c 60%, #a07820 100%)",
              borderRadius: "50%",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: "3px solid #7a6020",
              boxShadow: "0 4px 16px rgba(201,168,76,0.4)",
            }}>
              <div style={{ fontSize: "11px", fontWeight: "900", color: "#0a1628", letterSpacing: "1px", lineHeight: 1, fontFamily: "Arial, sans-serif" }}>MSME</div>
              <div style={{ fontSize: "6px", color: "#0a1628", textAlign: "center", fontFamily: "Arial, sans-serif", lineHeight: 1.2, marginTop: "2px" }}>REGISTERED<br/>ORGANIZATION</div>
              <div style={{ fontSize: "11px", color: "#0a1628", marginTop: "3px" }}>★ ★ ★</div>
            </div>
          </div>

          {/* ── CERTIFICATE heading ── */}
          <div style={{ marginBottom: "2px" }}>
            <div style={{
              fontSize: "52px", fontWeight: "900", letterSpacing: "12px",
              color: "#0a1628", lineHeight: 1, fontFamily: "Arial, sans-serif",
              textTransform: "uppercase",
            }}>
              CERTIFICATE
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "2px" }}>
              <div style={{ height: "2px", width: "60px", background: "#c9a84c" }} />
              <div style={{ fontSize: "14px", letterSpacing: "8px", color: "#c9a84c", fontFamily: "Arial, sans-serif", fontWeight: "bold" }}>
                OF COMPLETION
              </div>
              <div style={{ height: "2px", width: "60px", background: "#c9a84c" }} />
            </div>
          </div>

          {/* ── This is to certify ── */}
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#333", marginTop: "6px", fontFamily: "Arial, sans-serif" }}>
            THIS IS TO CERTIFY THAT
          </div>

          {/* ── Student name ── */}
          <div style={{
            fontSize: "40px", color: "#0a1628",
            fontFamily: "'Brush Script MT', 'Dancing Script', cursive",
            marginTop: "4px", lineHeight: 1.1,
          }}>
            {cert.studentName}
          </div>
          <div style={{ height: "1.5px", width: "380px", background: "linear-gradient(90deg, transparent, #c9a84c, transparent)", marginTop: "4px" }} />

          {/* ── has successfully completed ── */}
          <div style={{ fontSize: "11px", color: "#555", marginTop: "6px", fontFamily: "Arial, sans-serif" }}>
            has successfully completed the course
          </div>

          {/* ── Course name banner ── */}
          <div style={{
            background: "#0a1628",
            color: "#c9a84c",
            padding: "7px 36px",
            borderRadius: "4px",
            fontSize: "15px",
            fontWeight: "900",
            letterSpacing: "3px",
            fontFamily: "Arial, sans-serif",
            marginTop: "6px",
            textTransform: "uppercase",
          }}>
            {cert.courseName}
          </div>
          <div style={{ fontSize: "10px", color: "#555", marginTop: "5px", fontFamily: "Arial, sans-serif" }}>
            with dedication and satisfactory performance.
          </div>

          {/* ── Details row ── */}
          <div style={{
            display: "flex", alignItems: "stretch", gap: "0",
            border: "1px solid #e0d0a0", borderRadius: "6px", overflow: "hidden",
            marginTop: "10px", background: "#fdf9f0",
          }}>
            {/* Duration */}
            <div style={{ padding: "8px 20px", textAlign: "center", borderRight: "1px solid #e0d0a0" }}>
              <div style={{ fontSize: "9px", fontWeight: "bold", letterSpacing: "2px", color: "#7a6020", fontFamily: "Arial, sans-serif" }}>COURSE DURATION</div>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#0a1628", fontFamily: "Arial, sans-serif", marginTop: "2px" }}>{cert.courseDuration || "—"}</div>
            </div>
            {/* Date */}
            <div style={{ padding: "8px 20px", textAlign: "center", borderRight: "1px solid #e0d0a0" }}>
              <div style={{ fontSize: "9px", fontWeight: "bold", letterSpacing: "2px", color: "#7a6020", fontFamily: "Arial, sans-serif" }}>DATE OF COMPLETION</div>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#0a1628", fontFamily: "Arial, sans-serif", marginTop: "2px" }}>{cert.completionDate}</div>
            </div>
            {/* Cert ID */}
            <div style={{ padding: "8px 20px", textAlign: "center", borderRight: "1px solid #e0d0a0" }}>
              <div style={{ fontSize: "9px", fontWeight: "bold", letterSpacing: "2px", color: "#7a6020", fontFamily: "Arial, sans-serif" }}>CERTIFICATE ID</div>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#0a1628", fontFamily: "Arial, sans-serif", marginTop: "2px" }}>{cert.certNumber}</div>
            </div>
            {/* QR */}
            <div style={{ padding: "6px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Scan to verify" style={{ width: "56px", height: "56px" }} />
              ) : (
                <div style={{ width: "56px", height: "56px", background: "#eee" }} />
              )}
              <div style={{ fontSize: "7px", letterSpacing: "1px", color: "#555", fontFamily: "Arial, sans-serif" }}>SCAN TO VERIFY</div>
            </div>
          </div>

          {/* ── Award note ── */}
          <div style={{ fontSize: "9px", color: "#777", marginTop: "6px", fontFamily: "Arial, sans-serif", fontStyle: "italic" }}>
            This certificate is awarded in recognition of the successful completion of all required coursework and assessments.
          </div>

          {/* ── Signatures + seal ── */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", marginTop: "8px" }}>
            {/* Instructor sig */}
            <div style={{ textAlign: "center", minWidth: "160px" }}>
              <div style={{ fontSize: "24px", fontFamily: "'Brush Script MT', cursive", color: "#0a1628", lineHeight: 1 }}>
                {cert.issuedBy || "JR Code Crafterz"}
              </div>
              <div style={{ height: "1px", background: "#0a1628", margin: "3px 0" }} />
              <div style={{ fontSize: "9px", fontWeight: "bold", letterSpacing: "1px", color: "#0a1628", fontFamily: "Arial, sans-serif" }}>
                {cert.issuedBy || "INSTRUCTOR"}
              </div>
              <div style={{ fontSize: "8px", color: "#777", fontFamily: "Arial, sans-serif" }}>Instructor</div>
            </div>

            {/* Center seal */}
            <div style={{
              width: "80px", height: "80px",
              borderRadius: "50%",
              border: "3px solid #0a1628",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "#fff",
            }}>
              <div style={{ fontSize: "7px", fontWeight: "900", letterSpacing: "1px", color: "#0a1628", textAlign: "center", lineHeight: 1.2, fontFamily: "Arial, sans-serif" }}>
                JR CODE<br/>CRAFTERZ
              </div>
              <div style={{ fontSize: "8px", color: "#c9a84c", marginTop: "2px" }}>⬡</div>
              <div style={{ fontSize: "14px", fontWeight: "900", color: "#0a1628", fontFamily: "Arial, sans-serif", lineHeight: 1 }}>JR</div>
            </div>

            {/* Auth sig */}
            <div style={{ textAlign: "center", minWidth: "160px" }}>
              <div style={{ fontSize: "24px", fontFamily: "'Brush Script MT', cursive", color: "#0a1628", lineHeight: 1 }}>
                Authorised
              </div>
              <div style={{ height: "1px", background: "#0a1628", margin: "3px 0" }} />
              <div style={{ fontSize: "9px", fontWeight: "bold", letterSpacing: "1px", color: "#0a1628", fontFamily: "Arial, sans-serif" }}>
                AUTHORIZED SIGNATURE
              </div>
              <div style={{ fontSize: "8px", color: "#777", fontFamily: "Arial, sans-serif" }}>JR Code Crafterz</div>
            </div>
          </div>
        </div>

        {/* ── Footer bar ── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "36px",
          background: "#0a1628",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "40px",
          zIndex: 4,
        }}>
          <span style={{ fontSize: "9px", color: "#c9a84c", letterSpacing: "1px", fontFamily: "Arial, sans-serif" }}>
            📍 Hyderabad, Telangana, India
          </span>
          <span style={{ fontSize: "9px", color: "#c9a84c", letterSpacing: "1px", fontFamily: "Arial, sans-serif" }}>
            🌐 www.jrcodecrafterz.com
          </span>
          <span style={{ fontSize: "9px", color: "#c9a84c", letterSpacing: "1px", fontFamily: "Arial, sans-serif" }}>
            ✉ info@jrcodecrafterz.com
          </span>
        </div>
      </div>
      {/* ─────────────────────────────────────────────────────────────────────── */}

      <p className="text-center text-xs mt-4" style={{ color: "var(--text-secondary)" }}>
        Certificate ID: <strong>{cert?.certNumber}</strong> — Scan the QR code on the certificate to verify at jrcodecrafterz.com
      </p>
    </div>
  );
}
