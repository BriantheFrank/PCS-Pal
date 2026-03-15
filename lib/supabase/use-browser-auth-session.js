"use client";

import { useEffect, useState } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

const initialState = {
  status: "loading",
  session: null,
  user: null,
  error: null,
};

export const useBrowserAuthSession = () => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let active = true;
    let subscription;

    const initializeSession = async () => {
      try {
        const supabase = await getBrowserSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        setState({
          status: "ready",
          session,
          user: session?.user || null,
          error: null,
        });

        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!active) {
            return;
          }

          setState({
            status: "ready",
            session: nextSession,
            user: nextSession?.user || null,
            error: null,
          });
        });

        subscription = data.subscription;
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          status: "error",
          session: null,
          user: null,
          error,
        });
      }
    };

    initializeSession();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  return state;
};
