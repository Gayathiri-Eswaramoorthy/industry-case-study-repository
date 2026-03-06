import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import caseService from "../services/caseService";
import { AuthContext } from "../../../context/AuthContext";

function CaseEditPage() {
  const { role } = useContext(AuthContext);
  const navigate = useNavigate();
  const { caseId } = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PRODUCT");
  const [difficulty, setDifficulty] = useState("EASY");
  const [caseStatus, setCaseStatus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [courseId, setCourseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (role === "STUDENT") {
    navigate("/dashboard");
    return null;
  }

  useEffect(() => {
    const loadCase = async () => {
      if (!caseId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await caseService.getCaseById(caseId);

        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "PRODUCT");
        setDifficulty(data.difficulty || "EASY");
        setCaseStatus(data.status || "");
        setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : "");
        setMaxMarks(
          typeof data.maxMarks === "number" ? String(data.maxMarks) : ""
        );
        setCourseId(data.courseId ?? null);
      } catch (err) {
        console.error("Error loading case:", err);
        setError("Unable to load case. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [caseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title || !description || !difficulty || !courseId) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    try {
      await caseService.updateCase(caseId, {
        title,
        description,
        category,
        difficulty,
        dueDate: dueDate || null,
        maxMarks: maxMarks ? Number(maxMarks) : null,
        courseId,
      });

      toast.success("Case updated successfully.");
      navigate("/cases");
    } catch (err) {
      console.error("Error updating case:", err);
      setError("Unable to update case. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/cases");
  };

  const isPublished = caseStatus === "PUBLISHED";

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Edit Case Study
          </h1>
          <p className="text-sm text-slate-500">
            Update details for this case study.
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-8 text-center text-sm text-slate-500">
          Loading case...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
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
              disabled={isPublished}
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
              disabled={isPublished}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                disabled={isPublished}
              >
                <option value="PRODUCT">Product</option>
                <option value="SUPPLY_CHAIN">Supply Chain</option>
                <option value="FINTECH">Fintech</option>
                <option value="HEALTHCARE">Healthcare</option>
                <option value="AI_ML">AI/ML</option>
              </select>
            </div>

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
                disabled={isPublished}
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
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CaseEditPage;
