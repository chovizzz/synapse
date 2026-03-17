"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { User, UserRole } from "@/types";
import { MOCK_USERS } from "./mock-data";

interface RoleContextType {
  currentUser: User;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); // 默认商务小王

  const setRole = (role: UserRole) => {
    const user = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
    setCurrentUser(user);
  };

  return (
    <RoleContext.Provider value={{ currentUser, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
