import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { checkRegistrationStatus } from "../api/authService";

function RegistrationPending() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get("type") || "student";
  const email = searchParams.get("email") || "";

  const [statusData, setStatusData] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [statusError, setStatusError] = useState("");

  const title = type === "faculty" ? "Application Submitted" : "Almost There";
  const message =
    type === "faculty"
      ? "Your faculty registration is pending admin approval. You will be able to log in once an admin reviews your application."
      : "Your registration is pending approval from your selected faculty. You will be able to log in once they review your application.";

  const handleCheckStatus = async () => {
    if (!email) {
      const msg = "Missing email. Please go back and sign up again.";
      setStatusError(msg);
      toast.error(msg);
      return;
    }

    try {
      setStatusError("");
      setIsChecking(true);
      const response = await checkRegistrationStatus(email);
      const payload = response?.data ?? response;
      setStatusData(payload);
    } catch (error) {
      const msg =
        error.response?.data?.message || "Unable to check status right now.";
      setStatusError(msg);
      toast.error(msg);
    } finally {
      setIsChecking(false);
    }
  };

  const status = statusData?.status;
  const rejectionReason = statusData?.rejectionReason;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
          <BookOpen className="h-6 w-6" />
        </div>

        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 text-amber-500" />
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {message}
          </p>
          {email ? (
            <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {email}
            </span>
          ) : null}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-80 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Check Status"
            )}
          </button>
        </div>

        {status ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="mb-2">
              <span className="inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                {status}
              </span>
            </div>

            {status === "APPROVED" ? (
              <div className="text-sm">
                <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Your account has been approved! You can now log in.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                >
                  Go to Login
                </button>
              </div>
            ) : null}

            {status === "REJECTED" ? (
              <div className="text-sm">
                <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-300">
                  <XCircle className="h-4 w-4" />
                  Your registration was rejected.
                </p>
                {rejectionReason ? (
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    Reason: {rejectionReason}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {statusError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
            {statusError}
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link
            to="/"
            className="font-medium text-slate-700 hover:underline dark:text-slate-300"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegistrationPending;
