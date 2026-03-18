"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import type { User, UserRole } from "@/types";

interface RoleContextType {
  currentUser: User;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | null>(null);

const FALLBACK_USER: User = {
  id: "u1",
  name: "商务小王",
  email: "wang@synapse.demo",
  role: "BUSINESS",
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  const currentUser: User = session?.user
    ? {
        id: (session.user as { id?: string }).id || "unknown",
        name: session.user.name || "用户",
        email: session.user.email || "",
        role: ((session.user as { role?: string }).role as UserRole) || "BUSINESS",
      }
    : FALLBACK_USER;

  const logout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <RoleContext.Provider value={{ currentUser, logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
