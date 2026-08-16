import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, loading, login } = useAuth();

  if (loading) return null;

  if (user) {
    const home =
      user.role === "ADMIN" ? "/admin" : user.role === "CANTEEN_STAFF" ? "/canteen" : "/student";
    return <Navigate to={home} replace />;
  }

  async function handleQuickLogin(email, password) {
    try {
      await login({ email, password });
    } catch (err) {
      alert(err.response?.data?.error || "Quick login failed");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <span className="bg-black text-white px-3 py-1 rounded-xl text-lg font-black tracking-tight">
          CC
        </span>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">CampusCanteen</h1>
        <p className="max-w-md text-sm text-gray-500">
          Order ahead from your campus canteen, get instant atomic daily tokens, and skip the line!
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          to="/login"
          className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition-colors"
        >
          Log in
        </Link>
        <Link
          to="/signup"
          className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-gray-800 transition-colors"
        >
          Sign up as Student
        </Link>
      </div>

      {/* Demo Credentials Box */}
      <div className="w-full max-w-sm bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          ⚡ Quick Demo Logins
        </h3>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleQuickLogin("alex@student.edu", "student1234")}
            className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-xs font-semibold rounded-xl text-gray-800 flex items-center justify-between transition-colors"
          >
            <span>Student (Alex Smith)</span>
            <span className="text-gray-400 text-[10px]">alex@student.edu</span>
          </button>

          <button
            onClick={() => handleQuickLogin("staff@canteen.edu", "staff1234")}
            className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-xs font-semibold rounded-xl text-blue-900 flex items-center justify-between transition-colors"
          >
            <span>Canteen Staff (Sam)</span>
            <span className="text-blue-400 text-[10px]">staff@canteen.edu</span>
          </button>

          <button
            onClick={() => handleQuickLogin("admin@campus.edu", "admin1234")}
            className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-xs font-semibold rounded-xl text-purple-900 flex items-center justify-between transition-colors"
          >
            <span>Administrator</span>
            <span className="text-purple-400 text-[10px]">admin@campus.edu</span>
          </button>
        </div>
      </div>
    </main>
  );
}
