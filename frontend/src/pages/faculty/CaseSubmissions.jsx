import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import StatusBadge from "../../components/StatusBadge";
import facultySubmissionService from "../../services/facultySubmissionService";

function CaseSubmissions() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const {
    data: submissions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["case-submissions", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axiosInstance.get(`/faculty/cases/${id}/submissions`);
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: ({ submissionId, payload }) =>
      facultySubmissionService.evaluateSubmission(submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-submissions", id] });
      queryClient.invalidateQueries({ queryKey: ["faculty-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["faculty-dashboard"] });
      toast.success("Submission evaluated successfully.");
      setSelectedSubmission(null);
      setScore("");
      setFeedback("");
    },
    onError: () => {
      toast.error("Unable to evaluate submission.");
    },
  });

  const caseTitle = submissions?.[0]?.caseTitle || `Case #${id}`;

  const openEvaluateModal = (submission) => {
    setSelectedSubmission(submission);
    setScore(
      submission?.score != null && !Number.isNaN(Number(submission.score))
        ? String(submission.score)
        : ""
    );
    setFeedback(submission?.facultyFeedback || "");
  };

  const handleEvaluateSubmit = (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const numericScore = Number(score);
    if (score === "" || Number.isNaN(numericScore) || numericScore < 0) {
      toast.error("Enter a valid score.");
      return;
    }

    evaluateMutation.mutate({
      submissionId: selectedSubmission.submissionId,
      payload: {
        score: numericScore,
        feedback: feedback.trim(),
        coScores: [],
      },
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
        Unable to load submissions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {caseTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Review and evaluate student submissions for this case.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">No submissions found</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Students have not submitted for this case yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Submitted Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Marks</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((submission) => (
                <tr key={submission.submissionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{submission.studentName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{submission.score ?? "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEvaluateModal(submission)}
                      className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                    >
                      Evaluate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Evaluate Submission</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedSubmission.studentName}</p>
            </div>

            <form onSubmit={handleEvaluateSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Score</label>
                <input
                  type="number"
                  min="0"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Comment</label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Add feedback..."
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={evaluateMutation.isPending}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {evaluateMutation.isPending ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseSubmissions;
