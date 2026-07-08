"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ADMIN DASHBOARD CRASH:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background text-foreground">
      <div className="neo-border bg-card p-8 rounded-2xl max-w-2xl w-full text-center space-y-6">
        <h2 className="text-3xl font-bold text-danger">Dashboard Crashed!</h2>
        <div className="text-left bg-muted p-4 rounded-xl overflow-auto text-sm font-mono neo-border">
          <p className="font-bold text-danger mb-2">{error.name}: {error.message}</p>
          <pre>{error.stack}</pre>
        </div>
        <p className="text-muted-foreground">
          Please screenshot this error and send it to the developer.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-primary text-primary-foreground neo-border neo-press rounded-xl font-bold"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
