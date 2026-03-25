import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  approveFaculty,
  getPendingFaculty,
  rejectFaculty,
} from "../../api/userService";

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function PendingFacultyPage() {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const {
    data: rawPendingFaculty = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["pending-faculty"],
    queryFn: getPendingFaculty,
  });

  const pendingFaculty = normalizeList(rawPendingFaculty);

  const approveMutation = useMutation({
    mutationFn: approveFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-faculty"] });
      toast.success("Faculty approved successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to approve faculty");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-faculty"] });
      toast.success("Faculty rejected successfully");
      setRejectTarget(null);
      setReason("");
      setRejectError("");
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Failed to reject faculty";
      setRejectError(message);
      toast.error(message);
    },
  });

  const openRejectModal = (faculty) => {
    setRejectTarget(faculty);
    setReason("");
    setRejectError("");
  };

  const closeRejectModal = () => {
    setRejectTarget(null);
    setReason("");
    setRejectError("");
  };

  const confirmReject = () => {
    if (!reason.trim()) {
      setRejectError("Rejection reason is required.");
      return;
    }

    rejectMutation.mutate({
      id: rejectTarget.id,
      reason: reason.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Pending Faculty Approvals
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Review and approve faculty registration requests
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : null}

        {!isLoading && isError ? (
          <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
            Failed to load pending faculty requests.
          </div>
        ) : null}

        {!isLoading && !isError && pendingFaculty.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
              No pending faculty applications
            </p>
          </div>
        ) : null}

        {!isLoading && !isError && pendingFaculty.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Specialization
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Applied
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingFaculty.map((faculty) => (
                  <tr key={faculty.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {faculty.fullName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{faculty.email}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{faculty.department || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {faculty.specialization || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(faculty.createdAt || faculty.registeredAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => approveMutation.mutate(faculty.id)}
                          disabled={approveMutation.isPending}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {approveMutation.isPending ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Approving...
                            </span>
                          ) : (
                            "Approve"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openRejectModal(faculty)}
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {rejectTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Reject Faculty Application
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{rejectTarget.fullName}</p>
              </div>
              <button
                type="button"
                onClick={closeRejectModal}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close reject modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Rejection Reason
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Provide a reason for rejecting this application..."
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {rejectError ? <p className="text-sm text-red-600 dark:text-red-400">{rejectError}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  disabled={rejectMutation.isPending}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rejectMutation.isPending ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Rejecting...
                    </span>
                  ) : (
                    "Confirm Reject"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PendingFacultyPage;
