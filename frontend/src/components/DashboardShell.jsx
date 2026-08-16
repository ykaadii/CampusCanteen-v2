import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const roleTheme =
    user?.role === "ADMIN"
      ? "bg-purple-50 text-purple-900 border-purple-200/80"
      : user?.role === "CANTEEN_OWNER"
      ? "bg-amber-50 text-amber-900 border-amber-200/80"
      : user?.role === "CANTEEN_STAFF"
      ? "bg-blue-50 text-blue-900 border-blue-200/80"
      : "bg-emerald-50 text-emerald-900 border-emerald-200/80";

  return (
    <div className="min-h-screen bg-gray-50/70 text-gray-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Glassmorphic Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/85 border-b border-gray-200/70 px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xs transition-all">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="text-xl font-black tracking-tight flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              CC
            </div>
            <span className="bg-gradient-to-r from-gray-950 via-gray-850 to-black bg-clip-text text-transparent font-extrabold text-lg sm:text-xl">
              CampusCanteen
            </span>
          </Link>

          {(user?.role === "ADMIN" || user?.role === "CANTEEN_OWNER") && (
            <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl text-xs font-bold border border-gray-200/60">
              {user?.role === "ADMIN" && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 rounded-lg hover:bg-white text-gray-700 hover:text-black transition-all shadow-2xs"
                >
                  Admin Panel
                </Link>
              )}
              <Link
                to="/owner"
                className="px-3 py-1.5 rounded-lg hover:bg-white text-amber-950 transition-all shadow-2xs"
              >
                Owner Portal
              </Link>
              {user?.role === "ADMIN" && (
                <>
                  <Link
                    to="/canteen"
                    className="px-3 py-1.5 rounded-lg hover:bg-white text-gray-700 hover:text-black transition-all"
                  >
                    Staff Queue
                  </Link>
                  <Link
                    to="/student"
                    className="px-3 py-1.5 rounded-lg hover:bg-white text-gray-700 hover:text-black transition-all"
                  >
                    Student View
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* User Profile & Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 bg-gray-100/60 px-3 py-1.5 rounded-2xl border border-gray-200/60">
            <div className="flex flex-col items-end">
              <span className="font-bold text-xs text-gray-900">{user?.name}</span>
              <span className="text-[11px] text-gray-500 font-medium truncate max-w-[130px]">
                {user?.email}
              </span>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border shadow-2xs ${roleTheme}`}>
              {user?.role === "ADMIN"
                ? "ADMIN"
                : user?.role === "CANTEEN_OWNER"
                ? "OWNER"
                : user?.role === "CANTEEN_STAFF"
                ? "STAFF"
                : "STUDENT"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="hidden sm:block rounded-xl border border-gray-300/80 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-black transition-all shadow-2xs"
          >
            Log out
          </button>

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-all font-bold text-sm"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200 px-4 py-4 flex flex-col gap-3 shadow-lg transition-all animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div>
              <div className="font-extrabold text-sm text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500 font-medium">{user?.email}</div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border ${roleTheme}`}>
              {user?.role}
            </span>
          </div>

          <nav className="flex flex-col gap-1.5 text-xs font-bold text-gray-800">
            {user?.role === "ADMIN" && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                ⚙️ Admin Panel
              </Link>
            )}
            {(user?.role === "ADMIN" || user?.role === "CANTEEN_OWNER") && (
              <Link
                to="/owner"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 bg-amber-50 text-amber-950 hover:bg-amber-100 rounded-xl border border-amber-200"
              >
                👑 Owner Portal
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <>
                <Link
                  to="/canteen"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200"
                >
                  👨‍🍳 Canteen Staff Queue
                </Link>
                <Link
                  to="/student"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200"
                >
                  🍛 Student Portal
                </Link>
              </>
            )}
          </nav>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleLogout();
            }}
            className="w-full mt-1 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl text-center"
          >
            Log out of Account
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">{children}</main>
    </div>
  );
}
