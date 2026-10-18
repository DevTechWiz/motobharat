"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type Approval = "approved" | "pending" | "rejected" | "needs-kyc";

type AuthValue = {
  user: User | null;
  profile: Profile | null;
  registered: boolean;
  approval: Approval;
  memberType: "rider" | "pillion" | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: (force?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  profile: null,
  registered: false,
  approval: "needs-kyc",
  memberType: null,
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
  const [memberType, setMemberType] = useState<"rider" | "pillion" | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRefreshRef = useRef<number>(0);
  const inFlightRef = useRef<Promise<void> | null>(null);

  // One browser client per provider lifetime — a fresh client every render
  // would churn every callback and effect downstream.
  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async (u: User | null) => {
    setUser((prev) => {
      if (!prev && !u) return null;
      if (prev && u && prev.id === u.id && prev.updated_at === u.updated_at && prev.email === u.email) {
        return prev;
      }
      return u;
    });

    if (u) {
      const [{ data: p }, { data: rd }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.id).single(),
        supabase
          .from("rider_details")
          .select("registered, kyc_submitted_at, kyc_rejected, member_type")
          .eq("user_id", u.id)
          .maybeSingle(),
      ]);
      setProfile((prev) => {
        if (!prev && !p) return null;
        if (
          prev &&
          p &&
          prev.id === p.id &&
          prev.display_name === p.display_name &&
          prev.avatar_url === p.avatar_url &&
          prev.role === p.role &&
          prev.city === p.city
        ) {
          return prev;
        }
        return p;
      });
      const isRegistered = rd?.registered ?? false;
      setRegistered(isRegistered);
      setMemberType((rd?.member_type as "rider" | "pillion") ?? "rider");
      setApproval(
        isRegistered ? "approved" : rd?.kyc_rejected ? "rejected" : rd?.kyc_submitted_at ? "pending" : "needs-kyc",
      );
    } else {
      setProfile(null);
      setRegistered(false);
      setMemberType(null);
      setApproval("needs-kyc");
    }
    setLoading(false);
  }, [supabase]);

  const refreshProfile = useCallback(async (force = false) => {
    const now = Date.now();
    // Throttle queries to at most once per 10 seconds unless explicitly forced
    if (!force && now - lastRefreshRef.current < 10000) {
      return;
    }
    if (inFlightRef.current) return inFlightRef.current;

    lastRefreshRef.current = now;
    inFlightRef.current = (async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        await load(currentUser);
      } finally {
        inFlightRef.current = null;
      }
    })();
    return inFlightRef.current;
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
    <AuthContext value={{ user, profile, registered, approval, memberType, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext>
  );
}
