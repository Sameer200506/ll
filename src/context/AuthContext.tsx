"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { mockDb, MockUser } from "@/lib/mockDB";
import { createUserDoc } from "@/lib/firestore";

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<MockUser | void>;
  register: (email: string, password: string, name: string, role: "student" | "teacher") => Promise<MockUser | void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load from session
    if (typeof window !== "undefined") {
      const sessionId = mockDb.getSession();
      if (sessionId) {
        const u = mockDb.findUserById(sessionId);
        if (u) setUser(u);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const u = mockDb.findUserByEmail(email);
    if (!u) throw new Error("User not found");
    if (u.password && u.password !== password) throw new Error("Invalid password");
    
    mockDb.setSession(u.id);
    setUser(u);
    return u;
  };

  const register = async (email: string, password: string, name: string, role: "student" | "teacher") => {
    const existing = mockDb.findUserByEmail(email);
    if (existing) throw new Error("Email already in use");

    const uid = Math.random().toString(36).substring(2, 9);
    await createUserDoc(uid, { name, email, role, password });
    
    const newUser = mockDb.findUserById(uid);
    if (newUser) {
      mockDb.setSession(newUser.id);
      setUser(newUser);
      return newUser;
    }
  };

  const logout = async () => {
    mockDb.clearSession();
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
