import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginUser } from "../api/authService";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      toast.error("Please enter both email and password");
      setErrorMessage("Please enter both email and password");
      return;
    }

    try {
      setIsSubmitting(true);
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
        const message = "Login failed: Invalid response from server";
        setErrorMessage(message);
        toast.error(message);
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
        const message =
          "Cannot connect to backend. Please ensure your Spring Boot server is running on http://localhost:8080";
        setErrorMessage(message);
        toast.error(message);
      } else if (error.response?.status === 403) {
        const message = "Invalid credentials. Please check your email and password.";
        setErrorMessage(message);
        toast.error(message);
      } else if (error.response?.status === 401) {
        const message = "Authentication failed. Please try again.";
        setErrorMessage(message);
        toast.error(message);
      } else {
        const message = error.response?.data?.message || "Login failed. Please try again.";
        setErrorMessage(message);
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 lg:flex lg:items-center lg:justify-center">
        <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute bottom-20 right-10 h-60 w-60 rounded-full bg-white/5" />
        <div className="relative flex max-w-md flex-col items-center px-10 text-center">
          <div className="rounded-2xl bg-white/10 p-4 text-white">
            <BookOpen className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-white">Industry Case Study Portal</h1>
          <p className="mt-3 max-w-xs text-sm text-slate-300">
            Empowering learning through real-world industry case studies
          </p>
          <div className="mt-8 flex gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">Admin</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">Faculty</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">Student</span>
          </div>
        </div>
      </div>

      <div className="flex w-full bg-slate-50 dark:bg-slate-950 lg:w-1/2 lg:bg-white">
        <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-8 py-12">
        <form
          onSubmit={handleLogin}
          className="w-full"
        >
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white lg:hidden">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to your account</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-200"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-12 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-80 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}
        </form>

        <p className="mt-10 text-center text-xs text-slate-400">Industry Case Study Portal © 2025</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
