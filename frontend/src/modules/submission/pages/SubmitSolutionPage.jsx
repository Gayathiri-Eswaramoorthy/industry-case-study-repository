import { useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ChevronDown, ChevronUp } from "lucide-react";
import caseService from "../../caseStudy/services/caseService";
import submissionService from "../services/submissionService";
import { AuthContext } from "../../../context/AuthContext";

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

function countWords(value) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function buildLegacySolutionText(sections) {
  return [
    ["Executive Summary", sections.executiveSummary],
    ["Situation Analysis", sections.situationAnalysis],
    ["Root Cause Analysis", sections.rootCauseAnalysis],
    ["Proposed Solution", sections.proposedSolution],
    ["Implementation Plan", sections.implementationPlan],
    ["Risks & Constraints", sections.risksAndConstraints],
    ["Conclusion", sections.conclusion],
    ["GitHub Link", sections.githubLink],
  ]
    .filter(([, value]) => value && value.trim())
    .map(([label, value]) => `${label}\n${value.trim()}`)
    .join("\n\n");
}

function FormSection({ id, label, hint, helperText, value, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</h2>
          {helperText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{countWords(value)} words</span>
      </div>
      <textarea
        id={id}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
        required
      />
    </div>
  );
}

function SubmitSolutionPage() {
  const { caseId } = useParams();
  const { role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [situationAnalysis, setSituationAnalysis] = useState("");
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState("");
  const [proposedSolution, setProposedSolution] = useState("");
  const [implementationPlan, setImplementationPlan] = useState("");
  const [risksAndConstraints, setRisksAndConstraints] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [selfRating, setSelfRating] = useState(5);
  const [showReferencePanel, setShowReferencePanel] = useState(true);
  const [myGroup, setMyGroup] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const keyQuestions = useMemo(() => parseKeyQuestions(caseData?.keyQuestions), [caseData?.keyQuestions]);
  const submissionType = caseData?.submissionType ?? "TEXT";
  const showExtraFields = submissionType === "TEXT" || submissionType === "GITHUB_LINK";

  useEffect(() => {
    const loadCase = async () => {
      if (!caseId) return;

      setCaseLoading(true);
      setError(null);

      try {
        const data = await caseService.getCaseById(caseId);
        setCaseData(data);
      } catch (err) {
        console.error("Error loading case for submission:", err);
        setError("Unable to load case details. Please try again.");
      } finally {
        setCaseLoading(false);
      }
    };

    loadCase();
  }, [caseId]);

  useEffect(() => {
    const logStarted = async () => {
      if (role !== "STUDENT" || !caseId) {
        return;
      }

      try {
        await caseService.logCaseActivity(caseId, "STARTED");
      } catch (err) {
        console.error("Unable to log started activity", err);
      }
    };

    logStarted();
  }, [role, caseId]);

  useEffect(() => {
    const loadMyGroup = async () => {
      if (!caseId || role !== "STUDENT" || !caseData?.groupSubmissionEnabled) {
        setMyGroup(null);
        return;
      }

      try {
        setGroupLoading(true);
        const group = await caseService.getMyGroup(caseId);
        setMyGroup(group);
      } catch {
        setMyGroup(null);
      } finally {
        setGroupLoading(false);
      }
    };

    loadMyGroup();
  }, [caseId, role, caseData?.groupSubmissionEnabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (
      showExtraFields &&
      (!executiveSummary.trim() ||
        !situationAnalysis.trim() ||
        !rootCauseAnalysis.trim() ||
        !proposedSolution.trim() ||
        !implementationPlan.trim() ||
        !risksAndConstraints.trim() ||
        !conclusion.trim())
    ) {
      setError("Please complete all required submission sections.");
      return;
    }

    if (submissionType === "PDF" && !pdfFile) {
      setError("Please upload a PDF file before submitting.");
      return;
    }

    if (submissionType === "TEXT" && !submissionText.trim()) {
      setError("Please enter your answer before submitting.");
      return;
    }

    if (submissionType === "GITHUB_LINK" && !githubLink.trim()) {
      setError("Please enter your GitHub repository link before submitting.");
      return;
    }

    setLoading(true);

    try {
      await submissionService.submitSolution({
        caseId: Number(caseId),
        submissionType,
        solutionText:
          submissionType === "TEXT"
            ? submissionText.trim()
            : buildLegacySolutionText({
                executiveSummary,
                situationAnalysis,
                rootCauseAnalysis,
                proposedSolution,
                implementationPlan,
                risksAndConstraints,
                conclusion,
                githubLink,
              }),
        executiveSummary,
        situationAnalysis,
        rootCauseAnalysis,
        proposedSolution,
        implementationPlan,
        risksAndConstraints,
        conclusion,
        githubLink: submissionType === "GITHUB_LINK" ? githubLink.trim() : null,
        file: submissionType === "PDF" ? pdfFile : null,
        selfRating,
      });

      toast.success("Solution submitted successfully.");
      navigate(`/cases/${caseId}`);
    } catch (err) {
      console.error("Error submitting solution:", err);
      const status = err?.response?.status;
      const message =
        status === 409
          ? err?.response?.data?.message ||
            "Your submission has already been evaluated and cannot be changed."
          : err?.response?.data?.message || "Unable to submit solution. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/cases/${caseId}`);
  };

  const renderSubmissionInput = () => {
    if (submissionType === "GITHUB_LINK") {
      return (
        <input
          type="url"
          value={githubLink}
          onChange={(e) => setGithubLink(e.target.value)}
          placeholder="Enter your GitHub repository link..."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
          required
        />
      );
    }

    if (submissionType === "PDF") {
      return (
        <div className="space-y-2">
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            required
          />
          {pdfFile && <p className="text-xs text-slate-500 dark:text-slate-400">Selected file: {pdfFile.name}</p>}
        </div>
      );
    }

    return (
      <textarea
        rows={12}
        value={submissionText}
        onChange={(e) => setSubmissionText(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
        required
      />
    );
  };

  const submissionLabel =
    submissionType === "PDF"
      ? "PDF Upload"
      : submissionType === "GITHUB_LINK"
      ? "GitHub Repository Link"
      : "Written Answer";

  const submissionHint =
    submissionType === "PDF"
      ? "Upload a single PDF file for your submission."
      : submissionType === "GITHUB_LINK"
      ? "Share the repository link configured for this case."
      : "Provide your answer directly in the text area below.";

  if (role !== "STUDENT") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Submit Solution</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Complete the submission in the required format for this case.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {caseLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 h-5 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mb-2 h-3 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      )}

      {!caseLoading && caseData && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setShowReferencePanel((prev) => !prev)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Case Info</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{caseData.title}</p>
            </div>
            {showReferencePanel ? (
              <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-300" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-300" />
            )}
          </button>

          {showReferencePanel && (
            <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="grid gap-3 md:grid-cols-2">
                {caseData.dueDate && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    Due Date: {new Date(caseData.dueDate).toLocaleDateString()}
                  </div>
                )}
                {caseData.maxMarks != null && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    Max Marks: {caseData.maxMarks}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-4">
                {caseData.problemStatement && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Problem Statement</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseData.problemStatement}</p>
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

                {caseData.description && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Description</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseData.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {caseData?.groupSubmissionEnabled && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-200">
          {groupLoading ? (
            "Checking group..."
          ) : myGroup?.groupName ? (
            <>Submitting as group: <strong>{myGroup.groupName}</strong></>
          ) : (
            "This case uses group submission. You must be in an approved group to submit."
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{submissionLabel}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{submissionHint}</p>
          </div>
          {renderSubmissionInput()}
        </div>

        {showExtraFields && (
          <>
            <FormSection
              id="executiveSummary"
              label="Executive Summary"
              hint="Summarize your overall recommendation."
              helperText="Hint: ~150 words"
              value={executiveSummary}
              onChange={setExecutiveSummary}
            />

            <FormSection
              id="situationAnalysis"
              label="Situation Analysis"
              hint="What is the current business problem?"
              helperText="Hint: ~200 words"
              value={situationAnalysis}
              onChange={setSituationAnalysis}
            />

            <FormSection
              id="rootCauseAnalysis"
              label="Root Cause Analysis"
              hint="Why does this problem exist?"
              value={rootCauseAnalysis}
              onChange={setRootCauseAnalysis}
            />

            <FormSection
              id="proposedSolution"
              label="Proposed Solution"
              hint="What do you recommend?"
              value={proposedSolution}
              onChange={setProposedSolution}
            />

            <FormSection
              id="implementationPlan"
              label="Implementation Plan"
              hint="How would you execute this step by step?"
              value={implementationPlan}
              onChange={setImplementationPlan}
            />

            <FormSection
              id="risksAndConstraints"
              label="Risks & Constraints"
              hint="What could go wrong?"
              value={risksAndConstraints}
              onChange={setRisksAndConstraints}
            />

            <FormSection
              id="conclusion"
              label="Conclusion"
              hint="Key learnings and takeaways"
              helperText="Hint: ~100 words"
              value={conclusion}
              onChange={setConclusion}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Self Rating</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">How would you rate your own submission?</p>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selfRating}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={selfRating}
                onChange={(e) => setSelfRating(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || caseLoading || !caseData}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitSolutionPage;
