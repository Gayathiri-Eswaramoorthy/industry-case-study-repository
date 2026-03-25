import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
} from "lucide-react";
import {
  getApprovedFaculty,
  loginUser,
  registerFaculty,
  registerStudent,
} from "../api/authService";
import { AuthContext } from "../context/AuthContext";

const SIGN_UP_ROLES = [
  { key: "FACULTY", label: "Faculty", icon: BookOpen },
  { key: "STUDENT", label: "Student", icon: GraduationCap },
];

const DEPARTMENT_SPECIALIZATIONS = {
  "Computer Science & Engineering": [
    "Artificial Intelligence & Machine Learning",
    "Data Science",
    "Cybersecurity",
    "Cloud Computing",
    "Software Engineering",
    "Computer Networks",
    "Database Systems",
    "Full Stack Development",
  ],
  "Information Technology": [
    "Web Technologies",
    "Mobile Application Development",
    "IT Infrastructure",
    "Business Intelligence",
    "ERP Systems",
  ],
  "Electronics & Communication Engineering": [
    "VLSI Design",
    "Embedded Systems",
    "Signal Processing",
    "Wireless Communication",
    "IoT & Sensor Networks",
  ],
  "Electrical & Electronics Engineering": [
    "Power Systems",
    "Control Systems",
    "Electric Vehicles",
    "Renewable Energy",
    "Industrial Automation",
  ],
  "Mechanical Engineering": [
    "Thermal Engineering",
    "Manufacturing Technology",
    "Robotics & Automation",
    "CAD/CAM",
    "Fluid Mechanics",
  ],
  "Civil Engineering": [
    "Structural Engineering",
    "Environmental Engineering",
    "Transportation Engineering",
    "Geotechnical Engineering",
    "Construction Management",
  ],
  "Chemical Engineering": [
    "Process Engineering",
    "Petroleum Engineering",
    "Polymer Technology",
    "Environmental Engineering",
  ],
  Biotechnology: [
    "Genetic Engineering",
    "Bioinformatics",
    "Medical Biotechnology",
    "Agricultural Biotechnology",
  ],
};

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [mode, setMode] = useState("signin");
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [requestedFacultyId, setRequestedFacultyId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [isFacultyLoading, setIsFacultyLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const isSignIn = mode === "signin";
  const roleOptions = SIGN_UP_ROLES;

  const submitLabel = useMemo(() => {
    if (isSubmitting && isSignIn) return "Signing in...";
    if (isSubmitting && !isSignIn) return "Creating account...";
    return isSignIn ? "Sign In" : "Sign Up";
  }, [isSubmitting, isSignIn]);

  useEffect(() => {
    if (!selectedRole) {
      setIsFormVisible(false);
      return;
    }
    setIsFormVisible(false);
    const timer = setTimeout(() => setIsFormVisible(true), 10);
    return () => clearTimeout(timer);
  }, [selectedRole]);

  useEffect(() => {
    if (!(mode === "signup" && selectedRole === "STUDENT")) {
      return;
    }

    let isMounted = true;
    setIsFacultyLoading(true);
    getApprovedFaculty()
      .then((data) => {
        if (isMounted) setFacultyList(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (isMounted) setFacultyList([]);
      })
      .finally(() => {
        if (isMounted) setIsFacultyLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mode, selectedRole]);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setSelectedRole(null);
    setErrorMessage("");
  };

  const handleRoleSelect = (role) => {
    if (!isSignIn) {
      if (role === "FACULTY") {
        navigate("/signup/faculty");
        return;
      }
      if (role === "STUDENT") {
        navigate("/signup/student");
        return;
      }
    }

    setSelectedRole(role);
    setErrorMessage("");
  };

  const handleChangeRole = () => {
    setSelectedRole(null);
    setErrorMessage("");
  };

  const handleLogin = async () => {
    const response = await loginUser(email, password);
    if (!response.token) {
      throw new Error("Login failed: Invalid response from server");
    }

    const user = response.user || { id: null, email, role: "STUDENT" };

    login(response.token, user);
    toast.success("Login successful!");
    if (user.role === "ADMIN") navigate("/admin/dashboard");
    else if (user.role === "FACULTY") navigate("/faculty/dashboard");
    else navigate("/student/dashboard");
  };

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      throw new Error("Please fill all required fields.");
    }

    if (selectedRole === "ADMIN") {
      throw new Error(
        "Admin accounts are created by the institution. Please contact your system administrator."
      );
    }

    if (selectedRole === "STUDENT") {
      if (!requestedFacultyId) {
        throw new Error("Please select a faculty.");
      }
      await registerStudent({
        fullName,
        email,
        password,
        requestedFacultyId: Number(requestedFacultyId),
      });
      navigate(
        `/registration-pending?type=student&email=${encodeURIComponent(email)}`
      );
      return;
    }

    await registerFaculty({
      fullName,
      email,
      password,
      department,
      specialization,
    });
    navigate(
      `/registration-pending?type=faculty&email=${encodeURIComponent(email)}`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      const message = "Please enter email and password";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    try {
      setIsSubmitting(true);
      if (isSignIn) await handleLogin();
      else await handleSignup();
    } catch (error) {
      if (isSignIn && error?.response?.status === 403) {
        const serverMessage = error.response?.data?.message ?? "";
        if (serverMessage.includes("pending admin approval")) {
          navigate(
            `/registration-pending?type=faculty&email=${encodeURIComponent(
              email
            )}`
          );
          return;
        } else if (serverMessage.includes("pending faculty approval")) {
          navigate(
            `/registration-pending?type=student&email=${encodeURIComponent(
              email
            )}`
          );
          return;
        } else if (serverMessage.includes("rejected")) {
          setErrorMessage(serverMessage);
          toast.error(serverMessage);
          return;
        }
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        (isSignIn
          ? "Login failed. Please try again."
          : "Unable to create account. Please try again.");
      setErrorMessage(message);
      toast.error(message);
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
          <h1 className="mt-6 text-3xl font-bold text-white">
            Industry Case Study Portal
          </h1>
          <p className="mt-3 max-w-xs text-sm text-slate-300">
            Empowering learning through real-world industry case studies
          </p>
          <div className="mt-8 flex gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              Admin
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              Faculty
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              Student
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full bg-slate-50 lg:w-1/2 lg:bg-white">
        <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-8 py-12">
          <div className="mb-8 flex w-full rounded-full bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => handleModeChange("signin")}
              className={`flex-1 cursor-pointer rounded-full py-2 text-center text-sm ${
                isSignIn
                  ? "bg-white font-medium text-gray-900 shadow"
                  : "text-gray-500"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("signup")}
              className={`flex-1 cursor-pointer rounded-full py-2 text-center text-sm ${
                !isSignIn
                  ? "bg-white font-medium text-gray-900 shadow"
                  : "text-gray-500"
              }`}
            >
              Sign Up
            </button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {isSignIn ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isSignIn ? "Sign in to your account" : "Start by selecting your role"}
          </p>

          {!isSignIn ? (
            <div className="mt-6 flex flex-row justify-center gap-3">
              {roleOptions.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.key;
                return (
                  <div
                    key={role.key}
                    onClick={() => handleRoleSelect(role.key)}
                    className={`flex h-24 w-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    <Icon size={24} />
                    <span className="text-sm font-medium">{role.label}</span>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div
            className={`transition-opacity duration-300 ${
              isSignIn || (selectedRole && isFormVisible) ? "opacity-100" : "opacity-0"
            }`}
          >
            {isSignIn || selectedRole ? (
              <>
                <button
                  type="button"
                  onClick={handleChangeRole}
                  className={`mb-4 mt-6 cursor-pointer text-sm text-gray-400 hover:text-gray-600 ${isSignIn ? "hidden" : ""}`}
                >
                  ← Change role
                </button>

                {!isSignIn && selectedRole === "ADMIN" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Admin accounts are created by the institution. Please
                    contact your system administrator.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isSignIn ? (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    ) : null}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-12 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {!isSignIn && selectedRole === "FACULTY" ? (
                      <>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Department
                          </label>
                          <select
                            value={department}
                            onChange={(e) => {
                              setDepartment(e.target.value);
                              setSpecialization("");
                            }}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select department</option>
                            {Object.keys(DEPARTMENT_SPECIALIZATIONS).map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Specialization
                          </label>
                          <select
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!department}
                          >
                            <option value="">
                              {department
                                ? "Select specialization"
                                : "Select department first"}
                            </option>
                            {(DEPARTMENT_SPECIALIZATIONS[department] || []).map(
                              (spec) => (
                                <option key={spec} value={spec}>
                                  {spec}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </>
                    ) : null}

                    {!isSignIn && selectedRole === "STUDENT" ? (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Faculty Selector
                        </label>
                        <select
                          value={requestedFacultyId}
                          onChange={(e) => setRequestedFacultyId(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={isFacultyLoading || facultyList.length === 0}
                        >
                          <option value="">
                            {isFacultyLoading
                              ? "Loading faculty..."
                              : facultyList.length === 0
                                ? "No faculty available"
                                : "Select faculty"}
                          </option>
                          {facultyList.map((faculty) => (
                            <option key={faculty.id} value={faculty.id}>
                              {faculty.fullName}
                              {faculty.department
                                ? ` - ${faculty.department}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-[#0f172a] py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-80"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {submitLabel}
                        </span>
                      ) : (
                        submitLabel
                      )}
                    </button>
                  </form>
                )}

                {errorMessage ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
