import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Lock, Plus, Trash2 } from "lucide-react";
import caseService from "../services/caseService";
import { AuthContext } from "../../../context/AuthContext";

function normalizeQuestionList(questions) {
  const cleaned = questions.map((question) => question.trim()).filter(Boolean);
  return cleaned.length > 0 ? JSON.stringify(cleaned) : null;
}

function CaseCreatePage() {
  const { role } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("EASY");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [category, setCategory] = useState("PRODUCT");
  const [submissionType, setSubmissionType] = useState("TEXT");
  const [caseMaterial, setCaseMaterial] = useState(null);
  const [problemStatement, setProblemStatement] = useState("");
  const [keyQuestions, setKeyQuestions] = useState([""]);
  const [constraints, setConstraints] = useState("");
  const [evaluationRubric, setEvaluationRubric] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [referenceLinks, setReferenceLinks] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [courseId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (role === "STUDENT") {
    navigate("/dashboard");
    return null;
  }

  const updateQuestion = (index, value) => {
    setKeyQuestions((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const addQuestion = () => {
    setKeyQuestions((prev) => (prev.length >= 5 ? prev : [...prev, ""]));
  };

  const removeQuestion = (index) => {
    setKeyQuestions((prev) => {
      if (prev.length === 1) {
        return [""];
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title || !description || !difficulty || !courseId || !category || !submissionType) {
      setError("Please fill in all required fields.");
      return;
    }

    if (caseMaterial) {
      const allowedExtensions = [".pdf", ".csv", ".xlsx", ".xls", ".json", ".zip"];
      const lowerName = caseMaterial.name.toLowerCase();
      const validType = allowedExtensions.some((ext) => lowerName.endsWith(ext));
      if (!validType) {
        setError("Unsupported case material type. Allowed: PDF, CSV, XLSX, JSON, ZIP.");
        return;
      }
    }

    setLoading(true);

    try {
      await caseService.createCase({
        title,
        description,
        difficulty,
        dueDate: dueDate ? `${dueDate}T23:59:59` : null,
        maxMarks: maxMarks ? Number(maxMarks) : null,
        category,
        submissionType,
        caseMaterial,
        courseId,
        problemStatement: problemStatement.trim() || null,
        keyQuestions: normalizeQuestionList(keyQuestions),
        constraints: constraints.trim() || null,
        evaluationRubric: evaluationRubric.trim() || null,
        expectedOutcome: expectedOutcome.trim() || null,
        referenceLinks: referenceLinks.trim() || null,
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
      });

      toast.success("Case created successfully.");
      navigate("/cases");
    } catch (err) {
      console.error("Error creating case:", err);
      setError("Unable to create case. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/cases");
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Create Case Study
          </h1>
          <p className="text-sm text-slate-500">
            Define a new case study for your course.
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
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="difficulty" className="text-sm font-medium text-slate-700">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="dueDate" className="text-sm font-medium text-slate-700">
              Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="category" className="text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="SUPPLY_CHAIN">Supply Chain</option>
              <option value="FINTECH">FinTech</option>
              <option value="HEALTHCARE">Healthcare</option>
              <option value="AI_ML">AI / ML</option>
              <option value="PRODUCT">Product</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="submissionType" className="text-sm font-medium text-slate-700">
              Submission Type
            </label>
            <select
              id="submissionType"
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="TEXT">Text</option>
              <option value="PDF">PDF</option>
              <option value="GITHUB_LINK">GitHub Link</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="maxMarks" className="text-sm font-medium text-slate-700">
              Max Marks
            </label>
            <input
              id="maxMarks"
              type="number"
              min="0"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="caseMaterial" className="text-sm font-medium text-slate-700">
              Case Material (Optional)
            </label>
            <input
              id="caseMaterial"
              type="file"
              accept=".pdf,.csv,.xlsx,.xls,.json,.zip"
              onChange={(e) => setCaseMaterial(e.target.files?.[0] ?? null)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-800">Case Structure</h2>
            <p className="text-sm text-slate-500">
              Add context and guidance to help students approach the case.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="problemStatement" className="text-sm font-medium text-slate-700">
                Problem Statement
              </label>
              <textarea
                id="problemStatement"
                rows={4}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Describe the specific business problem students must solve"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Key Questions</label>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={keyQuestions.length >= 5}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Question
                </button>
              </div>

              {keyQuestions.map((question, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    placeholder={`Question ${index + 1}`}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50"
                    aria-label={`Remove question ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label htmlFor="constraints" className="text-sm font-medium text-slate-700">
                Constraints
              </label>
              <textarea
                id="constraints"
                rows={3}
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="Budget limits, time constraints, market conditions..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="evaluationRubric" className="text-sm font-medium text-slate-700">
                Evaluation Rubric
              </label>
              <textarea
                id="evaluationRubric"
                rows={3}
                value={evaluationRubric}
                onChange={(e) => setEvaluationRubric(e.target.value)}
                placeholder="Analysis 40%, Proposed Solution 40%, Presentation 20%"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label htmlFor="expectedOutcome" className="text-sm font-medium text-slate-700">
                  Expected Outcome (Faculty Only)
                </label>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  <Lock className="h-3 w-3" />
                  Hidden from students
                </span>
              </div>
              <textarea
                id="expectedOutcome"
                rows={3}
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                placeholder="What a strong answer should cover..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="referenceLinks" className="text-sm font-medium text-slate-700">
                  Reference Links
                </label>
                <input
                  id="referenceLinks"
                  type="text"
                  value={referenceLinks}
                  onChange={(e) => setReferenceLinks(e.target.value)}
                  placeholder="https://... (comma-separated)"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="estimatedHours" className="text-sm font-medium text-slate-700">
                  Estimated Hours
                </label>
                <input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>
          </div>
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
            {loading ? "Creating..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CaseCreatePage;
