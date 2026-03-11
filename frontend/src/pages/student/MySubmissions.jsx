import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import submissionService from "../../modules/submission/services/submissionService";
import caseService from "../../modules/caseStudy/services/caseService";
import StatusBadge from "../../components/StatusBadge";

function MySubmissions() {
  const navigate = useNavigate();

  const {
    data: submissions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: () => submissionService.getMySubmissions(),
  });

  const caseIds = useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(submissions) ? submissions : [])
            .map((submission) => submission?.caseId)
            .filter(Boolean)
        )
      ),
    [submissions]
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

  const rows = Array.isArray(submissions) ? submissions : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Submissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            View your submitted case solutions and evaluation results.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid gap-3 border-b border-slate-100 pb-4 last:border-b-0">
                <div className="h-4 w-1/4 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
              </div>
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
          <h1 className="text-2xl font-semibold text-slate-900">My Submissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            View your submitted case solutions and evaluation results.
          </p>
        </div>

        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to fetch submissions.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Submissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          View your submitted case solutions and evaluation results.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <FolderOpen className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">
                No submissions yet
              </h2>
              <p className="mb-4 text-xs text-slate-500">
                Start solving case studies to track your progress here.
              </p>
              <button
                onClick={() => navigate("/cases")}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                Browse Cases
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      Case Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      Submitted At
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      Marks
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      Feedback
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {caseTitles[submission.caseId] ?? `Case #${submission.caseId}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={submission.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {submission.marksAwarded != null
                            ? submission.marksAwarded
                            : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs text-sm text-slate-600">
                          {submission.facultyFeedback || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/cases/${submission.caseId}`)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
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
        </div>
      </div>
    </div>
  );
}

export default MySubmissions;
