'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900/50 border border-zinc-800  p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">
              HOI4 Tournament System
            </h1>
            <p className="text-zinc-400">
              Sign in to participate in tournaments
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 ">
              <p className="text-sm text-red-300 text-center">
                {error === 'OAuthAccountNotLinked'
                  ? 'This account is already linked to another user.'
                  : error === 'AccessDenied'
                  ? 'Your Discord account is not registered. Contact an administrator.'
                  : 'An error occurred during sign in. Please try again.'}
              </p>
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={() => signIn('discord', { callbackUrl })}
            className="w-full px-6 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold  transition-colors flex items-center justify-center gap-3 mb-6"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Sign in with Discord
          </button>

          {/* Info Box */}
          <div className="bg-zinc-800/50 border border-zinc-700  p-4">
            <p className="text-sm text-zinc-400 mb-2">
              <span className="font-semibold text-zinc-300">Note:</span> Only registered users can sign in.
            </p>
            <p className="text-xs text-zinc-500">
              If you don't have an account, please contact a tournament administrator to register your Discord account.
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
