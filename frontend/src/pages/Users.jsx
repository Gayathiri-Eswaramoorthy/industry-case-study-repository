import { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserRound, Shield, Trash2, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import {
  createUser,
  deleteUser,
  getFacultyList,
  getUserStats,
  getUsers,
  reassignStudent,
  resetUserPassword,
} from "../api/userService";
import { AuthContext } from "../context/AuthContext";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  password: "",
  role: "STUDENT",
};

const INITIAL_RESET_FORM = {
  userId: null,
  fullName: "",
  newPassword: "",
  confirmPassword: "",
};

function validateForm(form) {
  if (!form.fullName.trim()) return "Full Name is required";
  if (!form.email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return "Enter a valid email address";
  }
  if (!form.password) return "Password is required";
  if (form.password.length < 6) return "Password must be at least 6 characters";
  if (!form.role) return "Role is required";
  return null;
}

function validateResetForm(form) {
  if (!form.newPassword) return "New password is required";
  if (!form.confirmPassword) return "Confirm password is required";
  if (form.newPassword !== form.confirmPassword) return "Passwords do not match";
  return null;
}

function getInitials(name) {
  const safe = String(name || "").trim();
  if (!safe) return "U";
  return safe
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function roleBadgeClass(role) {
  if (role === "ADMIN") {
    return "border-slate-300 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900";
  }

  if (role === "FACULTY") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-200";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200";
}

function statusBadgeClass(status) {
  if (status === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200";
  }
  if (status === "PENDING_FACULTY_APPROVAL" || status === "PENDING_ADMIN_APPROVAL") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200";
  }
  if (status === "REJECTED") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200";
  }
  return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
}

