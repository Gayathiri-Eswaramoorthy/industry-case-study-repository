import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import caseService from "../services/caseService";
import { AuthContext } from "../../../context/AuthContext";

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
  const [courseId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (role === "STUDENT") {
    navigate("/dashboard");
    return null;
  }

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
          <label
            htmlFor="title"
            className="text-sm font-medium text-slate-700"
          >
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
          <label
            htmlFor="description"
            className="text-sm font-medium text-slate-700"
          >
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
            <label
              htmlFor="difficulty"
              className="text-sm font-medium text-slate-700"
            >
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
            <label
              htmlFor="dueDate"
              className="text-sm font-medium text-slate-700"
            >
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
            <label
              htmlFor="category"
              className="text-sm font-medium text-slate-700"
            >
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
            <label
              htmlFor="submissionType"
              className="text-sm font-medium text-slate-700"
            >
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
            <label
              htmlFor="maxMarks"
              className="text-sm font-medium text-slate-700"
            >
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
            <label
              htmlFor="caseMaterial"
              className="text-sm font-medium text-slate-700"
            >
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
