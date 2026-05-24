"use client";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCourse, getLessonsByCourse } from "@/lib/firestore";
import { ArrowLeft, PlayCircle, Star, Lock, Laptop, Users, Trophy, Sparkles } from "lucide-react";

export default function CourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { user } = useAuth();
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const [c, l] = await Promise.all([
          getCourse(courseId),
          getLessonsByCourse(courseId),
        ]);
        setCourse(c);
        setLessons(l);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50" style={{ background: "var(--background)" }}>
        <div className="skeleton w-32 h-10 mb-4 rounded-xl" />
        <div className="skeleton w-full max-w-4xl h-80 rounded-3xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-slate-50" style={{ background: "var(--background)" }}>
        <h2 className="text-2xl font-bold mb-2">Course not found</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          The course you are looking for does not exist or has been removed.
        </p>
        <Link href="/courses">
          <Button className="rounded-xl font-bold cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  // Determine redirect url based on auth state
  const enrollRedirectUrl = user
    ? "/dashboard/student/browse"
    : `/login?redirect=/courses/${courseId}`;

  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-white" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50"
        style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}>
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img src="/assets/mainlogo.png" alt="CodeKrafters Logo" className="w-8 h-8 object-contain rounded-lg" />
          <span className="text-xl font-bold gradient-text hidden sm:inline-block">CodeKrafters.in</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href={user.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student"}>
              <Button size="sm" className="font-semibold rounded-xl cursor-pointer">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-semibold rounded-xl cursor-pointer">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-semibold rounded-xl cursor-pointer">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 px-6 py-12 max-w-7xl mx-auto w-full">
        {/* Back Link */}
        <Link href="/courses" className="inline-flex items-center gap-2 mb-8 text-sm font-semibold hover:text-orange-500 transition-colors" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>

        {/* Course Details Header & Sticky Card split */}
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* Left Column: Course Details */}
          <div className="lg:col-span-2 space-y-8 text-left">
            <div className="space-y-4">
              <Badge className="bg-orange-50 text-orange-600 border border-orange-200/50 hover:bg-orange-50 font-bold px-3 py-1 text-xs">
                {course.price === 0 ? "Free Program" : `₹${course.price}`}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {course.title}
              </h1>
              <p className="text-sm font-semibold text-slate-500">
                Instructed by <span className="font-bold text-slate-900">{course.teacherName}</span>
              </p>
              
              <div className="flex items-center gap-1.5 pt-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-base font-bold text-slate-700">4.8</span>
                <span className="text-sm text-slate-400" style={{ color: "var(--text-secondary)" }}>(140+ student ratings)</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">About this course</h2>
              <p className="text-base leading-relaxed text-slate-650" style={{ color: "var(--text-secondary)" }}>
                {course.description}
              </p>
            </div>

            {/* Core features of courses */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-slate-900">What you will learn</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                  <Laptop className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Live Coding Classes</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Learn interactive programming from scratch alongside our mentors.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                  <Trophy className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Portfolio Challenges</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Complete hands-on assignments to showcase real working applications.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                  <Users className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Flexible Mentoring</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Custom logical speeds fitted to help children learn effectively.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                  <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Graduation Certificate</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Receive professional portfolio certificates of course completion.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Syllabus Lessons */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-slate-900">Course Syllabus ({lessons.length} Lessons)</h2>
              <div className="border border-slate-100 rounded-3xl divide-y divide-slate-100 overflow-hidden bg-white shadow-sm">
                {lessons.length === 0 ? (
                  <p className="text-sm p-6 text-center" style={{ color: "var(--text-secondary)" }}>
                    No lessons listed yet. Check back soon!
                  </p>
                ) : (
                  lessons.map((lesson: any, idx: number) => (
                    <div key={lesson.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <PlayCircle className="w-5 h-5 text-slate-300" />
                        <span className="text-sm font-semibold text-slate-700">
                          {idx + 1}. {lesson.title}
                        </span>
                      </div>
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Checkout Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-slate-150 rounded-3xl p-6 shadow-xl space-y-6 text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-amber-500" />
              
              {/* Thumbnail Display */}
              <div className="h-44 rounded-2xl overflow-hidden flex items-center justify-center relative bg-orange-50/50 border border-orange-100">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <PlayCircle className="w-16 h-16 opacity-30 text-orange-500 animate-pulse" />
                )}
              </div>

              {/* Pricing section */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pricing Plan</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    {course.price === 0 ? "Free" : `₹${course.price}`}
                  </span>
                  {course.price > 0 && <span className="text-slate-500 text-sm font-semibold">/ module</span>}
                </div>
              </div>

              {/* Action button */}
              <Link href={enrollRedirectUrl} className="block w-full">
                <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer">
                  {user ? "Go to Dashboard to Enroll" : "Sign In to Enroll"}
                </Button>
              </Link>

              {/* Details specifications */}
              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs font-semibold text-slate-500">
                <p className="flex items-center gap-2"><Laptop className="w-4 h-4 text-orange-500" /> Access on tablet, desktop, and phone</p>
                <p className="flex items-center gap-2"><Trophy className="w-4 h-4 text-orange-500" /> Real hands-on grading projects</p>
                <p className="flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" /> Private logical mentor help</p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm px-6 mt-12 bg-black/20" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/assets/Favicon.png" alt="CodeKrafters Logo" className="w-5 h-5 object-contain" />
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>CodeKrafters.in</span>
        </div>
        <p>© 2026 CodeKrafters.in. Built for modern learners.</p>
      </footer>
    </div>
  );
}
