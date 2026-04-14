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
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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

export async function deleteLesson(lessonId: string) {
  await deleteDoc(doc(db, "lessons", lessonId));
}

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────

export async function enrollUser(userId: string, courseId: string) {
  const id = `${userId}_${courseId}`;
  await setDoc(doc(db, "enrollments", id), {
    userId,
    courseId,
    purchasedAt: new Date().toISOString(),
  });
}

export async function getEnrollmentsByUser(userId: string) {
  const q = query(collection(db, "enrollments"), where("userId", "==", userId));
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
  return snap.exists();
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

// ─── SCHEDULES ────────────────────────────────────────────────────────────────

export async function createSchedule(data: any) {
  const ref = await addDoc(collection(db, "schedules"), data);
  return { id: ref.id };
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
