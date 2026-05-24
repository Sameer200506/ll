"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAllCourses, enrollUser, getEnrollmentsByUser } from "@/lib/firestore";
import { ShoppingBag, PlayCircle, Star, Check, X, CreditCard, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function BrowsePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // UPI payment states
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchCoursesAndEnrollments = async () => {
    if (!user) return;
    try {
      const [all, enr] = await Promise.all([getAllCourses(), getEnrollmentsByUser(user.id)]);
      setCourses(all);
      setEnrolledIds(new Set(enr.filter((e: any) => e.status !== "pending").map((e: any) => e.courseId)));
      setPendingIds(new Set(enr.filter((e: any) => e.status === "pending").map((e: any) => e.courseId)));
    } catch {
      toast.error("Failed to load catalog data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndEnrollments();
  }, [user]);

  const handleBuyClick = async (course: any) => {
    if (!user) return;

    // For free courses, enroll instantly
    if (course.price === 0) {
      setBuyingId(course.id);
      try {
        await enrollUser(user.id, course.id, "approved");
        setEnrolledIds((prev) => new Set([...prev, course.id]));
        toast.success(`Enrolled in "${course.title}" 🎉`);
      } catch {
        toast.error("Enrollment failed. Please try again.");
      } finally {
        setBuyingId(null);
      }
      return;
    }

    // For paid courses, prompt UPI modal
    setSelectedCourse(course);
    setTransactionId("");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCourse) return;

    const trimmedTxn = transactionId.trim();
    if (!trimmedTxn) {
      toast.error("Please enter your Transaction ID");
      return;
    }

    if (trimmedTxn.length < 8) {
      toast.error("Transaction ID is too short. Please check and try again.");
      return;
    }

    setSubmittingPayment(true);
    try {
      await enrollUser(user.id, selectedCourse.id, "pending", trimmedTxn);
      setPendingIds((prev) => new Set([...prev, selectedCourse.id]));
      toast.success("Payment details submitted successfully! Awaiting admin approval. 🕒");
      setSelectedCourse(null);
    } catch {
      toast.error("Failed to submit transaction details. Please try again.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <DashboardLayout title="Browse Courses" description="Find and purchase courses to start learning.">
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-20">
            <ShoppingBag className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
            <h3 className="text-lg font-semibold mb-2">No courses available yet</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Check back soon — teachers are creating courses.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course: any) => {
            const enrolled = enrolledIds.has(course.id);
            const pending = pendingIds.has(course.id);
            return (
              <Card key={course.id} className="card-hover flex flex-col">
                <div className="h-44 rounded-t-2xl overflow-hidden flex items-center justify-center relative"
                  style={{ background: "linear-gradient(135deg, #1a1e2a, #6c63ff22)" }}>
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
                    {enrolled ? (
                      <Badge variant="success" className="gap-1"><Check className="w-3 h-3" /> Enrolled</Badge>
                    ) : pending ? (
                      <Badge className="bg-slate-100 text-slate-500 border border-slate-200/50 gap-1 font-semibold text-xs py-1 px-2.5">
                        <Clock className="w-3 h-3 text-slate-400" /> Awaiting Approval
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleBuyClick(course)}
                        disabled={buyingId === course.id}
                        className="gap-1"
                      >
                        {buyingId === course.id ? "Enrolling..." : <><ShoppingBag className="w-3.5 h-3.5" /> Buy Now</>}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-955/70 backdrop-blur-sm bg-black/60"
              onClick={() => setSelectedCourse(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-800"
            >
              <button
                onClick={() => setSelectedCourse(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-left mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600 mb-3 border border-orange-200/50">
                  <CreditCard className="w-3.5 h-3.5" /> UPI Payment Gate
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Enroll in {selectedCourse.title}
                </h3>
                <p className="text-sm font-semibold text-slate-400 mt-0.5">
                  Scan and pay to unlock your lessons
                </p>

                <div className="my-5 p-4 rounded-2xl bg-orange-50/50 border border-orange-100/60 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500">Total Course Fee:</span>
                  <span className="text-2xl font-black text-orange-600">₹{selectedCourse.price}</span>
                </div>

                <div className="flex flex-col items-center justify-center p-5 border border-slate-100 rounded-3xl bg-slate-50/50 mb-5">
                  <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-orange-500/20 bg-white p-2 shadow-md relative">
                    <img
                      src="/assets/upi_qr.png"
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center mt-4 space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Beneficiary Name</p>
                    <p className="text-sm font-black text-slate-900">Mrs KANEEZE FATIMA</p>

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">UPI ID</p>
                    <p className="text-sm font-mono font-bold text-slate-700 bg-white border border-slate-100 rounded-lg px-2 py-0.5 select-all cursor-pointer hover:border-orange-500 transition-colors">
                      jrcodecrafterz14@centralbank
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
                      UPI Transaction ID / UTR / Reference No.
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter 12-digit transaction number"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm font-semibold tracking-wide text-slate-800"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-normal font-semibold">
                      Please pay ₹{selectedCourse.price} using GPay, PhonePe, Paytm, or BHIM. Enter the transaction reference ID shown on your payment confirmation screen to submit for approval.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={submittingPayment}
                      className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/10"
                    >
                      {submittingPayment ? "Submitting..." : "Submit Payment Ref"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 border-slate-200 text-slate-500 font-bold rounded-xl"
                      onClick={() => setSelectedCourse(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
