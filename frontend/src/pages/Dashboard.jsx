import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/tokenUtils";

function Dashboard() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const user = getUserFromToken();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div>
      <h1>Welcome, {user?.sub} 👋</h1>
      <p>Role: {user?.role}</p>

      {user?.role === "ADMIN" && (
        <button onClick={() => navigate("/users")}>
                Manage Users
        </button>
      )}

      {user?.role === "FACULTY" && (
        <button>
          Approval Dashboard
        </button>
      )}

      {user?.role === "STUDENT" && (
        <button>
          View Case Studies
        </button>
      )}

      <br /><br />

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
