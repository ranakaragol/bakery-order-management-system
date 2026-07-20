import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api, { setUnauthorizedHandler } from "../api/client";
import { restoreAuthenticatedUser } from "../utils/authSession";

const AuthContext = createContext(null);
const emptySession = { user: null };

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(emptySession);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const refreshProfile = useCallback(async () => {
    const restoredUser = await restoreAuthenticatedUser(api);
    setSession({
      user: restoredUser
    });
    return restoredUser;
  }, []);

  useEffect(() => {
    const hydrateSession = async () => {
      const restoredUser = await restoreAuthenticatedUser(api);

      if (!cancelled) {
        setSession({
          user: restoredUser
        });
        setAuthReady(true);
      }
    };

    const handleUnauthorized = () => {
      if (!cancelled) {
        setSession(emptySession);
        setAuthReady(true);
      }
    };

    let cancelled = false;

    setUnauthorizedHandler(handleUnauthorized);
    hydrateSession();

    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = useCallback(async (payload) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", payload);
      setSession({
        user: data.user
      });
      setAuthReady(true);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", payload);
      setSession({
        user: data.user
      });
      setAuthReady(true);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const { data } = await api.put("/profile", payload);
    setSession((current) => ({ ...current, user: data.user }));
    return data;
  }, []);

  const changePassword = useCallback(async (payload) => {
    const { data } = await api.put("/profile/password", payload);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      if (error?.response?.status !== 401) {
        throw error;
      }
    } finally {
      setSession(emptySession);
      setAuthReady(true);
    }
  }, []);

  const value = {
    user: session.user,
    isAuthenticated: Boolean(session.user),
    authReady,
    loading,
    login,
    register,
    refreshProfile,
    updateProfile,
    changePassword,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
