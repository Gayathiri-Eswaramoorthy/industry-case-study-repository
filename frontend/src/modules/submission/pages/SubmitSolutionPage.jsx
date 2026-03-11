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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{label}</h2>
          {helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
        </div>
        <span className="text-xs text-slate-500">{countWords(value)} words</span>
      </div>
      <textarea
        id={id}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const keyQuestions = useMemo(() => parseKeyQuestions(caseData?.keyQuestions), [caseData?.keyQuestions]);
  const submissionType = caseData?.submissionType ?? "TEXT";
  const showExtraFields = submissionType === "TEXT" || submissionType === "GITHUB_LINK";

  if (role !== "STUDENT") {
    return <Navigate to="/dashboard" replace />;
  }

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
          ? "You have already submitted a solution for this case."
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
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
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            required
          />
          {pdfFile && <p className="text-xs text-slate-500">Selected file: {pdfFile.name}</p>}
        </div>
      );
    }

    return (
      <textarea
        rows={12}
        value={submissionText}
        onChange={(e) => setSubmissionText(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
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

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Submit Solution</h1>
          <p className="text-sm text-slate-500">
            Complete the submission in the format required for this case study.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {caseLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-5 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-200" />
          <div className="mb-2 h-3 w-5/6 animate-pulse rounded bg-slate-200" />
        </div>
      )}

      {!caseLoading && caseData && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowReferencePanel((prev) => !prev)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div>
              <h2 className="text-base font-semibold text-slate-800">Case Reference Panel</h2>
              <p className="text-sm text-slate-500">{caseData.title}</p>
            </div>
            {showReferencePanel ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {showReferencePanel && (
            <div className="border-t border-slate-200 px-5 py-4">
              <div className="space-y-4">
                {caseData.problemStatement && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Problem Statement</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {caseData.problemStatement}
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

                {caseData.evaluationRubric && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Evaluation Rubric</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {caseData.evaluationRubric}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-800">{submissionLabel}</h2>
            <p className="mt-1 text-xs text-slate-500">{submissionHint}</p>
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

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Self Rating</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    How would you rate your own submission?
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{selfRating}</span>
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

        <div className="flex justify-end gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || caseLoading || !caseData}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitSolutionPage;
