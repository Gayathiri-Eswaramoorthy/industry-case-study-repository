import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { auth } = useContext(AuthContext);
  const storedToken = localStorage.getItem("token");

  if (!auth?.token || !storedToken) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
