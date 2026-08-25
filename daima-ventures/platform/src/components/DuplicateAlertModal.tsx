'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function DuplicateAlertModal({ isOpen, onClose, message }: Props) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-gray-100 transform transition-all scale-100">
        {/* Warning Icon */}
        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-amber-100 mb-4">
          <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title & Message */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">Duplicate Application Detected</h3>
        <p className="text-sm text-gray-600 mb-6">
          {message || "You already have an active application under review. You cannot submit another until it is processed."}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              onClose();
              router.push('/dashboard');
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg text-sm transition-colors shadow-md"
          >
            Go to My Dashboard
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}