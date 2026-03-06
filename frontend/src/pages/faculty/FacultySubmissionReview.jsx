import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import facultySubmissionService from "../../services/facultySubmissionService";
import StatusBadge from "../../components/StatusBadge";

function FacultySubmissionReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");

  const {
    data: submission,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["faculty-submission", id],
    queryFn: () => facultySubmissionService.getFacultySubmission(id),
    enabled: Boolean(id),
  });

  const evaluateMutation = useMutation({
    mutationFn: (payload) =>
      facultySubmissionService.evaluateSubmission(id, payload.score, payload.feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["faculty-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["faculty-dashboard-stats"] });
      navigate("/faculty/submissions");
    },
    onError: () => {
      setFormError("Unable to evaluate submission. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    const numericScore = Number(score);
    if (!score || Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      setFormError("Enter a valid score between 0 and 100.");
      return;
    }

    evaluateMutation.mutate({
      score: numericScore,
      feedback: feedback.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 h-4 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-36 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (isError || !submission) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          Unable to load submission details.
        </div>
        <Link
          to="/faculty/submissions"
          className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Review Submission
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {submission.studentName} - {submission.caseTitle}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Submitted Solution
        </h2>
        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
          {submission.solutionText || "No submission text available."}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Evaluation
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Feedback
            </label>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Add feedback for the student..."
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={evaluateMutation.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {evaluateMutation.isPending ? "Saving..." : "Mark Evaluated"}
            </button>
            <Link
              to="/faculty/submissions"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FacultySubmissionReview;
