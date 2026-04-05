import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduFlow — Modern Learning Platform",
  description: "Learn, grow, and connect with EduFlow — your all-in-one LMS with YouTube courses, live classes, and AI-powered quizzes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#13161e",
                border: "1px solid #252836",
                color: "#e8eaf0",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
