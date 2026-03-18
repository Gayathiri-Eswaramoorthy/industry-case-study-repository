import { useContext, useEffect, useState } from "react";
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
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coIds, setCoIds] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [courseOutcomesLoading, setCourseOutcomesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";

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

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCoursesLoading(true);
        const data = await caseService.getCourses();
        const nextCourses = Array.isArray(data) ? data : [];
        setCourses(nextCourses);

        if (nextCourses.length > 0) {
          setCourseId((prev) => prev || String(nextCourses[0].id));
        }
      } catch (err) {
        console.error("Error loading courses:", err);
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    if (!courseId) {
      setCourseOutcomes([]);
      setCoIds([]);
      setCourseOutcomesLoading(false);
      return;
    }

    const loadCourseOutcomes = async () => {
      try {
        setCourseOutcomesLoading(true);
        setCoIds([]);
        const data = await caseService.getCourseOutcomes(Number(courseId));
        setCourseOutcomes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading course outcomes:", err);
        setCourseOutcomes([]);
      } finally {
        setCourseOutcomesLoading(false);
      }
    };

    loadCourseOutcomes();
  }, [courseId]);

  useEffect(() => {
    if (role === "STUDENT") {
      navigate("/dashboard", { replace: true });
    }
  }, [role, navigate]);

  const toggleCoId = (coId) => {
    setCoIds((prev) =>
      prev.includes(coId) ? prev.filter((id) => id !== coId) : [...prev, coId]
    );
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
        courseId: Number(courseId),
        problemStatement: problemStatement.trim() || null,
        keyQuestions: normalizeQuestionList(keyQuestions),
        constraints: constraints.trim() || null,
        evaluationRubric: evaluationRubric.trim() || null,
        expectedOutcome: expectedOutcome.trim() || null,
        referenceLinks: referenceLinks.trim() || null,
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        coIds,
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

  if (role === "STUDENT") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Create Case Study</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Define a new case study for your course.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr),minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Main Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
                  <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
                </div>

                <div>
                  <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                  <textarea id="description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} required />
                </div>

                <div>
                  <label htmlFor="problemStatement" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Problem Statement</label>
                  <textarea id="problemStatement" rows={4} value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="Describe the specific business problem students must solve" className={inputClass} />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Case Structure</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={keyQuestions.length >= 5}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Question
                </button>
              </div>

              <div className="space-y-4">
                {keyQuestions.map((question, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder={`Question ${index + 1}`}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="inline-flex items-center rounded-md border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-label={`Remove question ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div>
                  <label htmlFor="constraints" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Constraints</label>
                  <textarea id="constraints" rows={3} value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Budget limits, time constraints, market conditions..." className={inputClass} />
                </div>

                <div>
                  <label htmlFor="evaluationRubric" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Evaluation Rubric</label>
                  <textarea id="evaluationRubric" rows={3} value={evaluationRubric} onChange={(e) => setEvaluationRubric(e.target.value)} placeholder="Analysis 40%, Proposed Solution 40%, Presentation 20%" className={inputClass} />
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <label htmlFor="expectedOutcome" className="text-sm font-medium text-slate-700 dark:text-slate-200">Expected Outcome (Faculty Only)</label>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <Lock className="h-3 w-3" />
                      Hidden from students
                    </span>
                  </div>
                  <textarea id="expectedOutcome" rows={3} value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} placeholder="What a strong answer should cover..." className={inputClass} />
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Settings</h2>
              <div className="grid gap-4">
                <div>
                  <label htmlFor="courseId" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Course</label>
                  <select
                    id="courseId"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className={inputClass}
                    disabled={coursesLoading || courses.length === 0}
                    required
                  >
                    {coursesLoading ? (
                      <option value="">Loading courses...</option>
                    ) : courses.length === 0 ? (
                      <option value="">No courses available</option>
                    ) : (
                      courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.courseCode} - {course.courseName}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="difficulty" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Difficulty</label>
                  <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass}>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
                  <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                    <option value="SUPPLY_CHAIN">Supply Chain</option>
                    <option value="FINTECH">FinTech</option>
                    <option value="HEALTHCARE">Healthcare</option>
                    <option value="AI_ML">AI / ML</option>
                    <option value="PRODUCT">Product</option>
                    <option value="FINANCE">Finance</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="TECHNOLOGY">Technology</option>
                    <option value="STRATEGY">Strategy</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="submissionType" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Submission Type</label>
                  <select id="submissionType" value={submissionType} onChange={(e) => setSubmissionType(e.target.value)} className={inputClass}>
                    <option value="TEXT">Text</option>
                    <option value="PDF">PDF</option>
                    <option value="GITHUB_LINK">GitHub Link</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dueDate" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Due Date</label>
                  <input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="maxMarks" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Max Marks</label>
                  <input id="maxMarks" type="number" min="0" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="estimatedHours" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Estimated Hours</label>
                  <input id="estimatedHours" type="number" min="0" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="referenceLinks" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Reference Links</label>
                  <input id="referenceLinks" type="text" value={referenceLinks} onChange={(e) => setReferenceLinks(e.target.value)} placeholder="https://... (comma-separated)" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="caseMaterial" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Case Material (Optional)</label>
                  <input
                    id="caseMaterial"
                    type="file"
                    accept=".pdf,.csv,.xlsx,.xls,.json,.zip"
                    onChange={(e) => setCaseMaterial(e.target.files?.[0] ?? null)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Course Outcomes</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Select COs this case study assesses.</p>
              </div>

              {courseOutcomesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  ))}
                </div>
              ) : courseOutcomes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {courseId ? "No course outcomes available for the selected course." : "Select a course to view course outcomes."}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {courseOutcomes.map((co) => (
                    <label
                      key={co.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                    >
                      <input
                        type="checkbox"
                        checked={coIds.includes(co.id)}
                        onChange={() => toggleCoId(co.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-slate-800 dark:text-slate-100">{co.code}</div>
                        <div className="text-slate-500 dark:text-slate-400">{co.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="sticky bottom-4 flex justify-end gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            {loading ? "Creating..." : "Save Case"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CaseCreatePage;
