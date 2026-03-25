import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import caseService from "../../modules/caseStudy/services/caseService";

function statusBadgeClass(status) {
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

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function PeerReviewsPage() {
  const queryClient = useQueryClient();
  const [reviewFormById, setReviewFormById] = useState({});
  const [expandedReviewId, setExpandedReviewId] = useState(null);

  const { data: reviews = [], isLoading, isError } = useQuery({
    queryKey: ["faculty-peer-reviews"],
    queryFn: () => caseService.getPeerReviews(),
  });

  const reviewList = useMemo(() => (Array.isArray(reviews) ? reviews : []), [reviews]);
  const actionable = reviewList.filter((review) => review.status === "PENDING" || review.status === "ACCEPTED");
  const history = reviewList.filter((review) => review.status === "COMPLETED" || review.status === "DECLINED");

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["faculty-peer-reviews"] });
  };

  const handleAccept = async (review) => {
    try {
      await caseService.acceptReview(review.caseId, review.id);
      await refresh();
      toast.success("Review accepted.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to accept review.");
    }
  };

  const handleDecline = async (review) => {
    try {
      await caseService.declineReview(review.caseId, review.id);
      await refresh();
      toast.success("Review declined.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to decline review.");
    }
  };

  const handleComplete = async (review) => {
    const values = reviewFormById[review.id] || {};
    const rating = Number(values.rating);
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Select a rating between 1 and 5.");
      return;
    }

    try {
      await caseService.completeReview(review.caseId, review.id, {
        feedback: values.feedback || "",
        rating,
      });
      setReviewFormById((prev) => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
      setExpandedReviewId(null);
      await refresh();
      toast.success("Review submitted.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to submit review.");
    }
  };

  const renderRow = (review, withActions) => (
    <div
      key={review.id}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{review.caseTitle}</p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(review.status)}`}>
          {review.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Requested by: {review.requestedByName} | Requested: {formatDate(review.requestedAt)}
      </p>

      {withActions && review.status === "PENDING" && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleAccept(review)}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => handleDecline(review)}
            className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:bg-slate-900 dark:text-rose-300"
          >
            Decline
          </button>
        </div>
      )}

      {withActions && review.status === "ACCEPTED" && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => setExpandedReviewId((prev) => (prev === review.id ? null : review.id))}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Submit Review
          </button>
          {expandedReviewId === review.id && (
            <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <textarea
                rows={3}
                value={reviewFormById[review.id]?.feedback ?? ""}
                onChange={(e) =>
                  setReviewFormById((prev) => ({
                    ...prev,
                    [review.id]: { ...prev[review.id], feedback: e.target.value },
                  }))
                }
                placeholder="Write feedback"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              />
              <div className="flex items-center gap-2">
                <select
                  value={reviewFormById[review.id]?.rating ?? ""}
                  onChange={(e) =>
                    setReviewFormById((prev) => ({
                      ...prev,
                      [review.id]: { ...prev[review.id], rating: e.target.value },
                    }))
                  }
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="">Rating</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleComplete(review)}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!withActions && (
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {review.feedback && <p>{review.feedback}</p>}
          {review.rating != null && <p className="mt-1 text-xs">Rating: {review.rating}/5</p>}
        </div>
      )}
    </div>
  );

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
        Unable to load peer reviews.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Peer Reviews</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Review requests assigned to you and your review history.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reviews Requested From Me</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : actionable.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No pending or accepted reviews.
          </div>
        ) : (
          <div className="space-y-2">{actionable.map((review) => renderRow(review, true))}</div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">History</h2>
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No completed or declined reviews yet.
          </div>
        ) : (
          <div className="space-y-2">{history.map((review) => renderRow(review, false))}</div>
        )}
      </section>
    </div>
  );
}
