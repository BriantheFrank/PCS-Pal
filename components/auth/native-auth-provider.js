"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  fetchCurrentUserLegalStatus,
  fetchMoveProfile,
  fetchProfile,
  getDisplayName,
  getHouseholdProfile,
  getMoveProfile,
  getProfileFullName,
  getProviderLabel,
  recordCurrentLegalAcceptance,
  saveMoveProfile,
  savePrivacySettings,
  saveProfile,
  upsertProfile,
} from "@/account-data";
import {
  buildLegalDocumentState,
  fetchLegalContext,
  getLegalVersionSnapshot,
  loadActiveLegalDocuments,
} from "@/lib/auth/create-account";
import {
  getBrowserSupabaseClient,
  loadPublicRuntimeConfig,
} from "@/lib/supabase/browser-client";

const NativeAuthContext = createContext(null);

const initialLegalState = buildLegalDocumentState();

const initialState = {
  status: "loading",
  session: null,
  user: null,
  profile: null,
  moveProfile: null,
  legalStatus: [],
  legalDocs: initialLegalState.legalDocs,
  legalDocsAuthoritative: initialLegalState.authoritative,
  googleAuthEnabled: false,
  errorMessage: "",
};

const CLOUD_UNAVAILABLE_MESSAGE = "Cloud sign-in is unavailable right now. Please try again later.";

