function KpiCard({ title, value, icon, trend, description, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {title || "KPI"}
            </p>
            <div className="mt-2 h-6 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-100">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-100">
            {icon}
          </div>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {trend && (
        <div className="mt-3">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.isPositive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
            }`}
          >
            {trend.isPositive ? "\u2191" : "\u2193"} {Math.abs(trend.value)}% vs last week
          </span>
        </div>
      )}
    </div>
  );
}

export default KpiCard;
