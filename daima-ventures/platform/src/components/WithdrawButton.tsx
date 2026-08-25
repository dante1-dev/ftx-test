'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  applicationId: string;
  status: string;
  userIdentifier?: string;
}

export default function WithdrawButton({ applicationId, status, userIdentifier }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Only show button for withdrawable statuses
  if (status !== 'pending' && status !== 'under_review') {
    return null;
  }

  const handleWithdraw = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/withdraw-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, userIdentifier }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to withdraw application.');
      }

      setShowConfirm(false);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
      >
        Withdraw Application
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h4 className="text-lg font-bold text-gray-900 mb-1">Confirm Withdrawal</h4>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to withdraw this application? This action cannot be undone.
            </p>

            {errorMsg && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <button
                disabled={loading}
                onClick={handleWithdraw}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Withdrawing...' : 'Yes, Withdraw'}
              </button>
              <button
                disabled={loading}
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}