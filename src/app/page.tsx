"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAllCourses, createLead } from "@/lib/firestore";
import { 
  BookOpen, Video, Calendar, Trophy, Zap, ArrowRight, Users, Star, PlayCircle, 
  Code, ShieldCheck, Mail, Phone, Globe, ChevronLeft, ChevronRight, MessageSquare, 
  Award, Flame, Sparkles, Check, CheckCircle2, ChevronDown, Monitor, Laptop, GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

const programHighlights = [
  {
    title: "Live 1:1 Classes",
    subtitle: "Grade 4 to Grade 12",
    desc: "Personalized lesson speed with private instruction tailored for individual student goals.",
    icon: Laptop,
    accent: "from-orange-500 to-amber-500",
    glow: "rgba(249,115,22,0.15)"
  },
  {
    title: "Live Group Sessions",
    subtitle: "Grade 4 to Grade 12",
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

const whyChooseUs = [
  {
    title: "Expert Mentors",
    desc: "Classes taught exclusively by vetted software developers and computer science educators who understand child education.",
    color: "bg-orange-100 text-orange-600 border-orange-200"
  },
  {
    title: "Live Interactive Learning",
    desc: "Ditch pre-recorded video logs. Our students code live alongside mentors who debug and explain bugs in real time.",
    color: "bg-blue-100 text-blue-600 border-blue-200"
  },
  {
    title: "Beginner-Friendly Curriculum",
    desc: "A custom path tailored to age, starting from visual block programming up to object-oriented python structures.",
    color: "bg-purple-100 text-purple-600 border-purple-200"
  },
  {
    title: "Real Projects Portfolio",
    desc: "Graduating students walk away with an active github portfolio showcasing real web apps, tools, and mini-games.",
    color: "bg-emerald-100 text-emerald-600 border-emerald-200"
  },
  {
    title: "Future-Ready Skills",
    desc: "Not just syntax. We teach logical thinking, algorithm design, prompt engineering, and deep computer basics.",
    color: "bg-pink-100 text-pink-600 border-pink-200"
  },
  {
    title: "Personalized Attention",
    desc: "Regular progress reports, structured code reviews, and customizable curriculum speed to match the student's learning curve.",
    color: "bg-amber-100 text-amber-600 border-amber-200"
  }
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Contact form state
  const [studentName, setStudentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [studentGrade, setStudentGrade] = useState("Grade 4 - 6");
  const [selectedPlan, setSelectedPlan] = useState("Basic Level");

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

  // Testimonial auto sliding
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

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
        email: "",
        message: `Book Trial Demo for ${studentGrade} - Preferred Plan: ${selectedPlan}`
      });
      toast.success("Demo request saved! Opening Google Form to schedule your live slot...");
      const googleFormUrl = `https://docs.google.com/forms/d/e/1FAIpQLSdNMukdxlM8ODQMOHJO0-H-4SyzvQQFzwA83vjmZpzu1qQ0Sw/viewform?usp=sharing&ouid=112466381519385676445`;
      window.open(googleFormUrl, "_blank");
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
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleScrollToSection("hero")}>
          <img src="/assets/mainlogo.png" alt="JRCODECRAFTERZ Logo" className="w-10 h-10 object-contain rounded-xl shadow-md border border-orange-100" />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              JR<span className="text-orange-500 font-extrabold animate-pulse">CODE</span>CRAFTERZ
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold leading-none">EdTech Academy</span>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <button onClick={() => handleScrollToSection("about")} className="hover:text-orange-500 transition-colors cursor-pointer">About</button>
          <button onClick={() => handleScrollToSection("highlights")} className="hover:text-orange-500 transition-colors cursor-pointer">Highlights</button>
          <button onClick={() => handleScrollToSection("pricing")} className="hover:text-orange-500 transition-colors cursor-pointer">Pricing Plans</button>
          <button onClick={() => handleScrollToSection("why-us")} className="hover:text-orange-500 transition-colors cursor-pointer">Why Choose Us</button>
          <button onClick={() => handleScrollToSection("testimonials")} className="hover:text-orange-500 transition-colors cursor-pointer">Reviews</button>
          <button onClick={() => handleScrollToSection("contact")} className="hover:text-orange-500 transition-colors cursor-pointer">Contact</button>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-slate-600 hover:text-orange-500 cursor-pointer">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20 gap-1.5 transition-all cursor-pointer">
              Book Demo <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
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
            Turning Young Minds Into Future-Ready Code Crafters
          </motion.div>

          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-slate-900 mb-6"
          >
            Learn Coding <span className="text-orange-500">Live</span><br />
            From Experts
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-slate-600 font-medium leading-relaxed"
          >
            Master Python, JavaScript, AI Fundamentals, and Computer Basics through fun, interactive live classes designed for Grades 4–12.
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
              onClick={() => handleScrollToSection("pricing")}
              className="px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-orange-500 text-slate-700 hover:text-orange-600 font-bold text-base shadow-sm transition-all cursor-pointer"
            >
              Explore Courses
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

          {/* Interactive Previews Section */}
          <motion.div 
            variants={fadeInUp}
            className="mt-20 max-w-5xl mx-auto"
          >
            <p className="text-sm uppercase tracking-widest text-orange-500 font-bold mb-4">Inside the Classroom</p>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">Watch Live Learning Previews</h3>
            
            {/* Main Featured Video */}
            <motion.div 
              whileHover={{ scale: 1.008 }}
              className="relative group max-w-4xl mx-auto rounded-3xl overflow-hidden border-4 border-slate-100 bg-slate-950 shadow-2xl transition-all duration-300 hover:border-orange-100 mb-8"
            >
              <div className="absolute top-4 left-4 z-20 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 animate-pulse" /> Live Coding Demo
              </div>
              <video 
                src="/assets/WhatsApp%20Video%202026-04-12%20at%2012.23.52%20AM%20(1).mp4" 
                autoPlay 
                muted 
                loop 
                playsInline 
                controls
                className="w-full max-h-[480px] object-cover"
              />
            </motion.div>
            
            {/* Dual Grid Previews */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <motion.div 
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-950 shadow-lg"
              >
                <div className="absolute top-3 left-3 z-20 bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Python Basics Lesson
                </div>
                <video 
                  src="/assets/WhatsApp%20Video%202026-04-12%20at%2012.23.53%20AM%20(1).mp4" 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover max-h-[240px] opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </motion.div>

              <motion.div 
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-950 shadow-lg"
              >
                <div className="absolute top-3 left-3 z-20 bg-purple-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  JavaScript Game Dev
                </div>
                <video 
                  src="/assets/WhatsApp%20Video%202026-04-12%20at%2012.23.53%20AM%20(2).mp4" 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  className="w-full h-full object-cover max-h-[240px] opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-slate-50/70 border-y border-slate-100 relative z-10">
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
              JRCODECRAFTERZ is an edtech platform that empowers young minds to master coding. We turn learners into code crafters—skilled, innovative, and future-ready.
            </p>
            <p className="text-slate-600 text-base leading-relaxed">
              Whether it's Basics of Computer, Python, JavaScript, or AI fundamentals, our courses are designed to make complex concepts simple, fun, and impactful. We bridge the gap between school curriculum and modern tech demand.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-slate-700 text-sm">Ages 8 - 18 Welcomed</span>
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
            {/* Background Blob decoration */}
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

              {/* Overlay Statistics snippet */}
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

      {/* Program Highlights Section */}
      <section id="highlights" className="py-24 px-6 relative z-10 max-w-7xl mx-auto text-center">
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
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Supercharged Learning Features
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto font-medium text-base">
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
                {/* Accent line on top of card */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-amber-500" />
                
                {/* Glow layer */}
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

      {/* Featured Courses (Dynamic courses loaded from Firestore) */}
      {courses.length > 0 && (
        <section className="py-20 px-6 bg-orange-50/40 border-y border-slate-100 relative z-10">
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
                    {/* Thumbnail / Header */}
                    <div className="h-48 rounded-t-2xl overflow-hidden flex items-center justify-center relative bg-orange-50 border-b border-orange-100">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <PlayCircle className="w-16 h-16 opacity-30 text-orange-500" />
                      )}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 text-xs shadow-md">
                          {course.price === 0 ? "Free Demo" : `₹${course.price}`}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <h3 className="font-bold text-lg text-slate-900 mb-1.5 line-clamp-2">{course.title}</h3>
                      <p className="text-sm mb-3 text-slate-500">by <span className="font-semibold text-slate-800">{course.teacherName}</span></p>
                      <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-1">{course.description}</p>
                      
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
          <p className="text-slate-600 max-w-lg mx-auto font-medium">
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
          {/* Plan 1 */}
          <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -6 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between text-left relative overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            <div>
              <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-600 font-bold border border-slate-200 text-[10px] mb-6 uppercase tracking-wider">
                Basic Level
              </Badge>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">₹2,330</span>
                <span className="text-slate-500 text-sm font-semibold"> / session</span>
              </div>
              <p className="text-slate-600 text-sm font-semibold mb-6">Designed for learners seeking maximum, dedicated 1:1 teacher support.</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>1:1 Personal Classes</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Weekly 2 Classes</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Custom Learning Speed</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Doubt-Solving Live Calendar</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3 mt-auto">
              <button 
                onClick={() => {
                  setSelectedPlan("Basic Level");
                  handleScrollToSection("contact");
                }}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer text-center block"
              >
                Enroll Now
              </button>
              <button
                onClick={() => {
                  setSelectedPlan("Basic Level");
                  handleScrollToSection("contact");
                }}
                className="w-full py-3 rounded-2xl bg-white border border-slate-200 hover:border-orange-500 text-slate-700 hover:text-orange-600 font-bold text-xs transition-all cursor-pointer text-center block"
              >
                Book Demo
              </button>
            </div>
          </motion.div>

          {/* Plan 2: Featured Plan */}
          <motion.div 
            variants={fadeInUp}
            whileHover={{ scale: 1.06, y: -4 }}
            className="bg-white p-8 rounded-3xl border-2 border-orange-500 shadow-xl shadow-orange-500/10 flex flex-col justify-between transform md:scale-105 text-left relative overflow-hidden transition-all duration-300"
          >
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
              Most Popular
            </div>
            <div>
              <Badge className="bg-orange-500 text-white font-bold text-[10px] mb-6 uppercase tracking-wider">
                Advanced Level
              </Badge>
              <div className="mb-6">
                <span className="text-4xl font-black text-slate-900">₹1,835</span>
                <span className="text-slate-500 text-sm font-semibold"> / session</span>
              </div>
              <p className="text-slate-600 text-sm font-semibold mb-6">Our most collaborative setup. Peer interactions keep learners driven and engaged.</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Group of 4 Students</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Weekly 2 Classes</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Team coding projects</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Doubt-solving channels</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Peer feedback & review</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3 mt-auto">
              <button 
                onClick={() => {
                  setSelectedPlan("Advanced Level");
                  handleScrollToSection("contact");
                }}
                className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-xl shadow-orange-500/20 transition-all cursor-pointer text-center block animate-pulse-glow"
              >
                Enroll Now
              </button>
              <button
                onClick={() => {
                  setSelectedPlan("Advanced Level");
                  handleScrollToSection("contact");
                }}
                className="w-full py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs border border-orange-200 transition-all cursor-pointer text-center block"
              >
                Book Demo
              </button>
            </div>
          </motion.div>

          {/* Plan 3 */}
          <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -6 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between text-left relative overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            <div>
              <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-600 font-bold border border-slate-200 text-[10px] mb-6 uppercase tracking-wider">
                Professional Level
              </Badge>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">₹950</span>
                <span className="text-slate-500 text-sm font-semibold"> / session</span>
              </div>
              <p className="text-slate-600 text-sm font-semibold mb-6">Affordable, high-energy sessions designed for peer group coding challenges.</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Group of 6 Students</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Weekly 2 Classes</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Group games & assignments</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-orange-500 stroke-[3px]" />
                  <span>Competitive leaderboards</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3 mt-auto">
              <button 
                onClick={() => {
                  setSelectedPlan("Professional Level");
                  handleScrollToSection("contact");
                }}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer text-center block"
              >
                Enroll Now
              </button>
              <button
                onClick={() => {
                  setSelectedPlan("Professional Level");
                  handleScrollToSection("contact");
                }}
                className="w-full py-3 rounded-2xl bg-white border border-slate-200 hover:border-orange-500 text-slate-700 hover:text-orange-600 font-bold text-xs transition-all cursor-pointer text-center block"
              >
                Book Demo
              </button>
            </div>
          </motion.div>
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
            <p className="text-slate-600 max-w-lg mx-auto font-medium">
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
            {whyChooseUs.map((w, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -10px rgba(0,0,0,0.08)" }}
                className="bg-white p-8 rounded-3xl border border-slate-150 shadow-sm relative overflow-hidden group hover:border-orange-250 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${w.color} border`}>
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
          <p className="text-slate-600 font-medium max-w-md mx-auto mb-16">
            Real feedback from parent reviews and active young code crafters on the platform.
          </p>
        </motion.div>

        {/* Carousel Container */}
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
              {/* Quote Mark background */}
              <div className="absolute top-6 right-8 text-orange-500/10 pointer-events-none">
                <svg className="w-20 h-20 fill-current" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              {/* Star Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-slate-700 text-lg md:text-xl font-medium leading-relaxed mb-8">
                &ldquo;{testimonials[activeTestimonial].text}&rdquo;
              </p>

              {/* User Bio */}
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

          {/* Nav arrows */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="w-11 h-11 rounded-full border border-slate-200 bg-white hover:border-orange-500 hover:text-orange-500 flex items-center justify-center text-slate-600 transition-all shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="w-11 h-11 rounded-full border border-slate-200 bg-white hover:border-orange-500 hover:text-orange-500 flex items-center justify-center text-slate-600 transition-all shadow-sm cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-slate-50/70 border-t border-slate-100 relative z-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-stretch">
          
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
              <p className="text-slate-600 text-base leading-relaxed font-medium">
                Book your free 1:1 trial session now. Simply fill out the quick contact form, and our training advisor will reach out to you within 24 hours to schedule the session.
              </p>
            </div>

            {/* Support cards */}
            <div className="space-y-4">
              <a href="mailto:jrcodecrafterz@gmail.com" className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/70 hover:border-orange-400 transition-colors shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Us</p>
                  <p className="text-sm font-semibold text-slate-800">jrcodecrafterz@gmail.com</p>
                </div>
              </a>

              <a href="tel:9347008039" className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/70 hover:border-orange-400 transition-colors shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Call Us</p>
                  <p className="text-sm font-semibold text-slate-800">9347008039</p>
                </div>
              </a>

              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Official Website</p>
                  <p className="text-sm font-semibold text-slate-800">www.jrcodecrafterz.com</p>
                </div>
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

            <h3 className="text-xl font-bold text-slate-900 mb-2 text-left">Book Your Free Live Demo</h3>
            <p className="text-slate-500 text-xs font-semibold mb-6 text-left">Confirm details to claim a free 1-on-1 private coding consultation.</p>

            <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Student Name</label>
                <input
                  type="text"
                  placeholder="Enter student's full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-medium transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Parent Phone Number</label>
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
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Grade Level</label>
                  <select
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-medium bg-white transition-colors"
                  >
                    <option>Grade 4 - 6</option>
                    <option>Grade 7 - 9</option>
                    <option>Grade 10 - 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Preferred Setup</label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-medium bg-white transition-colors"
                  >
                    <option>Basic (1:1)</option>
                    <option>Advanced (Group of 4)</option>
                    <option>Professional (Group of 6)</option>
                  </select>
                </div>
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
      <footer className="border-t border-orange-100 bg-white py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-8 text-left">
          
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/assets/Favicon.png" alt="JRCODECRAFTERZ Logo" className="w-6 h-6 object-contain" />
              <span className="font-bold text-slate-900 tracking-tight">
                JR<span className="text-orange-500">CODE</span>CRAFTERZ
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Turning young learners into certified future-ready creators, game developers, and tech innovators.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Quick Navigation</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><button onClick={() => handleScrollToSection("about")} className="hover:text-orange-500 transition-colors cursor-pointer">About Academy</button></li>
              <li><button onClick={() => handleScrollToSection("highlights")} className="hover:text-orange-500 transition-colors cursor-pointer">Program Features</button></li>
              <li><button onClick={() => handleScrollToSection("pricing")} className="hover:text-orange-500 transition-colors cursor-pointer">Pricing Packages</button></li>
              <li><button onClick={() => handleScrollToSection("why-us")} className="hover:text-orange-500 transition-colors cursor-pointer">Curriculum Info</button></li>
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
              📞 Phone: 9347008039<br />
              📩 Email: jrcodecrafterz@gmail.com
            </p>
            <div className="flex gap-3 pt-2">
              <span className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-slate-600 hover:text-orange-500 cursor-pointer transition-colors">
                <Globe className="w-4 h-4" />
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-slate-600 hover:text-orange-500 cursor-pointer transition-colors">
                <MessageSquare className="w-4 h-4" />
              </span>
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
