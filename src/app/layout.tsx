import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CodeKrafters.in | Modern Learning Platform",
  description: "Learn, grow, and connect with CodeKrafters.in — your all-in-one LMS with YouTube courses, live classes, and AI-powered quizzes.",
  keywords: "LMS, e-learning, online courses, CodeKrafters, programming, coding, live classes, education",
  openGraph: {
    title: "CodeKrafters.in - Master Coding Online",
    description: "The ultimate modern platform for learning coding with YouTube-based courses, interactive quizzes, and live class scheduling.",
    url: "https://codekrafters.in",
    siteName: "CodeKrafters",
    images: [
      {
        url: "/assets/banner.png",
        width: 1200,
        height: 630,
        alt: "CodeKrafters.in Platform Banner",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  icons: {
    icon: "/assets/Favicon.png",
    shortcut: "/assets/Favicon.png",
    apple: "/assets/Favicon.png",
  },
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
