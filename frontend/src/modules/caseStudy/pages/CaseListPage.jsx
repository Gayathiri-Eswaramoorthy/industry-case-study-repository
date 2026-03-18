import { useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FolderOpen, PlusCircle, Search } from "lucide-react";
import caseService from "../services/caseService";
import { AuthContext } from "../../../context/AuthContext";
import StatusBadge from "../../../components/StatusBadge";

const DEFAULT_CATEGORY_PILLS = [
  "PRODUCT",
  "FINANCE",
  "OPERATIONS",
  "MARKETING",
  "TECHNOLOGY",
  "STRATEGY",
  "SUPPLY_CHAIN",
  "FINTECH",
  "HEALTHCARE",
  "AI_ML",
];

const CATEGORY_LABELS = {
  PRODUCT: "Product",
  FINANCE: "Finance",
  FINTECH: "FinTech",
  HEALTHCARE: "Healthcare",
  AI_ML: "AI / ML",
  SUPPLY_CHAIN: "Supply Chain",
  OPERATIONS: "Operations",
  MARKETING: "Marketing",
  TECHNOLOGY: "Technology",
  STRATEGY: "Strategy",
};

function normalizeCategory(category) {
  if (!category) return "UNCATEGORIZED";
  return String(category).trim().toUpperCase().replace(/\s+/g, "_");
}

function normalizeStatus(status) {
  if (!status) return "";
  return String(status).trim().toUpperCase();
}

function getCategoryTheme(category) {
  const normalized = normalizeCategory(category);

  if (normalized.includes("PRODUCT")) {
    return {
      cardAccent: "border-l-rose-500 dark:border-l-rose-400",
      cardAccentHover: "group-hover:border-l-rose-600 dark:group-hover:border-l-rose-300",
      thumbnail: "from-rose-200 via-orange-100 to-amber-100 dark:from-rose-900/50 dark:via-orange-900/40 dark:to-amber-900/40",
      pill: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200",
      pillActive: "border-rose-500 bg-rose-600 text-white dark:border-rose-300 dark:bg-rose-400 dark:text-slate-900",
    };
  }

  if (normalized.includes("FINANCE")) {
    return {
      cardAccent: "border-l-emerald-500 dark:border-l-emerald-400",
      cardAccentHover: "group-hover:border-l-emerald-600 dark:group-hover:border-l-emerald-300",
      thumbnail: "from-emerald-200 via-green-100 to-teal-100 dark:from-emerald-900/50 dark:via-green-900/40 dark:to-teal-900/40",
      pill: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200",
      pillActive: "border-emerald-500 bg-emerald-600 text-white dark:border-emerald-300 dark:bg-emerald-400 dark:text-slate-900",
    };
  }

  if (normalized.includes("TECH")) {
    return {
      cardAccent: "border-l-blue-500 dark:border-l-blue-400",
      cardAccentHover: "group-hover:border-l-blue-600 dark:group-hover:border-l-blue-300",
      thumbnail: "from-blue-200 via-cyan-100 to-sky-100 dark:from-blue-900/50 dark:via-cyan-900/40 dark:to-sky-900/40",
      pill: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-200",
      pillActive: "border-blue-500 bg-blue-600 text-white dark:border-blue-300 dark:bg-blue-400 dark:text-slate-900",
    };
  }

  if (normalized.includes("OPERATIONS")) {
    return {
      cardAccent: "border-l-amber-500 dark:border-l-amber-400",
      cardAccentHover: "group-hover:border-l-amber-600 dark:group-hover:border-l-amber-300",
      thumbnail: "from-amber-200 via-yellow-100 to-orange-100 dark:from-amber-900/50 dark:via-yellow-900/40 dark:to-orange-900/40",
      pill: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200",
      pillActive: "border-amber-500 bg-amber-600 text-white dark:border-amber-300 dark:bg-amber-400 dark:text-slate-900",
    };
  }

  return {
    cardAccent: "border-l-slate-500 dark:border-l-slate-400",
    cardAccentHover: "group-hover:border-l-slate-600 dark:group-hover:border-l-slate-300",
    thumbnail: "from-slate-200 via-slate-100 to-zinc-100 dark:from-slate-800 dark:via-slate-900 dark:to-zinc-900",
    pill: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
    pillActive: "border-slate-500 bg-slate-700 text-white dark:border-slate-300 dark:bg-slate-300 dark:text-slate-900",
  };
}

