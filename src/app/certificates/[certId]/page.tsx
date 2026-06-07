import { redirect } from "next/navigation";

// Certificates feature disabled for now
export default function CertificatePage() {
  redirect("/dashboard/student");
}
