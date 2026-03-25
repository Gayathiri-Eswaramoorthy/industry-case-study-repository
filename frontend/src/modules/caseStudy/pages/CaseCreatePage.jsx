import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Lock, Plus, Trash2 } from "lucide-react";
import caseService from "../services/caseService";
import { AuthContext } from "../../../context/AuthContext";
import TagInput from "../../../components/TagInput";

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
  const [groupSubmissionEnabled, setGroupSubmissionEnabled] = useState(false);
  const [maxGroupSize, setMaxGroupSize] = useState("");
  const [caseMaterial, setCaseMaterial] = useState(null);
  const [caseDocument, setCaseDocument] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [realCompanyName, setRealCompanyName] = useState("");
  const [isDisguised, setIsDisguised] = useState(false);
  const [industry, setIndustry] = useState("");
  const [geographicRegion, setGeographicRegion] = useState("");
  const [protagonistRole, setProtagonistRole] = useState("");
  const [publicationYear, setPublicationYear] = useState("");
  const [sourceAttribution, setSourceAttribution] = useState("");
  const [caseNarrative, setCaseNarrative] = useState("");
  const [companyBackground, setCompanyBackground] = useState("");
  const [industryContext, setIndustryContext] = useState("");
  const [decisionPoint, setDecisionPoint] = useState("");
  const [teachingNotesText, setTeachingNotesText] = useState("");
  const [teachingNotesPdf, setTeachingNotesPdf] = useState(null);
  const [problemStatement, setProblemStatement] = useState("");
  const [keyQuestions, setKeyQuestions] = useState([""]);
  const [constraints, setConstraints] = useState("");
  const [evaluationRubric, setEvaluationRubric] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [referenceLinks, setReferenceLinks] = useState("");
  const [tags, setTags] = useState([]);
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

    if (
      !title.trim() ||
      !description.trim() ||
      !difficulty ||
      !courseId ||
      !category ||
      !submissionType
    ) {
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

    let parsedDueDate = null;
    if (dueDate) {
      const d = new Date(`${dueDate}T23:59:59`);
      if (d > new Date()) {
        parsedDueDate = `${dueDate}T23:59:59`;
      } else {
        setError("Due date must be in the future.");
        return;
      }
    }

    const parsedMaxMarks = maxMarks && Number(maxMarks) >= 1 ? Number(maxMarks) : null;
    const cleanedQuestions = keyQuestions.map((q) => q.trim()).filter(Boolean);
    const parsedKeyQuestions =
      cleanedQuestions.length > 0 ? JSON.stringify(cleanedQuestions) : null;

    setLoading(true);

    try {
      const createdCase = await caseService.createCase({
        title: title.trim(),
        description: description.trim(),
        difficulty,
        dueDate: parsedDueDate,
        maxMarks: parsedMaxMarks,
        category,
        submissionType,
        groupSubmissionEnabled,
        maxGroupSize: groupSubmissionEnabled && maxGroupSize ? Number(maxGroupSize) : null,
        caseMaterial,
        courseId: Number(courseId),
        companyName: companyName.trim() || null,
        realCompanyName: realCompanyName.trim() || null,
        isDisguised,
        industry: industry.trim() || null,
        geographicRegion: geographicRegion.trim() || null,
        protagonistRole: protagonistRole.trim() || null,
        publicationYear: publicationYear ? Number(publicationYear) : null,
        sourceAttribution: sourceAttribution.trim() || null,
        caseNarrative: caseNarrative.trim() || null,
        companyBackground: companyBackground.trim() || null,
        industryContext: industryContext.trim() || null,
        decisionPoint: decisionPoint.trim() || null,
        teachingNotesText: teachingNotesText.trim() || null,
        problemStatement: problemStatement.trim() || null,
        keyQuestions: parsedKeyQuestions,
        constraints: constraints.trim() || null,
        evaluationRubric: evaluationRubric.trim() || null,
        expectedOutcome: expectedOutcome.trim() || null,
        referenceLinks: referenceLinks.trim() || null,
        tags,
        estimatedHours:
          estimatedHours && Number(estimatedHours) > 0 ? Number(estimatedHours) : null,
        coIds: coIds.length > 0 ? coIds : [],
      });

      if (caseDocument && createdCase?.id) {
        try {
          await caseService.uploadCaseDocument(createdCase.id, caseDocument);
        } catch (err) {
          console.error("Failed to upload case document:", err);
          toast.error("Case created but document upload failed. You can re-upload from the edit page.");
        }
      }

      if (teachingNotesPdf && createdCase?.id) {
        try {
          await caseService.uploadTeachingNotes(createdCase.id, teachingNotesPdf);
        } catch (err) {
          toast.error("Case created but teaching notes PDF upload failed.");
        }
      }

      toast.success("Case created successfully.");
      navigate("/cases");
    } catch (err) {
      console.error("Error creating case:", err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || null;
      setError(msg || "Unable to create case. Please try again.");
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

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
                Case Metadata
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isDisguised"
                    checked={isDisguised}
                    onChange={(e) => setIsDisguised(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label
                    htmlFor="isDisguised"
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Company name is disguised
                  </label>
                </div>
                {isDisguised && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Real Company Name (faculty only)
                    </label>
                    <input
                      type="text"
                      value={realCompanyName}
                      onChange={(e) => setRealCompanyName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. E-commerce, Healthcare"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Geographic Region
                  </label>
                  <input
                    type="text"
                    value={geographicRegion}
                    onChange={(e) => setGeographicRegion(e.target.value)}
                    placeholder="e.g. Southeast Asia, India"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Protagonist Role
                  </label>
                  <input
                    type="text"
                    value={protagonistRole}
                    onChange={(e) => setProtagonistRole(e.target.value)}
                    placeholder="e.g. Chief Marketing Officer"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                    placeholder="e.g. 2024"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Source Attribution
                  </label>
                  <input
                    type="text"
                    value={sourceAttribution}
                    onChange={(e) => setSourceAttribution(e.target.value)}
                    placeholder="e.g. Harvard Business Review, 2024"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
                Case Content
              </h2>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                Use these fields if you are not uploading a PDF. Leave blank if a PDF document is attached.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Company Background
                  </label>
                  <textarea
                    rows={3}
                    value={companyBackground}
                    onChange={(e) => setCompanyBackground(e.target.value)}
                    placeholder="Brief history and context of the company..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Industry Context
                  </label>
                  <textarea
                    rows={3}
                    value={industryContext}
                    onChange={(e) => setIndustryContext(e.target.value)}
                    placeholder="Market conditions, competitive landscape..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Decision Point
                  </label>
                  <textarea
                    rows={3}
                    value={decisionPoint}
                    onChange={(e) => setDecisionPoint(e.target.value)}
                    placeholder="The key decision the protagonist must make..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Case Narrative
                  </label>
                  <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                    Full case text. Only needed if not uploading a PDF.
                  </p>
                  <textarea
                    rows={10}
                    value={caseNarrative}
                    onChange={(e) => setCaseNarrative(e.target.value)}
                    placeholder="Write the full case narrative here..."
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/20">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Teaching Notes
                </h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  Faculty Only - Hidden from students
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Teaching Notes Text
                  </label>
                  <textarea
                    rows={5}
                    value={teachingNotesText}
                    onChange={(e) => setTeachingNotesText(e.target.value)}
                    placeholder="Discussion guide, suggested answers, grading hints..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Teaching Notes PDF (optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setTeachingNotesPdf(e.target.files?.[0] ?? null)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  />
                  {teachingNotesPdf && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{teachingNotesPdf.name}</p>
                  )}
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

                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={groupSubmissionEnabled}
                      onChange={(e) => {
                        setGroupSubmissionEnabled(e.target.checked);
                        if (!e.target.checked) {
                          setMaxGroupSize("");
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Allow Group Submissions
                  </label>
                  {groupSubmissionEnabled && (
                    <div className="mt-3">
                      <label htmlFor="maxGroupSize" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Max Group Size
                      </label>
                      <input
                        id="maxGroupSize"
                        type="number"
                        min="2"
                        value={maxGroupSize}
                        onChange={(e) => setMaxGroupSize(e.target.value)}
                        placeholder="No limit"
                        className={inputClass}
                      />
                    </div>
                  )}
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
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Tags <span className="text-slate-400">(max 10)</span>
                  </label>
                  <TagInput tags={tags} onChange={setTags} />
                  <p className="mt-1 text-xs text-slate-400">Press Enter or comma to add a tag</p>
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

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Case Document (PDF)
                  </label>
                  <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                    The main PDF that students will read and download.
                  </p>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setCaseDocument(e.target.files?.[0] ?? null)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  />
                  {caseDocument && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{caseDocument.name}</p>
                  )}
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
