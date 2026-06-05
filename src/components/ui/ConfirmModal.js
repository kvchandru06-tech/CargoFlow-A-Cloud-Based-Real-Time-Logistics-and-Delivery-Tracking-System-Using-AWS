import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Reusable confirmation dialog.
 * Props: isOpen, onClose, onConfirm, title, message, confirmLabel, danger
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  danger = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl animate-slide-up">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
            danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
          }`}>
            <ExclamationTriangleIcon className={`w-6 h-6 ${
              danger ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
            }`} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
            {message}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 justify-center ${danger ? 'btn-danger' : 'btn-primary'}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
