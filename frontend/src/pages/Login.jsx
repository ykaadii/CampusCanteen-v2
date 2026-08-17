import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  // If already logged in, redirect to user's home dashboard immediately
  useEffect(() => {
    if (user && !loading) {
      const home =
        user.role === "ADMIN"
          ? "/admin"
          : user.role === "CANTEEN_OWNER"
          ? "/owner"
          : user.role === "CANTEEN_STAFF"
          ? "/canteen"
          : "/student";
      navigate(home, { replace: true });
    }
  }, [user, loading, navigate]);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError("");
    setPending(true);

    const cleanForm = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    try {
      const loggedInUser = await login(cleanForm);
      const home =
        loggedInUser.role === "ADMIN"
          ? "/admin"
          : loggedInUser.role === "CANTEEN_OWNER"
          ? "/owner"
          : loggedInUser.role === "CANTEEN_STAFF"
          ? "/canteen"
          : "/student";
      
      // Force navigation with replace to ensure clean redirect to dashboard
      navigate(home, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50/70 flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 shadow-xl shadow-gray-200/50 p-6 sm:p-8 flex flex-col gap-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-orange-500/30 mb-1">
            CC
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Log in to CampusCanteen
          </h1>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed font-medium">
            Skip campus canteen lines — pre-order food & track your live order token.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all font-medium"
              placeholder="alex@student.edu"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 font-semibold text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 py-3 text-sm font-extrabold text-white hover:opacity-95 disabled:opacity-50 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
          >
            {pending ? "Logging in..." : "Log in ➔"}
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 text-center text-xs text-gray-500 font-medium">
          Don't have an account?{" "}
          <Link to="/signup" className="font-extrabold text-orange-600 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
