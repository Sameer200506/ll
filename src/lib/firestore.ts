import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function createUserDoc(
  uid: string,
  data: { name: string; email: string; role: string }
) {
  await setDoc(doc(db, "users", uid), {
    name: data.name,
    email: data.email,
    role: data.role,
  });
}

export async function getUserDoc(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as any;
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── COURSES ──────────────────────────────────────────────────────────────────

export async function createCourse(data: any) {
  const ref = await addDoc(collection(db, "courses"), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id };
}

export async function updateCourse(courseId: string, data: any) {
  await updateDoc(doc(db, "courses", courseId), data);
}

export async function getCourse(courseId: string) {
  const snap = await getDoc(doc(db, "courses", courseId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as any;
}

export async function getAllCourses() {
  const snap = await getDocs(collection(db, "courses"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
}

export async function getCoursesByTeacher(teacherId: string) {
  const q = query(collection(db, "courses"), where("teacherId", "==", teacherId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── LESSONS ──────────────────────────────────────────────────────────────────

export async function addLesson(data: any) {
  const ref = await addDoc(collection(db, "lessons"), data);
  return { id: ref.id };
}

export async function getLessonsByCourse(courseId: string) {
  const q = query(
    collection(db, "lessons"),
    where("courseId", "==", courseId)
  );
  const snap = await getDocs(q);
  const lessons = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
  return lessons.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function updateLesson(lessonId: string, data: any) {
  await updateDoc(doc(db, "lessons", lessonId), data);
}

export async function deleteLesson(lessonId: string) {
  await deleteDoc(doc(db, "lessons", lessonId));
}

// ─── RESOURCES ────────────────────────────────────────────────────────────────

export async function addResource(data: any) {
  const ref = await addDoc(collection(db, "resources"), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id };
}

export async function getResourcesByCourse(courseId: string) {
  const q = query(collection(db, "resources"), where("courseId", "==", courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
}

export async function deleteResource(resourceId: string) {
  await deleteDoc(doc(db, "resources", resourceId));
}

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────

export async function enrollUser(
  userId: string,
  courseId: string,
  status: string = "approved",
  transactionId?: string
) {
  const id = `${userId}_${courseId}`;
  await setDoc(doc(db, "enrollments", id), {
    userId,
    courseId,
    purchasedAt: new Date().toISOString(),
    status,
    transactionId: transactionId || null,
  });
}

export async function getEnrollmentsByUser(userId: string) {
  const q = query(collection(db, "enrollments"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Returns only approved enrollments for a student */
export async function getApprovedEnrollmentsByUser(userId: string) {
  const q = query(
    collection(db, "enrollments"),
    where("userId", "==", userId),
    where("status", "==", "approved")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getEnrollmentsByCourse(courseId: string) {
  const q = query(collection(db, "enrollments"), where("courseId", "==", courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function isEnrolled(userId: string, courseId: string) {
  const snap = await getDoc(doc(db, "enrollments", `${userId}_${courseId}`));
  if (!snap.exists()) return false;
  const data = snap.data();
  if (data && data.status === "pending") return false;
  return true;
}

export async function approveEnrollment(userId: string, courseId: string) {
  const id = `${userId}_${courseId}`;
  await updateDoc(doc(db, "enrollments", id), {
    status: "approved",
    approvedAt: new Date().toISOString(),
  });
}

export async function declineEnrollment(userId: string, courseId: string) {
  const id = `${userId}_${courseId}`;
  await deleteDoc(doc(db, "enrollments", id));
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────

export async function markLessonComplete(
  userId: string,
  courseId: string,
  lessonId: string
) {
  const id = `${userId}_${courseId}`;
  const ref = doc(db, "progress", id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { completedLessons: arrayUnion(lessonId) });
  } else {
    await setDoc(ref, { userId, courseId, completedLessons: [lessonId] });
  }
}

export async function getProgress(userId: string, courseId: string) {
  const snap = await getDoc(doc(db, "progress", `${userId}_${courseId}`));
  if (!snap.exists()) return [];
  return (snap.data().completedLessons as string[]) || [];
}

// ─── SCHEDULES (LIVE CLASSES) ──────────────────────────────────────────────────

export async function createSchedule(data: any) {
  const ref = await addDoc(collection(db, "schedules"), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id };
}

export async function updateSchedule(scheduleId: string, data: any) {
  await updateDoc(doc(db, "schedules", scheduleId), data);
}

export async function getAllSchedules() {
  const snap = await getDocs(collection(db, "schedules"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getSchedulesByTeacher(teacherId: string) {
  const q = query(collection(db, "schedules"), where("teacherId", "==", teacherId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteSchedule(scheduleId: string) {
  await deleteDoc(doc(db, "schedules", scheduleId));
}

// ─── QUIZZES ──────────────────────────────────────────────────────────────────

export async function createQuiz(data: any) {
  const ref = await addDoc(collection(db, "quizzes"), data);
  return { id: ref.id };
}

export async function updateQuiz(quizId: string, data: any) {
  await updateDoc(doc(db, "quizzes", quizId), data);
}

export async function deleteQuiz(quizId: string) {
  await deleteDoc(doc(db, "quizzes", quizId));
}

export async function getQuizzesByCourse(courseId: string) {
  const q = query(collection(db, "quizzes"), where("courseId", "==", courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllQuizzes() {
  const snap = await getDocs(collection(db, "quizzes"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── QUIZ RESULTS ─────────────────────────────────────────────────────────────

export async function saveQuizResult(data: any) {
  const ref = await addDoc(collection(db, "quizResults"), {
    ...data,
    submittedAt: new Date().toISOString(),
  });
  return { id: ref.id };
}

export async function getQuizResultsByUser(userId: string) {
  const q = query(collection(db, "quizResults"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getQuizResultsByCourse(courseId: string) {
  const q = query(collection(db, "quizResults"), where("courseId", "==", courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export async function assignProject(data: any) {
  const ref = await addDoc(collection(db, "projects"), {
    ...data,
    status: "assigned",
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id };
}

export async function getProjectsByCourse(courseId: string) {
  const q = query(collection(db, "projects"), where("courseId", "==", courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProjectsByStudent(studentId: string, courseId: string) {
  const q = query(collection(db, "projects"), where("studentId", "==", studentId), where("courseId", "==", courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllProjectsByStudent(studentId: string) {
  const q = query(collection(db, "projects"), where("studentId", "==", studentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function submitProject(projectId: string, submissionLink: string) {
  await updateDoc(doc(db, "projects", projectId), {
    status: "submitted",
    submissionLink,
    submittedAt: new Date().toISOString(),
  });
}

export async function gradeProject(projectId: string, data: { grade: number; feedback: string }) {
  await updateDoc(doc(db, "projects", projectId), {
    status: "graded",
    grade: data.grade,
    feedback: data.feedback,
    gradedAt: new Date().toISOString(),
  });
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export async function getAllEnrollments() {
  const snap = await getDocs(collection(db, "enrollments"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllProjects() {
  const snap = await getDocs(collection(db, "projects"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllQuizResults() {
  const snap = await getDocs(collection(db, "quizResults"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteUser(uid: string) {
  await deleteDoc(doc(db, "users", uid));
}

export async function deleteCourse(courseId: string) {
  await deleteDoc(doc(db, "courses", courseId));
}

// ─── LEADS / MESSAGES ─────────────────────────────────────────────────────────

export async function createLead(data: any) {
  const ref = await addDoc(collection(db, "leads"), {
    ...data,
    status: "unread",
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id };
}

export async function getAllLeads() {
  const snap = await getDocs(collection(db, "leads"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteLead(leadId: string) {
  await deleteDoc(doc(db, "leads", leadId));
}

export async function markLeadRead(leadId: string, read: boolean) {
  await updateDoc(doc(db, "leads", leadId), { status: read ? "read" : "unread" });
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export async function recordAttendance(data: any) {
  const ref = await addDoc(collection(db, "attendance"), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id };
}

export async function getAttendanceByCourse(courseId: string) {
  const q = query(collection(db, "attendance"), where("courseId", "==", courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── ASSIGNMENTS ──────────────────────────────────────────────────────────────

export async function createAssignment(data: any) {
  const ref = await addDoc(collection(db, "assignments"), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id };
}

export async function getAssignmentsByCourse(courseId: string) {
  const q = query(collection(db, "assignments"), where("courseId", "==", courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function createNotification(data: any) {
  const ref = await addDoc(collection(db, "notifications"), {
    ...data,
    read: false,
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id };
}

export async function getNotificationsByUser(userId: string) {
  const q = query(collection(db, "notifications"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
}

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────

export async function createCertificate(data: {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  courseDuration?: string;
  completionDate: string;
  issuedBy?: string;
}) {
  const settings = await getSiteSettings();
  const prefix = settings?.certPrefix || "JRCC";
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const cleanPrefix = prefix.endsWith("-") ? prefix : `${prefix}-`;
  const certNumber = `${cleanPrefix}${year}-${rand}`;

  const ref = await addDoc(collection(db, "certificates"), {
    ...data,
    certNumber,
    issuedBy: data.issuedBy || settings?.certSignature || "JR Code Crafterz",
    issuedAt: new Date().toISOString(),
  });
  return { id: ref.id, certNumber };
}

export async function getCertificatesByStudent(studentId: string) {
  const q = query(collection(db, "certificates"), where("studentId", "==", studentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
}

export async function getCertificate(certId: string) {
  const snap = await getDoc(doc(db, "certificates", certId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as any;
}

export async function getAllCertificates() {
  const snap = await getDocs(collection(db, "certificates"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
}

export async function deleteCertificate(certId: string) {
  await deleteDoc(doc(db, "certificates", certId));
}

// ─── SITE SETTINGS ────────────────────────────────────────────────────────────

export async function getSiteSettings() {
  const snap = await getDoc(doc(db, "settings", "site"));
  if (!snap.exists()) return null;
  return snap.data() as any;
}

export async function updateSiteSettings(data: any) {
  await setDoc(doc(db, "settings", "site"), data, { merge: true });
}
