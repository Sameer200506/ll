import { mockDb, MockUser, MockCourse, MockLesson, MockEnrollment, MockProgress, MockSchedule, MockQuiz, MockQuizResult } from "./mockDB";

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- USERS ---
export async function createUserDoc(uid: string, data: { name: string; email: string; role: string; password?: string }) {
  mockDb.saveUser({ id: uid, name: data.name, email: data.email, role: data.role as any, password: data.password || "" });
}

export async function getUserDoc(uid: string) {
  return mockDb.findUserById(uid) || null;
}

export async function getAllUsers() {
  return mockDb.getUsers();
}

// --- COURSES ---
export async function createCourse(data: any) {
  const id = generateId();
  mockDb.saveCourse({ ...data, id, createdAt: new Date().toISOString() });
  return { id };
}

export async function updateCourse(courseId: string, data: any) {
  const c = mockDb.getCourses().find(x => x.id === courseId);
  if (c) mockDb.saveCourse({ ...c, ...data });
}

export async function getCourse(courseId: string) {
  return mockDb.getCourses().find(x => x.id === courseId) || null;
}

export async function getAllCourses() {
  return mockDb.getCourses();
}

export async function getCoursesByTeacher(teacherId: string) {
  return mockDb.getCourses().filter(x => x.teacherId === teacherId);
}

// --- LESSONS ---
export async function addLesson(data: any) {
  const id = generateId();
  mockDb.saveLesson({ ...data, id });
  return { id };
}

export async function getLessonsByCourse(courseId: string) {
  return mockDb.getLessons().filter(x => x.courseId === courseId).sort((a, b) => a.order - b.order);
}

export async function deleteLesson(lessonId: string) {
  mockDb.deleteLesson(lessonId);
}

// --- ENROLLMENTS ---
export async function enrollUser(userId: string, courseId: string) {
  const id = `${userId}_${courseId}`;
  mockDb.saveEnrollment({ id, userId, courseId, purchasedAt: new Date().toISOString() });
}

export async function getEnrollmentsByUser(userId: string) {
  return mockDb.getEnrollments().filter(x => x.userId === userId);
}

export async function getEnrollmentsByCourse(courseId: string) {
  return mockDb.getEnrollments().filter(x => x.courseId === courseId);
}

export async function isEnrolled(userId: string, courseId: string) {
  return mockDb.getEnrollments().some(x => x.userId === userId && x.courseId === courseId);
}

// --- PROGRESS ---
export async function markLessonComplete(userId: string, courseId: string, lessonId: string) {
  const id = `${userId}_${courseId}`;
  const p = mockDb.getProgress().find(x => x.id === id);
  if (p) {
    if (!p.completedLessons.includes(lessonId)) {
      p.completedLessons.push(lessonId);
      mockDb.saveProgress(p);
    }
  } else {
    mockDb.saveProgress({ id, userId, courseId, completedLessons: [lessonId] });
  }
}

export async function getProgress(userId: string, courseId: string) {
  const p = mockDb.getProgress().find(x => x.id === `${userId}_${courseId}`);
  return p ? p.completedLessons : [];
}

// --- SCHEDULES ---
export async function createSchedule(data: any) {
  const id = generateId();
  mockDb.saveSchedule({ ...data, id });
  return { id };
}

export async function getAllSchedules() {
  return mockDb.getSchedules();
}

export async function getSchedulesByTeacher(teacherId: string) {
  return mockDb.getSchedules().filter(x => x.teacherId === teacherId);
}

export async function deleteSchedule(scheduleId: string) {
  mockDb.deleteSchedule(scheduleId);
}

// --- QUIZZES ---
export async function createQuiz(data: any) {
  const id = generateId();
  mockDb.saveQuiz({ ...data, id });
  return { id };
}

export async function getQuizzesByCourse(courseId: string) {
  return mockDb.getQuizzes().filter(x => x.courseId === courseId);
}

export async function getAllQuizzes() {
  return mockDb.getQuizzes();
}

// --- QUIZ RESULTS ---
export async function saveQuizResult(data: any) {
  const id = generateId();
  mockDb.saveQuizResult({ ...data, id, submittedAt: new Date().toISOString() });
  return { id };
}

export async function getQuizResultsByUser(userId: string) {
  return mockDb.getQuizResults().filter(x => x.userId === userId);
}

export async function getQuizResultsByCourse(courseId: string) {
  return mockDb.getQuizResults().filter(x => x.courseId === courseId);
}
