"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAllCourses, createLead, getSiteSettings } from "@/lib/firestore";
import { 
  BookOpen, Video, Calendar, Trophy, Zap, ArrowRight, Users, Star, PlayCircle, 
  Code, ShieldCheck, Mail, Phone, Globe, ChevronLeft, ChevronRight, MessageSquare, 
  Award, Flame, Sparkles, Check, CheckCircle2, ChevronDown, Monitor, Laptop, GraduationCap,
  Download, Eye, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Custom Social Media SVG Icons
const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
  </svg>
);

// Animated counter component
function Counter({ target, duration = 1500, suffix = "", isFloat = false }: { target: number; duration?: number; suffix?: string; isFloat?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) return;

    const totalMiliseconds = duration;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / (end * (isFloat ? 10 : 1))), 25);
    
    const timer = setInterval(() => {
      start += isFloat ? 0.1 : Math.ceil(end / (duration / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(isFloat ? Math.round(start * 10) / 10 : Math.round(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target, duration, isFloat]);

  return (
    <span>
      {isFloat ? count.toFixed(1) : count.toLocaleString()}
      {suffix}
    </span>
  );
}

// Framer Motion Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" as const } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" as const } }
};

// Data constants
const floatingCodes = [
  { text: "print('Hello Code Crafter!')", top: "12%", left: "6%", delay: 0, animClass: "animate-float-slow" },
  { text: "const coder = new SuperHero()", top: "22%", right: "8%", delay: 1.2, animClass: "animate-float-medium" },
  { text: "def create_future():", top: "58%", left: "4%", delay: 0.6, animClass: "animate-float-fast" },
  { text: "for child in range(stars):", top: "72%", right: "10%", delay: 1.8, animClass: "animate-float-slow" },
  { text: "import AI_Brain as ai", top: "42%", left: "75%", delay: 0.9, animClass: "animate-float-medium" },
];

const testimonials = [
  {
    name: "Dr. Sunitha Reddy",
    role: "Parent of Aarav (Grade 6)",
    rating: 5,
    text: "JRCODECRAFTERZ has completely changed how Aarav spends his free time. He went from just playing games to designing and coding his own arcade games in Python. The 1:1 attention is truly fantastic!",
    avatar: "S"
  },
  {
    name: "Aryan Malhotra",
    role: "Student (Grade 9)",
    rating: 5,
    text: "I loved the JavaScript courses. The mentors are super friendly and explain concepts using fun game examples. Building my own websites made me feel like a real software developer.",
    avatar: "A"
  },
  {
    name: "Vikram Sen",
    role: "Parent of Riya (Grade 8)",
    rating: 5,
    text: "The AI fundamentals module was mind-blowing for Riya. The curriculum is beginner-friendly but covers modern, future-ready skills that aren't taught in schools. Highly recommend the group classes.",
    avatar: "V"
  },
  {
    name: "Meera Joshi",
    role: "Parent of Kabir (Grade 5)",
    rating: 5,
    text: "Excellent computer basics and scratch coding classes. Kabir is always excited for his weekly sessions and proud to showcase his weekly coding projects to the family!",
    avatar: "M"
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Special Learning Courses Category State
  const [activeCategory, setActiveCategory] = useState("Computer Basics");

  // Contact form state
  const [studentName, setStudentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [studentGrade, setStudentGrade] = useState("Grade 1 - 3");
  const [selectedPlan, setSelectedPlan] = useState("Personal 1 to 1");
  const [selectedCourse, setSelectedCourse] = useState("Classes 1–12 (Regular Coding)");
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await getAllCourses();
      setCourses(all);
      const settings = await getSiteSettings();
      if (settings) {
        setSiteSettings(settings);
      }
    })();
  }, []);

  // Testimonial auto sliding
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // CMS Settings Bindings
  const logoUrl = siteSettings?.logoUrl || "/assets/mainlogo.png";
  const whatsappNumber = siteSettings?.whatsappNumber || "+919347008039";
  const contactEmail = siteSettings?.email || "jrcodecrafterz@gmail.com";
  const contactPhone = siteSettings?.phone || "+919347008039";
  const contactWebsite = siteSettings?.website || "www.jrcodecrafterz.com";
  const facebookUrl = siteSettings?.facebookUrl || "https://www.facebook.com/profile.php?id=61576875185774";
  const instagramUrl = siteSettings?.instagramUrl || "https://www.instagram.com/jrcodecrafterz?igsh=MWQydmx5cTJ3ZXo0Zg==";
  const youtubeUrl = siteSettings?.youtubeUrl || "https://www.youtube.com/@jrcodecrafterz-14";
  const heroTitle = siteSettings?.heroTitle || "Learn Coding Live From Experts";
  const heroTagline = siteSettings?.heroTagline || "Turning Young Minds Into Future-Ready Code Crafters";
  const classRange = siteSettings?.classRange || "Classes 1–12";
  const footerText = siteSettings?.footerText || "Turning young learners into certified future-ready creators, game developers, and tech innovators.";

  // Curriculum Bindings
  const curriculumTitle = siteSettings?.curriculum?.title || "JRCODECRAFTERZ Syllabus Outline";
  const curriculumDesc = siteSettings?.curriculum?.desc || "A comprehensive, structured syllabus designed to scale technical competency logically.";
  const curriculumPdfUrl = siteSettings?.curriculum?.pdfUrl || "";
  const curriculumOverview = siteSettings?.curriculum?.syllabusOverview || "Structured around project-based milestones to guarantee interactive comprehension.";
  const curriculumTopics = siteSettings?.curriculum?.topicsCovered || "Variables, conditionals, nested loops, visual canvas drawing, DOM controls, responsive HTML layouts, and ChatGPT prompt operations.";
  const curriculumOutcomes = siteSettings?.curriculum?.learningOutcomes || "Build fully-functional games, deploy custom web apps, receive signed certificate validations.";

  // Why Choose Us Bindings
  const whyChooseUsData = siteSettings?.whyChooseUs || [
    {
      title: "Expert Software Mentors",
      desc: "Vetted software engineers and educators who know how to engage young minds productively.",
      color: "bg-orange-50 text-orange-600 border-orange-100"
    },
    {
      title: "Live Interactive Debugging",
      desc: "No static slides. Mentors write and debug logic live alongside students in real time.",
      color: "bg-orange-50 text-orange-600 border-orange-100"
    },
    {
      title: "Personalized Progression",
      desc: "Tailored lesson pacing matching the student's personal learning curve and goals.",
      color: "bg-orange-50 text-orange-600 border-orange-100"
    },
    {
      title: "Real Application Portfolios",
      desc: "Students build interactive games, tools, and portfolios hosted on live websites.",
      color: "bg-orange-50 text-orange-600 border-orange-100"
    },
    {
      title: "AI & Modern Technology",
      desc: "Master key concepts of prompt engineering, neural basics, and modern software packages.",
      color: "bg-orange-50 text-orange-600 border-orange-100"
    },
    {
      title: "Vetted Portfolio Certification",
      desc: "Graduate with dynamic verified certificates validated directly on the platform.",
      color: "bg-orange-50 text-orange-600 border-orange-100"
    }
  ];

  // Pricing Plans Bindings
  const pricingPlansData = siteSettings?.pricingPlans || [
    {
      title: "Personal 1 to 1",
      price: "2,330",
      billing: " / session",
      desc: "Designed for learners seeking maximum, dedicated 1:1 teacher support.",
      features: ["1:1 Private Classes", "Weekly 2 Classes", "Custom Learning Speed", "Doubt-Solving Live Calendar"],
      isFeatured: false
    },
    {
      title: "Mini Group Session",
      price: "1,835",
      billing: " / session",
      desc: "Our most collaborative setup. Peer interactions keep learners driven and engaged.",
      features: ["Group of 4 Students", "Weekly 2 Classes", "Team coding projects", "Doubt-solving channels", "Peer feedback & review"],
      isFeatured: true
    },
    {
      title: "Micro Group Session",
      price: "950",
      billing: " / session",
      desc: "Affordable, high-energy sessions designed for peer group coding challenges.",
      features: ["Group of 6 Students", "Weekly 2 Classes", "Group games & assignments", "Competitive leaderboards"],
      isFeatured: false
    }
  ];

  const programHighlights = [
    {
      title: "Live 1:1 Classes",
      subtitle: classRange,
      desc: "Personalized lesson speed with private instruction tailored for individual student goals.",
      icon: Laptop,
      accent: "from-orange-500 to-amber-500",
      glow: "rgba(249,115,22,0.15)"
    },
    {
      title: "Live Group Sessions",
      subtitle: classRange,
      desc: "Collaborative, peer-to-peer coding bootcamps of up to 4-6 students that drive group synergy.",
      icon: Users,
      accent: "from-blue-500 to-indigo-500",
      glow: "rgba(59,130,246,0.15)"
    },
    {
      title: "Project-Based Learning",
      subtitle: "Build Games & Web Apps",
      desc: "Learn coding fundamentals by creating fully-functioning games, tools, and interactive art projects.",
      icon: Trophy,
      accent: "from-purple-500 to-pink-500",
      glow: "rgba(168,85,247,0.15)"
    },
    {
      title: "Interactive Challenges",
      subtitle: "Hands-on Exercises",
      desc: "Gamified environments and code puzzles that keep young minds deeply involved and entertained.",
      icon: Zap,
      accent: "from-amber-500 to-yellow-500",
      glow: "rgba(245,158,11,0.15)"
    },
    {
      title: "AI & Future Tech",
      subtitle: "Prepare for Tomorrow",
      desc: "Master artificial intelligence concepts, prompt engineering, and basic neural network design.",
      icon: Sparkles,
      accent: "from-emerald-500 to-teal-500",
      glow: "rgba(16,185,129,0.15)"
    },
    {
      title: "Personalized Mentorship",
      subtitle: "Expert Path Guides",
      desc: "Regular detailed updates for parents and portfolio building tools for young developers.",
      icon: GraduationCap,
      accent: "from-rose-500 to-red-500",
      glow: "rgba(244,63,94,0.15)"
    }
  ];

  // Special Learning Courses Filtered Categories
  const categoriesList = ["Computer Basics", "MS Office", "AI Tools", "Math Basics", "Projects"];
  
  const specialCoursesFiltered = courses.filter(
    (c) => c.category === activeCategory
  );

  // Fallback mock items for special courses so it never looks blank
  const fallbackSpecialCourses: Record<string, any[]> = {
    "Computer Basics": [
      { id: "cb1", title: "Computer Basics & Operating Systems", description: "Learn visual navigation in Windows/MacOS, file explorer hierarchies, and security safety guidelines.", teacherName: "Senior Mentor", price: 0 },
      { id: "cb2", title: "Mastering Speed Typing & Keyboard Shortcuts", description: "Learn standard ergonomics, finger placements, and quick navigation hotkeys.", teacherName: "Typing Tutor", price: 0 }
    ],
    "MS Office": [
      { id: "mso1", title: "Excel Spreadsheet Formulas & Budgets", description: "Master rows, columns, SUM, AVERAGE, logical checks, graphs, and simple spreadsheets.", teacherName: "Admin Specialist", price: 0 },
      { id: "mso2", title: "Word Documents & PowerPoint Slide Design", description: "Build clean reports, resumes, letters, and high-impact slides.", teacherName: "Presentation Expert", price: 0 }
    ],
    "AI Tools": [
      { id: "ai1", title: "ChatGPT Prompt Engineering for Beginners", description: "Write structured prompts, generate stories, build resumes, and speed up research tasks.", teacherName: "AI Specialist", price: 0 },
      { id: "ai2", title: "Midjourney & AI Image Creation", description: "Learn visual text prompts to create digital art, icons, and illustrations.", teacherName: "Creative Director", price: 0 }
    ],
    "Math Basics": [
      { id: "math1", title: "Mental Math & Logic Puzzles", description: "Master fractions, percentages, basic ratios, and visual grid puzzles.", teacherName: "Math Tutor", price: 0 }
    ],
    "Projects": [
      { id: "proj1", title: "Visual Scratch Animation Storyteller", description: "Build animated sequences, interactive cards, and comic strips.", teacherName: "Creative Developer", price: 0 }
    ]
  };

  const activeSpecialCourses = specialCoursesFiltered.length > 0
    ? specialCoursesFiltered
    : (fallbackSpecialCourses[activeCategory] || []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !parentPhone) {
      toast.error("Please fill out your name and phone number");
      return;
    }
    try {
      await createLead({
        name: studentName,
        phone: parentPhone,
        grade: studentGrade,
        plan: selectedPlan,
        course: selectedCourse,
        email: "",
        message: `Book Trial Demo for ${studentGrade} - Preferred Plan: ${selectedPlan} - Course: ${selectedCourse}`
      });
      toast.success("Demo request registered successfully!");
      setFormSubmitted(true);
    } catch {
      toast.error("Failed to submit request, please try again.");
    }
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Sample Certificate download triggers a local PDF mock generation
  const handleDownloadSampleCert = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).jsPDF;
    
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "1122px";
    tempDiv.style.height = "794px";
    tempDiv.style.background = "#0b0f1a";
    tempDiv.style.color = "#ffffff";
    tempDiv.style.fontFamily = "Arial, sans-serif";
    tempDiv.innerHTML = `
      <div style="width: 100%; height: 100%; position: relative; padding: 60px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; border-left: 6px solid #f97316;">
        <div>
          <h2 style="color: #f97316; margin-bottom: 5px; font-size: 24px; letter-spacing: 2px;">JRCODECRAFTERZ</h2>
          <p style="color: rgba(255,255,255,0.4); font-size: 10px; letter-spacing: 1px; margin-top: 0;">CODE · CREATE · ELEVATE</p>
          <div style="margin-top: 50px;">
            <h1 style="font-size: 40px; margin-bottom: 10px;">Certificate of Completion</h1>
            <p style="color: rgba(255,255,255,0.6); font-size: 16px;">This sample certificate is awarded to</p>
            <h2 style="font-size: 36px; color: #ffffff; border-bottom: 2px solid #f97316; display: inline-block; padding-bottom: 5px; margin-top: 20px;">Jane Doe</h2>
          </div>
          <p style="font-size: 16px; margin-top: 30px; max-width: 600px;">
            for successfully completing the course <strong>Sample Programming Module</strong> with outstanding performance.
          </p>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px;">
          <div>
            <p style="font-style: italic; font-size: 18px; margin-bottom: 5px;">JRCODECRAFTERZ Instructor</p>
            <div style="width: 150px; height: 1px; background: rgba(255,255,255,0.2); margin-bottom: 5px;"></div>
            <p style="font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 1px;">AUTHORIZED SIGNATURE</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; color: #f97316; font-family: monospace;">Serial No: JRCC-SAMPLE-2026</p>
            <p style="font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 5px;">Verify at www.jrcodecrafterz.com</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(tempDiv);
    toast.info("Generating your sample certificate PDF...");
    try {
      const canvas = await html2canvas(tempDiv, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save("JRCODECRAFTERZ_Sample_Certificate.pdf");
      toast.success("Sample certificate downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate PDF");
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 bg-white selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      {/* Decorative Blob Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[8%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-100/40 blur-3xl opacity-60 animate-pulse-glow" />
        <div className="absolute top-[35%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-50/50 blur-3xl opacity-50 animate-pulse-glow-blue" />
        <div className="absolute bottom-[20%] left-[-8%] w-[500px] h-[500px] rounded-full bg-purple-50/50 blur-3xl opacity-50" />
        <div className="absolute bottom-[5%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-50/40 blur-3xl opacity-60" />
      </div>

      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 glass-premium">
        <button
          className="flex items-center gap-3 group focus:outline-none"
          onClick={() => handleScrollToSection("hero")}
          aria-label="Go to home"
        >
          <img src={logoUrl} alt="JRCODE CRAFTERZ Logo" className="w-10 h-10 object-contain rounded-xl shadow-md border border-orange-100 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col text-left">
            <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              JR<span className="text-orange-500 font-extrabold">CODE</span>CRAFTERZ
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold leading-none">EdTech Platform</span>
          </div>
        </button>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-650">
          <Link href="/courses" className="hover:text-orange-500 transition-colors">Courses</Link>
          <button onClick={() => handleScrollToSection("about")} className="hover:text-orange-500 transition-colors cursor-pointer">About</button>
          <button onClick={() => handleScrollToSection("highlights")} className="hover:text-orange-500 transition-colors cursor-pointer">Highlights</button>
          <button onClick={() => handleScrollToSection("special-courses")} className="hover:text-orange-500 transition-colors cursor-pointer">Special Courses</button>
          <button onClick={() => handleScrollToSection("curriculum")} className="hover:text-orange-500 transition-colors cursor-pointer">Curriculum</button>
          <button onClick={() => handleScrollToSection("certificate-preview")} className="hover:text-orange-500 transition-colors cursor-pointer">Certificates</button>
          <button onClick={() => handleScrollToSection("pricing")} className="hover:text-orange-500 transition-colors cursor-pointer">Pricing</button>
          <button onClick={() => handleScrollToSection("contact")} className="hover:text-orange-500 transition-colors cursor-pointer">Contact</button>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm font-semibold text-slate-500">
                Hi, {user.name.split(" ")[0]} 👋
              </span>
              <Link
                href={
                  user.role === "teacher"
                    ? "/dashboard/teacher"
                    : user.role === "admin"
                    ? "/admin"
                    : "/dashboard/student"
                }
              >
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 gap-1.5 transition-all cursor-pointer">
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-semibold text-slate-650 hover:text-orange-500 cursor-pointer">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20 gap-1.5 transition-all cursor-pointer">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Floating Code Snippets */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 hidden lg:block">
        {floatingCodes.map((item, idx) => (
          <div
            key={idx}
            className={`absolute ${item.animClass} bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-orange-100 shadow-md text-xs font-mono text-orange-600 font-bold z-10`}
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              animationDelay: `${item.delay}s`,
            }}
          >
            <span className="text-slate-400 mr-1.5">&gt;</span>
            {item.text}
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section id="hero" className="relative pt-20 pb-24 px-6 text-center z-10 overflow-hidden max-w-7xl mx-auto">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Tagline Badge */}
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8 border border-orange-200/60 bg-orange-50 text-orange-600 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            {heroTagline}
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-slate-900 mb-6"
          >
            {heroTitle.split("Live").map((text: string, i: number) => i === 0 ? <span key={i}>{text}</span> : <span key={i}><span className="text-orange-500">Live</span>{text}</span>)}
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-slate-600 font-medium leading-relaxed"
          >
            Master Python, JavaScript, AI Fundamentals, and Computer Basics through interactive live sessions designed for {classRange}.
          </motion.p>

          <motion.div 
            variants={fadeInUp}
            className="flex flex-wrap gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleScrollToSection("contact")}
              className="px-8 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 transition-all cursor-pointer"
            >
              Book Free Demo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleScrollToSection("special-courses")}
              className="px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-orange-500 text-slate-700 hover:text-orange-600 font-bold text-base shadow-sm transition-all cursor-pointer"
            >
              Explore Special Courses
            </motion.button>
          </motion.div>

          {/* Counters Grid */}
          <motion.div 
            variants={fadeInUp}
            className="mt-16 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4"
          >
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden group hover:border-orange-300 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
              <p className="text-3xl font-extrabold text-slate-900">
                <Counter target={10000} suffix="+" />
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1.5">Students Trained</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden group hover:border-orange-300 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <p className="text-3xl font-extrabold text-slate-900">
                <Counter target={25000} suffix="+" />
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1.5">Live Sessions</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden group hover:border-orange-300 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
              <p className="text-3xl font-extrabold text-slate-900">
                <Counter target={50000} suffix="+" />
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1.5">Coding Projects</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden group hover:border-orange-300 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <p className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-1">
                <Counter target={4.9} suffix="" isFloat={true} />
                <span className="text-yellow-500 text-2xl font-bold">★</span>
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1.5">Satisfaction Rate</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Program Highlights Section (Supercharged Learning) */}
      <section id="highlights" className="py-24 px-6 relative z-10 max-w-7xl mx-auto text-center border-t border-slate-100">
        <motion.div 
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-600 font-bold border border-orange-200/50 py-1.5 px-3 rounded-full text-xs mb-4">
            Platform Highlights
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight mb-4 drop-shadow-sm">
            Supercharged Learning Features
          </h2>
          <p className="text-slate-655 max-w-2xl mx-auto font-semibold text-base mt-2">
            Every course includes these core teaching pillars engineered to build logical confidence.
          </p>
        </motion.div>

        {/* Highlights Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
        >
          {programHighlights.map((hl, idx) => {
            const Icon = hl.icon;
            return (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ 
                  y: -8, 
                  boxShadow: "0 20px 40px -15px rgba(234, 88, 12, 0.15)", 
                  borderColor: "rgba(234, 88, 12, 0.3)" 
                }}
                className="bg-white p-8 rounded-3xl border border-slate-100 text-left flex flex-col group relative overflow-hidden transition-all duration-300"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-amber-500" />
                <div 
                  className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-10 blur-xl group-hover:scale-150 transition-all duration-300"
                  style={{ background: hl.glow }}
                />

                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                  <Icon className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
                </div>

                <Badge className="w-fit bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200/40 text-[10px] font-bold mb-3.5 uppercase tracking-wide">
                  {hl.subtitle}
                </Badge>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2.5 group-hover:text-orange-500 transition-colors">
                  {hl.title}
                </h3>
                
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {hl.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Special Learning Courses Section */}
      <section id="special-courses" className="py-24 px-6 bg-orange-50/30 border-y border-orange-100/40 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Badge className="bg-orange-100 text-orange-600 border border-orange-200 font-bold py-1 px-3 rounded-full text-xs mb-3">
              Specialized Pathways
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Special Learning Courses
            </h2>
            <p className="text-slate-600 font-semibold max-w-xl mx-auto mt-2.5">
              Curated for Housewives, Teachers, Job Seekers, and Beginners to kickstart tech journeys.
            </p>
          </motion.div>

          {/* Category selection selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                  activeCategory === cat
                    ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/25"
                    : "bg-white text-slate-600 hover:text-orange-500 border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Special courses grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSpecialCourses.map((course: any) => (
              <Card key={course.id} className="bg-white border-slate-100 card-hover flex flex-col h-full overflow-hidden rounded-3xl text-left">
                <div className="h-40 bg-gradient-to-tr from-slate-900 to-slate-800 p-6 flex flex-col justify-between text-white relative">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(249,115,22,0.1),transparent)]" />
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-bold w-fit text-[10px] uppercase">
                    {course.category || activeCategory}
                  </Badge>
                  <h3 className="font-extrabold text-base leading-snug drop-shadow relative z-10">{course.title}</h3>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">{course.description}</p>
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-3 mt-auto">
                    <span className="text-xs font-black text-orange-600">
                      {course.price === 0 ? "Free Program" : `₹${course.price}`}
                    </span>
                    <button
                      onClick={() => handleScrollToSection("contact")}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      Book Trial Slot
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses (Dynamic courses loaded from Firestore) */}
      {courses.length > 0 && (
        <section className="py-24 px-6 bg-white relative z-10 border-b border-slate-100">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-600 font-bold border border-orange-200/50 py-1.5 px-3 rounded-full text-xs mb-4">
                Explore Courses
              </Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                Explore our <span className="text-orange-500">Top Programs</span>
              </h2>
              <p className="text-slate-600 font-medium max-w-lg mx-auto">Browse courses taught live by experienced developer mentors.</p>
            </motion.div>

            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {courses.slice(0, 3).map((course: any) => (
                <motion.div key={course.id} variants={fadeInUp}>
                  <Card className="flex flex-col overflow-hidden bg-white border border-slate-100 rounded-3xl shadow-sm card-hover h-full">
                    <Link href={`/courses/${course.id}`}>
                      <div className="h-48 rounded-t-2xl overflow-hidden flex items-center justify-center relative bg-orange-50 border-b border-orange-100 cursor-pointer">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                        ) : (
                          <PlayCircle className="w-16 h-16 opacity-30 text-orange-500" />
                        )}
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 text-xs shadow-md">
                            {course.price === 0 ? "Free Demo" : `₹${course.price}`}
                          </Badge>
                        </div>
                      </div>
                    </Link>

                    <CardContent className="p-6 flex-1 flex flex-col text-left">
                      <Link href={`/courses/${course.id}`}>
                        <h3 className="font-bold text-lg text-slate-900 mb-1.5 line-clamp-2 hover:text-orange-500 transition-colors cursor-pointer">{course.title}</h3>
                      </Link>
                      <p className="text-sm mb-3 text-slate-500 font-semibold">by <span className="font-bold text-slate-800">{course.teacherName}</span></p>
                      <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-1 font-medium">{course.description}</p>
                      
                      <div className="flex items-center justify-between gap-3 mt-auto border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-bold text-slate-700">4.8</span>
                        </div>
                        <Link href="/login" className="w-fit">
                          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer">
                            Enroll Live Class
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className="text-center mt-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <Link href="/courses">
                <Button variant="outline" size="lg" className="border-slate-200 hover:border-orange-500 text-slate-700 hover:text-orange-600 font-bold rounded-2xl gap-2 transition-all cursor-pointer">
                  View Full Catalog <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Curriculum Syllabus Section */}
      <section id="curriculum" className="py-24 px-6 bg-slate-50/50 border-b border-slate-100 relative z-10 text-left">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInLeft}
            className="space-y-6"
          >
            <Badge className="bg-orange-100 text-orange-600 border border-orange-200 font-bold py-1 px-3 rounded-full text-xs">
              Structured Roadmap
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black text-slate-950 leading-tight tracking-tight">
              {curriculumTitle}
            </h2>
            <p className="text-slate-600 font-semibold leading-relaxed">
              {curriculumDesc}
            </p>
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-start gap-3.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-orange-100/50 flex items-center justify-center text-orange-600 flex-shrink-0 font-bold">1</div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Syllabus Overview</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-semibold">{curriculumOverview}</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-start gap-3.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-orange-100/50 flex items-center justify-center text-orange-600 flex-shrink-0 font-bold">2</div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Core Topics</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-semibold">{curriculumTopics}</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-start gap-3.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-orange-100/50 flex items-center justify-center text-orange-600 flex-shrink-0 font-bold">3</div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Learning Outcomes</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-semibold">{curriculumOutcomes}</p>
                </div>
              </div>
            </div>

            {curriculumPdfUrl && (
              <div className="pt-2">
                <a href={curriculumPdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 px-6 py-5 rounded-2xl shadow-lg shadow-orange-500/20">
                    <Download className="w-4 h-4" /> Download Full Curriculum PDF
                  </Button>
                </a>
              </div>
            )}
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInRight}
            className="relative flex justify-center"
          >
            {/* Visual mock card representing the curriculum catalog layout */}
            <div className="w-full max-w-sm bg-slate-900 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-orange-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full" />
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-extrabold text-xs">JRC</div>
                <span className="font-mono text-xs text-slate-400">curriculum_manifest.json</span>
              </div>
              <div className="space-y-4 font-mono text-left text-xs leading-relaxed text-slate-350">
                <p><span className="text-pink-400">"program"</span>: <span className="text-orange-300">"EdTech Platform"</span>,</p>
                <p><span className="text-pink-400">"age_group"</span>: <span className="text-orange-300">"6 to 18 Years"</span>,</p>
                <p><span className="text-pink-400">"milestones"</span>: [</p>
                <p className="pl-4"><span className="text-emerald-400">"Block Programming"</span>,</p>
                <p className="pl-4"><span className="text-emerald-400">"Python & Logic Scope"</span>,</p>
                <p className="pl-4"><span className="text-emerald-400">"Web Projects & Deploy"</span>,</p>
                <p className="pl-4"><span className="text-emerald-400">"AI Prompt Engineering"</span></p>
                <p>],</p>
                <p><span className="text-pink-400">"certification"</span>: <span className="text-teal-400">true</span></p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Verified Curriculum</span>
                <span>v3.4 Release</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Certificate Preview Section */}
      <section id="certificate-preview" className="py-24 px-6 bg-white relative z-10 border-b border-slate-100">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center text-left">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInLeft}
            className="space-y-6"
          >
            <Badge className="bg-orange-100 text-orange-600 border border-orange-200 font-bold py-1 px-3 rounded-full text-xs">
              Earn Credentials
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              Get Certified Upon Course Completion
            </h2>
            <p className="text-slate-600 font-semibold leading-relaxed">
              Every graduate receives a verified software portfolio certificate carrying a unique verification number dynamically registered in our control database.
            </p>
            <div className="pt-2 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-slate-700 text-sm">Dynamic serial verification numbers</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-slate-700 text-sm">Downloadable high-resolution PDFs</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-slate-700 text-sm">Official authorization seal</span>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={handleDownloadSampleCert}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-5 rounded-2xl shadow-lg gap-2"
              >
                <Download className="w-4 h-4" /> Download Sample Certificate
              </Button>
            </div>
          </motion.div>

          {/* Certificate Miniature HTML Mockup */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInRight}
            className="relative flex justify-center bg-slate-950 p-6 rounded-3xl shadow-2xl border border-slate-800"
          >
            <div className="w-full max-w-lg aspect-[1.41] bg-slate-900 border-l-4 border-orange-500 p-6 flex flex-col justify-between text-white relative overflow-hidden text-left" style={{ minHeight: "280px" }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-xs tracking-wider">JRCODE<span className="text-orange-500">CRAFTERZ</span></h4>
                    <p className="text-[6px] text-slate-400 tracking-wider">CODE · CREATE · ELEVATE</p>
                  </div>
                  <Award className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="mt-6">
                  <span className="text-[6px] uppercase tracking-widest text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full">Certificate of Achievement</span>
                  <h3 className="font-bold text-base mt-2">Jane Doe</h3>
                  <p className="text-[8px] text-slate-400 mt-1 max-w-xs leading-normal font-semibold">Has successfully graduated and mastered visual coding structures, Python variables, loops, and functional logic checks.</p>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-slate-800/60 pt-4">
                <div>
                  <p className="font-serif italic text-xs text-slate-350">JRCODECRAFTERZ Authorized</p>
                  <p className="text-[6px] text-slate-500 tracking-wider uppercase mt-1">Instructor Signature</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[8px] text-orange-500 font-bold">JRCC-2026-SAMPLE</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-slate-50/70 border-b border-slate-100 relative z-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="space-y-6 text-left"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={slideInLeft}
          >
            <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-600 font-bold border border-orange-200/50 py-1.5 px-3 rounded-full text-xs">
              Who We Are
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Empowering the Next Generation of <span className="text-orange-500">Tech Innovators</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              JRCODECRAFTERZ is an edtech platform that empowers learners to master coding. We turn beginners into code crafters—skilled, innovative, and future-ready.
            </p>
            <p className="text-slate-600 text-base leading-relaxed">
              Whether it's Basics of Computer, Python, JavaScript, or AI fundamentals, our courses are designed to make complex concepts simple, fun, and impactful. We bridge the gap between school curriculum and modern tech demand.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-slate-700 text-sm">All Ages Welcomed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-slate-700 text-sm">Flexible Class Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-slate-700 text-sm">Certified Instructors</span>
              </div>
            </div>
          </motion.div>

          {/* Floating graphic card mockup */}
          <motion.div 
            className="relative flex justify-center items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={slideInRight}
          >
            <div className="absolute w-[80%] h-[80%] bg-orange-100 rounded-full blur-3xl opacity-70 z-0" />
            
            <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-orange-100 animate-float-slow">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50 text-[10px] font-bold">
                  python_challenge.py
                </Badge>
              </div>

              {/* Fake Code Block */}
              <div className="font-mono text-xs bg-slate-900 text-slate-200 p-4 rounded-xl space-y-2 text-left mb-6 shadow-inner">
                <p className="text-indigo-400"># Empowering future code crafters</p>
                <p><span className="text-pink-400">def</span> <span className="text-emerald-400">craft_skills</span>(student):</p>
                <p className="pl-4">skills = [<span className="text-orange-400">&quot;Logic&quot;</span>, <span className="text-orange-400">&quot;AI&quot;</span>, <span className="text-orange-400">&quot;Creative Coding&quot;</span>]</p>
                <p className="pl-4">mentorship = <span className="text-teal-400">True</span></p>
                <p className="pl-4 text-pink-400">return [student.name, skills, mentorship]</p>
                <p className="text-slate-500"># Output: Ready to build games!</p>
              </div>

              <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">Premium Portfolio Certificate</p>
                  <p className="text-xs text-slate-500">Awarded to all module graduates</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing/Plans Section */}
      <section id="pricing" className="py-24 px-6 relative z-10 max-w-6xl mx-auto text-center">
        <motion.div 
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-600 font-bold border border-orange-200/50 py-1.5 px-3 rounded-full text-xs mb-4">
            Invest in the Future
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Choose Your Plan
          </h2>
          <p className="text-slate-655 max-w-lg mx-auto font-semibold">
            Flexible packages suited for individual progress or group collaboration classes.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {pricingPlansData.map((plan: any, idx: number) => (
            <motion.div 
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              className={`bg-white p-8 rounded-3xl border shadow-sm flex flex-col justify-between text-left relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                plan.isFeatured ? "border-2 border-orange-500 shadow-orange-500/10 scale-102" : "border-slate-200"
              }`}
            >
              {plan.isFeatured && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                  Most Popular
                </div>
              )}
              <div>
                <Badge className={`font-bold text-[10px] mb-6 uppercase tracking-wider ${
                  plan.isFeatured ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  {plan.title}
                </Badge>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">₹{plan.price}</span>
                  <span className="text-slate-500 text-sm font-semibold">{plan.billing || " / session"}</span>
                </div>
                <p className="text-slate-600 text-sm font-semibold mb-6 leading-relaxed">{plan.desc}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature: string, fIdx: number) => (
                    <li key={fIdx} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                      <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 mt-auto">
                <button 
                  onClick={() => {
                    setSelectedPlan(plan.title);
                    handleScrollToSection("contact");
                  }}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer text-center block ${
                    plan.isFeatured 
                      ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20" 
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  Enroll Now
                </button>
                <button
                  onClick={() => {
                    setSelectedPlan(plan.title);
                    handleScrollToSection("contact");
                  }}
                  className={`w-full py-3 rounded-2xl font-bold text-xs border transition-all cursor-pointer text-center block ${
                    plan.isFeatured 
                      ? "bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200" 
                      : "bg-white border-slate-200 hover:border-orange-500 text-slate-700 hover:text-orange-600"
                  }`}
                >
                  Book Demo
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="py-24 px-6 bg-slate-50/70 border-y border-slate-100 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-600 font-bold border border-orange-200/50 py-1.5 px-3 rounded-full text-xs mb-4">
              Our Core Strengths
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Why Choose JRCODECRAFTERZ?
            </h2>
            <p className="text-slate-655 max-w-lg mx-auto font-semibold mt-2">
              We focus on premium, interactive education delivery that matches global tech education standards.
            </p>
          </motion.div>

          {/* Timeline grid layout */}
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {whyChooseUsData.map((w: any, idx: number) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -10px rgba(0,0,0,0.08)" }}
                className="bg-white p-8 rounded-3xl border border-slate-150 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-orange-50 text-orange-500 border border-orange-100">
                    {idx + 1}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-500 transition-colors">
                    {w.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                  {w.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 relative z-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-600 font-bold border border-orange-200/50 py-1.5 px-3 rounded-full text-xs mb-4">
            Testimonials
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Loved by Parents & Students
          </h2>
          <p className="text-slate-655 font-semibold max-w-md mx-auto mb-16 mt-2">
            Real feedback from parent reviews and active young code crafters on the platform.
          </p>
        </motion.div>

        {/* Testimonials sliding */}
        <div className="max-w-3xl mx-auto relative px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-orange-50/50 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-orange-100/70 shadow-lg text-left relative"
            >
              <div className="absolute top-6 right-8 text-orange-500/10 pointer-events-none">
                <svg className="w-20 h-20 fill-current" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              <p className="text-slate-700 text-lg md:text-xl font-medium leading-relaxed mb-8">
                &ldquo;{testimonials[activeTestimonial].text}&rdquo;
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold shadow-md">
                  {testimonials[activeTestimonial].avatar}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{testimonials[activeTestimonial].name}</h4>
                  <p className="text-xs font-semibold text-slate-500">{testimonials[activeTestimonial].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="w-11 h-11 rounded-full border border-slate-200 bg-white hover:border-orange-500 hover:text-orange-500 flex items-center justify-center text-slate-650 transition-all shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="w-11 h-11 rounded-full border border-slate-200 bg-white hover:border-orange-500 hover:text-orange-500 flex items-center justify-center text-slate-655 transition-all shadow-sm cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-slate-50/70 border-t border-slate-100 relative z-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-stretch text-left">
          
          {/* Left Side: Support details */}
          <motion.div 
            className="flex flex-col justify-between text-left space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInLeft}
          >
            <div>
              <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-600 font-bold border border-orange-200/50 py-1.5 px-3 rounded-full text-xs mb-4">
                Get In Touch
              </Badge>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                Ready to Start Your Coding Journey?
              </h2>
              <p className="text-slate-600 text-base leading-relaxed font-semibold">
                Book your free 1:1 trial session now. Simply fill out the quick contact form, and our training advisor will reach out to you within 24 hours to schedule the session.
              </p>
            </div>

            {/* Support cards */}
            <div className="space-y-4">
              <a href={`mailto:${contactEmail}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/70 hover:border-orange-400 transition-colors shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Us</p>
                  <p className="text-sm font-semibold text-slate-800">{contactEmail}</p>
                </div>
              </a>

              <a href={`tel:${contactPhone}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/70 hover:border-orange-400 transition-colors shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Call Us</p>
                  <p className="text-sm font-semibold text-slate-800">{contactPhone}</p>
                </div>
              </a>

              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/70 hover:border-green-500 transition-colors shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">WhatsApp Support</p>
                  <p className="text-sm font-semibold text-slate-850">Direct Chat Support Link</p>
                </div>
              </a>
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Follow our Community</p>
              <div className="flex flex-wrap gap-3">
                {facebookUrl && (
                  <a 
                    href={facebookUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200/70 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-sm text-xs font-semibold text-slate-650"
                  >
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <span>Facebook</span>
                  </a>
                )}
                {instagramUrl && (
                  <a 
                    href={instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200/70 hover:border-pink-500 hover:text-pink-600 transition-colors shadow-sm text-xs font-semibold text-slate-650"
                  >
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span>Instagram</span>
                  </a>
                )}
                {youtubeUrl && (
                  <a 
                    href={youtubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200/70 hover:border-red-500 hover:text-red-650 transition-colors shadow-sm text-xs font-semibold text-slate-650"
                  >
                    <Youtube className="w-4 h-4 text-red-650" />
                    <span>YouTube</span>
                  </a>
                )}
              </div>
            </div>

            <div className="text-slate-500 text-xs font-semibold">
              Or simply fill out the contact form below, and our team will get back to you as soon as possible.
            </div>
          </motion.div>

          {/* Right Side: Form connecting to Google Form */}
          <motion.div 
            className="bg-white p-8 rounded-3xl border border-orange-100 shadow-xl relative flex flex-col justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideInRight}
          >
            <div className="absolute top-4 right-4 text-orange-500/20">
              <Code className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">Book Your Free Live Demo</h3>
            <p className="text-slate-500 text-xs font-semibold mb-6">Confirm details to claim a free 1-on-1 private coding consultation.</p>

            {!formSubmitted ? (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-655 uppercase mb-1.5">Student Name</label>
                  <input
                    type="text"
                    placeholder="Enter student's full name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-medium transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-655 uppercase mb-1.5">Parent Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter contact number"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-medium transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-655 uppercase mb-1.5">Grade Level</label>
                    <select
                      value={studentGrade}
                      onChange={(e) => setStudentGrade(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-medium bg-white transition-colors"
                    >
                      <option>Grade 1 - 3</option>
                      <option>Grade 4 - 6</option>
                      <option>Grade 7 - 9</option>
                      <option>Grade 10 - 12</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-655 uppercase mb-1.5">Preferred Setup</label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-medium bg-white transition-colors"
                    >
                      <option>Personal 1 to 1</option>
                      <option>Mini Group Session</option>
                      <option>Micro Group Session</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-655 uppercase mb-1.5">Course / Specialization</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-medium bg-white transition-colors"
                  >
                    <option>Regular Coding (Classes 1-12)</option>
                    <option>Computer Basics</option>
                    <option>MS Office</option>
                    <option>AI Tools</option>
                    <option>Math Basics</option>
                    <option>Projects</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center"
                  >
                    Request Free Demo Session
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 space-y-6 animate-fade-in text-slate-800">
                <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center bg-green-50 border border-green-200 text-green-500">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Demo Request Submitted!</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
                    Hi <strong>{studentName}</strong>, your request has been registered. Click the button below to connect with us on WhatsApp to schedule your free demo slot.
                  </p>
                </div>
                <div className="space-y-3 pt-2">
                  <a
                    href={`https://wa.me/919347008039?text=${encodeURIComponent(
                      `Hello JRCODECRAFTERZ! I've just requested a free coding demo session. Here are my details:\n\n` +
                      `- *Student Name*: ${studentName}\n` +
                      `- *Parent Phone*: ${parentPhone}\n` +
                      `- *Grade Level*: ${studentGrade}\n` +
                      `- *Preferred Setup*: ${selectedPlan}\n` +
                      `- *Course Selected*: ${selectedCourse}\n\n` +
                      `Please let me know the available time slots for our demo class!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-white" />
                    <span>Connect on WhatsApp</span>
                  </a>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setStudentName("");
                      setParentPhone("");
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                  >
                    Submit another request
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col items-center">
              <span className="text-[11px] text-slate-500 font-semibold mb-2">Prefer registering directly via Google Forms?</span>
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSdNMukdxlM8ODQMOHJO0-H-4SyzvQQFzwA83vjmZpzu1qQ0Sw/viewform?usp=sharing&ouid=112466381519385676445"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-500 hover:underline font-bold flex items-center gap-1"
              >
                Open Google Form Directory <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-orange-100 bg-white py-12 relative z-10 text-left">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/assets/Favicon.png" alt="JRCODECRAFTERZ Logo" className="w-6 h-6 object-contain" />
              <span className="font-bold text-slate-900 tracking-tight">
                JR<span className="text-orange-500">CODE</span>CRAFTERZ
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {footerText}
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Quick Navigation</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><button onClick={() => handleScrollToSection("about")} className="hover:text-orange-500 transition-colors cursor-pointer">About Us</button></li>
              <li><button onClick={() => handleScrollToSection("highlights")} className="hover:text-orange-500 transition-colors cursor-pointer">Program Features</button></li>
              <li><button onClick={() => handleScrollToSection("pricing")} className="hover:text-orange-500 transition-colors cursor-pointer">Pricing Packages</button></li>
              <li><button onClick={() => handleScrollToSection("curriculum")} className="hover:text-orange-500 transition-colors cursor-pointer">Curriculum Roadmap</button></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Explore Catalog</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><Link href="/courses" className="hover:text-orange-500 transition-colors">Python Coding</Link></li>
              <li><Link href="/courses" className="hover:text-orange-500 transition-colors">JavaScript Dev</Link></li>
              <li><Link href="/courses" className="hover:text-orange-500 transition-colors">AI Fundamentals</Link></li>
              <li><Link href="/courses" className="hover:text-orange-500 transition-colors">Computer Basics</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Connect</h4>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              📞 Phone: {contactPhone}<br />
              📩 Email: {contactEmail}<br />
              🌐 Website: {contactWebsite}
            </p>
            <div className="flex gap-3 pt-2">
              <a href={`https://${contactWebsite}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-slate-650 hover:text-orange-500 cursor-pointer transition-colors" title="Website">
                <Globe className="w-4 h-4" />
              </a>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-slate-650 hover:text-orange-500 cursor-pointer transition-colors" title="WhatsApp">
                <MessageSquare className="w-4 h-4" />
              </a>
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-slate-650 hover:text-orange-500 cursor-pointer transition-colors" title="Facebook">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-slate-650 hover:text-orange-500 cursor-pointer transition-colors" title="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-slate-650 hover:text-orange-500 cursor-pointer transition-colors" title="YouTube">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6 border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-semibold">
          <p>© 2026 JRCODECRAFTERZ. All rights reserved. Created for future creators.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-orange-500">Privacy Policy</a>
            <a href="#" className="hover:text-orange-500">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
