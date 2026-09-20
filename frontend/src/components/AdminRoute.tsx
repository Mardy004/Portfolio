import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Guards every /admin child route. While the session is being restored we
 * show a loader to avoid flashing the login screen.
 */
export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p>Checking your session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}