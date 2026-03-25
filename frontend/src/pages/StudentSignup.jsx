import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { getApprovedFaculty, registerStudent } from "../api/authService";

function StudentSignup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedFacultyId, setRequestedFacultyId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    data: facultyList = [],
    isLoading: isFacultyLoading,
    isError: isFacultyError,
    error: facultyError,
  } = useQuery({
    queryKey: ["approved-faculty"],
    queryFn: getApprovedFaculty,
    retry: 1,
  });

  const registerMutation = useMutation({
    mutationFn: registerStudent,
    onSuccess: () => {
      navigate(
        `/registration-pending?type=student&email=${encodeURIComponent(email)}`
      );
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        "Unable to create account. Please try again.";
      setErrorMessage(message);
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName || !email || !password || !requestedFacultyId) {
      const message = "Please fill all required fields.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    registerMutation.mutate({
      fullName,
      email,
      password,
      requestedFacultyId: Number(requestedFacultyId),
    });
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
          <h1 className="mt-6 text-3xl font-bold text-white">
            Industry Case Study Portal
          </h1>
          <p className="mt-3 max-w-xs text-sm text-slate-300">
            Student sign up starts your guided approval workflow.
          </p>
          <div className="mt-8 flex gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              Faculty Approval
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              Student Access
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full bg-slate-50 dark:bg-slate-950 lg:w-1/2 lg:bg-white">
        <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-8 py-12">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white lg:hidden">
                <BookOpen className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Create student account
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose your faculty and submit
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-200"
                  required
                />
              </div>

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
                    placeholder="********"
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
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Select faculty
                </label>
                <select
                  value={requestedFacultyId}
                  onChange={(e) => setRequestedFacultyId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-200"
                  required
                  disabled={isFacultyLoading || facultyList.length === 0}
                >
                  <option value="">
                    {isFacultyLoading
                      ? "Loading faculty..."
                      : isFacultyError
                        ? "Unable to load faculty"
                      : facultyList.length === 0
                        ? "No faculty available"
                        : "Select a faculty"}
                  </option>
                  {facultyList.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.fullName}
                      {faculty.department ? ` - ${faculty.department}` : ""}
                    </option>
                  ))}
                </select>
                {isFacultyError ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {facultyError?.response?.data?.message ||
                      "Could not fetch faculty list. Please refresh and try again."}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-80 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
                {errorMessage}
              </div>
            ) : null}
          </form>

          <div className="mt-6 space-y-2 text-center text-sm">
            <p className="text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                to="/"
                className="font-medium text-slate-700 hover:underline dark:text-slate-300"
              >
                Sign in
              </Link>
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Registering as faculty?{" "}
              <Link
                to="/signup/faculty"
                className="font-medium text-slate-700 hover:underline dark:text-slate-300"
              >
                Faculty Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentSignup;
