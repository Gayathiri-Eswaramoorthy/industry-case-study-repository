import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Info } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import caseService from "../services/caseService";
import submissionService from "../../submission/services/submissionService";
import { AuthContext } from "../../../context/AuthContext";
import StatusBadge from "../../../components/StatusBadge";
import AttemptTimeline from "../../../components/AttemptTimeline";

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

function formatLabel(value) {
  return String(value).replaceAll("_", " ");
}

function CaseDetailsPage() {
  const { caseId } = useParams();
  const { role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [mySubmission, setMySubmission] = useState(null);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const [coScores, setCoScores] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);

  const {
    data: caseItem,
    isLoading: loading,
    isError: isCaseError,
    error: caseError,
  } = useQuery({
    queryKey: ["case-details", caseId],
    enabled: Boolean(caseId),
    queryFn: () => caseService.getCaseById(caseId),
  });

  const { data: caseCourseOutcomes = [] } = useQuery({
    queryKey: ["course-outcomes-for-case-details", caseItem?.courseId],
    enabled: Boolean(caseItem?.courseId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/course-outcomes/${caseItem.courseId}`);
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const mappedCaseOutcomes = useMemo(() => {
    if (!Array.isArray(caseItem?.coIds) || caseItem.coIds.length === 0) {
      return [];
    }

    const mappedIds = new Set(caseItem.coIds);
    return caseCourseOutcomes.filter((item) => mappedIds.has(item.id));
  }, [caseCourseOutcomes, caseItem?.coIds]);

  const keyQuestions = useMemo(() => parseKeyQuestions(caseItem?.keyQuestions), [caseItem?.keyQuestions]);
  const referenceLinks = useMemo(() => splitLinks(caseItem?.referenceLinks), [caseItem?.referenceLinks]);
  const notFound = isCaseError && caseError?.response?.status === 404;
  const error = isCaseError && !notFound
    ? "Unable to load case details. Please try again."
    : null;

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
      } catch {
        setMySubmission(null);
      } finally {
        setCheckingSubmission(false);
      }
    };

    checkSubmission();
  }, [role, caseItem]);

  useEffect(() => {
    const loadTimeline = async () => {
      if (role !== "STUDENT" || !caseId) {
        setTimelineEvents([]);
        return;
      }

      try {
        await caseService.logCaseActivity(caseId, "VIEWED");
        const timeline = await caseService.getAttemptTimeline(caseId);
        setTimelineEvents(Array.isArray(timeline) ? timeline : []);
      } catch {
        setTimelineEvents([]);
      }
    };

    loadTimeline();
  }, [role, caseId, mySubmission?.id, mySubmission?.marksAwarded]);

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
      } catch {
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Case Details</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review case information and submission status.</p>
        </div>

        <Link
          to="/cases"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back to Cases
        </Link>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 h-5 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mb-2 h-3 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      )}

      {!loading && notFound && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-100">Case not found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">This case could not be found or is no longer available.</p>
        </div>
      )}

      {!loading && !notFound && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !notFound && !error && caseItem && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{caseItem.title}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {caseItem.category && (
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-200">
                      {formatLabel(caseItem.category)}
                    </span>
                  )}
                  {caseItem.difficulty && (
                    <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {formatLabel(caseItem.difficulty)}
                    </span>
                  )}
                  {caseItem.dueDate && (
                    <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      Due {new Date(caseItem.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <StatusBadge status={caseItem.status} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {role === "STUDENT" && caseItem.status === "PUBLISHED" && !mySubmission && !checkingSubmission && (
                  <Link
                    to={`/cases/${caseId}/submit`}
                    className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                  >
                    Submit Solution
                  </Link>
                )}
                {(role === "FACULTY" || role === "ADMIN") && (
                  <Link
                    to={`/cases/${caseId}/edit`}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Edit Case
                  </Link>
                )}
              </div>
            </div>
          </div>

          {caseItem.description && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.description}</p>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Course Outcomes Assessed
              </h2>
            </div>
            {mappedCaseOutcomes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mappedCaseOutcomes.map((co) => (
                  <span
                    key={co.id}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    [{co.code}] {co.description}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No course outcomes mapped yet
              </p>
            )}
          </div>

          {role === "STUDENT" && <AttemptTimeline events={timelineEvents} />}

          {(caseItem.problemStatement ||
            keyQuestions.length > 0 ||
            caseItem.constraints ||
            caseItem.evaluationRubric ||
            referenceLinks.length > 0 ||
            caseItem.estimatedHours != null) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Case Guidance</h2>

              <div className="space-y-4">
                {caseItem.problemStatement && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Problem Statement</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.problemStatement}</p>
                  </div>
                )}

                {keyQuestions.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Key Questions</h3>
                    <ol className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      {keyQuestions.map((question, index) => (
                        <li key={`${question}-${index}`}>{index + 1}. {question}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {caseItem.constraints && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Constraints</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.constraints}</p>
                  </div>
                )}

                {caseItem.evaluationRubric && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Evaluation Rubric</h3>
                      <span title="This is how your submission will be graded" className="inline-flex items-center text-slate-400 dark:text-slate-500">
                        <Info className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.evaluationRubric}</p>
                  </div>
                )}

                {referenceLinks.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Reference Links</h3>
                    <div className="space-y-1">
                      {referenceLinks.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm text-slate-700 underline underline-offset-2 dark:text-slate-300"
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
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  Checking submission...
                </div>
              )}

              {!checkingSubmission && mySubmission && (
                <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <div className="font-semibold">Submission sent</div>
                  {mySubmission.marksAwarded != null && (
                    <div className="space-y-0.5 text-xs">
                      <div>Marks: {mySubmission.marksAwarded}</div>
                      {mySubmission.facultyFeedback && (
                        <div>Feedback: {mySubmission.facultyFeedback}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!checkingSubmission && !mySubmission && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  <div className="font-semibold text-slate-700 dark:text-slate-200">No submission yet</div>
                  <p className="mt-1 text-[11px]">
                    Submit your solution once you are ready. You can only submit once for this case.
                  </p>
                </div>
              )}

              {!checkingSubmission && mySubmission && mySubmission.marksAwarded != null && coScores.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Course Outcome Breakdown</h2>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Course Outcome</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Your Score</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Max Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                        {coScores.map((item) => {
                          const outcome = outcomeById[item.coId];
                          const label = outcome
                            ? `${outcome.code}: ${outcome.description}`
                            : `CO ${item.coId}`;

                          return (
                            <tr key={item.id ?? `${item.coId}-${item.score}`}>
                              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{label}</td>
                              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{item.score}</td>
                              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{item.maxScore}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-50 dark:bg-slate-950">
                          <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-100">Total</td>
                          <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-100">{totalCoScore}</td>
                          <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-100">{totalCoMaxScore}</td>
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
