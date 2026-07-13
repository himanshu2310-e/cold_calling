// ============================================
// Activity Logs Page
// ============================================
'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';
import activityService from '@/services/activity.service';

export default function AdminActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: activityService.getActivityLogs,
  });

  const activities = data?.data || [];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4">
        <div className="h-10 w-48 rounded-xl bg-zinc-800/30 animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-zinc-800/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Activity Logs</h1>
        <p className="text-xs text-zinc-500 mt-1">System-wide audit trail</p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ background: '#141418', borderColor: '#1E1E22' }}>
          <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No activity recorded</h3>
          <p className="text-xs text-zinc-500">Actions will appear here as your team uses the CRM</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((act: any, i: number) => (
            <div
              key={act._id || i}
              className="rounded-xl border p-4 flex items-start gap-3 hover:bg-zinc-800/20 transition-colors"
              style={{ background: '#141418', borderColor: '#1E1E22' }}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{act.action}</p>
                {act.details && <p className="text-[10px] text-zinc-500 mt-0.5">{act.details}</p>}
                <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-600">
                  <Clock className="w-2.5 h-2.5" />
                  <span className="font-mono">{act.createdAt ? format(new Date(act.createdAt), 'MMM d, h:mm a') : '—'}</span>
                  {act.user && (
                    <span className="text-zinc-500">by {act.user.firstName} {act.user.lastName}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
