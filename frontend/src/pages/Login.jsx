import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { loginUser } from "../api/authService";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      const response = await loginUser(email, password);

      if (response.token) {
        const user = response.user || {
          id: null,
          email,
          role: "STUDENT",
        };

        login(response.token, user);
        toast.success("Login successful!");
        if (user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (user.role === "FACULTY") {
          navigate("/faculty/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      } else {
        toast.error("Login failed: Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
        toast.error(
          "Cannot connect to backend. Please ensure your Spring Boot server is running on http://localhost:8080",
        );
      } else if (error.response?.status === 403) {
        toast.error(
          "Invalid credentials. Please check your email and password.",
        );
      } else if (error.response?.status === 401) {
        toast.error("Authentication failed. Please try again.");
      } else {
        toast.error(
          error.response?.data?.message || "Login failed. Please try again.",
        );
      }
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200"
    >
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Login</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
        >
          Login
        </button>
      </div>

      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-sm text-slate-600">
          <strong>Note:</strong> Please ensure your Spring Boot backend is
          running on <code>http://localhost:8080</code> before attempting to
          login.
        </p>
      </div>
    </form>
  );
}

export default Login;
