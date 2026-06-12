"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAllCourses } from "@/lib/firestore";
import { ArrowRight, PlayCircle, Star, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["All", "Classes 1–12", "Computer Basics", "MS Office", "AI Tools", "Math Basics", "Projects"];

export default function CoursesCatalogPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    (async () => {
      const all = await getAllCourses();
      setCourses(all);
      setLoading(false);
    })();
  }, []);

  const filtered = courses.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      (c.teacherName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());

    const courseCat = c.category || "Classes 1–12";
    const matchesCategory =
      selectedCategory === "All" ||
      courseCat === selectedCategory ||
      (selectedCategory === "Classes 1–12" && courseCat === "Visual Coding (Classes 1–12)");

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50"
        style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}>
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img src="/assets/mainlogo.png" alt="JRCODECRAFTERZ Logo" className="w-8 h-8 object-contain rounded-lg" />
          <span className="text-xl font-bold tracking-tight text-slate-900">
            JR<span className="text-orange-500 font-extrabold">CODE</span>CRAFTERZ
          </span>
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
        <div className="mb-10 animate-fade-in text-left">
          <h1 className="text-4xl font-bold mb-4">Course <span className="gradient-text text-orange-500">Catalog</span></h1>
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

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/10"
                    : "bg-white text-slate-650 hover:text-orange-500 border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
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
                <Link href={`/courses/${course.id}`}>
                  <div className="h-44 rounded-t-2xl overflow-hidden flex items-center justify-center relative flex-shrink-0 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, var(--surface-2), rgba(249,115,22,0.15))" }}>
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                    ) : (
                      <PlayCircle className="w-14 h-14 opacity-30" style={{ color: "var(--accent)" }} />
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant={course.price === 0 ? "success" : "default"}>
                        {course.price === 0 ? "Free" : `₹${course.price}`}
                      </Badge>
                    </div>
                  </div>
                </Link>
                <CardContent className="pt-5 flex-1 flex flex-col text-left">
                  <Link href={`/courses/${course.id}`}>
                    <h3 className="font-semibold text-base mb-1.5 line-clamp-2 hover:text-orange-500 transition-colors cursor-pointer">{course.title}</h3>
                  </Link>
                  <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>by <span className="font-medium text-slate-700">{course.teacherName}</span></p>
                  <p className="text-sm line-clamp-2 mb-6 flex-1" style={{ color: "var(--text-secondary)" }}>{course.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-auto border-t pt-4" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4" style={{ color: "var(--warning)" }} />
                      <span className="text-sm font-semibold">4.8</span>
                    </div>
                    <Link href={`/courses/${course.id}`}>
                      <Button size="sm" variant="outline" className="rounded-xl font-bold cursor-pointer">
                        View Details
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
          <img src="/assets/Favicon.png" alt="JRCODECRAFTERZ Logo" className="w-5 h-5 object-contain" />
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>JRCODECRAFTERZ</span>
        </div>
        <p>© 2026 JRCODECRAFTERZ. Built for modern learners.</p>
      </footer>
    </div>
  );
}
