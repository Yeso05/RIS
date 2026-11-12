import React from 'react';

export default function DataStatus({ error }) {
  if (!error) return null;

  return (
    <div role="status" className="rounded-xl border border-amber-500/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
      Live data is unavailable. Showing the latest fallback data instead.
    </div>
  );
}
