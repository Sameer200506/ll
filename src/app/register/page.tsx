import { Suspense } from "react";
import RegisterContent from "./RegisterContent";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)", color: "var(--text-secondary)" }}>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
