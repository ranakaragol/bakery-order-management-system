import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);
const storageKey = "bakery_auth";
const emptySession = { token: null, user: null };

const readStoredSession = () => {
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return emptySession;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(storageKey);
    return emptySession;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readStoredSession);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(() => !readStoredSession().token);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(session));
  }, [session]);

  const refreshProfile = async () => {
    if (!session.token) {
      return null;
    }

    try {
      const { data } = await api.get("/profile");
      setSession((current) => ({ ...current, user: data.user }));
      return data.user;
    } catch (error) {
      setSession(emptySession);
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      if (!session.token) {
        if (!cancelled) {
          setAuthReady(true);
        }
        return;
      }

      await refreshProfile();

      if (!cancelled) {
        setAuthReady(true);
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (payload) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", payload);
      setSession({
        token: data.token,
        user: data.user
      });
      setAuthReady(true);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", payload);
      setSession({
        token: data.token,
        user: data.user
      });
      setAuthReady(true);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put("/profile", payload);
    setSession((current) => ({ ...current, user: data.user }));
    return data;
  };

  const changePassword = async (payload) => {
    const { data } = await api.put("/profile/password", payload);
    return data;
  };

  const logout = () => {
    setSession(emptySession);
    setAuthReady(true);
  };

  const value = {
    token: session.token,
    user: session.user,
    isAuthenticated: Boolean(session.token),
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
