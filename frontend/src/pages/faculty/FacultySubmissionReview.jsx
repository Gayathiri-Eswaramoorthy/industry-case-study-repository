import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import facultySubmissionService from "../../services/facultySubmissionService";
import caseService from "../../modules/caseStudy/services/caseService";
import StatusBadge from "../../components/StatusBadge";

function SubmissionSection({ title, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
      <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{value}</p>
    </div>
  );
}

function FacultySubmissionReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const [coRows, setCoRows] = useState([]);

  const {
    data: submission,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["faculty-submission", id],
    queryFn: () => facultySubmissionService.getFacultySubmission(id),
    enabled: Boolean(id),
  });

  const { data: caseData } = useQuery({
    queryKey: ["case-details", submission?.caseId],
    queryFn: () => caseService.getCaseById(submission.caseId),
    enabled: Boolean(submission?.caseId),
  });

  const { data: coIds = [] } = useQuery({
    queryKey: ["case-co-ids", submission?.caseId],
    enabled: Boolean(submission?.caseId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/case-co/${submission.caseId}`);
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const { data: courseOutcomes = [] } = useQuery({
    queryKey: ["course-outcomes", submission?.courseId],
    enabled: Boolean(submission?.courseId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/course-outcomes/${submission.courseId}`);
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  useEffect(() => {
    if (!coIds.length) {
      const timeoutId = setTimeout(() => setCoRows([]), 0);
      return () => clearTimeout(timeoutId);
    }

    const timeoutId = setTimeout(() => {
      setCoRows((prev) =>
        coIds.map((coId) => {
          const existing = prev.find((row) => row.coId === coId);
          return existing || { coId, score: "", maxScore: "" };
        })
      );
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [coIds]);

  const mappedOutcomes = useMemo(
    () =>
      coRows.map((row) => ({
        ...row,
        outcome: courseOutcomes.find((item) => item.id === row.coId) || null,
      })),
    [coRows, courseOutcomes]
  );

  const totalScore = coRows.reduce((sum, row) => sum + (Number(row.score) || 0), 0);
  const hasCoMappings = coIds.length > 0;
  const hasStructuredContent = Boolean(
    submission?.executiveSummary ||
      submission?.situationAnalysis ||
      submission?.rootCauseAnalysis ||
      submission?.proposedSolution ||
      submission?.implementationPlan ||
      submission?.risksAndConstraints ||
      submission?.conclusion ||
      submission?.githubLink ||
      submission?.selfRating != null
  );
  const maxMarks = caseData?.maxMarks ?? 100;
  const rawScore = hasCoMappings ? totalScore : Number(score) || 0;
  const livePercentage =
    maxMarks > 0 ? Math.round((rawScore / maxMarks) * 100) : 0;

  const evaluateMutation = useMutation({
    mutationFn: (payload) => facultySubmissionService.evaluateSubmission(id, payload),
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

  const updateCoRow = (coId, field, value) => {
    setCoRows((prev) =>
      prev.map((row) => (row.coId === coId ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (hasCoMappings) {
      const invalidRow = coRows.find(
        (row) =>
          row.score === "" ||
          row.maxScore === "" ||
          Number.isNaN(Number(row.score)) ||
          Number.isNaN(Number(row.maxScore)) ||
          Number(row.score) < 0 ||
          Number(row.maxScore) <= 0
      );

      if (invalidRow) {
        setFormError("Enter valid score and max score values for each course outcome.");
        return;
      }

      evaluateMutation.mutate({
        score: totalScore,
        feedback: feedback.trim(),
        coScores: coRows.map((row) => ({
          coId: row.coId,
          score: Number(row.score),
          maxScore: Number(row.maxScore),
        })),
      });
      return;
    }

    const numericScore = Number(score);
    if (!score || Number.isNaN(numericScore) || numericScore < 0 || numericScore > maxMarks) {
      setFormError(`Enter a valid score between 0 and ${maxMarks}.`);
      return;
    }

    evaluateMutation.mutate({
      score: numericScore,
      feedback: feedback.trim(),
      coScores: [],
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          Unable to load submission details.
        </div>
        <Link
          to="/faculty/submissions"
          className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Review Submission</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {submission.studentName} | {submission.caseTitle}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr),minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Submission Details</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Submitted content and student inputs.</p>
            </div>
            <StatusBadge status={submission.status} />
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-xs text-slate-500 dark:text-slate-400">Student</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{submission.studentName}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-xs text-slate-500 dark:text-slate-400">Case</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{submission.caseTitle}</p>
            </div>
          </div>

          <div className="space-y-3">
            <SubmissionSection title="Executive Summary" value={submission.executiveSummary} />
            <SubmissionSection title="Situation Analysis" value={submission.situationAnalysis} />
            <SubmissionSection title="Root Cause Analysis" value={submission.rootCauseAnalysis} />
            <SubmissionSection title="Proposed Solution" value={submission.proposedSolution} />
            <SubmissionSection title="Implementation Plan" value={submission.implementationPlan} />
            <SubmissionSection title="Risks & Constraints" value={submission.risksAndConstraints} />
            <SubmissionSection title="Conclusion" value={submission.conclusion} />

            {submission.githubLink && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">GitHub Repository</h3>
                <a
                  href={submission.githubLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-slate-700 underline underline-offset-2 dark:text-slate-300"
                >
                  {submission.githubLink}
                </a>
              </div>
            )}

            {submission.selfRating != null && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Student Self-Rating</h3>
                <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-200">
                  {submission.selfRating} / 10
                </span>
              </div>
            )}

            {!hasStructuredContent && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Solution Text</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                  {submission.solutionText || "No submission text available."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">Evaluation Form</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
                  {formError}
                </div>
              )}

              {hasCoMappings ? (
                <div className="space-y-3">
                  {mappedOutcomes.map((row, index) => (
                    <div
                      key={row.coId}
                      className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr),110px,110px] dark:border-slate-700 dark:bg-slate-950"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{row.outcome?.code || `CO${index + 1}`}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">{row.outcome?.description || `Course outcome ${row.coId}`}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Score</label>
                        <input
                          type="number"
                          min="0"
                          value={row.score}
                          onChange={(e) => updateCoRow(row.coId, "score", e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Max</label>
                        <input
                          type="number"
                          min="1"
                          value={row.maxScore}
                          onChange={(e) => updateCoRow(row.coId, "maxScore", e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>
                    </div>
                  ))}

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    Total: {totalScore}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {`Score (out of ${maxMarks})`}
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {`${rawScore} / ${maxMarks} (${livePercentage}%)`}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={maxMarks}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Feedback</label>
                <textarea
                  rows={5}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Add feedback for the student..."
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={evaluateMutation.isPending}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {evaluateMutation.isPending ? "Saving..." : "Mark Evaluated"}
                </button>
                <Link
                  to="/faculty/submissions"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Evaluation Rubric</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
              {caseData?.evaluationRubric || "No rubric provided for this case."}
            </p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Max Marks</div>
              <div className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{maxMarks}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultySubmissionReview;
