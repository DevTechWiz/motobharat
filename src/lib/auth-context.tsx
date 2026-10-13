"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type Approval = "approved" | "pending" | "rejected" | "needs-kyc";

type AuthValue = {
  user: User | null;
  profile: Profile | null;
  registered: boolean;
  approval: Approval;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  profile: null,
  registered: false,
  approval: "needs-kyc",
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
  const [approval, setApproval] = useState<Approval>("needs-kyc");
  const [loading, setLoading] = useState(true);
  // One browser client per provider lifetime — a fresh client every render
  // would churn every callback and effect downstream.
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async (u: User | null) => {
    setUser(u);
    if (u) {
      const [{ data: p }, { data: rd }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).single(),
        supabase
          .from("rider_details")
          .select("registered, kyc_submitted_at, kyc_rejected")
          .eq("user_id", u.id)
          .maybeSingle(),
      ]);
      setProfile(p);
      const isRegistered = rd?.registered ?? false;
      setRegistered(isRegistered);
      setApproval(
        isRegistered ? "approved" : rd?.kyc_rejected ? "rejected" : rd?.kyc_submitted_at ? "pending" : "needs-kyc",
      );
    } else {
      setProfile(null);
      setRegistered(false);
      setApproval("needs-kyc");
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
    setApproval("needs-kyc");
  };

  return (
    <AuthContext value={{ user, profile, registered, approval, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext>
  );
}
