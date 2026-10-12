"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type AuthValue = {
  user: User | null;
  profile: Profile | null;
  registered: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  profile: null,
  registered: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async (u: User | null) => {
    setUser(u);
    if (u) {
      const [{ data: p }, { data: rd }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).single(),
        supabase.from("rider_details").select("registered").eq("user_id", u.id).maybeSingle(),
      ]);
      setProfile(p);
      setRegistered(rd?.registered ?? false);
    } else {
      setProfile(null);
      setRegistered(false);
    }
    setLoading(false);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await load(currentUser);
  }, [supabase, load]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => load(user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await load(session?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase, load]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRegistered(false);
  };

  return (
    <AuthContext value={{ user, profile, registered, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext>
  );
}
