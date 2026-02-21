import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { token, role } = useContext(AuthContext);

  // Not logged in
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If roles are specified and user role not allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
    // OR you can return <h2>Unauthorized</h2>;
  }

  return children;
}

export default ProtectedRoute;
