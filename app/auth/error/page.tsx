'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorInfo = () => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          message: 'There is a problem with the server configuration.',
          description: 'Please contact the administrator.',
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in.',
          description: 'Your Discord account is not registered in the system. Please contact an administrator to create an account for you.',
        };
      case 'Verification':
        return {
          title: 'Verification Failed',
          message: 'The sign in link is no longer valid.',
          description: 'It may have been used already or it may have expired.',
        };
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return {
          title: 'Authentication Error',
          message: 'Unable to sign in with Discord.',
          description: 'There was an error during the authentication process. Please try again.',
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred.',
          description: 'Please try signing in again. If the problem persists, contact an administrator.',
        };
    }
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900/50 border border-zinc-800  p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-red-900/20 border-2 border-red-800  flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-zinc-100 mb-3">
            {errorInfo.title}
          </h1>

          {/* Error Message */}
          <p className="text-lg text-zinc-300 mb-2">
            {errorInfo.message}
          </p>

          {/* Error Description */}
          <p className="text-sm text-zinc-500 mb-8">
            {errorInfo.description}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold  transition-colors"
            >
              Go to Home
            </Link>

            {error === 'AccessDenied' && (
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-3">
                  Need access? Contact an administrator to register your Discord account.
                </p>
                <div className="bg-zinc-800/50 border border-zinc-700 p-3 text-left">
                  <p className="text-xs font-semibold text-zinc-400 mb-1">What to tell the admin:</p>
                  <p className="text-xs text-zinc-500">
                    "Please add my Discord account to the tournament system so I can log in."
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          If you believe this is a mistake, please contact the tournament administrator.
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
