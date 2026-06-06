"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldOff, Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white selection:bg-orange-100">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[-5%] w-80 h-80 rounded-full bg-red-50/60 blur-3xl opacity-70" />
        <div className="absolute bottom-[20%] right-[-5%] w-80 h-80 rounded-full bg-orange-50/60 blur-3xl opacity-70" />
      </div>

      <motion.div
        className="relative z-10 max-w-md w-full text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Icon */}
        <motion.div
          className="w-24 h-24 rounded-3xl bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-6 shadow-lg"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ShieldOff className="w-12 h-12 text-red-500" />
        </motion.div>

        {/* Error code */}
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4 border border-red-200/60 bg-red-50 text-red-600 shadow-sm">
          403 — Access Denied
        </span>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          You Can't Be Here
        </h1>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          You don't have permission to access this page. This area is restricted to authorized users only.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 transition-all"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-200 hover:border-orange-500 text-slate-700 hover:text-orange-600 font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Brand footer */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <img src="/assets/mainlogo.png" alt="JRCODE CRAFTERZ" className="w-6 h-6 object-contain rounded" />
          <span className="text-sm font-bold text-slate-400">
            JR<span className="text-orange-500">CODE</span>CRAFTERZ
          </span>
        </div>
      </motion.div>
    </div>
  );
}
