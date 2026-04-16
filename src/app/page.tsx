"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAllCourses } from "@/lib/firestore";
import { BookOpen, Video, Calendar, Trophy, Zap, ArrowRight, Users, Star, PlayCircle } from "lucide-react";

// ... features & stats ...
const features = [
  { icon: Video, title: "YouTube-Based Learning", desc: "Watch curated video lessons embedded directly in the platform." },
  { icon: Calendar, title: "Live Class Scheduling", desc: "Teachers schedule Google Meet sessions that appear on your calendar." },
  { icon: Trophy, title: "Quizzes & Progress", desc: "Test your knowledge with MCQs and track your learning progress." },
  { icon: Users, title: "Student Analytics", desc: "Teachers get detailed insights on enrollment, progress, and scores." },
];

const stats = [
  { label: "Active Students", value: "10K+" },
  { label: "Courses Available", value: "500+" },
  { label: "Expert Teachers", value: "120+" },
  { label: "Avg. Rating", value: "4.9★" },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
    }
  }, [user, loading, router]);

  useEffect(() => {
    (async () => {
      const all = await getAllCourses();
      setCourses(all);
    })();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50"
        style={{ background: "rgba(248,249,255,0.92)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <img src="/assets/mainlogo.png" alt="CodeKrafters Logo" className="w-8 h-8 object-contain rounded-lg" />
          <span className="text-xl font-bold gradient-text">CodeKrafters.in</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-24 text-center overflow-hidden">
        {/* BG glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20 blur-3xl"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }} />
        </div>

        <div className="relative max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6 border"
            style={{ background: "rgba(37,99,235,0.08)", borderColor: "rgba(37,99,235,0.25)", color: "var(--accent-2)" }}>
            <Star className="w-3.5 h-3.5" /> The modern way to learn online
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Learn Smarter,<br />
            <span className="gradient-text">Grow Faster</span>
          </h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            CodeKrafters.in combines YouTube-powered courses, live Google Meet classes, interactive quizzes, and real-time progress tracking — all in one beautiful platform.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Learning Free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/register?role=teacher">
              <Button size="lg" variant="outline">Become a Teacher</Button>
            </Link>
          </div>

          {/* Technology Banner */}
          <div className="mt-16 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border" style={{ borderColor: "var(--border)" }}>
            <img src="/assets/banner.png" alt="Technology Banner" className="w-full h-auto object-cover" />
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="px-6 py-20 max-w-7xl mx-auto border-t" style={{ borderColor: "var(--border)" }}>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Discover the <span className="gradient-text">CodeKrafters</span> Experience</h2>
          <p className="max-w-2xl mx-auto text-lg" style={{ color: "var(--text-secondary)" }}>
            Our platform is built to make coding accessible, interactive, and fun. 
            Watch our introductory previews and explore how we structure modern learning.
          </p>
        </div>
        
        {/* Videos Container */}
        <div className="flex flex-col gap-8 relative items-center max-w-5xl mx-auto">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }} />
            
          {/* Main Large Video */}
          <div className="w-full rounded-3xl overflow-hidden border-2 shadow-2xl relative z-10" style={{ borderColor: "var(--border)", background: "#000" }}>
            <video 
              src="/assets/WhatsApp%20Video%202026-04-12%20at%2012.23.52%20AM%20(1).mp4" 
              autoPlay 
              muted 
              loop 
              playsInline 
              controls
              className="w-full max-h-[500px] object-contain"
            />
          </div>
          
          {/* Two Smaller Videos Side by Side */}
          <div className="grid md:grid-cols-2 gap-6 w-full relative z-10">
            <div className="rounded-2xl overflow-hidden border bg-black shadow-lg" style={{ borderColor: "var(--border)" }}>
              <video 
                src="/assets/WhatsApp%20Video%202026-04-12%20at%2012.23.53%20AM%20(1).mp4" 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="w-full h-full object-cover max-h-[300px] opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="rounded-2xl overflow-hidden border bg-black shadow-lg" style={{ borderColor: "var(--border)" }}>
              <video 
                src="/assets/WhatsApp%20Video%202026-04-12%20at%2012.23.53%20AM%20(2).mp4" 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="w-full h-full object-cover max-h-[300px] opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}

      <section className="px-6 py-12 border-y" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold gradient-text">{value}</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Courses */}
      {courses.length > 0 && (
        <section className="px-6 py-24 max-w-6xl mx-auto border-b" style={{ borderColor: "var(--border)" }}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Explore our <span className="gradient-text">Top Courses</span></h2>
            <p style={{ color: "var(--text-secondary)" }}>Browse the catalog before you commit.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((course: any) => (
              <Card key={course.id} className="card-hover flex flex-col">
                <div className="h-44 rounded-t-2xl overflow-hidden flex items-center justify-center relative"
                  style={{ background: "linear-gradient(135deg, #eef1ff, #dde3f7)" }}>
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <PlayCircle className="w-14 h-14 opacity-30" style={{ color: "var(--accent)" }} />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant={course.price === 0 ? "success" : "default"}>
                      {course.price === 0 ? "Free" : `₹${course.price}`}
                    </Badge>
                  </div>
                </div>
                <CardContent className="pt-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-base mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>by {course.teacherName}</p>
                  <p className="text-xs line-clamp-2 mb-4 flex-1" style={{ color: "var(--text-secondary)" }}>{course.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" style={{ color: "var(--warning)" }} />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                    <Link href="/login">
                      <Button size="sm" className="gap-1">
                        Sign in to Enroll
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/courses">
              <Button variant="outline" size="lg" className="gap-2">View Full Catalog <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything you need to <span className="gradient-text">teach & learn</span></h2>
          <p style={{ color: "var(--text-secondary)" }}>A complete ecosystem for modern education.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-hover p-6 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(37,99,235,0.1)" }}>
                <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto p-12 rounded-3xl border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="mb-8" style={{ color: "var(--text-secondary)" }}>Join thousands of learners and teachers on CodeKrafters.in today.</p>
          <Link href="/register">
            <Button size="lg">Create Your Free Account <ArrowRight className="w-5 h-5" /></Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm px-6" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/assets/Favicon.png" alt="CodeKrafters Logo" className="w-5 h-5 object-contain" />
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>CodeKrafters.in</span>
        </div>
        <p>© 2026 CodeKrafters.in. Built for modern learners.</p>
      </footer>
    </div>
  );
}
