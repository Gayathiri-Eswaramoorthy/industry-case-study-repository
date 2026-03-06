import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  createUser,
  deleteUser,
  getUsers,
} from "../api/userService";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  password: "",
  role: "STUDENT",
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

function Users() {
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const queryClient = useQueryClient();

  const {
    data: pageData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users", page, size],
    queryFn: () => getUsers({ page, size }),
  });

  const users = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
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

  const openAddParticipantModal = () => {
    setIsModalOpen(true);
    setForm(INITIAL_FORM);
    setFormError("");
  };

  const handleDelete = async (id) => {
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

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          User Management
        </h2>
        <button
          type="button"
          onClick={openAddParticipantModal}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Add Participant
        </button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded border border-dashed border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
            Failed to load users.
          </div>
        )}

        {!isLoading && !isError && users.length === 0 && (
          <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
            No users found.
          </div>
        )}

        {!isLoading && !isError && users.length > 0 && (
        <ul className="divide-y divide-slate-200 dark:divide-gray-700">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 py-3 text-slate-700 dark:text-gray-200 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{user.fullName}</p>
                <p className="text-slate-500 dark:text-gray-400">{user.email}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {user.role}
                </p>
              </div>
              <button
                onClick={() => handleDelete(user.id)}
                disabled={deleteMutation.isPending}
                className="w-fit rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="rounded bg-slate-200 px-3 py-1 text-slate-800 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Previous
          </button>

          <span className="text-sm text-slate-600 dark:text-gray-300">
            Page {page + 1} of {totalPages}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page + 1 >= totalPages || totalPages === 0}
            className="rounded bg-slate-200 px-3 py-1 text-slate-800 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Add Participant
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                X
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateUser}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="FACULTY">FACULTY</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {formError && (
                <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createMutation.isPending ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
