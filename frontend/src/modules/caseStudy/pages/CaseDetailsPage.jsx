import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import caseService from "../services/caseService";
import submissionService from "../../submission/services/submissionService";
import { AuthContext } from "../../../context/AuthContext";
import StatusBadge from "../../../components/StatusBadge";

function CaseDetailsPage() {
  const { caseId } = useParams();
  const { role } = useContext(AuthContext);

  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);
  const [checkingSubmission, setCheckingSubmission] = useState(false);

  useEffect(() => {
    if (!caseId) return;

    const fetchCase = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const data = await caseService.getCaseById(caseId);

        if (!data) {
          setNotFound(true);
        } else {
          setCaseItem(data);
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError("Unable to load case details. Please try again.");
        }
        setCaseItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId]);

  useEffect(() => {
    const checkSubmission = async () => {
      if (role !== "STUDENT" || !caseItem) {
        return;
      }

      setCheckingSubmission(true);

      try {
        const submissions = await submissionService.getMySubmissions();
        const existing = Array.isArray(submissions)
          ? submissions.find((s) => s.caseId === caseItem.id)
          : null;

        if (existing) {
          setMySubmission(existing);
        } else {
          setMySubmission(null);
        }
      } catch (err) {
        // For now, silently ignore errors here – main case details still show.
        setMySubmission(null);
      } finally {
        setCheckingSubmission(false);
      }
    };

    checkSubmission();
  }, [role, caseItem]);

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Case Details
          </h1>
          <p className="text-sm text-slate-500">
            Review case information and submission status.
          </p>
        </div>

        <Link
          to="/cases"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Back to Cases
        </Link>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-5 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-200" />
          <div className="mb-2 h-3 w-5/6 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      )}

      {!loading && notFound && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-8 text-center">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Case not found
          </h2>
          <p className="text-xs text-slate-500">
            This case could not be found or is no longer available.
          </p>
        </div>
      )}

      {!loading && !notFound && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !notFound && !error && caseItem && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {caseItem.title}
                </h2>
              </div>
              <StatusBadge status={caseItem.status} />
            </div>

            {caseItem.description && (
              <div className="mb-4 text-sm text-slate-700">
                {caseItem.description}
              </div>
            )}

            <dl className="grid gap-4 text-xs text-slate-600 sm:grid-cols-2">
              {caseItem.difficulty && (
                <div>
                  <dt className="font-medium text-slate-700">Difficulty</dt>
                  <dd className="mt-0.5">{caseItem.difficulty}</dd>
                </div>
              )}

              {caseItem.dueDate && (
                <div>
                  <dt className="font-medium text-slate-700">Due date</dt>
                  <dd className="mt-0.5">
                    {new Date(caseItem.dueDate).toLocaleDateString()}
                  </dd>
                </div>
              )}

              {caseItem.maxMarks != null && (
                <div>
                  <dt className="font-medium text-slate-700">Max marks</dt>
                  <dd className="mt-0.5">{caseItem.maxMarks}</dd>
                </div>
              )}

              {caseItem.createdAt && (
                <div>
                  <dt className="font-medium text-slate-700">Created at</dt>
                  <dd className="mt-0.5">
                    {new Date(caseItem.createdAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {role === "STUDENT" && caseItem.status === "PUBLISHED" && (
            <div className="space-y-3">
              {checkingSubmission && (
                <div className="text-xs text-slate-500">
                  Checking submission...
                </div>
              )}

              {!checkingSubmission && mySubmission && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                  <div className="font-semibold">✔ Submission sent</div>
                  {mySubmission.marksAwarded != null && (
                    <div className="mt-1 space-y-0.5">
                      <div>Marks: {mySubmission.marksAwarded}</div>
                      {mySubmission.facultyComment && (
                        <div>Feedback: {mySubmission.facultyComment}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!checkingSubmission && !mySubmission && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-xs text-slate-600">
                    <div className="font-semibold text-slate-700">
                      No submission yet
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Submit your solution once you are ready. You can only
                      submit once for this case.
                    </p>
                  </div>
                  <Link
                    to={`/cases/${caseId}/submit`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Submit Solution
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CaseDetailsPage;