export function NativeAuthProvider({ children }) {
  const [state, setState] = useState(initialState);
  const supabaseRef = useRef(null);
  const runtimeRef = useRef({ googleAuthEnabled: false });
  const legalRef = useRef({
    legalDocs: initialState.legalDocs,
    legalDocsAuthoritative: initialState.legalDocsAuthoritative,
  });
  const requestIdRef = useRef(0);

  const loadLegalState = useCallback(async (supabase) => {
    const nextLegalState = await loadActiveLegalDocuments(supabase);
    const normalized = {
      legalDocs: nextLegalState.legalDocs,
      legalDocsAuthoritative: nextLegalState.authoritative,
    };
    legalRef.current = normalized;
    return normalized;
  }, []);

  const hydrateSession = useCallback(
    async (nextSession, options = {}) => {
      const supabase = supabaseRef.current;
      const requestId = ++requestIdRef.current;
      const googleAuthEnabled =
        options.googleAuthEnabled ?? runtimeRef.current.googleAuthEnabled;
      const legalDocs = options.legalDocs ?? legalRef.current.legalDocs;
      const legalDocsAuthoritative =
        options.legalDocsAuthoritative ?? legalRef.current.legalDocsAuthoritative;
      const user = nextSession?.user || null;

      if (!user || !supabase) {
        setState((current) => ({
          ...current,
          status: "ready",
          session: nextSession || null,
          user: null,
          profile: null,
          moveProfile: null,
          legalStatus: [],
          legalDocs,
          legalDocsAuthoritative,
          googleAuthEnabled,
          errorMessage: options.errorMessage || "",
        }));
        return;
      }

      setState((current) => ({
        ...current,
        status: "loading",
        session: nextSession,
        user,
        legalDocs,
        legalDocsAuthoritative,
        googleAuthEnabled,
        errorMessage: "",
      }));

      try {
        await upsertProfile({ supabase, user });
        const [profile, legalStatus] = await Promise.all([
          fetchProfile({ supabase, userId: user.id }),
          fetchCurrentUserLegalStatus({ supabase }),
        ]);

        let moveProfile = null;
        try {
          moveProfile = await fetchMoveProfile({ supabase, userId: user.id });
        } catch (moveError) {
          moveProfile = null;
          console.warn("Move profile features are not available yet.", moveError);
        }

        if (requestIdRef.current !== requestId) {
          return;
        }

        setState((current) => ({
          ...current,
          status: "ready",
          session: nextSession,
          user,
          profile,
          moveProfile,
          legalStatus,
          legalDocs,
          legalDocsAuthoritative,
          googleAuthEnabled,
          errorMessage: "",
        }));
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setState((current) => ({
          ...current,
          status: "ready",
          session: nextSession,
          user,
          profile: null,
          moveProfile: null,
          legalStatus: [],
          legalDocs,
          legalDocsAuthoritative,
          googleAuthEnabled,
          errorMessage:
            error?.message || "Account data is unavailable right now. Please try again later.",
        }));
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    let subscription;

    const initialize = async () => {
      try {
        const runtimeConfig = await loadPublicRuntimeConfig();
        if (!active) {
          return;
        }

        runtimeRef.current = {
          googleAuthEnabled: Boolean(runtimeConfig.googleAuthEnabled),
        };

        const supabase = await getBrowserSupabaseClient();
        if (!active) {
          return;
        }

        supabaseRef.current = supabase;
        const legalState = await loadLegalState(supabase);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        await hydrateSession(session, {
          googleAuthEnabled: runtimeRef.current.googleAuthEnabled,
          legalDocs: legalState.legalDocs,
          legalDocsAuthoritative: legalState.legalDocsAuthoritative,
        });

        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          void hydrateSession(nextSession, {
            googleAuthEnabled: runtimeRef.current.googleAuthEnabled,
            legalDocs: legalRef.current.legalDocs,
            legalDocsAuthoritative: legalRef.current.legalDocsAuthoritative,
          });
        });

        subscription = data.subscription;
      } catch (error) {
        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          status: "error",
          errorMessage: error?.message || CLOUD_UNAVAILABLE_MESSAGE,
        }));
      }
    };

    initialize();

    return () => {
      active = false;
      requestIdRef.current += 1;
      subscription?.unsubscribe();
    };
  }, [hydrateSession, loadLegalState]);

  const refreshAccountData = useCallback(async () => {
    const supabase = supabaseRef.current || (await getBrowserSupabaseClient());
    supabaseRef.current = supabase;
    const legalState = await loadLegalState(supabase);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await hydrateSession(session, {
      googleAuthEnabled: runtimeRef.current.googleAuthEnabled,
      legalDocs: legalState.legalDocs,
      legalDocsAuthoritative: legalState.legalDocsAuthoritative,
    });
  }, [hydrateSession, loadLegalState]);

  const signInWithEmail = useCallback(async (email, password) => {
    const supabase = supabaseRef.current || (await getBrowserSupabaseClient());
    supabaseRef.current = supabase;
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current || (await getBrowserSupabaseClient());
    supabaseRef.current = supabase;
    return supabase.auth.signOut();
  }, []);

  const saveProfileAction = useCallback(
    async (fullName) => {
      const supabase = supabaseRef.current || (await getBrowserSupabaseClient());
      supabaseRef.current = supabase;
      if (!state.user) {
        throw new Error("Sign in before updating account details.");
      }

      const nextState = await saveProfile({
        supabase,
        user: state.user,
        profile: state.profile,
        fullNameInput: fullName,
      });

      setState((current) => ({
        ...current,
        user: nextState.user,
        profile: nextState.profile,
      }));

      return nextState;
    },
    [state.profile, state.user]
  );

  const savePrivacySettingsAction = useCallback(
    async (payload) => {
      const supabase = supabaseRef.current || (await getBrowserSupabaseClient());
      supabaseRef.current = supabase;
      if (!state.user) {
        throw new Error("Sign in before updating privacy settings.");
      }

      const nextProfile = await savePrivacySettings({
        supabase,
        user: state.user,
        profile: state.profile,
        ...payload,
      });

      setState((current) => ({
        ...current,
        profile: nextProfile,
      }));

      return nextProfile;
    },
    [state.profile, state.user]
  );

  const saveMoveProfileAction = useCallback(
    async (moveProfileInput) => {
      const supabase = supabaseRef.current || (await getBrowserSupabaseClient());
      supabaseRef.current = supabase;
      if (!state.user) {
        throw new Error("Sign in before updating the move profile.");
      }

      const nextMoveProfile = await saveMoveProfile({
        supabase,
        userId: state.user.id,
        moveProfileInput,
      });

      setState((current) => ({
        ...current,
        moveProfile: nextMoveProfile,
      }));

      return nextMoveProfile;
    },
    [state.user]
  );

  const saveCurrentLegalAcceptanceAction = useCallback(async () => {
    const supabase = supabaseRef.current || (await getBrowserSupabaseClient());
    supabaseRef.current = supabase;
    if (!state.user) {
      throw new Error("Sign in before saving legal acknowledgment.");
    }

    const legalContext = await fetchLegalContext();
    const versionSnapshot = getLegalVersionSnapshot(legalRef.current.legalDocs);
    const sessionId =
      typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `legal-${Date.now()}`;

    const result = await recordCurrentLegalAcceptance({
      supabase,
      versionSnapshot,
      legalContext,
      userAgent: typeof window === "undefined" ? "" : window.navigator.userAgent,
      sessionId,
      acceptanceMethod: "account_reacceptance",
      sourceFlow: "account_settings",
    });

    const legalStatus = await fetchCurrentUserLegalStatus({ supabase });
    setState((current) => ({
      ...current,
      legalStatus,
    }));

    return result;
  }, [state.user]);

  const contextValue = useMemo(
    () => ({
      ...state,
      displayName: getDisplayName({ profile: state.profile, user: state.user }),
      providerLabel: getProviderLabel(state.user),
      profileFullName: getProfileFullName({ profile: state.profile, user: state.user }),
      householdProfile: getHouseholdProfile(state.profile),
      currentMoveProfile: getMoveProfile(state.moveProfile),
      signInWithEmail,
      signOut,
      refreshAccountData,
      saveProfile: saveProfileAction,
      savePrivacySettings: savePrivacySettingsAction,
      saveMoveProfile: saveMoveProfileAction,
      saveCurrentLegalAcceptance: saveCurrentLegalAcceptanceAction,
    }),
    [
      refreshAccountData,
      saveCurrentLegalAcceptanceAction,
      saveMoveProfileAction,
      savePrivacySettingsAction,
      saveProfileAction,
      signInWithEmail,
      signOut,
      state,
    ]
  );

  return <NativeAuthContext.Provider value={contextValue}>{children}</NativeAuthContext.Provider>;
}

export const useNativeAuth = () => {
  const context = useContext(NativeAuthContext);
  if (!context) {
    throw new Error("useNativeAuth must be used inside NativeAuthProvider.");
  }

  return context;
};
