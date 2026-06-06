import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JRCODE CRAFTERZ | Modern Learning Platform",
  description: "Learn, grow, and connect with JRCODE CRAFTERZ — your all-in-one LMS with live coding classes, projects, quizzes, and AI-powered learning for Grades 4-12.",
  keywords: "LMS, e-learning, online courses, JRCODE CRAFTERZ, programming, coding, live classes, education, kids coding, python, javascript",
  openGraph: {
    title: "JRCODE CRAFTERZ - Master Coding Online",
    description: "The ultimate modern platform for learning coding with live classes, interactive quizzes, and project-based learning for Grades 4–12.",
    url: "https://jrcodecrafterz.in",
    siteName: "JRCODE CRAFTERZ",
    images: [
      {
        url: "/assets/banner.png",
        width: 1200,
        height: 630,
        alt: "JRCODE CRAFTERZ Platform Banner",
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
    <html lang="en" className="light" suppressHydrationWarning>
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