function Users() {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [resetForm, setResetForm] = useState(INITIAL_RESET_FORM);
  const [formError, setFormError] = useState("");
  const [resetError, setResetError] = useState("");
  const [reassignModal, setReassignModal] = useState({
    open: false,
    studentId: null,
    studentName: "",
    currentFacultyName: "",
    selectedFacultyId: "",
  });
  const queryClient = useQueryClient();

  const {
    data: pageData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users", page, size, activeTab],
    queryFn: () =>
      getUsers({
        page,
        size,
        role: activeTab === "ALL" ? null : activeTab,
      }),
  });

  const { data: counts } = useQuery({
    queryKey: ["user-counts"],
    queryFn: getUserStats,
    staleTime: 30000,
  });

  const { data: facultyList = [] } = useQuery({
    queryKey: ["faculty-list"],
    queryFn: getFacultyList,
    enabled: true,
  });

  const users = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;
  const roleCounts = {
    ALL: counts?.total ?? 0,
    FACULTY: counts?.faculty ?? 0,
    STUDENT: counts?.student ?? 0,
    ADMIN: counts?.admin ?? 0,
  };
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.trim().toLowerCase();
    const searchMatch =
      term.length === 0 ||
      user.fullName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term);
    return searchMatch;
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-counts"] });
      toast.success("User deleted successfully");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-counts"] });
      toast.success("User created successfully");
      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      setFormError("");
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message || "Failed to create user";
      setFormError(message);
      toast.error(message);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: () => {
      toast.success("Password reset successfully");
      setIsResetModalOpen(false);
      setResetForm(INITIAL_RESET_FORM);
      setResetError("");
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message || "Failed to reset password";
      setResetError(message);
      toast.error(message);
    },
  });

  const reassignMutation = useMutation({
    mutationFn: reassignStudent,
    onSuccess: () => {
      toast.success("Student reassigned successfully");
      setReassignModal({
        open: false,
        studentId: null,
        studentName: "",
        currentFacultyName: "",
        selectedFacultyId: "",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message || "Failed to reassign student";
      toast.error(message);
    },
  });

  const openAddParticipantModal = () => {
    setIsModalOpen(true);
    setForm(INITIAL_FORM);
    setFormError("");
  };

  const openResetPasswordModal = (user) => {
    setIsResetModalOpen(true);
    setResetForm({
      userId: user.id,
      fullName: user.fullName,
      newPassword: "",
      confirmPassword: "",
    });
    setResetError("");
  };

  const closeResetPasswordModal = () => {
    setIsResetModalOpen(false);
    setResetForm(INITIAL_RESET_FORM);
    setResetError("");
  };

  const handleDelete = async (id) => {
    if (Number(id) === Number(user?.id)) {
      toast.error("You cannot delete your own account");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    deleteMutation.mutate(id);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();

    const error = validateForm(form);
    if (error) {
      setFormError(error);
      return;
    }

    setFormError("");
    createMutation.mutate({
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();

    const error = validateResetForm(resetForm);
    if (error) {
      setResetError(error);
      return;
    }

    setResetError("");
    resetPasswordMutation.mutate({
      userId: resetForm.userId,
      newPassword: resetForm.newPassword,
    });
  };

  const tabs = [
    { label: "ALL", value: "ALL" },
    { label: "FACULTY", value: "FACULTY" },
    { label: "STUDENT", value: "STUDENT" },
    { label: "ADMIN", value: "ADMIN" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage platform users, roles, and account access.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddParticipantModal}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setPage(0);
              }}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isActive
                    ? "bg-white/20 text-white dark:bg-slate-300 dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {roleCounts[tab.value]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Search Users
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading && (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
            Failed to load users.
          </div>
        )}

        {!isLoading && !isError && filteredUsers.length === 0 && (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <UserRound className="h-6 w-6" />
            </div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
              No users found
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Try a different tab or search term.
            </p>
          </div>
        )}

        {!isLoading && !isError && filteredUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Assigned Faculty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {getInitials(u.fullName)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{u.fullName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${roleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(u.status)}`}>
                        {u.status ? u.status.replaceAll("_", " ") : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {u.role === "STUDENT"
                        ? u.requestedFacultyName || "Not assigned"
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openResetPasswordModal(u)}
                          disabled={resetPasswordMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Reset
                        </button>
                        {u.role === "STUDENT" && (
                          <button
                            type="button"
                            onClick={() =>
                              setReassignModal({
                                open: true,
                                studentId: u.id,
                                studentName: u.fullName,
                                currentFacultyName: u.requestedFacultyName || "Not assigned",
                                selectedFacultyId: u.requestedFacultyId ? String(u.requestedFacultyId) : "",
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Reassign
                          </button>
                        )}
                        {u.id !== user?.id ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id)}
                            disabled={deleteMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Previous
          </button>

          <span className="text-sm text-slate-600 dark:text-slate-300">
            Page {page + 1} of {totalPages}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page + 1 >= totalPages || totalPages === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>

        <select
          value={size}
          onChange={(e) => {
            setSize(Number(e.target.value));
            setPage(0);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Add User</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                X
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateUser}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Role</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="FACULTY">FACULTY</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                >
                  <Shield className="h-4 w-4" />
                  {createMutation.isPending ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Reset Password</h3>
                {resetForm.fullName && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{resetForm.fullName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={closeResetPasswordModal}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                X
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">New Password</label>
                <input
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(e) =>
                    setResetForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm Password</label>
                <input
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={(e) =>
                    setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {resetError && <p className="text-sm text-red-600 dark:text-red-400">{resetError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeResetPasswordModal}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetPasswordMutation.isPending ? "Resetting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reassignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Reassign Student</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{reassignModal.studentName}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setReassignModal({
                    open: false,
                    studentId: null,
                    studentName: "",
                    currentFacultyName: "",
                    selectedFacultyId: "",
                  })
                }
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                X
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Current Faculty:{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {reassignModal.currentFacultyName || "Not assigned"}
                </span>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Select New Faculty
                </label>
                <select
                  value={reassignModal.selectedFacultyId}
                  onChange={(e) =>
                    setReassignModal((prev) => ({ ...prev, selectedFacultyId: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="">-- Select faculty --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fullName} ({f.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Reassignment resets this student to pending faculty approval.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setReassignModal({
                      open: false,
                      studentId: null,
                      studentName: "",
                      currentFacultyName: "",
                      selectedFacultyId: "",
                    })
                  }
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!reassignModal.selectedFacultyId || reassignMutation.isPending}
                  onClick={() =>
                    reassignMutation.mutate({
                      studentId: reassignModal.studentId,
                      newFacultyId: Number(reassignModal.selectedFacultyId),
                    })
                  }
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                >
                  {reassignMutation.isPending ? "Reassigning..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
