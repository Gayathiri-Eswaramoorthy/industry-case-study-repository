import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Lock, Plus, Trash2 } from "lucide-react";
import caseService from "../services/caseService";
import { AuthContext } from "../../../context/AuthContext";
import { getUsers } from "../../../api/userService";

function parseKeyQuestions(value) {
  if (!value) {
    return [""];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => String(item ?? ""));
    }
  } catch (error) {
    console.error("Unable to parse key questions", error);
  }

  return [String(value)];
}

function CaseEditPage() {
  const { role } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { caseId } = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PRODUCT");
  const [submissionType, setSubmissionType] = useState("TEXT");
  const [difficulty, setDifficulty] = useState("EASY");
  const [caseStatus, setCaseStatus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [keyQuestions, setKeyQuestions] = useState([""]);
  const [constraints, setConstraints] = useState("");
  const [evaluationRubric, setEvaluationRubric] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [referenceLinks, setReferenceLinks] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [courseId, setCourseId] = useState(null);
  const [coIds, setCoIds] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [courseOutcomesLoading, setCourseOutcomesLoading] = useState(true);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [assignedFacultyIds, setAssignedFacultyIds] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-500";

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
        setSubmissionType(data.submissionType || "TEXT");
        setDifficulty(data.difficulty || "EASY");
        setCaseStatus(data.status || "");
        setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : "");
        setMaxMarks(typeof data.maxMarks === "number" ? String(data.maxMarks) : "");
        setProblemStatement(data.problemStatement || "");
        setKeyQuestions(parseKeyQuestions(data.keyQuestions));
        setConstraints(data.constraints || "");
        setEvaluationRubric(data.evaluationRubric || "");
        setExpectedOutcome(data.expectedOutcome || "");
        setReferenceLinks(data.referenceLinks || "");
        setEstimatedHours(
          typeof data.estimatedHours === "number" ? String(data.estimatedHours) : ""
        );
        setCourseId(data.courseId ?? null);
        setCoIds(Array.isArray(data.coIds) ? data.coIds : []);
      } catch (err) {
        console.error("Error loading case:", err);
        setError("Unable to load case. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [caseId]);

  useEffect(() => {
    if (!courseId) {
      setCourseOutcomes([]);
      setCourseOutcomesLoading(false);
      return;
    }

    const loadCourseOutcomes = async () => {
      try {
        setCourseOutcomesLoading(true);
        const data = await caseService.getCourseOutcomes(courseId);
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

  const loadAssignments = async () => {
    if (!caseId || role !== "ADMIN") {
      setAssignmentsLoading(false);
      return;
    }

    try {
      setAssignmentsLoading(true);
      const assignments = await caseService.getAssignments(caseId);
      setAssignedFacultyIds(
        Array.isArray(assignments)
          ? assignments.map((item) => item.facultyId).filter(Boolean)
          : []
      );
    } catch (err) {
      console.error("Error loading assignments:", err);
      setAssignedFacultyIds([]);
      toast.error("Unable to load faculty assignments.");
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    const loadFacultyOptions = async () => {
      if (role !== "ADMIN") {
        return;
      }

      try {
        const data = await getUsers({ page: 0, size: 100, role: "FACULTY" });
        setFacultyOptions(Array.isArray(data?.content) ? data.content : []);
      } catch (err) {
        console.error("Error loading faculty users:", err);
        setFacultyOptions([]);
        toast.error("Unable to load faculty users.");
      }
    };

    loadFacultyOptions();
  }, [role]);

  useEffect(() => {
    loadAssignments();
  }, [caseId, role]);

  useEffect(() => {
    if (role === "STUDENT") {
      navigate("/dashboard", { replace: true });
    }
  }, [role, navigate]);

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

  const toggleCoId = (coId) => {
    setCoIds((prev) =>
      prev.includes(coId) ? prev.filter((id) => id !== coId) : [...prev, coId]
    );
  };

  const toggleAssignedFaculty = (facultyId) => {
    setAssignedFacultyIds((prev) =>
      prev.includes(facultyId)
        ? prev.filter((id) => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  const saveAssignmentsMutation = useMutation({
    mutationFn: (facultyIds) => caseService.saveAssignments(caseId, facultyIds),
    onSuccess: async () => {
      toast.success("Faculty assignments saved");
      await loadAssignments();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to save faculty assignments."
      );
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title || !description || !difficulty || !courseId) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    try {
      await caseService.updateCase(
        caseId,
        {
          title,
          description,
          category,
          difficulty,
          submissionType,
          dueDate: dueDate || null,
          maxMarks: maxMarks ? Number(maxMarks) : null,
          courseId,
          coIds,
          problemStatement: problemStatement.trim() || null,
          keyQuestions: JSON.stringify(keyQuestions.filter((q) => q.trim())),
          constraints: constraints.trim() || null,
          evaluationRubric: evaluationRubric.trim() || null,
          expectedOutcome: expectedOutcome.trim() || null,
          referenceLinks: referenceLinks.trim() || null,
          estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        }
      );

      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["cases-stats"] });
      toast.success("Case updated successfully.");
      navigate("/cases");
    } catch (err) {
      console.error("Error updating case:", err);
      setError("Unable to update case. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setError(null);
    setSaving(true);

    try {
      await caseService.publishCase(caseId);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["cases-stats"] });
      toast.success("Case published successfully.");
      navigate("/cases");
    } catch (err) {
      console.error("Error publishing case:", err);
      setError("Unable to publish case. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/cases");
  };

  const isPublished = caseStatus === "PUBLISHED";

  if (role === "STUDENT") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Edit Case Study</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Update details for this case study.</p>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading case...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {isPublished && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
              This case is <strong>Published</strong>. Only Due Date, Max Marks, Evaluation Rubric, Reference Links, and Estimated Hours can be edited.
            </div>
          )}

          {!isPublished && caseStatus === "DRAFT" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200">
              This case is in <strong>Draft</strong>. All fields are editable.
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr),minmax(0,1fr)]">
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Main Details</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
                    <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required disabled={isPublished} />
                  </div>

                  <div>
                    <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                    <textarea id="description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} required disabled={isPublished} />
                  </div>

                  <div>
                    <label htmlFor="problemStatement" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Problem Statement</label>
                    <textarea id="problemStatement" rows={4} value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="Describe the specific business problem students must solve" className={inputClass} disabled={isPublished} />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Case Structure</h2>
                  <button
                    type="button"
                    onClick={addQuestion}
                    disabled={isPublished || keyQuestions.length >= 5}
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
                        disabled={isPublished}
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        disabled={isPublished}
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div>
                    <label htmlFor="constraints" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Constraints</label>
                    <textarea id="constraints" rows={3} value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Budget limits, time constraints, market conditions..." className={inputClass} disabled={isPublished} />
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
                    <textarea id="expectedOutcome" rows={3} value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} placeholder="What a strong answer should cover..." className={inputClass} disabled={isPublished} />
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Settings</h2>
                <div className="grid gap-4">
                  <div>
                    <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} disabled={isPublished}>
                      <option value="PRODUCT">Product</option>
                      <option value="SUPPLY_CHAIN">Supply Chain</option>
                      <option value="FINTECH">Fintech</option>
                      <option value="HEALTHCARE">Healthcare</option>
                      <option value="AI_ML">AI/ML</option>
                      <option value="FINANCE">Finance</option>
                      <option value="OPERATIONS">Operations</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="TECHNOLOGY">Technology</option>
                      <option value="STRATEGY">Strategy</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="submissionType" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Submission Type</label>
                    <select id="submissionType" value={submissionType} onChange={(e) => setSubmissionType(e.target.value)} className={inputClass} disabled={isPublished}>
                      <option value="TEXT">Text</option>
                      <option value="PDF">PDF</option>
                      <option value="GITHUB_LINK">GitHub Link</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="difficulty" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Difficulty</label>
                    <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass} disabled={isPublished}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
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
                    <label htmlFor="referenceLinks" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Reference Links</label>
                    <input id="referenceLinks" type="text" value={referenceLinks} onChange={(e) => setReferenceLinks(e.target.value)} placeholder="https://... (comma-separated)" className={inputClass} />
                  </div>

                  <div>
                    <label htmlFor="estimatedHours" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Estimated Hours</label>
                    <input id="estimatedHours" type="number" min="0" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3">
                  <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Course Outcomes</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Select COs this case study is mapped to.</p>
                </div>

                {courseOutcomesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    ))}
                  </div>
                ) : courseOutcomes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No course outcomes available for this course.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {courseOutcomes.map((co) => (
                      <label
                        key={co.id}
                        className={`flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-3 transition dark:border-slate-700 ${
                          isPublished
                            ? "cursor-not-allowed bg-slate-50 opacity-70 dark:bg-slate-800"
                            : "cursor-pointer hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={coIds.includes(co.id)}
                          onChange={() => toggleCoId(co.id)}
                          disabled={isPublished}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 disabled:cursor-not-allowed dark:border-slate-600"
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

              {role === "ADMIN" && (
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-3">
                    <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Assigned Faculty</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Select faculty members who can review this case.
                    </p>
                  </div>

                  {caseStatus === "DRAFT" && assignedFacultyIds.length === 0 && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
                      You must assign at least one faculty before publishing this case.
                    </div>
                  )}

                  {assignmentsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      ))}
                    </div>
                  ) : facultyOptions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No faculty users available.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {facultyOptions.map((faculty) => (
                          <label
                            key={faculty.id}
                            className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                          >
                            <input
                              type="checkbox"
                              checked={assignedFacultyIds.includes(faculty.id)}
                              onChange={() => toggleAssignedFaculty(faculty.id)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600"
                            />
                            <div className="text-sm">
                              <div className="font-medium text-slate-800 dark:text-slate-100">
                                {faculty.fullName}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400">
                                {faculty.email}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => saveAssignmentsMutation.mutate(assignedFacultyIds)}
                        disabled={saveAssignmentsMutation.isPending}
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                      >
                        {saveAssignmentsMutation.isPending ? "Saving..." : "Save Assignments"}
                      </button>
                    </div>
                  )}
                </section>
              )}
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
            {role === "ADMIN" && !isPublished && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Publishing..." : "Publish Case"}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CaseEditPage;
