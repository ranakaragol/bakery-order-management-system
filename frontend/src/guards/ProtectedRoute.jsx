import { Navigate, Outlet } from "react-router-dom";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ requiredRole }) => {
  const { authReady, isAuthenticated, user } = useAuth();

  if (!authReady) {
    return <LoadingState message="Oturum bilgileriniz doğrulanıyor..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === "admin" ? "/admin/dashboard" : "/"} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
