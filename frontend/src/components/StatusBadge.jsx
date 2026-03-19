function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  let colorClasses = "bg-slate-100 text-slate-700 border border-slate-200";

  if (normalized === "DRAFT") {
    colorClasses =
      "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30";
  } else if (normalized === "PUBLISHED") {
    colorClasses =
      "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30";
  } else if (normalized === "SUBMITTED") {
    colorClasses =
      "bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30";
  } else if (normalized === "UNDER_REVIEW") {
    colorClasses =
      "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30";
  } else if (normalized === "EVALUATED") {
    colorClasses =
      "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30";
  } else if (normalized === "REEVAL_REQUESTED") {
    colorClasses =
      "bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30";
  } else if (normalized === "GRADED") {
    colorClasses =
      "bg-violet-100 text-violet-800 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30";
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        colorClasses,
      ].join(" ")}
    >
      {normalized}
    </span>
  );
}

export default StatusBadge;
