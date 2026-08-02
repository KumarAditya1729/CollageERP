import { FallbackProps } from "react-error-boundary";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorBoundaryFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 p-4 text-center dark:bg-gray-950">
      <div className="flex max-w-md flex-col items-center space-y-4 rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            An unexpected error occurred in the application. Our team has been notified.
          </p>
        </div>
        
        {(error as Error)?.message && (
          <div className="w-full rounded-md bg-red-50 p-3 text-left text-xs text-red-800 dark:bg-red-950/50 dark:text-red-300 overflow-auto max-h-32">
            <code className="break-words font-mono">{(error as Error).message}</code>
          </div>
        )}

        <Button onClick={resetErrorBoundary} className="w-full" variant="default">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
