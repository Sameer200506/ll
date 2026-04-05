// Mock database using localStorage with seed data
// This runs when Firebase is not configured

export interface MockUser {
  id: string; name: string; email: string; role: "student" | "teacher"; password: string;
}
export interface MockCourse {
  id: string; title: string; description: string; thumbnailUrl: string;
  teacherId: string; teacherName: string; price: number; createdAt: string;
}
export interface MockLesson {
  id: string; courseId: string; title: string; youtubeUrl: string; order: number;
}
export interface MockEnrollment { id: string; userId: string; courseId: string; purchasedAt: string; }
export interface MockProgress { id: string; userId: string; courseId: string; completedLessons: string[]; }
export interface MockSchedule {
  id: string; courseId: string; courseName: string; teacherId: string;
  teacherName: string; datetime: string; meetLink: string;
}
export interface MockQuiz {
  id: string; courseId: string; lessonId: string | null; title: string;
  questions: { question: string; options: string[]; correct: number }[];
}
export interface MockQuizResult {
  id: string; userId: string; courseId: string; quizId: string;
  score: number; total: number; submittedAt: string;
}

const SEED_USERS: MockUser[] = [
  { id: "teacher1", name: "Alex Johnson", email: "teacher@demo.com", role: "teacher", password: "demo123" },
  { id: "student1", name: "Sarah Chen", email: "student@demo.com", role: "student", password: "demo123" },
];

const SEED_COURSES: MockCourse[] = [
  {
    id: "course1", title: "Complete Python Bootcamp 2026", teacherId: "teacher1", teacherName: "Alex Johnson",
    description: "Go from beginner to expert in Python programming with hands-on projects.",
    thumbnailUrl: "https://img.youtube.com/vi/rfscVS0vtbw/maxresdefault.jpg", price: 999, createdAt: new Date().toISOString()
  },
  {
    id: "course2", title: "React & Next.js Masterclass", teacherId: "teacher1", teacherName: "Alex Johnson",
    description: "Build modern full-stack web apps with React, Next.js and TypeScript.",
    thumbnailUrl: "https://img.youtube.com/vi/w7ejDZ8SWv8/maxresdefault.jpg", price: 1499, createdAt: new Date().toISOString()
  },
  {
    id: "course3", title: "Machine Learning Fundamentals", teacherId: "teacher1", teacherName: "Alex Johnson",
    description: "Master ML concepts, algorithms and real-world projects with Python.",
    thumbnailUrl: "https://img.youtube.com/vi/NWONeJKn6kc/maxresdefault.jpg", price: 0, createdAt: new Date().toISOString()
  },
];

const SEED_LESSONS: MockLesson[] = [
  { id: "l1", courseId: "course1", title: "Python Installation & Setup", youtubeUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw", order: 0 },
  { id: "l2", courseId: "course1", title: "Variables & Data Types", youtubeUrl: "https://www.youtube.com/watch?v=Z1Yd7upQsXY", order: 1 },
  { id: "l3", courseId: "course1", title: "Control Flow & Loops", youtubeUrl: "https://www.youtube.com/watch?v=6iF8Xb7Z3wQ", order: 2 },
  { id: "l4", courseId: "course1", title: "Functions & Modules", youtubeUrl: "https://www.youtube.com/watch?v=9Os0o3wzS_I", order: 3 },
  { id: "l5", courseId: "course2", title: "React Fundamentals", youtubeUrl: "https://www.youtube.com/watch?v=w7ejDZ8SWv8", order: 0 },
  { id: "l6", courseId: "course2", title: "Hooks Deep Dive", youtubeUrl: "https://www.youtube.com/watch?v=TNhaISOUy6Q", order: 1 },
  { id: "l7", courseId: "course2", title: "Next.js App Router", youtubeUrl: "https://www.youtube.com/watch?v=ZVnjOPwW4ZA", order: 2 },
  { id: "l8", courseId: "course3", title: "What is Machine Learning?", youtubeUrl: "https://www.youtube.com/watch?v=NWONeJKn6kc", order: 0 },
  { id: "l9", courseId: "course3", title: "Linear Regression", youtubeUrl: "https://www.youtube.com/watch?v=zM4VZR0px8E", order: 1 },
];

const SEED_ENROLLMENTS: MockEnrollment[] = [
  { id: "student1_course1", userId: "student1", courseId: "course1", purchasedAt: new Date().toISOString() },
  { id: "student1_course3", userId: "student1", courseId: "course3", purchasedAt: new Date().toISOString() },
];

const SEED_PROGRESS: MockProgress[] = [
  { id: "student1_course1", userId: "student1", courseId: "course1", completedLessons: ["l1", "l2"] },
];

const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

const SEED_SCHEDULES: MockSchedule[] = [
  {
    id: "sched1", courseId: "course1", courseName: "Complete Python Bootcamp 2026",
    teacherId: "teacher1", teacherName: "Alex Johnson",
    datetime: tomorrow.toISOString(), meetLink: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: "sched2", courseId: "course2", courseName: "React & Next.js Masterclass",
    teacherId: "teacher1", teacherName: "Alex Johnson",
    datetime: nextWeek.toISOString(), meetLink: "https://meet.google.com/xyz-uvwx-yz"
  },
  {
    id: "sched3", courseId: "course3", courseName: "Machine Learning Fundamentals",
    teacherId: "teacher1", teacherName: "Alex Johnson",
    datetime: yesterday.toISOString(), meetLink: "https://meet.google.com/lmn-opqr-st"
  },
];

const SEED_QUIZZES: MockQuiz[] = [
  {
    id: "quiz1", courseId: "course1", lessonId: "l2", title: "Python Basics Quiz",
    questions: [
      { question: "Which keyword is used to define a function in Python?", options: ["func", "def", "function", "define"], correct: 1 },
      { question: "What is the output of print(type(42))?", options: ["<class 'str'>", "<class 'float'>", "<class 'int'>", "<class 'num'>"], correct: 2 },
      { question: "Which of these is a mutable data type?", options: ["tuple", "string", "int", "list"], correct: 3 },
      { question: "How do you create a comment in Python?", options: ["// comment", "# comment", "/* comment */", "-- comment"], correct: 1 },
    ]
  },
  {
    id: "quiz2", courseId: "course3", lessonId: null, title: "ML Fundamentals Quiz",
    questions: [
      { question: "What does ML stand for?", options: ["Multi-Level", "Machine Learning", "Meta Language", "Model Layer"], correct: 1 },
      { question: "Which algorithm is used for classification?", options: ["Linear Regression", "K-Means", "Logistic Regression", "PCA"], correct: 2 },
      { question: "What is overfitting?", options: ["Model too simple", "Model fits training data too well", "Too much data", "Too few features"], correct: 1 },
    ]
  }
];

// --- localStorage helpers ---
function getKey(key: string) {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`lms_${key}`);
  return raw ? JSON.parse(raw) : null;
}
function setKey(key: string, value: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`lms_${key}`, JSON.stringify(value));
}

