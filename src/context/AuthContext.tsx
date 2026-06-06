"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserDoc, getUserDoc } from "@/lib/firestore";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  register: (
    email: string,
    password: string,
    name: string,
    role: "student" | "teacher"
  ) => Promise<AppUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase handles session persistence automatically
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const docData = await getUserDoc(firebaseUser.uid);
        if (docData) {
          setUser({
            id: firebaseUser.uid,
            name: docData.name,
            email: docData.email,
            role: docData.role as "student" | "teacher" | "admin",
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<AppUser> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const docData = await getUserDoc(cred.user.uid);
    if (!docData) throw new Error("User profile not found");
    const appUser: AppUser = {
      id: cred.user.uid,
      name: docData.name,
      email: docData.email,
      role: docData.role as "student" | "teacher" | "admin",
    };
    setUser(appUser);
    return appUser;
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "student" | "teacher"
  ): Promise<AppUser> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDoc(cred.user.uid, { name, email, role });
    const appUser: AppUser = { id: cred.user.uid, name, email, role };
    setUser(appUser);
    return appUser;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
