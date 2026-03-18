import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-6 flex justify-center">
          <svg
            viewBox="0 0 220 120"
            className="h-28 w-auto text-slate-400 dark:text-slate-600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="35" cy="60" r="20" className="fill-slate-200 dark:fill-slate-800" />
            <circle cx="110" cy="35" r="14" className="fill-slate-300 dark:fill-slate-700" />
            <circle cx="185" cy="70" r="24" className="fill-slate-200 dark:fill-slate-800" />
            <path
              d="M20 95 L200 25"
              className="stroke-slate-400 dark:stroke-slate-600"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M72 92 L150 92"
              className="stroke-slate-400 dark:stroke-slate-600"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-8xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          404
        </h1>
        <h2 className="mt-3 text-2xl font-semibold text-slate-700 dark:text-slate-200">
          Page Not Found
        </h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Go to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