function getOrInit<T>(key: string, seed: T[]): T[] {
  const existing = getKey(key);
  if (existing !== null) return existing;
  setKey(key, seed);
  return seed;
}

// --- Auth ---
export const mockDb = {
  getUsers: (): MockUser[] => getOrInit("users", SEED_USERS),
  saveUser: (user: MockUser) => {
    const users = mockDb.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user; else users.push(user);
    setKey("users", users);
  },
  findUserByEmail: (email: string): MockUser | undefined =>
    mockDb.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()),
  findUserById: (id: string): MockUser | undefined =>
    mockDb.getUsers().find(u => u.id === id),

  // Sessions
  setSession: (userId: string) => setKey("session", userId),
  getSession: (): string | null => getKey("session"),
  clearSession: () => { if (typeof window !== "undefined") localStorage.removeItem("lms_session"); },

  // Courses
  getCourses: (): MockCourse[] => getOrInit("courses", SEED_COURSES),
  saveCourse: (course: MockCourse) => {
    const courses = mockDb.getCourses();
    const idx = courses.findIndex(c => c.id === course.id);
    if (idx >= 0) courses[idx] = course; else courses.push(course);
    setKey("courses", courses);
  },

  // Lessons
  getLessons: (): MockLesson[] => getOrInit("lessons", SEED_LESSONS),
  saveLesson: (lesson: MockLesson) => {
    const lessons = mockDb.getLessons();
    lessons.push(lesson);
    setKey("lessons", lessons);
  },
  deleteLesson: (lessonId: string) => {
    setKey("lessons", mockDb.getLessons().filter(l => l.id !== lessonId));
  },

  // Enrollments
  getEnrollments: (): MockEnrollment[] => getOrInit("enrollments", SEED_ENROLLMENTS),
  saveEnrollment: (e: MockEnrollment) => {
    const enr = mockDb.getEnrollments();
    if (!enr.find(x => x.id === e.id)) { enr.push(e); setKey("enrollments", enr); }
  },

  // Progress
  getProgress: (): MockProgress[] => getOrInit("progress", SEED_PROGRESS),
  saveProgress: (p: MockProgress) => {
    const all = mockDb.getProgress();
    const idx = all.findIndex(x => x.id === p.id);
    if (idx >= 0) all[idx] = p; else all.push(p);
    setKey("progress", all);
  },

  // Schedules
  getSchedules: (): MockSchedule[] => getOrInit("schedules", SEED_SCHEDULES),
  saveSchedule: (s: MockSchedule) => {
    const all = mockDb.getSchedules();
    all.push(s);
    setKey("schedules", all);
  },
  deleteSchedule: (id: string) => {
    setKey("schedules", mockDb.getSchedules().filter(s => s.id !== id));
  },

  // Quizzes
  getQuizzes: (): MockQuiz[] => getOrInit("quizzes", SEED_QUIZZES),
  saveQuiz: (q: MockQuiz) => {
    const all = mockDb.getQuizzes();
    all.push(q);
    setKey("quizzes", all);
  },

  // Quiz Results
  getQuizResults: (): MockQuizResult[] => getOrInit("quizResults", []),
  saveQuizResult: (r: MockQuizResult) => {
    const all = mockDb.getQuizResults();
    all.push(r);
    setKey("quizResults", all);
  },
};
