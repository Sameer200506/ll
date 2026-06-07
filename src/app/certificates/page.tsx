import { redirect } from "next/navigation";

// Certificates feature disabled for now — redirect to student dashboard
export default function CertificatesPage() {
  redirect("/dashboard/student");
}
