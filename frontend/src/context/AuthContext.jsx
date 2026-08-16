import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists, verify it's still valid by fetching
  // the current user — this catches the case where a token expired while
  // the tab was closed.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function sendSignupOtp({ name, email, password }) {
    const { data } = await api.post("/auth/send-otp", { name, email, password });
    return data;
  }

  async function verifyOtpAndSignup({ name, email, password, otp }) {
    const { data } = await api.post("/auth/verify-otp-signup", {
      name,
      email,
      password,
      otp,
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function signup({ name, email, password }) {
    return sendSignupOtp({ name, email, password });
  }

  async function login({ email, password }) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function updateDefaultCampus(campusId) {
    const { data } = await api.patch("/auth/default-campus", { campusId });
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sendSignupOtp,
        verifyOtpAndSignup,
        signup,
        login,
        updateDefaultCampus,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
