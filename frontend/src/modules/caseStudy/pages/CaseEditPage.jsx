import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Lock, Plus, Trash2 } from "lucide-react";
import caseService from "../services/caseService";
import { AuthContext } from "../../../context/AuthContext";
import { getUsers } from "../../../api/userService";
import TagInput from "../../../components/TagInput";

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

function peerReviewBadgeClass(status) {
  if (status === "COMPLETED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300";
  }
  if (status === "ACCEPTED") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-300";
  }
  if (status === "DECLINED") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300";
  }
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300";
}

function CaseEditPage() {
  const { role, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { caseId } = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PRODUCT");
  const [submissionType, setSubmissionType] = useState("TEXT");
  const [groupSubmissionEnabled, setGroupSubmissionEnabled] = useState(false);
  const [maxGroupSize, setMaxGroupSize] = useState("");
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
  const [tags, setTags] = useState([]);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [courseId, setCourseId] = useState(null);
  const [caseItem, setCaseItem] = useState(null);
  const [exhibits, setExhibits] = useState([]);
  const [exhibitForm, setExhibitForm] = useState({ title: "", description: "", file: null });
  const [uploadingExhibit, setUploadingExhibit] = useState(false);
  const [coIds, setCoIds] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [courseOutcomesLoading, setCourseOutcomesLoading] = useState(true);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [assignedFacultyIds, setAssignedFacultyIds] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showPeerReviewModal, setShowPeerReviewModal] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-500";

  const caseOwnerId = Number(caseItem?.createdBy);
  const currentUserId = Number(user?.id);
  const isCaseOwner =
    Number.isFinite(caseOwnerId) &&
    Number.isFinite(currentUserId) &&
    caseOwnerId === currentUserId;

  const canRequestPeerReview =
    role === "FACULTY" &&
    caseStatus === "DRAFT" &&
    isCaseOwner;
  const canViewPeerReviews =
    role === "ADMIN" || (role === "FACULTY" && isCaseOwner);

  const { data: reviewerOptions = [] } = useQuery({
    queryKey: ["faculty-reviewers", caseId, user?.id, canRequestPeerReview],
    enabled: canRequestPeerReview,
    queryFn: async () => {
      const data = await getUsers({ page: 0, size: 100, role: "FACULTY" });
      const list = Array.isArray(data?.content) ? data.content : [];
      return list.filter((item) => item.id !== user?.id);
    },
  });

  const {
    data: casePeerReviews = [],
    isLoading: loadingCasePeerReviews,
  } = useQuery({
    queryKey: ["case-peer-reviews", caseId],
    enabled: Boolean(caseId) && canViewPeerReviews,
    queryFn: async () => {
      const data = await caseService.getCasePeerReviews(caseId);
      return Array.isArray(data) ? data : [];
    },
  });

  useEffect(() => {
    const loadCase = async () => {
      if (!caseId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await caseService.getCaseById(caseId);
        setCaseItem(data);

        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "PRODUCT");
        setSubmissionType(data.submissionType || "TEXT");
        setGroupSubmissionEnabled(Boolean(data.groupSubmissionEnabled));
        setMaxGroupSize(data.maxGroupSize != null ? String(data.maxGroupSize) : "");
        setDifficulty(data.difficulty || "EASY");
        setCaseStatus(data.status || "");
        setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : "");
        setMaxMarks(typeof data.maxMarks === "number" ? String(data.maxMarks) : "");
        setCompanyName(data.companyName || "");
        setRealCompanyName(data.realCompanyName || "");
        setIsDisguised(data.isDisguised || false);
        setIndustry(data.industry || "");
        setGeographicRegion(data.geographicRegion || "");
        setProtagonistRole(data.protagonistRole || "");
        setPublicationYear(data.publicationYear ? String(data.publicationYear) : "");
        setSourceAttribution(data.sourceAttribution || "");
        setCaseNarrative(data.caseNarrative || "");
        setCompanyBackground(data.companyBackground || "");
        setIndustryContext(data.industryContext || "");
        setDecisionPoint(data.decisionPoint || "");
        setTeachingNotesText(data.teachingNotesText || "");
        setProblemStatement(data.problemStatement || "");
        setKeyQuestions(parseKeyQuestions(data.keyQuestions));
        setConstraints(data.constraints || "");
        setEvaluationRubric(data.evaluationRubric || "");
        setExpectedOutcome(data.expectedOutcome || "");
        setReferenceLinks(data.referenceLinks || "");
        setTags(Array.isArray(data.tags) ? data.tags : []);
        setEstimatedHours(
          typeof data.estimatedHours === "number" ? String(data.estimatedHours) : ""
        );
        setCourseId(data.courseId ?? null);
        setCoIds(Array.isArray(data.coIds) ? data.coIds : []);
        setExhibits(Array.isArray(data.exhibits) ? data.exhibits : []);
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

  useEffect(() => {
    if (!showPeerReviewModal) {
      return;
    }
    if (!selectedReviewerId && reviewerOptions.length > 0) {
      setSelectedReviewerId(String(reviewerOptions[0].id));
    }
  }, [showPeerReviewModal, selectedReviewerId, reviewerOptions]);

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

  const requestPeerReviewMutation = useMutation({
    mutationFn: (reviewerFacultyId) =>
      caseService.requestPeerReview(caseId, { reviewerFacultyId }),
    onSuccess: async () => {
      toast.success("Peer review requested");
      setShowPeerReviewModal(false);
      setSelectedReviewerId("");
      await queryClient.invalidateQueries({ queryKey: ["case-peer-reviews", caseId] });
      await queryClient.invalidateQueries({ queryKey: ["case-details", caseId] });
      await queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to request peer review."
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
          groupSubmissionEnabled,
          maxGroupSize: groupSubmissionEnabled && maxGroupSize ? Number(maxGroupSize) : null,
          dueDate: dueDate || null,
          maxMarks: maxMarks ? Number(maxMarks) : null,
          courseId,
          coIds,
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
          keyQuestions: JSON.stringify(keyQuestions.filter((q) => q.trim())),
          constraints: constraints.trim() || null,
          evaluationRubric: evaluationRubric.trim() || null,
          expectedOutcome: expectedOutcome.trim() || null,
          referenceLinks: referenceLinks.trim() || null,
          tags,
          estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        }
      );

      if (caseDocument) {
        try {
          await caseService.uploadCaseDocument(caseId, caseDocument);
          toast.success("Case document uploaded.");
        } catch (err) {
          toast.error("Case saved but document upload failed.");
        }
      }

      if (teachingNotesPdf) {
        try {
          await caseService.uploadTeachingNotes(caseId, teachingNotesPdf);
          toast.success("Teaching notes PDF uploaded.");
        } catch (err) {
          toast.error("Case saved but teaching notes PDF upload failed.");
        }
      }

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

  const handleRequestPeerReview = () => {
    const reviewerId = Number(selectedReviewerId);
    if (!reviewerId) {
      toast.error("Please select a faculty reviewer.");
      return;
    }
    requestPeerReviewMutation.mutate(reviewerId);
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
                      disabled={isPublished}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isDisguised"
                      checked={isDisguised}
                      onChange={(e) => setIsDisguised(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                      disabled={isPublished}
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
                        disabled={isPublished}
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
                      disabled={isPublished}
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
                      disabled={isPublished}
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
                      disabled={isPublished}
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
                      disabled={isPublished}
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
                      disabled={isPublished}
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
                      disabled={isPublished}
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
                      disabled={isPublished}
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
                      disabled={isPublished}
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
                      disabled={isPublished}
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
                      disabled={isPublished}
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
                      disabled={isPublished}
                    />
                    {teachingNotesPdf && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{teachingNotesPdf.name}</p>
                    )}
                    {caseItem?.hasTeachingNotes && caseItem?.teachingNotesOriginalName && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        PDF uploaded: {caseItem.teachingNotesOriginalName}
                      </p>
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
                        disabled={caseStatus !== "DRAFT"}
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
                          disabled={caseStatus !== "DRAFT"}
                        />
                      </div>
                    )}
                    {caseStatus !== "DRAFT" && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Group submission settings can only be changed while the case is in DRAFT.
                      </p>
                    )}
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
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Tags <span className="text-slate-400">(max 10)</span>
                    </label>
                    <TagInput tags={tags} onChange={setTags} disabled={false} />
                    <p className="mt-1 text-xs text-slate-400">Press Enter or comma to add a tag</p>
                  </div>

                  <div>
                    <label htmlFor="estimatedHours" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Estimated Hours</label>
                    <input id="estimatedHours" type="number" min="0" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} className={inputClass} />
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
                    {caseItem?.hasDocument && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Document uploaded: {caseItem.caseDocumentOriginalName}
                      </p>
                    )}
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

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
              Exhibits
            </h2>

            {exhibits.length > 0 && (
              <div className="mb-4 space-y-2">
                {exhibits.map((exhibit) => (
                  <div
                    key={exhibit.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {exhibit.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {exhibit.originalFileName}
                        {exhibit.fileType && (
                          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase dark:bg-slate-800">
                            {exhibit.fileType}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Delete this exhibit?")) return;
                        try {
                          await caseService.deleteExhibit(caseId, exhibit.id);
                          setExhibits((prev) => prev.filter((e) => e.id !== exhibit.id));
                          toast.success("Exhibit deleted.");
                        } catch {
                          toast.error("Failed to delete exhibit.");
                        }
                      }}
                      className="ml-3 shrink-0 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {exhibits.length === 0 && (
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                No exhibits attached yet.
              </p>
            )}

            <div className="space-y-3 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Add Exhibit
              </p>
              <input
                type="text"
                placeholder="Title (required)"
                value={exhibitForm.title}
                onChange={(e) => setExhibitForm((prev) => ({ ...prev, title: e.target.value }))}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={exhibitForm.description}
                onChange={(e) =>
                  setExhibitForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className={inputClass}
              />
              <input
                type="file"
                onChange={(e) =>
                  setExhibitForm((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
              <button
                type="button"
                disabled={!exhibitForm.title.trim() || !exhibitForm.file || uploadingExhibit}
                onClick={async () => {
                  setUploadingExhibit(true);
                  try {
                    const newExhibit = await caseService.uploadExhibit(
                      caseId,
                      exhibitForm.file,
                      exhibitForm.title,
                      exhibitForm.description
                    );
                    setExhibits((prev) => [...prev, newExhibit]);
                    setExhibitForm({ title: "", description: "", file: null });
                    toast.success("Exhibit added.");
                  } catch {
                    toast.error("Failed to upload exhibit.");
                  } finally {
                    setUploadingExhibit(false);
                  }
                }}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              >
                {uploadingExhibit ? "Uploading..." : "Add Exhibit"}
              </button>
            </div>
          </section>

          {(loadingCasePeerReviews || casePeerReviews.length > 0) && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
                Peer Reviews
              </h2>
              {loadingCasePeerReviews ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {casePeerReviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {review.reviewerName}
                        </p>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${peerReviewBadgeClass(review.status)}`}>
                          {review.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Requested: {review.requestedAt ? new Date(review.requestedAt).toLocaleDateString() : "-"}
                        {review.completedAt ? ` | Completed: ${new Date(review.completedAt).toLocaleDateString()}` : ""}
                      </p>
                      {review.feedback && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.feedback}</p>
                      )}
                      {review.rating != null && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Rating: {review.rating}/5
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="sticky bottom-4 flex justify-end gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {canRequestPeerReview && (
              <button
                type="button"
                onClick={() => setShowPeerReviewModal(true)}
                className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-500/40 dark:bg-violet-950/30 dark:text-violet-300"
              >
                Request Peer Review
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            {(role === "ADMIN" || (role === "FACULTY" && isCaseOwner)) && !isPublished && (
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

      {showPeerReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Request Peer Review</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Invite another faculty member to review this case before publishing.
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Reviewer
              </label>
              <select
                value={selectedReviewerId}
                onChange={(e) => setSelectedReviewerId(e.target.value)}
                className={`${inputClass} text-black dark:text-black`}
              >
                <option value="" className="bg-white text-black">Select faculty</option>
                {reviewerOptions.map((faculty) => (
                  <option key={faculty.id} value={faculty.id} className="bg-white text-black">
                    {faculty.fullName || faculty.name || faculty.email || `Faculty #${faculty.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPeerReviewModal(false);
                  setSelectedReviewerId("");
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestPeerReview}
                disabled={requestPeerReviewMutation.isPending}
                className="rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {requestPeerReviewMutation.isPending ? "Requesting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseEditPage;
