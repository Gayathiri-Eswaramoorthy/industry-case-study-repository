import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Info } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import caseService from "../services/caseService";
import submissionService from "../../submission/services/submissionService";
import { AuthContext } from "../../../context/AuthContext";
import StatusBadge from "../../../components/StatusBadge";

function parseKeyQuestions(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    console.error("Unable to parse key questions", error);
    return [];
  }
}

function splitLinks(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function CaseDetailsPage() {
  const { caseId } = useParams();
  const { role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const [coScores, setCoScores] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);

  const keyQuestions = useMemo(() => parseKeyQuestions(caseItem?.keyQuestions), [caseItem?.keyQuestions]);
  const referenceLinks = useMemo(() => splitLinks(caseItem?.referenceLinks), [caseItem?.referenceLinks]);

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
          ? submissions.find((submission) => submission.caseId === caseItem.id)
          : null;

        setMySubmission(existing || null);
      } catch (err) {
        setMySubmission(null);
      } finally {
        setCheckingSubmission(false);
      }
    };

    checkSubmission();
  }, [role, caseItem]);

  useEffect(() => {
    if (caseItem && role === "STUDENT" && caseItem.status !== "PUBLISHED") {
      navigate("/cases", { replace: true });
    }
  }, [caseItem, navigate, role]);

  useEffect(() => {
    const loadCoBreakdown = async () => {
      if (role !== "STUDENT" || !mySubmission?.id || mySubmission.marksAwarded == null || !caseItem?.courseId) {
        setCoScores([]);
        setCourseOutcomes([]);
        return;
      }

      try {
        const [scores, outcomes] = await Promise.all([
          submissionService.getCoScores(mySubmission.id),
          axiosInstance.get(`/course-outcomes/${caseItem.courseId}`),
        ]);

        setCoScores(Array.isArray(scores) ? scores : []);
        setCourseOutcomes(Array.isArray(outcomes.data) ? outcomes.data : []);
      } catch (err) {
        setCoScores([]);
        setCourseOutcomes([]);
      }
    };

    loadCoBreakdown();
  }, [role, mySubmission?.id, mySubmission?.marksAwarded, caseItem?.courseId]);

  const outcomeById = useMemo(
    () =>
      courseOutcomes.reduce((accumulator, item) => {
        accumulator[item.id] = item;
        return accumulator;
      }, {}),
    [courseOutcomes]
  );

  const totalCoScore = coScores.reduce((sum, item) => sum + (item.score ?? 0), 0);
  const totalCoMaxScore = coScores.reduce((sum, item) => sum + (item.maxScore ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Case Details</h1>
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
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Case not found</h2>
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
                <h2 className="text-lg font-semibold text-slate-900">{caseItem.title}</h2>
              </div>
              <StatusBadge status={caseItem.status} />
            </div>

            {caseItem.description && (
              <div className="mb-4 text-sm text-slate-700">{caseItem.description}</div>
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
                  <dd className="mt-0.5">{new Date(caseItem.dueDate).toLocaleDateString()}</dd>
                </div>
              )}

              {caseItem.maxMarks != null && (
                <div>
                  <dt className="font-medium text-slate-700">Max marks</dt>
                  <dd className="mt-0.5">{caseItem.maxMarks}</dd>
                </div>
              )}

              {caseItem.estimatedHours != null && (
                <div>
                  <dt className="font-medium text-slate-700">Estimated Time</dt>
                  <dd className="mt-0.5">~{caseItem.estimatedHours} hours</dd>
                </div>
              )}
            </dl>
          </div>

          {(caseItem.problemStatement ||
            keyQuestions.length > 0 ||
            caseItem.constraints ||
            caseItem.evaluationRubric ||
            referenceLinks.length > 0 ||
            caseItem.estimatedHours != null) && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Structured Case Info</h2>

              <div className="space-y-4">
                {caseItem.problemStatement && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Problem Statement</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {caseItem.problemStatement}
                    </p>
                  </div>
                )}

                {keyQuestions.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Key Questions</h3>
                    <ol className="space-y-1 text-sm text-slate-700">
                      {keyQuestions.map((question, index) => (
                        <li key={`${question}-${index}`}>{index + 1}. {question}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {caseItem.constraints && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Constraints</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {caseItem.constraints}
                    </p>
                  </div>
                )}

                {caseItem.evaluationRubric && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">Evaluation Rubric</h3>
                      <span
                        title="This is how your submission will be graded"
                        className="inline-flex items-center text-slate-400"
                      >
                        <Info className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {caseItem.evaluationRubric}
                    </p>
                  </div>
                )}

                {referenceLinks.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Reference Links</h3>
                    <div className="space-y-1">
                      {referenceLinks.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm text-blue-600 underline underline-offset-2"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {role === "STUDENT" && caseItem.status === "PUBLISHED" && (
            <div className="space-y-3">
              {checkingSubmission && (
                <div className="text-xs text-slate-500">Checking submission...</div>
              )}

              {!checkingSubmission && mySubmission && (
                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                  <div className="font-semibold">Submission sent</div>
                  {mySubmission.marksAwarded != null && (
                    <div className="mt-1 space-y-0.5">
                      <div>Marks: {mySubmission.marksAwarded}</div>
                      {mySubmission.facultyFeedback && (
                        <div>Feedback: {mySubmission.facultyFeedback}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!checkingSubmission && !mySubmission && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-xs text-slate-600">
                    <div className="font-semibold text-slate-700">No submission yet</div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Submit your solution once you are ready. You can only submit once for this case.
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

              {!checkingSubmission && mySubmission && mySubmission.marksAwarded != null && coScores.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-base font-semibold text-slate-900">Course Outcome Breakdown</h2>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Course Outcome</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Your Score</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600">Max Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {coScores.map((item) => {
                          const outcome = outcomeById[item.coId];
                          const label = outcome
                            ? `${outcome.code}: ${outcome.description}`
                            : `CO ${item.coId}`;

                          return (
                            <tr key={item.id ?? `${item.coId}-${item.score}`}>
                              <td className="px-4 py-2 text-slate-700">{label}</td>
                              <td className="px-4 py-2 text-slate-700">{item.score}</td>
                              <td className="px-4 py-2 text-slate-700">{item.maxScore}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-50">
                          <td className="px-4 py-2 font-semibold text-slate-800">Total</td>
                          <td className="px-4 py-2 font-semibold text-slate-800">{totalCoScore}</td>
                          <td className="px-4 py-2 font-semibold text-slate-800">{totalCoMaxScore}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
