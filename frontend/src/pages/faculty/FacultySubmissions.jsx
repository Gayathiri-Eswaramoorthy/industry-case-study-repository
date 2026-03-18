import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import facultySubmissionService from "../../services/facultySubmissionService";

function FacultySubmissions() {
  const {
    data: submissions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["faculty-submissions"],
    queryFn: () => facultySubmissionService.getFacultySubmissions(),
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
        Unable to load submission review queue. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Submission Review Queue
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Review submissions for your case studies.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">No submissions in queue</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">New student submissions will appear here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Case
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((submission) => (
                <tr key={submission.submissionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{submission.studentName}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{submission.caseTitle}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/faculty/submissions/${submission.submissionId}`}
                      className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FacultySubmissions;
