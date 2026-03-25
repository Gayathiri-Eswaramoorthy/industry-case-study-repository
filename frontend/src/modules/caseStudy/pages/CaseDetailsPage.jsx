import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import caseService from "../services/caseService";
import submissionService from "../../submission/services/submissionService";
import { AuthContext } from "../../../context/AuthContext";
import StatusBadge from "../../../components/StatusBadge";
import AttemptTimeline from "../../../components/AttemptTimeline";

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

function splitLinks(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatLabel(value) {
  return String(value).replaceAll("_", " ");
}

function isMemberLeader(member) {
  return Boolean(member?.isLeader ?? member?.leader);
}

function CaseDetailsPage() {
  const { caseId } = useParams();
  const { role, user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const queryUserId = user?.id ?? null;

  const [mySubmission, setMySubmission] = useState(null);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const [coScores, setCoScores] = useState([]);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [showReevalForm, setShowReevalForm] = useState(false);
  const [reevalReason, setReevalReason] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinGroupIdInput, setJoinGroupIdInput] = useState("");

  const {
    data: caseItem,
    isLoading: loading,
    isError: isCaseError,
    error: caseError,
  } = useQuery({
    queryKey: ["case-details", caseId, queryUserId],
    enabled: Boolean(caseId),
    queryFn: () => caseService.getCaseById(caseId),
  });

  const { data: caseCourseOutcomes = [] } = useQuery({
    queryKey: ["course-outcomes-for-case-details", caseItem?.courseId],
    enabled: Boolean(caseItem?.courseId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/course-outcomes/${caseItem.courseId}`);
      const list = response.data?.data ?? response.data;
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: relatedCases = [], isLoading: loadingRelated } = useQuery({
    queryKey: ["related-cases", caseId],
    enabled: Boolean(caseId),
    queryFn: () => caseService.getRelatedCases(caseId),
  });

  const isStudentGroupMode =
    role === "STUDENT" &&
    caseItem?.status === "PUBLISHED" &&
    caseItem?.groupSubmissionEnabled;

  const { data: myGroup } = useQuery({
    queryKey: ["my-group", caseId, queryUserId],
    enabled: Boolean(caseId) && isStudentGroupMode,
    queryFn: () => caseService.getMyGroup(caseId),
  });

  const mappedCaseOutcomes = useMemo(() => {
    if (!Array.isArray(caseItem?.coIds) || caseItem.coIds.length === 0) {
      return [];
    }

    const mappedIds = new Set(caseItem.coIds);
    return caseCourseOutcomes.filter((item) => mappedIds.has(item.id));
  }, [caseCourseOutcomes, caseItem?.coIds]);

  const keyQuestions = useMemo(() => parseKeyQuestions(caseItem?.keyQuestions), [caseItem?.keyQuestions]);
  const referenceLinks = useMemo(() => splitLinks(caseItem?.referenceLinks), [caseItem?.referenceLinks]);
  const myGroupMember = useMemo(() => {
    if (!myGroup?.members || !user?.id) {
      return null;
    }
    const currentUserId = Number(user.id);
    return myGroup.members.find((member) => Number(member.studentId) === currentUserId) || null;
  }, [myGroup, user?.id]);
  const hasApprovedGroupMembership = myGroupMember?.status === "APPROVED";
  const isGroupLeader = hasApprovedGroupMembership && isMemberLeader(myGroupMember);
  const pendingMemberCount = useMemo(
    () => (Array.isArray(myGroup?.members) ? myGroup.members.filter((member) => member.status === "PENDING").length : 0),
    [myGroup]
  );
  const notFound = isCaseError && caseError?.response?.status === 404;
  const error = isCaseError && !notFound
    ? "Unable to load case details. Please try again."
    : null;

  const refreshMySubmission = async () => {
    if (role !== "STUDENT" || !caseItem) {
      setMySubmission(null);
      return;
    }

    setCheckingSubmission(true);

    try {
      const submissions = await submissionService.getMySubmissions();
      const existing = Array.isArray(submissions)
        ? submissions.find((submission) => submission.caseId === caseItem.id)
        : Array.isArray(submissions?.content)
          ? submissions.content.find((submission) => submission.caseId === caseItem.id)
          : null;

      setMySubmission(existing || null);
    } catch {
      setMySubmission(null);
    } finally {
      setCheckingSubmission(false);
    }
  };

  const requestReevalMutation = useMutation({
    mutationFn: (reason) =>
      axiosInstance.post(`/submissions/${mySubmission.id}/request-reeval`, { reason }),
    onSuccess: async () => {
      toast.success("Re-evaluation request submitted");
      setShowReevalForm(false);
      setReevalReason("");
      await refreshMySubmission();
    },
    onError: (mutationError) => {
      toast.error(
        mutationError?.response?.data?.message ||
        mutationError?.response?.data?.error ||
        "Failed to submit re-evaluation request"
      );
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (payload) => caseService.createGroup(caseId, payload),
    onSuccess: async () => {
      toast.success("Group created.");
      setShowCreateGroupModal(false);
      setNewGroupName("");
      await queryClient.invalidateQueries({ queryKey: ["my-group", caseId, queryUserId] });
    },
    onError: (mutationError) => {
      toast.error(mutationError?.response?.data?.message || "Unable to create group.");
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: (groupId) => caseService.joinGroup(caseId, groupId),
    onSuccess: async () => {
      toast.success("Join request sent.");
      setJoinGroupIdInput("");
      await queryClient.invalidateQueries({ queryKey: ["my-group", caseId, queryUserId] });
    },
    onError: (mutationError) => {
      toast.error(mutationError?.response?.data?.message || "Unable to join group.");
    },
  });

  const approveMemberMutation = useMutation({
    mutationFn: ({ groupId, studentId }) => caseService.approveMember(caseId, groupId, studentId),
    onSuccess: async () => {
      toast.success("Member approved.");
      await queryClient.invalidateQueries({ queryKey: ["my-group", caseId, queryUserId] });
    },
    onError: (mutationError) => {
      toast.error(mutationError?.response?.data?.message || "Unable to approve member.");
    },
  });

  const rejectMemberMutation = useMutation({
    mutationFn: ({ groupId, studentId }) => caseService.rejectMember(caseId, groupId, studentId),
    onSuccess: async () => {
      toast.success("Member rejected.");
      await queryClient.invalidateQueries({ queryKey: ["my-group", caseId, queryUserId] });
    },
    onError: (mutationError) => {
      toast.error(mutationError?.response?.data?.message || "Unable to reject member.");
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: ({ groupId }) => caseService.leaveGroup(caseId, groupId),
    onSuccess: async () => {
      toast.success("Group membership updated.");
      await queryClient.invalidateQueries({ queryKey: ["my-group", caseId, queryUserId] });
    },
    onError: (mutationError) => {
      toast.error(mutationError?.response?.data?.message || "Unable to leave group.");
    },
  });

  useEffect(() => {
    refreshMySubmission();
  }, [role, caseItem]);

  useEffect(() => {
    const loadTimeline = async () => {
      if (role !== "STUDENT" || !caseId) {
        setTimelineEvents([]);
        return;
      }

      try {
        await caseService.logCaseActivity(caseId, "VIEWED");
        const timeline = await caseService.getAttemptTimeline(caseId);
        setTimelineEvents(Array.isArray(timeline) ? timeline : []);
      } catch {
        setTimelineEvents([]);
      }
    };

    loadTimeline();
  }, [role, caseId, mySubmission?.id, mySubmission?.marksAwarded]);

  useEffect(() => {
    if (caseItem && role === "STUDENT" && caseItem.status !== "PUBLISHED") {
      navigate("/cases", { replace: true });
    }
  }, [caseItem, navigate, role]);

  useEffect(() => {
    const loadCoBreakdown = async () => {
      if (role !== "STUDENT" || !mySubmission?.id || mySubmission.marksAwarded == null || !caseItem?.courseId) {
        setCoScores([]);
        setCourseOutcomes([]);
        return;
      }

      try {
        const [scores, outcomes] = await Promise.all([
          submissionService.getCoScores(mySubmission.id),
          axiosInstance.get(`/course-outcomes/${caseItem.courseId}`),
        ]);

        setCoScores(Array.isArray(scores) ? scores : []);
        const outcomeList = outcomes.data?.data ?? outcomes.data;
        setCourseOutcomes(Array.isArray(outcomeList) ? outcomeList : []);
      } catch {
        setCoScores([]);
        setCourseOutcomes([]);
      }
    };

    loadCoBreakdown();
  }, [role, mySubmission?.id, mySubmission?.marksAwarded, caseItem?.courseId]);

  const outcomeById = useMemo(
    () =>
      courseOutcomes.reduce((accumulator, item) => {
        accumulator[item.id] = item;
        return accumulator;
      }, {}),
    [courseOutcomes]
  );

  const totalCoScore = coScores.reduce((sum, item) => sum + (item.score ?? 0), 0);
  const totalCoMaxScore = coScores.reduce((sum, item) => sum + (item.maxScore ?? 0), 0);

  const handleRequestReeval = (e) => {
    e.preventDefault();

    const trimmedReason = reevalReason.trim();
    if (trimmedReason.length < 20) {
      toast.error("Please provide at least 20 characters for the reason");
      return;
    }

    requestReevalMutation.mutate(trimmedReason);
  };

  const handleDocumentDownload = async () => {
    if (!caseItem?.id) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not authenticated.");
        return;
      }

      const response = await fetch(caseService.getCaseDocumentUrl(caseItem.id), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        toast.error("You are not authorized to download this document.");
        return;
      }
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = caseItem.caseDocumentOriginalName || "case-document.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download document:", err);
      toast.error("Failed to download document.");
    }
  };

  const handleCreateGroup = () => {
    const groupName = newGroupName.trim();
    if (!groupName) {
      toast.error("Please enter a group name.");
      return;
    }
    createGroupMutation.mutate({ groupName });
  };

  const handleJoinGroup = () => {
    const groupId = Number(joinGroupIdInput);
    if (!groupId) {
      toast.error("Enter a valid Group ID.");
      return;
    }
    joinGroupMutation.mutate(groupId);
  };

  const handleLeaveGroup = () => {
    if (!myGroup?.id) {
      return;
    }
    if (!window.confirm("Are you sure you want to leave this group?")) {
      return;
    }
    leaveGroupMutation.mutate({ groupId: myGroup.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Case Details</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review case information and submission status.</p>
        </div>

        <Link
          to="/cases"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back to Cases
        </Link>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 h-5 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mb-2 h-3 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      )}

      {!loading && notFound && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-100">Case not found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">This case could not be found or is no longer available.</p>
        </div>
      )}

      {!loading && !notFound && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !notFound && !error && caseItem && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{caseItem.title}</h2>
                  {caseItem.peerReviewCount > 0 && (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs text-violet-700">
                      ⭐ {caseItem.peerReviewRating}/5 ({caseItem.peerReviewCount} peer review{caseItem.peerReviewCount > 1 ? "s" : ""})
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {caseItem.category && (
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-200">
                      {formatLabel(caseItem.category)}
                    </span>
                  )}
                  {caseItem.difficulty && (
                    <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {formatLabel(caseItem.difficulty)}
                    </span>
                  )}
                  {caseItem.dueDate && (
                    <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      Due {new Date(caseItem.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <StatusBadge status={caseItem.status} />
                </div>
                {Array.isArray(caseItem.tags) && caseItem.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {caseItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {role === "STUDENT" &&
                  caseItem.status === "PUBLISHED" &&
                  !mySubmission &&
                  !checkingSubmission &&
                  (!caseItem.groupSubmissionEnabled || hasApprovedGroupMembership) && (
                  <Link
                    to={`/cases/${caseId}/submit`}
                    className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                  >
                    Submit Solution
                  </Link>
                )}
                {(role === "FACULTY" || role === "ADMIN") && (
                  <Link
                    to={`/cases/${caseId}/edit`}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Edit Case
                  </Link>
                )}
                {(role === "FACULTY" || role === "ADMIN") && caseItem.hasTeachingNotes && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await caseService.downloadTeachingNotes(
                          caseItem.id,
                          caseItem.teachingNotesOriginalName
                        );
                      } catch {
                        toast.error("Failed to download teaching notes.");
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
                  >
                    Teaching Notes
                  </button>
                )}
              </div>
            </div>
          </div>

          {(caseItem.companyName ||
            caseItem.industry ||
            caseItem.geographicRegion ||
            caseItem.protagonistRole ||
            caseItem.publicationYear ||
            caseItem.sourceAttribution) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
                Case Information
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {caseItem.companyName && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Company</p>
                    <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">
                      {caseItem.companyName}
                      {caseItem.isDisguised && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          Disguised
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {caseItem.industry && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Industry</p>
                    <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{caseItem.industry}</p>
                  </div>
                )}
                {caseItem.geographicRegion && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Region</p>
                    <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{caseItem.geographicRegion}</p>
                  </div>
                )}
                {caseItem.protagonistRole && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Protagonist</p>
                    <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{caseItem.protagonistRole}</p>
                  </div>
                )}
                {caseItem.publicationYear && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Year</p>
                    <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{caseItem.publicationYear}</p>
                  </div>
                )}
                {caseItem.sourceAttribution && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Source</p>
                    <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{caseItem.sourceAttribution}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {caseItem.hasDocument && (
            <button
              type="button"
              onClick={handleDocumentDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Download Case Document (PDF)
            </button>
          )}

          {caseItem.description && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.description}</p>
            </div>
          )}

          {(role === "FACULTY" || role === "ADMIN") && caseItem.teachingNotesText && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/20">
              <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                Teaching Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {caseItem.teachingNotesText}
              </p>
            </div>
          )}

          {caseItem.companyBackground && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Company Background</h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.companyBackground}</p>
            </div>
          )}

          {caseItem.industryContext && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Industry Context</h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.industryContext}</p>
            </div>
          )}

          {caseItem.decisionPoint && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">The Decision</h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.decisionPoint}</p>
            </div>
          )}

          {caseItem.caseNarrative && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Case Narrative</h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.caseNarrative}</p>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Course Outcomes Assessed
              </h2>
            </div>
            {mappedCaseOutcomes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mappedCaseOutcomes.map((co) => (
                  <span
                    key={co.id}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    [{co.code}] {co.description}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No course outcomes mapped yet
              </p>
            )}
          </div>

          {isStudentGroupMode && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Group</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {myGroup?.groupName && (
                    <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {myGroup.groupName}
                    </span>
                  )}
                  {myGroup?.id && (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-200">
                      Group ID: {myGroup.id}
                    </span>
                  )}
                </div>
              </div>

              {!myGroup && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    You must be in an approved group before you can submit this case.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateGroupModal(true)}
                      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                    >
                      Create Group
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <div className="min-w-[160px]">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Join by Group ID
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={joinGroupIdInput}
                        onChange={(e) => setJoinGroupIdInput(e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                        placeholder="Enter group ID"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleJoinGroup}
                      disabled={joinGroupMutation.isPending}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {joinGroupMutation.isPending ? "Joining..." : "Request Join"}
                    </button>
                  </div>
                </div>
              )}

              {myGroup && myGroupMember?.status === "PENDING" && (
                <div className="space-y-3">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Waiting for leader approval for group "{myGroup.groupName}".
                  </p>
                  <button
                    type="button"
                    onClick={handleLeaveGroup}
                    disabled={leaveGroupMutation.isPending}
                    className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/40 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/20"
                  >
                    {leaveGroupMutation.isPending ? "Cancelling..." : "Cancel Request"}
                  </button>
                </div>
              )}

              {myGroup && hasApprovedGroupMembership && (
                <div className="space-y-3">
                  {isGroupLeader && pendingMemberCount === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No pending join requests right now.
                    </p>
                  )}
                  <div className="space-y-2">
                    {(Array.isArray(myGroup.members) ? myGroup.members : []).map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
                      >
                        <div className="text-sm text-slate-700 dark:text-slate-200">
                          <span className="font-semibold">{member.studentName}</span>
                          {isMemberLeader(member) && <span className="ml-2 text-xs text-slate-500">(Leader)</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {member.status}
                          </span>
                          {isGroupLeader && member.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  approveMemberMutation.mutate({
                                    groupId: myGroup.id,
                                    studentId: member.studentId,
                                  })
                                }
                                className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  rejectMemberMutation.mutate({
                                    groupId: myGroup.id,
                                    studentId: member.studentId,
                                  })
                                }
                                className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/20"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleLeaveGroup}
                    disabled={leaveGroupMutation.isPending}
                    className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/40 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/20"
                  >
                    {leaveGroupMutation.isPending ? "Leaving..." : "Leave Group"}
                  </button>
                </div>
              )}
            </div>
          )}

          {role === "STUDENT" && <AttemptTimeline events={timelineEvents} />}

          {(caseItem.problemStatement ||
            keyQuestions.length > 0 ||
            caseItem.constraints ||
            caseItem.evaluationRubric ||
            referenceLinks.length > 0 ||
            caseItem.estimatedHours != null) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Case Guidance</h2>

              <div className="space-y-4">
                {caseItem.problemStatement && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Problem Statement</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.problemStatement}</p>
                  </div>
                )}

                {keyQuestions.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Key Questions</h3>
                    <ol className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      {keyQuestions.map((question, index) => (
                        <li key={`${question}-${index}`}>{index + 1}. {question}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {caseItem.constraints && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Constraints</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.constraints}</p>
                  </div>
                )}

                {caseItem.evaluationRubric && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Evaluation Rubric</h3>
                      <span title="This is how your submission will be graded" className="inline-flex items-center text-slate-400 dark:text-slate-500">
                        <Info className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{caseItem.evaluationRubric}</p>
                  </div>
                )}

                {referenceLinks.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Reference Links</h3>
                    <div className="space-y-1">
                      {referenceLinks.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm text-slate-700 underline underline-offset-2 dark:text-slate-300"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {Array.isArray(caseItem.exhibits) && caseItem.exhibits.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                Exhibits
              </h2>
              <div className="space-y-2">
                {caseItem.exhibits.map((exhibit) => (
                  <div
                    key={exhibit.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {exhibit.title}
                      </p>
                      {exhibit.description && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {exhibit.description}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
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
                        try {
                          await caseService.downloadExhibit(
                            caseItem.id,
                            exhibit.id,
                            exhibit.originalFileName
                          );
                        } catch {
                          toast.error("Failed to download exhibit.");
                        }
                      }}
                      className="ml-4 shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(loadingRelated || relatedCases.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                Related Cases
              </h2>

              {loadingRelated ? (
                <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="min-w-[260px] rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mb-3 h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
                  {relatedCases.map((related) => (
                    <article
                      key={related.id}
                      className="min-w-[260px] rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {related.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {related.category && (
                          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-200">
                            {formatLabel(related.category)}
                          </span>
                        )}
                        {related.difficulty && (
                          <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {formatLabel(related.difficulty)}
                          </span>
                        )}
                      </div>
                      <div className="mt-4">
                        <Link
                          to={`/cases/${related.id}`}
                          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          View
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {role === "STUDENT" && caseItem.status === "PUBLISHED" && (
            <div className="space-y-3">
              {checkingSubmission && (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  Checking submission...
                </div>
              )}

              {!checkingSubmission && mySubmission && (
                <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">
                      {mySubmission.status === "EVALUATED"
                        ? "Submission evaluated"
                        : mySubmission.status === "REEVAL_REQUESTED"
                          ? "Re-evaluation requested"
                          : "Submission sent"}
                    </span>
                    {mySubmission.status === "EVALUATED" && (
                      <button
                        type="button"
                        onClick={() => setShowReevalForm((prev) => !prev)}
                        className="rounded-md border border-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-900"
                      >
                        Request Re-evaluation
                      </button>
                    )}
                    {(mySubmission.status === "SUBMITTED" || mySubmission.status === "UNDER_REVIEW") && (
                      <Link
                        to={`/cases/${caseId}/submit`}
                        className="rounded-md border border-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-900"
                      >
                        Resubmit
                      </Link>
                    )}
                    {mySubmission.status === "REEVAL_REQUESTED" && (
                      <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Re-evaluation requested
                      </span>
                    )}
                  </div>
                  {mySubmission.marksAwarded != null && (
                    <div className="space-y-0.5 text-xs">
                      <div>Marks: {mySubmission.marksAwarded}</div>
                      {mySubmission.facultyFeedback && (
                        <div>Feedback: {mySubmission.facultyFeedback}</div>
                      )}
                    </div>
                  )}
                  {(mySubmission.status === "SUBMITTED" || mySubmission.status === "UNDER_REVIEW") && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      You can resubmit until your submission is evaluated by faculty.
                    </p>
                  )}
                  {showReevalForm && mySubmission.status === "EVALUATED" && (
                    <form onSubmit={handleRequestReeval} className="space-y-3 rounded-lg border border-emerald-200 bg-white/70 p-3 dark:border-emerald-500/20 dark:bg-slate-900/60">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-800 dark:text-emerald-200">
                          Reason for re-evaluation
                        </label>
                        <textarea
                          rows={4}
                          value={reevalReason}
                          onChange={(e) => setReevalReason(e.target.value)}
                          className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          placeholder="Explain why you believe this submission should be reviewed again."
                          required
                        />
                        <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                          Minimum 20 characters.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={requestReevalMutation.isPending}
                          className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                        >
                          {requestReevalMutation.isPending ? "Submitting..." : "Submit Request"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowReevalForm(false);
                            setReevalReason("");
                          }}
                          className="rounded-md border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:text-emerald-200 dark:hover:bg-emerald-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {!checkingSubmission && !mySubmission && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  <div className="font-semibold text-slate-700 dark:text-slate-200">No submission yet</div>
                  {caseItem.groupSubmissionEnabled && !hasApprovedGroupMembership ? (
                    <p className="mt-1 text-[11px]">
                      Join or create a group and wait for approval before submitting.
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px]">
                      Submit your solution once you are ready. You can only submit once for this case.
                    </p>
                  )}
                </div>
              )}

              {!checkingSubmission && mySubmission && mySubmission.marksAwarded != null && coScores.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Course Outcome Breakdown</h2>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Course Outcome</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Your Score</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Max Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                        {coScores.map((item) => {
                          const outcome = outcomeById[item.coId];
                          const label = outcome
                            ? `${outcome.code}: ${outcome.description}`
                            : `CO ${item.coId}`;

                          return (
                            <tr key={item.id ?? `${item.coId}-${item.score}`}>
                              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{label}</td>
                              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{item.score}</td>
                              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{item.maxScore}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-50 dark:bg-slate-950">
                          <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-100">Total</td>
                          <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-100">{totalCoScore}</td>
                          <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-100">{totalCoMaxScore}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Create Group</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enter a group name to create your submission team.
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                placeholder="e.g. Team Alpha"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setNewGroupName("");
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={createGroupMutation.isPending}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                {createGroupMutation.isPending ? "Creating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CaseDetailsPage;
