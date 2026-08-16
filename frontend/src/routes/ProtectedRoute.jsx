import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap any route element: <ProtectedRoute roles={["STUDENT"]}><StudentDashboard /></ProtectedRoute>
// - Not logged in -> /login
// - Logged in but wrong role -> bounced to *their* correct dashboard,
//   not an error page (mirrors the pattern from the Next.js version).
export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    const home =
      user.role === "ADMIN" ? "/admin" : user.role === "CANTEEN_STAFF" ? "/canteen" : "/student";
    return <Navigate to={home} replace />;
  }

  return children;
}
