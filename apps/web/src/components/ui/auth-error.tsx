"use client";

import { usePrivy } from "@privy-io/react-auth";

interface AuthErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function AuthError({ message, onRetry }: AuthErrorProps) {
  const { login } = usePrivy();

  const handleLogin = () => {
    login();
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-amber-900 mb-2">Authentication Required</h3>
        <p className="text-sm text-amber-700 mb-6">
          {message || "Please log in to access this page and view your workflows."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleLogin}
            className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Log In
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2.5 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
