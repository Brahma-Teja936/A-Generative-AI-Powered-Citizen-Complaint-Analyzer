import React from 'react';

export const StatusBadge = ({ status }) => {
  const styles = {
    SUBMITTED: 'bg-blue-950/60 text-blue-300 border-blue-800',
    UNDER_REVIEW: 'bg-amber-950/60 text-amber-300 border-amber-800',
    ASSIGNED: 'bg-indigo-950/60 text-indigo-300 border-indigo-800',
    ACCEPTED: 'bg-cyan-950/60 text-cyan-300 border-cyan-800',
    IN_PROGRESS: 'bg-purple-950/60 text-purple-300 border-purple-800',
    ON_HOLD: 'bg-orange-950/60 text-orange-300 border-orange-800',
    RESOLVED: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
    CLOSED: 'bg-slate-800 text-slate-300 border-slate-700',
    REJECTED: 'bg-rose-950/60 text-rose-300 border-rose-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
};

export const SeverityBadge = ({ severity }) => {
  const styles = {
    CRITICAL: 'bg-rose-950 text-rose-300 border-rose-600 font-bold animate-pulse',
    HIGH: 'bg-orange-950/70 text-orange-300 border-orange-700',
    MEDIUM: 'bg-amber-950/70 text-amber-300 border-amber-700',
    LOW: 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[severity] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
      {severity === 'CRITICAL' && <span className="mr-1">🚨</span>}
      {severity || 'MEDIUM'}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const styles = {
    CRITICAL: 'bg-red-950 text-red-300 border-red-700',
    'VERY HIGH': 'bg-rose-950 text-rose-300 border-rose-700',
    HIGH: 'bg-amber-950 text-amber-300 border-amber-700',
    MEDIUM: 'bg-blue-950 text-blue-300 border-blue-700',
    LOW: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[priority] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
      Priority: {priority || 'MEDIUM'}
    </span>
  );
};

export const UrgencyBadge = ({ urgency }) => {
  const styles = {
    IMMEDIATE: 'bg-red-950 text-red-300 border-red-600 font-bold',
    'WITHIN 24 HOURS': 'bg-orange-950 text-orange-300 border-orange-700',
    'WITHIN 3 DAYS': 'bg-amber-950 text-amber-300 border-amber-700',
    'WITHIN 7 DAYS': 'bg-blue-950 text-blue-300 border-blue-700',
    ROUTINE: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styles[urgency] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
      ⏱️ {urgency || 'ROUTINE'}
    </span>
  );
};
