import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const user = await login(form);
      const home =
        user.role === "ADMIN"
          ? "/admin"
          : user.role === "CANTEEN_OWNER"
          ? "/owner"
          : user.role === "CANTEEN_STAFF"
          ? "/canteen"
          : "/student";
      navigate(home);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Log in to CampusCanteen</h1>
        <p className="mt-1 text-sm text-gray-500">
          Skip the line — order ahead from your campus canteen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            placeholder="e.g. alex@student.edu"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-xs"
        >
          {pending ? "Logging in..." : "Log in ➔"}
        </button>
      </form>

      {/* 🧪 Quick Demo Logins Box */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-2xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-900 mb-2.5 flex items-center gap-1.5">
          <span>⚡</span> 1-Click Test Credentials
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setForm({ email: "alex@student.edu", password: "studentpassword123" })}
            className="rounded-lg bg-white p-2.5 text-left border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
          >
            <div className="font-semibold text-gray-900">🎓 Student</div>
            <span className="block text-[10px] text-gray-500 truncate mt-0.5">alex@student.edu</span>
          </button>
          <button
            type="button"
            onClick={() => setForm({ email: "staff.central@canteen.edu", password: "staff123" })}
            className="rounded-lg bg-white p-2.5 text-left border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
          >
            <div className="font-semibold text-gray-900">👨‍🍳 Counter Staff</div>
            <span className="block text-[10px] text-gray-500 truncate mt-0.5">staff.central@...</span>
          </button>
          <button
            type="button"
            onClick={() => setForm({ email: "owner.central@canteen.edu", password: "owner123" })}
            className="rounded-lg bg-white p-2.5 text-left border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
          >
            <div className="font-semibold text-gray-900">🏢 Canteen Owner</div>
            <span className="block text-[10px] text-gray-500 truncate mt-0.5">owner.central@...</span>
          </button>
          <button
            type="button"
            onClick={() => setForm({ email: "admin@campus.edu", password: "adminpassword123" })}
            className="rounded-lg bg-white p-2.5 text-left border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
          >
            <div className="font-semibold text-gray-900">👑 Admin</div>
            <span className="block text-[10px] text-gray-500 truncate mt-0.5">admin@campus.edu</span>
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500">
        No account?{" "}
        <Link to="/signup" className="font-medium text-black underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
