import { useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FolderOpen, PlusCircle, Search } from "lucide-react";
import caseService from "../services/caseService";
import { AuthContext } from "../../../context/AuthContext";
import StatusBadge from "../../../components/StatusBadge";

function CaseListPage({ courseId }) {
  const { role } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Ensure students default to and stay on PUBLISHED view
  useEffect(() => {
    if (role === "STUDENT") {
      setStatusFilter("PUBLISHED");
    }
  }, [role]);

  const statusParam = useMemo(() => {
    const baseStatus = statusFilter === "ALL" ? undefined : statusFilter;
    return role === "STUDENT" ? "PUBLISHED" : baseStatus;
  }, [role, statusFilter]);

  const {
    data: caseData = [],
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["cases", courseId, statusParam],
    enabled: Boolean(courseId),
    queryFn: () =>
      caseService.getAllCases({
        courseId,
        status: statusParam,
      }),
  });

  const { data: allCaseData = [] } = useQuery({
    queryKey: ["cases-stats", courseId, role],
    enabled: Boolean(courseId),
    queryFn: () =>
      caseService.getAllCases({
        courseId,
        status: role === "STUDENT" ? "PUBLISHED" : undefined,
      }),
  });

  const cases = Array.isArray(caseData) ? caseData : [];
  const statCases = Array.isArray(allCaseData) ? allCaseData : [];

  const totalCases = statCases.length;
  const publishedCases = statCases.filter((c) => c.status === "PUBLISHED").length;
  const draftCases = statCases.filter((c) => c.status === "DRAFT").length;

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handlePublish = async (caseId) => {
    const confirmed = window.confirm(
      "Are you sure you want to publish this case?"
    );

    if (!confirmed) return;

    try {
      await caseService.publishCase(caseId);
      queryClient.invalidateQueries({ queryKey: ["cases", courseId] });
      queryClient.invalidateQueries({ queryKey: ["cases-stats", courseId] });
      toast.success("Case published successfully.");
    } catch (err) {
      console.error("Error publishing case:", err);
      toast.error("Unable to publish case. Please try again.");
    }
  };

  const filteredCases = cases.filter((item) =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEditCase = () => role === "FACULTY" || role === "ADMIN";

  const hasCases = filteredCases.length > 0;

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Case Studies
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Browse and manage case studies for this course.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="status"
              className="text-sm font-medium text-slate-700"
            >
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={handleStatusChange}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
            >
              <option value="ALL">All</option>
              {role !== "STUDENT" && (
                <option value="DRAFT">Draft</option>
              )}
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>
      </div>

      {courseId && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total Cases
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {totalCases}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/30">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Published Cases
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">
              {publishedCases}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/30">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Draft Cases
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-800 dark:text-amber-200">
              {draftCases}
            </p>
          </div>
        </div>
      )}

      {!courseId && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-8 text-center">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            No course selected
          </h2>
          <p className="text-xs text-slate-500">
            Please select a course to view its case studies.
          </p>
        </div>
      )}

      {courseId && (
        <>
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-200" />
                  <div className="mb-6 h-3 w-5/6 animate-pulse rounded bg-slate-200" />
                  <div className="flex gap-2">
                    <div className="h-8 w-20 animate-pulse rounded bg-slate-200" />
                    <div className="h-8 w-20 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to load case studies. Please try again.
            </div>
          )}

          {!loading && !isError && !hasCases && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <FolderOpen className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
                No case studies found
              </h2>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Try adjusting the status filter or create a new case study.
              </p>
              {(role === "FACULTY" || role === "ADMIN") && (
                <Link
                  to="/cases/new"
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Case
                </Link>
              )}
            </div>
          )}

          {!loading && !isError && hasCases && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCases.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {item.title}
                      </h2>
                      <StatusBadge status={item.status} />
                    </div>

                    <p className="mb-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {item.category && (
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300">
                          {String(item.category).replaceAll("_", " ")}
                        </span>
                      )}
                      {item.submissionType && (
                        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-violet-700 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300">
                          {String(item.submissionType).replaceAll("_", " ")}
                        </span>
                      )}
                    </div>

                    <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {item.difficulty && (
                        <span>Difficulty: {item.difficulty}</span>
                      )}
                      {item.dueDate && (
                        <span>
                          Due:{" "}
                          {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2">
                      <Link
                        to={`/cases/${item.id}`}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        View
                      </Link>

                      {canEditCase(item) && (
                        <Link
                          to={`/cases/${item.id}/edit`}
                          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                        >
                          Edit
                        </Link>
                      )}

                      {role === "FACULTY" && (
                        <Link
                          to={`/cases/${item.id}/submissions`}
                          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                        >
                          View Submissions
                        </Link>
                      )}

                      {role === "ADMIN" && item.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => handlePublish(item.id)}
                          className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          Publish Case
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default CaseListPage;
