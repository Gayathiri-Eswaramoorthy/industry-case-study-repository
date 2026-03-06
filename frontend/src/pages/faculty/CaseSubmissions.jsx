import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import StatusBadge from "../../components/StatusBadge";

function CaseSubmissions() {
  const { id } = useParams();

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

  if (isLoading) {
    return (
      <div className="text-sm text-slate-600 dark:text-slate-300">
        Loading submissions...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        Unable to load submissions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Case Submissions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review student submissions for this case.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Student Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Submission Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {submissions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No submissions found for this case.
                </td>
              </tr>
            )}

            {submissions.map((submission) => (
              <tr key={submission.submissionId}>
                <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                  {submission.studentName}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {submission.submittedAt
                    ? new Date(submission.submittedAt).toLocaleString()
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={submission.status} />
                </td>
                <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                  {submission.score ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/faculty/submissions/${submission.submissionId}`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CaseSubmissions;
