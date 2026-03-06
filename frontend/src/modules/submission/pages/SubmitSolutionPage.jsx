import { useContext, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import submissionService from "../services/submissionService";
import { AuthContext } from "../../../context/AuthContext";

function SubmitSolutionPage() {
  const { caseId } = useParams();
  const { role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (role !== "STUDENT") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!answerText.trim()) {
      setError("Answer is required.");
      return;
    }

    setLoading(true);

    try {
      await submissionService.submitSolution({
        caseId: Number(caseId),
        answerText,
      });

      toast.success("Solution submitted successfully.");
      navigate(`/cases/${caseId}`);
    } catch (err) {
      console.error("Error submitting solution:", err);
      const status = err?.response?.status;
      const message =
        status === 409
          ? "You have already submitted a solution for this case."
          : "Unable to submit solution. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/cases/${caseId}`);
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Submit Solution
          </h1>
          <p className="text-sm text-slate-500">
            Provide your response to this case study.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-1">
          <label
            htmlFor="answerText"
            className="text-sm font-medium text-slate-700"
          >
            Your Answer
          </label>
          <textarea
            id="answerText"
            rows={6}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            required
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
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

