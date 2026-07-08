import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);
const storageKey = "bakery_auth";

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : { token: null, user: null };
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(session));
  }, [session]);

  const refreshProfile = async () => {
    if (!session.token) {
      return null;
    }

    try {
      const { data } = await api.get("/auth/me");
      setSession((current) => ({ ...current, user: data.user }));
      return data.user;
    } catch (error) {
      setSession({ token: null, user: null });
      return null;
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (payload) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", payload);
      setSession({
        token: data.token,
        user: data.user
      });
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
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put("/auth/profile", payload);
    setSession((current) => ({ ...current, user: data.user }));
    return data;
  };

  const logout = () => {
    setSession({ token: null, user: null });
  };

  const value = {
    token: session.token,
    user: session.user,
    isAuthenticated: Boolean(session.token),
    loading,
    login,
    register,
    refreshProfile,
    updateProfile,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
