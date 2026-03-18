import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import submissionService from "../../modules/submission/services/submissionService";
import caseService from "../../modules/caseStudy/services/caseService";
import StatusBadge from "../../components/StatusBadge";

function MySubmissions() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const {
    data: pageData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-submissions", page, size],
    queryFn: () => submissionService.getMySubmissions({ page, size }),
  });

  const submissions = Array.isArray(pageData?.content) ? pageData.content : [];
  const totalPages = pageData?.totalPages ?? 0;

  const caseIds = Array.from(
    new Set(submissions.map((submission) => submission?.caseId).filter(Boolean))
  );

  const { data: caseTitles = {} } = useQuery({
    queryKey: ["my-submission-cases", caseIds],
    enabled: caseIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        caseIds.map(async (caseId) => {
          const data = await caseService.getCaseById(caseId);
          return [caseId, data?.title ?? `Case #${caseId}`];
        })
      );

      return Object.fromEntries(results);
    },
  });

  const rows = submissions;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">My Submissions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View your submitted case solutions and evaluation results.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">My Submissions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View your submitted case solutions and evaluation results.</p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          Failed to fetch submissions.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">My Submissions</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View your submitted case solutions and evaluation results.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">No submissions yet</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Start solving case studies to track your progress here.</p>
          <button
            onClick={() => navigate("/cases")}
            className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Browse Cases
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Case Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Submitted Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Feedback</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((submission) => (
                <tr key={submission.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{caseTitles[submission.caseId] ?? `Case #${submission.caseId}`}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                    {submission.marksAwarded != null ? submission.marksAwarded : "Pending"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    <div className="max-w-xs truncate">{submission.facultyFeedback || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/cases/${submission.caseId}`)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      View Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
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
      )}
    </div>
  );
}

export default MySubmissions;
