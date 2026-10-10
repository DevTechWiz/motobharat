"use client";

import { createContext, useContext, useState } from "react";

export type DemoRole = "rider" | "organizer";

export type DemoUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  role: DemoRole;
};

const DEMO_USERS: Record<DemoRole, DemoUser> = {
  rider: {
    id: "demo-rider",
    displayName: "Rahul Varma",
    avatarUrl: null,
    city: "Warangal",
    role: "rider",
  },
  organizer: {
    id: "demo-organizer",
    displayName: "Sai Krishna",
    avatarUrl: null,
    city: "Warangal",
    role: "organizer",
  },
};

type DemoAuthValue = {
  user: DemoUser | null;
  signInDemo: (role: DemoRole) => void;
  signOut: () => void;
};

const DemoAuthContext = createContext<DemoAuthValue>({
  user: null,
  signInDemo: () => {},
  signOut: () => {},
});

export function useDemoAuth() {
  return useContext(DemoAuthContext);
}

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  return (
    <DemoAuthContext
      value={{
        user,
        signInDemo: (role) => setUser(DEMO_USERS[role]),
        signOut: () => setUser(null),
      }}
    >
      {children}
    </DemoAuthContext>
  );
}
