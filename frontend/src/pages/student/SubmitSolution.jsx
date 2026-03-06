import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { submitSolution } from "../../api/submissionService";

function SubmitSolution() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [solutionText, setSolutionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!solutionText.trim()) {
      toast.error("Please enter your solution");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await submitSolution(parseInt(caseId), solutionText);
      toast.success("Solution submitted successfully");
      navigate("/student/cases");
    } catch (error) {
      console.error("Submission error:", error);
      
      if (error.response?.status === 409) {
        toast.error("You already submitted this case");
      } else {
        toast.error(error.response?.data?.message || "Failed to submit solution");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-slate-900 mb-6">
            Submit Case Solution
          </h1>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="solutionText" className="block text-sm font-medium text-slate-700 mb-2">
                Your Solution
              </label>
              <textarea
                id="solutionText"
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                placeholder="Enter your detailed solution here..."
                rows={12}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={isSubmitting}
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              {isSubmitting ? "Submitting..." : "Submit Solution"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SubmitSolution;
