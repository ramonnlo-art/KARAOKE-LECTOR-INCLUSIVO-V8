import React from 'react';

interface ToastProps {
  message: string | null;
  type?: 'ok' | 'warn' | 'bad' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'ok' }) => {
  if (!message) return null;

  const bgStyles = {
    ok: 'bg-emerald-600 text-white',
    warn: 'bg-amber-500 text-slate-900',
    bad: 'bg-rose-600 text-white',
    info: 'bg-blue-600 text-white',
  }[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg font-semibold text-sm flex items-center gap-2 animate-bounce ${bgStyles}`}
    >
      <span>{message}</span>
    </div>
  );
};
