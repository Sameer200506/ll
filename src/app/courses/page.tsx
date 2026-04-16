"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAllCourses } from "@/lib/firestore";
import { ArrowRight, PlayCircle, Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CoursesCatalogPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const all = await getAllCourses();
      setCourses(all);
      setLoading(false);
    })();
  }, []);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.teacherName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50"
        style={{ background: "rgba(248,249,255,0.92)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}>
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img src="/assets/mainlogo.png" alt="CodeKrafters Logo" className="w-8 h-8 object-contain rounded-lg" />
          <span className="text-xl font-bold gradient-text hidden sm:inline-block">CodeKrafters.in</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12 max-w-7xl mx-auto w-full">
        <div className="mb-10 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Course <span className="gradient-text">Catalog</span></h1>
          <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
            Explore our wide range of courses taught by expert instructors.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            <Input 
              placeholder="Search by course or teacher..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-2 text-base transition-colors"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton h-72 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border rounded-3xl" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <Search className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p style={{ color: "var(--text-secondary)" }}>Try adjusting your search query to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {filtered.map((course: any) => (
              <Card key={course.id} className="card-hover flex flex-col pt-0 h-full">
                <div className="h-44 rounded-t-2xl overflow-hidden flex items-center justify-center relative flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--surface-2), rgba(37,99,235,0.15))" }}>
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
                <CardContent className="pt-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-base mb-1.5 line-clamp-2">{course.title}</h3>
                  <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>by <span className="font-medium text-white">{course.teacherName}</span></p>
                  <p className="text-sm line-clamp-2 mb-6 flex-1" style={{ color: "var(--text-secondary)" }}>{course.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-auto border-t pt-4" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4" style={{ color: "var(--warning)" }} />
                      <span className="text-sm font-semibold">4.8</span>
                    </div>
                    <Link href={`/login?redirect=/courses`}>
                      <Button size="default" className="gap-2">
                        Sign in to Enroll
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
