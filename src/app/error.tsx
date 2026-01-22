'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-xl text-slate-600 mb-8">Something went wrong!</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
