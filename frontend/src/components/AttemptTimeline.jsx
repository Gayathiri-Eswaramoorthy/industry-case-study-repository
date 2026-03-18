const steps = ["VIEWED", "STARTED", "SUBMITTED", "UNDER_REVIEW", "EVALUATED"];

const labels = {
  VIEWED: "Viewed",
  STARTED: "Started",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  EVALUATED: "Evaluated",
};

function formatTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    day: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

function AttemptTimeline({ events = [] }) {
  const eventMap = new Map(events.map((item) => [item.event, item]));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Attempt Timeline</h2>

      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-5 gap-2">
          {steps.map((step, index) => {
            const item = eventMap.get(step);
            const formatted = formatTimestamp(item?.timestamp);
            const isCompleted = Boolean(item);
            const nextCompleted = Boolean(eventMap.get(steps[index + 1]));

            return (
              <div key={step} className="relative flex flex-col items-center text-center">
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-1/2 top-3 h-0.5 w-full -translate-y-1/2 ${
                      isCompleted && nextCompleted ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}

                <div
                  className={`relative z-10 h-6 w-6 rounded-full border-2 ${
                    isCompleted
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-slate-300 bg-white"
                  }`}
                />

                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  {labels[step]}
                </div>

                <div className="mt-1 min-h-10 text-[11px] text-slate-500">
                  {formatted ? (
                    <>
                      <div>{formatted.day}</div>
                      <div>{formatted.time}</div>
                    </>
                  ) : (
                    <>
                      <div>-</div>
                      <div>-</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AttemptTimeline;
