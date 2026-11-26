import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute component
 * Guards customer profile, owner portal, and admin portal routes
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-10 h-10 border-4 border-[#244b38] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#6d7468] dark:text-[#9ea8a1]">Verifying your session...</p>
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If role restriction is specified and user does not have permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#1a251e] border border-[#e2e8f0] dark:border-[#2a3c30] rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            🛡️
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#244b38] dark:text-[#f0f4f0] mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-[#6d7468] dark:text-[#9ea8a1] mb-6">
            Your current account role (<strong>{user.role}</strong>) does not have authorization to view this portal.
          </p>
          <a
            href="/"
            className="inline-block bg-[#244b38] text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-[#183728] transition"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return children;
}
