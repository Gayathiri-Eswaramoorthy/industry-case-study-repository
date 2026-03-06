import { useContext, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import submissionService from "../services/submissionService";
import { AuthContext } from "../../../context/AuthContext";
import StatusBadge from "../../../components/StatusBadge";

function CaseSubmissionsPage() {
  const { caseId } = useParams();
  const { role } = useContext(AuthContext);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [marks, setMarks] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (role !== "FACULTY") {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!caseId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await submissionService.getSubmissionsByCase(caseId);
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading submissions:", err);
        setError("Unable to load submissions. Please try again.");
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [caseId]);

  const hasSubmissions = submissions.length > 0;

  const openEvaluateModal = (submission) => {
    setSelectedSubmission(submission);
    setMarks("");
    setComment("");
    setSubmitError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setSelectedSubmission(null);
    setMarks("");
    setComment("");
    setSubmitError(null);
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!marks.trim() || Number.isNaN(Number(marks))) {
      setSubmitError("Please enter a valid numeric mark.");
      return;
    }

    if (!selectedSubmission) return;

    setSubmitting(true);

    try {
      const numericMarks = Number(marks);

      await submissionService.evaluateSubmission(
        selectedSubmission.id,
        numericMarks,
        comment
      );

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id
            ? {
                ...s,
                marksAwarded: numericMarks,
                facultyComment: comment,
              }
            : s
        )
      );

      closeModal();
    } catch (err) {
      console.error("Error evaluating submission:", err);
      setSubmitError("Unable to save evaluation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Submissions
          </h1>
          <p className="text-sm text-slate-500">
            Review and evaluate student submissions for this case.
          </p>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-5 w-1/4 animate-pulse rounded bg-slate-200" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="mb-2 flex gap-3 border-b border-slate-100 pb-2 last:border-b-0"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-3 flex-1 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && !hasSubmissions && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-8 text-center">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            No submissions yet
          </h2>
          <p className="text-xs text-slate-500">
            Students have not submitted any solutions for this case.
          </p>
        </div>
      )}

      {!loading && !error && hasSubmissions && (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Student ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Submitted At
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Marks
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {submissions.map((submission) => {
                const isGraded = submission.marksAwarded != null;
                const status = isGraded ? "GRADED" : "SUBMITTED";

                return (
                  <tr
                    key={submission.id}
                    className="odd:bg-white even:bg-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-2 text-xs text-slate-800">
                      {submission.studentId}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600">
                      {submission.submittedAt
                        ? new Date(
                            submission.submittedAt
                          ).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-800">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-800">
                      {isGraded ? submission.marksAwarded : "-"}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-800">
                      {isGraded ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm"
                        >
                          Evaluated
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEvaluateModal(submission)}
                          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Evaluate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedSubmission && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transition-all">
            <h2 className="text-base font-semibold text-slate-900">
              Evaluate Submission
            </h2>

            <form onSubmit={handleSubmitEvaluation} className="mt-4 space-y-4">
              {submitError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {submitError}
                </div>
              )}

              <div className="space-y-1">
                <label
                  htmlFor="marks"
                  className="text-xs font-medium text-slate-700"
                >
                  Marks
                </label>
                <input
                  id="marks"
                  type="number"
                  min="0"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="comment"
                  className="text-xs font-medium text-slate-700"
                >
                  Comment (optional)
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseSubmissionsPage;