function CaseListPage({ courseId }) {
  const { role } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [statusFilter, setStatusFilter] = useState(() =>
    role === "ADMIN" ? "ALL" : "PUBLISHED"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    setStatusFilter(role === "ADMIN" ? "ALL" : "PUBLISHED");
    setPage(0);
  }, [role]);

  const statusParam = useMemo(() => {
    const baseStatus = statusFilter === "ALL" ? undefined : statusFilter;
    return role === "STUDENT" ? "PUBLISHED" : baseStatus;
  }, [role, statusFilter]);

  useEffect(() => {
    setPage(0);
  }, [courseId, statusParam, searchTerm, categoryFilter]);

  const {
    data: allCasesData,
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["cases", courseId, role, "visible"],
    queryFn: () =>
      caseService.getAllCases({
        courseId,
        status: role === "STUDENT" ? "PUBLISHED" : undefined,
        page: 0,
        size: 1000,
      }),
  });

  const allCases = allCasesData?.content || allCasesData || [];

  const caseCounts = useMemo(
    () =>
      allCases.reduce(
        (counts, item) => {
          const normalizedStatus = normalizeStatus(item.status);
          if (normalizedStatus === "PUBLISHED") counts.published += 1;
          if (normalizedStatus === "DRAFT") counts.draft += 1;
          counts.total += 1;
          return counts;
        },
        { total: 0, published: 0, draft: 0 }
      ),
    [allCases]
  );

  const statusScopedCases = useMemo(() => {
    if (role === "STUDENT") {
      return allCases.filter((item) => normalizeStatus(item.status) === "PUBLISHED");
    }

    if (statusFilter === "ALL") {
      return allCases;
    }

    return allCases.filter((item) => normalizeStatus(item.status) === statusFilter);
  }, [allCases, role, statusFilter]);

  const categoryPills = useMemo(() => {
    const dynamic = statusScopedCases
      .map((item) => normalizeCategory(item.category))
      .filter(Boolean);
    return [
      "ALL",
      ...Array.from(new Set([...DEFAULT_CATEGORY_PILLS, ...dynamic])),
    ];
  }, [statusScopedCases]);

  const handlePublish = async (caseId) => {
    const confirmed = window.confirm("Are you sure you want to publish this case?");
    if (!confirmed) return;
    try {
      await caseService.publishCase(caseId);
      queryClient.invalidateQueries({ queryKey: ["cases", courseId] });
      toast.success("Case published successfully.");
    } catch (err) {
      console.error("Error publishing case:", err);
      toast.error("Unable to publish case. Please try again.");
    }
  };

  const filteredCases = statusScopedCases.filter((item) => {
    const titleMatch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch =
      categoryFilter === "ALL" || normalizeCategory(item.category) === categoryFilter;
    return titleMatch && categoryMatch;
  });

  const paginatedCases = filteredCases.slice(page * size, page * size + size);
  const totalPages = Math.ceil(filteredCases.length / size);

  const canEditCase = () => role === "FACULTY" || role === "ADMIN";
  const hasCases = filteredCases.length > 0;

  const tabs =
    role === "FACULTY"
      ? [
          { label: "Published", value: "PUBLISHED", count: caseCounts.published },
          { label: "Draft", value: "DRAFT", count: caseCounts.draft },
        ]
      : [
          { label: "All", value: "ALL", count: caseCounts.total },
          { label: "Published", value: "PUBLISHED", count: caseCounts.published },
          { label: "Draft", value: "DRAFT", count: caseCounts.draft },
        ];

  return (
    <div className="space-y-8 overflow-x-hidden">
      <section className="rounded-2xl bg-slate-100 px-6 py-10 dark:bg-slate-900/80 md:px-10">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-left">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Case Study Library
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 md:text-base">
                Explore teaching cases by topic, then view, edit, and publish based on your role.
              </p>
            </div>
            {(role === "FACULTY" || role === "ADMIN") && (
              <Link
                to="/cases/new"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                <PlusCircle className="h-4 w-4" />
                Create Case
              </Link>
            )}
          </div>

          <div className="mx-auto w-full max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cases by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-400/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-500/30"
              />
            </div>
          </div>
        </div>
      </section>

      {role !== "STUDENT" && (
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-slate-800 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-slate-300 dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <section className="space-y-5">
        <div className="overflow-hidden">
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-2">
            {categoryPills.map((category) => {
              const theme = getCategoryTheme(category);
              const active = categoryFilter === category;

              return (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold tracking-wide transition ${
                    active ? theme.pillActive : theme.pill
                  }`}
                >
                  {CATEGORY_LABELS[category] || category}
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="h-32 animate-pulse bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-8 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200">
            Unable to load case studies. Please try again.
          </div>
        )}

        {!loading && !isError && !hasCases && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-8 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-base font-semibold text-slate-800 dark:text-slate-100">
              No case studies found
            </h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              {role !== "STUDENT"
                ? "Try changing status/category filters or create a new case study."
                : "No published cases available yet."}
            </p>
            {(role === "FACULTY" || role === "ADMIN") && (
              <Link
                to="/cases/new"
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                <PlusCircle className="h-4 w-4" />
                Create Case
              </Link>
            )}
          </div>
        )}

        {!loading && !isError && hasCases && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedCases.map((item) => {
              const theme = getCategoryTheme(item.category);

              return (
                <article
                  key={item.id}
                  className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 border-l-4 ${theme.cardAccent} ${theme.cardAccentHover} bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950`}
                >
                  <div
                    className={`h-32 bg-gradient-to-r ${theme.thumbnail} transition-all duration-300 group-hover:brightness-105`}
                  />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 text-xl font-bold leading-tight text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h2>
                      <div className="shrink-0">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>

                    <p className="mb-4 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {item.category && (
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${theme.pill}`}
                        >
                          {CATEGORY_LABELS[normalizeCategory(item.category)] || item.category}
                        </span>
                      )}
                      {item.difficulty && (
                        <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {String(item.difficulty).replaceAll("_", " ")}
                        </span>
                      )}
                      {item.submissionType && (
                        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:border-violet-500/40 dark:bg-violet-950/40 dark:text-violet-200">
                          {String(item.submissionType).replaceAll("_", " ")}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          Due {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2">
                      <Link
                        to={`/cases/${item.id}`}
                        className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                      >
                        View
                      </Link>

                      {canEditCase() && (
                        <Link
                          to={`/cases/${item.id}/edit`}
                          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Edit
                        </Link>
                      )}

                      {role === "ADMIN" && normalizeStatus(item.status) === "DRAFT" && (
                        <button
                          onClick={() => handlePublish(item.id)}
                          className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {!loading && !isError && hasCases && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Previous
          </button>

          <span className="text-sm text-slate-600 dark:text-slate-300">
            Page {page + 1} of {totalPages}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page + 1 >= totalPages || totalPages === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default CaseListPage;
